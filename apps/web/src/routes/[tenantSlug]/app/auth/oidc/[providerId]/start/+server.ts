import { OidcError } from '@nublox/persistence';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { safeTenantReturnTo } from '$lib/server/auth';
import { getOidcService } from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

export const GET: RequestHandler = async ({ locals, params, url }) => {
  const tenant = locals.tenant;
  const providerId = params.providerId;
  if (!tenant || !providerId) {
    throw redirect(303, '/login');
  }

  const returnTo = safeTenantReturnTo(
    tenant.slug,
    url.searchParams.get('returnTo'),
    '/app/function'
  );

  try {
    const login = await getOidcService().beginLogin(
      tenant.tenantId,
      tenant.slug,
      providerId,
      returnTo
    );
    throw redirect(303, login.authorizationUrl);
  } catch (error) {
    if (error instanceof OidcError) {
      throw redirect(
        303,
        `${tenantSignInPath(tenant.slug)}?federation=unavailable`
      );
    }
    throw error;
  }
};
