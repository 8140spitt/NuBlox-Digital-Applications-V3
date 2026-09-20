import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  addChangeAffectedObject,
  applyChangeDecision,
  asId,
  beginChangeVerification,
  closeChange,
  completeChangeImplementationAction,
  createChange,
  createChangeDiscrepancy,
  createChangeImpactAssessment,
  createChangeImplementationAction,
  createChangeVerification,
  createDecision,
  resolveChangeDiscrepancy,
  startChangeAssessment,
  startChangeImplementation,
  startChangeImplementationAction,
  submitChangeForDecision,
  type Baseline,
  type CanonicalObjectIdentity,
  type Change,
  type ChangeAffectedObject,
  type ChangeImpactAssessment,
  type ChangeImplementationAction,
  type ChangeVerification,
  type Party,
  type Person
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-CHANGE', 'Tenant');

const personParty: Party = {
  id: asId<'PartyId'>('PARTY-CHANGE', 'Party'),
  tenantId,
  kind: 'PERSON',
  displayName: 'Change Manager',
  status: 'ACTIVE'
};

const person: Person = {
  id: asId<'PersonId'>('PERSON-CHANGE', 'Person'),
  tenantId,
  partyId: personParty.id,
  legalName: 'Change Manager',
  status: 'ACTIVE'
};

const changeObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-CHANGE-1', 'Canonical Object'),
  tenantId,
  objectType: 'CHANGE',
  stableKey: 'CHG-001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const targetObject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-TARGET-1', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'A-1001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

const draft: Change = createChange(
  {
    id: asId<'ChangeId'>('CHANGE-1', 'Change'),
    tenantId,
    canonicalObjectId: changeObject.id,
    code: 'CHG-001',
    title: 'Revise ground floor layout',
    description: 'Coordinate and implement the approved layout change.',
    changeType: 'DESIGN_CHANGE',
    status: 'DRAFT',
    raisedByPersonId: person.id,
    raisedAt: '2026-09-20T10:00:00.000Z'
  },
  changeObject,
  person
);

