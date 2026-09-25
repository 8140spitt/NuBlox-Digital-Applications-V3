import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import {
  OidcError,
  type OidcSessionAssurance
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasRecentMfa, tenantStepUpPath } from '$lib/server/auth';
import {
  getAccessRepository,
  getOidcService
} from '$lib/server/platform';

function requireSession(locals: App.Locals) {
  if (!locals.auth) throw new Error('Authenticated session required.');
  return locals.auth;
}

async function managementEvaluation(session: NonNullable<App.Locals['auth']>) {
  return getAccessRepository().evaluatePermission(
    session.tenantId as TenantId,
    session.personId,
    PLATFORM_PERMISSION_KEYS.ACCESS_MANAGE,
    { scopeType: 'TENANT' }
  );
}

function stepUpFailure(session: NonNullable<App.Locals['auth']>) {
  return fail(428, {
    stepUpRequired: true,
    stepUpUrl: tenantStepUpPath(
      session.tenantSlug,
      `/${session.tenantSlug}/app/security/sso`
    ),
    error: 'A recent strong authentication is required to manage enterprise identity providers.'
  });
}

function assurance(value: FormDataEntryValue | null): OidcSessionAssurance | null {
  return value === 'PASSWORD' || value === 'MFA' ? value : null;
}

export const load: PageServerLoad = async ({ locals }) => {
  const session = requireSession(locals);
  const evaluation = await managementEvaluation(session);

  return {
    canManage: evaluation.allowed,
    manageReason: evaluation.reason,
    providers: evaluation.allowed
      ? await getOidcService().listProviders(session.tenantId)
      : []
  };
};

export const actions: Actions = {
  create: async ({ request, locals }) => {
    const session = requireSession(locals);
    const evaluation = await managementEvaluation(session);
    if (!evaluation.allowed) {
      return fail(403, {
        error: 'Your current access does not permit enterprise identity-provider administration.'
      });
    }
    if (!hasRecentMfa(session)) return stepUpFailure(session);

    const formData = await request.formData();
    const sessionAssurance = assurance(formData.get('sessionAssurance'));
    if (!sessionAssurance) return fail(400, { error: 'Choose a valid session assurance.' });

    try {
      const provider = await getOidcService().createProvider(
        session.tenantId,
        session.personId,
        {
          name: String(formData.get('name') ?? ''),
          issuerUrl: String(formData.get('issuerUrl') ?? ''),
          clientId: String(formData.get('clientId') ?? ''),
          clientSecret: String(formData.get('clientSecret') ?? ''),
          scopes: String(formData.get('scopes') ?? ''),
          sessionAssurance,
          emailClaim: String(formData.get('emailClaim') ?? 'email'),
          trustEmailClaim: formData.get('trustEmailClaim') === 'on'
        }
      );

      return {
        ok: true,
        message: `${provider.name} identity provider created.`
      };
    } catch (error) {
      if (error instanceof OidcError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  },

  update: async ({ request, locals }) => {
    const session = requireSession(locals);
    const evaluation = await managementEvaluation(session);
    if (!evaluation.allowed) {
      return fail(403, {
        error: 'Your current access does not permit enterprise identity-provider administration.'
      });
    }
    if (!hasRecentMfa(session)) return stepUpFailure(session);

    const formData = await request.formData();
    const providerId = String(formData.get('providerId') ?? '').trim();
    const sessionAssurance = assurance(formData.get('sessionAssurance'));
    if (!providerId || !sessionAssurance) {
      return fail(400, { error: 'Provider and session assurance are required.' });
    }

    const clientSecretValue = String(formData.get('clientSecret') ?? '').trim();

    try {
      const provider = await getOidcService().updateProvider(
        session.tenantId,
        session.personId,
        providerId,
        {
          name: String(formData.get('name') ?? ''),
          issuerUrl: String(formData.get('issuerUrl') ?? ''),
          clientId: String(formData.get('clientId') ?? ''),
          ...(clientSecretValue ? { clientSecret: clientSecretValue } : {}),
          scopes: String(formData.get('scopes') ?? ''),
          sessionAssurance,
          emailClaim: String(formData.get('emailClaim') ?? 'email'),
          trustEmailClaim: formData.get('trustEmailClaim') === 'on'
        }
      );

      return {
        ok: true,
        message: `${provider.name} identity provider updated.`
      };
    } catch (error) {
      if (error instanceof OidcError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  },

  status: async ({ request, locals }) => {
    const session = requireSession(locals);
    const evaluation = await managementEvaluation(session);
    if (!evaluation.allowed) {
      return fail(403, {
        error: 'Your current access does not permit enterprise identity-provider administration.'
      });
    }
    if (!hasRecentMfa(session)) return stepUpFailure(session);

    const formData = await request.formData();
    const providerId = String(formData.get('providerId') ?? '').trim();
    const statusValue = String(formData.get('status') ?? '').trim();
    if (!providerId || (statusValue !== 'ACTIVE' && statusValue !== 'DISABLED')) {
      return fail(400, { error: 'Provider status request is not valid.' });
    }

    try {
      const changed = await getOidcService().setProviderStatus(
        session.tenantId,
        session.personId,
        providerId,
        statusValue
      );
      if (!changed) return fail(404, { error: 'Identity provider not found.' });

      return {
        ok: true,
        message: statusValue === 'ACTIVE'
          ? 'Identity provider enabled.'
          : 'Identity provider disabled and its active sessions revoked.'
      };
    } catch (error) {
      if (error instanceof OidcError) {
        return fail(400, { error: error.message });
      }
      throw error;
    }
  }
};
