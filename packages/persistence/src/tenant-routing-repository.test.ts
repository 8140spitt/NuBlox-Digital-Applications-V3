import { describe, expect, it } from 'vitest';
import {
  RESERVED_TENANT_SLUGS,
  deriveTenantSlug,
  normaliseTenantSlug
} from './tenant-routing-repository.js';

describe('tenant routing', () => {
  it('normalises human tenant names into URL-safe slugs', () => {
    expect(normaliseTenantSlug('Spittal Construction Limited')).toBe(
      'spittal-construction-limited'
    );
    expect(normaliseTenantSlug('  North & West Design  ')).toBe(
      'north-and-west-design'
    );
  });

  it('rejects NuBlox-reserved platform paths', () => {
    expect(RESERVED_TENANT_SLUGS.has('app')).toBe(true);
    expect(() => normaliseTenantSlug('app')).toThrow('reserved');
    expect(() => normaliseTenantSlug('x')).toThrow('3-80');
  });

  it('derives a deterministic unique-safe fallback from immutable tenant identity', () => {
    const slug = deriveTenantSlug('Example Business', 'TENANT-123');
    expect(slug).toMatch(/^example-business-[a-f0-9]{8}$/);
    expect(deriveTenantSlug('Example Business', 'TENANT-123')).toBe(slug);
    expect(deriveTenantSlug('Example Business', 'TENANT-456')).not.toBe(slug);
  });
});
