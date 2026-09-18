import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import mysql from 'mysql2/promise';
import { readMigrations } from './db-migration-lib.mjs';

const source = process.env.NUBLOX_TEST_DATABASE_URL;
if (!source) throw new Error('NUBLOX_TEST_DATABASE_URL is required for migration integration tests.');

const base = new URL(source);
const originalDatabase = decodeURIComponent(base.pathname.replace(/^\//, ''));
if (!/(^|[_-])test([_-]|$)/i.test(originalDatabase)) {
  throw new Error('NUBLOX_TEST_DATABASE_URL must target a database whose name contains a standalone test segment.');
}

const temporaryDatabase = 'nublox_migration_test_' + randomUUID().replaceAll('-', '').slice(0, 12);
const admin = await mysql.createConnection({
  host: base.hostname,
  port: base.port ? Number(base.port) : 3306,
  user: decodeURIComponent(base.username),
  password: decodeURIComponent(base.password),
  ssl: process.env.MYSQL_SSL === 'true' ? {} : undefined,
  multipleStatements: true
});
const escapedDatabase = temporaryDatabase.replaceAll('`', '``');
const tempUrl = new URL(base);
tempUrl.pathname = '/' + temporaryDatabase;

async function migrate(connection, migrations) {
  await connection.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (' +
    'migration_name VARCHAR(255) PRIMARY KEY, ' +
    'checksum CHAR(64) NOT NULL, ' +
    'applied_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)' +
    ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci'
  );
  const [rows] = await connection.query('SELECT migration_name AS name, checksum FROM schema_migrations');
  const applied = new Map(rows.map((row) => [row.name, row.checksum]));
  for (const migration of migrations) {
    const checksum = applied.get(migration.name);
    if (checksum && checksum !== migration.checksum) throw new Error('Migration drift: ' + migration.name);
    if (checksum) continue;
    await connection.query(migration.sql);
    await connection.execute(
      'INSERT INTO schema_migrations (migration_name, checksum) VALUES (?, ?)',
      [migration.name, migration.checksum]
    );
  }
}

function runServiceTests() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
      ['exec', 'vitest', 'run',
        'src/lib/server/platform-foundation.test.ts',
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
  await admin.query('CREATE DATABASE `' + escapedDatabase + '` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
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
    await migrate(connection, migrations);
    await migrate(connection, migrations);

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
  await admin.query('DROP DATABASE IF EXISTS `' + escapedDatabase + '`');
  await admin.end();
}
