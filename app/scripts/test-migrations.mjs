import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { applyMigrations, readMigrations } from './db-migration-lib.mjs';

const source = process.env.NUBLOX_TEST_DATABASE_URL;
if (!source) throw new Error('NUBLOX_TEST_DATABASE_URL is required for migration integration tests.');
const adminSource = process.env.NUBLOX_TEST_ADMIN_DATABASE_URL ?? source;

const base = new URL(source);
const adminBase = new URL(adminSource);
const originalDatabase = decodeURIComponent(base.pathname.replace(/^\//, ''));
if (!/(^|[_-])test([_-]|$)/i.test(originalDatabase)) {
  throw new Error('NUBLOX_TEST_DATABASE_URL must target a database whose name contains a standalone test segment.');
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
const tempUrl = new URL(adminBase);
tempUrl.pathname = '/' + temporaryDatabase;


function runServiceTests() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'vitest', 'run',
        'src/lib/server/platform-foundation.test.ts',
        'src/lib/server/authentication.test.ts',
        'src/lib/server/foundation-shared-context.test.ts',
        'src/lib/server/strategy-framework.test.ts',
        'src/lib/server/business-object-review.test.ts'],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'test', NUBLOX_TEST_DATABASE_URL: tempUrl.toString() }
      }
    );
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error('Service integration tests exited with code ' + code + '.')));
  });
}

try {
  try {
    await admin.query('CREATE DATABASE `' + escapedDatabase + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    temporaryDatabaseCreated = true;
  } catch (error) {
    if (error?.code === 'ER_DBACCESS_DENIED_ERROR' || error?.code === 'ER_SPECIFIC_ACCESS_DENIED_ERROR') {
      throw new Error(
        'Clean migration tests require NUBLOX_TEST_ADMIN_DATABASE_URL to use a test-only MySQL account with CREATE/DROP DATABASE privileges. The application database user should remain unprivileged.'
      );
    }
    throw error;
  }
  const connection = await mysql.createConnection({
    host: adminBase.hostname,
    port: adminBase.port ? Number(adminBase.port) : 3306,
    user: decodeURIComponent(adminBase.username),
    password: decodeURIComponent(adminBase.password),
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
    if (ledger.length !== migrations.length) throw new Error('Migration ledger count does not match repository migration count.');
    for (let index = 0; index < migrations.length; index += 1) {
      if (ledger[index].name !== migrations[index].name || ledger[index].checksum !== migrations[index].checksum) {
        throw new Error('Migration ledger mismatch at ' + migrations[index].name + '.');
      }
    }
  } finally {
    await connection.end();
  }

  await runServiceTests();
  console.log('Clean migration, repeat execution, ledger status and migrated-schema service tests passed.');
} finally {
  try {
    if (temporaryDatabaseCreated) {
      await admin.query('DROP DATABASE IF EXISTS `' + escapedDatabase + '`');
    }
  } finally {
    await admin.end();
  }
}
