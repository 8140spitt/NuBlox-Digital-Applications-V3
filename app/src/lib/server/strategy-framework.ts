import { randomUUID } from 'node:crypto';
import { db } from '$lib/server/db';

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

export type AuditEvent = {
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

function getFramework(tenantSlug: string, id: string): StrategyFramework {
  const row = db
    .prepare(`${frameworkSelect} WHERE tenant_slug = ? AND id = ?`)
    .get(tenantSlug, id) as StrategyFramework | undefined;
  if (!row) throw new Error('Strategy framework not found.');
  return row;
}

function audit(
  tenantSlug: string,
  objectId: string,
  action: string,
  actor: string,
  fromStatus: StrategyFrameworkStatus | null,
  toStatus: StrategyFrameworkStatus | null,
  note?: string
) {
  db.prepare(`
    INSERT INTO audit_events
      (id, tenant_slug, object_type, object_id, action, from_status, to_status, actor, note, occurred_at)
    VALUES (?, ?, 'strategy_framework', ?, ?, ?, ?, ?, ?, ?)
  `).run(
    randomUUID(),
    tenantSlug,
    objectId,
    action,
    fromStatus,
    toStatus,
    actor,
    note?.trim() || null,
    now()
  );
}

function transaction<T>(work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
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

export function listStrategyFrameworks(tenantSlug: string): StrategyFramework[] {
  return db
    .prepare(`${frameworkSelect} WHERE tenant_slug = ? ORDER BY updated_at DESC`)
    .all(tenantSlug) as unknown as StrategyFramework[];
}

export function createStrategyFramework(
  tenantSlug: string,
  input: StrategyFrameworkInput,
  actor: string
): string {
  const id = randomUUID();
  const timestamp = now();
  db.prepare(`
    INSERT INTO strategy_frameworks
      (id, tenant_slug, title, purpose, vision, mission, direction, review_cadence, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)
  `).run(
    id,
    tenantSlug,
    requireTitle(input.title),
    input.purpose.trim(),
    input.vision.trim(),
    input.mission.trim(),
    input.direction.trim(),
    input.reviewCadence.trim(),
    timestamp,
    timestamp
  );
  audit(tenantSlug, id, 'CREATED', actor, null, 'DRAFT');
  return id;
}

export function updateStrategyFramework(
  tenantSlug: string,
  id: string,
  input: StrategyFrameworkInput,
  actor: string
) {
  const framework = getFramework(tenantSlug, id);
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
    tenantSlug,
    id
  );
  audit(tenantSlug, id, 'UPDATED', actor, framework.status, framework.status);
}

export function submitStrategyFramework(tenantSlug: string, id: string, actor: string) {
  return transaction(() => {
    const framework = getFramework(tenantSlug, id);
    if (!['DRAFT', 'RETURNED'].includes(framework.status)) {
      throw new Error('Only draft or returned frameworks can be submitted.');
    }
    const versionNo = framework.currentVersion + 1;
    const timestamp = now();
    db.prepare(`
      INSERT INTO strategy_framework_versions
        (id, framework_id, version_no, snapshot_json, status, created_at, created_by)
      VALUES (?, ?, ?, ?, 'IN_REVIEW', ?, ?)
    `).run(randomUUID(), id, versionNo, snapshot(framework), timestamp, actor);
    db.prepare(`
      UPDATE strategy_frameworks
      SET status = 'IN_REVIEW', current_version = ?, submitted_at = ?, updated_at = ?
      WHERE tenant_slug = ? AND id = ?
    `).run(versionNo, timestamp, timestamp, tenantSlug, id);
    audit(tenantSlug, id, 'SUBMITTED', actor, framework.status, 'IN_REVIEW');
  });
}

export function returnStrategyFramework(
  tenantSlug: string,
  id: string,
  actor: string,
  note: string
) {
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A return reason is required.');
  return transaction(() => {
    const framework = getFramework(tenantSlug, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be returned.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'RETURNED', updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'RETURNED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(cleanNote, id, framework.currentVersion);
    audit(tenantSlug, id, 'RETURNED', actor, 'IN_REVIEW', 'RETURNED', cleanNote);
  });
}

export function approveStrategyFramework(
  tenantSlug: string,
  id: string,
  actor: string,
  note?: string
) {
  return transaction(() => {
    const framework = getFramework(tenantSlug, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be approved.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'APPROVED', approved_at = ?, updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, timestamp, tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'APPROVED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(note?.trim() || null, id, framework.currentVersion);
    audit(tenantSlug, id, 'APPROVED', actor, 'IN_REVIEW', 'APPROVED', note);
  });
}

export function rejectStrategyFramework(
  tenantSlug: string,
  id: string,
  actor: string,
  note: string
) {
  const cleanNote = note.trim();
  if (!cleanNote) throw new Error('A rejection reason is required.');
  return transaction(() => {
    const framework = getFramework(tenantSlug, id);
    if (framework.status !== 'IN_REVIEW') throw new Error('Only in-review frameworks can be rejected.');
    const timestamp = now();
    db.prepare(`UPDATE strategy_frameworks SET status = 'REJECTED', updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'REJECTED', decision_note = ? WHERE framework_id = ? AND version_no = ?`)
      .run(cleanNote, id, framework.currentVersion);
    audit(tenantSlug, id, 'REJECTED', actor, 'IN_REVIEW', 'REJECTED', cleanNote);
  });
}

export function publishStrategyFramework(
  tenantSlug: string,
  id: string,
  actor: string,
  note?: string
) {
  return transaction(() => {
    const framework = getFramework(tenantSlug, id);
    if (framework.status !== 'APPROVED') throw new Error('Only approved frameworks can be published.');
    const timestamp = now();
    const existing = db
      .prepare(`${frameworkSelect} WHERE tenant_slug = ? AND status = 'PUBLISHED' AND id <> ?`)
      .all(tenantSlug, id) as unknown as StrategyFramework[];

    for (const previous of existing) {
      db.prepare(`UPDATE strategy_frameworks SET status = 'SUPERSEDED', updated_at = ? WHERE id = ?`)
        .run(timestamp, previous.id);
      db.prepare(`UPDATE strategy_framework_versions SET status = 'SUPERSEDED' WHERE framework_id = ? AND version_no = ?`)
        .run(previous.id, previous.currentVersion);
      audit(tenantSlug, previous.id, 'SUPERSEDED', actor, 'PUBLISHED', 'SUPERSEDED', `Superseded by ${id}`);
    }

    db.prepare(`UPDATE strategy_frameworks SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE tenant_slug = ? AND id = ?`)
      .run(timestamp, timestamp, tenantSlug, id);
    db.prepare(`UPDATE strategy_framework_versions SET status = 'PUBLISHED', decision_note = COALESCE(?, decision_note) WHERE framework_id = ? AND version_no = ?`)
      .run(note?.trim() || null, id, framework.currentVersion);
    audit(tenantSlug, id, 'PUBLISHED', actor, 'APPROVED', 'PUBLISHED', note);
  });
}

export function listStrategyFrameworkVersions(frameworkId: string): StrategyFrameworkVersion[] {
  return db.prepare(`
    SELECT id, framework_id AS frameworkId, version_no AS versionNo, status,
      created_at AS createdAt, created_by AS createdBy, decision_note AS decisionNote
    FROM strategy_framework_versions
    WHERE framework_id = ?
    ORDER BY version_no DESC
  `).all(frameworkId) as unknown as StrategyFrameworkVersion[];
}

export function listStrategyFrameworkAudit(tenantSlug: string, frameworkId: string): AuditEvent[] {
  return db.prepare(`
    SELECT id, action, from_status AS fromStatus, to_status AS toStatus,
      actor, note, occurred_at AS occurredAt
    FROM audit_events
    WHERE tenant_slug = ? AND object_type = 'strategy_framework' AND object_id = ?
    ORDER BY occurred_at DESC
  `).all(tenantSlug, frameworkId) as unknown as AuditEvent[];
}
