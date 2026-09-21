import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  clearApplicationSession,
  SESSION_COOKIE
} from '$lib/server/auth';
import { getAuthRepository } from '$lib/server/platform';

export const POST: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(SESSION_COOKIE);

  if (token) {
    try {
      await getAuthRepository().revokeSession(token);
    } catch (error) {
      console.error('Failed to revoke NuBlox application session.', error);
    }
  }

  clearApplicationSession(cookies);
  throw redirect(303, '/login');
};
