import {
  PasskeyError,
  type PasskeyCredentialResponse
} from '@nublox/persistence';
import { json, type RequestHandler } from '@sveltejs/kit';
import { tenantSessionCookieName } from '$lib/server/auth';
import {
  getAuthRepository,
  getPasskeyService
} from '$lib/server/platform';

export const POST: RequestHandler = async ({ request, cookies, locals, url }) => {
  const session = locals.auth;
  const tenant = locals.tenant;
  if (!session || !tenant) {
    return json({ error: 'Authentication required.' }, { status: 401 });
  }

  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ error: 'Cross-origin passkey requests are not accepted.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as {
    token?: unknown;
    credential?: PasskeyCredentialResponse;
  } | null;

  const token = typeof body?.token === 'string' ? body.token : '';
  if (!token || !body?.credential) {
    return json({ error: 'The passkey response is incomplete.' }, { status: 400 });
  }

  try {
    const result = await getPasskeyService().completeAuthentication(token, body.credential);
    if (
      result.principal.userId !== session.userId ||
      result.principal.tenantId !== session.tenantId ||
      result.principal.personId !== session.personId
    ) {
      return json({ error: 'The passkey belongs to another identity.' }, { status: 403 });
    }

    const currentToken = cookies.get(tenantSessionCookieName(tenant.slug));
    if (!currentToken) {
      return json({ error: 'The current application session is unavailable.' }, { status: 401 });
    }

    await getAuthRepository().markSessionMfaVerified(currentToken, 'PASSKEY');
    return json({ ok: true, redirectTo: result.returnTo });
  } catch (error) {
    if (error instanceof PasskeyError) {
      return json({ error: 'Passkey verification failed. Start again.' }, { status: 400 });
    }
    throw error;
  }
};
