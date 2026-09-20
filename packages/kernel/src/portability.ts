import type {
  CanonicalObjectId,
  DataEnvelopeId,
  ExternalIdentityId,
  IdempotencyRecordId,
  IntegrationJobId,
  MigrationReconciliationId,
  OutboxMessageId,
  PersonId,
  ProjectionCheckpointId,
  TenantId
} from './ids.js';

export type OutboxStatus = 'PENDING' | 'PUBLISHED' | 'FAILED';

export interface OutboxMessage {
  id: OutboxMessageId;
  tenantId: TenantId;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Readonly<Record<string, unknown>>;
  occurredAt: string;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt?: string;
  publishedAt?: string;
  lastError?: string;
}

export type IntegrationJobType =
  | 'IMPORT'
  | 'EXPORT'
  | 'SYNC'
  | 'RECONCILE'
  | 'PROJECTION';

export type IntegrationJobStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface IntegrationJob {
  id: IntegrationJobId;
  tenantId: TenantId;
  jobType: IntegrationJobType;
  sourceSystem?: string;
  targetSystem?: string;
  requestedByPersonId?: PersonId;
  requestedAt: string;
  status: IntegrationJobStatus;
  startedAt?: string;
  completedAt?: string;
  cursor?: string;
  resultReference?: string;
  errorMessage?: string;
}

export type IdempotencyStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRecord {
  id: IdempotencyRecordId;
  tenantId: TenantId;
  scope: string;
  key: string;
  requestHash: string;
  status: IdempotencyStatus;
  responseReference?: string;
  errorMessage?: string;
  createdAt: string;
  expiresAt?: string;
}

export type DataEnvelopeDirection = 'IMPORT' | 'EXPORT';

export interface CanonicalDataEnvelope {
  id: DataEnvelopeId;
  tenantId: TenantId;
  direction: DataEnvelopeDirection;
  schemaName: string;
  schemaVersion: string;
  objectType: string;
  stableKey: string;
  payload: Readonly<Record<string, unknown>>;
  externalSystem?: string;
  externalObjectId?: string;
  checksum: string;
  createdAt: string;
}

export interface ExternalIdentity {
  id: ExternalIdentityId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  externalSystem: string;
  externalObjectType: string;
  externalObjectId: string;
  externalVersion?: string;
  sourceReference?: string;
}

export type MigrationReconciliationStatus =
  | 'PENDING'
  | 'MATCHED'
  | 'CONFLICT'
  | 'MISSING'
  | 'VERIFIED';

export interface MigrationReconciliation {
  id: MigrationReconciliationId;
  tenantId: TenantId;
  externalIdentityId: ExternalIdentityId;
  canonicalObjectId: CanonicalObjectId;
  status: MigrationReconciliationStatus;
  sourceHash?: string;
  targetHash?: string;
  checkedAt: string;
  details?: string;
}

export interface ProjectionCheckpoint {
  id: ProjectionCheckpointId;
  tenantId: TenantId;
  projectionName: string;
  partitionKey: string;
  lastEventSequence?: number;
  lastOccurredAt?: string;
  updatedAt: string;
}
