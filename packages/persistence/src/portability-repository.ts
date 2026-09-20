import {
  advanceProjectionCheckpoint,
  completeIdempotencyRecord,
  completeIntegrationJob,
  createCanonicalDataEnvelope,
  createExternalIdentity,
  createIdempotencyRecord,
  createIntegrationJob,
  createMigrationReconciliation,
  createProjectionCheckpoint,
  failIdempotencyRecord,
  failIntegrationJob,
  markOutboxFailed,
  markOutboxPublished,
  startIntegrationJob,
  type CanonicalDataEnvelope,
  type CanonicalObjectIdentity,
  type ExternalIdentity,
  type IdempotencyRecord,
  type IntegrationJob,
  type MigrationReconciliation,
  type OutboxMessage,
  type Person,
  type ProjectionCheckpoint,
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
  row_version: number;
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
  row_version: number;
}

interface IdempotencyRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  scope_key: string;
  idempotency_key: string;
  request_hash: string;
  status: IdempotencyRecord['status'];
  response_reference: string | null;
  error_message: string | null;
  created_at: Date;
  expires_at: Date | null;
  row_version: number;
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

interface ProjectionCheckpointRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  projection_name: string;
  partition_key: string;
  last_event_sequence: number | string | null;
  last_occurred_at: Date | null;
  checkpoint_updated_at: Date;
  row_version: number;
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
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

