import type { Pool, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';

export interface IdentityEmailMessage {
  messageId: string;
  tenantId: string;
  to: string;
  messageType: 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';
  templateKey: string;
  actionUrl: string;
  data: Record<string, unknown>;
}

export interface IdentityEmailTransport {
  send(message: IdentityEmailMessage): Promise<void>;
}

interface MessageRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  destination: string;
  message_type: IdentityEmailMessage['messageType'];
  template_key: string;
  action_path: string;
  payload: string | Record<string, unknown> | null;
  attempt_count: number;
}

function objectPayload(value: MessageRow['payload']): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function publicOrigin(value: string | undefined): string {
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NUBLOX_PUBLIC_ORIGIN is required in production.');
    }
    return 'http://localhost:5173';
  }

  const url = new URL(value);
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('NUBLOX_PUBLIC_ORIGIN must be an origin only.');
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error('NUBLOX_PUBLIC_ORIGIN must use HTTPS in production.');
  }
  return url.origin;
}

export class HttpIdentityEmailTransport implements IdentityEmailTransport {
  constructor(
    private readonly endpoint: string,
    private readonly bearerToken?: string
  ) {
    const url = new URL(endpoint);
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('Identity email webhook must use HTTPS in production.');
    }
  }

  async send(message: IdentityEmailMessage): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.bearerToken ? { authorization: `Bearer ${this.bearerToken}` } : {})
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      throw new Error(`Identity email transport returned HTTP ${response.status}.`);
    }
  }
}

export class ConsoleIdentityEmailTransport implements IdentityEmailTransport {
  async send(message: IdentityEmailMessage): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Console identity email transport is forbidden in production.');
    }
    console.log(
      JSON.stringify({
        kind: 'NUBLOX_IDENTITY_EMAIL',
        to: message.to,
        templateKey: message.templateKey,
        actionUrl: message.actionUrl
      })
    );
  }
}

export function identityEmailTransportFromEnv(): IdentityEmailTransport {
  const webhook = process.env.NUBLOX_IDENTITY_EMAIL_WEBHOOK_URL?.trim();
  if (webhook) {
    return new HttpIdentityEmailTransport(
      webhook,
      process.env.NUBLOX_IDENTITY_EMAIL_WEBHOOK_TOKEN?.trim() || undefined
    );
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.NUBLOX_IDENTITY_EMAIL_CONSOLE === 'true'
  ) {
    return new ConsoleIdentityEmailTransport();
  }

  throw new Error(
    'Identity email delivery is not configured. Set NUBLOX_IDENTITY_EMAIL_WEBHOOK_URL, or enable NUBLOX_IDENTITY_EMAIL_CONSOLE=true for local development.'
  );
}

export interface IdentityMessageDispatchResult {
  claimed: number;
  sent: number;
  failed: number;
}

export class MySqlIdentityMessageDispatcher {
  constructor(
    private readonly pool: Pool,
    private readonly transport: IdentityEmailTransport,
    private readonly origin = publicOrigin(process.env.NUBLOX_PUBLIC_ORIGIN)
  ) {}

  async dispatchBatch(limit = 25): Promise<IdentityMessageDispatchResult> {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));

    const messages = await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `UPDATE application_identity_message_outbox
            SET status = 'FAILED',
                failure_message = 'Delivery claim expired before completion.',
                failed_at = UTC_TIMESTAMP(6),
                next_attempt_at = UTC_TIMESTAMP(6)
          WHERE status = 'SENDING'
            AND last_attempt_at < DATE_SUB(UTC_TIMESTAMP(6), INTERVAL 10 MINUTE)`
      );

      const [rows] = await connection.query<MessageRow[]>(
        `SELECT id, tenant_id, destination, message_type, template_key,
                action_path, payload, attempt_count
           FROM application_identity_message_outbox
          WHERE status IN ('QUEUED', 'FAILED')
            AND attempt_count < 5
            AND (next_attempt_at IS NULL OR next_attempt_at <= UTC_TIMESTAMP(6))
          ORDER BY queued_at, id
          LIMIT ${safeLimit}
          FOR UPDATE SKIP LOCKED`
      );

      for (const row of rows) {
        await connection.execute(
          `UPDATE application_identity_message_outbox
              SET status = 'SENDING',
                  attempt_count = attempt_count + 1,
                  last_attempt_at = UTC_TIMESTAMP(6),
                  failure_message = NULL
            WHERE id = ?`,
          [row.id]
        );
      }

      return rows;
    });

    let sent = 0;
    let failed = 0;

    for (const row of messages) {
      try {
        const actionUrl = new URL(row.action_path, this.origin).toString();
        await this.transport.send({
          messageId: row.id,
          tenantId: row.tenant_id,
          to: row.destination,
          messageType: row.message_type,
          templateKey: row.template_key,
          actionUrl,
          data: objectPayload(row.payload)
        });

        await this.pool.execute(
          `UPDATE application_identity_message_outbox
              SET status = 'SENT',
                  sent_at = UTC_TIMESTAMP(6),
                  next_attempt_at = NULL,
                  action_path = '',
                  secret_purged_at = UTC_TIMESTAMP(6)
            WHERE id = ?
              AND status = 'SENDING'`,
          [row.id]
        );
        sent += 1;
      } catch (error) {
        const attempt = Number(row.attempt_count) + 1;
        const retrySeconds = Math.min(3600, 30 * (2 ** Math.max(0, attempt - 1)));
        const failureMessage =
          error instanceof Error ? error.message.slice(0, 1000) : 'Identity email delivery failed.';

        await this.pool.execute(
          `UPDATE application_identity_message_outbox
              SET status = 'FAILED',
                  failed_at = UTC_TIMESTAMP(6),
                  failure_message = ?,
                  next_attempt_at = CASE
                    WHEN attempt_count < 5
                    THEN DATE_ADD(UTC_TIMESTAMP(6), INTERVAL ? SECOND)
                    ELSE NULL
                  END
            WHERE id = ?
              AND status = 'SENDING'`,
          [failureMessage, retrySeconds, row.id]
        );
        failed += 1;
      }
    }

    return {
      claimed: messages.length,
      sent,
      failed
    };
  }
}
