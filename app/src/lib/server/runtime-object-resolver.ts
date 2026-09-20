import {
  runtimeObjectDefinition,
  type RuntimeObjectSection
} from '$lib/data/runtime-object-registry';
import {
  getPartyDirectoryEntry,
  listPartyDirectoryRelationships
} from '$lib/server/foundation-party-directory';
import { getInformationContainer } from '$lib/server/information-container';
import { getLead } from '$lib/server/marketing-lead';
import { hasPermission, type CommandContext } from '$lib/server/platform-context';
import { getItem } from '$lib/server/product-innovation';
import { getStrategicObjective } from '$lib/server/strategic-objective';
import { getStrategyFramework } from '$lib/server/strategy-framework';

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

function tenantPath(context: CommandContext, path: string) {
  return '/' + encodeURIComponent(context.tenantSlug) + '/app' + path;
}

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
      tenantPath(context, '/admin/master-data/parties?party=') + encodeURIComponent(party.id);

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
      workspaceHref: tenantPath(context, '/data'),
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
            relatedPartyName: outgoing ? relationship.toDisplayName : relationship.fromDisplayName,
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

  'strategy-framework': async (context, objectId) => {
    const definition = runtimeObjectDefinition('strategy-framework');
    if (!definition) throw new Error('Strategy Framework runtime definition is missing.');
    const framework = await getStrategyFramework(context, objectId);
    const originHref =
      tenantPath(context, '/functions/f01/strategy-framework?framework=') +
      encodeURIComponent(framework.id);

    return {
      objectType: definition.type,
      objectId: framework.id,
      reference:
        framework.currentVersion > 0
          ? 'Strategy Framework · v' + framework.currentVersion
          : 'Strategy Framework · Draft',
      title: framework.title,
      subtitle: 'Enterprise strategy and direction',
      status: framework.status,
      objectVersion: String(framework.currentVersion),
      summary: framework.purpose || framework.direction || null,
      metadata: [
        { label: 'Review cadence', value: framework.reviewCadence || '—' },
        { label: 'Version', value: framework.currentVersion ? 'v' + framework.currentVersion : 'Draft' },
        { label: 'Published', value: framework.publishedAt ?? 'Not published' }
      ],
      fields: [
        { label: 'Purpose', value: framework.purpose || '—' },
        { label: 'Vision', value: framework.vision || '—' },
        { label: 'Mission', value: framework.mission || '—' },
        { label: 'Strategic direction', value: framework.direction || '—' },
        { label: 'Review cadence', value: framework.reviewCadence || '—' },
        { label: 'Submitted', value: framework.submittedAt ?? '—' },
        { label: 'Approved', value: framework.approvedAt ?? '—' },
        { label: 'Last updated', value: framework.updatedAt }
      ],
      workspaceHref: tenantPath(context, '/operate'),
      workspaceLabel: 'Operate',
      originFunctionId: definition.originFunctionId,
      originHref,
      originLabel: 'Open Strategy Framework actions',
      sections: definition.sections,
      relationships: [],
      auditObjectTypes: [definition.auditObjectType]
    };
  },

  'strategic-objective': async (context, objectId) => {
    const definition = runtimeObjectDefinition('strategic-objective');
    if (!definition) throw new Error('Strategic Objective runtime definition is missing.');
    const objective = await getStrategicObjective(context, objectId);
    const originHref =
      tenantPath(context, '/functions/f01/strategic-objectives?objective=') +
      encodeURIComponent(objective.id);

    return {
      objectType: definition.type,
      objectId: objective.id,
      reference: objective.objectiveRef,
      title: objective.statement,
      subtitle: 'Strategic Objective',
      status: objective.status,
      objectVersion: String(objective.aggregateVersion),
      summary: objective.successCriteria,
      metadata: [
        { label: 'Priority', value: objective.priority },
        { label: 'Strategy version', value: 'v' + objective.frameworkVersionNo },
        {
          label: 'Scope',
          value:
            objective.scopeType && objective.scopeId
              ? objective.scopeType + ' · ' + objective.scopeId
              : 'Enterprise'
        }
      ],
      fields: [
        { label: 'Success criteria', value: objective.successCriteria },
        { label: 'Priority', value: objective.priority },
        { label: 'Owner Party', value: objective.ownerPartyId },
        { label: 'Strategy Framework', value: objective.frameworkId },
        { label: 'Strategy version', value: String(objective.frameworkVersionNo) },
        { label: 'Objective version', value: String(objective.currentVersionNo) },
        { label: 'Horizon start', value: objective.horizonStart ?? '—' },
        { label: 'Horizon end', value: objective.horizonEnd ?? '—' }
      ],
      workspaceHref: tenantPath(context, '/operate'),
      workspaceLabel: 'Operate',
      originFunctionId: definition.originFunctionId,
      originHref,
      originLabel: 'Open Strategic Objective actions',
      sections: definition.sections,
      relationships: [],
      auditObjectTypes: [definition.auditObjectType]
    };
  },

  'information-container': async (context, objectId) => {
    const definition = runtimeObjectDefinition('information-container');
    if (!definition) throw new Error('Information Container runtime definition is missing.');
    const container = await getInformationContainer(context, objectId);

    return {
      objectType: definition.type,
      objectId: container.id,
      reference: container.containerRef,
      title: container.title,
      subtitle: container.containerType.replaceAll('_', ' '),
      status: container.status,
      objectVersion: String(container.aggregateVersion),
      summary:
        container.subjectType && container.subjectId
          ? 'Controlled information for ' +
            container.subjectType.replaceAll('_', ' ') +
            ' · ' +
            container.subjectId
          : 'Controlled enterprise information container.',
      metadata: [
        { label: 'Revision', value: String(container.currentRevisionNo) },
        { label: 'Classification', value: container.classificationCode ?? '—' },
        { label: 'Security', value: container.securityClassification ?? '—' }
      ],
      fields: [
        { label: 'Container type', value: container.containerType },
        { label: 'Originator', value: container.originatorDisplayName },
        { label: 'Subject type', value: container.subjectType ?? '—' },
        { label: 'Subject ID', value: container.subjectId ?? '—' },
        { label: 'Classification', value: container.classificationCode ?? '—' },
        { label: 'Security classification', value: container.securityClassification ?? '—' },
        { label: 'Current revision', value: String(container.currentRevisionNo) },
        { label: 'Last updated', value: container.updatedAt }
      ],
      workspaceHref: tenantPath(context, '/functions'),
      workspaceLabel: 'Business Functions',
      originFunctionId: definition.originFunctionId,
      originHref: null,
      originLabel: null,
      sections: definition.sections,
      relationships: [],
      auditObjectTypes: [definition.auditObjectType]
    };
  },

  item: async (context, objectId) => {
    const definition = runtimeObjectDefinition('item');
    if (!definition) throw new Error('Item runtime definition is missing.');
    const item = await getItem(context, objectId);
    const originHref =
      tenantPath(context, '/functions/f05/ideation?item=') + encodeURIComponent(item.id);

    return {
      objectType: definition.type,
      objectId: item.id,
      reference: item.itemNumber,
      title: item.name,
      subtitle: item.itemType.replaceAll('_', ' '),
      status: item.status,
      objectVersion: String(item.aggregateVersion),
      summary: item.description,
      metadata: [
        { label: 'Item type', value: item.itemType.replaceAll('_', ' ') },
        { label: 'Concept status', value: item.conceptStatus ?? '—' },
        { label: 'Classification', value: item.classificationCode ?? '—' }
      ],
      fields: [
        { label: 'Description', value: item.description },
        { label: 'Need', value: item.needSummary ?? '—' },
        { label: 'Opportunity', value: item.opportunitySummary ?? '—' },
        { label: 'Feasibility', value: item.feasibilitySummary ?? '—' },
        { label: 'Score', value: item.score ?? '—' },
        { label: 'Base UOM', value: item.baseUomId ?? '—' },
        { label: 'Selection decision', value: item.selectedDecisionId ?? '—' },
        { label: 'Last updated', value: item.updatedAt }
      ],
      workspaceHref: tenantPath(context, '/data'),
      workspaceLabel: 'Enterprise Data',
      originFunctionId: definition.originFunctionId,
      originHref,
      originLabel: 'Open Product & Service Ideation actions',
      sections: definition.sections,
      relationships: [],
      auditObjectTypes: [definition.auditObjectType]
    };
  },

  lead: async (context, objectId) => {
    const definition = runtimeObjectDefinition('lead');
    if (!definition) throw new Error('Lead runtime definition is missing.');
    const lead = await getLead(context, objectId);
    const originHref =
      tenantPath(context, '/functions/f06/leads?lead=') + encodeURIComponent(lead.id);
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
      workspaceHref: tenantPath(context, '/functions/f06'),
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
