import { redirect, type Handle } from '@sveltejs/kit';
import { resolveApplicationSession, safeReturnTo } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = await resolveApplicationSession(event.cookies);

  if (event.url.pathname.startsWith('/app') && !event.locals.auth) {
    const returnTo = safeReturnTo(`${event.url.pathname}${event.url.search}`);
    throw redirect(303, `/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return resolve(event);
};
