import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listKpiDefinitions } from '$lib/server/strategic-performance';
import {
  createPerformanceScorecard,
  listPerformanceScorecardKpis,
  listPerformanceScorecardNodes,
  listPerformanceScorecards,
  publishPerformanceScorecard
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

function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f03/performance-framework${id ? '?scorecard=' + encodeURIComponent(id) : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Performance Framework command could not be completed.'
  });
}

function parseNodes(data: FormData) {
  const nodes = text(data, 'nodes')
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row, index) => {
      const [nodeKey, name, parentNodeKey = '', sortOrder = '0'] = row.split('|').map((v) => v.trim());
      if (!nodeKey || !name) throw new Error('Hierarchy row ' + (index + 1) + ' requires key and name.');
      return {
        nodeKey,
        name,
        parentNodeKey: parentNodeKey || undefined,
        sortOrder: Number(sortOrder) || 0,
        kpis: [] as Array<{ kpiId: string; kpiVersionNo: number; weight?: number; sortOrder?: number }>
      };
    });

  const byKey = new Map(nodes.map((node) => [node.nodeKey.toUpperCase(), node]));
  for (const [index, row] of text(data, 'kpiMappings')
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
    .entries()) {
    const [nodeKey, kpiId, version, weight = '', sortOrder = '0'] = row.split('|').map((v) => v.trim());
    const node = byKey.get(nodeKey.toUpperCase());
    if (!node || !kpiId || !Number.isInteger(Number(version))) {
      throw new Error('KPI mapping row ' + (index + 1) + ' requires node key, KPI ID and version.');
    }
    node.kpis.push({
      kpiId,
      kpiVersionNo: Number(version),
      weight: weight ? Number(weight) : undefined,
      sortOrder: Number(sortOrder) || 0
    });
  }
  return nodes;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const scorecards = await listPerformanceScorecards(context);
  const selected = scorecards.find((row) => row.id === url.searchParams.get('scorecard')) ?? scorecards[0] ?? null;
  const [nodes, mappings, kpis] = selected
    ? await Promise.all([
        listPerformanceScorecardNodes(context, selected.id),
        listPerformanceScorecardKpis(context, selected.id),
        listKpiDefinitions(context)
      ])
    : [[], [], await listKpiDefinitions(context)];

  return {
    tenantSlug: params.tenant,
    scorecards,
    selected,
    nodes,
    mappings,
    kpis,
    canManage: hasPermission(context, 'performance.framework.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createPerformanceScorecard(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          scorecardRef: text(data, 'scorecardRef'),
          name: text(data, 'name'),
          scopeType: text(data, 'scopeType'),
          scopeId: text(data, 'scopeId'),
          ownerPartyId: text(data, 'ownerPartyId') || undefined,
          nodes: parseNodes(data)
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  publish: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'scorecardId');
    try {
      await publishPerformanceScorecard(
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
