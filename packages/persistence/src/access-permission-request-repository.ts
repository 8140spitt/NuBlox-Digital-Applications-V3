import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type AccessPermissionRequest,
  type AccessPermissionRequestStatus,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface RequestRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  requestor_person_id: string;
  permission_key: string;
  scope_type: string;
  scope_id: string | null;
  reason: string;
  status: AccessPermissionRequestStatus;
  requested_at: Date;
  resolved_by_person_id: string | null;
  resolved_at: Date | null;
  resolution_reason: string | null;
}

interface PendingRequestRow extends RequestRow {
  requestor_name: string;
  permission_name: string;
}

interface CountRow extends RowDataPacket {
  count: number;
}

export interface AccessPermissionRequestView extends AccessPermissionRequest {
  requestorName: string;
  permissionName: string;
}

export class AccessPermissionRequestError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'ALREADY_GRANTED'
      | 'PERMISSION_DENIED'
  ) {
    super(message);
    this.name = 'AccessPermissionRequestError';
  }
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AccessPermissionRequestError('Request date is invalid.', 'INVALID_INPUT');
  }
  return date;
}

function validateScope(scopeType: string, scopeId?: string): { scopeType: string; scopeId?: string } {
  const normalisedType = scopeType.trim().toUpperCase();
  const normalisedId = scopeId?.trim() || undefined;

  if (!normalisedType) {
    throw new AccessPermissionRequestError('Scope type is required.', 'INVALID_INPUT');
  }
  if (normalisedType === 'TENANT' && normalisedId) {
    throw new AccessPermissionRequestError(
      'TENANT scope must not specify a scope ID.',
      'INVALID_INPUT'
    );
  }
  if (normalisedType !== 'TENANT' && !normalisedId) {
    throw new AccessPermissionRequestError(
      'Non-TENANT scope requires a scope ID.',
      'INVALID_INPUT'
    );
  }

  return {
    scopeType: normalisedType,
    ...(normalisedId ? { scopeId: normalisedId } : {})
  };
}

function mapRequest(row: RequestRow): AccessPermissionRequest {
  return {
    id: row.id as AccessPermissionRequest['id'],
    tenantId: row.tenant_id as TenantId,
    requestorPersonId: row.requestor_person_id,
    permissionKey: row.permission_key,
    scopeType: row.scope_type,
    ...(row.scope_id ? { scopeId: row.scope_id } : {}),
    reason: row.reason,
    status: row.status,
    requestedAt: row.requested_at.toISOString(),
    ...(row.resolved_by_person_id ? { resolvedByPersonId: row.resolved_by_person_id } : {}),
    ...(row.resolved_at ? { resolvedAt: row.resolved_at.toISOString() } : {}),
    ...(row.resolution_reason ? { resolutionReason: row.resolution_reason } : {})
  };
}

