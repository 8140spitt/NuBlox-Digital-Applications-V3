import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { MfaError } from '@nublox/persistence';
import {
  safeTenantReturnTo,
  tenantSessionCookieName
} from '$lib/server/auth';
import {
  getAuthRepository,
  getMfaService,
  getPasskeyService
} from '$lib/server/platform';
import { tenantAppPath, tenantSignInPath } from '$lib/tenant-paths';

function requireSession(locals: App.Locals) {
  if (!locals.auth) return null;
  return locals.auth;
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const tenant = locals.tenant;
  if (!tenant) throw redirect(303, '/login');

  const session = requireSession(locals);
  if (!session) {
    throw redirect(
      303,
      `${tenantSignInPath(tenant.slug)}?returnTo=${encodeURIComponent(url.pathname + url.search)}`
    );
  }

  const [status, passkeys] = await Promise.all([
    getMfaService().status(session),
    getPasskeyService().list(session)
  ]);
  return {
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
    enrolled: status.enabled,
    passkeyCount: passkeys.length,
    returnTo: safeTenantReturnTo(
      tenant.slug,
      url.searchParams.get('returnTo'),
      '/app/security'
    )
  };
};

export const actions: Actions = {
  default: async ({ request, locals, cookies, url }) => {
    const tenant = locals.tenant;
    const session = requireSession(locals);
    if (!tenant || !session) {
      return fail(401, { error: 'An authenticated session is required.' });
    }

    const returnTo = safeTenantReturnTo(
      tenant.slug,
      url.searchParams.get('returnTo'),
      '/app/security'
    );

    const status = await getMfaService().status(session);
    if (!status.enabled) {
      return fail(403, {
        enrollmentRequired: true,
        error: 'Enroll multi-factor authentication before completing this security action.'
      });
    }

    const formData = await request.formData();
    const code = String(formData.get('code') ?? '').trim();
    if (!code) {
      return fail(400, { error: 'Enter an authenticator or recovery code.' });
    }

    try {
      await getMfaService().verifyStepUp(session, code);

      const token = cookies.get(tenantSessionCookieName(tenant.slug));
      if (!token) {
        throw redirect(303, tenantSignInPath(tenant.slug));
      }

      await getAuthRepository().markSessionMfaVerified(token);
      throw redirect(303, returnTo);
    } catch (error) {
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  }
};
