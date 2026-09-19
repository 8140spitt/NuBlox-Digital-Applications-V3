import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { dbTransaction, executeMutation, queryOne, queryRows } from '$lib/server/db';
import type { CommandContext } from '$lib/server/platform-context';

export type SavedView = {
  id: string;
  targetKey: string;
  name: string;
  definition: Record<string, unknown>;
  scopeType: string;
  isDefault: number;
  isPinned: number;
  createdAt: string;
  updatedAt: string;
};

export type PersonalNavigationItem = {
  id: string;
  itemKey: string;
  itemType: string;
  objectType: string | null;
  objectId: string | null;
  title: string;
  subtitle: string | null;
  routePath: string;
  createdAt: string;
};

export type RecentNavigationItem = PersonalNavigationItem & {
  lastOpenedAt: string;
};

export type NavigationItemInput = {
  itemKey: string;
  itemType: 'OBJECT' | 'CONTEXT' | 'WORKSPACE' | 'COLLECTION';
  objectType?: string | null;
  objectId?: string | null;
  title: string;
  subtitle?: string | null;
  routePath: string;
};

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string, max = 500) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  if (clean.length > max) throw new Error(label + ' is too long.');
  return clean;
}

function itemKey(value: string) {
  const clean = required(value, 'Navigation item key', 255);
  if (!/^[A-Za-z0-9._:/-]+$/.test(clean)) {
    throw new Error('Navigation item key contains unsupported characters.');
  }
  return clean;
}

function itemType(value: string) {
  const clean = required(value, 'Navigation item type', 32).toUpperCase();
  if (!['OBJECT', 'CONTEXT', 'WORKSPACE', 'COLLECTION'].includes(clean)) {
    throw new Error('Navigation item type is invalid.');
  }
  return clean;
}

function routePath(context: CommandContext, value: string) {
  const clean = required(value, 'Navigation route', 1000);
  const prefix = '/' + context.tenantSlug + '/app';
  if (!(clean === prefix || clean.startsWith(prefix + '/'))) {
    throw new Error('Navigation route must remain inside the current tenant application.');
  }
  return clean;
}

function objectJson(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function savedViewRow(
  row: RowDataPacket & Omit<SavedView, 'definition'> & { definition: unknown }
): SavedView {
  return { ...row, definition: objectJson(row.definition) };
}

function validateDefinition(value: Record<string, unknown>) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Saved View definition must be an object.');
  }
  const json = JSON.stringify(value);
  if (json.length > 100_000) throw new Error('Saved View definition is too large.');
  return json;
}

export async function listSavedViews(
  context: CommandContext,
  target: string
): Promise<SavedView[]> {
  const targetKey = required(target, 'Saved View target', 191);
  const rows = await queryRows<
    RowDataPacket & Omit<SavedView, 'definition'> & { definition: unknown }
  >(
    'SELECT id,target_key AS targetKey,name,definition_json AS definition,scope_type AS scopeType,' +
      ' is_default AS isDefault,is_pinned AS isPinned,created_at AS createdAt,updated_at AS updatedAt' +
      ' FROM saved_views WHERE tenant_id=? AND owner_identity_id=? AND target_key=?' +
      " AND scope_type='PERSONAL' ORDER BY is_pinned DESC,is_default DESC,name",
    [context.tenantId, context.userIdentityId, targetKey]
  );
  return rows.map(savedViewRow);
}

export async function savePersonalView(
  context: CommandContext,
  input: {
    targetKey: string;
    name: string;
    definition: Record<string, unknown>;
    isDefault?: boolean;
    isPinned?: boolean;
  }
): Promise<SavedView> {
  const targetKey = required(input.targetKey, 'Saved View target', 191);
  const name = required(input.name, 'Saved View name', 191);
  const definitionJson = validateDefinition(input.definition);
  const timestamp = now();

  return dbTransaction(async (connection) => {
    if (input.isDefault) {
      await executeMutation(
        'UPDATE saved_views SET is_default=FALSE,updated_at=?' +
          " WHERE tenant_id=? AND owner_identity_id=? AND target_key=? AND scope_type='PERSONAL'",
        [timestamp, context.tenantId, context.userIdentityId, targetKey],
        connection
      );
    }

    const id = randomUUID();
    await executeMutation(
      'INSERT INTO saved_views' +
        ' (id,tenant_id,owner_identity_id,target_key,name,definition_json,scope_type,audience_type,' +
        ' audience_id,is_default,is_pinned,created_at,updated_at)' +
        " VALUES (?,?,?,?,?,?,'PERSONAL',NULL,NULL,?,?,?,?)" +
        ' ON DUPLICATE KEY UPDATE definition_json=VALUES(definition_json),' +
        ' is_default=VALUES(is_default),is_pinned=VALUES(is_pinned),updated_at=VALUES(updated_at)',
      [
        id,
        context.tenantId,
        context.userIdentityId,
        targetKey,
        name,
        definitionJson,
        input.isDefault ? 1 : 0,
        input.isPinned ? 1 : 0,
        timestamp,
        timestamp
      ],
      connection
    );

    const row = await queryOne<
      RowDataPacket & Omit<SavedView, 'definition'> & { definition: unknown }
    >(
      'SELECT id,target_key AS targetKey,name,definition_json AS definition,scope_type AS scopeType,' +
        ' is_default AS isDefault,is_pinned AS isPinned,created_at AS createdAt,updated_at AS updatedAt' +
        ' FROM saved_views WHERE tenant_id=? AND owner_identity_id=? AND target_key=?' +
        " AND name=? AND scope_type='PERSONAL'",
      [context.tenantId, context.userIdentityId, targetKey, name],
      connection
    );
    if (!row) throw new Error('Saved View could not be resolved after save.');
    return savedViewRow(row);
  });
}

