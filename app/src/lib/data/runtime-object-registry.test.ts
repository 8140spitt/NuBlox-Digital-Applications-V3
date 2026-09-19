import { describe, expect, it } from 'vitest';
import {
  objectHref,
  runtimeObjectDefinition,
  runtimeObjectDefinitionForSubject,
  subjectObjectHref,
  validateRuntimeObjectRegistry
} from './runtime-object-registry';

describe('runtime object registry', () => {
  it('is valid and resolves canonical Party and Lead definitions', () => {
    expect(validateRuntimeObjectRegistry()).toBe(true);
    expect(runtimeObjectDefinition('PARTY')?.canonicalModelId).toBe('CBO-PARTY');
    expect(runtimeObjectDefinitionForSubject('party')?.aggregateId).toBe('AGG-01-PARTY');
    expect(runtimeObjectDefinition('LEAD')?.canonicalModelId).toBe('CRM-LEAD');
    expect(runtimeObjectDefinitionForSubject('lead')?.aggregateId).toBe('AGG-03-LEAD');
  });

  it('builds stable encoded canonical object URLs', () => {
    expect(objectHref('demo-tenant', 'party', 'party id')).toBe(
      '/demo-tenant/app/objects/party/party%20id'
    );
    expect(objectHref('demo-tenant', 'lead', 'id with/slash')).toBe(
      '/demo-tenant/app/objects/lead/id%20with%2Fslash'
    );
    expect(objectHref('demo-tenant', 'lead', '123', { section: 'history', from: 'F06.09' })).toBe(
      '/demo-tenant/app/objects/lead/123?section=history&from=F06.09'
    );
  });

  it('keeps subject links on the same canonical object identity across sections', () => {
    expect(subjectObjectHref('demo-tenant', 'PARTY', '456', { section: 'relationships' })).toBe(
      '/demo-tenant/app/objects/party/456?section=relationships'
    );
    expect(subjectObjectHref('demo-tenant', 'LEAD', '123', { section: 'work' })).toBe(
      '/demo-tenant/app/objects/lead/123?section=work'
    );
    expect(objectHref('demo-tenant', 'lead', '123', { section: 'overview' })).toBe(
      '/demo-tenant/app/objects/lead/123'
    );
  });

  it('returns null for subjects that have not joined the runtime registry yet', () => {
    expect(subjectObjectHref('demo-tenant', 'UNKNOWN', '1')).toBeNull();
  });
});
