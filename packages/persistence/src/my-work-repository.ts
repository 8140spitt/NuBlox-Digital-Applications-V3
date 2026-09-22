import {
  PLATFORM_PERMISSION_KEYS,
  type DeliverableItemStatus,
  type NativeMyWorkKind,
  type NativeMyWorkProjectionItem,
  type PersonId,
  type TenantId,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
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

interface StrategyMyWorkRow extends RowDataPacket {
  source_id: string;
  title: string;
  work_type: string;
  subject_object_id: string;
  due_at: Date | null;
  status: string;
}

interface AccessRequestMyWorkRow extends RowDataPacket {
  request_id: string;
  requestor_name: string;
  permission_key: string;
  permission_name: string;
  scope_type: string;
  scope_id: string | null;
  reason: string;
  requested_at: Date;
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
  private readonly access: MySqlAccessRepository;
  private readonly work: MySqlWorkRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
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

    const [
      workItems,
      deliverables,
      recipientActions,
      competenceExpiries,
      accessManageEvaluation,
      f01ReadEvaluation
    ] = await Promise.all([
      this.work.listMyWork(tenantId, personId, evaluatedAt),
      this.listDeliverableActions(tenantId, personId, at),
      this.listRecipientActions(tenantId, personId, at),
      this.listCompetenceExpiries(tenantId, personId, at, horizon),
      this.access.evaluatePermission(
        tenantId,
        personId,
        PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
        { scopeType: 'TENANT' },
        evaluatedAt
      ),
      this.access.evaluatePermission(
        tenantId,
        personId,
        PLATFORM_PERMISSION_KEYS.F01_READ,
        { scopeType: 'TENANT' },
        evaluatedAt
      )
    ]);

    const accessRequests = accessManageEvaluation.allowed
      ? await this.listAccessRequests(tenantId)
      : [];
    const strategyWork = f01ReadEvaluation.allowed
      ? await this.listStrategyOwnedWork(tenantId, personId)
      : [];

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

    for (const row of strategyWork) {
      const dueAt = row.due_at?.toISOString();
      const key = `FUNCTION_WORK:F01:${row.work_type}:${row.source_id}`;
      result.set(key, {
        key,
        tenantId,
        personId,
        kind: 'FUNCTION_WORK',
        title: row.title,
        sourceId: row.source_id,
        subjectObjectId: row.subject_object_id as NonNullable<NativeMyWorkProjectionItem['subjectObjectId']>,
        ...(dueAt ? { dueAt } : {}),
        isOverdue: Boolean(dueAt && Date.parse(dueAt) < at.getTime() && row.status !== 'COMPLETE'),
        reason: `F01 ${row.work_type.replaceAll('_', ' ').toLowerCase()} owned by you · ${row.status}.`,
        href: '/app/functions/F01'
      });
    }

    for (const row of accessRequests) {
      const key = `ACCESS_REQUEST:${row.request_id}`;
      result.set(key, {
        key,
        tenantId,
        personId,
        kind: 'ACCESS_REQUEST',
        title: `Access request: ${row.permission_name}`,
        sourceId: row.request_id as NativeMyWorkProjectionItem['sourceId'],
        isOverdue: false,
        reason:
          `${row.requestor_name} requested ${row.permission_key} in ${row.scope_type}` +
          `${row.scope_id ? ` · ${row.scope_id}` : ''} scope: ${row.reason}`
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


  private async listStrategyOwnedWork(
    tenantId: TenantId,
    personId: PersonId
  ): Promise<StrategyMyWorkRow[]> {
    const [rows] = await this.pool.execute<StrategyMyWorkRow[]>(
      `SELECT id AS source_id, title, 'OBJECTIVE' AS work_type,
              canonical_object_id AS subject_object_id, effective_to AS due_at, status
         FROM strategy_objectives
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'INITIATIVE', canonical_object_id, end_date, status
         FROM strategy_initiatives
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'ROADMAP', canonical_object_id, end_date, status
         FROM strategy_roadmaps
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'SCENARIO', canonical_object_id, NULL, status
         FROM strategy_scenarios
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'PLAN', canonical_object_id, period_end, status
         FROM strategy_plans
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'OUTCOME', canonical_object_id, NULL, status
         FROM strategy_outcomes
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       UNION ALL
       SELECT id, title, 'ANALYSIS', canonical_object_id, NULL, status
         FROM strategy_analyses
        WHERE tenant_id = ? AND owner_person_id = ? AND status NOT IN ('COMPLETE','CANCELLED')
       ORDER BY due_at IS NULL, due_at, title`,
      [
        tenantId, personId,
        tenantId, personId,
        tenantId, personId,
        tenantId, personId,
        tenantId, personId,
        tenantId, personId,
        tenantId, personId
      ]
    );
    return rows;
  }

  private async listAccessRequests(
    tenantId: TenantId
  ): Promise<AccessRequestMyWorkRow[]> {
    const [rows] = await this.pool.execute<AccessRequestMyWorkRow[]>(
      `SELECT r.id AS request_id,
              COALESCE(p.preferred_name, p.legal_name) AS requestor_name,
              r.permission_key,
              pd.name AS permission_name,
              r.scope_type,
              r.scope_id,
              r.reason,
              r.requested_at
         FROM access_permission_requests r
         JOIN persons p
           ON p.tenant_id = r.tenant_id
          AND p.id = r.requestor_person_id
         JOIN permission_definitions pd
           ON pd.permission_key = r.permission_key
        WHERE r.tenant_id = ?
          AND r.status = 'PENDING'
        ORDER BY r.requested_at, r.id`,
      [tenantId]
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
