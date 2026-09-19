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

export type DevelopmentOpportunity = {
  id: string;
  opportunityRef: string;
  opportunityType: string;
  title: string;
  developmentThesis: string;
  sourceType: string;
  sourceReference: string | null;
  targetPartyId: string | null;
  sponsorPartyId: string;
  scopeDescription: string;
  indicativeValueMin: string | null;
  indicativeValueMax: string | null;
  currencyId: string | null;
  status: string;
  aggregateVersion: number;
  updatedAt: string;
};

export type DevelopmentOpportunityAssessment = {
  id: string;
  assessmentType: string;
  strategicFitRating: string | null;
  recommendation: string;
  assessmentSummary: string;
  evidenceReference: string | null;
  assessedByPartyId: string;
  assessedAt: string;
};

export type DevelopmentAppraisal = {
  id: string;
  opportunityId: string;
  appraisalRef: string;
  scenarioName: string;
  asOfAt: string;
  sourceBasis: Record<string, unknown>;
  assumptions: Record<string, unknown>;
  synergyAssumptions: Record<string, unknown>;
  valuationMetrics: Record<string, unknown>;
  sensitivity: Record<string, unknown>;
  status: string;
  aggregateVersion: number;
  reviewedByPartyId: string | null;
  reviewedAt: string | null;
  approvedSnapshotAt: string | null;
  supersedesAppraisalId: string | null;
  updatedAt: string;
};

export type BusinessCase = {
  id: string;
  caseRef: string;
  caseType: string;
  title: string;
  sponsorPartyId: string;
  primaryPartyId: string | null;
  developmentOpportunityId: string | null;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  approvalDecisionId: string | null;
  approvedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
};

export type BusinessCaseVersion = {
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
  appraisalId: string | null;
  legalMatterId: string | null;
  createdAt: string;
};

export type BusinessCaseAgreement = {
  id: string;
  agreementRole: string;
  subjectType: string;
  subjectId: string;
  subjectVersion: string | null;
  executionStatus: string;
  executionReference: string | null;
  executedAt: string | null;
  recordedAt: string;
};

const opportunitySelect =
  'SELECT id,opportunity_ref AS opportunityRef,opportunity_type AS opportunityType,title,development_thesis AS developmentThesis,source_type AS sourceType,source_reference AS sourceReference,target_party_id AS targetPartyId,sponsor_party_id AS sponsorPartyId,scope_description AS scopeDescription,indicative_value_min AS indicativeValueMin,indicative_value_max AS indicativeValueMax,currency_id AS currencyId,status,aggregate_version AS aggregateVersion,updated_at AS updatedAt FROM development_opportunities';

const appraisalSelect =
  'SELECT id,opportunity_id AS opportunityId,appraisal_ref AS appraisalRef,scenario_name AS scenarioName,as_of_at AS asOfAt,source_basis_json AS sourceBasis,assumptions_json AS assumptions,synergy_assumptions_json AS synergyAssumptions,valuation_metrics_json AS valuationMetrics,sensitivity_json AS sensitivity,status,aggregate_version AS aggregateVersion,reviewed_by_party_id AS reviewedByPartyId,reviewed_at AS reviewedAt,approved_snapshot_at AS approvedSnapshotAt,supersedes_appraisal_id AS supersedesAppraisalId,updated_at AS updatedAt FROM development_appraisals';

const businessCaseSelect =
  'SELECT id,case_ref AS caseRef,case_type AS caseType,title,sponsor_party_id AS sponsorPartyId,primary_party_id AS primaryPartyId,development_opportunity_id AS developmentOpportunityId,status,aggregate_version AS aggregateVersion,current_version_no AS currentVersionNo,approval_decision_id AS approvalDecisionId,approved_at AS approvedAt,closed_at AS closedAt,updated_at AS updatedAt FROM business_cases';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 128) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function timestamp(value: string | undefined, label: string, fallback = now()) {
  if (!value?.trim()) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}

function json(value: unknown) {
  return JSON.stringify(value ?? {});
}

function finiteOptional(value: number | undefined, label: string) {
  if (value == null) return null;
  if (!Number.isFinite(value)) throw new Error(label + ' must be numeric.');
  return value;
}

async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active tenant Party not found.');
}

