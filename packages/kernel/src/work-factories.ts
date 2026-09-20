import { invariant } from './errors.js';
import type { CanonicalObjectIdentity } from './model.js';
import type {
  WorkAssignment,
  WorkItem,
  WorkflowDefinition,
  WorkflowDefinitionVersion,
  WorkflowInstance
} from './work.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

function assertDateOrder(from: string, to: string | undefined, label: string) {
  assertDate(from, `${label} effectiveFrom`);
  if (to) {
    assertDate(to, `${label} effectiveTo`);
    invariant(
      Date.parse(to) >= Date.parse(from),
      `${label} effectiveTo must not be earlier than effectiveFrom.`
    );
  }
}

export function createWorkflowDefinition(input: WorkflowDefinition): WorkflowDefinition {
  assertNonEmpty(input.code, 'Workflow Definition code');
  assertNonEmpty(input.name, 'Workflow Definition name');
  return Object.freeze({ ...input });
}

export function createWorkflowDefinitionVersion(
  input: WorkflowDefinitionVersion,
  definition: WorkflowDefinition
): WorkflowDefinitionVersion {
  assertSameTenant(input.tenantId, definition.tenantId, 'Workflow Definition Version and definition');
  invariant(
    input.workflowDefinitionId === definition.id,
    'Workflow Definition Version must reference the supplied Workflow Definition.'
  );
  invariant(Number.isInteger(input.version) && input.version >= 1, 'Workflow version must be a positive integer.');

  if (input.effectiveFrom) assertDate(input.effectiveFrom, 'Workflow Definition Version effectiveFrom');
  if (input.effectiveTo) assertDate(input.effectiveTo, 'Workflow Definition Version effectiveTo');
  if (input.effectiveFrom && input.effectiveTo) {
    invariant(
      Date.parse(input.effectiveTo) >= Date.parse(input.effectiveFrom),
      'Workflow Definition Version effectiveTo must not be earlier than effectiveFrom.'
    );
  }

  return Object.freeze({ ...input });
}

export function createWorkflowInstance(
  input: WorkflowInstance,
  definition: WorkflowDefinition,
  version: WorkflowDefinitionVersion,
  subject: CanonicalObjectIdentity
): WorkflowInstance {
  assertSameTenant(input.tenantId, definition.tenantId, 'Workflow Instance and definition');
  assertSameTenant(input.tenantId, version.tenantId, 'Workflow Instance and definition version');
  assertSameTenant(input.tenantId, subject.tenantId, 'Workflow Instance and subject');
  invariant(input.workflowDefinitionId === definition.id, 'Workflow Instance must reference the supplied definition.');
  invariant(
    input.workflowDefinitionVersionId === version.id,
    'Workflow Instance must reference the supplied definition version.'
  );
  invariant(
    version.workflowDefinitionId === definition.id,
    'Workflow Definition Version must belong to the supplied definition.'
  );
  invariant(version.status === 'PUBLISHED', 'Workflow Instance requires a published Workflow Definition Version.');
  invariant(input.subjectObjectId === subject.id, 'Workflow Instance must reference the supplied subject.');
  assertDate(input.startedAt, 'Workflow Instance startedAt');
  invariant(input.status === 'ACTIVE', 'New Workflow Instance must start ACTIVE.');
  invariant(!input.completedAt && !input.completionReason, 'New Workflow Instance must not be completed.');

  if (input.subjectVersion !== undefined) {
    assertNonEmpty(input.subjectVersion, 'Workflow Instance subjectVersion');
  }

  return Object.freeze({ ...input });
}

export function createWorkItem(
  input: WorkItem,
  workflow: WorkflowInstance,
  subject: CanonicalObjectIdentity
): WorkItem {
  assertSameTenant(input.tenantId, workflow.tenantId, 'Work Item and Workflow Instance');
  assertSameTenant(input.tenantId, subject.tenantId, 'Work Item and subject');
  invariant(input.workflowInstanceId === workflow.id, 'Work Item must reference the supplied Workflow Instance.');
  invariant(input.subjectObjectId === subject.id, 'Work Item must reference the supplied subject.');
  invariant(workflow.status === 'ACTIVE', 'Work Item requires an active Workflow Instance.');
  invariant(input.status === 'READY', 'New Work Item must start READY.');
  invariant(Number.isInteger(input.sequence) && input.sequence >= 1, 'Work Item sequence must be a positive integer.');
  assertNonEmpty(input.workType, 'Work Item workType');
  assertNonEmpty(input.title, 'Work Item title');

  if (input.subjectVersion !== undefined) assertNonEmpty(input.subjectVersion, 'Work Item subjectVersion');
  if (input.dueAt) assertDate(input.dueAt, 'Work Item dueAt');
  invariant(!input.completedAt && !input.completionNote, 'New Work Item must not be completed.');

  return Object.freeze({ ...input });
}

