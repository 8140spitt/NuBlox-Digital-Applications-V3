import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import {
  dbTransaction,
  executeMutation,
  queryOne,
  queryRows,
  type DbExecutor
} from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';

export type WorkContext = {
  id: string;
  contextKey: string;
  contextType: string;
  objectType: string;
  objectId: string;
  objectVersion: string | null;
  title: string;
  subtitle: string | null;
  routePath: string;
  workspaceFunctionId: string | null;
  status: string;
  position: number;
  openedAt: string;
  lastAccessedAt: string;
};

export type WorkDraft = {
  id: string;
  workContextId: string;
  formKey: string;
  baseVersion: string | null;
  payload: Record<string, unknown>;
  draftVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  appliedAt: string | null;
  discardedAt: string | null;
};

const contextSelect =
  'SELECT id,context_key AS contextKey,context_type AS contextType,object_type AS objectType,object_id AS objectId,object_version AS objectVersion,title,subtitle,route_path AS routePath,workspace_function_id AS workspaceFunctionId,status,position,opened_at AS openedAt,last_accessed_at AS lastAccessedAt FROM work_contexts';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string, max = 500) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  if (clean.length > max) throw new Error(label + ' is too long.');
  return clean;
}

function contextKey(value: string) {
  const clean = required(value, 'Work context key', 191);
  if (!/^[A-Za-z0-9._:/-]+$/.test(clean)) {
    throw new Error('Work context key contains unsupported characters.');
  }
  return clean;
}

function routePath(context: CommandContext, value: string) {
  const clean = required(value, 'Work context route', 1000);
  const prefix = '/' + context.tenantSlug + '/app';
  if (!(clean === prefix || clean.startsWith(prefix + '/'))) {
    throw new Error('Work context route must remain inside the current tenant application.');
  }
  return clean;
}

export async function listOpenWorkContexts(context: CommandContext): Promise<WorkContext[]> {
  assertPermission(context, 'work.context.read');
  return queryRows<RowDataPacket & WorkContext>(
    contextSelect +
      " WHERE tenant_id=? AND user_identity_id=? AND status='OPEN' ORDER BY position,last_accessed_at,id",
    [context.tenantId, context.userIdentityId]
  );
}

export async function getWorkContext(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
): Promise<WorkContext> {
  assertPermission(context, 'work.context.read');
  const row = await queryOne<RowDataPacket & WorkContext>(
    contextSelect + ' WHERE id=? AND tenant_id=? AND user_identity_id=?',
    [id, context.tenantId, context.userIdentityId],
    executor
  );
  if (!row) throw new Error('Work context not found.');
  return row;
}

export async function findWorkContext(
  context: CommandContext,
  key: string,
  executor?: DbExecutor
): Promise<WorkContext | null> {
  assertPermission(context, 'work.context.read');
  return (
    (await queryOne<RowDataPacket & WorkContext>(
      contextSelect + ' WHERE tenant_id=? AND user_identity_id=? AND context_key=?',
      [context.tenantId, context.userIdentityId, contextKey(key)],
      executor
    )) ?? null
  );
}

