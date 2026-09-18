import { getRequestEvent } from '$app/server';
import { betterAuth } from 'better-auth';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getDbPool } from '$lib/server/db';

function authSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET is required in production.');
  }
  return 'nublox-development-only-secret-change-before-production-2026';
}

export const auth = betterAuth({
  database: getDbPool(),
  secret: authSecret(),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.NUBLOX_ALLOW_PUBLIC_SIGNUP !== 'true',
    autoSignIn: process.env.NUBLOX_AUTH_BOOTSTRAP !== 'true',
    minPasswordLength: 12,
    maxPasswordLength: 128
  },
  session: {
    expiresIn: 60 * 60 * 12,
    updateAge: 60 * 60
  },
  advanced: {
    database: {
      generateId: 'uuid',
      joins: true
    }
  },
  plugins: process.env.NUBLOX_AUTH_BOOTSTRAP === 'true' ? [] : [sveltekitCookies(getRequestEvent)]
});

export type AuthSession = typeof auth.$Infer.Session;
