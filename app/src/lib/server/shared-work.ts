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

export type WorkflowInstance = {
  id: string;
  definitionKey: string;
  definitionVersion: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  status: string;
  version: number;
  currentState: string | null;
  startedAt: string;
  completedAt: string | null;
  completionReason: string | null;
};

export type WorkItem = {
  id: string;
  workflowInstanceId: string;
  workType: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  title: string;
  instructions: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
  version: number;
  completionNote: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MyWorkItem = WorkItem & {
  workflowDefinitionKey: string;
  workflowDefinitionVersion: string;
};

export type WorkAssignmentTargetType = 'PARTY' | 'USER_IDENTITY' | 'ROLE' | 'QUEUE';

export type WorkEscalation = {
  id: string;
  workflowInstanceId: string;
  workItemId: string;
  triggerCode: string;
  ruleKey: string | null;
  fromAssignmentRef: string | null;
  toAssignmentRef: string | null;
  reason: string;
  status: string;
  occurredAt: string;
  resolvedAt: string | null;
};

const workflowSelect =
  'SELECT id, definition_key AS definitionKey, definition_version AS definitionVersion, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, status, version, current_state AS currentState, started_at AS startedAt, completed_at AS completedAt, completion_reason AS completionReason FROM workflow_instances';
const workItemSelect =
  'SELECT id, workflow_instance_id AS workflowInstanceId, work_type AS workType, subject_type AS subjectType, subject_id AS subjectId, subject_version AS subjectVersion, title, instructions, status, priority, due_at AS dueAt, version, completion_note AS completionNote, completed_at AS completedAt, created_at AS createdAt, updated_at AS updatedAt FROM work_items';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function optionalTimestamp(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function priority(value?: string) {
  const clean = value?.trim().toUpperCase() || 'NORMAL';
  if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(clean)) {
    throw new Error('Work priority must be LOW, NORMAL, HIGH or URGENT.');
  }
  return clean;
}

function assignmentTargetType(value: string): WorkAssignmentTargetType {
  const clean = value.trim().toUpperCase();
  if (!['PARTY', 'USER_IDENTITY', 'ROLE', 'QUEUE'].includes(clean)) {
    throw new Error('Work assignment target type is invalid.');
  }
  return clean as WorkAssignmentTargetType;
}

async function getWorkflow(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & WorkflowInstance>(
    workflowSelect +
      ' WHERE id = ? AND tenant_id = ?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Workflow Instance not found.');
  return row;
}

async function getWorkItem(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & WorkItem>(
    workItemSelect +
      ' WHERE id = ? AND tenant_id = ?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Work Item not found.');
  return row;
}

async function bumpWorkflow(
  context: CommandContext,
  workflow: WorkflowInstance,
  executor: DbExecutor
) {
  const timestamp = now();
  const result = await executeMutation(
    'UPDATE workflow_instances SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
    [timestamp, workflow.id, context.tenantId, workflow.version],
    executor
  );
  if (result.affectedRows !== 1) throw new Error('Concurrent Workflow Instance change detected.');
  return getWorkflow(context, workflow.id, executor);
}

async function evidence(
  context: CommandContext,
  workflow: WorkflowInstance,
  objectType: string,
  objectId: string,
  action: string,
  fromState: string | undefined,
  toState: string | undefined,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-27-WORKFLOW',
      objectType,
      objectId,
      action,
      fromState,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-27-WORKFLOW',
      aggregateType: 'WorkflowInstance',
      aggregateObjectId: workflow.id,
      aggregateVersion: workflow.version,
      eventType: action,
      topic: 'nublox.work.workflow',
      payload: {
        workflowInstanceId: workflow.id,
        objectType,
        objectId,
        ...payload
      }
    },
    executor
  );
}

