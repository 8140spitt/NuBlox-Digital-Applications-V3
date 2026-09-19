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
import {
  emitBusinessEvent,
  listPlatformAudit,
  recordPlatformAudit,
  type PlatformAuditEvent
} from '$lib/server/platform-evidence';
import {
  platformPartyOrigination,
  recordPartyOrigination,
  type PartyOriginationInput
} from '$lib/server/party-origination';

export type Person = {
  id: string;
  displayName: string;
  givenName: string;
  middleNames: string | null;
  familyName: string;
  preferredName: string | null;
  dateOfBirth: string | null;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type PersonInput = {
  givenName: string;
  middleNames?: string;
  familyName: string;
  preferredName?: string;
  dateOfBirth?: string;
};

const selectPerson =
  'SELECT p.id, p.display_name AS displayName, x.given_name AS givenName, x.middle_names AS middleNames, x.family_name AS familyName, x.preferred_name AS preferredName, x.date_of_birth AS dateOfBirth, p.status, p.version, p.created_at AS createdAt, p.updated_at AS updatedAt FROM parties p JOIN persons x ON x.party_id = p.id';

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function optional(value?: string) {
  return value?.trim() || null;
}
function displayName(input: PersonInput) {
  return (
    optional(input.preferredName) ??
    [required(input.givenName, 'Given name'), required(input.familyName, 'Family name')].join(' ')
  );
}
function date(value?: string) {
  const clean = optional(value);
  if (!clean) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) throw new Error('Date of birth must use YYYY-MM-DD.');
  return clean;
}

async function getRow(context: CommandContext, id: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & Person>(
    selectPerson + " WHERE p.tenant_id = ? AND p.party_type = 'PERSON' AND p.id = ?",
    [context.tenantId, id],
    executor
  );
  if (!row) throw new Error('Person not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  person: Person,
  action: string,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      objectType: 'person',
      objectId: person.id,
      action,
      fromState: person.status,
      toState: person.status
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      aggregateType: 'Party',
      aggregateObjectId: person.id,
      aggregateVersion: person.version,
      eventType: action,
      topic: 'nublox.party.person',
      payload: { partyType: 'PERSON', displayName: person.displayName, status: person.status }
    },
    executor
  );
}

export async function listPersons(context: CommandContext) {
  assertPermission(context, 'party.read');
  return queryRows<RowDataPacket & Person>(
    selectPerson + " WHERE p.tenant_id = ? AND p.party_type = 'PERSON' ORDER BY p.display_name",
    [context.tenantId]
  );
}

export async function getPerson(context: CommandContext, id: string) {
  assertPermission(context, 'party.read');
  return getRow(context, id);
}

export async function createPerson(
  context: CommandContext,
  input: PersonInput,
  origination?: PartyOriginationInput
) {
  assertPermission(context, 'party.create');
  return dbTransaction(async (connection) => {
    const id = randomUUID();
    const timestamp = now();
    const name = displayName(input);
    await executeMutation(
      "INSERT INTO parties (id, tenant_id, party_type, display_name, status, version, created_at, updated_at) VALUES (?, ?, 'PERSON', ?, 'ACTIVE', 1, ?, ?)",
      [id, context.tenantId, name, timestamp, timestamp],
      connection
    );
    await executeMutation(
      'INSERT INTO persons (party_id, given_name, middle_names, family_name, preferred_name, date_of_birth, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        required(input.givenName, 'Given name'),
        optional(input.middleNames),
        required(input.familyName, 'Family name'),
        optional(input.preferredName),
        date(input.dateOfBirth),
        timestamp,
        timestamp
      ],
      connection
    );
    await recordPartyOrigination(
      context,
      id,
      origination ?? platformPartyOrigination('PERSON', id),
      connection
    );
    const person = await getRow(context, id, connection);
    await evidence(context, person, 'PERSON_CREATED', connection);
    return id;
  });
}

export async function updatePerson(
  context: CommandContext,
  id: string,
  input: PersonInput,
  expectedVersion: number
) {
  assertPermission(context, 'party.change');
  return dbTransaction(async (connection) => {
    const current = await getRow(context, id, connection);
    if (current.version !== expectedVersion)
      throw new Error('This person changed after you opened it. Reload before saving.');
    const timestamp = now();
    const result = await executeMutation(
      'UPDATE parties SET display_name = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [displayName(input), timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent person update detected.');
    await executeMutation(
      'UPDATE persons SET given_name = ?, middle_names = ?, family_name = ?, preferred_name = ?, date_of_birth = ?, updated_at = ? WHERE party_id = ?',
      [
        required(input.givenName, 'Given name'),
        optional(input.middleNames),
        required(input.familyName, 'Family name'),
        optional(input.preferredName),
        date(input.dateOfBirth),
        timestamp,
        id
      ],
      connection
    );
    await evidence(context, await getRow(context, id, connection), 'PERSON_CHANGED', connection);
  });
}

export async function listPersonAudit(
  context: CommandContext,
  id: string
): Promise<PlatformAuditEvent[]> {
  await getPerson(context, id);
  return listPlatformAudit(context, 'person', id);
}
