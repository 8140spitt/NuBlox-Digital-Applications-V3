import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getIdentityChallengeService } from '$lib/server/platform';

export const load: PageServerLoad = ({ locals }) => ({
  tenantSlug: locals.tenant?.slug ?? '',
  tenantName: locals.tenant?.name ?? ''
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { message: 'Tenant not found.' });

    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();

    if (!email) return fail(400, { email, message: 'Email is required.' });

    await getIdentityChallengeService().requestPasswordReset(email, tenant.slug);

    return {
      ok: true,
      email,
      message: 'If an active verified account matches this address, password-reset instructions have been queued.'
    };
  }
};
