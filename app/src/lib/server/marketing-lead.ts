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
import {
  assertActiveCurrency,
  assertActiveParty,
  code,
  domainEvidence,
  finiteNumber,
  now,
  required
} from '$lib/server/marketing-runtime';
import { evaluateMarketingEligibility } from '$lib/server/privacy-evidence';

export type Lead = {
  id: string;
  leadRef: string;
  sourceType: string;
  sourceCampaignId: string | null;
  sourceCommunicationItemId: string | null;
  sourceReference: string | null;
  resolvedPartyId: string | null;
  resolvedPartyRelationshipId: string | null;
  prospectName: string;
  organisationName: string | null;
  email: string | null;
  phone: string | null;
  geography: string | null;
  sector: string | null;
  needSummary: string;
  estimatedValueLow: string | null;
  estimatedValueHigh: string | null;
  currencyId: string | null;
  ownerPartyId: string;
  status: string;
  score: string;
  aggregateVersion: number;
  qualifiedAt: string | null;
  disqualifiedAt: string | null;
  transferredAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

const leadSelect =
  'SELECT id,lead_ref AS leadRef,source_type AS sourceType,source_campaign_id AS sourceCampaignId,source_communication_item_id AS sourceCommunicationItemId,source_reference AS sourceReference,resolved_party_id AS resolvedPartyId,resolved_party_relationship_id AS resolvedPartyRelationshipId,prospect_name AS prospectName,organisation_name AS organisationName,email,phone,geography,sector,need_summary AS needSummary,estimated_value_low AS estimatedValueLow,estimated_value_high AS estimatedValueHigh,currency_id AS currencyId,owner_party_id AS ownerPartyId,status,score,aggregate_version AS aggregateVersion,qualified_at AS qualifiedAt,disqualified_at AS disqualifiedAt,transferred_at AS transferredAt,closed_at AS closedAt,updated_at AS updatedAt FROM leads';

export async function getLead(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertPermission(context, 'marketing.read');
  const row = await queryOne<RowDataPacket & Lead>(
    leadSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Lead not found.');
  return row;
}

export async function listLeads(context: CommandContext, status?: string) {
  assertPermission(context, 'marketing.read');
  const state = status?.trim() ? code(status, 'Lead status') : null;
  return queryRows<RowDataPacket & Lead>(
    leadSelect +
      ' WHERE tenant_id=?' +
      (state ? ' AND status=?' : '') +
      ' ORDER BY updated_at DESC,score DESC,lead_ref',
    state ? [context.tenantId, state] : [context.tenantId]
  );
}

export async function listLeadScoreEvents(context: CommandContext, leadId: string) {
  assertPermission(context, 'marketing.read');
  await getLead(context, leadId);
  return queryRows<
    RowDataPacket & {
      id: string;
      scoreDelta: string;
      scoreAfter: string;
      reasonCode: string;
      reason: string;
      evidenceReference: string | null;
      occurredAt: string;
    }
  >(
    `SELECT id,score_delta AS scoreDelta,score_after AS scoreAfter,reason_code AS reasonCode,
            reason,evidence_reference AS evidenceReference,occurred_at AS occurredAt
       FROM lead_score_events
      WHERE tenant_id=? AND lead_id=?
      ORDER BY occurred_at DESC,id DESC`,
    [context.tenantId, leadId]
  );
}

export async function listLeadNurtureEvents(context: CommandContext, leadId: string) {
  assertPermission(context, 'marketing.read');
  await getLead(context, leadId);
  return queryRows<
    RowDataPacket & {
      id: string;
      campaignId: string | null;
      interactionType: string;
      channel: string;
      summary: string;
      evidenceReference: string | null;
      occurredAt: string;
    }
  >(
    `SELECT id,campaign_id AS campaignId,interaction_type AS interactionType,channel,summary,
            evidence_reference AS evidenceReference,occurred_at AS occurredAt
       FROM lead_nurture_events
      WHERE tenant_id=? AND lead_id=?
      ORDER BY occurred_at DESC,id DESC`,
    [context.tenantId, leadId]
  );
}

export async function listLeadSalesHandoffs(context: CommandContext, leadId?: string) {
  assertPermission(context, 'marketing.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      leadId: string;
      leadVersion: number;
      handoffRef: string;
      qualificationSummary: string;
      status: string;
      opportunityId: string | null;
      requestedAt: string;
      acceptedAt: string | null;
      rejectedAt: string | null;
      rejectionReason: string | null;
    }
  >(
    `SELECT id,lead_id AS leadId,lead_version AS leadVersion,handoff_ref AS handoffRef,
            qualification_summary AS qualificationSummary,status,opportunity_id AS opportunityId,
            requested_at AS requestedAt,accepted_at AS acceptedAt,rejected_at AS rejectedAt,
            rejection_reason AS rejectionReason
       FROM lead_sales_handoffs
      WHERE tenant_id=?${leadId?.trim() ? ' AND lead_id=?' : ''}
      ORDER BY requested_at DESC,id DESC`,
    leadId?.trim() ? [context.tenantId, leadId.trim()] : [context.tenantId]
  );
}

export async function createLead(
  context: CommandContext,
  input: {
    leadRef: string;
    sourceType: string;
    sourceCampaignId?: string;
    sourceCommunicationItemId?: string;
    sourceReference?: string;
    prospectName: string;
    organisationName?: string;
    email?: string;
    phone?: string;
    geography?: string;
    sector?: string;
    needSummary: string;
    estimatedValueLow?: number;
    estimatedValueHigh?: number;
    currencyId?: string;
    ownerPartyId?: string;
  }
) {
  assertPermission(context, 'marketing.lead.manage');
  const id = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);

    const campaignId = input.sourceCampaignId?.trim() || null;
    if (campaignId) {
      const campaign = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM communications_campaigns WHERE id=? AND tenant_id=?',
        [campaignId, context.tenantId],
        connection
      );
      if (!campaign) throw new Error('Lead source Campaign not found.');
    }

    const communicationItemId = input.sourceCommunicationItemId?.trim() || null;
    if (communicationItemId) {
      const item = await queryOne<RowDataPacket & { id: string; campaignId: string }>(
        'SELECT id,campaign_id AS campaignId FROM communication_items WHERE id=? AND tenant_id=?',
        [communicationItemId, context.tenantId],
        connection
      );
      if (!item) throw new Error('Lead source Communication Item not found.');
      if (campaignId && item.campaignId !== campaignId) {
        throw new Error('Lead source Communication Item does not belong to the selected Campaign.');
      }
    }

    const low = finiteNumber(input.estimatedValueLow, 'Lead estimated value low');
    const high = finiteNumber(input.estimatedValueHigh, 'Lead estimated value high');
    if (low != null && low < 0) throw new Error('Lead estimated value low cannot be negative.');
    if (high != null && high < 0) throw new Error('Lead estimated value high cannot be negative.');
    if (low != null && high != null && high < low) {
      throw new Error('Lead estimated value high cannot be below the low estimate.');
    }
    const currencyId = input.currencyId?.trim() || null;
    if (currencyId) await assertActiveCurrency(context, currencyId, connection);

    await executeMutation(
      `INSERT INTO leads
        (id,tenant_id,lead_ref,source_type,source_campaign_id,source_communication_item_id,source_reference,
         resolved_party_id,resolved_party_relationship_id,prospect_name,organisation_name,email,phone,
         geography,sector,need_summary,estimated_value_low,estimated_value_high,currency_id,owner_party_id,
         status,score,aggregate_version,qualified_at,disqualified_at,transferred_at,closed_at,
         created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,NULL,NULL,?,?,?,?,?,?,?,?,?,?,?,'NEW',0,1,NULL,NULL,NULL,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.leadRef, 'Lead reference', 191),
        code(input.sourceType, 'Lead source type'),
        campaignId,
        communicationItemId,
        input.sourceReference?.trim() || null,
        required(input.prospectName, 'Prospect name', 500),
        input.organisationName?.trim() || null,
        input.email?.trim() || null,
        input.phone?.trim() || null,
        input.geography?.trim() || null,
        input.sector?.trim() || null,
        required(input.needSummary, 'Lead need summary'),
        low,
        high,
        currencyId,
        ownerPartyId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'LEAD_CAPTURED',
        topic: 'nublox.crm.lead',
        toState: 'NEW',
        payload: {
          sourceType: code(input.sourceType, 'Lead source type'),
          sourceCampaignId: campaignId,
          sourceCommunicationItemId: communicationItemId
        }
      },
      connection
    );
    return id;
  });
}

export async function enrichLead(
  context: CommandContext,
  leadId: string,
  expectedVersion: number,
  input: {
    prospectName?: string;
    organisationName?: string;
    email?: string;
    phone?: string;
    geography?: string;
    sector?: string;
    needSummary?: string;
    resolvedPartyId?: string;
    resolvedPartyRelationshipId?: string;
  }
) {
  assertPermission(context, 'marketing.lead.manage');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (['DISQUALIFIED', 'TRANSFERRED', 'CLOSED'].includes(lead.status)) {
      throw new Error('Lead can no longer be enriched in its current lifecycle state.');
    }

    const partyId = input.resolvedPartyId?.trim() || null;
    if (partyId) await assertActiveParty(context, partyId, connection);

    const relationshipId = input.resolvedPartyRelationshipId?.trim() || null;
    if (relationshipId) {
      const relationship = await queryOne<
        RowDataPacket & { id: string; fromPartyId: string; toPartyId: string }
      >(
        `SELECT id,from_party_id AS fromPartyId,to_party_id AS toPartyId
           FROM party_relationships
          WHERE id=? AND tenant_id=?`,
        [relationshipId, context.tenantId],
        connection
      );
      if (!relationship) throw new Error('Lead Party Relationship not found.');
      if (partyId && relationship.fromPartyId !== partyId && relationship.toPartyId !== partyId) {
        throw new Error('Lead Party Relationship does not include the resolved Party.');
      }
    }

    const updatedAt = now();
    await executeMutation(
      `UPDATE leads
          SET prospect_name=COALESCE(?,prospect_name),organisation_name=COALESCE(?,organisation_name),
              email=COALESCE(?,email),phone=COALESCE(?,phone),geography=COALESCE(?,geography),
              sector=COALESCE(?,sector),need_summary=COALESCE(?,need_summary),
              resolved_party_id=COALESCE(?,resolved_party_id),
              resolved_party_relationship_id=COALESCE(?,resolved_party_relationship_id),
              status=CASE WHEN status='NEW' THEN 'QUALIFYING' ELSE status END,
              aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [
        input.prospectName?.trim() || null,
        input.organisationName?.trim() || null,
        input.email?.trim() || null,
        input.phone?.trim() || null,
        input.geography?.trim() || null,
        input.sector?.trim() || null,
        input.needSummary?.trim() || null,
        partyId,
        relationshipId,
        updatedAt,
        lead.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );

    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_ENRICHED',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: lead.status === 'NEW' ? 'QUALIFYING' : lead.status,
        payload: { resolvedPartyId: partyId, resolvedPartyRelationshipId: relationshipId }
      },
      connection
    );
  });
}

