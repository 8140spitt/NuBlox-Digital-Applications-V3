import { createHash, randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type CanonicalDataEnvelope,
  type CutoverDecision,
  type ExternalIdentity,
  type MigrationConflict,
  type MigrationConflictDisposition,
  type MigrationConflictDispositionType,
  type MigrationConflictSeverity,
  type MigrationConflictType,
  type MigrationCutoverStrategy,
  type MigrationItemOutcome,
  type MigrationItemResult,
  type MigrationMappingVersion,
  type MigrationPlan,
  type MigrationReconciliation,
  type MigrationReconciliationCheckpoint,
  type MigrationReconciliationStatus,
  type MigrationReconciliationRun,
  type MigrationRun,
  type MigrationRunType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlMigrationRepository } from './migration-repository.js';
import { MySqlPortabilityRepository } from './portability-repository.js';

export class MigrationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'MigrationCommandError';
  }
}

const CUTOVER_STRATEGIES = new Set<MigrationCutoverStrategy>([
  'BIG_BANG','PHASED','PARALLEL','ROLLING'
]);
const RUN_TYPES = new Set<MigrationRunType>([
  'DRY_RUN','REHEARSAL','PRODUCTION'
]);
const ITEM_OUTCOMES = new Set<MigrationItemOutcome>([
  'CREATED','UPDATED','MATCHED','SKIPPED','FAILED','CONFLICT'
]);
const CONFLICT_TYPES = new Set<MigrationConflictType>([
  'IDENTITY','MAPPING','VALIDATION','VERSION','AUTHORITY','DUPLICATE','DATA','OTHER'
]);
const CONFLICT_SEVERITIES = new Set<MigrationConflictSeverity>([
  'WARNING','BLOCKING'
]);
const DISPOSITIONS = new Set<MigrationConflictDispositionType>([
  'USE_SOURCE','USE_TARGET','MAP','WAIVE','RETRY','EXCLUDE'
]);
const CHECKPOINTS = new Set<MigrationReconciliationCheckpoint>([
  'PRE_CUTOVER','CUTOVER','POST_CUTOVER'
]);
const RECONCILIATION_STATUSES = new Set<MigrationReconciliationStatus>([
  'PENDING','MATCHED','CONFLICT','MISSING','VERIFIED'
]);

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) throw new MigrationCommandError(`${label} is required.`, 'INVALID_INPUT');
  return result;
}

function optional(value: string | undefined): string | undefined {
  const result = value?.trim() ?? '';
  return result || undefined;
}

function integer(value: number | undefined, label: string, minimum: number): number {
  if (!Number.isInteger(value) || (value ?? minimum - 1) < minimum) {
    throw new MigrationCommandError(
      `${label} must be an integer >= ${minimum}.`,
      'INVALID_INPUT'
    );
  }
  return value as number;
}

function iso(value: string | undefined, label: string): string {
  const raw = value ?? new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new MigrationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return parsed.toISOString();
}

function enumValue<T extends string>(value: T, allowed: Set<T>, label: string): T {
  if (!allowed.has(value)) {
    throw new MigrationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return value;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (typeof value === 'object' && value !== null) {
    const source = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(source).sort().map((key) => [key, stableValue(source[key])])
    );
  }
  return value;
}

function checksum(payload: Readonly<Record<string, unknown>>): string {
  return `sha256:${createHash('sha256')
    .update(JSON.stringify(stableValue(payload)))
    .digest('hex')}`;
}

