import {
  MySqlPlatformAdministrationService,
  type PlatformOperatorSession
} from '@nublox/persistence';
import type { Cookies } from '@sveltejs/kit';
import { getDatabasePool } from './platform';

export const PLATFORM_SESSION_COOKIE = 'nublox_platform_session';

let platformAdministrationService: MySqlPlatformAdministrationService | undefined;

export function getPlatformAdministrationService(): MySqlPlatformAdministrationService {
  if (!platformAdministrationService) {
    platformAdministrationService = new MySqlPlatformAdministrationService(getDatabasePool());
  }
  return platformAdministrationService;
}

export async function resolvePlatformOperatorSession(
  cookies: Cookies
): Promise<PlatformOperatorSession | null> {
  const token = cookies.get(PLATFORM_SESSION_COOKIE);
  if (!token) return null;
  return getPlatformAdministrationService().resolveSession(token);
}

export function setPlatformOperatorSession(
  cookies: Cookies,
  token: string,
  expiresAt: string
): void {
  const expiry = new Date(expiresAt);
  const maxAge = Math.max(1, Math.floor((expiry.getTime() - Date.now()) / 1000));

  cookies.set(PLATFORM_SESSION_COOKIE, token, {
    path: '/platform',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge
  });
}

export function clearPlatformOperatorSession(cookies: Cookies): void {
  cookies.delete(PLATFORM_SESSION_COOKIE, { path: '/platform' });
}
