import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createPerformanceBaseline,
  createPerformanceTarget,
  listKpiDefinitions,
  listPerformanceBaselines,
  listPerformanceObservations,
  listPerformanceTargets,
  transitionPerformanceTarget
} from '$lib/server/strategic-performance';
import {
  createPerformanceBenefitProfile,
  listPerformanceBenefits,
  listPerformanceBenefitValidations,
  validatePerformanceBenefit
} from '$lib/server/enterprise-performance';

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
function numeric(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function target(tenant: string, targetId?: string) {
  return `/${tenant}/app/functions/f03/benefits-realisation${targetId ? '?benefit=' + encodeURIComponent(targetId) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The Benefits Realisation command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [kpis, targets, baselines, benefits] = await Promise.all([
    listKpiDefinitions(context),
    listPerformanceTargets(context),
    listPerformanceBaselines(context),
    listPerformanceBenefits(context)
  ]);
  const selected =
    benefits.find((row) => row.targetId === url.searchParams.get('benefit')) ?? benefits[0] ?? null;
  const selectedTarget = selected
    ? (targets.find((row) => row.id === selected.targetId) ?? null)
    : null;
  const [validations, observations] = selected
    ? await Promise.all([
        listPerformanceBenefitValidations(context, selected.targetId),
        listPerformanceObservations(context, selected.kpiId)
      ])
    : [[], []];

  return {
    tenantSlug: params.tenant,
    kpis,
    targets,
    baselines,
    benefits,
    selected,
    selectedTarget,
    validations,
    observations,
    canManage: hasPermission(context, 'performance.benefit.manage')
  };
};

export const actions: Actions = {
  baseline: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createPerformanceBaseline(await resolveRequestCommandContext(params.tenant, locals), {
        baselineRef: text(data, 'baselineRef'),
        observationId: text(data, 'observationId'),
        scopeType: text(data, 'scopeType'),
        scopeId: text(data, 'scopeId')
      });
      redirect(303, target(params.tenant));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
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
        comparisonOperator: text(data, 'comparisonOperator') as
          'GREATER_EQUAL' | 'LESS_EQUAL' | 'EQUAL'
      });
      await createPerformanceBenefitProfile(context, targetId, {
        benefitType: text(data, 'benefitType'),
        transformationSubjectType: text(data, 'transformationSubjectType'),
        transformationSubjectId: text(data, 'transformationSubjectId'),
        benefitOwnerPartyId: text(data, 'benefitOwnerPartyId') || undefined,
        valueCategory: text(data, 'valueCategory'),
        baselineId: text(data, 'baselineId'),
        benefitStatement: text(data, 'benefitStatement')
      });
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const targetId = text(data, 'targetId');
    try {
      await transitionPerformanceTarget(
        await resolveRequestCommandContext(params.tenant, locals),
        targetId,
        integer(data, 'aggregateVersion'),
        text(data, 'action') as 'APPROVE' | 'ACTIVATE' | 'ACHIEVE' | 'MISS' | 'SUPERSEDE' | 'CANCEL'
      );
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  validate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const targetId = text(data, 'targetId');
    try {
      await validatePerformanceBenefit(
        await resolveRequestCommandContext(params.tenant, locals),
        targetId,
        {
          observationId: text(data, 'observationId'),
          validationStatus: text(data, 'validationStatus') as
            'REALISED' | 'PARTIAL' | 'NOT_REALISED',
          evidenceItemId: text(data, 'evidenceItemId') || undefined,
          validationNote: text(data, 'validationNote')
        }
      );
      redirect(303, target(params.tenant, targetId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
