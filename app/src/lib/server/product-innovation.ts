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
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { assertWorkDecisionReference } from '$lib/server/work-decision';

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

export type ProductItem = {
  id: string;
  itemNumber: string;
  itemType: string;
  name: string;
  description: string;
  classificationCode: string | null;
  baseUomId: string | null;
  status: string;
  aggregateVersion: number;
  updatedAt: string;
  conceptType?: string | null;
  needSummary?: string | null;
  opportunitySummary?: string | null;
  feasibilitySummary?: string | null;
  score?: string | null;
  conceptStatus?: string | null;
  selectedDecisionId?: string | null;
  selectedAt?: string | null;
};

export type ProductConfigurationModel = {
  id: string;
  modelRef: string;
  itemId: string;
  title: string;
  definitionScope: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  releasedAt: string | null;
  updatedAt: string;
};

export type ProductConfigurationVersion = {
  id: string;
  modelId: string;
  versionNo: number;
  lifecycleStatus: string;
  designSummary: string;
  definition: unknown;
  specification: unknown;
  validationCriteria: string;
  prototypeBasis: unknown;
  createdAt: string;
  releasedAt: string | null;
};

export type ProductBusinessCase = {
  id: string;
  caseRef: string;
  caseType: string;
  title: string;
  sponsorPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  approvalDecisionId: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
  caseDomain: string;
  portfolioBucket: string;
  itemId: string | null;
  primaryMarketInsightId: string | null;
  innovationStage: string | null;
};

export type ProductBusinessCaseVersion = {
  id: string;
  businessCaseId: string;
  versionNo: number;
  lifecycleStatus: string;
  objectivesNeed: string;
  options: unknown;
  benefits: unknown;
  costFundingBasis: unknown;
  risks: unknown;
  assumptions: unknown;
  transactionStructure: unknown;
  negotiatedTerms: unknown;
  recommendation: string;
  demandForecast: unknown;
  roi: unknown;
  marketBasis: unknown;
  productScope: unknown;
  fundingEnvelope: unknown;
  createdAt: string;
};

const marketInsightSelect =
  'SELECT id,insight_ref AS insightRef,insight_type AS insightType,title,subject,source_type AS sourceType,source_reference AS sourceReference,as_of_at AS asOfAt,confidence,geography,sector,problem_statement AS problemStatement,need_statement AS needStatement,desired_outcome AS desiredOutcome,evidence_reference AS evidenceReference,status,aggregate_version AS aggregateVersion,supersedes_insight_id AS supersedesInsightId,validated_at AS validatedAt,updated_at AS updatedAt FROM market_insights';

const itemSelect =
  'SELECT i.id,i.item_number AS itemNumber,i.item_type AS itemType,i.name,i.description,i.classification_code AS classificationCode,i.base_uom_id AS baseUomId,i.status,i.aggregate_version AS aggregateVersion,i.updated_at AS updatedAt,p.concept_type AS conceptType,p.need_summary AS needSummary,p.opportunity_summary AS opportunitySummary,p.feasibility_summary AS feasibilitySummary,p.score,p.concept_status AS conceptStatus,p.selected_decision_id AS selectedDecisionId,p.selected_at AS selectedAt FROM items i LEFT JOIN item_concept_profiles p ON p.item_id=i.id AND p.tenant_id=i.tenant_id';

const configurationSelect =
  'SELECT id,model_ref AS modelRef,item_id AS itemId,title,definition_scope AS definitionScope,status,aggregate_version AS aggregateVersion,current_version_no AS currentVersionNo,released_at AS releasedAt,updated_at AS updatedAt FROM product_configuration_models';

const businessCaseSelect =
  'SELECT bc.id,bc.case_ref AS caseRef,bc.case_type AS caseType,bc.title,bc.sponsor_party_id AS sponsorPartyId,bc.status,bc.aggregate_version AS aggregateVersion,bc.current_version_no AS currentVersionNo,bc.approval_decision_id AS approvalDecisionId,bc.approved_at AS approvedAt,bc.closed_at AS closedAt,bc.updated_at AS updatedAt,p.case_domain AS caseDomain,p.portfolio_bucket AS portfolioBucket,p.item_id AS itemId,p.primary_market_insight_id AS primaryMarketInsightId,p.innovation_stage AS innovationStage FROM business_cases bc JOIN product_service_business_case_profiles p ON p.business_case_id=bc.id AND p.tenant_id=bc.tenant_id';

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

function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

function optionalNumber(value: number | undefined | null, label: string) {
  if (value == null) return null;
  if (!Number.isFinite(value)) throw new Error(label + ' must be a finite number.');
  return value;
}

function timestamp(value: string | undefined, label: string) {
  const clean = value?.trim();
  if (!clean) return now();
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

async function evidence(
  context: CommandContext,
  input: {
    aggregateId: string;
    aggregateType: string;
    objectType: string;
    objectId: string;
    aggregateVersion: number;
    eventType: string;
    fromState?: string | null;
    toState?: string | null;
    payload?: Record<string, unknown>;
  },
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: input.aggregateId,
      objectType: input.objectType,
      objectId: input.objectId,
      action: input.eventType,
      fromState: input.fromState ?? undefined,
      toState: input.toState ?? undefined
    },
    executor
  );
  const topic =
    input.aggregateId === 'AGG-03-MARKET-INSIGHT'
      ? 'nublox.market.insight'
      : input.aggregateId === 'AGG-10-ITEM'
        ? 'nublox.item.lifecycle'
        : input.aggregateId === 'AGG-10-CONFIGURATION'
          ? 'nublox.product.configuration'
          : 'nublox.product.business-case';
  await emitBusinessEvent(
    context,
    {
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      aggregateObjectId: input.objectId,
      aggregateVersion: input.aggregateVersion,
      eventType: input.eventType,
      topic,
      payload: input.payload ?? {}
    },
    executor
  );
}

async function assertActiveParty(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Party not found in this tenant.');
}

async function assertActiveUom(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_units_of_measure WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Unit of Measure not found.');
}

async function assertActiveCurrency(context: CommandContext, id: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_currencies WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Currency not found.');
}

