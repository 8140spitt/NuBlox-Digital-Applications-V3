import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  completeIdempotencyRecord,
  completeIntegrationJob,
  createCanonicalDataEnvelope,
  createExternalIdentity,
  createIdempotencyRecord,
  createIntegrationJob,
  createMigrationReconciliation,
  createOutboxMessage,
  createProjectionCheckpoint,
  failIdempotencyRecord,
  failIntegrationJob,
  markOutboxFailed,
  markOutboxPublished,
  startIntegrationJob,
  type CanonicalObjectIdentity,
  type ExternalIdentity,
  type IdempotencyRecord,
  type IntegrationJob,
  type OutboxMessage,
  type Person
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-PORTABILITY', 'Tenant');

const person: Person = {
  id: asId<'PersonId'>('PERSON-PORTABILITY', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-PORTABILITY', 'Party'),
  legalName: 'Portability Operator',
  status: 'ACTIVE'
};

const object: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-PORTABILITY', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'A-1001',
  createdAt: '2026-09-20T09:00:00.000Z'
};

describe('kernel platform events and portability invariants', () => {
  it('governs durable Outbox publication attempts', () => {
    const pending: OutboxMessage = createOutboxMessage({
      id: asId<'OutboxMessageId'>('OUTBOX-1', 'Outbox Message'),
      tenantId,
      aggregateType: 'CHANGE',
      aggregateId: 'CHANGE-1',
      eventType: 'CHANGE_APPROVED',
      payload: { decisionId: 'DEC-1' },
      occurredAt: '2026-09-20T10:00:00.000Z',
      status: 'PENDING',
      attempts: 0
    });

    const failed = markOutboxFailed(
      pending,
      'Temporary broker failure.',
      '2026-09-20T10:05:00.000Z'
    );
    expect(failed.status).toBe('FAILED');
    expect(failed.attempts).toBe(1);

    const published = markOutboxPublished(
      failed,
      '2026-09-20T10:05:10.000Z'
    );
    expect(published.status).toBe('PUBLISHED');
    expect(published.attempts).toBe(2);

    expect(() =>
      markOutboxFailed(published, 'Cannot republish a completed message.')
    ).toThrow(KernelInvariantError);
  });

  it('governs durable integration job execution', () => {
    const queued: IntegrationJob = createIntegrationJob(
      {
        id: asId<'IntegrationJobId'>('JOB-IMPORT-1', 'Integration Job'),
        tenantId,
        jobType: 'IMPORT',
        sourceSystem: 'PTC_WINDCHILL',
        requestedByPersonId: person.id,
        requestedAt: '2026-09-20T10:00:00.000Z',
        status: 'QUEUED'
      },
      person
    );

    const running = startIntegrationJob(
      queued,
      '2026-09-20T10:01:00.000Z'
    );
    const completed = completeIntegrationJob(
      running,
      '2026-09-20T10:10:00.000Z',
      'urn:nublox:import-result:1'
    );
    expect(completed.status).toBe('SUCCEEDED');

    const queuedFailure: IntegrationJob = createIntegrationJob(
      {
        id: asId<'IntegrationJobId'>('JOB-IMPORT-2', 'Integration Job'),
        tenantId,
        jobType: 'IMPORT',
        sourceSystem: 'PTC_WINDCHILL',
        requestedAt: '2026-09-20T10:00:00.000Z',
        status: 'QUEUED'
      }
    );
    const failed = failIntegrationJob(
      startIntegrationJob(queuedFailure, '2026-09-20T10:01:00.000Z'),
      '2026-09-20T10:02:00.000Z',
      'Source package failed validation.'
    );
    expect(failed.status).toBe('FAILED');
  });

  it('uses idempotency records to distinguish replay from a new request', () => {
    const record: IdempotencyRecord = createIdempotencyRecord({
      id: asId<'IdempotencyRecordId'>('IDEMP-1', 'Idempotency Record'),
      tenantId,
      scope: 'CHANGE_COMMAND',
      key: 'client-key-001',
      requestHash: 'sha256:request-a',
      status: 'IN_PROGRESS',
      createdAt: '2026-09-20T10:00:00.000Z',
      expiresAt: '2026-09-21T10:00:00.000Z'
    });

    expect(
      completeIdempotencyRecord(record, 'urn:nublox:response:1').status
    ).toBe('COMPLETED');
    expect(failIdempotencyRecord(record, 'Rejected.').status).toBe('FAILED');

    expect(() =>
      createIdempotencyRecord({
        ...record,
        id: asId<'IdempotencyRecordId'>('IDEMP-BAD', 'Idempotency Record'),
        expiresAt: '2026-09-19T10:00:00.000Z'
      })
    ).toThrow(KernelInvariantError);
  });

  it('preserves vendor-neutral canonical envelopes and explicit external identity', () => {
    const envelope = createCanonicalDataEnvelope({
      id: asId<'DataEnvelopeId'>('ENV-1', 'Data Envelope'),
      tenantId,
      direction: 'IMPORT',
      schemaName: 'nublox.canonical.object',
      schemaVersion: '1.0',
      objectType: object.objectType,
      stableKey: object.stableKey,
      payload: { revision: 'A', title: 'Ground Floor Plan' },
      externalSystem: 'PTC_WINDCHILL',
      externalObjectId: 'OR:wt.doc.WTDocument:12345',
      checksum: 'sha256:envelope',
      createdAt: '2026-09-20T10:00:00.000Z'
    });
    expect(envelope.externalSystem).toBe('PTC_WINDCHILL');

    const external: ExternalIdentity = createExternalIdentity(
      {
        id: asId<'ExternalIdentityId'>('EXT-1', 'External Identity'),
        tenantId,
        canonicalObjectId: object.id,
        externalSystem: 'PTC_WINDCHILL',
        externalObjectType: 'WTDocument',
        externalObjectId: 'OR:wt.doc.WTDocument:12345',
        externalVersion: 'A.3'
      },
      object
    );
    expect(external.canonicalObjectId).toBe(object.id);

    const verified = createMigrationReconciliation(
      {
        id: asId<'MigrationReconciliationId'>('REC-1', 'Migration Reconciliation'),
        tenantId,
        externalIdentityId: external.id,
        canonicalObjectId: object.id,
        status: 'VERIFIED',
        sourceHash: 'sha256:same',
        targetHash: 'sha256:same',
        checkedAt: '2026-09-20T10:10:00.000Z'
      },
      external,
      object
    );
    expect(verified.status).toBe('VERIFIED');

    expect(() =>
      createMigrationReconciliation(
        {
          ...verified,
          id: asId<'MigrationReconciliationId'>('REC-BAD', 'Migration Reconciliation'),
          sourceHash: 'sha256:source',
          targetHash: 'sha256:target'
        },
        external,
        object
      )
    ).toThrow(KernelInvariantError);
  });

  it('records projection checkpoints without allowing invalid sequence values', () => {
    const checkpoint = createProjectionCheckpoint({
      id: asId<'ProjectionCheckpointId'>('CP-1', 'Projection Checkpoint'),
      tenantId,
      projectionName: 'enterprise-search',
      partitionKey: 'tenant',
      lastEventSequence: 100,
      lastOccurredAt: '2026-09-20T10:00:00.000Z',
      updatedAt: '2026-09-20T10:00:01.000Z'
    });
    expect(checkpoint.lastEventSequence).toBe(100);

    expect(() =>
      createProjectionCheckpoint({
        ...checkpoint,
        id: asId<'ProjectionCheckpointId'>('CP-BAD', 'Projection Checkpoint'),
        lastEventSequence: -1
      })
    ).toThrow(KernelInvariantError);
  });
});