export async function scoreLead(
  context: CommandContext,
  leadId: string,
  expectedVersion: number,
  input: {
    scoreDelta: number;
    reasonCode: string;
    reason: string;
    evidenceReference?: string;
  }
) {
  assertPermission(context, 'marketing.lead.manage');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (['DISQUALIFIED', 'TRANSFERRED', 'CLOSED'].includes(lead.status)) {
      throw new Error('Lead can no longer be scored.');
    }
    const delta = finiteNumber(input.scoreDelta, 'Lead score delta');
    if (delta == null || delta < -100 || delta > 100) {
      throw new Error('Lead score delta must be between -100 and 100.');
    }
    const current = Number(lead.score);
    const scoreAfter = Math.max(0, Math.min(100, current + delta));
    const occurredAt = now();
    await executeMutation(
      `INSERT INTO lead_score_events
        (id,tenant_id,lead_id,score_delta,score_after,reason_code,reason,evidence_reference,
         occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(),
        context.tenantId,
        lead.id,
        delta,
        scoreAfter,
        code(input.reasonCode, 'Lead score reason code'),
        required(input.reason, 'Lead score reason'),
        input.evidenceReference?.trim() || null,
        occurredAt,
        context.actorPartyId
      ],
      connection
    );
    await executeMutation(
      `UPDATE leads
          SET score=?,status=CASE WHEN status='NEW' THEN 'QUALIFYING' ELSE status END,
              aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [scoreAfter, occurredAt, lead.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_SCORED',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: lead.status === 'NEW' ? 'QUALIFYING' : lead.status,
        payload: { scoreDelta: delta, scoreAfter }
      },
      connection
    );
    return scoreAfter;
  });
}

