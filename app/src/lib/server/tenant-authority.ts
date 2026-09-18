import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import {
  assertPermission,
  platformPermissions,
  type CommandContext
} from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type TenantRole = {
  id: string;
  roleKey: string;
  name: string;
  status: string;
  permissions: string[];
};
export type TenantMembership = {
  id: string;
  partyId: string;
  displayName: string;
  membershipType: string;
  status: string;
  validFrom: string;
  validTo: string | null;
};
export type TenantIdentity = {
  id: string;
  partyId: string;
  partyDisplayName: string;
  provider: string;
  providerSubject: string;
  displayName: string;
  status: string;
};
export type TenantRoleAssignment = {
  id: string;
  partyId: string;
  displayName: string;
  roleId: string;
  roleKey: string;
  roleName: string;
  status: string;
  validFrom: string;
  validTo: string | null;
};

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function validateRoleKey(value: string) {
  const key = required(value, 'Role key').toLowerCase();
  if (!/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(key)) {
    throw new Error(
      'Role key must start with a letter and contain only lowercase letters, numbers, dots, underscores or hyphens.'
    );
  }
  return key;
}
async function nextTenantVersion(context: CommandContext, executor: DbExecutor) {
  const tenant = await queryOne<RowDataPacket & { version: number }>(
    "SELECT version FROM tenants WHERE id = ? AND status = 'ACTIVE' FOR UPDATE",
    [context.tenantId],
    executor
  );
  if (!tenant) throw new Error('Active tenant not found.');
  const nextVersion = tenant.version + 1;
  const updated = await executeMutation(
    'UPDATE tenants SET version = ?, updated_at = ? WHERE id = ? AND version = ?',
    [nextVersion, now(), context.tenantId, tenant.version],
    executor
  );
  if (updated.affectedRows !== 1)
    throw new Error('Tenant authority changed concurrently. Retry the command.');
  return nextVersion;
}
async function assertParty(context: CommandContext, partyId: string, executor?: DbExecutor) {
  const party = await queryOne<RowDataPacket & { id: string; displayName: string }>(
    "SELECT id, display_name AS displayName FROM parties WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'",
    [context.tenantId, partyId],
    executor
  );
  if (!party) throw new Error('Active Party not found in this tenant.');
  return party;
}

export async function listTenantIdentities(context: CommandContext): Promise<TenantIdentity[]> {
  assertPermission(context, 'tenant.identity.read');
  return queryRows<RowDataPacket & TenantIdentity>(
    'SELECT ui.id, ui.party_id AS partyId, p.display_name AS partyDisplayName, ui.provider, ui.provider_subject AS providerSubject, ui.display_name AS displayName, ui.status FROM user_identities ui JOIN parties p ON p.id = ui.party_id WHERE ui.tenant_id = ? ORDER BY p.display_name, ui.provider, ui.display_name',
    [context.tenantId]
  );
}

export async function linkAuthenticatedIdentity(
  context: CommandContext,
  partyId: string,
  authUserId: string,
  displayName: string
) {
  assertPermission(context, 'tenant.identity.manage');
  const subject = required(authUserId, 'Authenticated user ID');
  const identityDisplayName = required(displayName, 'Identity display name');

  return dbTransaction(async (connection) => {
    const party = await assertParty(context, partyId, connection);
    const existing = await queryOne<
      RowDataPacket & { id: string; partyId: string; status: string }
    >(
      "SELECT id, party_id AS partyId, status FROM user_identities WHERE tenant_id = ? AND provider = 'better-auth' AND provider_subject = ? FOR UPDATE",
      [context.tenantId, subject],
      connection
    );
    if (existing && existing.partyId !== partyId) {
      throw new Error('Authenticated user is already linked to a different Party in this tenant.');
    }

    const timestamp = now();
    const id = existing?.id ?? randomUUID();
    if (existing) {
      await executeMutation(
        "UPDATE user_identities SET display_name = ?, status = 'ACTIVE', updated_at = ? WHERE id = ? AND tenant_id = ?",
        [identityDisplayName, timestamp, id, context.tenantId],
        connection
      );
    } else {
      await executeMutation(
        "INSERT INTO user_identities (id, tenant_id, party_id, provider, provider_subject, display_name, status, created_at, updated_at) VALUES (?, ?, ?, 'better-auth', ?, ?, 'ACTIVE', ?, ?)",
        [id, context.tenantId, partyId, subject, identityDisplayName, timestamp, timestamp],
        connection
      );
    }

    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_identity',
        objectId: id,
        action: existing ? 'TENANT_IDENTITY_REACTIVATED' : 'TENANT_IDENTITY_LINKED',
        fromState: existing?.status,
        toState: 'ACTIVE',
        note: party.displayName
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: existing ? 'TENANT_IDENTITY_REACTIVATED' : 'TENANT_IDENTITY_LINKED',
        topic: 'nublox.tenant.identity',
        payload: { identityId: id, partyId, provider: 'better-auth' }
      },
      connection
    );
    return id;
  });
}

