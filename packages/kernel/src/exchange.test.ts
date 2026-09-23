import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createAuthorityAdoption,
  createExchangeDelivery,
  createExchangeDeltaItem,
  createExchangePackage,
  createExchangePackageItem,
  createExchangeRecipient,
  createReceivedDelivery,
  freezeExchangePackage,
  importReceivedDelivery,
  markReceivedDeliveryMapped,
  validateReceivedDelivery,
  type CanonicalObjectIdentity,
  type Decision,
  type ExchangeDelivery,
  type ExchangePackage,
  type ExchangePackageItem,
  type ExchangeRecipient,
  type Party,
  type Person,
  type ReceivedDelivery
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-EXCHANGE', 'Tenant');
const person: Person = {
  id: asId<'PersonId'>('PERSON-EXCHANGE', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-PERSON', 'Party'),
  legalName: 'Exchange User',
  status: 'ACTIVE'
};
const recipientParty: Party = {
  id: asId<'PartyId'>('PARTY-RECIPIENT', 'Party'),
  tenantId,
  kind: 'ORGANISATION',
  displayName: 'Recipient',
  status: 'ACTIVE'
};
const sourceSubject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-SOURCE', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'SOURCE:1',
  createdAt: '2026-09-23T18:00:00.000Z'
};
const targetSubject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJ-TARGET', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'TARGET:1',
  createdAt: '2026-09-23T18:00:00.000Z'
};

