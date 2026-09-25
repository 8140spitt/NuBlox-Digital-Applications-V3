import {
  SecurityClassificationAdministrationCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type SecurityClassificationSchemeKind,
  type SecurityPrincipalType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getSecurityClassificationAdministrationCommandService,
  getSecurityClassificationAdministrationReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const SCHEME_KINDS = ['ORDINAL', 'CATEGORICAL'] as const satisfies readonly SecurityClassificationSchemeKind[];
const PRINCIPAL_TYPES = [
  'PERSON',
  'POSITION',
  'ORGANISATION_UNIT',
  'ORGANISATION'
] as const satisfies readonly SecurityPrincipalType[];

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
    throw new SecurityClassificationAdministrationCommandError(
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
    throw new SecurityClassificationAdministrationCommandError(
      `${label} must be an integer.`,
      'INVALID_INPUT'
    );
  }
  return parsed;
}

function parsePrincipal(raw: string): {
  principalType: SecurityPrincipalType;
  principalId: string;
} {
  const [type, ...rest] = raw.split('|');
  const principalId = rest.join('|').trim();

  if (!principalId || !PRINCIPAL_TYPES.includes(type as SecurityPrincipalType)) {
    throw new SecurityClassificationAdministrationCommandError(
      'A valid clearance principal is required.',
      'INVALID_INPUT'
    );
  }

  return {
    principalType: type as SecurityPrincipalType,
    principalId
  };
}

function failure(error: unknown, action: string) {
  if (error instanceof SecurityClassificationAdministrationCommandError) {
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
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_READ,
      { scopeType: 'TENANT' }
    ),
    access.evaluatePermission(
      tenantId,
      session.personId,
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_MANAGE,
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

  const projection =
    await getSecurityClassificationAdministrationReadRepository().getProjection(
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
  createScheme: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createScheme',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const scheme =
        await getSecurityClassificationAdministrationCommandService().createScheme(
          session.tenantId as TenantId,
          session.personId,
          {
            code: value(formData, 'code'),
            name: value(formData, 'name'),
            description: optionalValue(formData, 'description'),
            kind: enumValue(
              value(formData, 'kind'),
              SCHEME_KINDS,
              'Classification Scheme kind'
            )
          }
        );

      return {
        action: 'createScheme',
        ok: true,
        message: `Classification Scheme ${scheme.code} — ${scheme.name} created.`
      };
    } catch (error) {
      return failure(error, 'createScheme');
    }
  },

  createLevel: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createLevel',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const level =
        await getSecurityClassificationAdministrationCommandService().createLevel(
          session.tenantId as TenantId,
          session.personId,
          {
            schemeId: value(formData, 'schemeId'),
            code: value(formData, 'code'),
            name: value(formData, 'name'),
            description: optionalValue(formData, 'description'),
            rankOrder: integerValue(value(formData, 'rankOrder'), 'Rank order')
          }
        );

      return {
        action: 'createLevel',
        ok: true,
        message: `Classification Level ${level.code} — ${level.name} created.`
      };
    } catch (error) {
      return failure(error, 'createLevel');
    }
  },

  grantClearance: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'grantClearance',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const principal = parsePrincipal(value(formData, 'principal'));
      const grant =
        await getSecurityClassificationAdministrationCommandService().grantClearance(
          session.tenantId as TenantId,
          session.personId,
          {
            ...principal,
            classificationLevelId: value(formData, 'classificationLevelId'),
            includeLowerLevels: formData.get('includeLowerLevels') === 'on',
            scopeType: value(formData, 'scopeType'),
            scopeId: optionalValue(formData, 'scopeId'),
            effectiveFrom: optionalValue(formData, 'effectiveFrom'),
            effectiveTo: optionalValue(formData, 'effectiveTo')
          }
        );

      return {
        action: 'grantClearance',
        ok: true,
        message: `Clearance Grant ${grant.id} created.`
      };
    } catch (error) {
      return failure(error, 'grantClearance');
    }
  }
};
