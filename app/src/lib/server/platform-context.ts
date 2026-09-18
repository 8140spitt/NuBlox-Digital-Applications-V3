import { randomUUID } from 'node:crypto';
import { db, dbTransaction } from '$lib/server/db';

export const platformPermissions = [
  ['platform.audit.read', 'platform.audit', 'read', 'Read tenant-scoped platform audit evidence.'],
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

type TenantRow = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
};

type IdentityRow = {
  id: string;
  partyId: string;
  displayName: string;
  status: string;
};

function now() {
  return new Date().toISOString();
}

function tenantName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'NuBlox Tenant';
}

function getTenant(tenantSlug: string): TenantRow | undefined {
  return db.prepare(`
    SELECT id, slug, display_name AS displayName, status
    FROM tenants
    WHERE slug = ?
  `).get(tenantSlug) as TenantRow | undefined;
}

export function ensureTenant(tenantSlug: string, displayName = tenantName(tenantSlug)): TenantRow {
  const slug = tenantSlug.trim().toLowerCase();
  if (!slug) throw new Error('Tenant slug is required.');

  const existing = getTenant(slug);
  if (existing) {
    if (existing.status !== 'ACTIVE') throw new Error('Tenant is not active.');
    return existing;
  }

  const id = randomUUID();
  const timestamp = now();
  db.prepare(`
    INSERT INTO tenants (id, slug, display_name, status, created_at, updated_at)
    VALUES (?, ?, ?, 'ACTIVE', ?, ?)
  `).run(id, slug, displayName.trim() || tenantName(slug), timestamp, timestamp);

  return getTenant(slug) as TenantRow;
}

function seedPermissionDefinitions() {
  const statement = db.prepare(`
    INSERT INTO permission_definitions (permission_key, resource, action, description)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(permission_key) DO UPDATE SET
      resource = excluded.resource,
      action = excluded.action,
      description = excluded.description
  `);
  for (const permission of platformPermissions) statement.run(...permission);
}

function ensureDevelopmentIdentity(tenant: TenantRow): IdentityRow {
  const existing = db.prepare(`
    SELECT id, party_id AS partyId, display_name AS displayName, status
    FROM user_identities
    WHERE tenant_id = ? AND provider = 'development' AND provider_subject = 'development-user'
  `).get(tenant.id) as IdentityRow | undefined;

  if (existing) {
    if (existing.status !== 'ACTIVE') throw new Error('Development identity is not active.');
    return existing;
  }

  const partyId = randomUUID();
  const identityId = randomUUID();
  const timestamp = now();

  db.prepare(`
    INSERT INTO parties (id, tenant_id, party_type, display_name, status, version, created_at, updated_at)
    VALUES (?, ?, 'PERSON', 'Development User', 'ACTIVE', 1, ?, ?)
  `).run(partyId, tenant.id, timestamp, timestamp);

  db.prepare(`
    INSERT INTO user_identities
      (id, tenant_id, party_id, provider, provider_subject, display_name, status, created_at, updated_at)
    VALUES (?, ?, ?, 'development', 'development-user', 'Development User', 'ACTIVE', ?, ?)
  `).run(identityId, tenant.id, partyId, timestamp, timestamp);

  return { id: identityId, partyId, displayName: 'Development User', status: 'ACTIVE' };
}

