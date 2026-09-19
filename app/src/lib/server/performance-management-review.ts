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
import { recordWorkDecision } from '$lib/server/work-decision';
import { createWorkflowInstance, createWorkItem } from '$lib/server/shared-work';

export type PerformanceManagementReview = {
  id: string;
  meetingRef: string;
  governanceBodyId: string;
  scheduledAt: string;
  actualStartedAt: string | null;
  completedAt: string | null;
  locationChannel: string | null;
  quorumRequired: number;
  status: string;
  aggregateVersion: number;
  minutesSummary: string | null;
};

export type PerformanceManagementReviewAttendee = {
  partyId: string;
  attendanceRole: string;
  attendanceStatus: string;
};

export type PerformanceManagementReviewAgenda = {
  id: string;
  itemNo: number;
  subject: string;
  purpose: string;
  requiredOutcome: string;
  subjectType: string | null;
  subjectId: string | null;
  subjectVersion: string | null;
  status: string;
};

export type ReviewPerformanceSnapshot = {
  snapshotId: string;
  snapshotRef: string;
  scopeType: string;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  qualityStatus: string;
  completenessPercent: string;
  publishedAt: string;
};

const reviewSelect =
  "SELECT id, meeting_ref AS meetingRef, governance_context_id AS governanceBodyId, scheduled_at AS scheduledAt, actual_started_at AS actualStartedAt, completed_at AS completedAt, location_channel AS locationChannel, quorum_required AS quorumRequired, status, aggregate_version AS aggregateVersion, minutes_summary AS minutesSummary FROM governance_meetings WHERE tenant_id = ? AND meeting_type = 'MANAGEMENT_REVIEW'";

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

function timestamp(value: string, label: string) {
  const parsed = new Date(required(value, label));
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

async function getReview(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & PerformanceManagementReview>(
    reviewSelect + ' AND id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, id],
    executor
  );
  if (!row) throw new Error('Performance Management Review not found.');
  return row;
}

async function getGovernanceBody(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<
    RowDataPacket & { id: string; status: string; quorumRequired: number }
  >(
    'SELECT b.id, b.status, v.quorum_required AS quorumRequired FROM governance_bodies b JOIN governance_body_versions v ON v.body_id = b.id AND v.tenant_id = b.tenant_id AND v.version_no = b.current_version_no WHERE b.id = ? AND b.tenant_id = ?',
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Governance Body not found.');
  return row;
}

async function reviewEvidence(
  context: CommandContext,
  review: PerformanceManagementReview,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-02-GOVERNANCE-MEETING',
      objectType: 'governance_meeting',
      objectId: review.id,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-02-GOVERNANCE-MEETING',
      aggregateType: 'GovernanceMeeting',
      aggregateObjectId: review.id,
      aggregateVersion: review.aggregateVersion,
      eventType,
      topic: 'nublox.enterprise.performance-review',
      payload
    },
    executor
  );
}

export async function listPerformanceManagementReviews(context: CommandContext) {
  assertPermission(context, 'performance.enterprise.read');
  return queryRows<RowDataPacket & PerformanceManagementReview>(
    reviewSelect + ' ORDER BY scheduled_at DESC, id DESC',
    [context.tenantId]
  );
}

export async function listPerformanceManagementReviewAttendees(
  context: CommandContext,
  reviewId: string
) {
  assertPermission(context, 'performance.enterprise.read');
  await getReview(context, reviewId);
  return queryRows<RowDataPacket & PerformanceManagementReviewAttendee>(
    'SELECT party_id AS partyId, attendance_role AS attendanceRole, attendance_status AS attendanceStatus FROM governance_meeting_attendees WHERE meeting_id = ? ORDER BY attendance_role, party_id',
    [reviewId]
  );
}

export async function listPerformanceManagementReviewAgenda(
  context: CommandContext,
  reviewId: string
) {
  assertPermission(context, 'performance.enterprise.read');
  await getReview(context, reviewId);
  return queryRows<RowDataPacket & PerformanceManagementReviewAgenda>(
    'SELECT id, item_no AS itemNo, subject, purpose, required_outcome AS requiredOutcome, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, status FROM governance_meeting_agenda_items WHERE meeting_id = ? ORDER BY item_no',
    [reviewId]
  );
}

