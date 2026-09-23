import { invariant } from './errors.js';
import type { Decision } from './control.js';
import type {
  AuthorityAdoption,
  ExchangeDeltaItem,
  ExchangeDelivery,
  ExchangeMapping,
  ExchangePackage,
  ExchangePackageItem,
  ExchangeRecipient,
  ReceivedDelivery
} from './exchange.js';
import type { ExternalIdentity } from './portability.js';
import type { CanonicalObjectIdentity, Party, Person } from './model.js';
import type { Representation } from './information.js';
import type { Transmittal, TransmittalRecipient } from './deliverables.js';

function sameTenant(a: { tenantId: string }, b: { tenantId: string }, label: string): void {
  invariant(a.tenantId === b.tenantId, `${label} must stay within one tenant.`);
}
function text(value: string, label: string): void {
  invariant(value.trim().length > 0, `${label} must not be empty.`);
}
function date(value: string, label: string): number {
  const parsed = Date.parse(value);
  invariant(!Number.isNaN(parsed), `${label} must be a valid date/time.`);
  return parsed;
}

export function createExchangePackage(
  input: ExchangePackage,
  creator: Person,
  sourceContext?: CanonicalObjectIdentity
): ExchangePackage {
  sameTenant(input, creator, 'Exchange Package creator');
  invariant(input.createdByPersonId === creator.id, 'Exchange Package must reference the supplied creator.');
  text(input.code, 'Exchange Package code');
  text(input.name, 'Exchange Package name');
  text(input.purpose, 'Exchange Package purpose');
  text(input.sourceSystem, 'Exchange Package source system');
  invariant(Number.isInteger(input.packageVersion) && input.packageVersion > 0, 'Exchange Package version must be positive.');
  invariant(input.status === 'DRAFT', 'New Exchange Package must start DRAFT.');
  date(input.createdAt, 'Exchange Package createdAt');
  invariant(!input.frozenAt && !input.packageChecksum, 'New Exchange Package must not contain frozen state.');
  if (sourceContext) {
    sameTenant(input, sourceContext, 'Exchange Package source context');
    invariant(input.sourceContextObjectId === sourceContext.id, 'Exchange Package source context reference does not match.');
  } else {
    invariant(!input.sourceContextObjectId, 'Exchange Package cannot reference an unsupplied source context.');
  }
  return Object.freeze({ ...input });
}

export function createExchangePackageItem(
  input: ExchangePackageItem,
  exchangePackage: ExchangePackage,
  subject: CanonicalObjectIdentity,
  representation?: Representation,
  externalIdentity?: ExternalIdentity
): ExchangePackageItem {
  sameTenant(input, exchangePackage, 'Exchange Package Item');
  sameTenant(input, subject, 'Exchange Package Item subject');
  invariant(input.exchangePackageId === exchangePackage.id, 'Exchange Package Item must reference the supplied Package.');
  invariant(exchangePackage.status === 'DRAFT', 'Exchange Package Items can only be changed while the Package is DRAFT.');
  invariant(input.subjectObjectId === subject.id, 'Exchange Package Item must reference the supplied subject.');
  text(input.itemRole, 'Exchange Package Item role');
  if (input.subjectVersion !== undefined) text(input.subjectVersion, 'Exchange Package Item subjectVersion');
  if (input.itemChecksum !== undefined) text(input.itemChecksum, 'Exchange Package Item checksum');

  if (representation) {
    sameTenant(input, representation, 'Exchange Package Item representation');
    invariant(input.representationId === representation.id, 'Exchange Package Item representation reference does not match.');
  } else {
    invariant(!input.representationId, 'Exchange Package Item cannot reference an unsupplied Representation.');
  }

  if (externalIdentity) {
    sameTenant(input, externalIdentity, 'Exchange Package Item external identity');
    invariant(input.externalIdentityId === externalIdentity.id, 'Exchange Package Item external identity reference does not match.');
    invariant(externalIdentity.canonicalObjectId === input.subjectObjectId, 'External Identity must belong to the Package Item subject.');
  } else {
    invariant(!input.externalIdentityId, 'Exchange Package Item cannot reference an unsupplied External Identity.');
  }

  invariant(
    Boolean(input.subjectVersion || input.representationId || input.externalIdentityId || input.itemChecksum),
    'Exchange Package Item must retain exact version, representation, external identity or checksum evidence.'
  );
  return Object.freeze({ ...input });
}

