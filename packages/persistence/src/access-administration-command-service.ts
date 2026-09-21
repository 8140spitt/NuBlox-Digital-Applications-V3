import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type AccessPrincipalType,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type AccessRolePermission,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface RoleOwnerRow extends RowDataPacket {
  catalogue_scope: 'PLATFORM' | 'TENANT';
  tenant_id: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export class AccessAdministrationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'AccessAdministrationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new AccessAdministrationCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function isDuplicateEntry(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY';
}

export class MySqlAccessAdministrationCommandService {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async createTenantRole(
    tenantId: TenantId,
    actorPersonId: string,
    input: { code: string; name: string; description?: string }
  ): Promise<AccessRoleDefinition> {
    await this.requireManageAccess(tenantId, actorPersonId);

    const role: AccessRoleDefinition = {
      id: asId<'AccessRoleId'>(`ROLE-${randomUUID()}`, 'Access Role'),
      catalogueScope: 'TENANT',
      tenantId,
      code: required(input.code, 'Role code').toUpperCase(),
      name: required(input.name, 'Role name'),
      ...(optional(input.description) ? { description: optional(input.description) } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.access.createAccessRole(role, {
        actorPersonId,
        correlationId: 'ACCESS-ADMIN'
      });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new AccessAdministrationCommandError(
          'A tenant Access Role with this code already exists.',
          'CONFLICT'
        );
      }
      throw error;
    }

    return role;
  }

  async grantPermission(
    tenantId: TenantId,
    actorPersonId: string,
    input: { accessRoleId: string; permissionKey: string }
  ): Promise<AccessRolePermission> {
    await this.requireManageAccess(tenantId, actorPersonId);

    const accessRoleId = required(input.accessRoleId, 'Access Role');
    const permissionKey = required(input.permissionKey, 'Permission');
    await this.requireTenantOwnedRole(tenantId, accessRoleId);

    const link: AccessRolePermission = {
      id: asId<'AccessRolePermissionId'>(
        `ARP-${randomUUID()}`,
        'Access Role Permission'
      ),
      accessRoleId: accessRoleId as AccessRolePermission['accessRoleId'],
      permissionKey
    };

    try {
      await this.access.grantPermissionToRole(link, {
        actorPersonId,
        correlationId: 'ACCESS-ADMIN'
      });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new AccessAdministrationCommandError(
          'This permission is already granted to the Access Role.',
          'CONFLICT'
        );
      }
      if (error instanceof Error && error.message.includes('Permission Definition not found')) {
        throw new AccessAdministrationCommandError(
          'Permission Definition was not found.',
          'NOT_FOUND'
        );
      }
      throw error;
    }

    return link;
  }

  async assignRole(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      accessRoleId: string;
      principalType: AccessPrincipalType;
      principalId: string;
      scopeType?: string;
      scopeId?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<AccessRoleAssignment> {
    await this.requireManageAccess(tenantId, actorPersonId);

    const accessRoleId = required(input.accessRoleId, 'Access Role');
    const principalId = required(input.principalId, 'Principal');
    const scopeType = optional(input.scopeType)?.toUpperCase() ?? 'TENANT';
    const scopeId = optional(input.scopeId);
    const effectiveFrom = input.effectiveFrom
      ? new Date(input.effectiveFrom)
      : new Date();
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : undefined;

    if (!['PERSON', 'POSITION', 'ORGANISATION_UNIT'].includes(input.principalType)) {
      throw new AccessAdministrationCommandError(
        'Principal type is invalid.',
        'INVALID_INPUT'
      );
    }
    if (Number.isNaN(effectiveFrom.getTime()) || (effectiveTo && Number.isNaN(effectiveTo.getTime()))) {
      throw new AccessAdministrationCommandError(
        'Role assignment effective dates are invalid.',
        'INVALID_INPUT'
      );
    }
    if (scopeType === 'TENANT' && scopeId) {
      throw new AccessAdministrationCommandError(
        'TENANT scope must not specify a scope ID.',
        'INVALID_INPUT'
      );
    }
    if (scopeType !== 'TENANT' && !scopeId) {
      throw new AccessAdministrationCommandError(
        'Non-TENANT scope requires a scope ID.',
        'INVALID_INPUT'
      );
    }

    await this.requireAssignableRole(tenantId, accessRoleId);

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        `ARA-${randomUUID()}`,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: accessRoleId as AccessRoleAssignment['accessRoleId'],
      principalType: input.principalType,
      principalId,
      scopeType,
      ...(scopeId ? { scopeId } : {}),
      effectiveFrom: effectiveFrom.toISOString(),
      ...(effectiveTo ? { effectiveTo: effectiveTo.toISOString() } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.access.assignAccessRole(tenantId, assignment, {
        actorPersonId,
        correlationId: 'ACCESS-ADMIN'
      });
    } catch (error) {
      if (isDuplicateEntry(error)) {
        throw new AccessAdministrationCommandError(
          'An equivalent Access Role Assignment already exists.',
          'CONFLICT'
        );
      }
      if (error instanceof Error && error.message.includes('principal not found')) {
        throw new AccessAdministrationCommandError(
          'Access principal was not found in the tenant.',
          'NOT_FOUND'
        );
      }
      throw error;
    }

    return assignment;
  }

  private async requireManageAccess(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new AccessAdministrationCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }

  private async requireTenantOwnedRole(
    tenantId: TenantId,
    accessRoleId: string
  ): Promise<void> {
    const [rows] = await this.pool.execute<RoleOwnerRow[]>(
      `SELECT catalogue_scope, tenant_id, status
         FROM access_roles
        WHERE id = ?`,
      [accessRoleId]
    );
    const row = rows[0];

    if (!row || row.status !== 'ACTIVE') {
      throw new AccessAdministrationCommandError(
        'Access Role was not found or is inactive.',
        'NOT_FOUND'
      );
    }

    if (row.catalogue_scope !== 'TENANT' || row.tenant_id !== tenantId) {
      throw new AccessAdministrationCommandError(
        'Platform Access Role definitions cannot be modified from tenant administration.',
        'PERMISSION_DENIED'
      );
    }
  }

  private async requireAssignableRole(
    tenantId: TenantId,
    accessRoleId: string
  ): Promise<void> {
    const [rows] = await this.pool.execute<RoleOwnerRow[]>(
      `SELECT catalogue_scope, tenant_id, status
         FROM access_roles
        WHERE id = ?`,
      [accessRoleId]
    );
    const row = rows[0];

    if (
      !row ||
      row.status !== 'ACTIVE' ||
      (row.catalogue_scope === 'TENANT' && row.tenant_id !== tenantId)
    ) {
      throw new AccessAdministrationCommandError(
        'Access Role is unavailable to this tenant.',
        'NOT_FOUND'
      );
    }
  }
}