function mapError(error: unknown): never {
  if (error instanceof MigrationCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new MigrationCommandError(
        'An equivalent migration control record already exists or another active production migration holds the Plan guard.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error) {
    if (/not found/i.test(error.message)) {
      throw new MigrationCommandError(error.message, 'NOT_FOUND');
    }
    if (
      /must|required|invalid|only|cannot|same tenant|requires|belong|match|authority|reconciliation/i.test(
        error.message
      )
    ) {
      throw new MigrationCommandError(error.message, 'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlMigrationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly repository: MySqlMigrationRepository;
  private readonly portability: MySqlPortabilityRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.repository = new MySqlMigrationRepository(pool);
    this.portability = new MySqlPortabilityRepository(pool);
  }

  async createPlan(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code: string;
      name: string;
      sourceSystem: string;
      targetSystem: string;
      scopeObjectId: string;
      scopeDefinition: Readonly<Record<string, unknown>>;
      cutoverStrategy: MigrationCutoverStrategy;
      createdAt?: string;
    }
  ): Promise<MigrationPlan> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_MANAGE);
    enumValue(input.cutoverStrategy, CUTOVER_STRATEGIES, 'Cutover strategy');
    const plan: MigrationPlan = {
      id: asId<'MigrationPlanId'>(`MIGPLAN-${randomUUID()}`, 'Migration Plan'),
      tenantId,
      code: required(input.code, 'Migration Plan code').toUpperCase(),
      name: required(input.name, 'Migration Plan name'),
      sourceSystem: required(input.sourceSystem, 'Source system'),
      targetSystem: required(input.targetSystem, 'Target system'),
      scopeObjectId: asId<'CanonicalObjectId'>(
        required(input.scopeObjectId, 'Migration scope object'),
        'Migration scope object'
      ),
      scopeDefinition: input.scopeDefinition,
      cutoverStrategy: input.cutoverStrategy,
      status: 'DRAFT',
      createdByPersonId: asId<'PersonId'>(actorPersonId, 'Migration Plan creator'),
      createdAt: iso(input.createdAt, 'Migration Plan createdAt')
    };
    try {
      await this.repository.createPlan(plan, this.audit(actorPersonId));
      return plan;
    } catch (error) { return mapError(error); }
  }

  async approvePlan(
    tenantId: TenantId,
    actorPersonId: string,
    input: { planId: string; decisionId: string; approvedAt?: string }
  ): Promise<MigrationPlan> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_MANAGE);
    try {
      return await this.repository.approvePlan(
        tenantId,
        asId<'MigrationPlanId'>(required(input.planId, 'Migration Plan'), 'Migration Plan'),
        asId<'DecisionId'>(required(input.decisionId, 'Approval Decision'), 'Approval Decision'),
        iso(input.approvedAt, 'Approved at'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async createMappingVersion(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      planId: string;
      version: string;
      sourceSchemaVersion: string;
      targetSchemaVersion: string;
      mappingDefinition: Readonly<Record<string, unknown>>;
      createdAt?: string;
    }
  ): Promise<MigrationMappingVersion> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_MANAGE);
    const mapping: MigrationMappingVersion = {
      id: asId<'MigrationMappingVersionId'>(`MIGMAP-${randomUUID()}`, 'Migration Mapping Version'),
      tenantId,
      migrationPlanId: asId<'MigrationPlanId'>(
        required(input.planId, 'Migration Plan'),
        'Migration Plan'
      ),
      version: required(input.version, 'Mapping version'),
      sourceSchemaVersion: required(input.sourceSchemaVersion, 'Source schema version'),
      targetSchemaVersion: required(input.targetSchemaVersion, 'Target schema version'),
      mappingDefinition: input.mappingDefinition,
      checksum: checksum(input.mappingDefinition),
      status: 'DRAFT',
      createdByPersonId: asId<'PersonId'>(actorPersonId, 'Mapping creator'),
      createdAt: iso(input.createdAt, 'Mapping createdAt')
    };
    try {
      await this.repository.createMapping(mapping, this.audit(actorPersonId));
      return mapping;
    } catch (error) { return mapError(error); }
  }

  async freezeMappingVersion(
    tenantId: TenantId,
    actorPersonId: string,
    mappingId: string,
    frozenAt?: string
  ): Promise<MigrationMappingVersion> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_MANAGE);
    try {
      return await this.repository.freezeMapping(
        tenantId,
        asId<'MigrationMappingVersionId'>(
          required(mappingId, 'Migration Mapping Version'),
          'Migration Mapping Version'
        ),
        asId<'PersonId'>(actorPersonId, 'Mapping freezer'),
        iso(frozenAt, 'Mapping frozenAt'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async storeSourceEnvelope(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      planId: string;
      schemaName: string;
      schemaVersion: string;
      objectType: string;
      sourceObjectId: string;
      payload: Readonly<Record<string, unknown>>;
      createdAt?: string;
    }
  ): Promise<CanonicalDataEnvelope> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    const plan = await this.repository.getPlan(
      tenantId,
      asId<'MigrationPlanId'>(required(input.planId, 'Migration Plan'), 'Migration Plan')
    );
    if (!plan) throw new MigrationCommandError('Migration Plan not found in tenant.', 'NOT_FOUND');
    if (!['APPROVED','ACTIVE'].includes(plan.status)) {
      throw new MigrationCommandError(
        'Source evidence can only be captured for an APPROVED or ACTIVE Migration Plan.',
        'INVALID_INPUT'
      );
    }
    const sourceObjectId = required(input.sourceObjectId, 'Source object ID');
    const envelope: CanonicalDataEnvelope = {
      id: asId<'DataEnvelopeId'>(`MIGENV-${randomUUID()}`, 'Migration source envelope'),
      tenantId,
      direction: 'IMPORT',
      schemaName: required(input.schemaName, 'Source schema name'),
      schemaVersion: required(input.schemaVersion, 'Source schema version'),
      objectType: required(input.objectType, 'Source object type'),
      stableKey: sourceObjectId,
      payload: input.payload,
      externalSystem: plan.sourceSystem,
      externalObjectId: sourceObjectId,
      checksum: checksum(input.payload),
      createdAt: iso(input.createdAt, 'Source envelope createdAt')
    };
    try {
      await this.portability.storeDataEnvelope(envelope, this.audit(actorPersonId));
      return envelope;
    } catch (error) { return mapError(error); }
  }

  async bindExternalIdentity(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      planId: string;
      targetCanonicalObjectId: string;
      sourceObjectType: string;
      sourceObjectId: string;
      sourceVersion?: string;
      sourceReference?: string;
    }
  ): Promise<ExternalIdentity> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    const plan = await this.repository.getPlan(
      tenantId,
      asId<'MigrationPlanId'>(required(input.planId, 'Migration Plan'), 'Migration Plan')
    );
    if (!plan) throw new MigrationCommandError('Migration Plan not found in tenant.', 'NOT_FOUND');
    const sourceVersion = optional(input.sourceVersion);
    const sourceReference = optional(input.sourceReference);
    const identity: ExternalIdentity = {
      id: asId<'ExternalIdentityId'>(`MIGEXT-${randomUUID()}`, 'Migration External Identity'),
      tenantId,
      canonicalObjectId: asId<'CanonicalObjectId'>(
        required(input.targetCanonicalObjectId, 'Target canonical object'),
        'Target canonical object'
      ),
      externalSystem: plan.sourceSystem,
      externalObjectType: required(input.sourceObjectType, 'Source object type'),
      externalObjectId: required(input.sourceObjectId, 'Source object ID'),
      ...(sourceVersion ? { externalVersion: sourceVersion } : {}),
      ...(sourceReference ? { sourceReference } : {})
    };
    try {
      await this.portability.createExternalIdentity(identity, this.audit(actorPersonId));
      return identity;
    } catch (error) { return mapError(error); }
  }

  async createRun(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      planId: string;
      mappingVersionId: string;
      runReference: string;
      runType: MigrationRunType;
      integrationJobId?: string;
      requestedAt?: string;
    }
  ): Promise<MigrationRun> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    enumValue(input.runType, RUN_TYPES, 'Migration Run type');
    const integrationJobId = optional(input.integrationJobId);
    const run: MigrationRun = {
      id: asId<'MigrationRunId'>(`MIGRUN-${randomUUID()}`, 'Migration Run'),
      tenantId,
      migrationPlanId: asId<'MigrationPlanId'>(
        required(input.planId, 'Migration Plan'),
        'Migration Plan'
      ),
      mappingVersionId: asId<'MigrationMappingVersionId'>(
        required(input.mappingVersionId, 'Migration Mapping Version'),
        'Migration Mapping Version'
      ),
      runReference: required(input.runReference, 'Run reference'),
      runType: input.runType,
      ...(integrationJobId
        ? {
            integrationJobId: asId<'IntegrationJobId'>(
              integrationJobId,
              'Integration Job'
            )
          }
        : {}),
      requestedByPersonId: asId<'PersonId'>(actorPersonId, 'Run requester'),
      requestedAt: iso(input.requestedAt, 'Migration Run requestedAt'),
      status: 'QUEUED'
    };
    try {
      await this.repository.createRun(run, this.audit(actorPersonId));
      return run;
    } catch (error) { return mapError(error); }
  }

  async startRun(
    tenantId: TenantId,
    actorPersonId: string,
    runId: string,
    startedAt?: string
  ): Promise<MigrationRun> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    try {
      return await this.repository.startRun(
        tenantId,
        asId<'MigrationRunId'>(required(runId, 'Migration Run'), 'Migration Run'),
        iso(startedAt, 'Migration Run startedAt'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async recordItemResult(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      runId: string;
      sequence: number;
      sourceObjectType: string;
      sourceObjectId: string;
      sourceVersion?: string;
      sourceEnvelopeId: string;
      targetCanonicalObjectId?: string;
      targetVersion?: string;
      externalIdentityId?: string;
      outcome: MigrationItemOutcome;
      targetHash?: string;
      message?: string;
      recordedAt?: string;
    }
  ): Promise<MigrationItemResult> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    enumValue(input.outcome, ITEM_OUTCOMES, 'Migration Item outcome');
    const runId = asId<'MigrationRunId'>(required(input.runId, 'Migration Run'), 'Migration Run');
    const run = await this.repository.getRun(tenantId, runId);
    if (!run) throw new MigrationCommandError('Migration Run not found in tenant.', 'NOT_FOUND');
    const plan = await this.repository.getPlan(tenantId, run.migrationPlanId);
    if (!plan) throw new MigrationCommandError('Migration Plan not found in tenant.', 'NOT_FOUND');
    const envelopeId = asId<'DataEnvelopeId'>(
      required(input.sourceEnvelopeId, 'Source Data Envelope'),
      'Source Data Envelope'
    );
    const envelope = await this.repository.getEnvelope(tenantId, envelopeId);
    if (!envelope) {
      throw new MigrationCommandError('Source Data Envelope not found in tenant.', 'NOT_FOUND');
    }
    const sourceVersion = optional(input.sourceVersion);
    const targetCanonicalObjectId = optional(input.targetCanonicalObjectId);
    const targetVersion = optional(input.targetVersion);
    const externalIdentityId = optional(input.externalIdentityId);
    const targetHash = optional(input.targetHash);
    const message = optional(input.message);
    const item: MigrationItemResult = {
      id: asId<'MigrationItemResultId'>(`MIGITEM-${randomUUID()}`, 'Migration Item Result'),
      tenantId,
      migrationRunId: runId,
      sequence: integer(input.sequence, 'Migration Item sequence', 1),
      sourceSystem: plan.sourceSystem,
      sourceObjectType: required(input.sourceObjectType, 'Source object type'),
      sourceObjectId: required(input.sourceObjectId, 'Source object ID'),
      ...(sourceVersion ? { sourceVersion } : {}),
      sourceEnvelopeId: envelopeId,
      ...(targetCanonicalObjectId
        ? {
            targetCanonicalObjectId: asId<'CanonicalObjectId'>(
              targetCanonicalObjectId,
              'Target canonical object'
            )
          }
        : {}),
      ...(targetVersion ? { targetVersion } : {}),
      ...(externalIdentityId
        ? {
            externalIdentityId: asId<'ExternalIdentityId'>(
              externalIdentityId,
              'External Identity'
            )
          }
        : {}),
      outcome: input.outcome,
      sourceHash: envelope.checksum,
      ...(targetHash ? { targetHash } : {}),
      ...(message ? { message } : {}),
      recordedAt: iso(input.recordedAt, 'Migration Item recordedAt')
    };
    try {
      await this.repository.recordItem(item, this.audit(actorPersonId));
      return item;
    } catch (error) { return mapError(error); }
  }

  async createConflict(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      runId: string;
      itemResultId?: string;
      conflictType: MigrationConflictType;
      severity: MigrationConflictSeverity;
      code: string;
      description: string;
      detectedAt?: string;
    }
  ): Promise<MigrationConflict> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    enumValue(input.conflictType, CONFLICT_TYPES, 'Migration Conflict type');
    enumValue(input.severity, CONFLICT_SEVERITIES, 'Migration Conflict severity');
    const itemResultId = optional(input.itemResultId);
    const conflict: MigrationConflict = {
      id: asId<'MigrationConflictId'>(`MIGCON-${randomUUID()}`, 'Migration Conflict'),
      tenantId,
      migrationRunId: asId<'MigrationRunId'>(
        required(input.runId, 'Migration Run'),
        'Migration Run'
      ),
      ...(itemResultId
        ? {
            migrationItemResultId: asId<'MigrationItemResultId'>(
              itemResultId,
              'Migration Item Result'
            )
          }
        : {}),
      conflictType: input.conflictType,
      severity: input.severity,
      code: required(input.code, 'Migration Conflict code').toUpperCase(),
      description: required(input.description, 'Migration Conflict description'),
      status: 'OPEN',
      detectedAt: iso(input.detectedAt, 'Conflict detectedAt')
    };
    try {
      await this.repository.createConflict(conflict, this.audit(actorPersonId));
      return conflict;
    } catch (error) { return mapError(error); }
  }

  async completeLoad(
    tenantId: TenantId,
    actorPersonId: string,
    runId: string,
    completedAt?: string
  ): Promise<MigrationRun> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    try {
      return await this.repository.completeLoad(
        tenantId,
        asId<'MigrationRunId'>(required(runId, 'Migration Run'), 'Migration Run'),
        iso(completedAt, 'Load completedAt'),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async dispositionConflict(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      conflictId: string;
      disposition: MigrationConflictDispositionType;
      rationale: string;
      decisionId: string;
      retryRunId?: string;
      disposedAt?: string;
    }
  ): Promise<MigrationConflictDisposition> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.MIGRATION_CONFLICT_DISPOSITION
    );
    enumValue(input.disposition, DISPOSITIONS, 'Migration Conflict disposition');
    const retryRunId = optional(input.retryRunId);
    const disposition: MigrationConflictDisposition = {
      id: asId<'MigrationConflictDispositionId'>(
        `MIGDISP-${randomUUID()}`,
        'Migration Conflict Disposition'
      ),
      tenantId,
      migrationConflictId: asId<'MigrationConflictId'>(
        required(input.conflictId, 'Migration Conflict'),
        'Migration Conflict'
      ),
      disposition: input.disposition,
      rationale: required(input.rationale, 'Disposition rationale'),
      decisionId: asId<'DecisionId'>(
        required(input.decisionId, 'Disposition Decision'),
        'Disposition Decision'
      ),
      disposedByPersonId: asId<'PersonId'>(actorPersonId, 'Conflict disposer'),
      disposedAt: iso(input.disposedAt, 'Conflict disposedAt'),
      ...(retryRunId
        ? { retryRunId: asId<'MigrationRunId'>(retryRunId, 'Retry Migration Run') }
        : {})
    };
    try {
      await this.repository.dispositionConflict(disposition, this.audit(actorPersonId));
      return disposition;
    } catch (error) { return mapError(error); }
  }

  async startReconciliationRun(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      runId: string;
      checkpoint: MigrationReconciliationCheckpoint;
      startedAt?: string;
    }
  ): Promise<MigrationReconciliationRun> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    enumValue(input.checkpoint, CHECKPOINTS, 'Reconciliation checkpoint');
    const reconciliation: MigrationReconciliationRun = {
      id: asId<'MigrationReconciliationRunId'>(
        `MIGREC-RUN-${randomUUID()}`,
        'Migration Reconciliation Run'
      ),
      tenantId,
      migrationRunId: asId<'MigrationRunId'>(
        required(input.runId, 'Migration Run'),
        'Migration Run'
      ),
      checkpoint: input.checkpoint,
      status: 'RUNNING',
      startedByPersonId: asId<'PersonId'>(actorPersonId, 'Reconciliation starter'),
      startedAt: iso(input.startedAt, 'Reconciliation startedAt')
    };
    try {
      await this.repository.startReconciliationRun(
        reconciliation,
        this.audit(actorPersonId)
      );
      return reconciliation;
    } catch (error) { return mapError(error); }
  }

  async recordReconciliation(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      reconciliationRunId: string;
      itemResultId: string;
      status: MigrationReconciliationStatus;
      targetHash?: string;
      details?: string;
      checkedAt?: string;
    }
  ): Promise<MigrationReconciliation> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    enumValue(input.status, RECONCILIATION_STATUSES, 'Reconciliation status');
    const item = await this.repository.getItem(
      tenantId,
      asId<'MigrationItemResultId'>(
        required(input.itemResultId, 'Migration Item Result'),
        'Migration Item Result'
      )
    );
    if (!item) throw new MigrationCommandError('Migration Item Result not found in tenant.', 'NOT_FOUND');
    if (!item.externalIdentityId || !item.targetCanonicalObjectId) {
      throw new MigrationCommandError(
        'Reconciliation requires a Migration Item Result with target canonical object and External Identity evidence.',
        'INVALID_INPUT'
      );
    }
    const requestedTargetHash = optional(input.targetHash);
    const targetHash = requestedTargetHash ?? item.targetHash;
    const details = optional(input.details);
    const reconciliation: MigrationReconciliation = {
      id: asId<'MigrationReconciliationId'>(
        `MIGREC-${randomUUID()}`,
        'Migration Reconciliation'
      ),
      tenantId,
      externalIdentityId: item.externalIdentityId,
      canonicalObjectId: item.targetCanonicalObjectId,
      status: input.status,
      sourceHash: item.sourceHash,
      ...(targetHash ? { targetHash } : {}),
      checkedAt: iso(input.checkedAt, 'Reconciliation checkedAt'),
      ...(details ? { details } : {})
    };
    try {
      await this.repository.recordReconciliation(
        asId<'MigrationReconciliationRunId'>(
          required(input.reconciliationRunId, 'Migration Reconciliation Run'),
          'Migration Reconciliation Run'
        ),
        reconciliation,
        this.audit(actorPersonId)
      );
      return reconciliation;
    } catch (error) { return mapError(error); }
  }

  async completeReconciliationRun(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      reconciliationRunId: string;
      details?: string;
      completedAt?: string;
    }
  ): Promise<{ reconciliation: MigrationReconciliationRun; run: MigrationRun }> {
    await this.requirePermission(tenantId, actorPersonId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE);
    try {
      return await this.repository.completeReconciliationRun(
        tenantId,
        asId<'MigrationReconciliationRunId'>(
          required(input.reconciliationRunId, 'Migration Reconciliation Run'),
          'Migration Reconciliation Run'
        ),
        iso(input.completedAt, 'Reconciliation completedAt'),
        optional(input.details),
        this.audit(actorPersonId)
      );
    } catch (error) { return mapError(error); }
  }

  async recordCutoverDecision(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      planId: string;
      runId: string;
      reconciliationRunId: string;
      decisionId: string;
      outcome: 'APPROVED' | 'REJECTED';
      targetAuthorityRuleId?: string;
      reason: string;
      decidedAt?: string;
      effectiveAt?: string;
    }
  ): Promise<{ cutover: CutoverDecision; plan: MigrationPlan }> {
    await this.requirePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.MIGRATION_CUTOVER_APPROVE
    );
    const authorityRuleId = optional(input.targetAuthorityRuleId);
    const effectiveAt = optional(input.effectiveAt);
    const cutover: CutoverDecision = {
      id: asId<'CutoverDecisionId'>(`CUTOVER-${randomUUID()}`, 'Cutover Decision'),
      tenantId,
      migrationPlanId: asId<'MigrationPlanId'>(
        required(input.planId, 'Migration Plan'),
        'Migration Plan'
      ),
      migrationRunId: asId<'MigrationRunId'>(
        required(input.runId, 'Migration Run'),
        'Migration Run'
      ),
      reconciliationRunId: asId<'MigrationReconciliationRunId'>(
        required(input.reconciliationRunId, 'Migration Reconciliation Run'),
        'Migration Reconciliation Run'
      ),
      decisionId: asId<'DecisionId'>(
        required(input.decisionId, 'Authority Decision'),
        'Authority Decision'
      ),
      outcome: input.outcome,
      ...(authorityRuleId
        ? {
            targetAuthorityRuleId: asId<'SourceAuthorityRuleId'>(
              authorityRuleId,
              'Target Source Authority Rule'
            )
          }
        : {}),
      decidedByPersonId: asId<'PersonId'>(actorPersonId, 'Cutover decider'),
      decidedAt: iso(input.decidedAt, 'Cutover decidedAt'),
      ...(effectiveAt ? { effectiveAt: iso(effectiveAt, 'Cutover effectiveAt') } : {}),
      reason: required(input.reason, 'Cutover reason')
    };
    try {
      return await this.repository.recordCutover(cutover, this.audit(actorPersonId));
    } catch (error) { return mapError(error); }
  }

  private audit(actorPersonId: string) {
    return { actorPersonId, correlationId: 'GOVERNED-MIGRATION' };
  }

  private async requirePermission(
    tenantId: TenantId,
    actorPersonId: string,
    permissionKey: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      permissionKey,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new MigrationCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
