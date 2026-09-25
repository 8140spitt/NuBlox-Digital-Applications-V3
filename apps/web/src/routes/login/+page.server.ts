import {
  AuthenticationRateLimitError,
  EmailVerificationRequiredError,
  InvalidCredentialsError,
  TenantSelectionRequiredError
} from '@nublox/persistence';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  safeReturnTo,
  safeTenantReturnTo,
  setTenantApplicationSession,
  setTenantMfaChallenge
} from '$lib/server/auth';
import {
  getAuthenticationRateLimiter,
  getAuthRepository,
  getMfaService
} from '$lib/server/platform';
import { tenantAppPath } from '$lib/tenant-paths';

export const load: PageServerLoad = ({ locals, url }) => {
  const tenant = locals.tenant;

  if (tenant && locals.auth) {
    throw redirect(303, tenantAppPath(tenant.slug, '/app/function'));
  }

  return {
    tenantSlug: tenant?.slug ?? null,
    tenantName: tenant?.name ?? null,
    returnTo: tenant
      ? safeTenantReturnTo(tenant.slug, url.searchParams.get('returnTo'))
      : safeReturnTo(url.searchParams.get('returnTo') ?? '/app/function'),
    passwordReset: url.searchParams.get('passwordReset') === '1'
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, url, locals, getClientAddress }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const tenantIdValue = String(formData.get('tenantId') ?? '').trim();
    const tenant = locals.tenant;

    const requestedReturnTo = String(
      formData.get('returnTo') ?? url.searchParams.get('returnTo') ?? '/app/function'
    );
    const returnTo = tenant
      ? safeTenantReturnTo(tenant.slug, requestedReturnTo)
      : safeReturnTo(requestedReturnTo);

    if (!email || !password) {
      return fail(400, {
        email,
        returnTo,
        missing: true
      });
    }

    const limiter = getAuthenticationRateLimiter();
    try {
      const network = getClientAddress();
      await limiter.consume('LOGIN', email, network);

      const repository = getAuthRepository();
      const principal = await repository.authenticate(
        email,
        password,
        tenant?.tenantId ?? (tenantIdValue || undefined)
      );
      const finalReturnTo = safeTenantReturnTo(
        principal.tenantSlug,
        tenant ? returnTo : requestedReturnTo,
        '/app/function'
      );
      const mfa = await getMfaService().beginLogin(principal, finalReturnTo);

      await limiter.clearSuccessfulLogin(email, getClientAddress());

      if (mfa.required && mfa.token && mfa.expiresAt) {
        setTenantMfaChallenge(
          cookies,
          principal.tenantSlug,
          mfa.token,
          mfa.expiresAt
        );
        throw redirect(
          303,
          mfa.enrollmentRequired
            ? `/${principal.tenantSlug}/app/auth/mfa/enroll`
            : `/${principal.tenantSlug}/app/auth/mfa`
        );
      }

      const userAgent = request.headers.get('user-agent')?.trim();
      const created = await repository.createSession(
        principal,
        undefined,
        'PASSWORD',
        {
          ...(userAgent ? { userAgent } : {}),
          networkAddress: getClientAddress()
        }
      );
      setTenantApplicationSession(
        cookies,
        principal.tenantSlug,
        created.token,
        created.session.expiresAt
      );

      throw redirect(303, finalReturnTo);
    } catch (error) {
      if (error instanceof TenantSelectionRequiredError && !tenant) {
        await limiter.clearSuccessfulLogin(email, getClientAddress());
        return fail(400, {
          email,
          returnTo,
          tenantSelection: true,
          tenants: error.tenants
        });
      }

      if (error instanceof EmailVerificationRequiredError) {
        await limiter.clearSuccessfulLogin(email, getClientAddress());
        return fail(403, {
          email,
          returnTo,
          verificationRequired: true,
          verificationTenantSlug: error.tenantSlug,
          verificationTenantName: error.tenantName
        });
      }

      if (error instanceof AuthenticationRateLimitError) {
        return fail(429, {
          email,
          returnTo,
          rateLimited: true,
          retryAfterSeconds: error.retryAfterSeconds
        });
      }

      if (error instanceof InvalidCredentialsError) {
        return fail(400, {
          email,
          returnTo,
          invalid: true
        });
      }

      throw error;
    }
  }
};
