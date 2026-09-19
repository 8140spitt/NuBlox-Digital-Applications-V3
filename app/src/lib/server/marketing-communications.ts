import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { assertWorkDecisionReference } from '$lib/server/work-decision';
import {
  assertActiveParty,
  assertIssuedInformationRevision,
  code,
  domainEvidence,
  json,
  now,
  required,
  timestamp
} from '$lib/server/marketing-runtime';
import { evaluateMarketingEligibility, type PrivacySubject } from '$lib/server/privacy-evidence';
import { getMarketSegment, getMarketSegmentVersion } from '$lib/server/marketing-segmentation';

export type CommunicationsPlan = {
  id: string;
  planRef: string;
  planType: string;
  title: string;
  ownerPartyId: string;
  strategySubjectType: string | null;
  strategySubjectId: string | null;
  strategySubjectVersion: string | null;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  approvalDecisionId: string | null;
  approvedAt: string | null;
  activatedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type CommunicationsPlanVersion = {
  id: string;
  planId: string;
  versionNo: number;
  lifecycleStatus: string;
  scopeContext: string;
  objectives: unknown;
  audiences: unknown;
  keyMessages: unknown;
  channels: unknown;
  activities: unknown;
  schedule: unknown;
  measures: unknown;
  positioning: unknown;
  brandDefinition: unknown;
  guidelineSummary: string | null;
  createdAt: string;
};

export type CommunicationsCampaign = {
  id: string;
  campaignRef: string;
  campaignType: string;
  title: string;
  communicationsPlanId: string | null;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  approvalDecisionId: string | null;
  approvedAt: string | null;
  activatedAt: string | null;
  pausedAt: string | null;
  completedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type CommunicationsCampaignVersion = {
  id: string;
  campaignId: string;
  versionNo: number;
  lifecycleStatus: string;
  objectives: unknown;
  audienceStrategy: unknown;
  keyMessages: unknown;
  channels: unknown;
  schedule: unknown;
  budgetContext: unknown;
  measurementPlan: unknown;
  automation: unknown;
  createdAt: string;
};

export type CommunicationItem = {
  id: string;
  campaignId: string;
  campaignVersionId: string;
  itemRef: string;
  itemType: string;
  channel: string;
  informationRevisionId: string;
  audienceScope: unknown;
  ownerPartyId: string;
  scheduledAt: string | null;
  status: string;
  aggregateVersion: number;
  publishedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
};

const planSelect =
  'SELECT id,plan_ref AS planRef,plan_type AS planType,title,owner_party_id AS ownerPartyId,strategy_subject_type AS strategySubjectType,strategy_subject_id AS strategySubjectId,strategy_subject_version AS strategySubjectVersion,status,aggregate_version AS aggregateVersion,current_version_no AS currentVersionNo,approval_decision_id AS approvalDecisionId,approved_at AS approvedAt,activated_at AS activatedAt,closed_at AS closedAt,updated_at AS updatedAt FROM communications_plans';

const campaignSelect =
  'SELECT id,campaign_ref AS campaignRef,campaign_type AS campaignType,title,communications_plan_id AS communicationsPlanId,owner_party_id AS ownerPartyId,status,aggregate_version AS aggregateVersion,current_version_no AS currentVersionNo,approval_decision_id AS approvalDecisionId,approved_at AS approvedAt,activated_at AS activatedAt,paused_at AS pausedAt,completed_at AS completedAt,closed_at AS closedAt,updated_at AS updatedAt FROM communications_campaigns';

const itemSelect =
  'SELECT id,campaign_id AS campaignId,campaign_version_id AS campaignVersionId,item_ref AS itemRef,item_type AS itemType,channel,information_revision_id AS informationRevisionId,audience_scope_json AS audienceScope,owner_party_id AS ownerPartyId,scheduled_at AS scheduledAt,status,aggregate_version AS aggregateVersion,published_at AS publishedAt,completed_at AS completedAt,updated_at AS updatedAt FROM communication_items';

function planVersionSelect() {
  return `SELECT id,plan_id AS planId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,
          scope_context AS scopeContext,objectives_json AS objectives,audiences_json AS audiences,
          key_messages_json AS keyMessages,channels_json AS channels,activities_json AS activities,
          schedule_json AS schedule,measures_json AS measures,positioning_json AS positioning,
          brand_definition_json AS brandDefinition,guideline_summary AS guidelineSummary,
          created_at AS createdAt
     FROM communications_plan_versions`;
}

function campaignVersionSelect() {
  return `SELECT id,campaign_id AS campaignId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,
          objectives_json AS objectives,audience_strategy_json AS audienceStrategy,
          key_messages_json AS keyMessages,channels_json AS channels,schedule_json AS schedule,
          budget_context_json AS budgetContext,measurement_plan_json AS measurementPlan,
          automation_json AS automation,created_at AS createdAt
     FROM communications_campaign_versions`;
}

export async function getCommunicationsPlan(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & CommunicationsPlan>(
    planSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Communications Plan not found.');
  return row;
}

export async function getCommunicationsPlanVersion(
  context: CommandContext,
  planId: string,
  versionNo: number,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & CommunicationsPlanVersion>(
    planVersionSelect() +
      ' WHERE tenant_id=? AND plan_id=? AND version_no=?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, planId, versionNo],
    executor
  );
  if (!row) throw new Error('Communications Plan version not found.');
  return row;
}

export async function listCommunicationsPlans(context: CommandContext, planType?: string) {
  assertPermission(context, 'marketing.read');
  const type = planType?.trim() ? code(planType, 'Plan type') : null;
  return queryRows<RowDataPacket & CommunicationsPlan>(
    planSelect +
      ' WHERE tenant_id=?' +
      (type ? ' AND plan_type=?' : '') +
      ' ORDER BY updated_at DESC,plan_ref',
    type ? [context.tenantId, type] : [context.tenantId]
  );
}

export async function listCommunicationsPlanVersions(context: CommandContext, planId: string) {
  assertPermission(context, 'marketing.read');
  await getCommunicationsPlan(context, planId);
  return queryRows<RowDataPacket & CommunicationsPlanVersion>(
    planVersionSelect() + ' WHERE tenant_id=? AND plan_id=? ORDER BY version_no DESC',
    [context.tenantId, planId]
  );
}

export async function listCommunicationsPlanInformation(
  context: CommandContext,
  planVersionId: string
) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      informationRevisionId: string;
      linkRole: string;
      containerRef: string;
      revisionCode: string;
      title: string;
      lifecycleStatus: string;
      issuedAt: string | null;
    }
  >(
    `SELECT x.information_revision_id AS informationRevisionId,x.link_role AS linkRole,
            ic.container_ref AS containerRef,ir.revision_code AS revisionCode,ir.title,
            ir.lifecycle_status AS lifecycleStatus,ir.issued_at AS issuedAt
       FROM communications_plan_information x
       JOIN information_revisions ir ON ir.id=x.information_revision_id AND ir.tenant_id=x.tenant_id
       JOIN information_containers ic ON ic.id=ir.container_id AND ic.tenant_id=ir.tenant_id
      WHERE x.tenant_id=? AND x.plan_version_id=?
      ORDER BY x.link_role,ic.container_ref,ir.revision_no`,
    [context.tenantId, planVersionId]
  );
}

async function insertPlanVersion(
  context: CommandContext,
  executor: DbExecutor,
  planId: string,
  versionNo: number,
  input: {
    scopeContext: string;
    objectives?: unknown;
    audiences?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    activities?: unknown;
    schedule?: unknown;
    measures?: unknown;
    positioning?: unknown;
    brandDefinition?: unknown;
    guidelineSummary?: string;
  }
) {
  const id = randomUUID();
  await executeMutation(
    `INSERT INTO communications_plan_versions
      (id,tenant_id,plan_id,version_no,lifecycle_status,scope_context,objectives_json,audiences_json,
       key_messages_json,channels_json,activities_json,schedule_json,measures_json,positioning_json,
       brand_definition_json,guideline_summary,created_by_party_id,created_at)
     VALUES (?,?,?,?,'DRAFT',?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      context.tenantId,
      planId,
      versionNo,
      required(input.scopeContext, 'Plan scope / context'),
      json(input.objectives),
      json(input.audiences),
      json(input.keyMessages),
      json(input.channels),
      json(input.activities),
      json(input.schedule),
      json(input.measures),
      json(input.positioning),
      json(input.brandDefinition),
      input.guidelineSummary?.trim() || null,
      context.actorPartyId,
      now()
    ],
    executor
  );
  return id;
}

export async function createCommunicationsPlan(
  context: CommandContext,
  input: {
    planRef: string;
    planType: string;
    title: string;
    ownerPartyId?: string;
    strategySubjectType?: string;
    strategySubjectId?: string;
    strategySubjectVersion?: string;
    scopeContext: string;
    objectives?: unknown;
    audiences?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    activities?: unknown;
    schedule?: unknown;
    measures?: unknown;
    positioning?: unknown;
    brandDefinition?: unknown;
    guidelineSummary?: string;
  }
) {
  assertPermission(context, 'marketing.plan.manage');
  const id = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    await executeMutation(
      `INSERT INTO communications_plans
        (id,tenant_id,plan_ref,plan_type,title,owner_party_id,strategy_subject_type,strategy_subject_id,
         strategy_subject_version,status,aggregate_version,current_version_no,approval_decision_id,
         approved_at,activated_at,closed_at,created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'DRAFT',1,1,NULL,NULL,NULL,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.planRef, 'Plan reference', 191),
        code(input.planType, 'Plan type'),
        required(input.title, 'Plan title', 500),
        ownerPartyId,
        input.strategySubjectType?.trim()
          ? code(input.strategySubjectType, 'Strategy subject type')
          : null,
        input.strategySubjectId?.trim() || null,
        input.strategySubjectVersion?.trim() || null,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await insertPlanVersion(context, connection, id, 1, input);
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationsPlan',
        objectType: 'communications_plan',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'COMMUNICATIONS_PLAN_CREATED',
        topic: 'nublox.communications.plan',
        toState: 'DRAFT',
        payload: { planType: code(input.planType, 'Plan type'), versionNo: 1 }
      },
      connection
    );
    return id;
  });
}

