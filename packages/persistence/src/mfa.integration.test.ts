import { createHmac, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlAuthRepository } from './auth-repository.js';
import { MfaError, MySqlMfaService } from './mfa-service.js';
import { MySqlTenantRegistrationService } from './tenant-registration-service.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(value: string): Buffer {
  let bits = 0;
  let accumulator = 0;
  const bytes: number[] = [];

  for (const character of value.toUpperCase()) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index < 0) throw new Error('Invalid Base32 test secret.');

    accumulator = (accumulator << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((accumulator >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function totp(secret: string, counter = Math.floor(Date.now() / 1000 / 30)): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', base32Decode(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, '0');
}

suite('tenant-scoped TOTP MFA', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('enrolls, challenges login, blocks TOTP replay and consumes a recovery code once', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const email = `mfa-${suffix}@example.test`;
    const password = 'correct-horse-battery-staple';

    const registration = await new MySqlTenantRegistrationService(pool).register({
      businessName: `MFA Test ${suffix}`,
      tenantSlug: `mfa-${suffix}`,
      personName: 'MFA Test User',
      email,
      password,
      acceptedTerms: true,
      emailVerified: true
    });

    const auth = new MySqlAuthRepository(pool);
    const principal = await auth.authenticate(email, password, registration.tenantId);
    const mfa = new MySqlMfaService(pool);

    expect(await mfa.status(principal)).toEqual({
      enabled: false,
      verifiedAt: null,
      recoveryCodesRemaining: 0
    });

    const enrollment = await mfa.startEnrollment(principal);
    expect(enrollment.secret).toMatch(/^[A-Z2-7]+$/);
    expect(enrollment.otpauthUri).toContain('otpauth://totp/');

    const recoveryCodes = await mfa.confirmEnrollment(
      principal,
      totp(enrollment.secret)
    );
    expect(recoveryCodes).toHaveLength(10);

    const status = await mfa.status(principal);
    expect(status.enabled).toBe(true);
    expect(status.recoveryCodesRemaining).toBe(10);

    const firstChallenge = await mfa.beginLogin(
      principal,
      `/${registration.tenantSlug}/app/function`
    );
    expect(firstChallenge.required).toBe(true);
    expect(firstChallenge.token).toBeTruthy();

    const currentCode = totp(enrollment.secret);
    const firstLogin = await mfa.verifyLoginChallenge(
      firstChallenge.token ?? '',
      registration.tenantSlug,
      currentCode
    );
    expect(firstLogin.method).toBe('TOTP');

    const session = await auth.createSession(firstLogin.principal, 600, 'MFA');
    const resolved = await auth.resolveSession(session.token);
    expect(resolved?.authenticationStrength).toBe('MFA');
    expect(resolved?.mfaVerifiedAt).toBeTruthy();

    const replayChallenge = await mfa.beginLogin(
      principal,
      `/${registration.tenantSlug}/app/function`
    );
    await expect(
      mfa.verifyLoginChallenge(
        replayChallenge.token ?? '',
        registration.tenantSlug,
        currentCode
      )
    ).rejects.toMatchObject<MfaError>({ code: 'INVALID_CODE' });

    const recoveryLogin = await mfa.verifyLoginChallenge(
      replayChallenge.token ?? '',
      registration.tenantSlug,
      recoveryCodes[0]
    );
    expect(recoveryLogin.method).toBe('RECOVERY_CODE');

    const afterRecovery = await mfa.status(principal);
    expect(afterRecovery.recoveryCodesRemaining).toBe(9);
  });
});
