import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, type DbExecutor } from '$lib/server/db';
import type { CommandContext } from '$lib/server/platform-context';
import { recordPlatformAudit } from '$lib/server/platform-evidence';

export type EditLease = {
  id: string;
  objectType: string;
  objectId: string;
  leaseToken: string;
  holderIdentityId: string;
  holderPartyId: string;
  holderDisplayName: string;
  workContextId: string | null;
  baseVersion: string | null;
  status: string;
  acquiredAt: string;
  heartbeatAt: string;
  expiresAt: string;
  releasedAt: string | null;
};

export type EditLeaseResult =
  | { acquired: true; lease: EditLease }
  | { acquired: false; lease: EditLease; reason: 'HELD_BY_OTHER_USER' };

export class EditLeaseConflictError extends Error {
  status = 409;
  holderDisplayName?: string;
  expiresAt?: string;

  constructor(message: string, lease?: EditLease) {
    super(message);
    this.name = 'EditLeaseConflictError';
    this.holderDisplayName = lease?.holderDisplayName;
    this.expiresAt = lease?.expiresAt;
  }
}

const leaseSelect =
  'SELECT id,object_type AS objectType,object_id AS objectId,lease_token AS leaseToken,holder_identity_id AS holderIdentityId,holder_party_id AS holderPartyId,holder_display_name AS holderDisplayName,work_context_id AS workContextId,base_version AS baseVersion,status,acquired_at AS acquiredAt,heartbeat_at AS heartbeatAt,expires_at AS expiresAt,released_at AS releasedAt FROM edit_leases';

function now() {
  return new Date().toISOString();
}

function expiry(ttlSeconds: number) {
  const ttl = Math.max(60, Math.min(900, Math.floor(ttlSeconds)));
  return new Date(Date.now() + ttl * 1000).toISOString();
}

function clean(value: string, label: string, max = 191) {
  const result = value.trim();
  if (!result) throw new Error(label + ' is required.');
  if (result.length > max) throw new Error(label + ' is too long.');
  return result;
}

function expired(lease: EditLease, at = now()) {
  return lease.status !== 'ACTIVE' || lease.expiresAt <= at;
}

async function readLease(
  context: CommandContext,
  objectType: string,
  objectId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  return (
    (await queryOne<RowDataPacket & EditLease>(
      leaseSelect +
        ' WHERE tenant_id=? AND object_type=? AND object_id=?' +
        (forUpdate ? ' FOR UPDATE' : ''),
      [
        context.tenantId,
        clean(objectType, 'Edit lease object type', 64).toUpperCase(),
        clean(objectId, 'Edit lease object ID')
      ],
      executor
    )) ?? null
  );
}

export async function getEditLease(
  context: CommandContext,
  objectType: string,
  objectId: string
): Promise<EditLease | null> {
  const lease = await readLease(context, objectType, objectId);
  if (!lease || expired(lease)) return null;
  return lease;
}

export async function getActorEditLease(
  context: CommandContext,
  objectType: string,
  objectId: string
): Promise<EditLease | null> {
  const lease = await getEditLease(context, objectType, objectId);
  return lease?.holderIdentityId === context.userIdentityId ? lease : null;
}

