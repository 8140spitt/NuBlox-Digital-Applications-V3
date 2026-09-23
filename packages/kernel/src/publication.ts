import type {
  CanonicalObjectId,
  DataEnvelopeId,
  ExchangeDeliveryId,
  ExternalIdentityId,
  IntegrationEndpointId,
  IntegrationJobId,
  OutboxMessageId,
  PartyId,
  PersonId,
  PublicationAcknowledgementId,
  PublicationActivityId,
  PublicationAttemptId,
  PublicationResultId,
  PublicationTransactionId,
  SourceAuthorityRuleId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type IntegrationEndpointType =
  | 'ERP'
  | 'MES'
  | 'API'
  | 'WEBHOOK'
  | 'FILE'
  | 'MESSAGE_BUS'
  | 'CUSTOM';

export type IntegrationEndpointDirection =
  | 'OUTBOUND'
  | 'INBOUND'
  | 'BIDIRECTIONAL';

export type IntegrationTransportProtocol =
  | 'HTTP'
  | 'HTTPS'
  | 'SFTP'
  | 'AMQP'
  | 'KAFKA'
  | 'FILE'
  | 'CUSTOM';

export interface IntegrationEndpoint {
  id: IntegrationEndpointId;
  tenantId: TenantId;
  code: string;
  name: string;
  endpointType: IntegrationEndpointType;
  direction: IntegrationEndpointDirection;
  transportProtocol: IntegrationTransportProtocol;
  systemName: string;
  endpointReference: string;
  recipientPartyId?: PartyId;
  acknowledgementRequired: boolean;
  businessResultRequired: boolean;
  capabilities: ReadonlyArray<string>;
  status: RecordStatus;
}

export type PublicationOperation =
  | 'CREATE'
  | 'UPDATE'
  | 'UPSERT'
  | 'DELETE'
  | 'PUBLISH'
  | 'SYNC';

export type PublicationTransactionStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'AWAITING_RESULTS'
  | 'SUCCEEDED'
  | 'PARTIALLY_SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED';

export interface PublicationTransaction {
  id: PublicationTransactionId;
  tenantId: TenantId;
  endpointId: IntegrationEndpointId;
  transactionReference: string;
  idempotencyKey: string;
  operation: PublicationOperation;
  exchangeDeliveryId?: ExchangeDeliveryId;
  integrationJobId?: IntegrationJobId;
  resubmissionOfTransactionId?: PublicationTransactionId;
  requestedByPersonId: PersonId;
  requestedAt: string;
  status: PublicationTransactionStatus;
  startedAt?: string;
  completedAt?: string;
}

export type PublicationActivityStatus =
  | 'PENDING'
  | 'SENDING'
  | 'AWAITING_ACKNOWLEDGEMENT'
  | 'ACKNOWLEDGED'
  | 'TRANSPORT_FAILED'
  | 'APPLIED'
  | 'WARNING'
  | 'BUSINESS_REJECTED'
  | 'BUSINESS_FAILED'
  | 'SKIPPED';

export interface PublicationActivity {
  id: PublicationActivityId;
  tenantId: TenantId;
  publicationTransactionId: PublicationTransactionId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  action: PublicationOperation;
  sequence: number;
  dataEnvelopeId?: DataEnvelopeId;
  externalIdentityId?: ExternalIdentityId;
  sourceAuthorityRuleId?: SourceAuthorityRuleId;
  status: PublicationActivityStatus;
}

export type PublicationAttemptStatus =
  | 'STARTED'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'TIMED_OUT';

export interface PublicationAttempt {
  id: PublicationAttemptId;
  tenantId: TenantId;
  publicationActivityId: PublicationActivityId;
  attemptNumber: number;
  dataEnvelopeId: DataEnvelopeId;
  outboxMessageId?: OutboxMessageId;
  startedAt: string;
  status: PublicationAttemptStatus;
  sentAt?: string;
  completedAt?: string;
  transportReference?: string;
  errorMessage?: string;
}

export type PublicationAcknowledgementType =
  | 'TRANSPORT'
  | 'RECEIPT';

export type PublicationAcknowledgementOutcome =
  | 'ACKNOWLEDGED'
  | 'NEGATIVE_ACKNOWLEDGEMENT';

export interface PublicationAcknowledgement {
  id: PublicationAcknowledgementId;
  tenantId: TenantId;
  publicationAttemptId: PublicationAttemptId;
  acknowledgementType: PublicationAcknowledgementType;
  outcome: PublicationAcknowledgementOutcome;
  receivedAt: string;
  externalTransactionId?: string;
  message?: string;
  diagnosticReference?: string;
}

export type PublicationResultOutcome =
  | 'APPLIED'
  | 'NO_CHANGE'
  | 'WARNING'
  | 'REJECTED'
  | 'FAILED';

export interface PublicationResult {
  id: PublicationResultId;
  tenantId: TenantId;
  publicationActivityId: PublicationActivityId;
  acknowledgementId?: PublicationAcknowledgementId;
  outcome: PublicationResultOutcome;
  completedAt: string;
  externalObjectId?: string;
  externalVersion?: string;
  resultReference?: string;
  message?: string;
  rootCause?: string;
}

export type SourceAuthorityOwner =
  | 'NUBLOX'
  | 'ENDPOINT'
  | 'EXTERNAL';

export interface SourceAuthorityRule {
  id: SourceAuthorityRuleId;
  tenantId: TenantId;
  code: string;
  name: string;
  subjectObjectType: string;
  attributePath?: string;
  authorityOwner: SourceAuthorityOwner;
  endpointId?: IntegrationEndpointId;
  authorityReference?: string;
  priority: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}
