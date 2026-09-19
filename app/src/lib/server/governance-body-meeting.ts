import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows, type DbExecutor } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { recordWorkDecision } from '$lib/server/work-decision';
import { createWorkflowInstance, createWorkItem } from '$lib/server/shared-work';

export type GovernanceBodyMeeting = {
  id: string;
  meetingRef: string;
  meetingType: string;
  bodyId: string;
  scheduledAt: string;
  actualStartedAt: string | null;
  completedAt: string | null;
  locationChannel: string | null;
  quorumRequired: number;
  status: string;
  aggregateVersion: number;
  minutesSummary: string | null;
  updatedAt: string;
};

export type GovernanceBodyMeetingAttendee = {
  partyId: string;
  attendanceRole: string;
  attendanceStatus: string;
};

export type GovernanceBodyMeetingAgenda = {
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

export type GovernanceMeetingInformation = {
  revisionId: string;
  containerId: string;
  containerRef: string;
  title: string;
  revisionNo: number;
  revisionCode: string;
  linkRole: string;
  linkedAt: string;
};

type BodyContext = {
  id: string;
  bodyRef: string;
  name: string;
  bodyType: string;
  status: string;
  quorumRequired: number;
};

const meetingSelect =
  'SELECT id, meeting_ref AS meetingRef, meeting_type AS meetingType, governance_context_id AS bodyId, scheduled_at AS scheduledAt, actual_started_at AS actualStartedAt, completed_at AS completedAt, location_channel AS locationChannel, quorum_required AS quorumRequired, status, aggregate_version AS aggregateVersion, minutes_summary AS minutesSummary, updated_at AS updatedAt FROM governance_meetings';

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

function meetingTypeFor(bodyType: string) {
  if (bodyType === 'BOARD') return 'BOARD_MEETING';
  if (bodyType === 'COMMITTEE') return 'COMMITTEE_MEETING';
  return 'STEERING_BODY_MEETING';
}

async function getBody(context: CommandContext, bodyId: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & BodyContext>(
    'SELECT b.id, b.body_ref AS bodyRef, b.name, b.body_type AS bodyType, b.status, v.quorum_required AS quorumRequired FROM governance_bodies b JOIN governance_body_versions v ON v.body_id = b.id AND v.tenant_id = b.tenant_id AND v.version_no = b.current_version_no WHERE b.id = ? AND b.tenant_id = ?',
    [bodyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Governance Body not found.');
  return row;
}

async function getMeeting(
  context: CommandContext,
  meetingId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & GovernanceBodyMeeting>(
    meetingSelect +
      " WHERE id = ? AND tenant_id = ? AND governance_context_type = 'GOVERNANCE_BODY' AND meeting_type IN ('BOARD_MEETING','COMMITTEE_MEETING','STEERING_BODY_MEETING')" +
      (forUpdate ? ' FOR UPDATE' : ''),
    [meetingId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Governance Body Meeting not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  meeting: GovernanceBodyMeeting,
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
      objectId: meeting.id,
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
      aggregateObjectId: meeting.id,
      aggregateVersion: meeting.aggregateVersion,
      eventType,
      topic: 'nublox.governance.meeting',
      payload
    },
    executor
  );
}

export async function listGovernanceBodyMeetings(context: CommandContext, bodyId: string) {
  assertPermission(context, 'governance.body.read');
  assertPermission(context, 'governance.meeting.read');
  await getBody(context, bodyId);
  return queryRows<RowDataPacket & GovernanceBodyMeeting>(
    meetingSelect +
      " WHERE tenant_id = ? AND governance_context_type = 'GOVERNANCE_BODY' AND governance_context_id = ? AND meeting_type IN ('BOARD_MEETING','COMMITTEE_MEETING','STEERING_BODY_MEETING') ORDER BY scheduled_at DESC, id DESC",
    [context.tenantId, bodyId]
  );
}

export async function listGovernanceBodyMeetingAttendees(
  context: CommandContext,
  meetingId: string
) {
  assertPermission(context, 'governance.meeting.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & GovernanceBodyMeetingAttendee>(
    'SELECT party_id AS partyId, attendance_role AS attendanceRole, attendance_status AS attendanceStatus FROM governance_meeting_attendees WHERE meeting_id = ? ORDER BY attendance_role, party_id',
    [meetingId]
  );
}

export async function listGovernanceBodyMeetingAgenda(
  context: CommandContext,
  meetingId: string
) {
  assertPermission(context, 'governance.meeting.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & GovernanceBodyMeetingAgenda>(
    'SELECT id, item_no AS itemNo, subject, purpose, required_outcome AS requiredOutcome, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, status FROM governance_meeting_agenda_items WHERE meeting_id = ? ORDER BY item_no',
    [meetingId]
  );
}

export async function listGovernanceMeetingInformation(
  context: CommandContext,
  meetingId: string
) {
  assertPermission(context, 'governance.meeting.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & GovernanceMeetingInformation>(
    'SELECT r.id AS revisionId, r.container_id AS containerId, c.container_ref AS containerRef, r.title, r.revision_no AS revisionNo, r.revision_code AS revisionCode, l.link_role AS linkRole, l.linked_at AS linkedAt FROM governance_meeting_information l JOIN information_revisions r ON r.id = l.information_revision_id JOIN information_containers c ON c.id = r.container_id AND c.tenant_id = r.tenant_id WHERE l.meeting_id = ? AND r.tenant_id = ? ORDER BY l.link_role, c.container_ref, r.revision_no',
    [meetingId, context.tenantId]
  );
}

export async function listGovernanceBodyMeetingDecisionIds(
  context: CommandContext,
  meetingId: string
) {
  assertPermission(context, 'governance.meeting.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & { decisionId: string }>(
    'SELECT decision_id AS decisionId FROM governance_meeting_decisions WHERE meeting_id = ? ORDER BY decision_id',
    [meetingId]
  );
}

export async function listGovernanceBodyMeetingActionIds(
  context: CommandContext,
  meetingId: string
) {
  assertPermission(context, 'governance.meeting.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & { workItemId: string }>(
    'SELECT work_item_id AS workItemId FROM governance_meeting_actions WHERE meeting_id = ? ORDER BY work_item_id',
    [meetingId]
  );
}

export async function scheduleGovernanceBodyMeeting(
  context: CommandContext,
  input: {
    bodyId: string;
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
  assertPermission(context, 'governance.body.read');
  assertPermission(context, 'governance.meeting.manage');
  if (!input.agenda.length) throw new Error('Governance Body Meeting requires at least one agenda item.');

  return dbTransaction(async (connection) => {
    const body = await getBody(context, input.bodyId, connection);
    if (body.status !== 'ACTIVE') throw new Error('Only an active Governance Body can schedule meetings.');

    const scheduledAt = timestamp(input.scheduledAt, 'Scheduled time');
    const members = await queryRows<RowDataPacket & { partyId: string; roleKey: string }>(
      "SELECT party_id AS partyId, role_key AS roleKey FROM governance_body_memberships WHERE tenant_id = ? AND body_id = ? AND status = 'ACTIVE' AND valid_from <= ? AND (valid_to IS NULL OR valid_to > ?) ORDER BY role_key, party_id",
      [context.tenantId, body.id, scheduledAt, scheduledAt],
      connection
    );
    if (members.length < body.quorumRequired) {
      throw new Error('Effective membership at the meeting time is below the Governance Body quorum.');
    }

    const id = randomUUID();
    const createdAt = now();
    const meetingType = meetingTypeFor(body.bodyType);

    await executeMutation(
      "INSERT INTO governance_meetings (id, tenant_id, meeting_ref, meeting_type, governance_context_type, governance_context_id, scheduled_at, actual_started_at, completed_at, location_channel, quorum_required, status, aggregate_version, minutes_summary, next_review_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'GOVERNANCE_BODY', ?, ?, NULL, NULL, ?, ?, 'SCHEDULED', 1, NULL, NULL, ?, ?, ?)",
      [
        id,
        context.tenantId,
        code(input.meetingRef, 'Meeting reference'),
        meetingType,
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

    const meeting = await getMeeting(context, id, connection);
    await evidence(
      context,
      meeting,
      'GOVERNANCE_BODY_MEETING_SCHEDULED',
      null,
      'SCHEDULED',
      {
        bodyId: body.id,
        bodyType: body.bodyType,
        meetingType,
        attendeeCount: members.length,
        agendaCount: input.agenda.length,
        quorumRequired: body.quorumRequired
      },
      connection
    );
    return id;
  });
}

export async function recordGovernanceBodyMeetingAttendance(
  context: CommandContext,
  meetingId: string,
  partyId: string,
  status: 'PRESENT' | 'ABSENT'
) {
  assertPermission(context, 'governance.meeting.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (!['SCHEDULED', 'CONVENED'].includes(meeting.status)) {
      throw new Error('Attendance can only be recorded before or during a Governance Body Meeting.');
    }
    const result = await executeMutation(
      'UPDATE governance_meeting_attendees SET attendance_status = ? WHERE meeting_id = ? AND party_id = ?',
      [status, meeting.id, partyId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Governance Body Meeting attendee not found.');
  });
}

export async function conveneGovernanceBodyMeeting(
  context: CommandContext,
  meetingId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'governance.meeting.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (meeting.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Governance Body Meeting changed after you opened it.');
    }
    if (meeting.status !== 'SCHEDULED') {
      throw new Error('Only a scheduled Governance Body Meeting can be convened.');
    }
    const body = await getBody(context, meeting.bodyId, connection);
    if (body.status !== 'ACTIVE') throw new Error('The Governance Body is not active.');

    const present = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM governance_meeting_attendees WHERE meeting_id = ? AND attendance_status = 'PRESENT'",
      [meeting.id],
      connection
    );
    if (Number(present?.count ?? 0) < meeting.quorumRequired) {
      throw new Error('Governance Body Meeting quorum has not been met.');
    }

    const started = now();
    const result = await executeMutation(
      "UPDATE governance_meetings SET status = 'CONVENED', aggregate_version = aggregate_version + 1, actual_started_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [started, started, meeting.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Governance Body Meeting change detected.');

    const updated = await getMeeting(context, meeting.id, connection);
    await evidence(
      context,
      updated,
      'GOVERNANCE_BODY_MEETING_CONVENED',
      'SCHEDULED',
      'CONVENED',
      {
        bodyId: meeting.bodyId,
        present: Number(present?.count ?? 0),
        quorumRequired: meeting.quorumRequired
      },
      connection
    );
  });
}

export async function linkGovernanceMeetingInformation(
  context: CommandContext,
  meetingId: string,
  revisionId: string,
  linkRole: string
) {
  assertPermission(context, 'governance.meeting.manage');
  assertPermission(context, 'information.container.read');

  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (meeting.status === 'COMPLETED') {
      throw new Error('Completed Governance Body Meetings cannot receive additional controlled information links.');
    }

    const revision = await queryOne<
      RowDataPacket & { id: string; containerId: string; lifecycleStatus: string }
    >(
      'SELECT id, container_id AS containerId, lifecycle_status AS lifecycleStatus FROM information_revisions WHERE id = ? AND tenant_id = ?',
      [revisionId, context.tenantId],
      connection
    );
    if (!revision) throw new Error('Information Revision not found.');
    if (revision.lifecycleStatus !== 'ISSUED') {
      throw new Error('Meeting information must reference an issued Information Revision.');
    }

    const role = code(linkRole, 'Meeting information role', 64);
    if (!['AGENDA', 'BOARD_PACK', 'COMMITTEE_PACK', 'SUPPORTING_PAPER', 'MINUTES'].includes(role)) {
      throw new Error('Unsupported meeting information role.');
    }

    await executeMutation(
      'INSERT INTO governance_meeting_information (meeting_id, information_revision_id, link_role, linked_by_party_id, linked_at) VALUES (?, ?, ?, ?, ?)',
      [meeting.id, revision.id, role, context.actorPartyId, now()],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-GOVERNANCE-MEETING',
        objectType: 'governance_meeting',
        objectId: meeting.id,
        action: 'GOVERNANCE_MEETING_INFORMATION_LINKED'
      },
      connection
    );
  });
}

