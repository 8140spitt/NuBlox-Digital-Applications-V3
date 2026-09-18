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

export type OrganisationStatus = 'PROPOSED' | 'ACTIVE' | 'INACTIVE' | 'DISSOLVED' | 'MERGED';

export type Organisation = {
  id: string;
  displayName: string;
  legalName: string;
  tradingName: string | null;
  registrationNumber: string | null;
  taxIdentifier: string | null;
  countryCode: string | null;
  status: OrganisationStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganisationInput = {
  legalName: string;
  tradingName?: string;
  registrationNumber?: string;
  taxIdentifier?: string;
  countryCode?: string;
};

const organisationSelect =
  'SELECT p.id, p.display_name AS displayName, o.legal_name AS legalName, o.trading_name AS tradingName, o.registration_number AS registrationNumber, o.tax_identifier AS taxIdentifier, o.country_code AS countryCode, p.status, p.version, p.created_at AS createdAt, p.updated_at AS updatedAt FROM parties p JOIN organisations o ON o.party_id = p.id';

function now() {
  return new Date().toISOString();
}

function cleanRequired(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(label + ' is required.');
  return cleaned;
}

function cleanOptional(value?: string) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function cleanCountry(value?: string) {
  const cleaned = value?.trim().toUpperCase();
  if (!cleaned) return null;
  if (!/^[A-Z]{2}$/.test(cleaned)) throw new Error('Country code must be a two-letter code.');
  return cleaned;
}

async function getOrganisationRow(
  context: CommandContext,
  id: string,
  executor?: DbExecutor
): Promise<Organisation> {
  const row = await queryOne<RowDataPacket & Organisation>(
    organisationSelect + ' WHERE p.tenant_id = ? AND p.party_type = \'ORGANISATION\' AND p.id = ?',
    [context.tenantId, id],
    executor
  );
  if (!row) throw new Error('Organisation not found.');
  return row;
}

function assertMutable(organisation: Organisation) {
  if (organisation.status === 'DISSOLVED' || organisation.status === 'MERGED') {
    throw new Error('Dissolved or merged organisations cannot be edited.');
  }
}

async function publish(
  context: CommandContext,
  organisation: Organisation,
  eventType: string,
  executor: DbExecutor,
  note?: string,
  previousStatus?: OrganisationStatus | null
) {
  await recordPlatformAudit(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      objectType: 'organisation',
      objectId: organisation.id,
      action: eventType,
      fromState: previousStatus ?? organisation.status,
      toState: organisation.status,
      note
    },
    executor
  );
  await emitBusinessEvent(
    context,
    {
      aggregateId: 'AGG-01-PARTY',
      aggregateType: 'Party',
      aggregateObjectId: organisation.id,
      aggregateVersion: organisation.version,
      eventType,
      topic: 'nublox.party.organisation',
      payload: {
        partyType: 'ORGANISATION',
        displayName: organisation.displayName,
        legalName: organisation.legalName,
        tradingName: organisation.tradingName,
        registrationNumber: organisation.registrationNumber,
        countryCode: organisation.countryCode,
        status: organisation.status
      }
    },
    executor
  );
}

export async function listOrganisations(context: CommandContext): Promise<Organisation[]> {
  assertPermission(context, 'party.read');
  return queryRows<RowDataPacket & Organisation>(
    organisationSelect + ' WHERE p.tenant_id = ? AND p.party_type = \'ORGANISATION\' ORDER BY CASE p.status WHEN \'ACTIVE\' THEN 0 WHEN \'PROPOSED\' THEN 1 WHEN \'INACTIVE\' THEN 2 ELSE 3 END, p.display_name',
    [context.tenantId]
  );
}

export async function getOrganisation(context: CommandContext, id: string) {
  assertPermission(context, 'party.read');
  return getOrganisationRow(context, id);
}