export async function listPerformanceManagementReviewSnapshots(
  context: CommandContext,
  reviewId: string
) {
  assertPermission(context, 'performance.enterprise.read');
  await getReview(context, reviewId);
  return queryRows<RowDataPacket & ReviewPerformanceSnapshot>(
    "SELECT s.id AS snapshotId, s.snapshot_ref AS snapshotRef, s.scope_type AS scopeType, s.scope_id AS scopeId, s.period_start AS periodStart, s.period_end AS periodEnd, s.quality_status AS qualityStatus, s.completeness_percent AS completenessPercent, s.published_at AS publishedAt FROM governance_meeting_performance_snapshots l JOIN performance_snapshots s ON s.id = l.snapshot_id WHERE l.meeting_id = ? AND s.tenant_id = ? AND s.status IN ('PUBLISHED','SUPERSEDED') ORDER BY s.period_end DESC, s.snapshot_ref",
    [reviewId, context.tenantId]
  );
}

export async function listPerformanceManagementReviewDecisionIds(
  context: CommandContext,
  reviewId: string
) {
  assertPermission(context, 'performance.enterprise.read');
  await getReview(context, reviewId);
  return queryRows<RowDataPacket & { decisionId: string }>(
    'SELECT decision_id AS decisionId FROM governance_meeting_decisions WHERE meeting_id = ? ORDER BY decision_id',
    [reviewId]
  );
}

export async function listPerformanceManagementReviewActionIds(
  context: CommandContext,
  reviewId: string
) {
  assertPermission(context, 'performance.enterprise.read');
  await getReview(context, reviewId);
  return queryRows<RowDataPacket & { workItemId: string }>(
    'SELECT work_item_id AS workItemId FROM governance_meeting_actions WHERE meeting_id = ? ORDER BY work_item_id',
    [reviewId]
  );
}

