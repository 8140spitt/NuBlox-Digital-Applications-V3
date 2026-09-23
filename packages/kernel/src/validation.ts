import type {
  CanonicalObjectId,
  MappingPolicyId,
  RelationshipConstraintPolicyId,
  TenantId,
  ValidationConflictId,
  ValidationRuleDefinitionId,
  ValidationRuleEvaluationRunId,
  ValidationRuleResultId,
  ValidationRuleSetId,
  ValidationRuleSetMemberId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type ValidationRuleType =
  | 'ELIGIBILITY'
  | 'REQUIRED_DATA'
  | 'STATE'
  | 'RELATIONSHIP'
  | 'CONSISTENCY'
  | 'MAPPING'
  | 'CUSTOM';

export type ValidationSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'BLOCKING';

export interface ValidationRuleDefinition {
  id: ValidationRuleDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  ruleType: ValidationRuleType;
  version: number;
  severity: ValidationSeverity;
  handlerKey: string;
  configuration?: Readonly<Record<string, unknown>>;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface ValidationRuleSet {
  id: ValidationRuleSetId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface ValidationRuleSetMember {
  id: ValidationRuleSetMemberId;
  tenantId: TenantId;
  ruleSetId: ValidationRuleSetId;
  ruleDefinitionId: ValidationRuleDefinitionId;
  sequence: number;
  mandatory: boolean;
  status: RecordStatus;
}

export type ValidationEvaluationStatus =
  | 'RUNNING'
  | 'PASSED'
  | 'FAILED'
  | 'ERROR';

export interface ValidationRuleEvaluationRun {
  id: ValidationRuleEvaluationRunId;
  tenantId: TenantId;
  ruleSetId: ValidationRuleSetId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  contextType?: string;
  contextId?: string;
  evaluatedAt: string;
  status: ValidationEvaluationStatus;
}

export type ValidationRuleResultStatus =
  | 'PASSED'
  | 'FAILED'
  | 'NOT_APPLICABLE'
  | 'ERROR';

export interface ValidationRuleResult {
  id: ValidationRuleResultId;
  tenantId: TenantId;
  evaluationRunId: ValidationRuleEvaluationRunId;
  ruleDefinitionId: ValidationRuleDefinitionId;
  status: ValidationRuleResultStatus;
  message?: string;
  evidence?: Readonly<Record<string, unknown>>;
}

export type ValidationConflictStatus =
  | 'OPEN'
  | 'RESOLVED'
  | 'WAIVED'
  | 'CANCELLED';

export interface ValidationConflict {
  id: ValidationConflictId;
  tenantId: TenantId;
  evaluationRunId: ValidationRuleEvaluationRunId;
  ruleResultId: ValidationRuleResultId;
  subjectObjectId: CanonicalObjectId;
  summary: string;
  status: ValidationConflictStatus;
  resolutionReason?: string;
}

export interface RelationshipConstraintPolicy {
  id: RelationshipConstraintPolicyId;
  tenantId: TenantId;
  code: string;
  name: string;
  relationshipType: string;
  sourceObjectType: string;
  targetObjectType: string;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface MappingPolicy {
  id: MappingPolicyId;
  tenantId: TenantId;
  code: string;
  name: string;
  sourceType: string;
  targetType: string;
  mapping: Readonly<Record<string, unknown>>;
  precedence: number;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}
