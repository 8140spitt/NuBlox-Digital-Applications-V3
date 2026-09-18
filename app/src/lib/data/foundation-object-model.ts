export type FoundationObjectVersionMode =
  | 'history-only'
  | 'effective-dated'
  | 'amendment-controlled'
  | 'revision-and-iteration'
  | 'configuration-controlled';

export type FoundationObjectDefinition = {
  modelId: string;
  candidateKey: string;
  canonicalName: string;
  definition: string;
  aggregateBoundary: string;
  scope: string[];
  systemIdentity: string;
  businessIdentifiers: string[];
  lifecycle: {
    required: boolean;
    states: string[];
    notes: string;
  };
  versioning: {
    mode: FoundationObjectVersionMode;
    notes: string;
  };
  effectivity: string;
  ownership: string;
};

export type FoundationRelationshipDefinition = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export const foundationObjects: FoundationObjectDefinition[] = [
  {
    modelId: 'CBO-TENANT',
    candidateKey: 'BOF-01-001',
    canonicalName: 'Tenant',
    definition:
      'The isolated NuBlox customer operating context within which canonical identities, configuration, security policy and business transactions are governed.',
    aggregateBoundary:
      'Platform root scope. Tenant is not a substitute for legal entity, organisation or project.',
    scope: ['platform', 'tenant'],
    systemIdentity:
      'Immutable opaque system identifier generated at tenant creation; never reused.',
    businessIdentifiers: ['tenant slug', 'customer/account reference where required'],
    lifecycle: {
      required: true,
      states: ['Provisioning', 'Active', 'Suspended', 'Closing', 'Closed'],
      notes:
        'Suspension and closure are platform-governance states. Business records remain retained according to their own obligations.'
    },
    versioning: {
      mode: 'history-only',
      notes:
        'Tenant identity is never revised. Configuration changes are separately versioned/audited.'
    },
    effectivity:
      'Tenant configuration and subscriptions are effective-dated; tenant identity itself is continuous.',
    ownership: 'NuBlox platform administration with tenant-authorised governance.'
  },
  {
    modelId: 'CBO-PARTY',
    candidateKey: 'BOF-01-002',
    canonicalName: 'Party',
    definition:
      'The stable identity abstraction for a person or organisation that may participate in business relationships.',
    aggregateBoundary:
      'Identity root for Person and Organisation. Customer, supplier, subcontractor, consultant and regulator are contextual relationships/roles.',
    scope: ['tenant'],
    systemIdentity:
      'Immutable tenant-scoped Party ID. A surviving Party ID remains stable when names, addresses or roles change.',
    businessIdentifiers: [
      'external party identifiers',
      'tax/company identifiers through governed identifier records'
    ],
    lifecycle: {
      required: true,
      states: ['Active', 'Inactive', 'Merged'],
      notes:
        'Commercial roles have their own states. Merged preserves redirects/history and never silently deletes the losing identity.'
    },
    versioning: {
      mode: 'history-only',
      notes:
        'Master-data changes are audited/effective-dated where material; they do not create a new Party identity.'
    },
    effectivity:
      'Party relationships, names, addresses and identifiers may carry validity periods.',
    ownership: 'Enterprise/master-data governance.'
  },
  {
    modelId: 'CBO-PERSON',
    candidateKey: 'BOF-01-003',
    canonicalName: 'Person',
    definition: 'A natural person represented as a specialization of Party.',
    aggregateBoundary:
      'Person identity excludes employment, user account, contact, competence and project-participant relationships.',
    scope: ['tenant'],
    systemIdentity: 'One immutable Person ID linked one-to-one to its Party identity.',
    businessIdentifiers: [
      'employee/worker numbers through engagement relationships',
      'professional registration identifiers',
      'external/contact identifiers'
    ],
    lifecycle: {
      required: true,
      states: ['Active', 'Inactive', 'Merged'],
      notes:
        'Employment, user access and project participation are separate relationships and must not drive Person identity state.'
    },
    versioning: {
      mode: 'history-only',
      notes:
        'Names and personal details change through audited history, not revisions of the Person identity.'
    },
    effectivity: 'Names, contact points, qualifications and relationships can be effective-dated.',
    ownership:
      'Party/master-data governance; sensitive attributes additionally governed by privacy policy.'
  },
  {
    modelId: 'CBO-ORGANISATION',
    candidateKey: 'BOF-01-004',
    canonicalName: 'Organisation',
    definition:
      'An organised body represented as a specialization of Party, independent of the commercial roles it plays.',
    aggregateBoundary:
      'Organisation identity is reused for customer, supplier, subcontractor, consultant, partner and regulator relationships.',
    scope: ['tenant'],
    systemIdentity: 'One immutable Organisation ID linked one-to-one to its Party identity.',
    businessIdentifiers: [
      'company/registration number',
      'tax identifiers',
      'external supplier/customer references'
    ],
    lifecycle: {
      required: true,
      states: ['Proposed', 'Active', 'Inactive', 'Dissolved', 'Merged'],
      notes:
        'Supplier/customer approval states belong to relationship records, not the Organisation master.'
    },
    versioning: {
      mode: 'history-only',
      notes:
        'Legal/trading names and addresses are audited or effective-dated. They do not create new Organisation identities.'
    },
    effectivity:
      'Names, registrations, addresses, ownership and commercial relationships may be time-bound.',
    ownership: 'Enterprise/master-data governance.'
  },
  {
    modelId: 'CBO-LEGAL-ENTITY',
    candidateKey: 'BOF-01-005',
    canonicalName: 'Legal Entity',
    definition:
      'An Organisation specialization with independent statutory, tax, accounting or contractual accountability.',
    aggregateBoundary:
      'Legal Entity references the canonical Organisation/Party identity and adds statutory/accounting attributes rather than duplicating it.',
    scope: ['tenant', 'jurisdiction'],
    systemIdentity: 'Immutable Legal Entity ID linked to one Organisation identity.',
    businessIdentifiers: [
      'legal registration number',
      'tax/VAT identifiers',
      'statutory reporting identifiers'
    ],
    lifecycle: {
      required: true,
      states: ['Proposed', 'Active', 'Dormant', 'Liquidating', 'Dissolved'],
      notes:
        'Jurisdiction-specific statuses may overlay this baseline without changing the canonical identity.'
    },
    versioning: {
      mode: 'effective-dated',
      notes:
        'Legal names, registrations, tax status and reporting attributes are effective-dated and audited.'
    },
    effectivity:
      'Statutory attributes and registrations have jurisdiction-specific effective dates.',
    ownership: 'Corporate/legal/finance master-data governance.'
  },
  {
    modelId: 'CBO-ORGANISATION-UNIT',
    candidateKey: 'BOF-01-007',
    canonicalName: 'Organisation Unit',
    definition:
      'A governed internal structural unit used for accountability, operating scope, reporting and responsibility assignment.',
    aggregateBoundary:
      'Internal structure; not automatically an external Party. Hierarchy membership and accountable Legal Entity are explicit relationships.',
    scope: ['tenant', 'enterprise hierarchy', 'legal entity where applicable'],
    systemIdentity:
      'Immutable Organisation Unit ID; reorganisations change effective relationships rather than recycling identifiers.',
    businessIdentifiers: [
      'organisation-unit code',
      'cost/profit-centre references through mappings'
    ],
    lifecycle: {
      required: true,
      states: ['Planned', 'Active', 'Inactive', 'Closed'],
      notes:
        'Reorganisation is represented by effective-dated hierarchy/ownership relationships and retained history.'
    },
    versioning: {
      mode: 'effective-dated',
      notes:
        'Hierarchy, name and accountability changes are effective-dated rather than major revisions.'
    },
    effectivity:
      'Parent hierarchy and accountable entity assignments must carry valid-from/valid-to semantics.',
    ownership: 'Enterprise organisation governance/HCM master data.'
  },
  {
    modelId: 'CBO-PROJECT',
    candidateKey: 'BOF-06-003',
    canonicalName: 'Project',
    definition:
      'The stable governed identity for a delivery undertaking/job across commercial, design, planning, construction, controls, handover and closeout.',
    aggregateBoundary:
      'Project identity is distinct from stage, WBS, schedule, contract, site and programme. Those are related objects/structures.',
    scope: [
      'tenant',
      'accountable legal entity',
      'organisation unit',
      'portfolio/programme where applicable'
    ],
    systemIdentity:
      'Immutable Project ID retained from opportunity conversion through closure and archive.',
    businessIdentifiers: [
      'project/job number',
      'client project reference',
      'external programme/project identifiers'
    ],
    lifecycle: {
      required: true,
      states: ['Proposed', 'Approved', 'Active', 'On Hold', 'Completed', 'Closed', 'Cancelled'],
      notes:
        'RIBA/design/construction/handover stages are stage classifications or gates, not Project lifecycle identities.'
    },
    versioning: {
      mode: 'history-only',
      notes:
        'Project identity is not revised. Charters, baselines, plans and forecasts are separately versioned/snapshotted.'
    },
    effectivity:
      'Participants, sites, contracts, organisation ownership and stage assignments can be effective-dated.',
    ownership:
      'Project/portfolio governance with an accountable Legal Entity and responsible Organisation Unit.'
  },
  {
    modelId: 'CBO-SITE',
    candidateKey: 'BOF-16-003',
    canonicalName: 'Site',
    definition:
      'A stable spatial/business location identity reused across property, projects, field operations, logistics, systems and assets.',
    aggregateBoundary:
      'Site is not owned by a single Project. Projects reference Sites; property/estate and asset structures may also reference them.',
    scope: ['tenant', 'geospatial/spatial context'],
    systemIdentity:
      'Immutable Site ID retained across projects, ownership changes and operational phases.',
    businessIdentifiers: [
      'site code',
      'address identifiers',
      'geospatial/cadastral references',
      'external estate/property references'
    ],
    lifecycle: {
      required: true,
      states: ['Proposed', 'Active', 'Inactive', 'Closed'],
      notes:
        'Construction mobilisation/demobilisation are project-site relationship states, not Site master states.'
    },
    versioning: {
      mode: 'effective-dated',
      notes:
        'Boundary, address and classification changes are retained as effective-dated history where material.'
    },
    effectivity:
      'Spatial boundaries, addresses, ownership/occupation relationships and project associations may change over time.',
    ownership: 'Property/estate/spatial master-data governance.'
  },
  {
    modelId: 'CBO-CONTRACT',
    candidateKey: 'BOF-08-002',
    canonicalName: 'Contract',
    definition: 'The stable identity of a legally/commercially governed agreement between parties.',
    aggregateBoundary:
      'Contract owns its controlled commercial agreement context; party roles, clauses, obligations, amendments, notices and valuations are related/child objects.',
    scope: [
      'tenant',
      'owning legal entity',
      'counterparties',
      'project/programme/package where applicable'
    ],
    systemIdentity:
      'Immutable Contract ID retained through negotiation, execution, amendments, expiry and closeout.',
    businessIdentifiers: [
      'contract number',
      'counterparty contract reference',
      'framework/call-off reference'
    ],
    lifecycle: {
      required: true,
      states: [
        'Draft',
        'Negotiation',
        'Executed',
        'Effective',
        'Suspended',
        'Expired',
        'Terminated',
        'Closed'
      ],
      notes:
        'Approval workflow tasks and commercial events do not replace Contract lifecycle state.'
    },
    versioning: {
      mode: 'amendment-controlled',
      notes:
        'Executed terms are frozen. Amendments/variations create controlled legal/commercial change evidence while Contract identity remains stable.'
    },
    effectivity:
      'Contract commencement, expiry, amendments, options and obligations require effective dates/applicability.',
    ownership: 'Commercial/legal governance under accountable Legal Entity and delegated authority.'
  },
  {
    modelId: 'CBO-INFORMATION-CONTAINER',
    candidateKey: 'BOF-07-007',
    canonicalName: 'Information Container',
    definition:
      'A governed information identity for documents, drawings, models and other controlled information independent of any binary representation.',
    aggregateBoundary:
      'Stable container identity owns revision/iteration/status/issue metadata; files and renditions are representations/content.',
    scope: ['tenant', 'project', 'asset/site/system/contract/enterprise subject context'],
    systemIdentity:
      'Immutable Information Container ID that survives revisions, file replacements and format changes.',
    businessIdentifiers: [
      'document/container number',
      'originator/volume/system/location/type/role/number naming fields where configured',
      'external CDE identifiers'
    ],
    lifecycle: {
      required: true,
      states: ['Work in Progress', 'In Review', 'Shared', 'Published', 'Superseded', 'Archived'],
      notes:
        'Suitability, purpose-of-issue and security classification remain separate governed attributes.'
    },
    versioning: {
      mode: 'revision-and-iteration',
      notes:
        'Stable identity → major revision/business issue → working iteration → representations. Published revisions are immutable.'
    },
    effectivity:
      'Revision applicability, issue date, suitability and supersession are explicit; asset/product effectivity may also apply.',
    ownership:
      'Information-management governance with originating/owning context and controlled authorship.'
  },
  {
    modelId: 'CBO-ITEM',
    candidateKey: 'BOF-10-001',
    canonicalName: 'Item',
    definition:
      'The canonical catalogue identity for a product, material or service definition that can be specified, estimated, procured, stocked, sold or referenced.',
    aggregateBoundary:
      'Item type/classification distinguishes product/material/service. Supplier-item, manufacturer-item and price relationships remain separate.',
    scope: ['tenant', 'catalogue/master-data context'],
    systemIdentity:
      'Immutable Item ID; item number is a governed business identifier and is never repurposed.',
    businessIdentifiers: [
      'item/material/product number',
      'manufacturer part number through relationship',
      'supplier catalogue number through relationship'
    ],
    lifecycle: {
      required: true,
      states: ['Draft', 'Active', 'Blocked', 'Obsolete'],
      notes:
        'Stock availability, supplier approval and project usage are separate states/relationships.'
    },
    versioning: {
      mode: 'revision-and-iteration',
      notes:
        'Revision is used only where technical/commercial definition requires controlled change. Simple commercial attributes may use history/effectivity instead.'
    },
    effectivity:
      'Revisions, substitutions, supplier relationships, prices and approved usage can be effective-dated or context-specific.',
    ownership: 'Product/material/catalogue master-data governance.'
  },
  {
    modelId: 'CBO-SYSTEM',
    candidateKey: 'BOF-16-014',
    canonicalName: 'System',
    definition:
      'A functional or technical system within a facility, infrastructure network or asset configuration that groups interacting assets/components.',
    aggregateBoundary:
      'System identity is separate from Project, Site and Asset. Membership is an effective relationship and can change over time.',
    scope: ['tenant', 'site/facility/infrastructure context'],
    systemIdentity:
      'Immutable System ID retained from design definition through operation and decommissioning.',
    businessIdentifiers: [
      'system tag/code',
      'design/system classification reference',
      'external BIM/asset identifiers'
    ],
    lifecycle: {
      required: true,
      states: [
        'Planned',
        'Installed',
        'Commissioning',
        'In Service',
        'Out of Service',
        'Decommissioned'
      ],
      notes:
        'System commissioning status and operational availability are related but should not be collapsed into workflow tasks.'
    },
    versioning: {
      mode: 'configuration-controlled',
      notes:
        'System membership/configuration changes are controlled and historically traceable; the System identity remains stable.'
    },
    effectivity:
      'Asset/component membership, location and configuration have effective-from/effective-to or configuration applicability.',
    ownership:
      'Asset/engineering information governance, transferring to operational asset management as appropriate.'
  },
  {
    modelId: 'CBO-ASSET',
    candidateKey: 'BOF-16-016',
    canonicalName: 'Asset',
    definition:
      'A stable whole-life physical or logical asset identity with delivery, commissioning, warranty, operational, maintenance, financial and sustainability history.',
    aggregateBoundary:
      'Asset identity survives changes in project, location, system membership, custodian, condition and financial treatment.',
    scope: ['tenant', 'site/location', 'system/installed-base context'],
    systemIdentity:
      'Immutable Asset ID retained from planned/created identity through disposal; never replaced merely because configuration or ownership changes.',
    businessIdentifiers: [
      'asset tag',
      'serial number',
      'manufacturer identifier',
      'external EAM/FM/BIM identifiers'
    ],
    lifecycle: {
      required: true,
      states: [
        'Planned',
        'Ordered',
        'Received',
        'Installed',
        'Commissioning',
        'In Service',
        'Out of Service',
        'Decommissioned',
        'Disposed'
      ],
      notes:
        'Condition, maintenance status, warranty status and accounting status are separate dimensions and must not overload Asset lifecycle.'
    },
    versioning: {
      mode: 'configuration-controlled',
      notes:
        'Physical asset identity is not revised. Configuration, attributes, condition, location and system membership are historically controlled.'
    },
    effectivity:
      'Location, system membership, custodian, warranty, configuration and ownership/accountability are effective-dated.',
    ownership:
      'Enterprise asset management/asset information governance with accountable owner/custodian.'
  }
];