async function getMarketInsight(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & MarketInsight>(
    marketInsightSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Market Insight not found.');
  return row;
}

async function getItem(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ProductItem>(
    itemSelect + ' WHERE i.id=? AND i.tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Item not found.');
  return row;
}

async function getConfiguration(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ProductConfigurationModel>(
    configurationSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Product Configuration Model not found.');
  return row;
}

async function getConfigurationVersion(
  context: CommandContext,
  modelId: string,
  versionNo: number,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ProductConfigurationVersion>(
    'SELECT id,model_id AS modelId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,design_summary AS designSummary,definition_json AS definition,specification_json AS specification,validation_criteria AS validationCriteria,prototype_basis_json AS prototypeBasis,created_at AS createdAt,released_at AS releasedAt FROM product_configuration_versions WHERE tenant_id=? AND model_id=? AND version_no=?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, modelId, versionNo],
    executor
  );
  if (!row) throw new Error('Product Configuration version not found.');
  return row;
}

async function getBusinessCase(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ProductBusinessCase>(
    businessCaseSelect + ' WHERE bc.id=? AND bc.tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Product / Service Business Case not found.');
  return row;
}

async function getBusinessCaseVersion(
  context: CommandContext,
  businessCaseId: string,
  versionNo: number,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & ProductBusinessCaseVersion>(
    `SELECT v.id,v.business_case_id AS businessCaseId,v.version_no AS versionNo,v.lifecycle_status AS lifecycleStatus,
            v.objectives_need AS objectivesNeed,v.options_json AS options,v.benefits_json AS benefits,
            v.cost_funding_basis_json AS costFundingBasis,v.risks_json AS risks,v.assumptions_json AS assumptions,
            v.transaction_structure_json AS transactionStructure,v.negotiated_terms_json AS negotiatedTerms,
            v.recommendation,p.demand_forecast_json AS demandForecast,p.roi_json AS roi,
            p.market_basis_json AS marketBasis,p.product_scope_json AS productScope,
            p.funding_envelope_json AS fundingEnvelope,v.created_at AS createdAt
       FROM business_case_versions v
       JOIN product_service_business_case_version_profiles p
         ON p.business_case_version_id=v.id AND p.tenant_id=v.tenant_id
      WHERE v.tenant_id=? AND v.business_case_id=? AND v.version_no=?` +
      (forUpdate ? ' FOR UPDATE' : ''),
    [context.tenantId, businessCaseId, versionNo],
    executor
  );
  if (!row) throw new Error('Product / Service Business Case version not found.');
  return row;
}

function decisionTypeForCase(caseDomain: string) {
  return caseDomain === 'INNOVATION'
    ? 'INNOVATION_BUSINESS_CASE_APPROVAL'
    : 'PRODUCT_SERVICE_BUSINESS_CASE_APPROVAL';
}

export async function listMarketInsights(context: CommandContext) {
  assertPermission(context, 'product.innovation.read');
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
  assertPermission(context, 'product.market_need.manage');
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
    await evidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketInsight',
        objectType: 'market_insight',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'MARKET_INSIGHT_CAPTURED',
        toState: 'CAPTURED',
        payload: { insightType: code(input.insightType || 'CUSTOMER_NEED', 'Insight type') }
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
  assertPermission(context, 'product.market_need.manage');
  return dbTransaction(async (connection) => {
    const insight = await getMarketInsight(context, insightId, connection, true);
    if (insight.aggregateVersion !== expectedVersion) throw new Error('Market Insight changed.');
    if (insight.status !== 'CAPTURED') throw new Error('Only captured Market Insights can be validated.');
    const updatedAt = now();
    await executeMutation(
      "UPDATE market_insights SET status='VALIDATED',aggregate_version=aggregate_version+1,validated_by_party_id=?,validated_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [context.actorPartyId, updatedAt, updatedAt, insight.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-03-MARKET-INSIGHT',
        aggregateType: 'MarketInsight',
        objectType: 'market_insight',
        objectId: insight.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'MARKET_INSIGHT_VALIDATED',
        fromState: insight.status,
        toState: 'VALIDATED'
      },
      connection
    );
  });
}

export async function listItems(context: CommandContext, itemType?: string) {
  assertPermission(context, 'product.innovation.read');
  const type = itemType?.trim() ? code(itemType, 'Item type') : null;
  return queryRows<RowDataPacket & ProductItem>(
    itemSelect +
      ' WHERE i.tenant_id=?' +
      (type ? ' AND i.item_type=?' : '') +
      ' ORDER BY i.updated_at DESC,i.item_number',
    type ? [context.tenantId, type] : [context.tenantId]
  );
}

export async function listConceptAssessments(context: CommandContext, itemId: string) {
  assertPermission(context, 'product.innovation.read');
  await getItem(context, itemId);
  return queryRows<
    RowDataPacket & {
      id: string;
      assessmentType: string;
      rating: string | null;
      score: string | null;
      summary: string;
      evidenceReference: string | null;
      assessedAt: string;
    }
  >(
    'SELECT id,assessment_type AS assessmentType,rating,score,summary,evidence_reference AS evidenceReference,assessed_at AS assessedAt FROM item_concept_assessments WHERE tenant_id=? AND item_id=? ORDER BY assessed_at DESC,id DESC',
    [context.tenantId, itemId]
  );
}

export async function createProductServiceConcept(
  context: CommandContext,
  input: {
    itemNumber: string;
    conceptType: string;
    name: string;
    description: string;
    classificationCode?: string;
    baseUomId?: string;
    needSummary: string;
    opportunitySummary: string;
    scoreBasis?: unknown;
  }
) {
  assertPermission(context, 'product.concept.manage');
  const id = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const baseUomId = input.baseUomId?.trim() || null;
    if (baseUomId) await assertActiveUom(context, baseUomId, connection);
    const itemType = code(input.conceptType, 'Concept type');
    if (!['PRODUCT', 'SERVICE', 'PRODUCT_SERVICE'].includes(itemType)) {
      throw new Error('Concept type must be PRODUCT, SERVICE or PRODUCT_SERVICE.');
    }
    await executeMutation(
      `INSERT INTO items
        (id,tenant_id,item_number,item_type,name,description,classification_code,base_uom_id,status,
         aggregate_version,created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,'DRAFT',1,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.itemNumber, 'Item number', 191),
        itemType,
        required(input.name, 'Concept name', 500),
        required(input.description, 'Concept description'),
        input.classificationCode?.trim() || null,
        baseUomId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await executeMutation(
      `INSERT INTO item_concept_profiles
        (item_id,tenant_id,concept_type,need_summary,opportunity_summary,feasibility_summary,score,
         score_basis_json,concept_status,selected_decision_id,selected_at,created_at,updated_at)
       VALUES (?,?,?,?,?,NULL,NULL,?,'CAPTURED',NULL,NULL,?,?)`,
      [
        id,
        context.tenantId,
        itemType,
        required(input.needSummary, 'Need summary'),
        required(input.opportunitySummary, 'Opportunity summary'),
        json(input.scoreBasis),
        createdAt,
        createdAt
      ],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'PRODUCT_SERVICE_CONCEPT_CAPTURED',
        toState: 'DRAFT',
        payload: { itemNumber: code(input.itemNumber, 'Item number', 191), itemType }
      },
      connection
    );
    return id;
  });
}

export async function assessProductServiceConcept(
  context: CommandContext,
  itemId: string,
  expectedVersion: number,
  input: {
    assessmentType: string;
    rating?: string;
    score?: number;
    summary: string;
    evidenceReference?: string;
  }
) {
  assertPermission(context, 'product.concept.manage');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    if (item.aggregateVersion !== expectedVersion) throw new Error('Item changed.');
    if (item.status !== 'DRAFT' || item.conceptStatus === 'SELECTED') {
      throw new Error('Only unselected draft concepts can be assessed.');
    }
    const score = optionalNumber(input.score, 'Concept score');
    if (score != null && (score < 0 || score > 100)) {
      throw new Error('Concept score must be between 0 and 100.');
    }
    const assessmentType = code(input.assessmentType, 'Assessment type');
    const assessedAt = now();
    await executeMutation(
      'INSERT INTO item_concept_assessments (id,tenant_id,item_id,assessment_type,rating,score,summary,evidence_reference,assessed_by_party_id,assessed_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        item.id,
        assessmentType,
        input.rating?.trim() ? code(input.rating, 'Assessment rating') : null,
        score,
        required(input.summary, 'Assessment summary'),
        input.evidenceReference?.trim() || null,
        context.actorPartyId,
        assessedAt
      ],
      connection
    );
    await executeMutation(
      "UPDATE item_concept_profiles SET feasibility_summary=CASE WHEN ?='FEASIBILITY' THEN ? ELSE feasibility_summary END,score=COALESCE(?,score),concept_status='ASSESSED',updated_at=? WHERE item_id=? AND tenant_id=?",
      [assessmentType, required(input.summary, 'Assessment summary'), score, assessedAt, item.id, context.tenantId],
      connection
    );
    await executeMutation(
      'UPDATE items SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [assessedAt, item.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_SERVICE_CONCEPT_ASSESSED',
        fromState: item.conceptStatus || 'CAPTURED',
        toState: 'ASSESSED',
        payload: { assessmentType, score }
      },
      connection
    );
  });
}

export function conceptSelectionDecisionSubject(item: ProductItem) {
  return {
    decisionType: 'PRODUCT_SERVICE_CONCEPT_SELECTION',
    subjectType: 'ITEM',
    subjectId: item.id,
    subjectVersion: String(item.aggregateVersion)
  };
}

export async function applyConceptSelectionDecision(
  context: CommandContext,
  itemId: string,
  expectedVersion: number,
  decisionId: string
) {
  assertPermission(context, 'product.concept.approve');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    if (item.aggregateVersion !== expectedVersion) throw new Error('Item changed.');
    if (item.status !== 'DRAFT') throw new Error('Only draft concepts can be selected.');
    if (!['ASSESSED', 'CAPTURED'].includes(item.conceptStatus || '')) {
      throw new Error('Concept is not eligible for selection.');
    }
    await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'PRODUCT_SERVICE_CONCEPT_SELECTION',
        subjectType: 'ITEM',
        subjectId: item.id,
        subjectVersion: String(item.aggregateVersion),
        outcome: 'APPROVED'
      },
      connection
    );
    const updatedAt = now();
    await executeMutation(
      "UPDATE item_concept_profiles SET concept_status='SELECTED',selected_decision_id=?,selected_at=?,updated_at=? WHERE item_id=? AND tenant_id=?",
      [decisionId, updatedAt, updatedAt, item.id, context.tenantId],
      connection
    );
    await executeMutation(
      'UPDATE items SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [updatedAt, item.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_SERVICE_CONCEPT_SELECTED',
        fromState: item.conceptStatus,
        toState: 'SELECTED',
        payload: { decisionId }
      },
      connection
    );
  });
}

export async function listProductConfigurations(context: CommandContext, itemId?: string) {
  assertPermission(context, 'product.innovation.read');
  return queryRows<RowDataPacket & ProductConfigurationModel>(
    configurationSelect +
      ' WHERE tenant_id=?' +
      (itemId?.trim() ? ' AND item_id=?' : '') +
      ' ORDER BY updated_at DESC,model_ref',
    itemId?.trim() ? [context.tenantId, itemId.trim()] : [context.tenantId]
  );
}

export async function listProductConfigurationVersions(
  context: CommandContext,
  modelId: string
) {
  assertPermission(context, 'product.innovation.read');
  await getConfiguration(context, modelId);
  return queryRows<RowDataPacket & ProductConfigurationVersion>(
    'SELECT id,model_id AS modelId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,design_summary AS designSummary,definition_json AS definition,specification_json AS specification,validation_criteria AS validationCriteria,prototype_basis_json AS prototypeBasis,created_at AS createdAt,released_at AS releasedAt FROM product_configuration_versions WHERE tenant_id=? AND model_id=? ORDER BY version_no DESC',
    [context.tenantId, modelId]
  );
}

export async function listProductConfigurationRequirements(
  context: CommandContext,
  configurationVersionId: string
) {
  assertPermission(context, 'product.innovation.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      requirementType: string;
      subjectId: string;
      subjectVersion: string | null;
      traceabilityRole: string;
      validationStatus: string;
    }
  >(
    'SELECT id,requirement_type AS requirementType,subject_id AS subjectId,subject_version AS subjectVersion,traceability_role AS traceabilityRole,validation_status AS validationStatus FROM product_configuration_requirement_links WHERE tenant_id=? AND configuration_version_id=? ORDER BY requirement_type,subject_id',
    [context.tenantId, configurationVersionId]
  );
}

export async function listProductConfigurationTrials(
  context: CommandContext,
  configurationVersionId: string
) {
  assertPermission(context, 'product.innovation.read');
  return queryRows<
    RowDataPacket & {
      id: string;
      trialRef: string;
      trialType: string;
      hypothesis: string;
      method: string;
      successCriteria: string;
      outcome: string;
      resultSummary: string;
      evidenceReference: string | null;
      occurredAt: string;
    }
  >(
    'SELECT id,trial_ref AS trialRef,trial_type AS trialType,hypothesis,method,success_criteria AS successCriteria,outcome,result_summary AS resultSummary,evidence_reference AS evidenceReference,occurred_at AS occurredAt FROM product_configuration_trials WHERE tenant_id=? AND configuration_version_id=? ORDER BY occurred_at DESC,id DESC',
    [context.tenantId, configurationVersionId]
  );
}

export async function createProductConfiguration(
  context: CommandContext,
  input: {
    modelRef: string;
    itemId: string;
    title: string;
    definitionScope: string;
    designSummary: string;
    definition?: unknown;
    specification?: unknown;
    validationCriteria: string;
    prototypeBasis?: unknown;
  }
) {
  assertPermission(context, 'product.configuration.manage');
  const id = randomUUID();
  const versionId = randomUUID();
  const createdAt = now();
  return dbTransaction(async (connection) => {
    const item = await getItem(context, required(input.itemId, 'Item ID'), connection);
    if (item.conceptStatus !== 'SELECTED') {
      throw new Error('A Product Configuration Model requires a selected Product / Service Concept.');
    }
    await executeMutation(
      `INSERT INTO product_configuration_models
        (id,tenant_id,model_ref,item_id,title,definition_scope,status,aggregate_version,current_version_no,
         released_at,created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,'DRAFT',1,1,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.modelRef, 'Configuration model reference', 191),
        item.id,
        required(input.title, 'Configuration model title', 500),
        required(input.definitionScope, 'Definition scope'),
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await executeMutation(
      `INSERT INTO product_configuration_versions
        (id,tenant_id,model_id,version_no,lifecycle_status,design_summary,definition_json,
         specification_json,validation_criteria,prototype_basis_json,created_by_party_id,created_at,released_at)
       VALUES (?,?,?,1,'DRAFT',?,?,?,?,?,?,?,NULL)`,
      [
        versionId,
        context.tenantId,
        id,
        required(input.designSummary, 'Design summary'),
        json(input.definition),
        json(input.specification),
        required(input.validationCriteria, 'Validation criteria'),
        json(input.prototypeBasis),
        context.actorPartyId,
        createdAt
      ],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-CONFIGURATION',
        aggregateType: 'ProductConfigurationModel',
        objectType: 'product_configuration_model',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'PRODUCT_CONFIGURATION_CREATED',
        toState: 'DRAFT',
        payload: { itemId: item.id, versionNo: 1 }
      },
      connection
    );
    return id;
  });
}

