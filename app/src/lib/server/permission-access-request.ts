import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne } from '$lib/server/db';
import {
  hasPermission,
  platformPermissions,
  type CommandContext
} from '$lib/server/platform-context';
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type PermissionAccessRequestSubmission = {
  requestId: string | null;
  workItemId: string | null;
  created: boolean;
  alreadyAuthorized: boolean;
};

function now() {
  return new Date().toISOString();
}

function permissionDefinition(permissionKey: string) {
  const clean = permissionKey.trim();
  const definition = platformPermissions.find(([key]) => key === clean);
  if (!definition) throw new Error('The requested permission is not part of the governed catalog.');
  return definition;
}

function governedPath(context: CommandContext, value: string) {
  const clean = value.trim();
  const root = `/${context.tenantSlug}/app`;
  if (!(clean === root || clean.startsWith(root + '/'))) {
    throw new Error('The requested application path is outside the current tenant.');
  }
  if (clean.length > 512) throw new Error('The requested application path is too long.');
  return clean;
}

export async function requestPermissionAccess(
  context: CommandContext,
  input: {
    permissionKey: string;
    requestedPath: string;
  }
): Promise<PermissionAccessRequestSubmission> {
  const [permissionKey, resource, action, description] = permissionDefinition(input.permissionKey);
  if (hasPermission(context, permissionKey)) {
    return {
      requestId: null,
      workItemId: null,
      created: false,
      alreadyAuthorized: true
    };
  }

  const requestedPath = governedPath(context, input.requestedPath);
  const timestamp = now();

  return dbTransaction(async (connection) => {
    const adminRole = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM role_definitions WHERE tenant_id = ? AND role_key = 'tenant-admin' AND status = 'ACTIVE' FOR UPDATE",
      [context.tenantId],
      connection
    );
    if (!adminRole) {
      throw new Error('No active Tenant Administrator role is available to review this request.');
    }

    const existing = await queryOne<RowDataPacket & { requestId: string; workItemId: string }>(
      `SELECT par.id AS requestId, par.work_item_id AS workItemId
         FROM permission_access_requests par
         JOIN work_items wi
           ON wi.id = par.work_item_id
          AND wi.tenant_id = par.tenant_id
        WHERE par.tenant_id = ?
          AND par.requester_party_id = ?
          AND par.permission_key = ?
          AND wi.status IN ('READY', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED')
        ORDER BY par.requested_at DESC
        LIMIT 1`,
      [context.tenantId, context.actorPartyId, permissionKey],
      connection
    );
    if (existing) {
      return {
        requestId: existing.requestId,
        workItemId: existing.workItemId,
        created: false,
        alreadyAuthorized: false
      };
    }

    const requestId = randomUUID();
    const workflowId = randomUUID();
    const workItemId = randomUUID();
    const assignmentId = randomUUID();

    await executeMutation(
      `INSERT INTO workflow_instances
        (id, tenant_id, definition_key, definition_version, subject_type, subject_id, subject_version,
         started_by_party_id, status, version, current_state, started_at, completed_at,
         completion_reason, created_at, updated_at)
       VALUES (?, ?, 'PERMISSION_ACCESS_REQUEST', '1', 'PERMISSION_ACCESS_REQUEST', ?, NULL,
               ?, 'RUNNING', 1, 'REQUESTED', ?, NULL, NULL, ?, ?)`,
      [
        workflowId,
        context.tenantId,
        requestId,
        context.actorPartyId,
        timestamp,
        timestamp,
        timestamp
      ],
      connection
    );

    await executeMutation(
      `INSERT INTO work_items
        (id, tenant_id, workflow_instance_id, work_type, subject_type, subject_id, subject_version,
         title, instructions, status, priority, due_at, version, created_by_party_id,
         completion_note, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, 'ACCESS_REQUEST', 'PERMISSION_ACCESS_REQUEST', ?, NULL,
               ?, ?, 'ASSIGNED', 'NORMAL', NULL, 1, ?, NULL, NULL, ?, ?)`,
      [
        workItemId,
        context.tenantId,
        workflowId,
        requestId,
        `Access request · ${context.actorDisplayName}`,
        `Review role-based access for ${context.actorDisplayName}. Requested permission: ${permissionKey} (${resource} / ${action}) — ${description} Requested area: ${requestedPath}. Grant access through Security & Authority using an appropriate role or role permission, then complete this Work Item with the outcome.`,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );

    await executeMutation(
      `INSERT INTO work_assignments
        (id, tenant_id, workflow_instance_id, work_item_id, assignee_type, assignee_id,
         assigned_by_party_id, assignment_basis, status, valid_from, valid_to, created_at)
       VALUES (?, ?, ?, ?, 'ROLE', ?, ?, ?, 'ACTIVE', ?, NULL, ?)`,
      [
        assignmentId,
        context.tenantId,
        workflowId,
        workItemId,
        adminRole.id,
        context.actorPartyId,
        'Tenant member requested access after a controlled permission denial.',
        timestamp,
        timestamp
      ],
      connection
    );

    await executeMutation(
      `INSERT INTO permission_access_requests
        (id, tenant_id, requester_party_id, requester_user_identity_id, permission_key,
         requested_path, workflow_instance_id, work_item_id, requested_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        context.tenantId,
        context.actorPartyId,
        context.userIdentityId,
        permissionKey,
        requestedPath,
        workflowId,
        workItemId,
        timestamp
      ],
      connection
    );

    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-27-WORKFLOW',
        objectType: 'permission_access_request',
        objectId: requestId,
        action: 'PERMISSION_ACCESS_REQUEST_SUBMITTED',
        toState: 'REQUESTED',
        note: `${permissionKey} · ${requestedPath}`
      },
      connection
    );

    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-27-WORKFLOW',
        aggregateType: 'WorkflowInstance',
        aggregateObjectId: workflowId,
        aggregateVersion: 1,
        eventType: 'PERMISSION_ACCESS_REQUEST_SUBMITTED',
        topic: 'nublox.work.access-request',
        payload: {
          requestId,
          workItemId,
          requesterPartyId: context.actorPartyId,
          permissionKey,
          requestedPath,
          assigneeRoleKey: 'tenant-admin'
        }
      },
      connection
    );

    return {
      requestId,
      workItemId,
      created: true,
      alreadyAuthorized: false
    };
  });
}
