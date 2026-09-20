import {
  createAccessRoleAssignment,
  createAccessRoleDefinition,
  createAccessRolePermission,
  isAccessAssignmentEffective,
  scopeMatches,
  type AccessPrincipalReference,
  type AccessPrincipalType,
  type AccessRoleAssignment,
  type AccessRoleDefinition,
  type AccessRolePermission,
  type PermissionDefinition,
  type PermissionEvaluation,
  type PermissionScope,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface AccessRoleRow extends RowDataPacket {
  id: string;
  catalogue_scope: AccessRoleDefinition['catalogueScope'];
  tenant_id: string | null;
  code: string;
  name: string;
  description: string | null;
  status: AccessRoleDefinition['status'];
}

interface PermissionRow extends RowDataPacket {
  permission_key: string;
  name: string;
  description: string;
}

interface AssignmentCandidateRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  access_role_id: string;
  principal_type: AccessPrincipalType;
  principal_id: string;
  scope_type: string;
  scope_id: string | null;
  effective_from: Date;
  effective_to: Date | null;
  status: AccessRoleAssignment['status'];
}

interface PositionContextRow extends RowDataPacket {
  position_id: string;
  organisation_unit_id: string;
}

interface PrincipalRow extends RowDataPacket {
  id: string;
  tenant_id: string;
}

function databaseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }

  return date;
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });

}

function mapAccessRole(row: AccessRoleRow): AccessRoleDefinition {
  return {
    id: row.id as AccessRoleDefinition['id'],
    catalogueScope: row.catalogue_scope,
    ...(row.tenant_id ? { tenantId: row.tenant_id as TenantId } : {}),
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    status: row.status
  };
}

function mapPermission(row: PermissionRow): PermissionDefinition {
  return {
    key: row.permission_key,
    name: row.name,
    description: row.description
  };
}

