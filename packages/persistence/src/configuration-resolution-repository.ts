import {
  completeConfigurationResolutionRun,
  createConfigurationCriterion,
  createConfigurationResolutionDefinition,
  createConfigurationResolutionItem,
  createConfigurationResolutionRun,
  type ConfigurationCriterion,
  type ConfigurationItemId,
  type ConfigurationResolutionDefinition,
  type ConfigurationResolutionItem,
  type ConfigurationResolutionRun,
  type EffectivityType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface DefinitionRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  version: number; effective_from: Date | null; effective_to: Date | null;
  status: ConfigurationResolutionDefinition['status'];
}
interface CriterionRow extends RowDataPacket {
  id: string; tenant_id: string; definition_id: string; sequence_no: number;
  criterion_type: ConfigurationCriterion['criterionType']; mandatory: number;
  configuration: unknown; status: ConfigurationCriterion['status'];
}
interface BaselineItemRow extends RowDataPacket {
  baseline_id: string; baseline_code: string; context_object_id: string;
  baseline_status: string; subject_version: string; established_at: Date | null;
}
interface EffectivityCandidateRow extends RowDataPacket {
  id: string; subject_version: string; effectivity_type: EffectivityType;
  scope_type: string; scope_id: string | null; effective_from: Date | null;
  effective_to: Date | null; expression: string | null;
}
interface ConfigurationItemRow extends RowDataPacket {
  id: string;
}
interface RunRow extends RowDataPacket {
  id: string; tenant_id: string; definition_id: string; context_object_id: string;
  input: unknown; started_at: Date; completed_at: Date | null;
  run_status: ConfigurationResolutionRun['status'];
}

function dbDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}
function objectValue(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}
async function evidence(
  connection: PoolConnection,
  tenantId: TenantId,
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
    [tenantId, entityType, entityId, action, audit.actorPersonId ?? null, audit.correlationId ?? null, JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}
function mapDefinition(row: DefinitionRow): ConfigurationResolutionDefinition {
  return {
    id: row.id as ConfigurationResolutionDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    version: Number(row.version),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}
function mapCriterion(row: CriterionRow): ConfigurationCriterion {
  return {
    id: row.id as ConfigurationCriterion['id'],
    tenantId: row.tenant_id as TenantId,
    definitionId: row.definition_id as ConfigurationCriterion['definitionId'],
    sequence: Number(row.sequence_no),
    criterionType: row.criterion_type,
    mandatory: Boolean(row.mandatory),
    configuration: objectValue(row.configuration),
    status: row.status
  };
}

export interface BaselineVersionCandidate {
  baselineId: string;
  baselineCode: string;
  contextObjectId: string;
  subjectVersion: string;
  establishedAt?: string;
}
export interface EffectivityVersionCandidate {
  effectivityId: string;
  subjectVersion: string;
  effectivityType: EffectivityType;
  scopeType: string;
  scopeId?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  expression?: string;
}

export class MySqlConfigurationResolutionRepository {
  constructor(private readonly pool: Pool) {}

  async createDefinition(
    definition: ConfigurationResolutionDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createConfigurationResolutionDefinition(definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO configuration_resolution_definitions
          (id, tenant_id, code, name, description, version, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [definition.id, definition.tenantId, definition.code, definition.name,
         definition.description ?? null, definition.version,
         definition.effectiveFrom ? dbDate(definition.effectiveFrom) : null,
         definition.effectiveTo ? dbDate(definition.effectiveTo) : null,
         definition.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, definition.tenantId, 'CONFIGURATION_RESOLUTION_DEFINITION', definition.id, 'CREATED', audit, definition);
    });
  }

  async addCriterion(
    criterion: ConfigurationCriterion,
    audit: AuditContext = {}
  ): Promise<void> {
    const definition = await this.requireDefinition(criterion.tenantId, criterion.definitionId);
    createConfigurationCriterion(criterion, definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO configuration_resolution_criteria
          (id, tenant_id, definition_id, sequence_no, criterion_type, mandatory,
           configuration, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [criterion.id, criterion.tenantId, criterion.definitionId, criterion.sequence,
         criterion.criterionType, criterion.mandatory, JSON.stringify(criterion.configuration),
         criterion.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null]
      );
      await evidence(connection, criterion.tenantId, 'CONFIGURATION_CRITERION', criterion.id, 'CREATED', audit, criterion);
    });
  }

  async getActiveDefinitionByCode(
    tenantId: TenantId,
    code: string,
    evaluatedAt: string
  ): Promise<ConfigurationResolutionDefinition | undefined> {
    const at = dbDate(evaluatedAt);
    const [rows] = await this.pool.execute<DefinitionRow[]>(
      `SELECT id, tenant_id, code, name, description, version, effective_from, effective_to, status
         FROM configuration_resolution_definitions
        WHERE tenant_id = ? AND code = ? AND status = 'ACTIVE'
          AND (effective_from IS NULL OR effective_from <= ?)
          AND (effective_to IS NULL OR effective_to >= ?)
        ORDER BY version DESC
        LIMIT 1`,
      [tenantId, code.toUpperCase(), at, at]
    );
    return rows[0] ? mapDefinition(rows[0]) : undefined;
  }

  async listActiveCriteria(
    tenantId: TenantId,
    definitionId: ConfigurationResolutionDefinition['id']
  ): Promise<ConfigurationCriterion[]> {
    const [rows] = await this.pool.execute<CriterionRow[]>(
      `SELECT id, tenant_id, definition_id, sequence_no, criterion_type,
              mandatory, configuration, status
         FROM configuration_resolution_criteria
        WHERE tenant_id = ? AND definition_id = ? AND status = 'ACTIVE'
        ORDER BY sequence_no, id`,
      [tenantId, definitionId]
    );
    return rows.map(mapCriterion);
  }

  async listBaselineConfigurationItemIds(
    tenantId: TenantId,
    baselineId: string,
    contextObjectId: string
  ): Promise<ConfigurationItemId[]> {
    const [rows] = await this.pool.execute<Array<RowDataPacket & { configuration_item_id: string }>>(
      `SELECT bi.configuration_item_id
         FROM baseline_items bi
         JOIN baselines b ON b.tenant_id = bi.tenant_id AND b.id = bi.baseline_id
        WHERE bi.tenant_id = ? AND bi.baseline_id = ? AND b.context_object_id = ?`,
      [tenantId, baselineId, contextObjectId]
    );
    return rows.map((row) => row.configuration_item_id as ConfigurationItemId);
  }

  async assertConfigurationItems(
    tenantId: TenantId,
    itemIds: readonly ConfigurationItemId[]
  ): Promise<void> {
    for (const itemId of itemIds) {
      const [rows] = await this.pool.execute<ConfigurationItemRow[]>(
        'SELECT id FROM configuration_items WHERE tenant_id = ? AND id = ? AND status = ?',
        [tenantId, itemId, 'ACTIVE']
      );
      if (!rows[0]) throw new Error(`Configuration Item ${itemId} not found or inactive in tenant.`);
    }
  }

  async assertContextObject(tenantId: TenantId, contextObjectId: string): Promise<void> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      'SELECT id FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, contextObjectId]
    );
    if (!rows[0]) throw new Error('Configuration Resolution context object not found in tenant.');
  }

  async findBaselineVersion(
    tenantId: TenantId,
    baselineId: string,
    contextObjectId: string,
    configurationItemId: ConfigurationItemId
  ): Promise<BaselineVersionCandidate | undefined> {
    const [rows] = await this.pool.execute<BaselineItemRow[]>(
      `SELECT b.id AS baseline_id, b.code AS baseline_code, b.context_object_id,
              b.status AS baseline_status, bi.subject_version, b.established_at
         FROM baselines b
         JOIN baseline_items bi ON bi.tenant_id = b.tenant_id AND bi.baseline_id = b.id
        WHERE b.tenant_id = ? AND b.id = ? AND b.context_object_id = ?
          AND bi.configuration_item_id = ?
          AND b.status IN ('ESTABLISHED','SUPERSEDED')
        LIMIT 1`,
      [tenantId, baselineId, contextObjectId, configurationItemId]
    );
    const row = rows[0];
    return row ? {
      baselineId: row.baseline_id,
      baselineCode: row.baseline_code,
      contextObjectId: row.context_object_id,
      subjectVersion: row.subject_version,
      ...(row.established_at ? { establishedAt: row.established_at.toISOString() } : {})
    } : undefined;
  }

  async findLatestEstablishedBaselineVersion(
    tenantId: TenantId,
    contextObjectId: string,
    configurationItemId: ConfigurationItemId,
    evaluatedAt: string
  ): Promise<BaselineVersionCandidate | undefined> {
    const [rows] = await this.pool.execute<BaselineItemRow[]>(
      `SELECT b.id AS baseline_id, b.code AS baseline_code, b.context_object_id,
              b.status AS baseline_status, bi.subject_version, b.established_at
         FROM baselines b
         JOIN baseline_items bi ON bi.tenant_id = b.tenant_id AND bi.baseline_id = b.id
        WHERE b.tenant_id = ? AND b.context_object_id = ?
          AND bi.configuration_item_id = ?
          AND b.established_at IS NOT NULL AND b.established_at <= ?
        ORDER BY b.established_at DESC, b.id DESC
        LIMIT 1`,
      [tenantId, contextObjectId, configurationItemId, dbDate(evaluatedAt)]
    );
    const row = rows[0];
    return row ? {
      baselineId: row.baseline_id,
      baselineCode: row.baseline_code,
      contextObjectId: row.context_object_id,
      subjectVersion: row.subject_version,
      ...(row.established_at ? { establishedAt: row.established_at.toISOString() } : {})
    } : undefined;
  }

  async findEffectivityVersions(
    tenantId: TenantId,
    configurationItemId: ConfigurationItemId,
    input: {
      evaluatedAt: string;
      scopeType?: string;
      scopeId?: string;
      effectivityTypes?: readonly EffectivityType[];
    }
  ): Promise<EffectivityVersionCandidate[]> {
    const [rows] = await this.pool.execute<EffectivityCandidateRow[]>(
      `SELECT id, subject_version, effectivity_type, scope_type, scope_id,
              effective_from, effective_to, expression
         FROM effectivities
        WHERE tenant_id = ? AND configuration_item_id = ? AND status = 'ACTIVE'
          AND (effective_from IS NULL OR effective_from <= ?)
          AND (effective_to IS NULL OR effective_to >= ?)
        ORDER BY subject_version, id`,
      [tenantId, configurationItemId, dbDate(input.evaluatedAt), dbDate(input.evaluatedAt)]
    );
    return rows
      .filter((row) =>
        (!input.effectivityTypes || input.effectivityTypes.includes(row.effectivity_type)) &&
        (
          row.scope_type === 'TENANT' ||
          (input.scopeType === row.scope_type && input.scopeId === row.scope_id)
        )
      )
      .map((row) => ({
        effectivityId: row.id,
        subjectVersion: row.subject_version,
        effectivityType: row.effectivity_type,
        scopeType: row.scope_type,
        ...(row.scope_id ? { scopeId: row.scope_id } : {}),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        ...(row.expression ? { expression: row.expression } : {})
      }));
  }

  async createRun(
    run: ConfigurationResolutionRun,
    audit: AuditContext = {}
  ): Promise<void> {
    const definition = await this.requireDefinition(run.tenantId, run.definitionId);
    createConfigurationResolutionRun(run, definition);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO configuration_resolution_runs
          (id, tenant_id, definition_id, context_object_id, baseline_id, evaluated_at,
           input, started_at, completed_at, run_status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
        [run.id, run.tenantId, run.definitionId, run.contextObjectId,
         run.input.baselineId ?? null, dbDate(run.input.evaluatedAt),
         JSON.stringify(run.input), dbDate(run.startedAt), run.status,
         audit.actorPersonId ?? null]
      );
      await evidence(connection, run.tenantId, 'CONFIGURATION_RESOLUTION_RUN', run.id, 'STARTED', audit, run);
    });
  }

  async createItem(
    item: ConfigurationResolutionItem,
    audit: AuditContext = {}
  ): Promise<void> {
    createConfigurationResolutionItem(item);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO configuration_resolution_items
          (id, tenant_id, run_id, configuration_item_id, selected_version,
           criterion_id, result_status, message, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.tenantId, item.runId, item.configurationItemId,
         item.selectedVersion ?? null, item.criterionId ?? null, item.status,
         item.message ?? null, JSON.stringify(item.evidence)]
      );
      await evidence(connection, item.tenantId, 'CONFIGURATION_RESOLUTION_ITEM', item.id, 'RECORDED', audit, item);
    });
  }

  async completeRun(
    tenantId: TenantId,
    runId: ConfigurationResolutionRun['id'],
    status: Exclude<ConfigurationResolutionRun['status'], 'RUNNING'>,
    completedAt: string,
    audit: AuditContext = {}
  ): Promise<void> {
    const run = await this.requireRun(tenantId, runId);
    const completed = completeConfigurationResolutionRun(run, status, completedAt);
    await withTransaction(this.pool, async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE configuration_resolution_runs
            SET run_status = ?, completed_at = ?
          WHERE tenant_id = ? AND id = ? AND run_status = 'RUNNING'`,
        [completed.status, dbDate(completedAt), tenantId, runId]
      );
      if (result.affectedRows !== 1) throw new Error('Configuration Resolution Run is no longer RUNNING.');
      await evidence(connection, tenantId, 'CONFIGURATION_RESOLUTION_RUN', runId, 'COMPLETED', audit, completed);
    });
  }

  async getDefinition(
    tenantId: TenantId,
    id: ConfigurationResolutionDefinition['id']
  ): Promise<ConfigurationResolutionDefinition | undefined> {
    const [rows] = await this.pool.execute<DefinitionRow[]>(
      `SELECT id, tenant_id, code, name, description, version, effective_from, effective_to, status
         FROM configuration_resolution_definitions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapDefinition(rows[0]) : undefined;
  }

  private async getRun(
    tenantId: TenantId,
    id: ConfigurationResolutionRun['id']
  ): Promise<ConfigurationResolutionRun | undefined> {
    const [rows] = await this.pool.execute<RunRow[]>(
      `SELECT id, tenant_id, definition_id, context_object_id, input,
              started_at, completed_at, run_status
         FROM configuration_resolution_runs WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    const row = rows[0];
    if (!row) return undefined;
    const raw = objectValue(row.input);
    const rawIds = Array.isArray(raw.configurationItemIds) ? raw.configurationItemIds : [];
    const input = {
      configurationItemIds: rawIds.map((id) => String(id) as ConfigurationItemId),
      ...(typeof raw.baselineId === 'string' ? { baselineId: raw.baselineId as ConfigurationResolutionRun['input']['baselineId'] } : {}),
      ...(raw.explicitVersions && typeof raw.explicitVersions === 'object' && !Array.isArray(raw.explicitVersions)
        ? { explicitVersions: raw.explicitVersions as Readonly<Record<string, string>> }
        : {}),
      ...(typeof raw.scopeType === 'string' ? { scopeType: raw.scopeType } : {}),
      ...(typeof raw.scopeId === 'string' ? { scopeId: raw.scopeId } : {}),
      evaluatedAt: String(raw.evaluatedAt)
    };
    return {
      id: row.id as ConfigurationResolutionRun['id'],
      tenantId: row.tenant_id as TenantId,
      definitionId: row.definition_id as ConfigurationResolutionRun['definitionId'],
      contextObjectId: row.context_object_id,
      input,
      startedAt: row.started_at.toISOString(),
      ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
      status: row.run_status
    };
  }

  private async requireDefinition(
    tenantId: TenantId,
    id: ConfigurationResolutionDefinition['id']
  ): Promise<ConfigurationResolutionDefinition> {
    const item = await this.getDefinition(tenantId, id);
    if (!item) throw new Error('Configuration Resolution Definition not found in tenant.');
    return item;
  }
  private async requireRun(
    tenantId: TenantId,
    id: ConfigurationResolutionRun['id']
  ): Promise<ConfigurationResolutionRun> {
    const item = await this.getRun(tenantId, id);
    if (!item) throw new Error('Configuration Resolution Run not found in tenant.');
    return item;
  }
}