async function assertCurrency(context: CommandContext, currencyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM reference_currencies WHERE id=? AND tenant_id=? AND status='ACTIVE'",
    [currencyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active governed Currency not found.');
}

async function getOpportunity(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & DevelopmentOpportunity>(
    opportunitySelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Development Opportunity not found.');
  return row;
}

async function getAppraisal(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & DevelopmentAppraisal>(
    appraisalSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Development Appraisal not found.');
  return row;
}

async function getBusinessCase(
  context: CommandContext,
  id: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & BusinessCase>(
    businessCaseSelect + ' WHERE id=? AND tenant_id=?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Business Case not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  aggregateId: string,
  objectType: string,
  objectId: string,
  aggregateVersion: number,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId,
      objectType,
      objectId,
      action: eventType,
      fromState: fromState ?? undefined,
      toState
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId,
      aggregateType: objectType,
      aggregateObjectId: objectId,
      aggregateVersion,
      eventType,
      topic:
        aggregateId === 'AGG-04-BUSINESS-CASE'
          ? 'nublox.corporate-development.business-case'
          : 'nublox.corporate-development.development',
      payload
    },
    executor
  );
}

export async function listDevelopmentOpportunities(context: CommandContext) {
  assertPermission(context, 'corporate.development.read');
  return queryRows<RowDataPacket & DevelopmentOpportunity>(
    opportunitySelect + ' WHERE tenant_id=? ORDER BY updated_at DESC,opportunity_ref',
    [context.tenantId]
  );
}

export async function listDevelopmentOpportunityAssessments(
  context: CommandContext,
  opportunityId: string
) {
  assertPermission(context, 'corporate.development.read');
  await getOpportunity(context, opportunityId);
  return queryRows<RowDataPacket & DevelopmentOpportunityAssessment>(
    'SELECT id,assessment_type AS assessmentType,strategic_fit_rating AS strategicFitRating,recommendation,assessment_summary AS assessmentSummary,evidence_reference AS evidenceReference,assessed_by_party_id AS assessedByPartyId,assessed_at AS assessedAt FROM development_opportunity_assessments WHERE opportunity_id=? ORDER BY assessed_at DESC,id DESC',
    [opportunityId]
  );
}

export async function createDevelopmentOpportunity(
  context: CommandContext,
  input: {
    opportunityRef: string;
    opportunityType: string;
    title: string;
    developmentThesis: string;
    sourceType: string;
    sourceReference?: string;
    targetPartyId?: string;
    sponsorPartyId?: string;
    scopeDescription: string;
    indicativeValueMin?: number;
    indicativeValueMax?: number;
    currencyId?: string;
  }
) {
  assertPermission(context, 'corporate.development.opportunity.manage');
  const id = randomUUID();
  const createdAt = now();
  const sponsorPartyId = input.sponsorPartyId?.trim() || context.actorPartyId;
  const min = finiteOptional(input.indicativeValueMin, 'Indicative minimum value');
  const max = finiteOptional(input.indicativeValueMax, 'Indicative maximum value');
  if (min != null && max != null && max < min) {
    throw new Error('Indicative maximum value cannot be lower than the minimum.');
  }
  if ((min != null || max != null) && !input.currencyId?.trim()) {
    throw new Error('Currency is required when an indicative value is supplied.');
  }

  await dbTransaction(async (connection) => {
    await assertActiveParty(context, sponsorPartyId, connection);
    const targetPartyId = input.targetPartyId?.trim() || null;
    if (targetPartyId) await assertActiveParty(context, targetPartyId, connection);
    const currencyId = input.currencyId?.trim() || null;
    if (currencyId) await assertCurrency(context, currencyId, connection);

    await executeMutation(
      "INSERT INTO development_opportunities (id,tenant_id,opportunity_ref,opportunity_type,title,development_thesis,source_type,source_reference,target_party_id,sponsor_party_id,scope_description,indicative_value_min,indicative_value_max,currency_id,status,aggregate_version,created_by_party_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'IDENTIFIED',1,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.opportunityRef, 'Opportunity reference', 191),
        code(input.opportunityType, 'Opportunity type', 64),
        required(input.title, 'Opportunity title'),
        required(input.developmentThesis, 'Development thesis'),
        code(input.sourceType, 'Opportunity source type', 64),
        input.sourceReference?.trim() || null,
        targetPartyId,
        sponsorPartyId,
        required(input.scopeDescription, 'Opportunity scope'),
        min,
        max,
        currencyId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentOpportunity',
      id,
      1,
      'DEVELOPMENT_OPPORTUNITY_IDENTIFIED',
      null,
      'IDENTIFIED',
      {
        opportunityRef: code(input.opportunityRef, 'Opportunity reference', 191),
        opportunityType: code(input.opportunityType, 'Opportunity type', 64),
        targetPartyId
      },
      connection
    );
  });
  return id;
}

export async function assessDevelopmentOpportunity(
  context: CommandContext,
  opportunityId: string,
  expectedVersion: number,
  input: {
    assessmentType: 'SCREENING' | 'STRATEGIC_FIT' | string;
    strategicFitRating?: string;
    recommendation: string;
    assessmentSummary: string;
    evidenceReference?: string;
  }
) {
  assertPermission(context, 'corporate.development.opportunity.manage');
  return dbTransaction(async (connection) => {
    const opportunity = await getOpportunity(context, opportunityId, connection, true);
    if (opportunity.aggregateVersion !== expectedVersion) {
      throw new Error('Development Opportunity changed before the assessment was recorded.');
    }
    if (['REJECTED', 'CONVERTED_CLOSED'].includes(opportunity.status)) {
      throw new Error('Closed or rejected Development Opportunities cannot be reassessed.');
    }

    const assessmentType = code(input.assessmentType, 'Assessment type', 64);
    const recommendation = code(input.recommendation, 'Assessment recommendation', 32);
    const nextState =
      recommendation === 'REJECT'
        ? 'REJECTED'
        : assessmentType === 'SCREENING'
          ? 'SCREENING'
          : 'EVALUATING';
    const nextVersion = opportunity.aggregateVersion + 1;
    const assessedAt = now();

    await executeMutation(
      'INSERT INTO development_opportunity_assessments (id,opportunity_id,assessment_type,strategic_fit_rating,recommendation,assessment_summary,evidence_reference,assessed_by_party_id,assessed_at) VALUES (?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        opportunityId,
        assessmentType,
        input.strategicFitRating?.trim()
          ? code(input.strategicFitRating, 'Strategic fit rating', 32)
          : null,
        recommendation,
        required(input.assessmentSummary, 'Assessment summary'),
        input.evidenceReference?.trim() || null,
        context.actorPartyId,
        assessedAt
      ],
      connection
    );
    const result = await executeMutation(
      'UPDATE development_opportunities SET status=?,aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [
        nextState,
        nextVersion,
        assessedAt,
        opportunityId,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Development Opportunity version conflict.');

    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentOpportunity',
      opportunityId,
      nextVersion,
      'DEVELOPMENT_OPPORTUNITY_ASSESSED',
      opportunity.status,
      nextState,
      { assessmentType, recommendation },
      connection
    );
    return nextVersion;
  });
}

export async function transitionDevelopmentOpportunity(
  context: CommandContext,
  opportunityId: string,
  expectedVersion: number,
  action:
    | 'SECURE_CONTROL'
    | 'REQUEST_INVESTMENT_DECISION'
    | 'APPROVE'
    | 'REJECT'
    | 'HOLD'
    | 'CLOSE'
) {
  assertPermission(context, 'corporate.development.opportunity.manage');
  const transitions: Record<string, { from: string[]; to: string }> = {
    SECURE_CONTROL: { from: ['EVALUATING'], to: 'SECURING_CONTROL' },
    REQUEST_INVESTMENT_DECISION: {
      from: ['EVALUATING', 'SECURING_CONTROL'],
      to: 'INVESTMENT_DECISION'
    },
    APPROVE: { from: ['INVESTMENT_DECISION'], to: 'APPROVED' },
    REJECT: {
      from: ['IDENTIFIED', 'SCREENING', 'EVALUATING', 'SECURING_CONTROL', 'INVESTMENT_DECISION'],
      to: 'REJECTED'
    },
    HOLD: {
      from: ['SCREENING', 'EVALUATING', 'SECURING_CONTROL', 'INVESTMENT_DECISION'],
      to: 'ON_HOLD'
    },
    CLOSE: { from: ['APPROVED', 'REJECTED', 'ON_HOLD'], to: 'CONVERTED_CLOSED' }
  };
  const transition = transitions[action];
  if (!transition) throw new Error('Unsupported Development Opportunity transition.');

  return dbTransaction(async (connection) => {
    const opportunity = await getOpportunity(context, opportunityId, connection, true);
    if (opportunity.aggregateVersion !== expectedVersion) {
      throw new Error('Development Opportunity changed before the transition was applied.');
    }
    if (!transition.from.includes(opportunity.status)) {
      throw new Error('Development Opportunity cannot perform ' + action + ' from ' + opportunity.status + '.');
    }
    const nextVersion = expectedVersion + 1;
    const updatedAt = now();
    const result = await executeMutation(
      'UPDATE development_opportunities SET status=?,aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [transition.to, nextVersion, updatedAt, opportunityId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Development Opportunity version conflict.');
    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentOpportunity',
      opportunityId,
      nextVersion,
      'DEVELOPMENT_OPPORTUNITY_' + action,
      opportunity.status,
      transition.to,
      {},
      connection
    );
    return nextVersion;
  });
}

