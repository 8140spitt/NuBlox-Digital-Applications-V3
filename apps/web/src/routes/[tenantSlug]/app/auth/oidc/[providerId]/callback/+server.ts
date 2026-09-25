import { OidcError } from '@nublox/persistence';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import {
  setTenantApplicationSession,
  setTenantMfaChallenge
} from '$lib/server/auth';
import {
  getAuthRepository,
  getMfaService,
  getOidcService
} from '$lib/server/platform';
import { tenantSignInPath } from '$lib/tenant-paths';

export const GET: RequestHandler = async ({
  request,
  cookies,
  locals,
  params,
  url,
  getClientAddress
}) => {
  const tenant = locals.tenant;
  const providerId = params.providerId;
  if (!tenant || !providerId) throw redirect(303, '/login');

  const providerError = url.searchParams.get('error');
  const state = url.searchParams.get('state') ?? '';
  const code = url.searchParams.get('code') ?? '';

  if (providerError || !state || !code) {
    throw redirect(
      303,
      `${tenantSignInPath(tenant.slug)}?federation=failed`
    );
  }

  try {
    const result = await getOidcService().completeLogin(
      tenant.tenantId,
      providerId,
      state,
      code
    );

    if (result.principal.tenantId !== tenant.tenantId) {
      throw redirect(
        303,
        `${tenantSignInPath(tenant.slug)}?federation=failed`
      );
    }

    if (result.sessionAssurance === 'PASSWORD') {
      const mfa = await getMfaService().beginLogin(
        result.principal,
        result.returnTo,
        {
          baseAuthenticationMethod: 'OIDC',
          authenticationProviderId: result.providerId
        }
      );

      if (mfa.required && mfa.token && mfa.expiresAt) {
        setTenantMfaChallenge(
          cookies,
          tenant.slug,
          mfa.token,
          mfa.expiresAt
        );
        throw redirect(
          303,
          mfa.enrollmentRequired
            ? `/${tenant.slug}/app/auth/mfa/enroll`
            : `/${tenant.slug}/app/auth/mfa`
        );
      }
    }

    const userAgent = request.headers.get('user-agent')?.trim();
    const created = await getAuthRepository().createSession(
      result.principal,
      undefined,
      result.sessionAssurance,
      {
        ...(userAgent ? { userAgent } : {}),
        networkAddress: getClientAddress(),
        authenticationProviderId: result.providerId
      },
      'OIDC'
    );

    setTenantApplicationSession(
      cookies,
      tenant.slug,
      created.token,
      created.session.expiresAt
    );

    throw redirect(303, result.returnTo);
  } catch (error) {
    if (error instanceof OidcError) {
      throw redirect(
        303,
        `${tenantSignInPath(tenant.slug)}?federation=failed`
      );
    }
    throw error;
  }
};
