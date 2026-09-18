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
import {
  emitBusinessEvent,
  listPlatformAudit,
  recordPlatformAudit
} from '$lib/server/platform-evidence';

export type StrategyFrameworkStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'RETURNED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'SUPERSEDED'
  | 'REJECTED';

export type StrategyFramework = {
  id: string;
  title: string;
  purpose: string;
  vision: string;
  mission: string;
  direction: string;
  reviewCadence: string;
  status: StrategyFrameworkStatus;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
};

export type StrategyFrameworkVersion = {
  id: string;
  frameworkId: string;
  versionNo: number;
  status: StrategyFrameworkStatus;
  createdAt: string;
  createdBy: string;
  decisionNote: string | null;
};

export type StrategyAuditEvent = {
  id: string;
  action: string;
  fromStatus: StrategyFrameworkStatus | null;
  toStatus: StrategyFrameworkStatus | null;
  actor: string;
  note: string | null;
  occurredAt: string;
};

export type StrategyFrameworkInput = Pick<
  StrategyFramework,
  'title' | 'purpose' | 'vision' | 'mission' | 'direction' | 'reviewCadence'
>;

const frameworkSelect =
  'SELECT id, title, purpose, vision, mission, direction, review_cadence AS reviewCadence, status, current_version AS currentVersion, created_at AS createdAt, updated_at AS updatedAt, submitted_at AS submittedAt, approved_at AS approvedAt, published_at AS publishedAt FROM strategy_frameworks';

function now() {
  return new Date().toISOString();
}

function requireTitle(title: string) {
  const value = title.trim();
  if (!value) throw new Error('A framework title is required.');
  return value;
}

async function getFramework(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
): Promise<StrategyFramework> {
  const row = await queryOne<RowDataPacket & StrategyFramework>(
    frameworkSelect + ' WHERE tenant_id = ? AND id = ?',
    [context.tenantId, id],
    executor
  );
  if (!row) throw new Error('Strategy framework not found.');
  return row;
}

function snapshot(framework: StrategyFramework) {
  return JSON.stringify({
    title: framework.title,
    purpose: framework.purpose,
    vision: framework.vision,
    mission: framework.mission,
    direction: framework.direction,
    reviewCadence: framework.reviewCadence
  });
}

async function evidence(
  context: CommandContext,
  framework: StrategyFramework,
  action: string,
  fromStatus: StrategyFrameworkStatus | null,
  toStatus: StrategyFrameworkStatus | null,
  executor: DbExecutor,
  note?: string
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-STRATEGY',
      objectType: 'strategy_framework',
      objectId: framework.id,
      action,
      fromState: fromStatus,
      toState: toStatus,
      note
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-STRATEGY',
      aggregateType: 'StrategyFramework',
      aggregateObjectId: framework.id,
      aggregateVersion: framework.currentVersion,
      eventType: action,
      topic: 'nublox.strategy.framework',
      payload: {
        title: framework.title,
        status: framework.status,
        currentVersion: framework.currentVersion
      }
    },
    executor
  );
}

export async function listStrategyFrameworks(context: CommandContext): Promise<StrategyFramework[]> {
  assertPermission(context, 'strategy.framework.read');
  return queryRows<RowDataPacket & StrategyFramework>(
    frameworkSelect + ' WHERE tenant_id = ? ORDER BY updated_at DESC',
    [context.tenantId]
  );
}

export async function createStrategyFramework(
  context: CommandContext,
  input: StrategyFrameworkInput
): Promise<string> {
  assertPermission(context, 'strategy.framework.create');
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      'INSERT INTO strategy_frameworks (id, tenant_id, title, purpose, vision, mission, direction, review_cadence, status, current_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, \'DRAFT\', 0, ?, ?)',
      [
        id,
        context.tenantId,
        requireTitle(input.title),
        input.purpose.trim(),
        input.vision.trim(),
        input.mission.trim(),
        input.direction.trim(),
        input.reviewCadence.trim(),
        timestamp,
        timestamp
      ],
      connection
    );
    const framework = await getFramework(context, id, connection);
    await evidence(context, framework, 'STRATEGY_FRAMEWORK_CREATED', null, 'DRAFT', connection);
    return id;
  });
}

