import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';

const PASSWORD_SCHEME = 'scrypt';
const PASSWORD_N = 16384;
const PASSWORD_R = 8;
const PASSWORD_P = 1;
const PASSWORD_KEY_LENGTH = 64;
const MINIMUM_PASSWORD_LENGTH = 12;

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  email_normalized: string;
  password_hash: string;
  status: 'ACTIVE' | 'INACTIVE';
  email_verified_at: Date | null;
}

interface MembershipRow extends RowDataPacket {
  user_id: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  person_id: string;
  person_name: string;
  is_default: number | boolean;
}

interface SessionRow extends RowDataPacket {
  user_id: string;
  email: string;
  tenant_id: string;
  tenant_slug: string;
  tenant_name: string;
  person_id: string;
  person_name: string;
  authentication_strength: AuthenticationStrength;
  mfa_verified_at: Date | null;
  expires_at: Date;
}

interface ExistenceRow extends RowDataPacket {
  count: number;
}

export interface AuthPrincipal {
  userId: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  personId: string;
  personName: string;
}

export type AuthenticationStrength = 'PASSWORD' | 'MFA';

export interface AuthSession extends AuthPrincipal {
  authenticationStrength: AuthenticationStrength;
  mfaVerifiedAt: string | null;
  expiresAt: string;
}

export interface CreatedAuthSession {
  token: string;
  session: AuthSession;
}

export interface BootstrapAuthUserInput {
  email: string;
  password: string;
  tenantId: string;
  personId: string;
  makeDefault?: boolean;
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid email or password.');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailVerificationRequiredError extends Error {
  constructor(
    readonly tenantSlug: string,
    readonly tenantName: string
  ) {
    super('Email verification is required before sign in.');
    this.name = 'EmailVerificationRequiredError';
  }
}

export class TenantSelectionRequiredError extends Error {
  readonly tenants: ReadonlyArray<{ tenantId: string; tenantName: string }>;

  constructor(tenants: ReadonlyArray<{ tenantId: string; tenantName: string }>) {
    super('A tenant must be selected for this account.');
    this.name = 'TenantSelectionRequiredError';
    this.tenants = tenants;
  }
}

function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      password,
      salt,
      PASSWORD_KEY_LENGTH,
      { N: PASSWORD_N, r: PASSWORD_R, p: PASSWORD_P, maxmem: 64 * 1024 * 1024 },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      }
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error(`Password must contain at least ${MINIMUM_PASSWORD_LENGTH} characters.`);
  }

  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt);
  return [
    PASSWORD_SCHEME,
    String(PASSWORD_N),
    String(PASSWORD_R),
    String(PASSWORD_P),
    salt.toString('base64url'),
    derived.toString('base64url')
  ].join('$');
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [scheme, n, r, p, saltValue, hashValue, ...rest] = encoded.split('$');

  if (
    scheme !== PASSWORD_SCHEME ||
    rest.length > 0 ||
    !n ||
    !r ||
    !p ||
    !saltValue ||
    !hashValue ||
    Number(n) !== PASSWORD_N ||
    Number(r) !== PASSWORD_R ||
    Number(p) !== PASSWORD_P
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, 'base64url');
    const expected = Buffer.from(hashValue, 'base64url');
    const actual = await derivePassword(password, salt);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

async function writeAuthEvent(
  connection: PoolConnection,
  event: {
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
      event.userId ?? null,
      event.tenantId ?? null,
      event.emailNormalized ?? null,
      event.eventType,
      event.outcome,
      event.metadata ? JSON.stringify(event.metadata) : null
    ]
  );
}

export class MySqlAuthRepository {
  constructor(private readonly pool: Pool) {}