export async function reviseCommunicationsPlan(
  context: CommandContext,
  planId: string,
  expectedVersion: number,
  input: {
    title?: string;
    scopeContext: string;
    objectives?: unknown;
    audiences?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    activities?: unknown;
    schedule?: unknown;
    measures?: unknown;
    positioning?: unknown;
    brandDefinition?: unknown;
    guidelineSummary?: string;
  }
) {
  assertPermission(context, 'marketing.plan.manage');
  return dbTransaction(async (connection) => {
    const plan = await getCommunicationsPlan(context, planId, connection, true);
    if (plan.aggregateVersion !== expectedVersion) throw new Error('Communications Plan changed.');
    if (['CLOSED'].includes(plan.status))
      throw new Error('Closed Communications Plans are immutable.');
    const nextVersionNo = plan.currentVersionNo + 1;
    await insertPlanVersion(context, connection, plan.id, nextVersionNo, input);
    const updatedAt = now();
    await executeMutation(
      `UPDATE communications_plans
          SET title=COALESCE(?,title),status='DRAFT',aggregate_version=aggregate_version+1,
              current_version_no=?,approval_decision_id=NULL,approved_at=NULL,activated_at=NULL,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        input.title?.trim() || null,
        nextVersionNo,
        updatedAt,
        plan.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationsPlan',
        objectType: 'communications_plan',
        objectId: plan.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_PLAN_REVISED',
        topic: 'nublox.communications.plan',
        fromState: plan.status,
        toState: 'DRAFT',
        payload: { versionNo: nextVersionNo }
      },
      connection
    );
    return nextVersionNo;
  });
}

export async function linkCommunicationsPlanInformation(
  context: CommandContext,
  planId: string,
  input: { informationRevisionId: string; linkRole: string }
) {
  assertPermission(context, 'marketing.plan.manage');
  return dbTransaction(async (connection) => {
    const plan = await getCommunicationsPlan(context, planId, connection, true);
    const version = await getCommunicationsPlanVersion(
      context,
      plan.id,
      plan.currentVersionNo,
      connection
    );
    if (version.lifecycleStatus !== 'DRAFT') {
      throw new Error('Only the draft Communications Plan version can be changed.');
    }
    await assertIssuedInformationRevision(
      context,
      required(input.informationRevisionId, 'Information revision ID', 36),
      connection
    );
    await executeMutation(
      `INSERT INTO communications_plan_information
        (plan_version_id,tenant_id,information_revision_id,link_role,created_by_party_id,created_at)
       VALUES (?,?,?,?,?,?)`,
      [
        version.id,
        context.tenantId,
        input.informationRevisionId,
        code(input.linkRole, 'Plan information role'),
        context.actorPartyId,
        now()
      ],
      connection
    );
  });
}

export async function prepareCommunicationsPlanForDecision(
  context: CommandContext,
  planId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.plan.manage');
  return dbTransaction(async (connection) => {
    const plan = await getCommunicationsPlan(context, planId, connection, true);
    if (plan.aggregateVersion !== expectedVersion) throw new Error('Communications Plan changed.');
    if (plan.status !== 'DRAFT')
      throw new Error('Only draft Communications Plans can be submitted.');
    const version = await getCommunicationsPlanVersion(
      context,
      plan.id,
      plan.currentVersionNo,
      connection,
      true
    );
    const updatedAt = now();
    await executeMutation(
      "UPDATE communications_plan_versions SET lifecycle_status='REVIEW' WHERE id=? AND tenant_id=?",
      [version.id, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE communications_plans SET status='REVIEW',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [updatedAt, plan.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationsPlan',
        objectType: 'communications_plan',
        objectId: plan.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_PLAN_REVIEW_REQUESTED',
        topic: 'nublox.communications.plan',
        fromState: plan.status,
        toState: 'REVIEW',
        payload: { versionNo: plan.currentVersionNo }
      },
      connection
    );
    return {
      decisionType: 'COMMUNICATIONS_PLAN_APPROVAL',
      subjectType: 'COMMUNICATIONS_PLAN',
      subjectId: plan.id,
      subjectVersion: String(plan.currentVersionNo)
    };
  });
}

export async function applyCommunicationsPlanDecision(
  context: CommandContext,
  planId: string,
  expectedVersion: number,
  decisionId: string,
  outcome: string
) {
  assertPermission(context, 'marketing.plan.approve');
  return dbTransaction(async (connection) => {
    const plan = await getCommunicationsPlan(context, planId, connection, true);
    if (plan.aggregateVersion !== expectedVersion) throw new Error('Communications Plan changed.');
    if (plan.status !== 'REVIEW') throw new Error('Communications Plan is not awaiting approval.');
    const decisionOutcome = code(outcome, 'Plan decision outcome');
    if (!['APPROVED', 'REWORK', 'REJECTED'].includes(decisionOutcome)) {
      throw new Error('Plan decision outcome must be APPROVED, REWORK or REJECTED.');
    }
    await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'COMMUNICATIONS_PLAN_APPROVAL',
        subjectType: 'COMMUNICATIONS_PLAN',
        subjectId: plan.id,
        subjectVersion: String(plan.currentVersionNo),
        outcome: decisionOutcome
      },
      connection
    );
    const updatedAt = now();
    await executeMutation(
      'UPDATE communications_plan_versions SET lifecycle_status=? WHERE tenant_id=? AND plan_id=? AND version_no=?',
      [decisionOutcome, context.tenantId, plan.id, plan.currentVersionNo],
      connection
    );
    await executeMutation(
      `UPDATE communications_plans
          SET status=?,aggregate_version=aggregate_version+1,approval_decision_id=?,approved_at=?,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        decisionOutcome,
        decisionId,
        decisionOutcome === 'APPROVED' ? updatedAt : null,
        updatedAt,
        plan.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationsPlan',
        objectType: 'communications_plan',
        objectId: plan.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_PLAN_DECIDED',
        topic: 'nublox.communications.plan',
        fromState: plan.status,
        toState: decisionOutcome,
        payload: { decisionId, versionNo: plan.currentVersionNo }
      },
      connection
    );
  });
}