export function createWorkAssignment(
  input: WorkAssignment,
  workflow: WorkflowInstance,
  workItem: WorkItem
): WorkAssignment {
  assertSameTenant(input.tenantId, workflow.tenantId, 'Work Assignment and Workflow Instance');
  assertSameTenant(input.tenantId, workItem.tenantId, 'Work Assignment and Work Item');
  invariant(input.workflowInstanceId === workflow.id, 'Work Assignment must reference the supplied Workflow Instance.');
  invariant(input.workItemId === workItem.id, 'Work Assignment must reference the supplied Work Item.');
  invariant(workItem.workflowInstanceId === workflow.id, 'Work Item must belong to the supplied Workflow Instance.');
  invariant(workflow.status === 'ACTIVE', 'Work Assignment requires an active Workflow Instance.');
  invariant(!['COMPLETED', 'CANCELLED'].includes(workItem.status), 'Completed or cancelled Work cannot be assigned.');
  assertNonEmpty(input.assigneeId, 'Work Assignment assigneeId');
  assertDate(input.assignedAt, 'Work Assignment assignedAt');
  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Work Assignment');
  return Object.freeze({ ...input });
}

export function markWorkAssigned(current: WorkItem): WorkItem {
  invariant(current.status === 'READY', 'Only READY Work can become ASSIGNED.');
  return Object.freeze({ ...current, status: 'ASSIGNED' });
}

export function startWork(current: WorkItem): WorkItem {
  invariant(
    current.status === 'ASSIGNED' || current.status === 'READY',
    'Only READY or ASSIGNED Work can start.'
  );
  return Object.freeze({ ...current, status: 'IN_PROGRESS' });
}

export function blockWork(current: WorkItem): WorkItem {
  invariant(
    ['READY', 'ASSIGNED', 'IN_PROGRESS'].includes(current.status),
    'Only open Work can be blocked.'
  );
  return Object.freeze({ ...current, status: 'BLOCKED' });
}

export function resumeWork(current: WorkItem): WorkItem {
  invariant(current.status === 'BLOCKED', 'Only BLOCKED Work can resume.');
  return Object.freeze({ ...current, status: 'IN_PROGRESS' });
}

export function completeWork(
  current: WorkItem,
  completedAt: string,
  completionNote: string
): WorkItem {
  invariant(
    current.status === 'IN_PROGRESS' || current.status === 'ASSIGNED',
    'Only ASSIGNED or IN_PROGRESS Work can complete.'
  );
  assertDate(completedAt, 'Work Item completedAt');
  assertNonEmpty(completionNote, 'Work Item completionNote');
  return Object.freeze({
    ...current,
    status: 'COMPLETED',
    completedAt,
    completionNote
  });
}

export function completeWorkflow(
  current: WorkflowInstance,
  completedAt: string,
  completionReason: string
): WorkflowInstance {
  invariant(current.status === 'ACTIVE', 'Only an ACTIVE Workflow Instance can complete.');
  assertDate(completedAt, 'Workflow Instance completedAt');
  assertNonEmpty(completionReason, 'Workflow Instance completionReason');
  return Object.freeze({
    ...current,
    status: 'COMPLETED',
    completedAt,
    completionReason
  });
}


export function cancelWork(
  current: WorkItem,
  cancelledAt: string,
  cancellationReason: string
): WorkItem {
  invariant(
    !['COMPLETED', 'CANCELLED'].includes(current.status),
    'Only open Work can be cancelled.'
  );
  assertDate(cancelledAt, 'Work Item cancelledAt');
  assertNonEmpty(cancellationReason, 'Work Item cancellationReason');
  return Object.freeze({
    ...current,
    status: 'CANCELLED'
  });
}

export function escalateWork(current: WorkItem): WorkItem {
  invariant(
    !['COMPLETED', 'CANCELLED'].includes(current.status),
    'Closed Work cannot be escalated.'
  );

  const nextPriority =
    current.priority === 'LOW'
      ? 'NORMAL'
      : current.priority === 'NORMAL'
        ? 'HIGH'
        : 'URGENT';

  invariant(current.priority !== 'URGENT', 'URGENT Work cannot be escalated further.');
  return Object.freeze({ ...current, priority: nextPriority });
}

export function cancelWorkflow(
  current: WorkflowInstance,
  cancelledAt: string,
  cancellationReason: string
): WorkflowInstance {
  invariant(current.status === 'ACTIVE', 'Only an ACTIVE Workflow Instance can be cancelled.');
  assertDate(cancelledAt, 'Workflow Instance cancelledAt');
  assertNonEmpty(cancellationReason, 'Workflow Instance cancellationReason');
  return Object.freeze({
    ...current,
    status: 'CANCELLED',
    completedAt: cancelledAt,
    completionReason: cancellationReason
  });
}
