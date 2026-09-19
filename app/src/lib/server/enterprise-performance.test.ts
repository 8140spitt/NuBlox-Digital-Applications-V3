import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let strategy: typeof import('./strategy-framework');
let objective: typeof import('./strategic-objective');
let decision: typeof import('./work-decision');
let reference: typeof import('./reference-data');
let performance: typeof import('./strategic-performance');
let enterprise: typeof import('./enterprise-performance');
let governance: typeof import('./governance-body');
let review: typeof import('./performance-management-review');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  strategy = await import('./strategy-framework');
  objective = await import('./strategic-objective');
  decision = await import('./work-decision');
  reference = await import('./reference-data');
  performance = await import('./strategic-performance');
  enterprise = await import('./enterprise-performance');
  governance = await import('./governance-body');
  review = await import('./performance-management-review');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F03 Enterprise Performance Management runtime', () => {
  it('pins reproducible performance evidence through reporting, benchmarking, benefits and management review', async () => {
    const tenant = 'enterprise-performance-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const unitId = await reference.createUnitOfMeasure(context, {
      unitCode: 'PCT',
      symbol: '%',
      name: 'percent',
      dimensionKey: 'RATIO'
    });

    const frameworkId = await strategy.createStrategyFramework(context, {
      title: 'Enterprise Performance Strategy',
      purpose: 'Govern enterprise operating performance.',
      vision: 'Predictable delivery and measurable outcomes.',
      mission: 'Use reproducible evidence to manage performance.',
      direction: 'Integrate strategic intent and operating results.',
      reviewCadence: 'Monthly'
    });
    await strategy.submitStrategyFramework(context, frameworkId);
    const frameworkDecision = await decision.recordWorkDecision(context, {
      decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
      subjectType: 'STRATEGY_FRAMEWORK',
      subjectId: frameworkId,
      subjectVersion: '1',
      outcome: 'APPROVED',
      reason: 'Approved as the enterprise performance planning basis.'
    });
    await strategy.approveStrategyFramework(context, frameworkId, frameworkDecision);
    await strategy.publishStrategyFramework(context, frameworkId);

    const objectiveId = await objective.createStrategicObjective(context, {
      objectiveRef: 'OBJ-EPM-01',
      frameworkId,
      frameworkVersionNo: 1,
      statement: 'Improve predictable delivery.',
      successCriteria: 'Enterprise on-time performance exceeds target.',
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
      kpiCode: 'KPI-EPM-OTD',
      name: 'Enterprise on-time delivery',
      businessDefinition: 'Percentage of governed commitments delivered on time.',
      formula: 'on_time / due * 100',
      unitOfMeasureId: unitId,
      frequency: 'MONTHLY',
      dimensions: ['BUSINESS_UNIT'],
      sourceData: 'Validated governed delivery observations.',
      qualityRules: 'Use approved baselines and exclude cancelled commitments.',
      objectives: [{ id: objectiveId, versionNo: objectiveRow.currentVersionNo }]
    });
    let kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.validateKpiDefinition(context, kpi.id, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.publishKpiDefinition(context, kpi.id, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;
    await performance.activateKpiDefinition(context, kpi.id, kpi.aggregateVersion);
    kpi = (await performance.listKpiDefinitions(context)).find((row) => row.id === kpiId)!;

    const targetId = await performance.createPerformanceTarget(context, {
      targetRef: 'TGT-EPM-FY27',
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
      target.id,
      target.aggregateVersion,
      'APPROVE'
    );
    target = (await performance.listPerformanceTargets(context, kpiId)).find(
      (row) => row.id === targetId
    )!;
    await performance.transitionPerformanceTarget(
      context,
      target.id,
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
      numericValue: 86,
      sourceReference: 'performance-warehouse://fy27'
    });
    await performance.validatePerformanceObservation(context, observationId);
    const baselineId = await performance.createPerformanceBaseline(context, {
      baselineRef: 'BL-EPM-FY27',
      observationId,
      scopeType: 'TENANT',
      scopeId: context.tenantId
    });

    const scorecardId = await enterprise.createPerformanceScorecard(context, {
      scorecardRef: 'SC-ENTERPRISE',
      name: 'Enterprise Scorecard',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      nodes: [
        {
          nodeKey: 'ENTERPRISE',
          name: 'Enterprise performance',
          kpis: [{ kpiId, kpiVersionNo: kpi.currentVersionNo, weight: 100 }]
        }
      ]
    });
    let scorecard = (await enterprise.listPerformanceScorecards(context)).find(
      (row) => row.id === scorecardId
    )!;
    await enterprise.publishPerformanceScorecard(
      context,
      scorecard.id,
      scorecard.aggregateVersion
    );
    scorecard = (await enterprise.listPerformanceScorecards(context)).find(
      (row) => row.id === scorecardId
    )!;
    expect(scorecard.status).toBe('PUBLISHED');

    const snapshotId = await enterprise.calculatePerformanceSnapshot(context, {
      snapshotRef: 'PS-FY27-M03',
      scorecardId,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      periodStart: '2027-01-01',
      periodEnd: '2028-01-01',
      asOfAt: '2027-04-01T00:00:00Z'
    });
    let snapshot = (await enterprise.listPerformanceSnapshots(context)).find(
      (row) => row.id === snapshotId
    )!;
    expect(snapshot.qualityStatus).toBe('COMPLETE');
    const snapshotItems = await enterprise.listPerformanceSnapshotItems(context, snapshotId);
    expect(snapshotItems).toHaveLength(1);
    expect(Number(snapshotItems[0].actualValue)).toBe(86);
    expect(Number(snapshotItems[0].targetValue)).toBe(90);
    expect(Number(snapshotItems[0].varianceValue)).toBe(-4);
    expect(snapshotItems[0].performanceStatus).toBe('OFF_TARGET');

    await enterprise.reviewPerformanceSnapshot(context, snapshotId, snapshot.aggregateVersion);
    snapshot = (await enterprise.listPerformanceSnapshots(context)).find(
      (row) => row.id === snapshotId
    )!;
    const snapshotDecisionId = await decision.recordWorkDecision(context, {
      decisionType: 'PERFORMANCE_SNAPSHOT_REVIEW',
      subjectType: 'PERFORMANCE_SNAPSHOT',
      subjectId: snapshotId,
      subjectVersion: String(snapshot.aggregateVersion),
      outcome: 'APPROVED',
      reason: 'Snapshot inputs, completeness and calculated results were reviewed.'
    });
    await enterprise.publishPerformanceSnapshot(
      context,
      snapshotId,
      snapshot.aggregateVersion,
      snapshotDecisionId
    );
    snapshot = (await enterprise.listPerformanceSnapshots(context)).find(
      (row) => row.id === snapshotId
    )!;
    expect(snapshot.status).toBe('PUBLISHED');
    expect(snapshot.reviewDecisionId).toBe(snapshotDecisionId);

    await enterprise.distributePerformanceSnapshot(context, snapshotId, {
      recipientPartyId: context.actorPartyId,
      channel: 'WORKSPACE',
      distributionReference: 'F03 management dashboard'
    });

    const benchmarkTargetId = await performance.createPerformanceTarget(context, {
      targetRef: 'TGT-EPM-BENCHMARK',
      kpiId,
      kpiVersionNo: kpi.currentVersionNo,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      periodStart: '2028-01-01',
      periodEnd: '2029-01-01',
      targetValue: 95,
      comparisonOperator: 'GREATER_EQUAL'
    });
    await enterprise.attachPerformanceBenchmarkBasis(context, benchmarkTargetId, {
      benchmarkType: 'PEER_QUARTILE',
      sourceReference: 'benchmark-dataset://construction-peer-fy27',
      sourceAsOf: '2027-12-31',
      comparatorScope: 'UK tier-one construction peer group',
      benchmarkValue: 95
    });
    const benchmarkTarget = (await performance.listPerformanceTargets(context, kpiId)).find(
      (row) => row.id === benchmarkTargetId
    )!;
    const benchmarkDecisionId = await decision.recordWorkDecision(context, {
      decisionType: 'PERFORMANCE_BENCHMARK_APPROVAL',
      subjectType: 'PERFORMANCE_TARGET',
      subjectId: benchmarkTargetId,
      subjectVersion: String(benchmarkTarget.aggregateVersion),
      outcome: 'APPROVED',
      reason: 'Peer benchmark basis is sufficiently comparable and governed.'
    });
    await enterprise.approvePerformanceBenchmark(
      context,
      benchmarkTargetId,
      benchmarkTarget.aggregateVersion,
      benchmarkDecisionId
    );
    expect((await enterprise.listPerformanceBenchmarkBases(context))[0].status).toBe(
      'APPROVED'
    );

    await enterprise.createPerformanceBenefitProfile(context, targetId, {
      benefitType: 'OPERATIONAL',
      transformationSubjectType: 'TRANSFORMATION_INITIATIVE',
      transformationSubjectId: 'transformation-001',
      valueCategory: 'DELIVERY_RELIABILITY',
      baselineId,
      benefitStatement: 'Improve enterprise delivery reliability against the governed baseline.'
    });
    const validationId = await enterprise.validatePerformanceBenefit(context, targetId, {
      observationId,
      validationStatus: 'PARTIAL',
      validationNote: 'Performance improved but remains below the active target.'
    });
    const validations = await enterprise.listPerformanceBenefitValidations(context, targetId);
    expect(validations.map((row) => row.id)).toContain(validationId);
    expect(Number(validations[0].realisedValue)).toBe(86);

    const bodyId = await governance.createGovernanceBody(context, {
      bodyRef: 'EPM-REVIEW-BODY',
      name: 'Enterprise Performance Review',
      bodyType: 'COMMITTEE',
      mandate: 'Review operating performance and direct corrective intervention.',
      termsOfReference: 'Monthly enterprise performance review.',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      membershipRules: 'Executive owner and performance secretariat.',
      quorumRequired: 1,
      chairPartyId: context.actorPartyId,
      members: [{ partyId: context.actorPartyId, roleKey: 'CHAIR' }]
    });
    let body = (await governance.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    await governance.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'CONSTITUTE');
    body = (await governance.listGovernanceBodies(context)).find((row) => row.id === bodyId)!;
    await governance.transitionGovernanceBody(context, bodyId, body.aggregateVersion, 'ACTIVATE');

    const reviewId = await review.schedulePerformanceManagementReview(context, {
      governanceBodyId: bodyId,
      meetingRef: 'EPM-REVIEW-2027-M03',
      scheduledAt: '2027-04-05T09:00:00Z',
      agenda: [
        {
          subject: 'Enterprise delivery performance',
          purpose: 'Challenge off-target performance and agree intervention.',
          requiredOutcome: 'DECISION',
          subjectType: 'PERFORMANCE_SNAPSHOT',
          subjectId: snapshotId,
          subjectVersion: String(snapshot.aggregateVersion)
        }
      ]
    });
    await review.linkPerformanceSnapshotToManagementReview(context, reviewId, snapshotId);
    await review.recordPerformanceManagementReviewAttendance(
      context,
      reviewId,
      context.actorPartyId,
      'PRESENT'
    );
    let reviewRow = (await review.listPerformanceManagementReviews(context)).find(
      (row) => row.id === reviewId
    )!;
    await review.convenePerformanceManagementReview(
      context,
      reviewId,
      reviewRow.aggregateVersion
    );
    const managementDecisionId = await review.recordPerformanceManagementReviewDecision(
      context,
      reviewId,
      {
        subjectType: 'PERFORMANCE_SNAPSHOT',
        subjectId: snapshotId,
        subjectVersion: String(snapshot.aggregateVersion),
        outcome: 'CORRECTIVE_ACTION_REQUIRED',
        reason: 'Enterprise delivery remains below target.'
      }
    );
    const managementAction = await review.createPerformanceManagementReviewAction(
      context,
      reviewId,
      {
        title: 'Recover enterprise delivery performance',
        instructions: 'Complete root-cause analysis and execute recovery interventions.',
        priority: 'HIGH'
      }
    );
    reviewRow = (await review.listPerformanceManagementReviews(context)).find(
      (row) => row.id === reviewId
    )!;
    await review.completePerformanceManagementReview(
      context,
      reviewId,
      reviewRow.aggregateVersion,
      'Snapshot reviewed, performance challenged and corrective intervention authorised.'
    );

    reviewRow = (await review.listPerformanceManagementReviews(context)).find(
      (row) => row.id === reviewId
    )!;
    expect(reviewRow.status).toBe('COMPLETED');
    expect(
      (await review.listPerformanceManagementReviewDecisionIds(context, reviewId)).map(
        (row) => row.decisionId
      )
    ).toContain(managementDecisionId);
    expect(
      (await review.listPerformanceManagementReviewActionIds(context, reviewId)).map(
        (row) => row.workItemId
      )
    ).toContain(managementAction.workItemId);

    const distributionCount = await db.queryOne<any>(
      'SELECT COUNT(*) AS count FROM performance_snapshot_distributions WHERE snapshot_id = ?',
      [snapshotId]
    );
    expect(Number(distributionCount?.count ?? 0)).toBe(1);
  });
});