async function assertAssigneeEligible(
  context: CommandContext,
  type: WorkAssignmentTargetType,
  assigneeId: string,
  executor: DbExecutor
) {
  const id = required(assigneeId, 'Assignee ID');
  if (type === 'QUEUE') {
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,190}$/.test(id)) {
      throw new Error('Queue assignment ID contains unsupported characters.');
    }
    return;
  }

  let row: RowDataPacket | undefined;
  if (type === 'PARTY') {
    row = await queryOne<RowDataPacket>(
      `SELECT p.id
         FROM parties p
         JOIN memberships m
           ON m.party_id = p.id
          AND m.tenant_id = p.tenant_id
          AND m.context_type = 'TENANT'
          AND m.context_id = p.tenant_id
          AND m.status = 'ACTIVE'
          AND (m.valid_to IS NULL OR m.valid_to > ?)
        WHERE p.id = ?
          AND p.tenant_id = ?
          AND p.status = 'ACTIVE'
        LIMIT 1`,
      [now(), id, context.tenantId],
      executor
    );
  } else if (type === 'USER_IDENTITY') {
    row = await queryOne<RowDataPacket>(
      `SELECT ui.id
         FROM user_identities ui
         JOIN parties p ON p.id = ui.party_id AND p.tenant_id = ui.tenant_id
         JOIN memberships m
           ON m.party_id = p.id
          AND m.tenant_id = p.tenant_id
          AND m.context_type = 'TENANT'
          AND m.context_id = p.tenant_id
          AND m.status = 'ACTIVE'
          AND (m.valid_to IS NULL OR m.valid_to > ?)
        WHERE ui.id = ?
          AND ui.tenant_id = ?
          AND ui.status = 'ACTIVE'
          AND p.status = 'ACTIVE'
        LIMIT 1`,
      [now(), id, context.tenantId],
      executor
    );
  } else {
    row = await queryOne<RowDataPacket>(
      "SELECT id FROM role_definitions WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [id, context.tenantId],
      executor
    );
  }
  if (!row) throw new Error('Work assignment target is not eligible in this tenant.');
}

async function actorRoleIds(context: CommandContext, executor?: DbExecutor) {
  if (!context.roleKeys.length) return [] as string[];
  const placeholders = context.roleKeys.map(() => '?').join(', ');
  const rows = await queryRows<RowDataPacket & { id: string }>(
    `SELECT id
       FROM role_definitions
      WHERE tenant_id = ?
        AND status = 'ACTIVE'
        AND role_key IN (${placeholders})`,
    [context.tenantId, ...context.roleKeys],
    executor
  );
  return rows.map((row) => row.id);
}

async function actorHasActiveAssignment(
  context: CommandContext,
  workItemId: string,
  executor: DbExecutor
) {
  const roles = await actorRoleIds(context, executor);
  const timestamp = now();
  const params: unknown[] = [
    workItemId,
    context.tenantId,
    timestamp,
    timestamp,
    context.actorPartyId,
    context.userIdentityId
  ];
  let roleClause = '';
  if (roles.length) {
    roleClause = ` OR (assignee_type = 'ROLE' AND assignee_id IN (${roles
      .map(() => '?')
      .join(', ')}))`;
    params.push(...roles);
  }
  const row = await queryOne<RowDataPacket>(
    `SELECT id
       FROM work_assignments
      WHERE work_item_id = ?
        AND tenant_id = ?
        AND status = 'ACTIVE'
        AND valid_from <= ?
        AND (valid_to IS NULL OR valid_to > ?)
        AND (
          (assignee_type = 'PARTY' AND assignee_id = ?)
          OR (assignee_type = 'USER_IDENTITY' AND assignee_id = ?)
          ${roleClause}
        )
      LIMIT 1`,
    params,
    executor
  );
  return Boolean(row);
}

export async function listWorkflowInstances(context: CommandContext) {
  assertPermission(context, 'work.workflow.read');
  return queryRows<RowDataPacket & WorkflowInstance>(
    workflowSelect + ' WHERE tenant_id = ? ORDER BY started_at DESC, id',
    [context.tenantId]
  );
}