export async function recordGovernanceBodyResolution(
  context: CommandContext,
  meetingId: string,
  input: {
    subjectType: string;
    subjectId: string;
    subjectVersion?: string;
    outcome: string;
    reason: string;
  }
) {
  assertPermission(context, 'governance.meeting.conduct');
  const meeting = await getMeeting(context, meetingId);
  if (meeting.status !== 'CONVENED') {
    throw new Error('Resolutions can only be recorded while the Governance Body Meeting is convened.');
  }

  const decisionId = await recordWorkDecision(context, {
    decisionType: 'GOVERNANCE_BODY_RESOLUTION',
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    subjectVersion: input.subjectVersion,
    outcome: input.outcome,
    reason: input.reason
  });

  await dbTransaction(async (connection) => {
    const locked = await getMeeting(context, meetingId, connection, true);
    if (locked.status !== 'CONVENED' || locked.aggregateVersion !== meeting.aggregateVersion) {
      throw new Error('Governance Body Meeting changed before the resolution could be linked.');
    }
    await executeMutation(
      'INSERT INTO governance_meeting_decisions (meeting_id, decision_id) VALUES (?, ?)',
      [meeting.id, decisionId],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-GOVERNANCE-MEETING',
        objectType: 'governance_meeting',
        objectId: meeting.id,
        action: 'GOVERNANCE_BODY_RESOLUTION_LINKED'
      },
      connection
    );
  });
  return decisionId;
}