export async function listDevelopmentAppraisals(
  context: CommandContext,
  opportunityId?: string
) {
  assertPermission(context, 'corporate.development.read');
  return queryRows<RowDataPacket & DevelopmentAppraisal>(
    appraisalSelect +
      ' WHERE tenant_id=?' +
      (opportunityId ? ' AND opportunity_id=?' : '') +
      ' ORDER BY as_of_at DESC,appraisal_ref',
    opportunityId ? [context.tenantId, opportunityId] : [context.tenantId]
  );
}

export async function createDevelopmentAppraisal(
  context: CommandContext,
  input: {
    opportunityId: string;
    appraisalRef: string;
    scenarioName: string;
    asOfAt?: string;
    sourceBasis: Record<string, unknown>;
    assumptions: Record<string, unknown>;
    synergyAssumptions?: Record<string, unknown>;
    valuationMetrics: Record<string, unknown>;
    sensitivity?: Record<string, unknown>;
    supersedesAppraisalId?: string;
  }
) {
  assertPermission(context, 'corporate.development.valuation.manage');
  const id = randomUUID();
  const createdAt = now();

  await dbTransaction(async (connection) => {
    const opportunity = await getOpportunity(context, input.opportunityId, connection);
    if (['REJECTED', 'CONVERTED_CLOSED'].includes(opportunity.status)) {
      throw new Error('An appraisal cannot be created for a closed or rejected opportunity.');
    }

    let supersedes: DevelopmentAppraisal | null = null;
    if (input.supersedesAppraisalId?.trim()) {
      supersedes = await getAppraisal(context, input.supersedesAppraisalId.trim(), connection, true);
      if (supersedes.opportunityId !== input.opportunityId) {
        throw new Error('A successor appraisal must belong to the same Development Opportunity.');
      }
      if (supersedes.status !== 'APPROVED_SNAPSHOT') {
        throw new Error('Only an approved appraisal snapshot may be superseded.');
      }
    }

    await executeMutation(
      "INSERT INTO development_appraisals (id,tenant_id,opportunity_id,appraisal_ref,scenario_name,as_of_at,source_basis_json,assumptions_json,synergy_assumptions_json,valuation_metrics_json,sensitivity_json,status,aggregate_version,reviewed_by_party_id,reviewed_at,approved_snapshot_at,supersedes_appraisal_id,created_by_party_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?, 'WORKING',1,NULL,NULL,NULL,?,?,?,?)",
      [
        id,
        context.tenantId,
        input.opportunityId,
        code(input.appraisalRef, 'Appraisal reference', 191),
        required(input.scenarioName, 'Appraisal scenario'),
        timestamp(input.asOfAt, 'Appraisal as-of'),
        json(input.sourceBasis),
        json(input.assumptions),
        json(input.synergyAssumptions),
        json(input.valuationMetrics),
        json(input.sensitivity),
        supersedes?.id ?? null,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );

    if (supersedes) {
      await executeMutation(
        "UPDATE development_appraisals SET status='SUPERSEDED',aggregate_version=aggregate_version+1,updated_at=? WHERE id=? AND status='APPROVED_SNAPSHOT'",
        [createdAt, supersedes.id],
        connection
      );
    }

    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentAppraisal',
      id,
      1,
      'DEVELOPMENT_APPRAISAL_CREATED',
      null,
      'WORKING',
      {
        opportunityId: input.opportunityId,
        appraisalRef: code(input.appraisalRef, 'Appraisal reference', 191),
        scenarioName: required(input.scenarioName, 'Appraisal scenario')
      },
      connection
    );
  });
  return id;
}