export async function activateCommunicationsPlan(
  context: CommandContext,
  planId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.plan.manage');
  return dbTransaction(async (connection) => {
    const plan = await getCommunicationsPlan(context, planId, connection, true);
    if (plan.aggregateVersion !== expectedVersion) throw new Error('Communications Plan changed.');
    if (plan.status !== 'APPROVED' || !plan.approvalDecisionId) {
      throw new Error('Communications Plan requires an approved immutable Decision.');
    }
    const activatedAt = now();
    await executeMutation(
      "UPDATE communications_plan_versions SET lifecycle_status='ACTIVE' WHERE tenant_id=? AND plan_id=? AND version_no=?",
      [context.tenantId, plan.id, plan.currentVersionNo],
      connection
    );
    await executeMutation(
      "UPDATE communications_plans SET status='ACTIVE',aggregate_version=aggregate_version+1,activated_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [activatedAt, activatedAt, plan.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationsPlan',
        objectType: 'communications_plan',
        objectId: plan.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_PLAN_ACTIVATED',
        topic: 'nublox.communications.plan',
        fromState: plan.status,
        toState: 'ACTIVE'
      },
      connection
    );
  });
}

export async function getCommunicationsCampaign(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & CommunicationsCampaign>(
    campaignSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Communications Campaign not found.');
  return row;
}

export async function getCommunicationsCampaignVersion(
  context: CommandContext,
  campaignId: string,
  versionNo: number,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & CommunicationsCampaignVersion>(
    campaignVersionSelect() +
      ' WHERE tenant_id=? AND campaign_id=? AND version_no=?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, campaignId, versionNo],
    executor
  );
  if (!row) throw new Error('Communications Campaign version not found.');
  return row;
}

export async function listCommunicationsCampaigns(context: CommandContext, campaignType?: string) {
  assertPermission(context, 'marketing.read');
  const type = campaignType?.trim() ? code(campaignType, 'Campaign type') : null;
  return queryRows<RowDataPacket & CommunicationsCampaign>(
    campaignSelect +
      ' WHERE tenant_id=?' +
      (type ? ' AND campaign_type=?' : '') +
      ' ORDER BY updated_at DESC,campaign_ref',
    type ? [context.tenantId, type] : [context.tenantId]
  );
}

export async function listCommunicationsCampaignVersions(
  context: CommandContext,
  campaignId: string
) {
  assertPermission(context, 'marketing.read');
  await getCommunicationsCampaign(context, campaignId);
  return queryRows<RowDataPacket & CommunicationsCampaignVersion>(
    campaignVersionSelect() + ' WHERE tenant_id=? AND campaign_id=? ORDER BY version_no DESC',
    [context.tenantId, campaignId]
  );
}

async function insertCampaignVersion(
  context: CommandContext,
  executor: DbExecutor,
  campaignId: string,
  versionNo: number,
  input: {
    objectives?: unknown;
    audienceStrategy?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    schedule?: unknown;
    budgetContext?: unknown;
    measurementPlan?: unknown;
    automation?: unknown;
  }
) {
  const id = randomUUID();
  await executeMutation(
    `INSERT INTO communications_campaign_versions
      (id,tenant_id,campaign_id,version_no,lifecycle_status,objectives_json,audience_strategy_json,
       key_messages_json,channels_json,schedule_json,budget_context_json,measurement_plan_json,
       automation_json,created_by_party_id,created_at)
     VALUES (?,?,?,?,'PLANNED',?,?,?,?,?,?,?,?,?,?)`,
    [
      id,
      context.tenantId,
      campaignId,
      versionNo,
      json(input.objectives),
      json(input.audienceStrategy),
      json(input.keyMessages),
      json(input.channels),
      json(input.schedule),
      json(input.budgetContext),
      json(input.measurementPlan),
      json(input.automation),
      context.actorPartyId,
      now()
    ],
    executor
  );
  return id;
}

export async function createCommunicationsCampaign(
  context: CommandContext,
  input: {
    campaignRef: string;
    campaignType: string;
    title: string;
    communicationsPlanId?: string;
    ownerPartyId?: string;
    objectives?: unknown;
    audienceStrategy?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    schedule?: unknown;
    budgetContext?: unknown;
    measurementPlan?: unknown;
    automation?: unknown;
  }
) {
  assertPermission(context, 'marketing.campaign.manage');
  const id = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const planId = input.communicationsPlanId?.trim() || null;
    if (planId) {
      const plan = await getCommunicationsPlan(context, planId, connection);
      if (!['APPROVED', 'ACTIVE'].includes(plan.status)) {
        throw new Error('Campaign must reference an approved or active Communications Plan.');
      }
    }
    await executeMutation(
      `INSERT INTO communications_campaigns
        (id,tenant_id,campaign_ref,campaign_type,title,communications_plan_id,owner_party_id,status,
         aggregate_version,current_version_no,approval_decision_id,approved_at,activated_at,paused_at,
         completed_at,closed_at,created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,'PLANNED',1,1,NULL,NULL,NULL,NULL,NULL,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.campaignRef, 'Campaign reference', 191),
        code(input.campaignType, 'Campaign type'),
        required(input.title, 'Campaign title', 500),
        planId,
        ownerPartyId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await insertCampaignVersion(context, connection, id, 1, input);
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_CREATED',
        topic: 'nublox.communications.campaign',
        toState: 'PLANNED',
        payload: { campaignType: code(input.campaignType, 'Campaign type'), versionNo: 1 }
      },
      connection
    );
    return id;
  });
}

export async function reviseCommunicationsCampaign(
  context: CommandContext,
  campaignId: string,
  expectedVersion: number,
  input: {
    title?: string;
    objectives?: unknown;
    audienceStrategy?: unknown;
    keyMessages?: unknown;
    channels?: unknown;
    schedule?: unknown;
    budgetContext?: unknown;
    measurementPlan?: unknown;
    automation?: unknown;
  }
) {
  assertPermission(context, 'marketing.campaign.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.aggregateVersion !== expectedVersion)
      throw new Error('Communications Campaign changed.');
    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(campaign.status)) {
      throw new Error('Completed, closed or cancelled Campaigns cannot be revised.');
    }
    const nextVersionNo = campaign.currentVersionNo + 1;
    const current = await getCommunicationsCampaignVersion(
      context,
      campaign.id,
      campaign.currentVersionNo,
      connection
    );
    await insertCampaignVersion(context, connection, campaign.id, nextVersionNo, {
      objectives: input.objectives ?? current.objectives,
      audienceStrategy: input.audienceStrategy ?? current.audienceStrategy,
      keyMessages: input.keyMessages ?? current.keyMessages,
      channels: input.channels ?? current.channels,
      schedule: input.schedule ?? current.schedule,
      budgetContext: input.budgetContext ?? current.budgetContext,
      measurementPlan: input.measurementPlan ?? current.measurementPlan,
      automation: input.automation ?? current.automation
    });
    const updatedAt = now();
    await executeMutation(
      `UPDATE communications_campaigns
          SET title=COALESCE(?,title),status='PLANNED',aggregate_version=aggregate_version+1,
              current_version_no=?,approval_decision_id=NULL,approved_at=NULL,activated_at=NULL,
              paused_at=NULL,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        input.title?.trim() || null,
        nextVersionNo,
        updatedAt,
        campaign.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: campaign.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_REVISED',
        topic: 'nublox.communications.campaign',
        fromState: campaign.status,
        toState: 'PLANNED',
        payload: { versionNo: nextVersionNo }
      },
      connection
    );
    return nextVersionNo;
  });
}