export async function deactivateTenantIdentity(context: CommandContext, identityId: string) {
  assertPermission(context, 'tenant.identity.manage');
  return dbTransaction(async (connection) => {
    const identity = await queryOne<
      RowDataPacket & { id: string; partyId: string; status: string; provider: string }
    >(
      'SELECT id, party_id AS partyId, status, provider FROM user_identities WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [identityId, context.tenantId],
      connection
    );
    if (!identity) throw new Error('Tenant identity not found.');
    if (identity.id === context.userIdentityId)
      throw new Error('An actor cannot deactivate their own active tenant identity.');
    if (identity.status !== 'ACTIVE') return;

    await executeMutation(
      "UPDATE user_identities SET status = 'INACTIVE', updated_at = ? WHERE id = ? AND tenant_id = ?",
      [now(), identityId, context.tenantId],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_identity',
        objectId: identityId,
        action: 'TENANT_IDENTITY_DEACTIVATED',
        fromState: 'ACTIVE',
        toState: 'INACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_IDENTITY_DEACTIVATED',
        topic: 'nublox.tenant.identity',
        payload: { identityId, partyId: identity.partyId, provider: identity.provider }
      },
      connection
    );
  });
}

export async function listTenantMemberships(context: CommandContext): Promise<TenantMembership[]> {
  assertPermission(context, 'tenant.membership.read');
  return queryRows<RowDataPacket & TenantMembership>(
    "SELECT m.id, m.party_id AS partyId, p.display_name AS displayName, m.membership_type AS membershipType, m.status, m.valid_from AS validFrom, m.valid_to AS validTo FROM memberships m JOIN parties p ON p.id = m.party_id WHERE m.tenant_id = ? AND m.context_type = 'TENANT' AND m.context_id = ? ORDER BY p.display_name",
    [context.tenantId, context.tenantId]
  );
}

export async function grantTenantMembership(
  context: CommandContext,
  partyId: string,
  membershipType = 'INTERNAL'
) {
  assertPermission(context, 'tenant.membership.manage');
  return dbTransaction(async (connection) => {
    const party = await assertParty(context, partyId, connection);
    const existing = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM memberships WHERE tenant_id = ? AND party_id = ? AND context_type = 'TENANT' AND context_id = ? AND status = 'ACTIVE' LIMIT 1",
      [context.tenantId, partyId, context.tenantId],
      connection
    );
    if (existing) return existing.id;
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO memberships (id, tenant_id, party_id, context_type, context_id, membership_type, status, valid_from, valid_to, created_at) VALUES (?, ?, ?, 'TENANT', ?, ?, 'ACTIVE', ?, NULL, ?)",
      [
        id,
        context.tenantId,
        partyId,
        context.tenantId,
        required(membershipType, 'Membership type').toUpperCase(),
        timestamp,
        timestamp
      ],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_membership',
        objectId: id,
        action: 'TENANT_MEMBERSHIP_GRANTED',
        toState: 'ACTIVE',
        note: party.displayName
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_MEMBERSHIP_GRANTED',
        topic: 'nublox.tenant.membership',
        payload: { membershipId: id, partyId }
      },
      connection
    );
    return id;
  });
}

