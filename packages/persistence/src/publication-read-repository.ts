import {
  PLATFORM_PERMISSION_KEYS,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface EndpointRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  endpoint_type: string;
  direction: string;
  transport_protocol: string;
  system_name: string;
  endpoint_reference: string;
  recipient_party_id: string | null;
  recipient_name: string | null;
  acknowledgement_required: number;
  business_result_required: number;
  capabilities: string | string[];
  status: string;
}

interface RuleRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  subject_object_type: string;
  attribute_path: string | null;
  authority_owner: string;
  endpoint_id: string | null;
  endpoint_name: string | null;
  authority_reference: string | null;
  priority: number;
  effective_from: Date;
  effective_to: Date | null;
  status: string;
}

interface TransactionRow extends RowDataPacket {
  id: string;
  endpoint_id: string;
  endpoint_name: string;
  transaction_reference: string;
  idempotency_key: string;
  operation: string;
  exchange_delivery_id: string | null;
  integration_job_id: string | null;
  resubmission_of_transaction_id: string | null;
  requester_name: string;
  requested_at: Date;
  status: string;
  started_at: Date | null;
  completed_at: Date | null;
}

interface ActivityRow extends RowDataPacket {
  id: string;
  publication_transaction_id: string;
  subject_object_id: string;
  subject_type: string;
  subject_key: string;
  subject_version: string | null;
  action: string;
  sequence: number;
  data_envelope_id: string;
  schema_name: string;
  schema_version: string;
  envelope_checksum: string;
  external_identity_id: string | null;
  source_authority_rule_id: string;
  authority_rule_code: string;
  authority_owner: string;
  status: string;
}

interface AttemptRow extends RowDataPacket {
  id: string;
  publication_activity_id: string;
  attempt_number: number;
  data_envelope_id: string;
  outbox_message_id: string | null;
  started_at: Date;
  status: string;
  sent_at: Date | null;
  completed_at: Date | null;
  transport_reference: string | null;
  error_message: string | null;
}

interface AcknowledgementRow extends RowDataPacket {
  id: string;
  publication_attempt_id: string;
  acknowledgement_type: string;
  outcome: string;
  received_at: Date;
  external_transaction_id: string | null;
  message: string | null;
  diagnostic_reference: string | null;
}

interface ResultRow extends RowDataPacket {
  id: string;
  publication_activity_id: string;
  acknowledgement_id: string;
  outcome: string;
  completed_at: Date;
  external_object_id: string | null;
  external_version: string | null;
  result_reference: string | null;
  message: string | null;
  root_cause: string | null;
}

interface PartyOptionRow extends RowDataPacket {
  id: string;
  display_name: string;
  kind: string;
}

interface ObjectOptionRow extends RowDataPacket {
  id: string;
  object_type: string;
  stable_key: string;
}

interface ExchangeDeliveryOptionRow extends RowDataPacket {
  id: string;
  delivery_reference: string;
  status: string;
}

interface JobOptionRow extends RowDataPacket {
  id: string;
  target_system: string | null;
  status: string;
}

interface EnvelopeOptionRow extends RowDataPacket {
  id: string;
  schema_name: string;
  schema_version: string;
  object_type: string;
  stable_key: string;
  external_system: string | null;
  checksum: string;
  created_at: Date;
}

function stringArray(value: string | string[]): string[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
}