export async function createGovernanceBodyMeetingAction(
  context: CommandContext,
  meetingId: string,
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
  assertPermission(context, 'governance.meeting.conduct');
  const meeting = await getMeeting(context, meetingId);
  if (meeting.status !== 'CONVENED') {
    throw new Error('Actions can only be created while the Governance Body Meeting is convened.');
  }

  const workflowId = await createWorkflowInstance(context, {
    definitionKey: 'GOVERNANCE_BODY_ACTION',
    definitionVersion: '1',
    subjectType: 'GOVERNANCE_MEETING',
    subjectId: meeting.id,
    subjectVersion: String(meeting.aggregateVersion),
    currentState: 'ACTION_REQUIRED'
  });

  const workItemId = await createWorkItem(context, workflowId, {
    workType: 'GOVERNANCE_BODY_ACTION',
    title: input.title,
    instructions: input.instructions,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    subjectVersion: input.subjectVersion,
    priority: input.priority,
    dueAt: input.dueAt
  });

  await dbTransaction(async (connection) => {
    const locked = await getMeeting(context, meetingId, connection, true);
    if (locked.status !== 'CONVENED' || locked.aggregateVersion !== meeting.aggregateVersion) {
      throw new Error('Governance Body Meeting changed before the action could be linked.');
    }
    await executeMutation(
      'INSERT INTO governance_meeting_actions (meeting_id, work_item_id) VALUES (?, ?)',
      [meeting.id, workItemId],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-02-GOVERNANCE-MEETING',
        objectType: 'governance_meeting',
        objectId: meeting.id,
        action: 'GOVERNANCE_BODY_ACTION_LINKED'
      },
      connection
    );
  });
  return { workflowId, workItemId };
}

