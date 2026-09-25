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

async function challengeContext(cookies: import('@sveltejs/kit').Cookies, tenantSlug: string) {
  const token = getTenantMfaChallenge(cookies, tenantSlug);
  if (!token) {
    throw redirect(303, tenantSignInPath(tenantSlug));
  }

  try {
    return {
      token,
      context: await getMfaService().resolveRequiredEnrollmentChallenge(token, tenantSlug)
    };
  } catch (error) {
    if (error instanceof MfaError) {
      clearTenantMfaChallenge(cookies, tenantSlug);
      throw redirect(303, tenantSignInPath(tenantSlug));
    }
    throw error;
  }
}

export const load: PageServerLoad = async ({ cookies, locals }) => {
  const tenant = locals.tenant;
  if (!tenant) throw redirect(303, '/login');

  if (locals.auth) {
    throw redirect(303, `/${tenant.slug}/app`);
  }

  await challengeContext(cookies, tenant.slug);

  return {
    tenantSlug: tenant.slug,
    tenantName: tenant.name
  };
};

export const actions: Actions = {
  start: async ({ cookies, locals }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { error: 'Tenant not found.' });

    try {
      const { context } = await challengeContext(cookies, tenant.slug);
      const enrollment = await getMfaService().startEnrollment(context.principal);
      return {
        provisioningSecret: enrollment.secret,
        otpauthUri: enrollment.otpauthUri
      };
    } catch (error) {
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  },

  confirm: async ({ request, cookies, locals, getClientAddress }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { error: 'Tenant not found.' });

    const formData = await request.formData();
    const code = String(formData.get('code') ?? '').trim();
    if (!code) {
      return fail(400, { error: 'Enter the current authenticator code.' });
    }

    try {
      const { token, context } = await challengeContext(cookies, tenant.slug);
      const recoveryCodes = await getMfaService().confirmEnrollment(
        context.principal,
        code
      );

      await getMfaService().consumeRequiredEnrollmentChallenge(token, tenant.slug);

      const userAgent = request.headers.get('user-agent')?.trim();
      const created = await getAuthRepository().createSession(
        context.principal,
        undefined,
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

      return {
        enabled: true,
        recoveryCodes,
        returnTo: context.returnTo
      };
    } catch (error) {
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  }
};
