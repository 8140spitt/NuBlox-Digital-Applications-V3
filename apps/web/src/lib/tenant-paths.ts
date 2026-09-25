export const TENANT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

export interface TenantApplicationPath {
  tenantSlug: string;
  internalPath: string;
}

export function parseTenantApplicationPath(pathname: string): TenantApplicationPath | null {
  const match = pathname.match(/^\/([a-z0-9][a-z0-9-]{1,78}[a-z0-9])\/app(?:\/(.*))?\/?$/);
  if (!match?.[1]) return null;

  const suffix = match[2] ? `/${match[2]}` : '';
  return {
    tenantSlug: match[1],
    internalPath: `/app${suffix}`.replace(/\/$/, '') || '/app'
  };
}

export function tenantAppPath(tenantSlug: string, internalPath = '/app'): string {
  const suffix = internalPath === '/app'
    ? ''
    : internalPath.startsWith('/app/')
      ? internalPath.slice('/app'.length)
      : internalPath.startsWith('/')
        ? internalPath
        : `/${internalPath}`;

  return `/${tenantSlug}/app${suffix}`;
}

export function tenantSignInPath(tenantSlug: string): string {
  return `/${tenantSlug}/app/auth/sign-in`;
}

export function tenantSignOutPath(tenantSlug: string): string {
  return `/${tenantSlug}/app/auth/sign-out`;
}

export function tenantPublicPath(tenantSlug: string, path = ''): string {
  const suffix = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `/${tenantSlug}/public${suffix}`;
}

