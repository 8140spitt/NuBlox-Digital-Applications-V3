import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryRows } from '$lib/server/db';

export type OutboxMessage = {
  id: string;
  tenantId: string;
  businessEventId: string;
  topic: string;
  payloadJson: unknown;
  attempts: number;
};

const OUTBOX_LOCK_TIMEOUT_MS = 5 * 60_000;

function now() {
  return new Date().toISOString();
}

function cleanWorkerId(workerId: string) {
  const clean = workerId.trim();
  if (!clean) throw new Error('Outbox worker ID is required.');
  if (clean.length > 191) throw new Error('Outbox worker ID cannot exceed 191 characters.');
  return clean;
}

function retryAt(attempts: number) {
  const exponent = Math.max(0, Math.min(attempts - 1, 9));
  const delaySeconds = Math.min(3600, 5 * 2 ** exponent);
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function claimOutboxMessages(workerId: string, limit = 25): Promise<OutboxMessage[]> {
  const worker = cleanWorkerId(workerId);
  const batchSize = Math.max(1, Math.min(100, Math.trunc(limit)));

  return dbTransaction(async (connection) => {
    const timestamp = now();
    const staleBefore = new Date(Date.now() - OUTBOX_LOCK_TIMEOUT_MS).toISOString();
    const rows = await queryRows<RowDataPacket & OutboxMessage>(
      `SELECT id,
              tenant_id AS tenantId,
              business_event_id AS businessEventId,
              topic,
              payload_json AS payloadJson,
              attempts
         FROM outbox_messages
        WHERE (status = 'PENDING' AND available_at <= ?)
           OR (status = 'PROCESSING' AND locked_at IS NOT NULL AND locked_at < ?)
        ORDER BY created_at, id
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED`,
      [timestamp, staleBefore],
      connection
    );

    const claimed: OutboxMessage[] = [];
    for (const row of rows) {
      const result = await executeMutation(
        `UPDATE outbox_messages
            SET status = 'PROCESSING',
                locked_by = ?,
                locked_at = ?,
                attempts = attempts + 1
          WHERE id = ?
            AND (
              (status = 'PENDING' AND available_at <= ?)
              OR (status = 'PROCESSING' AND locked_at IS NOT NULL AND locked_at < ?)
            )`,
        [worker, timestamp, row.id, timestamp, staleBefore],
        connection
      );
      if (result.affectedRows === 1) {
        row.attempts += 1;
        claimed.push(row);
      }
    }
    return claimed;
  });
}

export async function markOutboxPublished(messageId: string, workerId: string) {
  const worker = cleanWorkerId(workerId);
  const result = await executeMutation(
    `UPDATE outbox_messages
        SET status = 'PUBLISHED',
            published_at = ?,
            locked_by = NULL,
            locked_at = NULL,
            last_error = NULL
      WHERE id = ?
        AND status = 'PROCESSING'
        AND locked_by = ?`,
    [now(), messageId, worker]
  );
  if (result.affectedRows !== 1) throw new Error('Outbox message is not owned by this worker.');
}

export async function markOutboxFailed(
  messageId: string,
  workerId: string,
  error: unknown,
  maxAttempts = 10
) {
  const worker = cleanWorkerId(workerId);
  const allowedAttempts = Math.max(1, Math.trunc(maxAttempts));
  const rows = await queryRows<RowDataPacket & { attempts: number }>(
    "SELECT attempts FROM outbox_messages WHERE id = ? AND status = 'PROCESSING' AND locked_by = ?",
    [messageId, worker]
  );
  const row = rows[0];
  if (!row) throw new Error('Outbox message is not owned by this worker.');

  const message = (error instanceof Error ? error.message : String(error)).slice(0, 4000);
  if (row.attempts >= allowedAttempts) {
    const result = await executeMutation(
      `UPDATE outbox_messages
          SET status = 'DEAD_LETTER',
              dead_lettered_at = ?,
              locked_by = NULL,
              locked_at = NULL,
              last_error = ?
        WHERE id = ?
          AND status = 'PROCESSING'
          AND locked_by = ?`,
      [now(), message, messageId, worker]
    );
    if (result.affectedRows !== 1) throw new Error('Outbox message is not owned by this worker.');
    return 'DEAD_LETTER' as const;
  }

  const result = await executeMutation(
    `UPDATE outbox_messages
        SET status = 'PENDING',
            available_at = ?,
            locked_by = NULL,
            locked_at = NULL,
            last_error = ?
      WHERE id = ?
        AND status = 'PROCESSING'
        AND locked_by = ?`,
    [retryAt(row.attempts), message, messageId, worker]
  );
  if (result.affectedRows !== 1) throw new Error('Outbox message is not owned by this worker.');
  return 'PENDING' as const;
}

export async function publishOutboxBatch(
  workerId: string,
  publish: (message: OutboxMessage) => Promise<void>,
  limit = 25
) {
  const worker = cleanWorkerId(workerId);
  const messages = await claimOutboxMessages(worker, limit);
  const result = { claimed: messages.length, published: 0, failed: 0, deadLettered: 0 };

  for (const message of messages) {
    try {
      await publish(message);
      await markOutboxPublished(message.id, worker);
      result.published += 1;
    } catch (error) {
      const state = await markOutboxFailed(message.id, worker, error);
      result.failed += 1;
      if (state === 'DEAD_LETTER') result.deadLettered += 1;
    }
  }
  return result;
}
