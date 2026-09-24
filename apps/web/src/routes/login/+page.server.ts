import {
  InvalidCredentialsError,
  TenantSelectionRequiredError
} from '@nublox/persistence';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  safeReturnTo,
  setApplicationSession
} from '$lib/server/auth';
import { getAuthRepository } from '$lib/server/platform';

export const load: PageServerLoad = ({ locals, url }) => {
  if (locals.auth) {
    throw redirect(303, '/app/function');
  }

  return {
    returnTo: safeReturnTo(url.searchParams.get('returnTo') ?? '/app/function')
  };
};

export const actions: Actions = {
  default: async ({ request, cookies, url }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const tenantIdValue = String(formData.get('tenantId') ?? '').trim();
    const returnTo = safeReturnTo(
      String(formData.get('returnTo') ?? url.searchParams.get('returnTo') ?? '/app/function')
    );

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
        tenantIdValue || undefined
      );
      const created = await repository.createSession(principal);
      setApplicationSession(cookies, created.token, created.session.expiresAt);
    } catch (error) {
      if (error instanceof TenantSelectionRequiredError) {
        return fail(400, {
          email,
          returnTo,
          tenantSelection: true,
          tenants: error.tenants
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

    throw redirect(303, returnTo);
  }
};
