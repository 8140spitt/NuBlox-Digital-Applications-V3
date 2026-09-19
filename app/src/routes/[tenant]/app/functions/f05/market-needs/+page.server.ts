import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createMarketInsight,
  listMarketInsights,
  validateMarketInsight
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
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f05/market-needs${id ? '?insight=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The market-need command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const insights = await listMarketInsights(context);
  const selected =
    insights.find((item) => item.id === url.searchParams.get('insight')) ?? insights[0] ?? null;
  return {
    tenantSlug: params.tenant,
    insights,
    selected,
    canManage: hasPermission(context, 'product.market_need.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createMarketInsight(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          insightRef: text(data, 'insightRef'),
          insightType: text(data, 'insightType') || 'CUSTOMER_NEED',
          title: text(data, 'title'),
          subject: text(data, 'subject'),
          sourceType: text(data, 'sourceType'),
          sourceReference: text(data, 'sourceReference') || undefined,
          asOfAt: text(data, 'asOfAt') || undefined,
          confidence: text(data, 'confidence') || 'MEDIUM',
          geography: text(data, 'geography') || undefined,
          sector: text(data, 'sector') || undefined,
          problemStatement: text(data, 'problemStatement'),
          needStatement: text(data, 'needStatement'),
          desiredOutcome: text(data, 'desiredOutcome') || undefined,
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  validate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'insightId');
    try {
      await validateMarketInsight(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};