export async function updateStrategyFramework(
  context: CommandContext,
  id: string,
  input: StrategyFrameworkInput
) {
  assertPermission(context, 'strategy.framework.change');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (!['DRAFT', 'RETURNED'].includes(framework.status)) {
      throw new Error('Only draft or returned frameworks can be edited.');
    }
    await executeMutation(
      'UPDATE strategy_frameworks SET title = ?, purpose = ?, vision = ?, mission = ?, direction = ?, review_cadence = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
      [
        requireTitle(input.title),
        input.purpose.trim(),
        input.vision.trim(),
        input.mission.trim(),
        input.direction.trim(),
        input.reviewCadence.trim(),
        now(),
        context.tenantId,
        id
      ],
      connection
    );
    const updated = await getFramework(context, id, connection);
    await evidence(context, updated, 'STRATEGY_FRAMEWORK_CHANGED', framework.status, updated.status, connection);
  });
}

export async function submitStrategyFramework(context: CommandContext, id: string) {
  assertPermission(context, 'strategy.framework.submit');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (!['DRAFT', 'RETURNED'].includes(framework.status)) {
      throw new Error('Only draft or returned frameworks can be submitted.');
    }
    const versionNo = framework.currentVersion + 1;
    const timestamp = now();
    await executeMutation(
      'INSERT INTO strategy_framework_versions (id, framework_id, version_no, snapshot_json, status, created_at, created_by) VALUES (?, ?, ?, ?, \'IN_REVIEW\', ?, ?)',
      [randomUUID(), id, versionNo, snapshot(framework), timestamp, context.actorDisplayName],
      connection
    );
    await executeMutation(
      'UPDATE strategy_frameworks SET status = \'IN_REVIEW\', current_version = ?, submitted_at = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
      [versionNo, timestamp, timestamp, context.tenantId, id],
      connection
    );
    const updated = await getFramework(context, id, connection);
    await evidence(context, updated, 'STRATEGY_FRAMEWORK_SUBMITTED', framework.status, 'IN_REVIEW', connection);
  });
}

export async function returnStrategyFramework(context: CommandContext, id: string, note: string) {
  assertPermission(context, 'strategy.framework.review');
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A return reason is required.');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be returned.');
    const timestamp = now();
    await executeMutation(
      'UPDATE strategy_frameworks SET status = \'RETURNED\', updated_at = ? WHERE tenant_id = ? AND id = ?',
      [timestamp, context.tenantId, id],
      connection
    );
    await executeMutation(
      'UPDATE strategy_framework_versions SET status = \'RETURNED\', decision_note = ? WHERE framework_id = ? AND version_no = ?',
      [cleanNote, id, framework.currentVersion],
      connection
    );
    const updated = await getFramework(context, id, connection);
    await evidence(context, updated, 'STRATEGY_FRAMEWORK_RETURNED', 'IN_REVIEW', 'RETURNED', connection, cleanNote);
  });
}

export async function approveStrategyFramework(context: CommandContext, id: string, note?: string) {
  assertPermission(context, 'strategy.framework.approve');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be approved.');
    const timestamp = now();
    await executeMutation(
      'UPDATE strategy_frameworks SET status = \'APPROVED\', approved_at = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
      [timestamp, timestamp, context.tenantId, id],
      connection
    );
    await executeMutation(
      'UPDATE strategy_framework_versions SET status = \'APPROVED\', decision_note = ? WHERE framework_id = ? AND version_no = ?',
      [note?.trim() || null, id, framework.currentVersion],
      connection
    );
    const updated = await getFramework(context, id, connection);
    await evidence(context, updated, 'STRATEGY_FRAMEWORK_APPROVED', 'IN_REVIEW', 'APPROVED', connection, note);
  });
}

