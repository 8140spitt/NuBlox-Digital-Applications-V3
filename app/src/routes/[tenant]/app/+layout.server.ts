import type { LayoutServerLoad } from './$types';
import { resolveDevelopmentCommandContext } from '$lib/server/platform-context';

export const load: LayoutServerLoad = async ({ params }) => {
  const context = await resolveDevelopmentCommandContext(params.tenant);
  return {
    tenantSlug: context.tenantSlug,
    actorDisplayName: context.actorDisplayName,
    roleKeys: context.roleKeys
  };
};
