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
import { emitBusinessEvent, recordPlatformAudit } from '$lib/server/platform-evidence';

export type LifecycleDefinition = {
  id: string;
  lifecycleKey: string;
  name: string;
  appliesToType: string;
  purpose: string | null;
  status: string;
  version: number;
};

export type LifecycleVersion = {
  id: string;
  lifecycleDefinitionId: string;
  versionNo: number;
  status: string;
  description: string | null;
  initialStateKey: string | null;
  publishedAt: string | null;
  createdByPartyId: string;
};

export type LifecycleStateDefinition = {
  id: string;
  stateKey: string;
  label: string;
  terminal: number;
  entryConstraints: unknown;
  exitConstraints: unknown;
  sortOrder: number;
};

export type LifecycleTransitionRule = {
  id: string;
  transitionKey: string;
  fromStateKey: string;
  toStateKey: string;
  guard: unknown;
};

export type LifecycleConfigurationInput = {
  initialStateKey: string;
  states: Array<{
    stateKey: string;
    label: string;
    terminal?: boolean;
    entryConstraints?: unknown;
    exitConstraints?: unknown;
    sortOrder?: number;
  }>;
  transitions: Array<{
    transitionKey: string;
    fromStateKey: string;
    toStateKey: string;
    guard?: unknown;
  }>;
};

const definitionSelect =
  'SELECT id, lifecycle_key AS lifecycleKey, name, applies_to_type AS appliesToType, purpose, status, version FROM lifecycle_definitions';
const versionSelect =
  'SELECT id, lifecycle_definition_id AS lifecycleDefinitionId, version_no AS versionNo, status, description, initial_state_key AS initialStateKey, published_at AS publishedAt, created_by_party_id AS createdByPartyId FROM lifecycle_definition_versions';

function now() {
  return new Date().toISOString();
}

function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}

function key(value: string, label: string, max = 128) {
  const clean = required(value, label).toUpperCase();
  if (clean.length > max || !/^[A-Z0-9][A-Z0-9._:-]*$/.test(clean)) {
    throw new Error(label + ' contains unsupported characters.');
  }
  return clean;
}

function json(value: unknown) {
  return value == null ? null : JSON.stringify(value);
}

