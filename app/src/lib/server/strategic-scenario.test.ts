import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let assumption: typeof import('./strategic-assumption');
let scenario: typeof import('./strategic-scenario');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  assumption = await import('./strategic-assumption');
  scenario = await import('./strategic-scenario');
  db = await import('./db');
});
afterAll(async () => {
  await db.closeDbPool();
});

describe('F01.08 Scenario & Foresight runtime', () => {
  it('pins exact assumptions and preserves versioned scenario analysis evidence', async () => {
    const tenant = 'scenario-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const assumptionId = await assumption.createStrategicAssumption(context, {
      assumptionRef: 'SCN-MARKET-01',
      category: 'MARKET',
      statement: 'Infrastructure investment remains elevated.',
      basisSummary: 'Market evidence.',
      confidencePercent: 65
    });
    let a = (await assumption.listStrategicAssumptions(context)).find(
      (row) => row.id === assumptionId
    )!;
    await assumption.assessStrategicAssumption(context, assumptionId, a.aggregateVersion, {
      outcome: 'ACCEPT',
      note: 'Accepted scenario basis.'
    });
    a = (await assumption.listStrategicAssumptions(context)).find(
      (row) => row.id === assumptionId
    )!;

    const scenarioId = await scenario.createStrategicScenario(context, {
      scenarioRef: 'SCN-BASE-2028',
      name: '2028 Baseline',
      scenarioType: 'BASELINE',
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      horizonStart: '2027-01-01',
      horizonEnd: '2029-01-01',
      narrative: 'Baseline case for medium-term strategy.',
      drivers: [
        {
          driverKey: 'PUBLIC-INVEST',
          name: 'Public infrastructure investment',
          baseState: 'Sustained investment pipeline',
          direction: 'STABLE',
          rationale: 'Committed programmes support demand.'
        }
      ],
      assumptions: [{ id: assumptionId, versionNo: a.currentVersionNo }],
      projections: []
    });
    let s = (await scenario.listStrategicScenarios(context)).find((row) => row.id === scenarioId)!;
    expect(s.status).toBe('DRAFT');
    const v = (await scenario.listScenarioVersions(context, scenarioId))[0];
    expect(await scenario.listScenarioDrivers(context, v.id)).toHaveLength(1);
    expect(await scenario.listScenarioAssumptionRefs(context, v.id)).toEqual([
      { assumptionId, assumptionVersionNo: a.currentVersionNo }
    ]);

    await scenario.runScenarioSensitivity(context, scenarioId, {
      variableKey: 'PUBLIC-INVEST-GROWTH',
      lowCase: -10,
      baseCase: 0,
      highCase: 10,
      resultSummary: 'Downside reduces opportunity conversion; upside increases resource pressure.'
    });
    await scenario.createScenarioContingency(context, scenarioId, {
      contingencyRef: 'CONT-SKILLS-01',
      triggerCondition: 'Pipeline growth exceeds available delivery capacity.',
      responseStrategy: 'Accelerate strategic recruitment, partnerships and resource reallocation.'
    });
    expect(await scenario.listScenarioSensitivityRuns(context, scenarioId)).toHaveLength(1);
    expect(await scenario.listScenarioContingencies(context, scenarioId)).toHaveLength(1);

    await scenario.reviewStrategicScenario(context, scenarioId, s.aggregateVersion);
    s = (await scenario.listStrategicScenarios(context)).find((row) => row.id === scenarioId)!;
    await scenario.approveStrategicScenario(context, scenarioId, s.aggregateVersion);
    s = (await scenario.listStrategicScenarios(context)).find((row) => row.id === scenarioId)!;
    await scenario.activateStrategicScenario(context, scenarioId, s.aggregateVersion);
    s = (await scenario.listStrategicScenarios(context)).find((row) => row.id === scenarioId)!;
    expect(s.status).toBe('ACTIVE');

    const events = await db.queryRows<any>(
      "SELECT aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id=? AND aggregate_id='AGG-02-SCENARIO' AND aggregate_object_id=? ORDER BY aggregate_version",
      [context.tenantId, scenarioId]
    );
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4]);
  });
});
