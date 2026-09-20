import type {
  AccessRoleAssignmentId,
  AccessRoleId,
  AccessRolePermissionId,
  TenantId
} from './ids.js';
import type { PermissionDefinition, RecordStatus } from './model.js';

export type AccessCatalogueScope = 'PLATFORM' | 'TENANT';
export type AccessPrincipalType = 'PERSON' | 'POSITION' | 'ORGANISATION_UNIT';

export interface AccessRoleDefinition {
  id: AccessRoleId;
  catalogueScope: AccessCatalogueScope;
  tenantId?: TenantId;
  code: string;
  name: string;
  description?: string;
  status: RecordStatus;
}

export interface AccessRolePermission {
  id: AccessRolePermissionId;
  accessRoleId: AccessRoleId;
  permissionKey: PermissionDefinition['key'];
}

export interface AccessPrincipalReference {
  principalType: AccessPrincipalType;
  principalId: string;
  tenantId: TenantId;
}

export interface AccessRoleAssignment {
  id: AccessRoleAssignmentId;
  tenantId: TenantId;
  accessRoleId: AccessRoleId;
  principalType: AccessPrincipalType;
  principalId: string;
  scopeType: string;
  scopeId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface PermissionScope {
  scopeType: string;
  scopeId?: string;
}

export interface PermissionEvaluation {
  allowed: boolean;
  permissionKey: string;
  tenantId: TenantId;
  personId: string;
  scope: PermissionScope;
  evaluatedAt: string;
  reason: string;
  matchedRoleId?: AccessRoleId;
  matchedAssignmentId?: AccessRoleAssignmentId;
  matchedPrincipalType?: AccessPrincipalType;
}
