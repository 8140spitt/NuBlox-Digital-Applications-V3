import type {
  ExtensionCompatibilityAssessmentId,
  ExtensionComponentId,
  ExtensionDefinitionId,
  ExtensionPackageVersionId,
  ExtensionReconciliationItemId,
  ExtensionReconciliationRunId,
  PersonId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type ExtensionKind =
  | 'INDUSTRY'
  | 'TENANT'
  | 'PLATFORM'
  | 'INTEGRATION';

export interface ExtensionDefinition {
  id: ExtensionDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  extensionKind: ExtensionKind;
  ownerReference: string;
  status: RecordStatus;
}

export type ExtensionPackageVersionStatus = 'FROZEN' | 'SUPERSEDED';

export interface ExtensionPackageVersion {
  id: ExtensionPackageVersionId;
  tenantId: TenantId;
  extensionDefinitionId: ExtensionDefinitionId;
  version: string;
  minimumPlatformVersion?: string;
  maximumPlatformVersion?: string;
  manifest: Readonly<Record<string, unknown>>;
  checksum: string;
  status: ExtensionPackageVersionStatus;
  createdByPersonId: PersonId;
  createdAt: string;
}

export type ExtensionComponentKind =
  | 'TYPE'
  | 'ATTRIBUTE'
  | 'POLICY'
  | 'RULE'
  | 'WORKFLOW'
  | 'UI_ACTION'
  | 'API'
  | 'INTEGRATION'
  | 'SEED_DATA'
  | 'OTHER';

export interface ExtensionComponent {
  id: ExtensionComponentId;
  tenantId: TenantId;
  packageVersionId: ExtensionPackageVersionId;
  componentKey: string;
  componentKind: ExtensionComponentKind;
  targetObjectType?: string;
  targetReference?: string;
  definition: Readonly<Record<string, unknown>>;
  checksum: string;
  sequence: number;
}

export type ExtensionCompatibilityOutcome =
  | 'COMPATIBLE'
  | 'RECONCILIATION_REQUIRED'
  | 'INCOMPATIBLE';

export interface ExtensionCompatibilityAssessment {
  id: ExtensionCompatibilityAssessmentId;
  tenantId: TenantId;
  packageVersionId: ExtensionPackageVersionId;
  platformVersion: string;
  outcome: ExtensionCompatibilityOutcome;
  evidence: Readonly<Record<string, unknown>>;
  assessedByPersonId: PersonId;
  assessedAt: string;
}

export type ExtensionReconciliationRunStatus =
  | 'RUNNING'
  | 'RESOLVED'
  | 'BLOCKED'
  | 'FAILED';

export interface ExtensionReconciliationRun {
  id: ExtensionReconciliationRunId;
  tenantId: TenantId;
  extensionDefinitionId: ExtensionDefinitionId;
  fromPackageVersionId: ExtensionPackageVersionId;
  toPackageVersionId: ExtensionPackageVersionId;
  targetPlatformVersion: string;
  startedByPersonId: PersonId;
  startedAt: string;
  status: ExtensionReconciliationRunStatus;
  completedAt?: string;
  summary?: string;
}

export type ExtensionReconciliationItemOutcome =
  | 'UNCHANGED'
  | 'AUTO_MERGED'
  | 'MANUAL_REQUIRED'
  | 'CONFLICT'
  | 'RESOLVED';

export interface ExtensionReconciliationItem {
  id: ExtensionReconciliationItemId;
  tenantId: TenantId;
  reconciliationRunId: ExtensionReconciliationRunId;
  componentKey: string;
  outcome: ExtensionReconciliationItemOutcome;
  sourceChecksum?: string;
  targetChecksum?: string;
  resolvedDefinition?: Readonly<Record<string, unknown>>;
  rationale?: string;
  recordedByPersonId: PersonId;
  recordedAt: string;
}
