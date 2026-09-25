import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import { hasRecentMfa, tenantStepUpPath } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';
import { TenantAuthenticationPolicyError } from '@nublox/persistence';
import {
  getAccessRepository,
  getTenantAuthenticationPolicyRepository
} from '$lib/server/platform';

function requireSession(locals: App.Locals) {
  if (!locals.auth) throw new Error('Authenticated session required.');
  return locals.auth;
}

async function canManage(session: NonNullable<App.Locals['auth']>) {
  return getAccessRepository().evaluatePermission(
    session.tenantId as TenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
    { scopeType: 'TENANT' }
  );
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const repository = getTenantAuthenticationPolicyRepository();

  const [policy, coverage, evaluation] = await Promise.all([
    repository.get(session.tenantId),
    repository.mfaCoverage(session.tenantId),
    canManage(session)
  ]);

  return {
    policy,
    coverage,
    canManage: evaluation.allowed,
    manageReason: evaluation.reason
  };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    const session = requireSession(locals);
    const evaluation = await canManage(session);

    if (!evaluation.allowed) {
      return fail(403, {
        error: 'Your current access does not permit Tenant authentication policy changes.'
      });
    }

    if (!hasRecentMfa(session)) {
      return fail(428, {
        stepUpRequired: true,
        stepUpUrl: tenantStepUpPath(
          session.tenantSlug,
          `/${session.tenantSlug}/app/security/policy`
        ),
        error: 'A recent strong authentication is required to change Tenant authentication policy.'
      });
    }

    const formData = await request.formData();
    const mfaRequirement = String(formData.get('mfaRequirement') ?? '').trim();
    const passkeyEnabled = formData.get('passkeyEnabled') === 'on';
    const sessionTtlMinutes = Number(formData.get('sessionTtlMinutes'));
    const idleTimeoutMinutes = Number(formData.get('idleTimeoutMinutes'));
    const maxActiveSessions = Number(formData.get('maxActiveSessions'));

    if (mfaRequirement !== 'OPTIONAL' && mfaRequirement !== 'REQUIRED') {
      return fail(400, { error: 'Choose a valid MFA requirement.' });
    }

    try {
      const policy = await getTenantAuthenticationPolicyRepository().update(
        session.tenantId,
        session.personId,
        {
          mfaRequirement,
          passkeyEnabled,
          sessionTtlMinutes,
          idleTimeoutMinutes,
          maxActiveSessions
        }
      );

      return {
        ok: true,
        message: 'Tenant authentication policy updated.',
        policy
      };
    } catch (error) {
      if (error instanceof TenantAuthenticationPolicyError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  }
};