export interface PublicationWorkspaceProjection {
  endpoints: Array<{
    id: string;
    code: string;
    name: string;
    endpointType: string;
    direction: string;
    transportProtocol: string;
    systemName: string;
    endpointReference: string;
    recipientPartyId?: string;
    recipientName?: string;
    acknowledgementRequired: boolean;
    businessResultRequired: boolean;
    capabilities: string[];
    status: string;
  }>;
  sourceAuthorityRules: Array<{
    id: string;
    code: string;
    name: string;
    subjectObjectType: string;
    attributePath?: string;
    authorityOwner: string;
    endpointId?: string;
    endpointName?: string;
    authorityReference?: string;
    priority: number;
    effectiveFrom: string;
    effectiveTo?: string;
    status: string;
  }>;
  transactions: Array<{
    id: string;
    endpointId: string;
    endpointName: string;
    transactionReference: string;
    idempotencyKey: string;
    operation: string;
    exchangeDeliveryId?: string;
    integrationJobId?: string;
    resubmissionOfTransactionId?: string;
    requesterName: string;
    requestedAt: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    activities: Array<{
      id: string;
      subjectObjectId: string;
      subjectType: string;
      subjectKey: string;
      subjectVersion?: string;
      action: string;
      sequence: number;
      dataEnvelopeId: string;
      schemaName: string;
      schemaVersion: string;
      envelopeChecksum: string;
      externalIdentityId?: string;
      sourceAuthorityRuleId: string;
      authorityRuleCode: string;
      authorityOwner: string;
      status: string;
      attempts: Array<{
        id: string;
        attemptNumber: number;
        dataEnvelopeId: string;
        outboxMessageId?: string;
        startedAt: string;
        status: string;
        sentAt?: string;
        completedAt?: string;
        transportReference?: string;
        errorMessage?: string;
        acknowledgement?: {
          id: string;
          acknowledgementType: string;
          outcome: string;
          receivedAt: string;
          externalTransactionId?: string;
          message?: string;
          diagnosticReference?: string;
        };
      }>;
      result?: {
        id: string;
        acknowledgementId: string;
        outcome: string;
        completedAt: string;
        externalObjectId?: string;
        externalVersion?: string;
        resultReference?: string;
        message?: string;
        rootCause?: string;
      };
    }>;
  }>;
  parties: Array<{ id: string; displayName: string; kind: string }>;
  canonicalObjects: Array<{ id: string; objectType: string; stableKey: string }>;
  exchangeDeliveries: Array<{ id: string; deliveryReference: string; status: string }>;
  integrationJobs: Array<{ id: string; targetSystem?: string; status: string }>;
  envelopes: Array<{
    id: string;
    schemaName: string;
    schemaVersion: string;
    objectType: string;
    stableKey: string;
    externalSystem?: string;
    checksum: string;
    createdAt: string;
  }>;
  totals: {
    endpoints: number;
    rules: number;
    transactions: number;
    awaitingResults: number;
    succeeded: number;
    failed: number;
    transportFailures: number;
  };
}

export class PublicationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'PublicationReadError';
  }
}

