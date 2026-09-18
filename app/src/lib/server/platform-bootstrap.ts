import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { assertDatabaseReady, dbTransaction, executeMutation, queryOne } from '$lib/server/db';
import {
  ensureTenant,
  platformPermissions,
  seedPermissionDefinitions,
  type CommandContext
} from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

type BootstrapInput = {
  tenantSlug: string;
  tenantDisplayName: string;
  authUserId: string;
  displayName: string;
  givenName?: string;
  familyName?: string;
};

function now() {
  return new Date().toISOString();
}

export async function bootstrapTenantAdministrator(input: BootstrapInput) {
  await assertDatabaseReady();

  return dbTransaction(async (connection) => {
    const tenant = await ensureTenant(input.tenantSlug, input.tenantDisplayName, connection);
    await seedPermissionDefinitions(connection);

    let changed = false;
    let identity = await queryOne<RowDataPacket & { id: string; partyId: string; status: string }>(
      "SELECT id, party_id AS partyId, status FROM user_identities WHERE tenant_id = ? AND provider = 'better-auth' AND provider_subject = ? FOR UPDATE",
      [tenant.id, input.authUserId],
      connection
    );

    let partyId: string;
    let identityId: string;
    const timestamp = now();

    if (!identity) {
      partyId = randomUUID();
      identityId = randomUUID();
      const givenName = input.givenName?.trim() || input.displayName.trim().split(/\s+/)[0] || 'Tenant';
      const familyName = input.familyName?.trim() || input.displayName.trim().split(/\s+/).slice(1).join(' ') || 'Administrator';

      await executeMutation(
        "INSERT INTO parties (id, tenant_id, party_type, display_name, status, version, created_at, updated_at) VALUES (?, ?, 'PERSON', ?, 'ACTIVE', 1, ?, ?)",
        [partyId, tenant.id, input.displayName.trim(), timestamp, timestamp],
        connection
      );
      await executeMutation(
        'INSERT INTO persons (party_id, given_name, family_name, preferred_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [partyId, givenName, familyName, input.displayName.trim(), timestamp, timestamp],
        connection
      );
      await executeMutation(
        "INSERT INTO user_identities (id, tenant_id, party_id, provider, provider_subject, display_name, status, created_at, updated_at) VALUES (?, ?, ?, 'better-auth', ?, ?, 'ACTIVE', ?, ?)",
        [identityId, tenant.id, partyId, input.authUserId, input.displayName.trim(), timestamp, timestamp],
        connection
      );
      changed = true;
    } else {
      partyId = identity.partyId;
      identityId = identity.id;
      if (identity.status !== 'ACTIVE') {
        await executeMutation(
          "UPDATE user_identities SET status = 'ACTIVE', display_name = ?, updated_at = ? WHERE id = ? AND tenant_id = ?",
          [input.displayName.trim(), timestamp, identityId, tenant.id],
          connection
        );
        changed = true;
      }
    }

    const membership = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM memberships WHERE tenant_id = ? AND party_id = ? AND context_type = 'TENANT' AND context_id = ? AND status = 'ACTIVE' LIMIT 1",
      [tenant.id, partyId, tenant.id],
      connection
    );
    if (!membership) {
      await executeMutation(
        "INSERT INTO memberships (id, tenant_id, party_id, context_type, context_id, membership_type, status, valid_from, valid_to, created_at) VALUES (?, ?, ?, 'TENANT', ?, 'INTERNAL', 'ACTIVE', ?, NULL, ?)",
        [randomUUID(), tenant.id, partyId, tenant.id, timestamp, timestamp],
        connection
      );
      changed = true;
    }

    let role = await queryOne<RowDataPacket & { id: string; status: string }>(
      "SELECT id, status FROM role_definitions WHERE tenant_id = ? AND role_key = 'tenant-admin' FOR UPDATE",
      [tenant.id],
      connection
    );
    if (!role) {
      const roleId = randomUUID();
      await executeMutation(
        "INSERT INTO role_definitions (id, tenant_id, role_key, name, status, created_at, updated_at) VALUES (?, ?, 'tenant-admin', 'Tenant Administrator', 'ACTIVE', ?, ?)",
        [roleId, tenant.id, timestamp, timestamp],
        connection
      );
      role = { id: roleId, status: 'ACTIVE' } as RowDataPacket & { id: string; status: string };
      changed = true;
    } else if (role.status !== 'ACTIVE') {
      await executeMutation(
        "UPDATE role_definitions SET status = 'ACTIVE', updated_at = ? WHERE id = ? AND tenant_id = ?",
        [timestamp, role.id, tenant.id],
        connection
      );
      changed = true;
    }

    for (const [permissionKey] of platformPermissions) {
      const inserted = await executeMutation(
        'INSERT IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)',
        [role.id, permissionKey],
        connection
      );
      if (inserted.affectedRows > 0) changed = true;
    }

    const assignment = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM role_assignments WHERE tenant_id = ? AND party_id = ? AND role_id = ? AND scope_type = 'TENANT' AND scope_id = ? AND status = 'ACTIVE' LIMIT 1",
      [tenant.id, partyId, role.id, tenant.id],
      connection
    );
    if (!assignment) {
      await executeMutation(
        "INSERT INTO role_assignments (id, tenant_id, party_id, role_id, scope_type, scope_id, status, valid_from, valid_to, assignment_source, created_at) VALUES (?, ?, ?, ?, 'TENANT', ?, 'ACTIVE', ?, NULL, 'platform-bootstrap', ?)",
        [randomUUID(), tenant.id, partyId, role.id, tenant.id, timestamp, timestamp],
        connection
      );
      changed = true;
    }

    if (changed) {
      const tenantRow = await queryOne<RowDataPacket & { version: number }>(
        'SELECT version FROM tenants WHERE id = ? FOR UPDATE',
        [tenant.id],
        connection
      );
      if (!tenantRow) throw new Error('Bootstrapped tenant could not be reloaded.');
      const aggregateVersion = tenantRow.version + 1;
      await executeMutation(
        'UPDATE tenants SET version = ?, updated_at = ? WHERE id = ? AND version = ?',
        [aggregateVersion, timestamp, tenant.id, tenantRow.version],
        connection
      );

      const context: CommandContext = {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        userIdentityId: identityId,
        actorPartyId: partyId,
        actorDisplayName: input.displayName.trim(),
        correlationId: randomUUID(),
        roleKeys: ['tenant-admin'],
        permissions: platformPermissions.map(([permissionKey]) => permissionKey)
      };

      await recordPlatformAudit(context, {
        aggregateId: 'AGG-01-TENANT',
        objectType: 'tenant',
        objectId: tenant.id,
        action: 'TENANT_ADMINISTRATOR_BOOTSTRAPPED',
        toState: 'ACTIVE',
        note: 'Controlled platform bootstrap established the initial tenant administrator.'
      }, connection);
      await emitBusinessEvent(context, {
        aggregateId: 'AGG-01-TENANT',
        aggregateType: 'Tenant',
        aggregateObjectId: tenant.id,
        aggregateVersion,
        eventType: 'TENANT_ADMINISTRATOR_BOOTSTRAPPED',
        topic: 'nublox.tenant.authority',
        payload: { identityId, partyId, roleId: role.id }
      }, connection);
    }

    return { tenantId: tenant.id, tenantSlug: tenant.slug, partyId, identityId, changed };
  });
}
