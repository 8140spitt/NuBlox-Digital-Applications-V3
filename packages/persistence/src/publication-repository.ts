import {
  applyPublicationAcknowledgementToActivity,
  applyPublicationAcknowledgementToAttempt,
  applyPublicationResultToActivity,
  createIntegrationEndpoint,
  createPublicationAcknowledgement,
  createPublicationActivity,
  createPublicationAttempt,
  createPublicationResult,
  createPublicationTransaction,
  createSourceAuthorityRule,
  failPublicationAttempt,
  markPublicationAttemptSent,
  startPublicationTransaction,
  updatePublicationTransactionFromActivities,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type ExchangeDelivery,
  type ExternalIdentity,
  type IntegrationEndpoint,
  type IntegrationJob,
  type OutboxMessage,
  type Party,
  type Person,
  type PublicationAcknowledgement,
  type PublicationActivity,
  type PublicationAttempt,
  type PublicationResult,
  type PublicationTransaction,
  type SourceAuthorityRule,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface EndpointRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  endpoint_type: IntegrationEndpoint['endpointType'];
  direction: IntegrationEndpoint['direction'];
  transport_protocol: IntegrationEndpoint['transportProtocol'];
  system_name: string;
  endpoint_reference: string;
  recipient_party_id: string | null;
  acknowledgement_required: number;
  business_result_required: number;
  capabilities: string | string[];
  status: IntegrationEndpoint['status'];
  row_version: number;
}

interface AuthorityRuleRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  subject_object_type: string;
  attribute_path: string | null;
  authority_owner: SourceAuthorityRule['authorityOwner'];
  endpoint_id: string | null;
  authority_reference: string | null;
  priority: number;
  effective_from: Date;
  effective_to: Date | null;
  status: SourceAuthorityRule['status'];
  row_version: number;
}

interface TransactionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  endpoint_id: string;
  transaction_reference: string;
  idempotency_key: string;
  operation: PublicationTransaction['operation'];
  exchange_delivery_id: string | null;
  integration_job_id: string | null;
  resubmission_of_transaction_id: string | null;
  requested_by_person_id: string;
  requested_at: Date;
  status: PublicationTransaction['status'];
  started_at: Date | null;
  completed_at: Date | null;
  row_version: number;
}

interface ActivityRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  publication_transaction_id: string;
  subject_object_id: string;
  subject_version: string | null;
  action: PublicationActivity['action'];
  sequence: number;
  data_envelope_id: string;
  external_identity_id: string | null;
  source_authority_rule_id: string;
  status: PublicationActivity['status'];
  active_guard_key: string | null;
  row_version: number;
}

interface AttemptRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  publication_activity_id: string;
  attempt_number: number;
  data_envelope_id: string;
  outbox_message_id: string | null;
  started_at: Date;
  status: PublicationAttempt['status'];
  sent_at: Date | null;
  completed_at: Date | null;
  transport_reference: string | null;
  error_message: string | null;
  row_version: number;
}

interface AcknowledgementRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  publication_attempt_id: string;
  acknowledgement_type: PublicationAcknowledgement['acknowledgementType'];
  outcome: PublicationAcknowledgement['outcome'];
  received_at: Date;
  external_transaction_id: string | null;
  message: string | null;
  diagnostic_reference: string | null;
}

interface ResultRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  publication_activity_id: string;
  acknowledgement_id: string;
  outcome: PublicationResult['outcome'];
  completed_at: Date;
  external_object_id: string | null;
  external_version: string | null;
  result_reference: string | null;
  message: string | null;
  root_cause: string | null;
}

interface ObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PartyRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  kind: Party['kind'];
  display_name: string;
  status: Party['status'];
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface EnvelopeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  direction: CanonicalDataEnvelope['direction'];
  schema_name: string;
  schema_version: string;
  object_type: string;
  stable_key: string;
  payload: string | Record<string, unknown>;
  external_system: string | null;
  external_object_id: string | null;
  checksum: string;
  created_at: Date;
}

interface ExternalIdentityRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  external_system: string;
  external_object_type: string;
  external_object_id: string;
  external_version: string | null;
  source_reference: string | null;
}

interface IntegrationJobRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  job_type: IntegrationJob['jobType'];
  source_system: string | null;
  target_system: string | null;
  requested_by_person_id: string | null;
  requested_at: Date;
  status: IntegrationJob['status'];
  started_at: Date | null;
  completed_at: Date | null;
  cursor_value: string | null;
  result_reference: string | null;
  error_message: string | null;
}

interface ExchangeDeliveryRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  exchange_package_id: string;
  transmittal_id: string | null;
  delivery_reference: string;
  delivery_sequence: number;
  prior_delivery_id: string | null;
  dispatched_by_person_id: string;
  dispatched_at: Date;
  transport_reference: string | null;
  delivery_checksum: string | null;
  status: ExchangeDelivery['status'];
}

interface OutboxRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: string | Record<string, unknown>;
  occurred_at: Date;
  status: OutboxMessage['status'];
  attempts: number;
  next_attempt_at: Date | null;
  published_at: Date | null;
  last_error: string | null;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }
  return date;
}

function normaliseJson(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value === 'string') {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Readonly<Record<string, unknown>>;
    }
    return { value: parsed };
  }
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Readonly<Record<string, unknown>>;
  }
  return { value };
}

function normaliseStringArray(value: string | string[]): ReadonlyArray<string> {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
}

