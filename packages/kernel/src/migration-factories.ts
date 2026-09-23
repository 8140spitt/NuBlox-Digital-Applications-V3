import { invariant } from './errors.js';
import type { Decision } from './control.js';
import type { CanonicalObjectIdentity, Person } from './model.js';
import type { CanonicalDataEnvelope, ExternalIdentity, IntegrationJob, MigrationReconciliation } from './portability.js';
import type { SourceAuthorityRule } from './publication.js';
import type {
  CutoverDecision,
  MigrationConflict,
  MigrationConflictDisposition,
  MigrationItemResult,
  MigrationMappingVersion,
  MigrationPlan,
  MigrationReconciliationRun,
  MigrationRun
} from './migration.js';

function sameTenant(a: { tenantId: string }, b: { tenantId: string }, label: string): void {
  invariant(a.tenantId === b.tenantId, `${label} must stay within one tenant.`);
}

function text(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}

function date(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}

function count(value: number | undefined, label: string): void {
  if (value === undefined) return;
  invariant(Number.isInteger(value) && value >= 0, `${label} must be a non-negative integer.`);
}

export function createMigrationPlan(
  input: MigrationPlan,
  scope: CanonicalObjectIdentity,
  creator: Person
): MigrationPlan {
  sameTenant(input, scope, 'Migration Plan scope');
  sameTenant(input, creator, 'Migration Plan creator');
  invariant(input.scopeObjectId === scope.id, 'Migration Plan must reference the supplied scope object.');
  invariant(input.createdByPersonId === creator.id, 'Migration Plan creator reference does not match.');
  text(input.code, 'Migration Plan code');
  text(input.name, 'Migration Plan name');
  text(input.sourceSystem, 'Migration Plan sourceSystem');
  text(input.targetSystem, 'Migration Plan targetSystem');
  invariant(input.sourceSystem !== input.targetSystem, 'Migration source and target systems must differ.');
  date(input.createdAt, 'Migration Plan createdAt');
  invariant(input.status === 'DRAFT', 'New Migration Plan must start DRAFT.');
  invariant(!input.approvedDecisionId && !input.approvedAt, 'New Migration Plan cannot already contain approval evidence.');
  return Object.freeze({ ...input, scopeDefinition: Object.freeze({ ...input.scopeDefinition }) });
}

export function approveMigrationPlan(
  current: MigrationPlan,
  decision: Decision,
  approvedAt: string
): MigrationPlan {
  sameTenant(current, decision, 'Migration Plan approval');
  invariant(current.status === 'DRAFT', 'Only a DRAFT Migration Plan can be approved.');
  invariant(decision.subjectObjectId === current.scopeObjectId, 'Migration Plan approval Decision must govern the Plan scope object.');
  invariant(decision.outcome === 'APPROVED', 'Migration Plan approval requires an APPROVED Decision.');
  date(approvedAt, 'Migration Plan approvedAt');
  invariant(Date.parse(approvedAt) >= Date.parse(current.createdAt), 'Migration Plan approval cannot precede creation.');
  return Object.freeze({
    ...current,
    status: 'APPROVED',
    approvedDecisionId: decision.id,
    approvedAt
  });
}


export function activateMigrationPlan(current: MigrationPlan): MigrationPlan {
  invariant(
    current.status === 'APPROVED' || current.status === 'ACTIVE',
    'Only an APPROVED or ACTIVE Migration Plan can execute.'
  );
  return current.status === 'ACTIVE'
    ? current
    : Object.freeze({ ...current, status: 'ACTIVE' });
}

