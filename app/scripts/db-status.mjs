import {
  ensureMigrationLedger,
  migrationConnection,
  readDirtyMigrationAttempts,
  readMigrations
} from './db-migration-lib.mjs';

const useTestDatabase = process.argv.includes('--test');
const connection = await migrationConnection(useTestDatabase);

try {
  await ensureMigrationLedger(connection);
  const migrations = await readMigrations();
  const dirtyRows = await readDirtyMigrationAttempts(connection);
  const dirty = new Map(dirtyRows.map((row) => [row.name, row]));
  const [rows] = await connection.query(
    'SELECT migration_name AS name, checksum, applied_at AS appliedAt FROM schema_migrations ORDER BY migration_name'
  );
  const applied = new Map(rows.map((row) => [row.name, row]));

  let pending = 0;
  let drift = 0;

  for (const migration of migrations) {
    const row = applied.get(migration.name);
    const dirtyRow = dirty.get(migration.name);
    if (row) {
      if (row.checksum !== migration.checksum) {
        drift += 1;
        console.log(`DRIFT    ${migration.name}`);
      } else {
        console.log(`APPLIED  ${migration.name}  ${String(row.appliedAt)}`);
      }
    } else if (dirtyRow) {
      console.log(`DIRTY    ${migration.name}  ${dirtyRow.status}  ${String(dirtyRow.startedAt)}`);
    } else {
      pending += 1;
      console.log(`PENDING  ${migration.name}`);
    }
  }

  for (const row of rows) {
    if (!migrations.some((migration) => migration.name === row.name)) {
      drift += 1;
      console.log(`UNKNOWN  ${row.name} (applied in database but missing from repository)`);
    }
  }

  for (const row of dirtyRows) {
    if (!migrations.some((migration) => migration.name === row.name)) {
      console.log(`DIRTY    ${row.name}  ${row.status}  (attempt not present in repository)`);
    }
  }

  console.log(
    `\nApplied: ${rows.length} · Pending: ${pending} · Dirty: ${dirtyRows.length} · Drift/unknown: ${drift}`
  );
  if (pending || dirtyRows.length || drift) process.exitCode = 1;
} finally {
  await connection.end();
}
