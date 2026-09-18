process.env.NUBLOX_AUTH_BOOTSTRAP = 'true';
process.env.NUBLOX_ALLOW_PUBLIC_SIGNUP = 'true';

const tenantSlug = process.env.NUBLOX_BOOTSTRAP_TENANT?.trim();
const tenantDisplayName = process.env.NUBLOX_BOOTSTRAP_TENANT_NAME?.trim();
const email = process.env.NUBLOX_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const password = process.env.NUBLOX_BOOTSTRAP_PASSWORD ?? '';
const displayName = process.env.NUBLOX_BOOTSTRAP_NAME?.trim();

if (!tenantSlug || !tenantDisplayName || !email || !displayName || password.length < 12) {
  throw new Error(
    'Set NUBLOX_BOOTSTRAP_TENANT, NUBLOX_BOOTSTRAP_TENANT_NAME, NUBLOX_BOOTSTRAP_EMAIL, NUBLOX_BOOTSTRAP_NAME and NUBLOX_BOOTSTRAP_PASSWORD (12+ characters).'
  );
}

const { auth } = await import('../src/lib/server/auth.ts');
const { bootstrapTenantAdministrator } = await import('../src/lib/server/platform-bootstrap.ts');
const { closeDbPool, queryOne } = await import('../src/lib/server/db.ts');

try {
  let authUser = await queryOne('SELECT id, name, email FROM `user` WHERE email = ? LIMIT 1', [
    email
  ]);

  if (!authUser) {
    await auth.api.signUpEmail({
      body: { email, password, name: displayName }
    });
    authUser = await queryOne('SELECT id, name, email FROM `user` WHERE email = ? LIMIT 1', [
      email
    ]);
  }

  if (!authUser?.id) throw new Error('Authentication account could not be created or resolved.');

  const result = await bootstrapTenantAdministrator({
    tenantSlug,
    tenantDisplayName,
    authUserId: String(authUser.id),
    displayName
  });

  console.log(
    `Tenant administrator ready: ${result.tenantSlug} · ${email} · ${result.changed ? 'platform authority updated' : 'already current'}`
  );
} finally {
  await closeDbPool();
}