export async function reviewDevelopmentAppraisal(
  context: CommandContext,
  appraisalId: string,
  expectedVersion: number
) {
  assertPermission(context, 'corporate.development.valuation.manage');
  return dbTransaction(async (connection) => {
    const appraisal = await getAppraisal(context, appraisalId, connection, true);
    if (appraisal.aggregateVersion !== expectedVersion || appraisal.status !== 'WORKING') {
      throw new Error('Only the current working appraisal may be reviewed.');
    }
    const nextVersion = expectedVersion + 1;
    const reviewedAt = now();
    const result = await executeMutation(
      "UPDATE development_appraisals SET status='REVIEWED',aggregate_version=?,reviewed_by_party_id=?,reviewed_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=? AND status='WORKING'",
      [
        nextVersion,
        context.actorPartyId,
        reviewedAt,
        reviewedAt,
        appraisalId,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Development Appraisal version conflict.');
    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentAppraisal',
      appraisalId,
      nextVersion,
      'DEVELOPMENT_APPRAISAL_REVIEWED',
      'WORKING',
      'REVIEWED',
      { opportunityId: appraisal.opportunityId },
      connection
    );
    return nextVersion;
  });
}

export async function approveDevelopmentAppraisalSnapshot(
  context: CommandContext,
  appraisalId: string,
  expectedVersion: number
) {
  assertPermission(context, 'corporate.development.valuation.manage');
  return dbTransaction(async (connection) => {
    const appraisal = await getAppraisal(context, appraisalId, connection, true);
    if (appraisal.aggregateVersion !== expectedVersion || appraisal.status !== 'REVIEWED') {
      throw new Error('Only the current reviewed appraisal may become an approved snapshot.');
    }
    const nextVersion = expectedVersion + 1;
    const approvedAt = now();
    const result = await executeMutation(
      "UPDATE development_appraisals SET status='APPROVED_SNAPSHOT',aggregate_version=?,approved_snapshot_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=? AND status='REVIEWED'",
      [nextVersion, approvedAt, approvedAt, appraisalId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Development Appraisal version conflict.');
    await evidence(
      context,
      'AGG-04-DEVELOPMENT',
      'DevelopmentAppraisal',
      appraisalId,
      nextVersion,
      'DEVELOPMENT_APPRAISAL_SNAPSHOT_APPROVED',
      'REVIEWED',
      'APPROVED_SNAPSHOT',
      { opportunityId: appraisal.opportunityId, asOfAt: appraisal.asOfAt },
      connection
    );
    return nextVersion;
  });
}

export async function listBusinessCases(context: CommandContext, caseType?: string) {
  assertPermission(context, 'corporate.development.read');
  return queryRows<RowDataPacket & BusinessCase>(
    businessCaseSelect +
      ' WHERE tenant_id=?' +
      (caseType ? ' AND case_type=?' : '') +
      ' ORDER BY updated_at DESC,case_ref',
    caseType ? [context.tenantId, code(caseType, 'Business Case type', 64)] : [context.tenantId]
  );
}

export async function listBusinessCaseVersions(context: CommandContext, businessCaseId: string) {
  assertPermission(context, 'corporate.development.read');
  await getBusinessCase(context, businessCaseId);
  return queryRows<RowDataPacket & BusinessCaseVersion>(
    'SELECT id,business_case_id AS businessCaseId,version_no AS versionNo,lifecycle_status AS lifecycleStatus,objectives_need AS objectivesNeed,options_json AS options,benefits_json AS benefits,cost_funding_basis_json AS costFundingBasis,risks_json AS risks,assumptions_json AS assumptions,transaction_structure_json AS transactionStructure,negotiated_terms_json AS negotiatedTerms,recommendation,appraisal_id AS appraisalId,legal_matter_id AS legalMatterId,created_at AS createdAt FROM business_case_versions WHERE business_case_id=? ORDER BY version_no DESC',
    [businessCaseId]
  );
}

export async function listBusinessCaseAgreements(context: CommandContext, businessCaseId: string) {
  assertPermission(context, 'corporate.development.read');
  await getBusinessCase(context, businessCaseId);
  return queryRows<RowDataPacket & BusinessCaseAgreement>(
    'SELECT id,agreement_role AS agreementRole,subject_type AS subjectType,subject_id AS subjectId,subject_version AS subjectVersion,execution_status AS executionStatus,execution_reference AS executionReference,executed_at AS executedAt,recorded_at AS recordedAt FROM business_case_agreements WHERE business_case_id=? ORDER BY recorded_at DESC,id DESC',
    [businessCaseId]
  );
}

function assertCaseManagePermission(context: CommandContext, caseType: string) {
  const type = code(caseType, 'Business Case type', 64);
  if (type === 'DIVESTITURE') {
    assertPermission(context, 'corporate.development.divestiture.manage');
    return type;
  }
  if (type === 'STRATEGIC_PARTNERSHIP') {
    assertPermission(context, 'corporate.development.partnership.manage');
    return type;
  }
  assertPermission(context, 'corporate.development.transaction.manage');
  return type;
}

async function insertBusinessCaseVersion(
  context: CommandContext,
  businessCaseId: string,
  versionNo: number,
  lifecycleStatus: string,
  input: {
    objectivesNeed: string;
    options: unknown;
    benefits: unknown;
    costFundingBasis: unknown;
    risks: unknown;
    assumptions: unknown;
    transactionStructure?: unknown;
    negotiatedTerms?: unknown;
    recommendation: string;
    appraisalId?: string;
    legalMatterId?: string;
  },
  executor: DbExecutor
) {
  const appraisalId = input.appraisalId?.trim() || null;
  if (appraisalId) {
    const appraisal = await getAppraisal(context, appraisalId, executor);
    if (appraisal.status !== 'APPROVED_SNAPSHOT') {
      throw new Error('Business Cases may only pin approved Development Appraisal snapshots.');
    }
  }
  const legalMatterId = input.legalMatterId?.trim() || null;
  if (legalMatterId) {
    const matter = await queryOne<RowDataPacket & { id: string; status: string }>(
      'SELECT id,status FROM legal_matters WHERE id=? AND tenant_id=?',
      [legalMatterId, context.tenantId],
      executor
    );
    if (!matter) throw new Error('Referenced Legal Matter not found.');
  }
  const id = randomUUID();
  await executeMutation(
    'INSERT INTO business_case_versions (id,tenant_id,business_case_id,version_no,lifecycle_status,objectives_need,options_json,benefits_json,cost_funding_basis_json,risks_json,assumptions_json,transaction_structure_json,negotiated_terms_json,recommendation,appraisal_id,legal_matter_id,created_by_party_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      id,
      context.tenantId,
      businessCaseId,
      versionNo,
      lifecycleStatus,
      required(input.objectivesNeed, 'Business Case objectives/need'),
      json(input.options),
      json(input.benefits),
      json(input.costFundingBasis),
      json(input.risks),
      json(input.assumptions),
      json(input.transactionStructure),
      json(input.negotiatedTerms),
      required(input.recommendation, 'Business Case recommendation'),
      appraisalId,
      legalMatterId,
      context.actorPartyId,
      now()
    ],
    executor
  );
  return id;
}

export async function createBusinessCase(
  context: CommandContext,
  input: {
    caseRef: string;
    caseType: string;
    title: string;
    sponsorPartyId?: string;
    primaryPartyId?: string;
    developmentOpportunityId?: string;
    objectivesNeed: string;
    options: unknown;
    benefits: unknown;
    costFundingBasis: unknown;
    risks: unknown;
    assumptions: unknown;
    transactionStructure?: unknown;
    negotiatedTerms?: unknown;
    recommendation: string;
    appraisalId?: string;
    legalMatterId?: string;
  }
) {
  const caseType = assertCaseManagePermission(context, input.caseType);
  const id = randomUUID();
  const createdAt = now();
  const sponsorPartyId = input.sponsorPartyId?.trim() || context.actorPartyId;

  await dbTransaction(async (connection) => {
    await assertActiveParty(context, sponsorPartyId, connection);
    const primaryPartyId = input.primaryPartyId?.trim() || null;
    if (primaryPartyId) await assertActiveParty(context, primaryPartyId, connection);
    const opportunityId = input.developmentOpportunityId?.trim() || null;
    if (opportunityId) await getOpportunity(context, opportunityId, connection);

    await executeMutation(
      "INSERT INTO business_cases (id,tenant_id,case_ref,case_type,title,sponsor_party_id,primary_party_id,development_opportunity_id,status,aggregate_version,current_version_no,approval_decision_id,approved_at,closed_at,created_by_party_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'DRAFT',1,1,NULL,NULL,NULL,?,?,?)",
      [
        id,
        context.tenantId,
        code(input.caseRef, 'Business Case reference', 191),
        caseType,
        required(input.title, 'Business Case title'),
        sponsorPartyId,
        primaryPartyId,
        opportunityId,
        context.actorPartyId,
        createdAt,
        createdAt
      ],
      connection
    );
    await insertBusinessCaseVersion(context, id, 1, 'DRAFT', input, connection);
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      id,
      1,
      'BUSINESS_CASE_CREATED',
      null,
      'DRAFT',
      {
        caseRef: code(input.caseRef, 'Business Case reference', 191),
        caseType,
        opportunityId,
        primaryPartyId
      },
      connection
    );
  });
  return id;
}

export async function reviseBusinessCase(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number,
  input: {
    objectivesNeed: string;
    options: unknown;
    benefits: unknown;
    costFundingBasis: unknown;
    risks: unknown;
    assumptions: unknown;
    transactionStructure?: unknown;
    negotiatedTerms?: unknown;
    recommendation: string;
    appraisalId?: string;
    legalMatterId?: string;
  }
) {
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    assertCaseManagePermission(context, businessCase.caseType);
    if (businessCase.aggregateVersion !== expectedVersion) {
      throw new Error('Business Case changed before the revision was created.');
    }
    if (!['DRAFT', 'DEVELOPING', 'REWORK'].includes(businessCase.status)) {
      throw new Error('Only editable Business Cases may be revised.');
    }

    const nextVersionNo = businessCase.currentVersionNo + 1;
    const nextAggregateVersion = expectedVersion + 1;
    const updatedAt = now();
    await insertBusinessCaseVersion(
      context,
      businessCaseId,
      nextVersionNo,
      'DEVELOPING',
      input,
      connection
    );
    const result = await executeMutation(
      "UPDATE business_cases SET status='DEVELOPING',aggregate_version=?,current_version_no=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [
        nextAggregateVersion,
        nextVersionNo,
        updatedAt,
        businessCaseId,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Business Case version conflict.');
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      businessCaseId,
      nextAggregateVersion,
      'BUSINESS_CASE_REVISED',
      businessCase.status,
      'DEVELOPING',
      { versionNo: nextVersionNo },
      connection
    );
    return nextAggregateVersion;
  });
}

