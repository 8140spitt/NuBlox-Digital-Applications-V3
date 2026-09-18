import { randomUUID } from 'node:crypto';
import { db, dbTransaction } from '$lib/server/db';
import {
  assertPermission,
  type CommandContext
} from '$lib/server/platform-context';
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
  tenantSlug: string;
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

const frameworkSelect = `
  SELECT
    id,
    tenant_slug AS tenantSlug,
    title,
    purpose,
    vision,
    mission,
    direction,
    review_cadence AS reviewCadence,
    status,
    current_version AS currentVersion,
    created_at AS createdAt,
    updated_at AS updatedAt,
    submitted_at AS submittedAt,
    approved_at AS approvedAt,
    published_at AS publishedAt
  FROM strategy_frameworks
`;

function now() {
  return new Date().toISOString();
}

function requireTitle(title: string) {
  const value = title.trim();
  if (!value) throw new Error('A framework title is required.');
  return value;
}

function getFramework(context: CommandContext, id: string): StrategyFramework {
  const row = db
    .prepare(`${frameworkSelect} WHERE tenant_slug = ? AND id = ?`)
    .get(context.tenantSlug, id) as StrategyFramework | undefined;
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

function evidence(
  context: CommandContext,
  framework: StrategyFramework,
  action: string,
  fromStatus: StrategyFrameworkStatus | null,
  toStatus: StrategyFrameworkStatus | null,
  note?: string
) {
  recordPlatformAudit(context, {
    aggregateId: 'AGG-02-STRATEGY',
    objectType: 'strategy_framework',
    objectId: framework.id,
    action,
    fromState: fromStatus,
    toState: toStatus,
    note
  });

  emitBusinessEvent(context, {
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
  });
}

export function listStrategyFrameworks(context: CommandContext): StrategyFramework[] {
  assertPermission(context, 'strategy.framework.read');
  return db
    .prepare(`${frameworkSelect} WHERE tenant_slug = ? ORDER BY updated_at DESC`)
    .all(context.tenantSlug) as unknown as StrategyFramework[];
}

export function createStrategyFramework(
  context: CommandContext,
  input: StrategyFrameworkInput
): string {
  assertPermission(context, 'strategy.framework.create');
  return dbTransaction(() => {
    const id = randomUUID();
    const timestamp = now();
    db.prepare(`
      INSERT INTO strategy_frameworks
        (id, tenant_slug, title, purpose, vision, mission, direction, review_cadence, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
    `).run(
      id,
      context.tenantSlug,
      requireTitle(input.title),
      input.purpose.trim(),
      input.vision.trim(),
      input.mission.trim(),
      input.direction.trim(),
      input.reviewCadence.trim(),
      timestamp,
      timestamp
    );
    const framework = getFramework(context, id);
    evidence(context, framework, 'STRATEGY_FRAMEWORK_CREATED', null, 'DRAFT');
    return id;
  });
}

export function updateStrategyFramework(
  context: CommandContext,
  id: string,
  input: StrategyFrameworkInput
) {
  assertPermission(context, 'strategy.framework.change');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (!['DRAFT', 'RETURNED'].includes(framework.status)) {
      throw new Error('Only draft or returned frameworks can be edited.');
    }
    db.prepare(`
      UPDATE strategy_frameworks
      SET title = ?, purpose = ?, vision = ?, mission = ?, direction = ?, review_cadence = ?, updated_at = ?
      WHERE tenant_slug = ? AND id = ?
    `).run(
      requireTitle(input.title),
      input.purpose.trim(),
      input.vision.trim(),
      input.mission.trim(),
      input.direction.trim(),
      input.reviewCadence.trim(),
      now(),
      context.tenantSlug,
      id
    );
    const updated = getFramework(context, id);
    evidence(context, updated, 'STRATEGY_FRAMEWORK_CHANGED', framework.status, updated.status);
  });
}

export function submitStrategyFramework(context: CommandContext, id: string) {
  assertPermission(context, 'strategy.framework.submit');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (!['DRAFT', 'RETURNED'].includes(framework.status)) {
      throw new Error('Only draft or returned frameworks can be submitted.');
    }
    const versionNo = framework.currentVersion + 1;
    const timestamp = now();
    db.prepare(`
      INSERT INTO strategy_framework_versions
        (id, framework_id, version_no, snapshot_json, status, created_at, created_by)
      VALUES (?, ?, ?, ?, 'IN_REVIEW', ?, ?)
    `).run(randomUUID(), id, versionNo, snapshot(framework), timestamp, context.actorDisplayName);
    db.prepare(`
      UPDATE strategy_frameworks
      SET status = 'IN_REVIEW', current_version = ?, submitted_at = ?, updated_at = ?
      WHERE tenant_slug = ? AND id = ?
    `).run(versionNo, timestamp, timestamp, context.tenantSlug, id);
    const updated = getFramework(context, id);
    evidence(context, updated, 'STRATEGY_FRAMEWORK_SUBMITTED', framework.status, 'IN_REVIEW');
  });
}

