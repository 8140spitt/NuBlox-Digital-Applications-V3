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

export type StrategicScenario = {
  id: string;
  scenarioRef: string;
  name: string;
  scenarioType: string;
  scopeType: string;
  scopeId: string;
  horizonStart: string;
  horizonEnd: string;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  narrative: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  updatedAt: string;
};
export type ScenarioVersion = {
  id: string;
  scenarioId: string;
  versionNo: number;
  lifecycleStatus: string;
  narrative: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  createdAt: string;
};
export type ScenarioDriver = {
  driverKey: string;
  name: string;
  baseState: string;
  direction: string;
  rationale: string;
};
export type ScenarioAssumptionRef = { id: string; versionNo: number };
export type ScenarioKpiProjection = {
  kpiId: string;
  kpiVersionNo: number;
  projectedValue: number;
  projectionNote: string;
};
export type ScenarioInput = {
  scenarioRef: string;
  name: string;
  scenarioType: string;
  scopeType: string;
  scopeId: string;
  horizonStart: string;
  horizonEnd: string;
  ownerPartyId?: string;
  narrative: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  drivers: ScenarioDriver[];
  assumptions: ScenarioAssumptionRef[];
  projections: ScenarioKpiProjection[];
};

const currentSelect = `
SELECT s.id,s.scenario_ref AS scenarioRef,s.name,s.scenario_type AS scenarioType,s.scope_type AS scopeType,s.scope_id AS scopeId,
       s.horizon_start AS horizonStart,s.horizon_end AS horizonEnd,s.owner_party_id AS ownerPartyId,s.status,s.aggregate_version AS aggregateVersion,
       s.current_version_no AS currentVersionNo,v.narrative,v.effective_from AS effectiveFrom,v.effective_to AS effectiveTo,s.updated_at AS updatedAt
FROM strategic_scenarios s JOIN strategic_scenario_versions v ON v.scenario_id=s.id AND v.version_no=s.current_version_no AND v.tenant_id=s.tenant_id`;

