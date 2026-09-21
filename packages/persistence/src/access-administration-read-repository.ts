import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { AccessPrincipalType, TenantId } from '@nublox/kernel';

interface RoleRow extends RowDataPacket {
  id: string;
  catalogue_scope: 'PLATFORM' | 'TENANT';
  tenant_id: string | null;
  code: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface RolePermissionRow extends RowDataPacket {
  access_role_id: string;
  permission_key: string;
}

interface PermissionRow extends RowDataPacket {
  permission_key: string;
  name: string;
  description: string;
}

interface AssignmentRow extends RowDataPacket {
  id: string;
  access_role_id: string;
  principal_type: AccessPrincipalType;
  principal_id: string;
  scope_type: string;
  scope_id: string | null;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface PersonRow extends RowDataPacket {
  id: string;
  name: string;
}

interface PositionRow extends RowDataPacket {
  id: string;
  code: string;
  title: string;
}

interface UnitRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
}

export interface AccessPermissionView {
  key: string;
  name: string;
  description: string;
}

export interface AccessRoleView {
  id: string;
  catalogueScope: 'PLATFORM' | 'TENANT';
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  permissionKeys: string[];
}

export interface AccessPrincipalView {
  type: AccessPrincipalType;
  id: string;
  label: string;
}

export interface AccessAssignmentView {
  id: string;
  accessRoleId: string;
  roleName: string;
  principalType: AccessPrincipalType;
  principalId: string;
  principalLabel: string;
  scopeType: string;
  scopeId?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface AccessAdministrationProjection {
  roles: AccessRoleView[];
  permissions: AccessPermissionView[];
  principals: AccessPrincipalView[];
  assignments: AccessAssignmentView[];
}

export class MySqlAccessAdministrationReadRepository {
  constructor(private readonly pool: Pool) {}

  async getProjection(tenantId: TenantId): Promise<AccessAdministrationProjection> {
    const [
      roleRows,
      rolePermissionRows,
      permissionRows,
      assignmentRows,
      personRows,
      positionRows,
      unitRows
    ] = await Promise.all([
      this.pool.execute<RoleRow[]>(
        `SELECT id, catalogue_scope, tenant_id, code, name, description, status
           FROM access_roles
          WHERE status = 'ACTIVE'
            AND (catalogue_scope = 'PLATFORM' OR tenant_id = ?)
          ORDER BY catalogue_scope, code, name`,
        [tenantId]
      ),
      this.pool.execute<RolePermissionRow[]>(
        `SELECT arp.access_role_id, arp.permission_key
           FROM access_role_permissions arp
           JOIN access_roles ar ON ar.id = arp.access_role_id
          WHERE ar.status = 'ACTIVE'
            AND (ar.catalogue_scope = 'PLATFORM' OR ar.tenant_id = ?)
          ORDER BY arp.access_role_id, arp.permission_key`,
        [tenantId]
      ),
      this.pool.execute<PermissionRow[]>(
        `SELECT permission_key, name, description
           FROM permission_definitions
          ORDER BY permission_key`
      ),
      this.pool.execute<AssignmentRow[]>(
        `SELECT id, access_role_id, principal_type, principal_id,
                scope_type, scope_id, effective_from, effective_to, status
           FROM access_role_assignments
          WHERE tenant_id = ?
          ORDER BY status = 'ACTIVE' DESC, effective_from DESC, id`,
        [tenantId]
      ),
      this.pool.execute<PersonRow[]>(
        `SELECT id, COALESCE(preferred_name, legal_name) AS name
           FROM persons
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY name, id`,
        [tenantId]
      ),
      this.pool.execute<PositionRow[]>(
        `SELECT id, code, title
           FROM positions
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY code, title, id`,
        [tenantId]
      ),
      this.pool.execute<UnitRow[]>(
        `SELECT id, code, name
           FROM organisation_units
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY code, name, id`,
        [tenantId]
      )
    ]);

    const permissionsByRole = new Map<string, string[]>();
    for (const row of rolePermissionRows[0]) {
      const list = permissionsByRole.get(row.access_role_id) ?? [];
      list.push(row.permission_key);
      permissionsByRole.set(row.access_role_id, list);
    }

    const roles: AccessRoleView[] = roleRows[0].map((row) => ({
      id: row.id,
      catalogueScope: row.catalogue_scope,
      code: row.code,
      name: row.name,
      ...(row.description ? { description: row.description } : {}),
      status: row.status,
      permissionKeys: permissionsByRole.get(row.id) ?? []
    }));

    const roleNameById = new Map(roles.map((role) => [role.id, role.name]));
    const principals: AccessPrincipalView[] = [
      ...personRows[0].map((row) => ({
        type: 'PERSON' as const,
        id: row.id,
        label: row.name
      })),
      ...positionRows[0].map((row) => ({
        type: 'POSITION' as const,
        id: row.id,
        label: `${row.code} — ${row.title}`
      })),
      ...unitRows[0].map((row) => ({
        type: 'ORGANISATION_UNIT' as const,
        id: row.id,
        label: `${row.code} — ${row.name}`
      }))
    ];
    const principalLabelByKey = new Map(
      principals.map((principal) => [`${principal.type}:${principal.id}`, principal.label])
    );

    return {
      roles,
      permissions: permissionRows[0].map((row) => ({
        key: row.permission_key,
        name: row.name,
        description: row.description
      })),
      principals,
      assignments: assignmentRows[0].map((row) => ({
        id: row.id,
        accessRoleId: row.access_role_id,
        roleName: roleNameById.get(row.access_role_id) ?? row.access_role_id,
        principalType: row.principal_type,
        principalId: row.principal_id,
        principalLabel:
          principalLabelByKey.get(`${row.principal_type}:${row.principal_id}`) ??
          row.principal_id,
        scopeType: row.scope_type,
        ...(row.scope_id ? { scopeId: row.scope_id } : {}),
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      }))
    };
  }
}
