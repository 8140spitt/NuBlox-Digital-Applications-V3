import { randomUUID } from 'node:crypto';
import {
  asId,
  createOutboxMessage,
  type OutboxMessage,
  type TenantId
} from '@nublox/kernel';
import type { PoolConnection } from 'mysql2/promise';

export interface OutboxEventInput {
  tenantId: TenantId | string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: unknown;
  occurredAt?: string;
}

function databaseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }

  return date;
}

export async function writeOutboxEvent(
  connection: PoolConnection,
  input: OutboxEventInput
): Promise<OutboxMessage> {
  const tenantId = input.tenantId as TenantId;
  const message = createOutboxMessage({
    id: asId<'OutboxMessageId'>(randomUUID(), 'Outbox Message'),
    tenantId,
    aggregateType: input.aggregateType,
    aggregateId: input.aggregateId,
    eventType: input.eventType,
    payload:
      typeof input.payload === 'object' &&
      input.payload !== null &&
      !Array.isArray(input.payload)
        ? (input.payload as Readonly<Record<string, unknown>>)
        : { value: input.payload },
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    status: 'PENDING',
    attempts: 0
  });

  await connection.execute(
    `INSERT INTO outbox_messages
      (id, tenant_id, aggregate_type, aggregate_id, event_type, payload,
       occurred_at, status, attempts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      message.id,
      message.tenantId,
      message.aggregateType,
      message.aggregateId,
      message.eventType,
      JSON.stringify(message.payload),
      databaseDate(message.occurredAt),
      message.status,
      message.attempts
    ]
  );

  return message;
}
