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
import { assertWorkDecisionReference } from '$lib/server/work-decision';

export type PerformanceScorecard = {
  id: string;
  scorecardRef: string;
  name: string;
  scopeType: string;
  scopeId: string;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  updatedAt: string;
};

export type PerformanceScorecardNode = {
  id: string;
  parentNodeId: string | null;
  nodeKey: string;
  name: string;
  sortOrder: number;
};

export type PerformanceScorecardKpi = {
  nodeId: string;
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  kpiVersionNo: number;
  weight: string | null;
  sortOrder: number;
};

export type PerformanceSnapshot = {
  id: string;
  snapshotRef: string;
  scopeType: string;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  asOfAt: string;
  calculationRules: Record<string, unknown>;
  qualityStatus: string;
  completenessPercent: string;
  status: string;
  aggregateVersion: number;
  reviewDecisionId: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  supersedesSnapshotId: string | null;
  updatedAt: string;
};

export type PerformanceSnapshotItem = {
  id: string;
  kpiId: string;
  kpiCode: string;
  kpiName: string;
  kpiVersionNo: number;
  observationId: string | null;
  targetId: string | null;
  actualValue: string | null;
  targetValue: string | null;
  varianceValue: string | null;
  variancePercent: string | null;
  performanceStatus: string;
  sourceQualityStatus: string;
};

export type PerformanceBenchmarkBasis = {
  targetId: string;
  targetRef: string;
  kpiId: string;
  benchmarkType: string;
  sourceReference: string;
  sourceAsOf: string;
  comparatorScope: string;
  benchmarkValue: string;
  evidenceItemId: string | null;
  approvalDecisionId: string | null;
  status: string;
};

export type PerformanceBenefit = {
  targetId: string;
  targetRef: string;
  kpiId: string;
  kpiVersionNo: number;
  benefitType: string;
  transformationSubjectType: string;
  transformationSubjectId: string;
  benefitOwnerPartyId: string;
  valueCategory: string;
  baselineId: string;
  benefitStatement: string;
  targetValue: string;
  targetStatus: string;
};

export type PerformanceBenefitValidation = {
  id: string;
  targetId: string;
  observationId: string;
  validationStatus: string;
  realisedValue: string;
  evidenceItemId: string | null;
  validationNote: string;
  validatedByPartyId: string;
  validatedAt: string;
};

const scorecardSelect =
  'SELECT id, scorecard_ref AS scorecardRef, name, scope_type AS scopeType, scope_id AS scopeId, owner_party_id AS ownerPartyId, status, aggregate_version AS aggregateVersion, updated_at AS updatedAt FROM performance_scorecards';

const snapshotSelect =
  'SELECT id, snapshot_ref AS snapshotRef, scope_type AS scopeType, scope_id AS scopeId, period_start AS periodStart, period_end AS periodEnd, as_of_at AS asOfAt, calculation_rules_json AS calculationRules, quality_status AS qualityStatus, completeness_percent AS completenessPercent, status, aggregate_version AS aggregateVersion, review_decision_id AS reviewDecisionId, reviewed_at AS reviewedAt, published_at AS publishedAt, supersedes_snapshot_id AS supersedesSnapshotId, updated_at AS updatedAt FROM performance_snapshots';

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

function dateRange(start: string, end: string, label: string) {
  const startDate = new Date(required(start, label + ' start'));
  const endDate = new Date(required(end, label + ' end'));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error(label + ' dates are invalid.');
  }
  if (endDate <= startDate) throw new Error(label + ' end must be later than start.');
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

function instant(value: string | undefined, label: string, fallback = now()) {
  if (!value?.trim()) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active tenant Party not found.');
}

async function assertEvidenceItem(
  context: CommandContext,
  evidenceItemId: string,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM evidence_items WHERE id = ? AND tenant_id = ?',
    [evidenceItemId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Evidence Item not found.');
}

async function getScorecard(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & PerformanceScorecard>(
    scorecardSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Performance Scorecard not found.');
  return row;
}

async function getSnapshot(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & PerformanceSnapshot>(
    snapshotSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Performance Snapshot not found.');
  return row;
}

async function performanceEvidence(
  context: CommandContext,
  objectType: string,
  objectId: string,
  aggregateVersion: number,
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
      objectType,
      objectId,
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
      aggregateType: objectType,
      aggregateObjectId: objectId,
      aggregateVersion,
      eventType,
      topic: 'nublox.enterprise.performance',
      payload
    },
    executor
  );
}

export async function listPerformanceScorecards(context: CommandContext) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceScorecard>(
    scorecardSelect + ' WHERE tenant_id = ? ORDER BY scorecard_ref',
    [context.tenantId]
  );
}

