import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual
} from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { AuthPrincipal } from './auth-repository.js';
import { withTransaction } from './database.js';

const TOTP_PERIOD_SECONDS = 30;
const TOTP_DIGITS = 6;
const TOTP_WINDOW = 1;
const MFA_CHALLENGE_TTL_SECONDS = 5 * 60;
const MFA_MAX_ATTEMPTS = 5;
const RECOVERY_CODE_COUNT = 10;

export type MfaErrorCode =
  | 'ALREADY_ENABLED'
  | 'NOT_ENROLLED'
  | 'INVALID_CODE'
  | 'INVALID_CHALLENGE'
  | 'CHALLENGE_EXPIRED'
  | 'TOO_MANY_ATTEMPTS';

export class MfaError extends Error {
  constructor(
    message: string,
    readonly code: MfaErrorCode
  ) {
    super(message);
    this.name = 'MfaError';
  }
}

export interface MfaStatus {
  enabled: boolean;
  verifiedAt: string | null;
  recoveryCodesRemaining: number;
}

export interface MfaEnrollmentStart {
  secret: string;
  otpauthUri: string;
}

export interface MfaLoginStart {
  required: boolean;
  token?: string;
  expiresAt?: string;
}

export interface MfaLoginResult {
  principal: AuthPrincipal;
  returnTo: string;
  method: 'TOTP' | 'RECOVERY_CODE';
}

interface EnrollmentRow extends RowDataPacket {
  id: string;
  user_id: string;
  tenant_id: string;
  secret_ciphertext: string;
  secret_iv: string;
  secret_tag: string;
  status: 'PENDING' | 'ACTIVE' | 'DISABLED';
  verified_at: Date | null;
  last_used_counter: string | number | null;
}

interface MfaStatusRow extends RowDataPacket {
  verified_at: Date | null;
  recovery_codes_remaining: number;
}

interface LoginChallengeRow extends RowDataPacket {
  token_hash: string;
  user_id: string;
  tenant_id: string;
  person_id: string;
  return_to: string;
  expires_at: Date;
  consumed_at: Date | null;
  attempt_count: number;
  enrollment_id: string;
  secret_ciphertext: string;
  secret_iv: string;
  secret_tag: string;
  last_used_counter: string | number | null;
  email: string;
  tenant_slug: string;
  tenant_name: string;
  person_name: string;
}

interface RecoveryCodeRow extends RowDataPacket {
  id: string;
}

function encryptionKey(): Buffer {
  const configured = process.env.NUBLOX_AUTH_ENCRYPTION_KEY?.trim();
  if (configured) {
    const candidate = /^[0-9a-f]{64}$/i.test(configured)
      ? Buffer.from(configured, 'hex')
      : Buffer.from(configured, 'base64url');
    if (candidate.length !== 32) {
      throw new Error('NUBLOX_AUTH_ENCRYPTION_KEY must decode to exactly 32 bytes.');
    }
    return candidate;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NUBLOX_AUTH_ENCRYPTION_KEY is required in production.');
  }

  return createHash('sha256')
    .update('nublox-development-auth-encryption-key-not-for-production')
    .digest();
}

function encryptSecret(secret: string): {
  ciphertext: string;
  iv: string;
  tag: string;
} {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final()
  ]);
  return {
    ciphertext: ciphertext.toString('base64url'),
    iv: iv.toString('base64url'),
    tag: cipher.getAuthTag().toString('base64url')
  };
}

function decryptSecret(row: Pick<EnrollmentRow, 'secret_ciphertext' | 'secret_iv' | 'secret_tag'>): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    encryptionKey(),
    Buffer.from(row.secret_iv, 'base64url')
  );
  decipher.setAuthTag(Buffer.from(row.secret_tag, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(row.secret_ciphertext, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(value: Buffer): string {
  let bits = 0;
  let accumulator = 0;
  let output = '';

  for (const byte of value) {
    accumulator = (accumulator << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(accumulator >>> (bits - 5)) & 31]!;
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(accumulator << (5 - bits)) & 31]!;
  }

  return output;
}

function base32Decode(value: string): Buffer {
  const normalized = value.toUpperCase().replace(/=+$/g, '');
  let bits = 0;
  let accumulator = 0;
  const bytes: number[] = [];

  for (const character of normalized) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error('Invalid Base32 value.');

    accumulator = (accumulator << 5) | index;
    bits += 5;

    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function totpForCounter(secret: string, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac('sha1', base32Decode(secret))
    .update(counterBuffer)
    .digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return String(binary % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

function verifyTotp(
  secret: string,
  codeValue: string,
  lastUsedCounter: number | null
): number | null {
  const code = codeValue.trim();
  if (!/^\d{6}$/.test(code)) return null;

  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD_SECONDS);
  const supplied = Buffer.from(code);

  for (let offset = -TOTP_WINDOW; offset <= TOTP_WINDOW; offset += 1) {
    const counter = currentCounter + offset;
    if (lastUsedCounter !== null && counter <= lastUsedCounter) continue;

    const expected = Buffer.from(totpForCounter(secret, counter));
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
      return counter;
    }
  }

  return null;
}

function normalizeRecoveryCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z2-7]/g, '');
}