export function createMigrationMappingVersion(
  input: MigrationMappingVersion,
  plan: MigrationPlan,
  creator: Person
): MigrationMappingVersion {
  sameTenant(input, plan, 'Migration Mapping Version Plan');
  sameTenant(input, creator, 'Migration Mapping Version creator');
  invariant(input.migrationPlanId === plan.id, 'Migration Mapping Version must reference the supplied Plan.');
  invariant(['DRAFT', 'APPROVED'].includes(plan.status), 'Migration Mapping Version requires a draft or approved Plan.');
  invariant(input.createdByPersonId === creator.id, 'Migration Mapping Version creator reference does not match.');
  text(input.version, 'Migration Mapping Version version');
  text(input.sourceSchemaVersion, 'Migration Mapping Version sourceSchemaVersion');
  text(input.targetSchemaVersion, 'Migration Mapping Version targetSchemaVersion');
  text(input.checksum, 'Migration Mapping Version checksum');
  date(input.createdAt, 'Migration Mapping Version createdAt');
  invariant(input.status === 'DRAFT', 'New Migration Mapping Version must start DRAFT.');
  invariant(!input.frozenByPersonId && !input.frozenAt, 'New Mapping Version cannot already be frozen.');
  return Object.freeze({ ...input, mappingDefinition: Object.freeze({ ...input.mappingDefinition }) });
}

export function freezeMigrationMappingVersion(
  current: MigrationMappingVersion,
  freezer: Person,
  frozenAt: string
): MigrationMappingVersion {
  sameTenant(current, freezer, 'Migration Mapping Version freezer');
  invariant(current.status === 'DRAFT', 'Only a DRAFT Migration Mapping Version can be frozen.');
  date(frozenAt, 'Migration Mapping Version frozenAt');
  invariant(Date.parse(frozenAt) >= Date.parse(current.createdAt), 'Mapping freeze cannot precede creation.');
  return Object.freeze({
    ...current,
    status: 'FROZEN',
    frozenByPersonId: freezer.id,
    frozenAt
  });
}

export function createMigrationRun(
  input: MigrationRun,
  plan: MigrationPlan,
  mapping: MigrationMappingVersion,
  requester: Person,
  integrationJob?: IntegrationJob
): MigrationRun {
  sameTenant(input, plan, 'Migration Run Plan');
  sameTenant(input, mapping, 'Migration Run Mapping');
  sameTenant(input, requester, 'Migration Run requester');
  invariant(input.migrationPlanId === plan.id, 'Migration Run must reference the supplied Plan.');
  invariant(input.mappingVersionId === mapping.id, 'Migration Run must reference the supplied Mapping Version.');
  invariant(mapping.migrationPlanId === plan.id, 'Migration Mapping Version must belong to the Migration Plan.');
  invariant(plan.status === 'APPROVED' || plan.status === 'ACTIVE', 'Migration Run requires an approved or active Plan.');
  invariant(mapping.status === 'FROZEN', 'Migration Run requires a FROZEN Mapping Version.');
  invariant(input.requestedByPersonId === requester.id, 'Migration Run requester reference does not match.');
  text(input.runReference, 'Migration Run reference');
  date(input.requestedAt, 'Migration Run requestedAt');
  invariant(input.status === 'QUEUED', 'New Migration Run must start QUEUED.');
  invariant(!input.startedAt && !input.loadCompletedAt && !input.completedAt && !input.errorMessage, 'New Migration Run cannot contain execution outcome state.');
  if (integrationJob) {
    sameTenant(input, integrationJob, 'Migration Run Integration Job');
    invariant(input.integrationJobId === integrationJob.id, 'Migration Run Integration Job reference does not match.');
    invariant(integrationJob.jobType === 'IMPORT', 'Migration Run Integration Job must be IMPORT.');
    invariant(!integrationJob.sourceSystem || integrationJob.sourceSystem === plan.sourceSystem, 'Migration Run Integration Job source system must match the Plan.');
  } else {
    invariant(!input.integrationJobId, 'Migration Run cannot reference an unsupplied Integration Job.');
  }
  return Object.freeze({ ...input });
}

export function startMigrationRun(current: MigrationRun, startedAt: string): MigrationRun {
  invariant(current.status === 'QUEUED', 'Only a QUEUED Migration Run can start.');
  date(startedAt, 'Migration Run startedAt');
  invariant(Date.parse(startedAt) >= Date.parse(current.requestedAt), 'Migration Run cannot start before it was requested.');
  return Object.freeze({ ...current, status: 'RUNNING', startedAt });
}

