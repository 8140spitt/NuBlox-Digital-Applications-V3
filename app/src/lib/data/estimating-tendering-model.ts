export type EstimatingTenderingKind =
  | 'case'
  | 'plan'
  | 'version'
  | 'child'
  | 'measurement'
  | 'scope-structure'
  | 'transaction'
  | 'controlled-offer'
  | 'event-evidence';

export type EstimatingTenderingDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: EstimatingTenderingKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type EstimatingTenderingRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

export type EstimatingTenderingBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const est = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: EstimatingTenderingKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[],
  scope: string[] = ['tenant', 'legal entity', 'commercial opportunity']
): EstimatingTenderingDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, scope, keyData, lifecycle, governance
});

export const estimatingTenderingModel: EstimatingTenderingDefinition[] = [
  est('EST-CUSTOMER-ENQUIRY', ['BOF-05-001', 'BOF-05-002'], 'Customer Enquiry', 'case',
    'Governed inbound commercial request from a prospect/customer, including formal Invitation to Tender as a configured enquiry type.',
    'Stable enquiry identity preserves issuer, issued information, deadline, amendments and response provenance without creating Party identity.',
    ['enquiry type', 'issuing Party/relationship', 'Opportunity', 'received/issued date', 'deadline', 'scope', 'requirements', 'amendments'],
    ['Received', 'Qualifying', 'Accepted to Bid', 'Declined', 'In Response', 'Submitted', 'Closed', 'Cancelled'],
    ['Invitation to Tender is a formal enquiry type, not a separate master architecture.', 'Issued/amended tender information remains traceable.', 'Customer identity is always the canonical Party/Party Relationship.']),

  est('EST-ESTIMATE', ['BOF-05-003'], 'Estimate', 'plan',
    'Stable estimating aggregate used to develop the expected cost/price basis for a defined Opportunity, Enquiry or scope.',
    'One Estimate identity survives working revisions, freeze/baseline, submission and later reference by project/commercial controls.',
    ['estimate number', 'Opportunity/Enquiry', 'scope basis', 'currency', 'pricing date', 'owner', 'current approved/frozen version'],
    ['Draft', 'In Preparation', 'Under Review', 'Adjudicated', 'Submitted Basis', 'Superseded', 'Closed'],
    ['Estimate is not Project, WBS, Contract, Budget or Ledger truth.', 'Approved/frozen estimate versions are immutable evidence.', 'Downstream budgets and project controls reference the accepted estimate basis explicitly.']),

  est('EST-ESTIMATE-VERSION', ['BOF-05-004'], 'Estimate Version', 'version',
    'Controlled version of an Estimate containing the exact breakdown, quantities, build-ups, rates, provisions and totals at a point in time.',
    'Version identity is subordinate to the stable Estimate identity; frozen/adjudicated/submitted versions are immutable.',
    ['version/revision', 'status', 'effective/as-of date', 'pricing basis', 'total', 'currency', 'assumptions', 'source digest'],
    ['Working', 'Frozen', 'Adjudicated', 'Submitted', 'Superseded'],
    ['Version is not a duplicate Estimate master.', 'Changes after freeze create a successor version.', 'The exact version used for a Proposal/Quotation remains permanently traceable.']),

  est('EST-BREAKDOWN-ITEM', ['BOF-05-005', 'BOF-05-010'], 'Estimate Breakdown Item', 'child',
    'Hierarchical estimating scope/cost node within an Estimate Version; preliminaries are represented through governed item type/classification.',
    'Identity is scoped to the owning Estimate Version and retained when the version is frozen.',
    ['parent item', 'type/classification', 'description', 'quantity', 'UOM', 'rate', 'amount', 'source/basis'],
    ['Working', 'Frozen'],
    ['Estimate breakdown is not WBS, Cost Code, GL Account, BOQ or Procurement Package identity.', 'Mappings to downstream structures are explicit.', 'Preliminaries use the same controlled breakdown structure.']),

  est('EST-TAKEOFF', ['BOF-05-006'], 'Take-off', 'measurement',
    'Governed quantity take-off set derived from drawings, models, specifications, surveys or other controlled information.',
    'Stable take-off identity records source information/version and measurement method; revisions retain prior measurement evidence.',
    ['source information/version', 'measurement method', 'measurement rules', 'author', 'as-of date', 'status'],
    ['Working', 'Checked', 'Frozen', 'Superseded'],
    ['Take-off does not become Information Container identity.', 'Source revision/provenance is explicit.', 'Re-measurement creates retained history rather than overwriting frozen evidence.']),

  est('EST-MEASUREMENT-ITEM', ['BOF-05-007'], 'Measurement Item', 'child',
    'Measured quantity line belonging to a Take-off and supporting one or more estimate breakdown items.',
    'Identity is subordinate to Take-off; measured values retain unit, dimensions/formula and source geometry/evidence.',
    ['description', 'dimensions/formula', 'quantity', 'UOM', 'source reference', 'location/classification'],
    ['Working', 'Checked', 'Frozen'],
    ['Measurement Item is not an Asset, Item master or WBS node.', 'Quantity is evidence-backed and historically reproducible.']),

  est('EST-RESOURCE-BUILDUP', ['BOF-05-008'], 'Resource Build-up', 'child',
    'Detailed composition of labour, plant, material, subcontract, service and other cost resources supporting an estimate rate or breakdown item.',
    'Build-up identity is subordinate to the Estimate Version/breakdown and references shared Item/resource/rate sources.',
    ['resource type', 'Item/resource reference', 'quantity', 'UOM', 'source rate', 'waste/productivity factor', 'calculated cost'],
    ['Working', 'Frozen'],
    ['Build-up references shared Items/resources and never creates duplicate material/plant/labour masters.', 'Historic source rates and factors are retained.']),

  est('EST-RATE', ['BOF-05-009'], 'Estimate Rate', 'child',
    'Contextual rate used or calculated in an Estimate Version from resource build-up, commercial price sources, productivity assumptions or explicit overrides.',
    'Rate identity/value is scoped to exact estimate context and retains source/basis; it is not a universal mutable rate master.',
    ['amount', 'currency', 'UOM', 'source', 'build-up', 'effective/as-of date', 'override reason'],
    ['Working', 'Frozen'],
    ['Estimate Rate may reference Price List/Commercial Rate but retains the exact rate actually applied.', 'Rate changes do not rewrite prior frozen estimate versions.']),

  est('EST-PROVISION', ['BOF-05-011', 'BOF-05-012'], 'Estimate Provision', 'child',
    'Governed estimate provision for uncertainty, allowance, contingency or defined risk treatment.',
    'Provision identity is scoped to an Estimate Version and records type, basis, ownership and value methodology.',
    ['provision type', 'basis/risk link', 'amount/percentage', 'owner', 'release/use rule', 'notes'],
    ['Proposed', 'Included', 'Adjusted', 'Released', 'Frozen'],
    ['Allowance and Contingency are provision types rather than parallel roots.', 'Provision must retain rationale and avoid hidden double counting.', 'Risk/provision does not become a finance reserve or project risk identity automatically.']),

  est('EST-TENDER-PACKAGE', ['BOF-05-013'], 'Tender Package', 'scope-structure',
    'Bid-side grouping of enquiry requirements, scope and controlled tender information used to organise estimating and submission.',
    'Stable tender-package identity within one Enquiry/Opportunity; package changes retain issue/version provenance.',
    ['package code', 'scope', 'requirements', 'information set', 'owner', 'submission requirement', 'deadline'],
    ['Draft', 'Issued/Received', 'In Estimating', 'Complete', 'Submitted', 'Closed'],
    ['Tender Package is not Procurement Package, Commercial Package, WBS or Contract.', 'Mappings to estimate breakdown and downstream package structures are explicit.']),

  est('EST-TENDER-ADJUDICATION', ['BOF-05-019'], 'Tender Adjudication', 'event-evidence',
    'Immutable attributable internal decision evidence approving or rejecting a defined tender/estimate submission basis.',
    'Each adjudication binds the exact Estimate Version, risk/provision basis, price, assumptions and approving authority at decision time.',
    ['Estimate Version', 'price', 'margin', 'provisions', 'key assumptions', 'risks', 'decision', 'authority basis', 'timestamp'],
    ['Recorded'],
    ['Tender Adjudication is not supplier Sourcing Evaluation.', 'Adjudication cannot silently edit the Estimate Version it approves.', 'Protected approval requires contextual permission and authority.']),

  est('EST-PROPOSAL', ['BOF-05-020'], 'Proposal', 'controlled-offer',
    'Controlled customer-facing solution/offer describing scope, methodology, programme, qualifications and commercial basis.',
    'Stable Proposal identity with controlled issued versions linked to the exact Enquiry/Opportunity and Estimate Version.',
    ['customer relationship', 'scope/solution', 'programme', 'qualifications', 'commercial basis', 'validity', 'issued version'],
    ['Draft', 'Reviewed', 'Issued', 'Accepted', 'Rejected', 'Superseded', 'Expired', 'Withdrawn'],
    ['Proposal is not Estimate, Quotation, Contract or Project.', 'Issued versions are immutable evidence and remain linked to their pricing basis.']),

  est('EST-QUOTATION', ['BOF-05-021'], 'Quotation', 'controlled-offer',
    'Priced customer-facing commercial offer for defined scope, quantities, terms and validity.',
    'Stable Quotation identity with immutable issued versions and explicit currency/tax/term basis.',
    ['customer relationship', 'scope/lines', 'price', 'currency', 'tax', 'terms', 'validity', 'Estimate Version'],
    ['Draft', 'Approved', 'Issued', 'Accepted', 'Rejected', 'Expired', 'Superseded', 'Withdrawn'],
    ['Quotation is not the internal Estimate and is not a Contract.', 'Acceptance references the exact issued quotation version.', 'Changing an Estimate does not alter an already issued Quotation.']),

  est('EST-SALES-ORDER', ['BOF-05-022'], 'Sales Order', 'transaction',
    'Governed customer order/commitment record created from an accepted offer or direct customer instruction where applicable.',
    'Stable Sales Order identity with controlled lines/changes, linked to customer Party Relationship and originating offer/acceptance.',
    ['order number', 'customer relationship', 'order lines/scope', 'value', 'currency', 'dates', 'terms', 'originating offer/acceptance'],
    ['Draft', 'Confirmed', 'In Fulfilment', 'Partially Fulfilled', 'Fulfilled', 'Closed', 'Cancelled'],
    ['Sales Order is distinct from Contract and Project.', 'Where a formal Contract governs the order, the relationship is explicit rather than identity reuse.', 'Order amendments retain commercial history.']),

  est('EST-OFFER-ACCEPTANCE', ['BOF-05-023'], 'Offer Acceptance', 'event-evidence',
    'Immutable evidence that a customer or authorised party accepted a specific Proposal/Quotation/offer version.',
    'Acceptance identity binds actor/Party, exact offer/version, timestamp, conditions and evidence.',
    ['accepted offer/version', 'accepting Party/actor', 'timestamp', 'conditions', 'evidence', 'authority where relevant'],
    ['Recorded', 'Superseded/Withdrawn where legally valid'],
    ['Acceptance is evidence, not Contract or Sales Order identity.', 'Downstream commitment creation is an explicit domain action with retained provenance.'])
];