export async function prepareBusinessCaseForDecision(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number
) {
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    assertCaseManagePermission(context, businessCase.caseType);
    if (businessCase.aggregateVersion !== expectedVersion) {
      throw new Error('Business Case changed before it was submitted for decision.');
    }
    if (!['DRAFT', 'DEVELOPING', 'REVIEW'].includes(businessCase.status)) {
      throw new Error('Business Case is not in a state that can request a decision.');
    }
    const nextVersion = expectedVersion + 1;
    const updatedAt = now();
    const result = await executeMutation(
      "UPDATE business_cases SET status='DECISION_REQUIRED',aggregate_version=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?",
      [nextVersion, updatedAt, businessCaseId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Business Case version conflict.');
    await executeMutation(
      "UPDATE business_case_versions SET lifecycle_status='DECISION_REQUIRED' WHERE business_case_id=? AND version_no=?",
      [businessCaseId, businessCase.currentVersionNo],
      connection
    );
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      businessCaseId,
      nextVersion,
      'BUSINESS_CASE_DECISION_REQUESTED',
      businessCase.status,
      'DECISION_REQUIRED',
      { versionNo: businessCase.currentVersionNo },
      connection
    );
    return nextVersion;
  });
}

export async function applyBusinessCaseDecision(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number,
  decisionId: string
) {
  assertPermission(context, 'corporate.development.transaction.approve');
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    if (businessCase.aggregateVersion !== expectedVersion || businessCase.status !== 'DECISION_REQUIRED') {
      throw new Error('Business Case is not awaiting the referenced decision.');
    }
    const decision = await queryOne<RowDataPacket & { outcome: string }>(
      'SELECT outcome FROM work_decisions WHERE id=? AND tenant_id=?',
      [decisionId, context.tenantId],
      connection
    );
    if (!decision) throw new Error('Business Case Decision not found.');
    if (!['APPROVED', 'REJECTED', 'REWORK'].includes(decision.outcome)) {
      throw new Error('Business Case Decision outcome is unsupported.');
    }
    await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'CORPORATE_DEVELOPMENT_BUSINESS_CASE_APPROVAL',
        subjectType: 'BUSINESS_CASE',
        subjectId: businessCaseId,
        subjectVersion: String(businessCase.currentVersionNo),
        outcome: decision.outcome
      },
      connection
    );

    const nextStatus =
      decision.outcome === 'APPROVED'
        ? 'APPROVED'
        : decision.outcome === 'REJECTED'
          ? 'REJECTED'
          : 'REWORK';
    const nextVersion = expectedVersion + 1;
    const decidedAt = now();
    const result = await executeMutation(
      'UPDATE business_cases SET status=?,aggregate_version=?,approval_decision_id=?,approved_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=?',
      [
        nextStatus,
        nextVersion,
        decisionId,
        decision.outcome === 'APPROVED' ? decidedAt : null,
        decidedAt,
        businessCaseId,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Business Case version conflict.');
    await executeMutation(
      'UPDATE business_case_versions SET lifecycle_status=? WHERE business_case_id=? AND version_no=?',
      [nextStatus, businessCaseId, businessCase.currentVersionNo],
      connection
    );
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      businessCaseId,
      nextVersion,
      'BUSINESS_CASE_DECISION_APPLIED',
      businessCase.status,
      nextStatus,
      { decisionId, outcome: decision.outcome, versionNo: businessCase.currentVersionNo },
      connection
    );
    return nextVersion;
  });
}

