import { invariant } from './errors.js';
import type { Decision } from './control.js';
import type {
  Change,
  ChangeAffectedObject,
  ChangeDiscrepancy,
  ChangeImpactAssessment,
  ChangeImplementationAction,
  ChangeVerification
} from './change.js';
import type { Baseline } from './information.js';
import type { CanonicalObjectIdentity, Person } from './model.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

export function createChange(
  input: Change,
  object: CanonicalObjectIdentity,
  raiser: Person
): Change {
  assertSameTenant(input.tenantId, object.tenantId, 'Change and canonical object');
  assertSameTenant(input.tenantId, raiser.tenantId, 'Change and raiser');
  invariant(input.canonicalObjectId === object.id, 'Change must reference the supplied canonical object.');
  invariant(object.objectType === 'CHANGE', 'Change canonical object must use objectType CHANGE.');
  invariant(input.raisedByPersonId === raiser.id, 'Change must reference the supplied raiser.');
  invariant(input.status === 'DRAFT', 'New Change must start DRAFT.');
  assertNonEmpty(input.code, 'Change code');
  assertNonEmpty(input.title, 'Change title');
  assertNonEmpty(input.description, 'Change description');
  assertNonEmpty(input.changeType, 'Change type');
  assertDate(input.raisedAt, 'Change raisedAt');
  invariant(
    !input.decisionId && !input.decidedAt && !input.resultingBaselineId && !input.closedAt,
    'New Change must not contain decision, baseline or closure state.'
  );
  return Object.freeze({ ...input });
}

export function addChangeAffectedObject(
  input: ChangeAffectedObject,
  change: Change,
  subject: CanonicalObjectIdentity
): ChangeAffectedObject {
  assertSameTenant(input.tenantId, change.tenantId, 'Affected object and Change');
  assertSameTenant(input.tenantId, subject.tenantId, 'Affected object and subject');
  invariant(input.changeId === change.id, 'Affected object must reference the supplied Change.');
  invariant(input.subjectObjectId === subject.id, 'Affected object must reference the supplied subject.');
  invariant(
    change.status === 'DRAFT' || change.status === 'UNDER_ASSESSMENT',
    'Affected objects can only be added before Change decision.'
  );
  if (input.subjectVersion !== undefined) {
    assertNonEmpty(input.subjectVersion, 'Affected object subjectVersion');
  }
  assertNonEmpty(input.rationale, 'Affected object rationale');
  return Object.freeze({ ...input });
}

export function startChangeAssessment(current: Change): Change {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Change can enter assessment.');
  return Object.freeze({ ...current, status: 'UNDER_ASSESSMENT' });
}

export function createChangeImpactAssessment(
  input: ChangeImpactAssessment,
  change: Change,
  assessor: Person
): ChangeImpactAssessment {
  assertSameTenant(input.tenantId, change.tenantId, 'Impact Assessment and Change');
  assertSameTenant(input.tenantId, assessor.tenantId, 'Impact Assessment and assessor');
  invariant(input.changeId === change.id, 'Impact Assessment must reference the supplied Change.');
  invariant(input.assessorPersonId === assessor.id, 'Impact Assessment must reference the supplied assessor.');
  invariant(change.status === 'UNDER_ASSESSMENT', 'Impact Assessment requires Change UNDER_ASSESSMENT.');
  assertNonEmpty(input.domain, 'Impact Assessment domain');
  assertNonEmpty(input.summary, 'Impact Assessment summary');
  assertDate(input.assessedAt, 'Impact Assessment assessedAt');

  if (input.costImpact !== undefined) {
    invariant(Number.isFinite(input.costImpact), 'Impact Assessment costImpact must be finite.');
  }
  if (input.scheduleImpactDays !== undefined) {
    invariant(
      Number.isFinite(input.scheduleImpactDays),
      'Impact Assessment scheduleImpactDays must be finite.'
    );
  }

  return Object.freeze({ ...input });
}

export function submitChangeForDecision(current: Change): Change {
  invariant(
    current.status === 'UNDER_ASSESSMENT',
    'Only a Change UNDER_ASSESSMENT can await decision.'
  );
  return Object.freeze({ ...current, status: 'AWAITING_DECISION' });
}

export function applyChangeDecision(
  current: Change,
  decision: Decision
): Change {
  assertSameTenant(current.tenantId, decision.tenantId, 'Change and Decision');
  invariant(current.status === 'AWAITING_DECISION', 'Change must be AWAITING_DECISION.');
  invariant(
    decision.subjectObjectId === current.canonicalObjectId,
    'Change Decision must reference the Change canonical object.'
  );
  invariant(
    decision.outcome === 'APPROVED' || decision.outcome === 'REJECTED',
    'Change Decision outcome must be APPROVED or REJECTED.'
  );

  return Object.freeze({
    ...current,
    status: decision.outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED',
    decisionId: decision.id,
    decidedAt: decision.decidedAt
  });
}

