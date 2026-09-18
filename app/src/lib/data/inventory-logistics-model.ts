export type InventoryLogisticsKind =
  | 'storage-context'
  | 'relationship'
  | 'projection'
  | 'event-evidence'
  | 'work'
  | 'transaction'
  | 'case'
  | 'compliance-record';

export type InventoryLogisticsDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: InventoryLogisticsKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type InventoryLogisticsRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type InventoryLogisticsBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const inventoryLogisticsModel: InventoryLogisticsDefinition[] = [
  {
    modelId: 'INV-WAREHOUSE',
    candidateKeys: ['BOF-10-018'],
    canonicalName: 'Warehouse',
    kind: 'storage-context',
    definition: 'A governed inventory-storage and logistics context associated with a canonical Site or Facility and responsible organisation.',
    identityRule: 'Stable Warehouse identity; site/location changes are governed relationships and do not create a new Item or stock identity.',
    scope: ['tenant', 'legal entity', 'site/facility', 'inventory organisation'],
    keyData: ['warehouse code', 'site/facility', 'responsible organisation', 'operating status'],
    lifecycle: ['Planned', 'Active', 'Restricted', 'Inactive', 'Closed'],
    governance: [
      'Warehouse is not a Site, Facility, Project, WBS node or Asset hierarchy.',
      'A warehouse contains storage contexts; it does not own duplicate Item masters.',
      'Stock position is derived from traceable inventory events and reservations.'
    ]
  },
  {
    modelId: 'INV-STORE',
    candidateKeys: ['BOF-10-019'],
    canonicalName: 'Store',
    kind: 'storage-context',
    definition: 'A governed storage subdivision within a Warehouse or Site logistics context.',
    identityRule: 'Stable Store identity within its inventory context; relocation does not redefine Item or traceability identity.',
    scope: ['warehouse', 'site', 'inventory organisation'],
    keyData: ['store code', 'parent warehouse/site', 'storage purpose', 'status'],
    lifecycle: ['Planned', 'Active', 'Restricted', 'Inactive', 'Closed'],
    governance: [
      'Store is a storage context and must not be confused with a retail catalogue or physical Asset.',
      'Store hierarchy remains independent of project WBS and built-asset hierarchy.'
    ]
  },
  {
    modelId: 'INV-BIN',
    candidateKeys: ['BOF-10-020'],
    canonicalName: 'Bin Location',
    kind: 'storage-context',
    definition: 'The lowest governed inventory storage location used to identify where stock is physically or logically held.',
    identityRule: 'Stable Bin Location identity under a Store/Warehouse; codes are business identifiers and can be changed with retained history.',
    scope: ['store', 'warehouse'],
    keyData: ['bin code', 'parent store/warehouse', 'storage constraints', 'status'],
    lifecycle: ['Active', 'Blocked', 'Inactive', 'Retired'],
    governance: [
      'Bin Location does not replace Site/Space identity even where mapped to one.',
      'Inventory events record from/to locations explicitly.'
    ]
  },
  {
    modelId: 'INV-RESERVATION',
    candidateKeys: ['BOF-10-021'],
    canonicalName: 'Inventory Reservation',
    kind: 'relationship',
    definition: 'An effective commitment of available inventory quantity to a demand context without changing ownership or physical location.',
    identityRule: 'Stable reservation relationship identity referencing demand, Item and optional lot/batch/serial/location constraints.',
    scope: ['inventory organisation', 'project/work package/order/demand'],
    keyData: ['Item', 'quantity/UOM', 'demand subject', 'location constraints', 'lot/batch/serial constraints', 'expiry'],
    lifecycle: ['Requested', 'Reserved', 'Partially Fulfilled', 'Fulfilled', 'Released', 'Expired', 'Cancelled'],
    governance: [
      'Reservation is not stock itself and never mutates Item identity.',
      'Reserved quantity is a projection from active reservations and inventory position.'
    ]
  },
  {
    modelId: 'INV-MOVEMENT',
    candidateKeys: ['BOF-10-022', 'BOF-10-023', 'BOF-10-024', 'BOF-10-025'],
    canonicalName: 'Inventory Movement',
    kind: 'event-evidence',
    definition: 'An immutable inventory event recording quantity movement, issue, return or transfer between governed custody/location contexts.',
    identityRule: 'Each posted movement has immutable event identity; corrections use reversing/correcting events rather than destructive edits.',
    scope: ['legal entity', 'warehouse/store/bin', 'project/work package/order where applicable'],
    keyData: ['movement type', 'Item', 'quantity/UOM', 'lot/batch/serial', 'from/to location', 'business reason', 'source document', 'posted at'],
    lifecycle: ['Draft', 'Posted', 'Reversed/Corrected'],
    governance: [
      'Material Issue, Material Return and Stock Transfer are governed movement types, not separate inventory ledgers.',
      'Posted movement evidence is immutable and forms the basis of stock position.',
      'Cross-legal-entity movement may require additional commercial/accounting documents rather than pretending it is a simple internal move.'
    ]
  },
  {
    modelId: 'INV-STOCK-POSITION',
    candidateKeys: [],
    canonicalName: 'Stock Position',
    kind: 'projection',
    definition: 'A derived as-of view of on-hand, available, reserved, quarantined and in-transit quantity for an Item/traceability/location combination.',
    identityRule: 'Projection only; never independently authored as business truth.',
    scope: ['inventory organisation', 'location', 'Item', 'lot/batch/serial'],
    keyData: ['on-hand quantity', 'available quantity', 'reserved quantity', 'quarantined quantity', 'in-transit quantity', 'as-of timestamp'],
    lifecycle: ['Derived'],
    governance: [
      'Stock Position is calculated from posted movements, reservations, quarantine/status and logistics events.',
      'No user may directly overwrite stock-on-hand as a master-data field.'
    ]
  },
  {
    modelId: 'INV-STOCK-COUNT',
    candidateKeys: ['BOF-10-026'],
    canonicalName: 'Stock Count',
    kind: 'event-evidence',
    definition: 'A controlled physical/cycle count observation of inventory at a defined location and count scope.',
    identityRule: 'Immutable count observation identity; approval may generate an Inventory Adjustment but never rewrites prior movement history.',
    scope: ['warehouse/store/bin', 'Item/traceability scope', 'count campaign'],
    keyData: ['count scope', 'counted quantity', 'system quantity snapshot', 'variance', 'counter', 'counted at'],
    lifecycle: ['Planned', 'In Count', 'Submitted', 'Validated', 'Closed', 'Cancelled'],
    governance: [
      'Stock Count is evidence; variance correction is a separate controlled Inventory Adjustment.',
      'Blind-count and segregation rules can be configured without changing the semantic model.'
    ]
  },
  {
    modelId: 'INV-ADJUSTMENT',
    candidateKeys: ['BOF-10-027'],
    canonicalName: 'Inventory Adjustment',
    kind: 'event-evidence',
    definition: 'A governed posted correction to inventory quantity/status with explicit reason, authority and evidence.',
    identityRule: 'Immutable posted adjustment identity; corrections require another governed adjustment/reversal.',
    scope: ['inventory organisation', 'location', 'Item/traceability'],
    keyData: ['Item', 'quantity delta', 'reason code', 'location', 'lot/batch/serial', 'approval basis', 'source count/evidence'],
    lifecycle: ['Draft', 'Approved', 'Posted', 'Reversed/Corrected'],
    governance: [
      'Adjustment is not an editable stock quantity field.',
      'Material adjustments require delegated authority and audit evidence.'
    ]
  },
  {
    modelId: 'INV-QUARANTINE',
    candidateKeys: ['BOF-10-028'],
    canonicalName: 'Inventory Quarantine',
    kind: 'case',
    definition: 'A governed restriction case preventing or limiting use of identified inventory pending disposition, quality, safety or compliance resolution.',
    identityRule: 'Stable quarantine case identity referencing affected inventory identities/quantities and evidence.',
    scope: ['Item', 'lot/batch/serial', 'inventory location', 'quality/compliance context'],
    keyData: ['subject inventory', 'reason', 'restriction', 'opened at', 'owner', 'disposition'],
    lifecycle: ['Open', 'Under Review', 'Released', 'Rejected/Disposed', 'Closed'],
    governance: [
      'Quarantine is not a duplicate stock location, although quarantined material may also be physically segregated.',
      'Availability calculations must respect active quarantine restrictions.'
    ]
  },
  {
    modelId: 'LOG-PICK',
    candidateKeys: ['BOF-10-029'],
    canonicalName: 'Pick',
    kind: 'work',
    definition: 'A governed logistics work record selecting inventory from storage to fulfil shipment, issue, production or project demand.',
    identityRule: 'Stable Pick identity referencing exact inventory and demand; completion records actual quantities/traceability selected.',
    scope: ['warehouse/store', 'demand/order/shipment'],
    keyData: ['demand', 'Item', 'requested/actual quantity', 'source bin', 'lot/batch/serial', 'picker', 'timestamps'],
    lifecycle: ['Planned', 'Released', 'In Progress', 'Complete', 'Short', 'Cancelled'],
    governance: ['Pick is execution work and does not change Item identity; completed pick evidence feeds subsequent inventory movement/shipment.']
  },
  {
    modelId: 'LOG-PACK',
    candidateKeys: ['BOF-10-030'],
    canonicalName: 'Pack',
    kind: 'work',
    definition: 'A governed logistics record grouping picked goods into handling units/packages for transport and delivery.',
    identityRule: 'Stable Pack/handling record identity; package contents are explicit and traceable.',
    scope: ['shipment', 'warehouse/site logistics'],
    keyData: ['package/handling unit', 'contents', 'quantity', 'weight/dimensions', 'packing evidence'],
    lifecycle: ['Planned', 'In Progress', 'Packed', 'Reopened', 'Cancelled'],
    governance: ['Pack is logistics execution, not Commercial Package, Procurement Package or Work Package.']
  },
  {
    modelId: 'LOG-SHIPMENT',
    candidateKeys: ['BOF-10-031'],
    canonicalName: 'Shipment',
    kind: 'transaction',
    definition: 'A governed consignment of goods moving from an origin to a destination under a defined logistics movement.',
    identityRule: 'Stable Shipment identity; contents, handling units, origin/destination and transport references remain traceable.',
    scope: ['legal entity', 'warehouse/site', 'project/customer/supplier context'],
    keyData: ['shipment number', 'origin', 'destination', 'contents', 'planned/actual dates', 'carrier/transport order'],
    lifecycle: ['Planned', 'Ready', 'Dispatched', 'In Transit', 'Delivered', 'Closed', 'Cancelled'],
    governance: [
      'Shipment is distinct from Transport Order and Delivery confirmation.',
      'Shipment contents reference exact Item/lot/batch/serial identities where traceability requires.'
    ]
  },
  {
    modelId: 'LOG-TRANSPORT-ORDER',
    candidateKeys: ['BOF-10-032'],
    canonicalName: 'Transport Order',
    kind: 'transaction',
    definition: 'A governed request/commitment for transport capacity or service to move one or more Shipments.',
    identityRule: 'Stable Transport Order identity independent of the Shipment identities it carries.',
    scope: ['logistics provider/carrier', 'origin/destination', 'shipment'],
    keyData: ['transport order number', 'carrier', 'mode', 'route', 'planned dates', 'shipments', 'commercial reference'],
    lifecycle: ['Requested', 'Planned', 'Accepted', 'In Execution', 'Completed', 'Cancelled'],
    governance: ['Carrier is a canonical Party/Organisation role; the transport order does not duplicate supplier identity.']
  },
  {
    modelId: 'LOG-DELIVERY',
    candidateKeys: ['BOF-10-033'],
    canonicalName: 'Delivery',
    kind: 'event-evidence',
    definition: 'An immutable evidence record that specified Shipment contents reached a destination and were received, rejected or partially accepted.',
    identityRule: 'Stable delivery event/evidence identity tied to the Shipment and receiving context.',
    scope: ['shipment', 'destination site/warehouse/project/customer'],
    keyData: ['shipment', 'delivered at', 'recipient', 'accepted/rejected quantities', 'proof of delivery', 'exceptions'],
    lifecycle: ['Recorded', 'Validated', 'Corrected/Superseded'],
    governance: [
      'Delivery evidence does not replace Goods/Service Receipt where financial/procurement receipt semantics are required.',
      'Partial delivery remains explicit rather than silently closing the source demand.'
    ]
  },
  {
    modelId: 'LOG-SITE-BOOKING',
    candidateKeys: ['BOF-10-034'],
    canonicalName: 'Site Logistics Booking',
    kind: 'work',
    definition: 'A governed booking allocating a delivery/collection time-window and site logistics resource/access context.',
    identityRule: 'Stable booking identity referencing Site, Shipment/Transport Order and logistics resource constraints.',
    scope: ['site', 'project', 'logistics zone/gate', 'shipment/transport order'],
    keyData: ['site', 'slot', 'vehicle/carrier', 'shipment', 'access/resource requirements', 'status'],
    lifecycle: ['Requested', 'Confirmed', 'Arrived', 'Completed', 'No-show', 'Cancelled'],
    governance: ['Site Logistics Booking is not an Asset or Site master; it consumes canonical Site and logistics identities.']
  },
  {
    modelId: 'LOG-TRADE-DECLARATION',
    candidateKeys: ['BOF-10-036', 'BOF-10-037', 'BOF-10-038'],
    canonicalName: 'Trade Declaration',
    kind: 'compliance-record',
    definition: 'A governed import/export/trade declaration submitted or retained for cross-border movement and customs/compliance purposes.',
    identityRule: 'Stable declaration identity; import and export are declaration types rather than separate data silos.',
    scope: ['shipment', 'legal entity', 'jurisdiction/customs authority'],
    keyData: ['declaration type', 'shipment/items', 'commodity/classification', 'origin/destination', 'values', 'authority reference', 'submission evidence'],
    lifecycle: ['Draft', 'Submitted', 'Accepted', 'Queried', 'Amended', 'Closed', 'Rejected'],
    governance: [
      'Import Declaration and Export Declaration are governed Trade Declaration types.',
      'Submitted declarations and amendments retain immutable evidence/provenance.'
    ]
  }
];