export async function nurtureLead(
  context: CommandContext,
  leadId: string,
  input: {
    campaignId?: string;
    interactionType: string;
    channel: string;
    summary: string;
    evidenceReference?: string;
    purposeKey?: string;
    lawfulBasis?: 'CONSENT' | 'LEGITIMATE_INTEREST';
  }
) {
  assertPermission(context, 'marketing.lead.manage');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection);
    if (['DISQUALIFIED', 'TRANSFERRED', 'CLOSED'].includes(lead.status)) {
      throw new Error('Lead can no longer be nurtured.');
    }
    const channel = code(input.channel, 'Lead nurture channel');
    if (input.purposeKey && input.lawfulBasis) {
      const eligibility = await evaluateMarketingEligibility(
        context,
        { subjectType: 'LEAD', subjectId: lead.id },
        {
          purposeKey: input.purposeKey,
          channel,
          lawfulBasis: input.lawfulBasis
        },
        connection
      );
      if (!eligibility.eligible) {
        throw new Error('Lead is not eligible for marketing nurture: ' + eligibility.reason);
      }
    }
    const campaignId = input.campaignId?.trim() || null;
    if (campaignId) {
      const campaign = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM communications_campaigns WHERE id=? AND tenant_id=?',
        [campaignId, context.tenantId],
        connection
      );
      if (!campaign) throw new Error('Lead nurture Campaign not found.');
    }
    await executeMutation(
      `INSERT INTO lead_nurture_events
        (id,tenant_id,lead_id,campaign_id,interaction_type,channel,summary,evidence_reference,
         occurred_at,recorded_by_party_id)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        randomUUID(),
        context.tenantId,
        lead.id,
        campaignId,
        code(input.interactionType, 'Lead nurture interaction type'),
        channel,
        required(input.summary, 'Lead nurture summary'),
        input.evidenceReference?.trim() || null,
        now(),
        context.actorPartyId
      ],
      connection
    );
  });
}

export async function qualifyLead(
  context: CommandContext,
  leadId: string,
  expectedVersion: number,
  qualificationSummary: string
) {
  assertPermission(context, 'marketing.lead.qualify');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (!['NEW', 'QUALIFYING'].includes(lead.status)) {
      throw new Error('Only new or qualifying Leads can be qualified.');
    }
    if (!lead.email && !lead.phone && !lead.resolvedPartyId) {
      throw new Error('Lead qualification requires contact or resolved Party context.');
    }
    const qualifiedAt = now();
    await executeMutation(
      `UPDATE leads
          SET status='QUALIFIED',qualified_at=?,aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [qualifiedAt, qualifiedAt, lead.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_QUALIFIED',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: 'QUALIFIED',
        payload: { qualificationSummary: required(qualificationSummary, 'Qualification summary') }
      },
      connection
    );
  });
}

