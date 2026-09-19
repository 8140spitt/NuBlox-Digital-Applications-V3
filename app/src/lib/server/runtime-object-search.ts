import { objectHref, runtimeObjectDefinition } from '$lib/data/runtime-object-registry';
import { searchPartyDirectory } from '$lib/server/foundation-party-directory';
import { searchLeads } from '$lib/server/marketing-lead';
import { hasPermission, type CommandContext } from '$lib/server/platform-context';

export type RuntimeObjectSearchResult = {
  objectType: string;
  objectId: string;
  objectLabel: string;
  reference: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  href: string;
};

export async function searchRuntimeObjects(
  context: CommandContext,
  query: string,
  requestedLimit = 30
): Promise<RuntimeObjectSearchResult[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];

  const limit = Math.max(1, Math.min(50, Math.floor(requestedLimit)));
  const results: RuntimeObjectSearchResult[] = [];
  const partyDefinition = runtimeObjectDefinition('party');
  const leadDefinition = runtimeObjectDefinition('lead');

  if (partyDefinition && hasPermission(context, partyDefinition.readPermission)) {
    const parties = await searchPartyDirectory(context, needle, limit);
    for (const party of parties) {
      const subtype =
        party.partyType === 'PERSON'
          ? 'Person'
          : party.isLegalEntity
            ? 'Legal entity'
            : 'Organisation';
      results.push({
        objectType: partyDefinition.type,
        objectId: party.id,
        objectLabel: partyDefinition.singular,
        reference: party.originReference || party.id,
        title: party.displayName,
        subtitle: subtype,
        status: party.status,
        href: objectHref(context.tenantSlug, partyDefinition.type, party.id)
      });
    }
  }

  if (leadDefinition && hasPermission(context, leadDefinition.readPermission)) {
    const leads = await searchLeads(context, needle, limit);
    for (const lead of leads) {
      results.push({
        objectType: leadDefinition.type,
        objectId: lead.id,
        objectLabel: leadDefinition.singular,
        reference: lead.leadRef,
        title: lead.prospectName,
        subtitle: lead.organisationName,
        status: lead.status,
        href: objectHref(context.tenantSlug, leadDefinition.type, lead.id)
      });
    }
  }

  return results.slice(0, limit);
}