export async function acquireEditLease(
  context: CommandContext,
  input: {
    objectType: string;
    objectId: string;
    workContextId?: string | null;
    baseVersion?: string | number | null;
    ttlSeconds?: number;
  }
): Promise<EditLeaseResult> {
  const objectType = clean(input.objectType, 'Edit lease object type', 64).toUpperCase();
  const objectId = clean(input.objectId, 'Edit lease object ID');
  const timestamp = now();
  const expiresAt = expiry(input.ttlSeconds ?? 180);

  return dbTransaction(async (connection) => {
    const current = await readLease(context, objectType, objectId, connection, true);
    if (
      current &&
      !expired(current, timestamp) &&
      current.holderIdentityId !== context.userIdentityId
    ) {
      return { acquired: false as const, lease: current, reason: 'HELD_BY_OTHER_USER' as const };
    }

    if (input.workContextId) {
      const contextRow = await queryOne<RowDataPacket & { id: string }>(
        'SELECT id FROM work_contexts WHERE id=? AND tenant_id=? AND user_identity_id=?',
        [input.workContextId, context.tenantId, context.userIdentityId],
        connection
      );
      if (!contextRow) throw new Error('Edit lease work context not found.');
    }

    const token =
      current && current.holderIdentityId === context.userIdentityId && !expired(current, timestamp)
        ? current.leaseToken
        : randomUUID();
    const id = current?.id ?? randomUUID();

    if (current) {
      await executeMutation(
        `UPDATE edit_leases
            SET lease_token=?,holder_identity_id=?,holder_party_id=?,holder_display_name=?,
                work_context_id=?,base_version=?,status='ACTIVE',
                acquired_at=CASE WHEN status='ACTIVE' AND holder_identity_id=? AND expires_at>? THEN acquired_at ELSE ? END,
                heartbeat_at=?,expires_at=?,released_at=NULL
          WHERE id=? AND tenant_id=?`,
        [
          token,
          context.userIdentityId,
          context.actorPartyId,
          context.actorDisplayName,
          input.workContextId ?? null,
          input.baseVersion == null ? null : String(input.baseVersion),
          context.userIdentityId,
          timestamp,
          timestamp,
          timestamp,
          expiresAt,
          id,
          context.tenantId
        ],
        connection
      );
    } else {
      await executeMutation(
        `INSERT INTO edit_leases
          (id,tenant_id,object_type,object_id,lease_token,holder_identity_id,holder_party_id,
           holder_display_name,work_context_id,base_version,status,acquired_at,heartbeat_at,
           expires_at,released_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,'ACTIVE',?,?,?,NULL)`,
        [
          id,
          context.tenantId,
          objectType,
          objectId,
          token,
          context.userIdentityId,
          context.actorPartyId,
          context.actorDisplayName,
          input.workContextId ?? null,
          input.baseVersion == null ? null : String(input.baseVersion),
          timestamp,
          timestamp,
          expiresAt
        ],
        connection
      );
    }

    const lease = (await readLease(context, objectType, objectId, connection))!;
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-27-WORKFLOW',
        objectType: 'edit_lease',
        objectId: lease.id,
        action: 'EDIT_LEASE_ACQUIRED',
        toState: 'ACTIVE',
        note: objectType + ':' + objectId
      },
      connection
    );
    return { acquired: true as const, lease };
  });
}

export async function heartbeatEditLease(
  context: CommandContext,
  objectType: string,
  objectId: string,
  leaseToken: string,
  ttlSeconds = 180
) {
  const timestamp = now();
  const result = await executeMutation(
    `UPDATE edit_leases
        SET heartbeat_at=?,expires_at=?
      WHERE tenant_id=? AND object_type=? AND object_id=? AND lease_token=?
        AND holder_identity_id=? AND status='ACTIVE' AND expires_at>?`,
    [
      timestamp,
      expiry(ttlSeconds),
      context.tenantId,
      clean(objectType, 'Edit lease object type', 64).toUpperCase(),
      clean(objectId, 'Edit lease object ID'),
      clean(leaseToken, 'Edit lease token', 36),
      context.userIdentityId,
      timestamp
    ]
  );
  if (result.affectedRows !== 1) {
    throw new EditLeaseConflictError('The edit lease is no longer active. Reload before editing.');
  }
}

export async function assertEditLease(
  context: CommandContext,
  objectType: string,
  objectId: string,
  leaseToken: string,
  executor?: DbExecutor
): Promise<EditLease> {
  const lease = await readLease(context, objectType, objectId, executor);
  if (!lease || expired(lease)) {
    throw new EditLeaseConflictError('No active edit lease exists for this item.');
  }
  if (
    lease.holderIdentityId !== context.userIdentityId ||
    lease.leaseToken !== clean(leaseToken, 'Edit lease token', 36)
  ) {
    throw new EditLeaseConflictError(
      lease.holderIdentityId === context.userIdentityId
        ? 'This edit session no longer owns the current lease.'
        : lease.holderDisplayName + ' is currently editing this item.',
      lease
    );
  }
  return lease;
}

export async function releaseEditLease(
  context: CommandContext,
  objectType: string,
  objectId: string,
  leaseToken: string,
  note = 'Edit session released.'
) {
  return dbTransaction(async (connection) => {
    const lease = await assertEditLease(context, objectType, objectId, leaseToken, connection);
    const releasedAt = now();
    await executeMutation(
      `UPDATE edit_leases
          SET status='RELEASED',released_at=?,expires_at=?,heartbeat_at=?
        WHERE id=? AND tenant_id=? AND lease_token=?`,
      [releasedAt, releasedAt, releasedAt, lease.id, context.tenantId, leaseToken],
      connection
    );
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-27-WORKFLOW',
        objectType: 'edit_lease',
        objectId: lease.id,
        action: 'EDIT_LEASE_RELEASED',
        fromState: 'ACTIVE',
        toState: 'RELEASED',
        note
      },
      connection
    );
  });
}