export async function listPerformanceScorecardNodes(context: CommandContext, scorecardId: string) {
  assertPermission(context, 'performance.enterprise.read');
  await getScorecard(context, scorecardId);
  return queryRows<RowDataPacket & PerformanceScorecardNode>(
    'SELECT id, parent_node_id AS parentNodeId, node_key AS nodeKey, name, sort_order AS sortOrder FROM performance_scorecard_nodes WHERE scorecard_id = ? ORDER BY sort_order, node_key',
    [scorecardId]
  );
}

export async function listPerformanceScorecardKpis(context: CommandContext, scorecardId: string) {
  assertPermission(context, 'performance.enterprise.read');
  await getScorecard(context, scorecardId);
  return queryRows<RowDataPacket & PerformanceScorecardKpi>(
    'SELECT m.node_id AS nodeId, m.kpi_id AS kpiId, k.kpi_code AS kpiCode, k.name AS kpiName, m.kpi_version_no AS kpiVersionNo, m.weight, m.sort_order AS sortOrder FROM performance_scorecard_kpis m JOIN performance_kpis k ON k.id = m.kpi_id WHERE m.scorecard_id = ? AND k.tenant_id = ? ORDER BY m.sort_order, k.kpi_code',
    [scorecardId, context.tenantId]
  );
}

export async function createPerformanceScorecard(
  context: CommandContext,
  input: {
    scorecardRef: string;
    name: string;
    scopeType: string;
    scopeId: string;
    ownerPartyId?: string;
    nodes: Array<{
      nodeKey: string;
      name: string;
      parentNodeKey?: string;
      sortOrder?: number;
      kpis?: Array<{
        kpiId: string;
        kpiVersionNo: number;
        weight?: number;
        sortOrder?: number;
      }>;
    }>;
  }
) {
  assertPermission(context, 'performance.framework.manage');
  if (!input.nodes.length)
    throw new Error('Performance Scorecard requires at least one hierarchy node.');

  return dbTransaction(async (connection) => {
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const id = randomUUID();
    const timestamp = now();

    await executeMutation(
      "INSERT INTO performance_scorecards (id, tenant_id, scorecard_ref, name, scope_type, scope_id, owner_party_id, status, aggregate_version, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, ?, ?, ?)",
      [
        id,
        context.tenantId,
        code(input.scorecardRef, 'Scorecard reference'),
        required(input.name, 'Scorecard name'),
        code(input.scopeType, 'Scorecard scope type', 64),
        required(input.scopeId, 'Scorecard scope ID'),
        ownerPartyId,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    const nodeIds = new Map<string, string>();
    for (const node of input.nodes) {
      const nodeKey = code(node.nodeKey, 'Scorecard node key');
      if (nodeIds.has(nodeKey)) throw new Error('Scorecard node keys must be unique.');
      nodeIds.set(nodeKey, randomUUID());
    }

    for (const node of input.nodes) {
      const nodeKey = code(node.nodeKey, 'Scorecard node key');
      const parentKey = node.parentNodeKey?.trim()
        ? code(node.parentNodeKey, 'Parent scorecard node key')
        : null;
      const parentId = parentKey ? nodeIds.get(parentKey) : null;
      if (parentKey && !parentId) throw new Error('Parent scorecard node was not found.');

      await executeMutation(
        'INSERT INTO performance_scorecard_nodes (id, scorecard_id, parent_node_id, node_key, name, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [
          nodeIds.get(nodeKey),
          id,
          parentId ?? null,
          nodeKey,
          required(node.name, 'Scorecard node name'),
          Number.isInteger(node.sortOrder) ? node.sortOrder : 0
        ],
        connection
      );
    }

    for (const node of input.nodes) {
      const nodeId = nodeIds.get(code(node.nodeKey, 'Scorecard node key'))!;
      for (const mapping of node.kpis ?? []) {
        if (!Number.isInteger(mapping.kpiVersionNo) || mapping.kpiVersionNo < 1) {
          throw new Error('Scorecard KPI version must be a positive whole number.');
        }
        if (mapping.weight != null && (!Number.isFinite(mapping.weight) || mapping.weight < 0)) {
          throw new Error('Scorecard KPI weight must be a non-negative number.');
        }
        const kpi = await queryOne<RowDataPacket & { id: string }>(
          "SELECT k.id FROM performance_kpis k JOIN performance_kpi_versions v ON v.kpi_id = k.id AND v.version_no = ? WHERE k.id = ? AND k.tenant_id = ? AND v.lifecycle_status IN ('PUBLISHED','EFFECTIVE')",
          [mapping.kpiVersionNo, mapping.kpiId, context.tenantId],
          connection
        );
        if (!kpi) {
          throw new Error('Scorecard KPI must reference a published or effective KPI version.');
        }
        await executeMutation(
          'INSERT INTO performance_scorecard_kpis (scorecard_id, node_id, kpi_id, kpi_version_no, weight, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [
            id,
            nodeId,
            mapping.kpiId,
            mapping.kpiVersionNo,
            mapping.weight ?? null,
            Number.isInteger(mapping.sortOrder) ? mapping.sortOrder : 0
          ],
          connection
        );
      }
    }

    await performanceEvidence(
      context,
      'PerformanceScorecard',
      id,
      1,
      'PERFORMANCE_SCORECARD_CREATED',
      null,
      'DRAFT',
      { nodeCount: input.nodes.length },
      connection
    );
    return id;
  });
}

