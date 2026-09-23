import type {
  CanonicalObjectId,
  DecisionId,
  ExchangeDeltaItemId,
  ExchangeDeliveryId,
  ExchangeMappingId,
  ExchangePackageId,
  ExchangePackageItemId,
  ExchangeRecipientId,
  ExternalIdentityId,
  PartyId,
  PersonId,
  ReceivedDeliveryId,
  RepresentationId,
  TenantId,
  TransmittalId,
  TransmittalRecipientId,
  AuthorityAdoptionId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type ExchangePackageStatus = 'DRAFT' | 'FROZEN' | 'CANCELLED';

export interface ExchangePackage {
  id: ExchangePackageId;
  tenantId: TenantId;
  code: string;
  name: string;
  purpose: string;
  sourceContextObjectId?: CanonicalObjectId;
  sourceSystem: string;
  packageVersion: number;
  status: ExchangePackageStatus;
  createdByPersonId: PersonId;
  createdAt: string;
  frozenAt?: string;
  packageChecksum?: string;
}

export interface ExchangePackageItem {
  id: ExchangePackageItemId;
  tenantId: TenantId;
  exchangePackageId: ExchangePackageId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  representationId?: RepresentationId;
  externalIdentityId?: ExternalIdentityId;
  itemRole: string;
  itemChecksum?: string;
}

export type ExchangeDeliveryStatus = 'DISPATCHED' | 'FAILED' | 'CANCELLED';

export interface ExchangeDelivery {
  id: ExchangeDeliveryId;
  tenantId: TenantId;
  exchangePackageId: ExchangePackageId;
  transmittalId?: TransmittalId;
  deliveryReference: string;
  deliverySequence: number;
  priorDeliveryId?: ExchangeDeliveryId;
  dispatchedByPersonId: PersonId;
  dispatchedAt: string;
  transportReference?: string;
  deliveryChecksum?: string;
  status: ExchangeDeliveryStatus;
}

export interface ExchangeRecipient {
  id: ExchangeRecipientId;
  tenantId: TenantId;
  exchangeDeliveryId: ExchangeDeliveryId;
  recipientPartyId: PartyId;
  transmittalRecipientId?: TransmittalRecipientId;
  targetSystem?: string;
  targetContextObjectId?: CanonicalObjectId;
  targetReference?: string;
  status: RecordStatus;
}

export type ExchangeDeltaType = 'NEW' | 'CHANGED' | 'MOVED' | 'DELETED' | 'ABSENT';

export interface ExchangeDeltaItem {
  id: ExchangeDeltaItemId;
  tenantId: TenantId;
  exchangeDeliveryId: ExchangeDeliveryId;
  subjectObjectId: CanonicalObjectId;
  exchangePackageItemId?: ExchangePackageItemId;
  deltaType: ExchangeDeltaType;
  priorDeliveryId?: ExchangeDeliveryId;
  priorSubjectVersion?: string;
  priorLocationReference?: string;
  currentLocationReference?: string;
  details?: string;
}

export type ReceivedDeliveryStatus =
  | 'RECEIVED'
  | 'VALIDATED'
  | 'MAPPED'
  | 'IMPORTED'
  | 'REJECTED';

export interface ReceivedDelivery {
  id: ReceivedDeliveryId;
  tenantId: TenantId;
  exchangeDeliveryId: ExchangeDeliveryId;
  exchangeRecipientId: ExchangeRecipientId;
  receivedByPersonId: PersonId;
  receivedAt: string;
  receivedPackageChecksum?: string;
  status: ReceivedDeliveryStatus;
  validatedAt?: string;
  mappedAt?: string;
  importedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  importReference?: string;
}

export type ExchangeMappingType =
  | 'CONTEXT'
  | 'ORGANISATION'
  | 'VIEW'
  | 'LIFECYCLE'
  | 'FOLDER'
  | 'SECURITY_LABEL'
  | 'CLASSIFICATION'
  | 'TYPE'
  | 'VERSION'
  | 'CUSTOM';

export interface ExchangeMapping {
  id: ExchangeMappingId;
  tenantId: TenantId;
  receivedDeliveryId: ReceivedDeliveryId;
  mappingType: ExchangeMappingType;
  sourceValue: string;
  targetValue: string;
  targetObjectId?: CanonicalObjectId;
  notes?: string;
  status: RecordStatus;
}

export interface AuthorityAdoption {
  id: AuthorityAdoptionId;
  tenantId: TenantId;
  receivedDeliveryId: ReceivedDeliveryId;
  sourceSubjectObjectId: CanonicalObjectId;
  sourceSubjectVersion?: string;
  targetCanonicalObjectId: CanonicalObjectId;
  targetSubjectVersion?: string;
  sourceAuthority: string;
  targetAuthority: string;
  decisionId: DecisionId;
  adoptedByPersonId: PersonId;
  adoptedAt: string;
}
