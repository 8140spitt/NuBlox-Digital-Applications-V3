import { createHash } from 'node:crypto';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

export const RESERVED_TENANT_SLUGS = new Set([
  'api',
  'app',
  'assets',
  'auth',
  'candidate',
  'careers',
  'docs',
  'functions',
  'industries',
  'legal',
  'login',
  'logout',
  'pricing',
  'privacy',
  'register',
  'support',
  'terms'
]);

const TENANT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/;

interface TenantRouteRow extends RowDataPacket {
  id: string;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface TenantRoute {
  tenantId: TenantId;
  slug: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

function slugBase(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function normaliseTenantSlug(value: string): string {
  const slug = slugBase(value).slice(0, 80).replace(/-+$/g, '');

  if (!TENANT_SLUG_PATTERN.test(slug)) {
    throw new Error('Tenant slug must contain 3-80 lowercase letters, numbers or hyphens.');
  }
  if (RESERVED_TENANT_SLUGS.has(slug)) {
    throw new Error('Tenant slug is reserved by NuBlox.');
  }

  return slug;
}

export function deriveTenantSlug(name: string, tenantId: string): string {
  let base = slugBase(name);
  if (!base || RESERVED_TENANT_SLUGS.has(base)) base = 'tenant';

  const suffix = createHash('sha256').update(tenantId).digest('hex').slice(0, 8);
  const maxBase = 80 - suffix.length - 1;
  base = base.slice(0, maxBase).replace(/-+$/g, '');
  if (base.length < 2) base = 'tenant';

  return `${base}-${suffix}`;
}

function mapTenantRoute(row: TenantRouteRow): TenantRoute {
  return {
    tenantId: row.id as TenantId,
    slug: row.slug,
    name: row.name,
    status: row.status
  };
}

export class MySqlTenantRoutingRepository {
  constructor(private readonly pool: Pool) {}

  async findBySlug(slugValue: string): Promise<TenantRoute | undefined> {
    const slug = slugValue.trim().toLowerCase();
    if (!TENANT_SLUG_PATTERN.test(slug)) return undefined;

    const [rows] = await this.pool.execute<TenantRouteRow[]>(
      `SELECT id, slug, name, status
         FROM tenants
        WHERE slug = ?
        LIMIT 1`,
      [slug]
    );

    return rows[0] ? mapTenantRoute(rows[0]) : undefined;
  }

  async findActiveBySlug(slugValue: string): Promise<TenantRoute | undefined> {
    const route = await this.findBySlug(slugValue);
    return route?.status === 'ACTIVE' ? route : undefined;
  }

  async findByTenantId(tenantId: TenantId | string): Promise<TenantRoute | undefined> {
    const [rows] = await this.pool.execute<TenantRouteRow[]>(
      `SELECT id, slug, name, status
         FROM tenants
        WHERE id = ?
        LIMIT 1`,
      [tenantId]
    );

    return rows[0] ? mapTenantRoute(rows[0]) : undefined;
  }

  async slugAvailable(slugValue: string): Promise<boolean> {
    const slug = normaliseTenantSlug(slugValue);
    const [rows] = await this.pool.execute<Array<RowDataPacket & { count: number }>>(
      'SELECT COUNT(*) AS count FROM tenants WHERE slug = ?',
      [slug]
    );
    return (rows[0]?.count ?? 0) === 0;
  }
}
