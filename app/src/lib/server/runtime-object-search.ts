import { objectHref, runtimeObjectDefinition } from '$lib/data/runtime-object-registry';
import { searchPartyDirectory } from '$lib/server/foundation-party-directory';
import { searchInformationContainers } from '$lib/server/information-container';
import { searchLeads } from '$lib/server/marketing-lead';
import { hasPermission, type CommandContext } from '$lib/server/platform-context';
import { searchStrategicObjectives } from '$lib/server/strategic-objective';
import { searchStrategyFrameworks } from '$lib/server/strategy-framework';

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

function fairMerge(
  groups: RuntimeObjectSearchResult[][],
  limit: number
): RuntimeObjectSearchResult[] {
  const merged: RuntimeObjectSearchResult[] = [];
  let index = 0;
  while (merged.length < limit) {
    let appended = false;
    for (const group of groups) {
      const item = group[index];
      if (!item) continue;
      merged.push(item);
      appended = true;
      if (merged.length >= limit) break;
    }
    if (!appended) break;
    index += 1;
  }
  return merged;
}

export async function searchRuntimeObjects(
  context: CommandContext,
  query: string,
  requestedLimit = 30
): Promise<RuntimeObjectSearchResult[]> {
  const needle = query.trim();
  if (needle.length < 2) return [];

  const limit = Math.max(1, Math.min(50, Math.floor(requestedLimit)));
  const providerLimit = Math.max(5, Math.min(20, limit));
  const groups: RuntimeObjectSearchResult[][] = [];

  const partyDefinition = runtimeObjectDefinition('party');
  if (partyDefinition && hasPermission(context, partyDefinition.readPermission)) {
    const parties = await searchPartyDirectory(context, needle, providerLimit);
    groups.push(
      parties.map((party) => {
        const subtype =
          party.partyType === 'PERSON'
            ? 'Person'
            : party.isLegalEntity
              ? 'Legal entity'
              : 'Organisation';
        return {
          objectType: partyDefinition.type,
          objectId: party.id,
          objectLabel: partyDefinition.singular,
          reference: party.originReference || party.id,
          title: party.displayName,
          subtitle: subtype,
          status: party.status,
          href: objectHref(context.tenantSlug, partyDefinition.type, party.id)
        };
      })
    );
  }

  const frameworkDefinition = runtimeObjectDefinition('strategy-framework');
  if (frameworkDefinition && hasPermission(context, frameworkDefinition.readPermission)) {
    const frameworks = await searchStrategyFrameworks(context, needle, providerLimit);
    groups.push(
      frameworks.map((framework) => ({
        objectType: frameworkDefinition.type,
        objectId: framework.id,
        objectLabel: frameworkDefinition.singular,
        reference:
          framework.currentVersion > 0
            ? 'Strategy Framework · v' + framework.currentVersion
            : 'Strategy Framework · Draft',
        title: framework.title,
        subtitle: framework.reviewCadence || null,
        status: framework.status,
        href: objectHref(context.tenantSlug, frameworkDefinition.type, framework.id)
      }))
    );
  }

  const objectiveDefinition = runtimeObjectDefinition('strategic-objective');
  if (objectiveDefinition && hasPermission(context, objectiveDefinition.readPermission)) {
    const objectives = await searchStrategicObjectives(context, needle, providerLimit);
    groups.push(
      objectives.map((objective) => ({
        objectType: objectiveDefinition.type,
        objectId: objective.id,
        objectLabel: objectiveDefinition.singular,
        reference: objective.objectiveRef,
        title: objective.statement,
        subtitle: objective.priority + ' · Strategy v' + objective.frameworkVersionNo,
        status: objective.status,
        href: objectHref(context.tenantSlug, objectiveDefinition.type, objective.id)
      }))
    );
  }

  const informationDefinition = runtimeObjectDefinition('information-container');
  if (informationDefinition && hasPermission(context, informationDefinition.readPermission)) {
    const containers = await searchInformationContainers(context, needle, providerLimit);
    groups.push(
      containers.map((container) => ({
        objectType: informationDefinition.type,
        objectId: container.id,
        objectLabel: informationDefinition.singular,
        reference: container.containerRef,
        title: container.title,
        subtitle: container.containerType.replaceAll('_', ' '),
        status: container.status,
        href: objectHref(context.tenantSlug, informationDefinition.type, container.id)
      }))
    );
  }

  const leadDefinition = runtimeObjectDefinition('lead');
  if (leadDefinition && hasPermission(context, leadDefinition.readPermission)) {
    const leads = await searchLeads(context, needle, providerLimit);
    groups.push(
      leads.map((lead) => ({
        objectType: leadDefinition.type,
        objectId: lead.id,
        objectLabel: leadDefinition.singular,
        reference: lead.leadRef,
        title: lead.prospectName,
        subtitle: lead.organisationName,
        status: lead.status,
        href: objectHref(context.tenantSlug, leadDefinition.type, lead.id)
      }))
    );
  }

  return fairMerge(groups, limit);
}
