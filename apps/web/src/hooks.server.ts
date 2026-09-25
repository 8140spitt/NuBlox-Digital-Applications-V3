import { error, redirect, type Handle } from '@sveltejs/kit';
import {
  clearLegacyApplicationSession,
  clearTenantApplicationSession,
  resolveLegacyApplicationSession,
  resolveTenantApplicationSession
} from '$lib/server/auth';
import { getTenantRoutingRepository } from '$lib/server/platform';
import {
  parseTenantApplicationPath,
  tenantAppPath,
  tenantSignInPath
} from '$lib/tenant-paths';

function withQuery(pathname: string, search: string): string {
  return `${pathname}${search}`;
}

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = null;
  event.locals.tenant = null;

  const tenantApp = parseTenantApplicationPath(event.url.pathname);

  if (tenantApp) {
    const tenant = await getTenantRoutingRepository().findActiveBySlug(tenantApp.tenantSlug);
    if (!tenant) {
      error(404, 'Tenant not found.');
    }

    event.locals.tenant = tenant;
    const session = await resolveTenantApplicationSession(event.cookies, tenant.slug);

    if (session && (session.tenantId !== tenant.tenantId || session.tenantSlug !== tenant.slug)) {
      clearTenantApplicationSession(event.cookies, tenant.slug);
      throw redirect(
        303,
        `${tenantSignInPath(tenant.slug)}?returnTo=${encodeURIComponent(withQuery(event.url.pathname, event.url.search))}`
      );
    }

    event.locals.auth = session;

    const isAuthRoute =
      tenantApp.internalPath === '/app/auth/sign-in' ||
      tenantApp.internalPath === '/app/auth/sign-out';

    if (!isAuthRoute && !session) {
      throw redirect(
        303,
        `${tenantSignInPath(tenant.slug)}?returnTo=${encodeURIComponent(withQuery(event.url.pathname, event.url.search))}`
      );
    }

    return resolve(event);
  }

  if (event.url.pathname === '/app' || event.url.pathname.startsWith('/app/')) {
    const legacySession = await resolveLegacyApplicationSession(event.cookies);

    if (legacySession) {
      const tenant = await getTenantRoutingRepository().findByTenantId(legacySession.tenantId);
      if (tenant?.status === 'ACTIVE') {
        clearLegacyApplicationSession(event.cookies);
        throw redirect(
          303,
          withQuery(tenantAppPath(tenant.slug, event.url.pathname), event.url.search)
        );
      }
    }

    const returnTo = withQuery(event.url.pathname, event.url.search);
    throw redirect(303, `/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return resolve(event);
};