function mapEndpoint(row: EndpointRow): IntegrationEndpoint {
  return {
    id: row.id as IntegrationEndpoint['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    endpointType: row.endpoint_type,
    direction: row.direction,
    transportProtocol: row.transport_protocol,
    systemName: row.system_name,
    endpointReference: row.endpoint_reference,
    ...(row.recipient_party_id
      ? { recipientPartyId: row.recipient_party_id as NonNullable<IntegrationEndpoint['recipientPartyId']> }
      : {}),
    acknowledgementRequired: Boolean(row.acknowledgement_required),
    businessResultRequired: Boolean(row.business_result_required),
    capabilities: normaliseStringArray(row.capabilities),
    status: row.status
  };
}

function mapAuthorityRule(row: AuthorityRuleRow): SourceAuthorityRule {
  return {
    id: row.id as SourceAuthorityRule['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    subjectObjectType: row.subject_object_type,
    ...(row.attribute_path ? { attributePath: row.attribute_path } : {}),
    authorityOwner: row.authority_owner,
    ...(row.endpoint_id
      ? { endpointId: row.endpoint_id as NonNullable<SourceAuthorityRule['endpointId']> }
      : {}),
    ...(row.authority_reference ? { authorityReference: row.authority_reference } : {}),
    priority: Number(row.priority),
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapTransaction(row: TransactionRow): PublicationTransaction {
  return {
    id: row.id as PublicationTransaction['id'],
    tenantId: row.tenant_id as TenantId,
    endpointId: row.endpoint_id as PublicationTransaction['endpointId'],
    transactionReference: row.transaction_reference,
    idempotencyKey: row.idempotency_key,
    operation: row.operation,
    ...(row.exchange_delivery_id
      ? { exchangeDeliveryId: row.exchange_delivery_id as NonNullable<PublicationTransaction['exchangeDeliveryId']> }
      : {}),
    ...(row.integration_job_id
      ? { integrationJobId: row.integration_job_id as NonNullable<PublicationTransaction['integrationJobId']> }
      : {}),
    ...(row.resubmission_of_transaction_id
      ? { resubmissionOfTransactionId: row.resubmission_of_transaction_id as NonNullable<PublicationTransaction['resubmissionOfTransactionId']> }
      : {}),
    requestedByPersonId: row.requested_by_person_id as PublicationTransaction['requestedByPersonId'],
    requestedAt: row.requested_at.toISOString(),
    status: row.status,
    ...(row.started_at ? { startedAt: row.started_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {})
  };
}

function mapActivity(row: ActivityRow): PublicationActivity {
  return {
    id: row.id as PublicationActivity['id'],
    tenantId: row.tenant_id as TenantId,
    publicationTransactionId: row.publication_transaction_id as PublicationActivity['publicationTransactionId'],
    subjectObjectId: row.subject_object_id as PublicationActivity['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    action: row.action,
    sequence: Number(row.sequence),
    dataEnvelopeId: row.data_envelope_id as PublicationActivity['dataEnvelopeId'],
    ...(row.external_identity_id
      ? { externalIdentityId: row.external_identity_id as NonNullable<PublicationActivity['externalIdentityId']> }
      : {}),
    sourceAuthorityRuleId: row.source_authority_rule_id as PublicationActivity['sourceAuthorityRuleId'],
    status: row.status
  };
}

function mapAttempt(row: AttemptRow): PublicationAttempt {
  return {
    id: row.id as PublicationAttempt['id'],
    tenantId: row.tenant_id as TenantId,
    publicationActivityId: row.publication_activity_id as PublicationAttempt['publicationActivityId'],
    attemptNumber: Number(row.attempt_number),
    dataEnvelopeId: row.data_envelope_id as PublicationAttempt['dataEnvelopeId'],
    ...(row.outbox_message_id
      ? { outboxMessageId: row.outbox_message_id as NonNullable<PublicationAttempt['outboxMessageId']> }
      : {}),
    startedAt: row.started_at.toISOString(),
    status: row.status,
    ...(row.sent_at ? { sentAt: row.sent_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.transport_reference ? { transportReference: row.transport_reference } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {})
  };
}

function mapAcknowledgement(row: AcknowledgementRow): PublicationAcknowledgement {
  return {
    id: row.id as PublicationAcknowledgement['id'],
    tenantId: row.tenant_id as TenantId,
    publicationAttemptId: row.publication_attempt_id as PublicationAcknowledgement['publicationAttemptId'],
    acknowledgementType: row.acknowledgement_type,
    outcome: row.outcome,
    receivedAt: row.received_at.toISOString(),
    ...(row.external_transaction_id ? { externalTransactionId: row.external_transaction_id } : {}),
    ...(row.message ? { message: row.message } : {}),
    ...(row.diagnostic_reference ? { diagnosticReference: row.diagnostic_reference } : {})
  };
}

function mapResult(row: ResultRow): PublicationResult {
  return {
    id: row.id as PublicationResult['id'],
    tenantId: row.tenant_id as TenantId,
    publicationActivityId: row.publication_activity_id as PublicationResult['publicationActivityId'],
    acknowledgementId: row.acknowledgement_id as PublicationResult['acknowledgementId'],
    outcome: row.outcome,
    completedAt: row.completed_at.toISOString(),
    ...(row.external_object_id ? { externalObjectId: row.external_object_id } : {}),
    ...(row.external_version ? { externalVersion: row.external_version } : {}),
    ...(row.result_reference ? { resultReference: row.result_reference } : {}),
    ...(row.message ? { message: row.message } : {}),
    ...(row.root_cause ? { rootCause: row.root_cause } : {})
  };
}

function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapParty(row: PartyRow): Party {
  return {
    id: row.id as Party['id'],
    tenantId: row.tenant_id as TenantId,
    kind: row.kind,
    displayName: row.display_name,
    status: row.status
  };
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'],
    legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
    status: row.status
  };
}

function mapEnvelope(row: EnvelopeRow): CanonicalDataEnvelope {
  return {
    id: row.id as CanonicalDataEnvelope['id'],
    tenantId: row.tenant_id as TenantId,
    direction: row.direction,
    schemaName: row.schema_name,
    schemaVersion: row.schema_version,
    objectType: row.object_type,
    stableKey: row.stable_key,
    payload: normaliseJson(row.payload),
    ...(row.external_system ? { externalSystem: row.external_system } : {}),
    ...(row.external_object_id ? { externalObjectId: row.external_object_id } : {}),
    checksum: row.checksum,
    createdAt: row.created_at.toISOString()
  };
}

function mapExternalIdentity(row: ExternalIdentityRow): ExternalIdentity {
  return {
    id: row.id as ExternalIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as ExternalIdentity['canonicalObjectId'],
    externalSystem: row.external_system,
    externalObjectType: row.external_object_type,
    externalObjectId: row.external_object_id,
    ...(row.external_version ? { externalVersion: row.external_version } : {}),
    ...(row.source_reference ? { sourceReference: row.source_reference } : {})
  };
}

function mapIntegrationJob(row: IntegrationJobRow): IntegrationJob {
  return {
    id: row.id as IntegrationJob['id'],
    tenantId: row.tenant_id as TenantId,
    jobType: row.job_type,
    ...(row.source_system ? { sourceSystem: row.source_system } : {}),
    ...(row.target_system ? { targetSystem: row.target_system } : {}),
    ...(row.requested_by_person_id
      ? { requestedByPersonId: row.requested_by_person_id as NonNullable<IntegrationJob['requestedByPersonId']> }
      : {}),
    requestedAt: row.requested_at.toISOString(),
    status: row.status,
    ...(row.started_at ? { startedAt: row.started_at.toISOString() } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
    ...(row.cursor_value ? { cursor: row.cursor_value } : {}),
    ...(row.result_reference ? { resultReference: row.result_reference } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {})
  };
}

function mapExchangeDelivery(row: ExchangeDeliveryRow): ExchangeDelivery {
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

function mapOutbox(row: OutboxRow): OutboxMessage {
  return {
    id: row.id as OutboxMessage['id'],
    tenantId: row.tenant_id as TenantId,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: normaliseJson(row.payload),
    occurredAt: row.occurred_at.toISOString(),
    status: row.status,
    attempts: Number(row.attempts),
    ...(row.next_attempt_at ? { nextAttemptAt: row.next_attempt_at.toISOString() } : {}),
    ...(row.published_at ? { publishedAt: row.published_at.toISOString() } : {}),
    ...(row.last_error ? { lastError: row.last_error } : {})
  };
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
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

function activityGuard(endpointId: string, subjectObjectId: string): string {
  return `${endpointId}|${subjectObjectId}`;
}

export class MySqlPublicationRepository {
  constructor(private readonly pool: Pool) {}

  async createEndpoint(
    endpoint: IntegrationEndpoint,
    audit: AuditContext = {}
  ): Promise<void> {
    const recipient = endpoint.recipientPartyId
      ? await this.requireParty(endpoint.tenantId, endpoint.recipientPartyId)
      : undefined;
    createIntegrationEndpoint(endpoint, recipient);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO integration_endpoints
          (id, tenant_id, code, name, endpoint_type, direction, transport_protocol,
           system_name, endpoint_reference, recipient_party_id, acknowledgement_required,
           business_result_required, capabilities, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          endpoint.id,
          endpoint.tenantId,
          endpoint.code,
          endpoint.name,
          endpoint.endpointType,
          endpoint.direction,
          endpoint.transportProtocol,
          endpoint.systemName,
          endpoint.endpointReference,
          endpoint.recipientPartyId ?? null,
          endpoint.acknowledgementRequired,
          endpoint.businessResultRequired,
          JSON.stringify(endpoint.capabilities),
          endpoint.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        endpoint.tenantId,
        'INTEGRATION_ENDPOINT',
        endpoint.id,
        'CREATED',
        audit,
        endpoint
      );
    });
  }

  async createSourceAuthorityRule(
    rule: SourceAuthorityRule,
    audit: AuditContext = {}
  ): Promise<void> {
    const endpoint = rule.endpointId
      ? await this.requireEndpoint(rule.tenantId, rule.endpointId)
      : undefined;
    createSourceAuthorityRule(rule, endpoint);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO source_authority_rules
          (id, tenant_id, code, name, subject_object_type, attribute_path, authority_owner,
           endpoint_id, authority_reference, priority, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rule.id,
          rule.tenantId,
          rule.code,
          rule.name,
          rule.subjectObjectType,
          rule.attributePath ?? null,
          rule.authorityOwner,
          rule.endpointId ?? null,
          rule.authorityReference ?? null,
          rule.priority,
          databaseDate(rule.effectiveFrom),
          rule.effectiveTo ? databaseDate(rule.effectiveTo) : null,
          rule.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        rule.tenantId,
        'SOURCE_AUTHORITY_RULE',
        rule.id,
        'CREATED',
        audit,
        rule
      );
    });
  }

  async createTransaction(
    transaction: PublicationTransaction,
    audit: AuditContext = {}
  ): Promise<void> {
    const [
      endpoint,
      requester,
      exchangeDelivery,
      integrationJob,
      resubmission
    ] = await Promise.all([
      this.requireEndpoint(transaction.tenantId, transaction.endpointId),
      this.requirePerson(transaction.tenantId, transaction.requestedByPersonId),
      transaction.exchangeDeliveryId
        ? this.requireExchangeDelivery(transaction.tenantId, transaction.exchangeDeliveryId)
        : Promise.resolve(undefined),
      transaction.integrationJobId
        ? this.requireIntegrationJob(transaction.tenantId, transaction.integrationJobId)
        : Promise.resolve(undefined),
      transaction.resubmissionOfTransactionId
        ? this.requireTransaction(transaction.tenantId, transaction.resubmissionOfTransactionId)
        : Promise.resolve(undefined)
    ]);

    createPublicationTransaction(
      transaction,
      endpoint,
      requester,
      exchangeDelivery,
      integrationJob,
      resubmission
    );

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO publication_transactions
          (id, tenant_id, endpoint_id, transaction_reference, idempotency_key, operation,
           exchange_delivery_id, integration_job_id, resubmission_of_transaction_id,
           requested_by_person_id, requested_at, status, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.tenantId,
          transaction.endpointId,
          transaction.transactionReference,
          transaction.idempotencyKey,
          transaction.operation,
          transaction.exchangeDeliveryId ?? null,
          transaction.integrationJobId ?? null,
          transaction.resubmissionOfTransactionId ?? null,
          transaction.requestedByPersonId,
          databaseDate(transaction.requestedAt),
          transaction.status,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        transaction.tenantId,
        'PUBLICATION_TRANSACTION',
        transaction.id,
        'QUEUED',
        audit,
        transaction
      );
    });
  }

  async addActivity(
    activity: PublicationActivity,
    audit: AuditContext = {}
  ): Promise<void> {
    const transaction = await this.requireTransaction(
      activity.tenantId,
      activity.publicationTransactionId
    );
    const [endpoint, subject, envelope, externalIdentity, authorityRule] =
      await Promise.all([
        this.requireEndpoint(activity.tenantId, transaction.endpointId),
        this.requireObject(activity.tenantId, activity.subjectObjectId),
        this.requireEnvelope(activity.tenantId, activity.dataEnvelopeId),
        activity.externalIdentityId
          ? this.requireExternalIdentity(activity.tenantId, activity.externalIdentityId)
          : Promise.resolve(undefined),
        this.requireAuthorityRule(activity.tenantId, activity.sourceAuthorityRuleId)
      ]);

    createPublicationActivity(
      activity,
      transaction,
      endpoint,
      subject,
      envelope,
      authorityRule,
      externalIdentity
    );

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO publication_activities
          (id, tenant_id, publication_transaction_id, subject_object_id, subject_version,
           action, sequence, data_envelope_id, external_identity_id, source_authority_rule_id,
           status, active_guard_key, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activity.id,
          activity.tenantId,
          activity.publicationTransactionId,
          activity.subjectObjectId,
          activity.subjectVersion ?? null,
          activity.action,
          activity.sequence,
          activity.dataEnvelopeId,
          activity.externalIdentityId ?? null,
          activity.sourceAuthorityRuleId,
          activity.status,
          activityGuard(transaction.endpointId, activity.subjectObjectId),
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await evidence(
        connection,
        activity.tenantId,
        'PUBLICATION_ACTIVITY',
        activity.id,
        'ADDED',
        audit,
        activity
      );
    });
  }

  async startTransaction(
    tenantId: TenantId,
    transactionId: PublicationTransaction['id'],
    startedAt: string,
    audit: AuditContext = {}
  ): Promise<PublicationTransaction> {
    return withTransaction(this.pool, async (connection) => {
      const transactionRow = await this.requireTransactionRowForUpdate(
        connection,
        tenantId,
        transactionId
      );
      const [activityRows] = await connection.execute<ActivityRow[]>(
        `SELECT id, tenant_id, publication_transaction_id, subject_object_id, subject_version,
                action, sequence, data_envelope_id, external_identity_id, source_authority_rule_id,
                status, active_guard_key, row_version
           FROM publication_activities
          WHERE tenant_id = ? AND publication_transaction_id = ?
          ORDER BY sequence, id
          FOR UPDATE`,
        [tenantId, transactionId]
      );
      const next = startPublicationTransaction(
        mapTransaction(transactionRow),
        activityRows.map(mapActivity),
        startedAt
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_transactions
            SET status = ?, started_at = ?, updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          databaseDate(startedAt),
          audit.actorPersonId ?? null,
          tenantId,
          transactionId,
          transactionRow.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Publication Transaction start detected.');
      }
      await evidence(
        connection,
        tenantId,
        'PUBLICATION_TRANSACTION',
        transactionId,
        'STARTED',
        audit,
        next
      );
      return next;
    });
  }

  async startAttempt(
    attempt: PublicationAttempt,
    audit: AuditContext = {}
  ): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const activityRow = await this.requireActivityRowForUpdate(
        connection,
        attempt.tenantId,
        attempt.publicationActivityId
      );
      const activity = mapActivity(activityRow);
      const transaction = await this.requireTransaction(
        attempt.tenantId,
        activity.publicationTransactionId,
        connection
      );
      const [envelope, outboxMessage, priorRows] = await Promise.all([
        this.requireEnvelope(attempt.tenantId, attempt.dataEnvelopeId, connection),
        attempt.outboxMessageId
          ? this.requireOutbox(attempt.tenantId, attempt.outboxMessageId, connection)
          : Promise.resolve(undefined),
        connection.execute<AttemptRow[]>(
          `SELECT id, tenant_id, publication_activity_id, attempt_number, data_envelope_id,
                  outbox_message_id, started_at, status, sent_at, completed_at,
                  transport_reference, error_message, row_version
             FROM publication_attempts
            WHERE tenant_id = ? AND publication_activity_id = ?
            ORDER BY attempt_number, id`,
          [attempt.tenantId, attempt.publicationActivityId]
        ).then(([rows]) => rows)
      ]);

      createPublicationAttempt(
        attempt,
        transaction,
        activity,
        envelope,
        outboxMessage,
        priorRows.map(mapAttempt)
      );

      await connection.execute(
        `INSERT INTO publication_attempts
          (id, tenant_id, publication_activity_id, attempt_number, data_envelope_id,
           outbox_message_id, started_at, status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          attempt.id,
          attempt.tenantId,
          attempt.publicationActivityId,
          attempt.attemptNumber,
          attempt.dataEnvelopeId,
          attempt.outboxMessageId ?? null,
          databaseDate(attempt.startedAt),
          attempt.status,
          audit.actorPersonId ?? null
        ]
      );

      const [activityUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_activities
            SET status = 'SENDING', updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          audit.actorPersonId ?? null,
          attempt.tenantId,
          activity.id,
          activityRow.row_version
        ]
      );
      if (activityUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Activity attempt start detected.');
      }

      await evidence(
        connection,
        attempt.tenantId,
        'PUBLICATION_ATTEMPT',
        attempt.id,
        'STARTED',
        audit,
        attempt
      );
    });
  }

  async markAttemptSent(
    tenantId: TenantId,
    attemptId: PublicationAttempt['id'],
    sentAt: string,
    transportReference: string,
    audit: AuditContext = {}
  ): Promise<PublicationAttempt> {
    return withTransaction(this.pool, async (connection) => {
      const attemptRow = await this.requireAttemptRowForUpdate(
        connection,
        tenantId,
        attemptId
      );
      const activityRow = await this.requireActivityRowForUpdate(
        connection,
        tenantId,
        attemptRow.publication_activity_id as PublicationActivity['id']
      );
      const nextAttempt = markPublicationAttemptSent(
        mapAttempt(attemptRow),
        sentAt,
        transportReference
      );

      const [attemptUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_attempts
            SET status = ?, sent_at = ?, transport_reference = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextAttempt.status,
          databaseDate(sentAt),
          transportReference,
          tenantId,
          attemptId,
          attemptRow.row_version
        ]
      );
      if (attemptUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Attempt send detected.');
      }

      const [activityUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_activities
            SET status = 'AWAITING_ACKNOWLEDGEMENT',
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          audit.actorPersonId ?? null,
          tenantId,
          activityRow.id,
          activityRow.row_version
        ]
      );
      if (activityUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Activity send detected.');
      }

      await this.refreshTransactionState(
        connection,
        tenantId,
        activityRow.publication_transaction_id as PublicationTransaction['id'],
        sentAt,
        audit.actorPersonId
      );
      await evidence(
        connection,
        tenantId,
        'PUBLICATION_ATTEMPT',
        attemptId,
        'SENT',
        audit,
        nextAttempt
      );
      return nextAttempt;
    });
  }

  async failAttempt(
    tenantId: TenantId,
    attemptId: PublicationAttempt['id'],
    completedAt: string,
    errorMessage: string,
    timedOut: boolean,
    audit: AuditContext = {}
  ): Promise<PublicationAttempt> {
    return withTransaction(this.pool, async (connection) => {
      const attemptRow = await this.requireAttemptRowForUpdate(
        connection,
        tenantId,
        attemptId
      );
      const activityRow = await this.requireActivityRowForUpdate(
        connection,
        tenantId,
        attemptRow.publication_activity_id as PublicationActivity['id']
      );
      const nextAttempt = failPublicationAttempt(
        mapAttempt(attemptRow),
        completedAt,
        errorMessage,
        timedOut
      );

      const [attemptUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_attempts
            SET status = ?, completed_at = ?, error_message = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextAttempt.status,
          databaseDate(completedAt),
          errorMessage,
          tenantId,
          attemptId,
          attemptRow.row_version
        ]
      );
      if (attemptUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Attempt failure detected.');
      }

      const [activityUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_activities
            SET status = 'TRANSPORT_FAILED', updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          audit.actorPersonId ?? null,
          tenantId,
          activityRow.id,
          activityRow.row_version
        ]
      );
      if (activityUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Activity transport failure detected.');
      }

      await this.refreshTransactionState(
        connection,
        tenantId,
        activityRow.publication_transaction_id as PublicationTransaction['id'],
        completedAt,
        audit.actorPersonId
      );
      await evidence(
        connection,
        tenantId,
        'PUBLICATION_ATTEMPT',
        attemptId,
        nextAttempt.status,
        audit,
        nextAttempt
      );
      return nextAttempt;
    });
  }

  async recordAcknowledgement(
    acknowledgement: PublicationAcknowledgement,
    audit: AuditContext = {}
  ): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const attemptRow = await this.requireAttemptRowForUpdate(
        connection,
        acknowledgement.tenantId,
        acknowledgement.publicationAttemptId
      );
      const activityRow = await this.requireActivityRowForUpdate(
        connection,
        acknowledgement.tenantId,
        attemptRow.publication_activity_id as PublicationActivity['id']
      );
      const attempt = mapAttempt(attemptRow);
      const activity = mapActivity(activityRow);

      createPublicationAcknowledgement(acknowledgement, attempt);
      const nextAttempt = applyPublicationAcknowledgementToAttempt(
        attempt,
        acknowledgement
      );
      const nextActivity = applyPublicationAcknowledgementToActivity(
        activity,
        acknowledgement
      );

      await connection.execute(
        `INSERT INTO publication_acknowledgements
          (id, tenant_id, publication_attempt_id, acknowledgement_type, outcome,
           received_at, external_transaction_id, message, diagnostic_reference,
           created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          acknowledgement.id,
          acknowledgement.tenantId,
          acknowledgement.publicationAttemptId,
          acknowledgement.acknowledgementType,
          acknowledgement.outcome,
          databaseDate(acknowledgement.receivedAt),
          acknowledgement.externalTransactionId ?? null,
          acknowledgement.message ?? null,
          acknowledgement.diagnosticReference ?? null,
          audit.actorPersonId ?? null
        ]
      );

      const [attemptUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_attempts
            SET status = ?, completed_at = ?, error_message = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextAttempt.status,
          nextAttempt.completedAt ? databaseDate(nextAttempt.completedAt) : null,
          nextAttempt.errorMessage ?? null,
          acknowledgement.tenantId,
          attempt.id,
          attemptRow.row_version
        ]
      );
      if (attemptUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Attempt acknowledgement detected.');
      }

      const [activityUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_activities
            SET status = ?, updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextActivity.status,
          audit.actorPersonId ?? null,
          acknowledgement.tenantId,
          activity.id,
          activityRow.row_version
        ]
      );
      if (activityUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Activity acknowledgement detected.');
      }

      await this.refreshTransactionState(
        connection,
        acknowledgement.tenantId,
        activity.publicationTransactionId,
        acknowledgement.receivedAt,
        audit.actorPersonId
      );
      await evidence(
        connection,
        acknowledgement.tenantId,
        'PUBLICATION_ACKNOWLEDGEMENT',
        acknowledgement.id,
        acknowledgement.outcome,
        audit,
        acknowledgement
      );
    });
  }

  async recordResult(
    result: PublicationResult,
    audit: AuditContext = {}
  ): Promise<PublicationTransaction> {
    return withTransaction(this.pool, async (connection) => {
      const activityRow = await this.requireActivityRowForUpdate(
        connection,
        result.tenantId,
        result.publicationActivityId
      );
      const activity = mapActivity(activityRow);
      const acknowledgement = await this.requireAcknowledgement(
        result.tenantId,
        result.acknowledgementId,
        connection
      );

      createPublicationResult(result, activity, acknowledgement);
      const nextActivity = applyPublicationResultToActivity(activity, result);

      await connection.execute(
        `INSERT INTO publication_results
          (id, tenant_id, publication_activity_id, acknowledgement_id, outcome,
           completed_at, external_object_id, external_version, result_reference,
           message, root_cause, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id,
          result.tenantId,
          result.publicationActivityId,
          result.acknowledgementId,
          result.outcome,
          databaseDate(result.completedAt),
          result.externalObjectId ?? null,
          result.externalVersion ?? null,
          result.resultReference ?? null,
          result.message ?? null,
          result.rootCause ?? null,
          audit.actorPersonId ?? null
        ]
      );

      const [activityUpdate] = await connection.execute<ResultSetHeader>(
        `UPDATE publication_activities
            SET status = ?, active_guard_key = NULL,
                updated_by_person_id = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          nextActivity.status,
          audit.actorPersonId ?? null,
          result.tenantId,
          activity.id,
          activityRow.row_version
        ]
      );
      if (activityUpdate.affectedRows !== 1) {
        throw new Error('Concurrent Publication Activity result detected.');
      }

      const transaction = await this.refreshTransactionState(
        connection,
        result.tenantId,
        activity.publicationTransactionId,
        result.completedAt,
        audit.actorPersonId
      );
      await evidence(
        connection,
        result.tenantId,
        'PUBLICATION_RESULT',
        result.id,
        result.outcome,
        audit,
        result
      );
      return transaction;
    });
  }

  async getEndpoint(
    tenantId: TenantId,
    id: IntegrationEndpoint['id']
  ): Promise<IntegrationEndpoint | undefined> {
    const [rows] = await this.pool.execute<EndpointRow[]>(
      `SELECT id, tenant_id, code, name, endpoint_type, direction, transport_protocol,
              system_name, endpoint_reference, recipient_party_id, acknowledgement_required,
              business_result_required, capabilities, status, row_version
         FROM integration_endpoints
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapEndpoint(rows[0]) : undefined;
  }

  async getSourceAuthorityRule(
    tenantId: TenantId,
    id: SourceAuthorityRule['id']
  ): Promise<SourceAuthorityRule | undefined> {
    const [rows] = await this.pool.execute<AuthorityRuleRow[]>(
      `SELECT id, tenant_id, code, name, subject_object_type, attribute_path,
              authority_owner, endpoint_id, authority_reference, priority,
              effective_from, effective_to, status, row_version
         FROM source_authority_rules
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapAuthorityRule(rows[0]) : undefined;
  }

  async getTransaction(
    tenantId: TenantId,
    id: PublicationTransaction['id']
  ): Promise<PublicationTransaction | undefined> {
    const [rows] = await this.pool.execute<TransactionRow[]>(
      `SELECT id, tenant_id, endpoint_id, transaction_reference, idempotency_key,
              operation, exchange_delivery_id, integration_job_id,
              resubmission_of_transaction_id, requested_by_person_id, requested_at,
              status, started_at, completed_at, row_version
         FROM publication_transactions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapTransaction(rows[0]) : undefined;
  }

  async getActivity(
    tenantId: TenantId,
    id: PublicationActivity['id']
  ): Promise<PublicationActivity | undefined> {
    const [rows] = await this.pool.execute<ActivityRow[]>(
      `SELECT id, tenant_id, publication_transaction_id, subject_object_id,
              subject_version, action, sequence, data_envelope_id, external_identity_id,
              source_authority_rule_id, status, active_guard_key, row_version
         FROM publication_activities
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapActivity(rows[0]) : undefined;
  }

  async listAttempts(
    tenantId: TenantId,
    activityId: PublicationActivity['id']
  ): Promise<PublicationAttempt[]> {
    const [rows] = await this.pool.execute<AttemptRow[]>(
      `SELECT id, tenant_id, publication_activity_id, attempt_number, data_envelope_id,
              outbox_message_id, started_at, status, sent_at, completed_at,
              transport_reference, error_message, row_version
         FROM publication_attempts
        WHERE tenant_id = ? AND publication_activity_id = ?
        ORDER BY attempt_number, id`,
      [tenantId, activityId]
    );
    return rows.map(mapAttempt);
  }

  async getAttempt(
    tenantId: TenantId,
    id: PublicationAttempt['id']
  ): Promise<PublicationAttempt | undefined> {
    const [rows] = await this.pool.execute<AttemptRow[]>(
      `SELECT id, tenant_id, publication_activity_id, attempt_number, data_envelope_id,
              outbox_message_id, started_at, status, sent_at, completed_at,
              transport_reference, error_message, row_version
         FROM publication_attempts
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapAttempt(rows[0]) : undefined;
  }

  private async refreshTransactionState(
    connection: PoolConnection,
    tenantId: TenantId,
    transactionId: PublicationTransaction['id'],
    evaluatedAt: string,
    actorPersonId?: string
  ): Promise<PublicationTransaction> {
    const transactionRow = await this.requireTransactionRowForUpdate(
      connection,
      tenantId,
      transactionId
    );
    const [activityRows] = await connection.execute<ActivityRow[]>(
      `SELECT id, tenant_id, publication_transaction_id, subject_object_id,
              subject_version, action, sequence, data_envelope_id, external_identity_id,
              source_authority_rule_id, status, active_guard_key, row_version
         FROM publication_activities
        WHERE tenant_id = ? AND publication_transaction_id = ?
        ORDER BY sequence, id
        FOR UPDATE`,
      [tenantId, transactionId]
    );
    const current = mapTransaction(transactionRow);
    const next = updatePublicationTransactionFromActivities(
      current,
      activityRows.map(mapActivity),
      evaluatedAt
    );

    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE publication_transactions
          SET status = ?, completed_at = ?, updated_by_person_id = ?,
              row_version = row_version + 1
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.completedAt ? databaseDate(next.completedAt) : null,
        actorPersonId ?? null,
        tenantId,
        transactionId,
        transactionRow.row_version
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Publication Transaction state derivation detected.');
    }
    return next;
  }

  private async requireEndpoint(
    tenantId: TenantId,
    id: IntegrationEndpoint['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<IntegrationEndpoint> {
    const [rows] = await connection.execute<EndpointRow[]>(
      `SELECT id, tenant_id, code, name, endpoint_type, direction, transport_protocol,
              system_name, endpoint_reference, recipient_party_id, acknowledgement_required,
              business_result_required, capabilities, status, row_version
         FROM integration_endpoints
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Integration Endpoint not found in tenant.');
    return mapEndpoint(rows[0]);
  }

  private async requireAuthorityRule(
    tenantId: TenantId,
    id: SourceAuthorityRule['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<SourceAuthorityRule> {
    const [rows] = await connection.execute<AuthorityRuleRow[]>(
      `SELECT id, tenant_id, code, name, subject_object_type, attribute_path,
              authority_owner, endpoint_id, authority_reference, priority,
              effective_from, effective_to, status, row_version
         FROM source_authority_rules
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Source Authority Rule not found in tenant.');
    return mapAuthorityRule(rows[0]);
  }

  private async requireTransaction(
    tenantId: TenantId,
    id: PublicationTransaction['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<PublicationTransaction> {
    const [rows] = await connection.execute<TransactionRow[]>(
      `SELECT id, tenant_id, endpoint_id, transaction_reference, idempotency_key,
              operation, exchange_delivery_id, integration_job_id,
              resubmission_of_transaction_id, requested_by_person_id, requested_at,
              status, started_at, completed_at, row_version
         FROM publication_transactions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Publication Transaction not found in tenant.');
    return mapTransaction(rows[0]);
  }

  private async requireObject(
    tenantId: TenantId,
    id: CanonicalObjectIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<ObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Canonical Object not found in tenant.');
    return mapObject(rows[0]);
  }

  private async requireParty(
    tenantId: TenantId,
    id: Party['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<Party> {
    const [rows] = await connection.execute<PartyRow[]>(
      `SELECT id, tenant_id, kind, display_name, status
         FROM parties
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Party not found in tenant.');
    return mapParty(rows[0]);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: Person['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Person not found in tenant.');
    return mapPerson(rows[0]);
  }

  private async requireEnvelope(
    tenantId: TenantId,
    id: CanonicalDataEnvelope['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalDataEnvelope> {
    const [rows] = await connection.execute<EnvelopeRow[]>(
      `SELECT id, tenant_id, direction, schema_name, schema_version, object_type,
              stable_key, payload, external_system, external_object_id, checksum, created_at
         FROM canonical_data_envelopes
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Canonical Data Envelope not found in tenant.');
    return mapEnvelope(rows[0]);
  }

  private async requireExternalIdentity(
    tenantId: TenantId,
    id: ExternalIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<ExternalIdentity> {
    const [rows] = await connection.execute<ExternalIdentityRow[]>(
      `SELECT id, tenant_id, canonical_object_id, external_system,
              external_object_type, external_object_id, external_version, source_reference
         FROM external_identities
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('External Identity not found in tenant.');
    return mapExternalIdentity(rows[0]);
  }

  private async requireIntegrationJob(
    tenantId: TenantId,
    id: IntegrationJob['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<IntegrationJob> {
    const [rows] = await connection.execute<IntegrationJobRow[]>(
      `SELECT id, tenant_id, job_type, source_system, target_system,
              requested_by_person_id, requested_at, status, started_at,
              completed_at, cursor_value, result_reference, error_message
         FROM integration_jobs
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Integration Job not found in tenant.');
    return mapIntegrationJob(rows[0]);
  }

  private async requireExchangeDelivery(
    tenantId: TenantId,
    id: ExchangeDelivery['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<ExchangeDelivery> {
    const [rows] = await connection.execute<ExchangeDeliveryRow[]>(
      `SELECT id, tenant_id, exchange_package_id, transmittal_id, delivery_reference,
              delivery_sequence, prior_delivery_id, dispatched_by_person_id, dispatched_at,
              transport_reference, delivery_checksum, status
         FROM exchange_deliveries
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Exchange Delivery not found in tenant.');
    return mapExchangeDelivery(rows[0]);
  }

  private async requireOutbox(
    tenantId: TenantId,
    id: OutboxMessage['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<OutboxMessage> {
    const [rows] = await connection.execute<OutboxRow[]>(
      `SELECT id, tenant_id, aggregate_type, aggregate_id, event_type, payload,
              occurred_at, status, attempts, next_attempt_at, published_at, last_error
         FROM outbox_messages
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Outbox Message not found in tenant.');
    return mapOutbox(rows[0]);
  }

  private async requireAcknowledgement(
    tenantId: TenantId,
    id: PublicationAcknowledgement['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<PublicationAcknowledgement> {
    const [rows] = await connection.execute<AcknowledgementRow[]>(
      `SELECT id, tenant_id, publication_attempt_id, acknowledgement_type,
              outcome, received_at, external_transaction_id, message, diagnostic_reference
         FROM publication_acknowledgements
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Publication Acknowledgement not found in tenant.');
    return mapAcknowledgement(rows[0]);
  }

  private async requireTransactionRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: PublicationTransaction['id']
  ): Promise<TransactionRow> {
    const [rows] = await connection.execute<TransactionRow[]>(
      `SELECT id, tenant_id, endpoint_id, transaction_reference, idempotency_key,
              operation, exchange_delivery_id, integration_job_id,
              resubmission_of_transaction_id, requested_by_person_id, requested_at,
              status, started_at, completed_at, row_version
         FROM publication_transactions
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Publication Transaction not found in tenant.');
    return rows[0];
  }

  private async requireActivityRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: PublicationActivity['id']
  ): Promise<ActivityRow> {
    const [rows] = await connection.execute<ActivityRow[]>(
      `SELECT id, tenant_id, publication_transaction_id, subject_object_id,
              subject_version, action, sequence, data_envelope_id, external_identity_id,
              source_authority_rule_id, status, active_guard_key, row_version
         FROM publication_activities
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Publication Activity not found in tenant.');
    return rows[0];
  }

  private async requireAttemptRowForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: PublicationAttempt['id']
  ): Promise<AttemptRow> {
    const [rows] = await connection.execute<AttemptRow[]>(
      `SELECT id, tenant_id, publication_activity_id, attempt_number, data_envelope_id,
              outbox_message_id, started_at, status, sent_at, completed_at,
              transport_reference, error_message, row_version
         FROM publication_attempts
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Publication Attempt not found in tenant.');
    return rows[0];
  }
}
