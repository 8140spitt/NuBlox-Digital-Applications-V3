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

export type PartyRelationship = {
  id: string;
  fromPartyId: string;
  fromDisplayName: string;
  toPartyId: string;
  toDisplayName: string;
  relationshipType: string;
  contextType: string;
  contextId: string;
  status: string;
  version: number;
  validFrom: string;
  validTo: string | null;
};

export type PartyRelationshipInput = {
  fromPartyId: string;
  toPartyId: string;
  relationshipType: string;
  contextType?: string;
  contextId?: string;
  validFrom?: string;
  validTo?: string;
};

const selectRelationship =
  'SELECT r.id, r.from_party_id AS fromPartyId, fp.display_name AS fromDisplayName, r.to_party_id AS toPartyId, tp.display_name AS toDisplayName, r.relationship_type AS relationshipType, r.context_type AS contextType, r.context_id AS contextId, r.status, r.version, r.valid_from AS validFrom, r.valid_to AS validTo FROM party_relationships r JOIN parties fp ON fp.id = r.from_party_id JOIN parties tp ON tp.id = r.to_party_id';

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function effectiveDate(value?: string) {
  const clean = value?.trim();
  if (!clean) return now();
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error('Effective date is invalid.');
  return parsed.toISOString();
}
function optionalDate(value?: string) {
  const clean = value?.trim();
  if (!clean) return null;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error('Valid-to date is invalid.');
  return parsed.toISOString();
}
async function assertActiveParty(context: CommandContext, partyId: string, executor: DbExecutor) {
  const party = await queryOne<RowDataPacket & { id: string }>(
    "SELECT id FROM parties WHERE id = ? AND tenant_id = ? AND status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!party) throw new Error('Active Party not found in this tenant.');
}
async function getRow(context: CommandContext, id: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & PartyRelationship>(
    selectRelationship + ' WHERE r.id = ? AND r.tenant_id = ?',
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Party Relationship not found.');
  return row;
}
async function evidence(
  context: CommandContext,
  row: PartyRelationship,
  action: string,
  executor: DbExecutor,
  fromState?: string
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-PARTY-RELATIONSHIP',
      objectType: 'party_relationship',
      objectId: row.id,
      action,
      fromState,
      toState: row.status,
      note: row.relationshipType
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-PARTY-RELATIONSHIP',
      aggregateType: 'PartyRelationship',
      aggregateObjectId: row.id,
      aggregateVersion: row.version,
      eventType: action,
      topic: 'nublox.party.relationship',
      payload: {
        fromPartyId: row.fromPartyId,
        toPartyId: row.toPartyId,
        relationshipType: row.relationshipType,
        contextType: row.contextType,
        contextId: row.contextId,
        status: row.status,
        validFrom: row.validFrom,
        validTo: row.validTo
      }
    },
    executor
  );
}

export async function listPartyRelationships(context: CommandContext) {
  assertPermission(context, 'party.relationship.read');
  return queryRows<RowDataPacket & PartyRelationship>(
    selectRelationship +
      ' WHERE r.tenant_id = ? ORDER BY fp.display_name, tp.display_name, r.relationship_type',
    [context.tenantId]
  );
}

export async function createPartyRelationship(
  context: CommandContext,
  input: PartyRelationshipInput
) {
  assertPermission(context, 'party.relationship.manage');
  if (input.fromPartyId === input.toPartyId)
    throw new Error('A Party Relationship requires two different Parties.');
  const relationshipType = required(input.relationshipType, 'Relationship type').toUpperCase();
  const contextType = required(input.contextType ?? 'TENANT', 'Context type').toUpperCase();
  const contextId = required(input.contextId ?? context.tenantId, 'Context ID');
  const validFrom = effectiveDate(input.validFrom);
  const validTo = optionalDate(input.validTo);
  if (validTo && validTo <= validFrom) throw new Error('Valid-to must be later than valid-from.');

  return dbTransaction(async (connection) => {
    await assertActiveParty(context, input.fromPartyId, connection);
    await assertActiveParty(context, input.toPartyId, connection);
    const duplicate = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM party_relationships WHERE tenant_id = ? AND from_party_id = ? AND to_party_id = ? AND relationship_type = ? AND context_type = ? AND context_id = ? AND status IN ('PROPOSED','ACTIVE','SUSPENDED') LIMIT 1",
      [
        context.tenantId,
        input.fromPartyId,
        input.toPartyId,
        relationshipType,
        contextType,
        contextId
      ],
      connection
    );
    if (duplicate)
      throw new Error('An open Party Relationship of this type already exists for this context.');

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      "INSERT INTO party_relationships (id, tenant_id, from_party_id, to_party_id, relationship_type, context_type, context_id, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'PROPOSED', 1, ?, ?, ?, ?)",
      [
        id,
        context.tenantId,
        input.fromPartyId,
        input.toPartyId,
        relationshipType,
        contextType,
        contextId,
        validFrom,
        validTo,
        timestamp,
        timestamp
      ],
      connection
    );
    await evidence(
      context,
      await getRow(context, id, connection),
      'PARTY_RELATIONSHIP_CREATED',
      connection
    );
    return id;
  });
}

async function transition(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  allowedFrom: string[],
  toState: string,
  action: string
) {
  assertPermission(context, 'party.relationship.manage');
  return dbTransaction(async (connection) => {
    const current = await getRow(context, id, connection);
    if (current.version !== expectedVersion)
      throw new Error('This Party Relationship changed after you opened it.');
    if (!allowedFrom.includes(current.status))
      throw new Error(`Party Relationship cannot move from ${current.status} to ${toState}.`);
    const timestamp = now();
    const result = await executeMutation(
      "UPDATE party_relationships SET status = ?, version = version + 1, valid_to = CASE WHEN ? = 'ENDED' THEN COALESCE(valid_to, ?) ELSE valid_to END, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?",
      [toState, toState, timestamp, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Party Relationship change detected.');
    await evidence(
      context,
      await getRow(context, id, connection),
      action,
      connection,
      current.status
    );
  });
}

export const activatePartyRelationship = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    ['PROPOSED', 'SUSPENDED'],
    'ACTIVE',
    'PARTY_RELATIONSHIP_ACTIVATED'
  );
export const suspendPartyRelationship = (context: CommandContext, id: string, version: number) =>
  transition(context, id, version, ['ACTIVE'], 'SUSPENDED', 'PARTY_RELATIONSHIP_SUSPENDED');
export const endPartyRelationship = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    ['PROPOSED', 'ACTIVE', 'SUSPENDED'],
    'ENDED',
    'PARTY_RELATIONSHIP_ENDED'
  );