export function createChangeImplementationAction(
  input: ChangeImplementationAction,
  change: Change,
  target?: CanonicalObjectIdentity
): ChangeImplementationAction {
  assertSameTenant(input.tenantId, change.tenantId, 'Implementation Action and Change');
  invariant(input.changeId === change.id, 'Implementation Action must reference the supplied Change.');
  invariant(
    change.status === 'APPROVED' || change.status === 'IMPLEMENTING',
    'Implementation Actions require an approved or implementing Change.'
  );
  invariant(input.status === 'PLANNED', 'New Implementation Action must start PLANNED.');
  assertNonEmpty(input.actionType, 'Implementation Action type');
  assertNonEmpty(input.description, 'Implementation Action description');
  invariant(!input.completedAt, 'New Implementation Action must not be completed.');

  if (target) {
    assertSameTenant(input.tenantId, target.tenantId, 'Implementation Action and target');
    invariant(input.targetObjectId === target.id, 'Implementation Action must reference the supplied target.');
  } else {
    invariant(!input.targetObjectId, 'Implementation Action cannot reference an unsupplied target.');
  }

  if (input.targetVersion !== undefined) {
    assertNonEmpty(input.targetVersion, 'Implementation Action targetVersion');
  }

  return Object.freeze({ ...input });
}

export function startChangeImplementation(current: Change): Change {
  invariant(current.status === 'APPROVED', 'Only an APPROVED Change can start implementation.');
  return Object.freeze({ ...current, status: 'IMPLEMENTING' });
}

export function startChangeImplementationAction(
  current: ChangeImplementationAction
): ChangeImplementationAction {
  invariant(current.status === 'PLANNED', 'Only a PLANNED Implementation Action can start.');
  return Object.freeze({ ...current, status: 'IN_PROGRESS' });
}

export function completeChangeImplementationAction(
  current: ChangeImplementationAction,
  completedAt: string
): ChangeImplementationAction {
  invariant(
    current.status === 'IN_PROGRESS' || current.status === 'PLANNED',
    'Only PLANNED or IN_PROGRESS Implementation Action can complete.'
  );
  assertDate(completedAt, 'Implementation Action completedAt');
  return Object.freeze({ ...current, status: 'COMPLETED', completedAt });
}

export function beginChangeVerification(current: Change): Change {
  invariant(current.status === 'IMPLEMENTING', 'Only an IMPLEMENTING Change can enter verification.');
  return Object.freeze({ ...current, status: 'VERIFYING' });
}

export function createChangeVerification(
  input: ChangeVerification,
  change: Change,
  verifier: Person
): ChangeVerification {
  assertSameTenant(input.tenantId, change.tenantId, 'Verification and Change');
  assertSameTenant(input.tenantId, verifier.tenantId, 'Verification and verifier');
  invariant(input.changeId === change.id, 'Verification must reference the supplied Change.');
  invariant(input.verifierPersonId === verifier.id, 'Verification must reference the supplied verifier.');
  invariant(change.status === 'VERIFYING', 'Verification requires a Change in VERIFYING state.');
  assertDate(input.verifiedAt, 'Verification verifiedAt');
  assertNonEmpty(input.notes, 'Verification notes');
  return Object.freeze({ ...input });
}

export function createChangeDiscrepancy(
  input: ChangeDiscrepancy,
  change: Change,
  affectedObject?: ChangeAffectedObject
): ChangeDiscrepancy {
  assertSameTenant(input.tenantId, change.tenantId, 'Discrepancy and Change');
  invariant(input.changeId === change.id, 'Discrepancy must reference the supplied Change.');
  invariant(
    change.status === 'IMPLEMENTING' || change.status === 'VERIFYING',
    'Discrepancy requires an implementing or verifying Change.'
  );
  invariant(input.status === 'OPEN', 'New Discrepancy must start OPEN.');
  assertNonEmpty(input.description, 'Discrepancy description');
  invariant(!input.resolvedAt && !input.resolution, 'New Discrepancy must not contain resolution state.');

  if (affectedObject) {
    assertSameTenant(input.tenantId, affectedObject.tenantId, 'Discrepancy and affected object');
    invariant(
      input.affectedObjectId === affectedObject.id,
      'Discrepancy must reference the supplied affected object.'
    );
    invariant(
      affectedObject.changeId === change.id,
      'Discrepancy affected object must belong to the same Change.'
    );
  } else {
    invariant(!input.affectedObjectId, 'Discrepancy cannot reference an unsupplied affected object.');
  }

  return Object.freeze({ ...input });
}

export function resolveChangeDiscrepancy(
  current: ChangeDiscrepancy,
  status: 'RESOLVED' | 'ACCEPTED',
  resolvedAt: string,
  resolution: string
): ChangeDiscrepancy {
  invariant(current.status === 'OPEN', 'Only an OPEN Discrepancy can be resolved or accepted.');
  assertDate(resolvedAt, 'Discrepancy resolvedAt');
  assertNonEmpty(resolution, 'Discrepancy resolution');
  return Object.freeze({
    ...current,
    status,
    resolvedAt,
    resolution
  });
}

export function closeChange(
  current: Change,
  verification: ChangeVerification,
  closedAt: string,
  resultingBaseline?: Baseline
): Change {
  assertSameTenant(current.tenantId, verification.tenantId, 'Change and Verification');
  invariant(current.status === 'VERIFYING', 'Only a VERIFYING Change can close.');
  invariant(verification.changeId === current.id, 'Verification must belong to the Change.');
  invariant(verification.outcome === 'PASS', 'Change closure requires PASS verification.');
  assertDate(closedAt, 'Change closedAt');

  if (resultingBaseline) {
    assertSameTenant(current.tenantId, resultingBaseline.tenantId, 'Change and resulting Baseline');
    invariant(
      resultingBaseline.status === 'ESTABLISHED',
      'Resulting Baseline must be ESTABLISHED.'
    );
  }

  return Object.freeze({
    ...current,
    status: 'CLOSED',
    closedAt,
    ...(resultingBaseline ? { resultingBaselineId: resultingBaseline.id } : {})
  });
}
