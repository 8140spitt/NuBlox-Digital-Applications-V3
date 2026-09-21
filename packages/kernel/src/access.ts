import type {
  AccessPermissionRequestId,
  AccessRoleAssignmentId,
  AccessRoleId,
  AccessRolePermissionId,
  TenantId
} from './ids.js';
import type { PermissionDefinition, RecordStatus } from './model.js';

export const PLATFORM_ADMINISTRATOR_ROLE_ID =
  'ROLE-PLATFORM-ADMINISTRATOR' as AccessRoleId;

export const PLATFORM_PERMISSION_KEYS = {
  FUNCTION_READ: 'platform.function.read',
  WORK_READ: 'platform.work.read',
  ORGANISATION_READ: 'platform.organisation.read',
  ORGANISATION_MANAGE: 'platform.organisation.manage',
  PEOPLE_READ: 'platform.people.read',
  PEOPLE_MANAGE: 'platform.people.manage',
  ACCESS_MANAGE: 'platform.access.manage',
  DEPLOYMENT_READ: 'platform.deployment.read',
  DEPLOYMENT_MANAGE: 'platform.deployment.manage',
  AUDIT_READ: 'platform.audit.read',
  CONFIGURATION_READ: 'platform.configuration.read',
  CONFIGURATION_MANAGE: 'platform.configuration.manage'
} as const;

export type PlatformPermissionKey =
  (typeof PLATFORM_PERMISSION_KEYS)[keyof typeof PLATFORM_PERMISSION_KEYS];

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


export type AccessPermissionRequestStatus =
  | 'PENDING'
  | 'FULFILLED'
  | 'REJECTED'
  | 'CANCELLED';

export interface AccessPermissionRequest {
  id: AccessPermissionRequestId;
  tenantId: TenantId;
  requestorPersonId: string;
  permissionKey: string;
  scopeType: string;
  scopeId?: string;
  reason: string;
  status: AccessPermissionRequestStatus;
  requestedAt: string;
  resolvedByPersonId?: string;
  resolvedAt?: string;
  resolutionReason?: string;
}