export async function reviseProductConfiguration(
  context: CommandContext,
  modelId: string,
  expectedVersion: number,
  input: {
    designSummary: string;
    definition?: unknown;
    specification?: unknown;
    validationCriteria: string;
    prototypeBasis?: unknown;
  }
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const model = await getConfiguration(context, modelId, connection, true);
    if (model.aggregateVersion !== expectedVersion) throw new Error('Product Configuration changed.');
    const nextVersionNo = model.currentVersionNo + 1;
    const createdAt = now();
    await executeMutation(
      `INSERT INTO product_configuration_versions
        (id,tenant_id,model_id,version_no,lifecycle_status,design_summary,definition_json,
         specification_json,validation_criteria,prototype_basis_json,created_by_party_id,created_at,released_at)
       VALUES (?,?,?,?,'DRAFT',?,?,?,?,?,?,?,NULL)`,
      [
        randomUUID(),
        context.tenantId,
        model.id,
        nextVersionNo,
        required(input.designSummary, 'Design summary'),
        json(input.definition),
        json(input.specification),
        required(input.validationCriteria, 'Validation criteria'),
        json(input.prototypeBasis),
        context.actorPartyId,
        createdAt
      ],
      connection
    );
    await executeMutation(
      "UPDATE product_configuration_models SET status='DRAFT',aggregate_version=aggregate_version+1,current_version_no=?,released_at=NULL,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [nextVersionNo, createdAt, model.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-CONFIGURATION',
        aggregateType: 'ProductConfigurationModel',
        objectType: 'product_configuration_model',
        objectId: model.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_CONFIGURATION_REVISED',
        fromState: model.status,
        toState: 'DRAFT',
        payload: { versionNo: nextVersionNo }
      },
      connection
    );
    return nextVersionNo;
  });
}

