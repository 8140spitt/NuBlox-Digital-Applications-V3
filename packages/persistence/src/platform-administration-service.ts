import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { hashPassword, verifyPassword } from './auth-repository.js';
import { withTransaction } from './database.js';

export type PlatformOperatorRole = 'SUPER_ADMIN' | 'OPERATOR' | 'READ_ONLY';
export type PlatformTenantLifecycleState =
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'DELETION_REQUESTED'
  | 'DELETED';

export interface PlatformOperatorPrincipal {
  operatorId: string;
  email: string;
  displayName: string;
  role: PlatformOperatorRole;
}

export interface PlatformOperatorSession extends PlatformOperatorPrincipal {
  expiresAt: string;
}

export interface PlatformTenantSummary {
  tenantId: string;
  slug: string;
  name: string;
  tenantStatus: 'ACTIVE' | 'INACTIVE';
  lifecycleState: PlatformTenantLifecycleState;
  lifecycleReason: string | null;
  memberCount: number;
  activeSessionCount: number;
  createdAt: string;
  deletionRequestedAt: string | null;
  deletedAt: string | null;
}

export class PlatformAdministrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlatformAdministrationError';
  }
}

export class PlatformAuthenticationError extends Error {
  constructor() {
    super('Invalid platform operator credentials.');
    this.name = 'PlatformAuthenticationError';
  }
}

interface OperatorRow extends RowDataPacket {
  id: string;
  email: string;
  email_normalized: string;
  display_name: string;
  password_hash: string;
  role: PlatformOperatorRole;
  status: 'ACTIVE' | 'INACTIVE';
}

interface OperatorSessionRow extends RowDataPacket {
  id: string;
  email: string;
  display_name: string;
  role: PlatformOperatorRole;
  expires_at: Date;
}

interface TenantSummaryRow extends RowDataPacket {
  tenant_id: string;
  slug: string;
  name: string;
  tenant_status: 'ACTIVE' | 'INACTIVE';
  lifecycle_state: PlatformTenantLifecycleState | null;
  lifecycle_reason: string | null;
  member_count: number;
  active_session_count: number;
  created_at: Date;
  deletion_requested_at: Date | null;
  deleted_at: Date | null;
}

interface TenantControlRow extends RowDataPacket {
  tenant_id: string;
  slug: string;
  tenant_status: 'ACTIVE' | 'INACTIVE';
  lifecycle_state: PlatformTenantLifecycleState | null;
}