async function writeAudit(
  connection: PoolConnection,
  request: AccessPermissionRequest,
  action: string,
  actorPersonId: string
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, 'ACCESS_PERMISSION_REQUEST', ?, ?, ?, 'ACCESS-REQUEST', ?)`,
    [
      request.tenantId,
      request.id,
      action,
      actorPersonId,
      JSON.stringify(request)
    ]
  );

  await writeOutboxEvent(connection, {
    tenantId: request.tenantId,
    aggregateType: 'ACCESS_PERMISSION_REQUEST',
    aggregateId: request.id,
    eventType: `ACCESS_PERMISSION_REQUEST.${action}`,
    payload: request
  });
}

export class MySqlAccessPermissionRequestRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async createRequest(
    tenantId: TenantId,
    requestorPersonId: string,
    input: {
      permissionKey: string;
      scopeType?: string;
      scopeId?: string;
      reason: string;
    }
  ): Promise<AccessPermissionRequest> {
    const permissionKey = input.permissionKey.trim();
    const reason = input.reason.trim();
    const scope = validateScope(input.scopeType ?? 'TENANT', input.scopeId);

    if (!permissionKey) {
      throw new AccessPermissionRequestError('Permission is required.', 'INVALID_INPUT');
    }
    if (!reason) {
      throw new AccessPermissionRequestError('A reason for access is required.', 'INVALID_INPUT');
    }

    const [personRows, permissionRows] = await Promise.all([
      this.pool.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM persons
          WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
        [tenantId, requestorPersonId]
      ),
      this.pool.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM permission_definitions WHERE permission_key = ?',
        [permissionKey]
      )
    ]);

    if ((personRows[0][0]?.count ?? 0) !== 1) {
      throw new AccessPermissionRequestError(
        'Requestor Person is not active in the tenant.',
        'NOT_FOUND'
      );
    }
    if ((permissionRows[0][0]?.count ?? 0) !== 1) {
      throw new AccessPermissionRequestError(
        'Permission Definition does not exist.',
        'NOT_FOUND'
      );
    }

    const evaluation = await this.access.evaluatePermission(
      tenantId,
      requestorPersonId,
      permissionKey,
      scope
    );
    if (evaluation.allowed) {
      throw new AccessPermissionRequestError(
        'The requested permission is already effective in this scope.',
        'ALREADY_GRANTED'
      );
    }

    return withTransaction(this.pool, async (connection) => {
      const [existingRows] = await connection.execute<RequestRow[]>(
        `SELECT id, tenant_id, requestor_person_id, permission_key, scope_type, scope_id,
                reason, status, requested_at, resolved_by_person_id, resolved_at,
                resolution_reason
           FROM access_permission_requests
          WHERE tenant_id = ?
            AND requestor_person_id = ?
            AND permission_key = ?
            AND scope_type = ?
            AND ((scope_id IS NULL AND ? IS NULL) OR scope_id = ?)
            AND status = 'PENDING'
          LIMIT 1
          FOR UPDATE`,
        [
          tenantId,
          requestorPersonId,
          permissionKey,
          scope.scopeType,
          scope.scopeId ?? null,
          scope.scopeId ?? null
        ]
      );

      if (existingRows[0]) {
        throw new AccessPermissionRequestError(
          'An equivalent access request is already pending.',
          'CONFLICT'
        );
      }

      const request: AccessPermissionRequest = {
        id: asId<'AccessPermissionRequestId'>(
          `AREQ-${randomUUID()}`,
          'Access Permission Request'
        ),
        tenantId,
        requestorPersonId,
        permissionKey,
        scopeType: scope.scopeType,
        ...(scope.scopeId ? { scopeId: scope.scopeId } : {}),
        reason,
        status: 'PENDING',
        requestedAt: new Date().toISOString()
      };

      await connection.execute(
        `INSERT INTO access_permission_requests
          (id, tenant_id, requestor_person_id, permission_key, scope_type, scope_id,
           reason, status, requested_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          request.id,
          tenantId,
          requestorPersonId,
          permissionKey,
          request.scopeType,
          request.scopeId ?? null,
          request.reason,
          databaseDate(request.requestedAt)
        ]
      );

      await writeAudit(connection, request, 'REQUESTED', requestorPersonId);
      return request;
    });
  }

  async listPending(tenantId: TenantId): Promise<AccessPermissionRequestView[]> {
    const [rows] = await this.pool.execute<PendingRequestRow[]>(
      `SELECT r.id, r.tenant_id, r.requestor_person_id, r.permission_key,
              r.scope_type, r.scope_id, r.reason, r.status, r.requested_at,
              r.resolved_by_person_id, r.resolved_at, r.resolution_reason,
              COALESCE(p.preferred_name, p.legal_name) AS requestor_name,
              pd.name AS permission_name
         FROM access_permission_requests r
         JOIN persons p
           ON p.tenant_id = r.tenant_id
          AND p.id = r.requestor_person_id
         JOIN permission_definitions pd
           ON pd.permission_key = r.permission_key
        WHERE r.tenant_id = ?
          AND r.status = 'PENDING'
        ORDER BY r.requested_at, r.id`,
      [tenantId]
    );

    return rows.map((row) => ({
      ...mapRequest(row),
      requestorName: row.requestor_name,
      permissionName: row.permission_name
    }));
  }

  async resolveRequest(
    tenantId: TenantId,
    resolverPersonId: string,
    requestId: string,
    outcome: 'FULFILLED' | 'REJECTED',
    resolutionReason: string
  ): Promise<AccessPermissionRequest> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      resolverPersonId,
      PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new AccessPermissionRequestError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }

    const reason = resolutionReason.trim();
    if (!reason) {
      throw new AccessPermissionRequestError(
        'A resolution reason is required.',
        'INVALID_INPUT'
      );
    }

    return withTransaction(this.pool, async (connection) => {
      const [rows] = await connection.execute<RequestRow[]>(
        `SELECT id, tenant_id, requestor_person_id, permission_key, scope_type, scope_id,
                reason, status, requested_at, resolved_by_person_id, resolved_at,
                resolution_reason
           FROM access_permission_requests
          WHERE tenant_id = ? AND id = ?
          FOR UPDATE`,
        [tenantId, requestId]
      );
      const row = rows[0];

      if (!row) {
        throw new AccessPermissionRequestError(
          'Access request was not found in the tenant.',
          'NOT_FOUND'
        );
      }
      if (row.status !== 'PENDING') {
        throw new AccessPermissionRequestError(
          'Access request has already been resolved.',
          'CONFLICT'
        );
      }

      const resolvedAt = new Date();
      await connection.execute(
        `UPDATE access_permission_requests
            SET status = ?,
                resolved_by_person_id = ?,
                resolved_at = ?,
                resolution_reason = ?
          WHERE tenant_id = ? AND id = ? AND status = 'PENDING'`,
        [outcome, resolverPersonId, resolvedAt, reason, tenantId, requestId]
      );

      const request: AccessPermissionRequest = {
        ...mapRequest(row),
        status: outcome,
        resolvedByPersonId: resolverPersonId,
        resolvedAt: resolvedAt.toISOString(),
        resolutionReason: reason
      };

      await writeAudit(connection, request, outcome, resolverPersonId);
      return request;
    });
  }
}
