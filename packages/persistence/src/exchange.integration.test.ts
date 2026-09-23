import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Decision,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { ExchangeCommandError, MySqlExchangeCommandService } from './exchange-command-service.js';
import { MySqlExchangeReadRepository } from './exchange-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('exchange package, received delivery and authority adoption', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('keeps dispatch, receipt, import and authority adoption as explicit auditable boundaries', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-EXCHANGE-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const service = new MySqlExchangeCommandService(pool);
    const reads = new MySqlExchangeReadRepository(pool);

    const tenant: Tenant = { id: tenantId, name: 'Exchange Test', status: 'ACTIVE' };
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

    const admin = await createPerson('Exchange-Admin');
    const worker = await createPerson('Exchange-Worker');

    const recipientParty: Party = {
      id: asId<'PartyId'>('PARTY-RECIPIENT-' + suffix, 'Party'),
      tenantId,
      kind: 'ORGANISATION',
      displayName: 'Recipient Organisation',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, recipientParty);

    const roleAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ARA-EXCHANGE-' + suffix, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, roleAssignment, {
      actorPersonId: admin.id,
      correlationId: 'EXCHANGE-TEST'
    });

    async function createObject(key: string, objectType = 'INFORMATION_CONTAINER'): Promise<CanonicalObjectIdentity> {
      const object: CanonicalObjectIdentity = {
        id: asId<'CanonicalObjectId'>('OBJ-' + key + '-' + suffix, 'Canonical Object'),
        tenantId,
        objectType,
        stableKey: key + ':' + suffix,
        createdAt: '2026-09-23T18:00:00.000Z'
      };
      await kernel.createCanonicalObject(tenantId, object, { actorPersonId: admin.id });
      return object;
    }

    const project = await createObject('PROJECT', 'PROJECT');
    const sourceSubject = await createObject('SOURCE-DRAWING');
    const currentSubject = await createObject('CURRENT-DRAWING');
    const targetSubject = await createObject('TARGET-DRAWING');

    await expect(service.createPackage(tenantId, worker.id, {
      code: 'DENIED',
      name: 'Denied',
      purpose: 'Permission proof',
      sourceSystem: 'NuBlox'
    })).rejects.toMatchObject({
      name: 'ExchangeCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ExchangeCommandError>);

    const basePackage = await service.createPackage(tenantId, admin.id, {
      code: 'PROJECT-DATA',
      name: 'Project data exchange',
      purpose: 'Issue controlled project information',
      sourceContextObjectId: project.id,
      sourceSystem: 'NuBlox',
      packageVersion: 1,
      createdAt: '2026-09-23T18:10:00.000Z'
    });
    const baseItem = await service.addPackageItem(tenantId, admin.id, {
      packageId: basePackage.id,
      subjectObjectId: sourceSubject.id,
      subjectVersion: 'A',
      itemRole: 'PRIMARY',
      itemChecksum: 'sha256:source-a'
    });
    await service.freezePackage(tenantId, admin.id, {
      packageId: basePackage.id,
      packageChecksum: 'sha256:package-v1',
      frozenAt: '2026-09-23T18:11:00.000Z'
    });
    const baseDelivery = await service.dispatchDelivery(tenantId, admin.id, {
      packageId: basePackage.id,
      deliveryReference: 'DEL-' + suffix + '-1',
      deliverySequence: 1,
      transportReference: 'SFTP://exchange/base',
      deliveryChecksum: 'sha256:delivery-v1',
      dispatchedAt: '2026-09-23T18:12:00.000Z'
    });
    const baseRecipient = await service.addRecipient(tenantId, admin.id, {
      deliveryId: baseDelivery.id,
      recipientPartyId: recipientParty.id,
      targetSystem: 'Recipient CDE',
      targetContextObjectId: project.id
    });
    const received = await service.receiveDelivery(tenantId, admin.id, {
      deliveryId: baseDelivery.id,
      recipientId: baseRecipient.id,
      receivedPackageChecksum: 'sha256:package-v1',
      receivedAt: '2026-09-23T18:13:00.000Z'
    });
    await service.validateReceived(tenantId, admin.id, received.id, '2026-09-23T18:14:00.000Z');
    await service.addMapping(tenantId, admin.id, {
      receivedDeliveryId: received.id,
      mappingType: 'TYPE',
      sourceValue: 'DRAWING',
      targetValue: 'CONTROLLED_DRAWING',
      targetObjectId: targetSubject.id
    });
    await service.markMapped(tenantId, admin.id, received.id, '2026-09-23T18:15:00.000Z');
    const imported = await service.importReceived(tenantId, admin.id, {
      receivedDeliveryId: received.id,
      importReference: 'IMPORT-' + suffix,
      importedAt: '2026-09-23T18:16:00.000Z'
    });
    expect(imported.status).toBe('IMPORTED');

    const decision: Decision = {
      id: asId<'DecisionId'>('DEC-ADOPT-' + suffix, 'Decision'),
      tenantId,
      decisionType: 'AUTHORITY_ADOPTION',
      subjectObjectId: targetSubject.id,
      subjectVersion: 'B',
      outcome: 'APPROVED',
      reason: 'Recipient accepts target object as the governed master.',
      deciderPersonId: admin.id,
      decidedAt: '2026-09-23T18:17:00.000Z'
    };
    await control.createDecision(tenantId, decision, {
      actorPersonId: admin.id,
      correlationId: 'EXCHANGE-TEST'
    });

    await expect(service.adoptAuthority(tenantId, worker.id, {
      receivedDeliveryId: received.id,
      sourceSubjectObjectId: sourceSubject.id,
      sourceSubjectVersion: 'A',
      targetCanonicalObjectId: targetSubject.id,
      targetSubjectVersion: 'B',
      sourceAuthority: 'Source Organisation',
      targetAuthority: 'Recipient Organisation',
      decisionId: decision.id
    })).rejects.toMatchObject({
      name: 'ExchangeCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ExchangeCommandError>);

    const adoption = await service.adoptAuthority(tenantId, admin.id, {
      receivedDeliveryId: received.id,
      sourceSubjectObjectId: sourceSubject.id,
      sourceSubjectVersion: 'A',
      targetCanonicalObjectId: targetSubject.id,
      targetSubjectVersion: 'B',
      sourceAuthority: 'Source Organisation',
      targetAuthority: 'Recipient Organisation',
      decisionId: decision.id,
      adoptedAt: '2026-09-23T18:18:00.000Z'
    });
    expect(adoption.targetAuthority).toBe('Recipient Organisation');

    const incrementPackage = await service.createPackage(tenantId, admin.id, {
      code: 'PROJECT-DATA',
      name: 'Project data exchange',
      purpose: 'Incremental controlled project information',
      sourceContextObjectId: project.id,
      sourceSystem: 'NuBlox',
      packageVersion: 2,
      createdAt: '2026-09-23T18:20:00.000Z'
    });
    const currentItem = await service.addPackageItem(tenantId, admin.id, {
      packageId: incrementPackage.id,
      subjectObjectId: currentSubject.id,
      subjectVersion: 'B',
      itemRole: 'PRIMARY',
      itemChecksum: 'sha256:current-b'
    });
    await service.freezePackage(tenantId, admin.id, {
      packageId: incrementPackage.id,
      packageChecksum: 'sha256:package-v2',
      frozenAt: '2026-09-23T18:21:00.000Z'
    });
    const incrementDelivery = await service.dispatchDelivery(tenantId, admin.id, {
      packageId: incrementPackage.id,
      deliveryReference: 'DEL-' + suffix + '-2',
      deliverySequence: 1,
      priorDeliveryId: baseDelivery.id,
      dispatchedAt: '2026-09-23T18:22:00.000Z'
    });
    await service.addDeltaItem(tenantId, admin.id, {
      deliveryId: incrementDelivery.id,
      subjectObjectId: sourceSubject.id,
      deltaType: 'DELETED',
      priorDeliveryId: baseDelivery.id,
      priorSubjectVersion: 'A',
      details: 'Source drawing removed from the incremental package.'
    });
    await service.addDeltaItem(tenantId, admin.id, {
      deliveryId: incrementDelivery.id,
      subjectObjectId: currentSubject.id,
      packageItemId: currentItem.id,
      deltaType: 'NEW',
      priorDeliveryId: baseDelivery.id,
      details: 'Replacement controlled drawing added.'
    });

    const projection = await reads.getProjection(tenantId, admin.id);
    const baseView = projection.packages.find((item) => item.id === basePackage.id);
    const incrementView = projection.packages.find((item) => item.id === incrementPackage.id);
    expect(baseView?.deliveries[0]?.recipients[0]?.received).toMatchObject({
      id: received.id,
      status: 'IMPORTED',
      importReference: 'IMPORT-' + suffix
    });
    expect(baseView?.deliveries[0]?.recipients[0]?.received?.adoptions).toEqual([
      expect.objectContaining({
        id: adoption.id,
        decisionOutcome: 'APPROVED',
        sourceAuthority: 'Source Organisation',
        targetAuthority: 'Recipient Organisation'
      })
    ]);
    expect(baseView?.deliveries[0]?.recipients[0]?.response).toBeUndefined();
    expect(incrementView?.deliveries[0]?.deltas).toEqual(expect.arrayContaining([
      expect.objectContaining({
        subjectObjectId: sourceSubject.id,
        deltaType: 'DELETED',
        packageItemId: undefined
      }),
      expect.objectContaining({
        subjectObjectId: currentSubject.id,
        packageItemId: currentItem.id,
        deltaType: 'NEW'
      })
    ]));

    await expect(reads.getProjection(tenantId, worker.id)).rejects.toMatchObject({
      name: 'ExchangeReadError',
      code: 'PERMISSION_DENIED'
    });

    expect(baseItem.subjectVersion).toBe('A');
  });
});