export function createMigrationItemResult(
  input: MigrationItemResult,
  run: MigrationRun,
  plan: MigrationPlan,
  envelope: CanonicalDataEnvelope,
  target?: CanonicalObjectIdentity,
  externalIdentity?: ExternalIdentity
): MigrationItemResult {
  sameTenant(input, run, 'Migration Item Result Run');
  sameTenant(input, plan, 'Migration Item Result Plan');
  sameTenant(input, envelope, 'Migration Item Result envelope');
  invariant(input.migrationRunId === run.id, 'Migration Item Result must reference the supplied Run.');
  invariant(run.migrationPlanId === plan.id, 'Migration Item Result Run must belong to the supplied Plan.');
  invariant(run.status === 'RUNNING', 'Migration Item Results can only be recorded while Run is RUNNING.');
  invariant(Number.isInteger(input.sequence) && input.sequence > 0, 'Migration Item Result sequence must be a positive integer.');
  invariant(input.sourceSystem === plan.sourceSystem, 'Migration Item Result source system must match the Plan.');
  text(input.sourceObjectType, 'Migration Item Result sourceObjectType');
  text(input.sourceObjectId, 'Migration Item Result sourceObjectId');
  text(input.sourceHash, 'Migration Item Result sourceHash');
  invariant(input.sourceEnvelopeId === envelope.id, 'Migration Item Result must reference the supplied source envelope.');
  invariant(envelope.direction === 'IMPORT', 'Migration Item Result requires an IMPORT Data Envelope.');
  invariant(
    input.sourceHash === envelope.checksum,
    'Migration Item Result sourceHash must equal the exact source Data Envelope checksum.'
  );
  invariant(!envelope.externalSystem || envelope.externalSystem === plan.sourceSystem, 'Migration Item Result envelope external system must match the Plan source.');
  date(input.recordedAt, 'Migration Item Result recordedAt');

  if (target) {
    sameTenant(input, target, 'Migration Item Result target');
    invariant(input.targetCanonicalObjectId === target.id, 'Migration Item Result target object reference does not match.');
  } else {
    invariant(!input.targetCanonicalObjectId, 'Migration Item Result cannot reference an unsupplied target object.');
  }

  if (externalIdentity) {
    sameTenant(input, externalIdentity, 'Migration Item Result External Identity');
    invariant(input.externalIdentityId === externalIdentity.id, 'Migration Item Result External Identity reference does not match.');
    invariant(Boolean(target), 'External Identity on Migration Item Result requires a target canonical object.');
    if (target) invariant(externalIdentity.canonicalObjectId === target.id, 'Migration Item Result External Identity must belong to the target object.');
    invariant(externalIdentity.externalSystem === plan.sourceSystem, 'Migration Item Result External Identity must belong to the source system.');
    invariant(
      externalIdentity.externalObjectType === input.sourceObjectType &&
        externalIdentity.externalObjectId === input.sourceObjectId,
      'Migration Item Result External Identity must match the exact source object identity.'
    );
  } else {
    invariant(!input.externalIdentityId, 'Migration Item Result cannot reference an unsupplied External Identity.');
  }

  if (['CREATED', 'UPDATED', 'MATCHED'].includes(input.outcome)) {
    invariant(Boolean(target), 'Successful Migration Item Result requires a target canonical object.');
    text(input.targetHash ?? '', 'Successful Migration Item Result targetHash');
  }
  if (input.outcome === 'FAILED' || input.outcome === 'CONFLICT') {
    text(input.message ?? '', 'Failed/conflict Migration Item Result message');
  }
  return Object.freeze({ ...input });
}

export function completeMigrationLoad(
  current: MigrationRun,
  items: ReadonlyArray<MigrationItemResult>,
  loadCompletedAt: string
): MigrationRun {
  invariant(current.status === 'RUNNING', 'Only a RUNNING Migration Run can complete load.');
  invariant(items.length > 0, 'Migration Run cannot complete load without Item Results.');
  invariant(items.every((item) => item.migrationRunId === current.id), 'Migration Run load can only use its own Item Results.');
  date(loadCompletedAt, 'Migration Run loadCompletedAt');
  const failed = items.some((item) => item.outcome === 'FAILED');
  const conflicted = items.some((item) => item.outcome === 'CONFLICT');
  return Object.freeze({
    ...current,
    status: failed || conflicted ? 'BLOCKED' : 'AWAITING_RECONCILIATION',
    loadCompletedAt
  });
}