export async function createOrganisation(context: CommandContext, input: OrganisationInput): Promise<string> {
  assertPermission(context, 'party.create');
  const legalName = cleanRequired(input.legalName, 'Legal name');
  const tradingName = cleanOptional(input.tradingName);
  const registrationNumber = cleanOptional(input.registrationNumber);
  const taxIdentifier = cleanOptional(input.taxIdentifier);
  const countryCode = cleanCountry(input.countryCode);

  return dbTransaction(async (connection) => {
    if (registrationNumber) {
      const duplicate = await queryOne<RowDataPacket & { id: string }>(
        'SELECT p.id FROM parties p JOIN organisations o ON o.party_id = p.id WHERE p.tenant_id = ? AND p.party_type = \'ORGANISATION\' AND o.registration_number = ? AND p.status <> \'MERGED\' LIMIT 1',
        [context.tenantId, registrationNumber],
        connection
      );
      if (duplicate) throw new Error('An organisation with this registration number already exists.');
    }

    const id = randomUUID();
    const timestamp = now();
    await executeMutation(
      'INSERT INTO parties (id, tenant_id, party_type, display_name, status, version, created_at, updated_at) VALUES (?, ?, \'ORGANISATION\', ?, \'PROPOSED\', 1, ?, ?)',
      [id, context.tenantId, tradingName ?? legalName, timestamp, timestamp],
      connection
    );
    await executeMutation(
      'INSERT INTO organisations (party_id, legal_name, trading_name, registration_number, tax_identifier, country_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, legalName, tradingName, registrationNumber, taxIdentifier, countryCode, timestamp, timestamp],
      connection
    );

    const organisation = await getOrganisationRow(context, id, connection);
    await publish(context, organisation, 'ORGANISATION_CREATED', connection, 'Canonical Organisation Party created.', null);
    return id;
  });
}

export async function updateOrganisation(
  context: CommandContext,
  id: string,
  input: OrganisationInput,
  expectedVersion: number
) {
  assertPermission(context, 'party.change');
  const legalName = cleanRequired(input.legalName, 'Legal name');
  const tradingName = cleanOptional(input.tradingName);
  const registrationNumber = cleanOptional(input.registrationNumber);
  const taxIdentifier = cleanOptional(input.taxIdentifier);
  const countryCode = cleanCountry(input.countryCode);

  return dbTransaction(async (connection) => {
    const current = await getOrganisationRow(context, id, connection);
    assertMutable(current);
    if (current.version !== expectedVersion) {
      throw new Error('This organisation changed after you opened it. Reload before saving.');
    }

    if (registrationNumber) {
      const duplicate = await queryOne<RowDataPacket & { id: string }>(
        'SELECT p.id FROM parties p JOIN organisations o ON o.party_id = p.id WHERE p.tenant_id = ? AND p.party_type = \'ORGANISATION\' AND o.registration_number = ? AND p.id <> ? AND p.status <> \'MERGED\' LIMIT 1',
        [context.tenantId, registrationNumber, id],
        connection
      );
      if (duplicate) throw new Error('Another organisation already uses this registration number.');
    }

    const timestamp = now();
    const result = await executeMutation(
      'UPDATE parties SET display_name = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [tradingName ?? legalName, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent organisation update detected.');

    await executeMutation(
      'UPDATE organisations SET legal_name = ?, trading_name = ?, registration_number = ?, tax_identifier = ?, country_code = ?, updated_at = ? WHERE party_id = ?',
      [legalName, tradingName, registrationNumber, taxIdentifier, countryCode, timestamp, id],
      connection
    );

    const updated = await getOrganisationRow(context, id, connection);
    await publish(context, updated, 'ORGANISATION_CHANGED', connection, 'Canonical Organisation master data changed.', current.status);
  });
}

export async function activateOrganisation(context: CommandContext, id: string, expectedVersion: number) {
  assertPermission(context, 'party.activate');
  return changeStatus(context, id, expectedVersion, 'ACTIVE', ['PROPOSED', 'INACTIVE']);
}

export async function deactivateOrganisation(context: CommandContext, id: string, expectedVersion: number) {
  assertPermission(context, 'party.activate');
  return changeStatus(context, id, expectedVersion, 'INACTIVE', ['ACTIVE']);
}

async function changeStatus(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  nextStatus: OrganisationStatus,
  allowed: OrganisationStatus[]
) {
  return dbTransaction(async (connection) => {
    const current = await getOrganisationRow(context, id, connection);
    if (current.version !== expectedVersion) {
      throw new Error('This organisation changed after you opened it. Reload before changing status.');
    }
    if (!allowed.includes(current.status)) {
      throw new Error('Organisation cannot move from ' + current.status + ' to ' + nextStatus + '.');
    }

    const timestamp = now();
    const result = await executeMutation(
      'UPDATE parties SET status = ?, version = version + 1, updated_at = ? WHERE id = ? AND tenant_id = ? AND version = ?',
      [nextStatus, timestamp, id, context.tenantId, expectedVersion],
      connection
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent organisation status update detected.');

    const updated = await getOrganisationRow(context, id, connection);
    await publish(
      context,
      updated,
      nextStatus === 'ACTIVE' ? 'ORGANISATION_ACTIVATED' : 'ORGANISATION_DEACTIVATED',
      connection,
      undefined,
      current.status
    );
  });
}

export async function listOrganisationAudit(
  context: CommandContext,
  id: string
): Promise<PlatformAuditEvent[]> {
  await getOrganisation(context, id);
  return listPlatformAudit(context, 'organisation', id);
}