export async function disqualifyLead(
  context: CommandContext,
  leadId: string,
  expectedVersion: number,
  reason: string
) {
  assertPermission(context, 'marketing.lead.qualify');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (!['NEW', 'QUALIFYING', 'QUALIFIED'].includes(lead.status)) {
      throw new Error('Lead cannot be disqualified in its current state.');
    }
    const disqualifiedAt = now();
    await executeMutation(
      `UPDATE leads
          SET status='DISQUALIFIED',disqualified_at=?,aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [disqualifiedAt, disqualifiedAt, lead.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_DISQUALIFIED',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: 'DISQUALIFIED',
        payload: { reason: required(reason, 'Disqualification reason') }
      },
      connection
    );
  });
}

export async function transferQualifiedLeadToSales(
  context: CommandContext,
  leadId: string,
  expectedVersion: number,
  input: { handoffRef: string; qualificationSummary: string }
) {
  assertPermission(context, 'marketing.lead.qualify');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (lead.status !== 'QUALIFIED') throw new Error('Only qualified Leads can transfer to Sales.');
    const handoffId = randomUUID();
    const transferredAt = now();
    await executeMutation(
      `INSERT INTO lead_sales_handoffs
        (id,tenant_id,lead_id,lead_version,handoff_ref,qualification_summary,requested_by_party_id,
         status,opportunity_id,requested_at,accepted_at,rejected_at,rejection_reason)
       VALUES (?,?,?,?,?,?,?,'READY',NULL,?,NULL,NULL,NULL)`,
      [
        handoffId,
        context.tenantId,
        lead.id,
        lead.aggregateVersion,
        code(input.handoffRef, 'Lead handoff reference', 191),
        required(input.qualificationSummary, 'Lead qualification summary'),
        context.actorPartyId,
        transferredAt
      ],
      connection
    );
    await executeMutation(
      `UPDATE leads
          SET status='TRANSFERRED',transferred_at=?,aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [transferredAt, transferredAt, lead.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_TRANSFERRED_TO_SALES',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: 'TRANSFERRED',
        payload: {
          handoffId,
          handoffRef: code(input.handoffRef, 'Lead handoff reference', 191),
          leadVersion: lead.aggregateVersion
        }
      },
      connection
    );
    return handoffId;
  });
}

export async function closeLead(
  context: CommandContext,
  leadId: string,
  expectedVersion: number
) {
  assertPermission(context, 'marketing.lead.manage');
  return dbTransaction(async (connection) => {
    const lead = await getLead(context, leadId, connection, true);
    if (lead.aggregateVersion !== expectedVersion) throw new Error('Lead changed.');
    if (!['DISQUALIFIED', 'TRANSFERRED'].includes(lead.status)) {
      throw new Error('Only disqualified or transferred Leads can be closed.');
    }
    const closedAt = now();
    await executeMutation(
      `UPDATE leads
          SET status='CLOSED',closed_at=?,aggregate_version=aggregate_version+1,updated_at=?
        WHERE id=? AND tenant_id=? AND aggregate_version=?`,
      [closedAt, closedAt, lead.id, context.tenantId, expectedVersion],
      connection
    );
    await domainEvidence(
      context,
      {
        aggregateId: 'AGG-03-LEAD',
        aggregateType: 'Lead',
        objectType: 'lead',
        objectId: lead.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'LEAD_CLOSED',
        topic: 'nublox.crm.lead',
        fromState: lead.status,
        toState: 'CLOSED'
      },
      connection
    );
  });
}
