import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

export type TenantMfaRequirement = 'OPTIONAL' | 'REQUIRED';

export interface TenantAuthenticationPolicy {
  tenantId: string;
  mfaRequirement: TenantMfaRequirement;
  sessionTtlMinutes: number;
  idleTimeoutMinutes: number;
  maxActiveSessions: number;
  rowVersion: number;
}

export interface TenantMfaCoverage {
  activeIdentities: number;
  enrolledIdentities: number;
}

interface PolicyRow extends RowDataPacket {
  tenant_id: string;
  mfa_requirement: TenantMfaRequirement;
  session_ttl_minutes: number;
  idle_timeout_minutes: number;
  max_active_sessions: number;
  row_version: number;
}

interface PolicySessionRow extends RowDataPacket {
  id: string;
  user_id: string;
  authentication_strength: 'PASSWORD' | 'MFA';
  created_at: Date;
  last_seen_at: Date;
  expires_at: Date;
}

export class TenantAuthenticationPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TenantAuthenticationPolicyError';
  }
}

function mapPolicy(row: PolicyRow): TenantAuthenticationPolicy {
  return {
    tenantId: row.tenant_id,
    mfaRequirement: row.mfa_requirement,
    sessionTtlMinutes: Number(row.session_ttl_minutes),
    idleTimeoutMinutes: Number(row.idle_timeout_minutes),
    maxActiveSessions: Number(row.max_active_sessions),
    rowVersion: Number(row.row_version)
  };
}

