import type { PageServerLoad } from './$types';
import { recordRecentItem } from '$lib/server/interaction-preferences';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  await recordRecentItem(context, {
    itemKey: 'WORKSPACE:OPERATE',
    itemType: 'WORKSPACE',
    title: 'Operate the Business',
    subtitle: 'Strategy, governance, performance and enterprise operations',
    routePath: '/' + params.tenant + '/app/operate'
  });
  return {};
};
