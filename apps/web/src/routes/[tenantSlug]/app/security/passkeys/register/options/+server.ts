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

  return json(
    await getPasskeyService().beginRegistration(
      session,
      url.hostname,
      url.origin
    )
  );
};
