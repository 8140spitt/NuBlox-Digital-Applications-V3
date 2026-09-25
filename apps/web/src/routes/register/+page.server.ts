import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TenantRegistrationError } from '@nublox/persistence';
import {
  getAuthRepository,
  getTenantRegistrationService
} from '$lib/server/platform';
import { setTenantApplicationSession } from '$lib/server/auth';
import { tenantAppPath } from '$lib/tenant-paths';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export const load: PageServerLoad = () => ({});

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const formData = await request.formData();
    const businessName = value(formData, 'businessName');
    const tenantSlug = value(formData, 'tenantSlug');
    const personName = value(formData, 'personName');
    const email = value(formData, 'email');
    const password = String(formData.get('password') ?? '');
    const acceptedTerms = formData.get('acceptedTerms') === 'on';

    try {
      const registration = await getTenantRegistrationService().register({
        businessName,
        ...(tenantSlug ? { tenantSlug } : {}),
        personName,
        email,
        password,
        acceptedTerms
      });

      const auth = getAuthRepository();
      const principal = await auth.authenticate(email, password, registration.tenantId);
      const created = await auth.createSession(principal);

      setTenantApplicationSession(
        cookies,
        principal.tenantSlug,
        created.token,
        created.session.expiresAt
      );

      throw redirect(303, tenantAppPath(principal.tenantSlug));
    } catch (error) {
      if (error instanceof TenantRegistrationError) {
        const status =
          error.code === 'EMAIL_ALREADY_REGISTERED' || error.code === 'SLUG_UNAVAILABLE'
            ? 409
            : 400;

        return fail(status, {
          businessName,
          tenantSlug,
          personName,
          email,
          acceptedTerms,
          error: error.message,
          code: error.code
        });
      }
      throw error;
    }
  }
};
