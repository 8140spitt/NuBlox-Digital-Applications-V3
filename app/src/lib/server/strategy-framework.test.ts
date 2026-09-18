import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'nublox-f01-'));
process.env.NUBLOX_DB_PATH = join(directory, 'strategy-framework.test.db');

let service: typeof import('./strategy-framework');
let contextService: typeof import('./platform-context');

beforeAll(async () => {
  service = await import('./strategy-framework');
  contextService = await import('./platform-context');
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe('F01.01 strategy framework lifecycle', () => {
  it('versions amendments and supersedes the previous published framework', () => {
    const tenant = 'test-tenant';
    const context = contextService.resolveDevelopmentCommandContext(tenant);
    const input = {
      title: '2027–2030 Strategy',
      purpose: 'Create long-term value.',
      vision: 'Be the most trusted built-environment partner.',
      mission: 'Deliver better outcomes through disciplined execution.',
      direction: 'Grow selectively and improve delivery performance.',
      reviewCadence: 'Quarterly'
    };

    const first = service.createStrategyFramework(context, input);
    service.submitStrategyFramework(context, first);
    service.returnStrategyFramework(context, first, 'Clarify strategic direction.');
    service.updateStrategyFramework(
      context,
      first,
      { ...input, direction: 'Grow selectively, improve delivery performance and strengthen recurring services.' },
    );
    service.submitStrategyFramework(context, first);
    service.approveStrategyFramework(context, first, 'Approved by executive review.');
    service.publishStrategyFramework(context, first, 'Enterprise baseline.');

    const firstRecord = service.listStrategyFrameworks(context).find((item) => item.id === first);
    expect(firstRecord?.status).toBe('PUBLISHED');
    expect(firstRecord?.currentVersion).toBe(2);

    const versions = service.listStrategyFrameworkVersions(context, first);
    expect(versions).toHaveLength(2);
    expect(versions[0].status).toBe('PUBLISHED');
    expect(versions[1].status).toBe('RETURNED');

    const second = service.createStrategyFramework(
      context,
      { ...input, title: '2030–2033 Strategy' },
    );
    service.submitStrategyFramework(context, second);
    service.approveStrategyFramework(context, second);
    service.publishStrategyFramework(context, second);

    const records = service.listStrategyFrameworks(context);
    expect(records.find((item) => item.id === second)?.status).toBe('PUBLISHED');
    expect(records.find((item) => item.id === first)?.status).toBe('SUPERSEDED');

    const audit = service.listStrategyFrameworkAudit(context, first);
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
