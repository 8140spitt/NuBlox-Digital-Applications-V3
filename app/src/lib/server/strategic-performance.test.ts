import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let strategy: typeof import('./strategy-framework');
let objective: typeof import('./strategic-objective');
let decision: typeof import('./work-decision');
let reference: typeof import('./reference-data');
let performance: typeof import('./strategic-performance');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  strategy = await import('./strategy-framework');
  objective = await import('./strategic-objective');
  decision = await import('./work-decision');
  reference = await import('./reference-data');
  performance = await import('./strategic-performance');
  db = await import('./db');
});
afterAll(async () => {
  await db.closeDbPool();
});

describe('F01.06 strategic performance runtime', () => {
  it('separates KPI meaning, target, observation, baseline, variance and corrective work', async () => {
    const tenant = 'performance-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const unitId = await reference.createUnitOfMeasure(context, {
      unitCode: 'PCT',
      symbol: '%',
      name: 'percent',
      dimensionKey: 'RATIO'
    });

    const frameworkId = await strategy.createStrategyFramework(context, {
      title: 'Performance Strategy',
      purpose: 'Measure execution.',
      vision: 'Predictable outcomes.',
      mission: 'Use governed performance evidence.',
      direction: 'Manage against strategic outcomes.',
      reviewCadence: 'Quarterly'
    });
    await strategy.submitStrategyFramework(context, frameworkId);
    const strategyDecision = await decision.recordWorkDecision(context, {
      decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved for performance management.'
    });
    await strategy.approveStrategyFramework(context, frameworkId, strategyDecision);
    await strategy.publishStrategyFramework(context, frameworkId);

    const objectiveId = await objective.createStrategicObjective(context, {
      objectiveRef: 'OBJ-PREDICT-01',
      frameworkId,
      frameworkVersionNo: 1,
      statement: 'Improve delivery predictability.',
      successCriteria: 'Portfolio schedule predictability improves.',
      priority: 'CRITICAL'
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

    const kpiId = await performance.createKpiDefinition(context, {
      kpiCode: 'KPI-ON-TIME',
      name: 'On-time milestone rate',
      businessDefinition: 'Percentage of governed milestones achieved on or before committed date.',
      formula: 'on_time_milestones / due_milestones * 100',
      unitOfMeasureId: unitId,
      frequency: 'MONTHLY',
      dimensions: ['PROJECT', 'REGION'],
      sourceData: 'Governed project schedule milestone observations.',
      qualityRules: 'Exclude cancelled milestones; require approved baseline dates.',
      objectives: [{ id: objectiveId, versionNo: objectiveRow.currentVersionNo }]
    });
    let kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.validateKpiDefinition(context, kpiId, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.publishKpiDefinition(context, kpiId, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.activateKpiDefinition(context, kpiId, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    expect(kpi.status).toBe('EFFECTIVE');

    const targetId = await performance.createPerformanceTarget(context, {
      targetRef: 'TGT-ON-TIME-FY27',
      kpiId,
      kpiVersionNo: kpi.currentVersionNo,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      periodStart: '2027-01-01',
      periodEnd: '2028-01-01',
      targetValue: 90,
      comparisonOperator: 'GREATER_EQUAL'
    });
    let target = (await performance.listPerformanceTargets(context, kpiId)).find(
      (row) => row.id === targetId
    )!;
    await performance.transitionPerformanceTarget(
      context,
      targetId,
      target.aggregateVersion,
      'APPROVE'
    );
    target = (await performance.listPerformanceTargets(context, kpiId)).find(
      (row) => row.id === targetId
    )!;
    await performance.transitionPerformanceTarget(
      context,
      targetId,
      target.aggregateVersion,
      'ACTIVATE'
    );

    const observationId = await performance.recordPerformanceObservation(context, {
      kpiId,
      kpiVersionNo: kpi.currentVersionNo,
      subjectType: 'TENANT',
      subjectId: context.tenantId,
      periodStart: '2027-01-01',
      periodEnd: '2028-01-01',
      numericValue: 84,
      sourceReference: 'schedule-warehouse://fy27/month-03'
    });
    await performance.validatePerformanceObservation(context, observationId);
    await performance.createPerformanceBaseline(context, {
      baselineRef: 'BL-ON-TIME-FY27',
      observationId,
      scopeType: 'TENANT',
      scopeId: context.tenantId
    });

    const variance = await performance.getPerformanceVariance(context, {
      kpiId,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      periodStart: '2027-01-01',
      periodEnd: '2028-01-01'
    });
    expect(variance.delta).toBe(-6);
    expect(variance.onTarget).toBe(false);
    expect(variance.baseline?.observationId).toBe(observationId);

    const action = await performance.createPerformanceCorrectiveAction(context, {
      kpiId,
      kpiVersionNo: kpi.currentVersionNo,
      title: 'Recover milestone predictability',
      instructions: 'Review late milestone causes and create recovery actions.',
      priority: 'HIGH'
    });
    const work = await db.queryOne<any>(
      'SELECT subject_type AS subjectType,subject_id AS subjectId,status FROM work_items WHERE id=? AND tenant_id=?',
      [action.workItemId, context.tenantId]
    );
    expect(work).toMatchObject({
      subjectType: 'KPI_DEFINITION',
      subjectId: kpiId,
      status: 'READY'
    });
  });
});
