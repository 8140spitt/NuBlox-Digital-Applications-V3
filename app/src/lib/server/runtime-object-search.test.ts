import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let leadService: typeof import('./marketing-lead');
let organisationService: typeof import('./foundation-organisation');
let searchService: typeof import('./runtime-object-search');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  leadService = await import('./marketing-lead');
  organisationService = await import('./foundation-organisation');
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

    const partyId = await organisationService.createOrganisation(context, {
      legalName: 'Northstar Search Holdings Limited',
      tradingName: 'Northstar Holdings',
      registrationNumber: 'NS-SEARCH-001',
      countryCode: 'GB'
    });

    const results = await searchService.searchRuntimeObjects(context, 'Northstar Search');
    expect(results).toContainEqual(
      expect.objectContaining({
        objectType: 'party',
        objectId: partyId,
        objectLabel: 'Party',
        title: 'Northstar Holdings',
        subtitle: 'Organisation',
        href: '/' + tenant + '/app/objects/party/' + partyId
      })
    );
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

    const noMarketing = {
      ...context,
      permissions: context.permissions.filter((permission) => permission !== 'marketing.read')
    };
    expect(await searchService.searchRuntimeObjects(noMarketing, 'Northstar Search')).toEqual([
      expect.objectContaining({ objectType: 'party', objectId: partyId })
    ]);

    const noParty = {
      ...context,
      permissions: context.permissions.filter((permission) => permission !== 'party.read')
    };
    expect(await searchService.searchRuntimeObjects(noParty, 'Northstar Search')).toEqual([
      expect.objectContaining({ objectType: 'lead', objectId: leadId })
    ]);

    const restricted = {
      ...context,
      permissions: context.permissions.filter(
        (permission) => permission !== 'marketing.read' && permission !== 'party.read'
      )
    };
    expect(await searchService.searchRuntimeObjects(restricted, 'Northstar Search')).toEqual([]);
    expect(await searchService.searchRuntimeObjects(context, 'N')).toEqual([]);
  });
});
