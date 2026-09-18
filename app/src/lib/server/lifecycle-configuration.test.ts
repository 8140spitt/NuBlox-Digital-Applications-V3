import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let lifecycle: typeof import('./lifecycle-configuration');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  lifecycle = await import('./lifecycle-configuration');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('governed lifecycle configuration', () => {
  it('publishes an immutable, connected lifecycle version without owning runtime state', async () => {
    const tenant = 'lifecycle-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const definitionId = await lifecycle.createLifecycleDefinition(context, {
      lifecycleKey: 'TEST.APPROVAL',
      name: 'Test Approval Lifecycle',
      appliesToType: 'TEST_SUBJECT',
      purpose: 'Validate reusable domain lifecycle configuration.'
    });

    let definition = (await lifecycle.listLifecycleDefinitions(context)).find(
      (entry) => entry.id === definitionId
    )!;
    expect(definition.version).toBe(1);

    const versionId = await lifecycle.createLifecycleVersion(
      context,
      definitionId,
      definition.version,
      'Initial governed version.'
    );
    definition = (await lifecycle.listLifecycleDefinitions(context)).find(
      (entry) => entry.id === definitionId
    )!;
    expect(definition.version).toBe(2);

    await lifecycle.configureLifecycleVersion(
      context,
      definitionId,
      versionId,
      definition.version,
      {
        initialStateKey: 'DRAFT',
        states: [
          { stateKey: 'DRAFT', label: 'Draft', sortOrder: 10 },
          { stateKey: 'IN_REVIEW', label: 'In review', sortOrder: 20 },
          { stateKey: 'APPROVED', label: 'Approved', terminal: true, sortOrder: 30 },
          { stateKey: 'REJECTED', label: 'Rejected', terminal: true, sortOrder: 40 }
        ],
        transitions: [
          { transitionKey: 'SUBMIT', fromStateKey: 'DRAFT', toStateKey: 'IN_REVIEW' },
          { transitionKey: 'APPROVE', fromStateKey: 'IN_REVIEW', toStateKey: 'APPROVED' },
          { transitionKey: 'REJECT', fromStateKey: 'IN_REVIEW', toStateKey: 'REJECTED' }
        ]
      }
    );

    definition = (await lifecycle.listLifecycleDefinitions(context)).find(
      (entry) => entry.id === definitionId
    )!;
    expect(definition.version).toBe(3);

    const configuration = await lifecycle.getLifecycleConfiguration(
      context,
      definitionId,
      versionId
    );
    expect(configuration.states).toHaveLength(4);
    expect(configuration.transitions).toHaveLength(3);
    expect(configuration.version.initialStateKey).toBe('DRAFT');

    const published = await lifecycle.publishLifecycleVersion(
      context,
      definitionId,
      versionId,
      definition.version
    );
    expect(published.status).toBe('PUBLISHED');

    definition = (await lifecycle.listLifecycleDefinitions(context)).find(
      (entry) => entry.id === definitionId
    )!;
    expect(definition.version).toBe(4);

    await expect(
      lifecycle.configureLifecycleVersion(context, definitionId, versionId, definition.version, {
        initialStateKey: 'DRAFT',
        states: [{ stateKey: 'DRAFT', label: 'Draft' }],
        transitions: []
      })
    ).rejects.toThrow('immutable');

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-29-LIFECYCLE-CONFIG' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, definitionId]
    );
    expect(events.map((event) => event.eventType)).toEqual([
      'LIFECYCLE_DEFINITION_CREATED',
      'LIFECYCLE_VERSION_CREATED',
      'LIFECYCLE_VERSION_CONFIGURED',
      'LIFECYCLE_VERSION_PUBLISHED'
    ]);
    expect(events.map((event) => Number(event.aggregateVersion))).toEqual([1, 2, 3, 4]);
  });

  it('rejects unreachable states and outgoing transitions from terminal states', async () => {
    const tenant = 'lifecycle-invalid-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    const definitionId = await lifecycle.createLifecycleDefinition(context, {
      lifecycleKey: 'TEST.INVALID',
      name: 'Invalid Lifecycle Test',
      appliesToType: 'TEST_SUBJECT'
    });
    const versionId = await lifecycle.createLifecycleVersion(context, definitionId, 1);

    await expect(
      lifecycle.configureLifecycleVersion(context, definitionId, versionId, 2, {
        initialStateKey: 'DRAFT',
        states: [
          { stateKey: 'DRAFT', label: 'Draft' },
          { stateKey: 'APPROVED', label: 'Approved', terminal: true },
          { stateKey: 'ORPHAN', label: 'Orphan' }
        ],
        transitions: [{ transitionKey: 'APPROVE', fromStateKey: 'DRAFT', toStateKey: 'APPROVED' }]
      })
    ).rejects.toThrow('unreachable');

    await expect(
      lifecycle.configureLifecycleVersion(context, definitionId, versionId, 2, {
        initialStateKey: 'DRAFT',
        states: [
          { stateKey: 'DRAFT', label: 'Draft' },
          { stateKey: 'APPROVED', label: 'Approved', terminal: true }
        ],
        transitions: [
          { transitionKey: 'APPROVE', fromStateKey: 'DRAFT', toStateKey: 'APPROVED' },
          { transitionKey: 'REOPEN', fromStateKey: 'APPROVED', toStateKey: 'DRAFT' }
        ]
      })
    ).rejects.toThrow('Terminal');
  });
});
