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

export type AssumptionCategory =
  | 'ECONOMIC'
  | 'MARKET'
  | 'COMPETITOR'
  | 'TECHNOLOGY'
  | 'REGULATORY'
  | 'OPPORTUNITY'
  | 'THREAT'
  | 'OTHER';

export type StrategicAssumption = {
  id: string;
  assumptionRef: string;
  category: AssumptionCategory;
  ownerPartyId: string | null;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  statement: string;
  basisSummary: string;
  evidenceItemId: string | null;
  confidencePercent: string | null;
  scopeType: string | null;
  scopeId: string | null;
  validFrom: string | null;
  validTo: string | null;
  assessmentNote: string | null;
  updatedAt: string;
};

export type StrategicAssumptionVersion = {
  id: string;
  assumptionId: string;
  versionNo: number;
  statement: string;
  basisSummary: string;
  evidenceItemId: string | null;
  confidencePercent: string | null;
  scopeType: string | null;
  scopeId: string | null;
  validFrom: string | null;
  validTo: string | null;
  lifecycleStatus: string;
  assessmentNote: string | null;
  createdByPartyId: string;
  createdAt: string;
};

export type StrategicAssumptionInput = {
  assumptionRef: string;
  category: string;
  statement: string;
  basisSummary: string;
  evidenceItemId?: string;
  confidencePercent?: number | null;
  scopeType?: string;
  scopeId?: string;
  validFrom?: string;
  validTo?: string;
  ownerPartyId?: string;
};

const currentSelect = `
SELECT a.id,
       a.assumption_ref AS assumptionRef,
       a.category,
       a.owner_party_id AS ownerPartyId,
       a.status,
       a.aggregate_version AS aggregateVersion,
       a.current_version_no AS currentVersionNo,
       v.statement,
       v.basis_summary AS basisSummary,
       v.evidence_item_id AS evidenceItemId,
       v.confidence_percent AS confidencePercent,
       v.scope_type AS scopeType,
       v.scope_id AS scopeId,
       v.valid_from AS validFrom,
       v.valid_to AS validTo,
       v.assessment_note AS assessmentNote,
       a.updated_at AS updatedAt
  FROM strategic_assumptions a
  JOIN strategic_assumption_versions v
    ON v.assumption_id = a.id
   AND v.version_no = a.current_version_no
   AND v.tenant_id = a.tenant_id`;

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

function category(value: string): AssumptionCategory {
  const clean = code(value, 'Assumption category', 64) as AssumptionCategory;
  const allowed: AssumptionCategory[] = [
    'ECONOMIC',
    'MARKET',
    'COMPETITOR',
    'TECHNOLOGY',
    'REGULATORY',
    'OPPORTUNITY',
    'THREAT',
    'OTHER'
  ];
  if (!allowed.includes(clean)) throw new Error('Unsupported Assumption category.');
  return clean;
}

function confidence(value: number | null | undefined) {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error('Assumption confidence must be between 0 and 100.');
  }
  return value;
}

function range(from?: string, to?: string) {
  const parse = (value: string | undefined, label: string) => {
    const clean = value?.trim();
    if (!clean) return null;
    const parsed = new Date(clean);
    if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
    return parsed.toISOString();
  };
  const validFrom = parse(from, 'Assumption valid-from');
  const validTo = parse(to, 'Assumption valid-to');
  if (validFrom && validTo && validTo <= validFrom) {
    throw new Error('Assumption valid-to must be later than valid-from.');
  }
  return { validFrom, validTo };
}

function scope(scopeType?: string, scopeId?: string) {
  const type = scopeType?.trim() ? code(scopeType, 'Assumption scope type', 64) : null;
  const id = scopeId?.trim() || null;
  if (Boolean(type) !== Boolean(id)) {
    throw new Error('Assumption scope type and scope ID must be supplied together.');
  }
  return { scopeType: type, scopeId: id };
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Assumption owner Party not found.');
}

async function assertEvidence(
  context: CommandContext,
  evidenceItemId: string,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM evidence_items WHERE id = ? AND tenant_id = ? AND status IN ('CAPTURED','VERIFIED')",
    [evidenceItemId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Governed Evidence Item not found.');
}

async function getAssumption(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & StrategicAssumption>(
    currentSelect + ' WHERE a.id = ? AND a.tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Strategic Assumption not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  assumption: StrategicAssumption,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-ASSUMPTION',
      objectType: 'strategic_assumption',
      objectId: assumption.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-ASSUMPTION',
      aggregateType: 'StrategicAssumption',
      aggregateObjectId: assumption.id,
      aggregateVersion: assumption.aggregateVersion,
      eventType,
      topic: 'nublox.strategy.assumption',
      payload
    },
    executor
  );
}

