import { loadEnvFile } from 'node:process';
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket
} from 'mysql2/promise';

export const requiredMigration = '0040_managed_deliverable_governance.sql';

function databaseUrl() {
  if (
    !process.env.DATABASE_URL &&
    !process.env.MYSQL_URL &&
    !process.env.NUBLOX_TEST_DATABASE_URL
  ) {
    try {
      loadEnvFile('.env');
    } catch {
      /* environment may be injected by the runtime */
    }
  }

  if (process.env.NODE_ENV === 'test') {
    if (!process.env.NUBLOX_TEST_DATABASE_URL) {
      throw new Error(
        'Tests require NUBLOX_TEST_DATABASE_URL. Refusing to fall back to a development database.'
      );
    }
    return process.env.NUBLOX_TEST_DATABASE_URL;
  }

  const url = process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  if (!url) {
    throw new Error('MySQL connection is not configured. Set DATABASE_URL (or MYSQL_URL).');
  }
  return url;
}

function poolOptions() {
  const target = new URL(databaseUrl());
  return {
    host: target.hostname,
    port: target.port ? Number(target.port) : 3306,
    user: decodeURIComponent(target.username),
    password: decodeURIComponent(target.password),
    database: decodeURIComponent(target.pathname.replace(/^\//, '')),
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE ?? 10),
    queueLimit: 0,
    enableKeepAlive: true,
    charset: 'utf8mb4',
    timezone: 'Z',
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined
  };
}

let poolInstance: Pool | null = null;
let readyPromise: Promise<void> | null = null;

export function getDbPool() {
  if (!poolInstance) {
    poolInstance = mysql.createPool(poolOptions());
  }
  return poolInstance;
}

export type DbExecutor = Pool | PoolConnection;

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: any[] = [],
  executor: DbExecutor = getDbPool()
): Promise<T[]> {
  const [rows] = await executor.execute<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: any[] = [],
  executor: DbExecutor = getDbPool()
): Promise<T | undefined> {
  const rows = await queryRows<T>(sql, params, executor);
  return rows[0];
}

export async function executeMutation(
  sql: string,
  params: any[] = [],
  executor: DbExecutor = getDbPool()
): Promise<ResultSetHeader> {
  const [result] = await executor.execute<ResultSetHeader>(sql, params);
  return result;
}

type MySqlTransactionError = {
  code?: unknown;
  errno?: unknown;
};

function isRetryableTransactionError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as MySqlTransactionError;
  return (
    candidate.code === 'ER_LOCK_DEADLOCK' ||
    candidate.code === 'ER_LOCK_WAIT_TIMEOUT' ||
    candidate.errno === 1213 ||
    candidate.errno === 1205
  );
}

function transactionRetryDelay(attempt: number) {
  return new Promise((resolve) => setTimeout(resolve, Math.min(250, 25 * 2 ** (attempt - 1))));
}

export async function dbTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const maxAttempts = 4;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const connection = await getDbPool().getConnection();
    let failed: unknown;

    try {
      await connection.beginTransaction();
      const result = await work(connection);
      await connection.commit();
      return result;
    } catch (error) {
      failed = error;
      try {
        await connection.rollback();
      } catch {
        // Preserve the original transaction failure; the connection is released below.
      }
    } finally {
      connection.release();
    }

    if (!isRetryableTransactionError(failed) || attempt === maxAttempts) {
      throw failed;
    }

    await transactionRetryDelay(attempt);
  }

  throw new Error('Database transaction retry loop exhausted unexpectedly.');
}

export async function assertDatabaseReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      try {
        const row = await queryOne<RowDataPacket & { checksum: string }>(
          'SELECT checksum FROM schema_migrations WHERE migration_name = ? LIMIT 1',
          [requiredMigration]
        );
        if (!row) {
          throw new Error(
            `Database migration ${requiredMigration} is not applied. Run: pnpm db:migrate`
          );
        }
      } catch (error) {
        readyPromise = null;
        if (error instanceof Error && error.message.includes('Run: pnpm db:migrate')) throw error;
        throw new Error(
          'Database migration ledger is unavailable. Run: pnpm db:migrate before starting NuBlox.'
        );
      }
    })();
  }
  return readyPromise;
}

export async function closeDbPool() {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    readyPromise = null;
  }
}
