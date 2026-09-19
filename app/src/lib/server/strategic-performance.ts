import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { createWorkflowInstance, createWorkItem } from '$lib/server/shared-work';

export type KpiDefinition = {
  id: string;
  kpiCode: string;
  name: string;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  businessDefinition: string;
  formula: string;
  unitOfMeasureId: string;
  frequency: string;
  dimensions: string[];
  sourceData: string;
  qualityRules: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  updatedAt: string;
};

export type KpiVersion = {
  id: string;
  kpiId: string;
  versionNo: number;
  lifecycleStatus: string;
  businessDefinition: string;
  formula: string;
  unitOfMeasureId: string;
  frequency: string;
  dimensions: string[];
  sourceData: string;
  qualityRules: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type KpiObjectiveReference = { id: string; versionNo: number };

export type PerformanceTarget = {
  id: string;
  targetRef: string;
  kpiId: string;
  kpiVersionNo: number;
  scopeType: string;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  targetValue: string;
  comparisonOperator: string;
  status: string;
  aggregateVersion: number;
};

export type PerformanceObservation = {
  id: string;
  kpiId: string;
  kpiVersionNo: number;
  subjectType: string;
  subjectId: string;
  periodStart: string;
  periodEnd: string;
  observedAt: string;
  numericValue: string;
  unitOfMeasureId: string;
  sourceReference: string;
  qualityStatus: string;
  correctionOfId: string | null;
  recordedByPartyId: string;
  createdAt: string;
};

const kpiSelect = `
SELECT k.id,
       k.kpi_code AS kpiCode,
       k.name,
       k.owner_party_id AS ownerPartyId,
       k.status,
       k.aggregate_version AS aggregateVersion,
       k.current_version_no AS currentVersionNo,
       v.business_definition AS businessDefinition,
       v.formula,
       v.unit_of_measure_id AS unitOfMeasureId,
       v.frequency,
       v.dimensions_json AS dimensions,
       v.source_data AS sourceData,
       v.quality_rules AS qualityRules,
       v.effective_from AS effectiveFrom,
       v.effective_to AS effectiveTo,
       k.updated_at AS updatedAt
  FROM performance_kpis k
  JOIN performance_kpi_versions v
    ON v.kpi_id = k.id
   AND v.version_no = k.current_version_no
   AND v.tenant_id = k.tenant_id`;

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function code(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean))
    throw new Error(label + ' contains unsupported characters.');
  return clean;
}
function dateRange(start: string, end: string, label: string) {
  const a = new Date(required(start, label + ' start'));
  const b = new Date(required(end, label + ' end'));
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()))
    throw new Error(label + ' dates are invalid.');
  if (b <= a) throw new Error(label + ' end must be later than start.');
  return { start: a.toISOString(), end: b.toISOString() };
}
function optionalRange(start?: string, end?: string) {
  if (!start?.trim() && !end?.trim()) return { start: null, end: null };
  if (!start?.trim() || !end?.trim())
    throw new Error('KPI effectivity requires both start and end when supplied.');
  const r = dateRange(start, end, 'KPI effectivity');
  return r;
}
function dimensions(values: string[]) {
  const clean = [
    ...new Set(
      values
        .map((v) => v.trim())
        .filter(Boolean)
        .map((v) => code(v, 'KPI dimension', 64))
    )
  ];
  return clean;
}

