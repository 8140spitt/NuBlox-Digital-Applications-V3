import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const directory = mkdtempSync(join(tmpdir(), 'nublox-platform-foundation-'));
process.env.NUBLOX_DB_PATH = join(directory, 'foundation.test.db');

let contextService: typeof import('./platform-context');
let organisationService: typeof import('./foundation-organisation');
let dbModule: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  organisationService = await import('./foundation-organisation');
  dbModule = await import('./db');
});

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe('platform foundation runtime', () => {
  it('resolves tenant membership and permissions before organisation commands', () => {
    const context = contextService.resolveDevelopmentCommandContext('test-construction');
    expect(context.tenantSlug).toBe('test-construction');
    expect(context.roleKeys).toContain('tenant-admin');
    expect(context.permissions).toContain('party.create');
    expect(context.permissions).toContain('party.activate');

    const id = organisationService.createOrganisation(context, {
      legalName: 'Northstar Construction Limited',
      tradingName: 'Northstar Construction',
      registrationNumber: 'NC-1001',
      countryCode: 'GB'
    });

    let organisation = organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('PROPOSED');
    expect(organisation.version).toBe(1);

    organisationService.activateOrganisation(context, id, organisation.version);
    organisation = organisationService.getOrganisation(context, id);
    expect(organisation.status).toBe('ACTIVE');
    expect(organisation.version).toBe(2);

    organisationService.updateOrganisation(
      context,
      id,
      {
        legalName: 'Northstar Construction Limited',
        tradingName: 'Northstar Built Environment',
        registrationNumber: 'NC-1001',
        countryCode: 'GB'
      },
      organisation.version
    );

    organisation = organisationService.getOrganisation(context, id);
    expect(organisation.displayName).toBe('Northstar Built Environment');
    expect(organisation.version).toBe(3);

    expect(() => organisationService.updateOrganisation(
      context,
      id,
      { legalName: 'Stale update' },
      2
    )).toThrow('changed after you opened it');

    const audit = organisationService.listOrganisationAudit(context, id);
    expect(audit.map((event) => event.action)).toEqual(
      expect.arrayContaining(['ORGANISATION_CREATED', 'ORGANISATION_ACTIVATED', 'ORGANISATION_CHANGED'])
    );

    const events = dbModule.db.prepare(`
      SELECT event_type AS eventType, aggregate_id AS aggregateId
      FROM business_events
      WHERE tenant_id = ? AND aggregate_object_id = ?
      ORDER BY occurred_at
    `).all(context.tenantId, id) as unknown as { eventType: string; aggregateId: string }[];
    expect(events).toHaveLength(3);
    expect(events.every((event) => event.aggregateId === 'AGG-01-PARTY')).toBe(true);

    const outbox = dbModule.db.prepare(`
      SELECT status, topic
      FROM outbox_messages
      WHERE tenant_id = ?
    `).all(context.tenantId) as unknown as { status: string; topic: string }[];
    expect(outbox).toHaveLength(3);
    expect(outbox.every((row) => row.status === 'PENDING')).toBe(true);
  });

  it('keeps tenant data isolated and denies missing permissions', () => {
    const first = contextService.resolveDevelopmentCommandContext('tenant-a');
    const second = contextService.resolveDevelopmentCommandContext('tenant-b');

    const id = organisationService.createOrganisation(first, { legalName: 'Tenant A Organisation' });
    expect(organisationService.listOrganisations(second).find((row) => row.id === id)).toBeUndefined();

    const restricted = { ...first, permissions: first.permissions.filter((permission) => permission !== 'party.create') };
    expect(() => organisationService.createOrganisation(restricted, { legalName: 'Denied' }))
      .toThrow('Permission denied: party.create');
  });
});