export const foundationRelationships: FoundationRelationshipDefinition[] = [
  {
    id: 'REL-001',
    from: 'CBO-PERSON',
    predicate: 'specializes',
    to: 'CBO-PARTY',
    cardinality: '1:1',
    governance:
      'Every Person has exactly one Party identity; Party remains the shared relationship anchor.'
  },
  {
    id: 'REL-002',
    from: 'CBO-ORGANISATION',
    predicate: 'specializes',
    to: 'CBO-PARTY',
    cardinality: '1:1',
    governance:
      'Every Organisation has exactly one Party identity; business roles attach to Party/Organisation through contextual relationships.'
  },
  {
    id: 'REL-003',
    from: 'CBO-LEGAL-ENTITY',
    predicate: 'specializes',
    to: 'CBO-ORGANISATION',
    cardinality: '1:1',
    governance:
      'A Legal Entity reuses one Organisation identity and adds statutory/accounting accountability.'
  },
  {
    id: 'REL-004',
    from: 'CBO-ORGANISATION-UNIT',
    predicate: 'part of',
    to: 'CBO-ORGANISATION',
    cardinality: 'many:1',
    governance:
      'Hierarchy is effective-dated; reorganisations do not recycle Organisation Unit identities.'
  },
  {
    id: 'REL-005',
    from: 'CBO-ORGANISATION-UNIT',
    predicate: 'accountable to',
    to: 'CBO-LEGAL-ENTITY',
    cardinality: 'many:1',
    governance:
      'Required where a unit operates under a specific statutory/accounting entity; validity is effective-dated.'
  },
  {
    id: 'REL-006',
    from: 'CBO-PROJECT',
    predicate: 'accountable to',
    to: 'CBO-LEGAL-ENTITY',
    cardinality: 'many:1',
    governance:
      'One primary accountable Legal Entity is required; joint ventures/partners are modelled through additional Party relationships.'
  },
  {
    id: 'REL-007',
    from: 'CBO-PROJECT',
    predicate: 'delivered by',
    to: 'CBO-ORGANISATION-UNIT',
    cardinality: 'many:many',
    governance:
      'Responsibilities are explicit and effective-dated rather than encoded in the Project master.'
  },
  {
    id: 'REL-008',
    from: 'CBO-PROJECT',
    predicate: 'occurs at',
    to: 'CBO-SITE',
    cardinality: 'many:many',
    governance:
      'Supports multi-site and linear projects while keeping Site independent of Project identity.'
  },
  {
    id: 'REL-009',
    from: 'CBO-CONTRACT',
    predicate: 'has party',
    to: 'CBO-PARTY',
    cardinality: 'many:many',
    relationshipObject: 'Contract Party Role',
    governance:
      'Role, capacity, signature authority and effectivity belong to the relationship, not the Party master.'
  },
  {
    id: 'REL-010',
    from: 'CBO-CONTRACT',
    predicate: 'associated with',
    to: 'CBO-PROJECT',
    cardinality: 'many:many',
    governance:
      'A project may have many contracts; frameworks or cross-project agreements may span projects.'
  },
  {
    id: 'REL-011',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-PROJECT',
    cardinality: 'many:many',
    governance:
      'Project context does not own container identity; revision and distribution are governed independently.'
  },
  {
    id: 'REL-012',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-SITE',
    cardinality: 'many:many',
    governance: 'Site-related information remains reusable across projects and operations.'
  },
  {
    id: 'REL-013',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-SYSTEM',
    cardinality: 'many:many',
    governance:
      'Technical information may apply to a System with explicit applicability/effectivity.'
  },
  {
    id: 'REL-014',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-ASSET',
    cardinality: 'many:many',
    governance:
      'Asset documentation/evidence references canonical Asset identity rather than embedding a duplicate asset master.'
  },
  {
    id: 'REL-015',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-CONTRACT',
    cardinality: 'many:many',
    governance:
      'Controlled commercial/legal information references Contract identity and preserves revision/evidence rules.'
  },
  {
    id: 'REL-016',
    from: 'CBO-ASSET',
    predicate: 'instance of',
    to: 'CBO-ITEM',
    cardinality: 'many:0..1',
    governance:
      'Where applicable, a physical/logical asset instantiates an Item definition; bespoke assets may exist without a catalogue Item.'
  },
  {
    id: 'REL-017',
    from: 'CBO-ASSET',
    predicate: 'member of',
    to: 'CBO-SYSTEM',
    cardinality: 'many:many',
    governance: 'System membership is configuration-controlled and effective-dated.'
  },
  {
    id: 'REL-018',
    from: 'CBO-ASSET',
    predicate: 'located at',
    to: 'CBO-SITE',
    cardinality: 'many:1',
    governance:
      'Current location is derived from effective-dated location history; moves do not create a new Asset.'
  },
  {
    id: 'REL-019',
    from: 'CBO-SYSTEM',
    predicate: 'located at',
    to: 'CBO-SITE',
    cardinality: 'many:1',
    governance:
      'A System belongs to a governed spatial/operational context while retaining its independent identity.'
  },
  {
    id: 'REL-020',
    from: 'CBO-ASSET',
    predicate: 'delivered by',
    to: 'CBO-PROJECT',
    cardinality: 'many:many',
    governance:
      'Delivery provenance is retained without making Project the owner of whole-life Asset identity.'
  }
];