export async function publishPerformanceScorecard(
  context: CommandContext,
  scorecardId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'performance.framework.manage');
  return dbTransaction(async (connection) => {
    const scorecard = await getScorecard(context, scorecardId, connection, true);
    if (scorecard.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Performance Scorecard changed after you opened it.');
    }
    if (scorecard.status !== 'DRAFT') {
      throw new Error('Only a draft Performance Scorecard can be published.');
    }
    const count = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM performance_scorecard_kpis WHERE scorecard_id = ?',
      [scorecard.id],
      connection
    );
    if (Number(count?.count ?? 0) < 1) {
      throw new Error('Performance Scorecard requires at least one KPI before publication.');
    }

    const result = await executeMutation(
      "UPDATE performance_scorecards SET status = 'PUBLISHED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), scorecard.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Performance Scorecard change detected.');
    const updated = await getScorecard(context, scorecard.id, connection);
    await performanceEvidence(
      context,
      'PerformanceScorecard',
      scorecard.id,
      updated.aggregateVersion,
      'PERFORMANCE_SCORECARD_PUBLISHED',
      'DRAFT',
      'PUBLISHED',
      {},
      connection
    );
  });
}

export async function listPerformanceSnapshots(context: CommandContext) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceSnapshot>(
    snapshotSelect + ' WHERE tenant_id = ? ORDER BY period_end DESC, as_of_at DESC, snapshot_ref',
    [context.tenantId]
  );
}

export async function listPerformanceSnapshotItems(context: CommandContext, snapshotId: string) {
  assertPermission(context, 'performance.enterprise.read');
  await getSnapshot(context, snapshotId);
  return queryRows<RowDataPacket & PerformanceSnapshotItem>(
    'SELECT i.id, i.kpi_id AS kpiId, k.kpi_code AS kpiCode, k.name AS kpiName, i.kpi_version_no AS kpiVersionNo, i.observation_id AS observationId, i.target_id AS targetId, i.actual_value AS actualValue, i.target_value AS targetValue, i.variance_value AS varianceValue, i.variance_percent AS variancePercent, i.performance_status AS performanceStatus, i.source_quality_status AS sourceQualityStatus FROM performance_snapshot_items i JOIN performance_kpis k ON k.id = i.kpi_id WHERE i.snapshot_id = ? AND k.tenant_id = ? ORDER BY k.kpi_code',
    [snapshotId, context.tenantId]
  );
}

type SnapshotKpi = RowDataPacket & {
  id: string;
  versionNo: number;
  comparisonOperator: string | null;
  targetId: string | null;
  targetValue: string | null;
  observationId: string | null;
  actualValue: string | null;
  qualityStatus: string | null;
};