describe('exchange authority invariants', () => {
  it('freezes exact package membership before delivery', () => {
    const pkg: ExchangePackage = createExchangePackage({
      id: asId<'ExchangePackageId'>('PKG-1', 'Exchange Package'),
      tenantId,
      code: 'PKG-1',
      name: 'Package 1',
      purpose: 'Controlled exchange',
      sourceSystem: 'NuBlox',
      packageVersion: 1,
      status: 'DRAFT',
      createdByPersonId: person.id,
      createdAt: '2026-09-23T18:00:00.000Z'
    }, person);

    const item: ExchangePackageItem = createExchangePackageItem({
      id: asId<'ExchangePackageItemId'>('PKGI-1', 'Exchange Package Item'),
      tenantId,
      exchangePackageId: pkg.id,
      subjectObjectId: sourceSubject.id,
      subjectVersion: 'A',
      itemRole: 'PRIMARY'
    }, pkg, sourceSubject);

    const frozen = freezeExchangePackage(
      pkg,
      [item],
      '2026-09-23T18:05:00.000Z',
      'sha256:package'
    );
    expect(frozen.status).toBe('FROZEN');

    expect(() => createExchangePackageItem({
      ...item,
      id: asId<'ExchangePackageItemId'>('PKGI-2', 'Exchange Package Item')
    }, frozen, sourceSubject)).toThrow(KernelInvariantError);
  });

  it('supports true incremental delta semantics including deleted subjects', () => {
    const pkg1 = freezeExchangePackage(createExchangePackage({
      id: asId<'ExchangePackageId'>('PKG-A', 'Exchange Package'),
      tenantId, code: 'PKG', name: 'Package', purpose: 'Base', sourceSystem: 'NuBlox',
      packageVersion: 1, status: 'DRAFT', createdByPersonId: person.id,
      createdAt: '2026-09-23T18:00:00.000Z'
    }, person), [{
      id: asId<'ExchangePackageItemId'>('PKGI-A', 'Exchange Package Item'),
      tenantId, exchangePackageId: asId<'ExchangePackageId'>('PKG-A', 'Exchange Package'),
      subjectObjectId: sourceSubject.id, subjectVersion: 'A', itemRole: 'PRIMARY'
    }], '2026-09-23T18:01:00.000Z', 'base');

    const base: ExchangeDelivery = createExchangeDelivery({
      id: asId<'ExchangeDeliveryId'>('DEL-1', 'Exchange Delivery'),
      tenantId, exchangePackageId: pkg1.id, deliveryReference: 'DEL-1',
      deliverySequence: 1, dispatchedByPersonId: person.id,
      dispatchedAt: '2026-09-23T18:02:00.000Z', status: 'DISPATCHED'
    }, pkg1, person);

    const pkg2 = freezeExchangePackage(createExchangePackage({
      id: asId<'ExchangePackageId'>('PKG-B', 'Exchange Package'),
      tenantId, code: 'PKG', name: 'Package', purpose: 'Increment', sourceSystem: 'NuBlox',
      packageVersion: 2, status: 'DRAFT', createdByPersonId: person.id,
      createdAt: '2026-09-23T18:10:00.000Z'
    }, person), [{
      id: asId<'ExchangePackageItemId'>('PKGI-B', 'Exchange Package Item'),
      tenantId, exchangePackageId: asId<'ExchangePackageId'>('PKG-B', 'Exchange Package'),
      subjectObjectId: targetSubject.id, subjectVersion: 'B', itemRole: 'PRIMARY'
    }], '2026-09-23T18:11:00.000Z', 'increment');

    const incremental = createExchangeDelivery({
      id: asId<'ExchangeDeliveryId'>('DEL-2', 'Exchange Delivery'),
      tenantId, exchangePackageId: pkg2.id, deliveryReference: 'DEL-2',
      deliverySequence: 1, priorDeliveryId: base.id, dispatchedByPersonId: person.id,
      dispatchedAt: '2026-09-23T18:12:00.000Z', status: 'DISPATCHED'
    }, pkg2, person, undefined, base);

    const deleted = createExchangeDeltaItem({
      id: asId<'ExchangeDeltaItemId'>('DELTA-DEL', 'Exchange Delta Item'),
      tenantId, exchangeDeliveryId: incremental.id, subjectObjectId: sourceSubject.id,
      deltaType: 'DELETED', priorDeliveryId: base.id, priorSubjectVersion: 'A'
    }, incremental, sourceSubject, undefined, base);
    expect(deleted.deltaType).toBe('DELETED');
  });

  it('keeps receipt, import and authority adoption as separate states', () => {
    const pkg = freezeExchangePackage(createExchangePackage({
      id: asId<'ExchangePackageId'>('PKG-REC', 'Exchange Package'),
      tenantId, code: 'PKG-REC', name: 'Receipt package', purpose: 'Receipt',
      sourceSystem: 'NuBlox', packageVersion: 1, status: 'DRAFT',
      createdByPersonId: person.id, createdAt: '2026-09-23T18:00:00.000Z'
    }, person), [{
      id: asId<'ExchangePackageItemId'>('PKGI-REC', 'Exchange Package Item'),
      tenantId, exchangePackageId: asId<'ExchangePackageId'>('PKG-REC', 'Exchange Package'),
      subjectObjectId: sourceSubject.id, subjectVersion: 'A', itemRole: 'PRIMARY'
    }], '2026-09-23T18:01:00.000Z', 'receipt');

    const delivery = createExchangeDelivery({
      id: asId<'ExchangeDeliveryId'>('DEL-REC', 'Exchange Delivery'),
      tenantId, exchangePackageId: pkg.id, deliveryReference: 'DEL-REC',
      deliverySequence: 1, dispatchedByPersonId: person.id,
      dispatchedAt: '2026-09-23T18:02:00.000Z', status: 'DISPATCHED'
    }, pkg, person);

    const recipient: ExchangeRecipient = createExchangeRecipient({
      id: asId<'ExchangeRecipientId'>('REC-1', 'Exchange Recipient'),
      tenantId, exchangeDeliveryId: delivery.id, recipientPartyId: recipientParty.id,
      targetSystem: 'Target ERP', status: 'ACTIVE'
    }, delivery, recipientParty);

    const received: ReceivedDelivery = createReceivedDelivery({
      id: asId<'ReceivedDeliveryId'>('RCV-1', 'Received Delivery'),
      tenantId, exchangeDeliveryId: delivery.id, exchangeRecipientId: recipient.id,
      receivedByPersonId: person.id, receivedAt: '2026-09-23T18:03:00.000Z',
      status: 'RECEIVED'
    }, delivery, recipient, person);

    const validated = validateReceivedDelivery(received, '2026-09-23T18:04:00.000Z');
    const mapped = markReceivedDeliveryMapped(validated, '2026-09-23T18:05:00.000Z');
    const imported = importReceivedDelivery(mapped, '2026-09-23T18:06:00.000Z', 'IMPORT-1');
    expect(imported.status).toBe('IMPORTED');

    const decision: Decision = {
      id: asId<'DecisionId'>('DEC-ADOPT', 'Decision'),
      tenantId, decisionType: 'AUTHORITY_ADOPTION',
      subjectObjectId: targetSubject.id, subjectVersion: 'B', outcome: 'APPROVED',
      reason: 'Adopt target authority', deciderPersonId: person.id,
      decidedAt: '2026-09-23T18:07:00.000Z'
    };
    const adoption = createAuthorityAdoption({
      id: asId<'AuthorityAdoptionId'>('AUTH-1', 'Authority Adoption'),
      tenantId, receivedDeliveryId: imported.id,
      sourceSubjectObjectId: sourceSubject.id, sourceSubjectVersion: 'A',
      targetCanonicalObjectId: targetSubject.id, targetSubjectVersion: 'B',
      sourceAuthority: 'Source Organisation', targetAuthority: 'Recipient Organisation',
      decisionId: decision.id, adoptedByPersonId: person.id,
      adoptedAt: '2026-09-23T18:08:00.000Z'
    }, imported, sourceSubject, targetSubject, decision, person);
    expect(adoption.targetAuthority).toBe('Recipient Organisation');
  });
});
