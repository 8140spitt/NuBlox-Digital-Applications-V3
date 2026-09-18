import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows, type DbExecutor } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';
import { assertWorkDecisionReference } from '$lib/server/work-decision';

export type BusinessPlan = {
  id: string;
  planRef: string;
  name: string;
  frameworkId: string;
  frameworkVersionNo: number;
  scopeType: string;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  ownerPartyId: string;
  status: string;
  aggregateVersion: number;
  currentVersionNo: number;
  resourceAssumptions: string;
  financialExpectations: string;
  measurableOutcomes: string;
  deliveryRoadmap: string;
  approvalDecisionId: string | null;
  updatedAt: string;
};

export type BusinessPlanVersion = {
  id: string;
  planId: string;
  versionNo: number;
  lifecycleStatus: string;
  resourceAssumptions: string;
  financialExpectations: string;
  measurableOutcomes: string;
  deliveryRoadmap: string;
  approvalDecisionId: string | null;
  createdByPartyId: string;
  createdAt: string;
};

export type BusinessPlanBasisReference = {
  id: string;
  versionNo: number;
};

export type BusinessPlanInput = {
  planRef: string;
  name: string;
  frameworkId: string;
  frameworkVersionNo: number;
  scopeType: string;
  scopeId: string;
  periodStart: string;
  periodEnd: string;
  ownerPartyId?: string;
  resourceAssumptions: string;
  financialExpectations: string;
  measurableOutcomes: string;
  deliveryRoadmap: string;
  objectives?: BusinessPlanBasisReference[];
  assumptions?: BusinessPlanBasisReference[];
};

const currentSelect = `
SELECT p.id,
       p.plan_ref AS planRef,
       p.name,
       p.framework_id AS frameworkId,
       p.framework_version_no AS frameworkVersionNo,
       p.scope_type AS scopeType,
       p.scope_id AS scopeId,
       p.period_start AS periodStart,
       p.period_end AS periodEnd,
       p.owner_party_id AS ownerPartyId,
       p.status,
       p.aggregate_version AS aggregateVersion,
       p.current_version_no AS currentVersionNo,
       v.resource_assumptions AS resourceAssumptions,
       v.financial_expectations AS financialExpectations,
       v.measurable_outcomes AS measurableOutcomes,
       v.delivery_roadmap AS deliveryRoadmap,
       v.approval_decision_id AS approvalDecisionId,
       p.updated_at AS updatedAt
  FROM business_plans p
  JOIN business_plan_versions v
    ON v.plan_id = p.id
   AND v.version_no = p.current_version_no
   AND v.tenant_id = p.tenant_id`;

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function code(value: string, label: string, max = 191) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function period(start: string, end: string) {
  const startDate = new Date(required(start, 'Plan period start'));
  const endDate = new Date(required(end, 'Plan period end'));
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error('Plan period dates are invalid.');
  }
  if (endDate <= startDate) throw new Error('Plan period end must be later than start.');
  return { periodStart: startDate.toISOString(), periodEnd: endDate.toISOString() };
}

async function assertParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active Business Plan owner Party not found.');
}

async function assertPublishedFrameworkVersion(
  context: CommandContext,
  frameworkId: string,
  frameworkVersionNo: number,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT v.id FROM strategy_framework_versions v JOIN strategy_frameworks f ON f.id = v.framework_id WHERE v.framework_id = ? AND v.version_no = ? AND v.status = 'PUBLISHED' AND f.tenant_id = ?",
    [frameworkId, frameworkVersionNo, context.tenantId],
    executor
  );
  if (!row) throw new Error('Business Plan must reference an exact published Strategy Framework version.');
}

