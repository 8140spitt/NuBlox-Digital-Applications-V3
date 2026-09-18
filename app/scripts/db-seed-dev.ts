process.env.NODE_ENV = 'development';

const tenantSlug =
  process.argv.slice(2).find((argument) => argument !== '--') ??
  process.env.NUBLOX_DEV_TENANT ??
  'demo';
const { seedDevelopmentTenant } = await import('../src/lib/server/development-seed.ts');
const { closeDbPool } = await import('../src/lib/server/db.ts');

try {
  const result = await seedDevelopmentTenant(tenantSlug);
  console.log(`Development tenant seeded: ${result.tenantSlug} (${result.tenantId})`);
} finally {
  await closeDbPool();
}
