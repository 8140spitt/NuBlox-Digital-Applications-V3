import { error } from '@sveltejs/kit';
import { getTenantRoutingRepository } from './platform';

export async function requirePublicTenant(tenantSlug: string) {
  const tenant = await getTenantRoutingRepository().findActiveBySlug(tenantSlug);
  if (!tenant) {
    error(404, 'Tenant not found.');
  }
  return tenant;
}
