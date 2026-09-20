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

export type StrategicObjective = {
  id: string;
  objectiveRef: string;
  frameworkId: string;
  frameworkVersionNo: number;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  statement: string;
  successCriteria: string;
  priority: string;
  scopeType: string | null;
  scopeId: string | null;
  horizonStart: string | null;
  horizonEnd: string | null;
  updatedAt: string;
};

export type StrategicObjectiveVersion = {
  id: string;
  objectiveId: string;
  versionNo: number;
  statement: string;
  successCriteria: string;
  priority: string;
  scopeType: string | null;
  scopeId: string | null;
  horizonStart: string | null;
  horizonEnd: string | null;
  ownerPartyId: string;
  lifecycleStatus: string;
  createdByPartyId: string;
  createdAt: string;
};

export type StrategicObjectiveInput = {
  objectiveRef: string;
  frameworkId: string;
  frameworkVersionNo: number;
  statement: string;
  successCriteria: string;
  priority: string;
  scopeType?: string;
  scopeId?: string;
  horizonStart?: string;
  horizonEnd?: string;
  ownerPartyId?: string;
};

const currentSelect = `
SELECT o.id,
       o.objective_ref AS objectiveRef,
       o.framework_id AS frameworkId,
       o.framework_version_no AS frameworkVersionNo,
       o.owner_party_id AS ownerPartyId,
       o.status,
       o.aggregate_version AS aggregateVersion,
       o.current_version_no AS currentVersionNo,
       v.statement,
       v.success_criteria AS successCriteria,
       v.priority,
       v.scope_type AS scopeType,
       v.scope_id AS scopeId,
       v.horizon_start AS horizonStart,
       v.horizon_end AS horizonEnd,
       o.updated_at AS updatedAt
  FROM strategic_objectives o
  JOIN strategic_objective_versions v
    ON v.objective_id = o.id
   AND v.version_no = o.current_version_no
   AND v.tenant_id = o.tenant_id`;

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
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function priority(value: string) {
  const clean = code(value, 'Objective priority', 32);
  if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(clean)) {
    throw new Error('Objective priority must be CRITICAL, HIGH, MEDIUM or LOW.');
  }
  return clean;
}

function scope(scopeType?: string, scopeId?: string) {
  const type = scopeType?.trim() ? code(scopeType, 'Objective scope type', 64) : null;
  const id = scopeId?.trim() || null;
  if (Boolean(type) !== Boolean(id))
    throw new Error('Objective scope type and scope ID must be supplied together.');
  return { scopeType: type, scopeId: id };
}

function horizon(start?: string, end?: string) {
  const parse = (value: string | undefined, label: string) => {
    const clean = value?.trim();
    if (!clean) return null;
    const parsed = new Date(clean);
    if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
    return parsed.toISOString();
  };
  const horizonStart = parse(start, 'Objective horizon start');
  const horizonEnd = parse(end, 'Objective horizon end');
  if (horizonStart && horizonEnd && horizonEnd <= horizonStart)
    throw new Error('Objective horizon end must be later than start.');
  return { horizonStart, horizonEnd };
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Objective owner Party not found.');
}

async function assertPublishedFrameworkVersion(
  context: CommandContext,
  frameworkId: string,
  frameworkVersionNo: number,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT v.id FROM strategy_framework_versions v JOIN strategy_frameworks f ON f.id = v.framework_id WHERE v.framework_id = ? AND v.version_no = ? AND v.status = 'PUBLISHED' AND f.tenant_id = ?",
    [frameworkId, frameworkVersionNo, context.tenantId],
    executor
  );
  if (!row)
    throw new Error(
      'Strategic Objective must reference an exact published Strategy Framework version.'
    );
}

async function getObjective(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & StrategicObjective>(
    currentSelect + ' WHERE o.id = ? AND o.tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Strategic Objective not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  objective: StrategicObjective,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-OBJECTIVE',
      objectType: 'strategic_objective',
      objectId: objective.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-OBJECTIVE',
      aggregateType: 'StrategicObjective',
      aggregateObjectId: objective.id,
      aggregateVersion: objective.aggregateVersion,
      eventType,
      topic: 'nublox.strategy.objective',
      payload
    },
    executor
  );
}

