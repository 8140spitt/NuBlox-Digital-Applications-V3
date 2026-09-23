import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createIntegrationEndpoint,
  createPublicationAcknowledgement,
  createPublicationActivity,
  createPublicationAttempt,
  createPublicationResult,
  createPublicationTransaction,
  createSourceAuthorityRule,
  applyPublicationAcknowledgementToActivity,
  applyPublicationAcknowledgementToAttempt,
  applyPublicationResultToActivity,
  markPublicationAttemptSent,
  startPublicationTransaction,
  updatePublicationTransactionFromActivities,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type IntegrationEndpoint,
  type Person,
  type PublicationActivity,
  type PublicationAttempt,
  type PublicationTransaction,
  type SourceAuthorityRule
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-PUB', 'Tenant');
const person: Person = {
  id: asId<'PersonId'>('PERSON-PUB', 'Person'),
  tenantId,
  partyId: asId<'PartyId'>('PARTY-PUB', 'Party'),
  legalName: 'Publisher',
  status: 'ACTIVE'
};
const subject: CanonicalObjectIdentity = {
  id: asId<'CanonicalObjectId'>('OBJECT-PUB', 'Canonical Object'),
  tenantId,
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'DOC:001',
  createdAt: '2026-09-23T18:00:00.000Z'
};
const endpoint: IntegrationEndpoint = createIntegrationEndpoint({
  id: asId<'IntegrationEndpointId'>('ENDPOINT-ERP', 'Endpoint'),
  tenantId,
  code: 'ERP',
  name: 'ERP',
  endpointType: 'ERP',
  direction: 'OUTBOUND',
  transportProtocol: 'HTTPS',
  systemName: 'ERP',
  endpointReference: 'vault://integration/erp',
  acknowledgementRequired: true,
  businessResultRequired: true,
  capabilities: ['PART'],
  status: 'ACTIVE'
});
const envelope: CanonicalDataEnvelope = {
  id: asId<'DataEnvelopeId'>('ENV-PUB', 'Envelope'),
  tenantId,
  direction: 'EXPORT',
  schemaName: 'nublox.part',
  schemaVersion: '1.0',
  objectType: 'INFORMATION_CONTAINER',
  stableKey: 'DOC:001',
  payload: { number: '001' },
  externalSystem: 'ERP',
  checksum: 'sha256:test',
  createdAt: '2026-09-23T18:01:00.000Z'
};
const authority: SourceAuthorityRule = createSourceAuthorityRule({
  id: asId<'SourceAuthorityRuleId'>('AUTH-NUBLOX', 'Source Authority Rule'),
  tenantId,
  code: 'DOC-MASTER',
  name: 'NuBlox document master',
  subjectObjectType: 'INFORMATION_CONTAINER',
  authorityOwner: 'NUBLOX',
  priority: 0,
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  status: 'ACTIVE'
});