export function validateFoundationObjectModel() {
  const ids = new Set(foundationObjects.map((object) => object.modelId));
  const candidateKeys = new Set(foundationObjects.map((object) => object.candidateKey));
  if (ids.size !== foundationObjects.length)
    throw new Error('Foundation model IDs must be unique.');
  if (candidateKeys.size !== foundationObjects.length)
    throw new Error('Foundation candidate keys must be unique.');

  for (const object of foundationObjects) {
    if (!object.modelId.startsWith('CBO-')) throw new Error(`Invalid model ID: ${object.modelId}`);
    if (!object.systemIdentity.trim())
      throw new Error(`Missing system identity rule for ${object.modelId}`);
    if (object.lifecycle.required && object.lifecycle.states.length < 2)
      throw new Error(`Lifecycle is incomplete for ${object.modelId}`);
  }

  const relationshipIds = new Set<string>();
  for (const relationship of foundationRelationships) {
    if (relationshipIds.has(relationship.id))
      throw new Error(`Duplicate relationship ID: ${relationship.id}`);
    relationshipIds.add(relationship.id);
    if (!ids.has(relationship.from))
      throw new Error(`Unknown relationship source: ${relationship.from}`);
    if (!ids.has(relationship.to))
      throw new Error(`Unknown relationship target: ${relationship.to}`);
  }

  return true;
}

export function foundationObjectByCandidateKey(candidateKey: string) {
  return foundationObjects.find((object) => object.candidateKey === candidateKey) ?? null;
}
