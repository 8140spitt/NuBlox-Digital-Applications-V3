import { PasskeyError } from '@nublox/persistence';
import { json, type RequestHandler } from '@sveltejs/kit';
import { safeTenantReturnTo } from '$lib/server/auth';
import {
  getAuthenticationRateLimiter,
  getPasskeyService
} from '$lib/server/platform';

export const POST: RequestHandler = async ({
  request,
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
    email?: unknown;
    returnTo?: unknown;
  } | null;
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const returnTo = safeTenantReturnTo(
    tenant.slug,
    typeof body?.returnTo === 'string' ? body.returnTo : '/app/function',
    '/app/function'
  );

  if (!email) {
    return json({ error: 'Enter your employee email address.' }, { status: 400 });
  }

  const limiter = getAuthenticationRateLimiter();
  try {
    await limiter.consume('LOGIN', email, getClientAddress());
    const result = await getPasskeyService().beginAuthentication(
      tenant.tenantId,
      email,
      url.hostname,
      url.origin,
      returnTo
    );
    return json(result);
  } catch (error) {
    if (error instanceof PasskeyError) {
      return json(
        { error: 'Passkey sign-in is not available for this identity.' },
        { status: 400 }
      );
    }
    throw error;
  }
};
