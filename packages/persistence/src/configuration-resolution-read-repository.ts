import {
  PLATFORM_PERMISSION_KEYS,
  type ConfigurationCriterion,
  type ConfigurationResolutionDefinition,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface DefinitionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string | null;
  version: number;
  effective_from: Date | null;
  effective_to: Date | null;
  status: ConfigurationResolutionDefinition['status'];
}
interface CriterionRow extends RowDataPacket {
  id: string;
  definition_id: string;
  definition_code: string;
  sequence_no: number;
  criterion_type: ConfigurationCriterion['criterionType'];
  mandatory: number;
  configuration: unknown;
  status: ConfigurationCriterion['status'];
}
interface RunRow extends RowDataPacket {
  id: string;
  definition_id: string;
  definition_code: string;
  context_object_id: string;
  baseline_id: string | null;
  evaluated_at: Date;
  input: unknown;
  started_at: Date;
  completed_at: Date | null;
  run_status: string;
}
interface ItemRow extends RowDataPacket {
  id: string;
  run_id: string;
  configuration_item_id: string;
  configuration_item_code: string;
  configuration_item_name: string;
  selected_version: string | null;
  criterion_id: string | null;
  criterion_type: string | null;
  result_status: string;
  message: string | null;
  evidence: unknown;
}

function jsonObject(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}

export interface ConfigurationResolutionCriterionView {
  id: string;
  definitionId: string;
  definitionCode: string;
  sequence: number;
  criterionType: ConfigurationCriterion['criterionType'];
  mandatory: boolean;
  configuration: Readonly<Record<string, unknown>>;
  status: ConfigurationCriterion['status'];
}

export interface ConfigurationResolutionRunView {
  id: string;
  definitionId: string;
  definitionCode: string;
  contextObjectId: string;
  baselineId?: string;
  evaluatedAt: string;
  input: Readonly<Record<string, unknown>>;
  startedAt: string;
  completedAt?: string;
  status: string;
}

export interface ConfigurationResolutionItemView {
  id: string;
  runId: string;
  configurationItemId: string;
  configurationItemCode: string;
  configurationItemName: string;
  selectedVersion?: string;
  criterionId?: string;
  criterionType?: string;
  status: string;
  message?: string;
  evidence: Readonly<Record<string, unknown>>;
}

export interface ConfigurationResolutionAdministrationProjection {
  definitions: Array<Omit<ConfigurationResolutionDefinition, 'tenantId'>>;
  criteria: ConfigurationResolutionCriterionView[];
  runs: ConfigurationResolutionRunView[];
  items: ConfigurationResolutionItemView[];
}

export class ConfigurationResolutionReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'ConfigurationResolutionReadError';
  }
}

export class MySqlConfigurationResolutionReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<ConfigurationResolutionAdministrationProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [definitionResult, criterionResult, runResult, itemResult] = await Promise.all([
      this.pool.execute<DefinitionRow[]>(
        `SELECT id, code, name, description, version, effective_from, effective_to, status
           FROM configuration_resolution_definitions
          WHERE tenant_id = ?
          ORDER BY code, version DESC, id`,
        [tenantId]
      ),
      this.pool.execute<CriterionRow[]>(
        `SELECT c.id, c.definition_id, d.code AS definition_code,
                c.sequence_no, c.criterion_type, c.mandatory, c.configuration, c.status
           FROM configuration_resolution_criteria c
           JOIN configuration_resolution_definitions d
             ON d.tenant_id = c.tenant_id AND d.id = c.definition_id
          WHERE c.tenant_id = ?
          ORDER BY d.code, c.sequence_no, c.id`,
        [tenantId]
      ),
      this.pool.execute<RunRow[]>(
        `SELECT r.id, r.definition_id, d.code AS definition_code,
                r.context_object_id, r.baseline_id, r.evaluated_at, r.input,
                r.started_at, r.completed_at, r.run_status
           FROM configuration_resolution_runs r
           JOIN configuration_resolution_definitions d
             ON d.tenant_id = r.tenant_id AND d.id = r.definition_id
          WHERE r.tenant_id = ?
          ORDER BY r.started_at DESC, r.id DESC
          LIMIT 100`,
        [tenantId]
      ),
      this.pool.execute<ItemRow[]>(
        `SELECT i.id, i.run_id, i.configuration_item_id,
                ci.code AS configuration_item_code, ci.name AS configuration_item_name,
                i.selected_version, i.criterion_id, c.criterion_type,
                i.result_status, i.message, i.evidence
           FROM configuration_resolution_items i
           JOIN configuration_items ci
             ON ci.tenant_id = i.tenant_id AND ci.id = i.configuration_item_id
           LEFT JOIN configuration_resolution_criteria c
             ON c.tenant_id = i.tenant_id AND c.id = i.criterion_id
          WHERE i.tenant_id = ?
          ORDER BY i.created_at DESC, i.id DESC
          LIMIT 500`,
        [tenantId]
      )
    ]);

    return {
      definitions: definitionResult[0].map((row) => ({
        id: row.id as ConfigurationResolutionDefinition['id'],
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      criteria: criterionResult[0].map((row) => ({
        id: row.id,
        definitionId: row.definition_id,
        definitionCode: row.definition_code,
        sequence: Number(row.sequence_no),
        criterionType: row.criterion_type,
        mandatory: Boolean(row.mandatory),
        configuration: jsonObject(row.configuration),
        status: row.status
      })),
      runs: runResult[0].map((row) => ({
        id: row.id,
        definitionId: row.definition_id,
        definitionCode: row.definition_code,
        contextObjectId: row.context_object_id,
        ...(row.baseline_id ? { baselineId: row.baseline_id } : {}),
        evaluatedAt: row.evaluated_at.toISOString(),
        input: jsonObject(row.input),
        startedAt: row.started_at.toISOString(),
        ...(row.completed_at ? { completedAt: row.completed_at.toISOString() } : {}),
        status: row.run_status
      })),
      items: itemResult[0].map((row) => ({
        id: row.id,
        runId: row.run_id,
        configurationItemId: row.configuration_item_id,
        configurationItemCode: row.configuration_item_code,
        configurationItemName: row.configuration_item_name,
        ...(row.selected_version ? { selectedVersion: row.selected_version } : {}),
        ...(row.criterion_id ? { criterionId: row.criterion_id } : {}),
        ...(row.criterion_type ? { criterionType: row.criterion_type } : {}),
        status: row.result_status,
        ...(row.message ? { message: row.message } : {}),
        evidence: jsonObject(row.evidence)
      }))
    };
  }

  private async requireRead(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_READ,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ConfigurationResolutionReadError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
