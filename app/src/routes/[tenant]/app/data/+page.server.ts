import type { PageServerLoad } from './$types';
import { recordRecentItem } from '$lib/server/interaction-preferences';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  await recordRecentItem(context, {
    itemKey: 'WORKSPACE:ENTERPRISE-DATA',
    itemType: 'WORKSPACE',
    title: 'Enterprise Data',
    subtitle: 'Shared parties, organisation, products, assets and reference data',
    routePath: '/' + params.tenant + '/app/data'
  });
  return {};
};
