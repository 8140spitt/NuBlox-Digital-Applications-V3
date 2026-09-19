import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  freezeMarketingAnalyticsSnapshot,
  listCampaignMeasurements,
  listMarketingAnalyticsSnapshots,
  recordCampaignMeasurement
} from '$lib/server/marketing-analytics';
import { listCommunicationsCampaigns } from '$lib/server/marketing-communications';
import { listMarketSegments, listMarketSegmentVersions } from '$lib/server/marketing-segmentation';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}
function optionalNumber(data: FormData, name: string) {
  const raw = text(data, name);
  if (!raw) return undefined;
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(name + ' must be numeric.');
  return value;
}
function target(tenant: string, campaignId?: string) {
  return `/${tenant}/app/functions/f06/analytics${campaignId ? '?campaign=' + encodeURIComponent(campaignId) : ''}`;
}
function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The marketing analytics command failed.'
  });
}

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const [campaigns, segments, snapshots] = await Promise.all([
    listCommunicationsCampaigns(context),
    listMarketSegments(context),
    listMarketingAnalyticsSnapshots(context)
  ]);
  const selectedCampaign =
    campaigns.find((item) => item.id === url.searchParams.get('campaign')) ?? campaigns[0] ?? null;
  const measurements = selectedCampaign
    ? await listCampaignMeasurements(context, selectedCampaign.id)
    : [];
  const segmentVersions = new Map<string, Awaited<ReturnType<typeof listMarketSegmentVersions>>>();
  for (const segment of segments) {
    segmentVersions.set(segment.id, await listMarketSegmentVersions(context, segment.id));
  }
  return {
    tenantSlug: params.tenant,
    campaigns,
    segments,
    segmentVersions: Object.fromEntries(segmentVersions),
    snapshots,
    selectedCampaign,
    measurements,
    canManage: hasPermission(context, 'marketing.analytics.manage')
  };
};

export const actions: Actions = {
  measure: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId');
    try {
      await recordCampaignMeasurement(
        await resolveRequestCommandContext(params.tenant, locals),
        campaignId,
        {
          metricKey: text(data, 'metricKey'),
          metricValue: Number(text(data, 'metricValue')),
          unitKey: text(data, 'unitKey'),
          periodStart: text(data, 'periodStart') || undefined,
          periodEnd: text(data, 'periodEnd') || undefined,
          sourceReference: text(data, 'sourceReference')
        }
      );
      redirect(303, target(params.tenant, campaignId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },
  freeze: async ({ request, params, locals }) => {
    const data = await request.formData();
    const campaignId = text(data, 'campaignId') || undefined;
    try {
      await freezeMarketingAnalyticsSnapshot(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          snapshotRef: text(data, 'snapshotRef'),
          title: text(data, 'title'),
          periodStart: text(data, 'periodStart') || undefined,
          periodEnd: text(data, 'periodEnd') || undefined,
          segmentId: text(data, 'segmentId') || undefined,
          segmentVersionNo: optionalNumber(data, 'segmentVersionNo'),
          campaignId,
          sourceQueryVersion: text(data, 'sourceQueryVersion') || 'marketing-analytics-v1'
        }
      );
      redirect(303, target(params.tenant, campaignId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
