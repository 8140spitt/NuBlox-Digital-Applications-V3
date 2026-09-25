import { retryFailedMigration } from '../migrations.js';

const version = process.argv[2]?.trim() || undefined;
const statuses = await retryFailedMigration(version);

for (const migration of statuses) {
  console.log(
    [
      migration.version,
      migration.status,
      migration.repositoryChecksumChanged ? 'REPOSITORY_CHANGED' : '-',
      migration.appliedAt ?? '-',
      migration.errorMessage ?? '-'
    ].join('\t')
  );
}
