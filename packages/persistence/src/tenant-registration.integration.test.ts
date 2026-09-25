import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PLATFORM_ADMINISTRATOR_ROLE_ID } from '@nublox/kernel';
import { MySqlAuthRepository } from './auth-repository.js';
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
      acceptedTerms: true
    });

    expect(registration.tenantSlug).toBe(slug);

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

    const auth = new MySqlAuthRepository(pool);
    const principal = await auth.authenticate(email, password, registration.tenantId);
    expect(principal.tenantId).toBe(registration.tenantId);
    expect(principal.tenantSlug).toBe(slug);
    expect(principal.personId).toBe(registration.personId);
  });
});