function mapAssignment(row: AssignmentCandidateRow): AccessRoleAssignment {
  return {
    id: row.id as AccessRoleAssignment['id'],
    tenantId: row.tenant_id as TenantId,
    accessRoleId: row.access_role_id as AccessRoleAssignment['accessRoleId'],
    principalType: row.principal_type,
    principalId: row.principal_id,
    scopeType: row.scope_type,
    ...(row.scope_id ? { scopeId: row.scope_id } : {}),
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function validateRequestedScope(scope: PermissionScope): void {
  if (!scope.scopeType.trim()) {
    throw new Error('Permission scopeType must not be empty.');
  }

  if (scope.scopeType === 'TENANT') {
    if (scope.scopeId) {
      throw new Error('TENANT permission scope must not specify scopeId.');
    }
    return;
  }

  if (!scope.scopeId?.trim()) {
    throw new Error('Non-TENANT permission scope must specify scopeId.');
  }
}

export class MySqlAccessRepository {
  constructor(private readonly pool: Pool) {}

  async createPermissionDefinition(permission: PermissionDefinition): Promise<void> {
    if (!permission.key.trim() || !permission.name.trim() || !permission.description.trim()) {
      throw new Error('Permission Definition key, name and description are required.');
    }

    await this.pool.execute(
      `INSERT INTO permission_definitions (permission_key, name, description)
       VALUES (?, ?, ?)`,
      [permission.key, permission.name, permission.description]
    );
  }

  async createAccessRole(
    role: AccessRoleDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createAccessRoleDefinition(role);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO access_roles
          (id, catalogue_scope, tenant_id, code, name, description, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          role.id,
          role.catalogueScope,
          role.tenantId ?? null,
          role.code,
          role.name,
          role.description ?? null,
          role.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );

      if (role.tenantId) {
        await writeAudit(
          connection,
          role.tenantId,
          'ACCESS_ROLE',
          role.id,
          'CREATED',
          audit,
          role
        );
      }
    });
  }

  async grantPermissionToRole(
    link: AccessRolePermission,
    audit: AuditContext = {}
  ): Promise<void> {
    const [role, permission] = await Promise.all([
      this.requireAccessRole(link.accessRoleId),
      this.requirePermission(link.permissionKey)
    ]);
    createAccessRolePermission(link, role, permission);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO access_role_permissions
          (id, access_role_id, permission_key, created_by_person_id)
         VALUES (?, ?, ?, ?)`,
        [
          link.id,
          link.accessRoleId,
          link.permissionKey,
          audit.actorPersonId ?? null
        ]
      );

      if (role.tenantId) {
        await writeAudit(
          connection,
          role.tenantId,
          'ACCESS_ROLE_PERMISSION',
          link.id,
          'GRANTED',
          audit,
          link
        );
      }
    });
  }

  async assignAccessRole(
    tenantId: TenantId,
    assignment: AccessRoleAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    if (assignment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }

    const [role, principal] = await Promise.all([
      this.requireAccessRole(assignment.accessRoleId),
      this.requirePrincipal(
        assignment.tenantId,
        assignment.principalType,
        assignment.principalId
      )
    ]);
    createAccessRoleAssignment(assignment, role, principal);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO access_role_assignments
          (id, tenant_id, access_role_id, principal_type, principal_id,
           scope_type, scope_id, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.accessRoleId,
          assignment.principalType,
          assignment.principalId,
          assignment.scopeType,
          assignment.scopeId ?? null,
          databaseDate(assignment.effectiveFrom),
          assignment.effectiveTo ? databaseDate(assignment.effectiveTo) : null,
          assignment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        assignment.tenantId,
        'ACCESS_ROLE_ASSIGNMENT',
        assignment.id,
        'ASSIGNED',
        audit,
        assignment
      );
    });
  }

  async evaluatePermission(
    tenantId: TenantId,
    personId: string,
    permissionKey: string,
    scope: PermissionScope,
    evaluatedAt = new Date().toISOString()
  ): Promise<PermissionEvaluation> {
    validateRequestedScope(scope);
    const evaluationDate = databaseDate(evaluatedAt);

    const person = await this.findPrincipal(tenantId, 'PERSON', personId);
    if (!person) {
      return {
        allowed: false,
        permissionKey,
        tenantId,
        personId,
        scope,
        evaluatedAt,
        reason: 'Person is not present in the tenant.'
      };
    }

    const permission = await this.findPermission(permissionKey);
    if (!permission) {
      return {
        allowed: false,
        permissionKey,
        tenantId,
        personId,
        scope,
        evaluatedAt,
        reason: 'Permission Definition does not exist.'
      };
    }

    const [positions, candidates] = await Promise.all([
      this.currentPositionContext(tenantId, personId, evaluationDate),
      this.permissionCandidates(tenantId, permissionKey, evaluationDate)
    ]);

    const positionIds = new Set(positions.map((row) => row.position_id));
    const organisationUnitIds = new Set(positions.map((row) => row.organisation_unit_id));

    for (const row of candidates) {
      const assignment = mapAssignment(row);
      const principalMatches =
        (assignment.principalType === 'PERSON' && assignment.principalId === personId) ||
        (assignment.principalType === 'POSITION' &&
          positionIds.has(assignment.principalId)) ||
        (assignment.principalType === 'ORGANISATION_UNIT' &&
          organisationUnitIds.has(assignment.principalId));

      if (!principalMatches) continue;
      if (!isAccessAssignmentEffective(assignment, evaluatedAt)) continue;
      if (!scopeMatches(assignment, scope)) continue;

      return {
        allowed: true,
        permissionKey,
        tenantId,
        personId,
        scope,
        evaluatedAt,
        reason: 'Permission granted by active scoped Access Role Assignment.',
        matchedRoleId: assignment.accessRoleId,
        matchedAssignmentId: assignment.id,
        matchedPrincipalType: assignment.principalType
      };
    }

    return {
      allowed: false,
      permissionKey,
      tenantId,
      personId,
      scope,
      evaluatedAt,
      reason: 'No active Access Role Assignment grants this permission in the requested scope.'
    };
  }

  private async requireAccessRole(id: string): Promise<AccessRoleDefinition> {
    const [rows] = await this.pool.execute<AccessRoleRow[]>(
      `SELECT id, catalogue_scope, tenant_id, code, name, description, status
         FROM access_roles WHERE id = ?`,
      [id]
    );
    const row = rows[0];
    if (!row) throw new Error('Access Role not found.');
    return mapAccessRole(row);
  }

  private async requirePermission(key: string): Promise<PermissionDefinition> {
    const permission = await this.findPermission(key);
    if (!permission) throw new Error('Permission Definition not found.');
    return permission;
  }

  private async findPermission(key: string): Promise<PermissionDefinition | undefined> {
    const [rows] = await this.pool.execute<PermissionRow[]>(
      `SELECT permission_key, name, description
         FROM permission_definitions WHERE permission_key = ?`,
      [key]
    );
    return rows[0] ? mapPermission(rows[0]) : undefined;
  }

  private async requirePrincipal(
    tenantId: TenantId,
    principalType: AccessPrincipalType,
    principalId: string
  ): Promise<AccessPrincipalReference> {
    const principal = await this.findPrincipal(tenantId, principalType, principalId);
    if (!principal) throw new Error('Access principal not found in tenant.');
    return principal;
  }

  private async findPrincipal(
    tenantId: TenantId,
    principalType: AccessPrincipalType,
    principalId: string
  ): Promise<AccessPrincipalReference | undefined> {
    const table =
      principalType === 'PERSON'
        ? 'persons'
        : principalType === 'POSITION'
          ? 'positions'
          : 'organisation_units';

    const [rows] = await this.pool.execute<PrincipalRow[]>(
      `SELECT id, tenant_id FROM ${table} WHERE tenant_id = ? AND id = ?`,
      [tenantId, principalId]
    );
    const row = rows[0];
    if (!row) return undefined;

    return {
      principalType,
      principalId: row.id,
      tenantId: row.tenant_id as TenantId
    };
  }

  private async currentPositionContext(
    tenantId: TenantId,
    personId: string,
    evaluatedAt: Date
  ): Promise<PositionContextRow[]> {
    const [rows] = await this.pool.execute<PositionContextRow[]>(
      `SELECT p.id AS position_id, p.organisation_unit_id
         FROM position_occupancies po
         JOIN positions p
           ON p.tenant_id = po.tenant_id
          AND p.id = po.position_id
        WHERE po.tenant_id = ?
          AND po.person_id = ?
          AND po.effective_from <= ?
          AND (po.effective_to IS NULL OR po.effective_to >= ?)
          AND p.status = 'ACTIVE'`,
      [tenantId, personId, evaluatedAt, evaluatedAt]
    );
    return rows;
  }

  private async permissionCandidates(
    tenantId: TenantId,
    permissionKey: string,
    evaluatedAt: Date
  ): Promise<AssignmentCandidateRow[]> {
    const [rows] = await this.pool.execute<AssignmentCandidateRow[]>(
      `SELECT ara.id, ara.tenant_id, ara.access_role_id, ara.principal_type,
              ara.principal_id, ara.scope_type, ara.scope_id, ara.effective_from,
              ara.effective_to, ara.status
         FROM access_role_assignments ara
         JOIN access_roles ar
           ON ar.id = ara.access_role_id
         JOIN access_role_permissions arp
           ON arp.access_role_id = ar.id
        WHERE ara.tenant_id = ?
          AND arp.permission_key = ?
          AND ara.status = 'ACTIVE'
          AND ar.status = 'ACTIVE'
          AND (ar.catalogue_scope = 'PLATFORM' OR ar.tenant_id = ara.tenant_id)
          AND ara.effective_from <= ?
          AND (ara.effective_to IS NULL OR ara.effective_to >= ?)
        ORDER BY
          CASE ara.principal_type
            WHEN 'PERSON' THEN 1
            WHEN 'POSITION' THEN 2
            ELSE 3
          END,
          ara.id`,
      [tenantId, permissionKey, evaluatedAt, evaluatedAt]
    );
    return rows;
  }
}