async function assertParty(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active KPI owner Party not found.');
}
async function assertUnit(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_units_of_measure WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Unit of Measure not found.');
}
async function assertObjective(
  context: CommandContext,
  ref: KpiObjectiveReference,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { status: string }>(
    'SELECT o.status FROM strategic_objectives o JOIN strategic_objective_versions v ON v.objective_id=o.id AND v.version_no=? WHERE o.id=? AND o.tenant_id=?',
    [ref.versionNo, ref.id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Strategic Objective version not found.');
  if (!['APPROVED', 'ACTIVE', 'ACHIEVED', 'NOT_ACHIEVED'].includes(row.status))
    throw new Error('KPI may only measure an approved or active Strategic Objective.');
}
async function getKpi(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & KpiDefinition>(
    kpiSelect + ' WHERE k.id=? AND k.tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('KPI Definition not found.');
  return row;
}
async function evidence(
  context: CommandContext,
  kpi: KpiDefinition,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-PERFORMANCE',
      objectType: 'kpi_definition',
      objectId: kpi.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-PERFORMANCE',
      aggregateType: 'KpiDefinition',
      aggregateObjectId: kpi.id,
      aggregateVersion: kpi.aggregateVersion,
      eventType,
      topic: 'nublox.strategy.performance',
      payload
    },
    executor
  );
}

async function insertKpiVersion(
  context: CommandContext,
  kpiId: string,
  versionNo: number,
  input: {
    businessDefinition: string;
    formula: string;
    unitOfMeasureId: string;
    frequency: string;
    dimensions: string[];
    sourceData: string;
    qualityRules: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    objectives: KpiObjectiveReference[];
  },
  executor: DbExecutor
) {
  if (!input.objectives.length)
    throw new Error('KPI Definition must measure at least one Strategic Objective version.');
  await assertUnit(context, input.unitOfMeasureId, executor);
  for (const ref of input.objectives) await assertObjective(context, ref, executor);
  const effectivity = optionalRange(input.effectiveFrom, input.effectiveTo);
  const versionId = randomUUID();
  await executeMutation(
    "INSERT INTO performance_kpi_versions (id,tenant_id,kpi_id,version_no,lifecycle_status,business_definition,formula,unit_of_measure_id,frequency,dimensions_json,source_data,quality_rules,effective_from,effective_to,published_at,created_by_party_id,created_at) VALUES (?,?,?,?, 'DRAFT',?,?,?,?,?,?,?,?,?,NULL,?,?)",
    [
      versionId,
      context.tenantId,
      kpiId,
      versionNo,
      required(input.businessDefinition, 'KPI business definition'),
      required(input.formula, 'KPI formula'),
      input.unitOfMeasureId,
      code(input.frequency, 'KPI frequency', 64),
      JSON.stringify(dimensions(input.dimensions)),
      required(input.sourceData, 'KPI source data'),
      required(input.qualityRules, 'KPI quality rules'),
      effectivity.start,
      effectivity.end,
      context.actorPartyId,
      now()
    ],
    executor
  );
  for (const ref of input.objectives) {
    await executeMutation(
      'INSERT INTO performance_kpi_objectives (kpi_version_id,objective_id,objective_version_no) VALUES (?,?,?)',
      [versionId, ref.id, ref.versionNo],
      executor
    );
  }
  return versionId;
}

export async function listKpiDefinitions(context: CommandContext) {
  assertPermission(context, 'strategy.performance.read');
  return queryRows<RowDataPacket & KpiDefinition>(
    kpiSelect + ' WHERE k.tenant_id=? ORDER BY k.kpi_code',
    [context.tenantId]
  );
}
export async function listKpiVersions(context: CommandContext, kpiId: string) {
  assertPermission(context, 'strategy.performance.read');
  await getKpi(context, kpiId);
  return queryRows<RowDataPacket & KpiVersion>(
    'SELECT id,kpi_id AS kpiId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,business_definition AS businessDefinition,formula,unit_of_measure_id AS unitOfMeasureId,frequency,dimensions_json AS dimensions,source_data AS sourceData,quality_rules AS qualityRules,effective_from AS effectiveFrom,effective_to AS effectiveTo,published_at AS publishedAt,created_at AS createdAt FROM performance_kpi_versions WHERE tenant_id=? AND kpi_id=? ORDER BY version_no DESC',
    [context.tenantId, kpiId]
  );
}
export async function listKpiObjectiveReferences(context: CommandContext, kpiVersionId: string) {
  assertPermission(context, 'strategy.performance.read');
  return queryRows<RowDataPacket & { objectiveId: string; objectiveVersionNo: number }>(
    'SELECT o.objective_id AS objectiveId,o.objective_version_no AS objectiveVersionNo FROM performance_kpi_objectives o JOIN performance_kpi_versions v ON v.id=o.kpi_version_id WHERE o.kpi_version_id=? AND v.tenant_id=? ORDER BY o.objective_id',
    [kpiVersionId, context.tenantId]
  );
}

export async function createKpiDefinition(
  context: CommandContext,
  input: {
    kpiCode: string;
    name: string;
    ownerPartyId?: string;
    businessDefinition: string;
    formula: string;
    unitOfMeasureId: string;
    frequency: string;
    dimensions: string[];
    sourceData: string;
    qualityRules: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    objectives: KpiObjectiveReference[];
  }
) {
  assertPermission(context, 'strategy.performance.manage');
  const kpiCode = code(input.kpiCode, 'KPI code');
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  return dbTransaction(async (connection) => {
    await assertParty(context, ownerPartyId, connection);
    const id = randomUUID(),
      timestamp = now();
    await executeMutation(
      "INSERT INTO performance_kpis (id,tenant_id,kpi_code,name,owner_party_id,status,aggregate_version,current_version_no,created_at,updated_at) VALUES (?,?,?,?,?,'DRAFT',1,1,?,?)",
      [
        id,
        context.tenantId,
        kpiCode,
        required(input.name, 'KPI name'),
        ownerPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    const versionId = await insertKpiVersion(context, id, 1, input, connection);
    const created = await getKpi(context, id, connection);
    await evidence(
      context,
      created,
      'KPI_DEFINITION_CREATED',
      null,
      'DRAFT',
      { kpiCode, versionId },
      connection
    );
    return id;
  });
}

export async function reviseKpiDefinition(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: {
    businessDefinition: string;
    formula: string;
    unitOfMeasureId: string;
    frequency: string;
    dimensions: string[];
    sourceData: string;
    qualityRules: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    objectives: KpiObjectiveReference[];
  }
) {
  assertPermission(context, 'strategy.performance.manage');
  return dbTransaction(async (connection) => {
    const current = await getKpi(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This KPI Definition changed after you opened it.');
    if (!['DRAFT', 'EFFECTIVE'].includes(current.status))
      throw new Error('Only draft or effective KPI Definitions can be revised.');
    const next = current.currentVersionNo + 1;
    const versionId = await insertKpiVersion(context, current.id, next, input, connection);
    const result = await executeMutation(
      "UPDATE performance_kpis SET status='DRAFT',aggregate_version=aggregate_version+1,current_version_no=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [next, now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent KPI Definition revision detected.');
    const updated = await getKpi(context, current.id, connection);
    await evidence(
      context,
      updated,
      'KPI_DEFINITION_REVISED',
      current.status,
      'DRAFT',
      { versionId, versionNo: next },
      connection
    );
  });
}

async function transitionKpi(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  from: string[],
  to: string,
  eventType: string,
  versionStatus: string
) {
  assertPermission(context, 'strategy.performance.manage');
  return dbTransaction(async (connection) => {
    const current = await getKpi(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This KPI Definition changed after you opened it.');
    if (!from.includes(current.status))
      throw new Error(
        'KPI Definition cannot transition from ' + current.status + ' to ' + to + '.'
      );
    if (to === 'EFFECTIVE') {
      await executeMutation(
        "UPDATE performance_kpi_versions SET lifecycle_status='SUPERSEDED' WHERE kpi_id=? AND lifecycle_status='EFFECTIVE' AND version_no<>?",
        [current.id, current.currentVersionNo],
        connection
      );
    }
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE performance_kpis SET status=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [to, timestamp, current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent KPI Definition transition detected.');
    await executeMutation(
      "UPDATE performance_kpi_versions SET lifecycle_status=?,published_at=CASE WHEN ?='PUBLISHED' THEN ? ELSE published_at END WHERE kpi_id=? AND version_no=?",
      [versionStatus, versionStatus, timestamp, current.id, current.currentVersionNo],
      connection
    );
    const updated = await getKpi(context, current.id, connection);
    await evidence(
      context,
      updated,
      eventType,
      current.status,
      to,
      { versionNo: current.currentVersionNo },
      connection
    );
  });
}
export const validateKpiDefinition = (context: CommandContext, id: string, v: number) =>
  transitionKpi(context, id, v, ['DRAFT'], 'VALIDATED', 'KPI_DEFINITION_VALIDATED', 'VALIDATED');
export const publishKpiDefinition = (context: CommandContext, id: string, v: number) =>
  transitionKpi(
    context,
    id,
    v,
    ['VALIDATED'],
    'PUBLISHED',
    'KPI_DEFINITION_PUBLISHED',
    'PUBLISHED'
  );
export const activateKpiDefinition = (context: CommandContext, id: string, v: number) =>
  transitionKpi(
    context,
    id,
    v,
    ['PUBLISHED'],
    'EFFECTIVE',
    'KPI_DEFINITION_EFFECTIVE',
    'EFFECTIVE'
  );

async function assertEffectiveKpiVersion(
  context: CommandContext,
  kpiId: string,
  versionNo: number,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { unitOfMeasureId: string }>(
    "SELECT unit_of_measure_id AS unitOfMeasureId FROM performance_kpi_versions WHERE tenant_id=? AND kpi_id=? AND version_no=? AND lifecycle_status='EFFECTIVE'",
    [context.tenantId, kpiId, versionNo],
    executor
  );
  if (!row)
    throw new Error('Performance record must reference an effective KPI Definition version.');
  return row;
}

export async function listPerformanceTargets(context: CommandContext, kpiId?: string) {
  assertPermission(context, 'strategy.performance.read');
  return queryRows<RowDataPacket & PerformanceTarget>(
    'SELECT id,target_ref AS targetRef,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,scope_type AS scopeType,scope_id AS scopeId,period_start AS periodStart,period_end AS periodEnd,target_value AS targetValue,comparison_operator AS comparisonOperator,status,aggregate_version AS aggregateVersion FROM performance_targets WHERE tenant_id=?' +
      (kpiId ? ' AND kpi_id=?' : '') +
      ' ORDER BY period_start DESC,target_ref',
    kpiId ? [context.tenantId, kpiId] : [context.tenantId]
  );
}

export async function createPerformanceTarget(
  context: CommandContext,
  input: {
    targetRef: string;
    kpiId: string;
    kpiVersionNo: number;
    scopeType: string;
    scopeId: string;
    periodStart: string;
    periodEnd: string;
    targetValue: number;
    comparisonOperator: 'GREATER_EQUAL' | 'LESS_EQUAL' | 'EQUAL';
  }
) {
  assertPermission(context, 'strategy.performance.manage');
  if (!Number.isFinite(input.targetValue)) throw new Error('Target value must be numeric.');
  if (!['GREATER_EQUAL', 'LESS_EQUAL', 'EQUAL'].includes(input.comparisonOperator))
    throw new Error('Unsupported target comparison operator.');
  const dates = dateRange(input.periodStart, input.periodEnd, 'Target period');
  return dbTransaction(async (connection) => {
    await assertEffectiveKpiVersion(context, input.kpiId, input.kpiVersionNo, connection);
    const id = randomUUID(),
      timestamp = now();
    await executeMutation(
      "INSERT INTO performance_targets (id,tenant_id,target_ref,kpi_id,kpi_version_no,scope_type,scope_id,period_start,period_end,target_value,comparison_operator,status,aggregate_version,created_by_party_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,'PROPOSED',1,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.targetRef, 'Target reference'),
        input.kpiId,
        input.kpiVersionNo,
        code(input.scopeType, 'Target scope type', 64),
        required(input.scopeId, 'Target scope ID'),
        dates.start,
        dates.end,
        input.targetValue,
        input.comparisonOperator,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    return id;
  });
}

export async function transitionPerformanceTarget(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  action: 'APPROVE' | 'ACTIVATE' | 'ACHIEVE' | 'MISS' | 'SUPERSEDE' | 'CANCEL'
) {
  assertPermission(context, 'strategy.performance.manage');
  const transitions: Record<string, { from: string[]; to: string }> = {
    APPROVE: { from: ['PROPOSED'], to: 'APPROVED' },
    ACTIVATE: { from: ['APPROVED'], to: 'ACTIVE' },
    ACHIEVE: { from: ['ACTIVE'], to: 'ACHIEVED' },
    MISS: { from: ['ACTIVE'], to: 'MISSED' },
    SUPERSEDE: { from: ['PROPOSED', 'APPROVED', 'ACTIVE'], to: 'SUPERSEDED' },
    CANCEL: { from: ['PROPOSED', 'APPROVED'], to: 'CANCELLED' }
  };
  const t = transitions[action];
  if (!t) throw new Error('Unsupported Performance Target transition.');
  return dbTransaction(async (connection) => {
    const row = await queryOne<RowDataPacket & PerformanceTarget>(
      'SELECT id,target_ref AS targetRef,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,scope_type AS scopeType,scope_id AS scopeId,period_start AS periodStart,period_end AS periodEnd,target_value AS targetValue,comparison_operator AS comparisonOperator,status,aggregate_version AS aggregateVersion FROM performance_targets WHERE id=? AND tenant_id=? FOR UPDATE',
      [id, context.tenantId],
      connection
    );
    if (!row) throw new Error('Performance Target not found.');
    if (row.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Performance Target changed after you opened it.');
    if (!t.from.includes(row.status))
      throw new Error(
        'Performance Target cannot transition from ' + row.status + ' using ' + action + '.'
      );
    const result = await executeMutation(
      'UPDATE performance_targets SET status=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [t.to, now(), id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Performance Target transition detected.');
  });
}

export async function listPerformanceObservations(context: CommandContext, kpiId?: string) {
  assertPermission(context, 'strategy.performance.read');
  return queryRows<RowDataPacket & PerformanceObservation>(
    'SELECT id,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,subject_type AS subjectType,subject_id AS subjectId,period_start AS periodStart,period_end AS periodEnd,observed_at AS observedAt,numeric_value AS numericValue,unit_of_measure_id AS unitOfMeasureId,source_reference AS sourceReference,quality_status AS qualityStatus,correction_of_id AS correctionOfId,recorded_by_party_id AS recordedByPartyId,created_at AS createdAt FROM performance_observations WHERE tenant_id=?' +
      (kpiId ? ' AND kpi_id=?' : '') +
      ' ORDER BY observed_at DESC,created_at DESC',
    kpiId ? [context.tenantId, kpiId] : [context.tenantId]
  );
}

export async function recordPerformanceObservation(
  context: CommandContext,
  input: {
    kpiId: string;
    kpiVersionNo: number;
    subjectType: string;
    subjectId: string;
    periodStart: string;
    periodEnd: string;
    observedAt?: string;
    numericValue: number;
    sourceReference: string;
    correctionOfId?: string;
  }
) {
  assertPermission(context, 'strategy.performance.observe');
  if (!Number.isFinite(input.numericValue)) throw new Error('Observed value must be numeric.');
  const dates = dateRange(input.periodStart, input.periodEnd, 'Observation period');
  const observedAt = input.observedAt?.trim() ? new Date(input.observedAt) : new Date();
  if (Number.isNaN(observedAt.getTime())) throw new Error('Observed-at date is invalid.');
  return dbTransaction(async (connection) => {
    const kpi = await assertEffectiveKpiVersion(
      context,
      input.kpiId,
      input.kpiVersionNo,
      connection
    );
    if (input.correctionOfId) {
      const original = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM performance_observations WHERE id=? AND tenant_id=? AND kpi_id=?',
        [input.correctionOfId, context.tenantId, input.kpiId],
        connection
      );
      if (!original) throw new Error('Observation being corrected was not found.');
    }
    const id = randomUUID();
    await executeMutation(
      "INSERT INTO performance_observations (id,tenant_id,kpi_id,kpi_version_no,subject_type,subject_id,period_start,period_end,observed_at,numeric_value,unit_of_measure_id,source_reference,quality_status,correction_of_id,recorded_by_party_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'RECORDED',?,?,?)",
      [
        id,
        context.tenantId,
        input.kpiId,
        input.kpiVersionNo,
        code(input.subjectType, 'Observation subject type', 64),
        required(input.subjectId, 'Observation subject ID'),
        dates.start,
        dates.end,
        observedAt.toISOString(),
        input.numericValue,
        kpi.unitOfMeasureId,
        required(input.sourceReference, 'Observation source reference'),
        input.correctionOfId?.trim() || null,
        context.actorPartyId,
        now()
      ],
      connection
    );
    return id;
  });
}

export async function validatePerformanceObservation(context: CommandContext, id: string) {
  assertPermission(context, 'strategy.performance.observe');
  return dbTransaction(async (connection) => {
    const row = await queryOne<RowDataPacket & PerformanceObservation>(
      'SELECT id,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,subject_type AS subjectType,subject_id AS subjectId,period_start AS periodStart,period_end AS periodEnd,observed_at AS observedAt,numeric_value AS numericValue,unit_of_measure_id AS unitOfMeasureId,source_reference AS sourceReference,quality_status AS qualityStatus,correction_of_id AS correctionOfId,recorded_by_party_id AS recordedByPartyId,created_at AS createdAt FROM performance_observations WHERE id=? AND tenant_id=? FOR UPDATE',
      [id, context.tenantId],
      connection
    );
    if (!row) throw new Error('Performance Observation not found.');
    if (row.qualityStatus !== 'RECORDED')
      throw new Error('Only a recorded Performance Observation can be validated.');
    await executeMutation(
      "UPDATE performance_observations SET quality_status='VALIDATED' WHERE id=? AND tenant_id=?",
      [id, context.tenantId],
      connection
    );
  });
}

export async function createPerformanceBaseline(
  context: CommandContext,
  input: { baselineRef: string; observationId: string; scopeType: string; scopeId: string }
) {
  assertPermission(context, 'strategy.performance.manage');
  return dbTransaction(async (connection) => {
    const observation = await queryOne<RowDataPacket & PerformanceObservation>(
      "SELECT id,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,subject_type AS subjectType,subject_id AS subjectId,period_start AS periodStart,period_end AS periodEnd,observed_at AS observedAt,numeric_value AS numericValue,unit_of_measure_id AS unitOfMeasureId,source_reference AS sourceReference,quality_status AS qualityStatus,correction_of_id AS correctionOfId,recorded_by_party_id AS recordedByPartyId,created_at AS createdAt FROM performance_observations WHERE id=? AND tenant_id=? AND quality_status='VALIDATED'",
      [input.observationId, context.tenantId],
      connection
    );
    if (!observation) throw new Error('Baseline must pin a validated Performance Observation.');
    const scopeType = code(input.scopeType, 'Baseline scope type', 64);
    const scopeId = required(input.scopeId, 'Baseline scope ID');
    if (observation.subjectType !== scopeType || observation.subjectId !== scopeId)
      throw new Error('Baseline scope must match the pinned Performance Observation subject.');
    await executeMutation(
      "UPDATE performance_baselines SET status='SUPERSEDED' WHERE tenant_id=? AND kpi_id=? AND scope_type=? AND scope_id=? AND status='ACTIVE'",
      [context.tenantId, observation.kpiId, scopeType, scopeId],
      connection
    );
    const id = randomUUID();
    await executeMutation(
      "INSERT INTO performance_baselines (id,tenant_id,baseline_ref,kpi_id,kpi_version_no,scope_type,scope_id,period_start,period_end,observation_id,status,created_by_party_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVE',?,?)",
      [
        id,
        context.tenantId,
        code(input.baselineRef, 'Baseline reference'),
        observation.kpiId,
        observation.kpiVersionNo,
        scopeType,
        scopeId,
        observation.periodStart,
        observation.periodEnd,
        observation.id,
        context.actorPartyId,
        now()
      ],
      connection
    );
    return id;
  });
}

export async function getPerformanceVariance(
  context: CommandContext,
  input: {
    kpiId: string;
    scopeType: string;
    scopeId: string;
    periodStart: string;
    periodEnd: string;
  }
) {
  assertPermission(context, 'strategy.performance.read');
  const dates = dateRange(input.periodStart, input.periodEnd, 'Variance period');
  const scopeType = code(input.scopeType, 'Variance scope type', 64);
  const scopeId = required(input.scopeId, 'Variance scope ID');
  const target = await queryOne<RowDataPacket & PerformanceTarget>(
    "SELECT id,target_ref AS targetRef,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,scope_type AS scopeType,scope_id AS scopeId,period_start AS periodStart,period_end AS periodEnd,target_value AS targetValue,comparison_operator AS comparisonOperator,status,aggregate_version AS aggregateVersion FROM performance_targets WHERE tenant_id=? AND kpi_id=? AND scope_type=? AND scope_id=? AND status='ACTIVE' AND period_start<=? AND period_end>=? ORDER BY updated_at DESC LIMIT 1",
    [context.tenantId, input.kpiId, scopeType, scopeId, dates.start, dates.end]
  );
  const observation = await queryOne<RowDataPacket & PerformanceObservation>(
    "SELECT id,kpi_id AS kpiId,kpi_version_no AS kpiVersionNo,subject_type AS subjectType,subject_id AS subjectId,period_start AS periodStart,period_end AS periodEnd,observed_at AS observedAt,numeric_value AS numericValue,unit_of_measure_id AS unitOfMeasureId,source_reference AS sourceReference,quality_status AS qualityStatus,correction_of_id AS correctionOfId,recorded_by_party_id AS recordedByPartyId,created_at AS createdAt FROM performance_observations WHERE tenant_id=? AND kpi_id=? AND subject_type=? AND subject_id=? AND quality_status='VALIDATED' AND period_start<=? AND period_end>=? ORDER BY observed_at DESC,created_at DESC LIMIT 1",
    [context.tenantId, input.kpiId, scopeType, scopeId, dates.start, dates.end]
  );
  const baseline = await queryOne<RowDataPacket & { observationId: string; baselineValue: string }>(
    "SELECT b.observation_id AS observationId,o.numeric_value AS baselineValue FROM performance_baselines b JOIN performance_observations o ON o.id=b.observation_id WHERE b.tenant_id=? AND b.kpi_id=? AND b.scope_type=? AND b.scope_id=? AND b.status='ACTIVE' ORDER BY b.created_at DESC LIMIT 1",
    [context.tenantId, input.kpiId, scopeType, scopeId]
  );
  if (!target || !observation)
    return { target, observation, baseline, delta: null, deltaPercent: null, onTarget: null };
  const actual = Number(observation.numericValue),
    expected = Number(target.targetValue),
    delta = actual - expected,
    deltaPercent = expected === 0 ? null : (delta / Math.abs(expected)) * 100;
  const onTarget =
    target.comparisonOperator === 'GREATER_EQUAL'
      ? actual >= expected
      : target.comparisonOperator === 'LESS_EQUAL'
        ? actual <= expected
        : actual === expected;
  return { target, observation, baseline, delta, deltaPercent, onTarget };
}

export async function createPerformanceCorrectiveAction(
  context: CommandContext,
  input: {
    kpiId: string;
    kpiVersionNo: number;
    title: string;
    instructions: string;
    dueAt?: string;
    priority?: string;
  }
) {
  assertPermission(context, 'strategy.performance.manage');
  const kpi = await getKpi(context, input.kpiId);
  if (kpi.status !== 'EFFECTIVE' || kpi.currentVersionNo !== input.kpiVersionNo)
    throw new Error(
      'Corrective action must reference the current effective KPI Definition version.'
    );
  const workflowId = await createWorkflowInstance(context, {
    definitionKey: 'PERFORMANCE_CORRECTIVE_ACTION',
    definitionVersion: '1',
    subjectType: 'KPI_DEFINITION',
    subjectId: input.kpiId,
    subjectVersion: String(input.kpiVersionNo),
    currentState: 'ACTION_REQUIRED'
  });
  const workItemId = await createWorkItem(context, workflowId, {
    workType: 'PERFORMANCE_CORRECTIVE_ACTION',
    title: input.title,
    instructions: input.instructions,
    subjectType: 'KPI_DEFINITION',
    subjectId: input.kpiId,
    subjectVersion: String(input.kpiVersionNo),
    priority: input.priority,
    dueAt: input.dueAt
  });
  return { workflowId, workItemId };
}
