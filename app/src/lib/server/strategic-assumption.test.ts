import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let service: typeof import('./strategic-assumption');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  service = await import('./strategic-assumption');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('F01.02 strategic assumption runtime', () => {
  it('governs environmental assumptions through immutable versions and assessment state', async () => {
    const tenant = 'f01-assumption-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const id = await service.createStrategicAssumption(context, {
      assumptionRef: 'MARKET-UK-001',
      category: 'MARKET',
      statement: 'UK public-sector construction demand remains resilient through FY27.',
      basisSummary: 'Pipeline indicators and public capital programme commitments.',
      confidencePercent: 70,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      validFrom: '2026-09-01',
      validTo: '2027-09-01'
    });

    let assumption = (await service.listStrategicAssumptions(context)).find((row) => row.id === id)!;
    expect(assumption.status).toBe('PROPOSED');
    expect(assumption.aggregateVersion).toBe(1);
    expect(assumption.currentVersionNo).toBe(1);

    await service.assessStrategicAssumption(context, id, assumption.aggregateVersion, {
      outcome: 'ACCEPT',
      note: 'Market review supports using this assumption for planning.'
    });
    assumption = (await service.listStrategicAssumptions(context)).find((row) => row.id === id)!;
    expect(assumption.status).toBe('ACCEPTED');
    expect(assumption.aggregateVersion).toBe(2);

    await service.assessStrategicAssumption(context, id, assumption.aggregateVersion, {
      outcome: 'ACTIVATE',
      note: 'Adopted into the active planning baseline.'
    });
    assumption = (await service.listStrategicAssumptions(context)).find((row) => row.id === id)!;
    expect(assumption.status).toBe('ACTIVE');

    await service.assessStrategicAssumption(context, id, assumption.aggregateVersion, {
      outcome: 'CHALLENGE',
      note: 'New fiscal announcement requires re-assessment.'
    });
    assumption = (await service.listStrategicAssumptions(context)).find((row) => row.id === id)!;
    expect(assumption.status).toBe('CHALLENGED');

    await service.reviseStrategicAssumption(context, id, assumption.aggregateVersion, {
      statement: 'UK public-sector construction demand remains resilient but procurement timing softens in FY27.',
      basisSummary: 'Updated fiscal announcement and procurement pipeline evidence.',
      confidencePercent: 60,
      scopeType: 'TENANT',
      scopeId: context.tenantId,
      validFrom: '2026-09-01',
      validTo: '2027-09-01'
    });
    assumption = (await service.listStrategicAssumptions(context)).find((row) => row.id === id)!;
    expect(assumption.status).toBe('PROPOSED');
    expect(assumption.currentVersionNo).toBe(2);

    const versions = await service.listStrategicAssumptionVersions(context, id);
    expect(versions.map((row) => row.versionNo)).toEqual([2, 1]);
    expect(versions[1].lifecycleStatus).toBe('CHALLENGED');

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-02-ASSUMPTION' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, id]
    );
    expect(events.map((row) => row.eventType)).toEqual([
      'STRATEGIC_ASSUMPTION_PROPOSED',
      'STRATEGIC_ASSUMPTION_ACCEPTED',
      'STRATEGIC_ASSUMPTION_ACTIVATED',
      'STRATEGIC_ASSUMPTION_CHALLENGED',
      'STRATEGIC_ASSUMPTION_REVISED'
    ]);
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2, 3, 4, 5]);
  });

  it('provides F01.02 analytical lenses over the same governed assumption base', async () => {
    const tenant = 'f01-lenses-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    await service.createStrategicAssumption(context, {
      assumptionRef: 'ECON-001',
      category: 'ECONOMIC',
      statement: 'Interest rates remain elevated.',
      basisSummary: 'Macro-economic monitoring.',
      confidencePercent: 80
    });
    await service.createStrategicAssumption(context, {
      assumptionRef: 'REG-001',
      category: 'REGULATORY',
      statement: 'Building-safety regulation continues to tighten.',
      basisSummary: 'Regulatory monitoring.',
      confidencePercent: 90
    });
    await service.createStrategicAssumption(context, {
      assumptionRef: 'THREAT-001',
      category: 'THREAT',
      statement: 'Skilled labour availability constrains delivery capacity.',
      basisSummary: 'Labour-market and project evidence.',
      confidencePercent: 75
    });

    expect(await service.listStrategicAssumptions(context, { category: 'ECONOMIC' })).toHaveLength(1);
    expect(await service.listStrategicAssumptions(context, { category: 'REGULATORY' })).toHaveLength(1);
    expect(await service.listStrategicAssumptions(context, { category: 'THREAT' })).toHaveLength(1);
    expect(await service.listStrategicAssumptions(context, { search: 'safety' })).toHaveLength(1);
  });
});
