import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createPerformanceCorrectiveAction,
  getPerformanceVariance,
  listKpiDefinitions,
  listPerformanceBaselines,
  listPerformanceObservations,
  listPerformanceTargets
} from '$lib/server/strategic-performance';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1)
    throw new Error(name + ' must be a positive whole number.');
  return value;
}
function target(tenant: string, kpiId?: string) {
  return `/${tenant}/app/functions/f03/variance-management${kpiId ? '?kpi=' + encodeURIComponent(kpiId) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The Variance Management command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const kpis = await listKpiDefinitions(context);
  const selected = kpis.find((row) => row.id === url.searchParams.get('kpi')) ?? kpis[0] ?? null;
  const [targets, observations, baselines] = selected
    ? await Promise.all([
        listPerformanceTargets(context, selected.id),
        listPerformanceObservations(context, selected.id),
        listPerformanceBaselines(context, selected.id)
      ])
    : [[], [], []];

  let variance = null;
  const scopeType = url.searchParams.get('scopeType')?.trim();
  const scopeId = url.searchParams.get('scopeId')?.trim();
  const periodStart = url.searchParams.get('periodStart')?.trim();
  const periodEnd = url.searchParams.get('periodEnd')?.trim();
  if (selected && scopeType && scopeId && periodStart && periodEnd) {
    variance = await getPerformanceVariance(context, {
      kpiId: selected.id,
      scopeType,
      scopeId,
      periodStart,
      periodEnd
    });
  }

  return {
    tenantSlug: params.tenant,
    kpis,
    selected,
    targets,
    observations,
    baselines,
    variance,
    query: {
      scopeType: scopeType ?? 'TENANT',
      scopeId: scopeId ?? '',
      periodStart: periodStart ?? '',
      periodEnd: periodEnd ?? ''
    },
    canManage: hasPermission(context, 'strategy.performance.manage')
  };
};

export const actions: Actions = {
  corrective: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await createPerformanceCorrectiveAction(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          kpiId,
          kpiVersionNo: integer(data, 'kpiVersionNo'),
          title: text(data, 'title'),
          instructions: text(data, 'instructions'),
          priority: text(data, 'priority') || undefined,
          dueAt: text(data, 'dueAt') || undefined
        }
      );
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