async function currentMutableConfigurationVersion(
  context: CommandContext,
  modelId: string,
  executor: DbExecutor
) {
  const model = await getConfiguration(context, modelId, executor, true);
  const version = await getConfigurationVersion(
    context,
    model.id,
    model.currentVersionNo,
    executor,
    true
  );
  if (version.lifecycleStatus === 'RELEASED') {
    throw new Error('Released Product Configuration versions are immutable; create a successor version.');
  }
  return { model, version };
}

export async function addConfigurationCharacteristic(
  context: CommandContext,
  modelId: string,
  input: {
    characteristicKey: string;
    name: string;
    valueType: string;
    required?: boolean;
    allowedValues?: unknown;
    defaultValue?: string;
    unitOfMeasureId?: string;
  }
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const { model, version } = await currentMutableConfigurationVersion(context, modelId, connection);
    const uomId = input.unitOfMeasureId?.trim() || null;
    if (uomId) await assertActiveUom(context, uomId, connection);
    await executeMutation(
      'INSERT INTO product_configuration_characteristics (id,tenant_id,configuration_version_id,characteristic_key,name,value_type,required_flag,allowed_values_json,default_value,unit_of_measure_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        version.id,
        code(input.characteristicKey, 'Characteristic key', 191),
        required(input.name, 'Characteristic name', 255),
        code(input.valueType, 'Characteristic value type'),
        Boolean(input.required),
        json(input.allowedValues),
        input.defaultValue?.trim() || null,
        uomId,
        now()
      ],
      connection
    );
    await executeMutation(
      'UPDATE product_configuration_models SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [now(), model.id, context.tenantId, model.aggregateVersion],
      connection
    );
  });
}

export async function addConfigurationRule(
  context: CommandContext,
  modelId: string,
  input: { ruleKey: string; ruleType: string; expression: string; severity?: string }
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const { model, version } = await currentMutableConfigurationVersion(context, modelId, connection);
    await executeMutation(
      'INSERT INTO product_configuration_rules (id,tenant_id,configuration_version_id,rule_key,rule_type,expression_text,severity,created_at) VALUES (?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        version.id,
        code(input.ruleKey, 'Rule key', 191),
        code(input.ruleType, 'Rule type'),
        required(input.expression, 'Rule expression'),
        code(input.severity || 'ERROR', 'Rule severity'),
        now()
      ],
      connection
    );
    await executeMutation(
      'UPDATE product_configuration_models SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [now(), model.id, context.tenantId, model.aggregateVersion],
      connection
    );
  });
}

export async function linkConfigurationRequirement(
  context: CommandContext,
  modelId: string,
  input: {
    requirementType: string;
    subjectId: string;
    subjectVersion?: string;
    traceabilityRole?: string;
    validationStatus?: string;
  }
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const { model, version } = await currentMutableConfigurationVersion(context, modelId, connection);
    const requirementType = code(input.requirementType, 'Requirement type');
    const subjectId = required(input.subjectId, 'Requirement subject ID', 191);
    if (requirementType === 'MARKET_INSIGHT') {
      const insight = await getMarketInsight(context, subjectId, connection);
      if (insight.status !== 'VALIDATED') throw new Error('Market Insight must be validated.');
      if (input.subjectVersion && input.subjectVersion !== String(insight.aggregateVersion)) {
        throw new Error('Market Insight version does not match the current governed version.');
      }
    }
    await executeMutation(
      'INSERT INTO product_configuration_requirement_links (id,tenant_id,configuration_version_id,requirement_type,subject_id,subject_version,traceability_role,validation_status,created_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        version.id,
        requirementType,
        subjectId,
        input.subjectVersion?.trim() || null,
        code(input.traceabilityRole || 'SATISFIES', 'Traceability role'),
        code(input.validationStatus || 'PENDING', 'Validation status'),
        now()
      ],
      connection
    );
    await executeMutation(
      'UPDATE product_configuration_models SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [now(), model.id, context.tenantId, model.aggregateVersion],
      connection
    );
  });
}

export async function recordConfigurationTrial(
  context: CommandContext,
  modelId: string,
  input: {
    trialRef: string;
    trialType?: string;
    hypothesis: string;
    method: string;
    successCriteria: string;
    outcome: string;
    resultSummary: string;
    evidenceReference?: string;
    occurredAt?: string;
  }
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const { model, version } = await currentMutableConfigurationVersion(context, modelId, connection);
    const outcome = code(input.outcome, 'Trial outcome');
    if (!['PASS', 'FAIL', 'INCONCLUSIVE'].includes(outcome)) {
      throw new Error('Trial outcome must be PASS, FAIL or INCONCLUSIVE.');
    }
    await executeMutation(
      'INSERT INTO product_configuration_trials (id,tenant_id,configuration_version_id,trial_ref,trial_type,hypothesis,method,success_criteria,outcome,result_summary,evidence_reference,conducted_by_party_id,occurred_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        version.id,
        code(input.trialRef, 'Trial reference', 191),
        code(input.trialType || 'VALIDATION', 'Trial type'),
        required(input.hypothesis, 'Trial hypothesis'),
        required(input.method, 'Trial method'),
        required(input.successCriteria, 'Trial success criteria'),
        outcome,
        required(input.resultSummary, 'Trial result summary'),
        input.evidenceReference?.trim() || null,
        context.actorPartyId,
        timestamp(input.occurredAt, 'Trial time')
      ],
      connection
    );
    await executeMutation(
      'UPDATE product_configuration_models SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [now(), model.id, context.tenantId, model.aggregateVersion],
      connection
    );
  });
}

export async function releaseProductConfiguration(
  context: CommandContext,
  modelId: string,
  expectedVersion: number
) {
  assertPermission(context, 'product.configuration.manage');
  return dbTransaction(async (connection) => {
    const model = await getConfiguration(context, modelId, connection, true);
    if (model.aggregateVersion !== expectedVersion) throw new Error('Product Configuration changed.');
    const version = await getConfigurationVersion(
      context,
      model.id,
      model.currentVersionNo,
      connection,
      true
    );
    if (version.lifecycleStatus === 'RELEASED') return;
    const requirement = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM product_configuration_requirement_links WHERE tenant_id=? AND configuration_version_id=?',
      [context.tenantId, version.id],
      connection
    );
    const trials = await queryOne<RowDataPacket & { total: number; failed: number; passed: number }>(
      "SELECT COUNT(*) AS total,SUM(CASE WHEN outcome='FAIL' THEN 1 ELSE 0 END) AS failed,SUM(CASE WHEN outcome='PASS' THEN 1 ELSE 0 END) AS passed FROM product_configuration_trials WHERE tenant_id=? AND configuration_version_id=?",
      [context.tenantId, version.id],
      connection
    );
    if (!requirement?.count) throw new Error('Release requires at least one traceable requirement.');
    if (!trials?.total || !trials.passed) throw new Error('Release requires at least one passing trial.');
    if (Number(trials.failed) > 0) throw new Error('Failed trials must be resolved in a successor version before release.');
    const releasedAt = now();
    await executeMutation(
      "UPDATE product_configuration_versions SET lifecycle_status='RELEASED',released_at=? WHERE id=? AND tenant_id=? AND lifecycle_status <> 'RELEASED'",
      [releasedAt, version.id, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE product_configuration_models SET status='RELEASED',aggregate_version=aggregate_version+1,released_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [releasedAt, releasedAt, model.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-CONFIGURATION',
        aggregateType: 'ProductConfigurationModel',
        objectType: 'product_configuration_model',
        objectId: model.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_CONFIGURATION_RELEASED',
        fromState: model.status,
        toState: 'RELEASED',
        payload: { versionNo: model.currentVersionNo }
      },
      connection
    );
  });
}