export async function openWorkContext(
  context: CommandContext,
  input: {
    contextKey: string;
    contextType?: string;
    objectType: string;
    objectId: string;
    objectVersion?: string | number | null;
    title: string;
    subtitle?: string | null;
    routePath: string;
    workspaceFunctionId?: string | null;
  }
): Promise<WorkContext> {
  assertPermission(context, 'work.context.manage');
  const key = contextKey(input.contextKey);
  const openedAt = now();
  return dbTransaction(async (connection) => {
    const existing = await queryOne<RowDataPacket & { id: string; status: string }>(
      'SELECT id,status FROM work_contexts WHERE tenant_id=? AND user_identity_id=? AND context_key=? FOR UPDATE',
      [context.tenantId, context.userIdentityId, key],
      connection
    );
    const max = await queryOne<RowDataPacket & { maxPosition: number | null }>(
      "SELECT MAX(position) AS maxPosition FROM work_contexts WHERE tenant_id=? AND user_identity_id=? AND status='OPEN'",
      [context.tenantId, context.userIdentityId],
      connection
    );
    const position = (max?.maxPosition ?? -1) + 1;
    if (existing) {
      await executeMutation(
        `UPDATE work_contexts
            SET context_type=?,object_type=?,object_id=?,object_version=?,title=?,subtitle=?,route_path=?,
                workspace_function_id=?,status='OPEN',
                position=CASE WHEN status='OPEN' THEN position ELSE ? END,
                last_accessed_at=?,closed_at=NULL
          WHERE id=? AND tenant_id=? AND user_identity_id=?`,
        [
          required(input.contextType ?? 'OBJECT', 'Work context type', 64).toUpperCase(),
          required(input.objectType, 'Work context object type', 64).toUpperCase(),
          required(input.objectId, 'Work context object ID', 191),
          input.objectVersion == null ? null : String(input.objectVersion),
          required(input.title, 'Work context title', 500),
          input.subtitle?.trim() || null,
          routePath(context, input.routePath),
          input.workspaceFunctionId?.trim().toUpperCase() || null,
          position,
          openedAt,
          existing.id,
          context.tenantId,
          context.userIdentityId
        ],
        connection
      );
      return getWorkContext(context, existing.id, connection);
    }

    const id = randomUUID();
    await executeMutation(
      `INSERT INTO work_contexts
        (id,tenant_id,user_identity_id,actor_party_id,context_key,context_type,object_type,object_id,
         object_version,title,subtitle,route_path,workspace_function_id,status,position,opened_at,
         last_accessed_at,closed_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'OPEN',?,?,?,NULL)`,
      [
        id,
        context.tenantId,
        context.userIdentityId,
        context.actorPartyId,
        key,
        required(input.contextType ?? 'OBJECT', 'Work context type', 64).toUpperCase(),
        required(input.objectType, 'Work context object type', 64).toUpperCase(),
        required(input.objectId, 'Work context object ID', 191),
        input.objectVersion == null ? null : String(input.objectVersion),
        required(input.title, 'Work context title', 500),
        input.subtitle?.trim() || null,
        routePath(context, input.routePath),
        input.workspaceFunctionId?.trim().toUpperCase() || null,
        position,
        openedAt,
        openedAt
      ],
      connection
    );
    return getWorkContext(context, id, connection);
  });
}

export async function touchWorkContext(context: CommandContext, id: string) {
  assertPermission(context, 'work.context.manage');
  const result = await executeMutation(
    "UPDATE work_contexts SET last_accessed_at=? WHERE id=? AND tenant_id=? AND user_identity_id=? AND status='OPEN'",
    [now(), id, context.tenantId, context.userIdentityId]
  );
  if (result.affectedRows !== 1) throw new Error('Open work context not found.');
}

export async function closeWorkContext(context: CommandContext, id: string) {
  assertPermission(context, 'work.context.manage');
  const timestamp = now();
  const result = await executeMutation(
    "UPDATE work_contexts SET status='CLOSED',closed_at=?,last_accessed_at=? WHERE id=? AND tenant_id=? AND user_identity_id=? AND status='OPEN'",
    [timestamp, timestamp, id, context.tenantId, context.userIdentityId]
  );
  if (result.affectedRows !== 1) throw new Error('Open work context not found.');
}

export async function reorderWorkContexts(context: CommandContext, orderedIds: string[]) {
  assertPermission(context, 'work.context.manage');
  const unique = [...new Set(orderedIds.map((id) => id.trim()).filter(Boolean))];
  return dbTransaction(async (connection) => {
    const current = await listOpenWorkContexts(context);
    const currentIds = new Set(current.map((item) => item.id));
    if (unique.length !== current.length || unique.some((id) => !currentIds.has(id))) {
      throw new Error('Work context ordering must contain every open context exactly once.');
    }
    for (let position = 0; position < unique.length; position += 1) {
      await executeMutation(
        'UPDATE work_contexts SET position=? WHERE id=? AND tenant_id=? AND user_identity_id=?',
        [position, unique[position], context.tenantId, context.userIdentityId],
        connection
      );
    }
  });
}

function draftRow(row: RowDataPacket & Omit<WorkDraft, 'payload'> & { payload: unknown }): WorkDraft {
  const payload =
    row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : {};
  return { ...row, payload };
}

