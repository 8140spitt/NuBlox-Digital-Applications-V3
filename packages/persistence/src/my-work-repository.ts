import {
  type DeliverableItemStatus,
  type NativeMyWorkKind,
  type NativeMyWorkProjectionItem,
  type PersonId,
  type TenantId,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlWorkRepository } from './work-repository.js';

interface DeliverableMyWorkRow extends RowDataPacket {
  item_id: string;
  title: string;
  context_object_id: string;
  governed_output_object_id: string | null;
  governed_output_version: string | null;
  item_status: DeliverableItemStatus;
  planned_due_at: Date | null;
  responsibility_role: WorkResponsibilityRole;
  principal_type: string;
}

interface RecipientActionRow extends RowDataPacket {
  recipient_id: string;
  item_id: string;
  title: string;
  context_object_id: string;
  governed_output_object_id: string | null;
  governed_output_version: string | null;
  due_at: Date | null;
}

interface CompetenceExpiryRow extends RowDataPacket {
  evidence_id: string;
  competence_code: string;
  attained_level: string;
  effective_to: Date;
}

interface PersonPartyRow extends RowDataPacket {
  party_id: string;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }
  return date;
}

function deliverableKind(
  status: DeliverableItemStatus,
  role: WorkResponsibilityRole
): NativeMyWorkKind {
  if (
    status === 'IN_REVIEW' &&
    (role === 'REVIEWER' || role === 'CHECKER' || role === 'ASSURANCE')
  ) {
    return 'REVIEW';
  }
  if (status === 'IN_REVIEW' && role === 'APPROVER') return 'APPROVAL';
  if (status === 'ISSUED' && role === 'ACCEPTOR') return 'ACCEPTANCE';
  return 'DELIVERABLE';
}

export class MySqlMyWorkRepository {
  private readonly work: MySqlWorkRepository;

  constructor(private readonly pool: Pool) {
    this.work = new MySqlWorkRepository(pool);
  }