export async function linkCampaignSegment(
  context: CommandContext,
  campaignId: string,
  input: {
    segmentId: string;
    segmentVersionNo: number;
    inclusionType?: string;
  }
) {
  assertPermission(context, 'marketing.campaign.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.status !== 'PLANNED') {
      throw new Error('Campaign audience can only change while the Campaign is planned.');
    }
    const version = await getCommunicationsCampaignVersion(
      context,
      campaign.id,
      campaign.currentVersionNo,
      connection
    );
    const segment = await getMarketSegment(context, input.segmentId, connection);
    if (segment.status !== 'ACTIVE') throw new Error('Campaign requires an active Market Segment.');
    const segmentVersion = await getMarketSegmentVersion(
      context,
      segment.id,
      input.segmentVersionNo,
      connection
    );
    if (segmentVersion.lifecycleStatus !== 'ACTIVE') {
      throw new Error('Campaign must pin an active Market Segment version.');
    }
    const inclusionType = code(input.inclusionType || 'INCLUDE', 'Segment inclusion type');
    if (!['INCLUDE', 'EXCLUDE'].includes(inclusionType)) {
      throw new Error('Segment inclusion type must be INCLUDE or EXCLUDE.');
    }
    await executeMutation(
      `INSERT INTO communications_campaign_segments
        (campaign_version_id,tenant_id,segment_id,segment_version_no,inclusion_type,created_at)
       VALUES (?,?,?,?,?,?)`,
      [version.id, context.tenantId, segment.id, segmentVersion.versionNo, inclusionType, now()],
      connection
    );
  });
}

export async function listCampaignSegments(context: CommandContext, campaignVersionId: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      segmentId: string;
      segmentRef: string;
      name: string;
      segmentVersionNo: number;
      inclusionType: string;
    }
  >(
    `SELECT x.segment_id AS segmentId,s.segment_ref AS segmentRef,s.name,
            x.segment_version_no AS segmentVersionNo,x.inclusion_type AS inclusionType
       FROM communications_campaign_segments x
       JOIN market_segments s ON s.id=x.segment_id AND s.tenant_id=x.tenant_id
      WHERE x.tenant_id=? AND x.campaign_version_id=?
      ORDER BY x.inclusion_type,s.segment_ref`,
    [context.tenantId, campaignVersionId]
  );
}