export const inventoryLogisticsRelationships: InventoryLogisticsRelationship[] = [
  { id: 'INV-R01', from: 'INV-WAREHOUSE', predicate: 'contains', to: 'INV-STORE', cardinality: '1 ↔ 0..*', governance: 'Store remains an independent storage context under one current warehouse/site context.' },
  { id: 'INV-R02', from: 'INV-STORE', predicate: 'contains', to: 'INV-BIN', cardinality: '1 ↔ 0..*', governance: 'Bin hierarchy is acyclic and storage-specific.' },
  { id: 'INV-R03', from: 'INV-WAREHOUSE', predicate: 'located at', to: 'CBO-SITE', cardinality: '0..* ↔ 1', governance: 'Warehouse references canonical Site identity.' },
  { id: 'INV-R04', from: 'INV-RESERVATION', predicate: 'reserves', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'Reservation constrains quantity, not Item identity.' },
  { id: 'INV-R05', from: 'INV-MOVEMENT', predicate: 'moves', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'Posted movement references exact Item and traceability where required.' },
  { id: 'INV-R06', from: 'INV-MOVEMENT', predicate: 'from/to', to: 'INV-BIN', cardinality: '0..* ↔ 0..2', governance: 'Movement records source and destination separately; external origins/destinations may use other contexts.' },
  { id: 'INV-R07', from: 'INV-STOCK-COUNT', predicate: 'observes', to: 'INV-BIN', cardinality: '0..* ↔ 1', governance: 'Count snapshot preserves its location and as-of basis.' },
  { id: 'INV-R08', from: 'INV-ADJUSTMENT', predicate: 'corrects position for', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'Adjustment requires reason/authority and produces traceable inventory effect.' },
  { id: 'INV-R09', from: 'INV-QUARANTINE', predicate: 'restricts', to: 'CBO-ITEM', cardinality: '0..* ↔ 1', governance: 'Affected lot/batch/serial/location are additional scope, not new Item identities.' },
  { id: 'INV-R10', from: 'LOG-PICK', predicate: 'fulfils', to: 'INV-RESERVATION', cardinality: '0..* ↔ 0..*', governance: 'Pick may fulfil reservation/demand partially.' },
  { id: 'INV-R11', from: 'LOG-PACK', predicate: 'packs for', to: 'LOG-SHIPMENT', cardinality: '0..* ↔ 1', governance: 'Handling/package identity remains logistics-specific.' },
  { id: 'INV-R12', from: 'LOG-SHIPMENT', predicate: 'transported under', to: 'LOG-TRANSPORT-ORDER', cardinality: '0..* ↔ 0..1', governance: 'One transport order may carry multiple shipments.' },
  { id: 'INV-R13', from: 'LOG-DELIVERY', predicate: 'confirms', to: 'LOG-SHIPMENT', cardinality: '0..* ↔ 1', governance: 'Partial/multiple deliveries can occur for one shipment.' },
  { id: 'INV-R14', from: 'LOG-SITE-BOOKING', predicate: 'coordinates', to: 'LOG-SHIPMENT', cardinality: '0..* ↔ 0..1', governance: 'Booking references shipment/transport without redefining either.' },
  { id: 'INV-R15', from: 'LOG-SITE-BOOKING', predicate: 'occurs at', to: 'CBO-SITE', cardinality: '0..* ↔ 1', governance: 'Site identity is consumed from built-environment model.' },
  { id: 'INV-R16', from: 'LOG-TRADE-DECLARATION', predicate: 'declares', to: 'LOG-SHIPMENT', cardinality: '0..* ↔ 1..*', governance: 'Declaration captures jurisdictional/compliance evidence for shipment movement.' }
];

