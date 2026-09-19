import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  listInformationContainers,
  listInformationRevisions
} from '$lib/server/information-container';
import { recordWorkDecision } from '$lib/server/work-decision';
import { listMarketSegments, listMarketSegmentVersions } from '$lib/server/marketing-segmentation';
import { listLeads } from '$lib/server/marketing-lead';
import {
  activateCampaign,
  applyCampaignDecision,
  completeCommunicationItem,
  createCommunicationItem,
  createCommunicationsCampaign,
  linkCampaignInformation,
  linkCampaignSegment,
  listCampaignInformation,
  listCampaignSegments,
  listCommunicationItems,
  listCommunicationsCampaigns,
  listCommunicationsCampaignVersions,
  listCommunicationsPlans,
  listDeliveryEvents,
  prepareCampaignForDecision,
  recordCommunicationDeliveryEvent,
  requestCommunicationDelivery,
  reviseCommunicationsCampaign,
  scheduleCommunicationItem,
  transitionCampaign
} from '$lib/server/marketing-communications';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function version(data: FormData) {
  const value = Number(text(data, 'aggregateVersion'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid aggregate version is required.');
  return value;
}
function integer(data: FormData, name: string) {
  const value = Number(text(data, name));
  if (!Number.isInteger(value) || value < 1) throw new Error(name + ' must be a positive integer.');
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
function target(tenant: string, mode: string, campaignId?: string, itemId?: string) {
  const q = new URLSearchParams({ mode });
  if (campaignId) q.set('campaign', campaignId);
  if (itemId) q.set('item', itemId);
  return `/${tenant}/app/functions/f06/campaigns?${q.toString()}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The campaign command could not be completed.'
  });
}
async function issuedInformation(context: Awaited<ReturnType<typeof resolveRequestCommandContext>>) {
  const containers = await listInformationContainers(context);
  const rows: Array<{ id: string; containerRef: string; revisionCode: string; title: string }> = [];
  for (const container of containers) {
    const revisions = await listInformationRevisions(context, container.id);
    for (const revision of revisions) {
      if (revision.lifecycleStatus === 'ISSUED') {
        rows.push({
          id: revision.id,
          containerRef: container.containerRef,
          revisionCode: revision.revisionCode,
          title: revision.title
        });
      }
    }
  }
  return rows;
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const requestedMode = url.searchParams.get('mode');
  const mode = ['digital', 'content', 'communications'].includes(requestedMode ?? '')
    ? requestedMode!
    : 'campaign';
  const [campaigns, plans, segments, leads] = await Promise.all([
    listCommunicationsCampaigns(context),
    listCommunicationsPlans(context),
    listMarketSegments(context),
    listLeads(context)
  ]);
  const selected =
    campaigns.find((item) => item.id === url.searchParams.get('campaign')) ?? campaigns[0] ?? null;
  const versions = selected
    ? await listCommunicationsCampaignVersions(context, selected.id)
    : [];
  const current =
    versions.find((item) => item.versionNo === selected?.currentVersionNo) ?? versions[0] ?? null;
  const [campaignSegments, campaignInformation, items] =
    selected && current
      ? await Promise.all([
          listCampaignSegments(context, current.id),
          listCampaignInformation(context, current.id),
          listCommunicationItems(context, selected.id)
        ])
      : [[], [], []];
  const selectedItem =
    items.find((item) => item.id === url.searchParams.get('item')) ?? items[0] ?? null;
  const deliveryEvents = selectedItem
    ? await listDeliveryEvents(context, selectedItem.id)
    : [];
  const segmentVersions = new Map<string, Awaited<ReturnType<typeof listMarketSegmentVersions>>>();
  for (const segment of segments.filter((item) => item.status === 'ACTIVE')) {
    segmentVersions.set(segment.id, await listMarketSegmentVersions(context, segment.id));
  }
  return {
    tenantSlug: params.tenant,
    mode,
    campaigns,
    plans,
    segments,
    segmentVersions: Object.fromEntries(segmentVersions),
    leads,
    selected,
    versions,
    current,
    campaignSegments,
    campaignInformation,
    items,
    selectedItem,
    deliveryEvents,
    issuedInformation: await issuedInformation(context),
    capabilities: {
      canManage: hasPermission(context, 'marketing.campaign.manage'),
      canApprove:
        hasPermission(context, 'marketing.campaign.approve') &&
        hasPermission(context, 'work.decision.record'),
      canExecute: hasPermission(context, 'marketing.campaign.execute')
    }
  };
};

export const actions: Actions = {
  create: async ({ request, params, locals }) => {
    const data = await request.formData();
    const mode = text(data, 'mode') || 'campaign';
    try {
      const id = await createCommunicationsCampaign(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          campaignRef: text(data, 'campaignRef'),
          campaignType: text(data, 'campaignType') || 'MARKETING',
          title: text(data, 'title'),
          communicationsPlanId: text(data, 'communicationsPlanId') || undefined,
          objectives: json(data, 'objectives'),
          audienceStrategy: json(data, 'audienceStrategy'),
          keyMessages: json(data, 'keyMessages'),
          channels: json(data, 'channels'),
          schedule: json(data, 'schedule'),
          budgetContext: json(data, 'budgetContext'),
          measurementPlan: json(data, 'measurementPlan'),
          automation: json(data, 'automation')
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  revise: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await reviseCommunicationsCampaign(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data),
        {
          title: text(data, 'title') || undefined,
          objectives: json(data, 'objectives'),
          audienceStrategy: json(data, 'audienceStrategy'),
          keyMessages: json(data, 'keyMessages'),
          channels: json(data, 'channels'),
          schedule: json(data, 'schedule'),
          budgetContext: json(data, 'budgetContext'),
          measurementPlan: json(data, 'measurementPlan'),
          automation: json(data, 'automation')
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  linkSegment: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await linkCampaignSegment(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          segmentId: text(data, 'segmentId'),
          segmentVersionNo: integer(data, 'segmentVersionNo'),
          inclusionType: text(data, 'inclusionType') || 'INCLUDE'
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  linkInformation: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'content';
    try {
      await linkCampaignInformation(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        {
          informationRevisionId: text(data, 'informationRevisionId'),
          linkRole: text(data, 'linkRole'),
          channel: text(data, 'channel') || undefined
        }
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  createItem: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      const itemId = await createCommunicationItem(
        await resolveRequestCommandContext(params.tenant, locals),
        campaignId,
        {
          itemRef: text(data, 'itemRef'),
          itemType: text(data, 'itemType') || 'MARKETING_MESSAGE',
          channel: text(data, 'channel'),
          informationRevisionId: text(data, 'informationRevisionId'),
          audienceScope: json(data, 'audienceScope')
        }
      );
      redirect(303, target(params.tenant, mode, campaignId, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  submit: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await prepareCampaignForDecision(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  decide: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    const aggregateVersion = version(data);
    const currentVersionNo = integer(data, 'currentVersionNo');
    const outcome = text(data, 'outcome');
    try {
      const decisionId = await recordWorkDecision(context, {
        decisionType: 'COMMUNICATIONS_CAMPAIGN_APPROVAL',
        subjectType: 'COMMUNICATIONS_CAMPAIGN',
        subjectId: id,
        subjectVersion: String(currentVersionNo),
        outcome,
        reason: text(data, 'reason')
      });
      await applyCampaignDecision(
        context,
        id,
        aggregateVersion,
        decisionId,
        outcome
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  activate: async ({ request, params, locals }) => {
    const data = await request.formData();
    const id = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await activateCampaign(
        await resolveRequestCommandContext(params.tenant, locals),
        id,
        version(data)
      );
      redirect(303, target(params.tenant, mode, id));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  scheduleItem: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const itemId = text(data, 'itemId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await scheduleCommunicationItem(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data),
        text(data, 'scheduledAt')
      );
      redirect(303, target(params.tenant, mode, campaignId, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  requestDelivery: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const itemId = text(data, 'itemId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await requestCommunicationDelivery(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        {
          subjectType: text(data, 'recipientType') === 'PARTY' ? 'PARTY' : 'LEAD',
          subjectId: text(data, 'recipientId')
        },
        {
          purposeKey: text(data, 'purposeKey'),
          lawfulBasis:
            text(data, 'lawfulBasis') === 'LEGITIMATE_INTEREST'
              ? 'LEGITIMATE_INTEREST'
              : 'CONSENT',
          externalReference: text(data, 'externalReference') || undefined
        }
      );
      redirect(303, target(params.tenant, mode, campaignId, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  recordDelivery: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const itemId = text(data, 'itemId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await recordCommunicationDeliveryEvent(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        {
          subjectType: text(data, 'recipientType') === 'PARTY' ? 'PARTY' : 'LEAD',
          subjectId: text(data, 'recipientId')
        },
        {
          action: text(data, 'deliveryAction'),
          externalReference: text(data, 'externalReference') || undefined,
          metadata: json(data, 'metadata')
        }
      );
      redirect(303, target(params.tenant, mode, campaignId, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  completeItem: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const itemId = text(data, 'itemId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await completeCommunicationItem(
        await resolveRequestCommandContext(params.tenant, locals),
        itemId,
        version(data)
      );
      redirect(303, target(params.tenant, mode, campaignId, itemId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  transition: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    const mode = text(data, 'mode') || 'campaign';
    try {
      await transitionCampaign(
        await resolveRequestCommandContext(params.tenant, locals),
        campaignId,
        version(data),
        text(data, 'targetStatus')
      );
      redirect(303, target(params.tenant, mode, campaignId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};