export async function completeGovernanceBodyMeeting(
  context: CommandContext,
  meetingId: string,
  expectedAggregateVersion: number,
  minutesSummary: string
) {
  assertPermission(context, 'governance.meeting.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (meeting.aggregateVersion !== expectedAggregateVersion) {
      throw new Error('This Governance Body Meeting changed after you opened it.');
    }
    if (meeting.status !== 'CONVENED') {
      throw new Error('Only a convened Governance Body Meeting can be completed.');
    }

    await executeMutation(
      "UPDATE governance_meeting_agenda_items SET status = 'CLOSED' WHERE meeting_id = ? AND status = 'CONFIRMED'",
      [meeting.id],
      connection
    );

    const completed = now();
    const result = await executeMutation(
      "UPDATE governance_meetings SET status = 'COMPLETED', aggregate_version = aggregate_version + 1, completed_at = ?, minutes_summary = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [
        completed,
        required(minutesSummary, 'Meeting minutes summary'),
        completed,
        meeting.id,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Governance Body Meeting completion detected.');
    }

    const updated = await getMeeting(context, meeting.id, connection);
    const minutes = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM governance_meeting_information WHERE meeting_id = ? AND link_role = 'MINUTES'",
      [meeting.id],
      connection
    );
    await evidence(
      context,
      updated,
      'GOVERNANCE_BODY_MEETING_COMPLETED',
      'CONVENED',
      'COMPLETED',
      {
        bodyId: meeting.bodyId,
        minutesRevisionLinked: Number(minutes?.count ?? 0) > 0
      },
      connection
    );
  });
}
