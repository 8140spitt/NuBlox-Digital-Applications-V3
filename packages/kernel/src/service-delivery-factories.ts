import { invariant } from './errors.js';
import type { CanonicalObjectIdentity, Person } from './model.js';
import type {
  ServiceAssignment,
  ServiceExecutionRecord,
  ServiceOrder
} from './service-delivery.js';

function required(value: string, label: string) {
  invariant(Boolean(value.trim()), label + ' must not be empty.');
}

function sameTenant(
  left: { tenantId: string },
  right: { tenantId: string },
  label: string
) {
  invariant(left.tenantId === right.tenantId, label + ' must remain within one tenant.');
}

function validDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), label + ' must be a valid date/time.');
}

export function createServiceOrder(
  input: ServiceOrder,
  scope: CanonicalObjectIdentity,
  creator: Person
): ServiceOrder {
  sameTenant(input, scope, 'Service Order scope');
  sameTenant(input, creator, 'Service Order creator');
  invariant(input.scopeObjectId === scope.id, 'Service Order scope reference does not match.');
  invariant(input.createdByPersonId === creator.id, 'Service Order creator reference does not match.');
  required(input.orderNumber, 'Service Order number');
  required(input.title, 'Service Order title');
  validDate(input.createdAt, 'Service Order createdAt');
  if (input.requestedStart) validDate(input.requestedStart, 'Service Order requestedStart');
  if (input.requestedEnd) validDate(input.requestedEnd, 'Service Order requestedEnd');
  if (input.requestedStart && input.requestedEnd) {
    invariant(
      Date.parse(input.requestedEnd) >= Date.parse(input.requestedStart),
      'Service Order requestedEnd cannot precede requestedStart.'
    );
  }
  if (input.slaDueAt) validDate(input.slaDueAt, 'Service Order slaDueAt');
  invariant(
    input.status === 'DRAFT' &&
      !input.completedAt &&
      !input.acceptedAt,
    'New Service Order must start DRAFT.'
  );
  return Object.freeze({ ...input });
}

export function createServiceAssignment(
  input: ServiceAssignment,
  order: ServiceOrder,
  assignee: Person
): ServiceAssignment {
  sameTenant(input, order, 'Service Assignment order');
  sameTenant(input, assignee, 'Service Assignment assignee');
  invariant(input.serviceOrderId === order.id, 'Service Assignment order reference does not match.');
  invariant(input.assigneePersonId === assignee.id, 'Service Assignment assignee reference does not match.');
  invariant(
    order.status === 'DRAFT' || order.status === 'SCHEDULED',
    'Assignments can only be added to DRAFT or SCHEDULED Service Orders.'
  );
  validDate(input.scheduledStart, 'Service Assignment scheduledStart');
  validDate(input.scheduledEnd, 'Service Assignment scheduledEnd');
  invariant(
    Date.parse(input.scheduledEnd) >= Date.parse(input.scheduledStart),
    'Service Assignment scheduledEnd cannot precede scheduledStart.'
  );
  invariant(input.status === 'PLANNED', 'New Service Assignment must start PLANNED.');
  return Object.freeze({ ...input });
}

export function createServiceExecutionRecord(
  input: ServiceExecutionRecord,
  order: ServiceOrder,
  recorder: Person,
  assignment?: ServiceAssignment
): ServiceExecutionRecord {
  sameTenant(input, order, 'Service Execution order');
  sameTenant(input, recorder, 'Service Execution recorder');
  invariant(input.serviceOrderId === order.id, 'Service Execution order reference does not match.');
  invariant(input.recordedByPersonId === recorder.id, 'Service Execution recorder reference does not match.');
  invariant(
    ['DISPATCHED', 'IN_PROGRESS', 'COMPLETED'].includes(order.status),
    'Execution can only be recorded after dispatch and before acceptance.'
  );
  if (assignment) {
    sameTenant(input, assignment, 'Service Execution assignment');
    invariant(
      input.assignmentId === assignment.id && assignment.serviceOrderId === order.id,
      'Service Execution assignment reference does not match.'
    );
  } else {
    invariant(!input.assignmentId, 'Service Execution cannot reference an unsupplied assignment.');
  }
  validDate(input.occurredAt, 'Service Execution occurredAt');
  if (input.durationMinutes !== undefined) {
    invariant(
      Number.isFinite(input.durationMinutes) && input.durationMinutes >= 0,
      'Service Execution duration must be zero or greater.'
    );
  }
  return Object.freeze({
    ...input,
    ...(input.evidence ? { evidence: Object.freeze({ ...input.evidence }) } : {})
  });
}

export function dispatchServiceAssignment(
  current: ServiceAssignment,
  dispatchedAt: string
): ServiceAssignment {
  invariant(current.status === 'PLANNED', 'Only a PLANNED Service Assignment can be dispatched.');
  validDate(dispatchedAt, 'Service Assignment dispatchedAt');
  return Object.freeze({ ...current, status: 'DISPATCHED', dispatchedAt });
}

export function startServiceAssignment(
  current: ServiceAssignment,
  onSiteAt: string
): ServiceAssignment {
  invariant(
    ['DISPATCHED', 'ACKNOWLEDGED', 'EN_ROUTE'].includes(current.status),
    'Only a dispatched Service Assignment can start on site.'
  );
  validDate(onSiteAt, 'Service Assignment onSiteAt');
  return Object.freeze({ ...current, status: 'ON_SITE', onSiteAt });
}

export function completeServiceOrder(
  current: ServiceOrder,
  completer: Person,
  completedAt: string,
  executionRecords: readonly ServiceExecutionRecord[]
): ServiceOrder {
  sameTenant(current, completer, 'Service Order completer');
  invariant(
    current.status === 'DISPATCHED' || current.status === 'IN_PROGRESS',
    'Only a dispatched or in-progress Service Order can be completed.'
  );
  invariant(
    executionRecords.some((record) => record.serviceOrderId === current.id),
    'Service Order requires execution evidence before completion.'
  );
  validDate(completedAt, 'Service Order completedAt');
  return Object.freeze({
    ...current,
    status: 'COMPLETED',
    completedByPersonId: completer.id,
    completedAt
  });
}

export function acceptServiceOrder(
  current: ServiceOrder,
  accepter: Person,
  acceptedAt: string,
  acceptanceNote?: string
): ServiceOrder {
  sameTenant(current, accepter, 'Service Order accepter');
  invariant(current.status === 'COMPLETED', 'Only a COMPLETED Service Order can be accepted.');
  invariant(Boolean(current.completedAt), 'Completed Service Order requires completion evidence.');
  validDate(acceptedAt, 'Service Order acceptedAt');
  invariant(
    Date.parse(acceptedAt) >= Date.parse(current.completedAt!),
    'Service Order acceptance cannot predate completion.'
  );
  return Object.freeze({
    ...current,
    status: 'ACCEPTED',
    acceptedByPersonId: accepter.id,
    acceptedAt,
    ...(acceptanceNote?.trim() ? { acceptanceNote: acceptanceNote.trim() } : {})
  });
}
