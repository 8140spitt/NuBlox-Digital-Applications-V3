import {
  agreeCommercialFinalAccount,
  approveCommercialForecast,
  approveCostPlanVersion,
  closeCommercialFinalAccount,
  closeCommercialValuation,
  closeCommercialVariation,
  createCommercialFinalAccount,
  createCommercialForecast,
  createCommercialForecastLine,
  createCommercialValuation,
  createCommercialValuationLine,
  createCommercialVariation,
  createCommercialVariationDecision,
  createCommercialVariationLine,
  createCommercialVariationVersion,
  createCostPlan,
  createCostPlanLine,
  createCostPlanVersion,
  createProjectCostCode,
  issueCommercialVariationVersion,
  submitCommercialValuation,
  supersedeCostPlanVersion,
  type CanonicalObjectIdentity,
  type Change,
  type CommercialFinalAccount,
  type CommercialForecast,
  type CommercialForecastLine,
  type CommercialValuation,
  type CommercialValuationLine,
  type CommercialVariation,
  type CommercialVariationDecision,
  type CommercialVariationLine,
  type CommercialVariationVersion,
  type CostPlan,
  type CostPlanLine,
  type CostPlanVersion,
  type Decision,
  type EvidenceRecord,
  type ProjectCostCode,
  type TenantId
} from '@nublox/kernel';
import type {
  Pool,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket
} from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface ObjectRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  object_type: string;
  stable_key: string;
  created_at: Date;
}

interface CostCodeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  project_object_id: string;
  code: string;
  name: string;
  category: ProjectCostCode['category'];
  parent_cost_code_id: string | null;
  status: ProjectCostCode['status'];
}

interface CostPlanRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  project_object_id: string;
  code: string;
  title: string;
  status: CostPlan['status'];
}

interface CostPlanVersionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  cost_plan_id: string;
  version: number;
  status: CostPlanVersion['status'];
  currency: string;
  created_at: Date;
  approved_decision_id: string | null;
  approved_at: Date | null;
  row_version: number;
}

interface VariationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  project_object_id: string;
  code: string;
  title: string;
  side: CommercialVariation['side'];
  linked_change_id: string | null;
  commercial_context_object_id: string | null;
  status: CommercialVariation['status'];
  row_version: number;
}

interface VariationVersionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  variation_id: string;
  version: number;
  status: CommercialVariationVersion['status'];
  currency: string;
  submitted_amount: string;
  created_at: Date;
  issued_at: Date | null;
  row_version: number;
}

interface ValuationRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  project_object_id: string;
  commercial_context_object_id: string | null;
  source_application_id: string | null;
  kind: CommercialValuation['kind'];
  status: CommercialValuation['status'];
  currency: string;
  valuation_date: Date;
  decision_id: string | null;
  certified_at: Date | null;
  row_version: number;
}

interface ForecastRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  project_object_id: string;
  reporting_cutoff_at: Date;
  currency: string;
  status: CommercialForecast['status'];
  forecast_revenue: string;
  approved_decision_id: string | null;
  approved_at: Date | null;
  row_version: number;
}

interface FinalAccountRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  canonical_object_id: string;
  project_object_id: string;
  commercial_context_object_id: string | null;
  currency: string;
  agreed_amount: string;
  status: CommercialFinalAccount['status'];
  decision_id: string | null;
  agreed_at: Date | null;
  evidence_record_id: string | null;
  row_version: number;
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
}

interface EvidenceRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  evidence_type: string;
  subject_object_id: string;
  subject_version: string | null;
  captured_by_person_id: string | null;
  captured_at: Date;
  content_reference: string | null;
  integrity_hash: string | null;
  metadata: string | Record<string, unknown> | null;
}

interface CountRow extends RowDataPacket {
  count: number | string;
}

interface SumRow extends RowDataPacket {
  total: string | null;
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}

function mapObject(row: ObjectRow): CanonicalObjectIdentity {
  return {
    id: row.id as CanonicalObjectIdentity['id'],
    tenantId: row.tenant_id as TenantId,
    objectType: row.object_type,
    stableKey: row.stable_key,
    createdAt: row.created_at.toISOString()
  };
}

function mapCostCode(row: CostCodeRow): ProjectCostCode {
  return {
    id: row.id as ProjectCostCode['id'],
    tenantId: row.tenant_id as TenantId,
    projectObjectId: row.project_object_id as ProjectCostCode['projectObjectId'],
    code: row.code,
    name: row.name,
    category: row.category,
    ...(row.parent_cost_code_id
      ? { parentCostCodeId: row.parent_cost_code_id as NonNullable<ProjectCostCode['parentCostCodeId']> }
      : {}),
    status: row.status
  };
}