export async function calculatePerformanceSnapshot(
  context: CommandContext,
  input: {
    snapshotRef: string;
    scorecardId?: string;
    scopeType: string;
    scopeId: string;
    periodStart: string;
    periodEnd: string;
    asOfAt?: string;
  }
) {
  assertPermission(context, 'performance.reporting.manage');
  const period = dateRange(input.periodStart, input.periodEnd, 'Snapshot period');
  const scopeType = code(input.scopeType, 'Snapshot scope type', 64);
  const scopeId = required(input.scopeId, 'Snapshot scope ID');
  const asOfAt = instant(input.asOfAt, 'Snapshot as-of');

  return dbTransaction(async (connection) => {
    let kpis: Array<RowDataPacket & { id: string; versionNo: number }>;
    if (input.scorecardId?.trim()) {
      const scorecard = await getScorecard(context, input.scorecardId.trim(), connection);
      if (scorecard.status !== 'PUBLISHED') {
        throw new Error('Performance Snapshot scorecard must be published.');
      }
      kpis = await queryRows<RowDataPacket & { id: string; versionNo: number }>(
        'SELECT DISTINCT m.kpi_id AS id, m.kpi_version_no AS versionNo FROM performance_scorecard_kpis m JOIN performance_kpis k ON k.id = m.kpi_id WHERE m.scorecard_id = ? AND k.tenant_id = ? ORDER BY m.kpi_id',
        [scorecard.id, context.tenantId],
        connection
      );
    } else {
      kpis = await queryRows<RowDataPacket & { id: string; versionNo: number }>(
        "SELECT id, current_version_no AS versionNo FROM performance_kpis WHERE tenant_id = ? AND status = 'EFFECTIVE' ORDER BY kpi_code",
        [context.tenantId],
        connection
      );
    }
    if (!kpis.length) throw new Error('Performance Snapshot requires at least one governed KPI.');

    const resolved: SnapshotKpi[] = [];
    for (const kpi of kpis) {
      const target = await queryOne<
        RowDataPacket & { id: string; targetValue: string; comparisonOperator: string }
      >(
        "SELECT id, target_value AS targetValue, comparison_operator AS comparisonOperator FROM performance_targets WHERE tenant_id = ? AND kpi_id = ? AND kpi_version_no = ? AND scope_type = ? AND scope_id = ? AND status = 'ACTIVE' AND period_start <= ? AND period_end >= ? ORDER BY updated_at DESC, id DESC LIMIT 1",
        [context.tenantId, kpi.id, kpi.versionNo, scopeType, scopeId, period.start, period.end],
        connection
      );
      const observation = await queryOne<
        RowDataPacket & {
          id: string;
          actualValue: string;
          qualityStatus: string;
        }
      >(
        "SELECT id, numeric_value AS actualValue, quality_status AS qualityStatus FROM performance_observations WHERE tenant_id = ? AND kpi_id = ? AND kpi_version_no = ? AND subject_type = ? AND subject_id = ? AND quality_status = 'VALIDATED' AND period_start <= ? AND period_end >= ? AND observed_at <= ? ORDER BY observed_at DESC, created_at DESC LIMIT 1",
        [
          context.tenantId,
          kpi.id,
          kpi.versionNo,
          scopeType,
          scopeId,
          period.start,
          period.end,
          asOfAt
        ],
        connection
      );

      resolved.push({
        id: kpi.id,
        versionNo: kpi.versionNo,
        targetId: target?.id ?? null,
        targetValue: target?.targetValue ?? null,
        comparisonOperator: target?.comparisonOperator ?? null,
        observationId: observation?.id ?? null,
        actualValue: observation?.actualValue ?? null,
        qualityStatus: observation?.qualityStatus ?? null
      } as SnapshotKpi);
    }

    const completeCount = resolved.filter((item) => item.observationId).length;
    const completeness = (completeCount / resolved.length) * 100;
    const qualityStatus =
      completeCount === resolved.length ? 'COMPLETE' : completeCount === 0 ? 'NO_DATA' : 'PARTIAL';

    const id = randomUUID();
    const timestamp = now();
    const rules = {
      method: 'LATEST_VALIDATED_OBSERVATION_AND_ACTIVE_TARGET',
      scorecardId: input.scorecardId?.trim() || null,
      asOfAt,
      periodStart: period.start,
      periodEnd: period.end
    };

    await executeMutation(
      "INSERT INTO performance_snapshots (id, tenant_id, snapshot_ref, scope_type, scope_id, period_start, period_end, as_of_at, calculation_rules_json, quality_status, completeness_percent, status, aggregate_version, review_decision_id, reviewed_at, published_at, supersedes_snapshot_id, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CALCULATED', 1, NULL, NULL, NULL, NULL, ?, ?, ?)",
      [
        id,
        context.tenantId,
        code(input.snapshotRef, 'Snapshot reference'),
        scopeType,
        scopeId,
        period.start,
        period.end,
        asOfAt,
        JSON.stringify(rules),
        qualityStatus,
        completeness,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    for (const item of resolved) {
      let variance: number | null = null;
      let variancePercent: number | null = null;
      let performanceStatus = 'INCOMPLETE';

      if (item.actualValue != null && item.targetValue == null) {
        performanceStatus = 'OBSERVED';
      } else if (item.actualValue != null && item.targetValue != null) {
        const actual = Number(item.actualValue);
        const target = Number(item.targetValue);
        variance = actual - target;
        variancePercent = target === 0 ? null : (variance / Math.abs(target)) * 100;
        const onTarget =
          item.comparisonOperator === 'GREATER_EQUAL'
            ? actual >= target
            : item.comparisonOperator === 'LESS_EQUAL'
              ? actual <= target
              : actual === target;
        performanceStatus = onTarget ? 'ON_TARGET' : 'OFF_TARGET';
      } else if (item.actualValue == null) {
        performanceStatus = 'MISSING';
      }

      await executeMutation(
        'INSERT INTO performance_snapshot_items (id, snapshot_id, kpi_id, kpi_version_no, observation_id, target_id, actual_value, target_value, variance_value, variance_percent, performance_status, source_quality_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          randomUUID(),
          id,
          item.id,
          item.versionNo,
          item.observationId,
          item.targetId,
          item.actualValue,
          item.targetValue,
          variance,
          variancePercent,
          performanceStatus,
          item.qualityStatus ?? 'MISSING'
        ],
        connection
      );
    }

    await performanceEvidence(
      context,
      'PerformanceSnapshot',
      id,
      1,
      'PERFORMANCE_SNAPSHOT_CALCULATED',
      null,
      'CALCULATED',
      {
        scopeType,
        scopeId,
        periodStart: period.start,
        periodEnd: period.end,
        kpiCount: resolved.length,
        completenessPercent: completeness,
        qualityStatus
      },
      connection
    );
    return id;
  });
}

export async function reviewPerformanceSnapshot(
  context: CommandContext,
  snapshotId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'performance.reporting.manage');
  return dbTransaction(async (connection) => {
    const snapshot = await getSnapshot(context, snapshotId, connection, true);
    if (snapshot.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Performance Snapshot changed after you opened it.');
    }
    if (snapshot.status !== 'CALCULATED') {
      throw new Error('Only a calculated Performance Snapshot can enter review.');
    }
    if (snapshot.qualityStatus === 'NO_DATA') {
      throw new Error('A Performance Snapshot with no validated observations cannot be reviewed.');
    }
    const timestamp = now();
    const result = await executeMutation(
      "UPDATE performance_snapshots SET status = 'REVIEWED', aggregate_version = aggregate_version + 1, reviewed_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [timestamp, timestamp, snapshot.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Performance Snapshot change detected.');
    const updated = await getSnapshot(context, snapshot.id, connection);
    await performanceEvidence(
      context,
      'PerformanceSnapshot',
      snapshot.id,
      updated.aggregateVersion,
      'PERFORMANCE_SNAPSHOT_REVIEWED',
      'CALCULATED',
      'REVIEWED',
      { qualityStatus: snapshot.qualityStatus },
      connection
    );
  });
}

export async function publishPerformanceSnapshot(
  context: CommandContext,
  snapshotId: string,
  expectedAggregateVersion: number,
  decisionId: string
) {
  assertPermission(context, 'performance.reporting.publish');
  return dbTransaction(async (connection) => {
    const snapshot = await getSnapshot(context, snapshotId, connection, true);
    if (snapshot.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Performance Snapshot changed after you opened it.');
    }
    if (snapshot.status !== 'REVIEWED') {
      throw new Error('Only a reviewed Performance Snapshot can be published.');
    }

    const decision = await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'PERFORMANCE_SNAPSHOT_REVIEW',
        subjectType: 'PERFORMANCE_SNAPSHOT',
        subjectId: snapshot.id,
        subjectVersion: String(expectedAggregateVersion),
        outcome: 'APPROVED'
      },
      connection
    );

    const previous = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM performance_snapshots WHERE tenant_id = ? AND scope_type = ? AND scope_id = ? AND period_start = ? AND period_end = ? AND status = 'PUBLISHED' AND id <> ? ORDER BY published_at DESC LIMIT 1 FOR UPDATE",
      [
        context.tenantId,
        snapshot.scopeType,
        snapshot.scopeId,
        snapshot.periodStart,
        snapshot.periodEnd,
        snapshot.id
      ],
      connection
    );
    if (previous) {
      await executeMutation(
        "UPDATE performance_snapshots SET status = 'SUPERSEDED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND status = 'PUBLISHED'",
        [now(), previous.id, context.tenantId],
        connection
      );
    }

    const timestamp = now();
    const result = await executeMutation(
      "UPDATE performance_snapshots SET status = 'PUBLISHED', aggregate_version = aggregate_version + 1, review_decision_id = ?, published_at = ?, supersedes_snapshot_id = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [
        decision.id,
        timestamp,
        previous?.id ?? null,
        timestamp,
        snapshot.id,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Performance Snapshot publication detected.');
    const updated = await getSnapshot(context, snapshot.id, connection);
    await performanceEvidence(
      context,
      'PerformanceSnapshot',
      snapshot.id,
      updated.aggregateVersion,
      'PERFORMANCE_SNAPSHOT_PUBLISHED',
      'REVIEWED',
      'PUBLISHED',
      { decisionId: decision.id, supersedesSnapshotId: previous?.id ?? null },
      connection
    );
  });
}

