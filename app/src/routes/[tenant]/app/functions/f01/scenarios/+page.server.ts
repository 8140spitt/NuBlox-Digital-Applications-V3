import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listStrategicAssumptions } from '$lib/server/strategic-assumption';
import {
  activateStrategicScenario,
  approveStrategicScenario,
  createScenarioContingency,
  createStrategicScenario,
  listScenarioAssumptionRefs,
  listScenarioContingencies,
  listScenarioDrivers,
  listScenarioSensitivityRuns,
  listScenarioVersions,
  listStrategicScenarios,
  retireStrategicScenario,
  reviewStrategicScenario,
  runScenarioSensitivity,
  supersedeStrategicScenario
} from '$lib/server/strategic-scenario';

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
  const v = text(data, name);
  if (!v) return undefined;
  const n = Number(v);
  if (!Number.isFinite(n)) throw new Error(name + ' must be numeric.');
  return n;
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f01/scenarios${id ? '?scenario=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Scenario command could not be completed.'
  });
}
function drivers(data: FormData) {
  return text(data, 'drivers')
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [driverKey, name, direction, baseState, ...rationale] = row
        .split('|')
        .map((x) => x.trim());
      if (!driverKey || !name || !direction || !baseState || !rationale.join(' | '))
        throw new Error(
          'Driver row ' + (index + 1) + ' requires key, name, direction, base state and rationale.'
        );
      return { driverKey, name, direction, baseState, rationale: rationale.join(' | ') };
    });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [scenarios, assumptions] = await Promise.all([
    listStrategicScenarios(context),
    listStrategicAssumptions(context)
  ]);
  const selected =
    scenarios.find((r) => r.id === url.searchParams.get('scenario')) ?? scenarios[0] ?? null;
  const versions = selected ? await listScenarioVersions(context, selected.id) : [];
  const currentVersion = versions.find((v) => v.versionNo === selected?.currentVersionNo) ?? null;
  const [driverRows, assumptionRefs, sensitivityRuns, contingencies] =
    selected && currentVersion
      ? await Promise.all([
          listScenarioDrivers(context, currentVersion.id),
          listScenarioAssumptionRefs(context, currentVersion.id),
          listScenarioSensitivityRuns(context, selected.id),
          listScenarioContingencies(context, selected.id)
        ])
      : [[], [], [], []];
  return {
    tenantSlug: params.tenant,
    scenarios,
    selected,
    versions,
    driverRows,
    assumptionRefs,
    sensitivityRuns,
    contingencies,
    assumptions: assumptions.filter((a) => ['ACCEPTED', 'ACTIVE', 'CHALLENGED'].includes(a.status)),
    capabilities: {
      canManage: hasPermission(context, 'strategy.scenario.manage'),
      canApprove: hasPermission(context, 'strategy.scenario.approve')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createStrategicScenario(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          scenarioRef: text(data, 'scenarioRef'),
          name: text(data, 'name'),
          scenarioType: text(data, 'scenarioType'),
          scopeType: text(data, 'scopeType'),
          scopeId: text(data, 'scopeId'),
          horizonStart: text(data, 'horizonStart'),
          horizonEnd: text(data, 'horizonEnd'),
          narrative: text(data, 'narrative'),
          drivers: drivers(data),
          assumptions: data
            .getAll('assumptions')
            .flatMap((v) =>
              typeof v === 'string' && v.includes(':')
                ? [{ id: v.split(':')[0], versionNo: Number(v.split(':')[1]) }]
                : []
            ),
          projections: []
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'scenarioId'),
      v = integer(data, 'aggregateVersion'),
      action = text(data, 'action'),
      context = await resolveRequestCommandContext(params.tenant, locals);
    try {
      if (action === 'REVIEW') await reviewStrategicScenario(context, id, v);
      else if (action === 'APPROVE') await approveStrategicScenario(context, id, v);
      else if (action === 'ACTIVATE') await activateStrategicScenario(context, id, v);
      else if (action === 'SUPERSEDE') await supersedeStrategicScenario(context, id, v);
      else if (action === 'RETIRE') await retireStrategicScenario(context, id, v);
      else throw new Error('Unsupported Scenario transition.');
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  sensitivity: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'scenarioId');
    try {
      await runScenarioSensitivity(await resolveRequestCommandContext(params.tenant, locals), id, {
        variableKey: text(data, 'variableKey'),
        lowCase: numberValue(data, 'lowCase'),
        baseCase: numberValue(data, 'baseCase'),
        highCase: numberValue(data, 'highCase'),
        resultSummary: text(data, 'resultSummary')
      });
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  contingency: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'scenarioId');
    try {
      await createScenarioContingency(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          contingencyRef: text(data, 'contingencyRef'),
          triggerCondition: text(data, 'triggerCondition'),
          responseStrategy: text(data, 'responseStrategy')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
