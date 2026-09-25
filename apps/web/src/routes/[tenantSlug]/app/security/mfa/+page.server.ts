import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { InvalidCredentialsError, MfaError } from '@nublox/persistence';
import { tenantSessionCookieName } from '$lib/server/auth';
import {
  getAuthRepository,
  getMfaService,
  getTenantAuthenticationPolicyRepository
} from '$lib/server/platform';

function requireSession(locals: App.Locals) {
  if (!locals.auth) {
    throw new Error('Authenticated session required.');
  }
  return locals.auth;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const [status, policy] = await Promise.all([
    getMfaService().status(session),
    getTenantAuthenticationPolicyRepository().get(session.tenantId)
  ]);

  return {
    status,
    policy,
    authenticationStrength: session.authenticationStrength
  };
};

export const actions: Actions = {
  start: async ({ locals }) => {
    const session = requireSession(locals);

    try {
      const enrollment = await getMfaService().startEnrollment(session);
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

  confirm: async ({ request, locals, cookies }) => {
    const session = requireSession(locals);
    const formData = await request.formData();
    const code = String(formData.get('code') ?? '').trim();

    if (!code) {
      return fail(400, { error: 'Enter the current authenticator code.' });
    }

    try {
      const recoveryCodes = await getMfaService().confirmEnrollment(session, code);
      const sessionToken = cookies.get(tenantSessionCookieName(session.tenantSlug));
      if (sessionToken) {
        await getAuthRepository().markSessionMfaVerified(sessionToken);
      }

      return {
        enabled: true,
        recoveryCodes
      };
    } catch (error) {
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  },

  regenerate: async ({ locals }) => {
    const session = requireSession(locals);

    if (session.authenticationStrength !== 'MFA') {
      return fail(403, {
        error: 'Regenerating recovery codes requires an MFA-verified session. Sign out and sign in again.'
      });
    }

    try {
      return {
        enabled: true,
        recoveryCodes: await getMfaService().regenerateRecoveryCodes(session)
      };
    } catch (error) {
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  },

  disable: async ({ request, locals }) => {
    const session = requireSession(locals);
    const policy = await getTenantAuthenticationPolicyRepository().get(session.tenantId);
    if (policy.mfaRequirement === 'REQUIRED') {
      return fail(403, {
        error: 'This Tenant requires MFA. MFA cannot be disabled while that policy is active.'
      });
    }

    const formData = await request.formData();
    const password = String(formData.get('password') ?? '');

    if (!password) {
      return fail(400, { error: 'Enter your password to disable MFA.' });
    }

    try {
      await getAuthRepository().authenticate(
        session.email,
        password,
        session.tenantId
      );
      await getMfaService().disable(session);
      return { disabled: true };
    } catch (error) {
      if (error instanceof InvalidCredentialsError) {
        return fail(400, { error: 'Password is not valid.' });
      }
      if (error instanceof MfaError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  }
};