function recoveryCodeHash(value: string): string {
  return createHmac('sha256', encryptionKey())
    .update(`recovery:${normalizeRecoveryCode(value)}`)
    .digest('hex');
}

function generateRecoveryCode(): string {
  const compact = base32Encode(randomBytes(10)).slice(0, 16);
  return compact.match(/.{1,4}/g)?.join('-') ?? compact;
}

function challengeHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

async function authEvent(
  connection: PoolConnection,
  input: {
    userId: string;
    tenantId: string;
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
      input.userId,
      input.tenantId,
      input.emailNormalized ?? null,
      input.eventType,
      input.outcome,
      input.metadata ? JSON.stringify(input.metadata) : null
    ]
  );
}

function principalFromChallenge(row: LoginChallengeRow): AuthPrincipal {
  return {
    userId: row.user_id,
    email: row.email,
    tenantId: row.tenant_id,
    tenantSlug: row.tenant_slug,
    tenantName: row.tenant_name,
    personId: row.person_id,
    personName: row.person_name
  };
}

export class MySqlMfaService {
  constructor(private readonly pool: Pool) {}

  async status(principal: AuthPrincipal): Promise<MfaStatus> {
    const [rows] = await this.pool.execute<MfaStatusRow[]>(
      `SELECT e.verified_at,
              SUM(CASE WHEN rc.consumed_at IS NULL THEN 1 ELSE 0 END) AS recovery_codes_remaining
         FROM application_mfa_enrollments e
         LEFT JOIN application_mfa_recovery_codes rc
           ON rc.enrollment_id = e.id
        WHERE e.user_id = ?
          AND e.tenant_id = ?
          AND e.method = 'TOTP'
          AND e.status = 'ACTIVE'
        GROUP BY e.id, e.verified_at
        LIMIT 1`,
      [principal.userId, principal.tenantId]
    );
    const row = rows[0];

    return {
      enabled: Boolean(row),
      verifiedAt: row?.verified_at?.toISOString() ?? null,
      recoveryCodesRemaining: Number(row?.recovery_codes_remaining ?? 0)
    };
  }

