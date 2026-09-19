import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listUnitsOfMeasure } from '$lib/server/reference-data';
import { listStrategicObjectives } from '$lib/server/strategic-objective';
import {
  activateKpiDefinition,
  createKpiDefinition,
  createPerformanceBaseline,
  createPerformanceCorrectiveAction,
  createPerformanceTarget,
  getPerformanceVariance,
  listKpiDefinitions,
  listKpiObjectiveReferences,
  listKpiVersions,
  listPerformanceObservations,
  listPerformanceTargets,
  publishKpiDefinition,
  recordPerformanceObservation,
  transitionPerformanceTarget,
  validateKpiDefinition,
  validatePerformanceObservation
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
function numberValue(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f01/performance${id ? '?kpi=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The Performance command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [kpis, objectives, units] = await Promise.all([
    listKpiDefinitions(context),
    listStrategicObjectives(context),
    listUnitsOfMeasure(context)
  ]);
  const selected = kpis.find((row) => row.id === url.searchParams.get('kpi')) ?? kpis[0] ?? null;
  const versions = selected ? await listKpiVersions(context, selected.id) : [];
  const currentVersion = versions.find((v) => v.versionNo === selected?.currentVersionNo) ?? null;
  const [objectiveRefs, targets, observations] = selected
    ? await Promise.all([
        currentVersion
          ? listKpiObjectiveReferences(context, currentVersion.id)
          : Promise.resolve([]),
        listPerformanceTargets(context, selected.id),
        listPerformanceObservations(context, selected.id)
      ])
    : [[], [], []];
  const variance =
    selected && url.searchParams.get('scopeId')
      ? await getPerformanceVariance(context, {
          kpiId: selected.id,
          scopeType: url.searchParams.get('scopeType') || 'TENANT',
          scopeId: url.searchParams.get('scopeId')!,
          periodStart: url.searchParams.get('periodStart') || new Date().toISOString().slice(0, 10),
          periodEnd:
            url.searchParams.get('periodEnd') ||
            new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10)
        })
      : null;
  return {
    tenantSlug: params.tenant,
    kpis,
    selected,
    versions,
    currentVersion,
    objectiveRefs,
    targets,
    observations,
    variance,
    objectives: objectives.filter((row) =>
      ['APPROVED', 'ACTIVE', 'ACHIEVED', 'NOT_ACHIEVED'].includes(row.status)
    ),
    units: units.filter((row) => row.status === 'ACTIVE'),
    capabilities: {
      canManage: hasPermission(context, 'strategy.performance.manage'),
      canObserve: hasPermission(context, 'strategy.performance.observe')
    }
  };
};

export const actions: Actions = {
  createKpi: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createKpiDefinition(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          kpiCode: text(data, 'kpiCode'),
          name: text(data, 'name'),
          businessDefinition: text(data, 'businessDefinition'),
          formula: text(data, 'formula'),
          unitOfMeasureId: text(data, 'unitOfMeasureId'),
          frequency: text(data, 'frequency'),
          dimensions: text(data, 'dimensions')
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          sourceData: text(data, 'sourceData'),
          qualityRules: text(data, 'qualityRules'),
          objectives: data
            .getAll('objectives')
            .flatMap((v) =>
              typeof v === 'string' && v.includes(':')
                ? [{ id: v.split(':')[0], versionNo: Number(v.split(':')[1]) }]
                : []
            )
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  kpiTransition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'kpiId'),
      version = integer(data, 'aggregateVersion'),
      action = text(data, 'action'),
      context = await resolveRequestCommandContext(params.tenant, locals);
    try {
      if (action === 'VALIDATE') await validateKpiDefinition(context, id, version);
      else if (action === 'PUBLISH') await publishKpiDefinition(context, id, version);
      else if (action === 'ACTIVATE') await activateKpiDefinition(context, id, version);
      else throw new Error('Unsupported KPI transition.');
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  createTarget: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await createPerformanceTarget(await resolveRequestCommandContext(params.tenant, locals), {
        targetRef: text(data, 'targetRef'),
        kpiId,
        kpiVersionNo: integer(data, 'kpiVersionNo'),
        scopeType: text(data, 'scopeType'),
        scopeId: text(data, 'scopeId'),
        periodStart: text(data, 'periodStart'),
        periodEnd: text(data, 'periodEnd'),
        targetValue: numberValue(data, 'targetValue'),
        comparisonOperator: text(data, 'comparisonOperator') as
          'GREATER_EQUAL' | 'LESS_EQUAL' | 'EQUAL'
      });
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  targetTransition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await transitionPerformanceTarget(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'targetId'),
        integer(data, 'aggregateVersion'),
        text(data, 'action') as 'APPROVE' | 'ACTIVATE' | 'ACHIEVE' | 'MISS' | 'SUPERSEDE' | 'CANCEL'
      );
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  observe: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await recordPerformanceObservation(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          kpiId,
          kpiVersionNo: integer(data, 'kpiVersionNo'),
          subjectType: text(data, 'subjectType'),
          subjectId: text(data, 'subjectId'),
          periodStart: text(data, 'periodStart'),
          periodEnd: text(data, 'periodEnd'),
          numericValue: numberValue(data, 'numericValue'),
          sourceReference: text(data, 'sourceReference')
        }
      );
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  validateObservation: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await validatePerformanceObservation(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'observationId')
      );
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  baseline: async ({ request, params, locals }) => {
    const data = await request.formData();
    const kpiId = text(data, 'kpiId');
    try {
      await createPerformanceBaseline(await resolveRequestCommandContext(params.tenant, locals), {
        baselineRef: text(data, 'baselineRef'),
        observationId: text(data, 'observationId'),
        scopeType: text(data, 'scopeType'),
        scopeId: text(data, 'scopeId')
      });
      redirect(303, target(params.tenant, kpiId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
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
