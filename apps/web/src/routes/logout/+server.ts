import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  clearLegacyApplicationSession,
  clearTenantApplicationSession,
  LEGACY_SESSION_COOKIE,
  tenantSessionCookieName
} from '$lib/server/auth';
import { getAuthRepository } from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

export const POST: RequestHandler = async ({ cookies, locals }) => {
  const tenant = locals.tenant;

  if (tenant) {
    const token = cookies.get(tenantSessionCookieName(tenant.slug));

    if (token) {
      try {
        await getAuthRepository().revokeSession(token);
      } catch (error) {
        console.error('Failed to revoke NuBlox tenant application session.', error);
      }
    }

    clearTenantApplicationSession(cookies, tenant.slug);
    throw redirect(303, tenantSignInPath(tenant.slug));
  }

  const legacyToken = cookies.get(LEGACY_SESSION_COOKIE);
  if (legacyToken) {
    try {
      await getAuthRepository().revokeSession(legacyToken);
    } catch (error) {
      console.error('Failed to revoke legacy NuBlox application session.', error);
    }
  }

  clearLegacyApplicationSession(cookies);
  throw redirect(303, '/');
};
