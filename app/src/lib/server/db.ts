import { loadEnvFile } from 'node:process';
import mysql, {
  type Pool,
  type PoolConnection,
  type ResultSetHeader,
  type RowDataPacket
} from 'mysql2/promise';

export const requiredMigration = '0002_strategy_and_architecture_review.sql';

function databaseUrl() {
  if (!process.env.DATABASE_URL && !process.env.MYSQL_URL && !process.env.NUBLOX_TEST_DATABASE_URL) {
    try { loadEnvFile('.env'); } catch { /* environment may be injected by the runtime */ }
  }

  const url =
    (process.env.NODE_ENV === 'test' ? process.env.NUBLOX_TEST_DATABASE_URL : undefined) ??
    process.env.DATABASE_URL ??
    process.env.MYSQL_URL;

  if (!url) {
    throw new Error(
      'MySQL connection is not configured. Set DATABASE_URL (or MYSQL_URL); tests use NUBLOX_TEST_DATABASE_URL.'
    );
  }
  return url;
}

let poolInstance: Pool | null = null;
let readyPromise: Promise<void> | null = null;

export function getDbPool() {
  if (!poolInstance) {
    poolInstance = mysql.createPool(databaseUrl());
  }
  return poolInstance;
}

export type DbExecutor = Pool | PoolConnection;

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  executor: DbExecutor = getDbPool()
): Promise<T[]> {
  const [rows] = await executor.execute<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends RowDataPacket>(
  sql: string,
  params: unknown[] = [],
  executor: DbExecutor = getDbPool()
): Promise<T | undefined> {
  const rows = await queryRows<T>(sql, params, executor);
  return rows[0];
}

export async function executeMutation(
  sql: string,
  params: unknown[] = [],
  executor: DbExecutor = getDbPool()
): Promise<ResultSetHeader> {
  const [result] = await executor.execute<ResultSetHeader>(sql, params);
  return result;
}

export async function dbTransaction<T>(
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
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
