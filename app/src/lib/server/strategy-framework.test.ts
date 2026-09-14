import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'nublox-f01-'));
process.env.NUBLOX_DB_PATH = join(directory, 'strategy-framework.test.db');

let service: typeof import('./strategy-framework');

beforeAll(async () => {
  service = await import('./strategy-framework');
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe('F01.01 strategy framework lifecycle', () => {
  it('versions amendments and supersedes the previous published framework', () => {
    const tenant = 'test-tenant';
    const actor = 'Test User';
    const input = {
      title: '2027–2030 Strategy',
      purpose: 'Create long-term value.',
      vision: 'Be the most trusted built-environment partner.',
      mission: 'Deliver better outcomes through disciplined execution.',
      direction: 'Grow selectively and improve delivery performance.',
      reviewCadence: 'Quarterly'
    };

    const first = service.createStrategyFramework(tenant, input, actor);
    service.submitStrategyFramework(tenant, first, actor);
    service.returnStrategyFramework(tenant, first, actor, 'Clarify strategic direction.');
    service.updateStrategyFramework(
      tenant,
      first,
      { ...input, direction: 'Grow selectively, improve delivery performance and strengthen recurring services.' },
      actor
    );
    service.submitStrategyFramework(tenant, first, actor);
    service.approveStrategyFramework(tenant, first, actor, 'Approved by executive review.');
    service.publishStrategyFramework(tenant, first, actor, 'Enterprise baseline.');

    const firstRecord = service.listStrategyFrameworks(tenant).find((item) => item.id === first);
    expect(firstRecord?.status).toBe('PUBLISHED');
    expect(firstRecord?.currentVersion).toBe(2);

    const versions = service.listStrategyFrameworkVersions(first);
    expect(versions).toHaveLength(2);
    expect(versions[0].status).toBe('PUBLISHED');
    expect(versions[1].status).toBe('RETURNED');

    const second = service.createStrategyFramework(
      tenant,
      { ...input, title: '2030–2033 Strategy' },
      actor
    );
    service.submitStrategyFramework(tenant, second, actor);
    service.approveStrategyFramework(tenant, second, actor);
    service.publishStrategyFramework(tenant, second, actor);

    const records = service.listStrategyFrameworks(tenant);
    expect(records.find((item) => item.id === second)?.status).toBe('PUBLISHED');
    expect(records.find((item) => item.id === first)?.status).toBe('SUPERSEDED');

    const audit = service.listStrategyFrameworkAudit(tenant, first);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(['CREATED', 'SUBMITTED', 'RETURNED', 'UPDATED', 'APPROVED', 'PUBLISHED', 'SUPERSEDED'])
    );
  });
});
