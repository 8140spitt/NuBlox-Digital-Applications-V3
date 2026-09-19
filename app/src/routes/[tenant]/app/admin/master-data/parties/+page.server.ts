import type { PageServerLoad } from './$types';
import {
  listPartyDirectory,
  listPartyDirectoryRelationships
} from '$lib/server/foundation-party-directory';
import { hasPermission } from '$lib/server/platform-context';
import { homeFunctionForRelationshipType } from '$lib/server/party-origination';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';

const functionNames: Record<string, string> = {
  F07: 'Sales & Commercial',
  F09: 'Procurement & Suppliers',
  F15: 'People & Workforce',
  F19: 'Legal & Secretariat'
};

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
        party.familyName,
        party.originFunctionId,
        party.originReference
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
  const relationships = selected
    ? (await listPartyDirectoryRelationships(context, selected.id)).map((relationship) => {
        const homeFunctionId = homeFunctionForRelationshipType(relationship.relationshipType);
        return {
          ...relationship,
          homeFunctionId,
          homeFunctionName: homeFunctionId
            ? (functionNames[homeFunctionId] ?? homeFunctionId)
            : null,
          homeHref: homeFunctionId
            ? '/' + params.tenant + '/app/functions/' + homeFunctionId.toLowerCase()
            : null
        };
      })
    : [];

  return {
    tenantSlug: params.tenant,
    filters: { q: url.searchParams.get('q') ?? '', type, status },
    parties,
    allParties,
    selected,
    relationships,
    authority: {
      canSteward:
        hasPermission(context, 'party.steward.manage') && hasPermission(context, 'party.change')
    }
  };
};