export function freezeExchangePackage(
  current: ExchangePackage,
  items: ReadonlyArray<ExchangePackageItem>,
  frozenAt: string,
  packageChecksum: string
): ExchangePackage {
  invariant(current.status === 'DRAFT', 'Only a DRAFT Exchange Package can be frozen.');
  invariant(items.length > 0, 'Exchange Package cannot be frozen without items.');
  invariant(items.every((item) => item.exchangePackageId === current.id), 'All frozen Package Items must belong to the Package.');
  date(frozenAt, 'Exchange Package frozenAt');
  invariant(Date.parse(frozenAt) >= Date.parse(current.createdAt), 'Exchange Package cannot be frozen before creation.');
  text(packageChecksum, 'Exchange Package checksum');
  return Object.freeze({ ...current, status: 'FROZEN', frozenAt, packageChecksum });
}

export function createExchangeDelivery(
  input: ExchangeDelivery,
  exchangePackage: ExchangePackage,
  dispatcher: Person,
  transmittal?: Transmittal,
  priorDelivery?: ExchangeDelivery
): ExchangeDelivery {
  sameTenant(input, exchangePackage, 'Exchange Delivery and Package');
  sameTenant(input, dispatcher, 'Exchange Delivery dispatcher');
  invariant(input.exchangePackageId === exchangePackage.id, 'Exchange Delivery must reference the supplied Package.');
  invariant(exchangePackage.status === 'FROZEN', 'Exchange Delivery requires a FROZEN Package.');
  invariant(input.dispatchedByPersonId === dispatcher.id, 'Exchange Delivery must reference the supplied dispatcher.');
  text(input.deliveryReference, 'Exchange Delivery reference');
  invariant(Number.isInteger(input.deliverySequence) && input.deliverySequence > 0, 'Exchange Delivery sequence must be positive.');
  invariant(input.status === 'DISPATCHED', 'New Exchange Delivery must start DISPATCHED.');
  date(input.dispatchedAt, 'Exchange Delivery dispatchedAt');
  if (transmittal) {
    sameTenant(input, transmittal, 'Exchange Delivery Transmittal');
    invariant(input.transmittalId === transmittal.id, 'Exchange Delivery Transmittal reference does not match.');
  } else {
    invariant(!input.transmittalId, 'Exchange Delivery cannot reference an unsupplied Transmittal.');
  }
  if (priorDelivery) {
    sameTenant(input, priorDelivery, 'Exchange Delivery prior Delivery');
    invariant(input.priorDeliveryId === priorDelivery.id, 'Exchange Delivery prior Delivery reference does not match.');
    invariant(priorDelivery.id !== input.id, 'Exchange Delivery cannot use itself as a prior Delivery.');
  } else {
    invariant(!input.priorDeliveryId, 'Exchange Delivery cannot reference an unsupplied prior Delivery.');
  }
  return Object.freeze({ ...input });
}

export function createExchangeRecipient(
  input: ExchangeRecipient,
  delivery: ExchangeDelivery,
  recipientParty: Party,
  targetContext?: CanonicalObjectIdentity,
  transmittalRecipient?: TransmittalRecipient
): ExchangeRecipient {
  sameTenant(input, delivery, 'Exchange Recipient and Delivery');
  sameTenant(input, recipientParty, 'Exchange Recipient Party');
  invariant(input.exchangeDeliveryId === delivery.id, 'Exchange Recipient must reference the supplied Delivery.');
  invariant(input.recipientPartyId === recipientParty.id, 'Exchange Recipient must reference the supplied Party.');
  invariant(Boolean(input.targetSystem?.trim() || input.targetContextObjectId || input.targetReference?.trim()), 'Exchange Recipient requires target system, context or reference.');
  if (targetContext) {
    sameTenant(input, targetContext, 'Exchange Recipient target context');
    invariant(input.targetContextObjectId === targetContext.id, 'Exchange Recipient target context reference does not match.');
  } else {
    invariant(!input.targetContextObjectId, 'Exchange Recipient cannot reference an unsupplied target context.');
  }
  if (transmittalRecipient) {
    sameTenant(input, transmittalRecipient, 'Exchange Recipient Transmittal Recipient');
    invariant(input.transmittalRecipientId === transmittalRecipient.id, 'Exchange Recipient Transmittal Recipient reference does not match.');
    invariant(delivery.transmittalId === transmittalRecipient.transmittalId, 'Exchange Recipient Transmittal Recipient must belong to the Delivery Transmittal.');
    invariant(input.recipientPartyId === transmittalRecipient.recipientPartyId, 'Exchange Recipient Party must match the Transmittal Recipient Party.');
  } else {
    invariant(!input.transmittalRecipientId, 'Exchange Recipient cannot reference an unsupplied Transmittal Recipient.');
  }
  return Object.freeze({ ...input });
}

