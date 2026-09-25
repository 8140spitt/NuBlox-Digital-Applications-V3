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
    const registration = await new MySqlTenantRegistrationService(pool).register({
      businessName: tenantName,
      ...(process.env.NUBLOX_BOOTSTRAP_TENANT_SLUG?.trim()
        ? { tenantSlug: process.env.NUBLOX_BOOTSTRAP_TENANT_SLUG.trim() }
        : {}),
      personName,
      email,
      password,
      acceptedTerms: true,
      grantTenantAdministrator: grantPlatformAdministrator
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
