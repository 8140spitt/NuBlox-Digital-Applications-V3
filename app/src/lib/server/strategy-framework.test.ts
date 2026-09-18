import { randomUUID } from 'node:crypto';
import { seedDevelopmentTenant } from './development-seed';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let service: typeof import('./strategy-framework');
let contextService: typeof import('./platform-context');
let dbModule: typeof import('./db');
let decisionService: typeof import('./work-decision');

beforeAll(async () => {
  service = await import('./strategy-framework');
  contextService = await import('./platform-context');
  dbModule = await import('./db');
  decisionService = await import('./work-decision');
});

afterAll(async () => {
  await dbModule.closeDbPool();
});

async function reviewDecision(
  context: Awaited<ReturnType<typeof contextService.resolveDevelopmentCommandContext>>,
  frameworkId: string,
  version: number,
  outcome: 'RETURNED' | 'APPROVED' | 'REJECTED',
  reason: string
) {
  return decisionService.recordWorkDecision(context, {
    decisionType: 'STRATEGY_FRAMEWORK_REVIEW',
    subjectType: 'STRATEGY_FRAMEWORK',
    subjectId: frameworkId,
    subjectVersion: String(version),
    outcome,
    reason
  });
}

describe('F01.01 strategy framework lifecycle on MySQL', () => {
  it('versions amendments and supersedes the previous published framework', async () => {
    const tenant = 'strategy-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const input = {
      title: '2027–2030 Strategy',
      purpose: 'Create long-term value.',
      vision: 'Be the most trusted built-environment partner.',
      mission: 'Deliver better outcomes through disciplined execution.',
      direction: 'Grow selectively and improve delivery performance.',
      reviewCadence: 'Quarterly'
    };

    const first = await service.createStrategyFramework(context, input);
    await service.submitStrategyFramework(context, first);
    await service.returnStrategyFramework(
      context,
      first,
      await reviewDecision(context, first, 1, 'RETURNED', 'Clarify strategic direction.')
    );
    await service.updateStrategyFramework(context, first, {
      ...input,
      direction: 'Grow selectively, improve delivery performance and strengthen recurring services.'
    });
    await service.submitStrategyFramework(context, first);
    await service.approveStrategyFramework(
      context,
      first,
      await reviewDecision(context, first, 2, 'APPROVED', 'Approved by executive review.')
    );
    await service.publishStrategyFramework(context, first, 'Enterprise baseline.');

    const firstRecord = (await service.listStrategyFrameworks(context)).find(
      (item) => item.id === first
    );
    expect(firstRecord?.status).toBe('PUBLISHED');
    expect(firstRecord?.currentVersion).toBe(2);

    const versions = await service.listStrategyFrameworkVersions(context, first);
    expect(versions).toHaveLength(2);
    expect(versions[0].status).toBe('PUBLISHED');
    expect(versions[0].decisionId).toBeTruthy();
    expect(versions[1].status).toBe('RETURNED');
    expect(versions[1].decisionId).toBeTruthy();

    const second = await service.createStrategyFramework(context, {
      ...input,
      title: '2030–2033 Strategy'
    });
    await service.submitStrategyFramework(context, second);
    await service.approveStrategyFramework(
      context,
      second,
      await reviewDecision(context, second, 1, 'APPROVED', 'Approved by executive review.')
    );
    await service.publishStrategyFramework(context, second);

    const records = await service.listStrategyFrameworks(context);
    expect(records.find((item) => item.id === second)?.status).toBe('PUBLISHED');
    expect(records.find((item) => item.id === first)?.status).toBe('SUPERSEDED');

    const audit = await service.listStrategyFrameworkAudit(context, first);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining([
        'STRATEGY_FRAMEWORK_CREATED',
        'STRATEGY_FRAMEWORK_SUBMITTED',
        'STRATEGY_FRAMEWORK_RETURNED',
        'STRATEGY_FRAMEWORK_CHANGED',
        'STRATEGY_FRAMEWORK_APPROVED',
        'STRATEGY_FRAMEWORK_PUBLISHED',
        'STRATEGY_FRAMEWORK_SUPERSEDED'
      ])
    );
  });
});
