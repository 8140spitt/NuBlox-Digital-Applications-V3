import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { seedDevelopmentTenant } from './development-seed';

let contextService: typeof import('./platform-context');
let reference: typeof import('./reference-data');
let db: typeof import('./db');

beforeAll(async () => {
  contextService = await import('./platform-context');
  reference = await import('./reference-data');
  db = await import('./db');
});

afterAll(async () => {
  await db.closeDbPool();
});

describe('typed governed reference data', () => {
  it('creates interoperable jurisdiction, currency, UOM, tax and contract-form reference semantics', async () => {
    const tenant = 'reference-data-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const jurisdictionId = await reference.createJurisdiction(context, {
      jurisdictionKey: 'GB-SCT',
      name: 'Scotland',
      countryRegionCode: 'GB-SCT',
      authorityContext: 'Scottish legal and regulatory jurisdiction'
    });
    const currencyId = await reference.createCurrency(context, {
      isoCode: 'GBP',
      name: 'Pound sterling',
      minorUnits: 2
    });
    const metreId = await reference.createUnitOfMeasure(context, {
      unitCode: 'M',
      symbol: 'm',
      name: 'metre',
      dimensionKey: 'LENGTH'
    });
    const millimetreId = await reference.createUnitOfMeasure(context, {
      unitCode: 'MM',
      symbol: 'mm',
      name: 'millimetre',
      dimensionKey: 'LENGTH',
      baseUnitId: metreId,
      conversionMultiplier: 0.001
    });
    const taxRegimeId = await reference.createTaxRegime(context, {
      regimeKey: 'UK.VAT',
      name: 'United Kingdom VAT',
      taxType: 'VAT',
      jurisdictionId,
      authorityName: 'HMRC'
    });
    const contractFamilyId = await reference.createContractFormFamily(context, {
      familyKey: 'NEC4.ECC',
      name: 'NEC4 Engineering and Construction Contract',
      publisherBody: 'NEC',
      editionFamily: 'NEC4',
      jurisdictionId
    });

    expect((await reference.listJurisdictions(context)).find((row) => row.id === jurisdictionId)?.jurisdictionKey).toBe('GB-SCT');
    expect((await reference.listCurrencies(context)).find((row) => row.id === currencyId)?.isoCode).toBe('GBP');
    const uom = (await reference.listUnitsOfMeasure(context)).find((row) => row.id === millimetreId)!;
    expect(uom.baseUnitId).toBe(metreId);
    expect(Number(uom.conversionMultiplier)).toBeCloseTo(0.001);
    expect((await reference.listTaxRegimes(context)).find((row) => row.id === taxRegimeId)?.jurisdictionId).toBe(jurisdictionId);
    expect((await reference.listContractFormFamilies(context)).find((row) => row.id === contractFamilyId)?.jurisdictionId).toBe(jurisdictionId);
  });

  it('publishes immutable calendar configuration separately from schedule runtime state', async () => {
    const tenant = 'reference-calendar-' + randomUUID().slice(0, 8);
    await seedDevelopmentTenant(tenant);
    const context = await contextService.resolveDevelopmentCommandContext(tenant);

    const created = await reference.createReferenceCalendar(context, {
      calendarKey: 'UK.STANDARD.WORKING',
      name: 'UK Standard Working Calendar',
      timezoneName: 'Europe/London',
      workingPattern: {
        monday: [['08:00', '17:00']],
        tuesday: [['08:00', '17:00']],
        wednesday: [['08:00', '17:00']],
        thursday: [['08:00', '17:00']],
        friday: [['08:00', '16:00']]
      },
      holidays: []
    });

    let calendar = (await reference.listReferenceCalendars(context)).find(
      (row) => row.id === created.calendarId
    )!;
    expect(calendar.version).toBe(1);
    const versions = await reference.listReferenceCalendarVersions(context, created.calendarId);
    expect(versions[0].status).toBe('DRAFT');

    await reference.publishReferenceCalendarVersion(
      context,
      created.calendarId,
      created.versionId,
      calendar.version
    );

    calendar = (await reference.listReferenceCalendars(context)).find(
      (row) => row.id === created.calendarId
    )!;
    expect(calendar.version).toBe(2);
    expect((await reference.listReferenceCalendarVersions(context, created.calendarId))[0].status).toBe('PUBLISHED');

    const events = await db.queryRows<any>(
      "SELECT event_type AS eventType, aggregate_version AS aggregateVersion FROM business_events WHERE tenant_id = ? AND aggregate_id = 'AGG-29-REFERENCE-DATA' AND aggregate_object_id = ? ORDER BY aggregate_version",
      [context.tenantId, created.calendarId]
    );
    expect(events.map((row) => row.eventType)).toEqual([
      'REFERENCE_CALENDAR_CREATED',
      'REFERENCE_CALENDAR_VERSION_PUBLISHED'
    ]);
    expect(events.map((row) => Number(row.aggregateVersion))).toEqual([1, 2]);
  });
});
