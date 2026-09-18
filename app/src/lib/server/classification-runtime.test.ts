import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let classification: typeof import('./classification-runtime');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  classification = await import('./classification-runtime');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('governed classification runtime', () => {
  it('loads and publishes an immutable release under AGG-29-CLASSIFICATION', async () => {
    const tenant = 'classification-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const systemId = await classification.createClassificationSystem(context, {
      systemKey: 'UNICLASS.TEST',
      name: 'Uniclass Test Classification',
      publisher: 'NBS',
      systemIdentifier: 'uniclass-test',
      purpose: 'Integration-test classification semantics.'
    });

    let system = (await classification.listClassificationSystems(context)).find(
      (entry) => entry.id === systemId
    )!;
    expect(system.version).toBe(1);

    const releaseId = await classification.createClassificationRelease(
      context,
      systemId,
      system.version,
      {
        releaseKey: '2026-09',
        publicationDate: '2026-09-01',
        effectiveFrom: '2026-09-01',
        sourceDigestAlgorithm: 'SHA256',
        sourceDigest: 'b'.repeat(64)
      }
    );

    system = (await classification.listClassificationSystems(context)).find(
      (entry) => entry.id === systemId
    )!;
    expect(system.version).toBe(2);

    await classification.importClassificationCodes(context, systemId, releaseId, system.version, [
      { code: 'Ss_25_10', title: 'External wall systems', parentCode: 'Ss_25' },
      { code: 'Ss_25', title: 'Wall systems' }
    ]);

    system = (await classification.listClassificationSystems(context)).find(
      (entry) => entry.id === systemId
    )!;
    expect(system.version).toBe(3);

    const codes = await classification.listClassificationCodes(context, systemId, releaseId);
    expect(codes).toHaveLength(2);
    expect(codes.find((entry) => entry.code === 'Ss_25_10')?.parentCode).toBe('Ss_25');

    const published = await classification.publishClassificationRelease(
      context,
      systemId,
      releaseId,
      system.version
    );
    expect(published.status).toBe('PUBLISHED');

    system = (await classification.listClassificationSystems(context)).find(
      (entry) => entry.id === systemId
    )!;
    expect(system.version).toBe(4);

    await expect(
      classification.importClassificationCodes(context, systemId, releaseId, system.version, [
        { code: 'Ss_25_20', title: 'Internal wall systems', parentCode: 'Ss_25' }
      ])
    ).rejects.toThrow('immutable');

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-29-CLASSIFICATION' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, systemId]
    );
    expect(events.map((event) => event.eventType)).toEqual([
      'CLASSIFICATION_SYSTEM_CREATED',
      'CLASSIFICATION_RELEASE_CREATED',
      'CLASSIFICATION_CODES_IMPORTED',
      'CLASSIFICATION_RELEASE_PUBLISHED'
    ]);
    expect(events.map((event) => Number(event.aggregateVersion))).toEqual([1, 2, 3, 4]);
  });

  it('rejects an orphan classification parent before persistence', async () => {
    const tenant = 'classification-parent-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const systemId = await classification.createClassificationSystem(context, {
      systemKey: 'TEST.PARENT',
      name: 'Parent Validation',
      publisher: 'NuBlox'
    });
    const releaseId = await classification.createClassificationRelease(context, systemId, 1, {
      releaseKey: '1',
      sourceDigestAlgorithm: 'SHA256',
      sourceDigest: 'c'.repeat(64)
    });

    await expect(
      classification.importClassificationCodes(context, systemId, releaseId, 2, [
        { code: 'CHILD', title: 'Child', parentCode: 'MISSING' }
      ])
    ).rejects.toThrow('parent code');

    expect(await classification.listClassificationCodes(context, systemId, releaseId)).toHaveLength(
      0
    );
  });

  it('rejects cyclic classification hierarchies before persistence', async () => {
    const tenant = 'classification-cycle-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const systemId = await classification.createClassificationSystem(context, {
      systemKey: 'TEST.CYCLE',
      name: 'Cycle Validation',
      publisher: 'NuBlox'
    });
    const releaseId = await classification.createClassificationRelease(context, systemId, 1, {
      releaseKey: '1',
      sourceDigestAlgorithm: 'SHA256',
      sourceDigest: 'd'.repeat(64)
    });

    await expect(
      classification.importClassificationCodes(context, systemId, releaseId, 2, [
        { code: 'A', title: 'A', parentCode: 'B' },
        { code: 'B', title: 'B', parentCode: 'A' }
      ])
    ).rejects.toThrow('cycle');

    expect(await classification.listClassificationCodes(context, systemId, releaseId)).toHaveLength(
      0
    );
  });
});
