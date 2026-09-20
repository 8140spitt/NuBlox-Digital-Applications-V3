import { invariant } from './errors.js';
import type { CanonicalObjectIdentity, Person } from './model.js';
import type {
  CanonicalDataEnvelope,
  ExternalIdentity,
  IdempotencyRecord,
  IntegrationJob,
  MigrationReconciliation,
  OutboxMessage,
  ProjectionCheckpoint
} from './portability.js';

function assertSameTenant(expected: string, actual: string, label: string) {
  invariant(expected === actual, `${label} must belong to the same tenant.`);
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

function assertDate(value: string, label: string) {
  invariant(Number.isFinite(Date.parse(value)), `${label} must be a valid date/time.`);
}

export function createOutboxMessage(input: OutboxMessage): OutboxMessage {
  assertNonEmpty(input.aggregateType, 'Outbox aggregateType');
  assertNonEmpty(input.aggregateId, 'Outbox aggregateId');
  assertNonEmpty(input.eventType, 'Outbox eventType');
  assertDate(input.occurredAt, 'Outbox occurredAt');
  invariant(input.status === 'PENDING', 'New Outbox Message must start PENDING.');
  invariant(input.attempts === 0, 'New Outbox Message must start with zero attempts.');
  invariant(!input.publishedAt && !input.lastError, 'New Outbox Message must not contain publication result.');
  if (input.nextAttemptAt) assertDate(input.nextAttemptAt, 'Outbox nextAttemptAt');
  return Object.freeze({ ...input });
}

export function markOutboxPublished(
  current: OutboxMessage,
  publishedAt: string
): OutboxMessage {
  invariant(
    current.status === 'PENDING' || current.status === 'FAILED',
    'Only pending or failed Outbox Messages can publish.'
  );
  assertDate(publishedAt, 'Outbox publishedAt');
  return Object.freeze({
    ...current,
    status: 'PUBLISHED',
    attempts: current.attempts + 1,
    publishedAt
  });
}

export function markOutboxFailed(
  current: OutboxMessage,
  error: string,
  nextAttemptAt?: string
): OutboxMessage {
  invariant(
    current.status === 'PENDING' || current.status === 'FAILED',
    'Only pending or failed Outbox Messages can fail publication.'
  );
  assertNonEmpty(error, 'Outbox failure error');
  if (nextAttemptAt) assertDate(nextAttemptAt, 'Outbox nextAttemptAt');
  return Object.freeze({
    ...current,
    status: 'FAILED',
    attempts: current.attempts + 1,
    lastError: error,
    ...(nextAttemptAt ? { nextAttemptAt } : {})
  });
}

export function createIntegrationJob(
  input: IntegrationJob,
  requester?: Person
): IntegrationJob {
  assertDate(input.requestedAt, 'Integration Job requestedAt');
  invariant(input.status === 'QUEUED', 'New Integration Job must start QUEUED.');
  invariant(
    !input.startedAt && !input.completedAt && !input.resultReference && !input.errorMessage,
    'New Integration Job must not contain execution result state.'
  );

  if (requester) {
    assertSameTenant(input.tenantId, requester.tenantId, 'Integration Job and requester');
    invariant(
      input.requestedByPersonId === requester.id,
      'Integration Job requestedByPersonId must reference the supplied Person.'
    );
  } else {
    invariant(
      !input.requestedByPersonId,
      'Integration Job cannot reference a requester that was not supplied.'
    );
  }

  if (input.jobType === 'IMPORT') {
    invariant(Boolean(input.sourceSystem?.trim()), 'IMPORT job requires sourceSystem.');
  }
  if (input.jobType === 'EXPORT') {
    invariant(Boolean(input.targetSystem?.trim()), 'EXPORT job requires targetSystem.');
  }

  return Object.freeze({ ...input });
}

export function startIntegrationJob(
  current: IntegrationJob,
  startedAt: string
): IntegrationJob {
  invariant(current.status === 'QUEUED', 'Only a QUEUED Integration Job can start.');
  assertDate(startedAt, 'Integration Job startedAt');
  return Object.freeze({ ...current, status: 'RUNNING', startedAt });
}

export function completeIntegrationJob(
  current: IntegrationJob,
  completedAt: string,
  resultReference?: string
): IntegrationJob {
  invariant(current.status === 'RUNNING', 'Only a RUNNING Integration Job can complete.');
  assertDate(completedAt, 'Integration Job completedAt');
  if (resultReference) assertNonEmpty(resultReference, 'Integration Job resultReference');
  return Object.freeze({
    ...current,
    status: 'SUCCEEDED',
    completedAt,
    ...(resultReference ? { resultReference } : {})
  });
}

export function failIntegrationJob(
  current: IntegrationJob,
  completedAt: string,
  errorMessage: string
): IntegrationJob {
  invariant(current.status === 'RUNNING', 'Only a RUNNING Integration Job can fail.');
  assertDate(completedAt, 'Integration Job completedAt');
  assertNonEmpty(errorMessage, 'Integration Job errorMessage');
  return Object.freeze({
    ...current,
    status: 'FAILED',
    completedAt,
    errorMessage
  });
}

export function createIdempotencyRecord(
  input: IdempotencyRecord
): IdempotencyRecord {
  assertNonEmpty(input.scope, 'Idempotency scope');
  assertNonEmpty(input.key, 'Idempotency key');
  assertNonEmpty(input.requestHash, 'Idempotency requestHash');
  assertDate(input.createdAt, 'Idempotency createdAt');
  invariant(input.status === 'IN_PROGRESS', 'New Idempotency Record must start IN_PROGRESS.');
  invariant(!input.responseReference && !input.errorMessage, 'New Idempotency Record must not contain result state.');
  if (input.expiresAt) {
    assertDate(input.expiresAt, 'Idempotency expiresAt');
    invariant(
      Date.parse(input.expiresAt) >= Date.parse(input.createdAt),
      'Idempotency expiresAt must not be earlier than createdAt.'
    );
  }
  return Object.freeze({ ...input });
}

export function completeIdempotencyRecord(
  current: IdempotencyRecord,
  responseReference?: string
): IdempotencyRecord {
  invariant(current.status === 'IN_PROGRESS', 'Only IN_PROGRESS Idempotency Record can complete.');
  return Object.freeze({
    ...current,
    status: 'COMPLETED',
    ...(responseReference ? { responseReference } : {})
  });
}

export function failIdempotencyRecord(
  current: IdempotencyRecord,
  errorMessage: string
): IdempotencyRecord {
  invariant(current.status === 'IN_PROGRESS', 'Only IN_PROGRESS Idempotency Record can fail.');
  assertNonEmpty(errorMessage, 'Idempotency errorMessage');
  return Object.freeze({
    ...current,
    status: 'FAILED',
    errorMessage
  });
}

export function createCanonicalDataEnvelope(
  input: CanonicalDataEnvelope
): CanonicalDataEnvelope {
  assertNonEmpty(input.schemaName, 'Data Envelope schemaName');
  assertNonEmpty(input.schemaVersion, 'Data Envelope schemaVersion');
  assertNonEmpty(input.objectType, 'Data Envelope objectType');
  assertNonEmpty(input.stableKey, 'Data Envelope stableKey');
  assertNonEmpty(input.checksum, 'Data Envelope checksum');
  assertDate(input.createdAt, 'Data Envelope createdAt');

  if (input.externalObjectId) {
    invariant(
      Boolean(input.externalSystem?.trim()),
      'Data Envelope externalObjectId requires externalSystem.'
    );
  }

  return Object.freeze({ ...input });
}

export function createExternalIdentity(
  input: ExternalIdentity,
  object: CanonicalObjectIdentity
): ExternalIdentity {
  assertSameTenant(input.tenantId, object.tenantId, 'External Identity and canonical object');
  invariant(
    input.canonicalObjectId === object.id,
    'External Identity must reference the supplied canonical object.'
  );
  assertNonEmpty(input.externalSystem, 'External Identity externalSystem');
  assertNonEmpty(input.externalObjectType, 'External Identity externalObjectType');
  assertNonEmpty(input.externalObjectId, 'External Identity externalObjectId');
  if (input.externalVersion) assertNonEmpty(input.externalVersion, 'External Identity externalVersion');
  if (input.sourceReference) assertNonEmpty(input.sourceReference, 'External Identity sourceReference');
  return Object.freeze({ ...input });
}

export function createMigrationReconciliation(
  input: MigrationReconciliation,
  externalIdentity: ExternalIdentity,
  object: CanonicalObjectIdentity
): MigrationReconciliation {
  assertSameTenant(input.tenantId, externalIdentity.tenantId, 'Reconciliation and External Identity');
  assertSameTenant(input.tenantId, object.tenantId, 'Reconciliation and canonical object');
  invariant(
    input.externalIdentityId === externalIdentity.id,
    'Reconciliation must reference the supplied External Identity.'
  );
  invariant(
    input.canonicalObjectId === object.id,
    'Reconciliation must reference the supplied canonical object.'
  );
  invariant(
    externalIdentity.canonicalObjectId === object.id,
    'External Identity and Reconciliation must resolve to the same canonical object.'
  );
  assertDate(input.checkedAt, 'Reconciliation checkedAt');

  if (input.status === 'VERIFIED') {
    invariant(
      Boolean(input.sourceHash && input.targetHash),
      'VERIFIED reconciliation requires sourceHash and targetHash.'
    );
    invariant(
      input.sourceHash === input.targetHash,
      'VERIFIED reconciliation requires matching source and target hashes.'
    );
  }

  return Object.freeze({ ...input });
}

export function createProjectionCheckpoint(
  input: ProjectionCheckpoint
): ProjectionCheckpoint {
  assertNonEmpty(input.projectionName, 'Projection Checkpoint projectionName');
  assertNonEmpty(input.partitionKey, 'Projection Checkpoint partitionKey');
  assertDate(input.updatedAt, 'Projection Checkpoint updatedAt');
  if (input.lastEventSequence !== undefined) {
    invariant(
      Number.isInteger(input.lastEventSequence) && input.lastEventSequence >= 0,
      'Projection Checkpoint lastEventSequence must be a non-negative integer.'
    );
  }
  if (input.lastOccurredAt) assertDate(input.lastOccurredAt, 'Projection Checkpoint lastOccurredAt');
  return Object.freeze({ ...input });
}