export async function listStrategicObjectives(context: CommandContext, frameworkId?: string) {
  assertPermission(context, 'strategy.objective.read');
  const clause = frameworkId
    ? ' WHERE o.tenant_id = ? AND o.framework_id = ?'
    : ' WHERE o.tenant_id = ?';
  const params = frameworkId ? [context.tenantId, frameworkId] : [context.tenantId];
  return queryRows<RowDataPacket & StrategicObjective>(
    currentSelect +
      clause +
      ' ORDER BY FIELD(v.priority, "CRITICAL","HIGH","MEDIUM","LOW"), o.updated_at DESC',
    params
  );
}

export async function getStrategicObjective(context: CommandContext, id: string) {
  assertPermission(context, 'strategy.objective.read');
  return getObjective(context, id);
}

export async function searchStrategicObjectives(
  context: CommandContext,
  query: string,
  requestedLimit = 25
) {
  assertPermission(context, 'strategy.objective.read');
  const needle = query.trim().slice(0, 191);
  if (!needle) return [] as StrategicObjective[];
  const pattern = '%' + needle + '%';
  const limit = Math.max(1, Math.min(50, Math.floor(requestedLimit)));
  return queryRows<RowDataPacket & StrategicObjective>(
    currentSelect +
      ' WHERE o.tenant_id = ? AND (o.objective_ref LIKE ? OR v.statement LIKE ? OR v.success_criteria LIKE ? OR v.priority LIKE ?) ORDER BY o.updated_at DESC LIMIT ' +
      limit,
    [context.tenantId, pattern, pattern, pattern, pattern]
  );
}

export async function listStrategicObjectiveVersions(context: CommandContext, objectiveId: string) {
  assertPermission(context, 'strategy.objective.read');
  await getObjective(context, objectiveId);
  return queryRows<RowDataPacket & StrategicObjectiveVersion>(
    'SELECT id, objective_id AS objectiveId, version_no AS versionNo, statement, success_criteria AS successCriteria, priority, scope_type AS scopeType, scope_id AS scopeId, horizon_start AS horizonStart, horizon_end AS horizonEnd, owner_party_id AS ownerPartyId, lifecycle_status AS lifecycleStatus, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM strategic_objective_versions WHERE tenant_id = ? AND objective_id = ? ORDER BY version_no DESC',
    [context.tenantId, objectiveId]
  );
}

