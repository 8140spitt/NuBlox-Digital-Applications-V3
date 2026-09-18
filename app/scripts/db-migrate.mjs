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
    'SELECT migration_name AS name, checksum FROM schema_migrations ORDER BY migration_name'
  );
  const applied = new Map(rows.map((row) => [row.name, row.checksum]));

  for (const migration of migrations) {
    const existingChecksum = applied.get(migration.name);
    if (existingChecksum) {
      if (existingChecksum !== migration.checksum) {
        throw new Error(
          `Migration drift detected for ${migration.name}. Applied checksum differs from repository checksum.`
        );
      }
      console.log(`✓ ${migration.name} already applied`);
      continue;
    }

    console.log(`→ applying ${migration.name}`);
    await connection.query(migration.sql);
    await connection.execute(
      'INSERT INTO schema_migrations (migration_name, checksum) VALUES (?, ?)',
      [migration.name, migration.checksum]
    );
    console.log(`✓ applied ${migration.name}`);
  }

  console.log(`Database is current: ${migrations.length} migration(s).`);
} finally {
  await connection.end();
}
