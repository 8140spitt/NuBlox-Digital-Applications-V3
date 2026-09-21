import {
  AccessAdministrationCommandError,
  type MySqlAccessAdministrationReadRepository,
  type MySqlAccessRepository
} from '@nublox/persistence';
import { PLATFORM_PERMISSION_KEYS, type AccessPrincipalType } from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessAdministrationCommandService,
  getAccessAdministrationReadRepository,
  getAccessRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlAccessAdministrationReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function failure(error: unknown, action: string) {
  if (error instanceof AccessAdministrationCommandError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
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

function parsePrincipal(raw: string): {
  principalType: AccessPrincipalType;
  principalId: string;
} {
  const [type, ...rest] = raw.split('|');
  const principalId = rest.join('|').trim();

  if (
    !principalId ||
    (type !== 'PERSON' && type !== 'POSITION' && type !== 'ORGANISATION_UNIT')
  ) {
    throw new AccessAdministrationCommandError(
      'A valid access principal is required.',
      'INVALID_INPUT'
    );
  }

  return {
    principalType: type,
    principalId
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = locals.auth;

  if (!session) {
    return {
      allowed: false,
      reason: 'No authenticated tenant context is available.',
      projection: null
    };
  }

  const tenantId = session.tenantId as TenantId;
  const evaluation = await getAccessRepository().evaluatePermission(
    tenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
    { scopeType: 'TENANT' }
  );

  if (!evaluation.allowed) {
    return {
      allowed: false,
      reason: evaluation.reason,
      projection: null
    };
  }

  return {
    allowed: true,
    reason: evaluation.reason,
    projection: await getAccessAdministrationReadRepository().getProjection(
      session.tenantId as ProjectionTenantId
    )
  };
};

export const actions: Actions = {
  createRole: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'createRole',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const role = await getAccessAdministrationCommandService().createTenantRole(
        session.tenantId as TenantId,
        session.personId,
        {
          code: value(formData, 'code'),
          name: value(formData, 'name'),
          description: optionalValue(formData, 'description')
        }
      );

      return {
        action: 'createRole',
        ok: true,
        message: `Access Role ${role.code} — ${role.name} created.`
      };
    } catch (error) {
      return failure(error, 'createRole');
    }
  },

  grantPermission: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'grantPermission',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      await getAccessAdministrationCommandService().grantPermission(
        session.tenantId as TenantId,
        session.personId,
        {
          accessRoleId: value(formData, 'accessRoleId'),
          permissionKey: value(formData, 'permissionKey')
        }
      );

      return {
        action: 'grantPermission',
        ok: true,
        message: 'Permission granted to Access Role.'
      };
    } catch (error) {
      return failure(error, 'grantPermission');
    }
  },

  assignRole: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        action: 'assignRole',
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();

    try {
      const principal = parsePrincipal(value(formData, 'principal'));

      await getAccessAdministrationCommandService().assignRole(
        session.tenantId as TenantId,
        session.personId,
        {
          accessRoleId: value(formData, 'accessRoleId'),
          ...principal,
          scopeType: 'TENANT',
          effectiveFrom: optionalValue(formData, 'effectiveFrom'),
          effectiveTo: optionalValue(formData, 'effectiveTo')
        }
      );

      return {
        action: 'assignRole',
        ok: true,
        message: 'Access Role assigned in tenant scope.'
      };
    } catch (error) {
      return failure(error, 'assignRole');
    }
  }
};