export async function distributePerformanceSnapshot(
  context: CommandContext,
  snapshotId: string,
  input: { recipientPartyId: string; channel: string; distributionReference?: string }
) {
  assertPermission(context, 'performance.reporting.publish');
  return dbTransaction(async (connection) => {
    const snapshot = await getSnapshot(context, snapshotId, connection);
    if (snapshot.status !== 'PUBLISHED') {
      throw new Error('Only a published Performance Snapshot can be distributed.');
    }
    await assertActiveParty(context, input.recipientPartyId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      'INSERT INTO performance_snapshot_distributions (id, snapshot_id, recipient_party_id, channel, distribution_reference, distributed_by_party_id, distributed_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        snapshot.id,
        input.recipientPartyId,
        code(input.channel, 'Distribution channel', 64),
        input.distributionReference?.trim() || null,
        context.actorPartyId,
        timestamp
      ],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        objectType: 'performance_snapshot',
        objectId: snapshot.id,
        action: 'PERFORMANCE_SNAPSHOT_DISTRIBUTED'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        aggregateType: 'PerformanceSnapshot',
        aggregateObjectId: snapshot.id,
        aggregateVersion: snapshot.aggregateVersion,
        eventType: 'PERFORMANCE_SNAPSHOT_DISTRIBUTED',
        topic: 'nublox.enterprise.performance',
        payload: {
          recipientPartyId: input.recipientPartyId,
          channel: code(input.channel, 'Distribution channel', 64)
        }
      },
      connection
    );
    return id;
  });
}

