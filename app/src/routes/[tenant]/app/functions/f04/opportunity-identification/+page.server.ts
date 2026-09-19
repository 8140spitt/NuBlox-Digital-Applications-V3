import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listOrganisations } from '$lib/server/foundation-organisation';
import { listCurrencies } from '$lib/server/reference-data';
import {
  assessDevelopmentOpportunity,
  createDevelopmentOpportunity,
  listDevelopmentOpportunities,
  listDevelopmentOpportunityAssessments,
  transitionDevelopmentOpportunity
} from '$lib/server/corporate-development';

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
function optionalNumber(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f04/opportunity-identification${id ? '?opportunity=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error
        ? error.message
        : 'The Corporate Development Opportunity command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [opportunities, organisations, currencies] = await Promise.all([
    listDevelopmentOpportunities(context),
    listOrganisations(context),
    listCurrencies(context)
  ]);
  const selected =
    opportunities.find((row) => row.id === url.searchParams.get('opportunity')) ??
    opportunities[0] ??
    null;
  const assessments = selected
    ? await listDevelopmentOpportunityAssessments(context, selected.id)
    : [];
  return {
    tenantSlug: params.tenant,
    opportunities,
    organisations,
    currencies,
    selected,
    assessments,
    canManage: hasPermission(context, 'corporate.development.opportunity.manage')
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createDevelopmentOpportunity(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          opportunityRef: text(data, 'opportunityRef'),
          opportunityType: text(data, 'opportunityType'),
          title: text(data, 'title'),
          developmentThesis: text(data, 'developmentThesis'),
          sourceType: text(data, 'sourceType'),
          sourceReference: text(data, 'sourceReference') || undefined,
          targetPartyId: text(data, 'targetPartyId') || undefined,
          scopeDescription: text(data, 'scopeDescription'),
          indicativeValueMin: optionalNumber(data, 'indicativeValueMin'),
          indicativeValueMax: optionalNumber(data, 'indicativeValueMax'),
          currencyId: text(data, 'currencyId') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  assess: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'opportunityId');
    try {
      await assessDevelopmentOpportunity(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        {
          assessmentType: text(data, 'assessmentType'),
          strategicFitRating: text(data, 'strategicFitRating') || undefined,
          recommendation: text(data, 'recommendation'),
          assessmentSummary: text(data, 'assessmentSummary'),
          evidenceReference: text(data, 'evidenceReference') || undefined
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
    const id = text(data, 'opportunityId');
    try {
      await transitionDevelopmentOpportunity(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        text(data, 'action') as
          'SECURE_CONTROL' | 'REQUEST_INVESTMENT_DECISION' | 'APPROVE' | 'REJECT' | 'HOLD' | 'CLOSE'
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
