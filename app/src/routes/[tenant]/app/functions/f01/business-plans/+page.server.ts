import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listStrategyFrameworks } from '$lib/server/strategy-framework';
import { listStrategicObjectives } from '$lib/server/strategic-objective';
import { listStrategicAssumptions } from '$lib/server/strategic-assumption';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  activateBusinessPlan,
  approveBusinessPlan,
  closeBusinessPlan,
  createBusinessPlan,
  listBusinessPlanAssumptionReferences,
  listBusinessPlanObjectiveReferences,
  listBusinessPlans,
  listBusinessPlanVersions,
  reviseBusinessPlan,
  submitBusinessPlan
} from '$lib/server/business-plan';

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

function references(data: FormData, name: string) {
  return data.getAll(name).flatMap((value) => {
    if (typeof value !== 'string' || !value.includes(':')) return [];
    const [id, versionText] = value.split(':');
    const versionNo = Number(versionText);
    return id && Number.isInteger(versionNo) && versionNo > 0 ? [{ id, versionNo }] : [];
  });
}

function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f01/business-plans${id ? '?plan=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The Business Plan command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [plans, frameworks, objectives, assumptions] = await Promise.all([
    listBusinessPlans(context),
    listStrategyFrameworks(context),
    listStrategicObjectives(context),
    listStrategicAssumptions(context)
  ]);
  const selected = plans.find((row) => row.id === url.searchParams.get('plan')) ?? plans[0] ?? null;
  const versions = selected ? await listBusinessPlanVersions(context, selected.id) : [];
  const currentVersion =
    versions.find((version) => version.versionNo === selected?.currentVersionNo) ?? null;
  const [objectiveReferences, assumptionReferences] = currentVersion
    ? await Promise.all([
        listBusinessPlanObjectiveReferences(context, currentVersion.id),
        listBusinessPlanAssumptionReferences(context, currentVersion.id)
      ])
    : [[], []];

  return {
    tenantSlug: params.tenant,
    plans,
    selected,
    versions,
    objectiveReferences,
    assumptionReferences,
    frameworks: frameworks.filter((row) => row.status === 'PUBLISHED'),
    objectives: objectives.filter((row) =>
      ['APPROVED', 'ACTIVE', 'ACHIEVED', 'NOT_ACHIEVED'].includes(row.status)
    ),
    assumptions: assumptions.filter((row) =>
      ['ACCEPTED', 'ACTIVE', 'CHALLENGED'].includes(row.status)
    ),
    capabilities: {
      canManage: hasPermission(context, 'strategy.plan.manage'),
      canApprove: hasPermission(context, 'strategy.plan.approve')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createBusinessPlan(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          planRef: text(data, 'planRef'),
          name: text(data, 'name'),
          frameworkId: text(data, 'frameworkId'),
          frameworkVersionNo: integer(data, 'frameworkVersionNo'),
          scopeType: text(data, 'scopeType'),
          scopeId: text(data, 'scopeId'),
          periodStart: text(data, 'periodStart'),
          periodEnd: text(data, 'periodEnd'),
          resourceAssumptions: text(data, 'resourceAssumptions'),
          financialExpectations: text(data, 'financialExpectations'),
          measurableOutcomes: text(data, 'measurableOutcomes'),
          deliveryRoadmap: text(data, 'deliveryRoadmap'),
          objectives: references(data, 'objectives'),
          assumptions: references(data, 'assumptions')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    try {
      await reviseBusinessPlan(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        {
          resourceAssumptions: text(data, 'resourceAssumptions'),
          financialExpectations: text(data, 'financialExpectations'),
          measurableOutcomes: text(data, 'measurableOutcomes'),
          deliveryRoadmap: text(data, 'deliveryRoadmap'),
          objectives: references(data, 'objectives'),
          assumptions: references(data, 'assumptions')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    try {
      await submitBusinessPlan(
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
    const id = text(data, 'planId');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const plan = (await listBusinessPlans(context)).find((row) => row.id === id);
      if (!plan) throw new Error('Business Plan not found.');
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'BUSINESS_PLAN_APPROVAL',
        subjectType: 'BUSINESS_PLAN',
        subjectId: plan.id,
        subjectVersion: String(plan.currentVersionNo),
        outcome: 'APPROVED',
        reason: text(data, 'reason') || 'Business Plan approved through governed review.'
      });
      await approveBusinessPlan(context, id, integer(data, 'aggregateVersion'), decisionId);
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    try {
      await activateBusinessPlan(
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

  close: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'planId');
    try {
      await closeBusinessPlan(
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
