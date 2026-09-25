import {
  PolicyAdministrationCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type PolicyAssignmentMode,
  type PolicyScopeType,
  type PolicyType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getPolicyAdministrationCommandService,
  getPolicyAdministrationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const SCOPE_TYPES = [
  'TENANT',
  'ORGANISATION',
  'ORGANISATION_UNIT',
  'PROGRAMME',
  'PROJECT',
  'CONTRACT',
  'WORK_PACKAGE',
  'SITE',
  'ASSET',
  'SERVICE',
  'CUSTOM'
] as const satisfies readonly PolicyScopeType[];

const POLICY_TYPES = [
  'ACCESS',
  'SECURITY',
  'GOVERNANCE',
  'CONFIGURATION',
  'CREATION',
  'RETENTION',
  'CUSTOM'
] as const satisfies readonly PolicyType[];

const ASSIGNMENT_MODES = [
  'SUPPLEMENT',
  'OVERRIDE',
  'BLOCK'
] as const satisfies readonly PolicyAssignmentMode[];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function enumValue<T extends string>(
  raw: string,
  allowed: readonly T[],
  label: string
): T {
  if (!allowed.includes(raw as T)) {
    throw new PolicyAdministrationCommandError(
      `${label} is invalid.`,
      'INVALID_INPUT'
    );
  }
  return raw as T;
}

function integerValue(raw: string, label: string): number | undefined {
  if (!raw) return undefined;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed)) {
    throw new PolicyAdministrationCommandError(
      `${label} must be an integer.`,
      'INVALID_INPUT'
    );
  }
  return parsed;
}

function failure(error: unknown, action: string) {
  if (error instanceof PolicyAdministrationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'NOT_FOUND'
          ? 404
          : error.code === 'CONFLICT'
            ? 409
            : 400;

    return fail(status, {
      action,
      ok: false,
      error: error.message,
      code: error.code
    });
  }

  throw error;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      canManage: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const access = getAccessRepository();
  const [readEvaluation, manageEvaluation] = await Promise.all([
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.POLICY_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.POLICY_MANAGE,
      { scopeType: 'TENANT' }
    )
  ]);

  if (!readEvaluation.allowed) {
    return {
      allowed: false,
      canManage: false,
      reason: readEvaluation.reason,
      projection: null
    };
  }

  const projection = await getPolicyAdministrationReadRepository().getProjection(
    tenantId,
    session.personId
  );

  return {
    allowed: true,
    canManage: manageEvaluation.allowed,
    reason: readEvaluation.reason,
    projection
  };
};

export const actions: Actions = {
  createScope: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createScope',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const scope = await getPolicyAdministrationCommandService().createScope(
        session.tenantId as TenantId,
        session.personId,
        {
          parentPolicyScopeId: optionalValue(formData, 'parentPolicyScopeId'),
          scopeType: enumValue(
            value(formData, 'scopeType'),
            SCOPE_TYPES,
            'Policy Scope type'
          ),
          scopeObjectId: optionalValue(formData, 'scopeObjectId'),
          code: value(formData, 'code'),
          name: value(formData, 'name')
        }
      );

      return {
        action: 'createScope',
        ok: true,
        message: `Policy Scope ${scope.code} — ${scope.name} created.`
      };
    } catch (error) {
      return failure(error, 'createScope');
    }
  },

  createDefinition: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createDefinition',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const definition =
        await getPolicyAdministrationCommandService().createDefinition(
          session.tenantId as TenantId,
          session.personId,
          {
            code: value(formData, 'code'),
            name: value(formData, 'name'),
            description: optionalValue(formData, 'description'),
            policyType: enumValue(
              value(formData, 'policyType'),
              POLICY_TYPES,
              'Policy type'
            ),
            version: integerValue(value(formData, 'version'), 'Version'),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'createDefinition',
        ok: true,
        message: `Policy Definition ${definition.code} v${definition.version} created.`
      };
    } catch (error) {
      return failure(error, 'createDefinition');
    }
  },

  assignPolicy: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'assignPolicy',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const assignment = await getPolicyAdministrationCommandService().assignPolicy(
        session.tenantId as TenantId,
        session.personId,
        {
          policyScopeId: value(formData, 'policyScopeId'),
          policyDefinitionId: value(formData, 'policyDefinitionId'),
          assignmentMode: enumValue(
            value(formData, 'assignmentMode'),
            ASSIGNMENT_MODES,
            'Assignment mode'
          ),
          precedence: integerValue(
            value(formData, 'precedence'),
            'Precedence'
          ),
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );

      return {
        action: 'assignPolicy',
        ok: true,
        message: `Policy Assignment ${assignment.id} created.`
      };
    } catch (error) {
      return failure(error, 'assignPolicy');
    }
  }
};
