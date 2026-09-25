import { json, type RequestHandler } from '@sveltejs/kit';
import { safeTenantReturnTo } from '$lib/server/auth';
import { getPasskeyService } from '$lib/server/platform';

export const POST: RequestHandler = async ({ request, locals, url }) => {
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
    returnTo?: unknown;
  } | null;

  const returnTo = safeTenantReturnTo(
    tenant.slug,
    typeof body?.returnTo === 'string' ? body.returnTo : '/app/security',
    '/app/security'
  );

  try {
    return json(
      await getPasskeyService().beginAuthentication(
        session.tenantId,
        session.email,
        url.hostname,
        url.origin,
        returnTo
      )
    );
  } catch {
    return json({ error: 'No active passkey is available for step-up authentication.' }, { status: 400 });
  }
};
