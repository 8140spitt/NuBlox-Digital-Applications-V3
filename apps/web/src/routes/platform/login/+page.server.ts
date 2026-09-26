import {
  AuthenticationRateLimitError,
  PlatformAuthenticationError
} from '@nublox/persistence';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getPlatformAdministrationService,
  resolvePlatformOperatorSession,
  setPlatformOperatorSession
} from '$lib/server/platform-auth';
import { getAuthenticationRateLimiter } from '$lib/server/platform';

export const load: PageServerLoad = async ({ cookies }) => {
  if (await resolvePlatformOperatorSession(cookies)) {
    throw redirect(303, '/platform');
  }
  return {};
};

export const actions: Actions = {
  default: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { email, missing: true });
    }

    const limiter = getAuthenticationRateLimiter();
    try {
      const network = getClientAddress();
      await limiter.consume('LOGIN', `platform:${email}`, network);

      const service = getPlatformAdministrationService();
      const operator = await service.authenticate(email, password);
      const userAgent = request.headers.get('user-agent')?.trim();
      const session = await service.createSession(operator, userAgent);
      setPlatformOperatorSession(cookies, session.token, session.expiresAt);
      await limiter.clearSuccessfulLogin(`platform:${email}`, network);
      throw redirect(303, '/platform');
    } catch (error) {
      if (error instanceof AuthenticationRateLimitError) {
        return fail(429, {
          email,
          rateLimited: true,
          retryAfterSeconds: error.retryAfterSeconds
        });
      }
      if (error instanceof PlatformAuthenticationError) {
        return fail(400, { email, invalid: true });
      }
      throw error;
    }
  }
};
