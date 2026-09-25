import type { AuthSession } from '@nublox/persistence';
import type { Cookies } from '@sveltejs/kit';
import { TENANT_SLUG_PATTERN, tenantAppPath } from '$lib/tenant-paths';
import { getAuthRepository } from './platform';

export const LEGACY_SESSION_COOKIE = 'nublox_session';
export const TENANT_ROUTE_HINT_COOKIE = 'nublox_tenant_route';
const TENANT_SESSION_COOKIE_PREFIX = 'nublox_tenant_session_';
const TENANT_MFA_CHALLENGE_COOKIE_PREFIX = 'nublox_mfa_challenge_';

function cookieSafeTenantSlug(tenantSlug: string): string {
  if (!TENANT_SLUG_PATTERN.test(tenantSlug)) {
    throw new Error('Invalid tenant slug for session cookie.');
  }
  return tenantSlug.replaceAll('-', '_');
}

export function tenantSessionCookieName(tenantSlug: string): string {
  return `${TENANT_SESSION_COOKIE_PREFIX}${cookieSafeTenantSlug(tenantSlug)}`;
}

export function tenantMfaChallengeCookieName(tenantSlug: string): string {
  return `${TENANT_MFA_CHALLENGE_COOKIE_PREFIX}${cookieSafeTenantSlug(tenantSlug)}`;
}

export function tenantMfaChallengeCookiePath(tenantSlug: string): string {
  return `/${tenantSlug}/app/auth/mfa`;
}


export function tenantApplicationCookiePath(tenantSlug: string): string {
  return tenantAppPath(tenantSlug);
}

export async function resolveTenantApplicationSession(
  cookies: Cookies,
  tenantSlug: string
): Promise<AuthSession | null> {
  const token = cookies.get(tenantSessionCookieName(tenantSlug));
  if (!token) return null;

  return getAuthRepository().resolveSession(token);
}

export async function resolveLegacyApplicationSession(cookies: Cookies): Promise<AuthSession | null> {
  const token = cookies.get(LEGACY_SESSION_COOKIE);
  if (!token) return null;

  return getAuthRepository().resolveSession(token);
}

export function setTenantApplicationSession(
  cookies: Cookies,
  tenantSlug: string,
  token: string,
  expiresAt: string
): void {
  const expiry = new Date(expiresAt);
  const maxAge = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));

  cookies.set(tenantSessionCookieName(tenantSlug), token, {
    path: tenantApplicationCookiePath(tenantSlug),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });

  cookies.set(TENANT_ROUTE_HINT_COOKIE, tenantSlug, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearTenantApplicationSession(cookies: Cookies, tenantSlug: string): void {
  cookies.delete(tenantSessionCookieName(tenantSlug), {
    path: tenantApplicationCookiePath(tenantSlug)
  });
}

export function clearLegacyApplicationSession(cookies: Cookies): void {
  cookies.delete(LEGACY_SESSION_COOKIE, { path: '/' });
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || value.startsWith('//')) return '/app';

  if (value.startsWith('/app')) return value;
  if (/^\/[a-z0-9][a-z0-9-]{1,78}[a-z0-9]\/app(?:\/|$)/.test(value)) return value;

  return '/app';
}

export function safeTenantReturnTo(
  tenantSlug: string,
  value: string | null | undefined,
  fallbackInternalPath = '/app/function'
): string {
  const fallback = tenantAppPath(tenantSlug, fallbackInternalPath);
  if (!value || value.startsWith('//')) return fallback;

  const tenantPrefix = tenantAppPath(tenantSlug);
  if (value === tenantPrefix || value.startsWith(`${tenantPrefix}/`)) return value;

  if (value === '/app' || value.startsWith('/app/')) {
    return tenantAppPath(tenantSlug, value);
  }

  return fallback;
}

export function tenantRouteHint(cookies: Cookies): string | null {
  const value = cookies.get(TENANT_ROUTE_HINT_COOKIE)?.trim().toLowerCase();
  return value && TENANT_SLUG_PATTERN.test(value) ? value : null;
}

export function setTenantMfaChallenge(
  cookies: Cookies,
  tenantSlug: string,
  token: string,
  expiresAt: string
): void {
  const expiry = new Date(expiresAt);
  const maxAge = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));

  cookies.set(tenantMfaChallengeCookieName(tenantSlug), token, {
    path: tenantMfaChallengeCookiePath(tenantSlug),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });
}

export function getTenantMfaChallenge(cookies: Cookies, tenantSlug: string): string | null {
  return cookies.get(tenantMfaChallengeCookieName(tenantSlug)) ?? null;
}

export function clearTenantMfaChallenge(cookies: Cookies, tenantSlug: string): void {
  cookies.delete(tenantMfaChallengeCookieName(tenantSlug), {
    path: tenantMfaChallengeCookiePath(tenantSlug)
  });
}
