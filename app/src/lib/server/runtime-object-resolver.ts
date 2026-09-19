import { runtimeObjectDefinition, type RuntimeObjectSection } from '$lib/data/runtime-object-registry';
import { getLead } from '$lib/server/marketing-lead';
import type { CommandContext } from '$lib/server/platform-context';

export type RuntimeObjectField = {
  label: string;
  value: string;
};

export type ResolvedRuntimeObject = {
  objectType: string;
  objectId: string;
  reference: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  objectVersion: string | null;
  summary: string | null;
  metadata: RuntimeObjectField[];
  fields: RuntimeObjectField[];
  originFunctionId: string;
  originHref: string | null;
  originLabel: string | null;
  sections: readonly RuntimeObjectSection[];
};

type Resolver = (
  context: CommandContext,
  objectId: string
) => Promise<ResolvedRuntimeObject>;

const resolvers: Record<string, Resolver> = {
  lead: async (context, objectId) => {
    const definition = runtimeObjectDefinition('lead');
    if (!definition) throw new Error('Lead runtime definition is missing.');
    const lead = await getLead(context, objectId);
    const originHref =
      '/' +
      encodeURIComponent(context.tenantSlug) +
      '/app/functions/f06/leads?lead=' +
      encodeURIComponent(lead.id);
    return {
      objectType: definition.type,
      objectId: lead.id,
      reference: lead.leadRef,
      title: lead.prospectName,
      subtitle: lead.organisationName,
      status: lead.status,
      objectVersion: String(lead.aggregateVersion),
      summary: lead.needSummary,
      metadata: [
        { label: 'Score', value: String(lead.score) },
        { label: 'Source', value: lead.sourceType },
        { label: 'Party resolution', value: lead.resolvedPartyId ? 'Resolved' : 'Unresolved' }
      ],
      fields: [
        { label: 'Organisation', value: lead.organisationName ?? 'Unresolved' },
        { label: 'Email', value: lead.email ?? '—' },
        { label: 'Phone', value: lead.phone ?? '—' },
        { label: 'Geography', value: lead.geography ?? '—' },
        { label: 'Sector', value: lead.sector ?? '—' },
        { label: 'Score', value: String(lead.score) },
        { label: 'Aggregate version', value: String(lead.aggregateVersion) },
        { label: 'Last updated', value: lead.updatedAt }
      ],
      originFunctionId: definition.originFunctionId,
      originHref,
      originLabel: 'Open Lead Generation actions',
      sections: definition.sections
    };
  }
};

export function runtimeObjectResolver(objectType: string): Resolver | null {
  return resolvers[objectType.trim().toLowerCase()] ?? null;
}

export async function resolveRuntimeObject(
  context: CommandContext,
  objectType: string,
  objectId: string
) {
  const resolver = runtimeObjectResolver(objectType);
  if (!resolver) throw new Error('Runtime object type is not registered.');
  return resolver(context, objectId);
}
