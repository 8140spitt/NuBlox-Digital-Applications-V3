import { PasskeyError, type PasskeyCredentialResponse } from '@nublox/persistence';
import { json, type RequestHandler } from '@sveltejs/kit';
import { setTenantApplicationSession } from '$lib/server/auth';
import {
  getAuthenticationRateLimiter,
  getAuthRepository,
  getPasskeyService
} from '$lib/server/platform';

export const POST: RequestHandler = async ({
  request,
  cookies,
  locals,
  url,
  getClientAddress
}) => {
  const tenant = locals.tenant;
  if (!tenant) return json({ error: 'Tenant not found.' }, { status: 404 });

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
    if (result.principal.tenantId !== tenant.tenantId) {
      return json({ error: 'The passkey is not registered for this Tenant.' }, { status: 403 });
    }

    const userAgent = request.headers.get('user-agent')?.trim();
    const created = await getAuthRepository().createSession(
      result.principal,
      undefined,
      'MFA',
      {
        ...(userAgent ? { userAgent } : {}),
        networkAddress: getClientAddress()
      },
      'PASSKEY'
    );

    setTenantApplicationSession(
      cookies,
      tenant.slug,
      created.token,
      created.session.expiresAt
    );

    await getAuthenticationRateLimiter().clearSuccessfulLogin(
      result.principal.email,
      getClientAddress()
    );

    return json({ ok: true, redirectTo: result.returnTo });
  } catch (error) {
    if (error instanceof PasskeyError) {
      return json({ error: 'Passkey verification failed. Start again.' }, { status: 400 });
    }
    throw error;
  }
};