export async function createWorkflowInstance(
  context: CommandContext,
  input: {
    definitionKey: string;
    definitionVersion: string;
    subjectType: string;
    subjectId: string;
    subjectVersion?: string;
    currentState?: string;
  }
) {
  assertPermission(context, 'work.workflow.manage');
  const id = randomUUID();
  const timestamp = now();
  return dbTransaction(async (connection) => {
    await executeMutation(
      `INSERT INTO workflow_instances
        (id, tenant_id, definition_key, definition_version, subject_type, subject_id, subject_version,
         started_by_party_id, status, version, current_state, started_at, completed_at,
         completion_reason, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RUNNING', 1, ?, ?, NULL, NULL, ?, ?)`,
      [
        id,
        context.tenantId,
        required(input.definitionKey, 'Workflow definition key'),
        required(input.definitionVersion, 'Workflow definition version'),
        required(input.subjectType, 'Workflow subject type'),
        required(input.subjectId, 'Workflow subject ID'),
        input.subjectVersion?.trim() || null,
        context.actorPartyId,
        input.currentState?.trim() || null,
        timestamp,
        timestamp,
        timestamp
      ],
      connection
    );
    const workflow = await getWorkflow(context, id, connection);
    await evidence(
      context,
      workflow,
      'workflow_instance',
      id,
      'WORKFLOW_INSTANCE_STARTED',
      undefined,
      'RUNNING',
      {
        definitionKey: workflow.definitionKey,
        definitionVersion: workflow.definitionVersion,
        subjectType: workflow.subjectType,
        subjectId: workflow.subjectId,
        subjectVersion: workflow.subjectVersion
      },
      connection
    );
    return id;
  });
}

export async function createWorkItem(
  context: CommandContext,
  workflowInstanceId: string,
  input: {
    workType: string;
    title: string;
    instructions?: string;
    subjectType?: string;
    subjectId?: string;
    subjectVersion?: string;
    priority?: string;
    dueAt?: string;
  }
) {
  assertPermission(context, 'work.item.manage');
  return dbTransaction(async (connection) => {
    const workflow = await getWorkflow(context, workflowInstanceId, connection, true);
    if (!['RUNNING', 'WAITING'].includes(workflow.status)) {
      throw new Error('Work Items can only be created on a running or waiting Workflow Instance.');
    }

    const id = randomUUID();
    const timestamp = now();
    const dueAt = optionalTimestamp(input.dueAt, 'Work due date');
    await executeMutation(
      `INSERT INTO work_items
        (id, tenant_id, workflow_instance_id, work_type, subject_type, subject_id, subject_version,
         title, instructions, status, priority, due_at, version, created_by_party_id,
         completion_note, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'READY', ?, ?, 1, ?, NULL, NULL, ?, ?)`,
      [
        id,
        context.tenantId,
        workflow.id,
        required(input.workType, 'Work type').toUpperCase(),
        input.subjectType?.trim() || workflow.subjectType,
        input.subjectId?.trim() || workflow.subjectId,
        input.subjectVersion?.trim() || workflow.subjectVersion,
        required(input.title, 'Work title'),
        input.instructions?.trim() || null,
        priority(input.priority),
        dueAt,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_item',
      id,
      'WORK_ITEM_CREATED',
      undefined,
      'READY',
      { dueAt, priority: priority(input.priority) },
      connection
    );
    return id;
  });
}

export async function assignWorkItem(
  context: CommandContext,
  workItemId: string,
  input: {
    assigneeType: string;
    assigneeId: string;
    basis: string;
  }
) {
  assertPermission(context, 'work.assignment.manage');
  const targetType = assignmentTargetType(input.assigneeType);
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
      throw new Error('Completed or cancelled Work Items cannot be assigned.');
    }

    await assertAssigneeEligible(context, targetType, input.assigneeId, connection);
    const assigneeId = required(input.assigneeId, 'Assignee ID');
    const timestamp = now();
    const existing = await queryOne<RowDataPacket & { id: string }>(
      `SELECT id
         FROM work_assignments
        WHERE work_item_id = ?
          AND tenant_id = ?
          AND assignee_type = ?
          AND assignee_id = ?
          AND status = 'ACTIVE'
          AND (valid_to IS NULL OR valid_to > ?)
        LIMIT 1
        FOR UPDATE`,
      [item.id, context.tenantId, targetType, assigneeId, timestamp],
      connection
    );
    if (existing) return existing.id;

    await executeMutation(
      "UPDATE work_assignments SET status = 'REASSIGNED', valid_to = ? WHERE work_item_id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [timestamp, item.id, context.tenantId],
      connection
    );

    const assignmentId = randomUUID();
    await executeMutation(
      `INSERT INTO work_assignments
        (id, tenant_id, workflow_instance_id, work_item_id, assignee_type, assignee_id,
         assigned_by_party_id, assignment_basis, status, valid_from, valid_to, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, NULL, ?)`,
      [
        assignmentId,
        context.tenantId,
        workflow.id,
        item.id,
        targetType,
        assigneeId,
        context.actorPartyId,
        required(input.basis, 'Assignment basis'),
        timestamp,
        timestamp
      ],
      connection
    );

    const result = await executeMutation(
      `UPDATE work_items
          SET status = CASE WHEN status = 'READY' THEN 'ASSIGNED' ELSE status END,
              version = version + 1,
              updated_at = ?
        WHERE id = ? AND tenant_id = ? AND version = ?`,
      [timestamp, item.id, context.tenantId, item.version],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Work Item assignment detected.');

    const updatedItem = await getWorkItem(context, item.id, connection);
    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_assignment',
      assignmentId,
      'WORK_ITEM_ASSIGNED',
      item.status,
      updatedItem.status,
      {
        workItemId: item.id,
        assigneeType: targetType,
        assigneeId,
        workItemVersion: updatedItem.version
      },
      connection
    );
    return assignmentId;
  });
}

