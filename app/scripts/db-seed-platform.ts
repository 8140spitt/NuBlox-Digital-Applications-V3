const { assertDatabaseReady, closeDbPool, dbTransaction } = await import('../src/lib/server/db.ts');
const { platformPermissions, seedPermissionDefinitions } = await import(
  '../src/lib/server/platform-context.ts'
);

try {
  await assertDatabaseReady();
  await dbTransaction(async (connection) => {
    await seedPermissionDefinitions(connection);
  });
  console.log(`Platform permission catalog seeded: ${platformPermissions.length} definition(s).`);
} finally {
  await closeDbPool();
}
