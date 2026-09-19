import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let marketInsight: typeof import('./market-insight');
let segmentation: typeof import('./marketing-segmentation');
let communications: typeof import('./marketing-communications');
let leadService: typeof import('./marketing-lead');
let privacy: typeof import('./privacy-evidence');
let analytics: typeof import('./marketing-analytics');
let information: typeof import('./information-container');
let decisions: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  marketInsight = await import('./market-insight');
  segmentation = await import('./marketing-segmentation');
  communications = await import('./marketing-communications');
  leadService = await import('./marketing-lead');
  privacy = await import('./privacy-evidence');
  analytics = await import('./marketing-analytics');
  information = await import('./information-container');
  decisions = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

async function createIssuedMarketingInformation(
  context: Awaited<ReturnType<typeof contextService.resolveDevelopmentCommandContext>>
) {
  const containerId = await information.createInformationContainer(context, {
    containerRef: 'MKT-CONTENT-001',
    containerType: 'MARKETING_CONTENT',
    title: 'Digital handover campaign message',
    subjectType: 'TENANT',
    subjectId: context.tenantId,
    securityClassification: 'PUBLIC',
    revisionCode: 'P01',
    purposeOfIssue: 'Marketing publication'
  });

  let container = (await information.listInformationContainers(context)).find(
    (item) => item.id === containerId
  )!;
  await information.addInformationRepresentation(context, containerId, container.aggregateVersion, {
    representationType: 'HTML',
    contentReference: 'content://marketing/digital-handover/p01',
    contentMediaType: 'text/html',
    sourceFilename: 'digital-handover.html',
    hashAlgorithm: 'SHA256',
    contentHash: 'c'.repeat(64)
  });

  container = (await information.listInformationContainers(context)).find(
    (item) => item.id === containerId
  )!;
  await information.submitInformationRevision(context, containerId, container.aggregateVersion);

  container = (await information.listInformationContainers(context)).find(
    (item) => item.id === containerId
  )!;
  const decisionId = await decisions.recordWorkDecision(context, {
    decisionType: 'INFORMATION_REVISION_REVIEW',
    subjectType: 'INFORMATION_CONTAINER',
    subjectId: containerId,
    subjectVersion: '1',
    outcome: 'APPROVED',
    reason: 'Marketing content approved for controlled publication.'
  });
  await information.approveInformationRevision(
    context,
    containerId,
    container.aggregateVersion,
    decisionId
  );

  container = (await information.listInformationContainers(context)).find(
    (item) => item.id === containerId
  )!;
  await information.issueInformationRevision(context, containerId, container.aggregateVersion);
  const revision = (await information.listInformationRevisions(context, containerId))[0];
  expect(revision.lifecycleStatus).toBe('ISSUED');
  return revision.id;
}

