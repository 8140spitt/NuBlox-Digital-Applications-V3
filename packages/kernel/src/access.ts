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
  POLICY_READ: 'platform.policy.read',
  POLICY_MANAGE: 'platform.policy.manage',
  SECURITY_CLASSIFICATION_READ: 'platform.security_classification.read',
  SECURITY_CLASSIFICATION_MANAGE: 'platform.security_classification.manage',
  VALIDATION_POLICY_READ: 'platform.validation_policy.read',
  VALIDATION_POLICY_MANAGE: 'platform.validation_policy.manage',
  VALIDATION_EXECUTE: 'platform.validation.execute',
  VALIDATION_CONFLICT_DISPOSITION: 'platform.validation.conflict.disposition',
  METADATA_READ: 'platform.metadata.read',
  METADATA_MANAGE: 'platform.metadata.manage',
  DEPLOYMENT_READ: 'platform.deployment.read',
  DEPLOYMENT_MANAGE: 'platform.deployment.manage',
  COMPETENCE_READ: 'platform.competence.read',
  COMPETENCE_MANAGE: 'platform.competence.manage',
  INFORMATION_READ: 'platform.information.read',
  INFORMATION_MANAGE: 'platform.information.manage',
  DELIVERABLE_READ: 'platform.deliverable.read',
  DELIVERABLE_MANAGE: 'platform.deliverable.manage',
  EXCHANGE_READ: 'platform.exchange.read',
  EXCHANGE_MANAGE: 'platform.exchange.manage',
  EXCHANGE_RECEIVE: 'platform.exchange.receive',
  EXCHANGE_AUTHORITY_ADOPT: 'platform.exchange.authority_adopt',
  INTEGRATION_READ: 'platform.integration.read',
  INTEGRATION_MANAGE: 'platform.integration.manage',
  PUBLICATION_EXECUTE: 'platform.publication.execute',
  PUBLICATION_RESULT_RECORD: 'platform.publication.result_record',
  SOURCE_AUTHORITY_MANAGE: 'platform.source_authority.manage',
  MIGRATION_READ: 'platform.migration.read',
  MIGRATION_MANAGE: 'platform.migration.manage',
  MIGRATION_EXECUTE: 'platform.migration.execute',
  MIGRATION_CONFLICT_DISPOSITION: 'platform.migration.conflict_disposition',
  MIGRATION_CUTOVER_APPROVE: 'platform.migration.cutover_approve',
  EXTENSION_READ: 'platform.extension.read',
  EXTENSION_MANAGE: 'platform.extension.manage',
  EXTENSION_ASSESS: 'platform.extension.assess',
  EXTENSION_RECONCILE: 'platform.extension.reconcile',
  INDUSTRY_DELIVERY_READ: 'platform.industry_delivery.read',
  INDUSTRY_DELIVERY_MANAGE: 'platform.industry_delivery.manage',
  AUDIT_READ: 'platform.audit.read',
  CONFIGURATION_READ: 'platform.configuration.read',
  CONFIGURATION_MANAGE: 'platform.configuration.manage',
  CONFIGURATION_RESOLUTION_READ: 'platform.configuration_resolution.read',
  CONFIGURATION_RESOLUTION_MANAGE: 'platform.configuration_resolution.manage',
  CONFIGURATION_RESOLUTION_EXECUTE: 'platform.configuration_resolution.execute',
  F01_READ: 'function.f01.read',
  F01_WORK: 'function.f01.work'
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