export async function deletePersonalView(context: CommandContext, id: string) {
  const result = await executeMutation(
    "DELETE FROM saved_views WHERE id=? AND tenant_id=? AND owner_identity_id=? AND scope_type='PERSONAL'",
    [required(id, 'Saved View ID', 36), context.tenantId, context.userIdentityId]
  );
  if (result.affectedRows !== 1) throw new Error('Saved View not found.');
}

function navigationValues(context: CommandContext, input: NavigationItemInput) {
  const type = itemType(input.itemType);
  const objectType = input.objectType?.trim().toUpperCase() || null;
  const objectId = input.objectId?.trim() || null;
  if (type === 'OBJECT' && (!objectType || !objectId)) {
    throw new Error('Object navigation items require object type and object ID.');
  }
  return {
    itemKey: itemKey(input.itemKey),
    itemType: type,
    objectType,
    objectId,
    title: required(input.title, 'Navigation item title', 500),
    subtitle: input.subtitle?.trim().slice(0, 500) || null,
    routePath: routePath(context, input.routePath)
  };
}

export async function recordRecentItem(context: CommandContext, input: NavigationItemInput) {
  const values = navigationValues(context, input);
  const timestamp = now();

  await dbTransaction(async (connection) => {
    await executeMutation(
      'INSERT INTO user_recent_items' +
        ' (id,tenant_id,user_identity_id,item_key,item_type,object_type,object_id,title,subtitle,' +
        ' route_path,created_at,last_opened_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)' +
        ' ON DUPLICATE KEY UPDATE item_type=VALUES(item_type),object_type=VALUES(object_type),' +
        ' object_id=VALUES(object_id),title=VALUES(title),subtitle=VALUES(subtitle),' +
        ' route_path=VALUES(route_path),last_opened_at=VALUES(last_opened_at)',
      [
        randomUUID(),
        context.tenantId,
        context.userIdentityId,
        values.itemKey,
        values.itemType,
        values.objectType,
        values.objectId,
        values.title,
        values.subtitle,
        values.routePath,
        timestamp,
        timestamp
      ],
      connection
    );

    await executeMutation(
      'DELETE FROM user_recent_items WHERE tenant_id=? AND user_identity_id=? AND id NOT IN (' +
        ' SELECT id FROM (SELECT id FROM user_recent_items WHERE tenant_id=? AND user_identity_id=?' +
        ' ORDER BY last_opened_at DESC,id DESC LIMIT 50) retained)',
      [context.tenantId, context.userIdentityId, context.tenantId, context.userIdentityId],
      connection
    );
  });
}

export async function listRecentItems(
  context: CommandContext,
  requestedLimit = 12
): Promise<RecentNavigationItem[]> {
  const limit = Math.max(1, Math.min(50, Math.floor(requestedLimit)));
  return queryRows<RowDataPacket & RecentNavigationItem>(
    'SELECT id,item_key AS itemKey,item_type AS itemType,object_type AS objectType,' +
      ' object_id AS objectId,title,subtitle,route_path AS routePath,created_at AS createdAt,' +
      ' last_opened_at AS lastOpenedAt FROM user_recent_items' +
      ' WHERE tenant_id=? AND user_identity_id=? ORDER BY last_opened_at DESC,id DESC LIMIT ' +
      limit,
    [context.tenantId, context.userIdentityId]
  );
}

export async function listFavourites(context: CommandContext): Promise<PersonalNavigationItem[]> {
  return queryRows<RowDataPacket & PersonalNavigationItem>(
    'SELECT id,item_key AS itemKey,item_type AS itemType,object_type AS objectType,' +
      ' object_id AS objectId,title,subtitle,route_path AS routePath,created_at AS createdAt' +
      ' FROM user_favourites WHERE tenant_id=? AND user_identity_id=? ORDER BY created_at DESC,id DESC',
    [context.tenantId, context.userIdentityId]
  );
}

export async function isFavourite(context: CommandContext, key: string) {
  const row = await queryOne<RowDataPacket & { id: string }>(
    'SELECT id FROM user_favourites WHERE tenant_id=? AND user_identity_id=? AND item_key=?',
    [context.tenantId, context.userIdentityId, itemKey(key)]
  );
  return Boolean(row);
}

export async function toggleFavourite(context: CommandContext, input: NavigationItemInput) {
  const values = navigationValues(context, input);
  return dbTransaction(async (connection) => {
    const existing = await queryOne<RowDataPacket & { id: string }>(
      'SELECT id FROM user_favourites WHERE tenant_id=? AND user_identity_id=? AND item_key=? FOR UPDATE',
      [context.tenantId, context.userIdentityId, values.itemKey],
      connection
    );

    if (existing) {
      await executeMutation(
        'DELETE FROM user_favourites WHERE id=? AND tenant_id=? AND user_identity_id=?',
        [existing.id, context.tenantId, context.userIdentityId],
        connection
      );
      return false;
    }

    await executeMutation(
      'INSERT INTO user_favourites' +
        ' (id,tenant_id,user_identity_id,item_key,item_type,object_type,object_id,title,subtitle,' +
        ' route_path,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
      [
        randomUUID(),
        context.tenantId,
        context.userIdentityId,
        values.itemKey,
        values.itemType,
        values.objectType,
        values.objectId,
        values.title,
        values.subtitle,
        values.routePath,
        now()
      ],
      connection
    );
    return true;
  });
}

export function objectNavigationItemKey(subjectType: string, objectId: string) {
  return itemKey(
    'OBJECT:' +
      required(subjectType, 'Object subject type', 64).toUpperCase() +
      ':' +
      required(objectId, 'Object ID', 191)
  );
}
