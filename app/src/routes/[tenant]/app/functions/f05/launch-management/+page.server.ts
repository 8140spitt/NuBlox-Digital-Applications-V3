import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  configureItemLaunch,
  getItemLaunchProfile,
  launchOffering,
  listItems,
  listProductBusinessCases,
  listProductConfigurations
} from '$lib/server/product-innovation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('A valid aggregate version is required.');
  return value;
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f05/launch-management${id ? '?item=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The launch command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [items, configurations, businessCases] = await Promise.all([
    listItems(context),
    listProductConfigurations(context),
    listProductBusinessCases(context, 'PRODUCT_SERVICE')
  ]);
  const selected =
    items.find((item) => item.id === url.searchParams.get('item')) ?? items[0] ?? null;
  const launch = selected ? await getItemLaunchProfile(context, selected.id) : null;
  return {
    tenantSlug: params.tenant,
    items,
    selected,
    launch,
    configurations: selected ? configurations.filter((item) => item.itemId === selected.id) : [],
    businessCases: selected ? businessCases.filter((item) => item.itemId === selected.id) : [],
    canManage: hasPermission(context, 'product.launch.manage')
  };
};

export const actions: Actions = {
  configure: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = text(data, 'itemId');
    try {
      await configureItemLaunch(await resolveRequestCommandContext(params.tenant, locals), itemId, {
        launchPlan: text(data, 'launchPlan'),
        channelReadiness: text(data, 'channelReadiness'),
        trainingReadiness: text(data, 'trainingReadiness'),
        pricingReference: text(data, 'pricingReference'),
        plannedLaunchAt: text(data, 'plannedLaunchAt') || undefined
      });
      redirect(303, target(params.tenant, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  launch: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = text(data, 'itemId');
    try {
      await launchOffering(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data)
      );
      redirect(303, target(params.tenant, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