describe('F06 Marketing & Brand', () => {
  it('governs insight-to-campaign-to-lead with controlled content, privacy and frozen analytics', async () => {
    const tenant = 'f06-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const insightId = await marketInsight.createMarketInsight(context, {
      insightRef: 'MKT-INS-001',
      insightType: 'MARKET_RESEARCH',
      title: 'Digital handover demand is increasing',
      subject: 'UK construction delivery organisations',
      sourceType: 'PRIMARY_RESEARCH',
      sourceReference: 'research://marketing/2026-q3',
      confidence: 'HIGH',
      geography: 'United Kingdom',
      sector: 'Construction',
      problemStatement: 'Project teams are spending excessive time reconciling handover evidence.',
      needStatement: 'Decision makers want governed digital handover with measurable traceability.',
      desiredOutcome: 'Increase awareness and qualified demand for the NuBlox handover service.',
      evidenceReference: 'evidence://marketing/insight-001'
    });
    let insight = (await marketInsight.listMarketInsights(context)).find(
      (item) => item.id === insightId
    )!;
    await marketInsight.validateMarketInsight(context, insight.id, insight.aggregateVersion);
    insight = (await marketInsight.listMarketInsights(context)).find(
      (item) => item.id === insightId
    )!;
    expect(insight.status).toBe('VALIDATED');

    const segmentId = await segmentation.createMarketSegment(context, {
      segmentRef: 'SEG-UK-TIER1',
      name: 'UK Tier 1 digital delivery leaders',
      description: 'Large UK construction organisations with digital-delivery transformation demand.',
      criteria: {
        organisationType: 'CONTRACTOR',
        employeeBand: '1000_PLUS',
        digitalMaturity: ['ADVANCED', 'LEADING']
      },
      geography: { countries: ['GB'] },
      sector: { sectors: ['CONSTRUCTION'] },
      profile: { buyerRoles: ['Digital Director', 'Information Manager'] },
      valueAssessment: { marketValue: 'HIGH', strategicFit: 'HIGH' }
    });
    let segment = (await segmentation.listMarketSegments(context)).find(
      (item) => item.id === segmentId
    )!;
    await segmentation.activateMarketSegment(context, segment.id, segment.aggregateVersion);
    segment = (await segmentation.listMarketSegments(context)).find(
      (item) => item.id === segmentId
    )!;
    expect(segment.status).toBe('ACTIVE');
    const segmentVersion = (await segmentation.listMarketSegmentVersions(context, segmentId))[0];
    expect(segmentVersion.lifecycleStatus).toBe('ACTIVE');

    const informationRevisionId = await createIssuedMarketingInformation(context);

    const planId = await communications.createCommunicationsPlan(context, {
      planRef: 'MKT-PLAN-001',
      planType: 'MARKETING_STRATEGY',
      title: 'NuBlox digital handover market plan',
      scopeContext: 'UK construction digital-delivery market development.',
      objectives: { awareness: 'increase', qualifiedDemand: 'grow' },
      audiences: { segmentRef: 'SEG-UK-TIER1' },
      keyMessages: {
        primary: 'Govern handover evidence on one operating platform.',
        proof: 'Traceable information, decisions and delivery evidence.'
      },
      channels: ['WEB', 'EMAIL', 'EVENT'],
      activities: ['THOUGHT_LEADERSHIP', 'EMAIL_NURTURE', 'EXECUTIVE_EVENT'],
      schedule: { quarter: '2026-Q4' },
      measures: { reach: true, qualifiedLeads: true, roi: true },
      positioning: { category: 'Built environment operating system' },
      brandDefinition: {
        promise: 'Connected and governed business and project delivery.',
        tone: ['CLEAR', 'AUTHORITATIVE', 'PRACTICAL']
      },
      guidelineSummary: 'Use controlled NuBlox identity, messaging and approved public content.'
    });
    await communications.linkCommunicationsPlanInformation(context, planId, {
      informationRevisionId,
      linkRole: 'BRAND_GUIDELINE'
    });

    let plan = (await communications.listCommunicationsPlans(context)).find(
      (item) => item.id === planId
    )!;
    const planSubject = await communications.prepareCommunicationsPlanForDecision(
      context,
      plan.id,
      plan.aggregateVersion
    );
    plan = (await communications.listCommunicationsPlans(context)).find(
      (item) => item.id === planId
    )!;
    const planDecisionId = await decisions.recordWorkDecision(context, {
      ...planSubject,
      outcome: 'APPROVED',
      reason: 'Marketing strategy and brand position approved.'
    });
    await communications.applyCommunicationsPlanDecision(
      context,
      plan.id,
      plan.aggregateVersion,
      planDecisionId,
      'APPROVED'
    );
    plan = (await communications.listCommunicationsPlans(context)).find(
      (item) => item.id === planId
    )!;
    await communications.activateCommunicationsPlan(context, plan.id, plan.aggregateVersion);
    plan = (await communications.listCommunicationsPlans(context)).find(
      (item) => item.id === planId
    )!;
    expect(plan.status).toBe('ACTIVE');

    const campaignId = await communications.createCommunicationsCampaign(context, {
      campaignRef: 'CMP-HANDOVER-001',
      campaignType: 'DIGITAL',
      title: 'Digital handover leadership campaign',
      communicationsPlanId: plan.id,
      objectives: { qualifiedDemand: 10 },
      audienceStrategy: { segment: 'SEG-UK-TIER1', approach: 'ACCOUNT_AWARE' },
      keyMessages: { primary: 'Govern digital handover end to end.' },
      channels: ['EMAIL', 'WEB'],
      schedule: { start: '2026-10-01', end: '2026-12-15' },
      budgetContext: { plannedSpend: 20000, currency: 'GBP' },
      measurementPlan: { reach: true, conversion: true, roi: true },
      automation: { nurtureAfterClick: true }
    });
    await communications.linkCampaignSegment(context, campaignId, {
      segmentId,
      segmentVersionNo: segmentVersion.versionNo,
      inclusionType: 'INCLUDE'
    });
    await communications.linkCampaignInformation(context, campaignId, {
      informationRevisionId,
      linkRole: 'PRIMARY_CONTENT',
      channel: 'EMAIL'
    });
    const primaryItemId = await communications.createCommunicationItem(context, campaignId, {
      itemRef: 'COMM-HANDOVER-EMAIL-01',
      itemType: 'EMAIL',
      channel: 'EMAIL',
      informationRevisionId,
      audienceScope: { segmentId, segmentVersionNo: segmentVersion.versionNo }
    });
    const followupItemId = await communications.createCommunicationItem(context, campaignId, {
      itemRef: 'COMM-HANDOVER-EMAIL-02',
      itemType: 'EMAIL',
      channel: 'EMAIL',
      informationRevisionId,
      audienceScope: { segmentId, segmentVersionNo: segmentVersion.versionNo, phase: 'FOLLOW_UP' }
    });

    let campaign = (await communications.listCommunicationsCampaigns(context)).find(
      (item) => item.id === campaignId
    )!;
    const campaignSubject = await communications.prepareCampaignForDecision(
      context,
      campaign.id,
      campaign.aggregateVersion
    );
    campaign = (await communications.listCommunicationsCampaigns(context)).find(
      (item) => item.id === campaignId
    )!;
    const campaignDecisionId = await decisions.recordWorkDecision(context, {
      ...campaignSubject,
      outcome: 'APPROVED',
      reason: 'Audience, content, channels and measurement controls approved.'
    });
    await communications.applyCampaignDecision(
      context,
      campaign.id,
      campaign.aggregateVersion,
      campaignDecisionId,
      'APPROVED'
    );
    campaign = (await communications.listCommunicationsCampaigns(context)).find(
      (item) => item.id === campaignId
    )!;
    await communications.activateCampaign(context, campaign.id, campaign.aggregateVersion);
    campaign = (await communications.listCommunicationsCampaigns(context)).find(
      (item) => item.id === campaignId
    )!;
    expect(campaign.status).toBe('ACTIVE');

    const leadId = await leadService.createLead(context, {
      leadRef: 'LEAD-001',
      sourceType: 'CAMPAIGN',
      sourceCampaignId: campaign.id,
      sourceCommunicationItemId: primaryItemId,
      sourceReference: 'landing://handover/registration-001',
      prospectName: 'Alex Prospect',
      organisationName: 'Example Construction Group',
      email: 'alex.prospect@example.invalid',
      geography: 'United Kingdom',
      sector: 'Construction',
      needSummary: 'Needs a governed handover workflow across multiple projects.'
    });
    let lead = (await leadService.listLeads(context)).find((item) => item.id === leadId)!;

    await segmentation.evaluateSegmentMembership(context, segmentId, segmentVersion.versionNo, {
      subjectType: 'LEAD',
      subjectId: lead.id,
      membershipStatus: 'INCLUDED',
      score: 94,
      basis: { geography: 'GB', sector: 'CONSTRUCTION', digitalMaturity: 'LEADING' }
    });
    const memberships = await segmentation.listMarketSegmentMemberships(
      context,
      segmentVersion.id
    );
    expect(memberships.find((item) => item.subjectId === lead.id)?.membershipStatus).toBe(
      'INCLUDED'
    );

    await privacy.recordConsentEvidence(
      context,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        purposeKey: 'MARKETING.DIGITAL_HANDOVER',
        wordingReference: 'privacy://marketing-consent',
        wordingVersion: '1.0',
        action: 'GRANT',
        channel: 'WEB',
        proofReference: 'proof://lead-001/consent'
      }
    );
    await privacy.recordPreferenceEvidence(
      context,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        preferenceType: 'MARKETING',
        preferenceValue: 'OPT_IN',
        scopeKey: 'MARKETING.DIGITAL_HANDOVER',
        channel: 'EMAIL',
        sourceReference: 'preference://lead-001/email'
      }
    );

    let items = await communications.listCommunicationItems(context, campaign.id);
    let primaryItem = items.find((item) => item.id === primaryItemId)!;
    let followupItem = items.find((item) => item.id === followupItemId)!;
    await communications.scheduleCommunicationItem(
      context,
      primaryItem.id,
      primaryItem.aggregateVersion,
      '2026-10-05T09:00:00Z'
    );
    await communications.scheduleCommunicationItem(
      context,
      followupItem.id,
      followupItem.aggregateVersion,
      '2026-10-12T09:00:00Z'
    );

    await communications.requestCommunicationDelivery(
      context,
      primaryItem.id,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        purposeKey: 'MARKETING.DIGITAL_HANDOVER',
        lawfulBasis: 'CONSENT',
        externalReference: 'provider://send/request-001'
      }
    );
    for (const action of ['SENT', 'DELIVERED', 'OPEN', 'CLICK', 'CONVERSION']) {
      await communications.recordCommunicationDeliveryEvent(
        context,
        primaryItem.id,
        { subjectType: 'LEAD', subjectId: lead.id },
        {
          action,
          externalReference: 'provider://event/' + action.toLowerCase(),
          metadata: { provider: 'TEST' }
        }
      );
    }
    items = await communications.listCommunicationItems(context, campaign.id);
    primaryItem = items.find((item) => item.id === primaryItemId)!;
    await communications.completeCommunicationItem(
      context,
      primaryItem.id,
      primaryItem.aggregateVersion
    );

    await privacy.recordPreferenceEvidence(
      context,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        preferenceType: 'MARKETING',
        preferenceValue: 'OPT_OUT',
        scopeKey: 'MARKETING.DIGITAL_HANDOVER',
        channel: 'EMAIL',
        sourceReference: 'preference://lead-001/unsubscribe'
      }
    );
    await communications.recordCommunicationDeliveryEvent(
      context,
      primaryItem.id,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        action: 'UNSUBSCRIBE',
        externalReference: 'provider://event/unsubscribe'
      }
    );
    items = await communications.listCommunicationItems(context, campaign.id);
    followupItem = items.find((item) => item.id === followupItemId)!;
    await expect(
      communications.requestCommunicationDelivery(
        context,
        followupItem.id,
        { subjectType: 'LEAD', subjectId: lead.id },
        {
          purposeKey: 'MARKETING.DIGITAL_HANDOVER',
          lawfulBasis: 'CONSENT'
        }
      )
    ).rejects.toThrow('MARKETING_PREFERENCE_OPT_OUT');

    await leadService.enrichLead(context, lead.id, lead.aggregateVersion, {
      phone: '+440000000000',
      sector: 'Construction',
      geography: 'United Kingdom'
    });
    lead = (await leadService.listLeads(context)).find((item) => item.id === leadId)!;
    await leadService.scoreLead(context, lead.id, lead.aggregateVersion, {
      scoreDelta: 82,
      reasonCode: 'ENGAGEMENT',
      reason: 'Converted from campaign and demonstrated high-value handover need.',
      evidenceReference: 'provider://event/conversion'
    });
    lead = (await leadService.listLeads(context)).find((item) => item.id === leadId)!;
    await leadService.nurtureLead(context, lead.id, {
      campaignId: campaign.id,
      interactionType: 'SALES_FOLLOW_UP',
      channel: 'PHONE',
      summary: 'Qualification call completed outside marketing email preference scope.'
    });
    await leadService.qualifyLead(
      context,
      lead.id,
      lead.aggregateVersion,
      'Confirmed business need, budget context and near-term decision horizon.'
    );
    lead = (await leadService.listLeads(context)).find((item) => item.id === leadId)!;
    expect(lead.status).toBe('QUALIFIED');
    const handoffId = await leadService.transferQualifiedLeadToSales(
      context,
      lead.id,
      lead.aggregateVersion,
      {
        handoffRef: 'SALES-HANDOFF-001',
        qualificationSummary: 'Qualified digital handover demand ready for F07 Opportunity assessment.'
      }
    );
    lead = (await leadService.listLeads(context)).find((item) => item.id === leadId)!;
    expect(lead.status).toBe('TRANSFERRED');
    const handoffs = await leadService.listLeadSalesHandoffs(context, lead.id);
    expect(handoffs[0]).toMatchObject({
      id: handoffId,
      leadId: lead.id,
      status: 'READY'
    });

    const eventCampaignId = await communications.createCommunicationsCampaign(context, {
      campaignRef: 'EVT-HANDOVER-001',
      campaignType: 'EVENT',
      title: 'Digital handover executive roundtable',
      communicationsPlanId: plan.id,
      objectives: { executiveEngagement: true },
      audienceStrategy: { segment: 'SEG-UK-TIER1' },
      keyMessages: { theme: 'Governed digital handover' },
      channels: ['EVENT'],
      schedule: { date: '2026-11-12' },
      measurementPlan: { registrations: true, attendance: true }
    });
    await communications.configureMarketingEvent(context, eventCampaignId, {
      eventType: 'ROUNDTABLE',
      venue: 'London',
      eventStartAt: '2026-11-12T09:00:00Z',
      eventEndAt: '2026-11-12T12:00:00Z',
      supplierReferences: ['supplier://venue-001'],
      registrationPolicy: { invitationOnly: true },
      deliveryNotes: 'Executive roundtable with governed attendance evidence.'
    });
    const registrationId = await communications.registerMarketingEventParticipant(
      context,
      eventCampaignId,
      { subjectType: 'LEAD', subjectId: lead.id },
      {
        registrationReference: 'REG-001',
        sourceReference: 'registration://event-001'
      }
    );
    await communications.markMarketingEventAttendance(context, registrationId);
    await communications.completeMarketingEvent(
      context,
      eventCampaignId,
      'Roundtable delivered with attendee follow-up captured separately.'
    );
    const event = await communications.getMarketingEvent(context, eventCampaignId);
    expect(event?.eventStatus).toBe('COMPLETED');
    const registrations = await communications.listMarketingEventRegistrations(
      context,
      eventCampaignId
    );
    expect(registrations[0].registrationStatus).toBe('ATTENDED');

    await analytics.recordCampaignMeasurement(context, campaign.id, {
      metricKey: 'SPEND',
      metricValue: 12000,
      unitKey: 'GBP',
      sourceReference: 'finance-ref://marketing/cmp-handover-001'
    });
    await analytics.recordCampaignMeasurement(context, campaign.id, {
      metricKey: 'ATTRIBUTED_REVENUE',
      metricValue: 42000,
      unitKey: 'GBP',
      sourceReference: 'attribution://cmp-handover-001'
    });
    await analytics.recordCampaignMeasurement(context, campaign.id, {
      metricKey: 'ACQUISITIONS',
      metricValue: 2,
      unitKey: 'COUNT',
      sourceReference: 'crm-ref://acquisition-count'
    });
    const snapshotId = await analytics.freezeMarketingAnalyticsSnapshot(context, {
      snapshotRef: 'MKT-AN-001',
      title: 'Digital handover campaign performance',
      campaignId: campaign.id,
      segmentId,
      segmentVersionNo: segmentVersion.versionNo,
      sourceQueryVersion: 'marketing-analytics-v1'
    });
    const snapshot = (await analytics.listMarketingAnalyticsSnapshots(context)).find(
      (item) => item.id === snapshotId
    )!;
    const metrics = snapshot.metrics as Record<string, number | null | Record<string, number>>;
    expect(metrics.sent).toBe(1);
    expect(metrics.delivered).toBe(1);
    expect(metrics.opened).toBe(1);
    expect(metrics.clicked).toBe(1);
    expect(metrics.conversions).toBe(1);
    expect(metrics.unsubscribes).toBe(1);
    expect(metrics.customerAcquisitionCost).toBe(6000);
    expect(metrics.returnOnMarketingInvestment).toBe(2.5);

    const sourceSet = snapshot.sourceSet as Record<string, unknown[]>;
    expect(sourceSet.deliveryEventIds.length).toBeGreaterThanOrEqual(7);
    expect(sourceSet.leadIds).toContain(lead.id);

    const leadPartyCount = await db.queryOne<any>(
      'SELECT COUNT(*) AS count FROM parties WHERE tenant_id=? AND display_name=?',
      [context.tenantId, 'Alex Prospect']
    );
    expect(Number(leadPartyCount?.count)).toBe(0);

    const decisionsCount = await db.queryOne<any>(
      "SELECT COUNT(*) AS count FROM work_decisions WHERE tenant_id=? AND decision_type IN ('INFORMATION_REVISION_REVIEW','COMMUNICATIONS_PLAN_APPROVAL','COMMUNICATIONS_CAMPAIGN_APPROVAL')",
      [context.tenantId]
    );
    expect(Number(decisionsCount?.count)).toBe(3);
  });
});
