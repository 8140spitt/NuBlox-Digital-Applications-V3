import { createHmac } from 'node:crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';

export type AuthenticationThrottlePurpose =
  | 'LOGIN'
  | 'TENANT_REGISTRATION'
  | 'EMAIL_VERIFICATION_RESEND'
  | 'PASSWORD_RESET_REQUEST';

export class AuthenticationRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super('Too many authentication requests. Try again later.');
    this.name = 'AuthenticationRateLimitError';
  }
}

interface BucketRow extends RowDataPacket {
  attempt_count: number;
  window_started_at: Date;
  blocked_until: Date | null;
}

interface Policy {
  windowSeconds: number;
  blockSeconds: number;
  subjectNetworkLimit: number;
  networkLimit: number;
}

const POLICIES: Record<AuthenticationThrottlePurpose, Policy> = {
  LOGIN: {
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60,
    subjectNetworkLimit: 8,
    networkLimit: 100
  },
  TENANT_REGISTRATION: {
    windowSeconds: 60 * 60,
    blockSeconds: 60 * 60,
    subjectNetworkLimit: 3,
    networkLimit: 10
  },
  EMAIL_VERIFICATION_RESEND: {
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60,
    subjectNetworkLimit: 5,
    networkLimit: 30
  },
  PASSWORD_RESET_REQUEST: {
    windowSeconds: 15 * 60,
    blockSeconds: 15 * 60,
    subjectNetworkLimit: 5,
    networkLimit: 30
  }
};

function rateLimitSecret(): string {
  const configured = process.env.NUBLOX_AUTH_RATE_LIMIT_SECRET?.trim();
  if (configured) {
    if (configured.length < 32) {
      throw new Error('NUBLOX_AUTH_RATE_LIMIT_SECRET must contain at least 32 characters.');
    }
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('NUBLOX_AUTH_RATE_LIMIT_SECRET is required in production.');
  }

  return 'nublox-development-rate-limit-secret-not-for-production';
}

function digest(secret: string, value: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}

function normaliseSubject(value: string): string {
  return value.trim().toLowerCase();
}

function normaliseNetwork(value: string): string {
  return value.trim().toLowerCase() || 'unknown';
}

export class MySqlAuthenticationRateLimiter {
  private readonly secret = rateLimitSecret();

  constructor(private readonly pool: Pool) {}

  async consume(
    purpose: AuthenticationThrottlePurpose,
    subjectValue: string,
    networkValue: string
  ): Promise<void> {
    const subject = normaliseSubject(subjectValue);
    const network = normaliseNetwork(networkValue);
    const policy = POLICIES[purpose];

    const subjectHash = digest(this.secret, `subject:${subject}`);
    const networkHash = digest(this.secret, `network:${network}`);
    const subjectNetworkKey = digest(
      this.secret,
      `bucket:${purpose}:subject-network:${subject}:${network}`
    );
    const networkKey = digest(
      this.secret,
      `bucket:${purpose}:network:${network}`
    );

    const retryAfterSeconds = await withTransaction(this.pool, async (connection) => {
      const networkRetry = await this.consumeBucket(connection, {
        bucketKey: networkKey,
        purpose,
        dimension: 'NETWORK',
        subjectHash: null,
        networkHash,
        limit: policy.networkLimit,
        windowSeconds: policy.windowSeconds,
        blockSeconds: policy.blockSeconds
      });

      if (networkRetry > 0) return networkRetry;

      return this.consumeBucket(connection, {
        bucketKey: subjectNetworkKey,
        purpose,
        dimension: 'SUBJECT_NETWORK',
        subjectHash,
        networkHash,
        limit: policy.subjectNetworkLimit,
        windowSeconds: policy.windowSeconds,
        blockSeconds: policy.blockSeconds
      });
    });

    if (retryAfterSeconds > 0) {
      throw new AuthenticationRateLimitError(retryAfterSeconds);
    }
  }

  async clearSuccessfulLogin(subjectValue: string, networkValue: string): Promise<void> {
    const subject = normaliseSubject(subjectValue);
    const network = normaliseNetwork(networkValue);
    const key = digest(
      this.secret,
      `bucket:LOGIN:subject-network:${subject}:${network}`
    );
    await this.pool.execute(
      `DELETE FROM application_auth_throttle_buckets
        WHERE bucket_key = ?
          AND purpose = 'LOGIN'
          AND dimension = 'SUBJECT_NETWORK'`,
      [key]
    );
  }

  private async consumeBucket(
    connection: PoolConnection,
    input: {
      bucketKey: string;
      purpose: AuthenticationThrottlePurpose;
      dimension: 'SUBJECT_NETWORK' | 'NETWORK';
      subjectHash: string | null;
      networkHash: string;
      limit: number;
      windowSeconds: number;
      blockSeconds: number;
    }
  ): Promise<number> {
    const [rows] = await connection.execute<BucketRow[]>(
      `SELECT attempt_count, window_started_at, blocked_until
         FROM application_auth_throttle_buckets
        WHERE bucket_key = ?
        FOR UPDATE`,
      [input.bucketKey]
    );

    const now = new Date();
    const row = rows[0];

    if (!row) {
      await connection.execute(
        `INSERT INTO application_auth_throttle_buckets
          (bucket_key, purpose, dimension, subject_hash, network_hash,
           attempt_count, window_started_at, last_attempt_at, blocked_until)
         VALUES (?, ?, ?, ?, ?, 1, ?, ?, NULL)`,
        [
          input.bucketKey,
          input.purpose,
          input.dimension,
          input.subjectHash,
          input.networkHash,
          now,
          now
        ]
      );
      return 0;
    }

    if (row.blocked_until && row.blocked_until.getTime() > now.getTime()) {
      return Math.max(
        1,
        Math.ceil((row.blocked_until.getTime() - now.getTime()) / 1000)
      );
    }

    const windowAgeSeconds =
      (now.getTime() - row.window_started_at.getTime()) / 1000;

    if (windowAgeSeconds >= input.windowSeconds) {
      await connection.execute(
        `UPDATE application_auth_throttle_buckets
            SET attempt_count = 1,
                window_started_at = ?,
                last_attempt_at = ?,
                blocked_until = NULL
          WHERE bucket_key = ?`,
        [now, now, input.bucketKey]
      );
      return 0;
    }

    const nextCount = Number(row.attempt_count) + 1;
    if (nextCount > input.limit) {
      const blockedUntil = new Date(now.getTime() + input.blockSeconds * 1000);
      await connection.execute(
        `UPDATE application_auth_throttle_buckets
            SET attempt_count = ?,
                last_attempt_at = ?,
                blocked_until = ?
          WHERE bucket_key = ?`,
        [nextCount, now, blockedUntil, input.bucketKey]
      );
      return input.blockSeconds;
    }

    await connection.execute(
      `UPDATE application_auth_throttle_buckets
          SET attempt_count = ?,
              last_attempt_at = ?,
              blocked_until = NULL
        WHERE bucket_key = ?`,
      [nextCount, now, input.bucketKey]
    );
    return 0;
  }
}
