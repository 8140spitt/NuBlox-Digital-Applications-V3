import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getIdentityChallengeService } from '$lib/server/platform';

function emailValue(formData: FormData): string {
  return String(formData.get('email') ?? '').trim();
}

export const load: PageServerLoad = ({ locals, url }) => ({
  tenantSlug: locals.tenant?.slug ?? '',
  tenantName: locals.tenant?.name ?? '',
  email: url.searchParams.get('email')?.trim() ?? ''
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { message: 'Tenant not found.' });

    const formData = await request.formData();
    const email = emailValue(formData);
    if (!email) return fail(400, { email, message: 'Email is required.' });

    await getIdentityChallengeService().resendEmailVerification(email, tenant.slug);

    return {
      ok: true,
      email,
      message: 'If this address is awaiting verification, a new verification message has been queued.'
    };
  }
};
