export type BuiltEnvironmentKind =
  | 'governance-context'
  | 'spatial-object'
  | 'physical-object'
  | 'technical-object'
  | 'foundation-reference';

export type BuiltEnvironmentDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: BuiltEnvironmentKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type BuiltEnvironmentRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type BuiltEnvironmentPattern = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const builtEnvironmentModel: BuiltEnvironmentDefinition[] = [
  {
    modelId: 'BE-ESTATE',
    candidateKeys: ['BOF-16-001'],
    canonicalName: 'Estate',
    kind: 'governance-context',
    definition:
      'A governed collection of land, properties, facilities and assets managed together for ownership, occupation, service delivery or investment purposes.',
    identityRule:
      'Stable Estate identity independent of the current Sites, Properties, Facilities or Assets associated with it.',
    scope: ['tenant', 'legal entity', 'property/estate context'],
    keyData: [
      'estate code',
      'name',
      'accountable organisation',
      'management purpose',
      'effective membership'
    ],
    lifecycle: ['Proposed', 'Active', 'Inactive', 'Closed'],
    governance: [
      'Estate is a management/governance context, not a Project, folder or reporting-only grouping.',
      'Membership changes do not recreate the underlying Site, Property, Facility or Asset identities.',
      'An Estate may contain geographically separate holdings.'
    ]
  },
  {
    modelId: 'BE-NETWORK',
    candidateKeys: ['BOF-16-002'],
    canonicalName: 'Network',
    kind: 'governance-context',
    definition:
      'A connected infrastructure or service network spanning physical entities, linear segments, systems and assets.',
    identityRule:
      'Stable Network identity retained as topology, ownership, operating boundaries and constituent infrastructure change.',
    scope: ['tenant', 'infrastructure/utility context', 'geographic operating area'],
    keyData: [
      'network code',
      'network type',
      'operator/accountability',
      'topology/configuration context'
    ],
    lifecycle: ['Planned', 'Active', 'Partially Active', 'Decommissioning', 'Closed'],
    governance: [
      'Network is distinct from an IT/data network unless explicitly classified as such.',
      'A Network may cross many Sites and Properties.',
      'Linear infrastructure cannot be forced into a building/floor/space hierarchy.'
    ]
  },
  {
    modelId: 'CBO-SITE',
    candidateKeys: ['BOF-16-003', 'BOF-12-001'],
    canonicalName: 'Site',
    kind: 'foundation-reference',
    definition:
      'The stable spatial/business location identity already governed by the foundation model and reused across delivery and operations.',
    identityRule:
      'One Site identity survives Projects, mobilisation/demobilisation, ownership changes and operational phases.',
    scope: ['tenant', 'geospatial/spatial context'],
    keyData: ['site ID', 'site code', 'address/geospatial references', 'boundary/effectivity'],
    lifecycle: ['Proposed', 'Active', 'Inactive', 'Closed'],
    governance: [
      'Site is not Project.',
      'Construction Site is a Project-to-Site operating relationship/state, not a new Site master.',
      'Site may contain or relate to land, property, buildings, infrastructure and assets.'
    ]
  },
  {
    modelId: 'BE-LAND-PARCEL',
    candidateKeys: ['BOF-16-004', 'BOF-04-007'],
    canonicalName: 'Land Parcel',
    kind: 'spatial-object',
    definition:
      'A governed parcel or cadastral land extent used as the stable spatial/legal reference for land interests, development and property context.',
    identityRule:
      'Stable parcel identity; boundary changes, splits and consolidations are governed events/relationships with retained predecessor/successor traceability.',
    scope: ['tenant', 'jurisdiction', 'site/property context'],
    keyData: [
      'parcel reference',
      'geometry/boundary',
      'cadastral/title references',
      'jurisdiction'
    ],
    lifecycle: ['Proposed', 'Current', 'Superseded', 'Retired'],
    governance: [
      'Ownership and occupation are interests/relationships, not fields that redefine parcel identity.',
      'Parcel is not interchangeable with Site or Property.',
      'Boundary provenance must remain traceable.'
    ]
  },
  {
    modelId: 'BE-PROPERTY',
    candidateKeys: ['BOF-16-005'],
    canonicalName: 'Property',
    kind: 'spatial-object',
    definition:
      'A stable real-estate/property identity used for ownership, occupation, valuation, leasing, facilities and portfolio management.',
    identityRule:
      'Stable Property identity with effective-dated interests, addresses, classifications and constituent spatial relationships.',
    scope: ['tenant', 'estate', 'site/land', 'legal entity where applicable'],
    keyData: [
      'property reference',
      'property type',
      'site/parcel associations',
      'address',
      'interest context'
    ],
    lifecycle: ['Proposed', 'Active', 'Inactive', 'Disposed', 'Closed'],
    governance: [
      'Property is not necessarily one Building.',
      'A Property may include land, multiple buildings, infrastructure or leased/occupied extents.',
      'Ownership, lease and licence semantics remain separate governed relationships.'
    ]
  },
  {
    modelId: 'BE-FACILITY',
    candidateKeys: ['BOF-16-006'],
    canonicalName: 'Facility',
    kind: 'spatial-object',
    definition:
      'An operational/service-delivery place or managed facility context that can occupy one or more physical built entities.',
    identityRule:
      'Stable Facility identity independent of a construction Project and independent of the exact Building/Infrastructure accommodation at a point in time.',
    scope: ['tenant', 'estate/property', 'operating organisation'],
    keyData: [
      'facility code',
      'function/use',
      'operator',
      'accommodation relationships',
      'service context'
    ],
    lifecycle: ['Planned', 'Active', 'Partially Active', 'Closed'],
    governance: [
      'Facility is an operational concept; Building is a physical built entity.',
      'One Facility may span several Buildings or Infrastructure Entities.',
      'Facility handover does not create a new physical identity.'
    ]
  },
  {
    modelId: 'BE-BUILDING',
    candidateKeys: ['BOF-16-007'],
    canonicalName: 'Building',
    kind: 'physical-object',
    definition:
      'A stable physical building identity that contains spatial structure and hosts systems/assets throughout its life.',
    identityRule:
      'Stable Building identity from design/delivery through operation, adaptation and eventual decommissioning.',
    scope: ['tenant', 'site/property/estate'],
    keyData: [
      'building reference',
      'location/site',
      'classification/use',
      'geometry/model references'
    ],
    lifecycle: [
      'Planned',
      'Under Construction',
      'Commissioning',
      'In Use',
      'Out of Use',
      'Decommissioned',
      'Demolished'
    ],
    governance: [
      'Building is not a Project or Facility.',
      'Projects create/change Buildings but do not own their whole-life identity.',
      'Levels, Spaces, Systems and Assets retain governed relationships to the Building.'
    ]
  },
  {
    modelId: 'BE-INFRASTRUCTURE-ENTITY',
    candidateKeys: ['BOF-16-008'],
    canonicalName: 'Infrastructure Entity',
    kind: 'physical-object',
    definition:
      'A stable engineered infrastructure identity such as a bridge, tunnel, station, treatment works, substation or comparable non-building built entity.',
    identityRule:
      'Stable infrastructure identity retained across Projects, upgrades, ownership/operation changes and maintenance cycles.',
    scope: ['tenant', 'network/site/geographic context'],
    keyData: ['entity reference', 'entity type', 'network/site relationship', 'geometry/location'],
    lifecycle: [
      'Planned',
      'Under Construction',
      'Commissioning',
      'In Service',
      'Out of Service',
      'Decommissioned'
    ],
    governance: [
      'Infrastructure Entity supports non-building asset classes without forcing building semantics.',
      'It may participate in a Network and span more than one Site.',
      'Project delivery provenance is retained as relationship/history, not identity ownership.'
    ]
  },
  {
    modelId: 'BE-LEVEL',
    candidateKeys: ['BOF-16-009'],
    canonicalName: 'Level',
    kind: 'spatial-object',
    definition:
      'A governed vertical/spatial subdivision of a Building or applicable facility context.',
    identityRule:
      'Stable Level identity within its physical context; labels/numbers may change without replacing identity.',
    scope: ['building', 'facility where applicable'],
    keyData: ['level code', 'name', 'elevation', 'parent building'],
    lifecycle: ['Planned', 'Current', 'Superseded', 'Retired'],
    governance: [
      'Level is spatial structure, not WBS or schedule structure.',
      'Infrastructure models do not have to use Levels.',
      'Spaces can reference Levels while Zones may overlay multiple Levels.'
    ]
  },
  {
    modelId: 'BE-ZONE',
    candidateKeys: ['BOF-16-010', 'BOF-12-003'],
    canonicalName: 'Zone',
    kind: 'spatial-object',
    definition:
      'A governed functional or spatial overlay grouping physical extents for engineering, operations, safety, access, logistics or other purposes.',
    identityRule:
      'Stable Zone identity within a declared zoning scheme/purpose; membership is effective and can cross hierarchy boundaries.',
    scope: ['site', 'building', 'facility', 'infrastructure entity', 'network'],
    keyData: ['zone code', 'zone type/purpose', 'member extents', 'effective dates'],
    lifecycle: ['Planned', 'Active', 'Inactive', 'Retired'],
    governance: [
      'Zone is an overlay, not necessarily a strict parent/child spatial hierarchy node.',
      'Construction operations reuse the same Zone identity where the business meaning is shared.',
      'Different zoning schemes may coexist without duplicating underlying Spaces or Assets.'
    ]
  },
  {
    modelId: 'BE-SPACE',
    candidateKeys: ['BOF-16-011'],
    canonicalName: 'Space',
    kind: 'spatial-object',
    definition:
      'A stable occupiable or functionally defined spatial unit within a Building/Facility context.',
    identityRule:
      'Stable Space identity with controlled geometry, use and adjacency history; redesign can supersede or transform spaces with traceability.',
    scope: ['building', 'level', 'facility'],
    keyData: ['space code/number', 'name/use', 'level/building', 'geometry/area', 'classification'],
    lifecycle: ['Planned', 'Current', 'Unavailable', 'Superseded', 'Retired'],
    governance: [
      'Space is not an Asset.',
      'Assets may be located in Spaces without ownership of the Space identity.',
      'Area and occupancy are time-sensitive attributes/measurements, not identity.'
    ]
  },
  {
    modelId: 'BE-LINEAR-SEGMENT',
    candidateKeys: ['BOF-16-012', 'BOF-16-013'],
    canonicalName: 'Linear Segment',
    kind: 'spatial-object',
    definition:
      'A stable segment of linear infrastructure used for topology, location, inspection, maintenance and delivery scope.',
    identityRule:
      'Stable segment identity; chainage/linear references are child/reference data scoped to the segment/network.',
    scope: ['network', 'infrastructure corridor', 'geographic context'],
    keyData: ['segment code', 'network', 'start/end references', 'geometry', 'direction/topology'],
    lifecycle: ['Planned', 'Active', 'Restricted', 'Out of Service', 'Retired'],
    governance: [
      'Linear Reference locates things on a segment; it is not a physical object.',
      'Segments may cross Sites/Properties and must not be forced into Building/Level/Space structure.',
      'Segment splits/merges preserve predecessor/successor traceability.'
    ]
  },
  {
    modelId: 'CBO-SYSTEM',
    candidateKeys: ['BOF-16-014', 'BOF-16-015'],
    canonicalName: 'System',
    kind: 'foundation-reference',
    definition:
      'The stable functional/technical System identity already governed by the foundation model, with hierarchical system membership where required.',
    identityRule:
      'Subsystem is another System in a governed parent/child relationship, not a parallel identity type.',
    scope: ['site', 'facility', 'building', 'infrastructure entity', 'network'],
    keyData: [
      'system ID/code',
      'classification/function',
      'parent system where applicable',
      'spatial/service context'
    ],
    lifecycle: [
      'Planned',
      'Installed',
      'Commissioning',
      'In Service',
      'Out of Service',
      'Decommissioned'
    ],
    governance: [
      'System structure is technical/functional, not WBS or spatial hierarchy.',
      'A System may span multiple Spaces or physical entities.',
      'Configuration membership is effective and historically traceable.'
    ]
  },
  {
    modelId: 'CBO-ASSET',
    candidateKeys: [
      'BOF-16-016',
      'BOF-16-019',
      'BOF-16-020',
      'BOF-16-021',
      'BOF-16-022',
      'BOF-16-025',
      'BOF-16-026'
    ],
    canonicalName: 'Asset',
    kind: 'foundation-reference',
    definition:
      'The stable whole-life Asset identity already governed by the foundation model and reused for plant, equipment, vehicles, tools, meters and sensors when individually managed.',
    identityRule:
      'One Asset identity persists through delivery, commissioning, location/system changes, warranty, maintenance, finance and retirement.',
    scope: ['tenant', 'site/spatial context', 'system', 'owning/operating organisation'],
    keyData: [
      'asset ID/tag',
      'Item/model relationship',
      'location',
      'system membership',
      'configuration/effectivity'
    ],
    lifecycle: [
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
    governance: [
      'Item is definition; Asset is the governed instance.',
      'Plant/equipment/vehicle/tool/meter/sensor are classifications or capabilities of Asset, not duplicate masters.',
      'Handover changes accountability and status but does not create a new Asset identity.'
    ]
  },
  {
    modelId: 'BE-COMPONENT',
    candidateKeys: ['BOF-16-017', 'BOF-16-018'],
    canonicalName: 'Component',
    kind: 'technical-object',
    definition:
      'A technical/configuration constituent of a System or Asset used where decomposition below Asset level is required.',
    identityRule:
      'Stable Component identity within governed configuration. If independent whole-life management is required, the physical item is represented by/linked to an Asset rather than duplicated.',
    scope: ['system', 'asset', 'technical configuration'],
    keyData: [
      'component reference',
      'parent configuration',
      'Item/type',
      'position/function',
      'effectivity'
    ],
    lifecycle: ['Planned', 'Installed', 'Active', 'Removed', 'Retired'],
    governance: [
      'Maintainable Item is a maintainability designation on an Asset/Component, not a second physical master.',
      'Component decomposition must not become an uncontrolled BOM clone.',
      'Configuration effectivity preserves which component was present when.'
    ]
  }
];

export const builtEnvironmentRelationships: BuiltEnvironmentRelationship[] = [
  {
    id: 'BE-R01',
    from: 'BE-ESTATE',
    predicate: 'governs',
    to: 'CBO-SITE',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Estate Membership',
    governance: 'Membership is effective; Site identity remains independent.'
  },
  {
    id: 'BE-R02',
    from: 'BE-ESTATE',
    predicate: 'governs',
    to: 'BE-PROPERTY',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Estate Property Membership',
    governance: 'Property can move between management portfolios without new identity.'
  },
  {
    id: 'BE-R03',
    from: 'CBO-SITE',
    predicate: 'contains/overlaps',
    to: 'BE-LAND-PARCEL',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Site Parcel Association',
    governance:
      'Geometry/effectivity makes overlap explicit; Site and Parcel remain distinct concepts.'
  },
  {
    id: 'BE-R04',
    from: 'BE-PROPERTY',
    predicate: 'situated at',
    to: 'CBO-SITE',
    cardinality: '0..* ↔ 0..*',
    governance: 'Property may span or relate to more than one Site.'
  },
  {
    id: 'BE-R05',
    from: 'BE-PROPERTY',
    predicate: 'comprises',
    to: 'BE-BUILDING',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Property Composition',
    governance: 'Physical composition and legal/real-estate identity remain distinguishable.'
  },
  {
    id: 'BE-R06',
    from: 'BE-FACILITY',
    predicate: 'occupies/uses',
    to: 'BE-BUILDING',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Facility Accommodation',
    governance: 'Operational Facility identity is decoupled from physical Building identity.'
  },
  {
    id: 'BE-R07',
    from: 'BE-FACILITY',
    predicate: 'occupies/uses',
    to: 'BE-INFRASTRUCTURE-ENTITY',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Facility Accommodation',
    governance:
      'Allows operational facilities to be infrastructure-based rather than building-only.'
  },
  {
    id: 'BE-R08',
    from: 'BE-BUILDING',
    predicate: 'contains',
    to: 'BE-LEVEL',
    cardinality: '1 ↔ 0..*',
    governance: 'Level belongs to a physical building context; numbering is a business identifier.'
  },
  {
    id: 'BE-R09',
    from: 'BE-LEVEL',
    predicate: 'contains',
    to: 'BE-SPACE',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Some Spaces may be represented without Level where the built form requires it.'
  },
  {
    id: 'BE-R10',
    from: 'BE-ZONE',
    predicate: 'groups/overlays',
    to: 'BE-SPACE',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Zone Membership',
    governance: 'Zone overlay does not replace Space hierarchy or identity.'
  },
  {
    id: 'BE-R11',
    from: 'BE-NETWORK',
    predicate: 'comprises',
    to: 'BE-INFRASTRUCTURE-ENTITY',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Network Membership',
    governance: 'Infrastructure can participate in a network without losing independent identity.'
  },
  {
    id: 'BE-R12',
    from: 'BE-NETWORK',
    predicate: 'comprises',
    to: 'BE-LINEAR-SEGMENT',
    cardinality: '1 ↔ 0..*',
    governance: 'Segment topology is governed independently of Project or WBS structure.'
  },
  {
    id: 'BE-R13',
    from: 'CBO-SYSTEM',
    predicate: 'parent of',
    to: 'CBO-SYSTEM',
    cardinality: '0..1 ↔ 0..*',
    relationshipObject: 'System Hierarchy Membership',
    governance: 'Subsystem is represented by another System in the same canonical model.'
  },
  {
    id: 'BE-R14',
    from: 'CBO-SYSTEM',
    predicate: 'serves',
    to: 'BE-FACILITY',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'System Service Relationship',
    governance: 'Functional service relationship can span several physical locations.'
  },
  {
    id: 'BE-R15',
    from: 'CBO-ASSET',
    predicate: 'member of',
    to: 'CBO-SYSTEM',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'System Asset Membership',
    governance: 'Configuration/effectivity records which Assets belonged to which Systems when.'
  },
  {
    id: 'BE-R16',
    from: 'CBO-ASSET',
    predicate: 'located in/at',
    to: 'BE-SPACE',
    cardinality: '0..1 ↔ 0..*',
    relationshipObject: 'Asset Spatial Placement',
    governance: 'Location changes do not change Asset identity and are historically traceable.'
  },
  {
    id: 'BE-R17',
    from: 'CBO-ASSET',
    predicate: 'located on',
    to: 'BE-LINEAR-SEGMENT',
    cardinality: '0..1 ↔ 0..*',
    relationshipObject: 'Asset Linear Placement',
    governance:
      'Placement can carry chainage/linear reference without making that reference an Asset.'
  },
  {
    id: 'BE-R18',
    from: 'BE-COMPONENT',
    predicate: 'part of',
    to: 'CBO-ASSET',
    cardinality: '0..* ↔ 0..1',
    relationshipObject: 'Configuration Membership',
    governance:
      'Component configuration is effective-dated; independently managed physical objects use Asset identity.'
  },
  {
    id: 'BE-R19',
    from: 'CBO-PROJECT',
    predicate: 'delivers/changes',
    to: 'BE-BUILDING',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Project Delivery Scope',
    governance:
      'Project provenance is retained without making the Building a child identity of the Project.'
  },
  {
    id: 'BE-R20',
    from: 'CBO-PROJECT',
    predicate: 'delivers/changes',
    to: 'BE-INFRASTRUCTURE-ENTITY',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Project Delivery Scope',
    governance: 'Infrastructure survives beyond the Project that creates or modifies it.'
  },
  {
    id: 'BE-R21',
    from: 'CBO-PROJECT',
    predicate: 'delivers/changes',
    to: 'CBO-ASSET',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Project Asset Provenance',
    governance: 'Handover transfers operational accountability; Asset identity is continuous.'
  },
  {
    id: 'BE-R22',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes/evidences',
    to: 'CBO-ASSET',
    cardinality: '0..* ↔ 0..*',
    relationshipObject: 'Information Subject Link',
    governance:
      'Controlled information references canonical objects rather than becoming the asset/location model itself.'
  }
];

export const builtEnvironmentPatterns: BuiltEnvironmentPattern[] = [
  {
    name: 'Estate/property pattern',
    structure: 'Estate → Site / Land Parcel → Property → Building / Facility',
    purpose: 'Govern property, ownership/occupation context and operational places.',
    mustNotBecome: 'a mandatory tree for every infrastructure asset'
  },
  {
    name: 'Building spatial pattern',
    structure: 'Building → Level → Space; Zone overlays',
    purpose: 'Provide stable spatial context for building-based delivery and operations.',
    mustNotBecome: 'WBS, schedule or document folder structure'
  },
  {
    name: 'Linear infrastructure pattern',
    structure: 'Network → Infrastructure Entity / Linear Segment → linear references',
    purpose:
      'Model roads, rail, utilities and other networked/linear infrastructure without building assumptions.',
    mustNotBecome: 'Building → Level → Space forced onto infrastructure'
  },
  {
    name: 'Technical pattern',
    structure: 'System → Asset → Component; Item defines Asset',
    purpose: 'Preserve whole-life technical identity, configuration and maintainability.',
    mustNotBecome: 'separate construction, FM, finance and maintenance asset masters'
  }
];

export const builtEnvironmentRules = [
  'Project structure and permanent built-environment structure are separate dimensions connected by governed relationships.',
  'Site is not Project; mobilisation and construction-site status belong to the Project-to-Site operating context.',
  'Property, Facility and Building are different concepts: real-estate identity, operational place and physical built entity respectively.',
  'Linear infrastructure uses Network/Infrastructure Entity/Linear Segment semantics and is never forced into a building hierarchy.',
  'Zone is an overlay and may cross Spaces, Levels, Sites or infrastructure extents; it is not automatically a strict parent node.',
  'System is a functional/technical structure and may span spatial boundaries.',
  'Subsystem is another System in hierarchy, not a separate canonical master.',
  'Item is a product/material/service definition; Asset is the governed installed/operational instance.',
  'Plant, equipment, vehicles, tools, meters and sensors reuse Asset identity when individually governed.',
  'Maintainable Item is a maintainability designation on Asset/Component, not a duplicate physical identity.',
  'Asset identity survives handover, operator changes, location changes, system changes, maintenance and financial treatment.',
  'Approved project data, BIM/CDE records and documents reference canonical spatial/physical objects; files do not become the asset model.',
  'All hierarchy/configuration memberships that can change over time require effectivity/history rather than destructive replacement.',
  'No workspace may maintain a private duplicate of Site, Building, Infrastructure Entity, System or Asset truth.'
];

export function validateBuiltEnvironmentModel() {
  const ids = new Set<string>();
  const candidates = new Set<string>();
  for (const item of builtEnvironmentModel) {
    if (!item.modelId || ids.has(item.modelId))
      throw new Error(`Duplicate built-environment model ID: ${item.modelId}`);
    ids.add(item.modelId);
    for (const candidate of item.candidateKeys) {
      if (candidates.has(candidate))
        throw new Error(`Duplicate built-environment candidate: ${candidate}`);
      candidates.add(candidate);
    }
    if (!item.definition || !item.identityRule || !item.scope.length || !item.governance.length)
      throw new Error(`Incomplete built-environment definition: ${item.modelId}`);
  }
  const external = new Set(['CBO-PROJECT', 'CBO-INFORMATION-CONTAINER']);
  for (const relationship of builtEnvironmentRelationships) {
    if (!ids.has(relationship.from) && !external.has(relationship.from))
      throw new Error(`Unknown relationship source: ${relationship.from}`);
    if (!ids.has(relationship.to) && !external.has(relationship.to))
      throw new Error(`Unknown relationship target: ${relationship.to}`);
  }
  return true;
}
