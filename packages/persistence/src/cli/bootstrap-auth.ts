import { randomUUID } from 'node:crypto';
import {
  asId,
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  type AccessRoleAssignment
} from '@nublox/kernel';
import { MySqlAccessRepository } from '../access-repository.js';
import { MySqlAuthRepository } from '../auth-repository.js';
import { createDatabasePool } from '../database.js';
import { migrate } from '../migrations.js';
import { MySqlTenantRegistrationService } from '../tenant-registration-service.js';
import type { TenantSizeTier } from '../tenant-provisioning-service.js';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

await migrate();
const pool = createDatabasePool();

try {
  const email = required('NUBLOX_BOOTSTRAP_EMAIL');
  const password = required('NUBLOX_BOOTSTRAP_PASSWORD');

  let tenantIdValue = process.env.NUBLOX_BOOTSTRAP_TENANT_ID?.trim();
  let personIdValue = process.env.NUBLOX_BOOTSTRAP_PERSON_ID?.trim();
  const grantPlatformAdministrator =
    process.env.NUBLOX_BOOTSTRAP_GRANT_PLATFORM_ADMIN !== 'false';

  if (!tenantIdValue || !personIdValue) {
    const tenantName = required('NUBLOX_BOOTSTRAP_TENANT_NAME');
    const personName = required('NUBLOX_BOOTSTRAP_PERSON_NAME');
    const sizeTier = (process.env.NUBLOX_BOOTSTRAP_SIZE_TIER?.trim() || 'SMALL') as TenantSizeTier;
    const employeeCountValue = process.env.NUBLOX_BOOTSTRAP_EMPLOYEE_COUNT?.trim();
    const employeeCount = employeeCountValue ? Number(employeeCountValue) : undefined;
    const legalEntityCount = Number(
      process.env.NUBLOX_BOOTSTRAP_LEGAL_ENTITY_COUNT?.trim() || '1'
    );
    const operatingModelCodes = (
      process.env.NUBLOX_BOOTSTRAP_OPERATING_MODELS?.trim() || 'PROJECT_BASED'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const registration = await new MySqlTenantRegistrationService(pool).register({
      businessName: tenantName,
      ...(process.env.NUBLOX_BOOTSTRAP_TENANT_SLUG?.trim()
        ? { tenantSlug: process.env.NUBLOX_BOOTSTRAP_TENANT_SLUG.trim() }
        : {}),
      personName,
      email,
      password,
      acceptedTerms: true,
      businessProfile: {
        primaryClassificationValueId:
          process.env.NUBLOX_BOOTSTRAP_INDUSTRY_CLASSIFICATION_ID?.trim() ||
          'BCV-NAICS-2022-23',
        sizeTier,
        ...(employeeCount !== undefined ? { employeeCount } : {}),
        legalEntityCount,
        primaryCountryCode:
          process.env.NUBLOX_BOOTSTRAP_COUNTRY_CODE?.trim().toUpperCase() || 'GB',
        primaryLanguageCode:
          process.env.NUBLOX_BOOTSTRAP_LANGUAGE_CODE?.trim() || 'en-GB',
        operatingModelCodes
      },
      grantTenantAdministrator: grantPlatformAdministrator,
      emailVerified: true
    });

    tenantIdValue = registration.tenantId;
    personIdValue = registration.personId;
  }

  const auth = new MySqlAuthRepository(pool);
  const principal = await auth.bootstrapUser({
    email,
    password,
    tenantId: tenantIdValue,
    personId: personIdValue
  });

  if (grantPlatformAdministrator) {
    const access = new MySqlAccessRepository(pool);
    const tenantId = asId<'TenantId'>(principal.tenantId, 'Tenant');
    const existingAssignment = await access.findActiveRoleAssignment(
      tenantId,
      PLATFORM_ADMINISTRATOR_ROLE_ID,
      'PERSON',
      principal.personId,
      { scopeType: 'TENANT' }
    );

    if (!existingAssignment) {
      const assignment: AccessRoleAssignment = {
        id: asId<'AccessRoleAssignmentId'>(
          `ARA-BOOTSTRAP-${randomUUID()}`,
          'Access Role Assignment'
        ),
        tenantId,
        accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
        principalType: 'PERSON',
        principalId: principal.personId,
        scopeType: 'TENANT',
        effectiveFrom: new Date().toISOString(),
        status: 'ACTIVE'
      };

      await access.assignAccessRole(tenantId, assignment, {
        actorPersonId: principal.personId,
        correlationId: 'APPLICATION-BOOTSTRAP'
      });
    }
  }

  console.log('NuBlox application account ready.');
  console.log(`Tenant: ${principal.tenantName} (${principal.tenantId})`);
  console.log(`Tenant slug: ${principal.tenantSlug}`);
  console.log(`Tenant app: /${principal.tenantSlug}/app/`);
  console.log(`Person: ${principal.personName} (${principal.personId})`);
  console.log(`Login: ${principal.email}`);
  console.log(
    `Platform administrator: ${grantPlatformAdministrator ? 'GRANTED' : 'NOT GRANTED'}`
  );
} finally {
  await pool.end();
}
