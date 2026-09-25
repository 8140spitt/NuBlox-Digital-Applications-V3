import type { Reroute } from '@sveltejs/kit';
import { rerouteTenantApplicationPath } from '$lib/tenant-paths';

export const reroute: Reroute = ({ url }) => rerouteTenantApplicationPath(url.pathname);
