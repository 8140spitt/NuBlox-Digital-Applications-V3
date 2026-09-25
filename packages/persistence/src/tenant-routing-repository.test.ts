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

  it('derives compact human tenant routes without exposing Tenant IDs', () => {
    expect(deriveTenantSlug('BAE Systems')).toBe('baesystems');
    expect(deriveTenantSlug('Example Business')).toBe('examplebusiness');
    expect(deriveTenantSlug('North & West Design')).toBe('northandwestdesign');
    expect(deriveTenantSlug('Example Business', 2)).toBe('examplebusiness-2');
    expect(deriveTenantSlug('Example Business', 3)).toBe('examplebusiness-3');
  });
});
