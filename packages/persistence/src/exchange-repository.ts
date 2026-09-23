import {
  createAuthorityAdoption,
  createExchangeDelivery,
  createExchangeDeltaItem,
  createExchangeMapping,
  createExchangePackage,
  createExchangePackageItem,
  createExchangeRecipient,
  createReceivedDelivery,
  freezeExchangePackage,
  importReceivedDelivery,
  markReceivedDeliveryMapped,
  rejectReceivedDelivery,
  validateReceivedDelivery,
  type AuthorityAdoption,
  type CanonicalObjectIdentity,
  type Decision,
  type ExchangeDelivery,
  type ExchangeDeltaItem,
  type ExchangeMapping,
  type ExchangePackage,
  type ExchangePackageItem,
  type ExchangeRecipient,
  type ExternalIdentity,
  type Party,
  type Person,
  type ReceivedDelivery,
  type Representation,
  type TenantId,
  type Transmittal,
  type TransmittalRecipient
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface PackageRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; purpose: string;
  source_context_object_id: string | null; source_system: string; package_version: number;
  status: ExchangePackage['status']; created_by_person_id: string; created_at: Date;
  frozen_at: Date | null; package_checksum: string | null; row_version: number;
}
interface PackageItemRow extends RowDataPacket {
  id: string; tenant_id: string; exchange_package_id: string; subject_object_id: string;
  subject_version: string | null; representation_id: string | null;
  external_identity_id: string | null; item_role: string; item_checksum: string | null;
}
interface DeliveryRow extends RowDataPacket {
  id: string; tenant_id: string; exchange_package_id: string; transmittal_id: string | null;
  delivery_reference: string; delivery_sequence: number; prior_delivery_id: string | null;
  dispatched_by_person_id: string; dispatched_at: Date; transport_reference: string | null;
  delivery_checksum: string | null; status: ExchangeDelivery['status']; row_version: number;
}
interface RecipientRow extends RowDataPacket {
  id: string; tenant_id: string; exchange_delivery_id: string; recipient_party_id: string;
  transmittal_recipient_id: string | null; target_system: string | null;
  target_context_object_id: string | null; target_reference: string | null;
  status: ExchangeRecipient['status'];
}
interface ReceivedRow extends RowDataPacket {
  id: string; tenant_id: string; exchange_delivery_id: string; exchange_recipient_id: string;
  received_by_person_id: string; received_at: Date; received_package_checksum: string | null;
  status: ReceivedDelivery['status']; validated_at: Date | null; mapped_at: Date | null;
  imported_at: Date | null; rejected_at: Date | null; rejection_reason: string | null;
  import_reference: string | null; row_version: number;
}
interface ObjectRow extends RowDataPacket {
  id: string; tenant_id: string; object_type: string; stable_key: string; created_at: Date;
}
interface PersonRow extends RowDataPacket {
  id: string; tenant_id: string; party_id: string; legal_name: string;
  preferred_name: string | null; status: Person['status'];
}
interface PartyRow extends RowDataPacket {
  id: string; tenant_id: string; kind: Party['kind']; display_name: string; status: Party['status'];
}
interface RepresentationRow extends RowDataPacket {
  id: string; tenant_id: string; information_iteration_id: string;
  representation_type: Representation['representationType']; media_type: string;
  file_name: string | null; content_reference: string; integrity_hash: string | null;
  generated_at: Date;
}
interface ExternalIdentityRow extends RowDataPacket {
  id: string; tenant_id: string; canonical_object_id: string; external_system: string;
  external_object_type: string; external_object_id: string; external_version: string | null;
  source_reference: string | null;
}
interface TransmittalRow extends RowDataPacket {
  id: string; tenant_id: string; deliverable_item_id: string; issue_reference: string;
  issue_purpose: string; subject_object_id: string; subject_version: string | null;
  representation_id: string | null; issued_by_person_id: string; issued_at: Date;
  response_required: number;
}
interface TransmittalRecipientRow extends RowDataPacket {
  id: string; tenant_id: string; transmittal_id: string; recipient_party_id: string;
  response_required: number; due_at: Date | null;
}
interface DecisionRow extends RowDataPacket {
  id: string; tenant_id: string; decision_type: string; subject_object_id: string;
  subject_version: string | null; outcome: string; reason: string; decider_person_id: string;
  authority_grant_id: string | null; decided_at: Date;
}

function dbDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}
async function evidence(
  connection: PoolConnection,
  tenantId: TenantId,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tenantId, entityType, entityId, action, audit.actorPersonId ?? null, audit.correlationId ?? null, JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection, {
    tenantId, aggregateType: entityType, aggregateId: entityId,
    eventType: `${entityType}.${action}`, payload
  });
}
function mapPackage(row: PackageRow): ExchangePackage {
  return {
    id: row.id as ExchangePackage['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code, name: row.name, purpose: row.purpose,
    ...(row.source_context_object_id
      ? { sourceContextObjectId: row.source_context_object_id as NonNullable<ExchangePackage['sourceContextObjectId']> }
      : {}),
    sourceSystem: row.source_system,
    packageVersion: Number(row.package_version),
    status: row.status,
    createdByPersonId: row.created_by_person_id as ExchangePackage['createdByPersonId'],
    createdAt: row.created_at.toISOString(),
    ...(row.frozen_at ? { frozenAt: row.frozen_at.toISOString() } : {}),
    ...(row.package_checksum ? { packageChecksum: row.package_checksum } : {})
  };
}
function mapPackageItem(row: PackageItemRow): ExchangePackageItem {
  return {
    id: row.id as ExchangePackageItem['id'],
    tenantId: row.tenant_id as TenantId,
    exchangePackageId: row.exchange_package_id as ExchangePackageItem['exchangePackageId'],
    subjectObjectId: row.subject_object_id as ExchangePackageItem['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    ...(row.representation_id
      ? { representationId: row.representation_id as NonNullable<ExchangePackageItem['representationId']> }
      : {}),
    ...(row.external_identity_id
      ? { externalIdentityId: row.external_identity_id as NonNullable<ExchangePackageItem['externalIdentityId']> }
      : {}),
    itemRole: row.item_role,
    ...(row.item_checksum ? { itemChecksum: row.item_checksum } : {})
  };
}
function mapDelivery(row: DeliveryRow): ExchangeDelivery {
  return {
    id: row.id as ExchangeDelivery['id'],
    tenantId: row.tenant_id as TenantId,
    exchangePackageId: row.exchange_package_id as ExchangeDelivery['exchangePackageId'],
    ...(row.transmittal_id
      ? { transmittalId: row.transmittal_id as NonNullable<ExchangeDelivery['transmittalId']> }
      : {}),
    deliveryReference: row.delivery_reference,
    deliverySequence: Number(row.delivery_sequence),
    ...(row.prior_delivery_id
      ? { priorDeliveryId: row.prior_delivery_id as NonNullable<ExchangeDelivery['priorDeliveryId']> }
      : {}),
    dispatchedByPersonId: row.dispatched_by_person_id as ExchangeDelivery['dispatchedByPersonId'],
    dispatchedAt: row.dispatched_at.toISOString(),
    ...(row.transport_reference ? { transportReference: row.transport_reference } : {}),
    ...(row.delivery_checksum ? { deliveryChecksum: row.delivery_checksum } : {}),
    status: row.status
  };
}
function mapRecipient(row: RecipientRow): ExchangeRecipient {
  return {
    id: row.id as ExchangeRecipient['id'],
    tenantId: row.tenant_id as TenantId,
    exchangeDeliveryId: row.exchange_delivery_id as ExchangeRecipient['exchangeDeliveryId'],
    recipientPartyId: row.recipient_party_id as ExchangeRecipient['recipientPartyId'],
    ...(row.transmittal_recipient_id
      ? { transmittalRecipientId: row.transmittal_recipient_id as NonNullable<ExchangeRecipient['transmittalRecipientId']> }
      : {}),
    ...(row.target_system ? { targetSystem: row.target_system } : {}),
    ...(row.target_context_object_id
      ? { targetContextObjectId: row.target_context_object_id as NonNullable<ExchangeRecipient['targetContextObjectId']> }
      : {}),
    ...(row.target_reference ? { targetReference: row.target_reference } : {}),
    status: row.status
  };
}
function mapReceived(row: ReceivedRow): ReceivedDelivery {
  return {
    id: row.id as ReceivedDelivery['id'],
    tenantId: row.tenant_id as TenantId,
    exchangeDeliveryId: row.exchange_delivery_id as ReceivedDelivery['exchangeDeliveryId'],
    exchangeRecipientId: row.exchange_recipient_id as ReceivedDelivery['exchangeRecipientId'],
    receivedByPersonId: row.received_by_person_id as ReceivedDelivery['receivedByPersonId'],
    receivedAt: row.received_at.toISOString(),
    ...(row.received_package_checksum ? { receivedPackageChecksum: row.received_package_checksum } : {}),
    status: row.status,
    ...(row.validated_at ? { validatedAt: row.validated_at.toISOString() } : {}),
    ...(row.mapped_at ? { mappedAt: row.mapped_at.toISOString() } : {}),
    ...(row.imported_at ? { importedAt: row.imported_at.toISOString() } : {}),
    ...(row.rejected_at ? { rejectedAt: row.rejected_at.toISOString() } : {}),
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    ...(row.import_reference ? { importReference: row.import_reference } : {})
  };
}
function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type, stableKey: row.stable_key, createdAt: row.created_at.toISOString()
  };
}
function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'], tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'], legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}), status: row.status
  };
}
function mapParty(row: PartyRow): Party {
  return {
    id: row.id as Party['id'], tenantId: row.tenant_id as TenantId,
    kind: row.kind, displayName: row.display_name, status: row.status
  };
}
function mapRepresentation(row: RepresentationRow): Representation {
  return {
    id: row.id as Representation['id'], tenantId: row.tenant_id as TenantId,
    informationIterationId: row.information_iteration_id as Representation['informationIterationId'],
    representationType: row.representation_type, mediaType: row.media_type,
    ...(row.file_name ? { fileName: row.file_name } : {}),
    contentReference: row.content_reference,
    ...(row.integrity_hash ? { integrityHash: row.integrity_hash } : {}),
    generatedAt: row.generated_at.toISOString()
  };
}
function mapExternalIdentity(row: ExternalIdentityRow): ExternalIdentity {
  return {
    id: row.id as ExternalIdentity['id'], tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ExternalIdentity['canonicalObjectId'],
    externalSystem: row.external_system, externalObjectType: row.external_object_type,
    externalObjectId: row.external_object_id,
    ...(row.external_version ? { externalVersion: row.external_version } : {}),
    ...(row.source_reference ? { sourceReference: row.source_reference } : {})
  };
}
function mapTransmittal(row: TransmittalRow): Transmittal {
  return {
    id: row.id as Transmittal['id'], tenantId: row.tenant_id as TenantId,
    deliverableItemId: row.deliverable_item_id as Transmittal['deliverableItemId'],
    issueReference: row.issue_reference, issuePurpose: row.issue_purpose,
    subjectObjectId: row.subject_object_id as Transmittal['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    ...(row.representation_id
      ? { representationId: row.representation_id as NonNullable<Transmittal['representationId']> }
      : {}),
    issuedByPersonId: row.issued_by_person_id as Transmittal['issuedByPersonId'],
    issuedAt: row.issued_at.toISOString(), responseRequired: Boolean(row.response_required)
  };
}
function mapTransmittalRecipient(row: TransmittalRecipientRow): TransmittalRecipient {
  return {
    id: row.id as TransmittalRecipient['id'], tenantId: row.tenant_id as TenantId,
    transmittalId: row.transmittal_id as TransmittalRecipient['transmittalId'],
    recipientPartyId: row.recipient_party_id as TransmittalRecipient['recipientPartyId'],
    responseRequired: Boolean(row.response_required),
    ...(row.due_at ? { dueAt: row.due_at.toISOString() } : {})
  };
}
function mapDecision(row: DecisionRow): Decision {
  return {
    id: row.id as Decision['id'], tenantId: row.tenant_id as TenantId,
    decisionType: row.decision_type,
    subjectObjectId: row.subject_object_id as Decision['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    outcome: row.outcome, reason: row.reason,
    deciderPersonId: row.decider_person_id as Decision['deciderPersonId'],
    ...(row.authority_grant_id
      ? { authorityGrantId: row.authority_grant_id as NonNullable<Decision['authorityGrantId']> }
      : {}),
    decidedAt: row.decided_at.toISOString()
  };
}

export class MySqlExchangeRepository {
  constructor(private readonly pool: Pool) {}

  async createPackage(exchangePackage: ExchangePackage, audit: AuditContext = {}): Promise<void> {
    const creator = await this.requirePerson(exchangePackage.tenantId, exchangePackage.createdByPersonId);
    const context = exchangePackage.sourceContextObjectId
      ? await this.requireObject(exchangePackage.tenantId, exchangePackage.sourceContextObjectId)
      : undefined;
    createExchangePackage(exchangePackage, creator, context);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_packages
          (id, tenant_id, code, name, purpose, source_context_object_id, source_system,
           package_version, status, created_by_person_id, created_at, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [exchangePackage.id, exchangePackage.tenantId, exchangePackage.code, exchangePackage.name,
         exchangePackage.purpose, exchangePackage.sourceContextObjectId ?? null,
         exchangePackage.sourceSystem, exchangePackage.packageVersion, exchangePackage.status,
         exchangePackage.createdByPersonId, dbDate(exchangePackage.createdAt), audit.actorPersonId ?? null]
      );
      await evidence(connection, exchangePackage.tenantId, 'EXCHANGE_PACKAGE', exchangePackage.id, 'CREATED', audit, exchangePackage);
    });
  }

  async addPackageItem(item: ExchangePackageItem, audit: AuditContext = {}): Promise<void> {
    const [exchangePackage, subject, representation, externalIdentity] = await Promise.all([
      this.requirePackage(item.tenantId, item.exchangePackageId),
      this.requireObject(item.tenantId, item.subjectObjectId),
      item.representationId ? this.requireRepresentation(item.tenantId, item.representationId) : Promise.resolve(undefined),
      item.externalIdentityId ? this.requireExternalIdentity(item.tenantId, item.externalIdentityId) : Promise.resolve(undefined)
    ]);
    createExchangePackageItem(item, exchangePackage, subject, representation, externalIdentity);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_package_items
          (id, tenant_id, exchange_package_id, subject_object_id, subject_version,
           representation_id, external_identity_id, item_role, item_checksum, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.tenantId, item.exchangePackageId, item.subjectObjectId,
         item.subjectVersion ?? null, item.representationId ?? null, item.externalIdentityId ?? null,
         item.itemRole, item.itemChecksum ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, item.tenantId, 'EXCHANGE_PACKAGE_ITEM', item.id, 'ADDED', audit, item);
    });
  }

  async freezePackage(
    tenantId: TenantId,
    packageId: ExchangePackage['id'],
    frozenAt: string,
    packageChecksum: string,
    audit: AuditContext = {}
  ): Promise<ExchangePackage> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requirePackageRowForUpdate(connection, tenantId, packageId);
      const current = mapPackage(row);
      const [itemRows] = await connection.execute<PackageItemRow[]>(
        `SELECT id, tenant_id, exchange_package_id, subject_object_id, subject_version,
                representation_id, external_identity_id, item_role, item_checksum
           FROM exchange_package_items WHERE tenant_id = ? AND exchange_package_id = ? ORDER BY id`,
        [tenantId, packageId]
      );
      const next = freezeExchangePackage(current, itemRows.map(mapPackageItem), frozenAt, packageChecksum);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE exchange_packages
            SET status = ?, frozen_at = ?, package_checksum = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND status = 'DRAFT' AND row_version = ?`,
        [next.status, dbDate(frozenAt), packageChecksum, audit.actorPersonId ?? null,
         tenantId, packageId, row.row_version]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Exchange Package freeze detected.');
      await evidence(connection, tenantId, 'EXCHANGE_PACKAGE', packageId, 'FROZEN', audit, next);
      return next;
    });
  }

  async createDelivery(delivery: ExchangeDelivery, audit: AuditContext = {}): Promise<void> {
    const [exchangePackage, dispatcher, transmittal, priorDelivery] = await Promise.all([
      this.requirePackage(delivery.tenantId, delivery.exchangePackageId),
      this.requirePerson(delivery.tenantId, delivery.dispatchedByPersonId),
      delivery.transmittalId ? this.requireTransmittal(delivery.tenantId, delivery.transmittalId) : Promise.resolve(undefined),
      delivery.priorDeliveryId ? this.requireDelivery(delivery.tenantId, delivery.priorDeliveryId) : Promise.resolve(undefined)
    ]);
    createExchangeDelivery(delivery, exchangePackage, dispatcher, transmittal, priorDelivery);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_deliveries
          (id, tenant_id, exchange_package_id, transmittal_id, delivery_reference,
           delivery_sequence, prior_delivery_id, dispatched_by_person_id, dispatched_at,
           transport_reference, delivery_checksum, status, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [delivery.id, delivery.tenantId, delivery.exchangePackageId, delivery.transmittalId ?? null,
         delivery.deliveryReference, delivery.deliverySequence, delivery.priorDeliveryId ?? null,
         delivery.dispatchedByPersonId, dbDate(delivery.dispatchedAt), delivery.transportReference ?? null,
         delivery.deliveryChecksum ?? null, delivery.status, audit.actorPersonId ?? null]
      );
      await evidence(connection, delivery.tenantId, 'EXCHANGE_DELIVERY', delivery.id, 'DISPATCHED', audit, delivery);
    });
  }

  async addRecipient(recipient: ExchangeRecipient, audit: AuditContext = {}): Promise<void> {
    const [delivery, party, targetContext, transmittalRecipient] = await Promise.all([
      this.requireDelivery(recipient.tenantId, recipient.exchangeDeliveryId),
      this.requireParty(recipient.tenantId, recipient.recipientPartyId),
      recipient.targetContextObjectId ? this.requireObject(recipient.tenantId, recipient.targetContextObjectId) : Promise.resolve(undefined),
      recipient.transmittalRecipientId ? this.requireTransmittalRecipient(recipient.tenantId, recipient.transmittalRecipientId) : Promise.resolve(undefined)
    ]);
    createExchangeRecipient(recipient, delivery, party, targetContext, transmittalRecipient);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_recipients
          (id, tenant_id, exchange_delivery_id, recipient_party_id, transmittal_recipient_id,
           target_system, target_context_object_id, target_reference, status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [recipient.id, recipient.tenantId, recipient.exchangeDeliveryId, recipient.recipientPartyId,
         recipient.transmittalRecipientId ?? null, recipient.targetSystem ?? null,
         recipient.targetContextObjectId ?? null, recipient.targetReference ?? null,
         recipient.status, audit.actorPersonId ?? null]
      );
      await evidence(connection, recipient.tenantId, 'EXCHANGE_RECIPIENT', recipient.id, 'ADDED', audit, recipient);
    });
  }

  async addDeltaItem(item: ExchangeDeltaItem, audit: AuditContext = {}): Promise<void> {
    const [delivery, packageItem, priorDelivery] = await Promise.all([
      this.requireDelivery(item.tenantId, item.exchangeDeliveryId),
      this.requirePackageItem(item.tenantId, item.exchangePackageItemId),
      item.priorDeliveryId ? this.requireDelivery(item.tenantId, item.priorDeliveryId) : Promise.resolve(undefined)
    ]);
    createExchangeDeltaItem(item, delivery, packageItem, priorDelivery);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_delta_items
          (id, tenant_id, exchange_delivery_id, exchange_package_item_id, delta_type,
           prior_delivery_id, prior_subject_version, prior_location_reference,
           current_location_reference, details, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.tenantId, item.exchangeDeliveryId, item.exchangePackageItemId,
         item.deltaType, item.priorDeliveryId ?? null, item.priorSubjectVersion ?? null,
         item.priorLocationReference ?? null, item.currentLocationReference ?? null,
         item.details ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, item.tenantId, 'EXCHANGE_DELTA_ITEM', item.id, 'RECORDED', audit, item);
    });
  }

  async recordReceivedDelivery(received: ReceivedDelivery, audit: AuditContext = {}): Promise<void> {
    const [delivery, recipient, receiver] = await Promise.all([
      this.requireDelivery(received.tenantId, received.exchangeDeliveryId),
      this.requireRecipient(received.tenantId, received.exchangeRecipientId),
      this.requirePerson(received.tenantId, received.receivedByPersonId)
    ]);
    createReceivedDelivery(received, delivery, recipient, receiver);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO received_deliveries
          (id, tenant_id, exchange_delivery_id, exchange_recipient_id, received_by_person_id,
           received_at, received_package_checksum, status, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [received.id, received.tenantId, received.exchangeDeliveryId, received.exchangeRecipientId,
         received.receivedByPersonId, dbDate(received.receivedAt),
         received.receivedPackageChecksum ?? null, received.status, audit.actorPersonId ?? null]
      );
      await evidence(connection, received.tenantId, 'RECEIVED_DELIVERY', received.id, 'RECEIVED', audit, received);
    });
  }

  async validateReceived(
    tenantId: TenantId,
    receivedId: ReceivedDelivery['id'],
    validatedAt: string,
    audit: AuditContext = {}
  ): Promise<ReceivedDelivery> {
    return this.transitionReceived(tenantId, receivedId, 'VALIDATED', audit, (current) =>
      validateReceivedDelivery(current, validatedAt)
    );
  }

  async addMapping(mapping: ExchangeMapping, audit: AuditContext = {}): Promise<void> {
    const [received, targetObject] = await Promise.all([
      this.requireReceived(mapping.tenantId, mapping.receivedDeliveryId),
      mapping.targetObjectId ? this.requireObject(mapping.tenantId, mapping.targetObjectId) : Promise.resolve(undefined)
    ]);
    createExchangeMapping(mapping, received, targetObject);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO exchange_mappings
          (id, tenant_id, received_delivery_id, mapping_type, source_value, target_value,
           target_object_id, notes, status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [mapping.id, mapping.tenantId, mapping.receivedDeliveryId, mapping.mappingType,
         mapping.sourceValue, mapping.targetValue, mapping.targetObjectId ?? null,
         mapping.notes ?? null, mapping.status, audit.actorPersonId ?? null]
      );
      await evidence(connection, mapping.tenantId, 'EXCHANGE_MAPPING', mapping.id, 'CREATED', audit, mapping);
    });
  }

  async markMapped(
    tenantId: TenantId,
    receivedId: ReceivedDelivery['id'],
    mappedAt: string,
    audit: AuditContext = {}
  ): Promise<ReceivedDelivery> {
    return this.transitionReceived(tenantId, receivedId, 'MAPPED', audit, (current) =>
      markReceivedDeliveryMapped(current, mappedAt)
    );
  }

  async markImported(
    tenantId: TenantId,
    receivedId: ReceivedDelivery['id'],
    importedAt: string,
    importReference: string,
    audit: AuditContext = {}
  ): Promise<ReceivedDelivery> {
    return this.transitionReceived(tenantId, receivedId, 'IMPORTED', audit, (current) =>
      importReceivedDelivery(current, importedAt, importReference)
    );
  }

  async rejectReceived(
    tenantId: TenantId,
    receivedId: ReceivedDelivery['id'],
    rejectedAt: string,
    reason: string,
    audit: AuditContext = {}
  ): Promise<ReceivedDelivery> {
    return this.transitionReceived(tenantId, receivedId, 'REJECTED', audit, (current) =>
      rejectReceivedDelivery(current, rejectedAt, reason)
    );
  }

  async adoptAuthority(adoption: AuthorityAdoption, audit: AuditContext = {}): Promise<void> {
    const [received, source, target, decision, adopter] = await Promise.all([
      this.requireReceived(adoption.tenantId, adoption.receivedDeliveryId),
      this.requireObject(adoption.tenantId, adoption.sourceSubjectObjectId),
      this.requireObject(adoption.tenantId, adoption.targetCanonicalObjectId),
      this.requireDecision(adoption.tenantId, adoption.decisionId),
      this.requirePerson(adoption.tenantId, adoption.adoptedByPersonId)
    ]);
    createAuthorityAdoption(adoption, received, source, target, decision, adopter);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO authority_adoptions
          (id, tenant_id, received_delivery_id, source_subject_object_id,
           source_subject_version, target_canonical_object_id, target_subject_version,
           source_authority, target_authority, decision_id, adopted_by_person_id, adopted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [adoption.id, adoption.tenantId, adoption.receivedDeliveryId,
         adoption.sourceSubjectObjectId, adoption.sourceSubjectVersion ?? null,
         adoption.targetCanonicalObjectId, adoption.targetSubjectVersion ?? null,
         adoption.sourceAuthority, adoption.targetAuthority, adoption.decisionId,
         adoption.adoptedByPersonId, dbDate(adoption.adoptedAt)]
      );
      await evidence(connection, adoption.tenantId, 'AUTHORITY_ADOPTION', adoption.id, 'ADOPTED', audit, adoption);
    });
  }

  async getPackage(tenantId: TenantId, id: ExchangePackage['id']): Promise<ExchangePackage | undefined> {
    const [rows] = await this.pool.execute<PackageRow[]>(
      `SELECT id, tenant_id, code, name, purpose, source_context_object_id, source_system,
              package_version, status, created_by_person_id, created_at, frozen_at,
              package_checksum, row_version
         FROM exchange_packages WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapPackage(rows[0]) : undefined;
  }
  async getPackageItem(tenantId: TenantId, id: ExchangePackageItem['id']): Promise<ExchangePackageItem | undefined> {
    const [rows] = await this.pool.execute<PackageItemRow[]>(
      `SELECT id, tenant_id, exchange_package_id, subject_object_id, subject_version,
              representation_id, external_identity_id, item_role, item_checksum
         FROM exchange_package_items WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapPackageItem(rows[0]) : undefined;
  }
  async getDelivery(tenantId: TenantId, id: ExchangeDelivery['id']): Promise<ExchangeDelivery | undefined> {
    const [rows] = await this.pool.execute<DeliveryRow[]>(
      `SELECT id, tenant_id, exchange_package_id, transmittal_id, delivery_reference,
              delivery_sequence, prior_delivery_id, dispatched_by_person_id, dispatched_at,
              transport_reference, delivery_checksum, status, row_version
         FROM exchange_deliveries WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapDelivery(rows[0]) : undefined;
  }
  async getRecipient(tenantId: TenantId, id: ExchangeRecipient['id']): Promise<ExchangeRecipient | undefined> {
    const [rows] = await this.pool.execute<RecipientRow[]>(
      `SELECT id, tenant_id, exchange_delivery_id, recipient_party_id,
              transmittal_recipient_id, target_system, target_context_object_id,
              target_reference, status
         FROM exchange_recipients WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapRecipient(rows[0]) : undefined;
  }
  async getReceived(tenantId: TenantId, id: ReceivedDelivery['id']): Promise<ReceivedDelivery | undefined> {
    const [rows] = await this.pool.execute<ReceivedRow[]>(
      `SELECT id, tenant_id, exchange_delivery_id, exchange_recipient_id, received_by_person_id,
              received_at, received_package_checksum, status, validated_at, mapped_at,
              imported_at, rejected_at, rejection_reason, import_reference, row_version
         FROM received_deliveries WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    return rows[0] ? mapReceived(rows[0]) : undefined;
  }

  private async transitionReceived(
    tenantId: TenantId,
    receivedId: ReceivedDelivery['id'],
    action: string,
    audit: AuditContext,
    transition: (current: ReceivedDelivery) => ReceivedDelivery
  ): Promise<ReceivedDelivery> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireReceivedRowForUpdate(connection, tenantId, receivedId);
      const next = transition(mapReceived(row));
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE received_deliveries
            SET status = ?, validated_at = ?, mapped_at = ?, imported_at = ?,
                rejected_at = ?, rejection_reason = ?, import_reference = ?,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [next.status,
         next.validatedAt ? dbDate(next.validatedAt) : null,
         next.mappedAt ? dbDate(next.mappedAt) : null,
         next.importedAt ? dbDate(next.importedAt) : null,
         next.rejectedAt ? dbDate(next.rejectedAt) : null,
         next.rejectionReason ?? null, next.importReference ?? null,
         audit.actorPersonId ?? null, tenantId, receivedId, row.row_version]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Received Delivery transition detected.');
      await evidence(connection, tenantId, 'RECEIVED_DELIVERY', receivedId, action, audit, next);
      return next;
    });
  }

  private async requirePackage(tenantId: TenantId, id: ExchangePackage['id']): Promise<ExchangePackage> {
    const item = await this.getPackage(tenantId, id);
    if (!item) throw new Error('Exchange Package not found in tenant.');
    return item;
  }
  private async requirePackageItem(tenantId: TenantId, id: ExchangePackageItem['id']): Promise<ExchangePackageItem> {
    const item = await this.getPackageItem(tenantId, id);
    if (!item) throw new Error('Exchange Package Item not found in tenant.');
    return item;
  }
  private async requireDelivery(tenantId: TenantId, id: ExchangeDelivery['id']): Promise<ExchangeDelivery> {
    const item = await this.getDelivery(tenantId, id);
    if (!item) throw new Error('Exchange Delivery not found in tenant.');
    return item;
  }
  private async requireRecipient(tenantId: TenantId, id: ExchangeRecipient['id']): Promise<ExchangeRecipient> {
    const item = await this.getRecipient(tenantId, id);
    if (!item) throw new Error('Exchange Recipient not found in tenant.');
    return item;
  }
  private async requireReceived(tenantId: TenantId, id: ReceivedDelivery['id']): Promise<ReceivedDelivery> {
    const item = await this.getReceived(tenantId, id);
    if (!item) throw new Error('Received Delivery not found in tenant.');
    return item;
  }

  private async requireObject(tenantId: TenantId, id: CanonicalObjectIdentity['id']): Promise<CanonicalObjectIdentity> {
    const [rows] = await this.pool.execute<ObjectRow[]>(
      'SELECT id, tenant_id, object_type, stable_key, created_at FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Canonical Object not found in tenant.');
    return mapObject(rows[0]);
  }
  private async requirePerson(tenantId: TenantId, id: Person['id']): Promise<Person> {
    const [rows] = await this.pool.execute<PersonRow[]>(
      'SELECT id, tenant_id, party_id, legal_name, preferred_name, status FROM persons WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Person not found in tenant.');
    return mapPerson(rows[0]);
  }
  private async requireParty(tenantId: TenantId, id: Party['id']): Promise<Party> {
    const [rows] = await this.pool.execute<PartyRow[]>(
      'SELECT id, tenant_id, kind, display_name, status FROM parties WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Party not found in tenant.');
    return mapParty(rows[0]);
  }
  private async requireRepresentation(tenantId: TenantId, id: Representation['id']): Promise<Representation> {
    const [rows] = await this.pool.execute<RepresentationRow[]>(
      `SELECT id, tenant_id, information_iteration_id, representation_type, media_type,
              file_name, content_reference, integrity_hash, generated_at
         FROM representations WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Representation not found in tenant.');
    return mapRepresentation(rows[0]);
  }
  private async requireExternalIdentity(tenantId: TenantId, id: ExternalIdentity['id']): Promise<ExternalIdentity> {
    const [rows] = await this.pool.execute<ExternalIdentityRow[]>(
      `SELECT id, tenant_id, canonical_object_id, external_system, external_object_type,
              external_object_id, external_version, source_reference
         FROM external_identities WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('External Identity not found in tenant.');
    return mapExternalIdentity(rows[0]);
  }
  private async requireTransmittal(tenantId: TenantId, id: Transmittal['id']): Promise<Transmittal> {
    const [rows] = await this.pool.execute<TransmittalRow[]>(
      `SELECT id, tenant_id, deliverable_item_id, issue_reference, issue_purpose,
              subject_object_id, subject_version, representation_id, issued_by_person_id,
              issued_at, response_required
         FROM transmittals WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Transmittal not found in tenant.');
    return mapTransmittal(rows[0]);
  }
  private async requireTransmittalRecipient(tenantId: TenantId, id: TransmittalRecipient['id']): Promise<TransmittalRecipient> {
    const [rows] = await this.pool.execute<TransmittalRecipientRow[]>(
      `SELECT id, tenant_id, transmittal_id, recipient_party_id, response_required, due_at
         FROM transmittal_recipients WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Transmittal Recipient not found in tenant.');
    return mapTransmittalRecipient(rows[0]);
  }
  private async requireDecision(tenantId: TenantId, id: Decision['id']): Promise<Decision> {
    const [rows] = await this.pool.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version, outcome,
              reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions WHERE tenant_id = ? AND id = ?`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Decision not found in tenant.');
    return mapDecision(rows[0]);
  }

  private async requirePackageRowForUpdate(
    connection: PoolConnection, tenantId: TenantId, id: ExchangePackage['id']
  ): Promise<PackageRow> {
    const [rows] = await connection.execute<PackageRow[]>(
      `SELECT id, tenant_id, code, name, purpose, source_context_object_id, source_system,
              package_version, status, created_by_person_id, created_at, frozen_at,
              package_checksum, row_version
         FROM exchange_packages WHERE tenant_id = ? AND id = ? FOR UPDATE`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Exchange Package not found in tenant.');
    return rows[0];
  }
  private async requireReceivedRowForUpdate(
    connection: PoolConnection, tenantId: TenantId, id: ReceivedDelivery['id']
  ): Promise<ReceivedRow> {
    const [rows] = await connection.execute<ReceivedRow[]>(
      `SELECT id, tenant_id, exchange_delivery_id, exchange_recipient_id, received_by_person_id,
              received_at, received_package_checksum, status, validated_at, mapped_at,
              imported_at, rejected_at, rejection_reason, import_reference, row_version
         FROM received_deliveries WHERE tenant_id = ? AND id = ? FOR UPDATE`, [tenantId, id]
    );
    if (!rows[0]) throw new Error('Received Delivery not found in tenant.');
    return rows[0];
  }
}