export async function linkCampaignInformation(
  context: CommandContext,
  campaignId: string,
  input: { informationRevisionId: string; linkRole: string; channel?: string }
) {
  assertPermission(context, 'marketing.campaign.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.status !== 'PLANNED') {
      throw new Error('Campaign content can only change while the Campaign is planned.');
    }
    const version = await getCommunicationsCampaignVersion(
      context,
      campaign.id,
      campaign.currentVersionNo,
      connection
    );
    await assertIssuedInformationRevision(
      context,
      required(input.informationRevisionId, 'Information revision ID', 36),
      connection
    );
    await executeMutation(
      `INSERT INTO communications_campaign_information
        (campaign_version_id,tenant_id,information_revision_id,link_role,channel,created_by_party_id,created_at)
       VALUES (?,?,?,?,?,?,?)`,
      [
        version.id,
        context.tenantId,
        input.informationRevisionId,
        code(input.linkRole, 'Campaign information role'),
        input.channel?.trim() ? code(input.channel, 'Campaign content channel') : null,
        context.actorPartyId,
        now()
      ],
      connection
    );
  });
}

export async function listCampaignInformation(context: CommandContext, campaignVersionId: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      informationRevisionId: string;
      linkRole: string;
      channel: string | null;
      containerRef: string;
      revisionCode: string;
      title: string;
      lifecycleStatus: string;
    }
  >(
    `SELECT x.information_revision_id AS informationRevisionId,x.link_role AS linkRole,x.channel,
            ic.container_ref AS containerRef,ir.revision_code AS revisionCode,ir.title,
            ir.lifecycle_status AS lifecycleStatus
       FROM communications_campaign_information x
       JOIN information_revisions ir ON ir.id=x.information_revision_id AND ir.tenant_id=x.tenant_id
       JOIN information_containers ic ON ic.id=ir.container_id AND ic.tenant_id=ir.tenant_id
      WHERE x.tenant_id=? AND x.campaign_version_id=?
      ORDER BY x.link_role,x.channel,ic.container_ref`,
    [context.tenantId, campaignVersionId]
  );
}

export async function createCommunicationItem(
  context: CommandContext,
  campaignId: string,
  input: {
    itemRef: string;
    itemType?: string;
    channel: string;
    informationRevisionId: string;
    audienceScope?: unknown;
    ownerPartyId?: string;
  }
) {
  assertPermission(context, 'marketing.campaign.manage');
  const id = randomUUID();
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (!['PLANNED', 'APPROVED'].includes(campaign.status)) {
      throw new Error('Communication Items can only be created before Campaign activation.');
    }
    const version = await getCommunicationsCampaignVersion(
      context,
      campaign.id,
      campaign.currentVersionNo,
      connection
    );
    const revision = await assertIssuedInformationRevision(
      context,
      required(input.informationRevisionId, 'Information revision ID', 36),
      connection
    );
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const createdAt = now();
    await executeMutation(
      `INSERT INTO communication_items
        (id,tenant_id,campaign_id,campaign_version_id,item_ref,item_type,channel,information_revision_id,
         audience_scope_json,owner_party_id,scheduled_at,status,aggregate_version,published_at,
         completed_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,NULL,'PLANNED',1,NULL,NULL,?,?)`,
      [
        id,
        context.tenantId,
        campaign.id,
        version.id,
        code(input.itemRef, 'Communication Item reference', 191),
        code(input.itemType || 'MARKETING_MESSAGE', 'Communication Item type'),
        code(input.channel, 'Communication channel'),
        revision.id,
        json(input.audienceScope),
        ownerPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationItem',
        objectType: 'communication_item',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'COMMUNICATION_ITEM_CREATED',
        topic: 'nublox.communications.item',
        toState: 'PLANNED',
        payload: { campaignId: campaign.id, campaignVersionNo: campaign.currentVersionNo }
      },
      connection
    );
    return id;
  });
}

export async function listCommunicationItems(context: CommandContext, campaignId?: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<RowDataPacket & CommunicationItem>(
    itemSelect +
      ' WHERE tenant_id=?' +
      (campaignId?.trim() ? ' AND campaign_id=?' : '') +
      ' ORDER BY updated_at DESC,item_ref',
    campaignId?.trim() ? [context.tenantId, campaignId.trim()] : [context.tenantId]
  );
}

export async function prepareCampaignForDecision(
  context: CommandContext,
  campaignId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.campaign.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.aggregateVersion !== expectedVersion)
      throw new Error('Communications Campaign changed.');
    if (campaign.status !== 'PLANNED') throw new Error('Only planned Campaigns can be submitted.');
    const version = await getCommunicationsCampaignVersion(
      context,
      campaign.id,
      campaign.currentVersionNo,
      connection,
      true
    );
    const segments = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM communications_campaign_segments WHERE tenant_id=? AND campaign_version_id=?',
      [context.tenantId, version.id],
      connection
    );
    const items = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM communication_items WHERE tenant_id=? AND campaign_version_id=?',
      [context.tenantId, version.id],
      connection
    );
    if (!segments?.count)
      throw new Error('Campaign approval requires at least one pinned Market Segment.');
    if (!items?.count)
      throw new Error('Campaign approval requires at least one Communication Item.');
    const updatedAt = now();
    await executeMutation(
      "UPDATE communications_campaign_versions SET lifecycle_status='REVIEW' WHERE id=? AND tenant_id=?",
      [version.id, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE communications_campaigns SET status='REVIEW',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [updatedAt, campaign.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: campaign.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_REVIEW_REQUESTED',
        topic: 'nublox.communications.campaign',
        fromState: campaign.status,
        toState: 'REVIEW',
        payload: { versionNo: campaign.currentVersionNo }
      },
      connection
    );
    return {
      decisionType: 'COMMUNICATIONS_CAMPAIGN_APPROVAL',
      subjectType: 'COMMUNICATIONS_CAMPAIGN',
      subjectId: campaign.id,
      subjectVersion: String(campaign.currentVersionNo)
    };
  });
}