function ensureDevelopmentAuthority(tenant: TenantRow, identity: IdentityRow) {
  seedPermissionDefinitions();
  const timestamp = now();

  const membership = db.prepare(`
    SELECT id FROM memberships
    WHERE tenant_id = ? AND party_id = ? AND context_type = 'TENANT' AND context_id = ?
      AND status = 'ACTIVE'
  `).get(tenant.id, identity.partyId, tenant.id) as { id: string } | undefined;

  if (!membership) {
    db.prepare(`
      INSERT INTO memberships
        (id, tenant_id, party_id, context_type, context_id, membership_type, status, valid_from, valid_to, created_at)
      VALUES (?, ?, ?, 'TENANT', ?, 'INTERNAL', 'ACTIVE', ?, NULL, ?)
    `).run(randomUUID(), tenant.id, identity.partyId, tenant.id, timestamp, timestamp);
  }

  let role = db.prepare(`
    SELECT id FROM role_definitions WHERE tenant_id = ? AND role_key = 'tenant-admin'
  `).get(tenant.id) as { id: string } | undefined;

  if (!role) {
    const id = randomUUID();
    db.prepare(`
      INSERT INTO role_definitions (id, tenant_id, role_key, name, status, created_at, updated_at)
      VALUES (?, ?, 'tenant-admin', 'Tenant Administrator', 'ACTIVE', ?, ?)
    `).run(id, tenant.id, timestamp, timestamp);
    role = { id };
  }

  const grant = db.prepare(`
    INSERT OR IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)
  `);
  for (const [permissionKey] of platformPermissions) grant.run(role.id, permissionKey);

  const assignment = db.prepare(`
    SELECT id FROM role_assignments
    WHERE tenant_id = ? AND party_id = ? AND role_id = ?
      AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE'
  `).get(tenant.id, identity.partyId, role.id, tenant.id) as { id: string } | undefined;

  if (!assignment) {
    db.prepare(`
      INSERT INTO role_assignments
        (id, tenant_id, party_id, role_id, scope_type, scope_id, status, valid_from, valid_to, assignment_source, created_at)
      VALUES (?, ?, ?, ?, 'TENANT', ?, 'ACTIVE', ?, NULL, 'development-bootstrap', ?)
    `).run(randomUUID(), tenant.id, identity.partyId, role.id, tenant.id, timestamp, timestamp);
  }
}

export function resolveContextForIdentity(
  tenantSlug: string,
  userIdentityId: string,
  correlationId = randomUUID()
): CommandContext {
  const tenant = getTenant(tenantSlug.trim().toLowerCase());
  if (!tenant || tenant.status !== 'ACTIVE') throw new Error('Tenant is not active.');

  const identity = db.prepare(`
    SELECT id, party_id AS partyId, display_name AS displayName, status
    FROM user_identities
    WHERE id = ? AND tenant_id = ?
  `).get(userIdentityId, tenant.id) as IdentityRow | undefined;

  if (!identity || identity.status !== 'ACTIVE' || !identity.partyId) {
    throw new Error('An active user identity linked to a Party is required.');
  }

  const timestamp = now();
  const membership = db.prepare(`
    SELECT id FROM memberships
    WHERE tenant_id = ? AND party_id = ?
      AND context_type = 'TENANT' AND context_id = ?
      AND status = 'ACTIVE'
      AND valid_from <= ?
      AND (valid_to IS NULL OR valid_to > ?)
    LIMIT 1
  `).get(tenant.id, identity.partyId, tenant.id, timestamp, timestamp);

  if (!membership) throw new Error('The actor is not an active member of this tenant.');

  const roleRows = db.prepare(`
    SELECT DISTINCT rd.id, rd.role_key AS roleKey
    FROM role_assignments ra
    JOIN role_definitions rd ON rd.id = ra.role_id
    WHERE ra.tenant_id = ? AND ra.party_id = ?
      AND ra.scope_type = 'TENANT' AND ra.scope_id = ?
      AND ra.status = 'ACTIVE' AND rd.status = 'ACTIVE'
      AND ra.valid_from <= ?
      AND (ra.valid_to IS NULL OR ra.valid_to > ?)
  `).all(tenant.id, identity.partyId, tenant.id, timestamp, timestamp) as unknown as { id: string; roleKey: string }[];

  const roleIds = roleRows.map((role) => role.id);
  const permissions = new Set<string>();
  if (roleIds.length) {
    const placeholders = roleIds.map(() => '?').join(',');
    const rows = db.prepare(`
      SELECT DISTINCT permission_key AS permissionKey
      FROM role_permissions
      WHERE role_id IN (${placeholders})
    `).all(...roleIds) as unknown as { permissionKey: string }[];
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

export function resolveDevelopmentCommandContext(
  tenantSlug: string,
  correlationId = randomUUID()
): CommandContext {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Development identity bootstrap is disabled in production.');
  }

  let identity!: IdentityRow;
  let tenant!: TenantRow;
  dbTransaction(() => {
    tenant = ensureTenant(tenantSlug);
    identity = ensureDevelopmentIdentity(tenant);
    ensureDevelopmentAuthority(tenant, identity);
  });

  return resolveContextForIdentity(tenant.slug, identity.id, correlationId);
}

export function hasPermission(context: CommandContext, permission: string) {
  return context.permissions.includes(permission);
}

export function assertPermission(context: CommandContext, permission: PlatformPermission | string) {
  if (!hasPermission(context, permission)) {
    throw new Error(`Permission denied: ${permission}`);
  }
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