export async function listStrategicAssumptions(
  context: CommandContext,
  input: { category?: string; status?: string; search?: string } = {}
) {
  assertPermission(context, 'strategy.assumption.read');
  const clauses = ['a.tenant_id = ?'];
  const params: unknown[] = [context.tenantId];
  if (input.category?.trim()) {
    clauses.push('a.category = ?');
    params.push(category(input.category));
  }
  if (input.status?.trim()) {
    clauses.push('a.status = ?');
    params.push(code(input.status, 'Assumption status', 32));
  }
  if (input.search?.trim()) {
    clauses.push('(a.assumption_ref LIKE ? OR v.statement LIKE ? OR v.basis_summary LIKE ?)');
    const needle = '%' + input.search.trim() + '%';
    params.push(needle, needle, needle);
  }
  return queryRows<RowDataPacket & StrategicAssumption>(
    currentSelect +
      ' WHERE ' +
      clauses.join(' AND ') +
      ' ORDER BY a.updated_at DESC, a.assumption_ref',
    params
  );
}

export async function listStrategicAssumptionVersions(
  context: CommandContext,
  assumptionId: string
) {
  assertPermission(context, 'strategy.assumption.read');
  await getAssumption(context, assumptionId);
  return queryRows<RowDataPacket & StrategicAssumptionVersion>(
    'SELECT id, assumption_id AS assumptionId, version_no AS versionNo, statement, basis_summary AS basisSummary, evidence_item_id AS evidenceItemId, confidence_percent AS confidencePercent, scope_type AS scopeType, scope_id AS scopeId, valid_from AS validFrom, valid_to AS validTo, lifecycle_status AS lifecycleStatus, assessment_note AS assessmentNote, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM strategic_assumption_versions WHERE tenant_id = ? AND assumption_id = ? ORDER BY version_no DESC',
    [context.tenantId, assumptionId]
  );
}

export async function createStrategicAssumption(
  context: CommandContext,
  input: StrategicAssumptionInput
) {
  assertPermission(context, 'strategy.assumption.manage');
  const assumptionRef = code(input.assumptionRef, 'Assumption reference');
  const assumptionCategory = category(input.category);
  const statement = required(input.statement, 'Assumption statement');
  const basisSummary = required(input.basisSummary, 'Assumption basis/source summary');
  const confidencePercent = confidence(input.confidencePercent);
  const validity = range(input.validFrom, input.validTo);
  const scoped = scope(input.scopeType, input.scopeId);
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const evidenceItemId = input.evidenceItemId?.trim() || null;

  return dbTransaction(async (connection) => {
    await assertParty(context, ownerPartyId, connection);
    if (evidenceItemId) await assertEvidence(context, evidenceItemId, connection);

    const id = randomUUID();
    const versionId = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO strategic_assumptions (id, tenant_id, assumption_ref, category, owner_party_id, status, aggregate_version, current_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'PROPOSED', 1, 1, ?, ?)",
      [id, context.tenantId, assumptionRef, assumptionCategory, ownerPartyId, timestamp, timestamp],
      connection
    );
    await executeMutation(
      "INSERT INTO strategic_assumption_versions (id, tenant_id, assumption_id, version_no, statement, basis_summary, evidence_item_id, confidence_percent, scope_type, scope_id, valid_from, valid_to, lifecycle_status, assessment_note, created_by_party_id, created_at) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', NULL, ?, ?)",
      [
        versionId,
        context.tenantId,
        id,
        statement,
        basisSummary,
        evidenceItemId,
        confidencePercent,
        scoped.scopeType,
        scoped.scopeId,
        validity.validFrom,
        validity.validTo,
        context.actorPartyId,
        timestamp
      ],
      connection
    );
    const created = await getAssumption(context, id, connection);
    await evidence(
      context,
      created,
      'STRATEGIC_ASSUMPTION_PROPOSED',
      null,
      'PROPOSED',
      { assumptionRef, category: assumptionCategory, evidenceItemId },
      connection
    );
    return id;
  });
}

