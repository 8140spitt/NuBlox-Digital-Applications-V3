import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readMigrations } from './db-migration-lib.mjs';

const migrations = await readMigrations();
if (!migrations.length) throw new Error('No database migrations found.');

const names = migrations.map((migration) => migration.name);
const expected = [...names].sort();
if (names.join('\n') !== expected.join('\n')) throw new Error('Migration ordering is not deterministic.');

for (let index = 0; index < names.length; index += 1) {
  const prefix = String(index + 1).padStart(4, '0') + '_';
  if (!names[index].startsWith(prefix)) {
    throw new Error('Migration sequence gap: expected ' + prefix + '..., found ' + names[index] + '.');
  }
  if (!migrations[index].sql.trim()) throw new Error('Migration ' + names[index] + ' is empty.');
}

const serverRoot = resolve(process.cwd(), 'src', 'lib', 'server');
const runtimeFiles = (await readdir(serverRoot)).filter((name) => /\.(ts|js|mjs)$/.test(name));
const ddlPattern = /\b(?:CREATE|ALTER|DROP|TRUNCATE)\s+TABLE\b/i;
for (const name of runtimeFiles) {
  const file = await readFile(resolve(serverRoot, name), 'utf8');
  if (ddlPattern.test(file)) throw new Error('Runtime DDL is forbidden: src/lib/server/' + name);
}

console.log('Migration validation passed: ' + migrations.length + ' ordered migration(s), no runtime table DDL.');