export async function listProductBusinessCases(context: CommandContext, caseDomain?: string) {
  assertPermission(context, 'product.innovation.read');
  const domain = caseDomain?.trim() ? code(caseDomain, 'Case domain') : null;
  return queryRows<RowDataPacket & ProductBusinessCase>(
    businessCaseSelect +
      ' WHERE bc.tenant_id=?' +
      (domain ? ' AND p.case_domain=?' : '') +
      ' ORDER BY bc.updated_at DESC,bc.case_ref',
    domain ? [context.tenantId, domain] : [context.tenantId]
  );
}

export async function listProductBusinessCaseVersions(
  context: CommandContext,
  businessCaseId: string
) {
  assertPermission(context, 'product.innovation.read');
  await getBusinessCase(context, businessCaseId);
  return queryRows<RowDataPacket & ProductBusinessCaseVersion>(
    `SELECT v.id,v.business_case_id AS businessCaseId,v.version_no AS versionNo,v.lifecycle_status AS lifecycleStatus,
            v.objectives_need AS objectivesNeed,v.options_json AS options,v.benefits_json AS benefits,
            v.cost_funding_basis_json AS costFundingBasis,v.risks_json AS risks,v.assumptions_json AS assumptions,
            v.transaction_structure_json AS transactionStructure,v.negotiated_terms_json AS negotiatedTerms,
            v.recommendation,p.demand_forecast_json AS demandForecast,p.roi_json AS roi,
            p.market_basis_json AS marketBasis,p.product_scope_json AS productScope,
            p.funding_envelope_json AS fundingEnvelope,v.created_at AS createdAt
       FROM business_case_versions v
       JOIN product_service_business_case_version_profiles p
         ON p.business_case_version_id=v.id AND p.tenant_id=v.tenant_id
      WHERE v.tenant_id=? AND v.business_case_id=?
      ORDER BY v.version_no DESC`,
    [context.tenantId, businessCaseId]
  );
}

async function insertProductBusinessCaseVersion(
  context: CommandContext,
  connection: DbExecutor,
  businessCaseId: string,
  versionNo: number,
  input: {
    objectivesNeed: string;
    options?: unknown;
    benefits?: unknown;
    costFundingBasis?: unknown;
    risks?: unknown;
    assumptions?: unknown;
    commercialModel?: unknown;
    routeToMarket?: unknown;
    recommendation: string;
    demandForecast?: unknown;
    roi?: unknown;
    marketBasis?: unknown;
    productScope?: unknown;
    fundingEnvelope?: unknown;
    sourceLinks?: Array<{
      linkType: string;
      subjectType: string;
      subjectId: string;
      subjectVersion?: string;
    }>;
  }
) {
  const versionId = randomUUID();
  const createdAt = now();
  await executeMutation(
    `INSERT INTO business_case_versions
      (id,tenant_id,business_case_id,version_no,lifecycle_status,objectives_need,options_json,benefits_json,
       cost_funding_basis_json,risks_json,assumptions_json,transaction_structure_json,negotiated_terms_json,
       recommendation,appraisal_id,legal_matter_id,created_by_party_id,created_at)
     VALUES (?,?,?,?,'DRAFT',?,?,?,?,?,?,?,?,?,NULL,NULL,?,?)`,
    [
      versionId,
      context.tenantId,
      businessCaseId,
      versionNo,
      required(input.objectivesNeed, 'Business Case objectives / need'),
      json(input.options),
      json(input.benefits),
      json(input.costFundingBasis),
      json(input.risks),
      json(input.assumptions),
      json(input.commercialModel),
      json(input.routeToMarket),
      required(input.recommendation, 'Business Case recommendation'),
      context.actorPartyId,
      createdAt
    ],
    connection
  );
  await executeMutation(
    'INSERT INTO product_service_business_case_version_profiles (business_case_version_id,tenant_id,demand_forecast_json,roi_json,market_basis_json,product_scope_json,funding_envelope_json,created_at) VALUES (?,?,?,?,?,?,?,?)',
    [
      versionId,
      context.tenantId,
      json(input.demandForecast),
      json(input.roi),
      json(input.marketBasis),
      json(input.productScope),
      json(input.fundingEnvelope),
      createdAt
    ],
    connection
  );
  for (const link of input.sourceLinks ?? []) {
    await executeMutation(
      'INSERT INTO product_service_business_case_source_links (business_case_version_id,tenant_id,link_type,subject_type,subject_id,subject_version,created_at) VALUES (?,?,?,?,?,?,?)',
      [
        versionId,
        context.tenantId,
        code(link.linkType, 'Source link type'),
        code(link.subjectType, 'Source subject type'),
        required(link.subjectId, 'Source subject ID', 191),
        link.subjectVersion?.trim() || null,
        createdAt
      ],
      connection
    );
  }
  return versionId;
}

export async function createProductBusinessCase(
  context: CommandContext,
  input: {
    caseRef: string;
    caseDomain?: string;
    title: string;
    sponsorPartyId?: string;
    portfolioBucket: string;
    itemId?: string;
    primaryMarketInsightId?: string;
    innovationStage?: string;
    objectivesNeed: string;
    options?: unknown;
    benefits?: unknown;
    costFundingBasis?: unknown;
    risks?: unknown;
    assumptions?: unknown;
    commercialModel?: unknown;
    routeToMarket?: unknown;
    recommendation: string;
    demandForecast?: unknown;
    roi?: unknown;
    marketBasis?: unknown;
    productScope?: unknown;
    fundingEnvelope?: unknown;
    sourceLinks?: Array<{
      linkType: string;
      subjectType: string;
      subjectId: string;
      subjectVersion?: string;
    }>;
  }
) {
  assertPermission(context, 'product.business_case.manage');
  const id = randomUUID();
  const createdAt = now();
  const caseDomain = code(input.caseDomain || 'PRODUCT_SERVICE', 'Case domain');
  if (!['PRODUCT_SERVICE', 'INNOVATION'].includes(caseDomain)) {
    throw new Error('Case domain must be PRODUCT_SERVICE or INNOVATION.');
  }
  return dbTransaction(async (connection) => {
    const sponsorPartyId = input.sponsorPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, sponsorPartyId, connection);
    const itemId = input.itemId?.trim() || null;
    if (itemId) await getItem(context, itemId, connection);
    const insightId = input.primaryMarketInsightId?.trim() || null;
    if (insightId) await getMarketInsight(context, insightId, connection);
    await executeMutation(
      `INSERT INTO business_cases
        (id,tenant_id,case_ref,case_type,title,sponsor_party_id,primary_party_id,development_opportunity_id,
         status,aggregate_version,current_version_no,approval_decision_id,approved_at,closed_at,
         created_by_party_id,created_at,updated_at)
       VALUES (?,?,?,?,?,?,NULL,NULL,'DRAFT',1,1,NULL,NULL,NULL,?,?,?)`,
      [
        id,
        context.tenantId,
        code(input.caseRef, 'Business Case reference', 191),
        caseDomain,
        required(input.title, 'Business Case title', 500),
        sponsorPartyId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await executeMutation(
      'INSERT INTO product_service_business_case_profiles (business_case_id,tenant_id,case_domain,portfolio_bucket,item_id,primary_market_insight_id,innovation_stage,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        id,
        context.tenantId,
        caseDomain,
        required(input.portfolioBucket, 'Portfolio bucket', 191),
        itemId,
        insightId,
        input.innovationStage?.trim() ? code(input.innovationStage, 'Innovation stage') : null,
        createdAt,
        createdAt
      ],
      connection
    );
    await insertProductBusinessCaseVersion(context, connection, id, 1, input);
    await evidence(
      context,
      {
        aggregateId: 'AGG-04-BUSINESS-CASE',
        aggregateType: 'BusinessCase',
        objectType: 'business_case',
        objectId: id,
        aggregateVersion: 1,
        eventType: 'PRODUCT_SERVICE_BUSINESS_CASE_CREATED',
        toState: 'DRAFT',
        payload: { caseDomain, itemId, portfolioBucket: input.portfolioBucket }
      },
      connection
    );
    return id;
  });
}

