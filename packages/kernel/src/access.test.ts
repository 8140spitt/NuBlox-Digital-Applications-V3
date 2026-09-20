import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createAccessRoleAssignment,
  createAccessRoleDefinition,
  createAccessRolePermission,
  isAccessAssignmentEffective,
  scopeMatches,
  type AccessPrincipalReference,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type PermissionDefinition
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-ACCESS', 'Tenant');
const otherTenantId = asId<'TenantId'>('TENANT-OTHER', 'Tenant');

const permission: PermissionDefinition = {
  key: 'deliverable.approve',
  name: 'Approve deliverable',
  description: 'Allows a user to perform the access-controlled approval action.'
};

const tenantRole: AccessRoleDefinition = createAccessRoleDefinition({
  id: asId<'AccessRoleId'>('ROLE-APPROVER', 'Access Role'),
  catalogueScope: 'TENANT',
  tenantId,
  code: 'DELIVERABLE_APPROVER',
  name: 'Deliverable Approver',
  status: 'ACTIVE'
});

describe('kernel scoped access invariants', () => {
  it('keeps tenant and platform Access Roles distinct', () => {
    expect(tenantRole.tenantId).toBe(tenantId);

    expect(() =>
      createAccessRoleDefinition({
        id: asId<'AccessRoleId'>('ROLE-BAD', 'Access Role'),
        catalogueScope: 'PLATFORM',
        tenantId,
        code: 'BAD',
        name: 'Bad Role',
        status: 'ACTIVE'
      })
    ).toThrow(KernelInvariantError);
  });

  it('binds a Permission Definition to an Access Role without turning it into Authority', () => {
    const link = createAccessRolePermission(
      {
        id: asId<'AccessRolePermissionId'>('ROLE-PERM-1', 'Access Role Permission'),
        accessRoleId: tenantRole.id,
        permissionKey: permission.key
      },
      tenantRole,
      permission
    );

    expect(link.permissionKey).toBe('deliverable.approve');
  });

  it('requires scoped assignments to remain tenant-bound and explicit', () => {
    const principal: AccessPrincipalReference = {
      principalType: 'POSITION',
      principalId: 'POS-1',
      tenantId
    };

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ROLE-ASG-1', 'Access Role Assignment'),
      tenantId,
      accessRoleId: tenantRole.id,
      principalType: 'POSITION',
      principalId: principal.principalId,
      scopeType: 'PROJECT',
      scopeId: 'PROJECT-1',
      effectiveFrom: '2026-09-20T00:00:00.000Z',
      status: 'ACTIVE'
    };

    expect(createAccessRoleAssignment(assignment, tenantRole, principal)).toEqual(assignment);
    expect(scopeMatches(assignment, { scopeType: 'PROJECT', scopeId: 'PROJECT-1' })).toBe(true);
    expect(scopeMatches(assignment, { scopeType: 'PROJECT', scopeId: 'PROJECT-2' })).toBe(false);
    expect(isAccessAssignmentEffective(assignment, '2026-09-21T00:00:00.000Z')).toBe(true);

    expect(() =>
      createAccessRoleAssignment(
        { ...assignment, tenantId: otherTenantId },
        tenantRole,
        principal
      )
    ).toThrow(KernelInvariantError);

    expect(() =>
      createAccessRoleAssignment(
        { ...assignment, scopeType: 'PROJECT', scopeId: undefined },
        tenantRole,
        principal
      )
    ).toThrow(KernelInvariantError);
  });

  it('allows TENANT scope without manufacturing a fake resource id', () => {
    const role = createAccessRoleDefinition({
      id: asId<'AccessRoleId'>('ROLE-TENANT-ADMIN', 'Access Role'),
      catalogueScope: 'TENANT',
      tenantId,
      code: 'TENANT_ADMIN',
      name: 'Tenant Administrator',
      status: 'ACTIVE'
    });

    const principal: AccessPrincipalReference = {
      principalType: 'PERSON',
      principalId: 'PERSON-1',
      tenantId
    };

    const assignment = createAccessRoleAssignment(
      {
        id: asId<'AccessRoleAssignmentId'>('ROLE-ASG-TENANT', 'Access Role Assignment'),
        tenantId,
        accessRoleId: role.id,
        principalType: 'PERSON',
        principalId: principal.principalId,
        scopeType: 'TENANT',
        effectiveFrom: '2026-09-20T00:00:00.000Z',
        status: 'ACTIVE'
      },
      role,
      principal
    );

    expect(scopeMatches(assignment, { scopeType: 'PROJECT', scopeId: 'ANY-PROJECT' })).toBe(true);
  });

  it('honours assignment expiry', () => {
    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ROLE-ASG-EXP', 'Access Role Assignment'),
      tenantId,
      accessRoleId: tenantRole.id,
      principalType: 'PERSON',
      principalId: 'PERSON-1',
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      effectiveTo: '2026-09-20T12:00:00.000Z',
      status: 'ACTIVE'
    };

    expect(isAccessAssignmentEffective(assignment, '2026-09-20T11:59:59.000Z')).toBe(true);
    expect(isAccessAssignmentEffective(assignment, '2026-09-20T12:00:01.000Z')).toBe(false);
  });
});
