import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  AuthenticationRateLimitError,
  TenantRegistrationError
} from '@nublox/persistence';
import {
  getAuthenticationRateLimiter,
  getTenantRegistrationService
} from '$lib/server/platform';

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}

export const load: PageServerLoad = () => ({});

export const actions: Actions = {
  default: async ({ request, getClientAddress }) => {
    const formData = await request.formData();
    const businessName = value(formData, 'businessName');
    const tenantSlug = value(formData, 'tenantSlug');
    const personName = value(formData, 'personName');
    const email = value(formData, 'email');
    const password = String(formData.get('password') ?? '');
    const acceptedTerms = formData.get('acceptedTerms') === 'on';

    try {
      await getAuthenticationRateLimiter().consume(
        'TENANT_REGISTRATION',
        email,
        getClientAddress()
      );

      const registration = await getTenantRegistrationService().register({
        businessName,
        ...(tenantSlug ? { tenantSlug } : {}),
        personName,
        email,
        password,
        acceptedTerms
      });

      throw redirect(
        303,
        `/${registration.tenantSlug}/app/auth/check-email?email=${encodeURIComponent(email)}`
      );
    } catch (error) {
      if (error instanceof AuthenticationRateLimitError) {
        return fail(429, {
          businessName,
          tenantSlug,
          personName,
          email,
          acceptedTerms,
          rateLimited: true,
          retryAfterSeconds: error.retryAfterSeconds,
          error: 'Too many registration attempts. Try again later.'
        });
      }

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
