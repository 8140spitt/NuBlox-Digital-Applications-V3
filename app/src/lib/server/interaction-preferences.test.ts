import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let preferences: typeof import('./interaction-preferences');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  preferences = await import('./interaction-preferences');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('Saved Views, Recent and Favourites runtime', () => {
  it('keeps personal navigation state tenant and identity scoped', async () => {
    const tenant = 'interaction-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const firstView = await preferences.savePersonalView(context, {
      targetKey: 'COLLECTION:LEAD',
      name: 'High priority',
      definition: {
        query: 'priority',
        sortKey: 'score',
        sortDirection: 'desc',
        displayMode: 'TABLE'
      },
      isDefault: true,
      isPinned: true
    });

    expect(firstView).toMatchObject({
      targetKey: 'COLLECTION:LEAD',
      name: 'High priority',
      isDefault: 1,
      isPinned: 1
    });

    const updatedView = await preferences.savePersonalView(context, {
      targetKey: 'COLLECTION:LEAD',
      name: 'High priority',
      definition: {
        query: 'qualified',
        sortKey: 'status',
        sortDirection: 'asc',
        displayMode: 'TABLE'
      },
      isDefault: false,
      isPinned: true
    });

    expect(updatedView.id).toBe(firstView.id);
    expect(updatedView.definition.query).toBe('qualified');

    const leadId = randomUUID();
    const item = {
      itemKey: preferences.objectNavigationItemKey('LEAD', leadId),
      itemType: 'OBJECT' as const,
      objectType: 'LEAD',
      objectId: leadId,
      title: 'LEAD-001 · Northstar',
      subtitle: 'Qualified Lead',
      routePath: '/' + tenant + '/app/objects/lead/' + leadId
    };

    await preferences.recordRecentItem(context, item);
    await preferences.recordRecentItem(context, { ...item, title: 'LEAD-001 · Northstar Group' });

    const recent = await preferences.listRecentItems(context);
    expect(recent).toHaveLength(1);
    expect(recent[0]).toMatchObject({
      itemKey: item.itemKey,
      title: 'LEAD-001 · Northstar Group',
      objectType: 'LEAD',
      objectId: leadId
    });

    expect(await preferences.isFavourite(context, item.itemKey)).toBe(false);
    expect(await preferences.toggleFavourite(context, item)).toBe(true);
    expect(await preferences.isFavourite(context, item.itemKey)).toBe(true);
    expect(await preferences.listFavourites(context)).toHaveLength(1);
    expect(await preferences.toggleFavourite(context, item)).toBe(false);
    expect(await preferences.listFavourites(context)).toEqual([]);

    await expect(
      preferences.recordRecentItem(context, {
        ...item,
        itemKey: 'WORKSPACE:OTHER',
        itemType: 'WORKSPACE',
        objectType: null,
        objectId: null,
        routePath: '/another-tenant/app'
      })
    ).rejects.toThrow('current tenant');

    await preferences.deletePersonalView(context, firstView.id);
    expect(await preferences.listSavedViews(context, 'COLLECTION:LEAD')).toEqual([]);
  });
});
