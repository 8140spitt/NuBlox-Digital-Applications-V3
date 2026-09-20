import mysql, { type Pool, type PoolConnection, type PoolOptions } from 'mysql2/promise';

export function databaseConfigFromEnv(): PoolOptions {
  const value = process.env.NUBLOX_DATABASE_URL;

  if (!value) {
    throw new Error('NUBLOX_DATABASE_URL is required.');
  }

  const url = new URL(value);

  if (url.protocol !== 'mysql:') {
    throw new Error('NUBLOX_DATABASE_URL must use the mysql:// protocol.');
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true,
    ssl: process.env.NUBLOX_DB_SSL === 'true' ? {} : undefined
  };
}

export function createDatabasePool(): Pool {
  return mysql.createPool({
    ...databaseConfigFromEnv(),
    connectionLimit: 10,
    multipleStatements: false
  });
}

export async function withTransaction<T>(
  pool: Pool,
  work: (connection: PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

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