export async function recordBusinessCaseAgreement(
  context: CommandContext,
  businessCaseId: string,
  input: {
    agreementRole: string;
    subjectType: string;
    subjectId: string;
    subjectVersion?: string;
    executionStatus: string;
    executionReference?: string;
    executedAt?: string;
  }
) {
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    assertCaseManagePermission(context, businessCase.caseType);
    if (businessCase.status !== 'APPROVED') {
      throw new Error('Agreements may only be recorded against an active approved Business Case.');
    }
    const id = randomUUID();
    const recordedAt = now();
    await executeMutation(
      'INSERT INTO business_case_agreements (id,business_case_id,agreement_role,subject_type,subject_id,subject_version,execution_status,execution_reference,executed_at,recorded_by_party_id,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        id,
        businessCaseId,
        code(input.agreementRole, 'Agreement role', 64),
        code(input.subjectType, 'Agreement subject type', 64),
        required(input.subjectId, 'Agreement subject ID'),
        input.subjectVersion?.trim() || null,
        code(input.executionStatus, 'Agreement execution status', 32),
        input.executionReference?.trim() || null,
        input.executedAt?.trim() ? timestamp(input.executedAt, 'Agreement execution time') : null,
        context.actorPartyId,
        recordedAt
      ],
      connection
    );
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      businessCaseId,
      businessCase.aggregateVersion,
      'BUSINESS_CASE_AGREEMENT_RECORDED',
      businessCase.status,
      businessCase.status,
      {
        agreementRole: code(input.agreementRole, 'Agreement role', 64),
        subjectType: code(input.subjectType, 'Agreement subject type', 64),
        executionStatus: code(input.executionStatus, 'Agreement execution status', 32)
      },
      connection
    );
    return id;
  });
}

