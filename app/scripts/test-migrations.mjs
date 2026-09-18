import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { applyMigrations, readMigrations } from './db-migration-lib.mjs';

const source = process.env.NUBLOX_TEST_DATABASE_URL;
if (!source)
  throw new Error('NUBLOX_TEST_DATABASE_URL is required for migration integration tests.');
const adminSource = process.env.NUBLOX_TEST_ADMIN_DATABASE_URL ?? source;

const base = new URL(source);
const adminBase = new URL(adminSource);
const originalDatabase = decodeURIComponent(base.pathname.replace(/^\//, ''));
if (!/(^|[_-])test([_-]|$)/i.test(originalDatabase)) {
  throw new Error(
    'NUBLOX_TEST_DATABASE_URL must target a database whose name contains a standalone test segment.'
  );
}

const temporaryDatabase = 'nublox_migration_test_' + randomUUID().replaceAll('-', '').slice(0, 12);
const admin = await mysql.createConnection({
  host: adminBase.hostname,
  port: adminBase.port ? Number(adminBase.port) : 3306,
  user: decodeURIComponent(adminBase.username),
  password: decodeURIComponent(adminBase.password),
  ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
  multipleStatements: true
});
const escapedDatabase = temporaryDatabase.replaceAll('`', '``');
let temporaryDatabaseCreated = false;
let temporaryGrantCreated = false;
let appAccount = null;
const tempUrl = new URL(base);
tempUrl.pathname = '/' + temporaryDatabase;

function runServiceTests() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      [
        'exec',
        'vitest',
        'run',
        'src/lib/server/platform-foundation.test.ts',
        'src/lib/server/authentication.test.ts',
        'src/lib/server/foundation-shared-context.test.ts',
        'src/lib/server/classification-runtime.test.ts',
        'src/lib/server/lifecycle-configuration.test.ts',
        'src/lib/server/authority-configuration.test.ts',
        'src/lib/server/reference-data.test.ts',
        'src/lib/server/strategy-framework.test.ts',
        'src/lib/server/business-object-review.test.ts',
        '--fileParallelism=false',
        '--maxWorkers=1'
      ],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          NUBLOX_TEST_DATABASE_URL: tempUrl.toString(),
          BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? 'http://127.0.0.1:5173'
        }
      }
    );
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(new Error('Service integration tests exited with code ' + code + '.'))
    );
  });
}

try {
  const appProbe = await mysql.createConnection({
    host: base.hostname,
    port: base.port ? Number(base.port) : 3306,
    user: decodeURIComponent(base.username),
    password: decodeURIComponent(base.password),
    database: originalDatabase,
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined
  });
  try {
    const [accountRows] = await appProbe.query('SELECT CURRENT_USER() AS currentUser');
    const currentUser = String(accountRows[0]?.currentUser ?? '');
    const separator = currentUser.lastIndexOf('@');
    if (separator <= 0 || separator === currentUser.length - 1) {
      throw new Error('Could not resolve the existing MySQL application account.');
    }
    appAccount = { user: currentUser.slice(0, separator), host: currentUser.slice(separator + 1) };
  } finally {
    await appProbe.end();
  }

  try {
    await admin.query(
      'CREATE DATABASE `' + escapedDatabase + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci'
    );
    temporaryDatabaseCreated = true;
  } catch (error) {
    if (
      error?.code === 'ER_DBACCESS_DENIED_ERROR' ||
      error?.code === 'ER_SPECIFIC_ACCESS_DENIED_ERROR'
    ) {
      throw new Error(
        'Clean migration tests require NUBLOX_TEST_ADMIN_DATABASE_URL to use a test-only MySQL account with CREATE/DROP DATABASE privileges. The application database user should remain unprivileged.'
      );
    }
    throw error;
  }
  const accountUser = appAccount.user.replaceAll("'", "''");
  const accountHost = appAccount.host.replaceAll("'", "''");
  await admin.query(
    'GRANT ALL PRIVILEGES ON `' +
      escapedDatabase +
      "`.* TO '" +
      accountUser +
      "'@'" +
      accountHost +
      "'"
  );
  temporaryGrantCreated = true;

  const connection = await mysql.createConnection({
    host: base.hostname,
    port: base.port ? Number(base.port) : 3306,
    user: decodeURIComponent(base.username),
    password: decodeURIComponent(base.password),
    database: temporaryDatabase,
    ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
    multipleStatements: true
  });
  try {
    const migrations = await readMigrations();
    await applyMigrations(connection, { log: null });
    await applyMigrations(connection, { log: null });

    const [ledger] = await connection.query(
      'SELECT migration_name AS name, checksum FROM schema_migrations ORDER BY migration_name'
    );
    if (ledger.length !== migrations.length)
      throw new Error('Migration ledger count does not match repository migration count.');
    for (let index = 0; index < migrations.length; index += 1) {
      if (
        ledger[index].name !== migrations[index].name ||
        ledger[index].checksum !== migrations[index].checksum
      ) {
        throw new Error('Migration ledger mismatch at ' + migrations[index].name + '.');
      }
    }

    const [attempts] = await connection.query(
      'SELECT migration_name AS name, status FROM schema_migration_attempts ORDER BY migration_name'
    );
    if (
      attempts.length !== migrations.length ||
      attempts.some((attempt) => attempt.status !== 'APPLIED')
    ) {
      throw new Error('Migration attempt ledger is not fully APPLIED.');
    }

    await connection.execute(
      "INSERT INTO schema_migration_attempts (migration_name, checksum, status, error_message) VALUES ('9999_dirty_state_probe.sql', ?, 'FAILED', 'intentional test probe')",
      ['0'.repeat(64)]
    );
    let dirtyBlocked = false;
    try {
      await applyMigrations(connection, { log: null });
    } catch (error) {
      dirtyBlocked = /migration state is dirty/i.test(
        error instanceof Error ? error.message : String(error)
      );
    }
    if (!dirtyBlocked) throw new Error('Dirty migration state did not block migration execution.');
    await connection.execute(
      "DELETE FROM schema_migration_attempts WHERE migration_name = '9999_dirty_state_probe.sql'"
    );
  } finally {
    await connection.end();
  }

  await runServiceTests();
  console.log(
    'Clean migration, repeat execution, ledger status and migrated-schema service tests passed.'
  );
} finally {
  try {
    try {
      if (temporaryGrantCreated && appAccount) {
        const accountUser = appAccount.user.replaceAll("'", "''");
        const accountHost = appAccount.host.replaceAll("'", "''");
        await admin.query(
          'REVOKE ALL PRIVILEGES ON `' +
            escapedDatabase +
            "`.* FROM '" +
            accountUser +
            "'@'" +
            accountHost +
            "'"
        );
      }
    } finally {
      if (temporaryDatabaseCreated) {
        await admin.query('DROP DATABASE IF EXISTS `' + escapedDatabase + '`');
      }
    }
  } finally {
    await admin.end();
  }
}
