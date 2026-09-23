import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RowDataPacket } from 'mysql2/promise';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import {
  MySqlPublicationCommandService,
  PublicationCommandError
} from './publication-command-service.js';
import { MySqlPublicationRepository } from './publication-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('closed-loop publication control', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('separates transport retry, acknowledgement, business result and source authority', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-PUB-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const service = new MySqlPublicationCommandService(pool);
    const repository = new MySqlPublicationRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Publication Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function createPerson(label: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>('PARTY-' + label + '-' + suffix, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: label,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);
      const person: Person = {
        id: asId<'PersonId'>('PERSON-' + label + '-' + suffix, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: label,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);
      return person;
    }

    const admin = await createPerson('Publication-Admin');
    const worker = await createPerson('Publication-Worker');

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        'ARA-PUB-' + suffix,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'PUB-TEST'
    });

    const subject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-PUB-' + suffix, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'DOC:' + suffix,
      createdAt: '2026-09-23T18:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, subject, {
      actorPersonId: admin.id
    });

    await expect(
      service.createEndpoint(tenantId, worker.id, {
        code: 'DENIED',
        name: 'Denied',
        endpointType: 'API',
        direction: 'OUTBOUND',
        transportProtocol: 'HTTPS',
        systemName: 'Denied',
        endpointReference: 'vault://denied'
      })
    ).rejects.toMatchObject({
      name: 'PublicationCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<PublicationCommandError>);

    const endpoint = await service.createEndpoint(tenantId, admin.id, {
      code: 'ERP-' + suffix,
      name: 'ERP integration',
      endpointType: 'ERP',
      direction: 'OUTBOUND',
      transportProtocol: 'HTTPS',
      systemName: 'ERP-' + suffix,
      endpointReference: 'vault://integration/erp/' + suffix,
      acknowledgementRequired: true,
      businessResultRequired: true,
      capabilities: ['INFORMATION_CONTAINER', 'CHANGE']
    });

    const authority = await service.createSourceAuthorityRule(
      tenantId,
      admin.id,
      {
        code: 'NUBLOX-DOC-' + suffix,
        name: 'NuBlox document master',
        subjectObjectType: 'INFORMATION_CONTAINER',
        authorityOwner: 'NUBLOX',
        priority: 0,
        effectiveFrom: '2026-01-01T00:00:00.000Z'
      }
    );

    const envelope = await service.storeOutboundEnvelope(
      tenantId,
      admin.id,
      {
        endpointId: endpoint.id,
        schemaName: 'nublox.information',
        schemaVersion: '1.0',
        objectType: subject.objectType,
        stableKey: subject.stableKey,
        payload: {
          stableKey: subject.stableKey,
          version: 'A',
          title: 'Controlled information'
        },
        createdAt: '2026-09-23T18:01:00.000Z'
      }
    );
    expect(envelope.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    const transaction = await service.createTransaction(
      tenantId,
      admin.id,
      {
        endpointId: endpoint.id,
        transactionReference: 'PUB-' + suffix + '-1',
        idempotencyKey: 'PUB-IDEMP-' + suffix + '-1',
        operation: 'UPDATE',
        requestedAt: '2026-09-23T18:02:00.000Z'
      }
    );

    const activity = await service.addActivity(
      tenantId,
      admin.id,
      {
        transactionId: transaction.id,
        subjectObjectId: subject.id,
        subjectVersion: 'A',
        action: 'UPDATE',
        sequence: 1,
        dataEnvelopeId: envelope.id,
        sourceAuthorityRuleId: authority.id
      }
    );

    const blockedTransaction = await service.createTransaction(
      tenantId,
      admin.id,
      {
        endpointId: endpoint.id,
        transactionReference: 'PUB-' + suffix + '-BLOCKED',
        idempotencyKey: 'PUB-IDEMP-' + suffix + '-BLOCKED',
        operation: 'UPDATE',
        requestedAt: '2026-09-23T18:02:30.000Z'
      }
    );

    await expect(
      service.addActivity(tenantId, admin.id, {
        transactionId: blockedTransaction.id,
        subjectObjectId: subject.id,
        subjectVersion: 'A',
        action: 'UPDATE',
        sequence: 1,
        dataEnvelopeId: envelope.id,
        sourceAuthorityRuleId: authority.id
      })
    ).rejects.toMatchObject({
      name: 'PublicationCommandError',
      code: 'CONFLICT'
    } satisfies Partial<PublicationCommandError>);

    await service.startTransaction(
      tenantId,
      admin.id,
      transaction.id,
      '2026-09-23T18:03:00.000Z'
    );

    const firstAttempt = await service.startAttempt(
      tenantId,
      admin.id,
      {
        activityId: activity.id,
        startedAt: '2026-09-23T18:04:00.000Z'
      }
    );
    const failedAttempt = await service.failAttempt(
      tenantId,
      admin.id,
      {
        attemptId: firstAttempt.id,
        errorMessage: 'Gateway unavailable',
        completedAt: '2026-09-23T18:04:30.000Z'
      }
    );
    expect(failedAttempt.status).toBe('FAILED');
    expect((await repository.getActivity(tenantId, activity.id))?.status)
      .toBe('TRANSPORT_FAILED');

    const retry = await service.startAttempt(
      tenantId,
      admin.id,
      {
        activityId: activity.id,
        startedAt: '2026-09-23T18:05:00.000Z'
      }
    );
    expect(retry.attemptNumber).toBe(2);

    await service.markAttemptSent(
      tenantId,
      admin.id,
      {
        attemptId: retry.id,
        transportReference: 'HTTP-202-' + suffix,
        sentAt: '2026-09-23T18:05:30.000Z'
      }
    );

    const acknowledgement = await service.recordAcknowledgement(
      tenantId,
      admin.id,
      {
        attemptId: retry.id,
        acknowledgementType: 'RECEIPT',
        outcome: 'ACKNOWLEDGED',
        externalTransactionId: 'ERP-TX-' + suffix,
        message: 'Payload received for processing.',
        receivedAt: '2026-09-23T18:06:00.000Z'
      }
    );

    const afterAck = await repository.getTransaction(
      tenantId,
      transaction.id
    );
    expect(afterAck?.status).toBe('AWAITING_RESULTS');
    expect(afterAck?.completedAt).toBeUndefined();
    expect((await repository.getActivity(tenantId, activity.id))?.status)
      .toBe('ACKNOWLEDGED');

    const completion = await service.recordResult(
      tenantId,
      admin.id,
      {
        activityId: activity.id,
        acknowledgementId: acknowledgement.id,
        outcome: 'APPLIED',
        externalObjectId: 'ERP-DOC-' + suffix,
        externalVersion: 'A',
        resultReference: 'ERP-RESULT-' + suffix,
        message: 'Object applied successfully.',
        completedAt: '2026-09-23T18:07:00.000Z'
      }
    );
    expect(completion.transaction.status).toBe('SUCCEEDED');
    expect(completion.transaction.completedAt)
      .toBe('2026-09-23T18:07:00.000Z');

    const releasedActivity = await service.addActivity(
      tenantId,
      admin.id,
      {
        transactionId: blockedTransaction.id,
        subjectObjectId: subject.id,
        subjectVersion: 'A',
        action: 'UPDATE',
        sequence: 1,
        dataEnvelopeId: envelope.id,
        sourceAuthorityRuleId: authority.id
      }
    );
    expect(releasedActivity.status).toBe('PENDING');

    const attempts = await repository.listAttempts(tenantId, activity.id);
    expect(attempts.map((item) => item.status)).toEqual(['FAILED', 'DELIVERED']);

    const [auditRows] = await pool.query<Array<RowDataPacket & { entity_type: string; action: string }>>(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN ('PUBLICATION_ATTEMPT','PUBLICATION_ACKNOWLEDGEMENT','PUBLICATION_RESULT')
        ORDER BY audit_id`,
      [tenantId]
    );
    expect(auditRows).toEqual(expect.arrayContaining([
      expect.objectContaining({
        entity_type: 'PUBLICATION_ACKNOWLEDGEMENT',
        action: 'ACKNOWLEDGED'
      }),
      expect.objectContaining({
        entity_type: 'PUBLICATION_RESULT',
        action: 'APPLIED'
      })
    ]));
  });
});