export async function reviseProductBusinessCase(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number,
  input: {
    portfolioBucket?: string;
    innovationStage?: string;
    objectivesNeed: string;
    options?: unknown;
    benefits?: unknown;
    costFundingBasis?: unknown;
    risks?: unknown;
    assumptions?: unknown;
    commercialModel?: unknown;
    routeToMarket?: unknown;
    recommendation: string;
    demandForecast?: unknown;
    roi?: unknown;
    marketBasis?: unknown;
    productScope?: unknown;
    fundingEnvelope?: unknown;
    sourceLinks?: Array<{
      linkType: string;
      subjectType: string;
      subjectId: string;
      subjectVersion?: string;
    }>;
  }
) {
  assertPermission(context, 'product.business_case.manage');
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    if (businessCase.aggregateVersion !== expectedVersion) throw new Error('Business Case changed.');
    if (!['DRAFT', 'REWORK', 'REJECTED'].includes(businessCase.status)) {
      throw new Error('Only draft, rework or rejected Business Cases can be revised.');
    }
    const nextVersion = businessCase.currentVersionNo + 1;
    await insertProductBusinessCaseVersion(context, connection, businessCase.id, nextVersion, input);
    const updatedAt = now();
    await executeMutation(
      "UPDATE business_cases SET status='DRAFT',aggregate_version=aggregate_version+1,current_version_no=?,approval_decision_id=NULL,approved_at=NULL,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [nextVersion, updatedAt, businessCase.id, context.tenantId, expectedVersion],
      connection
    );
    await executeMutation(
      'UPDATE product_service_business_case_profiles SET portfolio_bucket=COALESCE(?,portfolio_bucket),innovation_stage=COALESCE(?,innovation_stage),updated_at=? WHERE business_case_id=? AND tenant_id=?',
      [
        input.portfolioBucket?.trim() || null,
        input.innovationStage?.trim() ? code(input.innovationStage, 'Innovation stage') : null,
        updatedAt,
        businessCase.id,
        context.tenantId
      ],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-04-BUSINESS-CASE',
        aggregateType: 'BusinessCase',
        objectType: 'business_case',
        objectId: businessCase.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_SERVICE_BUSINESS_CASE_REVISED',
        fromState: businessCase.status,
        toState: 'DRAFT',
        payload: { versionNo: nextVersion }
      },
      connection
    );
    return nextVersion;
  });
}

export async function prepareProductBusinessCaseForDecision(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number
) {
  assertPermission(context, 'product.business_case.manage');
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    if (businessCase.aggregateVersion !== expectedVersion) throw new Error('Business Case changed.');
    if (businessCase.status !== 'DRAFT') throw new Error('Only draft Business Cases can be submitted.');
    await getBusinessCaseVersion(
      context,
      businessCase.id,
      businessCase.currentVersionNo,
      connection,
      true
    );
    const updatedAt = now();
    await executeMutation(
      "UPDATE business_case_versions SET lifecycle_status='DECISION_REQUIRED' WHERE tenant_id=? AND business_case_id=? AND version_no=?",
      [context.tenantId, businessCase.id, businessCase.currentVersionNo],
      connection
    );
    await executeMutation(
      "UPDATE business_cases SET status='DECISION_REQUIRED',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [updatedAt, businessCase.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-04-BUSINESS-CASE',
        aggregateType: 'BusinessCase',
        objectType: 'business_case',
        objectId: businessCase.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_SERVICE_BUSINESS_CASE_DECISION_REQUESTED',
        fromState: businessCase.status,
        toState: 'DECISION_REQUIRED',
        payload: { versionNo: businessCase.currentVersionNo }
      },
      connection
    );
    return {
      decisionType: decisionTypeForCase(businessCase.caseDomain),
      subjectType: 'BUSINESS_CASE',
      subjectId: businessCase.id,
      subjectVersion: String(businessCase.currentVersionNo)
    };
  });
}

export async function applyProductBusinessCaseDecision(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number,
  decisionId: string,
  outcome: string
) {
  assertPermission(context, 'product.business_case.approve');
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    if (businessCase.aggregateVersion !== expectedVersion) throw new Error('Business Case changed.');
    if (businessCase.status !== 'DECISION_REQUIRED') {
      throw new Error('Business Case is not awaiting a Decision.');
    }
    const decisionOutcome = code(outcome, 'Decision outcome');
    if (!['APPROVED', 'REJECTED', 'REWORK'].includes(decisionOutcome)) {
      throw new Error('Decision outcome must be APPROVED, REJECTED or REWORK.');
    }
    await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: decisionTypeForCase(businessCase.caseDomain),
        subjectType: 'BUSINESS_CASE',
        subjectId: businessCase.id,
        subjectVersion: String(businessCase.currentVersionNo),
        outcome: decisionOutcome
      },
      connection
    );
    const updatedAt = now();
    await executeMutation(
      'UPDATE business_case_versions SET lifecycle_status=? WHERE tenant_id=? AND business_case_id=? AND version_no=?',
      [decisionOutcome, context.tenantId, businessCase.id, businessCase.currentVersionNo],
      connection
    );
    await executeMutation(
      'UPDATE business_cases SET status=?,aggregate_version=aggregate_version+1,approval_decision_id=?,approved_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [
        decisionOutcome,
        decisionId,
        decisionOutcome === 'APPROVED' ? updatedAt : null,
        updatedAt,
        businessCase.id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-04-BUSINESS-CASE',
        aggregateType: 'BusinessCase',
        objectType: 'business_case',
        objectId: businessCase.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'PRODUCT_SERVICE_BUSINESS_CASE_DECIDED',
        fromState: businessCase.status,
        toState: decisionOutcome,
        payload: { decisionId, versionNo: businessCase.currentVersionNo }
      },
      connection
    );
  });
}

export async function listInnovationExperiments(
  context: CommandContext,
  businessCaseId?: string
) {
  assertPermission(context, 'product.innovation.read');
  const params: unknown[] = [context.tenantId];
  let where = ' WHERE ie.tenant_id=?';
  if (businessCaseId?.trim()) {
    where += ' AND v.business_case_id=?';
    params.push(businessCaseId.trim());
  }
  return queryRows<
    RowDataPacket & {
      id: string;
      businessCaseVersionId: string;
      businessCaseId: string;
      experimentRef: string;
      title: string;
      hypothesis: string;
      method: string;
      successCriteria: string;
      status: string;
      outcome: string | null;
      resultSummary: string | null;
      evidenceReference: string | null;
      startedAt: string | null;
      completedAt: string | null;
    }
  >(
    `SELECT ie.id,ie.business_case_version_id AS businessCaseVersionId,v.business_case_id AS businessCaseId,
            ie.experiment_ref AS experimentRef,ie.title,ie.hypothesis,ie.method,
            ie.success_criteria AS successCriteria,ie.status,ie.outcome,ie.result_summary AS resultSummary,
            ie.evidence_reference AS evidenceReference,ie.started_at AS startedAt,ie.completed_at AS completedAt
       FROM innovation_experiments ie
       JOIN business_case_versions v ON v.id=ie.business_case_version_id AND v.tenant_id=ie.tenant_id
       ${where}
       ORDER BY ie.updated_at DESC,ie.experiment_ref`,
    params
  );
}