export async function createStrategicObjective(
  context: CommandContext,
  input: StrategicObjectiveInput
) {
  assertPermission(context, 'strategy.objective.manage');
  const objectiveRef = code(input.objectiveRef, 'Objective reference');
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const scoped = scope(input.scopeType, input.scopeId);
  const dates = horizon(input.horizonStart, input.horizonEnd);
  const objectivePriority = priority(input.priority);

  return dbTransaction(async (connection) => {
    await assertPublishedFrameworkVersion(
      context,
      input.frameworkId,
      input.frameworkVersionNo,
      connection
    );
    await assertParty(context, ownerPartyId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO strategic_objectives (id, tenant_id, objective_ref, framework_id, framework_version_no, owner_party_id, status, aggregate_version, current_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'PROPOSED', 1, 1, ?, ?)",
      [
        id,
        context.tenantId,
        objectiveRef,
        input.frameworkId,
        input.frameworkVersionNo,
        ownerPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    await executeMutation(
      "INSERT INTO strategic_objective_versions (id, tenant_id, objective_id, version_no, statement, success_criteria, priority, scope_type, scope_id, horizon_start, horizon_end, owner_party_id, lifecycle_status, created_by_party_id, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', ?, ?)",
      [
        randomUUID(),
        context.tenantId,
        id,
        required(input.statement, 'Objective statement'),
        required(input.successCriteria, 'Objective success criteria'),
        objectivePriority,
        scoped.scopeType,
        scoped.scopeId,
        dates.horizonStart,
        dates.horizonEnd,
        ownerPartyId,
        context.actorPartyId,
        timestamp
      ],
      connection
    );
    const created = await getObjective(context, id, connection);
    await evidence(
      context,
      created,
      'STRATEGIC_OBJECTIVE_PROPOSED',
      null,
      'PROPOSED',
      {
        objectiveRef,
        frameworkId: input.frameworkId,
        frameworkVersionNo: input.frameworkVersionNo
      },
      connection
    );
    return id;
  });
}

export async function reviseStrategicObjective(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: Omit<StrategicObjectiveInput, 'objectiveRef' | 'frameworkId' | 'frameworkVersionNo'>
) {
  assertPermission(context, 'strategy.objective.manage');
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const scoped = scope(input.scopeType, input.scopeId);
  const dates = horizon(input.horizonStart, input.horizonEnd);
  const objectivePriority = priority(input.priority);

  return dbTransaction(async (connection) => {
    const current = await getObjective(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Strategic Objective changed after you opened it.');
    if (!['PROPOSED'].includes(current.status))
      throw new Error('Only proposed Strategic Objectives can be revised.');
    await assertParty(context, ownerPartyId, connection);
    const nextVersionNo = current.currentVersionNo + 1;
    const timestamp = now();
    await executeMutation(
      "INSERT INTO strategic_objective_versions (id, tenant_id, objective_id, version_no, statement, success_criteria, priority, scope_type, scope_id, horizon_start, horizon_end, owner_party_id, lifecycle_status, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', ?, ?)",
      [
        randomUUID(),
        context.tenantId,
        current.id,
        nextVersionNo,
        required(input.statement, 'Objective statement'),
        required(input.successCriteria, 'Objective success criteria'),
        objectivePriority,
        scoped.scopeType,
        scoped.scopeId,
        dates.horizonStart,
        dates.horizonEnd,
        ownerPartyId,
        context.actorPartyId,
        timestamp
      ],
      connection
    );
    const result = await executeMutation(
      'UPDATE strategic_objectives SET owner_party_id = ?, aggregate_version = aggregate_version + 1, current_version_no = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [
        ownerPartyId,
        nextVersionNo,
        timestamp,
        current.id,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Strategic Objective change detected.');
    const updated = await getObjective(context, current.id, connection);
    await evidence(
      context,
      updated,
      'STRATEGIC_OBJECTIVE_REVISED',
      current.status,
      current.status,
      { versionNo: nextVersionNo },
      connection
    );
  });
}

export async function transitionStrategicObjective(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  action: 'APPROVE' | 'ACTIVATE' | 'ACHIEVE' | 'MISS' | 'SUPERSEDE' | 'RETIRE'
) {
  assertPermission(context, 'strategy.objective.approve');
  const transitions: Record<string, { from: string[]; to: string; event: string }> = {
    APPROVE: { from: ['PROPOSED'], to: 'APPROVED', event: 'STRATEGIC_OBJECTIVE_APPROVED' },
    ACTIVATE: { from: ['APPROVED'], to: 'ACTIVE', event: 'STRATEGIC_OBJECTIVE_ACTIVATED' },
    ACHIEVE: { from: ['ACTIVE'], to: 'ACHIEVED', event: 'STRATEGIC_OBJECTIVE_ACHIEVED' },
    MISS: { from: ['ACTIVE'], to: 'NOT_ACHIEVED', event: 'STRATEGIC_OBJECTIVE_NOT_ACHIEVED' },
    SUPERSEDE: {
      from: ['PROPOSED', 'APPROVED', 'ACTIVE'],
      to: 'SUPERSEDED',
      event: 'STRATEGIC_OBJECTIVE_SUPERSEDED'
    },
    RETIRE: {
      from: ['APPROVED', 'ACTIVE', 'ACHIEVED', 'NOT_ACHIEVED', 'SUPERSEDED'],
      to: 'RETIRED',
      event: 'STRATEGIC_OBJECTIVE_RETIRED'
    }
  };
  const transition = transitions[action];
  if (!transition) throw new Error('Unsupported Strategic Objective transition.');

  return dbTransaction(async (connection) => {
    const current = await getObjective(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Strategic Objective changed after you opened it.');
    if (!transition.from.includes(current.status))
      throw new Error(
        'Strategic Objective cannot transition from ' + current.status + ' using ' + action + '.'
      );
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE strategic_objectives SET status = ?, aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [transition.to, timestamp, current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Strategic Objective transition detected.');
    await executeMutation(
      'UPDATE strategic_objective_versions SET lifecycle_status = ? WHERE objective_id = ? AND version_no = ?',
      [transition.to, current.id, current.currentVersionNo],
      connection
    );
    const updated = await getObjective(context, current.id, connection);
    await evidence(
      context,
      updated,
      transition.event,
      current.status,
      transition.to,
      { versionNo: current.currentVersionNo },
      connection
    );
  });
}
