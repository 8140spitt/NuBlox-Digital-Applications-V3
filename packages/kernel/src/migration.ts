import type {
  CanonicalObjectId,
  DataEnvelopeId,
  DecisionId,
  ExternalIdentityId,
  IntegrationJobId,
  MigrationConflictDispositionId,
  MigrationConflictId,
  MigrationItemResultId,
  MigrationMappingVersionId,
  MigrationPlanId,
  MigrationReconciliationRunId,
  MigrationRunId,
  PersonId,
  SourceAuthorityRuleId,
  TenantId,
  CutoverDecisionId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type MigrationCutoverStrategy =
  | 'BIG_BANG'
  | 'PHASED'
  | 'PARALLEL'
  | 'ROLLING';

export type MigrationPlanStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MigrationPlan {
  id: MigrationPlanId;
  tenantId: TenantId;
  code: string;
  name: string;
  sourceSystem: string;
  targetSystem: string;
  scopeObjectId: CanonicalObjectId;
  scopeDefinition: Readonly<Record<string, unknown>>;
  cutoverStrategy: MigrationCutoverStrategy;
  status: MigrationPlanStatus;
  createdByPersonId: PersonId;
  createdAt: string;
  approvedDecisionId?: DecisionId;
  approvedAt?: string;
}

export type MigrationMappingStatus =
  | 'DRAFT'
  | 'FROZEN'
  | 'SUPERSEDED';

export interface MigrationMappingVersion {
  id: MigrationMappingVersionId;
  tenantId: TenantId;
  migrationPlanId: MigrationPlanId;
  version: string;
  sourceSchemaVersion: string;
  targetSchemaVersion: string;
  mappingDefinition: Readonly<Record<string, unknown>>;
  checksum: string;
  status: MigrationMappingStatus;
  createdByPersonId: PersonId;
  createdAt: string;
  frozenByPersonId?: PersonId;
  frozenAt?: string;
}

export type MigrationRunType =
  | 'DRY_RUN'
  | 'REHEARSAL'
  | 'PRODUCTION';

export type MigrationRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'AWAITING_RECONCILIATION'
  | 'RECONCILED'
  | 'BLOCKED'
  | 'FAILED'
  | 'CANCELLED';

export interface MigrationRun {
  id: MigrationRunId;
  tenantId: TenantId;
  migrationPlanId: MigrationPlanId;
  mappingVersionId: MigrationMappingVersionId;
  runReference: string;
  runType: MigrationRunType;
  integrationJobId?: IntegrationJobId;
  requestedByPersonId: PersonId;
  requestedAt: string;
  status: MigrationRunStatus;
  startedAt?: string;
  loadCompletedAt?: string;
  completedAt?: string;
  errorMessage?: string;
}

export type MigrationItemOutcome =
  | 'CREATED'
  | 'UPDATED'
  | 'MATCHED'
  | 'SKIPPED'
  | 'FAILED'
  | 'CONFLICT';

export interface MigrationItemResult {
  id: MigrationItemResultId;
  tenantId: TenantId;
  migrationRunId: MigrationRunId;
  sequence: number;
  sourceSystem: string;
  sourceObjectType: string;
  sourceObjectId: string;
  sourceVersion?: string;
  sourceEnvelopeId: DataEnvelopeId;
  targetCanonicalObjectId?: CanonicalObjectId;
  targetVersion?: string;
  externalIdentityId?: ExternalIdentityId;
  outcome: MigrationItemOutcome;
  sourceHash: string;
  targetHash?: string;
  message?: string;
  recordedAt: string;
}

export type MigrationConflictType =
  | 'IDENTITY'
  | 'MAPPING'
  | 'VALIDATION'
  | 'VERSION'
  | 'AUTHORITY'
  | 'DUPLICATE'
  | 'DATA'
  | 'OTHER';

export type MigrationConflictSeverity = 'WARNING' | 'BLOCKING';
export type MigrationConflictStatus = 'OPEN' | 'DISPOSITIONED' | 'RESOLVED';

export interface MigrationConflict {
  id: MigrationConflictId;
  tenantId: TenantId;
  migrationRunId: MigrationRunId;
  migrationItemResultId?: MigrationItemResultId;
  conflictType: MigrationConflictType;
  severity: MigrationConflictSeverity;
  code: string;
  description: string;
  status: MigrationConflictStatus;
  detectedAt: string;
  resolvedAt?: string;
}

export type MigrationConflictDispositionType =
  | 'USE_SOURCE'
  | 'USE_TARGET'
  | 'MAP'
  | 'WAIVE'
  | 'RETRY'
  | 'EXCLUDE';

export interface MigrationConflictDisposition {
  id: MigrationConflictDispositionId;
  tenantId: TenantId;
  migrationConflictId: MigrationConflictId;
  disposition: MigrationConflictDispositionType;
  rationale: string;
  decisionId: DecisionId;
  disposedByPersonId: PersonId;
  disposedAt: string;
  retryRunId?: MigrationRunId;
}

export type MigrationReconciliationRunStatus =
  | 'RUNNING'
  | 'VERIFIED'
  | 'CONFLICT'
  | 'FAILED';

export type MigrationReconciliationCheckpoint =
  | 'PRE_CUTOVER'
  | 'CUTOVER'
  | 'POST_CUTOVER';

export interface MigrationReconciliationRun {
  id: MigrationReconciliationRunId;
  tenantId: TenantId;
  migrationRunId: MigrationRunId;
  checkpoint: MigrationReconciliationCheckpoint;
  status: MigrationReconciliationRunStatus;
  startedByPersonId: PersonId;
  startedAt: string;
  completedAt?: string;
  sourceCount?: number;
  targetCount?: number;
  verifiedCount?: number;
  conflictCount?: number;
  missingCount?: number;
  details?: string;
}

export type CutoverOutcome = 'APPROVED' | 'REJECTED';

export interface CutoverDecision {
  id: CutoverDecisionId;
  tenantId: TenantId;
  migrationPlanId: MigrationPlanId;
  migrationRunId: MigrationRunId;
  reconciliationRunId: MigrationReconciliationRunId;
  decisionId: DecisionId;
  outcome: CutoverOutcome;
  targetAuthorityRuleId?: SourceAuthorityRuleId;
  decidedByPersonId: PersonId;
  decidedAt: string;
  effectiveAt?: string;
  reason: string;
}

export interface MigrationControlOptions {
  status: RecordStatus;
}
