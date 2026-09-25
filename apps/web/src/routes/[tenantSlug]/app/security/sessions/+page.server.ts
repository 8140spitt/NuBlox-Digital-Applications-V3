import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  clearTenantApplicationSession,
  tenantSessionCookieName
} from '$lib/server/auth';
import { getAuthRepository } from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

function requireSession(locals: App.Locals) {
  if (!locals.auth) throw new Error('Authenticated session required.');
  return locals.auth;
}

function clientLabel(userAgent: string | null): string {
  if (!userAgent) return 'Unknown client';

  let browser = 'Browser';
  if (/Edg\//.test(userAgent)) browser = 'Microsoft Edge';
  else if (/Firefox\//.test(userAgent)) browser = 'Firefox';
  else if (/Chrome\//.test(userAgent)) browser = 'Chrome';
  else if (/Safari\//.test(userAgent)) browser = 'Safari';

  let platform = 'Unknown platform';
  if (/iPhone/.test(userAgent)) platform = 'iPhone';
  else if (/iPad/.test(userAgent)) platform = 'iPad';
  else if (/Android/.test(userAgent)) platform = 'Android';
  else if (/Macintosh|Mac OS X/.test(userAgent)) platform = 'macOS';
  else if (/Windows/.test(userAgent)) platform = 'Windows';
  else if (/Linux/.test(userAgent)) platform = 'Linux';

  return `${browser} · ${platform}`;
}

export const load: PageServerLoad = async ({ locals, cookies }) => {
  const session = requireSession(locals);
  const token = cookies.get(tenantSessionCookieName(session.tenantSlug));

  const sessions = await getAuthRepository().listActiveSessions(session, token);
  return {
    sessions: sessions.map((item) => ({
      ...item,
      clientLabel: clientLabel(item.userAgent)
    }))
  };
};

export const actions: Actions = {
  revoke: async ({ request, locals, cookies }) => {
    const session = requireSession(locals);
    const formData = await request.formData();
    const sessionId = String(formData.get('sessionId') ?? '').trim();

    if (!sessionId) return fail(400, { error: 'Session ID is required.' });

    const revoked = await getAuthRepository().revokeSessionById(session, sessionId);
    if (!revoked) return fail(404, { error: 'Active session not found.' });

    if (sessionId === session.sessionId) {
      clearTenantApplicationSession(cookies, session.tenantSlug);
      throw redirect(303, tenantSignInPath(session.tenantSlug));
    }

    return { revoked: true };
  },

  revokeOthers: async ({ locals, cookies }) => {
    const session = requireSession(locals);
    const token = cookies.get(tenantSessionCookieName(session.tenantSlug));
    if (!token) return fail(401, { error: 'Current session is not available.' });

    const count = await getAuthRepository().revokeOtherSessions(session, token);
    return { revokedOthers: count };
  }
};
