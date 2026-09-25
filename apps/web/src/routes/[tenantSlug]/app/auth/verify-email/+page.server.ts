import type { PageServerLoad } from './$types';
import { IdentityChallengeError } from '@nublox/persistence';
import { getIdentityChallengeService } from '$lib/server/platform';

export const load: PageServerLoad = async ({ url, locals }) => {
  const tenant = locals.tenant;
  const token = url.searchParams.get('token')?.trim() ?? '';

  if (!tenant || !token) {
    return {
      tenantSlug: tenant?.slug ?? '',
      tenantName: tenant?.name ?? '',
      verified: false,
      error: 'The verification link is not valid.'
    };
  }

  try {
    const result = await getIdentityChallengeService().verifyEmail(token);
    if (result.tenantId !== tenant.tenantId || result.tenantSlug !== tenant.slug) {
      return {
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        verified: false,
        error: 'The verification link does not belong to this Tenant.'
      };
    }

    return {
      tenantSlug: tenant.slug,
      tenantName: tenant.name,
      verified: true,
      alreadyVerified: result.alreadyVerified
    };
  } catch (error) {
    if (error instanceof IdentityChallengeError) {
      return {
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        verified: false,
        error: error.message
      };
    }
    throw error;
  }
};
