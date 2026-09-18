import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ params, data }) => ({
  ...data,
  tenantSlug: params.tenant
});
