import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql, { type RowDataPacket } from 'mysql2/promise';
import { databaseConfigFromEnv } from './database.js';

interface MigrationRow extends RowDataPacket {
  version: string;
  checksum: string;
  status: 'APPLYING' | 'APPLIED' | 'FAILED';
  applied_at: Date | null;
  error_message: string | null;
}

export interface MigrationStatus {
  version: string;
  status: 'PENDING' | 'APPLYING' | 'APPLIED' | 'FAILED';
  checksum: string;
  appliedAt?: string;
  errorMessage?: string;
  repositoryChecksumChanged?: boolean;
}

const migrationsDirectory = fileURLToPath(new URL('../migrations/', import.meta.url));

async function migrationFiles(): Promise<string[]> {
  return (await readdir(migrationsDirectory))
    .filter((name) => /^\d{4}_.+\.sql$/.test(name))
    .sort();
}

function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

async function ensureTable(connection: mysql.Connection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS kernel_schema_migrations (
      version VARCHAR(255) NOT NULL PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      status VARCHAR(16) NOT NULL,
      applied_at TIMESTAMP(6) NULL,
      error_message TEXT NULL,
      CONSTRAINT chk_kernel_schema_migrations_status
        CHECK (status IN ('APPLYING', 'APPLIED', 'FAILED'))
    ) ENGINE=InnoDB
  `);
}

async function openMigrationConnection(): Promise<mysql.Connection> {
  return mysql.createConnection({
    ...databaseConfigFromEnv(),
    multipleStatements: true
  });
}

export async function getMigrationStatus(): Promise<MigrationStatus[]> {
  const connection = await openMigrationConnection();

  try {
    await ensureTable(connection);
    const [rows] = await connection.query<MigrationRow[]>(
      'SELECT version, checksum, status, applied_at, error_message FROM kernel_schema_migrations'
    );
    const applied = new Map(rows.map((row) => [row.version, row]));
    const result: MigrationStatus[] = [];

    for (const version of await migrationFiles()) {
      const sql = await readFile(new URL(`../migrations/${version}`, import.meta.url), 'utf8');
      const digest = checksum(sql);
      const row = applied.get(version);

      if (!row) {
        result.push({ version, status: 'PENDING', checksum: digest });
        continue;
      }

      const repositoryChecksumChanged = row.checksum !== digest;

      if (repositoryChecksumChanged && row.status === 'APPLIED') {
        throw new Error(`Applied migration ${version} checksum does not match the repository.`);
      }

      result.push({
        version,
        status: row.status,
        checksum: digest,
        ...(row.applied_at ? { appliedAt: row.applied_at.toISOString() } : {}),
        ...(row.error_message ? { errorMessage: row.error_message } : {}),
        ...(repositoryChecksumChanged ? { repositoryChecksumChanged: true } : {})
      });
    }

    return result;
  } finally {
    await connection.end();
  }
}

export async function migrate(): Promise<MigrationStatus[]> {
  const connection = await openMigrationConnection();

  try {
    await ensureTable(connection);

    const [dirtyRows] = await connection.query<MigrationRow[]>(
      "SELECT version, checksum, status, applied_at, error_message FROM kernel_schema_migrations WHERE status <> 'APPLIED'"
    );

    if (dirtyRows.length > 0) {
      const retryable = dirtyRows.filter((row) => row.status === 'FAILED');
      const retryHint =
        retryable.length === 1 && dirtyRows.length === 1
          ? ` Run "pnpm db:retry-failed ${retryable[0]!.version}" after reviewing the corrected migration.`
          : '';

      throw new Error(
        `Database has an incomplete migration: ${dirtyRows.map((row) => `${row.version}:${row.status}`).join(', ')}.${retryHint}`
      );
    }

    for (const version of await migrationFiles()) {
      const sql = await readFile(new URL(`../migrations/${version}`, import.meta.url), 'utf8');
      const digest = checksum(sql);
      const [rows] = await connection.query<MigrationRow[]>(
        'SELECT version, checksum, status, applied_at, error_message FROM kernel_schema_migrations WHERE version = ?',
        [version]
      );
      const existing = rows[0];

      if (existing) {
        if (existing.checksum !== digest) {
          throw new Error(`Applied migration ${version} checksum does not match the repository.`);
        }
        continue;
      }

      await connection.execute(
        "INSERT INTO kernel_schema_migrations (version, checksum, status) VALUES (?, ?, 'APPLYING')",
        [version, digest]
      );

      try {
        await connection.query(sql);
        await connection.execute(
          "UPDATE kernel_schema_migrations SET status = 'APPLIED', applied_at = CURRENT_TIMESTAMP(6), error_message = NULL WHERE version = ?",
          [version]
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await connection.execute(
          "UPDATE kernel_schema_migrations SET status = 'FAILED', error_message = ? WHERE version = ?",
          [message.slice(0, 65000), version]
        );
        throw error;
      }
    }
  } finally {
    await connection.end();
  }

  return getMigrationStatus();
}


export async function retryFailedMigration(version?: string): Promise<MigrationStatus[]> {
  const connection = await openMigrationConnection();

  try {
    await ensureTable(connection);

    const [failedRows] = await connection.query<MigrationRow[]>(
      "SELECT version, checksum, status, applied_at, error_message FROM kernel_schema_migrations WHERE status = 'FAILED' ORDER BY version"
    );

    if (failedRows.length === 0) {
      throw new Error('Database has no failed migration to retry.');
    }

    const selected = version
      ? failedRows.find((row) => row.version === version)
      : failedRows.length === 1
        ? failedRows[0]
        : undefined;

    if (!selected) {
      if (version) {
        throw new Error(`Migration ${version} is not currently FAILED.`);
      }

      throw new Error(
        `Database has multiple failed migrations. Specify one explicitly: ${failedRows.map((row) => row.version).join(', ')}`
      );
    }

    const files = await migrationFiles();
    if (!files.includes(selected.version)) {
      throw new Error(`Failed migration ${selected.version} does not exist in the repository.`);
    }

    const sql = await readFile(
      new URL(`../migrations/${selected.version}`, import.meta.url),
      'utf8'
    );
    const digest = checksum(sql);

    await connection.execute(
      `UPDATE kernel_schema_migrations
          SET checksum = ?,
              status = 'APPLYING',
              applied_at = NULL,
              error_message = NULL
        WHERE version = ?
          AND status = 'FAILED'`,
      [digest, selected.version]
    );

    try {
      await connection.query(sql);
      await connection.execute(
        `UPDATE kernel_schema_migrations
            SET status = 'APPLIED',
                applied_at = CURRENT_TIMESTAMP(6),
                error_message = NULL
          WHERE version = ?`,
        [selected.version]
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await connection.execute(
        `UPDATE kernel_schema_migrations
            SET status = 'FAILED',
                error_message = ?
          WHERE version = ?`,
        [message.slice(0, 65000), selected.version]
      );
      throw error;
    }
  } finally {
    await connection.end();
  }

  return getMigrationStatus();
}
