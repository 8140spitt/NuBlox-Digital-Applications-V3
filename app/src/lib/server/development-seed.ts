import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { assertDatabaseReady, dbTransaction, queryOne } from '$lib/server/db';
import {
  ensureDevelopmentAuthority,
  ensureDevelopmentIdentity,
  ensureTenant
} from '$lib/server/platform-context';

function displayName(slug: string) {
  return slug.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'NuBlox Tenant';
}

export async function seedDevelopmentTenant(tenantSlug: string) {
  if (process.env.NODE_ENV === 'production') throw new Error('Development seeding is disabled in production.');
  await assertDatabaseReady();
  const slug = tenantSlug.trim().toLowerCase();
  if (!slug) throw new Error('Tenant slug is required.');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Tenant slug must contain lowercase letters, numbers and single hyphens only.');
  }

  return dbTransaction(async (connection) => {
    const tenant = await ensureTenant(slug, displayName(slug), connection);
    const identity = await ensureDevelopmentIdentity(tenant, connection);
    await ensureDevelopmentAuthority(tenant, identity, connection);

    // Repair development identities created before Person became a canonical specialisation.
    const person = await queryOne<RowDataPacket & { partyId: string }>(
      'SELECT party_id AS partyId FROM persons WHERE party_id = ?',
      [identity.partyId], connection
    );
    if (!person) {
      const timestamp = new Date().toISOString();
      await connection.execute(
        "INSERT INTO persons (party_id, given_name, family_name, preferred_name, created_at, updated_at) VALUES (?, 'Development', 'User', 'Development User', ?, ?)",
        [identity.partyId, timestamp, timestamp]
      );
    }
    return { tenantId: tenant.id, tenantSlug: tenant.slug, identityId: identity.id };
  });
}