export function createExchangeDeltaItem(
  input: ExchangeDeltaItem,
  delivery: ExchangeDelivery,
  subject: CanonicalObjectIdentity,
  packageItem?: ExchangePackageItem,
  priorDelivery?: ExchangeDelivery
): ExchangeDeltaItem {
  sameTenant(input, delivery, 'Exchange Delta Item and Delivery');
  sameTenant(input, subject, 'Exchange Delta Item subject');
  invariant(input.exchangeDeliveryId === delivery.id, 'Exchange Delta Item must reference the supplied Delivery.');
  invariant(input.subjectObjectId === subject.id, 'Exchange Delta Item must reference the supplied subject.');

  if (packageItem) {
    sameTenant(input, packageItem, 'Exchange Delta Item Package Item');
    invariant(input.exchangePackageItemId === packageItem.id, 'Exchange Delta Item Package Item reference does not match.');
    invariant(packageItem.exchangePackageId === delivery.exchangePackageId, 'Exchange Delta Item Package Item must belong to the current Delivery Package.');
    invariant(packageItem.subjectObjectId === input.subjectObjectId, 'Exchange Delta Item subject must match its Package Item.');
  } else {
    invariant(!input.exchangePackageItemId, 'Exchange Delta Item cannot reference an unsupplied Package Item.');
  }

  if (delivery.priorDeliveryId) {
    invariant(Boolean(priorDelivery), 'Incremental Exchange Delta Item requires the Delivery base.');
    if (priorDelivery) {
      sameTenant(input, priorDelivery, 'Exchange Delta Item prior Delivery');
      invariant(input.priorDeliveryId === priorDelivery.id, 'Exchange Delta Item prior Delivery reference does not match.');
      invariant(delivery.priorDeliveryId === priorDelivery.id, 'Delta prior Delivery must match the Delivery base.');
    }
  } else {
    invariant(!input.priorDeliveryId && !priorDelivery, 'Full Exchange Delivery delta must not reference a prior Delivery.');
    invariant(input.deltaType === 'NEW', 'A full Exchange Delivery can only record NEW delta semantics.');
  }

  if (input.deltaType === 'NEW' || input.deltaType === 'CHANGED' || input.deltaType === 'MOVED') {
    invariant(Boolean(packageItem), `${input.deltaType} delta requires current Package membership.`);
  }
  if (input.deltaType === 'DELETED' || input.deltaType === 'ABSENT') {
    invariant(!packageItem, `${input.deltaType} delta must not claim current Package membership.`);
    text(input.priorSubjectVersion ?? '', `${input.deltaType} delta prior subject version`);
  }
  if (input.deltaType === 'CHANGED') {
    text(input.priorSubjectVersion ?? '', 'CHANGED delta prior subject version');
  }
  if (input.deltaType === 'MOVED') {
    text(input.priorLocationReference ?? '', 'MOVED delta prior location');
    text(input.currentLocationReference ?? '', 'MOVED delta current location');
  }
  return Object.freeze({ ...input });
}

export function createReceivedDelivery(
  input: ReceivedDelivery,
  delivery: ExchangeDelivery,
  recipient: ExchangeRecipient,
  receiver: Person
): ReceivedDelivery {
  sameTenant(input, delivery, 'Received Delivery and Delivery');
  sameTenant(input, recipient, 'Received Delivery and Recipient');
  sameTenant(input, receiver, 'Received Delivery receiver');
  invariant(input.exchangeDeliveryId === delivery.id, 'Received Delivery must reference the supplied Delivery.');
  invariant(input.exchangeRecipientId === recipient.id, 'Received Delivery must reference the supplied Exchange Recipient.');
  invariant(recipient.exchangeDeliveryId === delivery.id, 'Received Delivery Recipient must belong to the supplied Delivery.');
  invariant(delivery.status === 'DISPATCHED', 'Only a DISPATCHED Exchange Delivery can be received.');
  invariant(input.receivedByPersonId === receiver.id, 'Received Delivery must reference the supplied receiver.');
  invariant(input.status === 'RECEIVED', 'New Received Delivery must start RECEIVED.');
  date(input.receivedAt, 'Received Delivery receivedAt');
  invariant(
    !input.validatedAt && !input.mappedAt && !input.importedAt && !input.rejectedAt &&
      !input.rejectionReason && !input.importReference,
    'New Received Delivery must not contain later processing state.'
  );
  return Object.freeze({ ...input });
}

export function validateReceivedDelivery(
  current: ReceivedDelivery,
  validatedAt: string
): ReceivedDelivery {
  invariant(current.status === 'RECEIVED', 'Only a RECEIVED Delivery can be validated.');
  date(validatedAt, 'Received Delivery validatedAt');
  invariant(Date.parse(validatedAt) >= Date.parse(current.receivedAt), 'Validation cannot precede receipt.');
  return Object.freeze({ ...current, status: 'VALIDATED', validatedAt });
}