function mapIdempotency(row: IdempotencyRow): IdempotencyRecord {
  return {
    id: row.id as IdempotencyRecord['id'],
    tenantId: row.tenant_id as TenantId,
    scope: row.scope_key,
    key: row.idempotency_key,
    requestHash: row.request_hash,
    status: row.status,
    ...(row.response_reference ? { responseReference: row.response_reference } : {}),
    ...(row.error_message ? { errorMessage: row.error_message } : {}),
    createdAt: row.created_at.toISOString(),
    ...(row.expires_at ? { expiresAt: row.expires_at.toISOString() } : {})
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

function mapProjectionCheckpoint(row: ProjectionCheckpointRow): ProjectionCheckpoint {
  return {
    id: row.id as ProjectionCheckpoint['id'],
    tenantId: row.tenant_id as TenantId,
    projectionName: row.projection_name,
    partitionKey: row.partition_key,
    ...(row.last_event_sequence !== null
      ? { lastEventSequence: Number(row.last_event_sequence) }
      : {}),
    ...(row.last_occurred_at
      ? { lastOccurredAt: row.last_occurred_at.toISOString() }
      : {}),
    updatedAt: row.checkpoint_updated_at.toISOString()
  };
}

function mapCanonicalObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
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

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
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

export interface IdempotencyClaim {
  record: IdempotencyRecord;
  replay: boolean;
}

export class MySqlPortabilityRepository {
  constructor(private readonly pool: Pool) {}

  async claimOutboxBatch(
    limit: number,
    now: string,
    leaseUntil: string
  ): Promise<OutboxMessage[]> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw new Error('Outbox claim limit must be an integer between 1 and 1000.');
    }
    const nowDate = databaseDate(now);
    const leaseDate = databaseDate(leaseUntil);
    if (leaseDate.getTime() <= nowDate.getTime()) {
      throw new Error('Outbox leaseUntil must be later than now.');
    }

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<OutboxRow[]>(
        `SELECT id, tenant_id, aggregate_type, aggregate_id, event_type, payload,
                occurred_at, status, attempts, next_attempt_at, published_at,
                last_error, row_version
           FROM outbox_messages
          WHERE status IN ('PENDING', 'FAILED')
            AND published_at IS NULL
            AND (next_attempt_at IS NULL OR next_attempt_at <= ?)
          ORDER BY occurred_at, id
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED`,
        [nowDate]
      );

      if (rows.length === 0) return [];

      const ids = rows.map((row) => row.id);
      const placeholders = ids.map(() => '?').join(', ');
      await connection.query(
        `UPDATE outbox_messages
            SET next_attempt_at = ?, row_version = row_version + 1
          WHERE id IN (${placeholders})`,
        [leaseDate, ...ids]
      );

      return rows.map((row) =>
        mapOutbox({ ...row, next_attempt_at: leaseDate, row_version: row.row_version + 1 })
      );
    });
  }

  async markOutboxPublished(
    tenantId: TenantId,
    id: OutboxMessage['id'],
    publishedAt: string
  ): Promise<OutboxMessage> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireOutboxForUpdate(connection, tenantId, id);
      const current = mapOutbox(row);
      markOutboxPublished(current, publishedAt);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE outbox_messages
            SET status = 'PUBLISHED', attempts = attempts + 1, published_at = ?,
                next_attempt_at = NULL, last_error = NULL, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [databaseDate(publishedAt), tenantId, id, row.row_version]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Outbox Message update detected.');
      }

      return this.requireOutbox(tenantId, id, connection);
    });
  }

  async markOutboxFailed(
    tenantId: TenantId,
    id: OutboxMessage['id'],
    error: string,
    nextAttemptAt?: string
  ): Promise<OutboxMessage> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireOutboxForUpdate(connection, tenantId, id);
      const current = mapOutbox(row);
      markOutboxFailed(current, error, nextAttemptAt);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE outbox_messages
            SET status = 'FAILED', attempts = attempts + 1, last_error = ?,
                next_attempt_at = ?, published_at = NULL, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          error,
          nextAttemptAt ? databaseDate(nextAttemptAt) : null,
          tenantId,
          id,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Outbox Message update detected.');
      }

      return this.requireOutbox(tenantId, id, connection);
    });
  }

  async createIntegrationJob(
    tenantId: TenantId,
    job: IntegrationJob,
    audit: AuditContext = {}
  ): Promise<void> {
    if (job.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const requester = job.requestedByPersonId
      ? await this.requirePerson(tenantId, job.requestedByPersonId)
      : undefined;
    createIntegrationJob(job, requester);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO integration_jobs
          (id, tenant_id, job_type, source_system, target_system,
           requested_by_person_id, requested_at, status, cursor_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          job.id,
          job.tenantId,
          job.jobType,
          job.sourceSystem ?? null,
          job.targetSystem ?? null,
          job.requestedByPersonId ?? null,
          databaseDate(job.requestedAt),
          job.status,
          job.cursor ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'INTEGRATION_JOB',
        job.id,
        'QUEUED',
        audit,
        job
      );
    });
  }

  async startIntegrationJob(
    tenantId: TenantId,
    id: IntegrationJob['id'],
    startedAt: string,
    audit: AuditContext = {}
  ): Promise<IntegrationJob> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireIntegrationJobForUpdate(connection, tenantId, id);
      const next = startIntegrationJob(mapIntegrationJob(row), startedAt);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE integration_jobs
            SET status = ?, started_at = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [next.status, databaseDate(startedAt), tenantId, id, row.row_version]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Integration Job update detected.');
      }
      await writeAudit(connection, tenantId, 'INTEGRATION_JOB', id, 'STARTED', audit, next);
      return next;
    });
  }

  async completeIntegrationJob(
    tenantId: TenantId,
    id: IntegrationJob['id'],
    completedAt: string,
    resultReference?: string,
    audit: AuditContext = {}
  ): Promise<IntegrationJob> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireIntegrationJobForUpdate(connection, tenantId, id);
      const next = completeIntegrationJob(mapIntegrationJob(row), completedAt, resultReference);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE integration_jobs
            SET status = ?, completed_at = ?, result_reference = ?,
                error_message = NULL, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          databaseDate(completedAt),
          next.resultReference ?? null,
          tenantId,
          id,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Integration Job update detected.');
      }
      await writeAudit(connection, tenantId, 'INTEGRATION_JOB', id, 'SUCCEEDED', audit, next);
      return next;
    });
  }

  async failIntegrationJob(
    tenantId: TenantId,
    id: IntegrationJob['id'],
    completedAt: string,
    errorMessage: string,
    audit: AuditContext = {}
  ): Promise<IntegrationJob> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireIntegrationJobForUpdate(connection, tenantId, id);
      const next = failIntegrationJob(mapIntegrationJob(row), completedAt, errorMessage);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE integration_jobs
            SET status = ?, completed_at = ?, error_message = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          databaseDate(completedAt),
          errorMessage,
          tenantId,
          id,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Integration Job update detected.');
      }
      await writeAudit(connection, tenantId, 'INTEGRATION_JOB', id, 'FAILED', audit, next);
      return next;
    });
  }

  async claimIdempotency(
    record: IdempotencyRecord
  ): Promise<IdempotencyClaim> {
    createIdempotencyRecord(record);

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<IdempotencyRow[]>(
        `SELECT id, tenant_id, scope_key, idempotency_key, request_hash, status,
                response_reference, error_message, created_at, expires_at, row_version
           FROM idempotency_records
          WHERE tenant_id = ? AND scope_key = ? AND idempotency_key = ?
          FOR UPDATE`,
        [record.tenantId, record.scope, record.key]
      );
      const existing = rows[0];

      if (existing) {
        const mapped = mapIdempotency(existing);
        const expired =
          mapped.expiresAt !== undefined &&
          Date.parse(mapped.expiresAt) < Date.parse(record.createdAt);

        if (!expired) {
          if (mapped.requestHash !== record.requestHash) {
            throw new Error('Idempotency key was reused with a different request.');
          }
          return { record: mapped, replay: true };
        }

        const [result] = await connection.execute<ResultSetHeader>(
          `UPDATE idempotency_records
              SET id = ?, request_hash = ?, status = 'IN_PROGRESS',
                  response_reference = NULL, error_message = NULL,
                  created_at = ?, expires_at = ?, row_version = row_version + 1
            WHERE tenant_id = ? AND scope_key = ? AND idempotency_key = ?
              AND row_version = ?`,
          [
            record.id,
            record.requestHash,
            databaseDate(record.createdAt),
            record.expiresAt ? databaseDate(record.expiresAt) : null,
            record.tenantId,
            record.scope,
            record.key,
            existing.row_version
          ]
        );
        if (result.affectedRows !== 1) {
          throw new Error('Concurrent Idempotency Record renewal detected.');
        }
        return { record, replay: false };
      }

      await connection.execute(
        `INSERT INTO idempotency_records
          (id, tenant_id, scope_key, idempotency_key, request_hash, status,
           created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.tenantId,
          record.scope,
          record.key,
          record.requestHash,
          record.status,
          databaseDate(record.createdAt),
          record.expiresAt ? databaseDate(record.expiresAt) : null
        ]
      );
      return { record, replay: false };
    });
  }

  async completeIdempotency(
    tenantId: TenantId,
    scope: string,
    key: string,
    responseReference?: string
  ): Promise<IdempotencyRecord> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireIdempotencyForUpdate(connection, tenantId, scope, key);
      const next = completeIdempotencyRecord(mapIdempotency(row), responseReference);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE idempotency_records
            SET status = ?, response_reference = ?, error_message = NULL,
                row_version = row_version + 1
          WHERE tenant_id = ? AND scope_key = ? AND idempotency_key = ?
            AND row_version = ?`,
        [
          next.status,
          next.responseReference ?? null,
          tenantId,
          scope,
          key,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Idempotency Record update detected.');
      }
      return next;
    });
  }

  async failIdempotency(
    tenantId: TenantId,
    scope: string,
    key: string,
    errorMessage: string
  ): Promise<IdempotencyRecord> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireIdempotencyForUpdate(connection, tenantId, scope, key);
      const next = failIdempotencyRecord(mapIdempotency(row), errorMessage);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE idempotency_records
            SET status = ?, error_message = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND scope_key = ? AND idempotency_key = ?
            AND row_version = ?`,
        [next.status, errorMessage, tenantId, scope, key, row.row_version]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Idempotency Record update detected.');
      }
      return next;
    });
  }

  async storeDataEnvelope(
    envelope: CanonicalDataEnvelope,
    audit: AuditContext = {}
  ): Promise<void> {
    createCanonicalDataEnvelope(envelope);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO canonical_data_envelopes
          (id, tenant_id, direction, schema_name, schema_version, object_type,
           stable_key, payload, external_system, external_object_id, checksum, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          envelope.id,
          envelope.tenantId,
          envelope.direction,
          envelope.schemaName,
          envelope.schemaVersion,
          envelope.objectType,
          envelope.stableKey,
          JSON.stringify(envelope.payload),
          envelope.externalSystem ?? null,
          envelope.externalObjectId ?? null,
          envelope.checksum,
          databaseDate(envelope.createdAt)
        ]
      );
      await writeAudit(
        connection,
        envelope.tenantId,
        'DATA_ENVELOPE',
        envelope.id,
        'STORED',
        audit,
        envelope
      );
    });
  }

  async createExternalIdentity(
    identity: ExternalIdentity,
    audit: AuditContext = {}
  ): Promise<void> {
    const object = await this.requireCanonicalObject(
      identity.tenantId,
      identity.canonicalObjectId
    );
    createExternalIdentity(identity, object);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO external_identities
          (id, tenant_id, canonical_object_id, external_system,
           external_object_type, external_object_id, external_version, source_reference)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          identity.id,
          identity.tenantId,
          identity.canonicalObjectId,
          identity.externalSystem,
          identity.externalObjectType,
          identity.externalObjectId,
          identity.externalVersion ?? null,
          identity.sourceReference ?? null
        ]
      );
      await writeAudit(
        connection,
        identity.tenantId,
        'EXTERNAL_IDENTITY',
        identity.id,
        'CREATED',
        audit,
        identity
      );
    });
  }

  async recordReconciliation(
    reconciliation: MigrationReconciliation,
    audit: AuditContext = {}
  ): Promise<void> {
    const [identity, object] = await Promise.all([
      this.requireExternalIdentity(
        reconciliation.tenantId,
        reconciliation.externalIdentityId
      ),
      this.requireCanonicalObject(
        reconciliation.tenantId,
        reconciliation.canonicalObjectId
      )
    ]);
    createMigrationReconciliation(reconciliation, identity, object);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO migration_reconciliations
          (id, tenant_id, external_identity_id, canonical_object_id, status,
           source_hash, target_hash, checked_at, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          reconciliation.id,
          reconciliation.tenantId,
          reconciliation.externalIdentityId,
          reconciliation.canonicalObjectId,
          reconciliation.status,
          reconciliation.sourceHash ?? null,
          reconciliation.targetHash ?? null,
          databaseDate(reconciliation.checkedAt),
          reconciliation.details ?? null
        ]
      );
      await writeAudit(
        connection,
        reconciliation.tenantId,
        'MIGRATION_RECONCILIATION',
        reconciliation.id,
        'RECORDED',
        audit,
        reconciliation
      );
    });
  }

  async saveProjectionCheckpoint(
    checkpoint: ProjectionCheckpoint
  ): Promise<ProjectionCheckpoint> {
    createProjectionCheckpoint(checkpoint);

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<ProjectionCheckpointRow[]>(
        `SELECT id, tenant_id, projection_name, partition_key,
                last_event_sequence, last_occurred_at, checkpoint_updated_at, row_version
           FROM projection_checkpoints
          WHERE tenant_id = ? AND projection_name = ? AND partition_key = ?
          FOR UPDATE`,
        [checkpoint.tenantId, checkpoint.projectionName, checkpoint.partitionKey]
      );
      const existing = rows[0];

      if (!existing) {
        await connection.execute(
          `INSERT INTO projection_checkpoints
            (id, tenant_id, projection_name, partition_key, last_event_sequence,
             last_occurred_at, checkpoint_updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            checkpoint.id,
            checkpoint.tenantId,
            checkpoint.projectionName,
            checkpoint.partitionKey,
            checkpoint.lastEventSequence ?? null,
            checkpoint.lastOccurredAt ? databaseDate(checkpoint.lastOccurredAt) : null,
            databaseDate(checkpoint.updatedAt)
          ]
        );
        return checkpoint;
      }

      const current = mapProjectionCheckpoint(existing);
      const next = advanceProjectionCheckpoint(current, checkpoint);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE projection_checkpoints
            SET last_event_sequence = ?, last_occurred_at = ?,
                checkpoint_updated_at = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND projection_name = ? AND partition_key = ?
            AND row_version = ?`,
        [
          next.lastEventSequence ?? null,
          next.lastOccurredAt ? databaseDate(next.lastOccurredAt) : null,
          databaseDate(next.updatedAt),
          next.tenantId,
          next.projectionName,
          next.partitionKey,
          existing.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Projection Checkpoint update detected.');
      }
      return next;
    });
  }

  private async requireOutbox(
    tenantId: TenantId,
    id: OutboxMessage['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<OutboxMessage> {
    const [rows] = await connection.execute<OutboxRow[]>(
      `SELECT id, tenant_id, aggregate_type, aggregate_id, event_type, payload,
              occurred_at, status, attempts, next_attempt_at, published_at,
              last_error, row_version
         FROM outbox_messages WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Outbox Message not found in tenant.');
    return mapOutbox(row);
  }

  private async requireOutboxForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: OutboxMessage['id']
  ): Promise<OutboxRow> {
    const [rows] = await connection.execute<OutboxRow[]>(
      `SELECT id, tenant_id, aggregate_type, aggregate_id, event_type, payload,
              occurred_at, status, attempts, next_attempt_at, published_at,
              last_error, row_version
         FROM outbox_messages WHERE tenant_id = ? AND id = ?
         FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Outbox Message not found in tenant.');
    return row;
  }

  private async requireIntegrationJobForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: IntegrationJob['id']
  ): Promise<IntegrationJobRow> {
    const [rows] = await connection.execute<IntegrationJobRow[]>(
      `SELECT id, tenant_id, job_type, source_system, target_system,
              requested_by_person_id, requested_at, status, started_at,
              completed_at, cursor_value, result_reference, error_message, row_version
         FROM integration_jobs WHERE tenant_id = ? AND id = ?
         FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Integration Job not found in tenant.');
    return row;
  }

  private async requireIdempotencyForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    scope: string,
    key: string
  ): Promise<IdempotencyRow> {
    const [rows] = await connection.execute<IdempotencyRow[]>(
      `SELECT id, tenant_id, scope_key, idempotency_key, request_hash, status,
              response_reference, error_message, created_at, expires_at, row_version
         FROM idempotency_records
        WHERE tenant_id = ? AND scope_key = ? AND idempotency_key = ?
        FOR UPDATE`,
      [tenantId, scope, key]
    );
    const row = rows[0];
    if (!row) throw new Error('Idempotency Record not found.');
    return row;
  }

  private async requireExternalIdentity(
    tenantId: TenantId,
    id: ExternalIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<ExternalIdentity> {
    const [rows] = await connection.execute<ExternalIdentityRow[]>(
      `SELECT id, tenant_id, canonical_object_id, external_system,
              external_object_type, external_object_id, external_version, source_reference
         FROM external_identities WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('External Identity not found in tenant.');
    return mapExternalIdentity(row);
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: CanonicalObjectIdentity['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: Person['id'],
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }
}
