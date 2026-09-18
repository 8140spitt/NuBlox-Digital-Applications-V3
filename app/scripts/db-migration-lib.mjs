import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

export function getDatabaseUrl(useTestDatabase = false) {
  const url = useTestDatabase
    ? process.env.NUBLOX_TEST_DATABASE_URL
    : process.env.DATABASE_URL ?? process.env.MYSQL_URL;
  if (!url) {
    const name = useTestDatabase ? 'NUBLOX_TEST_DATABASE_URL' : 'DATABASE_URL (or MYSQL_URL)';
    throw new Error(`Missing ${name}.`);
  }
  return url;
}

export async function readMigrations() {
  const directory = resolve(process.cwd(), 'migrations');
  const names = (await readdir(directory))
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();

  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(resolve(directory, name), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      return { name, sql, checksum };
    })
  );
}

export async function migrationConnection(useTestDatabase = false) {
  return mysql.createConnection({
    uri: getDatabaseUrl(useTestDatabase),
    multipleStatements: true
  });
}

export async function ensureMigrationLedger(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}