export async function getWorkDraft(
  context: CommandContext,
  workContextId: string,
  formKey: string,
  executor?: DbExecutor
): Promise<WorkDraft | null> {
  assertPermission(context, 'work.draft.manage');
  await getWorkContext(context, workContextId, executor);
  const row = await queryOne<
    RowDataPacket & Omit<WorkDraft, 'payload'> & { payload: unknown }
  >(
    `SELECT id,work_context_id AS workContextId,form_key AS formKey,base_version AS baseVersion,
            payload_json AS payload,draft_version AS draftVersion,status,created_at AS createdAt,
            updated_at AS updatedAt,applied_at AS appliedAt,discarded_at AS discardedAt
       FROM work_drafts
      WHERE tenant_id=? AND user_identity_id=? AND work_context_id=? AND form_key=?`,
    [context.tenantId, context.userIdentityId, workContextId, required(formKey, 'Form key', 191)],
    executor
  );
  return row ? draftRow(row) : null;
}

export async function saveWorkDraft(
  context: CommandContext,
  input: {
    workContextId: string;
    formKey: string;
    baseVersion?: string | number | null;
    payload: Record<string, unknown>;
  }
): Promise<WorkDraft> {
  assertPermission(context, 'work.draft.manage');
  return dbTransaction(async (connection) => {
    await getWorkContext(context, input.workContextId, connection);
    const formKey = required(input.formKey, 'Form key', 191);
    const timestamp = now();
    const existing = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM work_drafts WHERE work_context_id=? AND form_key=? FOR UPDATE',
      [input.workContextId, formKey],
      connection
    );
    if (existing) {
      await executeMutation(
        `UPDATE work_drafts
            SET base_version=?,payload_json=?,draft_version=draft_version+1,status='ACTIVE',
                updated_at=?,applied_at=NULL,discarded_at=NULL
          WHERE id=? AND tenant_id=? AND user_identity_id=?`,
        [
          input.baseVersion == null ? null : String(input.baseVersion),
          JSON.stringify(input.payload ?? {}),
          timestamp,
          existing.id,
          context.tenantId,
          context.userIdentityId
        ],
        connection
      );
      return (await getWorkDraft(context, input.workContextId, formKey, connection))!;
    }
    const id = randomUUID();
    await executeMutation(
      `INSERT INTO work_drafts
        (id,tenant_id,work_context_id,user_identity_id,form_key,base_version,payload_json,
         draft_version,status,created_at,updated_at,applied_at,discarded_at)
       VALUES (?,?,?,?,?,?,?,1,'ACTIVE',?,?,NULL,NULL)`,
      [
        id,
        context.tenantId,
        input.workContextId,
        context.userIdentityId,
        formKey,
        input.baseVersion == null ? null : String(input.baseVersion),
        JSON.stringify(input.payload ?? {}),
        timestamp,
        timestamp
      ],
      connection
    );
    return (await getWorkDraft(context, input.workContextId, formKey, connection))!;
  });
}

async function transitionDraft(
  context: CommandContext,
  workContextId: string,
  formKey: string,
  status: 'APPLIED' | 'DISCARDED'
) {
  assertPermission(context, 'work.draft.manage');
  await getWorkContext(context, workContextId);
  const timestamp = now();
  await executeMutation(
    `UPDATE work_drafts
        SET status=?,updated_at=?,
            applied_at=CASE WHEN ?='APPLIED' THEN ? ELSE applied_at END,
            discarded_at=CASE WHEN ?='DISCARDED' THEN ? ELSE discarded_at END
      WHERE tenant_id=? AND user_identity_id=? AND work_context_id=? AND form_key=?`,
    [
      status,
      timestamp,
      status,
      timestamp,
      status,
      timestamp,
      context.tenantId,
      context.userIdentityId,
      workContextId,
      required(formKey, 'Form key', 191)
    ]
  );
}

export const markWorkDraftApplied = (
  context: CommandContext,
  workContextId: string,
  formKey: string
) => transitionDraft(context, workContextId, formKey, 'APPLIED');

export const discardWorkDraft = (
  context: CommandContext,
  workContextId: string,
  formKey: string
) => transitionDraft(context, workContextId, formKey, 'DISCARDED');