function mapCostPlan(row: CostPlanRow): CostPlan {
  return {
    id: row.id as CostPlan['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as CostPlan['canonicalObjectId'],
    projectObjectId: row.project_object_id as CostPlan['projectObjectId'],
    code: row.code,
    title: row.title,
    status: row.status
  };
}

function mapCostPlanVersion(row: CostPlanVersionRow): CostPlanVersion {
  return {
    id: row.id as CostPlanVersion['id'],
    tenantId: row.tenant_id as TenantId,
    costPlanId: row.cost_plan_id as CostPlanVersion['costPlanId'],
    version: Number(row.version),
    status: row.status,
    currency: row.currency,
    createdAt: row.created_at.toISOString(),
    ...(row.approved_decision_id
      ? { approvedDecisionId: row.approved_decision_id as NonNullable<CostPlanVersion['approvedDecisionId']> }
      : {}),
    ...(row.approved_at ? { approvedAt: row.approved_at.toISOString() } : {})
  };
}

function mapVariation(row: VariationRow): CommercialVariation {
  return {
    id: row.id as CommercialVariation['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as CommercialVariation['canonicalObjectId'],
    projectObjectId: row.project_object_id as CommercialVariation['projectObjectId'],
    code: row.code,
    title: row.title,
    side: row.side,
    ...(row.linked_change_id
      ? { linkedChangeId: row.linked_change_id as NonNullable<CommercialVariation['linkedChangeId']> }
      : {}),
    ...(row.commercial_context_object_id
      ? {
          commercialContextObjectId:
            row.commercial_context_object_id as NonNullable<CommercialVariation['commercialContextObjectId']>
        }
      : {}),
    status: row.status
  };
}

function mapVariationVersion(row: VariationVersionRow): CommercialVariationVersion {
  return {
    id: row.id as CommercialVariationVersion['id'],
    tenantId: row.tenant_id as TenantId,
    variationId: row.variation_id as CommercialVariationVersion['variationId'],
    version: Number(row.version),
    status: row.status,
    currency: row.currency,
    submittedAmount: row.submitted_amount,
    createdAt: row.created_at.toISOString(),
    ...(row.issued_at ? { issuedAt: row.issued_at.toISOString() } : {})
  };
}

function mapValuation(row: ValuationRow): CommercialValuation {
  return {
    id: row.id as CommercialValuation['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as CommercialValuation['canonicalObjectId'],
    projectObjectId: row.project_object_id as CommercialValuation['projectObjectId'],
    ...(row.commercial_context_object_id
      ? {
          commercialContextObjectId:
            row.commercial_context_object_id as NonNullable<CommercialValuation['commercialContextObjectId']>
        }
      : {}),
    ...(row.source_application_id
      ? { sourceApplicationId: row.source_application_id as NonNullable<CommercialValuation['sourceApplicationId']> }
      : {}),
    kind: row.kind,
    status: row.status,
    currency: row.currency,
    valuationDate: row.valuation_date.toISOString(),
    ...(row.decision_id ? { decisionId: row.decision_id as NonNullable<CommercialValuation['decisionId']> } : {}),
    ...(row.certified_at ? { certifiedAt: row.certified_at.toISOString() } : {})
  };
}

function mapForecast(row: ForecastRow): CommercialForecast {
  return {
    id: row.id as CommercialForecast['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as CommercialForecast['canonicalObjectId'],
    projectObjectId: row.project_object_id as CommercialForecast['projectObjectId'],
    reportingCutoffAt: row.reporting_cutoff_at.toISOString(),
    currency: row.currency,
    status: row.status,
    forecastRevenue: row.forecast_revenue,
    ...(row.approved_decision_id
      ? { approvedDecisionId: row.approved_decision_id as NonNullable<CommercialForecast['approvedDecisionId']> }
      : {}),
    ...(row.approved_at ? { approvedAt: row.approved_at.toISOString() } : {})
  };
}

function mapFinalAccount(row: FinalAccountRow): CommercialFinalAccount {
  return {
    id: row.id as CommercialFinalAccount['id'],
    tenantId: row.tenant_id as TenantId,
    canonicalObjectId: row.canonical_object_id as CommercialFinalAccount['canonicalObjectId'],
    projectObjectId: row.project_object_id as CommercialFinalAccount['projectObjectId'],
    ...(row.commercial_context_object_id
      ? {
          commercialContextObjectId:
            row.commercial_context_object_id as NonNullable<CommercialFinalAccount['commercialContextObjectId']>
        }
      : {}),
    currency: row.currency,
    agreedAmount: row.agreed_amount,
    status: row.status,
    ...(row.decision_id ? { decisionId: row.decision_id as NonNullable<CommercialFinalAccount['decisionId']> } : {}),
    ...(row.agreed_at ? { agreedAt: row.agreed_at.toISOString() } : {}),
    ...(row.evidence_record_id
      ? { evidenceRecordId: row.evidence_record_id as NonNullable<CommercialFinalAccount['evidenceRecordId']> }
      : {})
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

function mapEvidence(row: EvidenceRow): EvidenceRecord {
  let metadata: Readonly<Record<string, unknown>> | undefined;
  if (row.metadata) {
    const parsed =
      typeof row.metadata === 'string'
        ? (JSON.parse(row.metadata) as unknown)
        : row.metadata;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      metadata = parsed as Readonly<Record<string, unknown>>;
    }
  }

  return {
    id: row.id as EvidenceRecord['id'],
    tenantId: row.tenant_id as TenantId,
    evidenceType: row.evidence_type,
    subjectObjectId: row.subject_object_id as EvidenceRecord['subjectObjectId'],
    ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
    ...(row.captured_by_person_id
      ? { capturedByPersonId: row.captured_by_person_id as NonNullable<EvidenceRecord['capturedByPersonId']> }
      : {}),
    capturedAt: row.captured_at.toISOString(),
    ...(row.content_reference ? { contentReference: row.content_reference } : {}),
    ...(row.integrity_hash ? { integrityHash: row.integrity_hash } : {}),
    ...(metadata ? { metadata } : {})
  };
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
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

export class MySqlCommercialRepository {
  constructor(private readonly pool: Pool) {}

  async createCostCode(
    tenantId: TenantId,
    costCode: ProjectCostCode,
    audit: AuditContext = {}
  ): Promise<void> {
    if (costCode.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [project, parent] = await Promise.all([
      this.requireObject(tenantId, costCode.projectObjectId),
      costCode.parentCostCodeId
        ? this.requireCostCode(tenantId, costCode.parentCostCodeId)
        : Promise.resolve(undefined)
    ]);
    createProjectCostCode(costCode, project, parent);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO project_cost_codes
          (id, tenant_id, project_object_id, code, name, category,
           parent_cost_code_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          costCode.id,
          costCode.tenantId,
          costCode.projectObjectId,
          costCode.code,
          costCode.name,
          costCode.category,
          costCode.parentCostCodeId ?? null,
          costCode.status
        ]
      );
      await writeAudit(connection, tenantId, 'PROJECT_COST_CODE', costCode.id, 'CREATED', audit, costCode);
    });
  }

  async createCostPlan(
    tenantId: TenantId,
    plan: CostPlan,
    audit: AuditContext = {}
  ): Promise<void> {
    if (plan.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, project] = await Promise.all([
      this.requireObject(tenantId, plan.canonicalObjectId),
      this.requireObject(tenantId, plan.projectObjectId)
    ]);
    createCostPlan(plan, object, project);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO cost_plans
          (id, tenant_id, canonical_object_id, project_object_id, code, title, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [plan.id, tenantId, plan.canonicalObjectId, plan.projectObjectId, plan.code, plan.title, plan.status]
      );
      await writeAudit(connection, tenantId, 'COST_PLAN', plan.id, 'CREATED', audit, plan);
    });
  }

  async createCostPlanVersion(
    tenantId: TenantId,
    version: CostPlanVersion,
    audit: AuditContext = {}
  ): Promise<void> {
    const plan = await this.requireCostPlan(tenantId, version.costPlanId);
    createCostPlanVersion(version, plan);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO cost_plan_versions
          (id, tenant_id, cost_plan_id, version, status, currency, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          version.id,
          tenantId,
          version.costPlanId,
          version.version,
          version.status,
          version.currency,
          databaseDate(version.createdAt)
        ]
      );
      await writeAudit(connection, tenantId, 'COST_PLAN_VERSION', version.id, 'CREATED', audit, version);
    });
  }

  async addCostPlanLine(
    tenantId: TenantId,
    line: CostPlanLine,
    audit: AuditContext = {}
  ): Promise<void> {
    const [version, costCode] = await Promise.all([
      this.requireCostPlanVersion(tenantId, line.costPlanVersionId),
      this.requireCostCode(tenantId, line.costCodeId)
    ]);
    createCostPlanLine(line, version, costCode);
    await this.assertCostCodeBelongsToCostPlan(tenantId, costCode, version);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO cost_plan_lines
          (id, tenant_id, cost_plan_version_id, cost_code_id, description, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [line.id, tenantId, line.costPlanVersionId, line.costCodeId, line.description, line.amount]
      );
      await writeAudit(connection, tenantId, 'COST_PLAN_LINE', line.id, 'CREATED', audit, line);
    });
  }

  async approveCostPlanVersion(
    tenantId: TenantId,
    versionId: CostPlanVersion['id'],
    decisionId: Decision['id'],
    audit: AuditContext = {}
  ): Promise<CostPlanVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireCostPlanVersionForUpdate(connection, tenantId, versionId);
      const current = mapCostPlanVersion(row);
      const [plan, decision, lineCount] = await Promise.all([
        this.requireCostPlan(tenantId, current.costPlanId, connection),
        this.requireDecision(tenantId, decisionId, connection),
        this.countRows(
          connection,
          'SELECT COUNT(*) AS count FROM cost_plan_lines WHERE tenant_id = ? AND cost_plan_version_id = ?',
          [tenantId, versionId]
        )
      ]);
      if (lineCount < 1) throw new Error('Cost Plan Version cannot be approved without lines.');
      const next = approveCostPlanVersion(current, plan, decision);

      const [existingRows] = await connection.execute<CostPlanVersionRow[]>(
        `SELECT id, tenant_id, cost_plan_id, version, status, currency,
                created_at, approved_decision_id, approved_at, row_version
           FROM cost_plan_versions
          WHERE tenant_id = ? AND cost_plan_id = ? AND status = 'APPROVED' AND id <> ?
          FOR UPDATE`,
        [tenantId, current.costPlanId, versionId]
      );
      for (const existingRow of existingRows) {
        const superseded = supersedeCostPlanVersion(mapCostPlanVersion(existingRow));
        await connection.execute(
          `UPDATE cost_plan_versions
              SET status = 'SUPERSEDED', row_version = row_version + 1
            WHERE tenant_id = ? AND id = ? AND row_version = ?`,
          [tenantId, existingRow.id, existingRow.row_version]
        );
        await writeAudit(
          connection,
          tenantId,
          'COST_PLAN_VERSION',
          existingRow.id,
          'SUPERSEDED',
          audit,
          superseded
        );
      }

      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE cost_plan_versions
            SET status = ?, approved_decision_id = ?, approved_at = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          next.approvedDecisionId,
          databaseDate(next.approvedAt!),
          tenantId,
          versionId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Cost Plan Version update detected.');
      await writeAudit(connection, tenantId, 'COST_PLAN_VERSION', versionId, 'APPROVED', audit, next);
      return next;
    });
  }

  async createVariation(
    tenantId: TenantId,
    variation: CommercialVariation,
    audit: AuditContext = {}
  ): Promise<void> {
    if (variation.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, project, change, context] = await Promise.all([
      this.requireObject(tenantId, variation.canonicalObjectId),
      this.requireObject(tenantId, variation.projectObjectId),
      variation.linkedChangeId ? this.requireChange(tenantId, variation.linkedChangeId) : Promise.resolve(undefined),
      variation.commercialContextObjectId
        ? this.requireObject(tenantId, variation.commercialContextObjectId)
        : Promise.resolve(undefined)
    ]);
    createCommercialVariation(variation, object, project, {
      ...(change ? { change } : {}),
      ...(context ? { commercialContext: context } : {})
    });

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_variations
          (id, tenant_id, canonical_object_id, project_object_id, code, title,
           side, linked_change_id, commercial_context_object_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          variation.id,
          tenantId,
          variation.canonicalObjectId,
          variation.projectObjectId,
          variation.code,
          variation.title,
          variation.side,
          variation.linkedChangeId ?? null,
          variation.commercialContextObjectId ?? null,
          variation.status
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_VARIATION', variation.id, 'CREATED', audit, variation);
    });
  }

  async createVariationVersion(
    tenantId: TenantId,
    version: CommercialVariationVersion,
    audit: AuditContext = {}
  ): Promise<void> {
    const variation = await this.requireVariation(tenantId, version.variationId);
    createCommercialVariationVersion(version, variation);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_variation_versions
          (id, tenant_id, variation_id, version, status, currency,
           submitted_amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          version.id,
          tenantId,
          version.variationId,
          version.version,
          version.status,
          version.currency,
          version.submittedAmount,
          databaseDate(version.createdAt)
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_VARIATION_VERSION', version.id, 'CREATED', audit, version);
    });
  }

  async addVariationLine(
    tenantId: TenantId,
    line: CommercialVariationLine,
    audit: AuditContext = {}
  ): Promise<void> {
    const [version, costCode] = await Promise.all([
      this.requireVariationVersion(tenantId, line.variationVersionId),
      line.costCodeId ? this.requireCostCode(tenantId, line.costCodeId) : Promise.resolve(undefined)
    ]);
    createCommercialVariationLine(line, version, costCode);
    if (costCode) await this.assertCostCodeBelongsToVariation(tenantId, costCode, version);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_variation_lines
          (id, tenant_id, variation_version_id, cost_code_id, description, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          line.id,
          tenantId,
          line.variationVersionId,
          line.costCodeId ?? null,
          line.description,
          line.amount
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_VARIATION_LINE', line.id, 'CREATED', audit, line);
    });
  }

  async issueVariationVersion(
    tenantId: TenantId,
    versionId: CommercialVariationVersion['id'],
    issuedAt: string,
    audit: AuditContext = {}
  ): Promise<CommercialVariationVersion> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireVariationVersionForUpdate(connection, tenantId, versionId);
      const current = mapVariationVersion(row);
      const [sumRows] = await connection.execute<SumRow[]>(
        `SELECT CAST(COALESCE(SUM(amount), 0) AS CHAR) AS total
           FROM commercial_variation_lines
          WHERE tenant_id = ? AND variation_version_id = ?`,
        [tenantId, versionId]
      );
      const lineTotal = sumRows[0]?.total ?? '0';
      if (Number(lineTotal) !== Number(current.submittedAmount)) {
        throw new Error(
          `Variation line total ${lineTotal} does not reconcile to submitted amount ${current.submittedAmount}.`
        );
      }

      const next = issueCommercialVariationVersion(current, issuedAt);
      await connection.execute(
        `UPDATE commercial_variation_versions
            SET status = 'SUPERSEDED', row_version = row_version + 1
          WHERE tenant_id = ? AND variation_id = ? AND status = 'ISSUED' AND id <> ?`,
        [tenantId, current.variationId, versionId]
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE commercial_variation_versions
            SET status = ?, issued_at = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [next.status, databaseDate(issuedAt), tenantId, versionId, row.row_version]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Variation Version update detected.');
      await writeAudit(connection, tenantId, 'COMMERCIAL_VARIATION_VERSION', versionId, 'ISSUED', audit, next);
      return next;
    });
  }

  async decideVariation(
    tenantId: TenantId,
    variationId: CommercialVariation['id'],
    input: CommercialVariationDecision,
    audit: AuditContext = {}
  ): Promise<CommercialVariation> {
    return withTransaction(this.pool, async (connection) => {
      const variationRow = await this.requireVariationForUpdate(connection, tenantId, variationId);
      const variation = mapVariation(variationRow);
      const [version, decision] = await Promise.all([
        this.requireVariationVersion(tenantId, input.variationVersionId, connection),
        this.requireDecision(tenantId, input.decisionId, connection)
      ]);
      createCommercialVariationDecision(input, variation, version, decision);
      const next = closeCommercialVariation(variation, input);

      await connection.execute(
        `INSERT INTO commercial_variation_decisions
          (id, tenant_id, variation_version_id, decision_id, outcome,
           decided_amount, decided_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          input.id,
          tenantId,
          input.variationVersionId,
          input.decisionId,
          input.outcome,
          input.decidedAmount,
          databaseDate(input.decidedAt)
        ]
      );
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE commercial_variations
            SET status = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [next.status, tenantId, variationId, variationRow.row_version]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Commercial Variation update detected.');
      await writeAudit(connection, tenantId, 'COMMERCIAL_VARIATION', variationId, 'DECIDED', audit, {
        variation: next,
        decision: input
      });
      return next;
    });
  }

  async createValuation(
    tenantId: TenantId,
    valuation: CommercialValuation,
    audit: AuditContext = {}
  ): Promise<void> {
    if (valuation.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, project, context, source] = await Promise.all([
      this.requireObject(tenantId, valuation.canonicalObjectId),
      this.requireObject(tenantId, valuation.projectObjectId),
      valuation.commercialContextObjectId
        ? this.requireObject(tenantId, valuation.commercialContextObjectId)
        : Promise.resolve(undefined),
      valuation.sourceApplicationId
        ? this.requireValuation(tenantId, valuation.sourceApplicationId)
        : Promise.resolve(undefined)
    ]);
    createCommercialValuation(valuation, object, project, {
      ...(context ? { commercialContext: context } : {}),
      ...(source ? { sourceApplication: source } : {})
    });

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_valuations
          (id, tenant_id, canonical_object_id, project_object_id,
           commercial_context_object_id, source_application_id, kind, status,
           currency, valuation_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          valuation.id,
          tenantId,
          valuation.canonicalObjectId,
          valuation.projectObjectId,
          valuation.commercialContextObjectId ?? null,
          valuation.sourceApplicationId ?? null,
          valuation.kind,
          valuation.status,
          valuation.currency,
          databaseDate(valuation.valuationDate)
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_VALUATION', valuation.id, 'CREATED', audit, valuation);
    });
  }

  async addValuationLine(
    tenantId: TenantId,
    line: CommercialValuationLine,
    audit: AuditContext = {}
  ): Promise<void> {
    const [valuation, costCode] = await Promise.all([
      this.requireValuation(tenantId, line.valuationId),
      line.costCodeId ? this.requireCostCode(tenantId, line.costCodeId) : Promise.resolve(undefined)
    ]);
    createCommercialValuationLine(line, valuation, costCode);
    if (costCode && costCode.projectObjectId !== valuation.projectObjectId) {
      throw new Error('Valuation Cost Code must belong to the same Project.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_valuation_lines
          (id, tenant_id, valuation_id, cost_code_id, description,
           cumulative_amount, adjustment_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          line.id,
          tenantId,
          line.valuationId,
          line.costCodeId ?? null,
          line.description,
          line.cumulativeAmount,
          line.adjustmentType ?? null
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_VALUATION_LINE', line.id, 'CREATED', audit, line);
    });
  }

  async submitValuation(
    tenantId: TenantId,
    valuationId: CommercialValuation['id'],
    audit: AuditContext = {}
  ): Promise<CommercialValuation> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireValuationForUpdate(connection, tenantId, valuationId);
      const lineCount = await this.countRows(
        connection,
        'SELECT COUNT(*) AS count FROM commercial_valuation_lines WHERE tenant_id = ? AND valuation_id = ?',
        [tenantId, valuationId]
      );
      if (lineCount < 1) throw new Error('Commercial Valuation cannot submit without lines.');
      const next = submitCommercialValuation(mapValuation(row));
      await this.updateValuation(connection, row, next);
      await writeAudit(connection, tenantId, 'COMMERCIAL_VALUATION', valuationId, 'SUBMITTED', audit, next);
      return next;
    });
  }

  async certifyValuation(
    tenantId: TenantId,
    valuationId: CommercialValuation['id'],
    decisionId: Decision['id'],
    audit: AuditContext = {}
  ): Promise<CommercialValuation> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireValuationForUpdate(connection, tenantId, valuationId);
      const decision = await this.requireDecision(tenantId, decisionId, connection);
      const next = certifyCommercialValuation(mapValuation(row), decision);
      await this.updateValuation(connection, row, next);
      await writeAudit(connection, tenantId, 'COMMERCIAL_VALUATION', valuationId, 'CERTIFIED', audit, next);
      return next;
    });
  }

  async closeValuation(
    tenantId: TenantId,
    valuationId: CommercialValuation['id'],
    audit: AuditContext = {}
  ): Promise<CommercialValuation> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireValuationForUpdate(connection, tenantId, valuationId);
      const next = closeCommercialValuation(mapValuation(row));
      await this.updateValuation(connection, row, next);
      await writeAudit(connection, tenantId, 'COMMERCIAL_VALUATION', valuationId, 'CLOSED', audit, next);
      return next;
    });
  }

  async createForecast(
    tenantId: TenantId,
    forecast: CommercialForecast,
    audit: AuditContext = {}
  ): Promise<void> {
    if (forecast.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, project] = await Promise.all([
      this.requireObject(tenantId, forecast.canonicalObjectId),
      this.requireObject(tenantId, forecast.projectObjectId)
    ]);
    createCommercialForecast(forecast, object, project);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_forecasts
          (id, tenant_id, canonical_object_id, project_object_id,
           reporting_cutoff_at, currency, status, forecast_revenue)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          forecast.id,
          tenantId,
          forecast.canonicalObjectId,
          forecast.projectObjectId,
          databaseDate(forecast.reportingCutoffAt),
          forecast.currency,
          forecast.status,
          forecast.forecastRevenue
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_FORECAST', forecast.id, 'CREATED', audit, forecast);
    });
  }

  async addForecastLine(
    tenantId: TenantId,
    line: CommercialForecastLine,
    audit: AuditContext = {}
  ): Promise<void> {
    const [forecast, costCode] = await Promise.all([
      this.requireForecast(tenantId, line.forecastId),
      this.requireCostCode(tenantId, line.costCodeId)
    ]);
    createCommercialForecastLine(line, forecast, costCode);
    if (costCode.projectObjectId !== forecast.projectObjectId) {
      throw new Error('Forecast Cost Code must belong to the same Project.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_forecast_lines
          (id, tenant_id, forecast_id, cost_code_id, control_budget, actual_cost,
           remaining_commitment, approved_change, pending_change_exposure,
           forecast_to_complete)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          line.id,
          tenantId,
          line.forecastId,
          line.costCodeId,
          line.controlBudget,
          line.actualCost,
          line.remainingCommitment,
          line.approvedChange,
          line.pendingChangeExposure,
          line.forecastToComplete
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_FORECAST_LINE', line.id, 'CREATED', audit, line);
    });
  }

  async approveForecast(
    tenantId: TenantId,
    forecastId: CommercialForecast['id'],
    decisionId: Decision['id'],
    audit: AuditContext = {}
  ): Promise<CommercialForecast> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireForecastForUpdate(connection, tenantId, forecastId);
      const [decision, lineCount] = await Promise.all([
        this.requireDecision(tenantId, decisionId, connection),
        this.countRows(
          connection,
          'SELECT COUNT(*) AS count FROM commercial_forecast_lines WHERE tenant_id = ? AND forecast_id = ?',
          [tenantId, forecastId]
        )
      ]);
      if (lineCount < 1) throw new Error('Commercial Forecast cannot be approved without snapshot lines.');
      const next = approveCommercialForecast(mapForecast(row), decision);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE commercial_forecasts
            SET status = ?, approved_decision_id = ?, approved_at = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          next.approvedDecisionId,
          databaseDate(next.approvedAt!),
          tenantId,
          forecastId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Commercial Forecast update detected.');
      await writeAudit(connection, tenantId, 'COMMERCIAL_FORECAST', forecastId, 'APPROVED', audit, next);
      return next;
    });
  }

  async createFinalAccount(
    tenantId: TenantId,
    account: CommercialFinalAccount,
    audit: AuditContext = {}
  ): Promise<void> {
    if (account.tenantId !== tenantId) throw new Error('Persistence operation crossed tenant boundary.');
    const [object, project, context] = await Promise.all([
      this.requireObject(tenantId, account.canonicalObjectId),
      this.requireObject(tenantId, account.projectObjectId),
      account.commercialContextObjectId
        ? this.requireObject(tenantId, account.commercialContextObjectId)
        : Promise.resolve(undefined)
    ]);
    createCommercialFinalAccount(account, object, project, context);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO commercial_final_accounts
          (id, tenant_id, canonical_object_id, project_object_id,
           commercial_context_object_id, currency, agreed_amount, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          account.id,
          tenantId,
          account.canonicalObjectId,
          account.projectObjectId,
          account.commercialContextObjectId ?? null,
          account.currency,
          account.agreedAmount,
          account.status
        ]
      );
      await writeAudit(connection, tenantId, 'COMMERCIAL_FINAL_ACCOUNT', account.id, 'CREATED', audit, account);
    });
  }

  async agreeFinalAccount(
    tenantId: TenantId,
    accountId: CommercialFinalAccount['id'],
    decisionId: Decision['id'],
    evidenceRecordId?: EvidenceRecord['id'],
    audit: AuditContext = {}
  ): Promise<CommercialFinalAccount> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireFinalAccountForUpdate(connection, tenantId, accountId);
      const [decision, evidence] = await Promise.all([
        this.requireDecision(tenantId, decisionId, connection),
        evidenceRecordId
          ? this.requireEvidence(tenantId, evidenceRecordId, connection)
          : Promise.resolve(undefined)
      ]);
      const next = agreeCommercialFinalAccount(mapFinalAccount(row), decision, evidence);
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE commercial_final_accounts
            SET status = ?, decision_id = ?, agreed_at = ?, evidence_record_id = ?,
                row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [
          next.status,
          next.decisionId,
          databaseDate(next.agreedAt!),
          next.evidenceRecordId ?? null,
          tenantId,
          accountId,
          row.row_version
        ]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Final Account update detected.');
      await writeAudit(connection, tenantId, 'COMMERCIAL_FINAL_ACCOUNT', accountId, 'AGREED', audit, next);
      return next;
    });
  }

  async closeFinalAccount(
    tenantId: TenantId,
    accountId: CommercialFinalAccount['id'],
    audit: AuditContext = {}
  ): Promise<CommercialFinalAccount> {
    return withTransaction(this.pool, async (connection) => {
      const row = await this.requireFinalAccountForUpdate(connection, tenantId, accountId);
      const next = closeCommercialFinalAccount(mapFinalAccount(row));
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE commercial_final_accounts
            SET status = ?, row_version = row_version + 1
          WHERE tenant_id = ? AND id = ? AND row_version = ?`,
        [next.status, tenantId, accountId, row.row_version]
      );
      if (result.affectedRows !== 1) throw new Error('Concurrent Final Account update detected.');
      await writeAudit(connection, tenantId, 'COMMERCIAL_FINAL_ACCOUNT', accountId, 'CLOSED', audit, next);
      return next;
    });
  }

  private async countRows(
    connection: PoolConnection,
    query: string,
    params: unknown[]
  ): Promise<number> {
    const [rows] = await connection.query<CountRow[]>(query, params);
    return Number(rows[0]?.count ?? 0);
  }

  private async assertCostCodeBelongsToCostPlan(
    tenantId: TenantId,
    costCode: ProjectCostCode,
    version: CostPlanVersion
  ): Promise<void> {
    const plan = await this.requireCostPlan(tenantId, version.costPlanId);
    if (costCode.projectObjectId !== plan.projectObjectId) {
      throw new Error('Cost Plan Line Cost Code must belong to the same Project.');
    }
  }

  private async assertCostCodeBelongsToVariation(
    tenantId: TenantId,
    costCode: ProjectCostCode,
    version: CommercialVariationVersion
  ): Promise<void> {
    const variation = await this.requireVariation(tenantId, version.variationId);
    if (costCode.projectObjectId !== variation.projectObjectId) {
      throw new Error('Variation Line Cost Code must belong to the same Project.');
    }
  }

  private async requireObject(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CanonicalObjectIdentity> {
    const [rows] = await connection.execute<ObjectRow[]>(
      'SELECT id, tenant_id, object_type, stable_key, created_at FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Canonical Object not found in tenant.');
    return mapObject(row);
  }

  private async requireCostCode(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<ProjectCostCode> {
    const [rows] = await connection.execute<CostCodeRow[]>(
      `SELECT id, tenant_id, project_object_id, code, name, category,
              parent_cost_code_id, status
         FROM project_cost_codes WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Project Cost Code not found in tenant.');
    return mapCostCode(row);
  }

  private async requireCostPlan(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CostPlan> {
    const [rows] = await connection.execute<CostPlanRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id, code, title, status
         FROM cost_plans WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Cost Plan not found in tenant.');
    return mapCostPlan(row);
  }

  private async requireCostPlanVersion(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CostPlanVersion> {
    const row = await this.requireCostPlanVersionRow(connection, tenantId, id);
    return mapCostPlanVersion(row);
  }

  private async requireCostPlanVersionRow(
    connection: Pool | PoolConnection,
    tenantId: TenantId,
    id: string,
    forUpdate = false
  ): Promise<CostPlanVersionRow> {
    const [rows] = await connection.execute<CostPlanVersionRow[]>(
      `SELECT id, tenant_id, cost_plan_id, version, status, currency,
              created_at, approved_decision_id, approved_at, row_version
         FROM cost_plan_versions WHERE tenant_id = ? AND id = ?
         ${forUpdate ? 'FOR UPDATE' : ''}`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Cost Plan Version not found in tenant.');
    return row;
  }

  private requireCostPlanVersionForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<CostPlanVersionRow> {
    return this.requireCostPlanVersionRow(connection, tenantId, id, true);
  }

  private async requireVariation(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CommercialVariation> {
    const [rows] = await connection.execute<VariationRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id, code, title,
              side, linked_change_id, commercial_context_object_id, status, row_version
         FROM commercial_variations WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Variation not found in tenant.');
    return mapVariation(row);
  }

  private async requireVariationForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<VariationRow> {
    const [rows] = await connection.execute<VariationRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id, code, title,
              side, linked_change_id, commercial_context_object_id, status, row_version
         FROM commercial_variations WHERE tenant_id = ? AND id = ?
         FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Variation not found in tenant.');
    return row;
  }

  private async requireVariationVersion(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CommercialVariationVersion> {
    const row = await this.requireVariationVersionRow(connection, tenantId, id);
    return mapVariationVersion(row);
  }

  private async requireVariationVersionRow(
    connection: Pool | PoolConnection,
    tenantId: TenantId,
    id: string,
    forUpdate = false
  ): Promise<VariationVersionRow> {
    const [rows] = await connection.execute<VariationVersionRow[]>(
      `SELECT id, tenant_id, variation_id, version, status, currency,
              CAST(submitted_amount AS CHAR) AS submitted_amount,
              created_at, issued_at, row_version
         FROM commercial_variation_versions
        WHERE tenant_id = ? AND id = ?
        ${forUpdate ? 'FOR UPDATE' : ''}`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Variation Version not found in tenant.');
    return row;
  }

  private requireVariationVersionForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<VariationVersionRow> {
    return this.requireVariationVersionRow(connection, tenantId, id, true);
  }

  private async requireValuation(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CommercialValuation> {
    const row = await this.requireValuationRow(connection, tenantId, id);
    return mapValuation(row);
  }

  private async requireValuationRow(
    connection: Pool | PoolConnection,
    tenantId: TenantId,
    id: string,
    forUpdate = false
  ): Promise<ValuationRow> {
    const [rows] = await connection.execute<ValuationRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id,
              commercial_context_object_id, source_application_id, kind, status,
              currency, valuation_date, decision_id, certified_at, row_version
         FROM commercial_valuations WHERE tenant_id = ? AND id = ?
         ${forUpdate ? 'FOR UPDATE' : ''}`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Valuation not found in tenant.');
    return row;
  }

  private requireValuationForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<ValuationRow> {
    return this.requireValuationRow(connection, tenantId, id, true);
  }

  private async updateValuation(
    connection: PoolConnection,
    row: ValuationRow,
    next: CommercialValuation
  ): Promise<void> {
    const [result] = await connection.execute<ResultSetHeader>(
      `UPDATE commercial_valuations
          SET status = ?, decision_id = ?, certified_at = ?,
              row_version = row_version + 1
        WHERE tenant_id = ? AND id = ? AND row_version = ?`,
      [
        next.status,
        next.decisionId ?? null,
        next.certifiedAt ? databaseDate(next.certifiedAt) : null,
        next.tenantId,
        next.id,
        row.row_version
      ]
    );
    if (result.affectedRows !== 1) throw new Error('Concurrent Commercial Valuation update detected.');
  }

  private async requireForecast(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<CommercialForecast> {
    const row = await this.requireForecastRow(connection, tenantId, id);
    return mapForecast(row);
  }

  private async requireForecastRow(
    connection: Pool | PoolConnection,
    tenantId: TenantId,
    id: string,
    forUpdate = false
  ): Promise<ForecastRow> {
    const [rows] = await connection.execute<ForecastRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id,
              reporting_cutoff_at, currency, status,
              CAST(forecast_revenue AS CHAR) AS forecast_revenue,
              approved_decision_id, approved_at, row_version
         FROM commercial_forecasts WHERE tenant_id = ? AND id = ?
         ${forUpdate ? 'FOR UPDATE' : ''}`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Forecast not found in tenant.');
    return row;
  }

  private requireForecastForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<ForecastRow> {
    return this.requireForecastRow(connection, tenantId, id, true);
  }

  private async requireFinalAccountForUpdate(
    connection: PoolConnection,
    tenantId: TenantId,
    id: string
  ): Promise<FinalAccountRow> {
    const [rows] = await connection.execute<FinalAccountRow[]>(
      `SELECT id, tenant_id, canonical_object_id, project_object_id,
              commercial_context_object_id, currency,
              CAST(agreed_amount AS CHAR) AS agreed_amount,
              status, decision_id, agreed_at, evidence_record_id, row_version
         FROM commercial_final_accounts
        WHERE tenant_id = ? AND id = ?
        FOR UPDATE`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Commercial Final Account not found in tenant.');
    return row;
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

  private async requireChange(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<Change> {
    const [rows] = await connection.execute<ChangeRow[]>(
      `SELECT id, tenant_id, canonical_object_id, code, title, description,
              change_type, status, raised_by_person_id, raised_at, decision_id,
              decided_at, resulting_baseline_id, closed_at
         FROM changes WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Change not found in tenant.');
    return mapChange(row);
  }

  private async requireEvidence(
    tenantId: TenantId,
    id: string,
    connection: Pool | PoolConnection = this.pool
  ): Promise<EvidenceRecord> {
    const [rows] = await connection.execute<EvidenceRow[]>(
      `SELECT id, tenant_id, evidence_type, subject_object_id, subject_version,
              captured_by_person_id, captured_at, content_reference,
              integrity_hash, metadata
         FROM evidence_records WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) throw new Error('Evidence Record not found in tenant.');
    return mapEvidence(row);
  }
}