export async function listMyWork(context: CommandContext): Promise<MyWorkItem[]> {
  assertPermission(context, 'work.item.read');
  const roles = await actorRoleIds(context);
  const timestamp = now();
  const params: unknown[] = [
    context.tenantId,
    timestamp,
    timestamp,
    context.actorPartyId,
    context.userIdentityId
  ];
  let roleClause = '';
  if (roles.length) {
    roleClause = ` OR (wa.assignee_type = 'ROLE' AND wa.assignee_id IN (${roles
      .map(() => '?')
      .join(', ')}))`;
    params.push(...roles);
  }
  return queryRows<RowDataPacket & MyWorkItem>(
    `SELECT wi.id,
            wi.workflow_instance_id AS workflowInstanceId,
            wi.work_type AS workType,
            wi.subject_type AS subjectType,
            wi.subject_id AS subjectId,
            wi.subject_version AS subjectVersion,
            wi.title,
            wi.instructions,
            wi.status,
            wi.priority,
            wi.due_at AS dueAt,
            wi.version,
            wi.completion_note AS completionNote,
            wi.completed_at AS completedAt,
            wi.created_at AS createdAt,
            wi.updated_at AS updatedAt,
            wf.definition_key AS workflowDefinitionKey,
            wf.definition_version AS workflowDefinitionVersion
       FROM work_items wi
       JOIN workflow_instances wf
         ON wf.id = wi.workflow_instance_id
        AND wf.tenant_id = wi.tenant_id
      WHERE wi.tenant_id = ?
        AND wi.status IN ('ASSIGNED', 'IN_PROGRESS', 'BLOCKED')
        AND EXISTS (
          SELECT 1
            FROM work_assignments wa
           WHERE wa.work_item_id = wi.id
             AND wa.tenant_id = wi.tenant_id
             AND wa.status = 'ACTIVE'
             AND wa.valid_from <= ?
             AND (wa.valid_to IS NULL OR wa.valid_to > ?)
             AND (
               (wa.assignee_type = 'PARTY' AND wa.assignee_id = ?)
               OR (wa.assignee_type = 'USER_IDENTITY' AND wa.assignee_id = ?)
               ${roleClause}
             )
        )
      ORDER BY CASE wi.priority
                 WHEN 'URGENT' THEN 0
                 WHEN 'HIGH' THEN 1
                 WHEN 'NORMAL' THEN 2
                 ELSE 3
               END,
               wi.due_at IS NULL,
               wi.due_at,
               wi.created_at`,
    params
  );
}

