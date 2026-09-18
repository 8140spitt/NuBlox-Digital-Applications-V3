import type { PageLoad } from './$types';
export const load: PageLoad = ({ params }) => ({ tenantSlug: params.tenant });
