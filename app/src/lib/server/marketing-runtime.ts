import type { RowDataPacket } from 'mysql2/promise';
import { executeMutation, queryOne, type DbExecutor } from '$lib/server/db';
import type { CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export function now() {
  return new Date().toISOString();
}

export function required(value: string, label: string, max = 5000) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  if (clean.length > max) throw new Error(label + ' is too long.');
  return clean;
}

export function code(value: string, label: string, max = 64) {
  const clean = required(value, label, max).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

export function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

export function timestamp(value: string | undefined | null, label: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

export function finiteNumber(value: number | undefined | null, label: string) {
  if (value == null) return null;
  if (!Number.isFinite(value)) throw new Error(label + ' must be a finite number.');
  return value;
}

export async function assertActiveParty(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Party not found in this tenant.');
  return row.id;
}

export async function assertActiveCurrency(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_currencies WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Currency not found.');
  return row.id;
}

export async function assertIssuedInformationRevision(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
) {
  const row = await queryOne<
    RowDataPacket & {
      id: string;
      containerId: string;
      revisionNo: number;
      lifecycleStatus: string;
      issuedAt: string | null;
    }
  >(
    `SELECT ir.id,ir.container_id AS containerId,ir.revision_no AS revisionNo,
            ir.lifecycle_status AS lifecycleStatus,ir.issued_at AS issuedAt
       FROM information_revisions ir
       JOIN information_containers ic
         ON ic.id=ir.container_id AND ic.tenant_id=ir.tenant_id
      WHERE ir.id=? AND ir.tenant_id=?`,
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Information revision not found.');
  if (row.lifecycleStatus !== 'ISSUED' || !row.issuedAt) {
    throw new Error('Marketing content must reference an issued Information revision.');
  }
  return row;
}

export async function domainEvidence(
  context: CommandContext,
  input: {
    aggregateId: string;
    aggregateType: string;
    objectType: string;
    objectId: string;
    aggregateVersion: number;
    eventType: string;
    topic: string;
    fromState?: string | null;
    toState?: string | null;
    payload?: Record<string, unknown>;
    note?: string;
  },
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: input.aggregateId,
      objectType: input.objectType,
      objectId: input.objectId,
      action: input.eventType,
      fromState: input.fromState ?? undefined,
      toState: input.toState ?? undefined,
      note: input.note
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      aggregateObjectId: input.objectId,
      aggregateVersion: input.aggregateVersion,
      eventType: input.eventType,
      topic: input.topic,
      payload: input.payload ?? {}
    },
    executor
  );
}

export async function appendSimpleAudit(
  context: CommandContext,
  input: {
    aggregateId: string;
    objectType: string;
    objectId: string;
    action: string;
    note?: string;
  },
  executor?: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: input.aggregateId,
      objectType: input.objectType,
      objectId: input.objectId,
      action: input.action,
      note: input.note
    },
    executor
  );
}

export async function incrementAggregateVersion(
  table: string,
  context: CommandContext,
  id: string,
  expectedVersion: number,
  executor: DbExecutor
) {
  const allowed = new Set([
    'market_segments',
    'communications_plans',
    'communications_campaigns',
    'communication_items',
    'leads'
  ]);
  if (!allowed.has(table)) throw new Error('Unsupported aggregate table.');
  const result = await executeMutation(
    `UPDATE ${table} SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?`,
    [now(), id, context.tenantId, expectedVersion],
    executor
  );
  if (result.affectedRows !== 1) throw new Error('Aggregate changed.');
}
