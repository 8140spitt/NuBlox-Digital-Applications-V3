import {
  addChangeAffectedObject,
  applyChangeDecision,
  beginChangeVerification,
  closeChange,
  completeChangeImplementationAction,
  createChange,
  createChangeDiscrepancy,
  createChangeImpactAssessment,
  createChangeImplementationAction,
  createChangeVerification,
  resolveChangeDiscrepancy,
  startChangeAssessment,
  startChangeImplementation,
  startChangeImplementationAction,
  submitChangeForDecision,
  type Baseline,
  type CanonicalObjectIdentity,
  type Change,
  type ChangeAffectedObject,
  type ChangeDiscrepancy,
  type ChangeImpactAssessment,
  type ChangeImplementationAction,
  type ChangeVerification,
  type Decision,
  type Person,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import type { AuditContext } from './repository.js';

interface ChangeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  code: string;
  title: string;
  description: string;
  change_type: string;
  status: Change['status'];
  raised_by_person_id: string;
  raised_at: Date;
  decision_id: string | null;
  decided_at: Date | null;
  resulting_baseline_id: string | null;
  closed_at: Date | null;
  row_version: number;
}

interface AffectedObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  change_id: string;
  subject_object_id: string;
  subject_version: string | null;
  disposition: ChangeAffectedObject['disposition'];
  rationale: string;
}


interface ImplementationActionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  change_id: string;
  action_type: string;
  description: string;
  target_object_id: string | null;
  target_version: string | null;
  work_item_id: string | null;
  status: ChangeImplementationAction['status'];
  completed_at: Date | null;
  row_version: number;
}

interface VerificationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  change_id: string;
  verifier_person_id: string;
  verified_at: Date;
  outcome: ChangeVerification['outcome'];
  evidence_record_id: string | null;
  notes: string;
}

interface DiscrepancyRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  change_id: string;
  affected_object_id: string | null;
  description: string;
  status: ChangeDiscrepancy['status'];
  resolved_at: Date | null;
  resolution: string | null;
  row_version: number;
}

interface CanonicalObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface PersonRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  party_id: string;
  legal_name: string;
  preferred_name: string | null;
  status: Person['status'];
}

interface DecisionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  decision_type: string;
  subject_object_id: string;
  subject_version: string | null;
  outcome: string;
  reason: string;
  decider_person_id: string;
  authority_grant_id: string | null;
  decided_at: Date;
}

