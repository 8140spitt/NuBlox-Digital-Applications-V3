import type { AuthSession } from '@nublox/persistence';
import type { Cookies } from '@sveltejs/kit';
import { getAuthRepository } from './platform';

export const SESSION_COOKIE = 'nublox_session';

export async function resolveApplicationSession(cookies: Cookies): Promise<AuthSession | null> {
  const token = cookies.get(SESSION_COOKIE);
  if (!token) return null;

  return getAuthRepository().resolveSession(token);
}

export function setApplicationSession(
  cookies: Cookies,
  token: string,
  expiresAt: string
): void {
  const expiry = new Date(expiresAt);
  const maxAge = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));

  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge
  });
}

export function clearApplicationSession(cookies: Cookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/app') || value.startsWith('//')) {
    return '/app';
  }

  return value;
}
