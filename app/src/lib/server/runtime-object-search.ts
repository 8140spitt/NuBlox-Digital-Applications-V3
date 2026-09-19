import { objectHref, runtimeObjectDefinition } from '$lib/data/runtime-object-registry';
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
  const leadDefinition = runtimeObjectDefinition('lead');

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
