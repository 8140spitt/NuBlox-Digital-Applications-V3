import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ConfigurationCriterion,
  type ConfigurationCriterionType,
  type ConfigurationItemId,
  type ConfigurationResolutionDefinition,
  type ConfigurationResolutionItem,
  type ConfigurationResolutionRun,
  type EffectivityType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlConfigurationResolutionRepository } from './configuration-resolution-repository.js';

export class ConfigurationResolutionCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'ConfigurationResolutionCommandError';
  }
}

export interface ExecuteConfigurationResolutionInput {
  definitionCode: string;
  contextObjectId: string;
  configurationItemIds?: readonly string[];
  baselineId?: string;
  explicitVersions?: Readonly<Record<string, string>>;
  scopeType?: string;
  scopeId?: string;
  evaluatedAt?: string;
}

export interface ConfigurationResolutionOutcome {
  run: ConfigurationResolutionRun;
  items: readonly ConfigurationResolutionItem[];
}

const CRITERION_TYPES = new Set<ConfigurationCriterionType>([
  'BASELINE','EXPLICIT_VERSION','EFFECTIVITY','LATEST_ESTABLISHED_BASELINE'
]);
const EFFECTIVITY_TYPES = new Set<EffectivityType>([
  'DATE','SERIAL','LOT','UNIT','PROJECT','LOCATION','CUSTOM'
]);

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new ConfigurationResolutionCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}
function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}
function integer(value: number | undefined, label: string, minimum: number): number {
  if (!Number.isInteger(value) || (value ?? -1) < minimum) {
    throw new ConfigurationResolutionCommandError(`${label} must be an integer >= ${minimum}.`, 'INVALID_INPUT');
  }
  return value as number;
}
function iso(value: string | undefined): string {
  const raw = value ?? new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ConfigurationResolutionCommandError('Evaluation date/time is invalid.', 'INVALID_INPUT');
  }
  return parsed.toISOString();
}
function mapError(error: unknown): never {
  if (error instanceof ConfigurationResolutionCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ConfigurationResolutionCommandError(
        'An equivalent configuration resolution record already exists.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new ConfigurationResolutionCommandError(error.message, 'NOT_FOUND');
    }
    if (/must|required|invalid|active|running|duplicate|scope/i.test(error.message)) {
      throw new ConfigurationResolutionCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlConfigurationResolutionCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly repository: MySqlConfigurationResolutionRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.repository = new MySqlConfigurationResolutionRepository(pool);
  }

  async createDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      name: string;
      description?: string;
      version?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<ConfigurationResolutionDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    const description = optional(input.description);
    const effectiveFrom = optional(input.effectiveFrom);
    const effectiveTo = optional(input.effectiveTo);
    const definition: ConfigurationResolutionDefinition = {
      id: asId<'ConfigurationResolutionDefinitionId'>(
        `CRD-${randomUUID()}`,
        'Configuration Resolution Definition'
      ),
      tenantId,
      code: required(input.code, 'Definition code').toUpperCase(),
      name: required(input.name, 'Definition name'),
      ...(description ? { description } : {}),
      version: integer(input.version ?? 1, 'Version', 1),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.repository.createDefinition(definition, this.audit(actorPersonId));
      return definition;
    } catch (error) { return mapError(error); }
  }

  async addCriterion(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      definitionId: string;
      sequence?: number;
      criterionType: ConfigurationCriterionType;
      mandatory?: boolean;
      configuration?: Readonly<Record<string, unknown>>;
    }
  ): Promise<ConfigurationCriterion> {
    await this.requireManage(tenantId, actorPersonId);
    if (!CRITERION_TYPES.has(input.criterionType)) {
      throw new ConfigurationResolutionCommandError('Criterion type is not supported.', 'INVALID_INPUT');
    }
    const criterion: ConfigurationCriterion = {
      id: asId<'ConfigurationCriterionId'>(`CRC-${randomUUID()}`, 'Configuration Criterion'),
      tenantId,
      definitionId: asId<'ConfigurationResolutionDefinitionId'>(
        required(input.definitionId, 'Configuration Resolution Definition'),
        'Configuration Resolution Definition'
      ),
      sequence: integer(input.sequence ?? 0, 'Sequence', 0),
      criterionType: input.criterionType,
      mandatory: input.mandatory ?? true,
      configuration: input.configuration ?? {},
      status: 'ACTIVE'
    };
    try {
      await this.repository.addCriterion(criterion, this.audit(actorPersonId));
      return criterion;
    } catch (error) { return mapError(error); }
  }

  async execute(
    tenantId: TenantId,
    actorPersonId: string,
    input: ExecuteConfigurationResolutionInput
  ): Promise<ConfigurationResolutionOutcome> {
    await this.requireExecute(tenantId, actorPersonId);
    const evaluatedAt = iso(input.evaluatedAt);
    const contextObjectId = required(input.contextObjectId, 'Context object');
    const definitionCode = required(input.definitionCode, 'Resolution Definition code').toUpperCase();
    const scopeType = optional(input.scopeType)?.toUpperCase();
    const scopeId = optional(input.scopeId);
    if (scopeType === 'TENANT' && scopeId) {
      throw new ConfigurationResolutionCommandError('TENANT scope must not specify scopeId.', 'INVALID_INPUT');
    }
    if (scopeType && scopeType !== 'TENANT' && !scopeId) {
      throw new ConfigurationResolutionCommandError('Non-TENANT scope requires scopeId.', 'INVALID_INPUT');
    }

    try {
      const definition = await this.repository.getActiveDefinitionByCode(
        tenantId,
        definitionCode,
        evaluatedAt
      );
      if (!definition) {
        throw new ConfigurationResolutionCommandError(
          'No active Configuration Resolution Definition matches the requested code/effectivity.',
          'NOT_FOUND'
        );
      }
      const criteria = await this.repository.listActiveCriteria(tenantId, definition.id);
      if (criteria.length === 0) {
        throw new ConfigurationResolutionCommandError(
          'Configuration Resolution Definition has no active criteria.',
          'INVALID_INPUT'
        );
      }

      await this.repository.assertContextObject(tenantId, contextObjectId);

      const baselineId = optional(input.baselineId);
      const requestedIds = (input.configurationItemIds ?? [])
        .map((id) => asId<'ConfigurationItemId'>(required(id, 'Configuration Item'), 'Configuration Item'));
      const baselineIds = baselineId
        ? await this.repository.listBaselineConfigurationItemIds(tenantId, baselineId, contextObjectId)
        : [];
      const itemIds = Array.from(
        new Set<string>([...requestedIds, ...baselineIds].map(String))
      ).map((id) => id as ConfigurationItemId);

      if (itemIds.length === 0) {
        throw new ConfigurationResolutionCommandError(
          'Resolution requires Configuration Item IDs or a Baseline containing Configuration Items.',
          'INVALID_INPUT'
        );
      }
      await this.repository.assertConfigurationItems(tenantId, itemIds);

      const explicitVersions: Record<string, string> = {};
      for (const [itemId, version] of Object.entries(input.explicitVersions ?? {})) {
        const trimmed = version.trim();
        if (trimmed) explicitVersions[itemId] = trimmed;
      }

      const startedAt = new Date().toISOString();
      const run: ConfigurationResolutionRun = {
        id: asId<'ConfigurationResolutionRunId'>(`CRRUN-${randomUUID()}`, 'Configuration Resolution Run'),
        tenantId,
        definitionId: definition.id,
        contextObjectId,
        input: {
          configurationItemIds: itemIds,
          ...(baselineId ? { baselineId: asId<'BaselineId'>(baselineId, 'Baseline') } : {}),
          ...(Object.keys(explicitVersions).length > 0 ? { explicitVersions } : {}),
          ...(scopeType ? { scopeType } : {}),
          ...(scopeId ? { scopeId } : {}),
          evaluatedAt
        },
        startedAt,
        status: 'RUNNING'
      };
      const audit = this.audit(actorPersonId, run.id);
      await this.repository.createRun(run, audit);

      const items: ConfigurationResolutionItem[] = [];
      for (const configurationItemId of itemIds) {
        const result = await this.resolveItem(
          tenantId,
          run,
          configurationItemId,
          criteria
        );
        await this.repository.createItem(result, audit);
        items.push(result);
      }

      const resolved = items.filter((item) => item.status === 'RESOLVED').length;
      const errors = items.filter((item) => item.status === 'ERROR').length;
      const finalStatus: Exclude<ConfigurationResolutionRun['status'], 'RUNNING'> =
        resolved === items.length ? 'RESOLVED'
          : resolved > 0 ? 'PARTIAL'
          : errors === items.length ? 'ERROR'
          : 'FAILED';
      const completedAt = new Date().toISOString();
      await this.repository.completeRun(tenantId, run.id, finalStatus, completedAt, audit);

      return {
        run: { ...run, status: finalStatus, completedAt },
        items
      };
    } catch (error) {
      return mapError(error);
    }
  }

  private async resolveItem(
    tenantId: TenantId,
    run: ConfigurationResolutionRun,
    configurationItemId: ConfigurationItemId,
    criteria: readonly ConfigurationCriterion[]
  ): Promise<ConfigurationResolutionItem> {
    for (const criterion of criteria) {
      try {
        if (criterion.criterionType === 'BASELINE') {
          const configuredBaselineId =
            typeof criterion.configuration.baselineId === 'string'
              ? criterion.configuration.baselineId.trim()
              : '';
          const baselineId = configuredBaselineId || run.input.baselineId;
          if (!baselineId) continue;
          const candidate = await this.repository.findBaselineVersion(
            tenantId,
            String(baselineId),
            run.contextObjectId,
            configurationItemId
          );
          if (!candidate) continue;
          return this.resolvedItem(run, configurationItemId, criterion, candidate.subjectVersion, {
            source: 'BASELINE',
            baselineId: candidate.baselineId,
            baselineCode: candidate.baselineCode,
            establishedAt: candidate.establishedAt ?? null
          });
        }

        if (criterion.criterionType === 'EXPLICIT_VERSION') {
          const version = run.input.explicitVersions?.[String(configurationItemId)];
          if (!version) continue;
          return this.resolvedItem(run, configurationItemId, criterion, version, {
            source: 'EXPLICIT_VERSION'
          });
        }

        if (criterion.criterionType === 'EFFECTIVITY') {
          const rawTypes = criterion.configuration.effectivityTypes;
          let effectivityTypes: EffectivityType[] | undefined;
          if (rawTypes !== undefined) {
            if (
              !Array.isArray(rawTypes) ||
              rawTypes.some((value) => typeof value !== 'string' || !EFFECTIVITY_TYPES.has(value as EffectivityType))
            ) {
              throw new Error('EFFECTIVITY criterion effectivityTypes configuration is invalid.');
            }
            effectivityTypes = rawTypes as EffectivityType[];
          }
          const candidates = await this.repository.findEffectivityVersions(
            tenantId,
            configurationItemId,
            {
              evaluatedAt: run.input.evaluatedAt,
              ...(run.input.scopeType ? { scopeType: run.input.scopeType } : {}),
              ...(run.input.scopeId ? { scopeId: run.input.scopeId } : {}),
              ...(effectivityTypes ? { effectivityTypes } : {})
            }
          );
          if (candidates.length === 0) continue;
          const versions = Array.from(new Set(candidates.map((candidate) => candidate.subjectVersion)));
          if (versions.length > 1) {
            return {
              id: asId<'ConfigurationResolutionItemId'>(`CRITEM-${randomUUID()}`, 'Configuration Resolution Item'),
              tenantId,
              runId: run.id,
              configurationItemId,
              status: 'CONFLICT',
              message: 'Multiple effective versions matched the configured Effectivity criterion.',
              evidence: {
                source: 'EFFECTIVITY',
                versions,
                candidates
              }
            };
          }
          return this.resolvedItem(run, configurationItemId, criterion, versions[0]!, {
            source: 'EFFECTIVITY',
            candidates
          });
        }

        if (criterion.criterionType === 'LATEST_ESTABLISHED_BASELINE') {
          const candidate = await this.repository.findLatestEstablishedBaselineVersion(
            tenantId,
            run.contextObjectId,
            configurationItemId,
            run.input.evaluatedAt
          );
          if (!candidate) continue;
          return this.resolvedItem(run, configurationItemId, criterion, candidate.subjectVersion, {
            source: 'LATEST_ESTABLISHED_BASELINE',
            baselineId: candidate.baselineId,
            baselineCode: candidate.baselineCode,
            establishedAt: candidate.establishedAt ?? null
          });
        }
      } catch (error) {
        if (!criterion.mandatory) continue;
        return {
          id: asId<'ConfigurationResolutionItemId'>(`CRITEM-${randomUUID()}`, 'Configuration Resolution Item'),
          tenantId,
          runId: run.id,
          configurationItemId,
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Configuration criterion failed.',
          evidence: {
            criterionId: criterion.id,
            criterionType: criterion.criterionType
          }
        };
      }
    }

    return {
      id: asId<'ConfigurationResolutionItemId'>(`CRITEM-${randomUUID()}`, 'Configuration Resolution Item'),
      tenantId,
      runId: run.id,
      configurationItemId,
      status: 'UNRESOLVED',
      message: 'No configured criterion selected a version for this Configuration Item.',
      evidence: {
        evaluatedAt: run.input.evaluatedAt,
        criteriaEvaluated: criteria.map((criterion) => criterion.id)
      }
    };
  }

  private resolvedItem(
    run: ConfigurationResolutionRun,
    configurationItemId: ConfigurationItemId,
    criterion: ConfigurationCriterion,
    selectedVersion: string,
    evidence: Readonly<Record<string, unknown>>
  ): ConfigurationResolutionItem {
    return {
      id: asId<'ConfigurationResolutionItemId'>(`CRITEM-${randomUUID()}`, 'Configuration Resolution Item'),
      tenantId: run.tenantId,
      runId: run.id,
      configurationItemId,
      selectedVersion,
      criterionId: criterion.id,
      status: 'RESOLVED',
      evidence: {
        criterionId: criterion.id,
        criterionType: criterion.criterionType,
        ...evidence
      }
    };
  }

  private audit(actorPersonId: string, correlationId = 'CONFIGURATION-RESOLUTION') {
    return { actorPersonId, correlationId };
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ConfigurationResolutionCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private async requireExecute(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_EXECUTE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ConfigurationResolutionCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
