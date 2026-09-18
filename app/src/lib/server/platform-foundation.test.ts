import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

let contextService: typeof import('./platform-context');
let organisationService: typeof import('./foundation-organisation');
let dbModule: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  organisationService = await import('./foundation-organisation');
  dbModule = await import('./db');
});

afterAll(async () => {
  await dbModule.closeDbPool();
});

describe('platform foundation runtime on MySQL', () => {
  it('resolves tenant membership and permissions before organisation commands', async () => {
    const tenant = 'foundation-' + randomUUID().slice(0, 8);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);
    expect(context.tenantSlug).toBe(tenant);
    expect(context.roleKeys).toContain('tenant-admin');
    expect(context.permissions).toContain('party.create');
    expect(context.permissions).toContain('party.activate');

    const id = await organisationService.createOrganisation(context, {
      legalName: 'Northstar Construction Limited',
      tradingName: 'Northstar Construction',
      registrationNumber: 'NC-' + randomUUID().slice(0, 8),
      countryCode: 'GB'
    });

    let organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('PROPOSED');
    expect(organisation.version).toBe(1);

    await organisationService.activateOrganisation(context, id, organisation.version);
    organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('ACTIVE');
    expect(organisation.version).toBe(2);

    await organisationService.updateOrganisation(
      context,
      id,
      {
        legalName: 'Northstar Construction Limited',
        tradingName: 'Northstar Built Environment',
        registrationNumber: organisation.registrationNumber ?? undefined,
        countryCode: 'GB'
      },
      organisation.version
    );

    organisation = await organisationService.getOrganisation(context, id);
    expect(organisation.displayName).toBe('Northstar Built Environment');
    expect(organisation.version).toBe(3);

    await expect(
      organisationService.updateOrganisation(context, id, { legalName: 'Stale update' }, 2)
    ).rejects.toThrow('changed after you opened it');

    const audit = await organisationService.listOrganisationAudit(context, id);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(['ORGANISATION_CREATED', 'ORGANISATION_ACTIVATED', 'ORGANISATION_CHANGED'])
    );

    const events = await dbModule.queryRows<any>(
      'SELECT event_type AS eventType, aggregate_id AS aggregateId FROM business_events WHERE tenant_id = ? AND aggregate_object_id = ? ORDER BY occurred_at',
      [context.tenantId, id]
    );
    expect(events).toHaveLength(3);
    expect(events.every((event) => event.aggregateId === 'AGG-01-PARTY')).toBe(true);

    const outbox = await dbModule.queryRows<any>(
      'SELECT status, topic FROM outbox_messages WHERE tenant_id = ? AND business_event_id IN (SELECT id FROM business_events WHERE aggregate_object_id = ?)',
      [context.tenantId, id]
    );
    expect(outbox).toHaveLength(3);
    expect(outbox.every((row) => row.status === 'PENDING')).toBe(true);
  });

  it('keeps tenant data isolated and denies missing permissions', async () => {
    const suffix = randomUUID().slice(0, 8);
    const first = await contextService.resolveDevelopmentCommandContext('tenant-a-' + suffix);
    const second = await contextService.resolveDevelopmentCommandContext('tenant-b-' + suffix);

    const id = await organisationService.createOrganisation(first, { legalName: 'Tenant A Organisation' });
    const secondRows = await organisationService.listOrganisations(second);
    expect(secondRows.find((row) => row.id === id)).toBeUndefined();

    const restricted = {
      ...first,
      permissions: first.permissions.filter((permission) => permission !== 'party.create')
    };
    await expect(
      organisationService.createOrganisation(restricted, { legalName: 'Denied' })
    ).rejects.toThrow('Permission denied: party.create');
  });
});