export async function revokeTenantMembership(context: CommandContext, membershipId: string) {
  assertPermission(context, 'tenant.membership.manage');
  return dbTransaction(async (connection) => {
    const row = await queryOne<RowDataPacket & { partyId: string; status: string }>(
      "SELECT party_id AS partyId, status FROM memberships WHERE id = ? AND tenant_id = ? AND context_type = 'TENANT' AND context_id = ?",
      [membershipId, context.tenantId, context.tenantId],
      connection
    );
    if (!row) throw new Error('Tenant membership not found.');
    if (row.partyId === context.actorPartyId)
      throw new Error('An actor cannot revoke their own tenant membership.');
    if (row.status !== 'ACTIVE') return;
    const timestamp = now();
    const assignments = await queryRows<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' FOR UPDATE",
      [context.tenantId, row.partyId, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE memberships SET status = 'INACTIVE', valid_to = ? WHERE id = ? AND tenant_id = ?",
      [timestamp, membershipId, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE role_assignments SET status = 'INACTIVE', valid_to = ? WHERE tenant_id = ? AND party_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE'",
      [timestamp, context.tenantId, row.partyId, context.tenantId],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_membership',
        objectId: membershipId,
        action: 'TENANT_MEMBERSHIP_REVOKED',
        fromState: 'ACTIVE',
        toState: 'INACTIVE',
        note: assignments.length
          ? `${assignments.length} active role assignment(s) ended.`
          : undefined
      },
      connection
    );
    for (const assignment of assignments) {
      await recordPlatformAudit(
        context,
        {
          aggregateId: 'AGG-01-TENANT',
          objectType: 'tenant_role_assignment',
          objectId: assignment.id,
          action: 'TENANT_ROLE_UNASSIGNED_BY_MEMBERSHIP_REVOKE',
          fromState: 'ACTIVE',
          toState: 'INACTIVE'
        },
        connection
      );
    }
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_MEMBERSHIP_REVOKED',
        topic: 'nublox.tenant.membership',
        payload: {
          membershipId,
          partyId: row.partyId,
          endedRoleAssignmentIds: assignments.map((assignment) => assignment.id)
        }
      },
      connection
    );
  });
}

export async function listTenantRoles(context: CommandContext): Promise<TenantRole[]> {
  assertPermission(context, 'tenant.role.read');
  const roles = await queryRows<RowDataPacket & Omit<TenantRole, 'permissions'>>(
    'SELECT id, role_key AS roleKey, name, status FROM role_definitions WHERE tenant_id = ? ORDER BY name',
    [context.tenantId]
  );
  if (!roles.length) return [];
  const placeholders = roles.map(() => '?').join(',');
  const permissionRows = await queryRows<RowDataPacket & { roleId: string; permissionKey: string }>(
    'SELECT role_id AS roleId, permission_key AS permissionKey FROM role_permissions WHERE role_id IN (' +
      placeholders +
      ') ORDER BY permission_key',
    roles.map((role) => role.id)
  );
  const byRole = new Map<string, string[]>();
  for (const row of permissionRows) {
    const permissions = byRole.get(row.roleId) ?? [];
    permissions.push(row.permissionKey);
    byRole.set(row.roleId, permissions);
  }
  return roles.map((role) => ({ ...role, permissions: byRole.get(role.id) ?? [] }));
}

export async function listTenantRoleAssignments(
  context: CommandContext
): Promise<TenantRoleAssignment[]> {
  assertPermission(context, 'tenant.role.read');
  return queryRows<RowDataPacket & TenantRoleAssignment>(
    "SELECT ra.id, ra.party_id AS partyId, p.display_name AS displayName, ra.role_id AS roleId, rd.role_key AS roleKey, rd.name AS roleName, ra.status, ra.valid_from AS validFrom, ra.valid_to AS validTo FROM role_assignments ra JOIN parties p ON p.id = ra.party_id JOIN role_definitions rd ON rd.id = ra.role_id WHERE ra.tenant_id = ? AND ra.scope_type = 'TENANT' AND ra.scope_id = ? ORDER BY p.display_name, rd.name, ra.valid_from DESC",
    [context.tenantId, context.tenantId]
  );
}

export async function createTenantRole(
  context: CommandContext,
  roleKey: string,
  name: string,
  permissions: string[]
) {
  assertPermission(context, 'tenant.role.manage');
  const allowed = new Set(platformPermissions.map(([key]) => key as string));
  const selected = [...new Set(permissions)];
  for (const permission of selected)
    if (!allowed.has(permission)) throw new Error('Unknown permission: ' + permission);
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO role_definitions (id, tenant_id, role_key, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, ?)",
      [
        id,
        context.tenantId,
        validateRoleKey(roleKey),
        required(name, 'Role name'),
        timestamp,
        timestamp
      ],
      connection
    );
    for (const permission of selected)
      await executeMutation(
        'INSERT INTO role_permissions (role_id, permission_key) VALUES (?, ?)',
        [id, permission],
        connection
      );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role',
        objectId: id,
        action: 'TENANT_ROLE_CREATED',
        toState: 'ACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_CREATED',
        topic: 'nublox.tenant.authority',
        payload: { roleId: id, roleKey: validateRoleKey(roleKey), permissions: selected }
      },
      connection
    );
    return id;
  });
}

