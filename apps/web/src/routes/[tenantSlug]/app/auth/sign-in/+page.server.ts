import {
  EmailVerificationRequiredError,
  InvalidCredentialsError,
  TenantSelectionRequiredError
} from '@nublox/persistence';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  safeReturnTo,
  safeTenantReturnTo,
  setTenantApplicationSession
} from '$lib/server/auth';
import { getAuthRepository } from '$lib/server/platform';
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
  default: async ({ request, cookies, url, locals }) => {
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

    try {
      const repository = getAuthRepository();
      const principal = await repository.authenticate(
        email,
        password,
        tenant?.tenantId ?? (tenantIdValue || undefined)
      );
      const created = await repository.createSession(principal);
      setTenantApplicationSession(
        cookies,
        principal.tenantSlug,
        created.token,
        created.session.expiresAt
      );

      throw redirect(
        303,
        safeTenantReturnTo(
          principal.tenantSlug,
          tenant ? returnTo : requestedReturnTo,
          '/app/function'
        )
      );
    } catch (error) {
      if (error instanceof TenantSelectionRequiredError && !tenant) {
        return fail(400, {
          email,
          returnTo,
          tenantSelection: true,
          tenants: error.tenants
        });
      }

      if (error instanceof EmailVerificationRequiredError) {
        return fail(403, {
          email,
          returnTo,
          verificationRequired: true,
          verificationTenantSlug: error.tenantSlug,
          verificationTenantName: error.tenantName
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