export function createMigrationConflict(
  input: MigrationConflict,
  run: MigrationRun,
  item?: MigrationItemResult
): MigrationConflict {
  sameTenant(input, run, 'Migration Conflict Run');
  invariant(input.migrationRunId === run.id, 'Migration Conflict must reference the supplied Run.');
  invariant(['RUNNING', 'BLOCKED', 'AWAITING_RECONCILIATION'].includes(run.status), 'Migration Conflict requires an active or blocked Run.');
  text(input.code, 'Migration Conflict code');
  text(input.description, 'Migration Conflict description');
  date(input.detectedAt, 'Migration Conflict detectedAt');
  invariant(input.status === 'OPEN', 'New Migration Conflict must start OPEN.');
  invariant(!input.resolvedAt, 'New Migration Conflict cannot already be resolved.');
  if (item) {
    sameTenant(input, item, 'Migration Conflict Item Result');
    invariant(input.migrationItemResultId === item.id, 'Migration Conflict Item Result reference does not match.');
    invariant(item.migrationRunId === run.id, 'Migration Conflict Item Result must belong to the Run.');
  } else {
    invariant(!input.migrationItemResultId, 'Migration Conflict cannot reference an unsupplied Item Result.');
  }
  return Object.freeze({ ...input });
}

export function createMigrationConflictDisposition(
  input: MigrationConflictDisposition,
  conflict: MigrationConflict,
  plan: MigrationPlan,
  decision: Decision,
  disposer: Person,
  retryRun?: MigrationRun
): MigrationConflictDisposition {
  sameTenant(input, conflict, 'Migration Conflict Disposition Conflict');
  sameTenant(input, plan, 'Migration Conflict Disposition Plan');
  sameTenant(input, decision, 'Migration Conflict Disposition Decision');
  sameTenant(input, disposer, 'Migration Conflict Disposition disposer');
  invariant(input.migrationConflictId === conflict.id, 'Migration Conflict Disposition must reference the supplied Conflict.');
  invariant(conflict.status === 'OPEN', 'Only an OPEN Migration Conflict can be dispositioned.');
  invariant(input.decisionId === decision.id, 'Migration Conflict Disposition Decision reference does not match.');
  invariant(decision.subjectObjectId === plan.scopeObjectId, 'Migration Conflict Disposition Decision must govern the Migration Plan scope.');
  invariant(decision.outcome === 'APPROVED', 'Migration Conflict Disposition requires an APPROVED Decision.');
  invariant(input.disposedByPersonId === disposer.id, 'Migration Conflict Disposition disposer reference does not match.');
  text(input.rationale, 'Migration Conflict Disposition rationale');
  date(input.disposedAt, 'Migration Conflict Disposition disposedAt');
  if (input.disposition === 'RETRY') {
    invariant(Boolean(retryRun), 'RETRY disposition requires a retry Migration Run.');
    if (retryRun) {
      sameTenant(input, retryRun, 'Migration Conflict Disposition retry Run');
      invariant(input.retryRunId === retryRun.id, 'Migration Conflict Disposition retry Run reference does not match.');
      invariant(retryRun.migrationPlanId === plan.id, 'Retry Migration Run must belong to the same Migration Plan.');
      invariant(retryRun.id !== conflict.migrationRunId, 'Retry Migration Run must be a distinct Run.');
    }
  } else {
    invariant(!input.retryRunId, 'Non-RETRY disposition cannot reference a retry Run.');
  }
  return Object.freeze({ ...input });
}

