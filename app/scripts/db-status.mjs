import {
  ensureMigrationLedger,
  migrationConnection,
  readMigrations
} from './db-migration-lib.mjs';

const useTestDatabase = process.argv.includes('--test');
const connection = await migrationConnection(useTestDatabase);

try {
  await ensureMigrationLedger(connection);
  const migrations = await readMigrations();
  const [rows] = await connection.query(
    'SELECT migration_name AS name, checksum, applied_at AS appliedAt FROM schema_migrations ORDER BY migration_name'
  );
  const applied = new Map(rows.map((row) => [row.name, row]));

  let pending = 0;
  let drift = 0;

  for (const migration of migrations) {
    const row = applied.get(migration.name);
    if (!row) {
      pending += 1;
      console.log(`PENDING  ${migration.name}`);
    } else if (row.checksum !== migration.checksum) {
      drift += 1;
      console.log(`DRIFT    ${migration.name}`);
    } else {
      console.log(`APPLIED  ${migration.name}  ${String(row.appliedAt)}`);
    }
  }

  for (const row of rows) {
    if (!migrations.some((migration) => migration.name === row.name)) {
      drift += 1;
      console.log(`UNKNOWN  ${row.name} (applied in database but missing from repository)`);
    }
  }

  console.log(`\nApplied: ${rows.length} · Pending: ${pending} · Drift/unknown: ${drift}`);
  if (pending || drift) process.exitCode = 1;
} finally {
  await connection.end();
}
