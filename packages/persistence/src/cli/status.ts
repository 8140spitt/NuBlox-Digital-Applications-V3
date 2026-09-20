import { getMigrationStatus } from '../migrations.js';

const statuses = await getMigrationStatus();

for (const migration of statuses) {
  console.log(
    [migration.version, migration.status, migration.appliedAt ?? '-', migration.errorMessage ?? '-'].join('\t')
  );
}