export async function rejectStrategyFramework(context: CommandContext, id: string, note: string) {
  assertPermission(context, 'strategy.framework.review');
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A rejection reason is required.');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be rejected.');
    const timestamp = now();
    await executeMutation(
      'UPDATE strategy_frameworks SET status = \'REJECTED\', updated_at = ? WHERE tenant_id = ? AND id = ?',
      [timestamp, context.tenantId, id],
      connection
    );
    await executeMutation(
      'UPDATE strategy_framework_versions SET status = \'REJECTED\', decision_note = ? WHERE framework_id = ? AND version_no = ?',
      [cleanNote, id, framework.currentVersion],
      connection
    );
    const updated = await getFramework(context, id, connection);
    await evidence(context, updated, 'STRATEGY_FRAMEWORK_REJECTED', 'IN_REVIEW', 'REJECTED', connection, cleanNote);
  });
}

export async function publishStrategyFramework(context: CommandContext, id: string, note?: string) {
  assertPermission(context, 'strategy.framework.publish');
  return dbTransaction(async (connection) => {
    const framework = await getFramework(context, id, connection);
    if (framework.status !== 'APPROVED') throw new Error('Only approved frameworks can be published.');

    const timestamp = now();
    const existing = await queryRows<RowDataPacket & StrategyFramework>(
      frameworkSelect + ' WHERE tenant_id = ? AND status = \'PUBLISHED\' AND id <> ?',
      [context.tenantId, id],
      connection
    );

    for (const previous of existing) {
      await executeMutation(
        'UPDATE strategy_frameworks SET status = \'SUPERSEDED\', updated_at = ? WHERE tenant_id = ? AND id = ?',
        [timestamp, context.tenantId, previous.id],
        connection
      );
      await executeMutation(
        'UPDATE strategy_framework_versions SET status = \'SUPERSEDED\' WHERE framework_id = ? AND version_no = ?',
        [previous.id, previous.currentVersion],
        connection
      );
      const superseded = await getFramework(context, previous.id, connection);
      await evidence(
        context,
        superseded,
        'STRATEGY_FRAMEWORK_SUPERSEDED',
        'PUBLISHED',
        'SUPERSEDED',
        connection,
        'Superseded by ' + id
      );
    }

    await executeMutation(
      'UPDATE strategy_frameworks SET status = \'PUBLISHED\', published_at = ?, updated_at = ? WHERE tenant_id = ? AND id = ?',
      [timestamp, timestamp, context.tenantId, id],
      connection
    );
    await executeMutation(
      'UPDATE strategy_framework_versions SET status = \'PUBLISHED\', decision_note = COALESCE(?, decision_note) WHERE framework_id = ? AND version_no = ?',
      [note?.trim() || null, id, framework.currentVersion],
      connection
    );
    const published = await getFramework(context, id, connection);
    await evidence(context, published, 'STRATEGY_FRAMEWORK_PUBLISHED', 'APPROVED', 'PUBLISHED', connection, note);
  });
}

export async function listStrategyFrameworkVersions(
  context: CommandContext,
  frameworkId: string
): Promise<StrategyFrameworkVersion[]> {
  assertPermission(context, 'strategy.framework.read');
  await getFramework(context, frameworkId);
  return queryRows<RowDataPacket & StrategyFrameworkVersion>(
    'SELECT id, framework_id AS frameworkId, version_no AS versionNo, status, created_at AS createdAt, created_by AS createdBy, decision_note AS decisionNote FROM strategy_framework_versions WHERE framework_id = ? ORDER BY version_no DESC',
    [frameworkId]
  );
}

export async function listStrategyFrameworkAudit(
  context: CommandContext,
  frameworkId: string
): Promise<StrategyAuditEvent[]> {
  assertPermission(context, 'strategy.framework.read');
  await getFramework(context, frameworkId);
  const events = await listPlatformAudit(context, 'strategy_framework', frameworkId);
  return events.map((event) => ({
    id: event.id,
    action: event.action,
    fromStatus: event.fromState as StrategyFrameworkStatus | null,
    toStatus: event.toState as StrategyFrameworkStatus | null,
    actor: event.actorDisplayName,
    note: event.note,
    occurredAt: event.occurredAt
  }));
}
