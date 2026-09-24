import type {
  ArchiveRecordId,
  CanonicalObjectId,
  DecisionId,
  DestructionEvidenceId,
  DispositionItemResultId,
  DispositionRunId,
  DispositionScheduleId,
  HoldId,
  PersonId,
  RestoreRunId,
  RetentionPolicyId,
  RetentionRuleId,
  TenantId
} from './ids.js';

export type RetentionPolicyStatus = 'DRAFT' | 'FROZEN' | 'ACTIVE' | 'SUPERSEDED' | 'RETIRED';

export interface RetentionPolicy {
  id: RetentionPolicyId;
  tenantId: TenantId;
  scopeObjectId: CanonicalObjectId;
  code: string;
  name: string;
  description?: string;
  version: number;
  status: RetentionPolicyStatus;
  checksum?: string;
  createdByPersonId: PersonId;
  createdAt: string;
  frozenByPersonId?: PersonId;
  frozenAt?: string;
  approvalDecisionId?: DecisionId;
  activatedAt?: string;
}

export type RetentionTriggerType =
  | 'CREATED_AT'
  | 'LAST_MODIFIED_AT'
  | 'RELEASED_AT'
  | 'CLOSED_AT'
  | 'ARCHIVED_AT'
  | 'CUSTOM';

export type DispositionAction = 'ARCHIVE' | 'DESTROY' | 'REVIEW';

export interface RetentionRule {
  id: RetentionRuleId;
  tenantId: TenantId;
  retentionPolicyId: RetentionPolicyId;
  code: string;
  name: string;
  objectFamily: string;
  triggerType: RetentionTriggerType;
  triggerField?: string;
  retentionPeriodDays: number;
  selectionCriteria: Readonly<Record<string, unknown>>;
  dispositionAction: DispositionAction;
  enabled: boolean;
  sequence: number;
}

export type HoldType = 'LEGAL' | 'REGULATORY' | 'RECORDS' | 'INVESTIGATION' | 'OTHER';
export type HoldStatus = 'ACTIVE' | 'RELEASED';

export interface Hold {
  id: HoldId;
  tenantId: TenantId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  holdType: HoldType;
  reason: string;
  blocksArchive: boolean;
  blocksDestruction: boolean;
  status: HoldStatus;
  imposedByPersonId: PersonId;
  imposedAt: string;
  releaseDecisionId?: DecisionId;
  releasedByPersonId?: PersonId;
  releasedAt?: string;
}

export interface DispositionSchedule {
  id: DispositionScheduleId;
  tenantId: TenantId;
  retentionRuleId: RetentionRuleId;
  scheduleExpression: string;
  timezone: string;
  enabled: boolean;
  createdByPersonId: PersonId;
  createdAt: string;
}

export type DispositionRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'COMPLETED_WITH_EXCEPTIONS'
  | 'FAILED'
  | 'CANCELLED';

export interface DispositionRun {
  id: DispositionRunId;
  tenantId: TenantId;
  retentionRuleId: RetentionRuleId;
  scheduleId?: DispositionScheduleId;
  runReference: string;
  selectionSnapshot: Readonly<Record<string, unknown>>;
  selectionChecksum: string;
  requestedByPersonId: PersonId;
  requestedAt: string;
  status: DispositionRunStatus;
  startedAt?: string;
  completedAt?: string;
}

export type ArchiveRecordStatus = 'AVAILABLE' | 'DESTROYED';

export interface ArchiveRecord {
  id: ArchiveRecordId;
  tenantId: TenantId;
  dispositionRunId: DispositionRunId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  archiveReference: string;
  integrityHash: string;
  archiveManifest: Readonly<Record<string, unknown>>;
  status: ArchiveRecordStatus;
  archivedByPersonId: PersonId;
  archivedAt: string;
}

export type RestoreRunStatus = 'SUCCEEDED' | 'FAILED';

export interface RestoreRun {
  id: RestoreRunId;
  tenantId: TenantId;
  archiveRecordId: ArchiveRecordId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  restoreReference: string;
  restoreDecisionId: DecisionId;
  restoredContentReference: string;
  integrityHash: string;
  restoredByPersonId: PersonId;
  restoredAt: string;
  status: RestoreRunStatus;
  message?: string;
}

export type DestructionMetadataOutcome = 'TOMBSTONE_RETAINED' | 'DELETED';
export type DestructionContentOutcome = 'DELETED' | 'NOT_APPLICABLE';

export interface DestructionEvidence {
  id: DestructionEvidenceId;
  tenantId: TenantId;
  dispositionRunId: DispositionRunId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  archiveRecordId?: ArchiveRecordId;
  destructionDecisionId: DecisionId;
  method: string;
  metadataOutcome: DestructionMetadataOutcome;
  contentOutcome: DestructionContentOutcome;
  integrityHash: string;
  destroyedByPersonId: PersonId;
  destroyedAt: string;
  evidence: Readonly<Record<string, unknown>>;
}

export type DispositionItemOutcome =
  | 'HELD'
  | 'ARCHIVED'
  | 'DESTROYED'
  | 'REVIEW_REQUIRED'
  | 'SKIPPED'
  | 'FAILED';

export interface DispositionItemResult {
  id: DispositionItemResultId;
  tenantId: TenantId;
  dispositionRunId: DispositionRunId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  outcome: DispositionItemOutcome;
  reason: string;
  holdId?: HoldId;
  archiveRecordId?: ArchiveRecordId;
  destructionEvidenceId?: DestructionEvidenceId;
  recordedByPersonId: PersonId;
  recordedAt: string;
}
