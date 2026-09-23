import type {
  BaselineId,
  ConfigurationCriterionId,
  ConfigurationItemId,
  ConfigurationResolutionDefinitionId,
  ConfigurationResolutionItemId,
  ConfigurationResolutionRunId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type ConfigurationCriterionType =
  | 'BASELINE'
  | 'EXPLICIT_VERSION'
  | 'EFFECTIVITY'
  | 'LATEST_ESTABLISHED_BASELINE';

export interface ConfigurationResolutionDefinition {
  id: ConfigurationResolutionDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface ConfigurationCriterion {
  id: ConfigurationCriterionId;
  tenantId: TenantId;
  definitionId: ConfigurationResolutionDefinitionId;
  sequence: number;
  criterionType: ConfigurationCriterionType;
  mandatory: boolean;
  configuration: Readonly<Record<string, unknown>>;
  status: RecordStatus;
}

export interface ConfigurationResolutionInput {
  configurationItemIds: readonly ConfigurationItemId[];
  baselineId?: BaselineId;
  explicitVersions?: Readonly<Record<string, string>>;
  scopeType?: string;
  scopeId?: string;
  evaluatedAt: string;
}

export type ConfigurationResolutionRunStatus =
  | 'RUNNING'
  | 'RESOLVED'
  | 'PARTIAL'
  | 'FAILED'
  | 'ERROR';

export interface ConfigurationResolutionRun {
  id: ConfigurationResolutionRunId;
  tenantId: TenantId;
  definitionId: ConfigurationResolutionDefinitionId;
  contextObjectId: string;
  input: ConfigurationResolutionInput;
  startedAt: string;
  completedAt?: string;
  status: ConfigurationResolutionRunStatus;
}

export type ConfigurationResolutionItemStatus =
  | 'RESOLVED'
  | 'UNRESOLVED'
  | 'CONFLICT'
  | 'ERROR';

export interface ConfigurationResolutionItem {
  id: ConfigurationResolutionItemId;
  tenantId: TenantId;
  runId: ConfigurationResolutionRunId;
  configurationItemId: ConfigurationItemId;
  selectedVersion?: string;
  criterionId?: ConfigurationCriterionId;
  status: ConfigurationResolutionItemStatus;
  message?: string;
  evidence: Readonly<Record<string, unknown>>;
}