async function assertObjectiveReference(
  context: CommandContext,
  reference: BusinessPlanBasisReference,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { status: string }>(
    'SELECT o.status FROM strategic_objectives o JOIN strategic_objective_versions v ON v.objective_id = o.id AND v.version_no = ? WHERE o.id = ? AND o.tenant_id = ?',
    [reference.versionNo, reference.id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Strategic Objective version not found.');
  if (!['APPROVED','ACTIVE','ACHIEVED','NOT_ACHIEVED'].includes(row.status)) {
    throw new Error('Business Plan may only pin an approved or active Strategic Objective.');
  }
}

async function assertAssumptionReference(
  context: CommandContext,
  reference: BusinessPlanBasisReference,
  executor: DbExecutor
) {
  const row = await queryOne<RowDataPacket & { lifecycleStatus: string }>(
    'SELECT v.lifecycle_status AS lifecycleStatus FROM strategic_assumptions a JOIN strategic_assumption_versions v ON v.assumption_id = a.id AND v.version_no = ? WHERE a.id = ? AND a.tenant_id = ?',
    [reference.versionNo, reference.id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Strategic Assumption version not found.');
  if (!['ACCEPTED','ACTIVE','CHALLENGED'].includes(row.lifecycleStatus)) {
    throw new Error('Business Plan may only pin an assessed Strategic Assumption version.');
  }
}

async function getPlan(context: CommandContext, id: string, executor?: DbExecutor, forUpdate = false) {
  const row = await queryOne<RowDataPacket & BusinessPlan>(
    currentSelect + ' WHERE p.id = ? AND p.tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Business Plan not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  plan: BusinessPlan,
  eventType: string,
  fromState: string | null,
  toState: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    { aggregateId: 'AGG-02-STRATEGY', objectType: 'business_plan', objectId: plan.id, action: eventType, fromState: fromState ?? undefined, toState },
    executor
  );
  await emitBusinessEvent(
    context,
    { aggregateId: 'AGG-02-STRATEGY', aggregateType: 'BusinessPlan', aggregateObjectId: plan.id, aggregateVersion: plan.aggregateVersion, eventType, topic: 'nublox.strategy.business-plan', payload },
    executor
  );
}

async function insertPlanVersion(
  context: CommandContext,
  planId: string,
  versionNo: number,
  input: Pick<BusinessPlanInput,'resourceAssumptions'|'financialExpectations'|'measurableOutcomes'|'deliveryRoadmap'|'objectives'|'assumptions'>,
  executor: DbExecutor
) {
  const objectives = input.objectives ?? [];
  const assumptions = input.assumptions ?? [];
  for (const reference of objectives) await assertObjectiveReference(context, reference, executor);
  for (const reference of assumptions) await assertAssumptionReference(context, reference, executor);

  const versionId = randomUUID();
  await executeMutation(
    "INSERT INTO business_plan_versions (id, tenant_id, plan_id, version_no, lifecycle_status, resource_assumptions, financial_expectations, measurable_outcomes, delivery_roadmap, approval_decision_id, created_by_party_id, created_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, NULL, ?, ?)",
    [versionId, context.tenantId, planId, versionNo, required(input.resourceAssumptions, 'Resource assumptions'), required(input.financialExpectations, 'Financial expectations'), required(input.measurableOutcomes, 'Measurable outcomes'), required(input.deliveryRoadmap, 'Delivery roadmap'), context.actorPartyId, now()],
    executor
  );
  for (const reference of objectives) {
    await executeMutation(
      'INSERT INTO business_plan_objectives (plan_version_id, objective_id, objective_version_no) VALUES (?, ?, ?)',
      [versionId, reference.id, reference.versionNo],
      executor
    );
  }
  for (const reference of assumptions) {
    await executeMutation(
      'INSERT INTO business_plan_assumptions (plan_version_id, assumption_id, assumption_version_no) VALUES (?, ?, ?)',
      [versionId, reference.id, reference.versionNo],
      executor
    );
  }
  return versionId;
}

export async function listBusinessPlans(context: CommandContext) {
  assertPermission(context, 'strategy.plan.read');
  return queryRows<RowDataPacket & BusinessPlan>(
    currentSelect + ' WHERE p.tenant_id = ? ORDER BY p.period_start DESC, p.plan_ref',
    [context.tenantId]
  );
}

export async function listBusinessPlanVersions(context: CommandContext, planId: string) {
  assertPermission(context, 'strategy.plan.read');
  await getPlan(context, planId);
  return queryRows<RowDataPacket & BusinessPlanVersion>(
    'SELECT id, plan_id AS planId, version_no AS versionNo, lifecycle_status AS lifecycleStatus, resource_assumptions AS resourceAssumptions, financial_expectations AS financialExpectations, measurable_outcomes AS measurableOutcomes, delivery_roadmap AS deliveryRoadmap, approval_decision_id AS approvalDecisionId, created_by_party_id AS createdByPartyId, created_at AS createdAt FROM business_plan_versions WHERE tenant_id = ? AND plan_id = ? ORDER BY version_no DESC',
    [context.tenantId, planId]
  );
}

export async function listBusinessPlanObjectiveReferences(context: CommandContext, planVersionId: string) {
  assertPermission(context, 'strategy.plan.read');
  return queryRows<RowDataPacket & { objectiveId: string; objectiveVersionNo: number }>(
    'SELECT bpo.objective_id AS objectiveId, bpo.objective_version_no AS objectiveVersionNo FROM business_plan_objectives bpo JOIN business_plan_versions bpv ON bpv.id = bpo.plan_version_id WHERE bpo.plan_version_id = ? AND bpv.tenant_id = ? ORDER BY bpo.objective_id',
    [planVersionId, context.tenantId]
  );
}

export async function listBusinessPlanAssumptionReferences(context: CommandContext, planVersionId: string) {
  assertPermission(context, 'strategy.plan.read');
  return queryRows<RowDataPacket & { assumptionId: string; assumptionVersionNo: number }>(
    'SELECT bpa.assumption_id AS assumptionId, bpa.assumption_version_no AS assumptionVersionNo FROM business_plan_assumptions bpa JOIN business_plan_versions bpv ON bpv.id = bpa.plan_version_id WHERE bpa.plan_version_id = ? AND bpv.tenant_id = ? ORDER BY bpa.assumption_id',
    [planVersionId, context.tenantId]
  );
}

export async function createBusinessPlan(context: CommandContext, input: BusinessPlanInput) {
  assertPermission(context, 'strategy.plan.manage');
  const planRef = code(input.planRef, 'Business Plan reference');
  const ownerPartyId = input.ownerPartyId?.trim() || context.actorPartyId;
  const scopeType = code(input.scopeType, 'Business Plan scope type', 64);
  const scopeId = required(input.scopeId, 'Business Plan scope ID');
  const dates = period(input.periodStart, input.periodEnd);

  return dbTransaction(async (connection) => {
    await assertPublishedFrameworkVersion(context, input.frameworkId, input.frameworkVersionNo, connection);
    await assertParty(context, ownerPartyId, connection);
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO business_plans (id, tenant_id, plan_ref, name, framework_id, framework_version_no, scope_type, scope_id, period_start, period_end, owner_party_id, status, aggregate_version, current_version_no, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', 1, 1, ?, ?)",
      [id, context.tenantId, planRef, required(input.name, 'Business Plan name'), input.frameworkId, input.frameworkVersionNo, scopeType, scopeId, dates.periodStart, dates.periodEnd, ownerPartyId, timestamp, timestamp],
      connection
    );
    const versionId = await insertPlanVersion(context, id, 1, input, connection);
    const created = await getPlan(context, id, connection);
    await evidence(context, created, 'BUSINESS_PLAN_CREATED', null, 'DRAFT', { planRef, versionId, frameworkId: input.frameworkId, frameworkVersionNo: input.frameworkVersionNo }, connection);
    return id;
  });
}

export async function reviseBusinessPlan(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  input: Pick<BusinessPlanInput,'resourceAssumptions'|'financialExpectations'|'measurableOutcomes'|'deliveryRoadmap'|'objectives'|'assumptions'>
) {
  assertPermission(context, 'strategy.plan.manage');
  return dbTransaction(async (connection) => {
    const current = await getPlan(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Business Plan changed after you opened it.');
    if (!['DRAFT','CURRENT'].includes(current.status)) throw new Error('Only draft or current Business Plans can be revised.');
    const nextVersionNo = current.currentVersionNo + 1;
    const versionId = await insertPlanVersion(context, current.id, nextVersionNo, input, connection);
    const result = await executeMutation(
      "UPDATE business_plans SET status = 'DRAFT', aggregate_version = aggregate_version + 1, current_version_no = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [nextVersionNo, now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Business Plan revision detected.');
    const updated = await getPlan(context, current.id, connection);
    await evidence(context, updated, 'BUSINESS_PLAN_REVISED', current.status, 'DRAFT', { versionId, versionNo: nextVersionNo }, connection);
  });
}

export async function submitBusinessPlan(context: CommandContext, id: string, expectedAggregateVersion: number) {
  assertPermission(context, 'strategy.plan.manage');
  return dbTransaction(async (connection) => {
    const current = await getPlan(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Business Plan changed after you opened it.');
    if (current.status !== 'DRAFT') throw new Error('Only a draft Business Plan can be submitted.');
    const result = await executeMutation(
      "UPDATE business_plans SET status = 'IN_REVIEW', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Business Plan submission detected.');
    await executeMutation(
      "UPDATE business_plan_versions SET lifecycle_status = 'REVIEW' WHERE plan_id = ? AND version_no = ?",
      [current.id, current.currentVersionNo],
      connection
    );
    const updated = await getPlan(context, current.id, connection);
    await evidence(context, updated, 'BUSINESS_PLAN_SUBMITTED', 'DRAFT', 'IN_REVIEW', { versionNo: current.currentVersionNo }, connection);
  });
}

export async function approveBusinessPlan(
  context: CommandContext,
  id: string,
  expectedAggregateVersion: number,
  decisionId: string
) {
  assertPermission(context, 'strategy.plan.approve');
  return dbTransaction(async (connection) => {
    const current = await getPlan(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Business Plan changed after you opened it.');
    if (current.status !== 'IN_REVIEW') throw new Error('Only an in-review Business Plan can be approved.');
    const decision = await assertWorkDecisionReference(
      context,
      {
        decisionId,
        decisionType: 'BUSINESS_PLAN_APPROVAL',
        subjectType: 'BUSINESS_PLAN',
        subjectId: current.id,
        subjectVersion: String(current.currentVersionNo),
        outcome: 'APPROVED'
      },
      connection
    );
    const result = await executeMutation(
      "UPDATE business_plans SET status = 'APPROVED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Business Plan approval detected.');
    await executeMutation(
      "UPDATE business_plan_versions SET lifecycle_status = 'APPROVED', approval_decision_id = ? WHERE plan_id = ? AND version_no = ?",
      [decision.id, current.id, current.currentVersionNo],
      connection
    );
    const updated = await getPlan(context, current.id, connection);
    await evidence(context, updated, 'BUSINESS_PLAN_APPROVED', 'IN_REVIEW', 'APPROVED', { versionNo: current.currentVersionNo, decisionId: decision.id }, connection);
  });
}

export async function activateBusinessPlan(context: CommandContext, id: string, expectedAggregateVersion: number) {
  assertPermission(context, 'strategy.plan.approve');
  return dbTransaction(async (connection) => {
    const current = await getPlan(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Business Plan changed after you opened it.');
    if (current.status !== 'APPROVED') throw new Error('Only an approved Business Plan can become current.');
    await executeMutation(
      "UPDATE business_plan_versions SET lifecycle_status = 'SUPERSEDED' WHERE plan_id = ? AND lifecycle_status = 'CURRENT' AND version_no <> ?",
      [current.id, current.currentVersionNo],
      connection
    );
    await executeMutation(
      "UPDATE business_plan_versions SET lifecycle_status = 'CURRENT' WHERE plan_id = ? AND version_no = ?",
      [current.id, current.currentVersionNo],
      connection
    );
    const result = await executeMutation(
      "UPDATE business_plans SET status = 'CURRENT', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Business Plan activation detected.');
    const updated = await getPlan(context, current.id, connection);
    await evidence(context, updated, 'BUSINESS_PLAN_CURRENT', 'APPROVED', 'CURRENT', { versionNo: current.currentVersionNo }, connection);
  });
}

export async function closeBusinessPlan(context: CommandContext, id: string, expectedAggregateVersion: number) {
  assertPermission(context, 'strategy.plan.approve');
  return dbTransaction(async (connection) => {
    const current = await getPlan(context, id, connection, true);
    if (current.aggregateVersion !== expectedAggregateVersion) throw new Error('This Business Plan changed after you opened it.');
    if (current.status !== 'CURRENT') throw new Error('Only a current Business Plan can be closed.');
    const result = await executeMutation(
      "UPDATE business_plans SET status = 'CLOSED', aggregate_version = aggregate_version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND aggregate_version = ?",
      [now(), current.id, context.tenantId, expectedAggregateVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Business Plan closure detected.');
    await executeMutation(
      "UPDATE business_plan_versions SET lifecycle_status = 'CLOSED' WHERE plan_id = ? AND version_no = ?",
      [current.id, current.currentVersionNo],
      connection
    );
    const updated = await getPlan(context, current.id, connection);
    await evidence(context, updated, 'BUSINESS_PLAN_CLOSED', 'CURRENT', 'CLOSED', { versionNo: current.currentVersionNo }, connection);
  });
}
