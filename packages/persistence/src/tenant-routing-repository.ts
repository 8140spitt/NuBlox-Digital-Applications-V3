import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

export const RESERVED_TENANT_SLUGS = new Set([
  'about',
  'api',
  'app',
  'assets',
  'auth',
  'candidate',
  'careers',
  'contact',
  'docs',
  'enterprise',
  'functions',
  'industries',
  'legal',
  'login',
  'logout',
  'platform',
  'pricing',
  'privacy',
  'product',
  'public',
  'register',
  'security',
  'status',
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

interface CountRow extends RowDataPacket {
  count: number;
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

function derivedSlugBase(value: string): string {
  let base = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');

  if (!base) base = 'tenant';
  if (RESERVED_TENANT_SLUGS.has(base)) base = `tenant${base}`;
  if (base.length < 3) base = `tenant${base}`;

  return base.slice(0, 80);
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

/**
 * Derives a human tenant route from the business name only.
 *
 * Internal Tenant IDs must never be encoded into the public/private route.
 * Sequence 1 is the clean business slug; later sequences are collision fallbacks.
 */
export function deriveTenantSlug(name: string, sequence = 1): string {
  if (!Number.isInteger(sequence) || sequence < 1) {
    throw new Error('Tenant slug sequence must be a positive integer.');
  }

  const base = derivedSlugBase(name);
  if (sequence === 1) return base;

  const suffix = `-${sequence}`;
  const candidate = `${base.slice(0, 80 - suffix.length)}${suffix}`;

  if (!TENANT_SLUG_PATTERN.test(candidate) || RESERVED_TENANT_SLUGS.has(candidate)) {
    throw new Error('Unable to derive a valid Tenant slug.');
  }

  return candidate;
}

export async function allocateTenantSlug(
  connection: PoolConnection,
  name: string
): Promise<string> {
  for (let sequence = 1; sequence <= 10_000; sequence += 1) {
    const candidate = deriveTenantSlug(name, sequence);
    const [rows] = await connection.execute<CountRow[]>(
      'SELECT COUNT(*) AS count FROM tenants WHERE slug = ?',
      [candidate]
    );
    if ((rows[0]?.count ?? 0) === 0) return candidate;
  }

  throw new Error('No available Tenant slug could be allocated for this business name.');
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