export function createMigrationReconciliationRun(
  input: MigrationReconciliationRun,
  run: MigrationRun,
  starter: Person
): MigrationReconciliationRun {
  sameTenant(input, run, 'Migration Reconciliation Run Migration Run');
  sameTenant(input, starter, 'Migration Reconciliation Run starter');
  invariant(input.migrationRunId === run.id, 'Migration Reconciliation Run must reference the supplied Migration Run.');
  invariant(['AWAITING_RECONCILIATION', 'BLOCKED'].includes(run.status), 'Migration Reconciliation Run requires a loaded Migration Run.');
  invariant(input.startedByPersonId === starter.id, 'Migration Reconciliation Run starter reference does not match.');
  invariant(input.status === 'RUNNING', 'New Migration Reconciliation Run must start RUNNING.');
  date(input.startedAt, 'Migration Reconciliation Run startedAt');
  invariant(!input.completedAt, 'New Migration Reconciliation Run cannot already be completed.');
  return Object.freeze({ ...input });
}

export function completeMigrationReconciliationRun(
  current: MigrationReconciliationRun,
  reconciliations: ReadonlyArray<MigrationReconciliation>,
  openBlockingConflicts: number,
  completedAt: string,
  details?: string
): MigrationReconciliationRun {
  invariant(current.status === 'RUNNING', 'Only a RUNNING Migration Reconciliation Run can complete.');
  invariant(reconciliations.length > 0, 'Migration Reconciliation Run requires reconciliation evidence.');
  date(completedAt, 'Migration Reconciliation Run completedAt');
  invariant(openBlockingConflicts >= 0 && Number.isInteger(openBlockingConflicts), 'Open blocking conflict count must be a non-negative integer.');
  const verifiedCount = reconciliations.filter((item) => item.status === 'VERIFIED').length;
  const conflictCount = reconciliations.filter((item) => item.status === 'CONFLICT').length + openBlockingConflicts;
  const missingCount = reconciliations.filter((item) => item.status === 'MISSING').length;
  const targetCount = reconciliations.filter((item) => item.canonicalObjectId).length;
  const status: MigrationReconciliationRun['status'] =
    conflictCount > 0 || missingCount > 0 || verifiedCount !== reconciliations.length
      ? 'CONFLICT'
      : 'VERIFIED';
  return Object.freeze({
    ...current,
    status,
    completedAt,
    sourceCount: reconciliations.length,
    targetCount,
    verifiedCount,
    conflictCount,
    missingCount,
    ...(details ? { details } : {})
  });
}

export function applyReconciliationToMigrationRun(
  run: MigrationRun,
  reconciliation: MigrationReconciliationRun
): MigrationRun {
  sameTenant(run, reconciliation, 'Migration Run Reconciliation');
  invariant(reconciliation.migrationRunId === run.id, 'Migration Reconciliation Run must belong to the Migration Run.');
  invariant(['AWAITING_RECONCILIATION', 'BLOCKED'].includes(run.status), 'Migration Run must be awaiting reconciliation or blocked.');
  invariant(reconciliation.status !== 'RUNNING', 'Migration Reconciliation Run must be complete.');
  if (reconciliation.status === 'VERIFIED') {
    return Object.freeze({
      ...run,
      status: 'RECONCILED',
      completedAt: reconciliation.completedAt
    });
  }
  const { completedAt: _completedAt, ...openRun } = run;
  return Object.freeze({
    ...openRun,
    status: 'BLOCKED'
  });
}

