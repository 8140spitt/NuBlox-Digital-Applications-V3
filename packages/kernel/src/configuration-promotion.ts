import type {
  ConfigurationBaselineId,
  ConfigurationBaselineItemId,
  ConfigurationChangeItemId,
  ConfigurationChangeSetId,
  ConfigurationEnvironmentId,
  ConfigurationPromotionConflictDispositionId,
  ConfigurationPromotionConflictId,
  ConfigurationPromotionItemResultId,
  ConfigurationPromotionRunId,
  DecisionId,
  PersonId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type ConfigurationEnvironmentType =
  | 'DEVELOPMENT'
  | 'INTEGRATION'
  | 'TEST'
  | 'PREPRODUCTION'
  | 'PRODUCTION';

export interface ConfigurationEnvironment {
  id: ConfigurationEnvironmentId;
  tenantId: TenantId;
  code: string;
  name: string;
  environmentType: ConfigurationEnvironmentType;
  platformVersion: string;
  environmentReference: string;
  status: RecordStatus;
}

export type ConfigurationBaselineStatus = 'DRAFT' | 'FROZEN' | 'SUPERSEDED';

export interface ConfigurationBaseline {
  id: ConfigurationBaselineId;
  tenantId: TenantId;
  environmentId: ConfigurationEnvironmentId;
  baselineReference: string;
  platformVersion: string;
  status: ConfigurationBaselineStatus;
  checksum?: string;
  createdByPersonId: PersonId;
  createdAt: string;
  frozenByPersonId?: PersonId;
  frozenAt?: string;
}

export interface ConfigurationBaselineItem {
  id: ConfigurationBaselineItemId;
  tenantId: TenantId;
  baselineId: ConfigurationBaselineId;
  sequence: number;
  objectFamily: string;
  objectReference: string;
  objectVersion?: string;
  contentHash: string;
  snapshot: Readonly<Record<string, unknown>>;
}

export type ConfigurationChangeSetStatus =
  | 'DRAFT'
  | 'FROZEN'
  | 'APPROVED'
  | 'SUPERSEDED'
  | 'CANCELLED';

export interface ConfigurationChangeSet {
  id: ConfigurationChangeSetId;
  tenantId: TenantId;
  sourceEnvironmentId: ConfigurationEnvironmentId;
  baseBaselineId: ConfigurationBaselineId;
  scopeObjectId: string;
  code: string;
  name: string;
  description?: string;
  version: string;
  status: ConfigurationChangeSetStatus;
  checksum?: string;
  createdByPersonId: PersonId;
  createdAt: string;
  frozenByPersonId?: PersonId;
  frozenAt?: string;
  approvedDecisionId?: DecisionId;
  approvedAt?: string;
}

export type ConfigurationChangeOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface ConfigurationChangeItem {
  id: ConfigurationChangeItemId;
  tenantId: TenantId;
  changeSetId: ConfigurationChangeSetId;
  sequence: number;
  operation: ConfigurationChangeOperation;
  objectFamily: string;
  objectReference: string;
  beforeHash?: string;
  afterHash?: string;
  definition: Readonly<Record<string, unknown>>;
  dependencies?: readonly string[];
}

export type ConfigurationPromotionRunStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'BLOCKED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface ConfigurationPromotionRun {
  id: ConfigurationPromotionRunId;
  tenantId: TenantId;
  changeSetId: ConfigurationChangeSetId;
  sourceEnvironmentId: ConfigurationEnvironmentId;
  targetEnvironmentId: ConfigurationEnvironmentId;
  sourceBaselineId: ConfigurationBaselineId;
  expectedTargetBaselineId: ConfigurationBaselineId;
  resultingTargetBaselineId?: ConfigurationBaselineId;
  runReference: string;
  mappingDefinition: Readonly<Record<string, unknown>>;
  mappingChecksum: string;
  rollbackDefinition: Readonly<Record<string, unknown>>;
  rollbackChecksum: string;
  requestedByPersonId: PersonId;
  requestedAt: string;
  status: ConfigurationPromotionRunStatus;
  startedAt?: string;
  completedAt?: string;
}

export type ConfigurationPromotionItemOutcome =
  | 'APPLIED'
  | 'NO_CHANGE'
  | 'SKIPPED'
  | 'FAILED'
  | 'CONFLICT';

export interface ConfigurationPromotionItemResult {
  id: ConfigurationPromotionItemResultId;
  tenantId: TenantId;
  promotionRunId: ConfigurationPromotionRunId;
  changeItemId: ConfigurationChangeItemId;
  outcome: ConfigurationPromotionItemOutcome;
  targetHash?: string;
  message?: string;
  recordedByPersonId: PersonId;
  recordedAt: string;
}

export type ConfigurationPromotionConflictType =
  | 'MAPPING'
  | 'DEPENDENCY'
  | 'VERSION'
  | 'AUTHORITY'
  | 'COMPATIBILITY'
  | 'TARGET_DRIFT'
  | 'DATA'
  | 'OTHER';

export type ConfigurationPromotionConflictSeverity = 'WARNING' | 'BLOCKING';
export type ConfigurationPromotionConflictStatus =
  | 'OPEN'
  | 'DISPOSITIONED'
  | 'RESOLVED';

export interface ConfigurationPromotionConflict {
  id: ConfigurationPromotionConflictId;
  tenantId: TenantId;
  promotionRunId: ConfigurationPromotionRunId;
  itemResultId?: ConfigurationPromotionItemResultId;
  conflictType: ConfigurationPromotionConflictType;
  severity: ConfigurationPromotionConflictSeverity;
  code: string;
  description: string;
  status: ConfigurationPromotionConflictStatus;
  detectedAt: string;
  resolvedAt?: string;
}

export type ConfigurationPromotionConflictDispositionType =
  | 'MAP'
  | 'USE_SOURCE'
  | 'USE_TARGET'
  | 'WAIVE'
  | 'EXCLUDE'
  | 'ABORT';

export interface ConfigurationPromotionConflictDisposition {
  id: ConfigurationPromotionConflictDispositionId;
  tenantId: TenantId;
  conflictId: ConfigurationPromotionConflictId;
  disposition: ConfigurationPromotionConflictDispositionType;
  rationale: string;
  decisionId: DecisionId;
  disposedByPersonId: PersonId;
  disposedAt: string;
}
