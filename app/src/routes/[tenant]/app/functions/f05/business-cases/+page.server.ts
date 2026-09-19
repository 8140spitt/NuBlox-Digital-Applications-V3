import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listCurrencies } from '$lib/server/reference-data';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  applyProductBusinessCaseDecision,
  completeInnovationExperiment,
  createInnovationExperiment,
  createProductBusinessCase,
  listInnovationExperiments,
  listInnovationFunding,
  listItems,
  listMarketInsights,
  listProductBusinessCases,
  listProductBusinessCaseVersions,
  prepareProductBusinessCaseForDecision,
  recordInnovationFunding,
  reviseProductBusinessCase,
  startInnovationExperiment
} from '$lib/server/product-innovation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1)
    throw new Error('A valid aggregate version is required.');
  return value;
}
function number(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function json(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(name + ' must contain valid JSON.');
  }
}
function target(tenant: string, domain: string, mode: string, id?: string) {
  const q = new URLSearchParams({ domain, mode });
  if (id) q.set('case', id);
  return `/${tenant}/app/functions/f05/business-cases?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message:
      error instanceof Error ? error.message : 'The Product / Service Business Case command failed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const domain = url.searchParams.get('domain') === 'INNOVATION' ? 'INNOVATION' : 'PRODUCT_SERVICE';
  const mode =
    url.searchParams.get('mode') === 'innovation'
      ? 'innovation'
      : url.searchParams.get('mode') === 'portfolio'
        ? 'portfolio'
        : 'investment';
  const [cases, items, insights, currencies] = await Promise.all([
    listProductBusinessCases(context, domain),
    listItems(context),
    listMarketInsights(context),
    listCurrencies(context)
  ]);
  const selected =
    cases.find((item) => item.id === url.searchParams.get('case')) ?? cases[0] ?? null;
  const versions = selected ? await listProductBusinessCaseVersions(context, selected.id) : [];
  const currentVersion =
    versions.find((item) => item.versionNo === selected?.currentVersionNo) ?? versions[0] ?? null;
  const [experiments, funding] =
    domain === 'INNOVATION' && selected && currentVersion
      ? await Promise.all([
          listInnovationExperiments(context, selected.id),
          listInnovationFunding(context, currentVersion.id)
        ])
      : [[], []];
  return {
    tenantSlug: params.tenant,
    domain,
    mode,
    cases,
    items,
    insights,
    currencies,
    selected,
    versions,
    currentVersion,
    experiments,
    funding,
    capabilities: {
      canManage: hasPermission(context, 'product.business_case.manage'),
      canApprove:
        hasPermission(context, 'product.business_case.approve') &&
        hasPermission(context, 'work.decision.record'),
      canInnovate: hasPermission(context, 'product.innovation.manage')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const domain = text(data, 'domain') || 'PRODUCT_SERVICE';
    const mode = text(data, 'mode') || 'investment';
    try {
      const id = await createProductBusinessCase(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          caseRef: text(data, 'caseRef'),
          caseDomain: domain,
          title: text(data, 'title'),
          portfolioBucket: text(data, 'portfolioBucket'),
          itemId: text(data, 'itemId') || undefined,
          primaryMarketInsightId: text(data, 'primaryMarketInsightId') || undefined,
          innovationStage: text(data, 'innovationStage') || undefined,
          objectivesNeed: text(data, 'objectivesNeed'),
          options: json(data, 'options'),
          benefits: json(data, 'benefits'),
          costFundingBasis: json(data, 'costFundingBasis'),
          risks: json(data, 'risks'),
          assumptions: json(data, 'assumptions'),
          commercialModel: json(data, 'commercialModel'),
          routeToMarket: json(data, 'routeToMarket'),
          recommendation: text(data, 'recommendation'),
          demandForecast: json(data, 'demandForecast'),
          roi: json(data, 'roi'),
          marketBasis: json(data, 'marketBasis'),
          productScope: json(data, 'productScope'),
          fundingEnvelope: json(data, 'fundingEnvelope')
        }
      );
      redirect(303, target(params.tenant, domain, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'businessCaseId');
    const domain = text(data, 'domain') || 'PRODUCT_SERVICE';
    const mode = text(data, 'mode') || 'investment';
    try {
      await reviseProductBusinessCase(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          portfolioBucket: text(data, 'portfolioBucket') || undefined,
          innovationStage: text(data, 'innovationStage') || undefined,
          objectivesNeed: text(data, 'objectivesNeed'),
          options: json(data, 'options'),
          benefits: json(data, 'benefits'),
          costFundingBasis: json(data, 'costFundingBasis'),
          risks: json(data, 'risks'),
          assumptions: json(data, 'assumptions'),
          commercialModel: json(data, 'commercialModel'),
          routeToMarket: json(data, 'routeToMarket'),
          recommendation: text(data, 'recommendation'),
          demandForecast: json(data, 'demandForecast'),
          roi: json(data, 'roi'),
          marketBasis: json(data, 'marketBasis'),
          productScope: json(data, 'productScope'),
          fundingEnvelope: json(data, 'fundingEnvelope')
        }
      );
      redirect(303, target(params.tenant, domain, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'businessCaseId');
    const domain = text(data, 'domain') || 'PRODUCT_SERVICE';
    const mode = text(data, 'mode') || 'investment';
    try {
      await prepareProductBusinessCaseForDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, domain, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  decide: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'businessCaseId');
    const domain = text(data, 'domain') || 'PRODUCT_SERVICE';
    const mode = text(data, 'mode') || 'investment';
    const aggregateVersion = version(data);
    const currentVersionNo = Number(text(data, 'currentVersionNo'));
    const outcome = text(data, 'outcome');
    if (!Number.isInteger(currentVersionNo) || currentVersionNo < 1) {
      return problem(new Error('A valid Business Case version is required.'));
    }
    try {
      const decisionId = await recordWorkDecision(context, {
        decisionType:
          domain === 'INNOVATION'
            ? 'INNOVATION_BUSINESS_CASE_APPROVAL'
            : 'PRODUCT_SERVICE_BUSINESS_CASE_APPROVAL',
        subjectType: 'BUSINESS_CASE',
        subjectId: id,
        subjectVersion: String(currentVersionNo),
        outcome,
        reason: text(data, 'reason')
      });
      await applyProductBusinessCaseDecision(context, id, aggregateVersion, decisionId, outcome);
      redirect(303, target(params.tenant, domain, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  createExperiment: async ({ request, params, locals }) => {
    const data = await request.formData();
    const caseId = text(data, 'businessCaseId');
    try {
      await createInnovationExperiment(await resolveRequestCommandContext(params.tenant, locals), {
        businessCaseVersionId: text(data, 'businessCaseVersionId'),
        experimentRef: text(data, 'experimentRef'),
        title: text(data, 'title'),
        hypothesis: text(data, 'hypothesis'),
        method: text(data, 'method'),
        successCriteria: text(data, 'successCriteria')
      });
      redirect(303, target(params.tenant, 'INNOVATION', 'innovation', caseId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  startExperiment: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await startInnovationExperiment(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'experimentId')
      );
      redirect(
        303,
        target(params.tenant, 'INNOVATION', 'innovation', text(data, 'businessCaseId'))
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  completeExperiment: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await completeInnovationExperiment(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'experimentId'),
        {
          outcome: text(data, 'outcome'),
          resultSummary: text(data, 'resultSummary'),
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(
        303,
        target(params.tenant, 'INNOVATION', 'innovation', text(data, 'businessCaseId'))
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  fund: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await recordInnovationFunding(await resolveRequestCommandContext(params.tenant, locals), {
        businessCaseVersionId: text(data, 'businessCaseVersionId'),
        fundingType: text(data, 'fundingType'),
        amount: number(data, 'amount'),
        currencyId: text(data, 'currencyId'),
        basis: text(data, 'basis'),
        status: text(data, 'status') || 'PLANNED'
      });
      redirect(
        303,
        target(params.tenant, 'INNOVATION', 'innovation', text(data, 'businessCaseId'))
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
