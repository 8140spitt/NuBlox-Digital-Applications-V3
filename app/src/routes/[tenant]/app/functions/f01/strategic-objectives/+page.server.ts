import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listStrategyFrameworks } from '$lib/server/strategy-framework';
import {
  createStrategicObjective,
  listStrategicObjectives,
  listStrategicObjectiveVersions,
  reviseStrategicObjective,
  transitionStrategicObjective
} from '$lib/server/strategic-objective';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}

function route(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f01/strategic-objectives${id ? '?objective=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, { message: error instanceof Error ? error.message : 'The Strategic Objective command could not be completed.' });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [objectives, frameworks] = await Promise.all([
    listStrategicObjectives(context),
    listStrategyFrameworks(context)
  ]);
  const selected = objectives.find((row) => row.id === url.searchParams.get('objective')) ?? objectives[0] ?? null;
  const versions = selected ? await listStrategicObjectiveVersions(context, selected.id) : [];
  const publishedFrameworks = frameworks.filter((framework) => framework.status === 'PUBLISHED');

  return {
    tenantSlug: params.tenant,
    objectives,
    selected,
    versions,
    publishedFrameworks,
    capabilities: {
      canManage: hasPermission(context, 'strategy.objective.manage'),
      canApprove: hasPermission(context, 'strategy.objective.approve')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createStrategicObjective(await resolveRequestCommandContext(params.tenant, locals), {
        objectiveRef: text(data, 'objectiveRef'),
        frameworkId: text(data, 'frameworkId'),
        frameworkVersionNo: integer(data, 'frameworkVersionNo'),
        statement: text(data, 'statement'),
        successCriteria: text(data, 'successCriteria'),
        priority: text(data, 'priority'),
        scopeType: text(data, 'scopeType') || undefined,
        scopeId: text(data, 'scopeId') || undefined,
        horizonStart: text(data, 'horizonStart') || undefined,
        horizonEnd: text(data, 'horizonEnd') || undefined
      });
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'objectiveId');
    try {
      await reviseStrategicObjective(await resolveRequestCommandContext(params.tenant, locals), id, integer(data, 'aggregateVersion'), {
        statement: text(data, 'statement'),
        successCriteria: text(data, 'successCriteria'),
        priority: text(data, 'priority'),
        scopeType: text(data, 'scopeType') || undefined,
        scopeId: text(data, 'scopeId') || undefined,
        horizonStart: text(data, 'horizonStart') || undefined,
        horizonEnd: text(data, 'horizonEnd') || undefined
      });
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  transition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'objectiveId');
    try {
      await transitionStrategicObjective(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        text(data, 'action') as 'APPROVE' | 'ACTIVATE' | 'ACHIEVE' | 'MISS' | 'SUPERSEDE' | 'RETIRE'
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
