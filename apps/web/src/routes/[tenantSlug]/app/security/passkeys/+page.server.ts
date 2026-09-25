import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasRecentMfa, tenantStepUpPath } from '$lib/server/auth';
import { getPasskeyService } from '$lib/server/platform';

function requireSession(locals: App.Locals) {
  if (!locals.auth) throw new Error('Authenticated session required.');
  return locals.auth;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  return {
    tenantSlug: session.tenantSlug,
    passkeys: await getPasskeyService().list(session),
    recentStrongAuthentication: hasRecentMfa(session)
  };
};

export const actions: Actions = {
  revoke: async ({ request, locals }) => {
    const session = requireSession(locals);

    if (!hasRecentMfa(session)) {
      return fail(428, {
        stepUpRequired: true,
        stepUpUrl: tenantStepUpPath(
          session.tenantSlug,
          `/${session.tenantSlug}/app/security/passkeys`
        ),
        error: 'A recent strong authentication is required to revoke a passkey.'
      });
    }

    const formData = await request.formData();
    const credentialId = String(formData.get('credentialId') ?? '').trim();
    if (!credentialId) return fail(400, { error: 'Passkey ID is required.' });

    const revoked = await getPasskeyService().revoke(session, credentialId);
    if (!revoked) return fail(404, { error: 'Active passkey not found.' });

    return { revoked: true };
  }
};
