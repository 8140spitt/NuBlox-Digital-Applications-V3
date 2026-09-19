import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let bodyService: typeof import('./governance-body');
let personService: typeof import('./foundation-person');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  bodyService = await import('./governance-body');
  personService = await import('./foundation-person');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F02 Governance Body runtime', () => {
  it('governs Board identity, membership, quorum and lifecycle without granting authority', async () => {
    const tenant = 'governance-body-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const secretary = await personService.createPerson(context, { givenName: 'Board', familyName: 'Secretary' });
    const member = await personService.createPerson(context, { givenName: 'Board', familyName: 'Member' });

    const bodyId = await bodyService.createGovernanceBody(context, {
      bodyRef: 'BOARD-MAIN',
      name: 'Main Board',
      bodyType: 'BOARD',
      mandate: 'Direct and oversee the enterprise within reserved authority.',
      termsOfReference: 'Board terms of reference.',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      membershipRules: 'Chair, secretary and appointed members; quorum two.',
      quorumRequired: 2,
      chairPartyId: context.actorPartyId,
      secretariatPartyId: secretary,
      members: [
        { partyId: context.actorPartyId, roleKey: 'CHAIR' },
        { partyId: secretary, roleKey: 'SECRETARY' },
        { partyId: member, roleKey: 'MEMBER' }
      ]
    });

    let body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    expect(body.status).toBe('PROPOSED');
    expect(await bodyService.listGovernanceBodyMemberships(context, bodyId)).toHaveLength(3);

    await bodyService.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'CONSTITUTE');
    body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    await bodyService.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'ACTIVATE');
    body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    expect(body.status).toBe('ACTIVE');

    const extra = await personService.createPerson(context, { givenName: 'Board', familyName: 'Observer' });
    await bodyService.addGovernanceBodyMember(context, bodyId, body.aggregateVersion, {
      partyId: extra,
      roleKey: 'OBSERVER'
    });
    body = (await bodyService.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    expect(body.aggregateVersion).toBe(4);

    const roleAssignments = await db.queryRows<any>(
      'SELECT id FROM tenant_role_assignments WHERE tenant_id = ? AND party_id = ?',
      [context.tenantId, extra]
    );
    const delegated = await db.queryRows<any>(
      'SELECT id FROM delegated_authorities WHERE tenant_id = ? AND delegate_party_id = ?',
      [context.tenantId, extra]
    );
    expect(roleAssignments).toHaveLength(0);
    expect(delegated).toHaveLength(0);

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-02-GOVERNANCE' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, bodyId]
    );
    expect(events.map((row) => row.eventType)).toEqual([
      'GOVERNANCE_BODY_PROPOSED',
      'GOVERNANCE_BODY_CONSTITUTED',
      'GOVERNANCE_BODY_ACTIVATED',
      'GOVERNANCE_BODY_MEMBER_ADDED'
    ]);
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4]);
  });
});
