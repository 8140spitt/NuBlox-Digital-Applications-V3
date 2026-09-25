import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PLATFORM_ADMINISTRATOR_ROLE_ID } from '@nublox/kernel';
import {
  EmailVerificationRequiredError,
  InvalidCredentialsError,
  MySqlAuthRepository
} from './auth-repository.js';
import { MySqlIdentityChallengeService } from './identity-challenge-service.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlTenantRegistrationService } from './tenant-registration-service.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('tenant registration', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('creates Tenant and Employee Party Types, admin access and no fabricated Position', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const slug = `registration-${suffix}`;
    const email = `registration-${suffix}@example.test`;
    const password = 'correct-horse-battery-staple';

    const service = new MySqlTenantRegistrationService(pool);
    const registration = await service.register({
      businessName: 'Registration Test Business',
      tenantSlug: slug,
      personName: 'Registration Owner',
      email,
      password,
      acceptedTerms: true,
      businessProfile: {
        primaryClassificationValueId: 'BCV-NAICS-2022-23',
        sizeTier: 'MEDIUM',
        employeeCount: 100,
        legalEntityCount: 1,
        primaryCountryCode: 'GB',
        primaryLanguageCode: 'en-GB',
        operatingModelCodes: ['PROJECT_BASED']
      }
    });

    expect(registration.tenantSlug).toBe(slug);
    expect(registration.verificationRequired).toBe(true);
    expect(registration.industrySolutionIds).toContain('CBE');
    expect(registration.provisioningRunId).toMatch(/^TPR-/);

    const [tenantPartyRows] = await pool.query<Array<{
      party_id: string;
      organisation_id: string;
      party_type: string;
    }>>(
      `SELECT b.party_id, b.organisation_id, pta.party_type
         FROM tenant_party_bindings b
         JOIN party_type_assignments pta
           ON pta.tenant_id = b.tenant_id
          AND pta.party_id = b.party_id
          AND pta.status = 'ACTIVE'
        WHERE b.tenant_id = ?`,
      [registration.tenantId]
    );
    expect(tenantPartyRows).toEqual([
      expect.objectContaining({
        party_id: registration.tenantPartyId,
        organisation_id: registration.organisationId,
        party_type: 'TENANT'
      })
    ]);

    const [employeeTypeRows] = await pool.query<Array<{ party_type: string }>>(
      `SELECT party_type
         FROM party_type_assignments
        WHERE tenant_id = ?
          AND party_id = ?
          AND status = 'ACTIVE'`,
      [registration.tenantId, registration.employeePartyId]
    );
    expect(employeeTypeRows.map((row) => row.party_type)).toEqual(['EMPLOYEE']);

    const [adminRows] = await pool.query<Array<{ access_role_id: string; scope_type: string }>>(
      `SELECT access_role_id, scope_type
         FROM access_role_assignments
        WHERE tenant_id = ?
          AND principal_type = 'PERSON'
          AND principal_id = ?
          AND status = 'ACTIVE'`,
      [registration.tenantId, registration.personId]
    );
    expect(adminRows).toContainEqual({
      access_role_id: PLATFORM_ADMINISTRATOR_ROLE_ID,
      scope_type: 'TENANT'
    });

    const [positionRows] = await pool.query<Array<{ count: number }>>(
      `SELECT COUNT(*) AS count
         FROM position_occupancies
        WHERE tenant_id = ?
          AND person_id = ?`,
      [registration.tenantId, registration.personId]
    );
    expect(Number(positionRows[0]?.count ?? 0)).toBe(0);

    const [profileRows] = await pool.query<Array<{
      primary_classification_value_id: string;
      size_tier: string;
      employee_count: number;
      legal_entity_count: number;
      primary_country_code: string;
      primary_language_code: string;
      configuration_state: string;
    }>>(
      `SELECT primary_classification_value_id, size_tier, employee_count,
              legal_entity_count, primary_country_code, primary_language_code,
              configuration_state
         FROM tenant_business_profiles
        WHERE tenant_id = ?`,
      [registration.tenantId]
    );
    expect(profileRows[0]).toEqual(
      expect.objectContaining({
        primary_classification_value_id: 'BCV-NAICS-2022-23',
        size_tier: 'MEDIUM',
        employee_count: 100,
        legal_entity_count: 1,
        primary_country_code: 'GB',
        primary_language_code: 'en-GB',
        configuration_state: 'ACTIVE'
      })
    );

    const [templateRows] = await pool.query<Array<{
      code: string;
      version: number;
      status: string;
    }>>(
      `SELECT t.code, a.template_version AS version, a.status
         FROM tenant_configuration_template_applications a
         JOIN tenant_configuration_templates t ON t.id = a.template_id
        WHERE a.tenant_id = ?
        ORDER BY t.priority, t.code`,
      [registration.tenantId]
    );
    expect(templateRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'NUBLOX_CORE', version: 1, status: 'APPLIED' }),
        expect.objectContaining({ code: 'CBE_BASE', version: 1, status: 'APPLIED' })
      ])
    );

    const [industryRows] = await pool.query<Array<{
      industry_solution_id: string;
      status: string;
    }>>(
      `SELECT industry_solution_id, status
         FROM tenant_industry_solution_assignments
        WHERE tenant_id = ?`,
      [registration.tenantId]
    );
    expect(industryRows).toContainEqual({
      industry_solution_id: 'CBE',
      status: 'ACTIVE'
    });


    const auth = new MySqlAuthRepository(pool);
    await expect(
      auth.authenticate(email, password, registration.tenantId)
    ).rejects.toBeInstanceOf(EmailVerificationRequiredError);

    const [verificationMessages] = await pool.query<Array<{ action_path: string; status: string }>>(
      `SELECT action_path, status
         FROM application_identity_message_outbox
        WHERE tenant_id = ?
          AND user_id = ?
          AND message_type = 'EMAIL_VERIFICATION'
        ORDER BY queued_at DESC
        LIMIT 1`,
      [registration.tenantId, registration.userId]
    );
    expect(verificationMessages[0]?.status).toBe('QUEUED');
    const verificationToken = new URL(
      verificationMessages[0]?.action_path ?? '',
      'https://nublox.test'
    ).searchParams.get('token');
    expect(verificationToken).toBeTruthy();

    const challenges = new MySqlIdentityChallengeService(pool);
    const verified = await challenges.verifyEmail(verificationToken ?? '', slug);
    expect(verified.tenantId).toBe(registration.tenantId);
    expect(verified.alreadyVerified).toBe(false);

    const principal = await auth.authenticate(email, password, registration.tenantId);
    expect(principal.tenantId).toBe(registration.tenantId);
    expect(principal.tenantSlug).toBe(slug);
    expect(principal.personId).toBe(registration.personId);

    const session = await auth.createSession(principal, 600);
    expect(await auth.resolveSession(session.token)).not.toBeNull();

    await challenges.requestPasswordReset(email, slug);
    const [resetMessages] = await pool.query<Array<{ action_path: string; status: string }>>(
      `SELECT action_path, status
         FROM application_identity_message_outbox
        WHERE tenant_id = ?
          AND user_id = ?
          AND message_type = 'PASSWORD_RESET'
        ORDER BY queued_at DESC
        LIMIT 1`,
      [registration.tenantId, registration.userId]
    );
    expect(resetMessages[0]?.status).toBe('QUEUED');
    const resetToken = new URL(
      resetMessages[0]?.action_path ?? '',
      'https://nublox.test'
    ).searchParams.get('token');
    expect(resetToken).toBeTruthy();

    const newPassword = 'new-correct-horse-battery-staple';
    await challenges.resetPassword(resetToken ?? '', newPassword, slug);

    expect(await auth.resolveSession(session.token)).toBeNull();
    await expect(
      auth.authenticate(email, password, registration.tenantId)
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    const resetPrincipal = await auth.authenticate(email, newPassword, registration.tenantId);
    expect(resetPrincipal.personId).toBe(registration.personId);
  });
});
