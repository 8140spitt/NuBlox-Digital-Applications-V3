import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { objectHref } from '$lib/data/runtime-object-registry';
import { hasPermission } from '$lib/server/platform-context';
import {
  deletePersonalView,
  listSavedViews,
  savePersonalView
} from '$lib/server/interaction-preferences';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listCurrencies } from '$lib/server/reference-data';
import {
  closeLead,
  createLead,
  disqualifyLead,
  enrichLead,
  listLeadNurtureEvents,
  listLeads,
  listLeadSalesHandoffs,
  listLeadScoreEvents,
  nurtureLead,
  qualifyLead,
  scoreLead,
  transferQualifiedLeadToSales
} from '$lib/server/marketing-lead';
import {
  listCommunicationsCampaigns,
  listCommunicationItems
} from '$lib/server/marketing-communications';
import {
  listConsentEvidence,
  listPreferenceEvidence,
  recordConsentEvidence,
  recordPreferenceEvidence
} from '$lib/server/privacy-evidence';

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
function target(tenant: string, id?: string) {
  return `/${tenant}/app/functions/f06/leads${id ? '?lead=' + encodeURIComponent(id) : ''}`;
}
function canonicalTarget(tenant: string, id: string) {
  return objectHref(tenant, 'lead', id, { from: 'F06.09' });
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The Lead command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [leads, campaigns, items, currencies, savedViews] = await Promise.all([
    listLeads(context),
    listCommunicationsCampaigns(context),
    listCommunicationItems(context),
    listCurrencies(context),
    listSavedViews(context, 'COLLECTION:LEAD')
  ]);
  const selectedLeadId = url.searchParams.get('lead');
  const selected = selectedLeadId
    ? (leads.find((item) => item.id === selectedLeadId) ?? null)
    : null;
  const [scores, nurture, handoffs, consents, preferences] = selected
    ? await Promise.all([
        listLeadScoreEvents(context, selected.id),
        listLeadNurtureEvents(context, selected.id),
        listLeadSalesHandoffs(context, selected.id),
        listConsentEvidence(context, { subjectType: 'LEAD', subjectId: selected.id }),
        listPreferenceEvidence(context, { subjectType: 'LEAD', subjectId: selected.id })
      ])
    : [[], [], [], [], []];
  return {
    tenantSlug: params.tenant,
    leads,
    campaigns,
    items,
    currencies,
    selected,
    scores,
    nurture,
    handoffs,
    consents,
    preferences,
    savedViews: savedViews.map((view) => ({
      id: view.id,
      name: view.name,
      definition: view.definition,
      isDefault: Boolean(view.isDefault),
      isPinned: Boolean(view.isPinned)
    })),
    capabilities: {
      canManage: hasPermission(context, 'marketing.lead.manage'),
      canQualify: hasPermission(context, 'marketing.lead.qualify'),
      canConsent: hasPermission(context, 'privacy.consent.record'),
      canPreference: hasPermission(context, 'privacy.preference.record')
    }
  };
};

