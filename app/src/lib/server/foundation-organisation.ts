import { randomUUID } from 'node:crypto';
import { db, dbTransaction } from '$lib/server/db';
import {
  assertPermission,
  type CommandContext
} from '$lib/server/platform-context';
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

const organisationSelect = `
  SELECT
    p.id,
    p.display_name AS displayName,
    o.legal_name AS legalName,
    o.trading_name AS tradingName,
    o.registration_number AS registrationNumber,
    o.tax_identifier AS taxIdentifier,
    o.country_code AS countryCode,
    p.status,
    p.version,
    p.created_at AS createdAt,
    p.updated_at AS updatedAt
  FROM parties p
  JOIN organisations o ON o.party_id = p.id
`;

function now() {
  return new Date().toISOString();
}

function cleanRequired(value: string, label: string) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error(`${label} is required.`);
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

function getOrganisationRow(context: CommandContext, id: string): Organisation {
  const row = db.prepare(`
    ${organisationSelect}
    WHERE p.tenant_id = ? AND p.party_type = 'ORGANISATION' AND p.id = ?
  `).get(context.tenantId, id) as Organisation | undefined;
  if (!row) throw new Error('Organisation not found.');
  return row;
}

function assertMutable(organisation: Organisation) {
  if (organisation.status === 'DISSOLVED' || organisation.status === 'MERGED') {
    throw new Error('Dissolved or merged organisations cannot be edited.');
  }
}

function publish(
  context: CommandContext,
  organisation: Organisation,
  eventType: string,
  note?: string,
  previousStatus?: OrganisationStatus | null
) {
  recordPlatformAudit(context, {
    aggregateId: 'AGG-01-PARTY',
    objectType: 'organisation',
    objectId: organisation.id,
    action: eventType,
    fromState: previousStatus === undefined ? organisation.status : previousStatus,
    toState: organisation.status,
    note
  });
  emitBusinessEvent(context, {
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
  });
}

export function listOrganisations(context: CommandContext): Organisation[] {
  assertPermission(context, 'party.read');
  return db.prepare(`
    ${organisationSelect}
    WHERE p.tenant_id = ? AND p.party_type = 'ORGANISATION'
    ORDER BY
      CASE p.status WHEN 'ACTIVE' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'INACTIVE' THEN 2 ELSE 3 END,
      p.display_name COLLATE NOCASE
  `).all(context.tenantId) as unknown as Organisation[];
}

export function getOrganisation(context: CommandContext, id: string): Organisation {
  assertPermission(context, 'party.read');
  return getOrganisationRow(context, id);
}