  async bootstrapUser(input: BootstrapAuthUserInput): Promise<AuthPrincipal> {
    const email = input.email.trim();
    const emailNormalized = normaliseEmail(input.email);

    if (!emailNormalized || !emailNormalized.includes('@')) {
      throw new Error('A valid email address is required.');
    }

    const passwordHash = await hashPassword(input.password);

    return withTransaction(this.pool, async (connection) => {
      const [tenantRows] = await connection.query<ExistenceRow[]>(
        `SELECT COUNT(*) AS count
           FROM tenants
          WHERE id = ? AND status = 'ACTIVE'`,
        [input.tenantId]
      );
      if ((tenantRows[0]?.count ?? 0) !== 1) {
        throw new Error('Bootstrap tenant does not exist or is inactive.');
      }

      const [personRows] = await connection.query<ExistenceRow[]>(
        `SELECT COUNT(*) AS count
           FROM persons
          WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
        [input.tenantId, input.personId]
      );
      if ((personRows[0]?.count ?? 0) !== 1) {
        throw new Error('Bootstrap Person does not exist or is inactive in the tenant.');
      }

      const [existingRows] = await connection.query<UserRow[]>(
        'SELECT id, email, email_normalized, password_hash, status, email_verified_at FROM application_users WHERE email_normalized = ? FOR UPDATE',
        [emailNormalized]
      );

      let userId = existingRows[0]?.id;
      if (!userId) {
        userId = `USER-${randomUUID()}`;
        await connection.execute(
          `INSERT INTO application_users
            (id, email, email_normalized, password_hash, status, email_verified_at, password_changed_at)
           VALUES (?, ?, ?, ?, 'ACTIVE', UTC_TIMESTAMP(6), UTC_TIMESTAMP(6))`,
          [userId, email, emailNormalized, passwordHash]
        );
      }

      const [membershipRows] = await connection.query<ExistenceRow[]>(
        'SELECT COUNT(*) AS count FROM application_user_tenants WHERE user_id = ? AND tenant_id = ?',
        [userId, input.tenantId]
      );

      if ((membershipRows[0]?.count ?? 0) === 0) {
        if (input.makeDefault !== false) {
          await connection.execute(
            'UPDATE application_user_tenants SET is_default = FALSE WHERE user_id = ?',
            [userId]
          );
        }

        await connection.execute(
          `INSERT INTO application_user_tenants
            (user_id, tenant_id, person_id, status, is_default)
           VALUES (?, ?, ?, 'ACTIVE', ?)`,
          [userId, input.tenantId, input.personId, input.makeDefault === false ? 0 : 1]
        );
      }

      await writeAuthEvent(connection, {
        userId,
        tenantId: input.tenantId,
        emailNormalized,
        eventType: 'ACCOUNT_BOOTSTRAPPED',
        outcome: 'SUCCESS'
      });

      const principal = await this.principalForMembership(connection, userId, input.tenantId);
      if (!principal) throw new Error('Bootstrapped authentication membership could not be resolved.');
      return principal;
    });
  }

  async authenticate(email: string, password: string, tenantId?: string): Promise<AuthPrincipal> {
    const emailNormalized = normaliseEmail(email);
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT id, email, email_normalized, password_hash, status, email_verified_at
         FROM application_users
        WHERE email_normalized = ?`,
      [emailNormalized]
    );
    const user = rows[0];

    if (!user || user.status !== 'ACTIVE' || !(await verifyPassword(password, user.password_hash))) {
      await withTransaction(this.pool, async (connection) => {
        await writeAuthEvent(connection, {
          ...(user ? { userId: user.id } : {}),
          emailNormalized,
          eventType: 'LOGIN',
          outcome: 'DENIED'
        });
      });
      throw new InvalidCredentialsError();
    }

    const memberships = await this.memberships(user.id);
    if (memberships.length === 0) {
      throw new InvalidCredentialsError();
    }

    let selected = tenantId
      ? memberships.find((membership) => membership.tenantId === tenantId)
      : memberships.find((membership) => membership.isDefault);

    if (!selected && memberships.length === 1) {
      selected = memberships[0];
    }

    if (!selected) {
      throw new TenantSelectionRequiredError(
        memberships.map((membership) => ({
          tenantId: membership.tenantId,
          tenantName: membership.tenantName
        }))
      );
    }

    if (!user.email_verified_at) {
      await withTransaction(this.pool, async (connection) => {
        await writeAuthEvent(connection, {
          userId: user.id,
          tenantId: selected.tenantId,
          emailNormalized,
          eventType: 'LOGIN_EMAIL_UNVERIFIED',
          outcome: 'DENIED'
        });
      });
      throw new EmailVerificationRequiredError(selected.tenantSlug, selected.tenantName);
    }

    return {
      userId: user.id,
      email: user.email,
      tenantId: selected.tenantId,
      tenantSlug: selected.tenantSlug,
      tenantName: selected.tenantName,
      personId: selected.personId,
      personName: selected.personName
    };
  }

  async createSession(
    principal: AuthPrincipal,
    ttlSeconds = 60 * 60 * 12,
    authenticationStrength: AuthenticationStrength = 'PASSWORD'
  ): Promise<CreatedAuthSession> {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('Session TTL must be positive.');
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashSessionToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO application_sessions
          (token_hash, user_id, tenant_id, person_id, authentication_strength, mfa_verified_at,
           created_at, expires_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          tokenHash,
          principal.userId,
          principal.tenantId,
          principal.personId,
          authenticationStrength,
          authenticationStrength === 'MFA' ? now : null,
          now,
          expiresAt,
          now
        ]
      );
      await connection.execute(
        'UPDATE application_users SET last_login_at = ? WHERE id = ?',
        [now, principal.userId]
      );
      await writeAuthEvent(connection, {
        userId: principal.userId,
        tenantId: principal.tenantId,
        emailNormalized: normaliseEmail(principal.email),
        eventType: 'SESSION_CREATED',
        outcome: 'SUCCESS',
        metadata: { authenticationStrength }
      });
    });

