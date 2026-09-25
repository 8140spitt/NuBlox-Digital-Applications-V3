import {
  PasskeyError,
  type PasskeyCredentialResponse
} from '@nublox/persistence';
import { json, type RequestHandler } from '@sveltejs/kit';
import { hasRecentMfa, tenantStepUpPath } from '$lib/server/auth';
import { getPasskeyService } from '$lib/server/platform';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const session = locals.auth;
  if (!session) return json({ error: 'Authentication required.' }, { status: 401 });

  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) {
    return json({ error: 'Cross-origin passkey requests are not accepted.' }, { status: 403 });
  }

  if (!hasRecentMfa(session)) {
    return json(
      {
        error: 'A recent strong authentication is required to register a passkey.',
        stepUpRequired: true,
        stepUpUrl: tenantStepUpPath(
          session.tenantSlug,
          `/${session.tenantSlug}/app/security/passkeys`
        )
      },
      { status: 428 }
    );
  }

  const body = await request.json().catch(() => null) as {
    token?: unknown;
    displayName?: unknown;
    credential?: PasskeyCredentialResponse;
  } | null;

  const token = typeof body?.token === 'string' ? body.token : '';
  const displayName = typeof body?.displayName === 'string' ? body.displayName : 'Passkey';

  if (!token || !body?.credential) {
    return json({ error: 'The passkey response is incomplete.' }, { status: 400 });
  }

  try {
    const passkey = await getPasskeyService().completeRegistration(
      session,
      token,
      body.credential,
      displayName
    );
    return json({ ok: true, passkey });
  } catch (error) {
    if (error instanceof PasskeyError) {
      return json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
};