export async function updateTenantRole(
  context: CommandContext,
  roleId: string,
  input: { name: string; permissions: string[] }
) {
  assertPermission(context, 'tenant.role.manage');
  const allowed = new Set(platformPermissions.map(([key]) => key as string));
  const selected = [...new Set(input.permissions)].sort();
  for (const permission of selected)
    if (!allowed.has(permission)) throw new Error('Unknown permission: ' + permission);

  return dbTransaction(async (connection) => {
    const role = await queryOne<RowDataPacket & { id: string; roleKey: string; status: string }>(
      'SELECT id, role_key AS roleKey, status FROM role_definitions WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [roleId, context.tenantId],
      connection
    );
    if (!role) throw new Error('Tenant role not found.');
    if (role.status !== 'ACTIVE') throw new Error('Only an active tenant role can be changed.');

    const actorAssignment = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' LIMIT 1",
      [context.tenantId, context.actorPartyId, roleId, context.tenantId],
      connection
    );
    if (actorAssignment && !selected.includes('tenant.role.manage')) {
      const alternate = await queryOne<RowDataPacket & { id: string }>(
        "SELECT ra.id FROM role_assignments ra JOIN role_definitions rd ON rd.id = ra.role_id JOIN role_permissions rp ON rp.role_id = rd.id WHERE ra.tenant_id = ? AND ra.party_id = ? AND ra.scope_type = 'TENANT' AND ra.scope_id = ? AND ra.status = 'ACTIVE' AND rd.status = 'ACTIVE' AND ra.role_id <> ? AND rp.permission_key = 'tenant.role.manage' LIMIT 1",
        [context.tenantId, context.actorPartyId, context.tenantId, roleId],
        connection
      );
      if (!alternate)
        throw new Error("This change would remove the actor's final tenant.role.manage authority.");
    }

    const timestamp = now();
    await executeMutation(
      'UPDATE role_definitions SET name = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
      [required(input.name, 'Role name'), timestamp, roleId, context.tenantId],
      connection
    );
    await executeMutation('DELETE FROM role_permissions WHERE role_id = ?', [roleId], connection);
    for (const permission of selected) {
      await executeMutation(
        'INSERT INTO role_permissions (role_id, permission_key) VALUES (?, ?)',
        [roleId, permission],
        connection
      );
    }
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role',
        objectId: roleId,
        action: 'TENANT_ROLE_CHANGED',
        fromState: 'ACTIVE',
        toState: 'ACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_CHANGED',
        topic: 'nublox.tenant.authority',
        payload: { roleId, roleKey: role.roleKey, permissions: selected }
      },
      connection
    );
  });
}

export async function deactivateTenantRole(context: CommandContext, roleId: string) {
  assertPermission(context, 'tenant.role.manage');
  return dbTransaction(async (connection) => {
    const role = await queryOne<RowDataPacket & { id: string; roleKey: string; status: string }>(
      'SELECT id, role_key AS roleKey, status FROM role_definitions WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [roleId, context.tenantId],
      connection
    );
    if (!role) throw new Error('Tenant role not found.');
    if (role.status !== 'ACTIVE') return;

    const actorAssignment = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' LIMIT 1",
      [context.tenantId, context.actorPartyId, roleId, context.tenantId],
      connection
    );
    if (actorAssignment)
      throw new Error('An actor cannot deactivate a tenant role currently assigned to themselves.');

    const timestamp = now();
    const assignments = await queryRows<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' FOR UPDATE",
      [context.tenantId, roleId, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE role_definitions SET status = 'INACTIVE', updated_at = ? WHERE id = ? AND tenant_id = ?",
      [timestamp, roleId, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE role_assignments SET status = 'INACTIVE', valid_to = ? WHERE tenant_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE'",
      [timestamp, context.tenantId, roleId, context.tenantId],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role',
        objectId: roleId,
        action: 'TENANT_ROLE_DEACTIVATED',
        fromState: 'ACTIVE',
        toState: 'INACTIVE',
        note: assignments.length ? `${assignments.length} active assignment(s) ended.` : undefined
      },
      connection
    );
    for (const assignment of assignments) {
      await recordPlatformAudit(
        context,
        {
          aggregateId: 'AGG-01-TENANT',
          objectType: 'tenant_role_assignment',
          objectId: assignment.id,
          action: 'TENANT_ROLE_UNASSIGNED_BY_ROLE_DEACTIVATION',
          fromState: 'ACTIVE',
          toState: 'INACTIVE'
        },
        connection
      );
    }
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_DEACTIVATED',
        topic: 'nublox.tenant.authority',
        payload: {
          roleId,
          roleKey: role.roleKey,
          endedRoleAssignmentIds: assignments.map((assignment) => assignment.id)
        }
      },
      connection
    );
  });
}