export const estimatingTenderingRelationships: EstimatingTenderingRelationship[] = [
  { id: 'EST-R01', from: 'EST-CUSTOMER-ENQUIRY', predicate: 'relates to', to: 'CRM-OPPORTUNITY', cardinality: 'many-to-one', governance: 'Commercial enquiry references Opportunity without changing Opportunity identity.' },
  { id: 'EST-R02', from: 'EST-ESTIMATE', predicate: 'prices', to: 'EST-CUSTOMER-ENQUIRY', cardinality: 'many-to-one', governance: 'Estimate retains the enquiry basis it is answering.' },
  { id: 'EST-R03', from: 'EST-ESTIMATE', predicate: 'has version', to: 'EST-ESTIMATE-VERSION', cardinality: 'one-to-many', governance: 'Stable Estimate identity owns controlled versions.' },
  { id: 'EST-R04', from: 'EST-ESTIMATE-VERSION', predicate: 'contains', to: 'EST-BREAKDOWN-ITEM', cardinality: 'one-to-many', governance: 'Breakdown structure belongs to exact Estimate Version.' },
  { id: 'EST-R05', from: 'EST-TAKEOFF', predicate: 'supports', to: 'EST-ESTIMATE-VERSION', cardinality: 'many-to-one', governance: 'Take-off source/version is retained for exact estimate context.' },
  { id: 'EST-R06', from: 'EST-TAKEOFF', predicate: 'contains', to: 'EST-MEASUREMENT-ITEM', cardinality: 'one-to-many', governance: 'Measurement lines remain subordinate evidence.' },
  { id: 'EST-R07', from: 'EST-BREAKDOWN-ITEM', predicate: 'costed by', to: 'EST-RESOURCE-BUILDUP', cardinality: 'one-to-many', governance: 'Build-up is contextual to estimate breakdown rather than a resource master.' },
  { id: 'EST-R08', from: 'EST-RESOURCE-BUILDUP', predicate: 'produces/uses', to: 'EST-RATE', cardinality: 'one-to-many', governance: 'Rate retains its exact estimating basis.' },
  { id: 'EST-R09', from: 'EST-ESTIMATE-VERSION', predicate: 'contains', to: 'EST-PROVISION', cardinality: 'one-to-many', governance: 'Allowance/contingency basis is explicit and versioned.' },
  { id: 'EST-R10', from: 'EST-CUSTOMER-ENQUIRY', predicate: 'organised by', to: 'EST-TENDER-PACKAGE', cardinality: 'one-to-many', governance: 'Tender package is bid-side scope grouping only.' },
  { id: 'EST-R11', from: 'EST-TENDER-PACKAGE', predicate: 'market tested via', to: 'PROC-SOURCING-REQUEST', cardinality: 'many-to-many', governance: 'Estimating supplier/subcontract enquiries reuse shared sourcing request semantics.' },
  { id: 'EST-R12', from: 'PROC-SOURCING-REQUEST', predicate: 'answered by', to: 'PROC-SOURCING-RESPONSE', cardinality: 'one-to-many', governance: 'Quote/bid returns retain submission evidence in shared sourcing model.' },
  { id: 'EST-R13', from: 'PROC-SOURCING-RESPONSE', predicate: 'evaluated by', to: 'PROC-EVALUATION', cardinality: 'many-to-one-or-many', governance: 'Comparison is governed sourcing evaluation, not a separate estimate master.' },
  { id: 'EST-R14', from: 'EST-TENDER-ADJUDICATION', predicate: 'approves basis of', to: 'EST-ESTIMATE-VERSION', cardinality: 'many-to-one', governance: 'Adjudication binds exact frozen version and authority evidence.' },
  { id: 'EST-R15', from: 'EST-PROPOSAL', predicate: 'priced from', to: 'EST-ESTIMATE-VERSION', cardinality: 'many-to-one', governance: 'Proposal retains exact internal pricing basis without exposing/reusing estimate identity.' },
  { id: 'EST-R16', from: 'EST-QUOTATION', predicate: 'priced from', to: 'EST-ESTIMATE-VERSION', cardinality: 'many-to-one', governance: 'Issued quote remains bound to its estimate version.' },
  { id: 'EST-R17', from: 'EST-OFFER-ACCEPTANCE', predicate: 'accepts', to: 'EST-QUOTATION', cardinality: 'many-to-one', governance: 'Acceptance binds exact issued offer version.' },
  { id: 'EST-R18', from: 'EST-OFFER-ACCEPTANCE', predicate: 'may create', to: 'EST-SALES-ORDER', cardinality: 'one-to-zero-or-many', governance: 'Commitment creation is explicit and retains acceptance provenance.' },
  { id: 'EST-R19', from: 'EST-OFFER-ACCEPTANCE', predicate: 'may lead to', to: 'CBO-CONTRACT', cardinality: 'many-to-zero-or-one', governance: 'Contract identity is created/governed separately from offer acceptance.' }
];