export function markReceivedDeliveryMapped(
  current: ReceivedDelivery,
  mappedAt: string
): ReceivedDelivery {
  invariant(current.status === 'VALIDATED', 'Only a VALIDATED Received Delivery can be mapped.');
  date(mappedAt, 'Received Delivery mappedAt');
  invariant(Date.parse(mappedAt) >= Date.parse(current.validatedAt ?? current.receivedAt), 'Mapping cannot precede validation.');
  return Object.freeze({ ...current, status: 'MAPPED', mappedAt });
}

export function importReceivedDelivery(
  current: ReceivedDelivery,
  importedAt: string,
  importReference: string
): ReceivedDelivery {
  invariant(current.status === 'MAPPED', 'Only a MAPPED Received Delivery can be imported.');
  date(importedAt, 'Received Delivery importedAt');
  invariant(Date.parse(importedAt) >= Date.parse(current.mappedAt ?? current.receivedAt), 'Import cannot precede mapping.');
  text(importReference, 'Received Delivery import reference');
  return Object.freeze({ ...current, status: 'IMPORTED', importedAt, importReference });
}

export function rejectReceivedDelivery(
  current: ReceivedDelivery,
  rejectedAt: string,
  reason: string
): ReceivedDelivery {
  invariant(['RECEIVED', 'VALIDATED', 'MAPPED'].includes(current.status), 'Imported or rejected Received Delivery cannot be rejected.');
  date(rejectedAt, 'Received Delivery rejectedAt');
  text(reason, 'Received Delivery rejection reason');
  return Object.freeze({ ...current, status: 'REJECTED', rejectedAt, rejectionReason: reason });
}

export function createExchangeMapping(
  input: ExchangeMapping,
  receivedDelivery: ReceivedDelivery,
  targetObject?: CanonicalObjectIdentity
): ExchangeMapping {
  sameTenant(input, receivedDelivery, 'Exchange Mapping and Received Delivery');
  invariant(input.receivedDeliveryId === receivedDelivery.id, 'Exchange Mapping must reference the supplied Received Delivery.');
  invariant(['VALIDATED', 'MAPPED'].includes(receivedDelivery.status), 'Exchange Mapping requires a validated Received Delivery.');
  text(input.sourceValue, 'Exchange Mapping source value');
  text(input.targetValue, 'Exchange Mapping target value');
  if (targetObject) {
    sameTenant(input, targetObject, 'Exchange Mapping target object');
    invariant(input.targetObjectId === targetObject.id, 'Exchange Mapping target object reference does not match.');
  } else {
    invariant(!input.targetObjectId, 'Exchange Mapping cannot reference an unsupplied target object.');
  }
  return Object.freeze({ ...input });
}

export function createAuthorityAdoption(
  input: AuthorityAdoption,
  receivedDelivery: ReceivedDelivery,
  sourceSubject: CanonicalObjectIdentity,
  targetSubject: CanonicalObjectIdentity,
  decision: Decision,
  adopter: Person
): AuthorityAdoption {
  sameTenant(input, receivedDelivery, 'Authority Adoption and Received Delivery');
  sameTenant(input, sourceSubject, 'Authority Adoption source subject');
  sameTenant(input, targetSubject, 'Authority Adoption target subject');
  sameTenant(input, decision, 'Authority Adoption Decision');
  sameTenant(input, adopter, 'Authority Adoption adopter');
  invariant(receivedDelivery.status === 'IMPORTED', 'Authority Adoption requires an IMPORTED Received Delivery.');
  invariant(input.receivedDeliveryId === receivedDelivery.id, 'Authority Adoption must reference the supplied Received Delivery.');
  invariant(input.sourceSubjectObjectId === sourceSubject.id, 'Authority Adoption source subject reference does not match.');
  invariant(input.targetCanonicalObjectId === targetSubject.id, 'Authority Adoption target subject reference does not match.');
  invariant(input.decisionId === decision.id, 'Authority Adoption Decision reference does not match.');
  invariant(input.adoptedByPersonId === adopter.id, 'Authority Adoption adopter reference does not match.');
  invariant(decision.subjectObjectId === targetSubject.id, 'Authority Adoption Decision must govern the target canonical object.');
  invariant(decision.subjectVersion === input.targetSubjectVersion, 'Authority Adoption Decision must reference the exact target version.');
  invariant(decision.outcome === 'APPROVED', 'Authority Adoption requires an APPROVED Decision.');
  text(input.sourceAuthority, 'Authority Adoption source authority');
  text(input.targetAuthority, 'Authority Adoption target authority');
  invariant(input.sourceAuthority !== input.targetAuthority, 'Authority Adoption must change authority.');
  date(input.adoptedAt, 'Authority Adoption adoptedAt');
  invariant(Date.parse(input.adoptedAt) >= Date.parse(receivedDelivery.importedAt ?? receivedDelivery.receivedAt), 'Authority Adoption cannot precede import.');
  return Object.freeze({ ...input });
}
