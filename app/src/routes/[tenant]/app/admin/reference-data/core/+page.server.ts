import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  createContractFormFamily,
  createCurrency,
  createJurisdiction,
  createReferenceCalendar,
  createTaxRegime,
  createUnitOfMeasure,
  listContractFormFamilies,
  listCurrencies,
  listJurisdictions,
  listReferenceCalendars,
  listReferenceCalendarVersions,
  listTaxRegimes,
  listUnitsOfMeasure,
  publishReferenceCalendarVersion
} from '$lib/server/reference-data';

type Kind = 'jurisdiction' | 'currency' | 'uom' | 'tax' | 'contract' | 'calendar';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(data: FormData, name: string) {
  const value = text(data, name);
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(name + ' must be a number.');
  return parsed;
}

function integerValue(data: FormData, name: string, fallback?: number) {
  const value = text(data, name);
  if (!value && fallback != null) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(name + ' must be a whole number.');
  return parsed;
}

function jsonValue(data: FormData, name: string, fallback: unknown) {
  const value = text(data, name);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(name + ' must contain valid JSON.');
  }
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The reference-data command could not be completed.'
  });
}

function route(tenant: string, kind: Kind, calendarId?: string) {
  const params = new URLSearchParams({ kind });
  if (calendarId) params.set('calendar', calendarId);
  return `/${tenant}/app/admin/reference-data/core?${params.toString()}`;
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const kinds: Kind[] = ['jurisdiction', 'currency', 'uom', 'tax', 'contract', 'calendar'];
  const kind = kinds.includes(url.searchParams.get('kind') as Kind)
    ? (url.searchParams.get('kind') as Kind)
    : 'jurisdiction';

  const [jurisdictions, currencies, units, taxRegimes, contractFamilies, calendars] =
    await Promise.all([
      listJurisdictions(context),
      listCurrencies(context),
      listUnitsOfMeasure(context),
      listTaxRegimes(context),
      listContractFormFamilies(context),
      listReferenceCalendars(context)
    ]);

  const selectedCalendar =
    calendars.find((row) => row.id === url.searchParams.get('calendar')) ?? calendars[0] ?? null;
  const calendarVersions = selectedCalendar
    ? await listReferenceCalendarVersions(context, selectedCalendar.id)
    : [];

  return {
    tenantSlug: params.tenant,
    kind,
    jurisdictions,
    currencies,
    units,
    taxRegimes,
    contractFamilies,
    calendars,
    selectedCalendar,
    calendarVersions,
    capabilities: {
      canManage: hasPermission(context, 'reference.data.manage'),
      canPublish: hasPermission(context, 'reference.data.publish')
    }
  };
};

export const actions: Actions = {
  createJurisdiction: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createJurisdiction(await resolveRequestCommandContext(params.tenant, locals), {
        jurisdictionKey: text(data, 'jurisdictionKey'),
        name: text(data, 'name'),
        countryRegionCode: text(data, 'countryRegionCode') || undefined,
        parentJurisdictionId: text(data, 'parentJurisdictionId') || undefined,
        authorityContext: text(data, 'authorityContext') || undefined
      });
      redirect(303, route(params.tenant, 'jurisdiction'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createCurrency: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createCurrency(await resolveRequestCommandContext(params.tenant, locals), {
        isoCode: text(data, 'isoCode'),
        name: text(data, 'name'),
        minorUnits: integerValue(data, 'minorUnits', 2)
      });
      redirect(303, route(params.tenant, 'currency'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createUom: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createUnitOfMeasure(await resolveRequestCommandContext(params.tenant, locals), {
        unitCode: text(data, 'unitCode'),
        symbol: text(data, 'symbol'),
        name: text(data, 'name'),
        dimensionKey: text(data, 'dimensionKey'),
        baseUnitId: text(data, 'baseUnitId') || undefined,
        conversionMultiplier: numberValue(data, 'conversionMultiplier'),
        conversionOffset: numberValue(data, 'conversionOffset')
      });
      redirect(303, route(params.tenant, 'uom'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createTax: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createTaxRegime(await resolveRequestCommandContext(params.tenant, locals), {
        regimeKey: text(data, 'regimeKey'),
        name: text(data, 'name'),
        taxType: text(data, 'taxType'),
        jurisdictionId: text(data, 'jurisdictionId'),
        authorityName: text(data, 'authorityName') || undefined
      });
      redirect(303, route(params.tenant, 'tax'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createContract: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      await createContractFormFamily(await resolveRequestCommandContext(params.tenant, locals), {
        familyKey: text(data, 'familyKey'),
        name: text(data, 'name'),
        publisherBody: text(data, 'publisherBody') || undefined,
        editionFamily: text(data, 'editionFamily') || undefined,
        jurisdictionId: text(data, 'jurisdictionId') || undefined
      });
      redirect(303, route(params.tenant, 'contract'));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  createCalendar: async ({ request, params, locals }) => {
    const data = await request.formData();
    try {
      const created = await createReferenceCalendar(
        await resolveRequestCommandContext(params.tenant, locals),
        {
          calendarKey: text(data, 'calendarKey'),
          name: text(data, 'name'),
          timezoneName: text(data, 'timezoneName'),
          workingPattern: jsonValue(data, 'workingPattern', {}),
          holidays: jsonValue(data, 'holidays', []),
          exceptions: jsonValue(data, 'exceptions', [])
        }
      );
      redirect(303, route(params.tenant, 'calendar', created.calendarId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  },

  publishCalendar: async ({ request, params, locals }) => {
    const data = await request.formData();
    const calendarId = text(data, 'calendarId');
    try {
      await publishReferenceCalendarVersion(
        await resolveRequestCommandContext(params.tenant, locals),
        calendarId,
        text(data, 'versionId'),
        integerValue(data, 'calendarVersion')
      );
      redirect(303, route(params.tenant, 'calendar', calendarId));
    } catch (error) {
      if (error && typeof error === 'object' && 'status' in error) throw error;
      return problem(error);
    }
  }
};
