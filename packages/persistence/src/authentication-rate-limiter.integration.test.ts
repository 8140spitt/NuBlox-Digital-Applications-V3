import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AuthenticationRateLimitError,
  MySqlAuthenticationRateLimiter
} from './authentication-rate-limiter.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('authentication throttling', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('persists the block after the login threshold is exceeded', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const limiter = new MySqlAuthenticationRateLimiter(pool);
    const suffix = randomUUID();
    const subject = `rate-limit-${suffix}@example.test`;
    const network = `test-network-${suffix}`;

    for (let index = 0; index < 8; index += 1) {
      await limiter.consume('LOGIN', subject, network);
    }

    await expect(
      limiter.consume('LOGIN', subject, network)
    ).rejects.toBeInstanceOf(AuthenticationRateLimitError);

    await expect(
      limiter.consume('LOGIN', subject, network)
    ).rejects.toBeInstanceOf(AuthenticationRateLimitError);
  });
});
