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

export type OrganisationUnit = {
  id: string;
  unitCode: string;
  name: string;
  unitType: string;
  accountableLegalEntityPartyId: string | null;
  accountableLegalEntityName: string | null;
  status: string;
  version: number;
  validFrom: string;
  validTo: string | null;
};

export type OrganisationUnitInput = {
  unitCode: string;
  name: string;
  unitType: string;
  accountableLegalEntityPartyId?: string;
  validFrom?: string;
  validTo?: string;
};

const selectUnit =
  'SELECT ou.id, ou.unit_code AS unitCode, ou.name, ou.unit_type AS unitType, ou.accountable_legal_entity_party_id AS accountableLegalEntityPartyId, p.display_name AS accountableLegalEntityName, ou.status, ou.version, ou.valid_from AS validFrom, ou.valid_to AS validTo FROM organisation_units ou LEFT JOIN parties p ON p.id = ou.accountable_legal_entity_party_id';

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function iso(value: string | undefined, fallback: string | null, label: string) {
  const clean = value?.trim();
  if (!clean) return fallback;
  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) throw new Error(label + ' is invalid.');
  return parsed.toISOString();
}
async function getRow(context: CommandContext, id: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & OrganisationUnit>(
    selectUnit + ' WHERE ou.id = ? AND ou.tenant_id = ?',
    [id, context.tenantId],
    executor
  );
  if (!row) throw new Error('Organisation Unit not found.');
  return row;
}
async function assertLegalEntity(
  context: CommandContext,
  partyId: string | undefined,
  executor: DbExecutor
) {
  if (!partyId?.trim()) return null;
  const row = await queryOne<RowDataPacket & { id: string }>(
    "SELECT p.id FROM parties p JOIN legal_entities le ON le.party_id = p.id WHERE p.id = ? AND p.tenant_id = ? AND p.status = 'ACTIVE'",
    [partyId, context.tenantId],
    executor
  );
  if (!row) throw new Error('Active accountable Legal Entity not found in this tenant.');
  return row.id;
}
async function unitEvidence(
  context: CommandContext,
  row: OrganisationUnit,
  action: string,
  executor: DbExecutor,
  fromState?: string
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-ORG-STRUCTURE',
      objectType: 'organisation_unit',
      objectId: row.id,
      action,
      fromState,
      toState: row.status,
      note: row.unitCode + ' · ' + row.name
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-ORG-STRUCTURE',
      aggregateType: 'OrganisationUnit',
      aggregateObjectId: row.id,
      aggregateVersion: row.version,
      eventType: action,
      topic: 'nublox.organisation.structure',
      payload: {
        unitCode: row.unitCode,
        name: row.name,
        unitType: row.unitType,
        accountableLegalEntityPartyId: row.accountableLegalEntityPartyId,
        status: row.status
      }
    },
    executor
  );
}

export async function listOrganisationUnits(context: CommandContext) {
  assertPermission(context, 'org.structure.read');
  return queryRows<RowDataPacket & OrganisationUnit>(
    selectUnit + ' WHERE ou.tenant_id = ? ORDER BY ou.name',
    [context.tenantId]
  );
}

export async function createOrganisationUnit(
  context: CommandContext,
  input: OrganisationUnitInput
) {
  assertPermission(context, 'org.structure.manage');
  return dbTransaction(async (connection) => {
    const legalEntity = await assertLegalEntity(
      context,
      input.accountableLegalEntityPartyId,
      connection
    );
    const id = randomUUID();
    const timestamp = now();
    const validFrom = iso(input.validFrom, timestamp, 'Valid-from') as string;
    const validTo = iso(input.validTo, null, 'Valid-to');
    if (validTo && validTo <= validFrom) throw new Error('Valid-to must be later than valid-from.');
    await executeMutation(
      "INSERT INTO organisation_units (id, tenant_id, unit_code, name, unit_type, accountable_legal_entity_party_id, status, version, valid_from, valid_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'PLANNED', 1, ?, ?, ?, ?)",
      [
        id,
        context.tenantId,
        required(input.unitCode, 'Organisation Unit code').toUpperCase(),
        required(input.name, 'Organisation Unit name'),
        required(input.unitType, 'Organisation Unit type').toUpperCase(),
        legalEntity,
        validFrom,
        validTo,
        timestamp,
        timestamp
      ],
      connection
    );
    await unitEvidence(
      context,
      await getRow(context, id, connection),
      'ORGANISATION_UNIT_CREATED',
      connection
    );
    return id;
  });
}