async function transitionAssignedWorkItem(
  context: CommandContext,
  workItemId: string,
  expectedVersion: number,
  allowedFrom: string[],
  toState: string,
  action: string,
  completionNote?: string
) {
  assertPermission(context, 'work.item.execute');
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (item.version !== expectedVersion) {
      throw new Error('This Work Item changed after you opened it.');
    }
    if (!allowedFrom.includes(item.status)) {
      throw new Error(`Work Item cannot move from ${item.status} to ${toState}.`);
    }
    if (!(await actorHasActiveAssignment(context, item.id, connection))) {
      throw new Error('The current actor does not hold an active assignment for this Work Item.');
    }

    const timestamp = now();
    const result = await executeMutation(
      `UPDATE work_items
          SET status = ?,
              version = version + 1,
              completion_note = CASE WHEN ? = 'COMPLETED' THEN ? ELSE completion_note END,
              completed_at = CASE WHEN ? = 'COMPLETED' THEN ? ELSE completed_at END,
              updated_at = ?
        WHERE id = ? AND tenant_id = ? AND version = ?`,
      [
        toState,
        toState,
        completionNote?.trim() || null,
        toState,
        timestamp,
        timestamp,
        item.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Work Item change detected.');

    if (toState === 'COMPLETED') {
      await executeMutation(
        "UPDATE work_assignments SET status = 'COMPLETED', valid_to = ? WHERE work_item_id = ? AND tenant_id = ? AND status = 'ACTIVE'",
        [timestamp, item.id, context.tenantId],
        connection
      );
    }

    const updatedItem = await getWorkItem(context, item.id, connection);
    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_item',
      item.id,
      action,
      item.status,
      updatedItem.status,
      {
        workItemVersion: updatedItem.version,
        subjectType: updatedItem.subjectType,
        subjectId: updatedItem.subjectId,
        subjectVersion: updatedItem.subjectVersion
      },
      connection
    );
    return updatedItem;
  });
}

export const startWorkItem = (
  context: CommandContext,
  workItemId: string,
  expectedVersion: number
) =>
  transitionAssignedWorkItem(
    context,
    workItemId,
    expectedVersion,
    ['ASSIGNED', 'BLOCKED'],
    'IN_PROGRESS',
    'WORK_ITEM_STARTED'
  );

export const completeWorkItem = (
  context: CommandContext,
  workItemId: string,
  expectedVersion: number,
  completionNote?: string
) =>
  transitionAssignedWorkItem(
    context,
    workItemId,
    expectedVersion,
    ['ASSIGNED', 'IN_PROGRESS', 'BLOCKED'],
    'COMPLETED',
    'WORK_ITEM_COMPLETED',
    completionNote
  );

export async function changeWorkItemDueDate(
  context: CommandContext,
  workItemId: string,
  expectedVersion: number,
  newDueAt: string | undefined,
  reason: string
) {
  assertPermission(context, 'work.item.manage');
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (item.version !== expectedVersion) throw new Error('This Work Item changed after you opened it.');
    if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
      throw new Error('Completed or cancelled Work Items cannot change due date.');
    }

    const dueAt = optionalTimestamp(newDueAt, 'New due date');
    const timestamp = now();
    const changeId = randomUUID();
    await executeMutation(
      'INSERT INTO work_due_date_changes (id, tenant_id, workflow_instance_id, work_item_id, prior_due_at, new_due_at, changed_by_party_id, reason, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        changeId,
        context.tenantId,
        workflow.id,
        item.id,
        item.dueAt,
        dueAt,
        context.actorPartyId,
        required(reason, 'Due-date change reason'),
        timestamp
      ],
      connection
    );
    const result = await executeMutation(
      'UPDATE work_items SET due_at = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [dueAt, timestamp, item.id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Work Item due-date change detected.');

    const updated = await getWorkItem(context, item.id, connection);
    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_due_date_change',
      changeId,
      'WORK_ITEM_DUE_DATE_CHANGED',
      item.dueAt ?? undefined,
      dueAt ?? undefined,
      { workItemId: item.id, priorDueAt: item.dueAt, newDueAt: dueAt, workItemVersion: updated.version },
      connection
    );
    return updated;
  });
}

export async function changeWorkItemPriority(
  context: CommandContext,
  workItemId: string,
  expectedVersion: number,
  newPriority: string,
  reason: string
) {
  assertPermission(context, 'work.item.manage');
  const targetPriority = priority(newPriority);
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (item.version !== expectedVersion) throw new Error('This Work Item changed after you opened it.');
    if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
      throw new Error('Completed or cancelled Work Items cannot change priority.');
    }
    if (item.priority === targetPriority) return item;

    const timestamp = now();
    const changeId = randomUUID();
    await executeMutation(
      'INSERT INTO work_priority_changes (id, tenant_id, workflow_instance_id, work_item_id, prior_priority, new_priority, changed_by_party_id, reason, occurred_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        changeId,
        context.tenantId,
        workflow.id,
        item.id,
        item.priority,
        targetPriority,
        context.actorPartyId,
        required(reason, 'Priority change reason'),
        timestamp
      ],
      connection
    );
    const result = await executeMutation(
      'UPDATE work_items SET priority = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [targetPriority, timestamp, item.id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Work Item priority change detected.');

    const updated = await getWorkItem(context, item.id, connection);
    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_priority_change',
      changeId,
      'WORK_ITEM_PRIORITY_CHANGED',
      item.priority,
      targetPriority,
      {
        workItemId: item.id,
        priorPriority: item.priority,
        newPriority: targetPriority,
        workItemVersion: updated.version
      },
      connection
    );
    return updated;
  });
}