  async listMyWork(
    tenantId: TenantId,
    personId: PersonId,
    evaluatedAt = new Date().toISOString(),
    competenceExpiryHorizonDays = 30
  ): Promise<NativeMyWorkProjectionItem[]> {
    if (
      !Number.isInteger(competenceExpiryHorizonDays) ||
      competenceExpiryHorizonDays < 0 ||
      competenceExpiryHorizonDays > 3650
    ) {
      throw new Error('Competence expiry horizon must be an integer between 0 and 3650 days.');
    }

    const at = databaseDate(evaluatedAt);
    const horizon = new Date(
      at.getTime() + competenceExpiryHorizonDays * 24 * 60 * 60 * 1000
    );

    const [workItems, deliverables, recipientActions, competenceExpiries] =
      await Promise.all([
        this.work.listMyWork(tenantId, personId, evaluatedAt),
        this.listDeliverableActions(tenantId, personId, at),
        this.listRecipientActions(tenantId, personId, at),
        this.listCompetenceExpiries(tenantId, personId, at, horizon)
      ]);

    const result = new Map<string, NativeMyWorkProjectionItem>();

    for (const work of workItems) {
      const item = work.workItem;
      result.set(`WORK:${item.id}`, {
        key: `WORK:${item.id}`,
        tenantId,
        personId,
        kind: 'WORK',
        title: item.title,
        sourceId: item.id,
        subjectObjectId: item.subjectObjectId,
        ...(item.subjectVersion ? { subjectVersion: item.subjectVersion } : {}),
        responsibilityRole: work.responsibilityRole,
        priority: item.priority,
        ...(item.dueAt ? { dueAt: item.dueAt } : {}),
        isOverdue: work.isOverdue,
        reason: `Assigned through ${work.assignedThrough} as ${work.responsibilityRole}.`
      });
    }

    for (const row of deliverables) {
      const kind = deliverableKind(row.item_status, row.responsibility_role);
      const key = `${kind}:${row.item_id}`;
      const dueAt = row.planned_due_at?.toISOString();
      const candidate: NativeMyWorkProjectionItem = {
        key,
        tenantId,
        personId,
        kind,
        title: row.title,
        sourceId: row.item_id as NativeMyWorkProjectionItem['sourceId'],
        contextObjectId: row.context_object_id as NonNullable<
          NativeMyWorkProjectionItem['contextObjectId']
        >,
        ...(row.governed_output_object_id
          ? {
              subjectObjectId:
                row.governed_output_object_id as NonNullable<
                  NativeMyWorkProjectionItem['subjectObjectId']
                >
            }
          : {}),
        ...(row.governed_output_version
          ? { subjectVersion: row.governed_output_version }
          : {}),
        responsibilityRole: row.responsibility_role,
        ...(dueAt ? { dueAt } : {}),
        isOverdue: Boolean(dueAt && Date.parse(dueAt) < at.getTime()),
        reason: `${row.responsibility_role} responsibility resolved through ${row.principal_type}.`
      };

      const existing = result.get(key);
      if (!existing || this.responsibilityRank(candidate.responsibilityRole) < this.responsibilityRank(existing.responsibilityRole)) {
        result.set(key, candidate);
      }
    }

    for (const row of recipientActions) {
      const key = `ACCEPTANCE:${row.item_id}`;
      if (result.has(key)) continue;
      const dueAt = row.due_at?.toISOString();
      result.set(key, {
        key,
        tenantId,
        personId,
        kind: 'ACCEPTANCE',
        title: row.title,
        sourceId: row.item_id as NativeMyWorkProjectionItem['sourceId'],
        contextObjectId:
          row.context_object_id as NonNullable<
            NativeMyWorkProjectionItem['contextObjectId']
          >,
        ...(row.governed_output_object_id
          ? {
              subjectObjectId:
                row.governed_output_object_id as NonNullable<
                  NativeMyWorkProjectionItem['subjectObjectId']
                >
            }
          : {}),
        ...(row.governed_output_version
          ? { subjectVersion: row.governed_output_version }
          : {}),
        ...(dueAt ? { dueAt } : {}),
        isOverdue: Boolean(dueAt && Date.parse(dueAt) < at.getTime()),
        reason: 'A response-required Transmittal is awaiting your recipient response.'
      });
    }

    for (const row of competenceExpiries) {
      const key = `COMPETENCE:${row.evidence_id}`;
      result.set(key, {
        key,
        tenantId,
        personId,
        kind: 'COMPETENCE',
        title: `Competence expiring: ${row.competence_code}`,
        sourceId: row.evidence_id as NativeMyWorkProjectionItem['sourceId'],
        dueAt: row.effective_to.toISOString(),
        isOverdue: row.effective_to.getTime() < at.getTime(),
        reason: `${row.competence_code} at level ${row.attained_level} expires within ${competenceExpiryHorizonDays} days.`
      });
    }

    return [...result.values()].sort((a, b) => {
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (a.dueAt && b.dueAt) return Date.parse(a.dueAt) - Date.parse(b.dueAt);
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title);
    });
  }

  private async listDeliverableActions(
    tenantId: TenantId,
    personId: PersonId,
    at: Date
  ): Promise<DeliverableMyWorkRow[]> {
    const [rows] = await this.pool.execute<DeliverableMyWorkRow[]>(
      `SELECT
          di.id AS item_id,
          di.title,
          di.context_object_id,
          di.governed_output_object_id,
          di.governed_output_version,
          di.status AS item_status,
          drq.planned_due_at,
          dr.responsibility_role,
          dr.principal_type
         FROM deliverable_responsibilities dr
         JOIN deliverable_items di
           ON di.tenant_id = dr.tenant_id
          AND di.id = dr.deliverable_item_id
         JOIN deliverable_requirements drq
           ON drq.tenant_id = di.tenant_id
          AND drq.id = di.requirement_id
        WHERE dr.tenant_id = ?
          AND dr.status = 'ACTIVE'
          AND dr.effective_from <= ?
          AND (dr.effective_to IS NULL OR dr.effective_to >= ?)
          AND di.status NOT IN ('CLOSED', 'CANCELLED')
          AND (
            (dr.principal_type = 'PERSON' AND dr.principal_id = ?)
            OR
            (dr.principal_type = 'POSITION' AND dr.principal_id IN (
              SELECT po.position_id
                FROM position_occupancies po
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
            ))
            OR
            (dr.principal_type = 'ORGANISATION_UNIT' AND dr.principal_id IN (
              SELECT p.organisation_unit_id
                FROM position_occupancies po
                JOIN positions p
                  ON p.tenant_id = po.tenant_id
                 AND p.id = po.position_id
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
                 AND p.status = 'ACTIVE'
            ))
            OR
            (dr.principal_type = 'ORGANISATION' AND dr.principal_id IN (
              SELECT ou.organisation_id
                FROM position_occupancies po
                JOIN positions p
                  ON p.tenant_id = po.tenant_id
                 AND p.id = po.position_id
                JOIN organisation_units ou
                  ON ou.tenant_id = p.tenant_id
                 AND ou.id = p.organisation_unit_id
               WHERE po.tenant_id = ?
                 AND po.person_id = ?
                 AND po.effective_from <= ?
                 AND (po.effective_to IS NULL OR po.effective_to >= ?)
                 AND p.status = 'ACTIVE'
                 AND ou.status = 'ACTIVE'
            ))
          )
        ORDER BY dr.effective_from DESC, dr.id`,
      [
        tenantId,
        at,
        at,
        personId,
        tenantId,
        personId,
        at,
        at,
        tenantId,
        personId,
        at,
        at,
        tenantId,
        personId,
        at,
        at
      ]
    );
    return rows;
  }

  private async listRecipientActions(
    tenantId: TenantId,
    personId: PersonId,
    at: Date
  ): Promise<RecipientActionRow[]> {
    const [personRows] = await this.pool.execute<PersonPartyRow[]>(
      'SELECT party_id FROM persons WHERE tenant_id = ? AND id = ?',
      [tenantId, personId]
    );
    const partyId = personRows[0]?.party_id;
    if (!partyId) return [];

    const [rows] = await this.pool.execute<RecipientActionRow[]>(
      `SELECT
          tr.id AS recipient_id,
          di.id AS item_id,
          di.title,
          di.context_object_id,
          di.governed_output_object_id,
          di.governed_output_version,
          tr.due_at
         FROM transmittal_recipients tr
         JOIN transmittals t
           ON t.tenant_id = tr.tenant_id
          AND t.id = tr.transmittal_id
         JOIN deliverable_items di
           ON di.tenant_id = t.tenant_id
          AND di.id = t.deliverable_item_id
         LEFT JOIN recipient_responses rr
           ON rr.tenant_id = tr.tenant_id
          AND rr.transmittal_recipient_id = tr.id
        WHERE tr.tenant_id = ?
          AND tr.recipient_party_id = ?
          AND tr.response_required = TRUE
          AND rr.id IS NULL
          AND di.status = 'ISSUED'
        ORDER BY tr.due_at IS NULL, tr.due_at, tr.id`,
      [tenantId, partyId]
    );
    return rows;
  }

  private async listCompetenceExpiries(
    tenantId: TenantId,
    personId: PersonId,
    at: Date,
    horizon: Date
  ): Promise<CompetenceExpiryRow[]> {
    const [rows] = await this.pool.execute<CompetenceExpiryRow[]>(
      `SELECT
          id AS evidence_id,
          competence_code,
          attained_level,
          effective_to
         FROM competence_evidence
        WHERE tenant_id = ?
          AND person_id = ?
          AND status = 'ACTIVE'
          AND effective_to IS NOT NULL
          AND effective_to >= ?
          AND effective_to <= ?
        ORDER BY effective_to, competence_code, id`,
      [tenantId, personId, at, horizon]
    );
    return rows;
  }

  private responsibilityRank(role: WorkResponsibilityRole | undefined): number {
    switch (role) {
      case 'APPROVER':
        return 1;
      case 'ACCEPTOR':
        return 2;
      case 'REVIEWER':
      case 'CHECKER':
      case 'ASSURANCE':
        return 3;
      case 'RESPONSIBLE':
        return 4;
      case 'ACCOUNTABLE':
        return 5;
      default:
        return 10;
    }
  }
}