function validatePolicy(input: Omit<TenantAuthenticationPolicy, 'tenantId' | 'rowVersion'>): void {
  if (input.mfaRequirement !== 'OPTIONAL' && input.mfaRequirement !== 'REQUIRED') {
    throw new TenantAuthenticationPolicyError('MFA requirement is not valid.');
  }
  if (!Number.isInteger(input.sessionTtlMinutes) || input.sessionTtlMinutes < 15 || input.sessionTtlMinutes > 1440) {
    throw new TenantAuthenticationPolicyError('Session lifetime must be between 15 and 1440 minutes.');
  }
  if (!Number.isInteger(input.idleTimeoutMinutes) || input.idleTimeoutMinutes < 5 || input.idleTimeoutMinutes > 720) {
    throw new TenantAuthenticationPolicyError('Idle timeout must be between 5 and 720 minutes.');
  }
  if (input.idleTimeoutMinutes > input.sessionTtlMinutes) {
    throw new TenantAuthenticationPolicyError('Idle timeout cannot exceed the total session lifetime.');
  }
  if (!Number.isInteger(input.maxActiveSessions) || input.maxActiveSessions < 1 || input.maxActiveSessions > 20) {
    throw new TenantAuthenticationPolicyError('Maximum active sessions must be between 1 and 20.');
  }
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  actorPersonId: string,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, 'TENANT_AUTHENTICATION_POLICY', ?, 'UPDATED', ?, ?, ?)`,
    [
      tenantId,
      tenantId,
      actorPersonId,
      `AUTH-POLICY:${tenantId}`,
      JSON.stringify(payload)
    ]
  );

  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: 'TENANT_AUTHENTICATION_POLICY',
    aggregateId: tenantId,
    eventType: 'TENANT_AUTHENTICATION_POLICY.UPDATED',
    payload
  });
}

export class MySqlTenantAuthenticationPolicyRepository {
  constructor(private readonly pool: Pool) {}

  async get(tenantId: string): Promise<TenantAuthenticationPolicy> {
    const [rows] = await this.pool.execute<PolicyRow[]>(
      `SELECT tenant_id, mfa_requirement, session_ttl_minutes, idle_timeout_minutes,
              max_active_sessions, row_version
         FROM tenant_authentication_policies
        WHERE tenant_id = ?
        LIMIT 1`,
      [tenantId]
    );
    const row = rows[0];
    if (!row) {
      throw new TenantAuthenticationPolicyError('Tenant authentication policy does not exist.');
    }
    return mapPolicy(row);
  }

  async mfaCoverage(tenantId: string): Promise<TenantMfaCoverage> {
    const [rows] = await this.pool.execute<Array<RowDataPacket & {
      active_identities: number;
      enrolled_identities: number;
    }>>(
      `SELECT
          COUNT(DISTINCT CASE
            WHEN u.status = 'ACTIVE' AND ut.status = 'ACTIVE' THEN ut.user_id
            ELSE NULL
          END) AS active_identities,
          COUNT(DISTINCT CASE
            WHEN u.status = 'ACTIVE'
             AND ut.status = 'ACTIVE'
             AND e.status = 'ACTIVE'
            THEN ut.user_id
            ELSE NULL
          END) AS enrolled_identities
         FROM application_user_tenants ut
         JOIN application_users u ON u.id = ut.user_id
         LEFT JOIN application_mfa_enrollments e
           ON e.user_id = ut.user_id
          AND e.tenant_id = ut.tenant_id
          AND e.method = 'TOTP'
        WHERE ut.tenant_id = ?`,
      [tenantId]
    );
    const row = rows[0];

    return {
      activeIdentities: Number(row?.active_identities ?? 0),
      enrolledIdentities: Number(row?.enrolled_identities ?? 0)
    };
  }

  async update(
    tenantId: string,
    actorPersonId: string,
    input: Omit<TenantAuthenticationPolicy, 'tenantId' | 'rowVersion'>
  ): Promise<TenantAuthenticationPolicy> {
    validatePolicy(input);

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<PolicyRow[]>(
        `SELECT tenant_id, mfa_requirement, session_ttl_minutes, idle_timeout_minutes,
                max_active_sessions, row_version
           FROM tenant_authentication_policies
          WHERE tenant_id = ?
          LIMIT 1
          FOR UPDATE`,
        [tenantId]
      );
      const current = rows[0];
      if (!current) {
        throw new TenantAuthenticationPolicyError('Tenant authentication policy does not exist.');
      }

      await connection.execute(
        `UPDATE tenant_authentication_policies
            SET mfa_requirement = ?,
                session_ttl_minutes = ?,
                idle_timeout_minutes = ?,
                max_active_sessions = ?,
                updated_by_person_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ?`,
        [
          input.mfaRequirement,
          input.sessionTtlMinutes,
          input.idleTimeoutMinutes,
          input.maxActiveSessions,
          actorPersonId,
          tenantId
        ]
      );

      const [sessionRows] = await connection.execute<PolicySessionRow[]>(
        `SELECT id, user_id, authentication_strength, created_at, last_seen_at, expires_at
           FROM application_sessions
          WHERE tenant_id = ?
            AND revoked_at IS NULL
          ORDER BY user_id, last_seen_at DESC, created_at DESC
          FOR UPDATE`,
        [tenantId]
      );

      const now = Date.now();
      const ttlCutoff = now - input.sessionTtlMinutes * 60 * 1000;
      const idleCutoff = now - input.idleTimeoutMinutes * 60 * 1000;
      const retainedByUser = new Map<string, number>();
      const revocations: Array<{ id: string; userId: string; reason: string }> = [];

      for (const session of sessionRows) {
        let reason: string | null = null;

        if (session.expires_at.getTime() <= now) {
          reason = 'EXPIRED';
        } else if (session.created_at.getTime() <= ttlCutoff) {
          reason = 'SESSION_TTL_POLICY';
        } else if (session.last_seen_at.getTime() <= idleCutoff) {
          reason = 'IDLE_TIMEOUT_POLICY';
        } else if (
          input.mfaRequirement === 'REQUIRED' &&
          session.authentication_strength !== 'MFA'
        ) {
          reason = 'MFA_REQUIRED_POLICY';
        }

        const retained = retainedByUser.get(session.user_id) ?? 0;
        if (!reason && retained >= input.maxActiveSessions) {
          reason = 'MAX_ACTIVE_SESSIONS_POLICY';
        }

        if (reason) {
          revocations.push({ id: session.id, userId: session.user_id, reason });
        } else {
          retainedByUser.set(session.user_id, retained + 1);
        }
      }

      for (const revoked of revocations) {
        await connection.execute(
          `UPDATE application_sessions
              SET revoked_at = COALESCE(revoked_at, UTC_TIMESTAMP(6))
            WHERE id = ?`,
          [revoked.id]
        );
        await connection.execute(
          `INSERT INTO application_auth_events
            (user_id, tenant_id, event_type, outcome, metadata)
           VALUES (?, ?, 'SESSION_POLICY_REVOKED', 'SUCCESS', ?)`,
          [
            revoked.userId,
            tenantId,
            JSON.stringify({ sessionId: revoked.id, reason: revoked.reason })
          ]
        );
      }

      const next: TenantAuthenticationPolicy = {
        tenantId,
        ...input,
        rowVersion: Number(current.row_version) + 1
      };
      await writeAudit(connection, tenantId, actorPersonId, {
        ...next,
        revokedSessionCount: revocations.length
      });
      return next;
    });
  }
}
