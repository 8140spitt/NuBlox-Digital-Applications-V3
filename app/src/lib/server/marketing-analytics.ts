import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryRows } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import {
  code,
  domainEvidence,
  finiteNumber,
  json,
  now,
  required,
  timestamp
} from '$lib/server/marketing-runtime';
import { getCommunicationsCampaign } from '$lib/server/marketing-communications';
import {
  getMarketSegment,
  getMarketSegmentVersion
} from '$lib/server/marketing-segmentation';

export type CampaignMeasurement = {
  id: string;
  campaignId: string;
  metricKey: string;
  metricValue: string;
  unitKey: string;
  periodStart: string | null;
  periodEnd: string | null;
  sourceReference: string;
  observedAt: string;
};

export type MarketingAnalyticsSnapshot = {
  id: string;
  snapshotRef: string;
  title: string;
  asOfAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  segmentId: string | null;
  segmentVersionNo: number | null;
  campaignId: string | null;
  sourceQueryVersion: string;
  sourceSet: unknown;
  metrics: unknown;
  createdAt: string;
};

export async function recordCampaignMeasurement(
  context: CommandContext,
  campaignId: string,
  input: {
    metricKey: string;
    metricValue: number;
    unitKey: string;
    periodStart?: string;
    periodEnd?: string;
    sourceReference: string;
    observedAt?: string;
  }
) {
  assertPermission(context, 'marketing.analytics.manage');
  await getCommunicationsCampaign(context, campaignId);
  const value = finiteNumber(input.metricValue, 'Campaign metric value');
  if (value == null) throw new Error('Campaign metric value is required.');
  const periodStart = timestamp(input.periodStart, 'Measurement period start');
  const periodEnd = timestamp(input.periodEnd, 'Measurement period end');
  if (periodStart && periodEnd && periodEnd < periodStart) {
    throw new Error('Measurement period end cannot be before period start.');
  }
  const id = randomUUID();
  await executeMutation(
    `INSERT INTO communications_campaign_measurements
      (id,tenant_id,campaign_id,metric_key,metric_value,unit_key,period_start,period_end,
       source_reference,observed_at,recorded_by_party_id)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      context.tenantId,
      campaignId,
      code(input.metricKey, 'Campaign metric key', 191),
      value,
      code(input.unitKey, 'Campaign metric unit'),
      periodStart,
      periodEnd,
      required(input.sourceReference, 'Campaign metric source reference', 500),
      timestamp(input.observedAt, 'Measurement observation time') ?? now(),
      context.actorPartyId
    ]
  );
  return id;
}

export async function listCampaignMeasurements(
  context: CommandContext,
  campaignId: string
) {
  assertPermission(context, 'marketing.read');
  await getCommunicationsCampaign(context, campaignId);
  return queryRows<RowDataPacket & CampaignMeasurement>(
    `SELECT id,campaign_id AS campaignId,metric_key AS metricKey,metric_value AS metricValue,
            unit_key AS unitKey,period_start AS periodStart,period_end AS periodEnd,
            source_reference AS sourceReference,observed_at AS observedAt
       FROM communications_campaign_measurements
      WHERE tenant_id=? AND campaign_id=?
      ORDER BY observed_at DESC,id DESC`,
    [context.tenantId, campaignId]
  );
}

export async function listMarketingAnalyticsSnapshots(context: CommandContext) {
  assertPermission(context, 'marketing.read');
  return queryRows<RowDataPacket & MarketingAnalyticsSnapshot>(
    `SELECT id,snapshot_ref AS snapshotRef,title,as_of_at AS asOfAt,period_start AS periodStart,
            period_end AS periodEnd,segment_id AS segmentId,segment_version_no AS segmentVersionNo,
            campaign_id AS campaignId,source_query_version AS sourceQueryVersion,
            source_set_json AS sourceSet,metrics_json AS metrics,created_at AS createdAt
       FROM marketing_analytics_snapshots
      WHERE tenant_id=?
      ORDER BY as_of_at DESC,created_at DESC,snapshot_ref`,
    [context.tenantId]
  );
}

function withinPeriod<T extends { occurredAt?: string; observedAt?: string; createdAt?: string }>(
  rows: T[],
  start: string | null,
  end: string | null
) {
  return rows.filter((row) => {
    const value = row.occurredAt ?? row.observedAt ?? row.createdAt;
    if (!value) return true;
    if (start && value < start) return false;
    if (end && value > end) return false;
    return true;
  });
}

function countActions(
  rows: Array<{ deliveryAction: string }>,
  action: string
) {
  return rows.filter((row) => row.deliveryAction === action).length;
}

export async function freezeMarketingAnalyticsSnapshot(
  context: CommandContext,
  input: {
    snapshotRef: string;
    title: string;
    asOfAt?: string;
    periodStart?: string;
    periodEnd?: string;
    segmentId?: string;
    segmentVersionNo?: number;
    campaignId?: string;
    sourceQueryVersion: string;
  }
) {
  assertPermission(context, 'marketing.analytics.manage');
  const id = randomUUID();
  const createdAt = now();
  const asOfAt = timestamp(input.asOfAt, 'Analytics as-of time') ?? createdAt;
  const periodStart = timestamp(input.periodStart, 'Analytics period start');
  const periodEnd = timestamp(input.periodEnd, 'Analytics period end');
  if (periodStart && periodEnd && periodEnd < periodStart) {
    throw new Error('Analytics period end cannot be before period start.');
  }

  return dbTransaction(async (connection) => {
    const campaignId = input.campaignId?.trim() || null;
    if (campaignId) await getCommunicationsCampaign(context, campaignId, connection);

    const segmentId = input.segmentId?.trim() || null;
    let segmentVersionNo: number | null = null;
    if (segmentId) {
      const segment = await getMarketSegment(context, segmentId, connection);
      const requested = input.segmentVersionNo ?? segment.currentVersionNo;
      if (!Number.isInteger(requested) || requested < 1) {
        throw new Error('A valid Market Segment version is required.');
      }
      const version = await getMarketSegmentVersion(context, segment.id, requested, connection);
      segmentVersionNo = version.versionNo;
    } else if (input.segmentVersionNo != null) {
      throw new Error('Segment version requires a Market Segment.');
    }

    const deliveryParams: unknown[] = [context.tenantId, asOfAt];
    let deliveryWhere = 'd.tenant_id=? AND d.occurred_at<=?';
    if (campaignId) {
      deliveryWhere += ' AND ci.campaign_id=?';
      deliveryParams.push(campaignId);
    }
    const deliveryEvents = await queryRows<
      RowDataPacket & {
        id: string;
        communicationItemId: string;
        deliveryAction: string;
        recipientType: string;
        recipientPartyId: string | null;
        recipientLeadId: string | null;
        occurredAt: string;
      }
    >(
      `SELECT d.id,d.communication_item_id AS communicationItemId,
              d.delivery_action AS deliveryAction,d.recipient_type AS recipientType,
              d.recipient_party_id AS recipientPartyId,d.recipient_lead_id AS recipientLeadId,
              d.occurred_at AS occurredAt
         FROM communication_delivery_events d
         JOIN communication_items ci ON ci.id=d.communication_item_id AND ci.tenant_id=d.tenant_id
        WHERE ${deliveryWhere}
        ORDER BY d.occurred_at,d.id`,
      deliveryParams,
      connection
    );

    const leadParams: unknown[] = [context.tenantId, asOfAt];
    let leadWhere = 'tenant_id=? AND created_at<=?';
    if (campaignId) {
      leadWhere += ' AND source_campaign_id=?';
      leadParams.push(campaignId);
    }
    const leads = await queryRows<
      RowDataPacket & {
        id: string;
        status: string;
        score: string;
        createdAt: string;
        qualifiedAt: string | null;
        transferredAt: string | null;
      }
    >(
      `SELECT id,status,score,created_at AS createdAt,qualified_at AS qualifiedAt,
              transferred_at AS transferredAt
         FROM leads
        WHERE ${leadWhere}
        ORDER BY created_at,id`,
      leadParams,
      connection
    );

    const measurementParams: unknown[] = [context.tenantId, asOfAt];
    let measurementWhere = 'tenant_id=? AND observed_at<=?';
    if (campaignId) {
      measurementWhere += ' AND campaign_id=?';
      measurementParams.push(campaignId);
    }
    const measurements = await queryRows<
      RowDataPacket & {
        id: string;
        campaignId: string;
        metricKey: string;
        metricValue: string;
        unitKey: string;
        observedAt: string;
      }
    >(
      `SELECT id,campaign_id AS campaignId,metric_key AS metricKey,
              metric_value AS metricValue,unit_key AS unitKey,observed_at AS observedAt
         FROM communications_campaign_measurements
        WHERE ${measurementWhere}
        ORDER BY observed_at,id`,
      measurementParams,
      connection
    );

    let segmentMemberships: Array<{
      id: string;
      subjectType: string;
      subjectId: string;
      membershipStatus: string;
      score: string | null;
      evaluatedAt: string;
    }> = [];
    if (segmentId && segmentVersionNo) {
      segmentMemberships = await queryRows(
        `SELECT m.id,m.subject_type AS subjectType,m.subject_id AS subjectId,
                m.membership_status AS membershipStatus,m.score,m.evaluated_at AS evaluatedAt
           FROM market_segment_memberships m
           JOIN market_segment_versions v
             ON v.id=m.segment_version_id AND v.tenant_id=m.tenant_id
          WHERE m.tenant_id=? AND v.segment_id=? AND v.version_no=? AND m.evaluated_at<=?
          ORDER BY m.evaluated_at,m.id`,
        [context.tenantId, segmentId, segmentVersionNo, asOfAt],
        connection
      );
    }

    const periodDeliveries = withinPeriod(deliveryEvents, periodStart, periodEnd);
    const periodLeads = withinPeriod(leads, periodStart, periodEnd);
    const periodMeasurements = withinPeriod(measurements, periodStart, periodEnd);

    const measurementTotals = new Map<string, number>();
    for (const measurement of periodMeasurements) {
      measurementTotals.set(
        measurement.metricKey,
        (measurementTotals.get(measurement.metricKey) ?? 0) + Number(measurement.metricValue)
      );
    }

    const requested = countActions(periodDeliveries, 'REQUESTED');
    const sent = countActions(periodDeliveries, 'SENT');
    const delivered = countActions(periodDeliveries, 'DELIVERED');
    const bounced = countActions(periodDeliveries, 'BOUNCE');
    const opened = countActions(periodDeliveries, 'OPEN');
    const clicked = countActions(periodDeliveries, 'CLICK');
    const conversions = countActions(periodDeliveries, 'CONVERSION');
    const unsubscribes = countActions(periodDeliveries, 'UNSUBSCRIBE');
    const qualifiedLeads = periodLeads.filter((lead) => Boolean(lead.qualifiedAt)).length;
    const transferredLeads = periodLeads.filter((lead) => Boolean(lead.transferredAt)).length;
    const spend = measurementTotals.get('SPEND') ?? null;
    const attributedRevenue = measurementTotals.get('ATTRIBUTED_REVENUE') ?? null;
    const acquisitions = measurementTotals.get('ACQUISITIONS') ?? (conversions > 0 ? conversions : null);

    const metrics = {
      requested,
      sent,
      delivered,
      bounced,
      opened,
      clicked,
      conversions,
      unsubscribes,
      leadCount: periodLeads.length,
      qualifiedLeads,
      transferredLeads,
      activeSegmentMembers: segmentMemberships.filter(
        (membership) => membership.membershipStatus === 'INCLUDED'
      ).length,
      deliveryRate: sent > 0 ? delivered / sent : null,
      openRate: delivered > 0 ? opened / delivered : null,
      clickThroughRate: delivered > 0 ? clicked / delivered : null,
      conversionRate: delivered > 0 ? conversions / delivered : null,
      qualificationRate: periodLeads.length > 0 ? qualifiedLeads / periodLeads.length : null,
      spend,
      attributedRevenue,
      acquisitions,
      customerAcquisitionCost:
        spend != null && acquisitions != null && acquisitions > 0 ? spend / acquisitions : null,
      returnOnMarketingInvestment:
        spend != null && attributedRevenue != null && spend > 0
          ? (attributedRevenue - spend) / spend
          : null,
      recordedMeasurements: Object.fromEntries(measurementTotals)
    };

    const sourceSet = {
      asOfAt,
      periodStart,
      periodEnd,
      campaignId,
      segmentId,
      segmentVersionNo,
      deliveryEventIds: periodDeliveries.map((row) => row.id),
      leadIds: periodLeads.map((row) => row.id),
      measurementIds: periodMeasurements.map((row) => row.id),
      segmentMembershipIds: segmentMemberships.map((row) => row.id)
    };

    await executeMutation(
      `INSERT INTO marketing_analytics_snapshots
        (id,tenant_id,snapshot_ref,title,as_of_at,period_start,period_end,segment_id,
         segment_version_no,campaign_id,source_query_version,source_set_json,metrics_json,
         created_by_party_id,created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.snapshotRef, 'Analytics snapshot reference', 191),
        required(input.title, 'Analytics snapshot title', 500),
        asOfAt,
        periodStart,
        periodEnd,
        segmentId,
        segmentVersionNo,
        campaignId,
        required(input.sourceQueryVersion, 'Analytics source query version', 191),
        json(sourceSet),
        json(metrics),
        context.actorPartyId,
        createdAt
      ],
      connection
    );

    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketingAnalyticsSnapshot',
        objectType: 'marketing_analytics_snapshot',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'MARKETING_ANALYTICS_SNAPSHOT_FROZEN',
        topic: 'nublox.marketing.analytics',
        toState: 'FROZEN',
        payload: {
          snapshotRef: code(input.snapshotRef, 'Analytics snapshot reference', 191),
          asOfAt,
          campaignId,
          segmentId,
          segmentVersionNo,
          sourceQueryVersion: input.sourceQueryVersion
        }
      },
      connection
    );

    return id;
  });
}
