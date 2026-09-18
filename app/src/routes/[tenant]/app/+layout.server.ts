import type { LayoutServerLoad } from './$types';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

export const load: LayoutServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  return {
    tenantSlug: context.tenantSlug,
    actorDisplayName: context.actorDisplayName,
    roleKeys: context.roleKeys
  };
};
