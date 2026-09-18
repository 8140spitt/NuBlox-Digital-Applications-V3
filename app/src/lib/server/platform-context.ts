import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  assertDatabaseReady,
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';

export const platformPermissions = [
  ['platform.audit.read', 'platform.audit', 'read', 'Read tenant-scoped platform audit evidence.'],
  ['tenant.membership.read', 'tenant.membership', 'read', 'Read tenant membership authority.'],
  ['tenant.membership.manage', 'tenant.membership', 'manage', 'Grant and revoke tenant membership authority.'],
  ['tenant.role.read', 'tenant.role', 'read', 'Read tenant roles and permission grants.'],
  ['tenant.role.manage', 'tenant.role', 'manage', 'Create and maintain tenant role definitions.'],
  ['tenant.role.assign', 'tenant.role', 'assign', 'Assign tenant roles to active tenant members.'],
  ['party.read', 'party', 'read', 'Read canonical Party, Person and Organisation master data.'],
  ['party.create', 'party', 'create', 'Create canonical Party identities and specialisations.'],
  ['party.change', 'party', 'change', 'Change mutable canonical Party master data.'],
  ['party.activate', 'party', 'activate', 'Activate or deactivate canonical Party master data.'],
  ['strategy.framework.read', 'strategy.framework', 'read', 'Read strategy frameworks and immutable versions.'],
  ['strategy.framework.create', 'strategy.framework', 'create', 'Create a strategy framework draft.'],
  ['strategy.framework.change', 'strategy.framework', 'change', 'Edit a draft or returned strategy framework.'],
  ['strategy.framework.submit', 'strategy.framework', 'submit', 'Submit a strategy framework version for review.'],
  ['strategy.framework.review', 'strategy.framework', 'review', 'Return or reject a strategy framework review.'],
  ['strategy.framework.approve', 'strategy.framework', 'approve', 'Approve a strategy framework version.'],
  ['strategy.framework.publish', 'strategy.framework', 'publish', 'Publish an approved strategy framework.']
] as const;

export type PlatformPermission = (typeof platformPermissions)[number][0];

export type CommandContext = {
  tenantId: string;
  tenantSlug: string;
  userIdentityId: string;
  actorPartyId: string;
  actorDisplayName: string;
  correlationId: string;
  roleKeys: string[];
  permissions: string[];
};

type TenantRow = RowDataPacket & {
  id: string;
  slug: string;
  displayName: string;
  status: string;
};

type IdentityRow = RowDataPacket & {
  id: string;
  partyId: string;
  displayName: string;
  status: string;
};

function now() {
  return new Date().toISOString();
}

function tenantName(slug: string) {
  return slug.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'NuBlox Tenant';
}

async function getTenant(tenantSlug: string, executor?: DbExecutor) {
  return queryOne<TenantRow>(
    'SELECT id, slug, display_name AS displayName, status FROM tenants WHERE slug = ?',
    [tenantSlug],
    executor
  );
}

export async function ensureTenant(tenantSlug: string, displayName: string, executor: DbExecutor): Promise<TenantRow> {
  const slug = tenantSlug.trim().toLowerCase();
  if (!slug) throw new Error('Tenant slug is required.');
  const existing = await getTenant(slug, executor);
  if (existing) {
    if (existing.status !== 'ACTIVE') throw new Error('Tenant is not active.');
    return existing;
  }

  const id = randomUUID();
  const timestamp = now();
  await executeMutation(
    'INSERT INTO tenants (id, slug, display_name, status, created_at, updated_at) VALUES (?, ?, ?, \'ACTIVE\', ?, ?)',
    [id, slug, displayName.trim() || tenantName(slug), timestamp, timestamp],
    executor
  );
  return (await getTenant(slug, executor)) as TenantRow;
}

export async function seedPermissionDefinitions(executor: DbExecutor) {
  for (const permission of platformPermissions) {
    await executeMutation(
      'INSERT INTO permission_definitions (permission_key, resource, action, description) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE resource = VALUES(resource), action = VALUES(action), description = VALUES(description)',
      [...permission],
      executor
    );
  }
}

