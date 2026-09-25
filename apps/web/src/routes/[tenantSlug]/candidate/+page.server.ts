import type { PageServerLoad } from './$types';
import { requirePublicTenant } from '$lib/server/public-tenant';

export const load: PageServerLoad = async ({ params }) => ({
  tenant: await requirePublicTenant(params.tenantSlug)
});
