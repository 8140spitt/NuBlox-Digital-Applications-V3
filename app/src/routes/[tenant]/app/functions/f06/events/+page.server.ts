import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listLeads } from '$lib/server/marketing-lead';
import {
  completeMarketingEvent,
  configureMarketingEvent,
  createCommunicationsCampaign,
  getMarketingEvent,
  listCommunicationsCampaigns,
  listCommunicationsPlans,
  listMarketingEventRegistrations,
  markMarketingEventAttendance,
  registerMarketingEventParticipant
} from '$lib/server/marketing-communications';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
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
  return `/${tenant}/app/functions/f06/events${id ? '?campaign=' + encodeURIComponent(id) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The event command could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [campaigns, plans, leads] = await Promise.all([
    listCommunicationsCampaigns(context, 'EVENT'),
    listCommunicationsPlans(context),
    listLeads(context)
  ]);
  const selected =
    campaigns.find((item) => item.id === url.searchParams.get('campaign')) ?? campaigns[0] ?? null;
  const [event, registrations] = selected
    ? await Promise.all([
        getMarketingEvent(context, selected.id),
        listMarketingEventRegistrations(context, selected.id)
      ])
    : [null, []];
  return {
    tenantSlug: params.tenant,
    campaigns,
    plans,
    leads,
    selected,
    event,
    registrations,
    canManage: hasPermission(context, 'marketing.event.manage'),
    canCampaign: hasPermission(context, 'marketing.campaign.manage')
  };
};

export const actions: Actions = {
  createCampaign: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const id = await createCommunicationsCampaign(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          campaignRef: text(data, 'campaignRef'),
          campaignType: 'EVENT',
          title: text(data, 'title'),
          communicationsPlanId: text(data, 'communicationsPlanId') || undefined,
          objectives: json(data, 'objectives'),
          audienceStrategy: json(data, 'audienceStrategy'),
          keyMessages: json(data, 'keyMessages'),
          channels: ['EVENT'],
          schedule: json(data, 'schedule'),
          measurementPlan: json(data, 'measurementPlan')
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  configure: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    try {
      await configureMarketingEvent(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          eventType: text(data, 'eventType'),
          venue: text(data, 'venue') || undefined,
          eventStartAt: text(data, 'eventStartAt'),
          eventEndAt: text(data, 'eventEndAt'),
          supplierReferences: json(data, 'supplierReferences'),
          registrationPolicy: json(data, 'registrationPolicy'),
          deliveryNotes: text(data, 'deliveryNotes') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  register: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    try {
      await registerMarketingEventParticipant(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          subjectType: text(data, 'subjectType') === 'PARTY' ? 'PARTY' : 'LEAD',
          subjectId: text(data, 'subjectId')
        },
        {
          registrationReference: text(data, 'registrationReference'),
          sourceReference: text(data, 'sourceReference') || undefined
        }
      );
      redirect(303, target(params.tenant, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  attend: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    try {
      await markMarketingEventAttendance(
        await resolveRequestCommandContext(params.tenant, locals),
        text(data, 'registrationId')
      );
      redirect(303, target(params.tenant, campaignId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  complete: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    try {
      await completeMarketingEvent(
        await resolveRequestCommandContext(params.tenant, locals),
        campaignId,
        text(data, 'outcomeSummary')
      );
      redirect(303, target(params.tenant, campaignId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};