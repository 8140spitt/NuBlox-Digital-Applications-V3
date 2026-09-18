import type { LayoutServerLoad } from './$types';
import { resolveDevelopmentCommandContext } from '$lib/server/platform-context';

export const load: LayoutServerLoad = ({ params }) => {
  const context = resolveDevelopmentCommandContext(params.tenant);
  return {
    tenantSlug: context.tenantSlug,
    actorDisplayName: context.actorDisplayName,
    roleKeys: context.roleKeys
  };
};