describe('kernel governed change invariants', () => {
  it('captures affected exact object versions before Change decision', () => {
    const affected = addChangeAffectedObject(
      {
        id: asId<'ChangeAffectedObjectId'>('AFFECT-1', 'Change Affected Object'),
        tenantId,
        changeId: draft.id,
        subjectObjectId: targetObject.id,
        subjectVersion: 'A',
        disposition: 'MODIFY',
        rationale: 'Ground floor drawing must be revised.'
      },
      draft,
      targetObject
    );

    expect(affected.subjectVersion).toBe('A');
    expect(affected.disposition).toBe('MODIFY');
  });

  it('requires assessment before an authorised Change Decision', () => {
    const assessing = startChangeAssessment(draft);
    const assessment: ChangeImpactAssessment = createChangeImpactAssessment(
      {
        id: asId<'ChangeImpactAssessmentId'>('IMPACT-1', 'Change Impact Assessment'),
        tenantId,
        changeId: assessing.id,
        domain: 'COST',
        assessorPersonId: person.id,
        assessedAt: '2026-09-20T10:15:00.000Z',
        impactLevel: 'MEDIUM',
        summary: 'Minor cost increase and drawing rework.',
        costImpact: 1500,
        scheduleImpactDays: 1
      },
      assessing,
      person
    );

    expect(assessment.impactLevel).toBe('MEDIUM');

    const awaiting = submitChangeForDecision(assessing);
    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-CHANGE-1', 'Decision'),
        tenantId,
        decisionType: 'CHANGE_APPROVAL',
        subjectObjectId: changeObject.id,
        outcome: 'APPROVED',
        reason: 'Change is approved for implementation.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T10:30:00.000Z'
      },
      changeObject,
      person
    );

    const approved = applyChangeDecision(awaiting, decision);
    expect(approved.status).toBe('APPROVED');
    expect(approved.decisionId).toBe(decision.id);

    expect(() =>
      addChangeAffectedObject(
        {
          id: asId<'ChangeAffectedObjectId'>('AFFECT-LATE', 'Change Affected Object'),
          tenantId,
          changeId: approved.id,
          subjectObjectId: targetObject.id,
          disposition: 'REVIEW',
          rationale: 'Late addition.'
        },
        approved,
        targetObject
      )
    ).toThrow(KernelInvariantError);
  });

  it('implements approved Change through explicit actions and verification', () => {
    const assessing = startChangeAssessment(draft);
    const awaiting = submitChangeForDecision(assessing);
    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-CHANGE-2', 'Decision'),
        tenantId,
        decisionType: 'CHANGE_APPROVAL',
        subjectObjectId: changeObject.id,
        outcome: 'APPROVED',
        reason: 'Implement.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T10:30:00.000Z'
      },
      changeObject,
      person
    );
    const approved = applyChangeDecision(awaiting, decision);
    const implementing = startChangeImplementation(approved);

    const action: ChangeImplementationAction = createChangeImplementationAction(
      {
        id: asId<'ChangeImplementationActionId'>('ACTION-1', 'Change Implementation Action'),
        tenantId,
        changeId: implementing.id,
        actionType: 'REVISE_INFORMATION',
        description: 'Revise drawing A-1001.',
        targetObjectId: targetObject.id,
        targetVersion: 'A',
        status: 'PLANNED'
      },
      implementing,
      targetObject
    );

    const started = startChangeImplementationAction(action);
    const completed = completeChangeImplementationAction(
      started,
      '2026-09-20T12:00:00.000Z'
    );
    expect(completed.status).toBe('COMPLETED');

    const verifying = beginChangeVerification(implementing);
    const verification: ChangeVerification = createChangeVerification(
      {
        id: asId<'ChangeVerificationId'>('VERIFY-1', 'Change Verification'),
        tenantId,
        changeId: verifying.id,
        verifierPersonId: person.id,
        verifiedAt: '2026-09-20T12:30:00.000Z',
        outcome: 'PASS',
        notes: 'Approved change is implemented and reconciled.'
      },
      verifying,
      person
    );

    const baseline: Baseline = {
      id: asId<'BaselineId'>('BASELINE-CHANGE-1', 'Baseline'),
      tenantId,
      contextObjectId: targetObject.id,
      code: 'BL-CHG-001',
      name: 'Post-change baseline',
      status: 'ESTABLISHED',
      establishedAt: '2026-09-20T12:31:00.000Z',
      establishmentDecisionId: decision.id
    };

    const closed = closeChange(
      verifying,
      verification,
      '2026-09-20T12:35:00.000Z',
      baseline
    );
    expect(closed.status).toBe('CLOSED');
    expect(closed.resultingBaselineId).toBe(baseline.id);
  });

  it('requires discrepancies to be explicitly resolved or accepted', () => {
    const assessing = startChangeAssessment(draft);
    const awaiting = submitChangeForDecision(assessing);
    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-CHANGE-3', 'Decision'),
        tenantId,
        decisionType: 'CHANGE_APPROVAL',
        subjectObjectId: changeObject.id,
        outcome: 'APPROVED',
        reason: 'Implement.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T10:30:00.000Z'
      },
      changeObject,
      person
    );
    const implementing = startChangeImplementation(
      applyChangeDecision(awaiting, decision)
    );

    const affected: ChangeAffectedObject = addChangeAffectedObject(
      {
        id: asId<'ChangeAffectedObjectId'>('AFFECT-DISC', 'Change Affected Object'),
        tenantId,
        changeId: assessing.id,
        subjectObjectId: targetObject.id,
        subjectVersion: 'A',
        disposition: 'MODIFY',
        rationale: 'Affected drawing.'
      },
      assessing,
      targetObject
    );

    const discrepancy = createChangeDiscrepancy(
      {
        id: asId<'ChangeDiscrepancyId'>('DISC-1', 'Change Discrepancy'),
        tenantId,
        changeId: implementing.id,
        affectedObjectId: affected.id,
        description: 'Installed condition differs from the approved change.',
        status: 'OPEN'
      },
      implementing,
      affected
    );
    expect(discrepancy.status).toBe('OPEN');

    const resolved = resolveChangeDiscrepancy(
      discrepancy,
      'RESOLVED',
      '2026-09-20T13:00:00.000Z',
      'Installed condition corrected and rechecked.'
    );
    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolution).toContain('corrected');
  });

  it('rejects closure after failed verification', () => {
    const assessing = startChangeAssessment(draft);
    const awaiting = submitChangeForDecision(assessing);
    const decision = createDecision(
      {
        id: asId<'DecisionId'>('DEC-CHANGE-4', 'Decision'),
        tenantId,
        decisionType: 'CHANGE_APPROVAL',
        subjectObjectId: changeObject.id,
        outcome: 'APPROVED',
        reason: 'Implement.',
        deciderPersonId: person.id,
        decidedAt: '2026-09-20T10:30:00.000Z'
      },
      changeObject,
      person
    );
    const verifying = beginChangeVerification(
      startChangeImplementation(applyChangeDecision(awaiting, decision))
    );
    const failed = createChangeVerification(
      {
        id: asId<'ChangeVerificationId'>('VERIFY-FAIL', 'Change Verification'),
        tenantId,
        changeId: verifying.id,
        verifierPersonId: person.id,
        verifiedAt: '2026-09-20T14:00:00.000Z',
        outcome: 'FAIL',
        notes: 'Implementation does not match the approved change.'
      },
      verifying,
      person
    );

    expect(() =>
      closeChange(verifying, failed, '2026-09-20T14:05:00.000Z')
    ).toThrow(KernelInvariantError);
  });
});
