import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createPerson } from '$lib/server/foundation-person';
import { createOrganisation } from '$lib/server/foundation-organisation';
import { designateLegalEntity } from '$lib/server/foundation-legal-entity';
import {
  activatePartyRelationship,
  createPartyRelationship,
  endPartyRelationship,
  suspendPartyRelationship
} from '$lib/server/foundation-party-relationship';
import {
  listPartyDirectory,
  listPartyDirectoryRelationships
} from '$lib/server/foundation-party-directory';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

function text(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === 'string' ? value : '';
}

function version(data: FormData) {
  const value = Number(text(data, 'version'));
  if (!Number.isInteger(value) || value < 1) throw new Error('A valid record version is required.');
  return value;
}

function target(tenant: string, partyId: string) {
  return `/${tenant}/app/admin/master-data/parties?party=${encodeURIComponent(partyId)}`;
}

function problem(error: unknown) {
  return fail(400, {
    message: error instanceof Error ? error.message : 'The requested action could not be completed.'
  });
}

export const load: PageServerLoad = async ({ params, url, locals }) => {
  const context = await resolveRequestCommandContext(params.tenant, locals);
  const allParties = await listPartyDirectory(context);
  const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
  const type = (url.searchParams.get('type') ?? '').trim().toUpperCase();
  const status = (url.searchParams.get('status') ?? '').trim().toUpperCase();

  const parties = allParties.filter((party) => {
    if (query) {
      const haystack = [
        party.displayName,
        party.legalName,
        party.registrationNumber,
        party.givenName,
        party.familyName
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (type && party.partyType !== type) return false;
    if (status && party.status !== status) return false;
    return true;
  });

  const requestedId = url.searchParams.get('party');
  const selected =
    allParties.find((party) => party.id === requestedId) ?? parties[0] ?? allParties[0] ?? null;

  return {
    tenantSlug: params.tenant,
    actorDisplayName: context.actorDisplayName,
    filters: { q: url.searchParams.get('q') ?? '', type, status },
    parties,
    allParties,
    selected,
    relationships: selected ? await listPartyDirectoryRelationships(context, selected.id) : [],
    authority: {
      canCreate: hasPermission(context, 'party.create'),
      canChange: hasPermission(context, 'party.change'),
      canManageRelationships: hasPermission(context, 'party.relationship.manage')
    }
  };
};

export const actions: Actions = {
  createPerson: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let id: string;
    try {
      id = await createPerson(context, {
        givenName: text(data, 'givenName'),
        middleNames: text(data, 'middleNames'),
        familyName: text(data, 'familyName'),
        preferredName: text(data, 'preferredName'),
        dateOfBirth: text(data, 'dateOfBirth')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  createOrganisation: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    let id: string;
    try {
      id = await createOrganisation(context, {
        legalName: text(data, 'legalName'),
        tradingName: text(data, 'tradingName'),
        registrationNumber: text(data, 'registrationNumber'),
        taxIdentifier: text(data, 'taxIdentifier'),
        countryCode: text(data, 'countryCode')
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  designateLegalEntity: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const id = text(data, 'partyId');
    try {
      await designateLegalEntity(
        context,
        id,
        {
          legalEntityType: text(data, 'legalEntityType'),
          jurisdictionCode: text(data, 'jurisdictionCode'),
          statutoryIdentifier: text(data, 'statutoryIdentifier'),
          taxRegistrationNumber: text(data, 'taxRegistrationNumber'),
          accountingCurrency: text(data, 'accountingCurrency'),
          effectiveFrom: text(data, 'effectiveFrom'),
          effectiveTo: text(data, 'effectiveTo')
        },
        version(data)
      );
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, id));
  },

  createRelationship: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const fromPartyId = text(data, 'fromPartyId');
    let id: string;
    try {
      id = await createPartyRelationship(context, {
        fromPartyId,
        toPartyId: text(data, 'toPartyId'),
        relationshipType: text(data, 'relationshipType'),
        contextType: 'TENANT',
        contextId: context.tenantId
      });
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, fromPartyId) + '&relationship=' + encodeURIComponent(id));
  },

  activateRelationship: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const partyId = text(data, 'partyId');
    try {
      await activatePartyRelationship(context, text(data, 'relationshipId'), version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, partyId));
  },

  suspendRelationship: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const partyId = text(data, 'partyId');
    try {
      await suspendPartyRelationship(context, text(data, 'relationshipId'), version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, partyId));
  },

  endRelationship: async ({ request, params, locals }) => {
    const data = await request.formData();
    const context = await resolveRequestCommandContext(params.tenant, locals);
    const partyId = text(data, 'partyId');
    try {
      await endPartyRelationship(context, text(data, 'relationshipId'), version(data));
    } catch (error) {
      return problem(error);
    }
    redirect(303, target(params.tenant, partyId));
  }
};
