import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listJurisdictions } from '$lib/server/reference-data';
import { listDevelopmentOpportunities } from '$lib/server/corporate-development';
import {
  closeDueDiligenceMatter,
  completeDueDiligenceMatter,
  createDueDiligenceMatter,
  grantDueDiligenceAccess,
  listDueDiligenceAccess,
  listDueDiligenceMatters,
  listDueDiligenceWorkstreams,
  revokeDueDiligenceAccess,
  updateDueDiligenceWorkstream
} from '$lib/server/due-diligence';

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
  return `/${tenant}/app/functions/f04/due-diligence${id ? '?matter=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The Due Diligence command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [matters, opportunities, jurisdictions] = await Promise.all([
    listDueDiligenceMatters(context),
    listDevelopmentOpportunities(context),
    listJurisdictions(context)
  ]);
  const selected =
    matters.find((row) => row.id === url.searchParams.get('matter')) ?? matters[0] ?? null;
  const workstreams = selected ? await listDueDiligenceWorkstreams(context, selected.id) : [];
  const access =
    selected?.accessRole === 'MATTER_MANAGER'
      ? await listDueDiligenceAccess(context, selected.id)
      : [];
  return {
    tenantSlug: params.tenant,
    matters,
    opportunities,
    jurisdictions,
    selected,
    workstreams,
    access,
    capabilities: {
      canManage: hasPermission(context, 'corporate.development.due_diligence.manage'),
      canAccessManage: hasPermission(
        context,
        'corporate.development.due_diligence.access.manage'
      )
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createDueDiligenceMatter(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          matterRef: text(data, 'matterRef'),
          title: text(data, 'title'),
          opportunityId: text(data, 'opportunityId'),
          opportunityVersion: integer(data, 'opportunityVersion'),
          scopeSummary: text(data, 'scopeSummary'),
          ownerPartyId: text(data, 'ownerPartyId') || undefined,
          counselPartyId: text(data, 'counselPartyId') || undefined,
          jurisdictionId: text(data, 'jurisdictionId') || undefined,
          privilegeClassification: text(data, 'privilegeClassification') || undefined,
          confidentialityClassification:
            text(data, 'confidentialityClassification') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  workstream: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'matterId');
    try {
      await updateDueDiligenceWorkstream(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'workstreamType'),
        integer(data, 'aggregateVersion'),
        {
          status: text(data, 'status'),
          riskRating: text(data, 'riskRating') || undefined,
          findingsSummary: text(data, 'findingsSummary') || undefined,
          conclusion: text(data, 'conclusion') || undefined,
          evidenceReference: text(data, 'evidenceReference') || undefined,
          ownerPartyId: text(data, 'ownerPartyId') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  resolve: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'matterId');
    try {
      await completeDueDiligenceMatter(
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
    const id = text(data, 'matterId');
    try {
      await closeDueDiligenceMatter(
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
  grant: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'matterId');
    try {
      await grantDueDiligenceAccess(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId'),
        text(data, 'accessRole')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revoke: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'matterId');
    try {
      await revokeDueDiligenceAccess(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        text(data, 'partyId')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