export async function schedulePerformanceManagementReview(
  context: CommandContext,
  input: {
    governanceBodyId: string;
    meetingRef: string;
    scheduledAt: string;
    locationChannel?: string;
    agenda: Array<{
      subject: string;
      purpose: string;
      requiredOutcome: string;
      subjectType?: string;
      subjectId?: string;
      subjectVersion?: string;
    }>;
  }
) {
  assertPermission(context, 'performance.review.manage');
  if (!input.agenda.length) throw new Error('Management Review requires at least one agenda item.');

  return dbTransaction(async (connection) => {
    const body = await getGovernanceBody(context, input.governanceBodyId, connection);
    if (body.status !== 'ACTIVE') {
      throw new Error('Management Review requires an active Governance Body.');
    }

    const scheduledAt = timestamp(input.scheduledAt, 'Scheduled time');
    const members = await queryRows<RowDataPacket & { partyId: string; roleKey: string }>(
      "SELECT party_id AS partyId, role_key AS roleKey FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? AND status = 'ACTIVE' AND valid_from <= ? AND (valid_to IS NULL OR valid_to > ?) ORDER BY role_key, party_id",
      [context.tenantId, body.id, scheduledAt, scheduledAt],
      connection
    );
    if (members.length < body.quorumRequired) {
      throw new Error('Effective Governance Body membership is below quorum at the review time.');
    }

    const id = randomUUID();
    const createdAt = now();
    await executeMutation(
      "INSERT INTO governance_meetings (id, tenant_id, meeting_ref, meeting_type, governance_context_type, governance_context_id, scheduled_at, actual_started_at, completed_at, location_channel, quorum_required, status, aggregate_version, minutes_summary, next_review_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, 'MANAGEMENT_REVIEW', 'GOVERNANCE_BODY', ?, ?, NULL, NULL, ?, ?, 'SCHEDULED', 1, NULL, NULL, ?, ?, ?)",
      [
        id,
        context.tenantId,
        code(input.meetingRef, 'Meeting reference'),
        body.id,
        scheduledAt,
        input.locationChannel?.trim() || null,
        body.quorumRequired,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    for (const member of members) {
      await executeMutation(
        "INSERT INTO governance_meeting_attendees (meeting_id, party_id, attendance_role, attendance_status) VALUES (?, ?, ?, 'EXPECTED')",
        [id, member.partyId, code(member.roleKey, 'Attendance role', 64)],
        connection
      );
    }

    for (let index = 0; index < input.agenda.length; index += 1) {
      const item = input.agenda[index];
      const subjectType = item.subjectType?.trim()
        ? code(item.subjectType, 'Agenda subject type', 64)
        : null;
      const subjectId = item.subjectId?.trim() || null;
      if (Boolean(subjectType) !== Boolean(subjectId)) {
        throw new Error('Agenda subject type and subject ID must be supplied together.');
      }
      await executeMutation(
        "INSERT INTO governance_meeting_agenda_items (id, meeting_id, item_no, subject, purpose, required_outcome, subject_type, subject_id, subject_version, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')",
        [
          randomUUID(),
          id,
          index + 1,
          required(item.subject, 'Agenda subject'),
          required(item.purpose, 'Agenda purpose'),
          code(item.requiredOutcome, 'Required outcome', 64),
          subjectType,
          subjectId,
          item.subjectVersion?.trim() || null
        ],
        connection
      );
    }

    const review = await getReview(context, id, connection);
    await reviewEvidence(
      context,
      review,
      'PERFORMANCE_MANAGEMENT_REVIEW_SCHEDULED',
      null,
      'SCHEDULED',
      {
        governanceBodyId: body.id,
        attendeeCount: members.length,
        agendaCount: input.agenda.length,
        quorumRequired: body.quorumRequired
      },
      connection
    );
    return id;
  });
}

export async function linkPerformanceSnapshotToManagementReview(
  context: CommandContext,
  reviewId: string,
  snapshotId: string
) {
  assertPermission(context, 'performance.review.manage');
  return dbTransaction(async (connection) => {
    const review = await getReview(context, reviewId, connection, true);
    if (review.status === 'COMPLETED') {
      throw new Error('Completed Management Reviews cannot receive additional snapshot links.');
    }

    const snapshot = await queryOne<RowDataPacket & { id: string; status: string }>(
      "SELECT id, status FROM performance_snapshots WHERE id = ? AND tenant_id = ? AND status = 'PUBLISHED'",
      [snapshotId, context.tenantId],
      connection
    );
    if (!snapshot) throw new Error('Published Performance Snapshot not found.');

    await executeMutation(
      'INSERT INTO governance_meeting_performance_snapshots (meeting_id, snapshot_id, linked_by_party_id, linked_at) VALUES (?, ?, ?, ?)',
      [review.id, snapshot.id, context.actorPartyId, now()],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-GOVERNANCE-MEETING',
        objectType: 'governance_meeting',
        objectId: review.id,
        action: 'PERFORMANCE_SNAPSHOT_LINKED'
      },
      connection
    );
  });
}

export async function recordPerformanceManagementReviewAttendance(
  context: CommandContext,
  reviewId: string,
  partyId: string,
  status: 'PRESENT' | 'ABSENT'
) {
  assertPermission(context, 'performance.review.manage');
  return dbTransaction(async (connection) => {
    const review = await getReview(context, reviewId, connection, true);
    if (!['SCHEDULED', 'CONVENED'].includes(review.status)) {
      throw new Error('Attendance can only be recorded before or during a Management Review.');
    }
    const result = await executeMutation(
      'UPDATE governance_meeting_attendees SET attendance_status = ? WHERE meeting_id = ? AND party_id = ?',
      [status, review.id, partyId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Management Review attendee not found.');
  });
}

export async function convenePerformanceManagementReview(
  context: CommandContext,
  reviewId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'performance.review.manage');
  return dbTransaction(async (connection) => {
    const review = await getReview(context, reviewId, connection, true);
    if (review.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Management Review changed after you opened it.');
    }
    if (review.status !== 'SCHEDULED') {
      throw new Error('Only a scheduled Management Review can be convened.');
    }

    const snapshotCount = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM governance_meeting_performance_snapshots WHERE meeting_id = ?',
      [review.id],
      connection
    );
    if (Number(snapshotCount?.count ?? 0) < 1) {
      throw new Error('Management Review requires at least one published Performance Snapshot.');
    }

    const present = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM governance_meeting_attendees WHERE meeting_id = ? AND attendance_status = 'PRESENT'",
      [review.id],
      connection
    );
    if (Number(present?.count ?? 0) < review.quorumRequired) {
      throw new Error('Management Review quorum has not been met.');
    }

    const startedAt = now();
    const result = await executeMutation(
      "UPDATE governance_meetings SET status = 'CONVENED', aggregate_version = aggregate_version + 1, actual_started_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [startedAt, startedAt, review.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Management Review change detected.');

    const updated = await getReview(context, review.id, connection);
    await reviewEvidence(
      context,
      updated,
      'PERFORMANCE_MANAGEMENT_REVIEW_CONVENED',
      'SCHEDULED',
      'CONVENED',
      {
        present: Number(present?.count ?? 0),
        quorumRequired: review.quorumRequired,
        snapshotCount: Number(snapshotCount?.count ?? 0)
      },
      connection
    );
  });
}

export async function recordPerformanceManagementReviewDecision(
  context: CommandContext,
  reviewId: string,
  input: {
    subjectType: string;
    subjectId: string;
    subjectVersion?: string;
    outcome: string;
    reason: string;
  }
) {
  assertPermission(context, 'performance.review.manage');
  const review = await getReview(context, reviewId);
  if (review.status !== 'CONVENED') {
    throw new Error('Management Review decisions require a convened meeting.');
  }

  const decisionId = await recordWorkDecision(context, {
    decisionType: 'PERFORMANCE_MANAGEMENT_REVIEW_DECISION',
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    subjectVersion: input.subjectVersion,
    outcome: input.outcome,
    reason: input.reason
  });

  await dbTransaction(async (connection) => {
    const locked = await getReview(context, reviewId, connection, true);
    if (locked.status !== 'CONVENED' || locked.aggregateVersion !== review.aggregateVersion) {
      throw new Error('Management Review changed before the Decision could be linked.');
    }
    await executeMutation(
      'INSERT INTO governance_meeting_decisions (meeting_id, decision_id) VALUES (?, ?)',
      [review.id, decisionId],
      connection
    );
  });
  return decisionId;
}

export async function createPerformanceManagementReviewAction(
  context: CommandContext,
  reviewId: string,
  input: {
    title: string;
    instructions: string;
    subjectType?: string;
    subjectId?: string;
    subjectVersion?: string;
    priority?: string;
    dueAt?: string;
  }
) {
  assertPermission(context, 'performance.review.manage');
  const review = await getReview(context, reviewId);
  if (review.status !== 'CONVENED') {
    throw new Error('Management Review actions require a convened meeting.');
  }

  const workflowId = await createWorkflowInstance(context, {
    definitionKey: 'PERFORMANCE_MANAGEMENT_REVIEW_ACTION',
    definitionVersion: '1',
    subjectType: 'GOVERNANCE_MEETING',
    subjectId: review.id,
    subjectVersion: String(review.aggregateVersion),
    currentState: 'ACTION_REQUIRED'
  });
  const workItemId = await createWorkItem(context, workflowId, {
    workType: 'PERFORMANCE_MANAGEMENT_REVIEW_ACTION',
    title: input.title,
    instructions: input.instructions,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    subjectVersion: input.subjectVersion,
    priority: input.priority,
    dueAt: input.dueAt
  });

  await dbTransaction(async (connection) => {
    const locked = await getReview(context, reviewId, connection, true);
    if (locked.status !== 'CONVENED' || locked.aggregateVersion !== review.aggregateVersion) {
      throw new Error('Management Review changed before the action could be linked.');
    }
    await executeMutation(
      'INSERT INTO governance_meeting_actions (meeting_id, work_item_id) VALUES (?, ?)',
      [review.id, workItemId],
      connection
    );
  });
  return { workflowId, workItemId };
}

export async function completePerformanceManagementReview(
  context: CommandContext,
  reviewId: string,
  expectedAggregateVersion: number,
  minutesSummary: string
) {
  assertPermission(context, 'performance.review.manage');
  return dbTransaction(async (connection) => {
    const review = await getReview(context, reviewId, connection, true);
    if (review.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Management Review changed after you opened it.');
    }
    if (review.status !== 'CONVENED') {
      throw new Error('Only a convened Management Review can be completed.');
    }

    await executeMutation(
      "UPDATE governance_meeting_agenda_items SET status = 'CLOSED' WHERE meeting_id = ? AND status = 'CONFIRMED'",
      [review.id],
      connection
    );

    const completedAt = now();
    const result = await executeMutation(
      "UPDATE governance_meetings SET status = 'COMPLETED', aggregate_version = aggregate_version + 1, completed_at = ?, minutes_summary = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [
        completedAt,
        required(minutesSummary, 'Management Review minutes summary'),
        completedAt,
        review.id,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Management Review completion detected.');

    const updated = await getReview(context, review.id, connection);
    await reviewEvidence(
      context,
      updated,
      'PERFORMANCE_MANAGEMENT_REVIEW_COMPLETED',
      'CONVENED',
      'COMPLETED',
      {},
      connection
    );
  });
}
