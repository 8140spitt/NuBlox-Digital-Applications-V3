import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { MfaError } from '@nublox/persistence';
import {
  clearTenantMfaChallenge,
  getTenantMfaChallenge,
  setTenantApplicationSession
} from '$lib/server/auth';
import {
  getAuthRepository,
  getMfaService
} from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

export const load: PageServerLoad = ({ cookies, locals }) => {
  const tenant = locals.tenant;
  if (!tenant) {
    throw redirect(303, '/login');
  }

  if (locals.auth) {
    throw redirect(303, `/${tenant.slug}/app`);
  }

  const challenge = getTenantMfaChallenge(cookies, tenant.slug);
  if (!challenge) {
    throw redirect(303, tenantSignInPath(tenant.slug));
  }

  return {
    tenantSlug: tenant.slug,
    tenantName: tenant.name
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, locals, getClientAddress }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { error: 'Tenant not found.' });

    const challenge = getTenantMfaChallenge(cookies, tenant.slug);
    if (!challenge) {
      return fail(401, {
        expired: true,
        error: 'The MFA challenge is no longer available. Sign in again.'
      });
    }

    const formData = await request.formData();
    const code = String(formData.get('code') ?? '').trim();
    if (!code) {
      return fail(400, { error: 'Enter an authenticator or recovery code.' });
    }

    try {
      const result = await getMfaService().verifyLoginChallenge(
        challenge,
        tenant.slug,
        code
      );

      const userAgent = request.headers.get('user-agent')?.trim();
      const created = await getAuthRepository().createSession(
        result.principal,
        60 * 60 * 12,
        'MFA',
        {
          ...(userAgent ? { userAgent } : {}),
          networkAddress: getClientAddress()
        }
      );
      setTenantApplicationSession(
        cookies,
        tenant.slug,
        created.token,
        created.session.expiresAt
      );
      clearTenantMfaChallenge(cookies, tenant.slug);

      throw redirect(303, result.returnTo);
    } catch (error) {
      if (error instanceof MfaError) {
        const terminal =
          error.code === 'CHALLENGE_EXPIRED' ||
          error.code === 'INVALID_CHALLENGE' ||
          error.code === 'TOO_MANY_ATTEMPTS';

        if (terminal) {
          clearTenantMfaChallenge(cookies, tenant.slug);
        }

        return fail(terminal ? 401 : 400, {
          expired: terminal,
          error: error.message
        });
      }
      throw error;
    }
  }
};
