import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { hashPassword } from './auth-repository.js';

export type IdentityChallengePurpose = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET';

export type IdentityChallengeErrorCode =
  | 'INVALID_OR_EXPIRED'
  | 'ALREADY_VERIFIED'
  | 'INVALID_INPUT';

export class IdentityChallengeError extends Error {
  constructor(
    message: string,
    readonly code: IdentityChallengeErrorCode
  ) {
    super(message);
    this.name = 'IdentityChallengeError';
  }
}

export interface QueuedIdentityChallenge {
  challengeId: string;
  messageId: string;
  expiresAt: string;
}

interface ChallengeRow extends RowDataPacket {
  id: string;
  user_id: string;
  tenant_id: string;
  purpose: IdentityChallengePurpose;
  email_normalized: string;
  expires_at: Date;
  consumed_at: Date | null;
  invalidated_at: Date | null;
  email_verified_at: Date | null;
  tenant_slug: string;
  user_status: 'ACTIVE' | 'INACTIVE';
}

interface ResetLookupRow extends RowDataPacket {
  user_id: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  person_name: string;
  email_normalized: string;
  email_verified_at: Date | null;
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function validTokenValue(value: string): string {
  const token = value.trim();
  if (token.length < 32 || token.length > 256) {
    throw new IdentityChallengeError(
      'The authentication challenge is not valid.',
      'INVALID_OR_EXPIRED'
    );
  }
  return token;
}

async function authEvent(
  connection: PoolConnection,
  input: {
    userId?: string;
    tenantId?: string;
    emailNormalized?: string;
    eventType: string;
    outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
    metadata?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  await connection.execute(
    `INSERT INTO application_auth_events
      (user_id, tenant_id, email_normalized, event_type, outcome, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.userId ?? null,
      input.tenantId ?? null,
      input.emailNormalized ?? null,
      input.eventType,
      input.outcome,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
}

export async function queueIdentityChallenge(
  connection: PoolConnection,
  input: {
    userId: string;
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    personName: string;
    emailNormalized: string;
    purpose: IdentityChallengePurpose;
    ttlSeconds?: number;
    requestMetadata?: Record<string, string | number | boolean>;
  }
): Promise<QueuedIdentityChallenge> {
  const ttlSeconds =
    input.ttlSeconds ??
    (input.purpose === 'EMAIL_VERIFICATION' ? 60 * 60 * 24 : 60 * 30);

  if (!Number.isFinite(ttlSeconds) || ttlSeconds < 300) {
    throw new IdentityChallengeError(
      'Authentication challenge expiry is not valid.',
      'INVALID_INPUT'
    );
  }

  const token = randomBytes(32).toString('base64url');
  const challengeId = `AUTHCH-${randomUUID()}`;
  const messageId = `AUTHMSG-${randomUUID()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const actionPath =
    input.purpose === 'EMAIL_VERIFICATION'
      ? `/${input.tenantSlug}/app/auth/verify-email?token=${encodeURIComponent(token)}`
      : `/${input.tenantSlug}/app/auth/reset-password?token=${encodeURIComponent(token)}`;

  await connection.execute(
    `UPDATE application_identity_challenges
        SET invalidated_at = COALESCE(invalidated_at, ?)
      WHERE user_id = ?
        AND tenant_id = ?
        AND purpose = ?
        AND consumed_at IS NULL
        AND invalidated_at IS NULL
        AND expires_at > ?`,
    [now, input.userId, input.tenantId, input.purpose, now]
  );

  await connection.execute(
    `UPDATE application_identity_message_outbox m
      JOIN application_identity_challenges c ON c.id = m.challenge_id
        SET m.status = 'CANCELLED',
            m.action_path = '',
            m.secret_purged_at = COALESCE(m.secret_purged_at, ?)
      WHERE c.user_id = ?
        AND c.tenant_id = ?
        AND c.purpose = ?
        AND c.invalidated_at IS NOT NULL
        AND m.status IN ('QUEUED', 'FAILED', 'SENDING')`,
    [now, input.userId, input.tenantId, input.purpose]
  );

  await connection.execute(
    `INSERT INTO application_identity_challenges
      (id, user_id, tenant_id, purpose, token_hash, email_normalized,
       created_at, expires_at, request_metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      challengeId,
      input.userId,
      input.tenantId,
      input.purpose,
      tokenHash(token),
      input.emailNormalized,
      now,
      expiresAt,
      input.requestMetadata ? JSON.stringify(input.requestMetadata) : null
    ]
  );

  await connection.execute(
    `INSERT INTO application_identity_message_outbox
      (id, challenge_id, user_id, tenant_id, destination, message_type,
       template_key, action_path, payload, status, queued_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'QUEUED', ?)`,
    [
      messageId,
      challengeId,
      input.userId,
      input.tenantId,
      input.emailNormalized,
      input.purpose,
      input.purpose === 'EMAIL_VERIFICATION'
        ? 'tenant-email-verification'
        : 'password-reset',
      actionPath,
      JSON.stringify({
        tenantName: input.tenantName,
        personName: input.personName,
        expiresAt: expiresAt.toISOString()
      }),
      now
    ]
  );

  await authEvent(connection, {
    userId: input.userId,
    tenantId: input.tenantId,
    emailNormalized: input.emailNormalized,
    eventType:
      input.purpose === 'EMAIL_VERIFICATION'
        ? 'EMAIL_VERIFICATION_QUEUED'
        : 'PASSWORD_RESET_QUEUED',
    outcome: 'SUCCESS',
    metadata: { challengeId, messageId }
  });

  return {
    challengeId,
    messageId,
    expiresAt: expiresAt.toISOString()
  };
}

export class MySqlIdentityChallengeService {
  constructor(private readonly pool: Pool) {}

  async verifyEmail(tokenValue: string, tenantSlug: string): Promise<{
    tenantId: string;
    tenantSlug: string;
    email: string;
    alreadyVerified: boolean;
  }> {
    const hash = tokenHash(validTokenValue(tokenValue));

    return withTransaction(this.pool, async (connection) => {
      const challenge = await this.requireActiveChallenge(
        connection,
        hash,
        'EMAIL_VERIFICATION',
        tenantSlug
      );

      if (challenge.email_verified_at) {
        await connection.execute(
          'UPDATE application_identity_challenges SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6)) WHERE id = ?',
          [challenge.id]
        );
        await connection.execute(
          `UPDATE application_identity_message_outbox
              SET status = CASE WHEN status IN ('QUEUED', 'FAILED') THEN 'CANCELLED' ELSE status END,
                  action_path = CASE WHEN status IN ('QUEUED', 'FAILED') THEN '' ELSE action_path END,
                  secret_purged_at = CASE
                    WHEN status IN ('QUEUED', 'FAILED') THEN COALESCE(secret_purged_at, UTC_TIMESTAMP(6))
                    ELSE secret_purged_at
                  END
            WHERE challenge_id = ?`,
          [challenge.id]
        );
        return {
          tenantId: challenge.tenant_id,
          tenantSlug: challenge.tenant_slug,
          email: challenge.email_normalized,
          alreadyVerified: true
        };
      }

      await connection.execute(
        `UPDATE application_users
            SET email_verified_at = UTC_TIMESTAMP(6)
          WHERE id = ?
            AND email_verified_at IS NULL`,
        [challenge.user_id]
      );
      await connection.execute(
        'UPDATE application_identity_challenges SET consumed_at = UTC_TIMESTAMP(6) WHERE id = ?',
        [challenge.id]
      );
      await connection.execute(
        `UPDATE application_identity_message_outbox
            SET status = CASE WHEN status IN ('QUEUED', 'FAILED') THEN 'CANCELLED' ELSE status END,
                action_path = CASE WHEN status IN ('QUEUED', 'FAILED') THEN '' ELSE action_path END,
                secret_purged_at = CASE
                  WHEN status IN ('QUEUED', 'FAILED') THEN COALESCE(secret_purged_at, UTC_TIMESTAMP(6))
                  ELSE secret_purged_at
                END
          WHERE challenge_id = ?`,
        [challenge.id]
      );
      await connection.execute(
        `UPDATE application_identity_challenges
            SET invalidated_at = COALESCE(invalidated_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND purpose = 'EMAIL_VERIFICATION'
            AND id <> ?
            AND consumed_at IS NULL
            AND invalidated_at IS NULL`,
        [challenge.user_id, challenge.id]
      );

      await authEvent(connection, {
        userId: challenge.user_id,
        tenantId: challenge.tenant_id,
        emailNormalized: challenge.email_normalized,
        eventType: 'EMAIL_VERIFIED',
        outcome: 'SUCCESS'
      });

      return {
        tenantId: challenge.tenant_id,
        tenantSlug: challenge.tenant_slug,
        email: challenge.email_normalized,
        alreadyVerified: false
      };
    });
  }

  async resendEmailVerification(emailValue: string, tenantSlug: string): Promise<void> {
    const emailNormalized = normaliseEmail(emailValue);
    if (!emailNormalized.includes('@')) return;

    const [rows] = await this.pool.execute<ResetLookupRow[]>(
      `SELECT u.id AS user_id, ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              COALESCE(p.preferred_name, p.legal_name) AS person_name,
              u.email_normalized, u.email_verified_at
         FROM application_users u
         JOIN application_user_tenants ut
           ON ut.user_id = u.id AND ut.status = 'ACTIVE'
         JOIN tenants t
           ON t.id = ut.tenant_id AND t.status = 'ACTIVE'
         JOIN persons p
           ON p.tenant_id = ut.tenant_id
          AND p.id = ut.person_id
          AND p.status = 'ACTIVE'
        WHERE u.email_normalized = ?
          AND u.status = 'ACTIVE'
          AND t.slug = ?
        LIMIT 1`,
      [emailNormalized, tenantSlug]
    );
    const row = rows[0];
    if (!row || row.email_verified_at) return;

    await withTransaction(this.pool, async (connection) => {
      await queueIdentityChallenge(connection, {
        userId: row.user_id,
        tenantId: row.tenant_id,
        tenantSlug: row.tenant_slug,
        tenantName: row.tenant_name,
        personName: row.person_name,
        emailNormalized: row.email_normalized,
        purpose: 'EMAIL_VERIFICATION'
      });
    });
  }

  async requestPasswordReset(emailValue: string, tenantSlug: string): Promise<void> {
    const emailNormalized = normaliseEmail(emailValue);
    if (!emailNormalized.includes('@')) return;

    const [rows] = await this.pool.execute<ResetLookupRow[]>(
      `SELECT u.id AS user_id, ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              COALESCE(p.preferred_name, p.legal_name) AS person_name,
              u.email_normalized, u.email_verified_at
         FROM application_users u
         JOIN application_user_tenants ut
           ON ut.user_id = u.id AND ut.status = 'ACTIVE'
         JOIN tenants t
           ON t.id = ut.tenant_id AND t.status = 'ACTIVE'
         JOIN persons p
           ON p.tenant_id = ut.tenant_id
          AND p.id = ut.person_id
          AND p.status = 'ACTIVE'
        WHERE u.email_normalized = ?
          AND u.status = 'ACTIVE'
          AND t.slug = ?
        LIMIT 1`,
      [emailNormalized, tenantSlug]
    );
    const row = rows[0];
    if (!row || !row.email_verified_at) return;

    await withTransaction(this.pool, async (connection) => {
      await queueIdentityChallenge(connection, {
        userId: row.user_id,
        tenantId: row.tenant_id,
        tenantSlug: row.tenant_slug,
        tenantName: row.tenant_name,
        personName: row.person_name,
        emailNormalized: row.email_normalized,
        purpose: 'PASSWORD_RESET'
      });
    });
  }

  async resetPassword(tokenValue: string, newPassword: string, tenantSlug: string): Promise<{
    tenantId: string;
    tenantSlug: string;
  }> {
    const hash = tokenHash(validTokenValue(tokenValue));
    const passwordHash = await hashPassword(newPassword);

    return withTransaction(this.pool, async (connection) => {
      const challenge = await this.requireActiveChallenge(
        connection,
        hash,
        'PASSWORD_RESET',
        tenantSlug
      );

      await connection.execute(
        `UPDATE application_users
            SET password_hash = ?,
                password_changed_at = UTC_TIMESTAMP(6)
          WHERE id = ?`,
        [passwordHash, challenge.user_id]
      );
      await connection.execute(
        `UPDATE application_sessions
            SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND revoked_at IS NULL`,
        [challenge.user_id]
      );
      await connection.execute(
        'UPDATE application_identity_challenges SET consumed_at = UTC_TIMESTAMP(6) WHERE id = ?',
        [challenge.id]
      );
      await connection.execute(
        `UPDATE application_identity_message_outbox
            SET status = CASE WHEN status IN ('QUEUED', 'FAILED') THEN 'CANCELLED' ELSE status END,
                action_path = CASE WHEN status IN ('QUEUED', 'FAILED') THEN '' ELSE action_path END,
                secret_purged_at = CASE
                  WHEN status IN ('QUEUED', 'FAILED') THEN COALESCE(secret_purged_at, UTC_TIMESTAMP(6))
                  ELSE secret_purged_at
                END
          WHERE challenge_id = ?`,
        [challenge.id]
      );
      await connection.execute(
        `UPDATE application_identity_challenges
            SET invalidated_at = COALESCE(invalidated_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND purpose = 'PASSWORD_RESET'
            AND id <> ?
            AND consumed_at IS NULL
            AND invalidated_at IS NULL`,
        [challenge.user_id, challenge.id]
      );

      await authEvent(connection, {
        userId: challenge.user_id,
        tenantId: challenge.tenant_id,
        emailNormalized: challenge.email_normalized,
        eventType: 'PASSWORD_RESET',
        outcome: 'SUCCESS'
      });

      return {
        tenantId: challenge.tenant_id,
        tenantSlug: challenge.tenant_slug
      };
    });
  }

  private async requireActiveChallenge(
    connection: PoolConnection,
    hash: string,
    purpose: IdentityChallengePurpose,
    tenantSlug: string
  ): Promise<ChallengeRow> {
    const [rows] = await connection.execute<ChallengeRow[]>(
      `SELECT c.id, c.user_id, c.tenant_id, c.purpose, c.email_normalized,
              c.expires_at, c.consumed_at, c.invalidated_at,
              u.email_verified_at, u.status AS user_status, t.slug AS tenant_slug
         FROM application_identity_challenges c
         JOIN application_users u ON u.id = c.user_id
         JOIN tenants t ON t.id = c.tenant_id AND t.status = 'ACTIVE'
        WHERE c.token_hash = ?
          AND c.purpose = ?
          AND t.slug = ?
        LIMIT 1
        FOR UPDATE`,
      [hash, purpose, tenantSlug]
    );
    const row = rows[0];
    const now = Date.now();

    if (
      !row ||
      row.user_status !== 'ACTIVE' ||
      row.consumed_at ||
      row.invalidated_at ||
      row.expires_at.getTime() <= now
    ) {
      throw new IdentityChallengeError(
        'The authentication challenge is invalid or has expired.',
        'INVALID_OR_EXPIRED'
      );
    }

    return row;
  }
}
