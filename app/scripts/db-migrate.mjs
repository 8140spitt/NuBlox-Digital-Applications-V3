import { applyMigrations, migrationConnection } from './db-migration-lib.mjs';

const useTestDatabase = process.argv.includes('--test');
const connection = await migrationConnection(useTestDatabase);

try {
  const migrations = await applyMigrations(connection);
  console.log(`Database is current: ${migrations.length} migration(s).`);
} finally {
  await connection.end();
}