export const inventoryLogisticsBoundaries: InventoryLogisticsBoundary[] = [
  { name: 'Definition', structure: 'Item → specification / lot / batch / serial references', purpose: 'What is being held or moved', mustNotBecome: 'Stock quantity or warehouse hierarchy' },
  { name: 'Storage', structure: 'Warehouse → Store → Bin Location', purpose: 'Where inventory is held', mustNotBecome: 'Site hierarchy, WBS or Asset hierarchy' },
  { name: 'Inventory truth', structure: 'Movement + Reservation + Quarantine → Stock Position', purpose: 'Quantity and availability as-of time', mustNotBecome: 'Editable stock-on-hand master' },
  { name: 'Logistics', structure: 'Pick → Pack → Shipment → Transport → Delivery', purpose: 'Physical fulfilment and movement', mustNotBecome: 'Procurement, contract or project structure' }
];

export const inventoryLogisticsRules = [
  'Item identity, inventory quantity, traceability identity and Asset identity are separate semantic layers.',
  'Stock Position is a projection derived from immutable posted events and active reservations/restrictions.',
  'Warehouse, Store and Bin are inventory-storage contexts and never become Project/WBS or permanent Asset hierarchies.',
  'Issue, Return and Transfer are Inventory Movement types, not parallel inventory ledgers.',
  'Posted movements and adjustments are corrected through explicit reversal/correction evidence, never silent overwrite.',
  'Reservation commits availability but does not physically move stock.',
  'Quarantine restricts availability without creating a duplicate Item or stock master.',
  'Pick, Pack, Shipment, Transport Order and Delivery are distinct execution/evidence records.',
  'Delivery evidence is distinct from procurement/financial Goods Receipt where those semantics are required.',
  'Lot, Batch and Serial identities preserve provenance across inventory and logistics.',
  'Call-off Order is commercial/procurement truth owned by the procurement model; logistics consumes it as demand/fulfilment context and never creates a second call-off master.',
  'Import and Export declarations use one governed Trade Declaration pattern with jurisdictional type/configuration.'
];

export function validateInventoryLogisticsModel() {
  const ids = new Set(inventoryLogisticsModel.map((item) => item.modelId));
  if (ids.size !== inventoryLogisticsModel.length) return false;
  const allowedExternal = new Set(['CBO-SITE', 'CBO-ITEM']);
  for (const relationship of inventoryLogisticsRelationships) {
    if (!ids.has(relationship.from) && !allowedExternal.has(relationship.from)) return false;
    if (!ids.has(relationship.to) && !allowedExternal.has(relationship.to)) return false;
  }
  return true;
}
