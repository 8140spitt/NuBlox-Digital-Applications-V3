import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { objectHref } from '$lib/data/runtime-object-registry';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listUnitsOfMeasure } from '$lib/server/reference-data';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  applyConceptSelectionDecision,
  assessProductServiceConcept,
  createProductServiceConcept,
  listConceptAssessments,
  listItems
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
function optionalNumber(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return undefined;
  const value = Number(raw);
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
function target(tenant: string, id?: string) {
  return id
    ? objectHref(tenant, 'item', id, { from: 'F05.03' })
    : `/${tenant}/app/functions/f05/ideation`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The concept command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [items, units] = await Promise.all([listItems(context), listUnitsOfMeasure(context)]);
  const selected =
    items.find((item) => item.id === url.searchParams.get('item')) ?? items[0] ?? null;
  const assessments = selected ? await listConceptAssessments(context, selected.id) : [];
  return {
    tenantSlug: params.tenant,
    items,
    units,
    selected,
    assessments,
    capabilities: {
      canManage: hasPermission(context, 'product.concept.manage'),
      canApprove:
        hasPermission(context, 'product.concept.approve') &&
        hasPermission(context, 'work.decision.record')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createProductServiceConcept(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          itemNumber: text(data, 'itemNumber'),
          conceptType: text(data, 'conceptType'),
          name: text(data, 'name'),
          description: text(data, 'description'),
          classificationCode: text(data, 'classificationCode') || undefined,
          baseUomId: text(data, 'baseUomId') || undefined,
          needSummary: text(data, 'needSummary'),
          opportunitySummary: text(data, 'opportunitySummary'),
          scoreBasis: json(data, 'scoreBasis')
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
    const itemId = text(data, 'itemId');
    try {
      await assessProductServiceConcept(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data),
        {
          assessmentType: text(data, 'assessmentType'),
          rating: text(data, 'rating') || undefined,
          score: optionalNumber(data, 'score'),
          summary: text(data, 'summary'),
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  select: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const itemId = text(data, 'itemId');
    const aggregateVersion = version(data);
    try {
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'PRODUCT_SERVICE_CONCEPT_SELECTION',
        subjectType: 'ITEM',
        subjectId: itemId,
        subjectVersion: String(aggregateVersion),
        outcome: 'APPROVED',
        reason: text(data, 'reason')
      });
      await applyConceptSelectionDecision(context, itemId, aggregateVersion, decisionId);
      redirect(303, target(params.tenant, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