export async function applyCampaignDecision(
  context: CommandContext,
  campaignId: string,
  expectedVersion: number,
  decisionId: string,
  outcome: string
) {
  assertPermission(context, 'marketing.campaign.approve');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.aggregateVersion !== expectedVersion)
      throw new Error('Communications Campaign changed.');
    if (campaign.status !== 'REVIEW') throw new Error('Campaign is not awaiting approval.');
    const decisionOutcome = code(outcome, 'Campaign decision outcome');
    if (!['APPROVED', 'REWORK', 'REJECTED'].includes(decisionOutcome)) {
      throw new Error('Campaign decision outcome must be APPROVED, REWORK or REJECTED.');
    }
    await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'COMMUNICATIONS_CAMPAIGN_APPROVAL',
        subjectType: 'COMMUNICATIONS_CAMPAIGN',
        subjectId: campaign.id,
        subjectVersion: String(campaign.currentVersionNo),
        outcome: decisionOutcome
      },
      connection
    );
    const updatedAt = now();
    await executeMutation(
      'UPDATE communications_campaign_versions SET lifecycle_status=? WHERE tenant_id=? AND campaign_id=? AND version_no=?',
      [decisionOutcome, context.tenantId, campaign.id, campaign.currentVersionNo],
      connection
    );
    await executeMutation(
      `UPDATE communications_campaigns
          SET status=?,aggregate_version=aggregate_version+1,approval_decision_id=?,approved_at=?,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        decisionOutcome,
        decisionId,
        decisionOutcome === 'APPROVED' ? updatedAt : null,
        updatedAt,
        campaign.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: campaign.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_DECIDED',
        topic: 'nublox.communications.campaign',
        fromState: campaign.status,
        toState: decisionOutcome,
        payload: { decisionId, versionNo: campaign.currentVersionNo }
      },
      connection
    );
  });
}

export async function activateCampaign(
  context: CommandContext,
  campaignId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.campaign.execute');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.aggregateVersion !== expectedVersion)
      throw new Error('Communications Campaign changed.');
    if (campaign.status !== 'APPROVED' || !campaign.approvalDecisionId) {
      throw new Error('Campaign requires an approved immutable Decision.');
    }
    if (campaign.communicationsPlanId) {
      const plan = await getCommunicationsPlan(context, campaign.communicationsPlanId, connection);
      if (plan.status !== 'ACTIVE') throw new Error('Campaign Communications Plan must be active.');
    }
    const activatedAt = now();
    await executeMutation(
      "UPDATE communications_campaign_versions SET lifecycle_status='ACTIVE' WHERE tenant_id=? AND campaign_id=? AND version_no=?",
      [context.tenantId, campaign.id, campaign.currentVersionNo],
      connection
    );
    await executeMutation(
      "UPDATE communications_campaigns SET status='ACTIVE',aggregate_version=aggregate_version+1,activated_at=?,paused_at=NULL,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [activatedAt, activatedAt, campaign.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: campaign.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_ACTIVATED',
        topic: 'nublox.communications.campaign',
        fromState: campaign.status,
        toState: 'ACTIVE'
      },
      connection
    );
  });
}

export async function scheduleCommunicationItem(
  context: CommandContext,
  itemId: string,
  expectedVersion: number,
  scheduledAt: string
) {
  assertPermission(context, 'marketing.campaign.execute');
  return dbTransaction(async (connection) => {
    const item = await queryOne<RowDataPacket & CommunicationItem>(
      itemSelect + ' WHERE id=? AND tenant_id=? FOR UPDATE',
      [itemId, context.tenantId],
      connection
    );
    if (!item) throw new Error('Communication Item not found.');
    if (item.aggregateVersion !== expectedVersion) throw new Error('Communication Item changed.');
    if (item.status !== 'PLANNED')
      throw new Error('Only planned Communication Items can be scheduled.');
    const campaign = await getCommunicationsCampaign(context, item.campaignId, connection);
    if (!['APPROVED', 'ACTIVE'].includes(campaign.status)) {
      throw new Error('Communication Item requires an approved Campaign.');
    }
    const schedule = timestamp(scheduledAt, 'Communication schedule');
    if (!schedule) throw new Error('Communication schedule is required.');
    await executeMutation(
      "UPDATE communication_items SET status='SCHEDULED',scheduled_at=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [schedule, now(), item.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationItem',
        objectType: 'communication_item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATION_ITEM_SCHEDULED',
        topic: 'nublox.communications.item',
        fromState: item.status,
        toState: 'SCHEDULED',
        payload: { scheduledAt: schedule }
      },
      connection
    );
  });
}

export async function requestCommunicationDelivery(
  context: CommandContext,
  itemId: string,
  recipient: PrivacySubject,
  input: {
    purposeKey: string;
    lawfulBasis: 'CONSENT' | 'LEGITIMATE_INTEREST';
    externalReference?: string;
    metadata?: unknown;
  }
) {
  assertPermission(context, 'marketing.campaign.execute');
  return dbTransaction(async (connection) => {
    const item = await queryOne<RowDataPacket & CommunicationItem>(
      itemSelect + ' WHERE id=? AND tenant_id=? FOR UPDATE',
      [itemId, context.tenantId],
      connection
    );
    if (!item) throw new Error('Communication Item not found.');
    if (!['SCHEDULED', 'IN_DELIVERY'].includes(item.status)) {
      throw new Error('Communication Item must be scheduled before delivery.');
    }
    const campaign = await getCommunicationsCampaign(context, item.campaignId, connection);
    if (campaign.status !== 'ACTIVE') throw new Error('Campaign must be active before delivery.');
    const eligibility = await evaluateMarketingEligibility(
      context,
      recipient,
      {
        purposeKey: input.purposeKey,
        channel: item.channel,
        lawfulBasis: input.lawfulBasis
      },
      connection
    );
    if (!eligibility.eligible) {
      await domainEvidence(
        context,
        {
          aggregateId: 'AGG-25-COMMUNICATIONS',
          aggregateType: 'CommunicationItem',
          objectType: 'communication_item',
          objectId: item.id,
          aggregateVersion: item.aggregateVersion,
          eventType: 'COMMUNICATION_DELIVERY_BLOCKED',
          topic: 'nublox.communications.delivery',
          payload: {
            recipientType: recipient.subjectType,
            recipientId: recipient.subjectId,
            reason: eligibility.reason
          }
        },
        connection
      );
      throw new Error(
        'Recipient is not eligible for this marketing communication: ' + eligibility.reason
      );
    }

    const deliveryId = randomUUID();
    const partyId = recipient.subjectType === 'PARTY' ? recipient.subjectId : null;
    const leadId = recipient.subjectType === 'LEAD' ? recipient.subjectId : null;
    const occurredAt = now();
    await executeMutation(
      `INSERT INTO communication_delivery_events
        (id,tenant_id,communication_item_id,recipient_type,recipient_party_id,recipient_lead_id,
         delivery_action,external_reference,metadata_json,occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,'REQUESTED',?,?,?,?)`,
      [
        deliveryId,
        context.tenantId,
        item.id,
        recipient.subjectType,
        partyId,
        leadId,
        input.externalReference?.trim() || null,
        json(input.metadata),
        occurredAt,
        context.actorPartyId
      ],
      connection
    );
    if (item.status === 'SCHEDULED') {
      await executeMutation(
        "UPDATE communication_items SET status='IN_DELIVERY',published_at=COALESCE(published_at,?),aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=?",
        [occurredAt, occurredAt, item.id, context.tenantId],
        connection
      );
    }
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationItem',
        objectType: 'communication_item',
        objectId: item.id,
        aggregateVersion: item.aggregateVersion + (item.status === 'SCHEDULED' ? 1 : 0),
        eventType: 'COMMUNICATION_DELIVERY_REQUESTED',
        topic: 'nublox.communications.delivery',
        payload: {
          deliveryId,
          recipientType: recipient.subjectType,
          recipientId: recipient.subjectId,
          channel: item.channel,
          purposeKey: code(input.purposeKey, 'Marketing purpose', 191),
          lawfulBasis: input.lawfulBasis,
          informationRevisionId: item.informationRevisionId
        }
      },
      connection
    );
    return deliveryId;
  });
}

export async function recordCommunicationDeliveryEvent(
  context: CommandContext,
  itemId: string,
  recipient: PrivacySubject,
  input: {
    action: string;
    externalReference?: string;
    metadata?: unknown;
    occurredAt?: string;
  }
) {
  assertPermission(context, 'marketing.campaign.execute');
  const action = code(input.action, 'Delivery action');
  if (
    !['SENT', 'DELIVERED', 'BOUNCE', 'OPEN', 'CLICK', 'CONVERSION', 'UNSUBSCRIBE'].includes(action)
  ) {
    throw new Error('Unsupported communication delivery action.');
  }
  return dbTransaction(async (connection) => {
    const item = await queryOne<RowDataPacket & CommunicationItem>(
      itemSelect + ' WHERE id=? AND tenant_id=?',
      [itemId, context.tenantId],
      connection
    );
    if (!item) throw new Error('Communication Item not found.');
    const partyId = recipient.subjectType === 'PARTY' ? recipient.subjectId : null;
    const leadId = recipient.subjectType === 'LEAD' ? recipient.subjectId : null;
    const eventId = randomUUID();
    const occurredAt = timestamp(input.occurredAt, 'Delivery event time') ?? now();
    await executeMutation(
      `INSERT INTO communication_delivery_events
        (id,tenant_id,communication_item_id,recipient_type,recipient_party_id,recipient_lead_id,
         delivery_action,external_reference,metadata_json,occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        eventId,
        context.tenantId,
        item.id,
        recipient.subjectType,
        partyId,
        leadId,
        action,
        input.externalReference?.trim() || null,
        json(input.metadata),
        occurredAt,
        context.actorPartyId
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationItem',
        objectType: 'communication_item',
        objectId: item.id,
        aggregateVersion: item.aggregateVersion,
        eventType: 'COMMUNICATION_DELIVERY_' + action,
        topic: 'nublox.communications.delivery',
        payload: {
          eventId,
          recipientType: recipient.subjectType,
          recipientId: recipient.subjectId,
          action
        }
      },
      connection
    );
    return eventId;
  });
}

