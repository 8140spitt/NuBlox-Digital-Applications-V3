import {
  AccessPermissionRequestError,
  type MySqlAccessPermissionRequestRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { safeReturnTo } from '$lib/server/auth';
import { getAccessPermissionRequestRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessPermissionRequestRepository['createRequest']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

function optionalValue(formData: FormData, name: string): string | undefined {
  const result = value(formData, name);
  return result || undefined;
}

function failure(error: unknown) {
  if (error instanceof AccessPermissionRequestError) {
    const status =
      error.code === 'PERMISSION_DENIED'
        ? 403
        : error.code === 'CONFLICT' || error.code === 'ALREADY_GRANTED'
          ? 409
          : 400;

    return fail(status, {
      ok: false,
      error: error.message,
      code: error.code
    });
  }

  throw error;
}

export const load: PageServerLoad = ({ url }) => {
  return {
    permissionKey: url.searchParams.get('permission')?.trim() ?? '',
    scopeType: url.searchParams.get('scopeType')?.trim() || 'TENANT',
    scopeId: url.searchParams.get('scopeId')?.trim() ?? '',
    returnTo: safeReturnTo(url.searchParams.get('returnTo'))
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const session = locals.auth;
    if (!session) {
      return fail(401, {
        ok: false,
        error: 'Sign in required.'
      });
    }

    const formData = await request.formData();
    const returnTo = safeReturnTo(value(formData, 'returnTo'));

    try {
      const created = await getAccessPermissionRequestRepository().createRequest(
        session.tenantId as TenantId,
        session.personId,
        {
          permissionKey: value(formData, 'permissionKey'),
          scopeType: value(formData, 'scopeType') || 'TENANT',
          scopeId: optionalValue(formData, 'scopeId'),
          reason: value(formData, 'reason')
        }
      );

      return {
        ok: true,
        requestId: created.id,
        permissionKey: created.permissionKey,
        returnTo,
        message: 'Access request submitted to tenant administrators.'
      };
    } catch (error) {
      return failure(error);
    }
  }
};