export const actions: Actions = {
  saveView: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const rawColumns = text(data, 'columns')
        .split(',')
        .map((column) => column.trim())
        .filter((column) => /^[A-Za-z0-9._-]+$/.test(column));
      const sortDirection = text(data, 'sortDirection') === 'desc' ? 'desc' : 'asc';
      await savePersonalView(await resolveRequestCommandContext(params.tenant, locals), {
        targetKey: 'COLLECTION:LEAD',
        name: text(data, 'viewName'),
        definition: {
          query: text(data, 'query'),
          sortKey: text(data, 'sortKey') || null,
          sortDirection,
          columns: rawColumns,
          displayMode: 'TABLE',
          density: 'COMPACT'
        },
        isDefault: data.get('isDefault') === 'on',
        isPinned: data.get('isPinned') === 'on'
      });
      return { message: 'Personal Lead view saved.' };
    } catch (error) {
      return problem(error);
    }
  },

  deleteView: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await deletePersonalView(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'viewId')
      );
      return { message: 'Personal Lead view deleted.' };
    } catch (error) {
      return problem(error);
    }
  },

  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createLead(await resolveRequestCommandContext(params.tenant, locals), {
        leadRef: text(data, 'leadRef'),
        sourceType: text(data, 'sourceType'),
        sourceCampaignId: text(data, 'sourceCampaignId') || undefined,
        sourceCommunicationItemId: text(data, 'sourceCommunicationItemId') || undefined,
        sourceReference: text(data, 'sourceReference') || undefined,
        prospectName: text(data, 'prospectName'),
        organisationName: text(data, 'organisationName') || undefined,
        email: text(data, 'email') || undefined,
        phone: text(data, 'phone') || undefined,
        geography: text(data, 'geography') || undefined,
        sector: text(data, 'sector') || undefined,
        needSummary: text(data, 'needSummary'),
        estimatedValueLow: optionalNumber(data, 'estimatedValueLow'),
        estimatedValueHigh: optionalNumber(data, 'estimatedValueHigh'),
        currencyId: text(data, 'currencyId') || undefined
      });
      redirect(303, canonicalTarget(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  enrich: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await enrichLead(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          prospectName: text(data, 'prospectName') || undefined,
          organisationName: text(data, 'organisationName') || undefined,
          email: text(data, 'email') || undefined,
          phone: text(data, 'phone') || undefined,
          geography: text(data, 'geography') || undefined,
          sector: text(data, 'sector') || undefined,
          needSummary: text(data, 'needSummary') || undefined,
          resolvedPartyId: text(data, 'resolvedPartyId') || undefined,
          resolvedPartyRelationshipId: text(data, 'resolvedPartyRelationshipId') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  score: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await scoreLead(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          scoreDelta: Number(text(data, 'scoreDelta')),
          reasonCode: text(data, 'reasonCode'),
          reason: text(data, 'reason'),
          evidenceReference: text(data, 'evidenceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  nurture: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await nurtureLead(await resolveRequestCommandContext(params.tenant, locals), id, {
        campaignId: text(data, 'campaignId') || undefined,
        interactionType: text(data, 'interactionType'),
        channel: text(data, 'channel'),
        summary: text(data, 'summary'),
        evidenceReference: text(data, 'evidenceReference') || undefined,
        purposeKey: text(data, 'purposeKey') || undefined,
        lawfulBasis:
          text(data, 'lawfulBasis') === 'LEGITIMATE_INTEREST'
            ? 'LEGITIMATE_INTEREST'
            : text(data, 'lawfulBasis') === 'CONSENT'
              ? 'CONSENT'
              : undefined
      });
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  qualify: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await qualifyLead(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        text(data, 'qualificationSummary')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  disqualify: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await disqualifyLead(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        text(data, 'reason')
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transfer: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await transferQualifiedLeadToSales(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          handoffRef: text(data, 'handoffRef'),
          qualificationSummary: text(data, 'qualificationSummary')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  close: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await closeLead(await resolveRequestCommandContext(params.tenant, locals), id, version(data));
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  consent: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await recordConsentEvidence(
        await resolveRequestCommandContext(params.tenant, locals),
        { subjectType: 'LEAD', subjectId: id },
        {
          purposeKey: text(data, 'purposeKey'),
          wordingReference: text(data, 'wordingReference'),
          wordingVersion: text(data, 'wordingVersion'),
          action: text(data, 'action'),
          channel: text(data, 'channel'),
          proofReference: text(data, 'proofReference')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  preference: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'leadId');
    try {
      await recordPreferenceEvidence(
        await resolveRequestCommandContext(params.tenant, locals),
        { subjectType: 'LEAD', subjectId: id },
        {
          preferenceType: text(data, 'preferenceType') || 'MARKETING',
          preferenceValue: text(data, 'preferenceValue'),
          scopeKey: text(data, 'scopeKey'),
          channel: text(data, 'channel'),
          sourceReference: text(data, 'sourceReference')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