describe('closed-loop publication invariants', () => {
  it('does not equate transport acknowledgement with business application', () => {
    const transaction: PublicationTransaction = createPublicationTransaction({
      id: asId<'PublicationTransactionId'>('PUBTX-1', 'Publication Transaction'),
      tenantId,
      endpointId: endpoint.id,
      transactionReference: 'PUB-1',
      idempotencyKey: 'PUB-1',
      operation: 'UPDATE',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-23T18:02:00.000Z',
      status: 'QUEUED'
    }, endpoint, person);

    const activity: PublicationActivity = createPublicationActivity({
      id: asId<'PublicationActivityId'>('PUBACT-1', 'Publication Activity'),
      tenantId,
      publicationTransactionId: transaction.id,
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      action: 'UPDATE',
      sequence: 1,
      dataEnvelopeId: envelope.id,
      sourceAuthorityRuleId: authority.id,
      status: 'PENDING'
    }, transaction, endpoint, subject, envelope, authority);

    const running = startPublicationTransaction(
      transaction,
      [activity],
      '2026-09-23T18:03:00.000Z'
    );

    const attempt: PublicationAttempt = createPublicationAttempt({
      id: asId<'PublicationAttemptId'>('PUBATT-1', 'Publication Attempt'),
      tenantId,
      publicationActivityId: activity.id,
      attemptNumber: 1,
      dataEnvelopeId: envelope.id,
      startedAt: '2026-09-23T18:04:00.000Z',
      status: 'STARTED'
    }, running, activity, envelope);

    const sent = markPublicationAttemptSent(
      attempt,
      '2026-09-23T18:05:00.000Z',
      'HTTP-202'
    );
    const awaiting: PublicationActivity = { ...activity, status: 'AWAITING_ACKNOWLEDGEMENT' };

    const acknowledgement = createPublicationAcknowledgement({
      id: asId<'PublicationAcknowledgementId'>('ACK-1', 'Acknowledgement'),
      tenantId,
      publicationAttemptId: sent.id,
      acknowledgementType: 'RECEIPT',
      outcome: 'ACKNOWLEDGED',
      receivedAt: '2026-09-23T18:06:00.000Z',
      externalTransactionId: 'ERP-123'
    }, sent);

    const delivered = applyPublicationAcknowledgementToAttempt(sent, acknowledgement);
    const acknowledged = applyPublicationAcknowledgementToActivity(awaiting, acknowledgement);
    expect(delivered.status).toBe('DELIVERED');
    expect(acknowledged.status).toBe('ACKNOWLEDGED');

    const afterAck = updatePublicationTransactionFromActivities(
      { ...running, status: 'AWAITING_RESULTS' },
      [acknowledged],
      '2026-09-23T18:06:00.000Z'
    );
    expect(afterAck.status).toBe('AWAITING_RESULTS');
    expect(afterAck.completedAt).toBeUndefined();

    const result = createPublicationResult({
      id: asId<'PublicationResultId'>('RES-1', 'Publication Result'),
      tenantId,
      publicationActivityId: activity.id,
      acknowledgementId: acknowledgement.id,
      outcome: 'APPLIED',
      completedAt: '2026-09-23T18:07:00.000Z',
      externalObjectId: 'ERP-DOC-001'
    }, acknowledged, acknowledgement, delivered);
    const applied = applyPublicationResultToActivity(acknowledged, result);
    const completed = updatePublicationTransactionFromActivities(
      afterAck,
      [applied],
      result.completedAt
    );
    expect(completed.status).toBe('SUCCEEDED');
    expect(completed.completedAt).toBe(result.completedAt);
  });

  it('prevents NuBlox master-mutation actions for endpoint-authoritative families', () => {
    const endpointAuthority = createSourceAuthorityRule({
      id: asId<'SourceAuthorityRuleId'>('AUTH-ENDPOINT', 'Source Authority Rule'),
      tenantId,
      code: 'ERP-MASTER',
      name: 'ERP master',
      subjectObjectType: 'INFORMATION_CONTAINER',
      authorityOwner: 'ENDPOINT',
      endpointId: endpoint.id,
      priority: 0,
      effectiveFrom: '2026-01-01T00:00:00.000Z',
      status: 'ACTIVE'
    }, endpoint);
    const transaction = createPublicationTransaction({
      id: asId<'PublicationTransactionId'>('PUBTX-2', 'Publication Transaction'),
      tenantId,
      endpointId: endpoint.id,
      transactionReference: 'PUB-2',
      idempotencyKey: 'PUB-2',
      operation: 'UPDATE',
      requestedByPersonId: person.id,
      requestedAt: '2026-09-23T18:02:00.000Z',
      status: 'QUEUED'
    }, endpoint, person);

    expect(() => createPublicationActivity({
      id: asId<'PublicationActivityId'>('PUBACT-2', 'Publication Activity'),
      tenantId,
      publicationTransactionId: transaction.id,
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      action: 'UPDATE',
      sequence: 1,
      dataEnvelopeId: envelope.id,
      sourceAuthorityRuleId: endpointAuthority.id,
      status: 'PENDING'
    }, transaction, endpoint, subject, envelope, endpointAuthority))
      .toThrow(KernelInvariantError);

    expect(createPublicationActivity({
      id: asId<'PublicationActivityId'>('PUBACT-3', 'Publication Activity'),
      tenantId,
      publicationTransactionId: transaction.id,
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      action: 'SYNC',
      sequence: 1,
      dataEnvelopeId: envelope.id,
      sourceAuthorityRuleId: endpointAuthority.id,
      status: 'PENDING'
    }, transaction, endpoint, subject, envelope, endpointAuthority).action)
      .toBe('SYNC');
  });
});
