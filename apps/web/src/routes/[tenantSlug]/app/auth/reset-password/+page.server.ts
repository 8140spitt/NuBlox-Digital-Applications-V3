import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { IdentityChallengeError } from '@nublox/persistence';
import { getIdentityChallengeService } from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

export const load: PageServerLoad = ({ locals, url }) => ({
  tenantSlug: locals.tenant?.slug ?? '',
  tenantName: locals.tenant?.name ?? '',
  token: url.searchParams.get('token')?.trim() ?? ''
});

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const tenant = locals.tenant;
    if (!tenant) return fail(404, { error: 'Tenant not found.' });

    const formData = await request.formData();
    const token = String(formData.get('token') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');

    if (!token) return fail(400, { error: 'The reset link is not valid.' });
    if (password !== confirmPassword) {
      return fail(400, { token, error: 'The passwords do not match.' });
    }

    try {
      const result = await getIdentityChallengeService().resetPassword(token, password);
      if (result.tenantId !== tenant.tenantId || result.tenantSlug !== tenant.slug) {
        return fail(400, { error: 'The reset link does not belong to this Tenant.' });
      }
      throw redirect(303, `${tenantSignInPath(tenant.slug)}?passwordReset=1`);
    } catch (error) {
      if (error instanceof IdentityChallengeError || error instanceof Error && error.message.includes('12 characters')) {
        return fail(400, {
          token,
          error: error instanceof Error ? error.message : 'Password reset was not completed.'
        });
      }
      throw error;
    }
  }
};