async function assertInnovationVersion(
  context: CommandContext,
  businessCaseVersionId: string,
  executor: DbExecutor
) {
  const row = await queryOne<
    RowDataPacket & { id: string; businessCaseId: string; versionNo: number; caseDomain: string }
  >(
    `SELECT v.id,v.business_case_id AS businessCaseId,v.version_no AS versionNo,p.case_domain AS caseDomain
       FROM business_case_versions v
       JOIN product_service_business_case_profiles p
         ON p.business_case_id=v.business_case_id AND p.tenant_id=v.tenant_id
      WHERE v.id=? AND v.tenant_id=?`,
    [businessCaseVersionId, context.tenantId],
    executor
  );
  if (!row || row.caseDomain !== 'INNOVATION') {
    throw new Error('Innovation activity requires an Innovation Business Case version.');
  }
  return row;
}

export async function createInnovationExperiment(
  context: CommandContext,
  input: {
    businessCaseVersionId: string;
    experimentRef: string;
    title: string;
    hypothesis: string;
    method: string;
    successCriteria: string;
    ownerPartyId?: string;
  }
) {
  assertPermission(context, 'product.innovation.manage');
  const id = randomUUID();
  return dbTransaction(async (connection) => {
    await assertInnovationVersion(context, input.businessCaseVersionId, connection);
    const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
    await assertActiveParty(context, ownerPartyId, connection);
    const createdAt = now();
    await executeMutation(
      `INSERT INTO innovation_experiments
        (id,tenant_id,business_case_version_id,experiment_ref,title,hypothesis,method,success_criteria,
         owner_party_id,status,outcome,result_summary,evidence_reference,started_at,completed_at,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'PLANNED',NULL,NULL,NULL,NULL,NULL,?,?)`,
      [
        id,
        context.tenantId,
        input.businessCaseVersionId,
        code(input.experimentRef, 'Experiment reference', 191),
        required(input.title, 'Experiment title', 500),
        required(input.hypothesis, 'Experiment hypothesis'),
        required(input.method, 'Experiment method'),
        required(input.successCriteria, 'Experiment success criteria'),
        ownerPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    return id;
  });
}

export async function startInnovationExperiment(context: CommandContext, experimentId: string) {
  assertPermission(context, 'product.innovation.manage');
  const startedAt = now();
  const result = await executeMutation(
    "UPDATE innovation_experiments SET status='RUNNING',started_at=?,updated_at=? WHERE id=? AND tenant_id=? AND status='PLANNED'",
    [startedAt, startedAt, experimentId, context.tenantId]
  );
  if (result.affectedRows !== 1) throw new Error('Only planned Innovation Experiments can start.');
}

export async function completeInnovationExperiment(
  context: CommandContext,
  experimentId: string,
  input: { outcome: string; resultSummary: string; evidenceReference?: string }
) {
  assertPermission(context, 'product.innovation.manage');
  const outcome = code(input.outcome, 'Experiment outcome');
  if (!['VALIDATED', 'INVALIDATED', 'INCONCLUSIVE'].includes(outcome)) {
    throw new Error('Experiment outcome is invalid.');
  }
  const completedAt = now();
  const result = await executeMutation(
    "UPDATE innovation_experiments SET status='COMPLETED',outcome=?,result_summary=?,evidence_reference=?,completed_at=?,updated_at=? WHERE id=? AND tenant_id=? AND status='RUNNING'",
    [
      outcome,
      required(input.resultSummary, 'Experiment result summary'),
      input.evidenceReference?.trim() || null,
      completedAt,
      completedAt,
      experimentId,
      context.tenantId
    ]
  );
  if (result.affectedRows !== 1) throw new Error('Only running Innovation Experiments can complete.');
}

export async function recordInnovationFunding(
  context: CommandContext,
  input: {
    businessCaseVersionId: string;
    fundingType: string;
    amount: number;
    currencyId: string;
    basis: string;
    status?: string;
  }
) {
  assertPermission(context, 'product.innovation.manage');
  const amount = optionalNumber(input.amount, 'Funding amount');
  if (amount == null || amount < 0) throw new Error('Funding amount must be non-negative.');
  return dbTransaction(async (connection) => {
    await assertInnovationVersion(context, input.businessCaseVersionId, connection);
    await assertActiveCurrency(context, input.currencyId, connection);
    const id = randomUUID();
    await executeMutation(
      'INSERT INTO innovation_funding_allocations (id,tenant_id,business_case_version_id,funding_type,amount,currency_id,basis,status,recorded_by_party_id,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        id,
        context.tenantId,
        input.businessCaseVersionId,
        code(input.fundingType, 'Funding type'),
        amount,
        input.currencyId,
        required(input.basis, 'Funding basis'),
        code(input.status || 'PLANNED', 'Funding status'),
        context.actorPartyId,
        now()
      ],
      connection
    );
    return id;
  });
}

export async function configureItemLaunch(
  context: CommandContext,
  itemId: string,
  input: {
    launchPlan: string;
    channelReadiness: string;
    trainingReadiness: string;
    pricingReference: string;
    plannedLaunchAt?: string;
  }
) {
  assertPermission(context, 'product.launch.manage');
  await getItem(context, itemId);
  const updatedAt = now();
  await executeMutation(
    `INSERT INTO item_launch_profiles
      (item_id,tenant_id,launch_plan,channel_readiness,training_readiness,pricing_reference,launch_status,
       planned_launch_at,launched_at,created_at,updated_at)
     VALUES (?,?,?,?,?,?,'READY',?,NULL,?,?)
     ON DUPLICATE KEY UPDATE launch_plan=VALUES(launch_plan),channel_readiness=VALUES(channel_readiness),
       training_readiness=VALUES(training_readiness),pricing_reference=VALUES(pricing_reference),
       launch_status=CASE WHEN launch_status='LAUNCHED' THEN launch_status ELSE 'READY' END,
       planned_launch_at=VALUES(planned_launch_at),updated_at=VALUES(updated_at)`,
    [
      itemId,
      context.tenantId,
      required(input.launchPlan, 'Launch plan'),
      required(input.channelReadiness, 'Channel readiness'),
      required(input.trainingReadiness, 'Training readiness'),
      required(input.pricingReference, 'Pricing reference', 500),
      input.plannedLaunchAt ? timestamp(input.plannedLaunchAt, 'Planned launch time') : null,
      updatedAt,
      updatedAt
    ]
  );
}

export async function launchOffering(
  context: CommandContext,
  itemId: string,
  expectedVersion: number
) {
  assertPermission(context, 'product.launch.manage');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    if (item.aggregateVersion !== expectedVersion) throw new Error('Item changed.');
    if (item.status !== 'DRAFT') throw new Error('Only draft Items can be launched.');
    if (item.conceptStatus !== 'SELECTED' || !item.selectedDecisionId) {
      throw new Error('Launch requires an approved concept-selection Decision.');
    }
    const approvedCase = await queryOne<RowDataPacket & { id: string }>(
      `SELECT bc.id
         FROM business_cases bc
         JOIN product_service_business_case_profiles p
           ON p.business_case_id=bc.id AND p.tenant_id=bc.tenant_id
        WHERE bc.tenant_id=? AND p.item_id=? AND p.case_domain='PRODUCT_SERVICE'
          AND bc.status='APPROVED' AND bc.approval_decision_id IS NOT NULL
        LIMIT 1`,
      [context.tenantId, item.id],
      connection
    );
    if (!approvedCase) throw new Error('Launch requires an approved Product / Service Business Case.');
    const releasedConfiguration = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM product_configuration_models WHERE tenant_id=? AND item_id=? AND status='RELEASED' LIMIT 1",
      [context.tenantId, item.id],
      connection
    );
    if (!releasedConfiguration) throw new Error('Launch requires a released Product Configuration.');
    const launch = await queryOne<
      RowDataPacket & {
        launchPlan: string;
        channelReadiness: string;
        trainingReadiness: string;
        pricingReference: string;
      }
    >(
      'SELECT launch_plan AS launchPlan,channel_readiness AS channelReadiness,training_readiness AS trainingReadiness,pricing_reference AS pricingReference FROM item_launch_profiles WHERE item_id=? AND tenant_id=?',
      [item.id, context.tenantId],
      connection
    );
    if (
      !launch?.launchPlan?.trim() ||
      !launch.channelReadiness?.trim() ||
      !launch.trainingReadiness?.trim() ||
      !launch.pricingReference?.trim()
    ) {
      throw new Error('Launch readiness is incomplete.');
    }
    const launchedAt = now();
    await executeMutation(
      "UPDATE items SET status='ACTIVE',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [launchedAt, item.id, context.tenantId, expectedVersion],
      connection
    );
    await executeMutation(
      "UPDATE item_launch_profiles SET launch_status='LAUNCHED',launched_at=?,updated_at=? WHERE item_id=? AND tenant_id=?",
      [launchedAt, launchedAt, item.id, context.tenantId],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'ITEM_OFFERING_LAUNCHED',
        fromState: item.status,
        toState: 'ACTIVE',
        payload: {
          businessCaseId: approvedCase.id,
          configurationModelId: releasedConfiguration.id
        }
      },
      connection
    );
  });
}