export class MySqlPublicationReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<PublicationWorkspaceProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [
      endpointResult,
      ruleResult,
      transactionResult,
      activityResult,
      attemptResult,
      acknowledgementResult,
      resultResult,
      partyResult,
      objectResult,
      exchangeDeliveryResult,
      jobResult,
      envelopeResult
    ] = await Promise.all([
      this.pool.execute<EndpointRow[]>(
        `SELECT e.id, e.code, e.name, e.endpoint_type, e.direction,
                e.transport_protocol, e.system_name, e.endpoint_reference,
                e.recipient_party_id, p.display_name AS recipient_name,
                e.acknowledgement_required, e.business_result_required,
                e.capabilities, e.status
           FROM integration_endpoints e
           LEFT JOIN parties p
             ON p.tenant_id = e.tenant_id AND p.id = e.recipient_party_id
          WHERE e.tenant_id = ?
          ORDER BY e.name, e.code, e.id`,
        [tenantId]
      ),
      this.pool.execute<RuleRow[]>(
        `SELECT r.id, r.code, r.name, r.subject_object_type, r.attribute_path,
                r.authority_owner, r.endpoint_id, e.name AS endpoint_name,
                r.authority_reference, r.priority, r.effective_from,
                r.effective_to, r.status
           FROM source_authority_rules r
           LEFT JOIN integration_endpoints e
             ON e.tenant_id = r.tenant_id AND e.id = r.endpoint_id
          WHERE r.tenant_id = ?
          ORDER BY r.subject_object_type, r.attribute_path, r.priority, r.code`,
        [tenantId]
      ),
      this.pool.execute<TransactionRow[]>(
        `SELECT t.id, t.endpoint_id, e.name AS endpoint_name,
                t.transaction_reference, t.idempotency_key, t.operation,
                t.exchange_delivery_id, t.integration_job_id,
                t.resubmission_of_transaction_id,
                COALESCE(p.preferred_name, p.legal_name) AS requester_name,
                t.requested_at, t.status, t.started_at, t.completed_at
           FROM publication_transactions t
           JOIN integration_endpoints e
             ON e.tenant_id = t.tenant_id AND e.id = t.endpoint_id
           JOIN persons p
             ON p.tenant_id = t.tenant_id AND p.id = t.requested_by_person_id
          WHERE t.tenant_id = ?
          ORDER BY t.requested_at DESC, t.id`,
        [tenantId]
      ),
      this.pool.execute<ActivityRow[]>(
        `SELECT a.id, a.publication_transaction_id, a.subject_object_id,
                co.object_type AS subject_type, co.stable_key AS subject_key,
                a.subject_version, a.action, a.sequence, a.data_envelope_id,
                env.schema_name, env.schema_version,
                env.checksum AS envelope_checksum, a.external_identity_id,
                a.source_authority_rule_id, ar.code AS authority_rule_code,
                ar.authority_owner, a.status
           FROM publication_activities a
           JOIN canonical_objects co
             ON co.tenant_id = a.tenant_id AND co.id = a.subject_object_id
           JOIN canonical_data_envelopes env
             ON env.tenant_id = a.tenant_id AND env.id = a.data_envelope_id
           JOIN source_authority_rules ar
             ON ar.tenant_id = a.tenant_id AND ar.id = a.source_authority_rule_id
          WHERE a.tenant_id = ?
          ORDER BY a.publication_transaction_id, a.sequence, a.id`,
        [tenantId]
      ),
      this.pool.execute<AttemptRow[]>(
        `SELECT id, publication_activity_id, attempt_number, data_envelope_id,
                outbox_message_id, started_at, status, sent_at, completed_at,
                transport_reference, error_message
           FROM publication_attempts
          WHERE tenant_id = ?
          ORDER BY publication_activity_id, attempt_number, id`,
        [tenantId]
      ),
      this.pool.execute<AcknowledgementRow[]>(
        `SELECT id, publication_attempt_id, acknowledgement_type, outcome,
                received_at, external_transaction_id, message,
                diagnostic_reference
           FROM publication_acknowledgements
          WHERE tenant_id = ?
          ORDER BY received_at, id`,
        [tenantId]
      ),
      this.pool.execute<ResultRow[]>(
        `SELECT id, publication_activity_id, acknowledgement_id, outcome,
                completed_at, external_object_id, external_version,
                result_reference, message, root_cause
           FROM publication_results
          WHERE tenant_id = ?
          ORDER BY completed_at, id`,
        [tenantId]
      ),
      this.pool.execute<PartyOptionRow[]>(
        `SELECT id, display_name, kind
           FROM parties
          WHERE tenant_id = ? AND status = 'ACTIVE'
          ORDER BY display_name, id`,
        [tenantId]
      ),
      this.pool.execute<ObjectOptionRow[]>(
        `SELECT id, object_type, stable_key
           FROM canonical_objects
          WHERE tenant_id = ?
          ORDER BY object_type, stable_key, id`,
        [tenantId]
      ),
      this.pool.execute<ExchangeDeliveryOptionRow[]>(
        `SELECT id, delivery_reference, status
           FROM exchange_deliveries
          WHERE tenant_id = ?
          ORDER BY dispatched_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<JobOptionRow[]>(
        `SELECT id, target_system, status
           FROM integration_jobs
          WHERE tenant_id = ? AND job_type = 'EXPORT'
          ORDER BY requested_at DESC, id`,
        [tenantId]
      ),
      this.pool.execute<EnvelopeOptionRow[]>(
        `SELECT id, schema_name, schema_version, object_type, stable_key,
                external_system, checksum, created_at
           FROM canonical_data_envelopes
          WHERE tenant_id = ? AND direction = 'EXPORT'
          ORDER BY created_at DESC, id`,
        [tenantId]
      )
    ]);

    const activitiesByTransaction = new Map<string, ActivityRow[]>();
    for (const row of activityResult[0]) {
      const list = activitiesByTransaction.get(row.publication_transaction_id) ?? [];
      list.push(row);
      activitiesByTransaction.set(row.publication_transaction_id, list);
    }

    const attemptsByActivity = new Map<string, AttemptRow[]>();
    for (const row of attemptResult[0]) {
      const list = attemptsByActivity.get(row.publication_activity_id) ?? [];
      list.push(row);
      attemptsByActivity.set(row.publication_activity_id, list);
    }

    const acknowledgementByAttempt = new Map(
      acknowledgementResult[0].map((row) => [row.publication_attempt_id, row])
    );
    const resultByActivity = new Map(
      resultResult[0].map((row) => [row.publication_activity_id, row])
    );

    return {
      endpoints: endpointResult[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        endpointType: row.endpoint_type,
        direction: row.direction,
        transportProtocol: row.transport_protocol,
        systemName: row.system_name,
        endpointReference: row.endpoint_reference,
        ...(row.recipient_party_id ? { recipientPartyId: row.recipient_party_id } : {}),
        ...(row.recipient_name ? { recipientName: row.recipient_name } : {}),
        acknowledgementRequired: Boolean(row.acknowledgement_required),
        businessResultRequired: Boolean(row.business_result_required),
        capabilities: stringArray(row.capabilities),
        status: row.status
      })),
      sourceAuthorityRules: ruleResult[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        subjectObjectType: row.subject_object_type,
        ...(row.attribute_path ? { attributePath: row.attribute_path } : {}),
        authorityOwner: row.authority_owner,
        ...(row.endpoint_id ? { endpointId: row.endpoint_id } : {}),
        ...(row.endpoint_name ? { endpointName: row.endpoint_name } : {}),
        ...(row.authority_reference ? { authorityReference: row.authority_reference } : {}),
        priority: Number(row.priority),
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      transactions: transactionResult[0].map((transaction) => ({
        id: transaction.id,
        endpointId: transaction.endpoint_id,
        endpointName: transaction.endpoint_name,
        transactionReference: transaction.transaction_reference,
        idempotencyKey: transaction.idempotency_key,
        operation: transaction.operation,
        ...(transaction.exchange_delivery_id
          ? { exchangeDeliveryId: transaction.exchange_delivery_id }
          : {}),
        ...(transaction.integration_job_id
          ? { integrationJobId: transaction.integration_job_id }
          : {}),
        ...(transaction.resubmission_of_transaction_id
          ? { resubmissionOfTransactionId: transaction.resubmission_of_transaction_id }
          : {}),
        requesterName: transaction.requester_name,
        requestedAt: transaction.requested_at.toISOString(),
        status: transaction.status,
        ...(transaction.started_at ? { startedAt: transaction.started_at.toISOString() } : {}),
        ...(transaction.completed_at ? { completedAt: transaction.completed_at.toISOString() } : {}),
        activities: (activitiesByTransaction.get(transaction.id) ?? []).map((activity) => {
          const result = resultByActivity.get(activity.id);
          return {
            id: activity.id,
            subjectObjectId: activity.subject_object_id,
            subjectType: activity.subject_type,
            subjectKey: activity.subject_key,
            ...(activity.subject_version ? { subjectVersion: activity.subject_version } : {}),
            action: activity.action,
            sequence: Number(activity.sequence),
            dataEnvelopeId: activity.data_envelope_id,
            schemaName: activity.schema_name,
            schemaVersion: activity.schema_version,
            envelopeChecksum: activity.envelope_checksum,
            ...(activity.external_identity_id ? { externalIdentityId: activity.external_identity_id } : {}),
            sourceAuthorityRuleId: activity.source_authority_rule_id,
            authorityRuleCode: activity.authority_rule_code,
            authorityOwner: activity.authority_owner,
            status: activity.status,
            attempts: (attemptsByActivity.get(activity.id) ?? []).map((attempt) => {
              const acknowledgement = acknowledgementByAttempt.get(attempt.id);
              return {
                id: attempt.id,
                attemptNumber: Number(attempt.attempt_number),
                dataEnvelopeId: attempt.data_envelope_id,
                ...(attempt.outbox_message_id ? { outboxMessageId: attempt.outbox_message_id } : {}),
                startedAt: attempt.started_at.toISOString(),
                status: attempt.status,
                ...(attempt.sent_at ? { sentAt: attempt.sent_at.toISOString() } : {}),
                ...(attempt.completed_at ? { completedAt: attempt.completed_at.toISOString() } : {}),
                ...(attempt.transport_reference ? { transportReference: attempt.transport_reference } : {}),
                ...(attempt.error_message ? { errorMessage: attempt.error_message } : {}),
                ...(acknowledgement ? {
                  acknowledgement: {
                    id: acknowledgement.id,
                    acknowledgementType: acknowledgement.acknowledgement_type,
                    outcome: acknowledgement.outcome,
                    receivedAt: acknowledgement.received_at.toISOString(),
                    ...(acknowledgement.external_transaction_id
                      ? { externalTransactionId: acknowledgement.external_transaction_id }
                      : {}),
                    ...(acknowledgement.message ? { message: acknowledgement.message } : {}),
                    ...(acknowledgement.diagnostic_reference
                      ? { diagnosticReference: acknowledgement.diagnostic_reference }
                      : {})
                  }
                } : {})
              };
            }),
            ...(result ? {
              result: {
                id: result.id,
                acknowledgementId: result.acknowledgement_id,
                outcome: result.outcome,
                completedAt: result.completed_at.toISOString(),
                ...(result.external_object_id ? { externalObjectId: result.external_object_id } : {}),
                ...(result.external_version ? { externalVersion: result.external_version } : {}),
                ...(result.result_reference ? { resultReference: result.result_reference } : {}),
                ...(result.message ? { message: result.message } : {}),
                ...(result.root_cause ? { rootCause: result.root_cause } : {})
              }
            } : {})
          };
        })
      })),
      parties: partyResult[0].map((row) => ({
        id: row.id,
        displayName: row.display_name,
        kind: row.kind
      })),
      canonicalObjects: objectResult[0].map((row) => ({
        id: row.id,
        objectType: row.object_type,
        stableKey: row.stable_key
      })),
      exchangeDeliveries: exchangeDeliveryResult[0].map((row) => ({
        id: row.id,
        deliveryReference: row.delivery_reference,
        status: row.status
      })),
      integrationJobs: jobResult[0].map((row) => ({
        id: row.id,
        ...(row.target_system ? { targetSystem: row.target_system } : {}),
        status: row.status
      })),
      envelopes: envelopeResult[0].map((row) => ({
        id: row.id,
        schemaName: row.schema_name,
        schemaVersion: row.schema_version,
        objectType: row.object_type,
        stableKey: row.stable_key,
        ...(row.external_system ? { externalSystem: row.external_system } : {}),
        checksum: row.checksum,
        createdAt: row.created_at.toISOString()
      })),
      totals: {
        endpoints: endpointResult[0].length,
        rules: ruleResult[0].length,
        transactions: transactionResult[0].length,
        awaitingResults: transactionResult[0].filter((row) => row.status === 'AWAITING_RESULTS').length,
        succeeded: transactionResult[0].filter((row) => row.status === 'SUCCEEDED').length,
        failed: transactionResult[0].filter((row) => row.status === 'FAILED').length,
        transportFailures: attemptResult[0].filter(
          (row) => row.status === 'FAILED' || row.status === 'TIMED_OUT'
        ).length
      }
    };
  }

  private async requireRead(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.INTEGRATION_READ,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new PublicationReadError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }
}
