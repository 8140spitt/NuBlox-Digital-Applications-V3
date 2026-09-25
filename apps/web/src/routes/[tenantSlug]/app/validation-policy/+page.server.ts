import {
  ValidationPolicyAdministrationCommandError,
  ValidationExecutionCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ValidationRuleType,
  type ValidationSeverity
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getValidationPolicyAdministrationCommandService,
  getValidationPolicyAdministrationReadRepository,
  getValidationExecutionService
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const RULE_TYPES = [
  'ELIGIBILITY', 'REQUIRED_DATA', 'STATE', 'RELATIONSHIP', 'CONSISTENCY', 'MAPPING', 'CUSTOM'
] as const satisfies readonly ValidationRuleType[];

const SEVERITIES = [
  'INFO', 'WARNING', 'ERROR', 'BLOCKING'
] as const satisfies readonly ValidationSeverity[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const v = value(formData, name);
  return v || undefined;
}
function enumValue<T extends string>(raw: string, allowed: readonly T[], label: string): T {
  if (!allowed.includes(raw as T)) {
    throw new ValidationPolicyAdministrationCommandError(`${label} is invalid.`, 'INVALID_INPUT');
  }
  return raw as T;
}
function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new ValidationPolicyAdministrationCommandError(`${label} must be an integer.`, 'INVALID_INPUT');
  }
  return parsed;
}
function jsonObject(raw: string, label: string): Readonly<Record<string, unknown>> | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Readonly<Record<string, unknown>>;
  } catch {
    throw new ValidationPolicyAdministrationCommandError(`${label} must be a JSON object.`, 'INVALID_INPUT');
  }
}
function failure(error: unknown, action: string) {
  if (
    error instanceof ValidationPolicyAdministrationCommandError ||
    error instanceof ValidationExecutionCommandError
  ) {
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
    return { allowed: false, canManage: false, canDisposition: false, reason: 'No authenticated tenant context is available.', projection: null };
  }
  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation, dispositionEvaluation] = await Promise.all([
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.VALIDATION_POLICY_READ, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.VALIDATION_POLICY_MANAGE, { scopeType: 'TENANT' }),
    access.evaluatePermission(tenantId, session.personId, PLATFORM_PERMISSION_KEYS.VALIDATION_CONFLICT_DISPOSITION, { scopeType: 'TENANT' })
  ]);
  if (!readEvaluation.allowed) {
    return { allowed: false, canManage: false, canDisposition: false, reason: readEvaluation.reason, projection: null };
  }
  const projection = await getValidationPolicyAdministrationReadRepository().getProjection(tenantId, session.personId);
  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    canDisposition: dispositionEvaluation.allowed,
    reason: readEvaluation.reason,
    projection
  };
};

export const actions: Actions = {
  createRule: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createRule', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const rule = await getValidationPolicyAdministrationCommandService().createRuleDefinition(
        session.tenantId as TenantId, session.personId, {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          ruleType: enumValue(value(formData, 'ruleType'), RULE_TYPES, 'Rule type'),
          version: integerValue(value(formData, 'version'), 'Version'),
          severity: enumValue(value(formData, 'severity'), SEVERITIES, 'Severity'),
          handlerKey: value(formData, 'handlerKey'),
          configuration: jsonObject(value(formData, 'configuration'), 'Configuration'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createRule', ok: true, message: `Validation Rule ${rule.code} v${rule.version} created.` };
    } catch (error) { return failure(error, 'createRule'); }
  },

  createRuleSet: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createRuleSet', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const ruleSet = await getValidationPolicyAdministrationCommandService().createRuleSet(
        session.tenantId as TenantId, session.personId, {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createRuleSet', ok: true, message: `Validation Rule Set ${ruleSet.code} v${ruleSet.version} created.` };
    } catch (error) { return failure(error, 'createRuleSet'); }
  },

  addMember: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'addMember', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const member = await getValidationPolicyAdministrationCommandService().addRuleSetMember(
        session.tenantId as TenantId, session.personId, {
          ruleSetId: value(formData, 'ruleSetId'),
          ruleDefinitionId: value(formData, 'ruleDefinitionId'),
          sequence: integerValue(value(formData, 'sequence'), 'Sequence'),
          mandatory: value(formData, 'mandatory') !== 'false'
        }
      );
      return { action: 'addMember', ok: true, message: `Rule Set Member ${member.id} created.` };
    } catch (error) { return failure(error, 'addMember'); }
  },

  createConstraint: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createConstraint', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const policy = await getValidationPolicyAdministrationCommandService().createRelationshipConstraint(
        session.tenantId as TenantId, session.personId, {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          relationshipType: value(formData, 'relationshipType'),
          sourceObjectType: value(formData, 'sourceObjectType'),
          targetObjectType: value(formData, 'targetObjectType'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createConstraint', ok: true, message: `Relationship Constraint ${policy.code} created.` };
    } catch (error) { return failure(error, 'createConstraint'); }
  },

  dispositionConflict: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'dispositionConflict', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const status = enumValue(
        value(formData, 'status'),
        ['RESOLVED', 'WAIVED', 'CANCELLED'] as const,
        'Conflict disposition'
      );
      const conflict = await getValidationExecutionService().dispositionConflict(
        session.tenantId as TenantId,
        session.personId,
        {
          conflictId: value(formData, 'conflictId'),
          status,
          resolutionReason: value(formData, 'resolutionReason')
        }
      );
      return {
        action: 'dispositionConflict',
        ok: true,
        message: `Validation Conflict ${conflict.id} marked ${conflict.status}.`
      };
    } catch (error) { return failure(error, 'dispositionConflict'); }
  },

  createMapping: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) return fail(401, { action: 'createMapping', ok: false, error: 'Sign in required.' });
    const formData = await request.formData();
    try {
      const policy = await getValidationPolicyAdministrationCommandService().createMappingPolicy(
        session.tenantId as TenantId, session.personId, {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          sourceType: value(formData, 'sourceType'),
          targetType: value(formData, 'targetType'),
          mapping: jsonObject(value(formData, 'mapping'), 'Mapping'),
          precedence: integerValue(value(formData, 'precedence'), 'Precedence'),
          version: integerValue(value(formData, 'version'), 'Version'),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );
      return { action: 'createMapping', ok: true, message: `Mapping Policy ${policy.code} created.` };
    } catch (error) { return failure(error, 'createMapping'); }
  }
};
