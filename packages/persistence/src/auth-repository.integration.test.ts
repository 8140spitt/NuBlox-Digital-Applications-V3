import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { asId, type Party, type Person, type Tenant } from '@nublox/kernel';
import { MySqlAuthRepository, InvalidCredentialsError } from './auth-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('application authentication persistence', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('maps a login identity to a tenant Person and stores only hashed session tokens', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-AUTH-${suffix}`, 'Tenant');
    const tenant: Tenant = { id: tenantId, name: 'Authentication Test Tenant', status: 'ACTIVE' };
    const kernel = new MySqlKernelRepository(pool);
    await kernel.createTenant(tenant);

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-AUTH-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Authentication Test User',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, party);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-AUTH-${suffix}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'Authentication Test User',
      preferredName: 'Auth User',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const auth = new MySqlAuthRepository(pool);
    const email = `auth-${suffix}@example.test`;
    await auth.bootstrapUser({
      email,
      password: 'correct-horse-battery-staple',
      tenantId,
      personId: person.id
    });

    const principal = await auth.authenticate(email, 'correct-horse-battery-staple');
    expect(principal.tenantId).toBe(tenantId);
    expect(principal.personId).toBe(person.id);
    expect(principal.personName).toBe('Auth User');

    await expect(auth.authenticate(email, 'wrong-password-value')).rejects.toBeInstanceOf(
      InvalidCredentialsError
    );

    const created = await auth.createSession(principal, 600);
    expect(created.token.length).toBeGreaterThan(30);

    const [rawTokenRows] = await pool.query(
      'SELECT token_hash FROM application_sessions WHERE user_id = ?',
      [principal.userId]
    );
    const storedHash = (rawTokenRows as Array<{ token_hash: string }>)[0]?.token_hash;
    expect(storedHash).toBeTruthy();
    expect(storedHash).not.toBe(created.token);

    const resolved = await auth.resolveSession(created.token);
    expect(resolved?.tenantId).toBe(tenantId);
    expect(resolved?.personId).toBe(person.id);

    await auth.revokeSession(created.token);
    expect(await auth.resolveSession(created.token)).toBeNull();
  });
});