async function getDefinition(
  context: CommandContext,
  definitionId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & LifecycleDefinition>(
    definitionSelect + ' WHERE id = ? AND tenant_id = ?' + (forUpdate ? ' FOR UPDATE' : ''),
    [definitionId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Lifecycle Definition not found.');
  return row;
}

async function getVersion(
  context: CommandContext,
  definitionId: string,
  versionId: string,
  executor?: DbExecutor,
  forUpdate = false
) {
  const row = await queryOne<RowDataPacket & LifecycleVersion>(
    versionSelect +
      ' WHERE id = ? AND lifecycle_definition_id = ? AND tenant_id = ?' +
      (forUpdate ? ' FOR UPDATE' : ''),
    [versionId, definitionId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Lifecycle Definition Version not found.');
  return row;
}

async function bumpDefinition(
  context: CommandContext,
  definition: LifecycleDefinition,
  executor: DbExecutor
) {
  const timestamp = now();
  const result = await executeMutation(
    'UPDATE lifecycle_definitions SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
    [timestamp, definition.id, context.tenantId, definition.version],
    executor
  );
  if (result.affectedRows !== 1)
    throw new Error('Concurrent Lifecycle Definition change detected.');
  return getDefinition(context, definition.id, executor);
}

async function evidence(
  context: CommandContext,
  definition: LifecycleDefinition,
  objectType: string,
  objectId: string,
  action: string,
  payload: Record<string, unknown>,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-29-LIFECYCLE-CONFIG',
      objectType,
      objectId,
      action,
      toState: typeof payload.status === 'string' ? payload.status : undefined
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-29-LIFECYCLE-CONFIG',
      aggregateType: 'LifecycleDefinition',
      aggregateObjectId: definition.id,
      aggregateVersion: definition.version,
      eventType: action,
      topic: 'nublox.reference.lifecycle',
      payload
    },
    executor
  );
}

function validateConfiguration(input: LifecycleConfigurationInput) {
  if (!input.states.length) throw new Error('Lifecycle configuration requires at least one state.');

  const states = input.states.map((state, index) => ({
    stateKey: key(state.stateKey, 'Lifecycle state key'),
    label: required(state.label, 'Lifecycle state label'),
    terminal: Boolean(state.terminal),
    entryConstraints: state.entryConstraints ?? null,
    exitConstraints: state.exitConstraints ?? null,
    sortOrder: Number.isInteger(state.sortOrder) ? Number(state.sortOrder) : index
  }));
  for (const state of states) {
    if (state.label.length > 255) throw new Error('Lifecycle state label is too long.');
  }

  const stateKeys = new Set<string>();
  for (const state of states) {
    if (stateKeys.has(state.stateKey))
      throw new Error('Duplicate Lifecycle state: ' + state.stateKey);
    stateKeys.add(state.stateKey);
  }

  const initialStateKey = key(input.initialStateKey, 'Initial lifecycle state');
  if (!stateKeys.has(initialStateKey)) {
    throw new Error('Initial lifecycle state is not defined: ' + initialStateKey);
  }

  const transitions = input.transitions.map((transition) => ({
    transitionKey: key(transition.transitionKey, 'Lifecycle transition key'),
    fromStateKey: key(transition.fromStateKey, 'Lifecycle transition from-state'),
    toStateKey: key(transition.toStateKey, 'Lifecycle transition to-state'),
    guard: transition.guard ?? null
  }));
  const transitionKeys = new Set<string>();
  for (const transition of transitions) {
    if (transitionKeys.has(transition.transitionKey)) {
      throw new Error('Duplicate Lifecycle transition: ' + transition.transitionKey);
    }
    transitionKeys.add(transition.transitionKey);
    if (!stateKeys.has(transition.fromStateKey) || !stateKeys.has(transition.toStateKey)) {
      throw new Error(
        'Lifecycle transition references an undefined state: ' + transition.transitionKey
      );
    }
    const from = states.find((state) => state.stateKey === transition.fromStateKey)!;
    if (from.terminal) {
      throw new Error(
        'Terminal Lifecycle state cannot have outgoing transitions: ' + from.stateKey
      );
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const transition of transitions) {
    const targets = adjacency.get(transition.fromStateKey) ?? [];
    targets.push(transition.toStateKey);
    adjacency.set(transition.fromStateKey, targets);
  }
  const reachable = new Set<string>();
  const queue = [initialStateKey];
  while (queue.length) {
    const current = queue.shift()!;
    if (reachable.has(current)) continue;
    reachable.add(current);
    queue.push(...(adjacency.get(current) ?? []));
  }
  const unreachable = states.filter((state) => !reachable.has(state.stateKey));
  if (unreachable.length) {
    throw new Error(
      'Lifecycle contains unreachable state(s): ' +
        unreachable.map((state) => state.stateKey).join(', ')
    );
  }

  return { initialStateKey, states, transitions };
}

export async function listLifecycleDefinitions(context: CommandContext) {
  assertPermission(context, 'reference.lifecycle.read');
  return queryRows<RowDataPacket & LifecycleDefinition>(
    definitionSelect + ' WHERE tenant_id = ? ORDER BY name, lifecycle_key',
    [context.tenantId]
  );
}

export async function listLifecycleVersions(context: CommandContext, definitionId: string) {
  assertPermission(context, 'reference.lifecycle.read');
  await getDefinition(context, definitionId);
  return queryRows<RowDataPacket & LifecycleVersion>(
    versionSelect + ' WHERE tenant_id = ? AND lifecycle_definition_id = ? ORDER BY version_no DESC',
    [context.tenantId, definitionId]
  );
}

export async function getLifecycleConfiguration(
  context: CommandContext,
  definitionId: string,
  versionId: string
) {
  assertPermission(context, 'reference.lifecycle.read');
  const version = await getVersion(context, definitionId, versionId);
  const states = await queryRows<RowDataPacket & LifecycleStateDefinition>(
    'SELECT id, state_key AS stateKey, label, terminal_flag AS terminal, entry_constraints_json AS entryConstraints, exit_constraints_json AS exitConstraints, sort_order AS sortOrder FROM lifecycle_state_definitions WHERE tenant_id = ? AND lifecycle_definition_id = ? AND lifecycle_version_id = ? ORDER BY sort_order, state_key',
    [context.tenantId, definitionId, versionId]
  );
  const transitions = await queryRows<RowDataPacket & LifecycleTransitionRule>(
    'SELECT id, transition_key AS transitionKey, from_state_key AS fromStateKey, to_state_key AS toStateKey, guard_json AS guard FROM lifecycle_transition_rules WHERE tenant_id = ? AND lifecycle_definition_id = ? AND lifecycle_version_id = ? ORDER BY transition_key',
    [context.tenantId, definitionId, versionId]
  );
  return { version, states, transitions };
}

export async function createLifecycleDefinition(
  context: CommandContext,
  input: { lifecycleKey: string; name: string; appliesToType: string; purpose?: string }
) {
  assertPermission(context, 'reference.lifecycle.manage');
  const lifecycleKey = key(input.lifecycleKey, 'Lifecycle key', 191);
  const name = required(input.name, 'Lifecycle name');
  const appliesToType = key(input.appliesToType, 'Lifecycle applies-to type');
  if (name.length > 255) throw new Error('Lifecycle name is too long.');

  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO lifecycle_definitions (id, tenant_id, lifecycle_key, name, applies_to_type, purpose, status, version, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', 1, ?, ?)",
      [
        id,
        context.tenantId,
        lifecycleKey,
        name,
        appliesToType,
        input.purpose?.trim() || null,
        timestamp,
        timestamp
      ],
      connection
    );
    const definition = await getDefinition(context, id, connection);
    await evidence(
      context,
      definition,
      'lifecycle_definition',
      id,
      'LIFECYCLE_DEFINITION_CREATED',
      { definitionId: id, lifecycleKey, appliesToType, status: definition.status },
      connection
    );
    return id;
  });
}

export async function createLifecycleVersion(
  context: CommandContext,
  definitionId: string,
  expectedDefinitionVersion: number,
  description?: string
) {
  assertPermission(context, 'reference.lifecycle.manage');
  return dbTransaction(async (connection) => {
    const definition = await getDefinition(context, definitionId, connection, true);
    if (definition.version !== expectedDefinitionVersion) {
      throw new Error('This Lifecycle Definition changed after you opened it.');
    }
    if (definition.status !== 'ACTIVE') throw new Error('Lifecycle Definition is not active.');

    const draft = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM lifecycle_definition_versions WHERE tenant_id = ? AND lifecycle_definition_id = ? AND status = 'DRAFT' LIMIT 1 FOR UPDATE",
      [context.tenantId, definition.id],
      connection
    );
    if (draft) throw new Error('Lifecycle Definition already has a draft version.');

    const max = await queryOne<RowDataPacket & { versionNo: number | null }>(
      'SELECT MAX(version_no) AS versionNo FROM lifecycle_definition_versions WHERE tenant_id = ? AND lifecycle_definition_id = ?',
      [context.tenantId, definition.id],
      connection
    );
    const versionNo = Number(max?.versionNo ?? 0) + 1;
    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO lifecycle_definition_versions (id, tenant_id, lifecycle_definition_id, version_no, status, description, initial_state_key, published_at, created_by_party_id, created_at, updated_at) VALUES (?, ?, ?, ?, 'DRAFT', ?, NULL, NULL, ?, ?, ?)",
      [
        id,
        context.tenantId,
        definition.id,
        versionNo,
        description?.trim() || null,
        context.actorPartyId,
        timestamp,
        timestamp
      ],
      connection
    );
    const updatedDefinition = await bumpDefinition(context, definition, connection);
    await evidence(
      context,
      updatedDefinition,
      'lifecycle_definition_version',
      id,
      'LIFECYCLE_VERSION_CREATED',
      { definitionId: definition.id, versionId: id, versionNo, status: 'DRAFT' },
      connection
    );
    return id;
  });
}