export async function recordItemLifecycleReview(
  context: CommandContext,
  itemId: string,
  input: {
    reviewType: string;
    summary: string;
    metrics?: unknown;
    recommendation: string;
    configurationModelId?: string;
  }
) {
  assertPermission(context, 'product.lifecycle.manage');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    const configurationModelId = input.configurationModelId?.trim() || null;
    if (configurationModelId) {
      const model = await getConfiguration(context, configurationModelId, connection);
      if (model.itemId !== item.id) throw new Error('Configuration does not belong to this Item.');
    }
    const id = randomUUID();
    const reviewedAt = now();
    await executeMutation(
      'INSERT INTO item_lifecycle_reviews (id,tenant_id,item_id,review_type,summary,metrics_json,recommendation,configuration_model_id,reviewed_by_party_id,reviewed_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [
        id,
        context.tenantId,
        item.id,
        code(input.reviewType, 'Lifecycle review type'),
        required(input.summary, 'Lifecycle review summary'),
        json(input.metrics),
        required(input.recommendation, 'Lifecycle recommendation'),
        configurationModelId,
        context.actorPartyId,
        reviewedAt
      ],
      connection
    );
    await executeMutation(
      'UPDATE items SET aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [reviewedAt, item.id, context.tenantId, item.aggregateVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: item.id,
        aggregateVersion: item.aggregateVersion + 1,
        eventType: 'ITEM_LIFECYCLE_REVIEW_RECORDED',
        fromState: item.status,
        toState: item.status,
        payload: { reviewId: id, reviewType: code(input.reviewType, 'Lifecycle review type') }
      },
      connection
    );
    return id;
  });
}

export async function beginItemRetirement(
  context: CommandContext,
  itemId: string,
  expectedVersion: number,
  input: {
    rationale: string;
    stakeholderNoticeReference?: string;
    customerMigrationPlan?: string;
    supportEndAt?: string;
    archiveReference?: string;
  }
) {
  assertPermission(context, 'product.retirement.manage');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    if (item.aggregateVersion !== expectedVersion) throw new Error('Item changed.');
    if (!['ACTIVE', 'BLOCKED', 'OBSOLETE'].includes(item.status)) {
      throw new Error('Only active, blocked or obsolete Items can enter retirement.');
    }
    const initiatedAt = now();
    await executeMutation(
      `INSERT INTO item_retirement_profiles
        (item_id,tenant_id,rationale,stakeholder_notice_reference,customer_migration_plan,support_end_at,
         archive_reference,retirement_status,initiated_at,retired_at,updated_at)
       VALUES (?,?,?,?,?,?,?,'PLANNED',?,NULL,?)
       ON DUPLICATE KEY UPDATE rationale=VALUES(rationale),
         stakeholder_notice_reference=COALESCE(VALUES(stakeholder_notice_reference),stakeholder_notice_reference),
         customer_migration_plan=COALESCE(VALUES(customer_migration_plan),customer_migration_plan),
         support_end_at=COALESCE(VALUES(support_end_at),support_end_at),
         archive_reference=COALESCE(VALUES(archive_reference),archive_reference),
         retirement_status=CASE WHEN retirement_status='RETIRED' THEN retirement_status ELSE 'PLANNED' END,
         updated_at=VALUES(updated_at)`,
      [
        item.id,
        context.tenantId,
        required(input.rationale, 'Retirement rationale'),
        input.stakeholderNoticeReference?.trim() || null,
        input.customerMigrationPlan?.trim() || null,
        input.supportEndAt ? timestamp(input.supportEndAt, 'Support end time') : null,
        input.archiveReference?.trim() || null,
        initiatedAt,
        initiatedAt
      ],
      connection
    );
    if (item.status !== 'OBSOLETE') {
      await executeMutation(
        "UPDATE items SET status='OBSOLETE',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
        [initiatedAt, item.id, context.tenantId, expectedVersion],
        connection
      );
      await evidence(
        context,
        {
          aggregateId: 'AGG-10-ITEM',
          aggregateType: 'Item',
          objectType: 'item',
          objectId: item.id,
          aggregateVersion: expectedVersion + 1,
          eventType: 'ITEM_RETIREMENT_INITIATED',
          fromState: item.status,
          toState: 'OBSOLETE'
        },
        connection
      );
    }
  });
}

export async function completeItemRetirement(
  context: CommandContext,
  itemId: string,
  expectedVersion: number
) {
  assertPermission(context, 'product.retirement.manage');
  return dbTransaction(async (connection) => {
    const item = await getItem(context, itemId, connection, true);
    if (item.aggregateVersion !== expectedVersion) throw new Error('Item changed.');
    if (item.status !== 'OBSOLETE') throw new Error('Item must be obsolete before retirement.');
    const profile = await queryOne<
      RowDataPacket & {
        stakeholderNoticeReference: string | null;
        customerMigrationPlan: string | null;
        supportEndAt: string | null;
        archiveReference: string | null;
        retirementStatus: string;
      }
    >(
      'SELECT stakeholder_notice_reference AS stakeholderNoticeReference,customer_migration_plan AS customerMigrationPlan,support_end_at AS supportEndAt,archive_reference AS archiveReference,retirement_status AS retirementStatus FROM item_retirement_profiles WHERE item_id=? AND tenant_id=? FOR UPDATE',
      [item.id, context.tenantId],
      connection
    );
    if (!profile) throw new Error('Retirement plan not found.');
    if (
      !profile.stakeholderNoticeReference?.trim() ||
      !profile.customerMigrationPlan?.trim() ||
      !profile.supportEndAt ||
      !profile.archiveReference?.trim()
    ) {
      throw new Error(
        'Retirement requires stakeholder notice, customer migration, support end and archive evidence.'
      );
    }
    const retiredAt = now();
    await executeMutation(
      "UPDATE item_retirement_profiles SET retirement_status='RETIRED',retired_at=?,updated_at=? WHERE item_id=? AND tenant_id=?",
      [retiredAt, retiredAt, item.id, context.tenantId],
      connection
    );
    await executeMutation(
      "UPDATE items SET status='RETIRED',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [retiredAt, item.id, context.tenantId, expectedVersion],
      connection
    );
    await evidence(
      context,
      {
        aggregateId: 'AGG-10-ITEM',
        aggregateType: 'Item',
        objectType: 'item',
        objectId: item.id,
        aggregateVersion: expectedVersion + 1,
        eventType: 'ITEM_RETIRED',
        fromState: item.status,
        toState: 'RETIRED'
      },
      connection
    );
  });
}
