import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalObjectIdentity,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type ObjectLifecycleState,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlControlReadRepository } from './control-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('control-spine read projection', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('returns only tenant-scoped lifecycle state and audit history', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-CONTROL-READ-${suffix}`, 'Tenant');
    const otherTenantId = asId<'TenantId'>(`TENANT-CONTROL-OTHER-${suffix}`, 'Tenant');
    const identity = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const reads = new MySqlControlReadRepository(pool);

    for (const [id, name] of [
      [tenantId, 'Control Read Tenant'],
      [otherTenantId, 'Other Control Tenant']
    ] as const) {
      const tenant: Tenant = { id, name, status: 'ACTIVE' };
      await identity.createTenant(tenant);
    }

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-CTRL-R-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Control Reader',
      status: 'ACTIVE'
    };
    await identity.createParty(tenantId, party);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-CTRL-R-${suffix}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'Control Reader',
      status: 'ACTIVE'
    };
    await identity.createPerson(tenantId, person);

    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-CTRL-R-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'TEST_OBJECT',
      stableKey: `TEST-${suffix}`,
      createdAt: '2026-09-21T10:00:00.000Z'
    };
    await identity.createCanonicalObject(tenantId, object, { actorPersonId: person.id });

    const lifecycle: LifecycleDefinition = {
      id: asId<'LifecycleDefinitionId'>(`LC-CTRL-R-${suffix}`, 'Lifecycle Definition'),
      tenantId,
      code: `TEST-${suffix}`,
      name: 'Test Lifecycle',
      objectType: 'TEST_OBJECT',
      status: 'ACTIVE'
    };
    await control.createLifecycleDefinition(tenantId, lifecycle, { actorPersonId: person.id });

    const state: LifecycleStateDefinition = {
      id: asId<'LifecycleStateDefinitionId'>(`LC-STATE-R-${suffix}`, 'Lifecycle State'),
      tenantId,
      lifecycleDefinitionId: lifecycle.id,
      code: 'ACTIVE',
      name: 'Active',
      category: 'IN_WORK',
      initial: true,
      terminal: false,
      status: 'ACTIVE'
    };
    await control.createLifecycleStateDefinition(tenantId, state, { actorPersonId: person.id });

    const current: ObjectLifecycleState = {
      id: asId<'ObjectLifecycleStateId'>(`OLS-CTRL-R-${suffix}`, 'Object Lifecycle State'),
      tenantId,
      canonicalObjectId: object.id,
      lifecycleDefinitionId: lifecycle.id,
      lifecycleStateId: state.id,
      sequence: 1,
      effectiveAt: '2026-09-21T10:01:00.000Z'
    };
    await control.initialiseObjectLifecycle(tenantId, current, { actorPersonId: person.id });

    const projection = await reads.getControlProjection(tenantId);

    expect(projection.totals.lifecycleDefinitions).toBe(1);
    expect(projection.totals.governedObjects).toBe(1);
    expect(projection.lifecycleDefinitions[0]?.id).toBe(lifecycle.id);
    expect(projection.objectStates[0]?.canonicalObjectId).toBe(object.id);
    expect(projection.objectStates[0]?.lifecycleStateName).toBe('Active');
    expect(projection.audit.length).toBeGreaterThan(0);
    expect(projection.audit.every((entry) => !entry.entityId.includes('OTHER'))).toBe(true);

    const otherProjection = await reads.getControlProjection(otherTenantId);
    expect(otherProjection.totals.lifecycleDefinitions).toBe(0);
    expect(otherProjection.totals.governedObjects).toBe(0);
  });
});