function now() {
  return new Date().toISOString();
}
function required(v: string, l: string) {
  const x = v.trim();
  if (!x) throw new Error(l + ' is required.');
  return x;
}
function code(v: string, l: string, max = 191) {
  const x = required(v, l).toUpperCase();
  if (x.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(x))
    throw new Error(l + ' contains unsupported characters.');
  return x;
}
function range(start: string, end: string, label: string) {
  const a = new Date(required(start, label + ' start')),
    b = new Date(required(end, label + ' end'));
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()))
    throw new Error(label + ' dates are invalid.');
  if (b <= a) throw new Error(label + ' end must be later than start.');
  return { start: a.toISOString(), end: b.toISOString() };
}
function optionalRange(start?: string, end?: string) {
  if (!start?.trim() && !end?.trim()) return { start: null, end: null };
  if (!start?.trim() || !end?.trim()) throw new Error('Scenario effectivity requires both dates.');
  return range(start, end, 'Scenario effectivity');
}
async function assertParty(c: CommandContext, id: string, e: DbExecutor) {
  const r = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, c.tenantId],
    e
  );
  if (!r) throw new Error('Active Scenario owner Party not found.');
}
async function assertAssumption(c: CommandContext, r: ScenarioAssumptionRef, e: DbExecutor) {
  const row = await queryOne<RowDataPacket & { status: string }>(
    'SELECT v.lifecycle_status AS status FROM strategic_assumptions a JOIN strategic_assumption_versions v ON v.assumption_id=a.id AND v.version_no=? WHERE a.id=? AND a.tenant_id=?',
    [r.versionNo, r.id, c.tenantId],
    e
  );
  if (!row) throw new Error('Scenario Assumption version not found.');
  if (!['ACCEPTED', 'ACTIVE', 'CHALLENGED'].includes(row.status))
    throw new Error('Scenario may only pin an assessed Assumption version.');
}
async function assertKpi(c: CommandContext, p: ScenarioKpiProjection, e: DbExecutor) {
  const row = await queryOne<RowDataPacket & { status: string }>(
    'SELECT lifecycle_status AS status FROM performance_kpi_versions WHERE tenant_id=? AND kpi_id=? AND version_no=?',
    [c.tenantId, p.kpiId, p.kpiVersionNo],
    e
  );
  if (!row || !['PUBLISHED', 'EFFECTIVE', 'SUPERSEDED'].includes(row.status))
    throw new Error(
      'Scenario KPI projection must pin a published/effective KPI Definition version.'
    );
}
async function getScenario(c: CommandContext, id: string, e?: DbExecutor, lock = false) {
  const r = await queryOne<RowDataPacket & StrategicScenario>(
    currentSelect + ' WHERE s.id=? AND s.tenant_id=?' + (lock ? ' FOR UPDATE' : ''),
    [id, c.tenantId],
    e
  );
  if (!r) throw new Error('Strategic Scenario not found.');
  return r;
}
async function evidence(
  c: CommandContext,
  s: StrategicScenario,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  e: DbExecutor
) {
  await recordPlatformAudit(
    c,
    {
      aggregateId: 'AGG-02-SCENARIO',
      objectType: 'strategic_scenario',
      objectId: s.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    e
  );
  await emitBusinessEvent(
    c,
    {
      aggregateId: 'AGG-02-SCENARIO',
      aggregateType: 'StrategicScenario',
      aggregateObjectId: s.id,
      aggregateVersion: s.aggregateVersion,
      eventType,
      topic: 'nublox.strategy.scenario',
      payload
    },
    e
  );
}

async function insertVersion(
  c: CommandContext,
  scenarioId: string,
  versionNo: number,
  input: Pick<
    ScenarioInput,
    'narrative' | 'effectiveFrom' | 'effectiveTo' | 'drivers' | 'assumptions' | 'projections'
  >,
  e: DbExecutor
) {
  if (!input.drivers.length) throw new Error('Scenario requires at least one explicit driver.');
  if (!input.assumptions.length)
    throw new Error('Scenario requires at least one governed Assumption version.');
  for (const r of input.assumptions) await assertAssumption(c, r, e);
  for (const p of input.projections) await assertKpi(c, p, e);
  const effectivity = optionalRange(input.effectiveFrom, input.effectiveTo),
    versionId = randomUUID();
  await executeMutation(
    "INSERT INTO strategic_scenario_versions (id,tenant_id,scenario_id,version_no,lifecycle_status,narrative,effective_from,effective_to,created_by_party_id,created_at) VALUES (?,?,?,?,'DRAFT',?,?,?,?,?)",
    [
      versionId,
      c.tenantId,
      scenarioId,
      versionNo,
      required(input.narrative, 'Scenario narrative'),
      effectivity.start,
      effectivity.end,
      c.actorPartyId,
      now()
    ],
    e
  );
  const driverKeys = new Set<string>();
  for (const d of input.drivers) {
    const k = code(d.driverKey, 'Scenario driver key');
    if (driverKeys.has(k)) throw new Error('Scenario driver keys must be unique.');
    driverKeys.add(k);
    const direction = code(d.direction, 'Driver direction', 32);
    if (!['UP', 'DOWN', 'STABLE', 'VOLATILE', 'UNKNOWN'].includes(direction))
      throw new Error('Unsupported Scenario driver direction.');
    await executeMutation(
      'INSERT INTO strategic_scenario_drivers (id,scenario_version_id,driver_key,name,base_state,direction,rationale) VALUES (?,?,?,?,?,?,?)',
      [
        randomUUID(),
        versionId,
        k,
        required(d.name, 'Driver name'),
        required(d.baseState, 'Driver base state'),
        direction,
        required(d.rationale, 'Driver rationale')
      ],
      e
    );
  }
  for (const r of input.assumptions)
    await executeMutation(
      'INSERT INTO strategic_scenario_assumptions (scenario_version_id,assumption_id,assumption_version_no) VALUES (?,?,?)',
      [versionId, r.id, r.versionNo],
      e
    );
  const kpis = new Set<string>();
  for (const p of input.projections) {
    if (kpis.has(p.kpiId))
      throw new Error('Scenario may only contain one projection per KPI version.');
    kpis.add(p.kpiId);
    if (!Number.isFinite(p.projectedValue)) throw new Error('Projected KPI value must be numeric.');
    await executeMutation(
      'INSERT INTO strategic_scenario_kpi_projections (id,scenario_version_id,kpi_id,kpi_version_no,projected_value,projection_note) VALUES (?,?,?,?,?,?)',
      [
        randomUUID(),
        versionId,
        p.kpiId,
        p.kpiVersionNo,
        p.projectedValue,
        required(p.projectionNote, 'Projection note')
      ],
      e
    );
  }
  return versionId;
}

export async function listStrategicScenarios(c: CommandContext) {
  assertPermission(c, 'strategy.scenario.read');
  return queryRows<RowDataPacket & StrategicScenario>(
    currentSelect + ' WHERE s.tenant_id=? ORDER BY s.updated_at DESC,s.scenario_ref',
    [c.tenantId]
  );
}
export async function listScenarioVersions(c: CommandContext, id: string) {
  assertPermission(c, 'strategy.scenario.read');
  await getScenario(c, id);
  return queryRows<RowDataPacket & ScenarioVersion>(
    'SELECT id,scenario_id AS scenarioId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,narrative,effective_from AS effectiveFrom,effective_to AS effectiveTo,created_at AS createdAt FROM strategic_scenario_versions WHERE tenant_id=? AND scenario_id=? ORDER BY version_no DESC',
    [c.tenantId, id]
  );
}
export async function listScenarioDrivers(c: CommandContext, versionId: string) {
  assertPermission(c, 'strategy.scenario.read');
  return queryRows<RowDataPacket & ScenarioDriver>(
    'SELECT driver_key AS driverKey,name,base_state AS baseState,direction,rationale FROM strategic_scenario_drivers d JOIN strategic_scenario_versions v ON v.id=d.scenario_version_id WHERE d.scenario_version_id=? AND v.tenant_id=? ORDER BY driver_key',
    [versionId, c.tenantId]
  );
}
export async function listScenarioAssumptionRefs(c: CommandContext, versionId: string) {
  assertPermission(c, 'strategy.scenario.read');
  return queryRows<RowDataPacket & { assumptionId: string; assumptionVersionNo: number }>(
    'SELECT a.assumption_id AS assumptionId,a.assumption_version_no AS assumptionVersionNo FROM strategic_scenario_assumptions a JOIN strategic_scenario_versions v ON v.id=a.scenario_version_id WHERE a.scenario_version_id=? AND v.tenant_id=? ORDER BY assumption_id',
    [versionId, c.tenantId]
  );
}
export async function listScenarioProjections(c: CommandContext, versionId: string) {
  assertPermission(c, 'strategy.scenario.read');
  return queryRows<RowDataPacket & ScenarioKpiProjection>(
    'SELECT p.kpi_id AS kpiId,p.kpi_version_no AS kpiVersionNo,p.projected_value AS projectedValue,p.projection_note AS projectionNote FROM strategic_scenario_kpi_projections p JOIN strategic_scenario_versions v ON v.id=p.scenario_version_id WHERE p.scenario_version_id=? AND v.tenant_id=? ORDER BY kpi_id',
    [versionId, c.tenantId]
  );
}
export async function listScenarioSensitivityRuns(c: CommandContext, id: string) {
  assertPermission(c, 'strategy.scenario.read');
  await getScenario(c, id);
  return queryRows<
    RowDataPacket & {
      id: string;
      scenarioVersionNo: number;
      variableKey: string;
      lowCase: string | null;
      baseCase: string | null;
      highCase: string | null;
      resultSummary: string;
      createdAt: string;
    }
  >(
    'SELECT id,scenario_version_no AS scenarioVersionNo,variable_key AS variableKey,low_case AS lowCase,base_case AS baseCase,high_case AS highCase,result_summary AS resultSummary,created_at AS createdAt FROM strategic_scenario_sensitivity_runs WHERE tenant_id=? AND scenario_id=? ORDER BY created_at DESC',
    [c.tenantId, id]
  );
}
export async function listScenarioContingencies(c: CommandContext, id: string) {
  assertPermission(c, 'strategy.scenario.read');
  await getScenario(c, id);
  return queryRows<
    RowDataPacket & {
      id: string;
      scenarioVersionNo: number;
      contingencyRef: string;
      triggerCondition: string;
      responseStrategy: string;
      status: string;
    }
  >(
    'SELECT id,scenario_version_no AS scenarioVersionNo,contingency_ref AS contingencyRef,trigger_condition AS triggerCondition,response_strategy AS responseStrategy,status FROM strategic_scenario_contingencies WHERE tenant_id=? AND scenario_id=? ORDER BY contingency_ref',
    [c.tenantId, id]
  );
}

export async function createStrategicScenario(c: CommandContext, input: ScenarioInput) {
  assertPermission(c, 'strategy.scenario.manage');
  const scenarioRef = code(input.scenarioRef, 'Scenario reference'),
    scenarioType = code(input.scenarioType, 'Scenario type', 32);
  if (!['BASELINE', 'UPSIDE', 'DOWNSIDE', 'STRESS', 'CUSTOM'].includes(scenarioType))
    throw new Error('Unsupported Scenario type.');
  const horizon = range(input.horizonStart, input.horizonEnd, 'Scenario horizon'),
    owner = input.ownerPartyId?.trim() || c.actorPartyId;
  return dbTransaction(async (e) => {
    await assertParty(c, owner, e);
    const id = randomUUID(),
      t = now();
    await executeMutation(
      "INSERT INTO strategic_scenarios (id,tenant_id,scenario_ref,name,scenario_type,scope_type,scope_id,horizon_start,horizon_end,owner_party_id,status,aggregate_version,current_version_no,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,'DRAFT',1,1,?,?)",
      [
        id,
        c.tenantId,
        scenarioRef,
        required(input.name, 'Scenario name'),
        scenarioType,
        code(input.scopeType, 'Scenario scope type', 64),
        required(input.scopeId, 'Scenario scope ID'),
        horizon.start,
        horizon.end,
        owner,
        t,
        t
      ],
      e
    );
    const versionId = await insertVersion(c, id, 1, input, e);
    const created = await getScenario(c, id, e);
    await evidence(
      c,
      created,
      'STRATEGIC_SCENARIO_CREATED',
      null,
      'DRAFT',
      { scenarioRef, scenarioType, versionId },
      e
    );
    return id;
  });
}
export async function reviseStrategicScenario(
  c: CommandContext,
  id: string,
  expected: number,
  input: Pick<
    ScenarioInput,
    'narrative' | 'effectiveFrom' | 'effectiveTo' | 'drivers' | 'assumptions' | 'projections'
  >
) {
  assertPermission(c, 'strategy.scenario.manage');
  return dbTransaction(async (e) => {
    const s = await getScenario(c, id, e, true);
    if (s.aggregateVersion !== expected)
      throw new Error('This Scenario changed after you opened it.');
    if (!['DRAFT', 'ACTIVE'].includes(s.status))
      throw new Error('Only draft or active Scenarios can be revised.');
    const next = s.currentVersionNo + 1,
      versionId = await insertVersion(c, s.id, next, input, e);
    const r = await executeMutation(
      "UPDATE strategic_scenarios SET status='DRAFT',aggregate_version=aggregate_version+1,current_version_no=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [next, now(), s.id, c.tenantId, expected],
      e
    );
    if (r.affectedRows !== 1) throw new Error('Concurrent Scenario revision detected.');
    const u = await getScenario(c, s.id, e);
    await evidence(
      c,
      u,
      'STRATEGIC_SCENARIO_REVISED',
      s.status,
      'DRAFT',
      { versionId, versionNo: next },
      e
    );
  });
}
async function transition(
  c: CommandContext,
  id: string,
  expected: number,
  from: string[],
  to: string,
  eventType: string,
  versionStatus: string
) {
  assertPermission(c, 'strategy.scenario.approve');
  return dbTransaction(async (e) => {
    const s = await getScenario(c, id, e, true);
    if (s.aggregateVersion !== expected)
      throw new Error('This Scenario changed after you opened it.');
    if (!from.includes(s.status))
      throw new Error('Scenario cannot transition from ' + s.status + ' to ' + to + '.');
    if (to === 'ACTIVE')
      await executeMutation(
        "UPDATE strategic_scenario_versions SET lifecycle_status='SUPERSEDED' WHERE scenario_id=? AND lifecycle_status='ACTIVE' AND version_no<>?",
        [s.id, s.currentVersionNo],
        e
      );
    const r = await executeMutation(
      'UPDATE strategic_scenarios SET status=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [to, now(), s.id, c.tenantId, expected],
      e
    );
    if (r.affectedRows !== 1) throw new Error('Concurrent Scenario transition detected.');
    await executeMutation(
      'UPDATE strategic_scenario_versions SET lifecycle_status=? WHERE scenario_id=? AND version_no=?',
      [versionStatus, s.id, s.currentVersionNo],
      e
    );
    const u = await getScenario(c, s.id, e);
    await evidence(c, u, eventType, s.status, to, { versionNo: s.currentVersionNo }, e);
  });
}
export const reviewStrategicScenario = (c: CommandContext, id: string, v: number) =>
  transition(c, id, v, ['DRAFT'], 'REVIEWED', 'STRATEGIC_SCENARIO_REVIEWED', 'REVIEWED');
export const approveStrategicScenario = (c: CommandContext, id: string, v: number) =>
  transition(c, id, v, ['REVIEWED'], 'APPROVED', 'STRATEGIC_SCENARIO_APPROVED', 'APPROVED');
export const activateStrategicScenario = (c: CommandContext, id: string, v: number) =>
  transition(c, id, v, ['APPROVED'], 'ACTIVE', 'STRATEGIC_SCENARIO_ACTIVATED', 'ACTIVE');
export const supersedeStrategicScenario = (c: CommandContext, id: string, v: number) =>
  transition(c, id, v, ['ACTIVE'], 'SUPERSEDED', 'STRATEGIC_SCENARIO_SUPERSEDED', 'SUPERSEDED');
export const retireStrategicScenario = (c: CommandContext, id: string, v: number) =>
  transition(
    c,
    id,
    v,
    ['APPROVED', 'ACTIVE', 'SUPERSEDED'],
    'RETIRED',
    'STRATEGIC_SCENARIO_RETIRED',
    'RETIRED'
  );

export async function runScenarioSensitivity(
  c: CommandContext,
  id: string,
  input: {
    variableKey: string;
    lowCase?: number;
    baseCase?: number;
    highCase?: number;
    resultSummary: string;
  }
) {
  assertPermission(c, 'strategy.scenario.manage');
  for (const v of [input.lowCase, input.baseCase, input.highCase])
    if (v != null && !Number.isFinite(v)) throw new Error('Sensitivity values must be numeric.');
  return dbTransaction(async (e) => {
    const s = await getScenario(c, id, e, true);
    const runId = randomUUID();
    await executeMutation(
      'INSERT INTO strategic_scenario_sensitivity_runs (id,tenant_id,scenario_id,scenario_version_no,variable_key,low_case,base_case,high_case,result_summary,created_by_party_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        runId,
        c.tenantId,
        s.id,
        s.currentVersionNo,
        code(input.variableKey, 'Sensitivity variable key'),
        input.lowCase ?? null,
        input.baseCase ?? null,
        input.highCase ?? null,
        required(input.resultSummary, 'Sensitivity result summary'),
        c.actorPartyId,
        now()
      ],
      e
    );
    return runId;
  });
}
export async function createScenarioContingency(
  c: CommandContext,
  id: string,
  input: {
    contingencyRef: string;
    triggerCondition: string;
    responseStrategy: string;
    ownerPartyId?: string;
  }
) {
  assertPermission(c, 'strategy.scenario.manage');
  return dbTransaction(async (e) => {
    const s = await getScenario(c, id, e, true);
    const owner = input.ownerPartyId?.trim() || c.actorPartyId;
    await assertParty(c, owner, e);
    const cid = randomUUID();
    await executeMutation(
      "INSERT INTO strategic_scenario_contingencies (id,tenant_id,scenario_id,scenario_version_no,contingency_ref,trigger_condition,response_strategy,owner_party_id,status,created_at) VALUES (?,?,?,?,?,?,?,?,'PROPOSED',?)",
      [
        cid,
        c.tenantId,
        s.id,
        s.currentVersionNo,
        code(input.contingencyRef, 'Contingency reference'),
        required(input.triggerCondition, 'Contingency trigger'),
        required(input.responseStrategy, 'Contingency response strategy'),
        owner,
        now()
      ],
      e
    );
    return cid;
  });
}
