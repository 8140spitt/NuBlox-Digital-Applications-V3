import type { PartyType, RecordStatus, TenantId } from '@nublox/kernel';
import type { PoolConnection } from 'mysql2/promise';

export async function upsertPartyType(
  connection: PoolConnection,
  input: {
    tenantId: TenantId | string;
    partyId: string;
    partyType: PartyType;
    status?: RecordStatus;
    actorPersonId?: string;
  }
): Promise<void> {
  await connection.execute(
    `INSERT INTO party_type_assignments
      (tenant_id, party_id, party_type, status, created_by_person_id, updated_by_person_id)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       updated_by_person_id = VALUES(updated_by_person_id),
       row_version = row_version + 1`,
    [
      input.tenantId,
      input.partyId,
      input.partyType,
      input.status ?? 'ACTIVE',
      input.actorPersonId ?? null,
      input.actorPersonId ?? null
    ]
  );
}
