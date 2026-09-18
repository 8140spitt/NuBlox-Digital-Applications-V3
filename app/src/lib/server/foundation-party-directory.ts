import type { RowDataPacket } from 'mysql2/promise';
import { queryOne, queryRows } from '$lib/server/db';
import { assertPermission, type CommandContext } from '$lib/server/platform-context';

export type PartyDirectoryEntry = {
  id: string;
  partyType: 'PERSON' | 'ORGANISATION';
  displayName: string;
  status: string;
  version: number;
  givenName: string | null;
  middleNames: string | null;
  familyName: string | null;
  preferredName: string | null;
  legalName: string | null;
  tradingName: string | null;
  registrationNumber: string | null;
  countryCode: string | null;
  isLegalEntity: boolean;
  legalEntityType: string | null;
  jurisdictionCode: string | null;
  accountingCurrency: string | null;
  createdAt: string;
  updatedAt: string;
};

type PartyDirectoryRow = RowDataPacket & Omit<PartyDirectoryEntry, 'isLegalEntity'> & {
  isLegalEntity: number;
};

export type PartyDirectoryRelationship = {
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

const partySelect = `
  SELECT p.id,
         p.party_type AS partyType,
         p.display_name AS displayName,
         p.status,
         p.version,
         pe.given_name AS givenName,
         pe.middle_names AS middleNames,
         pe.family_name AS familyName,
         pe.preferred_name AS preferredName,
         o.legal_name AS legalName,
         o.trading_name AS tradingName,
         o.registration_number AS registrationNumber,
         o.country_code AS countryCode,
         CASE WHEN le.party_id IS NULL THEN 0 ELSE 1 END AS isLegalEntity,
         le.legal_entity_type AS legalEntityType,
         le.jurisdiction_code AS jurisdictionCode,
         le.accounting_currency AS accountingCurrency,
         p.created_at AS createdAt,
         p.updated_at AS updatedAt
    FROM parties p
    LEFT JOIN persons pe ON pe.party_id = p.id
    LEFT JOIN organisations o ON o.party_id = p.id
    LEFT JOIN legal_entities le ON le.party_id = p.id
`;

function mapParty(row: PartyDirectoryRow): PartyDirectoryEntry {
  return { ...row, isLegalEntity: Boolean(row.isLegalEntity) };
}

export async function listPartyDirectory(context: CommandContext): Promise<PartyDirectoryEntry[]> {
  assertPermission(context, 'party.read');
  const rows = await queryRows<PartyDirectoryRow>(
    partySelect +
      ` WHERE p.tenant_id = ?
          ORDER BY CASE p.status WHEN 'ACTIVE' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'INACTIVE' THEN 2 ELSE 3 END,
                   p.display_name,
                   p.id`,
    [context.tenantId]
  );
  return rows.map(mapParty);
}

export async function getPartyDirectoryEntry(
  context: CommandContext,
  partyId: string
): Promise<PartyDirectoryEntry> {
  assertPermission(context, 'party.read');
  const row = await queryOne<PartyDirectoryRow>(
    partySelect + ' WHERE p.tenant_id = ? AND p.id = ?',
    [context.tenantId, partyId]
  );
  if (!row) throw new Error('Party not found.');
  return mapParty(row);
}

export async function listPartyDirectoryRelationships(
  context: CommandContext,
  partyId: string
): Promise<PartyDirectoryRelationship[]> {
  assertPermission(context, 'party.relationship.read');
  return queryRows<RowDataPacket & PartyDirectoryRelationship>(
    `SELECT r.id,
            r.from_party_id AS fromPartyId,
            fp.display_name AS fromDisplayName,
            r.to_party_id AS toPartyId,
            tp.display_name AS toDisplayName,
            r.relationship_type AS relationshipType,
            r.context_type AS contextType,
            r.context_id AS contextId,
            r.status,
            r.version,
            r.valid_from AS validFrom,
            r.valid_to AS validTo
       FROM party_relationships r
       JOIN parties fp ON fp.id = r.from_party_id
       JOIN parties tp ON tp.id = r.to_party_id
      WHERE r.tenant_id = ?
        AND (r.from_party_id = ? OR r.to_party_id = ?)
      ORDER BY CASE r.status WHEN 'ACTIVE' THEN 0 WHEN 'PROPOSED' THEN 1 WHEN 'SUSPENDED' THEN 2 ELSE 3 END,
               r.relationship_type,
               fp.display_name,
               tp.display_name`,
    [context.tenantId, partyId, partyId]
  );
}
