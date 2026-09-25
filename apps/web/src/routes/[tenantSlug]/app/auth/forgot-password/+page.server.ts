import { fail } from '@sveltejs/kit';
import { AuthenticationRateLimitError } from '@nublox/persistence';
import type { Actions, PageServerLoad } from './$types';
import {
  getAuthenticationRateLimiter,
  getIdentityChallengeService
} from '$lib/server/platform';

export const load: PageServerLoad = ({ locals }) => ({
  tenantSlug: locals.tenant?.slug ?? '',
  tenantName: locals.tenant?.name ?? ''
});

export const actions: Actions = {
  default: async ({ request, locals, getClientAddress }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { message: 'Tenant not found.' });

    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();

    if (!email) return fail(400, { email, message: 'Email is required.' });

    try {
      await getAuthenticationRateLimiter().consume(
        'PASSWORD_RESET_REQUEST',
        `${tenant.slug}:${email}`,
        getClientAddress()
      );
      await getIdentityChallengeService().requestPasswordReset(email, tenant.slug);
    } catch (error) {
      if (error instanceof AuthenticationRateLimitError) {
        return fail(429, {
          email,
          rateLimited: true,
          retryAfterSeconds: error.retryAfterSeconds,
          message: 'Too many requests. Try again later.'
        });
      }
      throw error;
    }

    return {
      ok: true,
      email,
      message: 'If an active verified account matches this address, password-reset instructions have been queued.'
    };
  }
};