export function createCutoverDecision(
  input: CutoverDecision,
  plan: MigrationPlan,
  run: MigrationRun,
  reconciliation: MigrationReconciliationRun,
  decision: Decision,
  decider: Person,
  targetAuthorityRule?: SourceAuthorityRule
): CutoverDecision {
  sameTenant(input, plan, 'Cutover Decision Plan');
  sameTenant(input, run, 'Cutover Decision Run');
  sameTenant(input, reconciliation, 'Cutover Decision Reconciliation');
  sameTenant(input, decision, 'Cutover Decision authority Decision');
  sameTenant(input, decider, 'Cutover Decision decider');
  invariant(input.migrationPlanId === plan.id, 'Cutover Decision must reference the supplied Plan.');
  invariant(input.migrationRunId === run.id, 'Cutover Decision must reference the supplied Run.');
  invariant(input.reconciliationRunId === reconciliation.id, 'Cutover Decision must reference the supplied Reconciliation Run.');
  invariant(run.migrationPlanId === plan.id, 'Cutover Decision Migration Run must belong to the Plan.');
  invariant(run.runType === 'PRODUCTION', 'Cutover Decision requires a PRODUCTION Migration Run.');
  invariant(run.status === 'RECONCILED', 'Cutover Decision requires a RECONCILED Migration Run.');
  invariant(reconciliation.status === 'VERIFIED', 'Cutover Decision requires VERIFIED reconciliation.');
  invariant(input.decisionId === decision.id, 'Cutover Decision authority Decision reference does not match.');
  invariant(decision.subjectObjectId === plan.scopeObjectId, 'Cutover authority Decision must govern the Migration Plan scope.');
  invariant(input.outcome === decision.outcome, 'Cutover Decision outcome must match the authority Decision.');
  invariant(input.outcome === 'APPROVED' || input.outcome === 'REJECTED', 'Cutover Decision outcome must be APPROVED or REJECTED.');
  invariant(input.decidedByPersonId === decider.id, 'Cutover Decision decider reference does not match.');
  invariant(decision.deciderPersonId === decider.id, 'Cutover Decision must be recorded by the Decision decider.');
  text(input.reason, 'Cutover Decision reason');
  date(input.decidedAt, 'Cutover Decision decidedAt');
  if (input.outcome === 'APPROVED') {
    invariant(Boolean(input.effectiveAt), 'Approved Cutover Decision requires effectiveAt.');
    invariant(Boolean(targetAuthorityRule), 'Approved Cutover Decision requires a target Source Authority Rule.');
    if (input.effectiveAt) {
      date(input.effectiveAt, 'Cutover Decision effectiveAt');
      invariant(Date.parse(input.effectiveAt) >= Date.parse(input.decidedAt), 'Cutover effectiveAt cannot precede the Decision.');
    }
    if (targetAuthorityRule) {
      sameTenant(input, targetAuthorityRule, 'Cutover Decision target Source Authority Rule');
      invariant(input.targetAuthorityRuleId === targetAuthorityRule.id, 'Cutover Decision target Source Authority Rule reference does not match.');
      invariant(targetAuthorityRule.status === 'ACTIVE', 'Cutover Decision requires an ACTIVE target Source Authority Rule.');
      invariant(targetAuthorityRule.authorityOwner === 'NUBLOX', 'Cutover target Source Authority Rule must establish NuBlox authority.');
      invariant(Date.parse(targetAuthorityRule.effectiveFrom) <= Date.parse(input.effectiveAt!), 'Target Source Authority Rule must be effective by cutover.');
    }
  } else {
    invariant(!input.effectiveAt && !input.targetAuthorityRuleId, 'Rejected Cutover Decision cannot establish authority or an effective cutover.');
  }
  return Object.freeze({ ...input });
}

export function validateReconciliationRunCounts(input: MigrationReconciliationRun): void {
  count(input.sourceCount, 'Migration Reconciliation Run sourceCount');
  count(input.targetCount, 'Migration Reconciliation Run targetCount');
  count(input.verifiedCount, 'Migration Reconciliation Run verifiedCount');
  count(input.conflictCount, 'Migration Reconciliation Run conflictCount');
  count(input.missingCount, 'Migration Reconciliation Run missingCount');
}


export function applyCutoverToMigrationPlan(
  current: MigrationPlan,
  cutover: CutoverDecision
): MigrationPlan {
  sameTenant(current, cutover, 'Migration Plan Cutover Decision');
  invariant(
    cutover.migrationPlanId === current.id,
    'Cutover Decision must belong to the Migration Plan.'
  );
  invariant(
    current.status === 'ACTIVE',
    'Only an ACTIVE Migration Plan can consume a Cutover Decision.'
  );
  return cutover.outcome === 'APPROVED'
    ? Object.freeze({ ...current, status: 'COMPLETED' })
    : current;
}