export async function listPerformanceBenchmarkBases(context: CommandContext) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceBenchmarkBasis>(
    'SELECT b.target_id AS targetId, t.target_ref AS targetRef, t.kpi_id AS kpiId, b.benchmark_type AS benchmarkType, b.source_reference AS sourceReference, b.source_as_of AS sourceAsOf, b.comparator_scope AS comparatorScope, b.benchmark_value AS benchmarkValue, b.evidence_item_id AS evidenceItemId, b.approval_decision_id AS approvalDecisionId, b.status FROM performance_target_benchmark_basis b JOIN performance_targets t ON t.id = b.target_id AND t.tenant_id = b.tenant_id WHERE b.tenant_id = ? ORDER BY b.source_as_of DESC, t.target_ref',
    [context.tenantId]
  );
}

export async function attachPerformanceBenchmarkBasis(
  context: CommandContext,
  targetId: string,
  input: {
    benchmarkType: string;
    sourceReference: string;
    sourceAsOf: string;
    comparatorScope: string;
    benchmarkValue: number;
    evidenceItemId?: string;
  }
) {
  assertPermission(context, 'performance.benchmark.manage');
  if (!Number.isFinite(input.benchmarkValue)) throw new Error('Benchmark value must be numeric.');

  return dbTransaction(async (connection) => {
    const target = await queryOne<
      RowDataPacket & { id: string; status: string; targetValue: string }
    >(
      'SELECT id, status, target_value AS targetValue FROM performance_targets WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [targetId, context.tenantId],
      connection
    );
    if (!target) throw new Error('Performance Target not found.');
    if (target.status !== 'PROPOSED') {
      throw new Error('Benchmark basis can only be attached to a proposed Performance Target.');
    }
    if (input.evidenceItemId?.trim()) {
      await assertEvidenceItem(context, input.evidenceItemId.trim(), connection);
    }

    const timestamp = now();
    await executeMutation(
      "INSERT INTO performance_target_benchmark_basis (target_id, tenant_id, benchmark_type, source_reference, source_as_of, comparator_scope, benchmark_value, evidence_item_id, approval_decision_id, status, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'PROPOSED', ?, ?, ?)",
      [
        target.id,
        context.tenantId,
        code(input.benchmarkType, 'Benchmark type', 64),
        required(input.sourceReference, 'Benchmark source reference'),
        instant(input.sourceAsOf, 'Benchmark source as-of'),
        required(input.comparatorScope, 'Benchmark comparator scope'),
        input.benchmarkValue,
        input.evidenceItemId?.trim() || null,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        objectType: 'performance_target',
        objectId: target.id,
        action: 'PERFORMANCE_BENCHMARK_BASIS_ATTACHED'
      },
      connection
    );
  });
}

