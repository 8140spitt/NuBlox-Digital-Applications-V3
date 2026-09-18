import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import mysql from 'mysql2/promise';

export function getDatabaseUrl(useTestDatabase = false) {
  const url = useTestDatabase
    ? process.env.NUBLOX_TEST_DATABASE_URL
    : (process.env.DATABASE_URL ?? process.env.MYSQL_URL);
  if (!url) {
    const name = useTestDatabase ? 'NUBLOX_TEST_DATABASE_URL' : 'DATABASE_URL (or MYSQL_URL)';
    throw new Error(`Missing ${name}.`);
  }
  return url;
}

export async function readMigrations() {
  const directory = resolve(process.cwd(), 'migrations');
  const names = (await readdir(directory)).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(resolve(directory, name), 'utf8');
      return { name, sql, checksum: createHash('sha256').update(sql).digest('hex') };
    })
  );
}

export function connectionOptions(databaseUrl) {
  const target = new URL(databaseUrl);
  return {
    host: target.hostname,
    port: target.port ? Number(target.port) : 3306,
    user: decodeURIComponent(target.username),
    password: decodeURIComponent(target.password),
    database: decodeURIComponent(target.pathname.replace(/^\//, '')),
    multipleStatements: true,
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined
  };
}

export async function migrationConnection(useTestDatabase = false) {
  return mysql.createConnection(connectionOptions(getDatabaseUrl(useTestDatabase)));
}

export async function ensureMigrationLedger(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migration_attempts (
      migration_name VARCHAR(255) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      status VARCHAR(16) NOT NULL,
      started_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at TIMESTAMP(3) NULL,
      error_message TEXT NULL,
      INDEX idx_schema_migration_attempt_status (status, started_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
}

export async function withMigrationLock(connection, work) {
  const [databaseRows] = await connection.query('SELECT DATABASE() AS databaseName');
  const databaseName = String(databaseRows[0]?.databaseName ?? '');
  if (!databaseName) throw new Error('Migration connection is not scoped to a database.');
  const databaseKey = createHash('sha256').update(databaseName).digest('hex').slice(0, 32);
  const lockName = 'nublox:migrations:' + databaseKey;
  const [rows] = await connection.execute('SELECT GET_LOCK(?, 30) AS acquired', [lockName]);
  if (Number(rows[0]?.acquired) !== 1)
    throw new Error('Could not acquire the NuBlox schema migration lock.');
  try {
    return await work();
  } finally {
    await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]);
  }
}

export async function readDirtyMigrationAttempts(connection) {
  const [rows] = await connection.query(
    "SELECT migration_name AS name, checksum, status, started_at AS startedAt, completed_at AS completedAt, error_message AS errorMessage FROM schema_migration_attempts WHERE status IN ('APPLYING', 'FAILED') ORDER BY started_at, migration_name"
  );
  return rows;
}

function dirtyMigrationError(rows) {
  const summary = rows.map((row) => `${row.name} [${row.status}]`).join(', ');
  return new Error(
    'Database migration state is dirty: ' +
      summary +
      '. Inspect the partial schema change and repair it explicitly before retrying migrations.'
  );
}

export async function applyMigrations(connection, { log = console.log } = {}) {
  return withMigrationLock(connection, async () => {
    await ensureMigrationLedger(connection);
    const migrations = await readMigrations();
    const dirty = await readDirtyMigrationAttempts(connection);
    if (dirty.length) throw dirtyMigrationError(dirty);

    const [rows] = await connection.query(
      'SELECT migration_name AS name, checksum FROM schema_migrations ORDER BY migration_name'
    );
    const repositoryNames = new Set(migrations.map((migration) => migration.name));
    for (const row of rows) {
      if (!repositoryNames.has(row.name))
        throw new Error(`Applied migration ${row.name} is missing from the repository.`);
    }

    const applied = new Map(rows.map((row) => [row.name, row.checksum]));
    for (const migration of migrations) {
      const existingChecksum = applied.get(migration.name);
      if (existingChecksum) {
        if (existingChecksum !== migration.checksum)
          throw new Error(
            `Migration drift detected for ${migration.name}. Applied checksum differs from repository checksum.`
          );
        log?.(`✓ ${migration.name} already applied`);
        continue;
      }

      log?.(`→ applying ${migration.name}`);
      await connection.execute(
        `INSERT INTO schema_migration_attempts
           (migration_name, checksum, status, started_at, completed_at, error_message)
         VALUES (?, ?, 'APPLYING', CURRENT_TIMESTAMP(3), NULL, NULL)
         ON DUPLICATE KEY UPDATE
           checksum = VALUES(checksum),
           status = 'APPLYING',
           started_at = CURRENT_TIMESTAMP(3),
           completed_at = NULL,
           error_message = NULL`,
        [migration.name, migration.checksum]
      );

      try {
        await connection.query(migration.sql);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await connection.execute(
          `UPDATE schema_migration_attempts
              SET status = 'FAILED',
                  completed_at = CURRENT_TIMESTAMP(3),
                  error_message = ?
            WHERE migration_name = ?`,
          [message.slice(0, 16000), migration.name]
        );
        throw new Error(
          `Migration ${migration.name} failed and the database is now marked dirty. ` +
            'Because MySQL DDL may have committed partially, inspect and repair the schema before retrying.',
          { cause: error }
        );
      }

      await connection.beginTransaction();
      try {
        await connection.execute(
          'INSERT INTO schema_migrations (migration_name, checksum) VALUES (?, ?)',
          [migration.name, migration.checksum]
        );
        await connection.execute(
          `UPDATE schema_migration_attempts
              SET status = 'APPLIED',
                  completed_at = CURRENT_TIMESTAMP(3),
                  error_message = NULL
            WHERE migration_name = ? AND status = 'APPLYING'`,
          [migration.name]
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw new Error(
          `Migration ${migration.name} changed the schema but its completion metadata could not be committed. ` +
            'The APPLYING marker has been preserved; inspect the database before retrying.',
          { cause: error }
        );
      }

      applied.set(migration.name, migration.checksum);
      log?.(`✓ applied ${migration.name}`);
    }
    return migrations;
  });
}