export function returnStrategyFramework(
  context: CommandContext,
  id: string,
  note: string
) {
  assertPermission(context, 'strategy.framework.review');
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A return reason is required.');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be returned.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'RETURNED', updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, context.tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'RETURNED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(cleanNote, id, framework.currentVersion);
    const updated = getFramework(context, id);
    evidence(context, updated, 'STRATEGY_FRAMEWORK_RETURNED', 'IN_REVIEW', 'RETURNED', cleanNote);
  });
}

export function approveStrategyFramework(
  context: CommandContext,
  id: string,
  note?: string
) {
  assertPermission(context, 'strategy.framework.approve');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be approved.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'APPROVED', approved_at = ?, updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, timestamp, context.tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'APPROVED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(note?.trim() || null, id, framework.currentVersion);
    const updated = getFramework(context, id);
    evidence(context, updated, 'STRATEGY_FRAMEWORK_APPROVED', 'IN_REVIEW', 'APPROVED', note);
  });
}

export function rejectStrategyFramework(
  context: CommandContext,
  id: string,
  note: string
) {
  assertPermission(context, 'strategy.framework.review');
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A rejection reason is required.');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be rejected.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'REJECTED', updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, context.tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'REJECTED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(cleanNote, id, framework.currentVersion);
    const updated = getFramework(context, id);
    evidence(context, updated, 'STRATEGY_FRAMEWORK_REJECTED', 'IN_REVIEW', 'REJECTED', cleanNote);
  });
}

export function publishStrategyFramework(
  context: CommandContext,
  id: string,
  note?: string
) {
  assertPermission(context, 'strategy.framework.publish');
  return dbTransaction(() => {
    const framework = getFramework(context, id);
    if (framework.status !== 'APPROVED') throw new Error('Only approved frameworks can be published.');
    const timestamp = now();
    const existing = db
      .prepare(`${frameworkSelect} WHERE tenant_slug = ? AND status = 'PUBLISHED' AND id <> ?`)
      .all(context.tenantSlug, id) as unknown as StrategyFramework[];

    for (const previous of existing) {
      db.prepare(`UPDATE strategy_frameworks SET status = 'SUPERSEDED', updated_at = ? WHERE id = ?`)
        .run(timestamp, previous.id);
      db.prepare(`UPDATE strategy_framework_versions SET status = 'SUPERSEDED' WHERE framework_id = ? AND version_no = ?`)
        .run(previous.id, previous.currentVersion);
      const superseded = getFramework(context, previous.id);
      evidence(
        context,
        superseded,
        'STRATEGY_FRAMEWORK_SUPERSEDED',
        'PUBLISHED',
        'SUPERSEDED',
        `Superseded by ${id}`
      );
    }

    db.prepare(`UPDATE strategy_frameworks SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, timestamp, context.tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'PUBLISHED', decision_note = COALESCE(?, decision_note) WHERE framework_id = ? AND version_no = ?`)
      .run(note?.trim() || null, id, framework.currentVersion);
    const published = getFramework(context, id);
    evidence(context, published, 'STRATEGY_FRAMEWORK_PUBLISHED', 'APPROVED', 'PUBLISHED', note);
  });
}

export function listStrategyFrameworkVersions(
  context: CommandContext,
  frameworkId: string
): StrategyFrameworkVersion[] {
  assertPermission(context, 'strategy.framework.read');
  getFramework(context, frameworkId);
  return db.prepare(`
    SELECT id, framework_id AS frameworkId, version_no AS versionNo, status,
      created_at AS createdAt, created_by AS createdBy, decision_note AS decisionNote
    FROM strategy_framework_versions
    WHERE framework_id = ?
    ORDER BY version_no DESC
  `).all(frameworkId) as unknown as StrategyFrameworkVersion[];
}

export function listStrategyFrameworkAudit(
  context: CommandContext,
  frameworkId: string
): StrategyAuditEvent[] {
  assertPermission(context, 'strategy.framework.read');
  getFramework(context, frameworkId);
  return listPlatformAudit(context, 'strategy_framework', frameworkId).map((event) => ({
    id: event.id,
    action: event.action,
    fromStatus: event.fromState as StrategyFrameworkStatus | null,
    toStatus: event.toState as StrategyFrameworkStatus | null,
    actor: event.actorDisplayName,
    note: event.note,
    occurredAt: event.occurredAt
  }));
}