export async function approvePerformanceBenchmark(
  context: CommandContext,
  targetId: string,
  expectedTargetVersion: number,
  decisionId: string
) {
  assertPermission(context, 'performance.benchmark.manage');

  return dbTransaction(async (connection) => {
    const target = await queryOne<
      RowDataPacket & {
        id: string;
        status: string;
        aggregateVersion: number;
      }
    >(
      'SELECT id, status, aggregate_version AS aggregateVersion FROM performance_targets WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [targetId, context.tenantId],
      connection
    );
    if (!target) throw new Error('Performance Target not found.');
    if (target.aggregateVersion !== expectedTargetVersion) {
      throw new Error('This Performance Target changed after you opened it.');
    }
    if (target.status !== 'PROPOSED') {
      throw new Error('Only a proposed benchmark Performance Target can be approved.');
    }

    const basis = await queryOne<RowDataPacket & { status: string }>(
      'SELECT status FROM performance_target_benchmark_basis WHERE target_id = ? AND tenant_id = ? FOR UPDATE',
      [targetId, context.tenantId],
      connection
    );
    if (!basis || basis.status !== 'PROPOSED') {
      throw new Error('Proposed benchmark basis was not found.');
    }

    const decision = await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'PERFORMANCE_BENCHMARK_APPROVAL',
        subjectType: 'PERFORMANCE_TARGET',
        subjectId: target.id,
        subjectVersion: String(expectedTargetVersion),
        outcome: 'APPROVED'
      },
      connection
    );

    const timestamp = now();
    await executeMutation(
      "UPDATE performance_target_benchmark_basis SET status = 'APPROVED', approval_decision_id = ?, updated_at = ? WHERE target_id = ? AND tenant_id = ? AND status = 'PROPOSED'",
      [decision.id, timestamp, target.id, context.tenantId],
      connection
    );
    const result = await executeMutation(
      "UPDATE performance_targets SET status = 'APPROVED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [timestamp, target.id, context.tenantId, expectedTargetVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent benchmark target approval detected.');

    await performanceEvidence(
      context,
      'PerformanceTarget',
      target.id,
      expectedTargetVersion + 1,
      'PERFORMANCE_BENCHMARK_APPROVED',
      'PROPOSED',
      'APPROVED',
      { decisionId: decision.id },
      connection
    );
  });
}

export async function listPerformanceBenefits(context: CommandContext) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceBenefit>(
    'SELECT p.target_id AS targetId, t.target_ref AS targetRef, t.kpi_id AS kpiId, t.kpi_version_no AS kpiVersionNo, p.benefit_type AS benefitType, p.transformation_subject_type AS transformationSubjectType, p.transformation_subject_id AS transformationSubjectId, p.benefit_owner_party_id AS benefitOwnerPartyId, p.value_category AS valueCategory, p.baseline_id AS baselineId, p.benefit_statement AS benefitStatement, t.target_value AS targetValue, t.status AS targetStatus FROM performance_benefit_profiles p JOIN performance_targets t ON t.id = p.target_id AND t.tenant_id = p.tenant_id WHERE p.tenant_id = ? ORDER BY t.target_ref',
    [context.tenantId]
  );
}

export async function listPerformanceBenefitValidations(context: CommandContext, targetId: string) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceBenefitValidation>(
    'SELECT id, target_id AS targetId, observation_id AS observationId, validation_status AS validationStatus, realised_value AS realisedValue, evidence_item_id AS evidenceItemId, validation_note AS validationNote, validated_by_party_id AS validatedByPartyId, validated_at AS validatedAt FROM performance_benefit_validations WHERE target_id = ? ORDER BY validated_at DESC, id DESC',
    [targetId]
  );
}

