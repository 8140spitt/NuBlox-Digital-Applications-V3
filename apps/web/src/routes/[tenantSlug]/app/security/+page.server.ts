import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
  tenantSlug: locals.auth?.tenantSlug ?? ''
});
