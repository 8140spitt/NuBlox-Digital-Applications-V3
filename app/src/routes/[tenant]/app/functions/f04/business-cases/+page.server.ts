import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { recordWorkDecision } from '$lib/server/work-decision';
import { listOrganisations } from '$lib/server/foundation-organisation';
import { listDueDiligenceMatters } from '$lib/server/due-diligence';
import {
  applyBusinessCaseDecision,
  closeBusinessCase,
  createBusinessCase,
  listBusinessCaseAgreements,
  listBusinessCases,
  listBusinessCaseVersions,
  listDevelopmentAppraisals,
  listDevelopmentOpportunities,
  prepareBusinessCaseForDecision,
  recordBusinessCaseAgreement,
  reviseBusinessCase
} from '$lib/server/corporate-development';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive whole number.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(name + ' must be a JSON object.');
    }
    return value as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message.endsWith('must be a JSON object.')) throw error;
    throw new Error(name + ' contains invalid JSON.');
  }
}
function target(tenant: string, id?: string, type?: string) {
  const params = new URLSearchParams();
  if (id) params.set('case', id);
  if (type) params.set('type', type);
  const query = params.toString();
  return `/${tenant}/app/functions/f04/business-cases${query ? '?' + query : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Business Case command could not be completed.'
  });
}
function caseInput(data: FormData) {
  return {
    objectivesNeed: text(data, 'objectivesNeed'),
    options: json(data, 'options'),
    benefits: json(data, 'benefits'),
    costFundingBasis: json(data, 'costFundingBasis'),
    risks: json(data, 'risks'),
    assumptions: json(data, 'assumptions'),
    transactionStructure: json(data, 'transactionStructure'),
    negotiatedTerms: json(data, 'negotiatedTerms'),
    recommendation: text(data, 'recommendation'),
    appraisalId: text(data, 'appraisalId') || undefined,
    legalMatterId: text(data, 'legalMatterId') || undefined
  };
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const requestedType = url.searchParams.get('type')?.trim().toUpperCase() || '';
  const [allCases, opportunities, appraisals, matters, organisations] = await Promise.all([
    listBusinessCases(context),
    listDevelopmentOpportunities(context),
    listDevelopmentAppraisals(context),
    listDueDiligenceMatters(context),
    listOrganisations(context)
  ]);
  const cases = requestedType
    ? allCases.filter((row) => row.caseType === requestedType)
    : allCases;
  const selected =
    allCases.find((row) => row.id === url.searchParams.get('case')) ?? cases[0] ?? allCases[0] ?? null;
  const [versions, agreements] = selected
    ? await Promise.all([
        listBusinessCaseVersions(context, selected.id),
        listBusinessCaseAgreements(context, selected.id)
      ])
    : [[], []];
  return {
    tenantSlug: params.tenant,
    requestedType,
    cases,
    allCases,
    opportunities,
    appraisals,
    matters,
    organisations,
    selected,
    versions,
    agreements,
    capabilities: {
      canTransaction: hasPermission(context, 'corporate.development.transaction.manage'),
      canDivestiture: hasPermission(context, 'corporate.development.divestiture.manage'),
      canPartnership: hasPermission(context, 'corporate.development.partnership.manage'),
      canApprove:
        hasPermission(context, 'corporate.development.transaction.approve') &&
        hasPermission(context, 'work.decision.record')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const caseType = text(data, 'caseType');
    try {
      const id = await createBusinessCase(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          caseRef: text(data, 'caseRef'),
          caseType,
          title: text(data, 'title'),
          sponsorPartyId: text(data, 'sponsorPartyId') || undefined,
          primaryPartyId: text(data, 'primaryPartyId') || undefined,
          developmentOpportunityId: text(data, 'developmentOpportunityId') || undefined,
          ...caseInput(data)
        }
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'caseId');
    const caseType = text(data, 'caseType');
    try {
      await reviseBusinessCase(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion'),
        caseInput(data)
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  prepare: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'caseId');
    const caseType = text(data, 'caseType');
    try {
      await prepareBusinessCaseForDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  decide: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'caseId');
    const caseType = text(data, 'caseType');
    const currentVersionNo = integer(data, 'currentVersionNo');
    const outcome = text(data, 'outcome');
    try {
      const context = await resolveRequestCommandContext(params.tenant, locals);
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'CORPORATE_DEVELOPMENT_BUSINESS_CASE_APPROVAL',
        subjectType: 'BUSINESS_CASE',
        subjectId: id,
        subjectVersion: String(currentVersionNo),
        outcome,
        reason: text(data, 'reason')
      });
      await applyBusinessCaseDecision(
        context,
        id,
        integer(data, 'aggregateVersion'),
        decisionId
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  agreement: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'caseId');
    const caseType = text(data, 'caseType');
    try {
      await recordBusinessCaseAgreement(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          agreementRole: text(data, 'agreementRole'),
          subjectType: text(data, 'subjectType'),
          subjectId: text(data, 'subjectId'),
          subjectVersion: text(data, 'subjectVersion') || undefined,
          executionStatus: text(data, 'executionStatus'),
          executionReference: text(data, 'executionReference') || undefined,
          executedAt: text(data, 'executedAt') || undefined
        }
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  close: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'caseId');
    const caseType = text(data, 'caseType');
    try {
      await closeBusinessCase(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        integer(data, 'aggregateVersion')
      );
      redirect(303, target(params.tenant, id, caseType));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
