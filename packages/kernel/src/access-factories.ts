import { invariant } from './errors.js';
import type {
  AccessPrincipalReference,
  AccessRoleAssignment,
  AccessRoleDefinition,
  AccessRolePermission,
  PermissionScope
} from './access.js';
import type { PermissionDefinition } from './model.js';

function assertDateOrder(from: string, to: string | undefined, label: string) {
  const fromTime = Date.parse(from);
  invariant(Number.isFinite(fromTime), `${label} effectiveFrom must be a valid date/time.`);

  if (to) {
    const toTime = Date.parse(to);
    invariant(Number.isFinite(toTime), `${label} effectiveTo must be a valid date/time.`);
    invariant(toTime >= fromTime, `${label} effectiveTo must not be earlier than effectiveFrom.`);
  }
}

function assertNonEmpty(value: string, label: string) {
  invariant(Boolean(value.trim()), `${label} must not be empty.`);
}

export function createAccessRoleDefinition(input: AccessRoleDefinition): AccessRoleDefinition {
  assertNonEmpty(input.code, 'Access Role code');
  assertNonEmpty(input.name, 'Access Role name');

  if (input.catalogueScope === 'TENANT') {
    invariant(Boolean(input.tenantId), 'Tenant Access Role must specify tenantId.');
  } else {
    invariant(!input.tenantId, 'Platform Access Role must not specify tenantId.');
  }

  return Object.freeze({ ...input });
}

export function createAccessRolePermission(
  input: AccessRolePermission,
  role: AccessRoleDefinition,
  permission: PermissionDefinition
): AccessRolePermission {
  invariant(input.accessRoleId === role.id, 'Access Role Permission must reference the supplied role.');
  invariant(
    input.permissionKey === permission.key,
    'Access Role Permission must reference the supplied Permission Definition.'
  );
  invariant(role.status === 'ACTIVE', 'Access Role must be active.');
  return Object.freeze({ ...input });
}

export function createAccessRoleAssignment(
  input: AccessRoleAssignment,
  role: AccessRoleDefinition,
  principal: AccessPrincipalReference
): AccessRoleAssignment {
  invariant(input.principalType === principal.principalType, 'Access principal type does not match.');
  invariant(input.principalId === principal.principalId, 'Access principal id does not match.');
  invariant(input.tenantId === principal.tenantId, 'Access principal must belong to the same tenant.');
  invariant(input.accessRoleId === role.id, 'Access Role Assignment must reference the supplied role.');
  invariant(role.status === 'ACTIVE', 'Access Role must be active.');

  if (role.catalogueScope === 'TENANT') {
    invariant(role.tenantId === input.tenantId, 'Tenant Access Role must belong to the assignment tenant.');
  }

  assertNonEmpty(input.scopeType, 'Access scopeType');

  if (input.scopeType === 'TENANT') {
    invariant(!input.scopeId, 'TENANT scope must not specify scopeId.');
  } else {
    invariant(Boolean(input.scopeId?.trim()), 'Non-TENANT access scope must specify scopeId.');
  }

  assertDateOrder(input.effectiveFrom, input.effectiveTo, 'Access Role Assignment');
  return Object.freeze({ ...input });
}

export function scopeMatches(assignment: AccessRoleAssignment, requested: PermissionScope): boolean {
  if (assignment.scopeType === 'TENANT') {
    return true;
  }

  return (
    assignment.scopeType === requested.scopeType &&
    assignment.scopeId !== undefined &&
    assignment.scopeId === requested.scopeId
  );
}

export function isAccessAssignmentEffective(
  assignment: AccessRoleAssignment,
  evaluatedAt: string
): boolean {
  const at = Date.parse(evaluatedAt);
  invariant(Number.isFinite(at), 'Permission evaluation time must be valid.');

  if (assignment.status !== 'ACTIVE') return false;
  if (Date.parse(assignment.effectiveFrom) > at) return false;
  if (assignment.effectiveTo && Date.parse(assignment.effectiveTo) < at) return false;

  return true;
}
