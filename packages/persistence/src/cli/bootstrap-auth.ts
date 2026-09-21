import { randomUUID } from 'node:crypto';
import { asId, type Party, type Person, type Tenant } from '@nublox/kernel';
import { MySqlAuthRepository } from '../auth-repository.js';
import { createDatabasePool } from '../database.js';
import { migrate } from '../migrations.js';
import { MySqlKernelRepository } from '../repository.js';

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

  if (!tenantIdValue || !personIdValue) {
    const tenantName = required('NUBLOX_BOOTSTRAP_TENANT_NAME');
    const personName = required('NUBLOX_BOOTSTRAP_PERSON_NAME');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 16);

    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const partyId = asId<'PartyId'>(`PARTY-${suffix}`, 'Party');
    const personId = asId<'PersonId'>(`PERSON-${suffix}`, 'Person');

    const kernel = new MySqlKernelRepository(pool);
    const tenant: Tenant = { id: tenantId, name: tenantName, status: 'ACTIVE' };
    const party: Party = {
      id: partyId,
      tenantId,
      kind: 'PERSON',
      displayName: personName,
      status: 'ACTIVE'
    };
    const person: Person = {
      id: personId,
      tenantId,
      partyId,
      legalName: personName,
      preferredName: personName,
      status: 'ACTIVE'
    };

    await kernel.createTenant(tenant);
    await kernel.createParty(tenantId, party);
    await kernel.createPerson(tenantId, person);

    tenantIdValue = tenantId;
    personIdValue = personId;
  }

  const auth = new MySqlAuthRepository(pool);
  const principal = await auth.bootstrapUser({
    email,
    password,
    tenantId: tenantIdValue,
    personId: personIdValue
  });

  console.log('NuBlox application account ready.');
  console.log(`Tenant: ${principal.tenantName} (${principal.tenantId})`);
  console.log(`Person: ${principal.personName} (${principal.personId})`);
  console.log(`Login: ${principal.email}`);
} finally {
  await pool.end();
}
