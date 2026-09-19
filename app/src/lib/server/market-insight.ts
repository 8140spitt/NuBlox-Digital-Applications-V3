import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { error } from '@sveltejs/kit';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { hasPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type MarketInsight = {
  id: string;
  insightRef: string;
  insightType: string;
  title: string;
  subject: string;
  sourceType: string;
  sourceReference: string | null;
  asOfAt: string;
  confidence: string;
  geography: string | null;
  sector: string | null;
  problemStatement: string;
  needStatement: string;
  desiredOutcome: string | null;
  evidenceReference: string | null;
  status: string;
  aggregateVersion: number;
  supersedesInsightId: string | null;
  validatedAt: string | null;
  updatedAt: string;
};

const marketInsightSelect =
  'SELECT id,insight_ref AS insightRef,insight_type AS insightType,title,subject,source_type AS sourceType,source_reference AS sourceReference,as_of_at AS asOfAt,confidence,geography,sector,problem_statement AS problemStatement,need_statement AS needStatement,desired_outcome AS desiredOutcome,evidence_reference AS evidenceReference,status,aggregate_version AS aggregateVersion,supersedes_insight_id AS supersedesInsightId,validated_at AS validatedAt,updated_at AS updatedAt FROM market_insights';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string, max = 5000) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  if (clean.length > max) throw new Error(label + ' is too long.');
  return clean;
}

function code(value: string, label: string, max = 64) {
  const clean = required(value, label, max).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function timestamp(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return now();
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function assertMarketInsightRead(context: CommandContext) {
  if (
    !hasPermission(context, 'product.innovation.read') &&
    !hasPermission(context, 'marketing.read')
  ) {
    error(403, 'Permission denied: marketing.read');
  }
}

function assertMarketInsightManage(context: CommandContext) {
  if (
    !hasPermission(context, 'product.market_need.manage') &&
    !hasPermission(context, 'marketing.intelligence.manage')
  ) {
    error(403, 'Permission denied: marketing.intelligence.manage');
  }
}

export async function getMarketInsight(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  assertMarketInsightRead(context);
  const row = await queryOne<RowDataPacket & MarketInsight>(
    marketInsightSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Market Insight not found.');
  return row;
}

export async function listMarketInsights(context: CommandContext) {
  assertMarketInsightRead(context);
  return queryRows<RowDataPacket & MarketInsight>(
    marketInsightSelect + ' WHERE tenant_id=? ORDER BY as_of_at DESC,insight_ref',
    [context.tenantId]
  );
}

export async function createMarketInsight(
  context: CommandContext,
  input: {
    insightRef: string;
    insightType?: string;
    title: string;
    subject: string;
    sourceType: string;
    sourceReference?: string;
    asOfAt?: string;
    confidence?: string;
    geography?: string;
    sector?: string;
    problemStatement: string;
    needStatement: string;
    desiredOutcome?: string;
    evidenceReference?: string;
    supersedesInsightId?: string;
  }
) {
  assertMarketInsightManage(context);
  const id = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const supersedesInsightId = input.supersedesInsightId?.trim() || null;
    if (supersedesInsightId) await getMarketInsight(context, supersedesInsightId, connection);

    await executeMutation(
      `INSERT INTO market_insights
        (id,tenant_id,insight_ref,insight_type,title,subject,source_type,source_reference,as_of_at,
         confidence,geography,sector,problem_statement,need_statement,desired_outcome,evidence_reference,
         status,aggregate_version,supersedes_insight_id,created_by_party_id,validated_by_party_id,
         validated_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'CAPTURED',1,?,?,NULL,NULL,?,?)`,
      [
        id,
        context.tenantId,
        code(input.insightRef, 'Insight reference', 191),
        code(input.insightType || 'CUSTOMER_NEED', 'Insight type'),
        required(input.title, 'Insight title', 500),
        required(input.subject, 'Insight subject'),
        code(input.sourceType, 'Source type'),
        input.sourceReference?.trim() || null,
        timestamp(input.asOfAt, 'As-of time'),
        code(input.confidence || 'MEDIUM', 'Confidence'),
        input.geography?.trim() || null,
        input.sector?.trim() || null,
        required(input.problemStatement, 'Problem statement'),
        required(input.needStatement, 'Need statement'),
        input.desiredOutcome?.trim() || null,
        input.evidenceReference?.trim() || null,
        supersedesInsightId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    if (supersedesInsightId) {
      await executeMutation(
        "UPDATE market_insights SET status='SUPERSEDED',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND status <> 'SUPERSEDED'",
        [createdAt, supersedesInsightId, context.tenantId],
        connection
      );
    }

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        objectType: 'market_insight',
        objectId: id,
        action: 'MARKET_INSIGHT_CAPTURED',
        toState: 'CAPTURED'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketInsight',
        aggregateObjectId: id,
        aggregateVersion: 1,
        eventType: 'MARKET_INSIGHT_CAPTURED',
        topic: 'nublox.market.insight',
        payload: {
          insightType: code(input.insightType || 'CUSTOMER_NEED', 'Insight type')
        }
      },
      connection
    );

    return id;
  });
}

export async function validateMarketInsight(
  context: CommandContext,
  insightId: string,
  expectedVersion: number
) {
  assertMarketInsightManage(context);
  return dbTransaction(async (connection) => {
    const insight = await getMarketInsight(context, insightId, connection, true);
    if (insight.aggregateVersion !== expectedVersion) throw new Error('Market Insight changed.');
    if (insight.status !== 'CAPTURED') {
      throw new Error('Only captured Market Insights can be validated.');
    }
    const updatedAt = now();
    await executeMutation(
      "UPDATE market_insights SET status='VALIDATED',aggregate_version=aggregate_version+1,validated_by_party_id=?,validated_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [context.actorPartyId, updatedAt, updatedAt, insight.id, context.tenantId, expectedVersion],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        objectType: 'market_insight',
        objectId: insight.id,
        action: 'MARKET_INSIGHT_VALIDATED',
        fromState: insight.status,
        toState: 'VALIDATED'
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketInsight',
        aggregateObjectId: insight.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'MARKET_INSIGHT_VALIDATED',
        topic: 'nublox.market.insight',
        payload: {}
      },
      connection
    );
  });
}
