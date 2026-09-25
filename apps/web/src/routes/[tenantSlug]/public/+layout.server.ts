import type { LayoutServerLoad } from './$types';
import { requirePublicTenant } from '$lib/server/public-tenant';

export const load: LayoutServerLoad = async ({ params }) => ({
  tenant: await requirePublicTenant(params.tenantSlug)
});
