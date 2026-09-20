import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createBusinessEvent,
  createDecision,
  createEvidenceRecord,
  createLifecycleDefinition,
  createLifecycleStateDefinition,
  createLifecycleTransitionDefinition,
  initialiseObjectLifecycle,
  transitionObjectLifecycle,
  type AuthorityGrant,
  type CanonicalObjectIdentity,
  type Decision,
  type LifecycleDefinition,
  type LifecycleStateDefinition,
  type LifecycleTransitionDefinition,
  type ObjectLifecycleState,
  type Person
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-CONTROL', 'Tenant');
const otherTenantId = asId<'TenantId'>('TENANT-OTHER', 'Tenant');

const subject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-DRAWING-1', 'Canonical Object'),
  tenantId,
  objectType: 'DELIVERABLE_ITEM',
  stableKey: 'A-1001',
  createdAt: '2026-09-20T00:00:00.000Z'
};

const decider: Person = {
  id: asId<'PersonId'>('PERSON-APPROVER', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-APPROVER', 'Party'),
  legalName: 'Approver',
  status: 'ACTIVE'
};

const lifecycle: LifecycleDefinition = createLifecycleDefinition({
  id: asId<'LifecycleDefinitionId'>('LC-DELIVERABLE', 'Lifecycle Definition'),
  tenantId,
  code: 'DELIVERABLE',
  name: 'Deliverable Lifecycle',
  objectType: 'DELIVERABLE_ITEM',
  status: 'ACTIVE'
});

const draft: LifecycleStateDefinition = createLifecycleStateDefinition(
  {
    id: asId<'LifecycleStateDefinitionId'>('LC-STATE-DRAFT', 'Lifecycle State'),
    tenantId,
    lifecycleDefinitionId: lifecycle.id,
    code: 'DRAFT',
    name: 'Draft',
    category: 'DRAFT',
    initial: true,
    terminal: false,
    status: 'ACTIVE'
  },
  lifecycle
);

const approved: LifecycleStateDefinition = createLifecycleStateDefinition(
  {
    id: asId<'LifecycleStateDefinitionId'>('LC-STATE-APPROVED', 'Lifecycle State'),
    tenantId,
    lifecycleDefinitionId: lifecycle.id,
    code: 'APPROVED',
    name: 'Approved',
    category: 'RELEASED',
    initial: false,
    terminal: false,
    status: 'ACTIVE'
  },
  lifecycle
);

const approveTransition: LifecycleTransitionDefinition = createLifecycleTransitionDefinition(
  {
    id: asId<'LifecycleTransitionDefinitionId'>('LC-TRANS-APPROVE', 'Lifecycle Transition'),
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
  },
  lifecycle,
  draft,
  approved
);

describe('kernel control spine invariants', () => {
  it('requires decision-controlled transitions to declare exact Decision constraints', () => {
    const invalidTransition = { ...approveTransition };
    delete invalidTransition.requiredDecisionOutcome;
    invalidTransition.id = asId<'LifecycleTransitionDefinitionId'>(
      'LC-TRANS-BAD',
      'Lifecycle Transition'
    );

    expect(() =>
      createLifecycleTransitionDefinition(
        invalidTransition,
        lifecycle,
        draft,
        approved
      )
    ).toThrow(KernelInvariantError);
  });

  it('requires an initial Lifecycle state and sequence 1', () => {
    const initial: ObjectLifecycleState = {
      id: asId<'ObjectLifecycleStateId'>('OLS-1', 'Object Lifecycle State'),
      tenantId,
      canonicalObjectId: subject.id,
      lifecycleDefinitionId: lifecycle.id,
      lifecycleStateId: draft.id,
      subjectVersion: 'A',
      sequence: 1,
      effectiveAt: '2026-09-20T10:00:00.000Z'
    };

    expect(initialiseObjectLifecycle(initial, subject, lifecycle, draft)).toEqual(initial);

    expect(() =>
      initialiseObjectLifecycle({ ...initial, lifecycleStateId: approved.id }, subject, lifecycle, approved)
    ).toThrow(KernelInvariantError);
  });

  it('separates immutable Decision evidence from Lifecycle transition and binds it to exact subject version', () => {
    const authorityGrant: AuthorityGrant = {
      id: asId<'AuthorityGrantId'>('AUTH-GRANT-APPROVE', 'Authority Grant'),
      tenantId,
      authorityDefinitionId: asId<'AuthorityDefinitionId'>(
        'AUTH-DEF-APPROVE',
        'Authority Definition'
      ),
      granteeType: 'PERSON',
      granteeId: decider.id,
      scopeType: 'PROJECT',
      scopeId: 'PROJECT-ALPHA',
      effectiveFrom: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE'
    };

    const decision: Decision = createDecision(
      {
        id: asId<'DecisionId'>('DECISION-1', 'Decision'),
        tenantId,
        decisionType: 'DELIVERABLE_APPROVAL',
        subjectObjectId: subject.id,
        subjectVersion: 'A',
        outcome: 'APPROVED',
        reason: 'Technical approval completed.',
        deciderPersonId: decider.id,
        authorityGrantId: authorityGrant.id,
        decidedAt: '2026-09-20T11:00:00.000Z'
      },
      subject,
      decider,
      authorityGrant
    );

    const current: ObjectLifecycleState = {
      id: asId<'ObjectLifecycleStateId'>('OLS-1', 'Object Lifecycle State'),
      tenantId,
      canonicalObjectId: subject.id,
      lifecycleDefinitionId: lifecycle.id,
      lifecycleStateId: draft.id,
      subjectVersion: 'A',
      sequence: 1,
      effectiveAt: '2026-09-20T10:00:00.000Z'
    };

    const next: ObjectLifecycleState = {
      ...current,
      lifecycleStateId: approved.id,
      sequence: 2,
      effectiveAt: '2026-09-20T11:00:01.000Z',
      transitionId: approveTransition.id,
      decisionId: decision.id
    };

    expect(
      transitionObjectLifecycle(next, current, approveTransition, draft, approved, decision)
    ).toEqual(next);

    expect(() =>
      transitionObjectLifecycle(next, current, approveTransition, draft, approved)
    ).toThrow(KernelInvariantError);

    expect(() =>
      transitionObjectLifecycle(
        next,
        current,
        approveTransition,
        draft,
        approved,
        { ...decision, subjectVersion: 'B' }
      )
    ).toThrow(KernelInvariantError);
  });

  it('keeps Business Events and Evidence tenant-bound to their subjects and actors', () => {
    expect(
      createBusinessEvent(
        {
          id: asId<'BusinessEventId'>('EVENT-1', 'Business Event'),
          tenantId,
          eventType: 'DELIVERABLE_APPROVED',
          aggregateType: 'DELIVERABLE_ITEM',
          aggregateId: subject.stableKey,
          subjectObjectId: subject.id,
          actorPersonId: decider.id,
          correlationId: 'CORR-1',
          occurredAt: '2026-09-20T11:00:02.000Z',
          payload: { revision: 'A' }
        },
        subject,
        decider
      ).eventType
    ).toBe('DELIVERABLE_APPROVED');

    expect(
      createEvidenceRecord(
        {
          id: asId<'EvidenceRecordId'>('EVIDENCE-1', 'Evidence'),
          tenantId,
          evidenceType: 'APPROVAL_RECORD',
          subjectObjectId: subject.id,
          subjectVersion: 'A',
          capturedByPersonId: decider.id,
          capturedAt: '2026-09-20T11:00:03.000Z',
          contentReference: 'urn:nublox:evidence:approval:1',
          integrityHash: 'sha256:abc'
        },
        subject,
        decider
      ).evidenceType
    ).toBe('APPROVAL_RECORD');

    expect(() =>
      createEvidenceRecord(
        {
          id: asId<'EvidenceRecordId'>('EVIDENCE-X', 'Evidence'),
          tenantId: otherTenantId,
          evidenceType: 'APPROVAL_RECORD',
          subjectObjectId: subject.id,
          capturedAt: '2026-09-20T11:00:03.000Z'
        },
        subject
      )
    ).toThrow(KernelInvariantError);
  });
});
