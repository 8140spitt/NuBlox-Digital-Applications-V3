import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  approveDevelopmentAppraisalSnapshot,
  createDevelopmentAppraisal,
  listDevelopmentAppraisals,
  listDevelopmentOpportunities,
  reviewDevelopmentAppraisal
} from '$lib/server/corporate-development';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(name + ' must be a JSON object.');
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith('must be a JSON object.')) throw error;
    throw new Error(name + ' contains invalid JSON.');
  }
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f04/valuation${id ? '?appraisal=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Valuation command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [appraisals, opportunities] = await Promise.all([
    listDevelopmentAppraisals(context),
    listDevelopmentOpportunities(context)
  ]);
  const selected =
    appraisals.find((row) => row.id === url.searchParams.get('appraisal')) ??
    appraisals[0] ??
    null;
  return {
    tenantSlug: params.tenant,
    appraisals,
    opportunities,
    selected,
    canManage: hasPermission(context, 'corporate.development.valuation.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createDevelopmentAppraisal(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          opportunityId: text(data, 'opportunityId'),
          appraisalRef: text(data, 'appraisalRef'),
          scenarioName: text(data, 'scenarioName'),
          asOfAt: text(data, 'asOfAt') || undefined,
          sourceBasis: json(data, 'sourceBasis'),
          assumptions: json(data, 'assumptions'),
          synergyAssumptions: json(data, 'synergyAssumptions'),
          valuationMetrics: json(data, 'valuationMetrics'),
          sensitivity: json(data, 'sensitivity'),
          supersedesAppraisalId: text(data, 'supersedesAppraisalId') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  review: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'appraisalId');
    try {
      await reviewDevelopmentAppraisal(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'appraisalId');
    try {
      await approveDevelopmentAppraisalSnapshot(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
