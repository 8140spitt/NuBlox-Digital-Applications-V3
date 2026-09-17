export type ItemManufacturingKind =
  | 'foundation-reference'
  | 'controlled-definition'
  | 'relationship'
  | 'commercial-definition'
  | 'structure'
  | 'traceability-identity'
  | 'plan'
  | 'work'
  | 'event-evidence'
  | 'resource-context';

export type ItemManufacturingDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: ItemManufacturingKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type ItemManufacturingRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type ItemManufacturingBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const itemManufacturingModel: ItemManufacturingDefinition[] = [
  {
    modelId: 'CBO-ITEM',
    candidateKeys: ['BOF-10-001', 'BOF-10-002', 'BOF-10-003'],
    canonicalName: 'Item',
    kind: 'foundation-reference',
    definition: 'The stable reusable commercial/technical definition for a product, material or service that can be estimated, specified, sourced, priced, stocked, manufactured, sold or consumed.',
    identityRule: 'One immutable Item identity; product/material/service meaning is classification and behaviour, not a parallel master.',
    scope: ['tenant', 'legal entity where commercial governance differs', 'catalogue/product-data context'],
    keyData: ['item number', 'item type/classification', 'name/description', 'base unit of measure', 'status', 'technical/commercial classifications'],
    lifecycle: ['Draft', 'Active', 'Blocked', 'Obsolete', 'Retired'],
    governance: [
      'Product Item, Material Item and Service Item use one Item master.',
      'One Item can be referenced by estimates, specifications, procurement, inventory, manufacturing and assets without duplication.',
      'An Item is a definition, not a stock quantity, batch, serial instance or installed Asset.'
    ]
  },
  {
    modelId: 'ITEM-SPECIFICATION',
    candidateKeys: ['BOF-10-004'],
    canonicalName: 'Item Specification',
    kind: 'controlled-definition',
    definition: 'A governed technical/commercial specification of an Item or Item family, including required attributes, performance and compliance characteristics.',
    identityRule: 'Stable specification identity with governed revisions/effectivity; Item identity remains unchanged when a specification revision changes.',
    scope: ['item', 'item family/classification', 'jurisdiction/project applicability where required'],
    keyData: ['specification number', 'revision', 'requirements/attributes', 'standards', 'effectivity/applicability'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn'],
    governance: [
      'Approved revisions are immutable and superseded rather than overwritten.',
      'Project-specific requirements can reference the specification without creating a duplicate Item master.',
      'Binary documents may evidence the specification but structured requirements remain canonical where needed.'
    ]
  },
  {
    modelId: 'ITEM-VARIANT',
    candidateKeys: ['BOF-10-005'],
    canonicalName: 'Item Variant',
    kind: 'controlled-definition',
    definition: 'A governed variant/configuration of an Item distinguished by selected characteristics while remaining part of the same product family.',
    identityRule: 'Stable Variant identity linked to one base Item/family; configurable characteristics and effectivity are explicit.',
    scope: ['item', 'configuration/classification'],
    keyData: ['variant code', 'base Item', 'characteristic values', 'status', 'effectivity'],
    lifecycle: ['Draft', 'Active', 'Blocked', 'Obsolete'],
    governance: [
      'Variant is not a serial instance or Asset.',
      'Variant logic must not create arbitrary duplicate Item masters for every project selection.',
      'A tenant may promote a recurrent variant to a governed Item where independent commercial identity is required.'
    ]
  },
  {
    modelId: 'ITEM-SUBSTITUTION',
    candidateKeys: ['BOF-10-006'],
    canonicalName: 'Item Substitution',
    kind: 'relationship',
    definition: 'A governed relationship stating that one Item may substitute for another under explicit conditions, scope and effectivity.',
    identityRule: 'Relationship identity between canonical Items; neither source nor substitute Item identity changes.',
    scope: ['item', 'project/contract/jurisdiction applicability where needed'],
    keyData: ['original Item', 'substitute Item', 'substitution type', 'conditions', 'approval/effectivity'],
    lifecycle: ['Proposed', 'Approved', 'Effective', 'Suspended', 'Expired'],
    governance: [
      'Substitution is not equivalence unless explicitly classified as such.',
      'Project/contract approvals remain separate evidence.',
      'Historic procurement/installation must retain the actual Item used.'
    ]
  },
  {
    modelId: 'ITEM-MANUFACTURER-REL',
    candidateKeys: ['BOF-10-007'],
    canonicalName: 'Manufacturer-Item Relationship',
    kind: 'relationship',
    definition: 'A governed relationship linking a canonical Organisation/Party acting as manufacturer to an Item and its manufacturer-specific identity.',
    identityRule: 'Relationship identity; manufacturer part numbers are external/business identifiers, not replacement NuBlox Item identities.',
    scope: ['item', 'manufacturer Party', 'market/jurisdiction'],
    keyData: ['manufacturer Party', 'Item', 'manufacturer part number', 'status', 'validity'],
    lifecycle: ['Proposed', 'Approved', 'Active', 'Inactive', 'Ended'],
    governance: [
      'Manufacturer is a Party role/relationship, not a duplicate Organisation master.',
      'Multiple manufacturers may map to one governed generic Item where semantics allow.',
      'Manufacturer-specific product identity can be represented without contaminating shared Party identity.'
    ]
  },
  {
    modelId: 'ITEM-SUPPLIER-REL',
    candidateKeys: ['BOF-10-008'],
    canonicalName: 'Supplier-Item Relationship',
    kind: 'relationship',
    definition: 'A governed commercial relationship between a supplier Party and an Item, carrying supplier-specific identifiers, ordering constraints and commercial applicability.',
    identityRule: 'Relationship identity; supplier SKU/catalogue references do not replace Item identity.',
    scope: ['supplier relationship', 'item', 'legal entity/procurement context'],
    keyData: ['supplier Party', 'Item', 'supplier SKU', 'lead time', 'minimum order', 'validity/status'],
    lifecycle: ['Proposed', 'Qualified', 'Active', 'Suspended', 'Ended'],
    governance: [
      'Supplier qualification and supplier-item approval remain explicit.',
      'One Item may have multiple suppliers and one supplier may supply many Items.',
      'Price is time/effectivity controlled separately from the relationship identity.'
    ]
  },
  {
    modelId: 'ITEM-CATALOGUE',
    candidateKeys: ['BOF-10-009'],
    canonicalName: 'Catalogue',
    kind: 'commercial-definition',
    definition: 'A governed collection/view of Items offered, procurable or otherwise available within a defined commercial context.',
    identityRule: 'Stable Catalogue identity; membership is an effective relationship to Items.',
    scope: ['tenant', 'legal entity', 'supplier/customer/channel context'],
    keyData: ['catalogue code', 'owner/context', 'currency/market where applicable', 'effective dates', 'membership'],
    lifecycle: ['Draft', 'Active', 'Suspended', 'Expired', 'Archived'],
    governance: [
      'Catalogue membership does not create duplicate Items.',
      'Supplier catalogues can map external identifiers to canonical Items.',
      'Catalogue and Price List are separate but related commercial definitions.'
    ]
  },
  {
    modelId: 'ITEM-PRICE-LIST',
    candidateKeys: ['BOF-10-010', 'BOF-10-011'],
    canonicalName: 'Price List',
    kind: 'commercial-definition',
    definition: 'An effective-dated governed set of commercial rates/prices for Items, services or resource classifications within a defined context.',
    identityRule: 'Stable Price List identity; price/rate entries are effective-dated children and do not alter Item identity.',
    scope: ['legal entity', 'supplier/customer/channel', 'currency', 'commercial agreement'],
    keyData: ['price-list code', 'currency', 'effective dates', 'price/rate entries', 'commercial basis'],
    lifecycle: ['Draft', 'Approved', 'Active', 'Superseded', 'Expired'],
    governance: [
      'Commercial Rate is modelled as a rate/price entry within an appropriate Price List or commercial context.',
      'Historic transactions preserve the rate actually applied.',
      'Estimate/build-up rates may reference but are not required to equal catalogue purchase/sales prices.'
    ]
  },
  {
    modelId: 'CBO-UOM',
    candidateKeys: ['BOF-10-012', 'BOF-29-004'],
    canonicalName: 'Unit of Measure',
    kind: 'foundation-reference',
    definition: 'Shared governed reference data defining measurable units and permitted conversions used across Items, quantities, costs and operations.',
    identityRule: 'One canonical unit code/identity; context-specific aliases map to it rather than creating duplicate unit definitions.',
    scope: ['tenant/reference data', 'measurement system'],
    keyData: ['unit code', 'dimension', 'symbol', 'conversion basis', 'status'],
    lifecycle: ['Active', 'Deprecated', 'Retired'],
    governance: [
      'Unit of Measure is shared reference data, not owned by the Item domain.',
      'Conversions must be dimensionally valid and governed.',
      'Transactional quantities retain both recorded quantity/unit and canonical conversion where used.'
    ]
  },
  {
    modelId: 'ITEM-BOM',
    candidateKeys: ['BOF-10-013', 'BOF-11-002'],
    canonicalName: 'Bill of Material',
    kind: 'structure',
    definition: 'A governed product/material structure defining component Items and quantities required to realise a parent Item or manufacturing definition.',
    identityRule: 'Stable BOM identity/version associated with a parent Item/manufacturing definition; approved versions are immutable.',
    scope: ['item', 'manufacturing definition', 'effectivity/configuration'],
    keyData: ['BOM number/version', 'parent Item', 'component Item', 'quantity/UOM', 'effectivity', 'alternates/substitutions'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Obsolete'],
    governance: [
      'BOM is a product structure, not the physical Asset hierarchy and not project WBS.',
      'Assembly is represented by an Item that may own/use a BOM rather than a separate duplicate item master.',
      'Actual manufactured/installed configuration can deviate only through governed traceable change/substitution.'
    ]
  },
  {
    modelId: 'MFG-DEFINITION',
    candidateKeys: ['BOF-11-001'],
    canonicalName: 'Manufacturing Definition',
    kind: 'controlled-definition',
    definition: 'The governed manufacturing configuration for producing an Item, tying together applicable BOM, process plan/routing, resources and effectivity.',
    identityRule: 'Stable manufacturing-definition identity/version linked to the Item; it does not replace Item identity.',
    scope: ['item', 'manufacturing site/work centre', 'effectivity'],
    keyData: ['Item', 'revision/version', 'BOM', 'process plan', 'site/work-centre applicability', 'effectivity'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Obsolete'],
    governance: [
      'Manufacturing definition is configuration, not a second Product master.',
      'Approved revisions are immutable.',
      'The same Item may have multiple effective manufacturing definitions for different sites/processes where governed.'
    ]
  },
  {
    modelId: 'MFG-PROCESS-PLAN',
    candidateKeys: ['BOF-11-003', 'BOF-11-004'],
    canonicalName: 'Manufacturing Process Plan',
    kind: 'controlled-definition',
    definition: 'A governed sequence/structure of manufacturing operations, routing and required resources used to produce an Item.',
    identityRule: 'Stable process-plan identity/version; routing is a controlled structure within the plan rather than a duplicate product identity.',
    scope: ['manufacturing definition', 'site/work centre'],
    keyData: ['process-plan number/version', 'operations/routing', 'work centres', 'standard times', 'required resources'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded'],
    governance: [
      'Routing is normalised into the governed Process Plan pattern.',
      'Process-plan operations are definitions; Production Operations are execution instances.',
      'Schedule Activities may reference production work but are not manufacturing operations by identity.'
    ]
  },
  {
    modelId: 'MFG-WORK-CENTRE',
    candidateKeys: ['BOF-11-005'],
    canonicalName: 'Work Centre',
    kind: 'resource-context',
    definition: 'A governed production-capacity context representing where/how manufacturing operations are performed, linked to organisation, site and assets as applicable.',
    identityRule: 'Stable Work Centre identity; underlying Site, Organisation Unit and Asset identities remain canonical in their own models.',
    scope: ['manufacturing site', 'organisation unit', 'capacity/resource planning'],
    keyData: ['work-centre code', 'site/location', 'responsible organisation', 'capacity', 'linked plant/equipment'],
    lifecycle: ['Planned', 'Active', 'Unavailable', 'Retired'],
    governance: [
      'Work Centre is a production planning context, not a duplicate Site or Asset.',
      'Capacity changes are effective-dated/planned rather than rewriting historical execution.',
      'Operations record the actual work centre/resource used.'
    ]
  },
  {
    modelId: 'MFG-PRODUCTION-ORDER',
    candidateKeys: ['BOF-11-006', 'BOF-11-007', 'BOF-11-008'],
    canonicalName: 'Production Order',
    kind: 'work',
    definition: 'A governed execution order authorising production of a specified Item/configuration and quantity using a manufacturing definition/process plan.',
    identityRule: 'Stable order identity; Production Plan supplies planning context and Production Operations are child execution steps.',
    scope: ['manufacturing site/work centre', 'item/manufacturing definition', 'project/customer order where relevant'],
    keyData: ['order number', 'Item/configuration', 'quantity/UOM', 'dates', 'process plan', 'status', 'source demand'],
    lifecycle: ['Planned', 'Released', 'In Progress', 'Paused', 'Completed', 'Closed', 'Cancelled'],
    governance: [
      'Production Plan is planning context; Production Order is authorised execution.',
      'Production Operation is a child/execution step, not a second order master.',
      'Completion records actual material/resource consumption and produced traceability identities.'
    ]
  },
  {
    modelId: 'TRACE-LOT',
    candidateKeys: ['BOF-10-015', 'BOF-11-010'],
    canonicalName: 'Lot',
    kind: 'traceability-identity',
    definition: 'A traceable quantity identity grouping Item quantity produced, received or otherwise controlled together under common provenance.',
    identityRule: 'Stable Lot identity tied to one Item/configuration and provenance; quantity movements do not change the lot identity.',
    scope: ['item', 'legal entity/site/warehouse', 'production/procurement provenance'],
    keyData: ['lot number', 'Item', 'quantity/UOM', 'source', 'manufacture/receipt dates', 'quality/status'],
    lifecycle: ['Created', 'Available', 'Restricted', 'Consumed', 'Expired', 'Closed'],
    governance: [
      'Production Lot reuses the shared Lot identity.',
      'Lot is not Item identity and is not an installed Asset.',
      'Traceability links to receipts, production orders, inspections and downstream consumption are retained.'
    ]
  },
  {
    modelId: 'TRACE-BATCH',
    candidateKeys: ['BOF-10-016', 'BOF-11-009'],
    canonicalName: 'Batch',
    kind: 'traceability-identity',
    definition: 'A traceable production/process grouping representing quantity produced or processed together under common execution conditions.',
    identityRule: 'Stable Batch identity linked to Item/manufacturing execution; batch lineage is retained across splits/merges where allowed.',
    scope: ['production order/process', 'item', 'site/work centre'],
    keyData: ['batch number', 'Item', 'production order', 'quantity/UOM', 'process dates', 'quality/provenance'],
    lifecycle: ['Planned', 'In Process', 'Produced', 'Released', 'Restricted', 'Closed'],
    governance: [
      'Production Batch reuses the shared Batch identity.',
      'Lot and Batch may be configured distinctly where sector/regulatory semantics require; they are not assumed synonyms.',
      'Batch genealogy must remain auditable.'
    ]
  },
  {
    modelId: 'TRACE-SERIAL',
    candidateKeys: ['BOF-10-017'],
    canonicalName: 'Serial Identity',
    kind: 'traceability-identity',
    definition: 'A unique traceability identity for an individual Item instance before or independent of installed Asset registration.',
    identityRule: 'Stable serial identity scoped by Item/manufacturer rules; serial value is a governed business identifier.',
    scope: ['item', 'manufacturer/tenant serial scheme'],
    keyData: ['serial number', 'Item', 'manufacturer', 'production/receipt provenance', 'status'],
    lifecycle: ['Created', 'Available', 'Allocated', 'Installed/Consumed', 'Returned', 'Retired'],
    governance: [
      'Serial Identity is not automatically an Asset; an Asset may reference a serial identity when installed/operational governance requires it.',
      'Serial provenance survives project handover and ownership/service lifecycle changes.',
      'Duplicate serial handling is governed by manufacturer/item scope.'
    ]
  },
  {
    modelId: 'MFG-AS-MANUFACTURED',
    candidateKeys: ['BOF-11-012', 'BOF-11-013', 'BOF-11-014', 'BOF-11-017'],
    canonicalName: 'As-Manufactured Configuration',
    kind: 'event-evidence',
    definition: 'The evidenced actual configuration/provenance of manufactured output, including actual components, batches/lots/serials, process completion and quality evidence.',
    identityRule: 'Immutable configuration/evidence snapshot per produced unit/batch/lot or governed output; corrections are explicit events.',
    scope: ['production order', 'produced lot/batch/serial', 'item/manufacturing definition'],
    keyData: ['actual components/materials', 'lot/batch/serial genealogy', 'operations/work centres', 'quality records', 'completion timestamp'],
    lifecycle: ['Recorded', 'Validated', 'Released', 'Corrected/Superseded'],
    governance: [
      'As-manufactured configuration records actual truth and does not rewrite the approved manufacturing definition.',
      'Shop-floor progress, production quality and traceability records feed this evidence chain.',
      'Downstream Asset/installation provenance references this configuration rather than recreating manufacturing history.'
    ]
  }
];

export const itemManufacturingRelationships: ItemManufacturingRelationship[] = [
  { id: 'IM-R01', from: 'CBO-ITEM', predicate: 'governed by', to: 'ITEM-SPECIFICATION', cardinality: '1 ↔ 0..*', governance: 'Specifications are versioned/effective; Item identity remains stable.' },
  { id: 'IM-R02', from: 'CBO-ITEM', predicate: 'has variant', to: 'ITEM-VARIANT', cardinality: '1 ↔ 0..*', governance: 'Variant remains configuration, not serial/asset identity.' },
  { id: 'IM-R03', from: 'CBO-ITEM', predicate: 'substituted by', to: 'CBO-ITEM', cardinality: '0..* ↔ 0..*', relationshipObject: 'Item Substitution', governance: 'Conditions, approval and effectivity belong to the relationship.' },
  { id: 'IM-R04', from: 'CBO-ITEM', predicate: 'manufactured by', to: 'ITEM-MANUFACTURER-REL', cardinality: '1 ↔ 0..*', governance: 'Relationship links Item to canonical manufacturer Party and external manufacturer ID.' },
  { id: 'IM-R05', from: 'CBO-ITEM', predicate: 'supplied through', to: 'ITEM-SUPPLIER-REL', cardinality: '1 ↔ 0..*', governance: 'Supplier-item relation carries supplier-specific commercial ordering data.' },
  { id: 'IM-R06', from: 'ITEM-CATALOGUE', predicate: 'contains', to: 'CBO-ITEM', cardinality: '0..* ↔ 0..*', relationshipObject: 'Catalogue Membership', governance: 'Catalogue membership is effective; no duplicate Item master.' },
  { id: 'IM-R07', from: 'ITEM-PRICE-LIST', predicate: 'prices', to: 'CBO-ITEM', cardinality: '0..* ↔ 0..*', relationshipObject: 'Price/Rate Entry', governance: 'Entry carries currency, quantity break, context and effectivity.' },
  { id: 'IM-R08', from: 'CBO-ITEM', predicate: 'measured in', to: 'CBO-UOM', cardinality: '1 ↔ 1', governance: 'Base UOM is governed reference data; alternative transaction units require valid conversion.' },
  { id: 'IM-R09', from: 'ITEM-BOM', predicate: 'defines structure for', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'One effective BOM/version applies according to configuration/effectivity rules.' },
  { id: 'IM-R10', from: 'ITEM-BOM', predicate: 'contains component', to: 'CBO-ITEM', cardinality: '1 ↔ 0..*', relationshipObject: 'BOM Line', governance: 'BOM line carries quantity/UOM, position, effectivity and substitute/alternate rules.' },
  { id: 'IM-R11', from: 'MFG-DEFINITION', predicate: 'produces', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'Manufacturing definition is version/effectivity controlled and never replaces Item identity.' },
  { id: 'IM-R12', from: 'MFG-DEFINITION', predicate: 'uses', to: 'ITEM-BOM', cardinality: '0..* ↔ 0..*', governance: 'Applicable BOM version is governed by manufacturing-definition effectivity.' },
  { id: 'IM-R13', from: 'MFG-DEFINITION', predicate: 'uses', to: 'MFG-PROCESS-PLAN', cardinality: '0..* ↔ 1..*', governance: 'Process plan/routing is controlled separately from BOM/product structure.' },
  { id: 'IM-R14', from: 'MFG-PROCESS-PLAN', predicate: 'performed at', to: 'MFG-WORK-CENTRE', cardinality: '0..* ↔ 0..*', relationshipObject: 'Operation Resource Requirement', governance: 'Definitions state required/allowed work centres; execution captures actual centre/resource.' },
  { id: 'IM-R15', from: 'MFG-PRODUCTION-ORDER', predicate: 'executes', to: 'MFG-DEFINITION', cardinality: '0..* ↔ 1', governance: 'Order records the manufacturing-definition version actually authorised.' },
  { id: 'IM-R16', from: 'MFG-PRODUCTION-ORDER', predicate: 'produces', to: 'TRACE-LOT', cardinality: '0..* ↔ 0..*', governance: 'Lot provenance retains the producing order.' },
  { id: 'IM-R17', from: 'MFG-PRODUCTION-ORDER', predicate: 'produces', to: 'TRACE-BATCH', cardinality: '0..* ↔ 0..*', governance: 'Batch genealogy retains production execution/provenance.' },
  { id: 'IM-R18', from: 'MFG-PRODUCTION-ORDER', predicate: 'produces', to: 'TRACE-SERIAL', cardinality: '0..* ↔ 0..*', governance: 'Serialized output retains order/item/manufacturer provenance.' },
  { id: 'IM-R19', from: 'MFG-PRODUCTION-ORDER', predicate: 'evidenced by', to: 'MFG-AS-MANUFACTURED', cardinality: '1 ↔ 0..*', governance: 'Actual configuration/evidence is immutable and linked to output traceability identities.' }
];

export const itemManufacturingBoundaries: ItemManufacturingBoundary[] = [
  { name: 'Definition', structure: 'Item → Specification / Variant', purpose: 'Reusable product/material/service meaning.', mustNotBecome: 'stock instance, Asset or project-specific duplicate master' },
  { name: 'Commercial', structure: 'Catalogue / Price List ↔ Item', purpose: 'Availability, supplier/customer/channel and pricing context.', mustNotBecome: 'Item identity or transactional invoice/order history' },
  { name: 'Product structure', structure: 'Item → BOM → component Items', purpose: 'Governed technical/material composition.', mustNotBecome: 'WBS, Asset hierarchy or installed configuration' },
  { name: 'Manufacturing', structure: 'Manufacturing Definition → Process Plan → Work Centre', purpose: 'How an Item is produced.', mustNotBecome: 'Item master or production execution history' },
  { name: 'Traceability', structure: 'Lot / Batch / Serial', purpose: 'Actual quantity/unit provenance.', mustNotBecome: 'Item definition or automatically an Asset' },
  { name: 'Actual configuration', structure: 'Production Order → As-Manufactured Configuration', purpose: 'Evidence of what was actually produced.', mustNotBecome: 'approved design/manufacturing definition' }
];

export const itemManufacturingRules = [
  'Product, material and service are governed Item types/classifications, not separate master-data silos.',
  'Item definition, stock quantity, lot/batch, serial instance and Asset identity are different semantic layers.',
  'BOM/product structure is distinct from WBS/project scope and from the installed Asset/System hierarchy.',
  'Assembly is an Item role/type with product structure; it does not require a second Assembly master.',
  'Manufacturer and supplier identities reuse canonical Party/Organisation records through relationships.',
  'Catalogue membership and pricing never duplicate Item identity.',
  'Approved specifications, BOMs, manufacturing definitions and process plans are revision/effectivity controlled and not silently overwritten.',
  'Production execution references the exact governed definition versions used.',
  'Lot, Batch and Serial identities preserve provenance through procurement, production, inventory, installation and operations.',
  'Creating an Asset from/for an Item or serial is an explicit governed registration/installation relationship, not an automatic rename.',
  'As-manufactured truth records actual configuration and evidence; it does not rewrite the approved product/manufacturing definition.'
];

export function validateItemManufacturingModel() {
  const ids = new Set<string>();
  for (const item of itemManufacturingModel) {
    if (!item.modelId || ids.has(item.modelId)) throw new Error(`Duplicate item/manufacturing model ID: ${item.modelId}`);
    if (!item.candidateKeys.length || !item.scope.length || !item.keyData.length || !item.governance.length) throw new Error(`Incomplete item/manufacturing definition: ${item.modelId}`);
    ids.add(item.modelId);
  }
  for (const rel of itemManufacturingRelationships) {
    if (!ids.has(rel.from) || !ids.has(rel.to)) throw new Error(`Unknown relationship endpoint: ${rel.id}`);
  }
  return true;
}