export async function ensureDevelopmentIdentity(tenant: TenantRow, executor: DbExecutor) {
  const existing = await queryOne<IdentityRow>(
    'SELECT id, party_id AS partyId, display_name AS displayName, status FROM user_identities WHERE tenant_id = ? AND provider = \'development\' AND provider_subject = \'development-user\'',
    [tenant.id],
    executor
  );
  if (existing) {
    if (existing.status !== 'ACTIVE') throw new Error('Development identity is not active.');
    return existing;
  }

  const partyId = randomUUID();
  const identityId = randomUUID();
  const timestamp = now();
  await executeMutation(
    'INSERT INTO parties (id, tenant_id, party_type, display_name, status, version, created_at, updated_at) VALUES (?, ?, \'PERSON\', \'Development User\', \'ACTIVE\', 1, ?, ?)',
    [partyId, tenant.id, timestamp, timestamp],
    executor
  );
  await executeMutation(
    'INSERT INTO persons (party_id, given_name, family_name, preferred_name, created_at, updated_at) VALUES (?, \'Development\', \'User\', \'Development User\', ?, ?)',
    [partyId, timestamp, timestamp],
    executor
  );
  await executeMutation(
    'INSERT INTO user_identities (id, tenant_id, party_id, provider, provider_subject, display_name, status, created_at, updated_at) VALUES (?, ?, ?, \'development\', \'development-user\', \'Development User\', \'ACTIVE\', ?, ?)',
    [identityId, tenant.id, partyId, timestamp, timestamp],
    executor
  );
  return { id: identityId, partyId, displayName: 'Development User', status: 'ACTIVE' } as IdentityRow;
}

export async function ensureDevelopmentAuthority(tenant: TenantRow, identity: IdentityRow, executor: DbExecutor) {
  await seedPermissionDefinitions(executor);
  const timestamp = now();

  const membership = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM memberships WHERE tenant_id = ? AND party_id = ? AND context_type = \'TENANT\' AND context_id = ? AND status = \'ACTIVE\' LIMIT 1',
    [tenant.id, identity.partyId, tenant.id],
    executor
  );
  if (!membership) {
    await executeMutation(
      'INSERT INTO memberships (id, tenant_id, party_id, context_type, context_id, membership_type, status, valid_from, valid_to, created_at) VALUES (?, ?, ?, \'TENANT\', ?, \'INTERNAL\', \'ACTIVE\', ?, NULL, ?)',
      [randomUUID(), tenant.id, identity.partyId, tenant.id, timestamp, timestamp],
      executor
    );
  }

  let role = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM role_definitions WHERE tenant_id = ? AND role_key = \'tenant-admin\'',
    [tenant.id],
    executor
  );
  if (!role) {
    const id = randomUUID();
    await executeMutation(
      'INSERT INTO role_definitions (id, tenant_id, role_key, name, status, created_at, updated_at) VALUES (?, ?, \'tenant-admin\', \'Tenant Administrator\', \'ACTIVE\', ?, ?)',
      [id, tenant.id, timestamp, timestamp],
      executor
    );
    role = { id } as RowDataPacket & { id: string };
  }

  for (const [permissionKey] of platformPermissions) {
    await executeMutation(
      'INSERT IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)',
      [role.id, permissionKey],
      executor
    );
  }

  const assignment = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND role_id = ? AND scope_type = \'TENANT\' AND scope_id = ? AND status = \'ACTIVE\' LIMIT 1',
    [tenant.id, identity.partyId, role.id, tenant.id],
    executor
  );
  if (!assignment) {
    await executeMutation(
      'INSERT INTO role_assignments (id, tenant_id, party_id, role_id, scope_type, scope_id, status, valid_from, valid_to, assignment_source, created_at) VALUES (?, ?, ?, ?, \'TENANT\', ?, \'ACTIVE\', ?, NULL, \'development-bootstrap\', ?)',
      [randomUUID(), tenant.id, identity.partyId, role.id, tenant.id, timestamp, timestamp],
      executor
    );
  }
}

