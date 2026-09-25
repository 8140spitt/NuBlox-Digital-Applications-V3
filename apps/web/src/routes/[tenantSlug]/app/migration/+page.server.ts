import {
  MigrationCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type MigrationConflictDispositionType,
  type MigrationConflictSeverity,
  type MigrationConflictType,
  type MigrationCutoverStrategy,
  type MigrationItemOutcome,
  type MigrationReconciliationCheckpoint,
  type MigrationReconciliationStatus,
  type MigrationRunType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getMigrationCommandService,
  getMigrationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const CUTOVER_STRATEGIES = ['BIG_BANG','PHASED','PARALLEL','ROLLING'] as const satisfies readonly MigrationCutoverStrategy[];
const RUN_TYPES = ['DRY_RUN','REHEARSAL','PRODUCTION'] as const satisfies readonly MigrationRunType[];
const ITEM_OUTCOMES = ['CREATED','UPDATED','MATCHED','SKIPPED','FAILED','CONFLICT'] as const satisfies readonly MigrationItemOutcome[];
const CONFLICT_TYPES = ['IDENTITY','MAPPING','VALIDATION','VERSION','AUTHORITY','DUPLICATE','DATA','OTHER'] as const satisfies readonly MigrationConflictType[];
const CONFLICT_SEVERITIES = ['WARNING','BLOCKING'] as const satisfies readonly MigrationConflictSeverity[];
const DISPOSITIONS = ['USE_SOURCE','USE_TARGET','MAP','WAIVE','RETRY','EXCLUDE'] as const satisfies readonly MigrationConflictDispositionType[];
const CHECKPOINTS = ['PRE_CUTOVER','CUTOVER','POST_CUTOVER'] as const satisfies readonly MigrationReconciliationCheckpoint[];
const RECONCILIATION_STATUSES = ['PENDING','MATCHED','CONFLICT','MISSING','VERIFIED'] as const satisfies readonly MigrationReconciliationStatus[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function integerValue(raw: string, label: string): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new MigrationCommandError(`${label} must be a positive integer.`, 'INVALID_INPUT');
  }
  return parsed;
}
function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new MigrationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function jsonObject(raw: string, label: string): Readonly<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new MigrationCommandError(`${label} must be valid JSON.`, 'INVALID_INPUT');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new MigrationCommandError(`${label} must be a JSON object.`, 'INVALID_INPUT');
  }
  return parsed as Readonly<Record<string, unknown>>;
}
function failure(error: unknown, action: string) {
  if (error instanceof MigrationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED' ? 403 :
      error.code === 'NOT_FOUND' ? 404 :
      error.code === 'CONFLICT' ? 409 : 400;
    return fail(status, { action, ok: false, error: error.message, code: error.code });
  }
  throw error;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;
  if (!session) {
    return {
      allowed: false,
      canManage: false,
      canExecute: false,
      canDisposition: false,
      canCutover: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [read, manage, execute, disposition, cutover] = await Promise.all([
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.MIGRATION_READ, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.MIGRATION_MANAGE, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.MIGRATION_EXECUTE, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.MIGRATION_CONFLICT_DISPOSITION, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.MIGRATION_CUTOVER_APPROVE, { scopeType: 'TENANT' })
  ]);

  if (!read.allowed) {
    return {
      allowed: false,
      canManage: false,
      canExecute: false,
      canDisposition: false,
      canCutover: false,
      reason: read.reason,
      projection: null
    };
  }

  return {
    allowed: true,
    canManage: manage.allowed,
    canExecute: execute.allowed,
    canDisposition: disposition.allowed,
    canCutover: cutover.allowed,
    reason: read.reason,
    projection: await getMigrationReadRepository().getProjection(tenantId, session.personId)
  };
};

export const actions: Actions = {
  createPlan: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createPlan', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().createPlan(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          sourceSystem: value(formData, 'sourceSystem'),
          targetSystem: value(formData, 'targetSystem'),
          scopeObjectId: value(formData, 'scopeObjectId'),
          scopeDefinition: jsonObject(value(formData, 'scopeDefinition'), 'Scope definition'),
          cutoverStrategy: enumValue(value(formData, 'cutoverStrategy'), CUTOVER_STRATEGIES, 'Cutover strategy')
        }
      );
      return { action: 'createPlan', ok: true, message: `Migration Plan ${item.code} created in DRAFT.` };
    } catch (error) { return failure(error, 'createPlan'); }
  },

  approvePlan: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'approvePlan', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().approvePlan(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          decisionId: value(formData, 'decisionId')
        }
      );
      return { action: 'approvePlan', ok: true, message: `Migration Plan ${item.code} approved.` };
    } catch (error) { return failure(error, 'approvePlan'); }
  },

  createMapping: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createMapping', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().createMappingVersion(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          version: value(formData, 'version'),
          sourceSchemaVersion: value(formData, 'sourceSchemaVersion'),
          targetSchemaVersion: value(formData, 'targetSchemaVersion'),
          mappingDefinition: jsonObject(value(formData, 'mappingDefinition'), 'Mapping definition')
        }
      );
      return { action: 'createMapping', ok: true, message: `Mapping Version ${item.version} created with checksum ${item.checksum}.` };
    } catch (error) { return failure(error, 'createMapping'); }
  },

  freezeMapping: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'freezeMapping', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().freezeMappingVersion(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'mappingId')
      );
      return { action: 'freezeMapping', ok: true, message: `Mapping Version ${item.version} frozen and immutable for execution.` };
    } catch (error) { return failure(error, 'freezeMapping'); }
  },

  storeEnvelope: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'storeEnvelope', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().storeSourceEnvelope(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          schemaName: value(formData, 'schemaName'),
          schemaVersion: value(formData, 'schemaVersion'),
          objectType: value(formData, 'objectType'),
          sourceObjectId: value(formData, 'sourceObjectId'),
          payload: jsonObject(value(formData, 'payload'), 'Source payload')
        }
      );
      return { action: 'storeEnvelope', ok: true, message: `Source envelope ${item.id} stored with ${item.checksum}.` };
    } catch (error) { return failure(error, 'storeEnvelope'); }
  },

  bindIdentity: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'bindIdentity', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().bindExternalIdentity(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          targetCanonicalObjectId: value(formData, 'targetCanonicalObjectId'),
          sourceObjectType: value(formData, 'sourceObjectType'),
          sourceObjectId: value(formData, 'sourceObjectId'),
          sourceVersion: optionalValue(formData, 'sourceVersion'),
          sourceReference: optionalValue(formData, 'sourceReference')
        }
      );
      return { action: 'bindIdentity', ok: true, message: `Source identity ${item.externalObjectId} bound to canonical object ${item.canonicalObjectId}.` };
    } catch (error) { return failure(error, 'bindIdentity'); }
  },

  createRun: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createRun', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().createRun(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          mappingVersionId: value(formData, 'mappingVersionId'),
          runReference: value(formData, 'runReference'),
          runType: enumValue(value(formData, 'runType'), RUN_TYPES, 'Run type'),
          integrationJobId: optionalValue(formData, 'integrationJobId')
        }
      );
      return { action: 'createRun', ok: true, message: `Migration Run ${item.runReference} queued.` };
    } catch (error) { return failure(error, 'createRun'); }
  },

  startRun: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'startRun', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().startRun(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'runId')
      );
      return { action: 'startRun', ok: true, message: `Migration Run ${item.runReference} started.` };
    } catch (error) { return failure(error, 'startRun'); }
  },

  recordItem: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'recordItem', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().recordItemResult(
        session.tenantId as TenantId,
        session.personId,
        {
          runId: value(formData, 'runId'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          sourceObjectType: value(formData, 'sourceObjectType'),
          sourceObjectId: value(formData, 'sourceObjectId'),
          sourceVersion: optionalValue(formData, 'sourceVersion'),
          sourceEnvelopeId: value(formData, 'sourceEnvelopeId'),
          targetCanonicalObjectId: optionalValue(formData, 'targetCanonicalObjectId'),
          targetVersion: optionalValue(formData, 'targetVersion'),
          externalIdentityId: optionalValue(formData, 'externalIdentityId'),
          outcome: enumValue(value(formData, 'outcome'), ITEM_OUTCOMES, 'Item outcome'),
          targetHash: optionalValue(formData, 'targetHash'),
          message: optionalValue(formData, 'message')
        }
      );
      return { action: 'recordItem', ok: true, message: `Migration Item #${item.sequence} recorded as ${item.outcome}.` };
    } catch (error) { return failure(error, 'recordItem'); }
  },

  createConflict: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createConflict', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().createConflict(
        session.tenantId as TenantId,
        session.personId,
        {
          runId: value(formData, 'runId'),
          itemResultId: optionalValue(formData, 'itemResultId'),
          conflictType: enumValue(value(formData, 'conflictType'), CONFLICT_TYPES, 'Conflict type'),
          severity: enumValue(value(formData, 'severity'), CONFLICT_SEVERITIES, 'Conflict severity'),
          code: value(formData, 'code'),
          description: value(formData, 'description')
        }
      );
      return { action: 'createConflict', ok: true, message: `Migration Conflict ${item.code} opened as ${item.severity}.` };
    } catch (error) { return failure(error, 'createConflict'); }
  },

  completeLoad: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'completeLoad', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().completeLoad(
        session.tenantId as TenantId,
        session.personId,
        value(formData, 'runId')
      );
      return { action: 'completeLoad', ok: true, message: `Load completed; Migration Run is ${item.status}.` };
    } catch (error) { return failure(error, 'completeLoad'); }
  },

  dispositionConflict: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'dispositionConflict', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().dispositionConflict(
        session.tenantId as TenantId,
        session.personId,
        {
          conflictId: value(formData, 'conflictId'),
          disposition: enumValue(value(formData, 'disposition'), DISPOSITIONS, 'Disposition'),
          rationale: value(formData, 'rationale'),
          decisionId: value(formData, 'decisionId'),
          retryRunId: optionalValue(formData, 'retryRunId')
        }
      );
      return { action: 'dispositionConflict', ok: true, message: `Conflict disposition ${item.disposition} recorded with Decision evidence.` };
    } catch (error) { return failure(error, 'dispositionConflict'); }
  },

  startReconciliation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'startReconciliation', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().startReconciliationRun(
        session.tenantId as TenantId,
        session.personId,
        {
          runId: value(formData, 'runId'),
          checkpoint: enumValue(value(formData, 'checkpoint'), CHECKPOINTS, 'Reconciliation checkpoint')
        }
      );
      return { action: 'startReconciliation', ok: true, message: `Reconciliation ${item.checkpoint} started.` };
    } catch (error) { return failure(error, 'startReconciliation'); }
  },

  recordReconciliation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'recordReconciliation', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().recordReconciliation(
        session.tenantId as TenantId,
        session.personId,
        {
          reconciliationRunId: value(formData, 'reconciliationRunId'),
          itemResultId: value(formData, 'itemResultId'),
          status: enumValue(value(formData, 'status'), RECONCILIATION_STATUSES, 'Reconciliation status'),
          targetHash: optionalValue(formData, 'targetHash'),
          details: optionalValue(formData, 'details')
        }
      );
      return { action: 'recordReconciliation', ok: true, message: `Reconciliation evidence recorded as ${item.status}.` };
    } catch (error) { return failure(error, 'recordReconciliation'); }
  },

  completeReconciliation: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'completeReconciliation', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().completeReconciliationRun(
        session.tenantId as TenantId,
        session.personId,
        {
          reconciliationRunId: value(formData, 'reconciliationRunId'),
          details: optionalValue(formData, 'details')
        }
      );
      return {
        action: 'completeReconciliation',
        ok: true,
        message: `Reconciliation is ${item.reconciliation.status}; Migration Run is ${item.run.status}.`
      };
    } catch (error) { return failure(error, 'completeReconciliation'); }
  },

  recordCutover: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'recordCutover', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const item = await getMigrationCommandService().recordCutoverDecision(
        session.tenantId as TenantId,
        session.personId,
        {
          planId: value(formData, 'planId'),
          runId: value(formData, 'runId'),
          reconciliationRunId: value(formData, 'reconciliationRunId'),
          decisionId: value(formData, 'decisionId'),
          outcome: enumValue(value(formData, 'outcome'), ['APPROVED','REJECTED'] as const, 'Cutover outcome'),
          targetAuthorityRuleId: optionalValue(formData, 'targetAuthorityRuleId'),
          reason: value(formData, 'reason'),
          effectiveAt: optionalValue(formData, 'effectiveAt')
        }
      );
      return {
        action: 'recordCutover',
        ok: true,
        message: `Cutover ${item.cutover.outcome}; Migration Plan is ${item.plan.status}.`
      };
    } catch (error) { return failure(error, 'recordCutover'); }
  }
};
