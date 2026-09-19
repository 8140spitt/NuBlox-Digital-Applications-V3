import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  beginItemRetirement,
  completeItemRetirement,
  getItemRetirementProfile,
  listItemLifecycleReviews,
  listItems,
  listProductConfigurations,
  recordItemLifecycleReview
} from '$lib/server/product-innovation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid aggregate version is required.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(name + ' must contain valid JSON.');
  }
}
function target(tenant: string, id?: string, mode = 'lifecycle') {
  const q = new URLSearchParams({ mode });
  if (id) q.set('item', id);
  return `/${tenant}/app/functions/f05/lifecycle?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The lifecycle command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [items, configurations] = await Promise.all([
    listItems(context),
    listProductConfigurations(context)
  ]);
  const selected = items.find((item) => item.id === url.searchParams.get('item')) ?? items[0] ?? null;
  const [reviews, retirement] = selected
    ? await Promise.all([
        listItemLifecycleReviews(context, selected.id),
        getItemRetirementProfile(context, selected.id)
      ])
    : [[], null];
  return {
    tenantSlug: params.tenant,
    mode: url.searchParams.get('mode') === 'retirement' ? 'retirement' : 'lifecycle',
    items,
    selected,
    reviews,
    retirement,
    configurations: selected ? configurations.filter((item) => item.itemId === selected.id) : [],
    capabilities: {
      canLifecycle: hasPermission(context, 'product.lifecycle.manage'),
      canRetire: hasPermission(context, 'product.retirement.manage')
    }
  };
};

export const actions: Actions = {
  review: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = text(data, 'itemId');
    const mode = text(data, 'mode') || 'lifecycle';
    try {
      await recordItemLifecycleReview(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        {
          reviewType: text(data, 'reviewType'),
          summary: text(data, 'summary'),
          metrics: json(data, 'metrics'),
          recommendation: text(data, 'recommendation'),
          configurationModelId: text(data, 'configurationModelId') || undefined
        }
      );
      redirect(303, target(params.tenant, itemId, mode));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  beginRetirement: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = text(data, 'itemId');
    try {
      await beginItemRetirement(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data),
        {
          rationale: text(data, 'rationale'),
          stakeholderNoticeReference: text(data, 'stakeholderNoticeReference') || undefined,
          customerMigrationPlan: text(data, 'customerMigrationPlan') || undefined,
          supportEndAt: text(data, 'supportEndAt') || undefined,
          archiveReference: text(data, 'archiveReference') || undefined
        }
      );
      redirect(303, target(params.tenant, itemId, 'retirement'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  completeRetirement: async ({ request, params, locals }) => {
    const data = await request.formData();
    const itemId = text(data, 'itemId');
    try {
      await completeItemRetirement(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data)
      );
      redirect(303, target(params.tenant, itemId, 'retirement'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};