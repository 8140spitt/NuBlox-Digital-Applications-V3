import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let leadService: typeof import('./marketing-lead');
let searchService: typeof import('./runtime-object-search');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  leadService = await import('./marketing-lead');
  searchService = await import('./runtime-object-search');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('runtime object search', () => {
  it('returns canonical permission-aware object results', async () => {
    const tenant = 'object-search-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const leadId = await leadService.createLead(context, {
      leadRef: 'LEAD-SEARCH-001',
      sourceType: 'WEB',
      prospectName: 'Northstar Search Prospect',
      organisationName: 'Northstar Search Limited',
      needSummary: 'Search foundation proof record'
    });

    const results = await searchService.searchRuntimeObjects(context, 'Northstar Search');
    expect(results).toContainEqual(
      expect.objectContaining({
        objectType: 'lead',
        objectId: leadId,
        objectLabel: 'Lead',
        reference: 'LEAD-SEARCH-001',
        title: 'Northstar Search Prospect',
        href: '/' + tenant + '/app/objects/lead/' + leadId
      })
    );

    const restricted = {
      ...context,
      permissions: context.permissions.filter((permission) => permission !== 'marketing.read')
    };
    expect(await searchService.searchRuntimeObjects(restricted, 'Northstar Search')).toEqual([]);
  });
});
