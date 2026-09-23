import {
  PLATFORM_PERMISSION_KEYS,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface PackageRow extends RowDataPacket {
  id: string; code: string; name: string; purpose: string; source_context_object_id: string | null;
  source_system: string; package_version: number; status: string; creator_name: string;
  created_at: Date; frozen_at: Date | null; package_checksum: string | null;
}
interface ItemRow extends RowDataPacket {
  id: string; exchange_package_id: string; subject_object_id: string; subject_version: string | null;
  representation_id: string | null; external_identity_id: string | null; item_role: string;
  item_checksum: string | null; subject_type: string; subject_key: string;
}
interface DeliveryRow extends RowDataPacket {
  id: string; exchange_package_id: string; transmittal_id: string | null;
  delivery_reference: string; delivery_sequence: number; prior_delivery_id: string | null;
  dispatcher_name: string; dispatched_at: Date; transport_reference: string | null;
  delivery_checksum: string | null; status: string;
}
interface RecipientRow extends RowDataPacket {
  id: string; exchange_delivery_id: string; recipient_party_id: string; recipient_name: string;
  transmittal_recipient_id: string | null; target_system: string | null;
  target_context_object_id: string | null; target_reference: string | null; status: string;
  response_outcome: string | null; response_comments: string | null; responded_at: Date | null;
}
interface DeltaRow extends RowDataPacket {
  id: string; exchange_delivery_id: string; subject_object_id: string;
  exchange_package_item_id: string | null; delta_type: string; prior_delivery_id: string | null; prior_subject_version: string | null;
  prior_location_reference: string | null; current_location_reference: string | null;
  details: string | null;
}
interface ReceivedRow extends RowDataPacket {
  id: string; exchange_delivery_id: string; exchange_recipient_id: string;
  receiver_name: string; received_at: Date; received_package_checksum: string | null;
  status: string; validated_at: Date | null; mapped_at: Date | null; imported_at: Date | null;
  rejected_at: Date | null; rejection_reason: string | null; import_reference: string | null;
}
interface MappingRow extends RowDataPacket {
  id: string; received_delivery_id: string; mapping_type: string; source_value: string;
  target_value: string; target_object_id: string | null; notes: string | null; status: string;
}
interface AdoptionRow extends RowDataPacket {
  id: string; received_delivery_id: string; source_subject_object_id: string;
  source_subject_version: string | null; target_canonical_object_id: string;
  target_subject_version: string | null; source_authority: string; target_authority: string;
  decision_id: string; decision_outcome: string; adopter_name: string; adopted_at: Date;
}

export interface ExchangeWorkspaceProjection {
  packages: Array<{
    id: string; code: string; name: string; purpose: string; sourceContextObjectId?: string;
    sourceSystem: string; packageVersion: number; status: string; creatorName: string;
    createdAt: string; frozenAt?: string; packageChecksum?: string;
    items: Array<{
      id: string; subjectObjectId: string; subjectType: string; subjectKey: string;
      subjectVersion?: string; representationId?: string; externalIdentityId?: string;
      itemRole: string; itemChecksum?: string;
    }>;
    deliveries: Array<{
      id: string; transmittalId?: string; deliveryReference: string; deliverySequence: number;
      priorDeliveryId?: string; dispatcherName: string; dispatchedAt: string;
      transportReference?: string; deliveryChecksum?: string; status: string;
      deltas: Array<{
        id: string; subjectObjectId: string; packageItemId?: string; deltaType: string; priorDeliveryId?: string;
        priorSubjectVersion?: string; priorLocationReference?: string;
        currentLocationReference?: string; details?: string;
      }>;
      recipients: Array<{
        id: string; recipientPartyId: string; recipientName: string;
        transmittalRecipientId?: string; targetSystem?: string; targetContextObjectId?: string;
        targetReference?: string; status: string;
        response?: { outcome: string; comments?: string; respondedAt: string };
        received?: {
          id: string; receiverName: string; receivedAt: string; receivedPackageChecksum?: string;
          status: string; validatedAt?: string; mappedAt?: string; importedAt?: string;
          rejectedAt?: string; rejectionReason?: string; importReference?: string;
          mappings: Array<{
            id: string; mappingType: string; sourceValue: string; targetValue: string;
            targetObjectId?: string; notes?: string; status: string;
          }>;
          adoptions: Array<{
            id: string; sourceSubjectObjectId: string; sourceSubjectVersion?: string;
            targetCanonicalObjectId: string; targetSubjectVersion?: string;
            sourceAuthority: string; targetAuthority: string; decisionId: string;
            decisionOutcome: string; adopterName: string; adoptedAt: string;
          }>;
        };
      }>;
    }>;
  }>;
  parties: Array<{ id: string; displayName: string; kind: string }>;
  canonicalObjects: Array<{ id: string; objectType: string; stableKey: string }>;
  transmittals: Array<{ id: string; issueReference: string; deliverableItemId: string }>;
  transmittalRecipients: Array<{ id: string; transmittalId: string; recipientPartyId: string }>;
  decisions: Array<{ id: string; subjectObjectId: string; subjectVersion?: string; outcome: string; decisionType: string }>;
  totals: {
    packages: number; frozenPackages: number; deliveries: number; received: number;
    imported: number; rejected: number; conflicts: number; adoptions: number;
  };
}

interface PartyOptionRow extends RowDataPacket { id: string; display_name: string; kind: string; }
interface ObjectOptionRow extends RowDataPacket { id: string; object_type: string; stable_key: string; }
interface TransmittalOptionRow extends RowDataPacket { id: string; issue_reference: string; deliverable_item_id: string; }
interface TransmittalRecipientOptionRow extends RowDataPacket { id: string; transmittal_id: string; recipient_party_id: string; }
interface DecisionOptionRow extends RowDataPacket { id: string; subject_object_id: string; subject_version: string | null; outcome: string; decision_type: string; }

export class ExchangeReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'ExchangeReadError';
  }
}

