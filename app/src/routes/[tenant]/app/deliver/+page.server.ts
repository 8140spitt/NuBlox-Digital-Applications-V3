import type { PageServerLoad } from './$types';
import { recordRecentItem } from '$lib/server/interaction-preferences';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

export const load: PageServerLoad = async ({ params, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  await recordRecentItem(context, {
    itemKey: 'WORKSPACE:DELIVER',
    itemType: 'WORKSPACE',
    title: 'Deliver the Business',
    subtitle: 'Opportunity, contract, project, delivery and asset outcomes',
    routePath: '/' + params.tenant + '/app/deliver'
  });
  return {};
};
