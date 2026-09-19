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

export type ExecutiveGovernanceMeeting = {
  id: string;
  meetingRef: string;
  governanceContextType: string;
  governanceContextId: string;
  scheduledAt: string;
  actualStartedAt: string | null;
  completedAt: string | null;
  locationChannel: string | null;
  quorumRequired: number;
  status: string;
  aggregateVersion: number;
  minutesSummary: string | null;
  nextReviewAt: string | null;
};

export type ExecutiveAttendee = {
  partyId: string;
  attendanceRole: string;
  attendanceStatus: string;
};
export type ExecutiveAgendaItem = {
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
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean))
    throw new Error(label + ' contains unsupported characters.');
  return clean;
}
function timestamp(value: string, label: string) {
  const parsed = new Date(required(value, label));
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active executive attendee Party not found.');
}

async function getMeeting(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ExecutiveGovernanceMeeting>(
    "SELECT id,meeting_ref AS meetingRef,governance_context_type AS governanceContextType,governance_context_id AS governanceContextId,scheduled_at AS scheduledAt,actual_started_at AS actualStartedAt,completed_at AS completedAt,location_channel AS locationChannel,quorum_required AS quorumRequired,status,aggregate_version AS aggregateVersion,minutes_summary AS minutesSummary,next_review_at AS nextReviewAt FROM governance_meetings WHERE id=? AND tenant_id=? AND meeting_type='EXECUTIVE_GOVERNANCE'" +
      (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Executive Governance Meeting not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  meeting: ExecutiveGovernanceMeeting,
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
      topic: 'nublox.governance.executive',
      payload
    },
    executor
  );
}

export async function listExecutiveMeetings(context: CommandContext) {
  assertPermission(context, 'governance.executive.read');
  return queryRows<RowDataPacket & ExecutiveGovernanceMeeting>(
    "SELECT id,meeting_ref AS meetingRef,governance_context_type AS governanceContextType,governance_context_id AS governanceContextId,scheduled_at AS scheduledAt,actual_started_at AS actualStartedAt,completed_at AS completedAt,location_channel AS locationChannel,quorum_required AS quorumRequired,status,aggregate_version AS aggregateVersion,minutes_summary AS minutesSummary,next_review_at AS nextReviewAt FROM governance_meetings WHERE tenant_id=? AND meeting_type='EXECUTIVE_GOVERNANCE' ORDER BY scheduled_at DESC",
    [context.tenantId]
  );
}

export async function listExecutiveAttendees(context: CommandContext, meetingId: string) {
  assertPermission(context, 'governance.executive.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & ExecutiveAttendee>(
    'SELECT party_id AS partyId,attendance_role AS attendanceRole,attendance_status AS attendanceStatus FROM governance_meeting_attendees WHERE meeting_id=? ORDER BY attendance_role,party_id',
    [meetingId]
  );
}

export async function listExecutiveAgenda(context: CommandContext, meetingId: string) {
  assertPermission(context, 'governance.executive.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & ExecutiveAgendaItem>(
    'SELECT id,item_no AS itemNo,subject,purpose,required_outcome AS requiredOutcome,subject_type AS subjectType,subject_id AS subjectId,subject_version AS subjectVersion,status FROM governance_meeting_agenda_items WHERE meeting_id=? ORDER BY item_no',
    [meetingId]
  );
}

export async function listExecutiveDecisionIds(context: CommandContext, meetingId: string) {
  assertPermission(context, 'governance.executive.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & { decisionId: string }>(
    'SELECT decision_id AS decisionId FROM governance_meeting_decisions WHERE meeting_id=? ORDER BY decision_id',
    [meetingId]
  );
}

export async function listExecutiveActionIds(context: CommandContext, meetingId: string) {
  assertPermission(context, 'governance.executive.read');
  await getMeeting(context, meetingId);
  return queryRows<RowDataPacket & { workItemId: string }>(
    'SELECT work_item_id AS workItemId FROM governance_meeting_actions WHERE meeting_id=? ORDER BY work_item_id',
    [meetingId]
  );
}

