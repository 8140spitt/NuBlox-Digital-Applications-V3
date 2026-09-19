import {
  runtimeObjectDefinition,
  type RuntimeObjectSection
} from '$lib/data/runtime-object-registry';
import {
  getPartyDirectoryEntry,
  listPartyDirectoryRelationships
} from '$lib/server/foundation-party-directory';
import { getLead } from '$lib/server/marketing-lead';
import { hasPermission, type CommandContext } from '$lib/server/platform-context';

export type RuntimeObjectField = {
  label: string;
  value: string;
};

export type RuntimeObjectRelationship = {
  id: string;
  direction: 'INCOMING' | 'OUTGOING';
  relationshipType: string;
  relatedPartyId: string;
  relatedPartyName: string;
  contextType: string;
  contextId: string;
  status: string;
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
  workspaceHref: string;
  workspaceLabel: string;
  originFunctionId: string;
  originHref: string | null;
  originLabel: string | null;
  sections: readonly RuntimeObjectSection[];
  relationships: RuntimeObjectRelationship[] | null;
  auditObjectTypes: string[];
};

type Resolver = (context: CommandContext, objectId: string) => Promise<ResolvedRuntimeObject>;

const resolvers: Record<string, Resolver> = {
  party: async (context, objectId) => {
    const definition = runtimeObjectDefinition('party');
    if (!definition) throw new Error('Party runtime definition is missing.');
    const party = await getPartyDirectoryEntry(context, objectId);
    const canReadRelationships = hasPermission(context, 'party.relationship.read');
    const relationships = canReadRelationships
      ? await listPartyDirectoryRelationships(context, party.id)
      : null;
    const subtype =
      party.partyType === 'PERSON'
        ? 'Person'
        : party.isLegalEntity
          ? 'Legal entity'
          : 'Organisation';
    const originFunctionId = party.originFunctionId?.startsWith('F')
      ? party.originFunctionId
      : 'PLATFORM';
    const stewardshipHref =
      '/' +
      encodeURIComponent(context.tenantSlug) +
      '/app/admin/master-data/parties?party=' +
      encodeURIComponent(party.id);

    return {
      objectType: definition.type,
      objectId: party.id,
      reference: party.originReference || party.id,
      title: party.displayName,
      subtitle: subtype,
      status: party.status,
      objectVersion: String(party.version),
      summary:
        'Canonical Party identity reused across enterprise processes without duplicating customer, supplier, worker or legal-role masters.',
      metadata: [
        { label: 'Party type', value: subtype },
        { label: 'Origin', value: party.originFunctionId ?? 'Platform / migration' },
        { label: 'Steward', value: party.stewardFunctionId ?? 'Platform' }
      ],
      fields:
        party.partyType === 'PERSON'
          ? [
              { label: 'Given name', value: party.givenName ?? '—' },
              { label: 'Middle names', value: party.middleNames ?? '—' },
              { label: 'Family name', value: party.familyName ?? '—' },
              { label: 'Preferred name', value: party.preferredName ?? '—' },
              { label: 'Origin object', value: party.originObjectType ?? '—' },
              { label: 'Created', value: party.createdAt },
              { label: 'Last updated', value: party.updatedAt },
              { label: 'Party ID', value: party.id }
            ]
          : [
              { label: 'Legal name', value: party.legalName ?? '—' },
              { label: 'Trading name', value: party.tradingName ?? '—' },
              { label: 'Registration', value: party.registrationNumber ?? '—' },
              { label: 'Country', value: party.countryCode ?? '—' },
              { label: 'Legal entity', value: party.isLegalEntity ? 'Yes' : 'No' },
              { label: 'Entity type', value: party.legalEntityType ?? '—' },
              { label: 'Jurisdiction', value: party.jurisdictionCode ?? '—' },
              { label: 'Accounting currency', value: party.accountingCurrency ?? '—' }
            ],
      workspaceHref: '/' + encodeURIComponent(context.tenantSlug) + '/app/data',
      workspaceLabel: 'Enterprise Data',
      originFunctionId,
      originHref: stewardshipHref,
      originLabel: 'Open Party stewardship',
      sections: definition.sections,
      relationships:
        relationships?.map((relationship) => {
          const outgoing = relationship.fromPartyId === party.id;
          return {
            id: relationship.id,
            direction: outgoing ? ('OUTGOING' as const) : ('INCOMING' as const),
            relationshipType: relationship.relationshipType,
            relatedPartyId: outgoing ? relationship.toPartyId : relationship.fromPartyId,
            relatedPartyName: outgoing
              ? relationship.toDisplayName
              : relationship.fromDisplayName,
            contextType: relationship.contextType,
            contextId: relationship.contextId,
            status: relationship.status
          };
        }) ?? null,
      auditObjectTypes:
        party.partyType === 'PERSON'
          ? ['person']
          : party.isLegalEntity
            ? ['organisation', 'legal_entity']
            : ['organisation']
    };
  },
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
      workspaceHref: '/' + encodeURIComponent(context.tenantSlug) + '/app/functions/f06',
      workspaceLabel: 'F06 · Marketing & Brand',
      originFunctionId: definition.originFunctionId,
      originHref,
      originLabel: 'Open Lead Generation actions',
      sections: definition.sections,
      relationships: [],
      auditObjectTypes: [definition.auditObjectType]
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