    return {
      token,
      session: {
        ...principal,
        authenticationStrength,
        mfaVerifiedAt: authenticationStrength === 'MFA' ? now.toISOString() : null,
        expiresAt: expiresAt.toISOString()
      }
    };
  }

  async resolveSession(token: string): Promise<AuthSession | null> {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const [rows] = await this.pool.query<SessionRow[]>(
      `SELECT s.user_id, u.email, s.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              s.person_id, COALESCE(p.preferred_name, p.legal_name) AS person_name,
              s.authentication_strength, s.mfa_verified_at, s.expires_at
         FROM application_sessions s
         JOIN application_users u ON u.id = s.user_id AND u.status = 'ACTIVE'
         JOIN application_user_tenants ut
           ON ut.user_id = s.user_id
          AND ut.tenant_id = s.tenant_id
          AND ut.person_id = s.person_id
          AND ut.status = 'ACTIVE'
         JOIN tenants t ON t.id = s.tenant_id AND t.status = 'ACTIVE'
         JOIN persons p ON p.tenant_id = s.tenant_id AND p.id = s.person_id AND p.status = 'ACTIVE'
        WHERE s.token_hash = ?
          AND s.revoked_at IS NULL
          AND s.expires_at > UTC_TIMESTAMP(6)`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) return null;

    await this.pool.execute(
      'UPDATE application_sessions SET last_seen_at = UTC_TIMESTAMP(6) WHERE token_hash = ?',
      [tokenHash]
    );

    return {
      userId: row.user_id,
      email: row.email,
      tenantId: row.tenant_id,
      tenantSlug: row.tenant_slug,
      tenantName: row.tenant_name,
      personId: row.person_id,
      personName: row.person_name,
      authenticationStrength: row.authentication_strength,
      mfaVerifiedAt: row.mfa_verified_at?.toISOString() ?? null,
      expiresAt: row.expires_at.toISOString()
    };
  }

  async markSessionMfaVerified(token: string): Promise<void> {
    if (!token) return;

    const tokenHash = hashSessionToken(token);
    await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<Array<RowDataPacket & { user_id: string; tenant_id: string }>>(
        `SELECT user_id, tenant_id
           FROM application_sessions
          WHERE token_hash = ?
            AND revoked_at IS NULL
            AND expires_at > UTC_TIMESTAMP(6)
          LIMIT 1
          FOR UPDATE`,
        [tokenHash]
      );
      const session = rows[0];
      if (!session) return;

      await connection.execute(
        `UPDATE application_sessions
            SET authentication_strength = 'MFA',
                mfa_verified_at = UTC_TIMESTAMP(6)
          WHERE token_hash = ?`,
        [tokenHash]
      );

      await writeAuthEvent(connection, {
        userId: session.user_id,
        tenantId: session.tenant_id,
        eventType: 'SESSION_MFA_VERIFIED',
        outcome: 'SUCCESS'
      });
    });
  }

  async revokeSession(token: string): Promise<void> {
    if (!token) return;

    const tokenHash = hashSessionToken(token);
    await withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.query<Array<RowDataPacket & { user_id: string; tenant_id: string }>>(
        'SELECT user_id, tenant_id FROM application_sessions WHERE token_hash = ? FOR UPDATE',
        [tokenHash]
      );
      const session = rows[0];

      await connection.execute(
        'UPDATE application_sessions SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6)) WHERE token_hash = ?',
        [tokenHash]
      );

      if (session) {
        await writeAuthEvent(connection, {
          userId: session.user_id,
          tenantId: session.tenant_id,
          eventType: 'SESSION_REVOKED',
          outcome: 'SUCCESS'
        });
      }
    });
  }

  async deleteExpiredSessions(): Promise<number> {
    const [result] = await this.pool.execute<import('mysql2/promise').ResultSetHeader>(
      `DELETE FROM application_sessions
        WHERE expires_at <= UTC_TIMESTAMP(6)
           OR (revoked_at IS NOT NULL AND revoked_at < UTC_TIMESTAMP(6) - INTERVAL 7 DAY)`
    );
    return result.affectedRows;
  }

  private async memberships(userId: string): Promise<Array<{
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    personId: string;
    personName: string;
    isDefault: boolean;
  }>> {
    const [rows] = await this.pool.query<MembershipRow[]>(
      `SELECT ut.user_id, ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name, ut.person_id,
              COALESCE(p.preferred_name, p.legal_name) AS person_name, ut.is_default
         FROM application_user_tenants ut
         JOIN tenants t ON t.id = ut.tenant_id AND t.status = 'ACTIVE'
         JOIN persons p ON p.tenant_id = ut.tenant_id AND p.id = ut.person_id AND p.status = 'ACTIVE'
        WHERE ut.user_id = ? AND ut.status = 'ACTIVE'
        ORDER BY ut.is_default DESC, t.name ASC`,
      [userId]
    );

    return rows.map((row) => ({
      tenantId: row.tenant_id,
      tenantSlug: row.tenant_slug,
      tenantName: row.tenant_name,
      personId: row.person_id,
      personName: row.person_name,
      isDefault: Boolean(row.is_default)
    }));
  }

  private async principalForMembership(
    connection: PoolConnection,
    userId: string,
    tenantId: string
  ): Promise<AuthPrincipal | null> {
    const [rows] = await connection.query<Array<RowDataPacket & {
      user_id: string;
      email: string;
      tenant_id: string;
      tenant_slug: string;
      tenant_name: string;
      person_id: string;
      person_name: string;
    }>>(
      `SELECT u.id AS user_id, u.email, ut.tenant_id, t.slug AS tenant_slug, t.name AS tenant_name,
              ut.person_id, COALESCE(p.preferred_name, p.legal_name) AS person_name
         FROM application_users u
         JOIN application_user_tenants ut ON ut.user_id = u.id AND ut.status = 'ACTIVE'
         JOIN tenants t ON t.id = ut.tenant_id AND t.status = 'ACTIVE'
         JOIN persons p ON p.tenant_id = ut.tenant_id AND p.id = ut.person_id AND p.status = 'ACTIVE'
        WHERE u.id = ? AND ut.tenant_id = ? AND u.status = 'ACTIVE'`,
      [userId, tenantId]
    );
    const row = rows[0];
    if (!row) return null;

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
}