export function createOrganisation(context: CommandContext, input: OrganisationInput): string {
  assertPermission(context, 'party.create');
  const legalName = cleanRequired(input.legalName, 'Legal name');
  const tradingName = cleanOptional(input.tradingName);
  const registrationNumber = cleanOptional(input.registrationNumber);
  const taxIdentifier = cleanOptional(input.taxIdentifier);
  const countryCode = cleanCountry(input.countryCode);

  return dbTransaction(() => {
    if (registrationNumber) {
      const duplicate = db.prepare(`
        SELECT p.id
        FROM parties p
        JOIN organisations o ON o.party_id = p.id
        WHERE p.tenant_id = ? AND p.party_type = 'ORGANISATION'
          AND o.registration_number = ? AND p.status <> 'MERGED'
        LIMIT 1
      `).get(context.tenantId, registrationNumber);
      if (duplicate) throw new Error('An organisation with this registration number already exists.');
    }

    const id = randomUUID();
    const timestamp = now();
    db.prepare(`
      INSERT INTO parties
        (id, tenant_id, party_type, display_name, status, version, created_at, updated_at)
      VALUES (?, ?, 'ORGANISATION', ?, 'PROPOSED', 1, ?, ?)
    `).run(id, context.tenantId, tradingName ?? legalName, timestamp, timestamp);

    db.prepare(`
      INSERT INTO organisations
        (party_id, legal_name, trading_name, registration_number, tax_identifier, country_code, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, legalName, tradingName, registrationNumber, taxIdentifier, countryCode, timestamp, timestamp);

    const organisation = getOrganisationRow(context, id);
    publish(context, organisation, 'ORGANISATION_CREATED', 'Canonical Organisation Party created.', null);
    return id;
  });
}

export function updateOrganisation(
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

  return dbTransaction(() => {
    const current = getOrganisationRow(context, id);
    assertMutable(current);
    if (current.version !== expectedVersion) {
      throw new Error('This organisation changed after you opened it. Reload before saving.');
    }

    if (registrationNumber) {
      const duplicate = db.prepare(`
        SELECT p.id
        FROM parties p
        JOIN organisations o ON o.party_id = p.id
        WHERE p.tenant_id = ? AND p.party_type = 'ORGANISATION'
          AND o.registration_number = ? AND p.id <> ? AND p.status <> 'MERGED'
        LIMIT 1
      `).get(context.tenantId, registrationNumber, id);
      if (duplicate) throw new Error('Another organisation already uses this registration number.');
    }

    const timestamp = now();
    const result = db.prepare(`
      UPDATE parties
      SET display_name = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND tenant_id = ? AND version = ?
    `).run(tradingName ?? legalName, timestamp, id, context.tenantId, expectedVersion);

    if (Number(result.changes) !== 1) throw new Error('Concurrent organisation update detected.');

    db.prepare(`
      UPDATE organisations
      SET legal_name = ?, trading_name = ?, registration_number = ?, tax_identifier = ?,
          country_code = ?, updated_at = ?
      WHERE party_id = ?
    `).run(legalName, tradingName, registrationNumber, taxIdentifier, countryCode, timestamp, id);

    const updated = getOrganisationRow(context, id);
    publish(context, updated, 'ORGANISATION_CHANGED', 'Canonical Organisation master data changed.', current.status);
  });
}

export function activateOrganisation(context: CommandContext, id: string, expectedVersion: number) {
  assertPermission(context, 'party.activate');
  return changeStatus(context, id, expectedVersion, 'ACTIVE', ['PROPOSED', 'INACTIVE']);
}

export function deactivateOrganisation(context: CommandContext, id: string, expectedVersion: number) {
  assertPermission(context, 'party.activate');
  return changeStatus(context, id, expectedVersion, 'INACTIVE', ['ACTIVE']);
}

function changeStatus(
  context: CommandContext,
  id: string,
  expectedVersion: number,
  nextStatus: OrganisationStatus,
  allowed: OrganisationStatus[]
) {
  return dbTransaction(() => {
    const current = getOrganisationRow(context, id);
    if (current.version !== expectedVersion) {
      throw new Error('This organisation changed after you opened it. Reload before changing status.');
    }
    if (!allowed.includes(current.status)) {
      throw new Error(`Organisation cannot move from ${current.status} to ${nextStatus}.`);
    }

    const timestamp = now();
    const result = db.prepare(`
      UPDATE parties
      SET status = ?, version = version + 1, updated_at = ?
      WHERE id = ? AND tenant_id = ? AND version = ?
    `).run(nextStatus, timestamp, id, context.tenantId, expectedVersion);
    if (Number(result.changes) !== 1) throw new Error('Concurrent organisation status update detected.');

    const updated = getOrganisationRow(context, id);
    publish(
      context,
      updated,
      nextStatus === 'ACTIVE' ? 'ORGANISATION_ACTIVATED' : 'ORGANISATION_DEACTIVATED',
      undefined,
      current.status
    );
  });
}

export function listOrganisationAudit(
  context: CommandContext,
  id: string
): PlatformAuditEvent[] {
  getOrganisation(context, id);
  return listPlatformAudit(context, 'organisation', id);
}
