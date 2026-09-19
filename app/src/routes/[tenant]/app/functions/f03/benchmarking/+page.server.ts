import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  createPerformanceTarget,
  listKpiDefinitions,
  listPerformanceObservations,
  listPerformanceTargets,
  transitionPerformanceTarget
} from '$lib/server/strategic-performance';
import {
  approvePerformanceBenchmark,
  attachPerformanceBenchmarkBasis,
  listPerformanceBenchmarkBases
} from '$lib/server/enterprise-performance';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}
function numeric(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function target(tenant: string, targetId?: string) {
  return `/${tenant}/app/functions/f03/benchmarking${targetId ? '?target=' + encodeURIComponent(targetId) : ''}`;
}
function problem(error: unknown) {
  return fail(400, { message: error instanceof Error ? error.message : 'The Benchmarking command could not be completed.' });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [kpis, targets, bases] = await Promise.all([
    listKpiDefinitions(context),
    listPerformanceTargets(context),
    listPerformanceBenchmarkBases(context)
  ]);
  const selectedBasis = bases.find((row) => row.targetId === url.searchParams.get('target')) ?? bases[0] ?? null;
  const selectedTarget = selectedBasis ? targets.find((row) => row.id === selectedBasis.targetId) ?? null : null;
  const observations = selectedTarget ? await listPerformanceObservations(context, selectedTarget.kpiId) : [];
  return {
    tenantSlug: params.tenant,
    kpis,
    targets,
    bases,
    selectedBasis,
    selectedTarget,
    observations,
    canManage: hasPermission(context, 'performance.benchmark.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const targetId = await createPerformanceTarget(context, {
        targetRef: text(data, 'targetRef'),
        kpiId: text(data, 'kpiId'),
        kpiVersionNo: integer(data, 'kpiVersionNo'),
        scopeType: text(data, 'scopeType'),
        scopeId: text(data, 'scopeId'),
        periodStart: text(data, 'periodStart'),
        periodEnd: text(data, 'periodEnd'),
        targetValue: numeric(data, 'targetValue'),
        comparisonOperator: text(data, 'comparisonOperator') as 'GREATER_EQUAL' | 'LESS_EQUAL' | 'EQUAL'
      });
      await attachPerformanceBenchmarkBasis(context, targetId, {
        benchmarkType: text(data, 'benchmarkType'),
        sourceReference: text(data, 'sourceReference'),
        sourceAsOf: text(data, 'sourceAsOf'),
        comparatorScope: text(data, 'comparatorScope'),
        benchmarkValue: numeric(data, 'benchmarkValue'),
        evidenceItemId: text(data, 'evidenceItemId') || undefined
      });
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  approve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const targetId = text(data, 'targetId');
    const version = integer(data, 'aggregateVersion');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'PERFORMANCE_BENCHMARK_APPROVAL',
        subjectType: 'PERFORMANCE_TARGET',
        subjectId: targetId,
        subjectVersion: String(version),
        outcome: 'APPROVED',
        reason: text(data, 'reason')
      });
      await approvePerformanceBenchmark(context, targetId, version, decisionId);
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const targetId = text(data, 'targetId');
    try {
      await transitionPerformanceTarget(
        await resolveRequestCommandContext(params.tenant, locals),
        targetId,
        integer(data, 'aggregateVersion'),
        'ACTIVATE'
      );
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