export class MySqlExchangeReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(tenantId: TenantId, actorPersonId: string): Promise<ExchangeWorkspaceProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [
      packageResult, itemResult, deliveryResult, recipientResult, deltaResult,
      receivedResult, mappingResult, adoptionResult, partiesResult, objectsResult,
      transmittalsResult, transmittalRecipientsResult, decisionsResult
    ] = await Promise.all([
      this.pool.execute<PackageRow[]>(
        `SELECT p.id, p.code, p.name, p.purpose, p.source_context_object_id,
                p.source_system, p.package_version, p.status,
                COALESCE(pe.preferred_name, pe.legal_name) AS creator_name,
                p.created_at, p.frozen_at, p.package_checksum
           FROM exchange_packages p
           JOIN persons pe ON pe.tenant_id = p.tenant_id AND pe.id = p.created_by_person_id
          WHERE p.tenant_id = ?
          ORDER BY p.created_at DESC, p.code, p.package_version DESC`,
        [tenantId]
      ),
      this.pool.execute<ItemRow[]>(
        `SELECT i.id, i.exchange_package_id, i.subject_object_id, i.subject_version,
                i.representation_id, i.external_identity_id, i.item_role, i.item_checksum,
                co.object_type AS subject_type, co.stable_key AS subject_key
           FROM exchange_package_items i
           JOIN canonical_objects co ON co.tenant_id = i.tenant_id AND co.id = i.subject_object_id
          WHERE i.tenant_id = ?
          ORDER BY i.exchange_package_id, i.id`,
        [tenantId]
      ),
      this.pool.execute<DeliveryRow[]>(
        `SELECT d.id, d.exchange_package_id, d.transmittal_id, d.delivery_reference,
                d.delivery_sequence, d.prior_delivery_id,
                COALESCE(pe.preferred_name, pe.legal_name) AS dispatcher_name,
                d.dispatched_at, d.transport_reference, d.delivery_checksum, d.status
           FROM exchange_deliveries d
           JOIN persons pe ON pe.tenant_id = d.tenant_id AND pe.id = d.dispatched_by_person_id
          WHERE d.tenant_id = ?
          ORDER BY d.exchange_package_id, d.delivery_sequence, d.id`,
        [tenantId]
      ),
      this.pool.execute<RecipientRow[]>(
        `SELECT r.id, r.exchange_delivery_id, r.recipient_party_id,
                p.display_name AS recipient_name, r.transmittal_recipient_id,
                r.target_system, r.target_context_object_id, r.target_reference, r.status,
                rr.outcome AS response_outcome, rr.comments AS response_comments,
                rr.responded_at
           FROM exchange_recipients r
           JOIN parties p ON p.tenant_id = r.tenant_id AND p.id = r.recipient_party_id
           LEFT JOIN recipient_responses rr
             ON rr.tenant_id = r.tenant_id
            AND rr.transmittal_recipient_id = r.transmittal_recipient_id
          WHERE r.tenant_id = ?
          ORDER BY r.exchange_delivery_id, r.id`,
        [tenantId]
      ),
      this.pool.execute<DeltaRow[]>(
        `SELECT id, exchange_delivery_id, subject_object_id, exchange_package_item_id, delta_type,
                prior_delivery_id, prior_subject_version, prior_location_reference,
                current_location_reference, details
           FROM exchange_delta_items WHERE tenant_id = ?
          ORDER BY exchange_delivery_id, id`,
        [tenantId]
      ),
      this.pool.execute<ReceivedRow[]>(
        `SELECT r.id, r.exchange_delivery_id, r.exchange_recipient_id,
                COALESCE(pe.preferred_name, pe.legal_name) AS receiver_name,
                r.received_at, r.received_package_checksum, r.status, r.validated_at,
                r.mapped_at, r.imported_at, r.rejected_at, r.rejection_reason,
                r.import_reference
           FROM received_deliveries r
           JOIN persons pe ON pe.tenant_id = r.tenant_id AND pe.id = r.received_by_person_id
          WHERE r.tenant_id = ?
          ORDER BY r.received_at DESC, r.id`,
        [tenantId]
      ),
      this.pool.execute<MappingRow[]>(
        `SELECT id, received_delivery_id, mapping_type, source_value, target_value,
                target_object_id, notes, status
           FROM exchange_mappings WHERE tenant_id = ?
          ORDER BY received_delivery_id, mapping_type, source_value, id`,
        [tenantId]
      ),
      this.pool.execute<AdoptionRow[]>(
        `SELECT a.id, a.received_delivery_id, a.source_subject_object_id,
                a.source_subject_version, a.target_canonical_object_id,
                a.target_subject_version, a.source_authority, a.target_authority,
                a.decision_id, d.outcome AS decision_outcome,
                COALESCE(pe.preferred_name, pe.legal_name) AS adopter_name, a.adopted_at
           FROM authority_adoptions a
           JOIN decisions d ON d.tenant_id = a.tenant_id AND d.id = a.decision_id
           JOIN persons pe ON pe.tenant_id = a.tenant_id AND pe.id = a.adopted_by_person_id
          WHERE a.tenant_id = ?
          ORDER BY a.adopted_at DESC, a.id`,
        [tenantId]
      ),
      this.pool.execute<PartyOptionRow[]>(
        `SELECT id, display_name, kind FROM parties
          WHERE tenant_id = ? AND status = 'ACTIVE' ORDER BY display_name, id`,
        [tenantId]
      ),
      this.pool.execute<ObjectOptionRow[]>(
        `SELECT id, object_type, stable_key FROM canonical_objects
          WHERE tenant_id = ? ORDER BY object_type, stable_key, id`,
        [tenantId]
      ),
      this.pool.execute<TransmittalOptionRow[]>(
        `SELECT id, issue_reference, deliverable_item_id FROM transmittals
          WHERE tenant_id = ? ORDER BY issued_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<TransmittalRecipientOptionRow[]>(
        `SELECT id, transmittal_id, recipient_party_id FROM transmittal_recipients
          WHERE tenant_id = ? ORDER BY transmittal_id, id`,
        [tenantId]
      ),
      this.pool.execute<DecisionOptionRow[]>(
        `SELECT id, subject_object_id, subject_version, outcome, decision_type FROM decisions
          WHERE tenant_id = ? ORDER BY decided_at DESC, id`,
        [tenantId]
      )
    ]);

    const itemsByPackage = new Map<string, ItemRow[]>();
    for (const row of itemResult[0]) {
      const list = itemsByPackage.get(row.exchange_package_id) ?? [];
      list.push(row); itemsByPackage.set(row.exchange_package_id, list);
    }
    const deliveriesByPackage = new Map<string, DeliveryRow[]>();
    for (const row of deliveryResult[0]) {
      const list = deliveriesByPackage.get(row.exchange_package_id) ?? [];
      list.push(row); deliveriesByPackage.set(row.exchange_package_id, list);
    }
    const recipientsByDelivery = new Map<string, RecipientRow[]>();
    for (const row of recipientResult[0]) {
      const list = recipientsByDelivery.get(row.exchange_delivery_id) ?? [];
      list.push(row); recipientsByDelivery.set(row.exchange_delivery_id, list);
    }
    const deltasByDelivery = new Map<string, DeltaRow[]>();
    for (const row of deltaResult[0]) {
      const list = deltasByDelivery.get(row.exchange_delivery_id) ?? [];
      list.push(row); deltasByDelivery.set(row.exchange_delivery_id, list);
    }
    const receivedByRecipient = new Map(receivedResult[0].map((row) => [row.exchange_recipient_id, row]));
    const mappingsByReceived = new Map<string, MappingRow[]>();
    for (const row of mappingResult[0]) {
      const list = mappingsByReceived.get(row.received_delivery_id) ?? [];
      list.push(row); mappingsByReceived.set(row.received_delivery_id, list);
    }
    const adoptionsByReceived = new Map<string, AdoptionRow[]>();
    for (const row of adoptionResult[0]) {
      const list = adoptionsByReceived.get(row.received_delivery_id) ?? [];
      list.push(row); adoptionsByReceived.set(row.received_delivery_id, list);
    }

    return {
      packages: packageResult[0].map((pkg) => ({
        id: pkg.id, code: pkg.code, name: pkg.name, purpose: pkg.purpose,
        ...(pkg.source_context_object_id ? { sourceContextObjectId: pkg.source_context_object_id } : {}),
        sourceSystem: pkg.source_system, packageVersion: Number(pkg.package_version),
        status: pkg.status, creatorName: pkg.creator_name, createdAt: pkg.created_at.toISOString(),
        ...(pkg.frozen_at ? { frozenAt: pkg.frozen_at.toISOString() } : {}),
        ...(pkg.package_checksum ? { packageChecksum: pkg.package_checksum } : {}),
        items: (itemsByPackage.get(pkg.id) ?? []).map((item) => ({
          id: item.id, subjectObjectId: item.subject_object_id, subjectType: item.subject_type,
          subjectKey: item.subject_key,
          ...(item.subject_version ? { subjectVersion: item.subject_version } : {}),
          ...(item.representation_id ? { representationId: item.representation_id } : {}),
          ...(item.external_identity_id ? { externalIdentityId: item.external_identity_id } : {}),
          itemRole: item.item_role,
          ...(item.item_checksum ? { itemChecksum: item.item_checksum } : {})
        })),
        deliveries: (deliveriesByPackage.get(pkg.id) ?? []).map((delivery) => ({
          id: delivery.id,
          ...(delivery.transmittal_id ? { transmittalId: delivery.transmittal_id } : {}),
          deliveryReference: delivery.delivery_reference,
          deliverySequence: Number(delivery.delivery_sequence),
          ...(delivery.prior_delivery_id ? { priorDeliveryId: delivery.prior_delivery_id } : {}),
          dispatcherName: delivery.dispatcher_name,
          dispatchedAt: delivery.dispatched_at.toISOString(),
          ...(delivery.transport_reference ? { transportReference: delivery.transport_reference } : {}),
          ...(delivery.delivery_checksum ? { deliveryChecksum: delivery.delivery_checksum } : {}),
          status: delivery.status,
          deltas: (deltasByDelivery.get(delivery.id) ?? []).map((delta) => ({
            id: delta.id, subjectObjectId: delta.subject_object_id,
            ...(delta.exchange_package_item_id ? { packageItemId: delta.exchange_package_item_id } : {}),
            deltaType: delta.delta_type,
            ...(delta.prior_delivery_id ? { priorDeliveryId: delta.prior_delivery_id } : {}),
            ...(delta.prior_subject_version ? { priorSubjectVersion: delta.prior_subject_version } : {}),
            ...(delta.prior_location_reference ? { priorLocationReference: delta.prior_location_reference } : {}),
            ...(delta.current_location_reference ? { currentLocationReference: delta.current_location_reference } : {}),
            ...(delta.details ? { details: delta.details } : {})
          })),
          recipients: (recipientsByDelivery.get(delivery.id) ?? []).map((recipient) => {
            const received = receivedByRecipient.get(recipient.id);
            return {
              id: recipient.id, recipientPartyId: recipient.recipient_party_id,
              recipientName: recipient.recipient_name,
              ...(recipient.transmittal_recipient_id ? { transmittalRecipientId: recipient.transmittal_recipient_id } : {}),
              ...(recipient.target_system ? { targetSystem: recipient.target_system } : {}),
              ...(recipient.target_context_object_id ? { targetContextObjectId: recipient.target_context_object_id } : {}),
              ...(recipient.target_reference ? { targetReference: recipient.target_reference } : {}),
              status: recipient.status,
              ...(recipient.response_outcome && recipient.responded_at ? { response: {
                outcome: recipient.response_outcome,
                ...(recipient.response_comments ? { comments: recipient.response_comments } : {}),
                respondedAt: recipient.responded_at.toISOString()
              }} : {}),
              ...(received ? { received: {
                id: received.id, receiverName: received.receiver_name,
                receivedAt: received.received_at.toISOString(),
                ...(received.received_package_checksum ? { receivedPackageChecksum: received.received_package_checksum } : {}),
                status: received.status,
                ...(received.validated_at ? { validatedAt: received.validated_at.toISOString() } : {}),
                ...(received.mapped_at ? { mappedAt: received.mapped_at.toISOString() } : {}),
                ...(received.imported_at ? { importedAt: received.imported_at.toISOString() } : {}),
                ...(received.rejected_at ? { rejectedAt: received.rejected_at.toISOString() } : {}),
                ...(received.rejection_reason ? { rejectionReason: received.rejection_reason } : {}),
                ...(received.import_reference ? { importReference: received.import_reference } : {}),
                mappings: (mappingsByReceived.get(received.id) ?? []).map((mapping) => ({
                  id: mapping.id, mappingType: mapping.mapping_type,
                  sourceValue: mapping.source_value, targetValue: mapping.target_value,
                  ...(mapping.target_object_id ? { targetObjectId: mapping.target_object_id } : {}),
                  ...(mapping.notes ? { notes: mapping.notes } : {}), status: mapping.status
                })),
                adoptions: (adoptionsByReceived.get(received.id) ?? []).map((adoption) => ({
                  id: adoption.id, sourceSubjectObjectId: adoption.source_subject_object_id,
                  ...(adoption.source_subject_version ? { sourceSubjectVersion: adoption.source_subject_version } : {}),
                  targetCanonicalObjectId: adoption.target_canonical_object_id,
                  ...(adoption.target_subject_version ? { targetSubjectVersion: adoption.target_subject_version } : {}),
                  sourceAuthority: adoption.source_authority, targetAuthority: adoption.target_authority,
                  decisionId: adoption.decision_id, decisionOutcome: adoption.decision_outcome,
                  adopterName: adoption.adopter_name, adoptedAt: adoption.adopted_at.toISOString()
                }))
              }} : {})
            };
          })
        }))
      })),
      parties: partiesResult[0].map((row) => ({ id: row.id, displayName: row.display_name, kind: row.kind })),
      canonicalObjects: objectsResult[0].map((row) => ({ id: row.id, objectType: row.object_type, stableKey: row.stable_key })),
      transmittals: transmittalsResult[0].map((row) => ({
        id: row.id, issueReference: row.issue_reference, deliverableItemId: row.deliverable_item_id
      })),
      transmittalRecipients: transmittalRecipientsResult[0].map((row) => ({
        id: row.id, transmittalId: row.transmittal_id, recipientPartyId: row.recipient_party_id
      })),
      decisions: decisionsResult[0].map((row) => ({
        id: row.id, subjectObjectId: row.subject_object_id,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        outcome: row.outcome, decisionType: row.decision_type
      })),
      totals: {
        packages: packageResult[0].length,
        frozenPackages: packageResult[0].filter((row) => row.status === 'FROZEN').length,
        deliveries: deliveryResult[0].length,
        received: receivedResult[0].length,
        imported: receivedResult[0].filter((row) => row.status === 'IMPORTED').length,
        rejected: receivedResult[0].filter((row) => row.status === 'REJECTED').length,
        conflicts: 0,
        adoptions: adoptionResult[0].length
      }
    };
  }

  private async requireRead(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.EXCHANGE_READ, { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) throw new ExchangeReadError(evaluation.reason, 'PERMISSION_DENIED');
  }
}
