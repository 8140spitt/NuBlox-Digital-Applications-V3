const { assertDatabaseReady, closeDbPool, dbTransaction } = await import('../src/lib/server/db.ts');
const { platformPermissions, seedPermissionDefinitions } =
  await import('../src/lib/server/platform-context.ts');

try {
  await assertDatabaseReady();
  let synchronizedRoleCount = 0;
  let addedGrantCount = 0;

  await dbTransaction(async (connection) => {
    await seedPermissionDefinitions(connection);

    const [rows] = await connection.execute(
      "SELECT id FROM role_definitions WHERE role_key = 'tenant-admin' AND status = 'ACTIVE'"
    );
    const tenantAdminRoles = rows as Array<{ id: string }>;
    synchronizedRoleCount = tenantAdminRoles.length;

    for (const role of tenantAdminRoles) {
      for (const [permissionKey] of platformPermissions) {
        const [result] = await connection.execute(
          'INSERT IGNORE INTO role_permissions (role_id, permission_key) VALUES (?, ?)',
          [role.id, permissionKey]
        );
        addedGrantCount += Number((result as { affectedRows?: number }).affectedRows ?? 0);
      }
    }
  });

  console.log(
    `Platform permission catalog seeded: ${platformPermissions.length} definition(s); ` +
      `${synchronizedRoleCount} active tenant-admin role(s) synchronized; ` +
      `${addedGrantCount} missing grant(s) added.`
  );
} finally {
  await closeDbPool();
}
