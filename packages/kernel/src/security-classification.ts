import type {
  CanonicalObjectId,
  ClearanceGrantId,
  DecisionId,
  SecurityAccessExceptionId,
  SecurityClassificationAssignmentId,
  SecurityClassificationLevelId,
  SecurityClassificationSchemeId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type SecurityClassificationSchemeKind = 'ORDINAL' | 'CATEGORICAL';

export interface SecurityClassificationScheme {
  id: SecurityClassificationSchemeId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  kind: SecurityClassificationSchemeKind;
  status: RecordStatus;
}

export interface SecurityClassificationLevel {
  id: SecurityClassificationLevelId;
  tenantId: TenantId;
  schemeId: SecurityClassificationSchemeId;
  code: string;
  name: string;
  description?: string;
  rankOrder?: number;
  status: RecordStatus;
}

export interface SecurityClassificationAssignment {
  id: SecurityClassificationAssignmentId;
  tenantId: TenantId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  classificationLevelId: SecurityClassificationLevelId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type SecurityPrincipalType =
  | 'PERSON'
  | 'POSITION'
  | 'ORGANISATION_UNIT'
  | 'ORGANISATION';

export interface SecurityPrincipalReference {
  principalType: SecurityPrincipalType;
  principalId: string;
}

export interface ClearanceGrant {
  id: ClearanceGrantId;
  tenantId: TenantId;
  principalType: SecurityPrincipalType;
  principalId: string;
  classificationLevelId: SecurityClassificationLevelId;
  includeLowerLevels: boolean;
  scopeType: string;
  scopeId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface SecurityAccessException {
  id: SecurityAccessExceptionId;
  tenantId: TenantId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  principalType: SecurityPrincipalType;
  principalId: string;
  classificationLevelId: SecurityClassificationLevelId;
  approvalDecisionId: DecisionId;
  reason: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface SecurityClearanceCandidate {
  grant: ClearanceGrant;
  level: SecurityClassificationLevel;
  scheme: SecurityClassificationScheme;
}

export interface SecurityClassificationAccessEvaluation {
  allowed: boolean;
  reason: string;
  matchedClearanceGrantId?: ClearanceGrantId;
  matchedExceptionId?: SecurityAccessExceptionId;
}