export async function closeBusinessCase(
  context: CommandContext,
  businessCaseId: string,
  expectedVersion: number
) {
  return dbTransaction(async (connection) => {
    const businessCase = await getBusinessCase(context, businessCaseId, connection, true);
    assertCaseManagePermission(context, businessCase.caseType);
    if (businessCase.aggregateVersion !== expectedVersion || businessCase.status !== 'APPROVED') {
      throw new Error('Only the current approved Business Case may be closed.');
    }
    const executedAgreement = await queryOne<RowDataPacket & { count: number }>(
      "SELECT COUNT(*) AS count FROM business_case_agreements WHERE business_case_id=? AND execution_status='EXECUTED'",
      [businessCaseId],
      connection
    );
    if (Number(executedAgreement?.count ?? 0) < 1) {
      throw new Error('Business Case completion requires at least one executed agreement reference.');
    }
    const nextVersion = expectedVersion + 1;
    const closedAt = now();
    const result = await executeMutation(
      "UPDATE business_cases SET status='CLOSED',aggregate_version=?,closed_at=?,updated_at=? WHERE id=? AND tenant_id=? AND aggregate_version=? AND status='APPROVED'",
      [nextVersion, closedAt, closedAt, businessCaseId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Business Case version conflict.');
    await executeMutation(
      "UPDATE business_case_versions SET lifecycle_status='CLOSED' WHERE business_case_id=? AND version_no=?",
      [businessCaseId, businessCase.currentVersionNo],
      connection
    );
    await evidence(
      context,
      'AGG-04-BUSINESS-CASE',
      'BusinessCase',
      businessCaseId,
      nextVersion,
      'BUSINESS_CASE_CLOSED',
      'APPROVED',
      'CLOSED',
      { versionNo: businessCase.currentVersionNo },
      connection
    );
    return nextVersion;
  });
}
