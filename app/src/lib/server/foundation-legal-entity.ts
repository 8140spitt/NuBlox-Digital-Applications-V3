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

export type LegalEntity = {
  id: string;
  displayName: string;
  legalName: string;
  legalEntityType: string;
  jurisdictionCode: string;
  statutoryIdentifier: string | null;
  taxRegistrationNumber: string | null;
  accountingCurrency: string | null;
  legalEntityStatus: string;
  partyStatus: string;
  version: number;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

export type LegalEntityInput = {
  legalEntityType: string;
  jurisdictionCode: string;
  statutoryIdentifier?: string;
  taxRegistrationNumber?: string;
  accountingCurrency?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
};

const selectLegalEntity =
  'SELECT p.id, p.display_name AS displayName, o.legal_name AS legalName, le.legal_entity_type AS legalEntityType, le.jurisdiction_code AS jurisdictionCode, le.statutory_identifier AS statutoryIdentifier, le.tax_registration_number AS taxRegistrationNumber, le.accounting_currency AS accountingCurrency, le.status AS legalEntityStatus, p.status AS partyStatus, p.version, le.effective_from AS effectiveFrom, le.effective_to AS effectiveTo FROM parties p JOIN organisations o ON o.party_id = p.id JOIN legal_entities le ON le.party_id = p.id';

function now() {
  return new Date().toISOString();
}
function required(value: string, label: string) {
  const clean = value.trim().toUpperCase();
  if (!clean) throw new Error(label + ' is required.');
  return clean;
}
function optional(value?: string) {
  return value?.trim() || null;
}
function isoDate(value?: string) {
  const clean = optional(value);
  if (!clean) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) throw new Error('Effective dates must use YYYY-MM-DD.');
  return clean;
}
function currency(value?: string) {
  const clean = optional(value)?.toUpperCase() ?? null;
  if (clean && !/^[A-Z]{3}$/.test(clean))
    throw new Error('Accounting currency must be a three-letter code.');
  return clean;
}

async function getRow(context: CommandContext, id: string, executor?: DbExecutor) {
  const row = await queryOne<RowDataPacket & LegalEntity>(
    selectLegalEntity + ' WHERE p.tenant_id = ? AND p.id = ?',
    [context.tenantId, id],
    executor
  );
  if (!row) throw new Error('Legal entity not found.');
  return row;
}

async function evidence(
  context: CommandContext,
  entity: LegalEntity,
  action: string,
  executor: DbExecutor
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      objectType: 'legal_entity',
      objectId: entity.id,
      action,
      fromState: entity.partyStatus,
      toState: entity.partyStatus
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      aggregateType: 'Party',
      aggregateObjectId: entity.id,
      aggregateVersion: entity.version,
      eventType: action,
      topic: 'nublox.party.legal-entity',
      payload: {
        partyType: 'ORGANISATION',
        specialisation: 'LEGAL_ENTITY',
        displayName: entity.displayName,
        legalEntityType: entity.legalEntityType,
        jurisdictionCode: entity.jurisdictionCode
      }
    },
    executor
  );
}

export async function listLegalEntities(context: CommandContext) {
  assertPermission(context, 'party.read');
  return queryRows<RowDataPacket & LegalEntity>(
    selectLegalEntity + ' WHERE p.tenant_id = ? ORDER BY p.display_name',
    [context.tenantId]
  );
}

export async function getLegalEntity(context: CommandContext, id: string) {
  assertPermission(context, 'party.read');
  return getRow(context, id);
}

export async function designateLegalEntity(
  context: CommandContext,
  organisationId: string,
  input: LegalEntityInput,
  expectedVersion: number
) {
  assertPermission(context, 'party.change');
  return dbTransaction(async (connection) => {
    const organisation = await queryOne<RowDataPacket & { version: number }>(
      "SELECT p.version FROM parties p JOIN organisations o ON o.party_id = p.id WHERE p.tenant_id = ? AND p.id = ? AND p.party_type = 'ORGANISATION'",
      [context.tenantId, organisationId],
      connection
    );
    if (!organisation) throw new Error('Organisation not found.');
    if (organisation.version !== expectedVersion)
      throw new Error('This organisation changed after you opened it. Reload before saving.');

    const existing = await queryOne<RowDataPacket & { id: string }>(
      'SELECT party_id AS id FROM legal_entities WHERE party_id = ?',
      [organisationId],
      connection
    );
    if (existing) throw new Error('Organisation is already a legal entity.');

    const timestamp = now();
    await executeMutation(
      "INSERT INTO legal_entities (party_id, legal_entity_type, jurisdiction_code, statutory_identifier, tax_registration_number, accounting_currency, status, effective_from, effective_to, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)",
      [
        organisationId,
        required(input.legalEntityType, 'Legal entity type'),
        required(input.jurisdictionCode, 'Jurisdiction code'),
        optional(input.statutoryIdentifier),
        optional(input.taxRegistrationNumber),
        currency(input.accountingCurrency),
        isoDate(input.effectiveFrom),
        isoDate(input.effectiveTo),
        timestamp,
        timestamp
      ],
      connection
    );
    const result = await executeMutation(
      'UPDATE parties SET version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [timestamp, organisationId, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent organisation update detected.');
    await evidence(
      context,
      await getRow(context, organisationId, connection),
      'LEGAL_ENTITY_DESIGNATED',
      connection
    );
  });
}

export async function listLegalEntityAudit(
  context: CommandContext,
  id: string
): Promise<PlatformAuditEvent[]> {
  await getLegalEntity(context, id);
  return listPlatformAudit(context, 'legal_entity', id);
}
