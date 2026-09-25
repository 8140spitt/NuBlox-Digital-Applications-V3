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
    correlationId?: string;
  }
): Promise<void> {
  const status = input.status ?? 'ACTIVE';

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
      status,
      input.actorPersonId ?? null,
      input.actorPersonId ?? null
    ]
  );

  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, 'PARTY_TYPE_ASSIGNMENT', ?, ?, ?, ?, ?)`,
    [
      input.tenantId,
      input.partyId,
      status === 'ACTIVE' ? 'ASSIGNED' : 'DEACTIVATED',
      input.actorPersonId ?? null,
      input.correlationId ?? null,
      JSON.stringify({ partyId: input.partyId, partyType: input.partyType, status })
    ]
  );
}
