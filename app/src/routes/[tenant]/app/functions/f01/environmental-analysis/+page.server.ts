import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  assessStrategicAssumption,
  createStrategicAssumption,
  listStrategicAssumptions,
  listStrategicAssumptionVersions,
  reviseStrategicAssumption
} from '$lib/server/strategic-assumption';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(data: FormData, name: string) {
  const value = text(data, name);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(name + ' must be a number.');
  return parsed;
}

function expectedVersion(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid aggregate version is required.');
  return value;
}

function route(tenant: string, id?: string, category?: string) {
  const params = new URLSearchParams();
  if (id) params.set('assumption', id);
  if (category) params.set('category', category);
  const query = params.toString();
  return `/${tenant}/app/functions/f01/environmental-analysis${query ? '?' + query : ''}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The environmental-analysis command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const category = url.searchParams.get('category')?.trim() || '';
  const search = url.searchParams.get('q')?.trim() || '';
  const assumptions = await listStrategicAssumptions(context, {
    category: category || undefined,
    search: search || undefined
  });
  const selected =
    assumptions.find((row) => row.id === url.searchParams.get('assumption')) ?? assumptions[0] ?? null;
  const versions = selected ? await listStrategicAssumptionVersions(context, selected.id) : [];

  return {
    tenantSlug: params.tenant,
    category,
    search,
    assumptions,
    selected,
    versions,
    capabilities: {
      canManage: hasPermission(context, 'strategy.assumption.manage'),
      canAssess: hasPermission(context, 'strategy.assumption.assess')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createStrategicAssumption(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          assumptionRef: text(data, 'assumptionRef'),
          category: text(data, 'category'),
          statement: text(data, 'statement'),
          basisSummary: text(data, 'basisSummary'),
          evidenceItemId: text(data, 'evidenceItemId') || undefined,
          confidencePercent: numberValue(data, 'confidencePercent'),
          scopeType: text(data, 'scopeType') || undefined,
          scopeId: text(data, 'scopeId') || undefined,
          validFrom: text(data, 'validFrom') || undefined,
          validTo: text(data, 'validTo') || undefined
        }
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'assumptionId');
    try {
      await reviseStrategicAssumption(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        expectedVersion(data),
        {
          statement: text(data, 'statement'),
          basisSummary: text(data, 'basisSummary'),
          evidenceItemId: text(data, 'evidenceItemId') || undefined,
          confidencePercent: numberValue(data, 'confidencePercent'),
          scopeType: text(data, 'scopeType') || undefined,
          scopeId: text(data, 'scopeId') || undefined,
          validFrom: text(data, 'validFrom') || undefined,
          validTo: text(data, 'validTo') || undefined
        }
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  assess: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'assumptionId');
    try {
      await assessStrategicAssumption(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        expectedVersion(data),
        {
          outcome: text(data, 'outcome') as 'ACCEPT' | 'ACTIVATE' | 'CHALLENGE' | 'INVALIDATE',
          note: text(data, 'note')
        }
      );
      redirect(303, route(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