export async function reviseStrategicAssumption(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: Omit<StrategicAssumptionInput, 'assumptionRef' | 'category'>
) {
  assertPermission(context, 'strategy.assumption.manage');
  const statement = required(input.statement, 'Assumption statement');
  const basisSummary = required(input.basisSummary, 'Assumption basis/source summary');
  const confidencePercent = confidence(input.confidencePercent);
  const validity = range(input.validFrom, input.validTo);
  const scoped = scope(input.scopeType, input.scopeId);
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const evidenceItemId = input.evidenceItemId?.trim() || null;

  return dbTransaction(async (connection) => {
    const current = await getAssumption(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Strategic Assumption changed after you opened it.');
    }
    if (!['PROPOSED', 'CHALLENGED'].includes(current.status)) {
      throw new Error('Only proposed or challenged Strategic Assumptions can be revised.');
    }
    await assertParty(context, ownerPartyId, connection);
    if (evidenceItemId) await assertEvidence(context, evidenceItemId, connection);

    const nextVersionNo = current.currentVersionNo + 1;
    const timestamp = now();
    await executeMutation(
      "INSERT INTO strategic_assumption_versions (id, tenant_id, assumption_id, version_no, statement, basis_summary, evidence_item_id, confidence_percent, scope_type, scope_id, valid_from, valid_to, lifecycle_status, assessment_note, created_by_party_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PROPOSED', NULL, ?, ?)",
      [
        randomUUID(),
        context.tenantId,
        current.id,
        nextVersionNo,
        statement,
        basisSummary,
        evidenceItemId,
        confidencePercent,
        scoped.scopeType,
        scoped.scopeId,
        validity.validFrom,
        validity.validTo,
        context.actorPartyId,
        timestamp
      ],
      connection
    );
    const result = await executeMutation(
      "UPDATE strategic_assumptions SET owner_party_id = ?, status = 'PROPOSED', aggregate_version = aggregate_version + 1, current_version_no = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
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
      throw new Error('Concurrent Strategic Assumption change detected.');
    const updated = await getAssumption(context, current.id, connection);
    await evidence(
      context,
      updated,
      'STRATEGIC_ASSUMPTION_REVISED',
      current.status,
      'PROPOSED',
      { versionNo: nextVersionNo, evidenceItemId },
      connection
    );
  });
}

export async function assessStrategicAssumption(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: { outcome: 'ACCEPT' | 'ACTIVATE' | 'CHALLENGE' | 'INVALIDATE'; note: string }
) {
  assertPermission(context, 'strategy.assumption.assess');
  const note = required(input.note, 'Assessment note');
  const transitions: Record<string, { allowed: string[]; to: string; event: string }> = {
    ACCEPT: {
      allowed: ['PROPOSED', 'CHALLENGED'],
      to: 'ACCEPTED',
      event: 'STRATEGIC_ASSUMPTION_ACCEPTED'
    },
    ACTIVATE: { allowed: ['ACCEPTED'], to: 'ACTIVE', event: 'STRATEGIC_ASSUMPTION_ACTIVATED' },
    CHALLENGE: {
      allowed: ['ACCEPTED', 'ACTIVE'],
      to: 'CHALLENGED',
      event: 'STRATEGIC_ASSUMPTION_CHALLENGED'
    },
    INVALIDATE: {
      allowed: ['PROPOSED', 'ACCEPTED', 'ACTIVE', 'CHALLENGED'],
      to: 'INVALIDATED',
      event: 'STRATEGIC_ASSUMPTION_INVALIDATED'
    }
  };
  const transition = transitions[input.outcome];
  if (!transition) throw new Error('Unsupported Strategic Assumption assessment outcome.');

  return dbTransaction(async (connection) => {
    const current = await getAssumption(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Strategic Assumption changed after you opened it.');
    }
    if (!transition.allowed.includes(current.status)) {
      throw new Error(
        'Strategic Assumption cannot transition from ' +
          current.status +
          ' using ' +
          input.outcome +
          '.'
      );
    }
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE strategic_assumptions SET status = ?, aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?',
      [transition.to, timestamp, current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Strategic Assumption assessment detected.');
    await executeMutation(
      'UPDATE strategic_assumption_versions SET lifecycle_status = ?, assessment_note = ? WHERE assumption_id = ? AND version_no = ?',
      [transition.to, note, current.id, current.currentVersionNo],
      connection
    );
    const updated = await getAssumption(context, current.id, connection);
    await evidence(
      context,
      updated,
      transition.event,
      current.status,
      transition.to,
      { note, versionNo: current.currentVersionNo },
      connection
    );
  });
}
