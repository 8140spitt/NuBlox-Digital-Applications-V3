import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type AuthorityDefinition,
  type AuthorityGrant,
  type BusinessEvent,
  type CanonicalObjectIdentity,
  type Decision,
  type EvidenceRecord,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type LifecycleTransitionDefinition,
  type ObjectLifecycleState,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL enterprise kernel control spine', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('controls exact-version lifecycle transition through an immutable Decision and preserves history', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-CTRL-${suffix}`, 'Tenant');
    const identity = new MySqlKernelRepository(pool);
    const control = new MySqlKernelControlRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Control Spine Test',
      status: 'ACTIVE'
    };
    await identity.createTenant(tenant, { correlationId: `CTRL-${suffix}` });

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Approver',
      status: 'ACTIVE'
    };
    await identity.createParty(tenantId, party);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'Approver',
      status: 'ACTIVE'
    };
    await identity.createPerson(tenantId, person);

    const authorityDefinition: AuthorityDefinition = {
      id: asId<'AuthorityDefinitionId'>(`AUTH-D-${suffix}`, 'Authority Definition'),
      tenantId,
      code: `TECH-APPROVE-${suffix}`,
      name: 'Technical approval',
      authorityType: 'TECHNICAL',
      status: 'ACTIVE'
    };
    await identity.createAuthorityDefinition(tenantId, authorityDefinition, {
      actorPersonId: person.id
    });

    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>(`AUTH-G-${suffix}`, 'Authority Grant'),
      tenantId,
      authorityDefinitionId: authorityDefinition.id,
      granteeType: 'PERSON',
      granteeId: person.id,
      scopeType: 'PROJECT',
      scopeId: `PROJECT-${suffix}`,
      effectiveFrom: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await identity.createAuthorityGrant(tenantId, authorityGrant, {
      actorPersonId: person.id
    });

    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'DELIVERABLE_ITEM',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T10:00:00.000Z'
    };
    await identity.createCanonicalObject(tenantId, object, {
      actorPersonId: person.id
    });

    const lifecycle: LifecycleDefinition = {
      id: asId<'LifecycleDefinitionId'>(`LC-${suffix}`, 'Lifecycle Definition'),
      tenantId,
      code: `DELIVERABLE-${suffix}`,
      name: 'Deliverable Lifecycle',
      objectType: 'DELIVERABLE_ITEM',
      status: 'ACTIVE'
    };
    await control.createLifecycleDefinition(tenantId, lifecycle, {
      actorPersonId: person.id
    });

    const draft: LifecycleStateDefinition = {
      id: asId<'LifecycleStateDefinitionId'>(`LC-DRAFT-${suffix}`, 'Lifecycle State'),
      tenantId,
      lifecycleDefinitionId: lifecycle.id,
      code: 'DRAFT',
      name: 'Draft',
      category: 'DRAFT',
      initial: true,
      terminal: false,
      status: 'ACTIVE'
    };
    const approved: LifecycleStateDefinition = {
      id: asId<'LifecycleStateDefinitionId'>(`LC-APPROVED-${suffix}`, 'Lifecycle State'),
      tenantId,
      lifecycleDefinitionId: lifecycle.id,
      code: 'APPROVED',
      name: 'Approved',
      category: 'RELEASED',
      initial: false,
      terminal: false,
      status: 'ACTIVE'
    };
    await control.createLifecycleStateDefinition(tenantId, draft, {
      actorPersonId: person.id
    });
    await control.createLifecycleStateDefinition(tenantId, approved, {
      actorPersonId: person.id
    });

    const transition: LifecycleTransitionDefinition = {
      id: asId<'LifecycleTransitionDefinitionId'>(`LC-APPROVE-T-${suffix}`, 'Lifecycle Transition'),
      tenantId,
      lifecycleDefinitionId: lifecycle.id,
      code: 'APPROVE',
      name: 'Approve',
      fromStateId: draft.id,
      toStateId: approved.id,
      requiresDecision: true,
      requiredDecisionType: 'DELIVERABLE_APPROVAL',
      requiredDecisionOutcome: 'APPROVED',
      status: 'ACTIVE'
    };
    await control.createLifecycleTransitionDefinition(tenantId, transition, {
      actorPersonId: person.id
    });

    const initial: ObjectLifecycleState = {
      id: asId<'ObjectLifecycleStateId'>(`OLS-${suffix}`, 'Object Lifecycle State'),
      tenantId,
      canonicalObjectId: object.id,
      lifecycleDefinitionId: lifecycle.id,
      lifecycleStateId: draft.id,
      subjectVersion: 'A',
      sequence: 1,
      effectiveAt: '2026-09-20T10:05:00.000Z'
    };
    await control.initialiseObjectLifecycle(tenantId, initial, {
      actorPersonId: person.id
    });

    await expect(
      control.transitionObjectLifecycle(
        tenantId,
        object.id,
        transition.id,
        {
          effectiveAt: '2026-09-20T10:10:00.000Z',
          expectedSequence: 1
        },
        { actorPersonId: person.id }
      )
    ).rejects.toThrow('Lifecycle Transition requires a Decision.');

    const decision: Decision = {
      id: asId<'DecisionId'>(`DEC-${suffix}`, 'Decision'),
      tenantId,
      decisionType: 'DELIVERABLE_APPROVAL',
      subjectObjectId: object.id,
      subjectVersion: 'A',
      outcome: 'APPROVED',
      reason: 'Technical review completed and approved.',
      deciderPersonId: person.id,
      authorityGrantId: authorityGrant.id,
      decidedAt: '2026-09-20T10:11:00.000Z'
    };
    await control.createDecision(tenantId, decision, {
      actorPersonId: person.id,
      correlationId: `CTRL-${suffix}`
    });

    const current = await control.transitionObjectLifecycle(
      tenantId,
      object.id,
      transition.id,
      {
        effectiveAt: '2026-09-20T10:12:00.000Z',
        expectedSequence: 1,
        decisionId: decision.id
      },
      {
        actorPersonId: person.id,
        correlationId: `CTRL-${suffix}`
      }
    );

    expect(current.lifecycleStateId).toBe(approved.id);
    expect(current.sequence).toBe(2);
    expect(current.decisionId).toBe(decision.id);
    expect(current.subjectVersion).toBe('A');

    const history = await control.listObjectLifecycleHistory(tenantId, object.id);
    expect(history).toHaveLength(2);
    expect(history.map((state) => state.lifecycleStateId)).toEqual([
      draft.id,
      approved.id
    ]);
    expect(history[1]?.decisionId).toBe(decision.id);

    const event: BusinessEvent = {
      id: asId<'BusinessEventId'>(`EVENT-${suffix}`, 'Business Event'),
      tenantId,
      eventType: 'DELIVERABLE_APPROVED',
      aggregateType: 'DELIVERABLE_ITEM',
      aggregateId: object.stableKey,
      subjectObjectId: object.id,
      actorPersonId: person.id,
      correlationId: `CTRL-${suffix}`,
      occurredAt: '2026-09-20T10:12:01.000Z',
      payload: { revision: 'A', decisionId: decision.id }
    };
    await control.recordBusinessEvent(tenantId, event, {
      actorPersonId: person.id,
      correlationId: `CTRL-${suffix}`
    });

    const evidence: EvidenceRecord = {
      id: asId<'EvidenceRecordId'>(`EVIDENCE-${suffix}`, 'Evidence'),
      tenantId,
      evidenceType: 'APPROVAL_RECORD',
      subjectObjectId: object.id,
      subjectVersion: 'A',
      capturedByPersonId: person.id,
      capturedAt: '2026-09-20T10:12:02.000Z',
      contentReference: `urn:nublox:decision:${decision.id}`,
      integrityHash: 'sha256:test',
      metadata: { decisionId: decision.id }
    };
    await control.recordEvidence(tenantId, evidence, {
      actorPersonId: person.id
    });

    const [counts] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM decisions WHERE tenant_id = ?) AS decisions,
         (SELECT COUNT(*) FROM business_events WHERE tenant_id = ?) AS events,
         (SELECT COUNT(*) FROM evidence_records WHERE tenant_id = ?) AS evidence,
         (SELECT COUNT(*) FROM object_lifecycle_history WHERE tenant_id = ?) AS history`,
      [tenantId, tenantId, tenantId, tenantId]
    );

    const row = (counts as Array<{
      decisions: number;
      events: number;
      evidence: number;
      history: number;
    }>)[0];

    expect(Number(row?.decisions)).toBe(1);
    expect(Number(row?.events)).toBe(1);
    expect(Number(row?.evidence)).toBe(1);
    expect(Number(row?.history)).toBe(2);
  });
});
