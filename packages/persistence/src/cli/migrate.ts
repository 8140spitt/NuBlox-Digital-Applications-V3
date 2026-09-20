import { migrate } from '../migrations.js';

const statuses = await migrate();

for (const migration of statuses) {
  console.log(`${migration.version}\t${migration.status}`);
}
