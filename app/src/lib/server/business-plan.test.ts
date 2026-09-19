import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let strategy: typeof import('./strategy-framework');
let objective: typeof import('./strategic-objective');
let assumption: typeof import('./strategic-assumption');
let plan: typeof import('./business-plan');
let decision: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  strategy = await import('./strategy-framework');
  objective = await import('./strategic-objective');
  assumption = await import('./strategic-assumption');
  plan = await import('./business-plan');
  decision = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

async function publishedStrategy(
  context: Awaited<ReturnType<typeof contextService.resolveDevelopmentCommandContext>>
) {
  const frameworkId = await strategy.createStrategyFramework(context, {
    title: 'Business Plan Strategy',
    purpose: 'Guide enterprise planning.',
    vision: 'Predictable growth.',
    mission: 'Execute strategy with control.',
    direction: 'Prioritise resilient, digitally enabled growth.',
    reviewCadence: 'Annual'
  });
  await strategy.submitStrategyFramework(context, frameworkId);
  const decisionId = await decision.recordWorkDecision(context, {
    decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
    subjectType: 'STRATEGY_FRAMEWORK',
    subjectId: frameworkId,
    subjectVersion: '1',
    outcome: 'APPROVED',
    reason: 'Approved for planning.'
  });
  await strategy.approveStrategyFramework(context, frameworkId, decisionId);
  await strategy.publishStrategyFramework(context, frameworkId);
  return frameworkId;
}

describe('F01.04 Business Plan runtime', () => {
  it('pins exact objective and assumption versions and preserves approved baselines', async () => {
    const tenant = 'business-plan-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const frameworkId = await publishedStrategy(context);

    const objectiveId = await objective.createStrategicObjective(context, {
      objectiveRef: 'OBJ-GROWTH-01',
      frameworkId,
      frameworkVersionNo: 1,
      statement: 'Grow recurring service revenue.',
      successCriteria: 'Recurring revenue share increases.',
      priority: 'HIGH'
    });
    let objectiveRow = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    await objective.transitionStrategicObjective(
      context,
      objectiveId,
      objectiveRow.aggregateVersion,
      'APPROVE'
    );
    objectiveRow = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    await objective.transitionStrategicObjective(
      context,
      objectiveId,
      objectiveRow.aggregateVersion,
      'ACTIVATE'
    );
    objectiveRow = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;

    const assumptionId = await assumption.createStrategicAssumption(context, {
      assumptionRef: 'PLAN-MARKET-001',
      category: 'MARKET',
      statement: 'Demand for managed built-environment services grows.',
      basisSummary: 'Market and client evidence.',
      confidencePercent: 70
    });
    let assumptionRow = (await assumption.listStrategicAssumptions(context)).find(
      (row) => row.id === assumptionId
    )!;
    await assumption.assessStrategicAssumption(
      context,
      assumptionId,
      assumptionRow.aggregateVersion,
      {
        outcome: 'ACCEPT',
        note: 'Accepted planning basis.'
      }
    );
    assumptionRow = (await assumption.listStrategicAssumptions(context)).find(
      (row) => row.id === assumptionId
    )!;

    const planId = await plan.createBusinessPlan(context, {
      planRef: 'BP-2027',
      name: 'FY27 Enterprise Business Plan',
      frameworkId,
      frameworkVersionNo: 1,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      periodStart: '2027-01-01',
      periodEnd: '2028-01-01',
      resourceAssumptions: 'Capability investment focused on digital delivery and asset services.',
      financialExpectations:
        'Planning expectation: profitable growth with disciplined cash conversion.',
      measurableOutcomes: 'Recurring revenue mix and project predictability improve.',
      deliveryRoadmap: 'Q1 mobilisation; Q2-Q4 staged execution.',
      objectives: [{ id: objectiveId, versionNo: objectiveRow.currentVersionNo }],
      assumptions: [{ id: assumptionId, versionNo: assumptionRow.currentVersionNo }]
    });

    let current = (await plan.listBusinessPlans(context)).find((row) => row.id === planId)!;
    expect(current.status).toBe('DRAFT');
    const initialVersion = (await plan.listBusinessPlanVersions(context, planId))[0];
    expect(await plan.listBusinessPlanObjectiveReferences(context, initialVersion.id)).toEqual([
      { objectiveId, objectiveVersionNo: objectiveRow.currentVersionNo }
    ]);
    expect(await plan.listBusinessPlanAssumptionReferences(context, initialVersion.id)).toEqual([
      { assumptionId, assumptionVersionNo: assumptionRow.currentVersionNo }
    ]);

    await plan.submitBusinessPlan(context, planId, current.aggregateVersion);
    current = (await plan.listBusinessPlans(context)).find((row) => row.id === planId)!;
    const approvalDecisionId = await decision.recordWorkDecision(context, {
      decisionType: 'BUSINESS_PLAN_APPROVAL',
      subjectType: 'BUSINESS_PLAN',
      subjectId: planId,
      subjectVersion: String(current.currentVersionNo),
      outcome: 'APPROVED',
      reason: 'Business Plan approved.'
    });
    await plan.approveBusinessPlan(context, planId, current.aggregateVersion, approvalDecisionId);
    current = (await plan.listBusinessPlans(context)).find((row) => row.id === planId)!;
    await plan.activateBusinessPlan(context, planId, current.aggregateVersion);
    current = (await plan.listBusinessPlans(context)).find((row) => row.id === planId)!;
    expect(current.status).toBe('CURRENT');

    await plan.reviseBusinessPlan(context, planId, current.aggregateVersion, {
      resourceAssumptions: 'Revised capability investment including data engineering.',
      financialExpectations: 'Planning expectation revised after market review.',
      measurableOutcomes: 'Recurring revenue, cash conversion and predictability improve.',
      deliveryRoadmap: 'Revised H1 mobilisation and H2 scale-up.',
      objectives: [{ id: objectiveId, versionNo: objectiveRow.currentVersionNo }],
      assumptions: [{ id: assumptionId, versionNo: assumptionRow.currentVersionNo }]
    });
    current = (await plan.listBusinessPlans(context)).find((row) => row.id === planId)!;
    expect(current.status).toBe('DRAFT');
    expect(current.currentVersionNo).toBe(2);

    const versions = await plan.listBusinessPlanVersions(context, planId);
    expect(versions.map((row) => [row.versionNo, row.lifecycleStatus])).toEqual([
      [2, 'DRAFT'],
      [1, 'CURRENT']
    ]);

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-02-STRATEGY' AND aggregate_type = 'BusinessPlan' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, planId]
    );
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4, 5]);
  });
});
