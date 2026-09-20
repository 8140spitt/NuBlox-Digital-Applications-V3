import { describe, expect, it } from 'vitest';
import {
  objectHref,
  runtimeObjectDefinition,
  runtimeObjectDefinitionForSubject,
  subjectObjectHref,
  validateRuntimeObjectRegistry
} from './runtime-object-registry';

describe('runtime object registry', () => {
  it('is valid and resolves canonical enterprise object definitions', () => {
    expect(validateRuntimeObjectRegistry()).toBe(true);
    expect(runtimeObjectDefinition('PARTY')?.canonicalModelId).toBe('CBO-PARTY');
    expect(runtimeObjectDefinitionForSubject('party')?.aggregateId).toBe('AGG-01-PARTY');
    expect(runtimeObjectDefinition('party')?.sections).toContain('relationships');
    expect(runtimeObjectDefinition('STRATEGY-FRAMEWORK')?.canonicalModelId).toBe(
      'SGP-STRATEGY-FRAMEWORK'
    );
    expect(runtimeObjectDefinitionForSubject('STRATEGY_FRAMEWORK')?.aggregateId).toBe(
      'AGG-02-STRATEGY'
    );
    expect(runtimeObjectDefinition('STRATEGIC-OBJECTIVE')?.canonicalModelId).toBe(
      'SGP-STRATEGIC-OBJECTIVE'
    );
    expect(runtimeObjectDefinitionForSubject('STRATEGIC_OBJECTIVE')?.aggregateId).toBe(
      'AGG-02-OBJECTIVE'
    );
    expect(runtimeObjectDefinition('INFORMATION-CONTAINER')?.canonicalModelId).toBe(
      'CBO-INFORMATION-CONTAINER'
    );
    expect(runtimeObjectDefinitionForSubject('INFORMATION_CONTAINER')?.aggregateId).toBe(
      'AGG-07-INFORMATION'
    );
    expect(runtimeObjectDefinition('DELIVERABLE-ITEM')?.canonicalModelId).toBe(
      'CBO-DELIVERABLE-ITEM'
    );
    expect(runtimeObjectDefinitionForSubject('DELIVERABLE_ITEM')?.aggregateId).toBe(
      'AGG-MANAGED-DELIVERABLE'
    );
    expect(runtimeObjectDefinition('ITEM')?.canonicalModelId).toBe('CBO-ITEM');
    expect(runtimeObjectDefinitionForSubject('ITEM')?.aggregateId).toBe('AGG-10-ITEM');
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
    expect(
      subjectObjectHref('demo-tenant', 'STRATEGY_FRAMEWORK', 'sf-1', { section: 'decisions' })
    ).toBe('/demo-tenant/app/objects/strategy-framework/sf-1?section=decisions');
    expect(
      subjectObjectHref('demo-tenant', 'STRATEGIC_OBJECTIVE', 'obj-1', { section: 'work' })
    ).toBe('/demo-tenant/app/objects/strategic-objective/obj-1?section=work');
    expect(
      subjectObjectHref('demo-tenant', 'INFORMATION_CONTAINER', 'info-1', {
        section: 'evidence'
      })
    ).toBe('/demo-tenant/app/objects/information-container/info-1?section=evidence');
    expect(
      subjectObjectHref('demo-tenant', 'DELIVERABLE_ITEM', 'del-1', { section: 'work' })
    ).toBe('/demo-tenant/app/objects/deliverable-item/del-1?section=work');
    expect(subjectObjectHref('demo-tenant', 'ITEM', 'item-1', { section: 'decisions' })).toBe(
      '/demo-tenant/app/objects/item/item-1?section=decisions'
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