export async function createExecutiveMeeting(
  context: CommandContext,
  input: {
    meetingRef: string;
    governanceContextType: string;
    governanceContextId: string;
    scheduledAt: string;
    locationChannel?: string;
    quorumRequired: number;
    attendees: Array<{ partyId: string; attendanceRole: string }>;
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
  assertPermission(context, 'governance.executive.manage');
  if (!Number.isInteger(input.quorumRequired) || input.quorumRequired < 1)
    throw new Error('Executive quorum must be a positive whole number.');
  if (input.attendees.length < input.quorumRequired)
    throw new Error('Quorum cannot exceed the number of invited attendees.');
  if (!input.agenda.length)
    throw new Error('Executive Governance requires at least one agenda item.');
  return dbTransaction(async (connection) => {
    for (const attendee of input.attendees)
      await assertParty(context, attendee.partyId, connection);
    const id = randomUUID(),
      createdAt = now();
    await executeMutation(
      "INSERT INTO governance_meetings (id,tenant_id,meeting_ref,meeting_type,governance_context_type,governance_context_id,scheduled_at,actual_started_at,completed_at,location_channel,quorum_required,status,aggregate_version,minutes_summary,next_review_at,created_by_party_id,created_at,updated_at) VALUES (?,?,?,'EXECUTIVE_GOVERNANCE',?,?,?,NULL,NULL,?,?,'SCHEDULED',1,NULL,NULL,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.meetingRef, 'Meeting reference'),
        code(input.governanceContextType, 'Governance context type', 64),
        required(input.governanceContextId, 'Governance context ID'),
        timestamp(input.scheduledAt, 'Scheduled time'),
        input.locationChannel?.trim() || null,
        input.quorumRequired,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    for (const attendee of input.attendees)
      await executeMutation(
        "INSERT INTO governance_meeting_attendees (meeting_id,party_id,attendance_role,attendance_status) VALUES (?,?,?,'EXPECTED')",
        [id, attendee.partyId, code(attendee.attendanceRole, 'Attendance role', 64)],
        connection
      );
    for (let index = 0; index < input.agenda.length; index += 1) {
      const item = input.agenda[index],
        subjectType = item.subjectType?.trim()
          ? code(item.subjectType, 'Agenda subject type', 64)
          : null,
        subjectId = item.subjectId?.trim() || null;
      if (Boolean(subjectType) !== Boolean(subjectId))
        throw new Error('Agenda subject type and subject ID must be supplied together.');
      await executeMutation(
        "INSERT INTO governance_meeting_agenda_items (id,meeting_id,item_no,subject,purpose,required_outcome,subject_type,subject_id,subject_version,status) VALUES (?,?,?,?,?,?,?,?,?,'CONFIRMED')",
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
      'EXECUTIVE_GOVERNANCE_SCHEDULED',
      null,
      'SCHEDULED',
      {
        agendaItems: input.agenda.length,
        attendees: input.attendees.length,
        quorumRequired: input.quorumRequired
      },
      connection
    );
    return id;
  });
}

export async function recordExecutiveAttendance(
  context: CommandContext,
  meetingId: string,
  partyId: string,
  status: 'PRESENT' | 'ABSENT'
) {
  assertPermission(context, 'governance.executive.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (!['SCHEDULED', 'CONVENED'].includes(meeting.status))
      throw new Error(
        'Attendance can only be recorded before or during an Executive Governance Meeting.'
      );
    const result = await executeMutation(
      'UPDATE governance_meeting_attendees SET attendance_status=? WHERE meeting_id=? AND party_id=?',
      [status, meeting.id, partyId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Executive attendee not found.');
  });
}

export async function conveneExecutiveMeeting(
  context: CommandContext,
  meetingId: string,
  expectedAggregateVersion: number
) {
  assertPermission(context, 'governance.executive.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (meeting.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Executive Governance Meeting changed after you opened it.');
    if (meeting.status !== 'SCHEDULED')
      throw new Error('Only a scheduled Executive Governance Meeting can be convened.');
    const present = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM governance_meeting_attendees WHERE meeting_id=? AND attendance_status='PRESENT'",
      [meeting.id],
      connection
    );
    if (Number(present?.count ?? 0) < meeting.quorumRequired)
      throw new Error('Executive quorum has not been met.');
    const started = now();
    const result = await executeMutation(
      "UPDATE governance_meetings SET status='CONVENED',aggregate_version=aggregate_version+1,actual_started_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [started, started, meeting.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Executive Governance change detected.');
    const updated = await getMeeting(context, meeting.id, connection);
    await evidence(
      context,
      updated,
      'EXECUTIVE_GOVERNANCE_CONVENED',
      'SCHEDULED',
      'CONVENED',
      { present: Number(present?.count ?? 0), quorumRequired: meeting.quorumRequired },
      connection
    );
  });
}

export async function recordExecutiveDecision(
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
  assertPermission(context, 'governance.executive.conduct');
  const meeting = await getMeeting(context, meetingId);
  if (meeting.status !== 'CONVENED')
    throw new Error(
      'Decisions can only be linked while the Executive Governance Meeting is convened.'
    );
  const decisionId = await recordWorkDecision(context, {
    decisionType: 'EXECUTIVE_GOVERNANCE_DECISION',
    ...input
  });
  await dbTransaction(async (connection) => {
    const locked = await getMeeting(context, meetingId, connection, true);
    if (locked.status !== 'CONVENED')
      throw new Error('Executive Governance Meeting is no longer convened.');
    await executeMutation(
      'INSERT INTO governance_meeting_decisions (meeting_id,decision_id) VALUES (?,?)',
      [locked.id, decisionId],
      connection
    );
  });
  return decisionId;
}

export async function createExecutiveAction(
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
  assertPermission(context, 'governance.executive.conduct');
  const meeting = await getMeeting(context, meetingId);
  if (meeting.status !== 'CONVENED')
    throw new Error(
      'Actions can only be created while the Executive Governance Meeting is convened.'
    );
  const workflowId = await createWorkflowInstance(context, {
    definitionKey: 'EXECUTIVE_GOVERNANCE_ACTION',
    definitionVersion: '1',
    subjectType: 'GOVERNANCE_MEETING',
    subjectId: meeting.id,
    subjectVersion: String(meeting.aggregateVersion),
    currentState: 'ACTION_REQUIRED'
  });
  const workItemId = await createWorkItem(context, workflowId, {
    workType: 'EXECUTIVE_GOVERNANCE_ACTION',
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
    if (locked.status !== 'CONVENED')
      throw new Error('Executive Governance Meeting is no longer convened.');
    await executeMutation(
      'INSERT INTO governance_meeting_actions (meeting_id,work_item_id) VALUES (?,?)',
      [locked.id, workItemId],
      connection
    );
  });
  return { workflowId, workItemId };
}

export async function completeExecutiveMeeting(
  context: CommandContext,
  meetingId: string,
  expectedAggregateVersion: number,
  input: { minutesSummary: string; nextReviewAt?: string }
) {
  assertPermission(context, 'governance.executive.conduct');
  return dbTransaction(async (connection) => {
    const meeting = await getMeeting(context, meetingId, connection, true);
    if (meeting.aggregateVersion !== expectedAggregateVersion)
      throw new Error('This Executive Governance Meeting changed after you opened it.');
    if (meeting.status !== 'CONVENED')
      throw new Error('Only a convened Executive Governance Meeting can be completed.');
    await executeMutation(
      "UPDATE governance_meeting_agenda_items SET status='CLOSED' WHERE meeting_id=? AND status='CONFIRMED'",
      [meeting.id],
      connection
    );
    const completed = now(),
      nextReviewAt = input.nextReviewAt?.trim()
        ? timestamp(input.nextReviewAt, 'Next review time')
        : null;
    const result = await executeMutation(
      "UPDATE governance_meetings SET status='COMPLETED',aggregate_version=aggregate_version+1,completed_at=?,minutes_summary=?,next_review_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [
        completed,
        required(input.minutesSummary, 'Executive minutes summary'),
        nextReviewAt,
        completed,
        meeting.id,
        context.tenantId,
        expectedAggregateVersion
      ],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Executive Governance completion detected.');
    const updated = await getMeeting(context, meeting.id, connection);
    await evidence(
      context,
      updated,
      'EXECUTIVE_GOVERNANCE_COMPLETED',
      'CONVENED',
      'COMPLETED',
      { nextReviewAt },
      connection
    );
  });
}
