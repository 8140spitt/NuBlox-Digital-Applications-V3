import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listBusinessCases } from '$lib/server/corporate-development';
import {
  createIntegrationInitiative,
  listIntegrationInitiatives,
  listIntegrationWorkstreams,
  transitionIntegrationInitiative,
  updateIntegrationWorkstream
} from '$lib/server/transformation-initiative';

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
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f04/integration${id ? '?initiative=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The Integration command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [initiatives, businessCases] = await Promise.all([
    listIntegrationInitiatives(context),
    listBusinessCases(context)
  ]);
  const selected =
    initiatives.find((row) => row.id === url.searchParams.get('initiative')) ??
    initiatives[0] ??
    null;
  const workstreams = selected ? await listIntegrationWorkstreams(context, selected.id) : [];
  return {
    tenantSlug: params.tenant,
    initiatives,
    businessCases: businessCases.filter((row) => ['APPROVED', 'CLOSED'].includes(row.status)),
    selected,
    workstreams,
    canManage: hasPermission(context, 'corporate.development.integration.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createIntegrationInitiative(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          initiativeRef: text(data, 'initiativeRef'),
          title: text(data, 'title'),
          businessCaseId: text(data, 'businessCaseId'),
          purposeOutcomes: text(data, 'purposeOutcomes'),
          sponsorPartyId: text(data, 'sponsorPartyId') || undefined,
          ownerPartyId: text(data, 'ownerPartyId') || undefined,
          affectedScope: text(data, 'affectedScope'),
          benefitsSummary: text(data, 'benefitsSummary'),
          impactsSummary: text(data, 'impactsSummary'),
          readinessCriteria: text(data, 'readinessCriteria'),
          adoptionCriteria: text(data, 'adoptionCriteria')
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
    const id = text(data, 'initiativeId');
    try {
      await transitionIntegrationInitiative(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        text(data, 'action') as
          | 'ASSESS'
          | 'PRIORITISE'
          | 'APPROVE'
          | 'MOBILISE'
          | 'ACTIVATE'
          | 'TRANSITION'
          | 'COMPLETE'
          | 'STOP'
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  workstream: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'initiativeId');
    try {
      await updateIntegrationWorkstream(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'workstreamType'),
        integer(data, 'workstreamVersion'),
        {
          status: text(data, 'status'),
          progressPercent: numeric(data, 'progressPercent'),
          ownerPartyId: text(data, 'ownerPartyId') || undefined,
          scopeSummary: text(data, 'scopeSummary') || undefined,
          successCriteria: text(data, 'successCriteria') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
