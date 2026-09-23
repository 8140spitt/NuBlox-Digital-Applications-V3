import {
  ConfigurationResolutionCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ConfigurationCriterionType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getConfigurationResolutionCommandService,
  getConfigurationResolutionReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const CRITERION_TYPES = [
  'BASELINE',
  'EXPLICIT_VERSION',
  'EFFECTIVITY',
  'LATEST_ESTABLISHED_BASELINE'
] as const satisfies readonly ConfigurationCriterionType[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}
function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new ConfigurationResolutionCommandError(`${label} must be an integer.`, 'INVALID_INPUT');
  }
  return parsed;
}
function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new ConfigurationResolutionCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function jsonObject(raw: string, label: string): Readonly<Record<string, unknown>> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error();
    return parsed as Readonly<Record<string, unknown>>;
  } catch {
    throw new ConfigurationResolutionCommandError(`${label} must be a JSON object.`, 'INVALID_INPUT');
  }
}
function idList(raw: string): string[] {
  return raw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
function failure(error: unknown, action: string) {
  if (error instanceof ConfigurationResolutionCommandError) {
    const status = error.code === 'PERMISSION_DENIED' ? 403
      : error.code === 'NOT_FOUND' ? 404
      : error.code === 'CONFLICT' ? 409 : 400;
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
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation, executeEvaluation] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_MANAGE,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.CONFIGURATION_RESOLUTION_EXECUTE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      canExecute: false,
      reason: readEvaluation.reason,
      projection: null
    };
  }

  const projection = await getConfigurationResolutionReadRepository()
    .getProjection(tenantId, session.personId);

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    canExecute: executeEvaluation.allowed,
    reason: readEvaluation.reason,
    projection
  };
};

export const actions: Actions = {
  createDefinition: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, { action: 'createDefinition', ok: false, error: 'Sign in required.' });
    }
    const formData = await request.formData();
    try {
      const item = await getConfigurationResolutionCommandService().createDefinition(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return {
        action: 'createDefinition',
        ok: true,
        message: `Configuration Resolution Definition ${item.code} v${item.version} created.`
      };
    } catch (error) {
      return failure(error, 'createDefinition');
    }
  },

  addCriterion: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, { action: 'addCriterion', ok: false, error: 'Sign in required.' });
    }
    const formData = await request.formData();
    try {
      const item = await getConfigurationResolutionCommandService().addCriterion(
        session.tenantId as TenantId,
        session.personId,
        {
          definitionId: value(formData, 'definitionId'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          criterionType: enumValue(
            value(formData, 'criterionType'),
            CRITERION_TYPES,
            'Criterion type'
          ),
          mandatory: value(formData, 'mandatory') !== 'false',
          configuration: jsonObject(value(formData, 'configuration'), 'Configuration')
        }
      );
      return {
        action: 'addCriterion',
        ok: true,
        message: `Configuration Criterion ${item.criterionType} created.`
      };
    } catch (error) {
      return failure(error, 'addCriterion');
    }
  },

  execute: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, { action: 'execute', ok: false, error: 'Sign in required.' });
    }
    const formData = await request.formData();
    try {
      const result = await getConfigurationResolutionCommandService().execute(
        session.tenantId as TenantId,
        session.personId,
        {
          definitionCode: value(formData, 'definitionCode'),
          contextObjectId: value(formData, 'contextObjectId'),
          configurationItemIds: idList(value(formData, 'configurationItemIds')),
          baselineId: optionalValue(formData, 'baselineId'),
          explicitVersions: jsonObject(
            value(formData, 'explicitVersions'),
            'Explicit versions'
          ) as Readonly<Record<string, string>> | undefined,
          scopeType: optionalValue(formData, 'scopeType'),
          scopeId: optionalValue(formData, 'scopeId'),
          evaluatedAt: optionalValue(formData, 'evaluatedAt')
        }
      );
      const conflicts = result.items.filter((item) => item.status === 'CONFLICT').length;
      const unresolved = result.items.filter((item) => item.status === 'UNRESOLVED').length;
      return {
        action: 'execute',
        ok: true,
        message: `Resolution ${result.run.id} completed ${result.run.status}: ${result.items.length} item(s), ${conflicts} conflict(s), ${unresolved} unresolved.`
      };
    } catch (error) {
      return failure(error, 'execute');
    }
  }
};