interface BaselineRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  context_object_id: string;
  code: string;
  name: string;
  status: Baseline['status'];
  established_at: Date | null;
  establishment_decision_id: string | null;
  superseded_by_baseline_id: string | null;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date/time value: ${value}`);
  }
  return date;
}

async function writeAudit(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );
}

function mapChange(row: ChangeRow): Change {
  return {
    id: row.id as Change['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as Change['canonicalObjectId'],
    code: row.code,
    title: row.title,
    description: row.description,
    changeType: row.change_type,
    status: row.status,
    raisedByPersonId: row.raised_by_person_id as Change['raisedByPersonId'],
    raisedAt: row.raised_at.toISOString(),
    ...(row.decision_id ? { decisionId: row.decision_id as NonNullable<Change['decisionId']> } : {}),
    ...(row.decided_at ? { decidedAt: row.decided_at.toISOString() } : {}),
    ...(row.resulting_baseline_id
      ? { resultingBaselineId: row.resulting_baseline_id as NonNullable<Change['resultingBaselineId']> }
      : {}),
    ...(row.closed_at ? { closedAt: row.closed_at.toISOString() } : {})
  };
}

function mapAffectedObject(row: AffectedObjectRow): ChangeAffectedObject {
  return {
    id: row.id as ChangeAffectedObject['id'],
    tenantId: row.tenant_id as TenantId,
    changeId: row.change_id as ChangeAffectedObject['changeId'],
    subjectObjectId: row.subject_object_id as ChangeAffectedObject['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    disposition: row.disposition,
    rationale: row.rationale
  };
}

function mapImplementationAction(row: ImplementationActionRow): ChangeImplementationAction {
  return {
    id: row.id as ChangeImplementationAction['id'],
    tenantId: row.tenant_id as TenantId,
    changeId: row.change_id as ChangeImplementationAction['changeId'],
    actionType: row.action_type,
    description: row.description,
    ...(row.target_object_id
      ? { targetObjectId: row.target_object_id as NonNullable<ChangeImplementationAction['targetObjectId']> }
      : {}),
    ...(row.target_version ? { targetVersion: row.target_version } : {}),
    ...(row.work_item_id
      ? { workItemId: row.work_item_id as NonNullable<ChangeImplementationAction['workItemId']> }
      : {}),
    status: row.status,
    ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {})
  };
}

function mapVerification(row: VerificationRow): ChangeVerification {
  return {
    id: row.id as ChangeVerification['id'],
    tenantId: row.tenant_id as TenantId,
    changeId: row.change_id as ChangeVerification['changeId'],
    verifierPersonId: row.verifier_person_id as ChangeVerification['verifierPersonId'],
    verifiedAt: row.verified_at.toISOString(),
    outcome: row.outcome,
    ...(row.evidence_record_id
      ? { evidenceRecordId: row.evidence_record_id as NonNullable<ChangeVerification['evidenceRecordId']> }
      : {}),
    notes: row.notes
  };
}

function mapDiscrepancy(row: DiscrepancyRow): ChangeDiscrepancy {
  return {
    id: row.id as ChangeDiscrepancy['id'],
    tenantId: row.tenant_id as TenantId,
    changeId: row.change_id as ChangeDiscrepancy['changeId'],
    ...(row.affected_object_id
      ? { affectedObjectId: row.affected_object_id as NonNullable<ChangeDiscrepancy['affectedObjectId']> }
      : {}),
    description: row.description,
    status: row.status,
    ...(row.resolved_at ? { resolvedAt: row.resolved_at.toISOString() } : {}),
    ...(row.resolution ? { resolution: row.resolution } : {})
  };
}

function mapCanonicalObject(row: CanonicalObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapPerson(row: PersonRow): Person {
  return {
    id: row.id as Person['id'],
    tenantId: row.tenant_id as TenantId,
    partyId: row.party_id as Person['partyId'],
    legalName: row.legal_name,
    ...(row.preferred_name ? { preferredName: row.preferred_name } : {}),
    status: row.status
  };
}

function mapDecision(row: DecisionRow): Decision {
  return {
    id: row.id as Decision['id'],
    tenantId: row.tenant_id as TenantId,
    decisionType: row.decision_type,
    subjectObjectId: row.subject_object_id as Decision['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    outcome: row.outcome,
    reason: row.reason,
    deciderPersonId: row.decider_person_id as Decision['deciderPersonId'],
    ...(row.authority_grant_id
      ? { authorityGrantId: row.authority_grant_id as NonNullable<Decision['authorityGrantId']> }
      : {}),
    decidedAt: row.decided_at.toISOString()
  };
}

function mapBaseline(row: BaselineRow): Baseline {
  return {
    id: row.id as Baseline['id'],
    tenantId: row.tenant_id as TenantId,
    contextObjectId: row.context_object_id as Baseline['contextObjectId'],
    code: row.code,
    name: row.name,
    status: row.status,
    ...(row.established_at ? { establishedAt: row.established_at.toISOString() } : {}),
    ...(row.establishment_decision_id
      ? { establishmentDecisionId: row.establishment_decision_id as NonNullable<Baseline['establishmentDecisionId']> }
      : {}),
    ...(row.superseded_by_baseline_id
      ? { supersededByBaselineId: row.superseded_by_baseline_id as NonNullable<Baseline['supersededByBaselineId']> }
      : {})
  };
}

export class MySqlChangeRepository {
  constructor(private readonly pool: Pool) {}

  async createChange(
    tenantId: TenantId,
    change: Change,
    audit: AuditContext = {}
  ): Promise<void> {
    if (change.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [object, raiser] = await Promise.all([
      this.requireCanonicalObject(tenantId, change.canonicalObjectId),
      this.requirePerson(tenantId, change.raisedByPersonId)
    ]);
    createChange(change, object, raiser);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO changes
          (id, tenant_id, canonical_object_id, code, title, description, change_type,
           status, raised_by_person_id, raised_at, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          change.id,
          change.tenantId,
          change.canonicalObjectId,
          change.code,
          change.title,
          change.description,
          change.changeType,
          change.status,
          change.raisedByPersonId,
          databaseDate(change.raisedAt),
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await this.insertStatusHistory(
        connection,
        change,
        change.raisedAt,
        'Change raised.',
        audit
      );
      await writeAudit(connection, tenantId, 'CHANGE', change.id, 'CREATED', audit, change);
    });
  }

  async addAffectedObject(
    tenantId: TenantId,
    affected: ChangeAffectedObject,
    audit: AuditContext = {}
  ): Promise<void> {
    if (affected.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [change, subject] = await Promise.all([
      this.requireChange(tenantId, affected.changeId),
      this.requireCanonicalObject(tenantId, affected.subjectObjectId)
    ]);
    addChangeAffectedObject(affected, change, subject);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO change_affected_objects
          (id, tenant_id, change_id, subject_object_id, subject_version,
           disposition, rationale, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          affected.id,
          affected.tenantId,
          affected.changeId,
          affected.subjectObjectId,
          affected.subjectVersion ?? null,
          affected.disposition,
          affected.rationale,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_AFFECTED_OBJECT',
        affected.id,
        'ADDED',
        audit,
        affected
      );
    });
  }

  async startAssessment(
    tenantId: TenantId,
    changeId: Change['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<Change> {
    return this.transitionChange(
      tenantId,
      changeId,
      at,
      'ASSESSMENT_STARTED',
      'Change assessment started.',
      startChangeAssessment,
      audit
    );
  }

  async addImpactAssessment(
    tenantId: TenantId,
    assessment: ChangeImpactAssessment,
    audit: AuditContext = {}
  ): Promise<void> {
    if (assessment.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [change, assessor] = await Promise.all([
      this.requireChange(tenantId, assessment.changeId),
      this.requirePerson(tenantId, assessment.assessorPersonId)
    ]);
    createChangeImpactAssessment(assessment, change, assessor);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO change_impact_assessments
          (id, tenant_id, change_id, domain, assessor_person_id, assessed_at,
           impact_level, summary, cost_impact, schedule_impact_days, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assessment.id,
          assessment.tenantId,
          assessment.changeId,
          assessment.domain,
          assessment.assessorPersonId,
          databaseDate(assessment.assessedAt),
          assessment.impactLevel,
          assessment.summary,
          assessment.costImpact ?? null,
          assessment.scheduleImpactDays ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_IMPACT_ASSESSMENT',
        assessment.id,
        'RECORDED',
        audit,
        assessment
      );
    });
  }

  async submitForDecision(
    tenantId: TenantId,
    changeId: Change['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<Change> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireChangeForUpdate(connection, tenantId, changeId);
      const current = mapChange(row);

      const [affectedRows] = await connection.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM change_affected_objects WHERE tenant_id = ? AND change_id = ?',
        [tenantId, changeId]
      );
      if (Number(affectedRows[0]?.count ?? 0) === 0) {
        throw new Error('Change cannot await decision without affected objects.');
      }

      const [impactRows] = await connection.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM change_impact_assessments WHERE tenant_id = ? AND change_id = ?',
        [tenantId, changeId]
      );
      if (Number(impactRows[0]?.count ?? 0) === 0) {
        throw new Error('Change cannot await decision without impact assessment.');
      }

      const next = submitChangeForDecision(current);
      await this.updateChange(connection, row, next, audit);
      await this.insertStatusHistory(
        connection,
        next,
        at,
        'Change submitted for decision.',
        audit
      );
      await writeAudit(connection, tenantId, 'CHANGE', changeId, 'AWAITING_DECISION', audit, next);
      return next;
    });
  }

  async applyDecision(
    tenantId: TenantId,
    changeId: Change['id'],
    decisionId: Decision['id'],
    audit: AuditContext = {}
  ): Promise<Change> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireChangeForUpdate(connection, tenantId, changeId);
      const current = mapChange(row);
      const decision = await this.requireDecision(tenantId, decisionId, connection);
      const next = applyChangeDecision(current, decision);
      await this.updateChange(connection, row, next, audit);
      await this.insertStatusHistory(
        connection,
        next,
        decision.decidedAt,
        `Change decision: ${decision.outcome}.`,
        audit
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE',
        changeId,
        decision.outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        audit,
        { decisionId, outcome: decision.outcome }
      );
      return next;
    });
  }

  async createImplementationAction(
    tenantId: TenantId,
    action: ChangeImplementationAction,
    audit: AuditContext = {}
  ): Promise<void> {
    if (action.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [change, target] = await Promise.all([
      this.requireChange(tenantId, action.changeId),
      action.targetObjectId
        ? this.requireCanonicalObject(tenantId, action.targetObjectId)
        : Promise.resolve(undefined)
    ]);
    if (action.workItemId) {
      await this.requireWorkItem(tenantId, action.workItemId);
    }
    createChangeImplementationAction(action, change, target);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO change_implementation_actions
          (id, tenant_id, change_id, action_type, description, target_object_id,
           target_version, work_item_id, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          action.id,
          action.tenantId,
          action.changeId,
          action.actionType,
          action.description,
          action.targetObjectId ?? null,
          action.targetVersion ?? null,
          action.workItemId ?? null,
          action.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_IMPLEMENTATION_ACTION',
        action.id,
        'CREATED',
        audit,
        action
      );
    });
  }

  async startImplementation(
    tenantId: TenantId,
    changeId: Change['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<Change> {
    return this.transitionChange(
      tenantId,
      changeId,
      at,
      'IMPLEMENTATION_STARTED',
      'Change implementation started.',
      startChangeImplementation,
      audit
    );
  }

  async startImplementationAction(
    tenantId: TenantId,
    actionId: ChangeImplementationAction['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<ChangeImplementationAction> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireImplementationActionForUpdate(
        connection,
        tenantId,
        actionId
      );
      const current = mapImplementationAction(row);
      const next = startChangeImplementationAction(current);
      await this.updateImplementationAction(connection, row, next, audit);
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_IMPLEMENTATION_ACTION',
        actionId,
        'STARTED',
        audit,
        { at }
      );
      return next;
    });
  }

  async completeImplementationAction(
    tenantId: TenantId,
    actionId: ChangeImplementationAction['id'],
    completedAt: string,
    audit: AuditContext = {}
  ): Promise<ChangeImplementationAction> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireImplementationActionForUpdate(
        connection,
        tenantId,
        actionId
      );
      const current = mapImplementationAction(row);
      const next = completeChangeImplementationAction(current, completedAt);
      await this.updateImplementationAction(connection, row, next, audit);
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_IMPLEMENTATION_ACTION',
        actionId,
        'COMPLETED',
        audit,
        next
      );
      return next;
    });
  }

  async beginVerification(
    tenantId: TenantId,
    changeId: Change['id'],
    at: string,
    audit: AuditContext = {}
  ): Promise<Change> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireChangeForUpdate(connection, tenantId, changeId);
      const current = mapChange(row);

      const [allActions] = await connection.execute<CountRow[]>(
        'SELECT COUNT(*) AS count FROM change_implementation_actions WHERE tenant_id = ? AND change_id = ?',
        [tenantId, changeId]
      );
      if (Number(allActions[0]?.count ?? 0) === 0) {
        throw new Error('Change cannot enter verification without implementation actions.');
      }

      const [openActions] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM change_implementation_actions
          WHERE tenant_id = ? AND change_id = ?
            AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [tenantId, changeId]
      );
      if (Number(openActions[0]?.count ?? 0) > 0) {
        throw new Error('Change cannot enter verification while implementation actions remain open.');
      }

      const next = beginChangeVerification(current);
      await this.updateChange(connection, row, next, audit);
      await this.insertStatusHistory(
        connection,
        next,
        at,
        'Change entered verification.',
        audit
      );
      await writeAudit(connection, tenantId, 'CHANGE', changeId, 'VERIFYING', audit, next);
      return next;
    });
  }

  async createVerification(
    tenantId: TenantId,
    verification: ChangeVerification,
    audit: AuditContext = {}
  ): Promise<void> {
    if (verification.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [change, verifier] = await Promise.all([
      this.requireChange(tenantId, verification.changeId),
      this.requirePerson(tenantId, verification.verifierPersonId)
    ]);
    if (verification.evidenceRecordId) {
      await this.requireEvidence(tenantId, verification.evidenceRecordId);
    }
    createChangeVerification(verification, change, verifier);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO change_verifications
          (id, tenant_id, change_id, verifier_person_id, verified_at,
           outcome, evidence_record_id, notes, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          verification.id,
          verification.tenantId,
          verification.changeId,
          verification.verifierPersonId,
          databaseDate(verification.verifiedAt),
          verification.outcome,
          verification.evidenceRecordId ?? null,
          verification.notes,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_VERIFICATION',
        verification.id,
        'RECORDED',
        audit,
        verification
      );
    });
  }

  async createDiscrepancy(
    tenantId: TenantId,
    discrepancy: ChangeDiscrepancy,
    audit: AuditContext = {}
  ): Promise<void> {
    if (discrepancy.tenantId !== tenantId) {
      throw new Error('Persistence operation crossed tenant boundary.');
    }
    const [change, affected] = await Promise.all([
      this.requireChange(tenantId, discrepancy.changeId),
      discrepancy.affectedObjectId
        ? this.requireAffectedObject(tenantId, discrepancy.affectedObjectId)
        : Promise.resolve(undefined)
    ]);
    createChangeDiscrepancy(discrepancy, change, affected);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO change_discrepancies
          (id, tenant_id, change_id, affected_object_id, description, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          discrepancy.id,
          discrepancy.tenantId,
          discrepancy.changeId,
          discrepancy.affectedObjectId ?? null,
          discrepancy.description,
          discrepancy.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE_DISCREPANCY',
        discrepancy.id,
        'CREATED',
        audit,
        discrepancy
      );
    });
  }

  async resolveDiscrepancy(
    tenantId: TenantId,
    discrepancyId: ChangeDiscrepancy['id'],
    status: 'RESOLVED' | 'ACCEPTED',
    resolvedAt: string,
    resolution: string,
    audit: AuditContext = {}
  ): Promise<ChangeDiscrepancy> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireDiscrepancyForUpdate(
        connection,
        tenantId,
        discrepancyId
      );
      const current = mapDiscrepancy(row);
      const next = resolveChangeDiscrepancy(current, status, resolvedAt, resolution);

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE change_discrepancies
            SET status = ?, resolved_at = ?, resolution = ?,
                row_version = row_version + 1, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND row_version = ? AND status = 'OPEN'`,
        [
          next.status,
          databaseDate(resolvedAt),
          next.resolution ?? null,
          audit.actorPersonId ?? null,
          tenantId,
          discrepancyId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Concurrent Change Discrepancy resolution detected.');
      }

      await writeAudit(
        connection,
        tenantId,
        'CHANGE_DISCREPANCY',
        discrepancyId,
        next.status,
        audit,
        next
      );
      return next;
    });
  }

  async closeChange(
    tenantId: TenantId,
    changeId: Change['id'],
    closedAt: string,
    resultingBaselineId?: Baseline['id'],
    audit: AuditContext = {}
  ): Promise<Change> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireChangeForUpdate(connection, tenantId, changeId);
      const current = mapChange(row);

      const [openActions] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM change_implementation_actions
          WHERE tenant_id = ? AND change_id = ?
            AND status NOT IN ('COMPLETED', 'CANCELLED')`,
        [tenantId, changeId]
      );
      if (Number(openActions[0]?.count ?? 0) > 0) {
        throw new Error('Change cannot close while implementation actions remain open.');
      }

      const [openDiscrepancies] = await connection.execute<CountRow[]>(
        `SELECT COUNT(*) AS count
           FROM change_discrepancies
          WHERE tenant_id = ? AND change_id = ? AND status = 'OPEN'`,
        [tenantId, changeId]
      );
      if (Number(openDiscrepancies[0]?.count ?? 0) > 0) {
        throw new Error('Change cannot close while discrepancies remain open.');
      }

      const [verificationRows] = await connection.execute<VerificationRow[]>(
        `SELECT id, tenant_id, change_id, verifier_person_id, verified_at,
                outcome, evidence_record_id, notes
           FROM change_verifications
          WHERE tenant_id = ? AND change_id = ? AND outcome = 'PASS'
          ORDER BY verified_at DESC, id DESC
          LIMIT 1`,
        [tenantId, changeId]
      );
      const verificationRow = verificationRows[0];
      if (!verificationRow) {
        throw new Error('Change closure requires PASS verification.');
      }
      const verification = mapVerification(verificationRow);

      const baseline = resultingBaselineId
        ? await this.requireBaseline(tenantId, resultingBaselineId, connection)
        : undefined;
      const next = closeChange(current, verification, closedAt, baseline);
      await this.updateChange(connection, row, next, audit);
      await this.insertStatusHistory(
        connection,
        next,
        closedAt,
        'Change closed after verified implementation.',
        audit
      );
      await writeAudit(
        connection,
        tenantId,
        'CHANGE',
        changeId,
        'CLOSED',
        audit,
        {
          verificationId: verification.id,
          resultingBaselineId: resultingBaselineId ?? null
        }
      );
      return next;
    });
  }

  async getChange(tenantId: TenantId, changeId: Change['id']): Promise<Change> {
    return this.requireChange(tenantId, changeId);
  }

  private async transitionChange(
    tenantId: TenantId,
    changeId: Change['id'],
    at: string,
    auditAction: string,
    note: string,
    transition: (change: Change) => Change,
    audit: AuditContext
  ): Promise<Change> {
    databaseDate(at);
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireChangeForUpdate(connection, tenantId, changeId);
      const current = mapChange(row);
      const next = transition(current);
      await this.updateChange(connection, row, next, audit);
      await this.insertStatusHistory(connection, next, at, note, audit);
      await writeAudit(connection, tenantId, 'CHANGE', changeId, auditAction, audit, next);
      return next;
    });
  }

  private async updateChange(
    connection: PoolConnection,
    currentRow: ChangeRow,
    next: Change,
    audit: AuditContext
  ): Promise<void> {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE changes
          SET status = ?, decision_id = ?, decided_at = ?, resulting_baseline_id = ?,
              closed_at = ?, row_version = row_version + 1, updated_by_person_id = ?
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.decisionId ?? null,
        next.decidedAt ? databaseDate(next.decidedAt) : null,
        next.resultingBaselineId ?? null,
        next.closedAt ? databaseDate(next.closedAt) : null,
        audit.actorPersonId ?? null,
        next.tenantId,
        next.id,
        currentRow.row_version
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Change update detected.');
    }
  }

  private async updateImplementationAction(
    connection: PoolConnection,
    currentRow: ImplementationActionRow,
    next: ChangeImplementationAction,
    audit: AuditContext
  ): Promise<void> {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE change_implementation_actions
          SET status = ?, completed_at = ?, row_version = row_version + 1,
              updated_by_person_id = ?
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.completedAt ? databaseDate(next.completedAt) : null,
        audit.actorPersonId ?? null,
        next.tenantId,
        next.id,
        currentRow.row_version
      ]
    );
    if (result.affectedRows !== 1) {
      throw new Error('Concurrent Change Implementation Action update detected.');
    }
  }

  private async insertStatusHistory(
    connection: PoolConnection,
    change: Change,
    at: string,
    note: string,
    audit: AuditContext
  ): Promise<void> {
    await connection.execute(
      `INSERT INTO change_status_history
        (tenant_id, change_id, status, recorded_at, decision_id, note,
         actor_person_id, correlation_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        change.tenantId,
        change.id,
        change.status,
        databaseDate(at),
        change.decisionId ?? null,
        note,
        audit.actorPersonId ?? null,
        audit.correlationId ?? null
      ]
    );
  }

  private async requireChange(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Change> {
    const [rows] = await connection.execute<ChangeRow[]>(
      `SELECT id, tenant_id, canonical_object_id, code, title, description,
              change_type, status, raised_by_person_id, raised_at, decision_id,
              decided_at, resulting_baseline_id, closed_at, row_version
         FROM changes WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change not found in tenant.');
    return mapChange(row);
  }

  private async requireChangeForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<ChangeRow> {
    const [rows] = await connection.execute<ChangeRow[]>(
      `SELECT id, tenant_id, canonical_object_id, code, title, description,
              change_type, status, raised_by_person_id, raised_at, decision_id,
              decided_at, resulting_baseline_id, closed_at, row_version
         FROM changes WHERE tenant_id = ? AND id = ?
         FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change not found in tenant.');
    return row;
  }

  private async requireAffectedObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<ChangeAffectedObject> {
    const [rows] = await connection.execute<AffectedObjectRow[]>(
      `SELECT id, tenant_id, change_id, subject_object_id, subject_version,
              disposition, rationale
         FROM change_affected_objects
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change Affected Object not found in tenant.');
    return mapAffectedObject(row);
  }

  private async requireImplementationActionForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<ImplementationActionRow> {
    const [rows] = await connection.execute<ImplementationActionRow[]>(
      `SELECT id, tenant_id, change_id, action_type, description, target_object_id,
              target_version, work_item_id, status, completed_at, row_version
         FROM change_implementation_actions
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change Implementation Action not found in tenant.');
    return row;
  }

  private async requireDiscrepancyForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<DiscrepancyRow> {
    const [rows] = await connection.execute<DiscrepancyRow[]>(
      `SELECT id, tenant_id, change_id, affected_object_id, description, status,
              resolved_at, resolution, row_version
         FROM change_discrepancies
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change Discrepancy not found in tenant.');
    return row;
  }

  private async requireCanonicalObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<CanonicalObjectRow[]>(
      `SELECT id, tenant_id, object_type, stable_key, created_at
         FROM canonical_objects WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapCanonicalObject(row);
  }

  private async requirePerson(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Person> {
    const [rows] = await connection.execute<PersonRow[]>(
      `SELECT id, tenant_id, party_id, legal_name, preferred_name, status
         FROM persons WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Person not found in tenant.');
    return mapPerson(row);
  }

  private async requireDecision(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Decision> {
    const [rows] = await connection.execute<DecisionRow[]>(
      `SELECT id, tenant_id, decision_type, subject_object_id, subject_version,
              outcome, reason, decider_person_id, authority_grant_id, decided_at
         FROM decisions WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Decision not found in tenant.');
    return mapDecision(row);
  }

  private async requireBaseline(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Baseline> {
    const [rows] = await connection.execute<BaselineRow[]>(
      `SELECT id, tenant_id, context_object_id, code, name, status, established_at,
              establishment_decision_id, superseded_by_baseline_id
         FROM baselines WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Baseline not found in tenant.');
    return mapBaseline(row);
  }

  private async requireWorkItem(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<void> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM work_items WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Work Item not found in tenant.');
  }

  private async requireEvidence(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<void> {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM evidence_records WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    if (!rows[0]) throw new Error('Evidence Record not found in tenant.');
  }
}