function normaliseEmail(value: string): string {
  return value.trim().toLowerCase();
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function requiredReason(value: string): string {
  const reason = value.trim();
  if (reason.length < 8) {
    throw new PlatformAdministrationError('Provide a reason of at least 8 characters.');
  }
  return reason.slice(0, 2000);
}

function requireMutationRole(operator: PlatformOperatorPrincipal): void {
  if (operator.role === 'READ_ONLY') {
    throw new PlatformAdministrationError('Read-only platform operators cannot change Tenant lifecycle.');
  }
}

function requireSuperAdmin(operator: PlatformOperatorPrincipal): void {
  if (operator.role !== 'SUPER_ADMIN') {
    throw new PlatformAdministrationError('Only a NuBlox Super Administrator can finalise Tenant deletion.');
  }
}

async function audit(
  connection: PoolConnection,
  operator: PlatformOperatorPrincipal,
  input: {
    tenantId?: string;
    action: string;
    reason?: string;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  await connection.execute(
    `INSERT INTO platform_operator_audit_entries
      (operator_id, tenant_id, action, reason, payload)
     VALUES (?, ?, ?, ?, ?)`,
    [
      operator.operatorId,
      input.tenantId ?? null,
      input.action,
      input.reason ?? null,
      input.payload ? JSON.stringify(input.payload) : null
    ]
  );
}

export class MySqlPlatformAdministrationService {
  constructor(private readonly pool: Pool) {}

  async bootstrapOperator(input: {
    email: string;
    password: string;
    displayName: string;
    role?: PlatformOperatorRole;
  }): Promise<PlatformOperatorPrincipal> {
    const email = input.email.trim();
    const emailNormalized = normaliseEmail(email);
    const displayName = input.displayName.trim();
    const role = input.role ?? 'SUPER_ADMIN';

    if (!emailNormalized || !emailNormalized.includes('@')) {
      throw new PlatformAdministrationError('A valid platform operator email is required.');
    }
    if (!displayName) {
      throw new PlatformAdministrationError('Platform operator display name is required.');
    }

    const passwordHash = await hashPassword(input.password);

    return withTransaction(this.pool, async (connection) => {
      const [existing] = await connection.execute<OperatorRow[]>(
        `SELECT id, email, email_normalized, display_name, password_hash, role, status
           FROM platform_operators
          WHERE email_normalized = ?
          FOR UPDATE`,
        [emailNormalized]
      );
      if (existing[0]) {
        throw new PlatformAdministrationError('A platform operator already exists for this email address.');
      }

      const operatorId = `PLATFORM-OPERATOR-${randomUUID()}`;
      await connection.execute(
        `INSERT INTO platform_operators
          (id, email, email_normalized, display_name, password_hash, role, status)
         VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE')`,
        [operatorId, email, emailNormalized, displayName, passwordHash, role]
      );

      const principal: PlatformOperatorPrincipal = {
        operatorId,
        email,
        displayName,
        role
      };
      await audit(connection, principal, {
        action: 'PLATFORM_OPERATOR_BOOTSTRAPPED'
      });
      return principal;
    });
  }

  async authenticate(emailValue: string, password: string): Promise<PlatformOperatorPrincipal> {
    const emailNormalized = normaliseEmail(emailValue);
    const [rows] = await this.pool.execute<OperatorRow[]>(
      `SELECT id, email, email_normalized, display_name, password_hash, role, status
         FROM platform_operators
        WHERE email_normalized = ?
        LIMIT 1`,
      [emailNormalized]
    );
    const operator = rows[0];
    if (!operator || operator.status !== 'ACTIVE' || !(await verifyPassword(password, operator.password_hash))) {
      throw new PlatformAuthenticationError();
    }

    const principal: PlatformOperatorPrincipal = {
      operatorId: operator.id,
      email: operator.email,
      displayName: operator.display_name,
      role: operator.role
    };

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        'UPDATE platform_operators SET last_login_at = UTC_TIMESTAMP(6) WHERE id = ?',
        [operator.id]
      );
      await audit(connection, principal, { action: 'PLATFORM_OPERATOR_LOGIN' });
    });

    return principal;
  }

  async createSession(
    operator: PlatformOperatorPrincipal,
    userAgent?: string,
    ttlSeconds = 8 * 60 * 60
  ): Promise<{ token: string; expiresAt: string }> {
    if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 24 * 60 * 60) {
      throw new PlatformAdministrationError('Platform session TTL must be between 1 second and 24 hours.');
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashToken(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    const normalizedUserAgent = userAgent?.trim().slice(0, 512) || null;

    await this.pool.execute(
      `INSERT INTO platform_operator_sessions
        (token_hash, operator_id, created_at, expires_at, last_seen_at, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tokenHash, operator.operatorId, now, expiresAt, now, normalizedUserAgent]
    );

    return { token, expiresAt: expiresAt.toISOString() };
  }

  async resolveSession(token: string): Promise<PlatformOperatorSession | null> {
    const tokenHash = hashToken(token);
    const [rows] = await this.pool.execute<OperatorSessionRow[]>(
      `SELECT o.id, o.email, o.display_name, o.role, s.expires_at
         FROM platform_operator_sessions s
         JOIN platform_operators o
           ON o.id = s.operator_id
          AND o.status = 'ACTIVE'
        WHERE s.token_hash = ?
          AND s.revoked_at IS NULL
          AND s.expires_at > UTC_TIMESTAMP(6)
        LIMIT 1`,
      [tokenHash]
    );
    const row = rows[0];
    if (!row) return null;

    await this.pool.execute(
      'UPDATE platform_operator_sessions SET last_seen_at = UTC_TIMESTAMP(6) WHERE token_hash = ?',
      [tokenHash]
    );

    return {
      operatorId: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role,
      expiresAt: row.expires_at.toISOString()
    };
  }

  async revokeSession(token: string): Promise<void> {
    await this.pool.execute(
      `UPDATE platform_operator_sessions
          SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6))
        WHERE token_hash = ?`,
      [hashToken(token)]
    );
  }

  async listTenants(searchValue = ''): Promise<PlatformTenantSummary[]> {
    const search = searchValue.trim().slice(0, 160);
    const like = `%${search}%`;
    const [rows] = await this.pool.execute<TenantSummaryRow[]>(
      `SELECT t.id AS tenant_id,
              t.slug,
              t.name,
              t.status AS tenant_status,
              c.lifecycle_state,
              c.reason AS lifecycle_reason,
              c.deletion_requested_at,
              c.deleted_at,
              t.created_at,
              (SELECT COUNT(*)
                 FROM application_user_tenants ut
                WHERE ut.tenant_id = t.id
                  AND ut.status = 'ACTIVE') AS member_count,
              (SELECT COUNT(*)
                 FROM application_sessions s
                WHERE s.tenant_id = t.id
                  AND s.revoked_at IS NULL
                  AND s.expires_at > UTC_TIMESTAMP(6)) AS active_session_count
         FROM tenants t
         LEFT JOIN platform_tenant_controls c ON c.tenant_id = t.id
        WHERE (? = '' OR t.name LIKE ? OR t.slug LIKE ? OR t.id LIKE ?)
        ORDER BY t.created_at DESC, t.name
        LIMIT 250`,
      [search, like, like, like]
    );

    return rows.map((row) => ({
      tenantId: row.tenant_id,
      slug: row.slug,
      name: row.name,
      tenantStatus: row.tenant_status,
      lifecycleState:
        row.lifecycle_state ?? (row.tenant_status === 'ACTIVE' ? 'ACTIVE' : 'SUSPENDED'),
      lifecycleReason: row.lifecycle_reason,
      memberCount: Number(row.member_count),
      activeSessionCount: Number(row.active_session_count),
      createdAt: row.created_at.toISOString(),
      deletionRequestedAt: row.deletion_requested_at?.toISOString() ?? null,
      deletedAt: row.deleted_at?.toISOString() ?? null
    }));
  }

  async suspendTenant(
    operator: PlatformOperatorPrincipal,
    tenantId: string,
    reasonValue: string
  ): Promise<void> {
    requireMutationRole(operator);
    const reason = requiredReason(reasonValue);

    await withTransaction(this.pool, async (connection) => {
      const tenant = await this.lockTenant(connection, tenantId);
      if (tenant.lifecycle_state === 'DELETED') {
        throw new PlatformAdministrationError('Deleted Tenants cannot be suspended.');
      }

      await connection.execute(
        `UPDATE tenants SET status = 'INACTIVE', updated_at = UTC_TIMESTAMP(6) WHERE id = ?`,
        [tenantId]
      );
      await connection.execute(
        `INSERT INTO platform_tenant_controls
          (tenant_id, lifecycle_state, reason, deletion_requested_at, deleted_at, updated_by_operator_id)
         VALUES (?, 'SUSPENDED', ?, NULL, NULL, ?)
         ON DUPLICATE KEY UPDATE
           lifecycle_state = 'SUSPENDED',
           reason = VALUES(reason),
           deletion_requested_at = NULL,
           deleted_at = NULL,
           updated_by_operator_id = VALUES(updated_by_operator_id)`,
        [tenantId, reason, operator.operatorId]
      );
      await this.revokeTenantSessions(connection, tenantId);
      await audit(connection, operator, {
        tenantId,
        action: 'TENANT_SUSPENDED',
        reason,
        payload: { slug: tenant.slug }
      });
    });
  }

  async reactivateTenant(
    operator: PlatformOperatorPrincipal,
    tenantId: string,
    reasonValue: string
  ): Promise<void> {
    requireMutationRole(operator);
    const reason = requiredReason(reasonValue);

    await withTransaction(this.pool, async (connection) => {
      const tenant = await this.lockTenant(connection, tenantId);
      if (tenant.lifecycle_state === 'DELETED') {
        throw new PlatformAdministrationError('Deleted Tenants require a governed restore process.');
      }

      await connection.execute(
        `UPDATE tenants SET status = 'ACTIVE', updated_at = UTC_TIMESTAMP(6) WHERE id = ?`,
        [tenantId]
      );
      await connection.execute(
        `INSERT INTO platform_tenant_controls
          (tenant_id, lifecycle_state, reason, deletion_requested_at, deleted_at, updated_by_operator_id)
         VALUES (?, 'ACTIVE', ?, NULL, NULL, ?)
         ON DUPLICATE KEY UPDATE
           lifecycle_state = 'ACTIVE',
           reason = VALUES(reason),
           deletion_requested_at = NULL,
           deleted_at = NULL,
           updated_by_operator_id = VALUES(updated_by_operator_id)`,
        [tenantId, reason, operator.operatorId]
      );
      await audit(connection, operator, {
        tenantId,
        action: 'TENANT_REACTIVATED',
        reason,
        payload: { slug: tenant.slug }
      });
    });
  }

  async requestTenantDeletion(
    operator: PlatformOperatorPrincipal,
    tenantId: string,
    reasonValue: string
  ): Promise<void> {
    requireSuperAdmin(operator);
    const reason = requiredReason(reasonValue);

    await withTransaction(this.pool, async (connection) => {
      const tenant = await this.lockTenant(connection, tenantId);
      if (tenant.lifecycle_state === 'DELETED') {
        throw new PlatformAdministrationError('Tenant is already deleted from service.');
      }

      await connection.execute(
        `UPDATE tenants SET status = 'INACTIVE', updated_at = UTC_TIMESTAMP(6) WHERE id = ?`,
        [tenantId]
      );
      await connection.execute(
        `INSERT INTO platform_tenant_controls
          (tenant_id, lifecycle_state, reason, deletion_requested_at, deleted_at, updated_by_operator_id)
         VALUES (?, 'DELETION_REQUESTED', ?, UTC_TIMESTAMP(6), NULL, ?)
         ON DUPLICATE KEY UPDATE
           lifecycle_state = 'DELETION_REQUESTED',
           reason = VALUES(reason),
           deletion_requested_at = UTC_TIMESTAMP(6),
           deleted_at = NULL,
           updated_by_operator_id = VALUES(updated_by_operator_id)`,
        [tenantId, reason, operator.operatorId]
      );
      await this.revokeTenantSessions(connection, tenantId);
      await audit(connection, operator, {
        tenantId,
        action: 'TENANT_DELETION_REQUESTED',
        reason,
        payload: { slug: tenant.slug }
      });
    });
  }

  async finaliseTenantDeletion(
    operator: PlatformOperatorPrincipal,
    tenantId: string,
    confirmationSlug: string,
    reasonValue: string
  ): Promise<void> {
    requireSuperAdmin(operator);
    const reason = requiredReason(reasonValue);

    await withTransaction(this.pool, async (connection) => {
      const tenant = await this.lockTenant(connection, tenantId);
      if (tenant.lifecycle_state !== 'DELETION_REQUESTED') {
        throw new PlatformAdministrationError('Tenant deletion must be requested before it can be finalised.');
      }
      if (confirmationSlug.trim().toLowerCase() !== tenant.slug.toLowerCase()) {
        throw new PlatformAdministrationError(`Type the Tenant slug exactly: ${tenant.slug}`);
      }

      await connection.execute(
        `UPDATE tenants SET status = 'INACTIVE', updated_at = UTC_TIMESTAMP(6) WHERE id = ?`,
        [tenantId]
      );
      await connection.execute(
        `UPDATE platform_tenant_controls
            SET lifecycle_state = 'DELETED',
                reason = ?,
                deleted_at = UTC_TIMESTAMP(6),
                updated_by_operator_id = ?
          WHERE tenant_id = ?`,
        [reason, operator.operatorId, tenantId]
      );
      await this.revokeTenantSessions(connection, tenantId);
      await audit(connection, operator, {
        tenantId,
        action: 'TENANT_DELETED_FROM_SERVICE',
        reason,
        payload: {
          slug: tenant.slug,
          physicalPurgePerformed: false
        }
      });
    });
  }

  private async lockTenant(connection: PoolConnection, tenantId: string): Promise<TenantControlRow> {
    const [rows] = await connection.execute<TenantControlRow[]>(
      `SELECT t.id AS tenant_id,
              t.slug,
              t.status AS tenant_status,
              c.lifecycle_state
         FROM tenants t
         LEFT JOIN platform_tenant_controls c ON c.tenant_id = t.id
        WHERE t.id = ?
        FOR UPDATE`,
      [tenantId]
    );
    const row = rows[0];
    if (!row) throw new PlatformAdministrationError('Tenant does not exist.');
    return row;
  }

  private async revokeTenantSessions(connection: PoolConnection, tenantId: string): Promise<void> {
    await connection.execute(
      `UPDATE application_sessions
          SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6))
        WHERE tenant_id = ?
          AND revoked_at IS NULL`,
      [tenantId]
    );
  }
}