export async function configureLifecycleVersion(
  context: CommandContext,
  definitionId: string,
  versionId: string,
  expectedDefinitionVersion: number,
  input: LifecycleConfigurationInput
) {
  assertPermission(context, 'reference.lifecycle.manage');
  const config = validateConfiguration(input);

  return dbTransaction(async (connection) => {
    const definition = await getDefinition(context, definitionId, connection, true);
    if (definition.version !== expectedDefinitionVersion) {
      throw new Error('This Lifecycle Definition changed after you opened it.');
    }
    const version = await getVersion(context, definition.id, versionId, connection, true);
    if (version.status !== 'DRAFT') {
      throw new Error('Published Lifecycle Definition versions are immutable.');
    }

    await executeMutation(
      'DELETE FROM lifecycle_transition_rules WHERE tenant_id = ? AND lifecycle_definition_id = ? AND lifecycle_version_id = ?',
      [context.tenantId, definition.id, version.id],
      connection
    );
    await executeMutation(
      'DELETE FROM lifecycle_state_definitions WHERE tenant_id = ? AND lifecycle_definition_id = ? AND lifecycle_version_id = ?',
      [context.tenantId, definition.id, version.id],
      connection
    );

    const timestamp = now();
    for (const state of config.states) {
      await executeMutation(
        'INSERT INTO lifecycle_state_definitions (id, tenant_id, lifecycle_definition_id, lifecycle_version_id, state_key, label, terminal_flag, entry_constraints_json, exit_constraints_json, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          randomUUID(),
          context.tenantId,
          definition.id,
          version.id,
          state.stateKey,
          state.label,
          state.terminal ? 1 : 0,
          json(state.entryConstraints),
          json(state.exitConstraints),
          state.sortOrder,
          timestamp
        ],
        connection
      );
    }
    for (const transition of config.transitions) {
      await executeMutation(
        'INSERT INTO lifecycle_transition_rules (id, tenant_id, lifecycle_definition_id, lifecycle_version_id, transition_key, from_state_key, to_state_key, guard_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          randomUUID(),
          context.tenantId,
          definition.id,
          version.id,
          transition.transitionKey,
          transition.fromStateKey,
          transition.toStateKey,
          json(transition.guard),
          timestamp
        ],
        connection
      );
    }
    await executeMutation(
      'UPDATE lifecycle_definition_versions SET initial_state_key = ?, updated_at = ? WHERE id = ? AND tenant_id = ?',
      [config.initialStateKey, timestamp, version.id, context.tenantId],
      connection
    );

    const updatedDefinition = await bumpDefinition(context, definition, connection);
    await evidence(
      context,
      updatedDefinition,
      'lifecycle_definition_version',
      version.id,
      'LIFECYCLE_VERSION_CONFIGURED',
      {
        definitionId: definition.id,
        versionId: version.id,
        versionNo: version.versionNo,
        stateCount: config.states.length,
        transitionCount: config.transitions.length,
        initialStateKey: config.initialStateKey,
        status: 'DRAFT'
      },
      connection
    );
  });
}

