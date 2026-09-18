import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.user = null;
  event.locals.session = null;

  const current = await auth.api.getSession({ headers: event.request.headers });
  if (current) {
    event.locals.user = current.user;
    event.locals.session = current.session;
  }

  return svelteKitHandler({ event, resolve, auth, building });
};
