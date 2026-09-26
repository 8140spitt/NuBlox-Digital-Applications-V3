import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  clearPlatformOperatorSession,
  getPlatformAdministrationService,
  PLATFORM_SESSION_COOKIE,
  resolvePlatformOperatorSession
} from '$lib/server/platform-auth';

export const load: PageServerLoad = async ({ cookies }) => {
  const operator = await resolvePlatformOperatorSession(cookies);
  if (!operator) throw redirect(303, '/platform/login');
  return { operator };
};

export const actions: Actions = {
  default: async ({ cookies }) => {
    const token = cookies.get(PLATFORM_SESSION_COOKIE);
    if (token) await getPlatformAdministrationService().revokeSession(token);
    clearPlatformOperatorSession(cookies);
    throw redirect(303, '/platform/login');
  }
};