export async function acknowledgeWorkItem(
  context: CommandContext,
  workItemId: string,
  input: { acknowledgementType?: string; statement?: string; channel?: string }
) {
  assertPermission(context, 'work.item.execute');
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (!(await actorHasActiveAssignment(context, item.id, connection))) {
      throw new Error('The current actor does not hold an active assignment for this Work Item.');
    }

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      `INSERT INTO work_acknowledgements
        (id, tenant_id, workflow_instance_id, work_item_id, actor_party_id, subject_type,
         subject_id, subject_version, acknowledgement_type, statement, channel, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        context.tenantId,
        workflow.id,
        item.id,
        context.actorPartyId,
        item.subjectType,
        item.subjectId,
        item.subjectVersion,
        input.acknowledgementType?.trim().toUpperCase() || 'RECEIVED',
        input.statement?.trim() || null,
        input.channel?.trim().toUpperCase() || 'NUBLOX',
        timestamp,
        timestamp
      ],
      connection
    );
    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_acknowledgement',
      id,
      'WORK_ITEM_ACKNOWLEDGED',
      undefined,
      'RECORDED',
      { workItemId: item.id, subjectType: item.subjectType, subjectId: item.subjectId },
      connection
    );
    return id;
  });
}


export async function completeWorkflowInstance(
  context: CommandContext,
  workflowInstanceId: string,
  expectedVersion: number,
  completionReason: string
) {
  assertPermission(context, 'work.workflow.manage');
  return dbTransaction(async (connection) => {
    const workflow = await getWorkflow(context, workflowInstanceId, connection, true);
    if (workflow.version !== expectedVersion) {
      throw new Error('This Workflow Instance changed after you opened it.');
    }
    if (!['RUNNING', 'WAITING'].includes(workflow.status)) {
      throw new Error('Only a running or waiting Workflow Instance can be completed.');
    }

    const openWork = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM work_items WHERE tenant_id = ? AND workflow_instance_id = ? AND status NOT IN ('COMPLETED', 'CANCELLED')",
      [context.tenantId, workflow.id],
      connection
    );
    if (Number(openWork?.count ?? 0) > 0) {
      throw new Error('Workflow Instance cannot complete while open Work Items remain.');
    }

    const timestamp = now();
    const reason = required(completionReason, 'Workflow completion reason');
    const result = await executeMutation(
      "UPDATE workflow_instances SET status = 'COMPLETED', version = version + 1, completed_at = ?, completion_reason = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?",
      [timestamp, reason, timestamp, workflow.id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Workflow Instance completion detected.');
    }

    const completed = await getWorkflow(context, workflow.id, connection);
    await evidence(
      context,
      completed,
      'workflow_instance',
      workflow.id,
      'WORKFLOW_INSTANCE_COMPLETED',
      workflow.status,
      'COMPLETED',
      {
        completionReason: reason,
        subjectType: completed.subjectType,
        subjectId: completed.subjectId,
        subjectVersion: completed.subjectVersion
      },
      connection
    );
    return completed;
  });
}


export async function listWorkEscalations(
  context: CommandContext,
  workItemId?: string
): Promise<WorkEscalation[]> {
  assertPermission(context, 'work.item.read');
  const where = workItemId
    ? ' WHERE tenant_id = ? AND work_item_id = ?'
    : ' WHERE tenant_id = ?';
  const params = workItemId ? [context.tenantId, workItemId] : [context.tenantId];
  return queryRows<RowDataPacket & WorkEscalation>(
    `SELECT id,
            workflow_instance_id AS workflowInstanceId,
            work_item_id AS workItemId,
            trigger_code AS triggerCode,
            rule_key AS ruleKey,
            from_assignment_ref AS fromAssignmentRef,
            to_assignment_ref AS toAssignmentRef,
            reason,
            status,
            occurred_at AS occurredAt,
            resolved_at AS resolvedAt
       FROM work_escalations${where}
      ORDER BY occurred_at DESC, id DESC`,
    params
  );
}

export async function escalateWorkItem(
  context: CommandContext,
  workItemId: string,
  input: {
    triggerCode: string;
    reason: string;
    ruleKey?: string;
    fromAssignmentRef?: string;
    toAssignmentRef?: string;
  }
) {
  assertPermission(context, 'work.item.manage');
  return dbTransaction(async (connection) => {
    const initial = await getWorkItem(context, workItemId, connection);
    const workflow = await getWorkflow(context, initial.workflowInstanceId, connection, true);
    const item = await getWorkItem(context, workItemId, connection, true);
    if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
      throw new Error('Completed or cancelled Work Items cannot be escalated.');
    }

    const id = randomUUID();
    const timestamp = now();
    const triggerCode = required(input.triggerCode, 'Escalation trigger code').toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9._:-]{0,127}$/.test(triggerCode)) {
      throw new Error('Escalation trigger code contains unsupported characters.');
    }
    const reason = required(input.reason, 'Escalation reason');
    await executeMutation(
      `INSERT INTO work_escalations
        (id, tenant_id, workflow_instance_id, work_item_id, trigger_code, rule_key,
         from_assignment_ref, to_assignment_ref, reason, status, occurred_at, resolved_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, NULL, ?)`,
      [
        id,
        context.tenantId,
        workflow.id,
        item.id,
        triggerCode,
        input.ruleKey?.trim() || null,
        input.fromAssignmentRef?.trim() || null,
        input.toAssignmentRef?.trim() || null,
        reason,
        timestamp,
        timestamp
      ],
      connection
    );

    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_escalation',
      id,
      'WORK_ITEM_ESCALATED',
      undefined,
      'OPEN',
      {
        workItemId: item.id,
        triggerCode,
        ruleKey: input.ruleKey?.trim() || null,
        fromAssignmentRef: input.fromAssignmentRef?.trim() || null,
        toAssignmentRef: input.toAssignmentRef?.trim() || null,
        reason
      },
      connection
    );
    return id;
  });
}

export async function resolveWorkEscalation(
  context: CommandContext,
  escalationId: string,
  resolutionNote: string
) {
  assertPermission(context, 'work.item.manage');
  return dbTransaction(async (connection) => {
    const escalation = await queryOne<RowDataPacket & WorkEscalation>(
      `SELECT id,
              workflow_instance_id AS workflowInstanceId,
              work_item_id AS workItemId,
              trigger_code AS triggerCode,
              rule_key AS ruleKey,
              from_assignment_ref AS fromAssignmentRef,
              to_assignment_ref AS toAssignmentRef,
              reason,
              status,
              occurred_at AS occurredAt,
              resolved_at AS resolvedAt
         FROM work_escalations
        WHERE id = ? AND tenant_id = ?
        FOR UPDATE`,
      [escalationId, context.tenantId],
      connection
    );
    if (!escalation) throw new Error('Work escalation not found.');
    if (escalation.status !== 'OPEN') return escalation;

    const workflow = await getWorkflow(context, escalation.workflowInstanceId, connection, true);
    const note = required(resolutionNote, 'Escalation resolution note');
    const timestamp = now();
    const result = await executeMutation(
      "UPDATE work_escalations SET status = 'RESOLVED', resolved_at = ? WHERE id = ? AND tenant_id = ? AND status = 'OPEN'",
      [timestamp, escalation.id, context.tenantId],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Work escalation change detected.');

    const updatedWorkflow = await bumpWorkflow(context, workflow, connection);
    await evidence(
      context,
      updatedWorkflow,
      'work_escalation',
      escalation.id,
      'WORK_ITEM_ESCALATION_RESOLVED',
      'OPEN',
      'RESOLVED',
      {
        workItemId: escalation.workItemId,
        triggerCode: escalation.triggerCode,
        resolutionNote: note
      },
      connection
    );
    return {
      ...escalation,
      status: 'RESOLVED',
      resolvedAt: timestamp
    };
  });
}
