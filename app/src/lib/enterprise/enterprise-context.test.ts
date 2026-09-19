import { describe, expect, it } from 'vitest';
import {
  clearEnterpriseContextHref,
  contextPreservingHref,
  decodeEnterpriseContextSelection,
  encodeEnterpriseContextSelection,
  parseEnterpriseContext,
  patchEnterpriseContextHref,
  resolveEnterpriseRuntimeContext
} from './enterprise-context';

describe('Enterprise Context Contract', () => {
  it('round-trips governed context selections', () => {
    const encoded = encodeEnterpriseContextSelection({
      id: 'project-id/1048',
      reference: 'P-1048',
      label: 'City Centre Redevelopment'
    });

    expect(decodeEnterpriseContextSelection(encoded)).toEqual({
      id: 'project-id/1048',
      reference: 'P-1048',
      label: 'City Centre Redevelopment'
    });
  });

  it('patches and clears context without losing unrelated query state', () => {
    const source = new URL('https://nublox.test/acme/app/deliver?view=active');
    const href = patchEnterpriseContextHref(source, {
      project: { id: 'project-1', reference: 'P-1048', label: 'Redevelopment' },
      contract: { id: 'contract-1', reference: 'C-1042', label: 'Main works' }
    });
    const target = new URL('https://nublox.test' + href);

    expect(target.searchParams.get('view')).toBe('active');
    expect(parseEnterpriseContext(target.searchParams).project?.reference).toBe('P-1048');
    expect(parseEnterpriseContext(target.searchParams).contract?.reference).toBe('C-1042');
    expect(clearEnterpriseContextHref(target)).toBe('/acme/app/deliver?view=active');
  });

  it('preserves context across tenant operational navigation but not administration', () => {
    const source = new URL(
      'https://nublox.test/acme/app/deliver?ctx.project=project-1~P-1048~Redevelopment'
    );

    const objectHref = contextPreservingHref(
      source,
      '/acme/app/objects/lead/lead-1?from=F06.09',
      'acme'
    );
    const objectUrl = new URL('https://nublox.test' + objectHref);
    expect(parseEnterpriseContext(objectUrl.searchParams).project?.reference).toBe('P-1048');

    expect(contextPreservingHref(source, '/acme/app/admin/security', 'acme')).toBe(
      '/acme/app/admin/security'
    );
    expect(contextPreservingHref(source, 'https://example.com/', 'acme')).toBe(
      'https://example.com/'
    );
  });

  it('resolves origin and canonical object identity separately from enterprise context', () => {
    const url = new URL(
      'https://nublox.test/acme/app/objects/lead/lead-1?from=F06.09&ctx.contract=contract-1~C-1042~Main%2520works'
    );
    const context = resolveEnterpriseRuntimeContext(url, 'acme');

    expect(context.originFunctionId).toBe('F06.09');
    expect(context.currentObject).toEqual({ type: 'lead', id: 'lead-1' });
    expect(context.dimensions.contract?.id).toBe('contract-1');
  });
});