export async function reactivateTenantRole(context: CommandContext, roleId: string) {
  assertPermission(context, 'tenant.role.manage');
  return dbTransaction(async (connection) => {
    const role = await queryOne<RowDataPacket & { id: string; roleKey: string; status: string }>(
      'SELECT id, role_key AS roleKey, status FROM role_definitions WHERE id = ? AND tenant_id = ? FOR UPDATE',
      [roleId, context.tenantId],
      connection
    );
    if (!role) throw new Error('Tenant role not found.');
    if (role.status === 'ACTIVE') return;
    await executeMutation(
      "UPDATE role_definitions SET status = 'ACTIVE', updated_at = ? WHERE id = ? AND tenant_id = ?",
      [now(), roleId, context.tenantId],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role',
        objectId: roleId,
        action: 'TENANT_ROLE_REACTIVATED',
        fromState: role.status,
        toState: 'ACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_REACTIVATED',
        topic: 'nublox.tenant.authority',
        payload: { roleId, roleKey: role.roleKey }
      },
      connection
    );
  });
}

export async function assignTenantRole(context: CommandContext, partyId: string, roleId: string) {
  assertPermission(context, 'tenant.role.assign');
  return dbTransaction(async (connection) => {
    await assertParty(context, partyId, connection);
    const role = await queryOne<RowDataPacket & { id: string; roleKey: string }>(
      "SELECT id, role_key AS roleKey FROM role_definitions WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
      [roleId, context.tenantId],
      connection
    );
    if (!role) throw new Error('Active tenant role not found.');
    const membership = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM memberships WHERE tenant_id = ? AND party_id = ? AND context_type = 'TENANT' AND context_id = ? AND status = 'ACTIVE' LIMIT 1",
      [context.tenantId, partyId, context.tenantId],
      connection
    );
    if (!membership)
      throw new Error('Party must be an active tenant member before a role can be assigned.');
    const existing = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' LIMIT 1",
      [context.tenantId, partyId, roleId, context.tenantId],
      connection
    );
    if (existing) return existing.id;
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO role_assignments (id, tenant_id, party_id, role_id, scope_type, scope_id, status, valid_from, valid_to, assignment_source, created_at) VALUES (?, ?, ?, ?, 'TENANT', ?, 'ACTIVE', ?, NULL, 'tenant-authority-command', ?)",
      [id, context.tenantId, partyId, roleId, context.tenantId, timestamp, timestamp],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role_assignment',
        objectId: id,
        action: 'TENANT_ROLE_ASSIGNED',
        toState: 'ACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_ASSIGNED',
        topic: 'nublox.tenant.authority',
        payload: { assignmentId: id, partyId, roleId, roleKey: role.roleKey }
      },
      connection
    );
    return id;
  });
}

export async function unassignTenantRole(context: CommandContext, assignmentId: string) {
  assertPermission(context, 'tenant.role.assign');
  return dbTransaction(async (connection) => {
    const row = await queryOne<RowDataPacket & { partyId: string; roleId: string; status: string }>(
      "SELECT party_id AS partyId, role_id AS roleId, status FROM role_assignments WHERE id = ? AND tenant_id = ? AND scope_type = 'TENANT' AND scope_id = ?",
      [assignmentId, context.tenantId, context.tenantId],
      connection
    );
    if (!row) throw new Error('Tenant role assignment not found.');
    if (row.partyId === context.actorPartyId)
      throw new Error('An actor cannot remove their own tenant role assignment.');
    if (row.status !== 'ACTIVE') return;
    const timestamp = now();
    await executeMutation(
      "UPDATE role_assignments SET status = 'INACTIVE', valid_to = ? WHERE id = ? AND tenant_id = ?",
      [timestamp, assignmentId, context.tenantId],
      connection
    );
    const aggregateVersion = await nextTenantVersion(context, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant_role_assignment',
        objectId: assignmentId,
        action: 'TENANT_ROLE_UNASSIGNED',
        fromState: 'ACTIVE',
        toState: 'INACTIVE'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: context.tenantId,
        aggregateVersion,
        eventType: 'TENANT_ROLE_UNASSIGNED',
        topic: 'nublox.tenant.authority',
        payload: { assignmentId, partyId: row.partyId, roleId: row.roleId }
      },
      connection
    );
  });
}