export async function resolveContextForIdentity(
  tenantSlug: string,
  userIdentityId: string,
  correlationId = randomUUID()
): Promise<CommandContext> {
  await assertDatabaseReady();
  const tenant = await getTenant(tenantSlug.trim().toLowerCase());
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('Tenant is not active.');

  const identity = await queryOne<IdentityRow>(
    'SELECT id, party_id AS partyId, display_name AS displayName, status FROM user_identities WHERE id = ? AND tenant_id = ?',
    [userIdentityId, tenant.id]
  );
  if (!identity || identity.status !== 'ACTIVE' || !identity.partyId) {
    throw new Error('An active user identity linked to a Party is required.');
  }

  const timestamp = now();
  const membership = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM memberships WHERE tenant_id = ? AND party_id = ? AND context_type = \'TENANT\' AND context_id = ? AND status = \'ACTIVE\' AND valid_from <= ? AND (valid_to IS NULL OR valid_to > ?) LIMIT 1',
    [tenant.id, identity.partyId, tenant.id, timestamp, timestamp]
  );
  if (!membership) throw new Error('The actor is not an active member of this tenant.');

  const roleRows = await queryRows<RowDataPacket & { id: string; roleKey: string }>(
    'SELECT DISTINCT rd.id, rd.role_key AS roleKey FROM role_assignments ra JOIN role_definitions rd ON rd.id = ra.role_id WHERE ra.tenant_id = ? AND ra.party_id = ? AND ra.scope_type = \'TENANT\' AND ra.scope_id = ? AND ra.status = \'ACTIVE\' AND rd.status = \'ACTIVE\' AND ra.valid_from <= ? AND (ra.valid_to IS NULL OR ra.valid_to > ?)',
    [tenant.id, identity.partyId, tenant.id, timestamp, timestamp]
  );

  const roleIds = roleRows.map((role) => role.id);
  const permissions = new Set<string>();
  if (roleIds.length) {
    const placeholders = roleIds.map(() => '?').join(',');
    const rows = await queryRows<RowDataPacket & { permissionKey: string }>(
      'SELECT DISTINCT permission_key AS permissionKey FROM role_permissions WHERE role_id IN (' + placeholders + ')',
      roleIds
    );
    for (const row of rows) permissions.add(row.permissionKey);
  }

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    userIdentityId: identity.id,
    actorPartyId: identity.partyId,
    actorDisplayName: identity.displayName,
    correlationId,
    roleKeys: roleRows.map((role) => role.roleKey),
    permissions: [...permissions].sort()
  };
}

export async function resolveDevelopmentCommandContext(
  tenantSlug: string,
  correlationId = randomUUID()
): Promise<CommandContext> {
  await assertDatabaseReady();
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development identity bootstrap is disabled in production.');
  }

  const tenant = await getTenant(tenantSlug.trim().toLowerCase());
  if (!tenant || tenant.status !== 'ACTIVE') {
    throw new Error('Development tenant is not seeded. Run: pnpm db:seed:dev -- ' + tenantSlug);
  }
  const identity = await queryOne<IdentityRow>(
    "SELECT id, party_id AS partyId, display_name AS displayName, status FROM user_identities WHERE tenant_id = ? AND provider = 'development' AND provider_subject = 'development-user'",
    [tenant.id]
  );
  if (!identity || identity.status !== 'ACTIVE') {
    throw new Error('Development identity is not seeded. Run: pnpm db:seed:dev -- ' + tenantSlug);
  }
  return resolveContextForIdentity(tenant.slug, identity.id, correlationId);
}

export function hasPermission(context: CommandContext, permission: string) {
  return context.permissions.includes(permission);
}

export function assertPermission(context: CommandContext, permission: PlatformPermission | string) {
  if (!hasPermission(context, permission)) throw new Error('Permission denied: ' + permission);
}

export function authoritySnapshot(context: CommandContext) {
  return {
    userIdentityId: context.userIdentityId,
    actorPartyId: context.actorPartyId,
    roleKeys: [...context.roleKeys],
    permissions: [...context.permissions],
    correlationId: context.correlationId
  };
}
