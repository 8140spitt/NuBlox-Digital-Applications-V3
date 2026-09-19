import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let strategy: typeof import('./strategy-framework');
let objective: typeof import('./strategic-objective');
let decision: typeof import('./work-decision');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  strategy = await import('./strategy-framework');
  objective = await import('./strategic-objective');
  decision = await import('./work-decision');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F01.03 Strategic Objective runtime', () => {
  it('binds objective identity to an exact published Strategy Framework version', async () => {
    const tenant = 'objective-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const frameworkId = await strategy.createStrategyFramework(context, {
      title: 'Enterprise Strategy',
      purpose: 'Create long-term enterprise value.',
      vision: 'Be the leading built-environment delivery platform.',
      mission: 'Deliver safely, predictably and sustainably.',
      direction: 'Digitise delivery and grow recurring service value.',
      reviewCadence: 'Annual'
    });
    await strategy.submitStrategyFramework(context, frameworkId);
    const approvalDecisionId = await decision.recordWorkDecision(context, {
      decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved for objective alignment.'
    });
    await strategy.approveStrategyFramework(context, frameworkId, approvalDecisionId);
    await strategy.publishStrategyFramework(context, frameworkId);

    const objectiveId = await objective.createStrategicObjective(context, {
      objectiveRef: 'OBJ-DIGITAL-01',
      frameworkId,
      frameworkVersionNo: 1,
      statement: 'Reduce avoidable delivery variance through digital control.',
      successCriteria: 'Portfolio schedule/cost variance and rework trend improve year-on-year.',
      priority: 'HIGH',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      horizonStart: '2026-10-01',
      horizonEnd: '2029-10-01'
    });

    let current = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    expect(current.frameworkVersionNo).toBe(1);
    expect(current.status).toBe('PROPOSED');
    expect(current.aggregateVersion).toBe(1);

    await objective.reviseStrategicObjective(context, objectiveId, current.aggregateVersion, {
      statement: 'Reduce avoidable delivery variance through governed digital controls.',
      successCriteria:
        'Portfolio schedule/cost variance, rework and decision latency improve year-on-year.',
      priority: 'CRITICAL',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      horizonStart: '2026-10-01',
      horizonEnd: '2029-10-01'
    });
    current = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    expect(current.currentVersionNo).toBe(2);

    await objective.transitionStrategicObjective(
      context,
      objectiveId,
      current.aggregateVersion,
      'APPROVE'
    );
    current = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    await objective.transitionStrategicObjective(
      context,
      objectiveId,
      current.aggregateVersion,
      'ACTIVATE'
    );
    current = (await objective.listStrategicObjectives(context)).find(
      (row) => row.id === objectiveId
    )!;
    expect(current.status).toBe('ACTIVE');

    const versions = await objective.listStrategicObjectiveVersions(context, objectiveId);
    expect(versions.map((row) => row.versionNo)).toEqual([2, 1]);

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-02-OBJECTIVE' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, objectiveId]
    );
    expect(events.map((row) => row.eventType)).toEqual([
      'STRATEGIC_OBJECTIVE_PROPOSED',
      'STRATEGIC_OBJECTIVE_REVISED',
      'STRATEGIC_OBJECTIVE_APPROVED',
      'STRATEGIC_OBJECTIVE_ACTIVATED'
    ]);
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4]);
  });

  it('rejects objective creation against an unpublished strategy version', async () => {
    const tenant = 'objective-invalid-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const frameworkId = await strategy.createStrategyFramework(context, {
      title: 'Draft Strategy',
      purpose: '',
      vision: '',
      mission: '',
      direction: '',
      reviewCadence: 'Annual'
    });
    await strategy.submitStrategyFramework(context, frameworkId);

    await expect(
      objective.createStrategicObjective(context, {
        objectiveRef: 'OBJ-INVALID',
        frameworkId,
        frameworkVersionNo: 1,
        statement: 'Should not persist.',
        successCriteria: 'None',
        priority: 'LOW'
      })
    ).rejects.toThrow('published Strategy Framework version');
  });
});