export async function publishLifecycleVersion(
  context: CommandContext,
  definitionId: string,
  versionId: string,
  expectedDefinitionVersion: number
) {
  assertPermission(context, 'reference.lifecycle.publish');
  return dbTransaction(async (connection) => {
    const definition = await getDefinition(context, definitionId, connection, true);
    if (definition.version !== expectedDefinitionVersion) {
      throw new Error('This Lifecycle Definition changed after you opened it.');
    }
    const version = await getVersion(context, definition.id, versionId, connection, true);
    if (version.status !== 'DRAFT') {
      throw new Error('Only a draft Lifecycle Definition version can be published.');
    }
    if (!version.initialStateKey) {
      throw new Error('Lifecycle Definition version must be configured before publication.');
    }
    const count = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM lifecycle_state_definitions WHERE tenant_id = ? AND lifecycle_definition_id = ? AND lifecycle_version_id = ?',
      [context.tenantId, definition.id, version.id],
      connection
    );
    if (Number(count?.count ?? 0) === 0) {
      throw new Error('Lifecycle Definition version cannot be published without states.');
    }

    const timestamp = now();
    const result = await executeMutation(
      "UPDATE lifecycle_definition_versions SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ? AND tenant_id = ? AND lifecycle_definition_id = ? AND status = 'DRAFT'",
      [timestamp, timestamp, version.id, context.tenantId, definition.id],
      connection
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Lifecycle Definition publication detected.');
    }

    const updatedDefinition = await bumpDefinition(context, definition, connection);
    await evidence(
      context,
      updatedDefinition,
      'lifecycle_definition_version',
      version.id,
      'LIFECYCLE_VERSION_PUBLISHED',
      {
        definitionId: definition.id,
        versionId: version.id,
        versionNo: version.versionNo,
        initialStateKey: version.initialStateKey,
        status: 'PUBLISHED'
      },
      connection
    );
    return getVersion(context, definition.id, version.id, connection);
  });
}
