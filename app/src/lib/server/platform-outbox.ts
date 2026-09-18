import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryRows } from '$lib/server/db';

export type OutboxMessage = {
  id: string;
  tenantId: string;
  businessEventId: string;
  topic: string;
  payloadJson: string;
  attempts: number;
};

function now() {
  return new Date().toISOString();
}
function retryAt(attempts: number) {
  const delaySeconds = Math.min(3600, Math.max(5, 5 * 2 ** Math.min(attempts, 9)));
  return new Date(Date.now() + delaySeconds * 1000).toISOString();
}

export async function claimOutboxMessages(workerId: string, limit = 25): Promise<OutboxMessage[]> {
  const cleanWorkerId = workerId.trim();
  if (!cleanWorkerId) throw new Error('Outbox worker ID is required.');
  const batchSize = Math.max(1, Math.min(100, Math.trunc(limit)));

  return dbTransaction(async (connection) => {
    const timestamp = now();
    const rows = await queryRows<RowDataPacket & OutboxMessage>(
      "SELECT id, tenant_id AS tenantId, business_event_id AS businessEventId, topic, payload_json AS payloadJson, attempts FROM outbox_messages WHERE status = 'PENDING' AND available_at <= ? AND (locked_at IS NULL OR locked_at < ?) ORDER BY created_at, id LIMIT " +
        batchSize +
        ' FOR UPDATE SKIP LOCKED',
      [timestamp, new Date(Date.now() - 5 * 60_000).toISOString()],
      connection
    );
    for (const row of rows) {
      await executeMutation(
        "UPDATE outbox_messages SET status = 'PROCESSING', locked_by = ?, locked_at = ?, attempts = attempts + 1 WHERE id = ? AND status = 'PENDING'",
        [cleanWorkerId, timestamp, row.id],
        connection
      );
      row.attempts += 1;
    }
    return rows;
  });
}

export async function markOutboxPublished(messageId: string, workerId: string) {
  const result = await executeMutation(
    "UPDATE outbox_messages SET status = 'PUBLISHED', published_at = ?, locked_by = NULL, locked_at = NULL, last_error = NULL WHERE id = ? AND status = 'PROCESSING' AND locked_by = ?",
    [now(), messageId, workerId]
  );
  if (result.affectedRows !== 1) throw new Error('Outbox message is not owned by this worker.');
}

export async function markOutboxFailed(
  messageId: string,
  workerId: string,
  error: unknown,
  maxAttempts = 10
) {
  const rows = await queryRows<RowDataPacket & { attempts: number }>(
    "SELECT attempts FROM outbox_messages WHERE id = ? AND status = 'PROCESSING' AND locked_by = ?",
    [messageId, workerId]
  );
  const row = rows[0];
  if (!row) throw new Error('Outbox message is not owned by this worker.');
  const message = error instanceof Error ? error.message : String(error);
  if (row.attempts >= maxAttempts) {
    await executeMutation(
      "UPDATE outbox_messages SET status = 'DEAD_LETTER', dead_lettered_at = ?, locked_by = NULL, locked_at = NULL, last_error = ? WHERE id = ? AND locked_by = ?",
      [now(), message.slice(0, 4000), messageId, workerId]
    );
    return 'DEAD_LETTER' as const;
  }
  await executeMutation(
    "UPDATE outbox_messages SET status = 'PENDING', available_at = ?, locked_by = NULL, locked_at = NULL, last_error = ? WHERE id = ? AND locked_by = ?",
    [retryAt(row.attempts), message.slice(0, 4000), messageId, workerId]
  );
  return 'PENDING' as const;
}

export async function publishOutboxBatch(
  workerId: string,
  publish: (message: OutboxMessage) => Promise<void>,
  limit = 25
) {
  const messages = await claimOutboxMessages(workerId, limit);
  const result = { claimed: messages.length, published: 0, failed: 0, deadLettered: 0 };
  for (const message of messages) {
    try {
      await publish(message);
      await markOutboxPublished(message.id, workerId);
      result.published += 1;
    } catch (error) {
      const state = await markOutboxFailed(message.id, workerId, error);
      result.failed += 1;
      if (state === 'DEAD_LETTER') result.deadLettered += 1;
    }
  }
  return result;
}