export async function updateOrganisationUnit(
  context: CommandContext,
  id: string,
  input: OrganisationUnitInput,
  expectedVersion: number
) {
  assertPermission(context, 'org.structure.manage');
  return dbTransaction(async (connection) => {
    const current = await getRow(context, id, connection);
    if (current.version !== expectedVersion)
      throw new Error('This Organisation Unit changed after you opened it.');
    if (current.status === 'CLOSED')
      throw new Error('A closed Organisation Unit cannot be changed.');
    const legalEntity = await assertLegalEntity(
      context,
      input.accountableLegalEntityPartyId,
      connection
    );
    const validFrom = iso(input.validFrom, current.validFrom, 'Valid-from') as string;
    const validTo = iso(input.validTo, current.validTo, 'Valid-to');
    if (validTo && validTo <= validFrom) throw new Error('Valid-to must be later than valid-from.');
    const result = await executeMutation(
      'UPDATE organisation_units SET unit_code = ?, name = ?, unit_type = ?, accountable_legal_entity_party_id = ?, valid_from = ?, valid_to = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [
        required(input.unitCode, 'Organisation Unit code').toUpperCase(),
        required(input.name, 'Organisation Unit name'),
        required(input.unitType, 'Organisation Unit type').toUpperCase(),
        legalEntity,
        validFrom,
        validTo,
        now(),
        id,
        context.tenantId,
        expectedVersion
      ],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Organisation Unit change detected.');
    await unitEvidence(
      context,
      await getRow(context, id, connection),
      'ORGANISATION_UNIT_CHANGED',
      connection,
      current.status
    );
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
  assertPermission(context, 'org.structure.manage');
  return dbTransaction(async (connection) => {
    const current = await getRow(context, id, connection);
    if (current.version !== expectedVersion)
      throw new Error('This Organisation Unit changed after you opened it.');
    if (!allowedFrom.includes(current.status))
      throw new Error(`Organisation Unit cannot move from ${current.status} to ${toState}.`);
    const timestamp = now();
    const result = await executeMutation(
      "UPDATE organisation_units SET status = ?, version = version + 1, valid_to = CASE WHEN ? = 'CLOSED' THEN COALESCE(valid_to, ?) ELSE valid_to END, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?",
      [toState, toState, timestamp, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Organisation Unit lifecycle change detected.');
    await unitEvidence(
      context,
      await getRow(context, id, connection),
      action,
      connection,
      current.status
    );
  });
}

export const activateOrganisationUnit = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    ['PLANNED', 'INACTIVE'],
    'ACTIVE',
    'ORGANISATION_UNIT_ACTIVATED'
  );
export const deactivateOrganisationUnit = (context: CommandContext, id: string, version: number) =>
  transition(context, id, version, ['ACTIVE'], 'INACTIVE', 'ORGANISATION_UNIT_DEACTIVATED');
export const closeOrganisationUnit = (context: CommandContext, id: string, version: number) =>
  transition(
    context,
    id,
    version,
    ['PLANNED', 'ACTIVE', 'INACTIVE'],
    'CLOSED',
    'ORGANISATION_UNIT_CLOSED'
  );

export async function assignOrganisationUnitParent(
  context: CommandContext,
  childUnitId: string,
  parentUnitId: string,
  effectiveFrom?: string
) {
  assertPermission(context, 'org.structure.manage');
  if (childUnitId === parentUnitId)
    throw new Error('An Organisation Unit cannot be its own parent.');
  return dbTransaction(async (connection) => {
    const child = await getRow(context, childUnitId, connection);
    const parent = await getRow(context, parentUnitId, connection);
    if (child.status === 'CLOSED' || parent.status === 'CLOSED')
      throw new Error('Closed Organisation Units cannot participate in the active hierarchy.');

    const cycle = await queryOne<RowDataPacket & { found: number }>(
      "WITH RECURSIVE ancestors (unit_id) AS (SELECT parent_unit_id FROM organisation_unit_hierarchy WHERE tenant_id = ? AND child_unit_id = ? AND status = 'ACTIVE' UNION ALL SELECT h.parent_unit_id FROM organisation_unit_hierarchy h JOIN ancestors a ON h.child_unit_id = a.unit_id WHERE h.tenant_id = ? AND h.status = 'ACTIVE') SELECT 1 AS found FROM ancestors WHERE unit_id = ? LIMIT 1",
      [context.tenantId, parentUnitId, context.tenantId, childUnitId],
      connection
    );
    if (cycle) throw new Error('The requested hierarchy change would create a cycle.');

    const timestamp = iso(effectiveFrom, now(), 'Hierarchy effective-from') as string;
    const current = await queryOne<RowDataPacket & { id: string }>(
      "SELECT id FROM organisation_unit_hierarchy WHERE tenant_id = ? AND child_unit_id = ? AND status = 'ACTIVE' LIMIT 1 FOR UPDATE",
      [context.tenantId, childUnitId],
      connection
    );
    if (current) {
      await executeMutation(
        "UPDATE organisation_unit_hierarchy SET status = 'ENDED', valid_to = ? WHERE id = ? AND tenant_id = ?",
        [timestamp, current.id, context.tenantId],
        connection
      );
    }

    const relationId = randomUUID();
    await executeMutation(
      "INSERT INTO organisation_unit_hierarchy (id, tenant_id, child_unit_id, parent_unit_id, status, valid_from, valid_to, created_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?, NULL, ?)",
      [relationId, context.tenantId, childUnitId, parentUnitId, timestamp, now()],
      connection
    );
    const result = await executeMutation(
      'UPDATE organisation_units SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [now(), childUnitId, context.tenantId, child.version],
      connection
    );
    if (result.affectedRows !== 1)
      throw new Error('Concurrent Organisation Unit hierarchy change detected.');
    const updated = await getRow(context, childUnitId, connection);
    await recordPlatformAudit(
      context,
      {
        aggregateId: 'AGG-01-ORG-STRUCTURE',
        objectType: 'organisation_unit_hierarchy',
        objectId: relationId,
        action: 'ORGANISATION_UNIT_PARENT_ASSIGNED',
        toState: 'ACTIVE',
        note: parent.unitCode + ' → ' + child.unitCode
      },
      connection
    );
    await emitBusinessEvent(
      context,
      {
        aggregateId: 'AGG-01-ORG-STRUCTURE',
        aggregateType: 'OrganisationUnit',
        aggregateObjectId: childUnitId,
        aggregateVersion: updated.version,
        eventType: 'ORGANISATION_UNIT_PARENT_ASSIGNED',
        topic: 'nublox.organisation.structure',
        payload: {
          relationId,
          childUnitId,
          parentUnitId,
          replacedRelationId: current?.id ?? null,
          effectiveFrom: timestamp
        }
      },
      connection
    );
    return relationId;
  });
}
