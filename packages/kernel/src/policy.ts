import type {
  PolicyAssignmentId,
  PolicyDefinitionId,
  PolicyScopeId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type PolicyScopeType =
  | 'TENANT'
  | 'ORGANISATION'
  | 'ORGANISATION_UNIT'
  | 'PROGRAMME'
  | 'PROJECT'
  | 'CONTRACT'
  | 'WORK_PACKAGE'
  | 'SITE'
  | 'ASSET'
  | 'SERVICE'
  | 'CUSTOM';

export interface PolicyScope {
  id: PolicyScopeId;
  tenantId: TenantId;
  parentPolicyScopeId?: PolicyScopeId;
  scopeType: PolicyScopeType;
  scopeObjectId?: string;
  code: string;
  name: string;
  status: RecordStatus;
}

export type PolicyType =
  | 'ACCESS'
  | 'SECURITY'
  | 'GOVERNANCE'
  | 'CONFIGURATION'
  | 'CREATION'
  | 'RETENTION'
  | 'CUSTOM';

export interface PolicyDefinition {
  id: PolicyDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  policyType: PolicyType;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type PolicyAssignmentMode = 'SUPPLEMENT' | 'OVERRIDE' | 'BLOCK';

export interface PolicyAssignment {
  id: PolicyAssignmentId;
  tenantId: TenantId;
  policyScopeId: PolicyScopeId;
  policyDefinitionId: PolicyDefinitionId;
  assignmentMode: PolicyAssignmentMode;
  precedence: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}