  async startEnrollment(principal: AuthPrincipal): Promise<MfaEnrollmentStart> {
    const secret = base32Encode(randomBytes(20));
    const encrypted = encryptSecret(secret);
    const now = new Date();

    await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<EnrollmentRow[]>(
        `SELECT id, user_id, tenant_id, secret_ciphertext, secret_iv, secret_tag,
                status, verified_at, last_used_counter
           FROM application_mfa_enrollments
          WHERE user_id = ?
            AND tenant_id = ?
            AND method = 'TOTP'
          LIMIT 1
          FOR UPDATE`,
        [principal.userId, principal.tenantId]
      );
      const existing = rows[0];

      if (existing?.status === 'ACTIVE') {
        throw new MfaError('Multi-factor authentication is already enabled.', 'ALREADY_ENABLED');
      }

      const enrollmentId = existing?.id ?? `MFA-${randomUUID()}`;
      if (existing) {
        await connection.execute(
          `UPDATE application_mfa_enrollments
              SET secret_ciphertext = ?,
                  secret_iv = ?,
                  secret_tag = ?,
                  status = 'PENDING',
                  created_at = ?,
                  verified_at = NULL,
                  disabled_at = NULL,
                  last_used_at = NULL,
                  last_used_counter = NULL
            WHERE id = ?`,
          [
            encrypted.ciphertext,
            encrypted.iv,
            encrypted.tag,
            now,
            enrollmentId
          ]
        );
        await connection.execute(
          'DELETE FROM application_mfa_recovery_codes WHERE enrollment_id = ?',
          [enrollmentId]
        );
      } else {
        await connection.execute(
          `INSERT INTO application_mfa_enrollments
            (id, user_id, tenant_id, method, secret_ciphertext, secret_iv, secret_tag,
             status, created_at)
           VALUES (?, ?, ?, 'TOTP', ?, ?, ?, 'PENDING', ?)`,
          [
            enrollmentId,
            principal.userId,
            principal.tenantId,
            encrypted.ciphertext,
            encrypted.iv,
            encrypted.tag,
            now
          ]
        );
      }

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: principal.email.toLowerCase(),
        eventType: 'MFA_ENROLLMENT_STARTED',
        outcome: 'SUCCESS'
      });
    });

    const issuer = `NuBlox - ${principal.tenantName}`;
    const label = `${issuer}:${principal.email}`;
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: 'SHA1',
      digits: String(TOTP_DIGITS),
      period: String(TOTP_PERIOD_SECONDS)
    });

    return {
      secret,
      otpauthUri: `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`
    };
  }

  async confirmEnrollment(principal: AuthPrincipal, code: string): Promise<string[]> {
    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<EnrollmentRow[]>(
        `SELECT id, user_id, tenant_id, secret_ciphertext, secret_iv, secret_tag,
                status, verified_at, last_used_counter
           FROM application_mfa_enrollments
          WHERE user_id = ?
            AND tenant_id = ?
            AND method = 'TOTP'
            AND status = 'PENDING'
          LIMIT 1
          FOR UPDATE`,
        [principal.userId, principal.tenantId]
      );
      const enrollment = rows[0];
      if (!enrollment) {
        throw new MfaError('No pending MFA enrollment exists.', 'NOT_ENROLLED');
      }

      const secret = decryptSecret(enrollment);
      const counter = verifyTotp(secret, code, null);
      if (counter === null) {
        throw new MfaError('The authenticator code is not valid.', 'INVALID_CODE');
      }

      const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
      await connection.execute(
        'DELETE FROM application_mfa_recovery_codes WHERE enrollment_id = ?',
        [enrollment.id]
      );

      for (const recoveryCode of recoveryCodes) {
        const normalized = normalizeRecoveryCode(recoveryCode);
        await connection.execute(
          `INSERT INTO application_mfa_recovery_codes
            (id, enrollment_id, code_hash, code_hint, created_at)
           VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6))`,
          [
            `MFARC-${randomUUID()}`,
            enrollment.id,
            recoveryCodeHash(recoveryCode),
            normalized.slice(-4)
          ]
        );
      }

      await connection.execute(
        `UPDATE application_mfa_enrollments
            SET status = 'ACTIVE',
                verified_at = UTC_TIMESTAMP(6),
                last_used_at = NULL,
                last_used_counter = NULL
          WHERE id = ?`,
        [enrollment.id]
      );

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: principal.email.toLowerCase(),
        eventType: 'MFA_ENABLED',
        outcome: 'SUCCESS',
        metadata: { recoveryCodeCount: recoveryCodes.length }
      });

      return recoveryCodes;
    });
  }

  async regenerateRecoveryCodes(principal: AuthPrincipal): Promise<string[]> {
    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<EnrollmentRow[]>(
        `SELECT id, user_id, tenant_id, secret_ciphertext, secret_iv, secret_tag,
                status, verified_at, last_used_counter
           FROM application_mfa_enrollments
          WHERE user_id = ?
            AND tenant_id = ?
            AND method = 'TOTP'
            AND status = 'ACTIVE'
          LIMIT 1
          FOR UPDATE`,
        [principal.userId, principal.tenantId]
      );
      const enrollment = rows[0];
      if (!enrollment) {
        throw new MfaError('Multi-factor authentication is not enabled.', 'NOT_ENROLLED');
      }

      const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
      await connection.execute(
        'DELETE FROM application_mfa_recovery_codes WHERE enrollment_id = ?',
        [enrollment.id]
      );

      for (const recoveryCode of recoveryCodes) {
        const normalized = normalizeRecoveryCode(recoveryCode);
        await connection.execute(
          `INSERT INTO application_mfa_recovery_codes
            (id, enrollment_id, code_hash, code_hint, created_at)
           VALUES (?, ?, ?, ?, UTC_TIMESTAMP(6))`,
          [
            `MFARC-${randomUUID()}`,
            enrollment.id,
            recoveryCodeHash(recoveryCode),
            normalized.slice(-4)
          ]
        );
      }

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: principal.email.toLowerCase(),
        eventType: 'MFA_RECOVERY_CODES_REGENERATED',
        outcome: 'SUCCESS',
        metadata: { recoveryCodeCount: recoveryCodes.length }
      });

      return recoveryCodes;
    });
  }

  async disable(principal: AuthPrincipal): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<EnrollmentRow[]>(
        `SELECT id, user_id, tenant_id, secret_ciphertext, secret_iv, secret_tag,
                status, verified_at, last_used_counter
           FROM application_mfa_enrollments
          WHERE user_id = ?
            AND tenant_id = ?
            AND method = 'TOTP'
            AND status IN ('ACTIVE', 'PENDING')
          LIMIT 1
          FOR UPDATE`,
        [principal.userId, principal.tenantId]
      );
      const enrollment = rows[0];
      if (!enrollment) return;

      await connection.execute(
        `UPDATE application_mfa_enrollments
            SET status = 'DISABLED',
                disabled_at = UTC_TIMESTAMP(6)
          WHERE id = ?`,
        [enrollment.id]
      );
      await connection.execute(
        'DELETE FROM application_mfa_recovery_codes WHERE enrollment_id = ?',
        [enrollment.id]
      );
      await connection.execute(
        `UPDATE application_mfa_login_challenges
            SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND tenant_id = ?
            AND consumed_at IS NULL`,
        [principal.userId, principal.tenantId]
      );

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: principal.email.toLowerCase(),
        eventType: 'MFA_DISABLED',
        outcome: 'SUCCESS'
      });
    });
  }

  async beginLogin(principal: AuthPrincipal, returnTo: string): Promise<MfaLoginStart> {
    const [rows] = await this.pool.execute<Array<RowDataPacket & { id: string }>>(
      `SELECT id
         FROM application_mfa_enrollments
        WHERE user_id = ?
          AND tenant_id = ?
          AND method = 'TOTP'
          AND status = 'ACTIVE'
        LIMIT 1`,
      [principal.userId, principal.tenantId]
    );

    if (!rows[0]) return { required: false };

    const token = randomBytes(32).toString('base64url');
    const tokenHash = challengeHash(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + MFA_CHALLENGE_TTL_SECONDS * 1000);
    const safeReturnTo = returnTo.slice(0, 1024);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `UPDATE application_mfa_login_challenges
            SET consumed_at = COALESCE(consumed_at, UTC_TIMESTAMP(6))
          WHERE user_id = ?
            AND tenant_id = ?
            AND consumed_at IS NULL`,
        [principal.userId, principal.tenantId]
      );

      await connection.execute(
        `INSERT INTO application_mfa_login_challenges
          (token_hash, user_id, tenant_id, person_id, return_to,
           created_at, expires_at, attempt_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          tokenHash,
          principal.userId,
          principal.tenantId,
          principal.personId,
          safeReturnTo,
          now,
          expiresAt
        ]
      );

      await authEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: principal.email.toLowerCase(),
        eventType: 'MFA_LOGIN_CHALLENGE_ISSUED',
        outcome: 'SUCCESS'
      });
    });

    return {
      required: true,
      token,
      expiresAt: expiresAt.toISOString()
    };
  }

  async verifyLoginChallenge(
    tokenValue: string,
    tenantSlug: string,
    codeValue: string
  ): Promise<MfaLoginResult> {
    const token = tokenValue.trim();
    if (token.length < 32 || token.length > 256) {
      throw new MfaError('The MFA challenge is not valid.', 'INVALID_CHALLENGE');
    }

    const result = await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<LoginChallengeRow[]>(
        `SELECT c.token_hash, c.user_id, c.tenant_id, c.person_id, c.return_to,
                c.expires_at, c.consumed_at, c.attempt_count,
                e.id AS enrollment_id, e.secret_ciphertext, e.secret_iv, e.secret_tag,
                e.last_used_counter,
                u.email, t.slug AS tenant_slug, t.name AS tenant_name,
                COALESCE(p.preferred_name, p.legal_name) AS person_name
           FROM application_mfa_login_challenges c
           JOIN application_users u
             ON u.id = c.user_id
            AND u.status = 'ACTIVE'
           JOIN tenants t
             ON t.id = c.tenant_id
            AND t.status = 'ACTIVE'
            AND t.slug = ?
           JOIN persons p
             ON p.tenant_id = c.tenant_id
            AND p.id = c.person_id
            AND p.status = 'ACTIVE'
           JOIN application_mfa_enrollments e
             ON e.user_id = c.user_id
            AND e.tenant_id = c.tenant_id
            AND e.method = 'TOTP'
            AND e.status = 'ACTIVE'
          WHERE c.token_hash = ?
          LIMIT 1
          FOR UPDATE`,
        [tenantSlug, challengeHash(token)]
      );
      const challenge = rows[0];

      if (!challenge || challenge.consumed_at) {
        return { ok: false as const, code: 'INVALID_CHALLENGE' as MfaErrorCode };
      }
      if (challenge.expires_at.getTime() <= Date.now()) {
        return { ok: false as const, code: 'CHALLENGE_EXPIRED' as MfaErrorCode };
      }
      if (Number(challenge.attempt_count) >= MFA_MAX_ATTEMPTS) {
        return { ok: false as const, code: 'TOO_MANY_ATTEMPTS' as MfaErrorCode };
      }

      const code = codeValue.trim();
      let method: 'TOTP' | 'RECOVERY_CODE' | null = null;
      let matchedCounter: number | null = null;
      let recoveryCodeId: string | null = null;

      if (/^\d{6}$/.test(code)) {
        const lastUsedCounter = challenge.last_used_counter === null
          ? null
          : Number(challenge.last_used_counter);
        matchedCounter = verifyTotp(
          decryptSecret(challenge),
          code,
          lastUsedCounter
        );
        if (matchedCounter !== null) method = 'TOTP';
      } else {
        const normalized = normalizeRecoveryCode(code);
        if (normalized.length >= 12) {
          const [recoveryRows] = await connection.execute<RecoveryCodeRow[]>(
            `SELECT id
               FROM application_mfa_recovery_codes
              WHERE enrollment_id = ?
                AND code_hash = ?
                AND consumed_at IS NULL
              LIMIT 1
              FOR UPDATE`,
            [challenge.enrollment_id, recoveryCodeHash(normalized)]
          );
          recoveryCodeId = recoveryRows[0]?.id ?? null;
          if (recoveryCodeId) method = 'RECOVERY_CODE';
        }
      }

      if (!method) {
        const nextAttempts = Number(challenge.attempt_count) + 1;
        await connection.execute(
          `UPDATE application_mfa_login_challenges
              SET attempt_count = ?
            WHERE token_hash = ?`,
          [nextAttempts, challenge.token_hash]
        );
        await authEvent(connection, {
          userId: challenge.user_id,
          tenantId: challenge.tenant_id,
          emailNormalized: challenge.email.toLowerCase(),
          eventType: 'MFA_LOGIN',
          outcome: 'DENIED',
          metadata: { attemptCount: nextAttempts }
        });

        return {
          ok: false as const,
          code: nextAttempts >= MFA_MAX_ATTEMPTS
            ? 'TOO_MANY_ATTEMPTS' as MfaErrorCode
            : 'INVALID_CODE' as MfaErrorCode
        };
      }

      if (method === 'TOTP') {
        await connection.execute(
          `UPDATE application_mfa_enrollments
              SET last_used_at = UTC_TIMESTAMP(6),
                  last_used_counter = ?
            WHERE id = ?`,
          [matchedCounter, challenge.enrollment_id]
        );
      } else if (recoveryCodeId) {
        await connection.execute(
          `UPDATE application_mfa_recovery_codes
              SET consumed_at = UTC_TIMESTAMP(6)
            WHERE id = ?
              AND consumed_at IS NULL`,
          [recoveryCodeId]
        );
        await connection.execute(
          `UPDATE application_mfa_enrollments
              SET last_used_at = UTC_TIMESTAMP(6)
            WHERE id = ?`,
          [challenge.enrollment_id]
        );
      }

      await connection.execute(
        `UPDATE application_mfa_login_challenges
            SET consumed_at = UTC_TIMESTAMP(6)
          WHERE token_hash = ?`,
        [challenge.token_hash]
      );

      await authEvent(connection, {
        userId: challenge.user_id,
        tenantId: challenge.tenant_id,
        emailNormalized: challenge.email.toLowerCase(),
        eventType: 'MFA_LOGIN',
        outcome: 'SUCCESS',
        metadata: { method }
      });

      return {
        ok: true as const,
        principal: principalFromChallenge(challenge),
        returnTo: challenge.return_to,
        method
      };
    });

    if (!result.ok) {
      const messages: Record<MfaErrorCode, string> = {
        ALREADY_ENABLED: 'Multi-factor authentication is already enabled.',
        NOT_ENROLLED: 'Multi-factor authentication is not enrolled.',
        INVALID_CODE: 'The authenticator or recovery code is not valid.',
        INVALID_CHALLENGE: 'The MFA challenge is not valid.',
        CHALLENGE_EXPIRED: 'The MFA challenge has expired. Sign in again.',
        TOO_MANY_ATTEMPTS: 'Too many MFA attempts. Sign in again.'
      };
      throw new MfaError(messages[result.code], result.code);
    }

    return {
      principal: result.principal,
      returnTo: result.returnTo,
      method: result.method
    };
  }
}
