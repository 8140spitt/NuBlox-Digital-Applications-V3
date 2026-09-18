import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let auth: typeof import('./auth').auth;
let db: typeof import('./db');
let bootstrap: typeof import('./platform-bootstrap');
let context: typeof import('./platform-context');

beforeAll(async () => {
  process.env.NUBLOX_AUTH_BOOTSTRAP = 'true';
  process.env.NUBLOX_ALLOW_PUBLIC_SIGNUP = 'true';
  auth = (await import('./auth')).auth;
  db = await import('./db');
  bootstrap = await import('./platform-bootstrap');
  context = await import('./platform-context');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('production authentication and tenant authority integration', () => {
  it('creates an authentication account and resolves it through a tenant-scoped NuBlox identity', async () => {
    const suffix = randomUUID().slice(0, 8);
    const email = `administrator-${suffix}@nublox.test`;
    const password = 'NuBlox-Test-Authority-2026!';
    const tenantSlug = 'auth-' + suffix;

    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: 'Authentication Administrator'
      }
    });

    const authUser = await db.queryOne<any>(
      'SELECT id, email FROM `user` WHERE email = ? LIMIT 1',
      [email]
    );
    expect(authUser?.id).toBeTruthy();

    const result = await bootstrap.bootstrapTenantAdministrator({
      tenantSlug,
      tenantDisplayName: 'Authentication Test Tenant',
      authUserId: authUser.id,
      displayName: 'Authentication Administrator',
      givenName: 'Authentication',
      familyName: 'Administrator'
    });
    expect(result.changed).toBe(true);

    const commandContext = await context.resolveContextForAuthUser(tenantSlug, authUser.id);
    expect(commandContext.roleKeys).toContain('tenant-admin');
    expect(commandContext.permissions).toContain('tenant.identity.manage');
    expect(commandContext.permissions).toContain('tenant.role.manage');

    const signIn = await auth.api.signInEmail({
      body: { email, password, rememberMe: false }
    });
    expect(signIn.user.email).toBe(email);

    const secondBootstrap = await bootstrap.bootstrapTenantAdministrator({
      tenantSlug,
      tenantDisplayName: 'Authentication Test Tenant',
      authUserId: authUser.id,
      displayName: 'Authentication Administrator'
    });
    expect(secondBootstrap.changed).toBe(false);

    const evidence = await db.queryRows<any>(
      "SELECT action FROM platform_audit_events WHERE tenant_id = ? AND action = 'TENANT_ADMINISTRATOR_BOOTSTRAPPED'",
      [commandContext.tenantId]
    );
    expect(evidence).toHaveLength(1);
  });
});