export const estimatingTenderingBoundaries: EstimatingTenderingBoundary[] = [
  { name: 'Estimate identity', structure: 'Estimate → Version → Breakdown / Take-off / Build-up / Provision', purpose: 'Preserve exact internal pricing basis and history.', mustNotBecome: 'Project / WBS / Budget / GL / Contract' },
  { name: 'Bid-side scope', structure: 'Customer Enquiry → Tender Package → Estimate', purpose: 'Organise what the customer is asking NuBlox enterprise to price.', mustNotBecome: 'Procurement Package / Commercial Package / Work Package' },
  { name: 'Market testing', structure: 'Sourcing Request → Response → Evaluation', purpose: 'Reuse supplier/subcontract sourcing evidence during estimating.', mustNotBecome: 'A second estimating-only supplier tender engine' },
  { name: 'Customer offer', structure: 'Proposal / Quotation → Acceptance → Sales Order / Contract', purpose: 'Separate internal cost basis from external offer and commitment.', mustNotBecome: 'Estimate renamed into Contract or Project' }
];

export const estimatingTenderingRules = [
  'Estimate identity is stable; Estimate Version carries controlled revision/freeze semantics.',
  'Estimate Breakdown is not WBS, Cost Code, GL Account, BOQ, Procurement Package or Commercial Package identity.',
  'Preliminaries use typed Estimate Breakdown Items rather than a separate root master.',
  'Allowance and Contingency use one governed Estimate Provision pattern with explicit basis.',
  'Take-off and Measurement Items retain controlled-information source/version provenance.',
  'Resource Build-up references canonical Items/resources and never creates duplicate material, labour or plant masters.',
  'Estimate Rate is contextual applied/derived pricing evidence; it may reference shared Price Lists but never rewrites them.',
  'Tender Package is bid-side scope grouping and remains distinct from delivery/commercial/procurement packaging.',
  'Supplier/Subcontract Enquiries and Quote/Bid Returns reuse the shared Sourcing Request/Response/Evaluation model.',
  'Tender Adjudication is internal immutable bid decision evidence and is not supplier Sourcing Evaluation.',
  'Proposal and Quotation are external controlled offers; neither is the internal Estimate or resulting Contract.',
  'Offer Acceptance binds the exact offer/version and does not itself become Contract, Sales Order or Project identity.',
  'Downstream Project budgets/baselines trace to the accepted Estimate Version through explicit mappings rather than identity reuse.'
] as const;

export function validateEstimatingTenderingModel() {
  const ids = new Set(estimatingTenderingModel.map((item) => item.modelId));
  const external = new Set(['CRM-OPPORTUNITY', 'PROC-SOURCING-REQUEST', 'PROC-SOURCING-RESPONSE', 'PROC-EVALUATION', 'CBO-CONTRACT']);
  const relationshipIds = new Set(estimatingTenderingRelationships.map((rel) => rel.id));
  if (ids.size !== estimatingTenderingModel.length) return false;
  if (relationshipIds.size !== estimatingTenderingRelationships.length) return false;
  if (estimatingTenderingModel.some((item) => !item.canonicalName || !item.definition || !item.identityRule || !item.governance.length)) return false;
  if (estimatingTenderingRelationships.some((rel) => !ids.has(rel.from) && !external.has(rel.from))) return false;
  if (estimatingTenderingRelationships.some((rel) => !ids.has(rel.to) && !external.has(rel.to))) return false;
  return true;
}