export async function completeCommunicationItem(
  context: CommandContext,
  itemId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.campaign.execute');
  return dbTransaction(async (connection) => {
    const item = await queryOne<RowDataPacket & CommunicationItem>(
      itemSelect + ' WHERE id=? AND tenant_id=? FOR UPDATE',
      [itemId, context.tenantId],
      connection
    );
    if (!item) throw new Error('Communication Item not found.');
    if (item.aggregateVersion !== expectedVersion) throw new Error('Communication Item changed.');
    if (!['IN_DELIVERY', 'SCHEDULED'].includes(item.status)) {
      throw new Error('Only scheduled or in-delivery Communication Items can complete.');
    }
    const completedAt = now();
    await executeMutation(
      "UPDATE communication_items SET status='COMPLETED',completed_at=?,aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [completedAt, completedAt, item.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMUNICATIONS',
        aggregateType: 'CommunicationItem',
        objectType: 'communication_item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATION_ITEM_COMPLETED',
        topic: 'nublox.communications.item',
        fromState: item.status,
        toState: 'COMPLETED'
      },
      connection
    );
  });
}

export async function transitionCampaign(
  context: CommandContext,
  campaignId: string,
  expectedVersion: number,
  targetStatus: string
) {
  assertPermission(context, 'marketing.campaign.execute');
  const target = code(targetStatus, 'Campaign target status');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection, true);
    if (campaign.aggregateVersion !== expectedVersion)
      throw new Error('Communications Campaign changed.');
    const allowed: Record<string, string[]> = {
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      COMPLETED: ['CLOSED']
    };
    if (!(allowed[campaign.status] ?? []).includes(target)) {
      throw new Error(`Campaign cannot transition from ${campaign.status} to ${target}.`);
    }
    const changedAt = now();
    await executeMutation(
      `UPDATE communications_campaigns
          SET status=?,aggregate_version=aggregate_version+1,
              paused_at=CASE WHEN ?='PAUSED' THEN ? ELSE paused_at END,
              activated_at=CASE WHEN ?='ACTIVE' THEN ? ELSE activated_at END,
              completed_at=CASE WHEN ?='COMPLETED' THEN ? ELSE completed_at END,
              closed_at=CASE WHEN ?='CLOSED' THEN ? ELSE closed_at END,
              updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        target,
        target,
        changedAt,
        target,
        changedAt,
        target,
        changedAt,
        target,
        changedAt,
        changedAt,
        campaign.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-25-COMMS-CAMPAIGN',
        aggregateType: 'CommunicationsCampaign',
        objectType: 'communications_campaign',
        objectId: campaign.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'COMMUNICATIONS_CAMPAIGN_TRANSITIONED',
        topic: 'nublox.communications.campaign',
        fromState: campaign.status,
        toState: target
      },
      connection
    );
  });
}

export async function listDeliveryEvents(context: CommandContext, communicationItemId: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      recipientType: string;
      recipientPartyId: string | null;
      recipientLeadId: string | null;
      deliveryAction: string;
      externalReference: string | null;
      metadata: unknown;
      occurredAt: string;
    }
  >(
    `SELECT id,recipient_type AS recipientType,recipient_party_id AS recipientPartyId,
            recipient_lead_id AS recipientLeadId,delivery_action AS deliveryAction,
            external_reference AS externalReference,metadata_json AS metadata,occurred_at AS occurredAt
       FROM communication_delivery_events
      WHERE tenant_id=? AND communication_item_id=?
      ORDER BY occurred_at DESC,id DESC`,
    [context.tenantId, communicationItemId]
  );
}

export async function configureMarketingEvent(
  context: CommandContext,
  campaignId: string,
  input: {
    eventType: string;
    venue?: string;
    eventStartAt: string;
    eventEndAt: string;
    supplierReferences?: unknown;
    registrationPolicy?: unknown;
    deliveryNotes?: string;
  }
) {
  assertPermission(context, 'marketing.event.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection);
    if (campaign.campaignType !== 'EVENT') {
      throw new Error('Event profile requires an EVENT Campaign.');
    }
    const start = timestamp(input.eventStartAt, 'Event start');
    const end = timestamp(input.eventEndAt, 'Event end');
    if (!start || !end || end <= start) throw new Error('Event end must be after event start.');
    await executeMutation(
      `INSERT INTO communications_event_profiles
        (campaign_id,tenant_id,event_type,venue,event_start_at,event_end_at,supplier_references_json,
         registration_policy_json,delivery_notes,outcome_summary,event_status,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,NULL,'PLANNED',?)
       ON DUPLICATE KEY UPDATE event_type=VALUES(event_type),venue=VALUES(venue),
         event_start_at=VALUES(event_start_at),event_end_at=VALUES(event_end_at),
         supplier_references_json=VALUES(supplier_references_json),
         registration_policy_json=VALUES(registration_policy_json),
         delivery_notes=VALUES(delivery_notes),
         event_status=CASE WHEN event_status='COMPLETED' THEN event_status ELSE 'PLANNED' END,
         updated_at=VALUES(updated_at)`,
      [
        campaign.id,
        context.tenantId,
        code(input.eventType, 'Event type'),
        input.venue?.trim() || null,
        start,
        end,
        json(input.supplierReferences),
        json(input.registrationPolicy),
        input.deliveryNotes?.trim() || null,
        now()
      ],
      connection
    );
  });
}

export async function getMarketingEvent(context: CommandContext, campaignId: string) {
  assertPermission(context, 'marketing.read');
  return (
    (await queryOne<
      RowDataPacket & {
        campaignId: string;
        eventType: string;
        venue: string | null;
        eventStartAt: string;
        eventEndAt: string;
        supplierReferences: unknown;
        registrationPolicy: unknown;
        deliveryNotes: string | null;
        outcomeSummary: string | null;
        eventStatus: string;
        updatedAt: string;
      }
    >(
      `SELECT campaign_id AS campaignId,event_type AS eventType,venue,event_start_at AS eventStartAt,
              event_end_at AS eventEndAt,supplier_references_json AS supplierReferences,
              registration_policy_json AS registrationPolicy,delivery_notes AS deliveryNotes,
              outcome_summary AS outcomeSummary,event_status AS eventStatus,updated_at AS updatedAt
         FROM communications_event_profiles
        WHERE campaign_id=? AND tenant_id=?`,
      [campaignId, context.tenantId]
    )) ?? null
  );
}

export async function registerMarketingEventParticipant(
  context: CommandContext,
  campaignId: string,
  subject: PrivacySubject,
  input: { registrationReference: string; sourceReference?: string }
) {
  assertPermission(context, 'marketing.event.manage');
  return dbTransaction(async (connection) => {
    const campaign = await getCommunicationsCampaign(context, campaignId, connection);
    if (campaign.campaignType !== 'EVENT')
      throw new Error('Registration requires an EVENT Campaign.');
    const event = await queryOne<RowDataPacket & { eventStatus: string }>(
      'SELECT event_status AS eventStatus FROM communications_event_profiles WHERE campaign_id=? AND tenant_id=?',
      [campaign.id, context.tenantId],
      connection
    );
    if (!event) throw new Error('Event profile is not configured.');
    if (event.eventStatus === 'COMPLETED')
      throw new Error('Completed Events cannot accept registrations.');
    if (subject.subjectType === 'PARTY') {
      await assertActiveParty(context, subject.subjectId, connection);
    } else {
      const lead = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM leads WHERE id=? AND tenant_id=?',
        [subject.subjectId, context.tenantId],
        connection
      );
      if (!lead) throw new Error('Event Lead subject not found.');
    }
    const id = randomUUID();
    await executeMutation(
      `INSERT INTO communications_event_registrations
        (id,tenant_id,campaign_id,party_id,lead_id,registration_status,registration_reference,
         registered_at,attended_at,source_reference)
       VALUES (?,?,?,?,?,'REGISTERED',?,?,NULL,?)`,
      [
        id,
        context.tenantId,
        campaign.id,
        subject.subjectType === 'PARTY' ? subject.subjectId : null,
        subject.subjectType === 'LEAD' ? subject.subjectId : null,
        code(input.registrationReference, 'Registration reference', 191),
        now(),
        input.sourceReference?.trim() || null
      ],
      connection
    );
    return id;
  });
}

export async function listMarketingEventRegistrations(context: CommandContext, campaignId: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      partyId: string | null;
      leadId: string | null;
      registrationStatus: string;
      registrationReference: string;
      registeredAt: string;
      attendedAt: string | null;
      sourceReference: string | null;
    }
  >(
    `SELECT id,party_id AS partyId,lead_id AS leadId,registration_status AS registrationStatus,
            registration_reference AS registrationReference,registered_at AS registeredAt,
            attended_at AS attendedAt,source_reference AS sourceReference
       FROM communications_event_registrations
      WHERE tenant_id=? AND campaign_id=?
      ORDER BY registered_at DESC,id DESC`,
    [context.tenantId, campaignId]
  );
}

export async function markMarketingEventAttendance(
  context: CommandContext,
  registrationId: string
) {
  assertPermission(context, 'marketing.event.manage');
  const attendedAt = now();
  const result = await executeMutation(
    `UPDATE communications_event_registrations
        SET registration_status='ATTENDED',attended_at=?
      WHERE id=? AND tenant_id=? AND registration_status='REGISTERED'`,
    [attendedAt, registrationId, context.tenantId]
  );
  if (result.affectedRows !== 1)
    throw new Error('Only registered participants can be marked attended.');
}

export async function completeMarketingEvent(
  context: CommandContext,
  campaignId: string,
  outcomeSummary: string
) {
  assertPermission(context, 'marketing.event.manage');
  const completedAt = now();
  const result = await executeMutation(
    `UPDATE communications_event_profiles
        SET event_status='COMPLETED',outcome_summary=?,updated_at=?
      WHERE campaign_id=? AND tenant_id=? AND event_status <> 'COMPLETED'`,
    [required(outcomeSummary, 'Event outcome summary'), completedAt, campaignId, context.tenantId]
  );
  if (result.affectedRows !== 1) throw new Error('Event profile not found or already completed.');
}
