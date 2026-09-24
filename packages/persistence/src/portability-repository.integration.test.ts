import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type ExternalIdentity,
  type IdempotencyRecord,
  type IntegrationJob,
  type MigrationReconciliation,
  type Party,
  type Person,
  type ProjectionCheckpoint,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool, withTransaction } from './database.js';
import { migrate } from './migrations.js';
import { writeOutboxEvent } from './platform-writes.js';
import { MySqlPortabilityRepository } from './portability-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL platform events and portability runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('commits authoritative state, audit and outbox atomically and supports durable dispatch', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `PORT-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const portability = new MySqlPortabilityRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Portability Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant, { correlationId: suffix });

    const [tenantRows] = await pool.query(
      'SELECT id FROM tenants WHERE id = ?',
      [tenantId]
    );
    expect(tenantRows).toEqual([
      expect.objectContaining({ id: tenantId })
    ]);

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ? AND entity_type = 'TENANT' AND entity_id = ?`,
      [tenantId, tenantId]
    );
    expect(auditRows).toEqual([
      expect.objectContaining({ entity_type: 'TENANT', action: 'CREATED' })
    ]);

    const [outboxRows] = await pool.query(
      `SELECT id, event_type, status, attempts
         FROM outbox_messages
        WHERE tenant_id = ? AND aggregate_type = 'TENANT' AND aggregate_id = ?`,
      [tenantId, tenantId]
    );
    expect(outboxRows).toHaveLength(1);
    expect(outboxRows).toEqual([
      expect.objectContaining({
        event_type: 'TENANT.CREATED',
        status: 'PENDING',
        attempts: 0
      })
    ]);

    const claimed = await portability.claimOutboxBatch(
      1000,
      '2026-09-20T12:00:00.000Z',
      '2026-09-20T12:05:00.000Z',
      tenantId
    );
    const tenantMessage = claimed.find(
      (message) =>
        message.aggregateType === 'TENANT' &&
        message.aggregateId === tenantId
    );
    expect(tenantMessage).toBeDefined();

    const failed = await portability.markOutboxFailed(
      tenantId,
      tenantMessage!.id,
      'Temporary transport failure.',
      '2026-09-20T12:06:00.000Z'
    );
    expect(failed.status).toBe('FAILED');
    expect(failed.attempts).toBe(1);

    const notYetRetryable = await portability.claimOutboxBatch(
      1000,
      '2026-09-20T12:05:30.000Z',
      '2026-09-20T12:10:00.000Z',
      tenantId
    );
    expect(
      notYetRetryable.some((message) => message.id === tenantMessage!.id)
    ).toBe(false);

    const retryable = await portability.claimOutboxBatch(
      1000,
      '2026-09-20T12:06:01.000Z',
      '2026-09-20T12:11:00.000Z',
      tenantId
    );
    expect(
      retryable.some((message) => message.id === tenantMessage!.id)
    ).toBe(true);

    const published = await portability.markOutboxPublished(
      tenantId,
      tenantMessage!.id,
      '2026-09-20T12:06:10.000Z'
    );
    expect(published.status).toBe('PUBLISHED');
    expect(published.attempts).toBe(2);
    expect(published.publishedAt).toBe('2026-09-20T12:06:10.000Z');
  });

  it('rolls authoritative state and outbox back together on transaction failure', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `ROLLBACK-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    await kernel.createTenant({
      id: tenantId,
      name: 'Atomic Rollback Test',
      status: 'ACTIVE'
    });

    const envelopeId = `ENV-${suffix}`;
    const aggregateId = `ROLLBACK-${suffix}`;

    await expect(
      withTransaction(pool, async (connection) => {
        await connection.execute(
          `INSERT INTO canonical_data_envelopes
            (id, tenant_id, direction, schema_name, schema_version, object_type,
             stable_key, payload, checksum, created_at)
           VALUES (?, ?, 'EXPORT', 'atomic.test', '1.0', 'TEST_OBJECT', ?, ?, ?, ?)`,
          [
            envelopeId,
            tenantId,
            aggregateId,
            JSON.stringify({ test: true }),
            'sha256:rollback',
            new Date('2026-09-20T12:00:00.000Z')
          ]
        );

        await writeOutboxEvent(connection, {
          tenantId,
          aggregateType: 'TEST_OBJECT',
          aggregateId,
          eventType: 'TEST_OBJECT.EXPORTED',
          payload: { envelopeId },
          occurredAt: '2026-09-20T12:00:01.000Z'
        });

        throw new Error('force atomic rollback');
      })
    ).rejects.toThrow('force atomic rollback');

    const [envelopes] = await pool.query(
      'SELECT id FROM canonical_data_envelopes WHERE tenant_id = ? AND id = ?',
      [tenantId, envelopeId]
    );
    expect(envelopes).toEqual([]);

    const [messages] = await pool.query(
      `SELECT id FROM outbox_messages
        WHERE tenant_id = ? AND aggregate_type = 'TEST_OBJECT' AND aggregate_id = ?`,
      [tenantId, aggregateId]
    );
    expect(messages).toEqual([]);
  });

  it('supports idempotency, durable jobs, canonical envelopes, provenance and reconciliation', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = `DATA-${Date.now().toString(36)}`;
    const tenantId = asId<'TenantId'>(`TENANT-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const portability = new MySqlPortabilityRepository(pool);

    await kernel.createTenant({
      id: tenantId,
      name: 'Migration Runtime Test',
      status: 'ACTIVE'
    });

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Migration Operator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, party);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-${suffix}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'Migration Operator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const object: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>(`OBJ-${suffix}`, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: `A-1001-${suffix}`,
      createdAt: '2026-09-20T12:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, object, {
      actorPersonId: person.id
    });

    const idempotency: IdempotencyRecord = {
      id: asId<'IdempotencyRecordId'>(`IDEMP-${suffix}`, 'Idempotency Record'),
      tenantId,
      scope: 'MIGRATION_IMPORT',
      key: `client-${suffix}`,
      requestHash: 'sha256:request',
      status: 'IN_PROGRESS',
      createdAt: '2026-09-20T12:00:00.000Z',
      expiresAt: '2026-09-21T12:00:00.000Z'
    };

    const firstClaim = await portability.claimIdempotency(idempotency);
    expect(firstClaim.replay).toBe(false);

    const replay = await portability.claimIdempotency({
      ...idempotency,
      id: asId<'IdempotencyRecordId'>(`IDEMP-REPLAY-${suffix}`, 'Idempotency Record')
    });
    expect(replay.replay).toBe(true);
    expect(replay.record.id).toBe(idempotency.id);

    await expect(
      portability.claimIdempotency({
        ...idempotency,
        id: asId<'IdempotencyRecordId'>(`IDEMP-CONFLICT-${suffix}`, 'Idempotency Record'),
        requestHash: 'sha256:different-request'
      })
    ).rejects.toThrow('Idempotency key was reused with a different request.');

    const completedIdempotency = await portability.completeIdempotency(
      tenantId,
      idempotency.scope,
      idempotency.key,
      'urn:nublox:import:result'
    );
    expect(completedIdempotency.status).toBe('COMPLETED');


    const renewed = await portability.claimIdempotency({
      ...idempotency,
      id: asId<'IdempotencyRecordId'>(`IDEMP-RENEWED-${suffix}`, 'Idempotency Record'),
      requestHash: 'sha256:request-after-expiry',
      createdAt: '2026-09-22T12:00:00.000Z',
      expiresAt: '2026-09-23T12:00:00.000Z'
    });
    expect(renewed.replay).toBe(false);
    expect(renewed.record.id).toBe(`IDEMP-RENEWED-${suffix}`);
    expect(renewed.record.status).toBe('IN_PROGRESS');

    const job: IntegrationJob = {
      id: asId<'IntegrationJobId'>(`JOB-${suffix}`, 'Integration Job'),
      tenantId,
      jobType: 'IMPORT',
      sourceSystem: 'PTC_WINDCHILL',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-20T12:01:00.000Z',
      status: 'QUEUED'
    };
    await portability.createIntegrationJob(tenantId, job, {
      actorPersonId: person.id
    });
    const running = await portability.startIntegrationJob(
      tenantId,
      job.id,
      '2026-09-20T12:02:00.000Z',
      { actorPersonId: person.id }
    );
    expect(running.status).toBe('RUNNING');

    const succeeded = await portability.completeIntegrationJob(
      tenantId,
      job.id,
      '2026-09-20T12:10:00.000Z',
      'urn:nublox:import:result',
      { actorPersonId: person.id }
    );
    expect(succeeded.status).toBe('SUCCEEDED');

    const envelope: CanonicalDataEnvelope = {
      id: asId<'DataEnvelopeId'>(`ENV-${suffix}`, 'Data Envelope'),
      tenantId,
      direction: 'IMPORT',
      schemaName: 'nublox.canonical.object',
      schemaVersion: '1.0',
      objectType: object.objectType,
      stableKey: object.stableKey,
      payload: { revision: 'A', source: 'Windchill' },
      externalSystem: 'PTC_WINDCHILL',
      externalObjectId: `OR:wt.doc.WTDocument:${suffix}`,
      checksum: 'sha256:same',
      createdAt: '2026-09-20T12:11:00.000Z'
    };
    await portability.storeDataEnvelope(envelope, {
      actorPersonId: person.id
    });

    const identity: ExternalIdentity = {
      id: asId<'ExternalIdentityId'>(`EXT-${suffix}`, 'External Identity'),
      tenantId,
      canonicalObjectId: object.id,
      externalSystem: 'PTC_WINDCHILL',
      externalObjectType: 'WTDocument',
      externalObjectId: envelope.externalObjectId!,
      externalVersion: 'A.3',
      sourceReference: 'windchill://document'
    };
    await portability.createExternalIdentity(identity, {
      actorPersonId: person.id
    });

    const reconciliation: MigrationReconciliation = {
      id: asId<'MigrationReconciliationId'>(`REC-${suffix}`, 'Migration Reconciliation'),
      tenantId,
      externalIdentityId: identity.id,
      canonicalObjectId: object.id,
      status: 'VERIFIED',
      sourceHash: 'sha256:same',
      targetHash: 'sha256:same',
      checkedAt: '2026-09-20T12:12:00.000Z',
      details: 'Identity and payload reconciled.'
    };
    await portability.recordReconciliation(reconciliation, {
      actorPersonId: person.id
    });

    const checkpoint: ProjectionCheckpoint = {
      id: asId<'ProjectionCheckpointId'>(`CP-${suffix}`, 'Projection Checkpoint'),
      tenantId,
      projectionName: 'enterprise-search',
      partitionKey: 'tenant',
      lastEventSequence: 10,
      lastOccurredAt: '2026-09-20T12:12:00.000Z',
      updatedAt: '2026-09-20T12:12:01.000Z'
    };
    await portability.saveProjectionCheckpoint(checkpoint);

    const advanced = await portability.saveProjectionCheckpoint({
      ...checkpoint,
      lastEventSequence: 20,
      lastOccurredAt: '2026-09-20T12:13:00.000Z',
      updatedAt: '2026-09-20T12:13:01.000Z'
    });
    expect(advanced.lastEventSequence).toBe(20);

    await expect(
      portability.saveProjectionCheckpoint({
        ...checkpoint,
        lastEventSequence: 19,
        lastOccurredAt: '2026-09-20T12:12:30.000Z',
        updatedAt: '2026-09-20T12:14:01.000Z'
      })
    ).rejects.toThrow('Projection Checkpoint event sequence cannot move backwards.');

    const [reconciliationRows] = await pool.query(
      `SELECT status, source_hash, target_hash
         FROM migration_reconciliations
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, reconciliation.id]
    );
    expect(reconciliationRows).toEqual([
      expect.objectContaining({
        status: 'VERIFIED',
        source_hash: 'sha256:same',
        target_hash: 'sha256:same'
      })
    ]);
  });
});