export async function createPerformanceBenefitProfile(
  context: CommandContext,
  targetId: string,
  input: {
    benefitType: string;
    transformationSubjectType: string;
    transformationSubjectId: string;
    benefitOwnerPartyId?: string;
    valueCategory: string;
    baselineId: string;
    benefitStatement: string;
  }
) {
  assertPermission(context, 'performance.benefit.manage');

  return dbTransaction(async (connection) => {
    const target = await queryOne<
      RowDataPacket & {
        id: string;
        kpiId: string;
        scopeType: string;
        scopeId: string;
        status: string;
      }
    >(
      'SELECT id, kpi_id AS kpiId, scope_type AS scopeType, scope_id AS scopeId, status FROM performance_targets WHERE id = ? AND tenant_id = ?',
      [targetId, context.tenantId],
      connection
    );
    if (!target) throw new Error('Performance Target not found.');
    if (!['PROPOSED', 'APPROVED', 'ACTIVE'].includes(target.status)) {
      throw new Error('Benefit profile requires a current Performance Target.');
    }

    const baseline = await queryOne<
      RowDataPacket & { id: string; kpiId: string; scopeType: string; scopeId: string }
    >(
      "SELECT id, kpi_id AS kpiId, scope_type AS scopeType, scope_id AS scopeId FROM performance_baselines WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [input.baselineId, context.tenantId],
      connection
    );
    if (!baseline) throw new Error('Active Performance Baseline not found.');
    if (
      baseline.kpiId !== target.kpiId ||
      baseline.scopeType !== target.scopeType ||
      baseline.scopeId !== target.scopeId
    ) {
      throw new Error('Benefit baseline must match the target KPI and scope.');
    }

    const ownerPartyId = input.benefitOwnerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const timestamp = now();
    await executeMutation(
      'INSERT INTO performance_benefit_profiles (target_id, tenant_id, benefit_type, transformation_subject_type, transformation_subject_id, benefit_owner_party_id, value_category, baseline_id, benefit_statement, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        target.id,
        context.tenantId,
        code(input.benefitType, 'Benefit type', 64),
        code(input.transformationSubjectType, 'Transformation subject type', 64),
        required(input.transformationSubjectId, 'Transformation subject ID'),
        ownerPartyId,
        code(input.valueCategory, 'Benefit value category', 64),
        baseline.id,
        required(input.benefitStatement, 'Benefit statement'),
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        objectType: 'performance_target',
        objectId: target.id,
        action: 'PERFORMANCE_BENEFIT_DEFINED'
      },
      connection
    );
  });
}

export async function validatePerformanceBenefit(
  context: CommandContext,
  targetId: string,
  input: {
    observationId: string;
    validationStatus: 'REALISED' | 'PARTIAL' | 'NOT_REALISED';
    evidenceItemId?: string;
    validationNote: string;
  }
) {
  assertPermission(context, 'performance.benefit.manage');

  return dbTransaction(async (connection) => {
    const profile = await queryOne<
      RowDataPacket & {
        targetId: string;
        kpiId: string;
        scopeType: string;
        scopeId: string;
      }
    >(
      'SELECT p.target_id AS targetId, t.kpi_id AS kpiId, t.scope_type AS scopeType, t.scope_id AS scopeId FROM performance_benefit_profiles p JOIN performance_targets t ON t.id = p.target_id WHERE p.target_id = ? AND p.tenant_id = ?',
      [targetId, context.tenantId],
      connection
    );
    if (!profile) throw new Error('Performance Benefit profile not found.');

    const observation = await queryOne<
      RowDataPacket & {
        id: string;
        kpiId: string;
        subjectType: string;
        subjectId: string;
        numericValue: string;
      }
    >(
      "SELECT id, kpi_id AS kpiId, subject_type AS subjectType, subject_id AS subjectId, numeric_value AS numericValue FROM performance_observations WHERE id = ? AND tenant_id = ? AND quality_status = 'VALIDATED'",
      [input.observationId, context.tenantId],
      connection
    );
    if (!observation) throw new Error('Validated Performance Observation not found.');
    if (
      observation.kpiId !== profile.kpiId ||
      observation.subjectType !== profile.scopeType ||
      observation.subjectId !== profile.scopeId
    ) {
      throw new Error('Benefit validation observation must match the target KPI and scope.');
    }
    if (input.evidenceItemId?.trim()) {
      await assertEvidenceItem(context, input.evidenceItemId.trim(), connection);
    }

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      'INSERT INTO performance_benefit_validations (id, target_id, observation_id, validation_status, realised_value, evidence_item_id, validation_note, validated_by_party_id, validated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        targetId,
        observation.id,
        input.validationStatus,
        observation.numericValue,
        input.evidenceItemId?.trim() || null,
        required(input.validationNote, 'Benefit validation note'),
        context.actorPartyId,
        timestamp
      ],
      connection
    );

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        objectType: 'performance_target',
        objectId: targetId,
        action: 'PERFORMANCE_BENEFIT_VALIDATED',
        toState: input.validationStatus
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-02-PERFORMANCE',
        aggregateType: 'PerformanceTarget',
        aggregateObjectId: targetId,
        aggregateVersion: 1,
        eventType: 'PERFORMANCE_BENEFIT_VALIDATED',
        topic: 'nublox.enterprise.performance',
        payload: {
          validationId: id,
          observationId: observation.id,
          validationStatus: input.validationStatus,
          realisedValue: Number(observation.numericValue)
        }
      },
      connection
    );
    return id;
  });
}
