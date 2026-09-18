export type BenchmarkRefinementKind =
  | 'plan'
  | 'transaction'
  | 'relationship'
  | 'event-evidence'
  | 'governance-case'
  | 'projection'
  | 'reference-snapshot'
  | 'execution-context'
  | 'definition'
  | 'configuration'
  | 'accounting-record';

export type BenchmarkRefinementDefinition = {
  modelId: string;
  originGapIds: string[];
  canonicalName: string;
  kind: BenchmarkRefinementKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type BenchmarkRefinementRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  governance: string;
};

export const benchmarkRefinementModel: BenchmarkRefinementDefinition[] = [
  {
    modelId: 'PLN-DEMAND-PLAN',
    originGapIds: ['BG-001'],
    canonicalName: 'Demand Plan',
    kind: 'plan',
    definition: 'Versioned governed statement of expected demand for Items, services, resources or delivery needs by time, location/context and scenario before fulfilment/supply decisions are committed.',
    identityRule: 'Stable plan identity with immutable approved versions; demand lines reference canonical Item, Project/Work Package, customer/service context or other demand source rather than duplicating them.',
    keyData: ['plan reference', 'scope', 'horizon', 'scenario/assumptions', 'demand source', 'item/service/resource', 'quantity/value', 'time bucket', 'location/context', 'confidence'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Current', 'Revised', 'Superseded', 'Closed'],
    governance: [
      'Demand Plan is planned expectation, not Sales Order, Requisition, Reservation or actual consumption.',
      'Approved plan versions remain immutable comparison points.',
      'Scenario and Assumption reuse the shared strategy/planning semantics.'
    ]
  },
  {
    modelId: 'PLN-SUPPLY-PLAN',
    originGapIds: ['BG-001'],
    canonicalName: 'Supply Plan',
    kind: 'plan',
    definition: 'Versioned governed response to demand identifying how supply is expected to be met through inventory, procurement, production, service capacity or other governed sources.',
    identityRule: 'Stable plan identity with approved versions linked to exact Demand Plan/scenario versions; it never becomes Purchase Order, Production Order, Inventory Movement or Work Order truth.',
    keyData: ['plan reference', 'demand-plan/version', 'scenario', 'supply source', 'item/service/resource', 'planned quantity/capacity', 'time bucket', 'location', 'constraint status'],
    lifecycle: ['Draft', 'Balanced', 'Approved', 'Current', 'Replanned', 'Superseded', 'Closed'],
    governance: [
      'Supply Plan remains distinct from execution commitments and orders.',
      'Constrained/unconstrained variants preserve the exact constraint basis.',
      'Approved supply responses link to subsequent procurement/production/service execution without being overwritten by actuals.'
    ]
  },
  {
    modelId: 'PLN-PLANNING-EXCEPTION',
    originGapIds: ['BG-001'],
    canonicalName: 'Planning Exception',
    kind: 'event-evidence',
    definition: 'Attributed planning evidence that a demand/supply/capacity/service-level constraint, shortage, excess or infeasibility requires review or decision.',
    identityRule: 'Stable occurrence identity tied to exact plan/scenario versions and calculation time; recalculation produces new evidence rather than rewriting the prior exception.',
    keyData: ['plan/version', 'exception type', 'subject', 'time bucket', 'magnitude', 'constraint/source', 'priority', 'calculated at', 'resolution/decision link'],
    lifecycle: ['Raised', 'Reviewed', 'Resolved', 'Accepted', 'Superseded'],
    governance: ['Planning Exception is not an operational incident or workflow Work Item.', 'Resolution is evidenced through an explicit planning change or Decision.']
  },
  {
    modelId: 'TREASURY-EXPOSURE',
    originGapIds: ['BG-002'],
    canonicalName: 'Financial Exposure',
    kind: 'projection',
    definition: 'Governed as-of financial-risk position arising from forecast or actual cash flows, balances, commitments or market variables.',
    identityRule: 'Rebuildable position with immutable published snapshots; every exposure retains source positions, currency/risk factor, horizon and valuation basis.',
    keyData: ['risk factor', 'currency/commodity/rate', 'legal entity', 'source positions', 'horizon', 'gross/net amount', 'valuation basis', 'as-of time'],
    lifecycle: ['Calculated', 'Reviewed', 'Published', 'Superseded'],
    governance: ['Exposure is derived risk position and never replaces source Ledger, Contract, Invoice, Cash Forecast or Treasury Deal truth.']
  },
  {
    modelId: 'TREASURY-HEDGE-RELATIONSHIP',
    originGapIds: ['BG-002'],
    canonicalName: 'Hedge Relationship',
    kind: 'relationship',
    definition: 'Governed designation linking one or more Financial Exposures to hedge instrument/Treasury Deal positions under an approved hedging strategy and accounting/risk basis.',
    identityRule: 'Stable effective relationship with designation, ratio, purpose and effectiveness evidence; changes create successor designations rather than rewriting history.',
    keyData: ['exposure(s)', 'treasury deal/instrument', 'hedge purpose/type', 'designation date', 'ratio', 'effective period', 'strategy/policy', 'effectiveness evidence'],
    lifecycle: ['Proposed', 'Designated', 'Effective', 'Rebalanced', 'Discontinued', 'Closed'],
    governance: ['Hedge Relationship does not create a duplicate Treasury Deal or Exposure.', 'Accounting treatment remains a separate governed consequence.']
  },
  {
    modelId: 'TREASURY-MARKET-DATA-SNAPSHOT',
    originGapIds: ['BG-002'],
    canonicalName: 'Market Data Snapshot',
    kind: 'reference-snapshot',
    definition: 'Immutable dated snapshot of approved external/internal market observations used to value or assess treasury exposures and deals.',
    identityRule: 'Immutable observation set tied to provider/source, timestamp, rate/curve/price type and quality/approval context.',
    keyData: ['source/provider', 'observed at', 'instrument/risk factor', 'rate/price/curve', 'currency/unit', 'quality/status', 'provenance'],
    lifecycle: ['Observed', 'Validated', 'Published', 'Superseded/Corrected'],
    governance: ['Snapshot reuses governed Exchange Rate Source/reference semantics where applicable.', 'Historic valuations pin the exact market-data snapshot used.']
  },
  {
    modelId: 'TREASURY-CASH-POOL',
    originGapIds: ['BG-002'],
    canonicalName: 'Cash Pool Arrangement',
    kind: 'relationship',
    definition: 'Effective governed arrangement connecting participating Bank Accounts/legal entities for physical or notional liquidity concentration under defined rules.',
    identityRule: 'Stable arrangement identity with effective participants, header/account relationships, limits, sweep/notional rules and legal/authority basis.',
    keyData: ['pool reference', 'pool type', 'header account/entity', 'participant accounts/entities', 'currencies', 'rules/limits', 'effective dates', 'authority'],
    lifecycle: ['Proposed', 'Approved', 'Active', 'Suspended', 'Closed'],
    governance: ['Cash Pool does not alter Bank Account or Legal Entity identity.', 'Actual transfers remain Payment/Bank Transaction evidence.']
  },
  {
    modelId: 'MDG-STEWARDSHIP-CASE',
    originGapIds: ['BG-003'],
    canonicalName: 'Master Data Stewardship Case',
    kind: 'governance-case',
    definition: 'Governed request/case to create, change, correct, merge, split or retire canonical master/reference data under stewardship and authority controls.',
    identityRule: 'Stable case identity linked to the exact governed master subjects and requested change; approval/decision does not itself replace the master record.',
    keyData: ['case type', 'subject identity/identities', 'requested change', 'requester', 'steward', 'reason', 'quality evidence', 'authority/decision', 'effective date'],
    lifecycle: ['Submitted', 'Triage', 'In Review', 'Approved', 'Rejected', 'Applied', 'Closed', 'Cancelled'],
    governance: [
      'Stewardship Case coordinates controlled master-data change without creating a parallel master.',
      'Applied changes retain exact before/after and decision evidence.',
      'Workflow Work Items may coordinate the case but never replace it.'
    ]
  },
  {
    modelId: 'MDG-DUPLICATE-CANDIDATE',
    originGapIds: ['BG-003'],
    canonicalName: 'Duplicate Match Candidate',
    kind: 'event-evidence',
    definition: 'Attributed evidence that two or more canonical/master records may represent the same real-world identity, including matching basis, confidence and rule/model version.',
    identityRule: 'Immutable match observation for exact record versions; later match runs create new observations.',
    keyData: ['candidate identities', 'match method/version', 'features/basis', 'confidence', 'observed at', 'review outcome', 'stewardship case'],
    lifecycle: ['Detected', 'Reviewed', 'Confirmed', 'Rejected', 'Superseded'],
    governance: ['Duplicate Match Candidate is evidence, not authority to merge.', 'A confirmed match requires a governed Merge Decision.']
  },
  {
    modelId: 'MDG-MERGE-DECISION',
    originGapIds: ['BG-003'],
    canonicalName: 'Master Merge Decision',
    kind: 'event-evidence',
    definition: 'Immutable authorised decision identifying the survivor canonical identity and source identities to be redirected/retired, with exact rationale and evidence.',
    identityRule: 'Immutable decision occurrence bound to exact subject versions, steward/authority and effective time.',
    keyData: ['subject identities/versions', 'survivor identity', 'merge rationale', 'attribute/source resolution', 'decider/authority', 'effective at', 'stewardship case'],
    lifecycle: ['Recorded', 'Applied', 'Reversed/Corrected'],
    governance: ['Merge decision never deletes provenance.', 'Source identifiers and historical references remain resolvable after merge.']
  },
  {
    modelId: 'MDG-IDENTITY-REDIRECT',
    originGapIds: ['BG-003'],
    canonicalName: 'Master Identity Redirect',
    kind: 'relationship',
    definition: 'Effective lineage relationship from a merged/retired canonical identity to its surviving identity, preserving historic resolution and external identifiers.',
    identityRule: 'Stable effective relationship with merge-decision provenance; it can be superseded only through governed correction/unmerge.',
    keyData: ['source identity', 'survivor identity', 'merge decision', 'effective at', 'reason', 'status'],
    lifecycle: ['Active', 'Reversed', 'Superseded'],
    governance: ['Redirect preserves source identity provenance and does not rewrite historical business evidence.', 'Consumers resolve current identity without losing original references.']
  },
  {
    modelId: 'LOG-HANDLING-UNIT',
    originGapIds: ['BG-004'],
    canonicalName: 'Handling Unit',
    kind: 'execution-context',
    definition: 'Traceable logistics handling identity grouping packed goods/items for warehouse and transport execution without replacing Item, Lot/Batch/Serial, Shipment or Asset identity.',
    identityRule: 'Stable handling identity for one physical/logistical grouping; repacking creates governed predecessor/successor relationships rather than rewriting historic contents.',
    keyData: ['handling-unit reference', 'handling-unit type', 'contents', 'quantities/UOM', 'parent/child handling units', 'current logistics context', 'status'],
    lifecycle: ['Created', 'Packed', 'Staged', 'Loaded', 'In Transit', 'Received', 'Unpacked', 'Closed'],
    governance: ['Handling Unit is a logistics identity only.', 'Its contents always reference canonical Item and traceability identities.', 'It never becomes Shipment or Asset identity.']
  },
  {
    modelId: 'LOG-WAREHOUSE-WAVE',
    originGapIds: ['BG-004'],
    canonicalName: 'Warehouse Wave',
    kind: 'plan',
    definition: 'Governed warehouse execution batch grouping eligible outbound/inbound work for coordinated release, sequencing and resource use.',
    identityRule: 'Stable wave identity tied to exact demand/source documents and planning criteria at release time; re-wave activity preserves prior release evidence.',
    keyData: ['wave reference', 'warehouse', 'scope/source demand', 'release criteria', 'planned work', 'priority', 'planned/released time', 'resource assumptions'],
    lifecycle: ['Draft', 'Planned', 'Released', 'In Execution', 'Completed', 'Cancelled'],
    governance: ['Warehouse Wave coordinates execution and never replaces Sales Order, Purchase Order, Shipment, Pick or Inventory Movement truth.']
  },
  {
    modelId: 'LOG-YARD-DOCK-APPOINTMENT',
    originGapIds: ['BG-004'],
    canonicalName: 'Yard/Dock Appointment',
    kind: 'transaction',
    definition: 'Governed appointment allocating yard, gate or dock time/capacity to an inbound or outbound logistics movement.',
    identityRule: 'Stable appointment identity referencing canonical Site, Shipment/Transport Order and resource/location context.',
    keyData: ['appointment reference', 'site/yard/dock', 'time window', 'shipment/transport order', 'carrier/vehicle', 'resource requirements', 'status'],
    lifecycle: ['Requested', 'Confirmed', 'Arrived', 'In Service', 'Completed', 'No-show', 'Cancelled'],
    governance: ['Appointment is logistics work context and does not redefine Site, Vehicle or Shipment identity.']
  },
  {
    modelId: 'LOG-FREIGHT-TENDER',
    originGapIds: ['BG-004'],
    canonicalName: 'Freight Tender',
    kind: 'transaction',
    definition: 'Governed request/offer/acceptance record for carrier capacity and transport service against a planned shipment/load requirement.',
    identityRule: 'Stable tender transaction preserving carrier Party, requirement, offered rate/terms, response and award/acceptance evidence.',
    keyData: ['tender reference', 'transport requirement', 'carrier', 'route/mode', 'service level', 'rate/terms', 'response', 'decision/authority'],
    lifecycle: ['Draft', 'Issued', 'Responded', 'Accepted', 'Rejected', 'Expired', 'Cancelled'],
    governance: ['Freight Tender does not create a second carrier or Contract identity.', 'Accepted terms feed Transport Order/commitment without overwriting tender evidence.']
  },
  {
    modelId: 'LOG-FREIGHT-SETTLEMENT',
    originGapIds: ['BG-004'],
    canonicalName: 'Freight Settlement',
    kind: 'transaction',
    definition: 'Governed commercial settlement basis comparing executed transport service, rated charges, agreed terms and payable consequence.',
    identityRule: 'Stable settlement identity referencing exact Transport Order/Shipment, carrier agreement/rate basis and execution evidence.',
    keyData: ['settlement reference', 'transport order/shipment', 'carrier', 'rate basis', 'actual services/charges', 'exceptions', 'approved amount', 'financial consequence'],
    lifecycle: ['Calculated', 'Reviewed', 'Approved', 'Posted/Transferred', 'Disputed', 'Corrected'],
    governance: ['Freight Settlement is not Supplier Invoice or Payment.', 'Accounting/payable consequences remain governed in Finance.']
  },
  {
    modelId: 'REL-ASSET-CRITICALITY-ASSESSMENT',
    originGapIds: ['BG-005'],
    canonicalName: 'Asset Criticality Assessment',
    kind: 'event-evidence',
    definition: 'Dated attributable assessment of an Asset/System/Component criticality using an approved method and consequence dimensions.',
    identityRule: 'Immutable assessment occurrence pinned to exact subject, methodology/version, scoring inputs and assessment time.',
    keyData: ['asset/system subject', 'method/version', 'consequence dimensions', 'scores', 'criticality class', 'assessor', 'assessed at', 'evidence'],
    lifecycle: ['Recorded', 'Reviewed', 'Approved', 'Superseded/Corrected'],
    governance: ['Criticality is derived from retained assessments and is not an editable permanent asset flag.']
  },
  {
    modelId: 'REL-FAILURE-MODE',
    originGapIds: ['BG-005'],
    canonicalName: 'Failure Mode Definition',
    kind: 'definition',
    definition: 'Governed reusable definition of a way in which an Asset/System/Component function can fail, including causes, effects and detection/mitigation context.',
    identityRule: 'Stable definition identity with version/effectivity and applicability; actual Failure occurrences remain separate operational evidence.',
    keyData: ['failure-mode code', 'function/subject applicability', 'description', 'causes', 'effects', 'detection method', 'severity/risk context', 'effective version'],
    lifecycle: ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: ['Failure Mode Definition is not an actual Failure event.', 'It may be reused across Asset Models/Types where applicability is explicit.']
  },
  {
    modelId: 'REL-RELIABILITY-STRATEGY',
    originGapIds: ['BG-005'],
    canonicalName: 'Reliability Strategy',
    kind: 'plan',
    definition: 'Governed reliability-centred strategy linking critical assets, failure modes, risk/condition evidence and selected preventive, predictive, detective or run-to-failure maintenance treatments.',
    identityRule: 'Stable strategy identity/version for a defined asset population/context; approved revisions preserve prior maintenance decision basis.',
    keyData: ['strategy reference', 'asset/type/model scope', 'criticality basis', 'failure modes', 'maintenance tactics', 'inspection/condition requirements', 'risk basis', 'effective version'],
    lifecycle: ['Draft', 'Analysis', 'Approved', 'Effective', 'Reviewed', 'Superseded', 'Retired'],
    governance: ['Reliability Strategy guides Maintenance Plan creation but never becomes the Maintenance Plan or Work Order itself.']
  },
  {
    modelId: 'REL-ASSET-HEALTH-POSITION',
    originGapIds: ['BG-005'],
    canonicalName: 'Asset Health Position',
    kind: 'projection',
    definition: 'As-of derived health/reliability position calculated from condition, inspection, sensor, failure and maintenance evidence under an explicit method/model version.',
    identityRule: 'Rebuildable projection with optional published snapshot; inputs and model version are pinned for auditability.',
    keyData: ['asset/system', 'as-of time', 'input evidence', 'health/condition score', 'failure risk', 'method/model version', 'recommended attention'],
    lifecycle: ['Calculated', 'Reviewed', 'Published', 'Superseded'],
    governance: ['Asset Health Position never overwrites Asset condition history or becomes a failure prediction fact.']
  },
  {
    modelId: 'HCM-SUCCESSION-PLAN',
    originGapIds: ['BG-006'],
    canonicalName: 'Succession Plan',
    kind: 'plan',
    definition: 'Governed plan for continuity of critical Positions/roles by identifying readiness needs, successor options and development actions over a defined horizon.',
    identityRule: 'Stable plan identity/version scoped to exact Position/role contexts; candidate inclusion is a relationship, not a change to Worker identity.',
    keyData: ['plan reference', 'critical position/role', 'horizon', 'risk/need', 'successor options', 'readiness', 'development actions', 'owner', 'review date'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Active', 'Revised', 'Superseded', 'Closed'],
    governance: ['Succession Plan does not promise promotion or alter Employment/Position assignment.', 'Sensitive talent data requires restricted access and retained decision provenance.']
  },
  {
    modelId: 'HCM-TALENT-POOL',
    originGapIds: ['BG-006'],
    canonicalName: 'Talent Pool',
    kind: 'execution-context',
    definition: 'Governed grouping context for Workers/Candidates considered for a defined capability, role family, leadership pipeline or development purpose.',
    identityRule: 'Stable pool identity; membership is separately effective and evidence-based so the Person/Worker master is never duplicated.',
    keyData: ['pool reference', 'purpose', 'target role/capability', 'criteria', 'owner', 'effective dates', 'access classification'],
    lifecycle: ['Proposed', 'Active', 'Paused', 'Retired'],
    governance: ['Talent Pool is not an Organisation Unit or Team.', 'Membership does not itself confer role, employment, authority or entitlement.']
  },
  {
    modelId: 'HCM-TALENT-POOL-MEMBERSHIP',
    originGapIds: ['BG-006'],
    canonicalName: 'Talent Pool Membership',
    kind: 'relationship',
    definition: 'Effective governed relationship between a Person/Worker/Candidate and a Talent Pool with evidence, readiness/context and review dates.',
    identityRule: 'Stable effective relationship retaining source/reviewer and membership rationale; removal/supersession preserves history.',
    keyData: ['talent pool', 'person/worker/candidate', 'basis/evidence', 'readiness/potential context', 'reviewer', 'effective dates', 'status'],
    lifecycle: ['Proposed', 'Active', 'Reviewed', 'Superseded', 'Removed'],
    governance: ['Membership is sensitive HCM context and never replaces Career Profile, Skill, Competency or Performance Review evidence.']
  },
  {
    modelId: 'HCM-TALENT-REVIEW',
    originGapIds: ['BG-006'],
    canonicalName: 'Talent Review',
    kind: 'event-evidence',
    definition: 'Governed review occurrence evaluating talent, succession/readiness and development context using exact evidence and criteria.',
    identityRule: 'Immutable review occurrence pinned to participants, criteria, Worker/Candidate evidence and resulting decisions/actions.',
    keyData: ['review scope/date', 'participants', 'criteria', 'people/pools/positions reviewed', 'evidence versions', 'findings', 'decisions/actions'],
    lifecycle: ['Planned', 'In Review', 'Completed', 'Published', 'Superseded/Corrected'],
    governance: ['Talent Review is not Performance Review and does not silently change worker profile or succession membership.']
  },
  {
    modelId: 'CFG-PRODUCT-CONFIG-MODEL',
    originGapIds: ['BG-012'],
    canonicalName: 'Product Configuration Model',
    kind: 'configuration',
    definition: 'Versioned governed configuration definition for a configurable Item/product/service, specifying applicable characteristics, option/value domains and rule-set versions used to derive valid configurations.',
    identityRule: 'Stable configuration-model identity/version attached to canonical Item/Variant definitions; published versions are immutable and historic quote/order/production configurations pin the exact version used.',
    keyData: ['model reference', 'item/variant scope', 'characteristics', 'rule-set version', 'applicability/effectivity', 'published version'],
    lifecycle: ['Draft', 'Validate', 'Published', 'Effective', 'Superseded', 'Retired'],
    governance: ['Configuration Model is not Item, Item Variant, BOM or configured transaction truth.', 'Effectivity/version changes never rewrite configurations already used in quotes, orders or production.']
  },
  {
    modelId: 'CFG-CHARACTERISTIC-DEFINITION',
    originGapIds: ['BG-012'],
    canonicalName: 'Configuration Characteristic',
    kind: 'definition',
    definition: 'Reusable versioned definition of a configurable property, option or parameter with governed value domain, unit, constraints and applicability.',
    identityRule: 'Stable characteristic identity/version reused across compatible configuration models; chosen values on a configuration do not mutate the definition.',
    keyData: ['characteristic code', 'name', 'data type', 'unit', 'allowed value/domain', 'defaulting policy', 'applicability', 'effective version'],
    lifecycle: ['Draft', 'Published', 'Effective', 'Superseded', 'Retired'],
    governance: ['Characteristic is configuration metadata, not an Asset reading or Item Specification itself.', 'Reference data/UOM are reused rather than duplicated.']
  },
  {
    modelId: 'CFG-CONFIGURATION-RULE',
    originGapIds: ['BG-012'],
    canonicalName: 'Configuration Rule',
    kind: 'definition',
    definition: 'Versioned rule or constraint controlling valid/default/derived combinations of characteristics, options, BOM components, routing/process choices or commercial configuration outcomes.',
    identityRule: 'Stable rule identity/version with explicit rule type, operands/dependencies, priority and applicability; runtime evaluation records pin the exact version.',
    keyData: ['rule reference', 'rule type', 'inputs/dependencies', 'condition/expression', 'result/action', 'priority', 'applicability', 'version'],
    lifecycle: ['Draft', 'Validated', 'Published', 'Effective', 'Superseded', 'Retired'],
    governance: ['Configuration Rule does not silently edit Item/BOM/Price data.', 'Commercial and manufacturing consequences remain explicit downstream records.']
  },
  {
    modelId: 'CFG-CONFIGURATION-INSTANCE',
    originGapIds: ['BG-012'],
    canonicalName: 'Product Configuration',
    kind: 'execution-context',
    definition: 'Governed resolved configuration of a configurable Item for an exact business context such as quotation, Sales Order, Production Order or Asset provenance.',
    identityRule: 'Stable configuration identity referencing the exact configuration-model/rule versions and selected/derived values; later reconfiguration creates a successor/version rather than rewriting accepted transaction history.',
    keyData: ['configuration reference', 'item/variant', 'model/version', 'selected/derived characteristic values', 'business context', 'validation result', 'configured at/by'],
    lifecycle: ['Draft', 'Valid', 'Accepted', 'Superseded', 'Cancelled'],
    governance: ['Product Configuration is not Item Variant or BOM identity.', 'Accepted quotes/orders/production preserve the configuration evidence actually used.']
  },
  {
    modelId: 'HCM-TRAVEL-REQUEST',
    originGapIds: ['BG-013'],
    canonicalName: 'Travel Request',
    kind: 'governance-case',
    definition: 'Governed request for business travel before commitment, including business purpose, traveller, itinerary intent, cost estimate, policy checks, risk context and approval.',
    identityRule: 'Stable request identity independent of external bookings and Expense Claim; changes retain approval/version history.',
    keyData: ['request reference', 'traveller', 'business purpose', 'planned itinerary', 'dates', 'cost estimate', 'project/cost context', 'policy exceptions', 'risk assessment', 'approval'],
    lifecycle: ['Draft', 'Submitted', 'In Review', 'Approved', 'Rejected', 'Cancelled', 'Converted to Trip'],
    governance: ['Travel Request is not Business Trip, booking or Expense Claim.', 'Approval/authority and Travel Risk Assessment remain explicit evidence.']
  },
  {
    modelId: 'HCM-BUSINESS-TRIP',
    originGapIds: ['BG-013'],
    canonicalName: 'Business Trip',
    kind: 'execution-context',
    definition: 'Stable business-travel occurrence connecting an approved travel purpose to itinerary/booking references, duty-of-care context, actual travel and resulting expenses.',
    identityRule: 'Stable trip identity for one governed journey context; itinerary/booking changes preserve supplier references and change evidence.',
    keyData: ['trip reference', 'traveller', 'source request', 'actual itinerary', 'booking references', 'travel risk', 'project/cost context', 'status', 'expense links'],
    lifecycle: ['Planned', 'Booked', 'In Progress', 'Completed', 'Cancelled', 'Closed'],
    governance: ['Business Trip does not duplicate Person, external booking-provider record or Expense Claim.', 'Duty-of-care/risk context remains linked throughout travel.']
  },
  {
    modelId: 'HCM-TRAVEL-BOOKING-EVIDENCE',
    originGapIds: ['BG-013'],
    canonicalName: 'Travel Booking Evidence',
    kind: 'event-evidence',
    definition: 'Controlled evidence/reference for externally or internally booked air, rail, accommodation, vehicle or other travel segment associated with a Business Trip.',
    identityRule: 'Immutable booking/version evidence preserving provider reference, segment, traveller, cost and change/cancellation history.',
    keyData: ['trip', 'provider', 'booking reference', 'segment/type', 'dates/times', 'locations', 'cost/currency', 'status', 'source/provenance'],
    lifecycle: ['Reserved', 'Ticketed/Confirmed', 'Changed', 'Consumed', 'Cancelled'],
    governance: ['Booking evidence may be integrated from specialist travel platforms; provider identifiers never replace NuBlox Business Trip identity.']
  },
  {
    modelId: 'DATA-MIGRATION-PROJECT',
    originGapIds: ['BG-014'],
    canonicalName: 'Data Migration Project',
    kind: 'plan',
    definition: 'Governed migration plan defining source/target systems, scope, migration objects/datasets, mappings, quality controls, cutover approach and accountable approvals.',
    identityRule: 'Stable project identity/version; execution runs reference the exact approved scope/mappings rather than redefining them.',
    keyData: ['project reference', 'source systems', 'target system', 'scope', 'migration objects/datasets', 'mapping versions', 'quality criteria', 'cutover plan', 'owners/approvals'],
    lifecycle: ['Draft', 'Approved', 'In Preparation', 'Executing', 'Validated', 'Closed', 'Cancelled'],
    governance: ['Migration Project is platform/data governance work and never becomes business-domain source truth.', 'Scope and mappings are version-controlled.']
  },
  {
    modelId: 'DATA-MIGRATION-MAPPING',
    originGapIds: ['BG-014'],
    canonicalName: 'Migration Mapping',
    kind: 'definition',
    definition: 'Versioned field/object/value transformation mapping from a defined source representation to canonical target semantics.',
    identityRule: 'Stable mapping identity/version with source/target schema, transformation rules, reference mappings and quality expectations.',
    keyData: ['mapping reference', 'source object/fields', 'target canonical object/fields', 'transformations', 'reference mappings', 'validation rules', 'version'],
    lifecycle: ['Draft', 'Validated', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: ['Mapping never changes the canonical business definition to accommodate a legacy source.', 'Migration runs pin the exact mapping version.']
  },
  {
    modelId: 'DATA-MIGRATION-RUN',
    originGapIds: ['BG-014'],
    canonicalName: 'Data Migration Run',
    kind: 'event-evidence',
    definition: 'Attributed execution evidence for extraction/staging/validation/simulation/load/reconciliation of a defined migration project scope.',
    identityRule: 'Immutable run occurrence referencing exact project/mapping versions, source snapshot, target environment and result evidence.',
    keyData: ['run reference', 'migration project/version', 'source snapshot', 'mapping versions', 'target environment', 'counts', 'validation/errors', 'simulation/load mode', 'started/completed at'],
    lifecycle: ['Prepared', 'Simulated', 'Executed', 'Validated', 'Failed', 'Reconciled', 'Superseded'],
    governance: ['Migration Run evidence is retained even after correction/re-run.', 'Loads must be traceable to source snapshot and transformations.']
  },
  {
    modelId: 'DATA-TEST-DATA-PROFILE',
    originGapIds: ['BG-014'],
    canonicalName: 'Test Data Provisioning Profile',
    kind: 'configuration',
    definition: 'Versioned policy/configuration for selecting, subsetting, synthesising, masking or anonymising data for non-production use.',
    identityRule: 'Stable profile identity/version with environment, data-domain, selection and protection rules; executions retain the exact profile used.',
    keyData: ['profile reference', 'source/target environment', 'data domains', 'selection/subsetting rules', 'mask/anonymise/synthetic rules', 'referential-integrity rules', 'retention', 'version'],
    lifecycle: ['Draft', 'Validated', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: ['Profile must respect Privacy/Information Governance and Security policies.', 'Production personal/sensitive data is not copied to lower environments without governed protection.']
  },
  {
    modelId: 'DATA-TEST-DATA-RUN',
    originGapIds: ['BG-014'],
    canonicalName: 'Test Data Provisioning Run',
    kind: 'event-evidence',
    definition: 'Auditable execution producing or refreshing a non-production dataset under an exact Test Data Provisioning Profile.',
    identityRule: 'Immutable run evidence linking source snapshot, applied rules, target environment, validation results and approvals/exceptions.',
    keyData: ['run reference', 'profile/version', 'source snapshot', 'target environment', 'applied protection', 'record counts', 'validation', 'exceptions', 'executed at/by'],
    lifecycle: ['Prepared', 'Executing', 'Validated', 'Released', 'Failed', 'Superseded'],
    governance: ['Run evidence proves data protection and lineage; it is not a business-domain dataset authority.']
  },
  {
    modelId: 'ENG-PRODUCT-REQUIREMENT',
    originGapIds: ['BG-015'],
    canonicalName: 'Product Requirement',
    kind: 'definition',
    definition: 'Versioned governed statement of required function, performance, interface, constraint, compliance or other behaviour for a product/service/system under development.',
    identityRule: 'Stable requirement identity/version independent of documents; requirement text, rationale, source, priority and verification criteria are governed and traceable.',
    keyData: ['requirement reference', 'type', 'statement', 'source/stakeholder', 'rationale', 'priority', 'acceptance/verification criteria', 'applicability', 'version'],
    lifecycle: ['Proposed', 'Reviewed', 'Approved', 'Allocated', 'Verified', 'Validated', 'Superseded', 'Retired'],
    governance: ['Product Requirement is not Information Requirement.', 'Documents may represent requirements but never replace structured requirement identity/history.']
  },
  {
    modelId: 'ENG-REQUIREMENT-SET',
    originGapIds: ['BG-015'],
    canonicalName: 'Requirement Set',
    kind: 'definition',
    definition: 'Governed versioned collection/baseline of Product Requirements for a defined product, system, release or development scope.',
    identityRule: 'Stable set identity with immutable approved baselines; membership/version changes create successor baselines.',
    keyData: ['set reference', 'scope/product/system', 'requirement versions', 'baseline/version', 'owner', 'approval', 'effective/release context'],
    lifecycle: ['Draft', 'Review', 'Baselined', 'Effective', 'Superseded', 'Retired'],
    governance: ['Requirement Set is not a generic document bundle or Information Container.', 'Baselines pin exact requirement versions used by design/test decisions.']
  },
  {
    modelId: 'ENG-SYSTEM-MODEL',
    originGapIds: ['BG-015'],
    canonicalName: 'Engineering System Model',
    kind: 'definition',
    definition: 'Version-controlled logical/functional systems-engineering model used to describe architecture, interfaces, behaviour and requirement allocation before or alongside physical product/asset realisation.',
    identityRule: 'Stable model identity/version separate from the physical built-environment System or installed Asset identity.',
    keyData: ['model reference', 'model type/language', 'scope/product', 'elements', 'interfaces', 'requirement allocations', 'version', 'tool/source provenance'],
    lifecycle: ['Draft', 'Review', 'Approved', 'Released', 'Superseded', 'Retired'],
    governance: ['Engineering System Model must not be confused with BOF-16 physical System identity.', 'Authoring-tool IDs map to canonical model identity and version.']
  },
  {
    modelId: 'ENG-SYSTEM-MODEL-ELEMENT',
    originGapIds: ['BG-015'],
    canonicalName: 'Engineering Model Element',
    kind: 'definition',
    definition: 'Versioned logical/functional element within an Engineering System Model, carrying interfaces, behaviours and allocations used for traceability and architecture reasoning.',
    identityRule: 'Identity is scoped to the canonical Engineering System Model and version lineage; it does not automatically create Item, Component or Asset identity.',
    keyData: ['model', 'element reference', 'element type', 'name', 'interfaces', 'relationships', 'allocated requirements', 'version'],
    lifecycle: ['Draft', 'Approved', 'Released', 'Superseded', 'Retired'],
    governance: ['Realisation links to Item/Component/System/Asset are explicit relationships rather than identity substitution.']
  },
  {
    modelId: 'FIN-LEASE-ACCOUNTING-RECORD',
    originGapIds: ['BG-016'],
    canonicalName: 'Lease Accounting Record',
    kind: 'accounting-record',
    definition: 'Finance-side accounting identity linking an exact Lease/Contract relationship to the governed accounting treatment, valuation basis and right-of-use/liability consequences required by the applicable accounting standard.',
    identityRule: 'Stable accounting record per governed lease/accounting basis/legal entity; it references canonical Lease/Contract/Property/Asset subjects and never replaces them.',
    keyData: ['lease/contract reference', 'legal entity/ledger', 'accounting principle', 'commencement/end', 'valuation parameters', 'right-of-use asset accounting reference', 'lease liability reference', 'status'],
    lifecycle: ['Proposed', 'Classified', 'Active', 'Modified', 'Terminated', 'Closed'],
    governance: ['Lease Accounting Record is financial consequence, not Property, physical Asset or Lease relationship truth.', 'Parallel accounting principles can coexist without duplicating the underlying lease.']
  },
  {
    modelId: 'FIN-LEASE-VALUATION',
    originGapIds: ['BG-016'],
    canonicalName: 'Lease Valuation',
    kind: 'event-evidence',
    definition: 'Dated attributable valuation/calculation evidence for a Lease Accounting Record under an exact accounting principle, contract terms, discount assumptions and effective date.',
    identityRule: 'Immutable valuation occurrence; modifications/reassessments create new valuations and accounting consequences rather than overwriting prior calculations.',
    keyData: ['lease accounting record', 'valuation date', 'accounting principle', 'payment/term basis', 'discount rate/source', 'right-of-use value', 'liability value', 'calculation evidence'],
    lifecycle: ['Calculated', 'Reviewed', 'Approved', 'Posted', 'Superseded/Corrected'],
    governance: ['Valuation pins exact lease terms and market/reference assumptions.', 'Generated postings remain immutable finance evidence.']
  },
  {
    modelId: 'FIN-LEASE-PAYMENT-SCHEDULE',
    originGapIds: ['BG-016'],
    canonicalName: 'Lease Accounting Schedule',
    kind: 'projection',
    definition: 'Rebuildable period schedule of lease payments, interest/accretion, liability movement and right-of-use depreciation derived from approved lease valuation parameters.',
    identityRule: 'Versioned/as-of projection tied to exact approved valuation; posted periods remain traceable to their generating schedule/version.',
    keyData: ['lease accounting record', 'valuation/version', 'period', 'payment', 'interest', 'principal/liability movement', 'right-of-use depreciation', 'currency'],
    lifecycle: ['Calculated', 'Approved', 'Current', 'Superseded', 'Completed'],
    governance: ['Schedule is not the contractual payment term itself and never rewrites the Lease/Contract.', 'Accounting entries reference exact schedule/valuation evidence.']
  },
  {
    modelId: 'DEL-SCHEDULE-CALENDAR',
    originGapIds: ['BG-017'],
    canonicalName: 'Schedule Calendar',
    kind: 'definition',
    definition: 'Versioned governed working-time calendar used by a Schedule or Schedule Activity to calculate planned/forecast dates and durations.',
    identityRule: 'Stable calendar identity/version defining working/non-working periods, shifts, holidays and exceptions; schedule calculations pin the exact version used.',
    keyData: ['calendar reference', 'timezone', 'working periods', 'non-working periods', 'holidays/exceptions', 'scope', 'effective version'],
    lifecycle: ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: ['Schedule Calendar is planning configuration, not Worker Availability, Shift assignment or site-access truth.', 'Historic schedule calculations retain the calendar version actually used.']
  },
  {
    modelId: 'DEL-SCHEDULE-CALCULATION-RUN',
    originGapIds: ['BG-017'],
    canonicalName: 'Schedule Calculation Run',
    kind: 'event-evidence',
    definition: 'Immutable execution evidence for network scheduling of an exact Schedule version using defined calendars, data date and calculation options.',
    identityRule: 'Stable run occurrence pinned to schedule/activity/dependency versions, data date, calendars and algorithm/options so calculated dates and float are reproducible.',
    keyData: ['schedule/version', 'data date', 'calendar versions', 'calculation options', 'activity/dependency snapshot', 'started/completed at', 'result status', 'warnings'],
    lifecycle: ['Prepared', 'Calculated', 'Validated', 'Published', 'Superseded/Corrected'],
    governance: ['Calculation Run never rewrites an approved Schedule Baseline.', 'Manual constraints/overrides remain explicit inputs rather than hidden date edits.']
  },
  {
    modelId: 'DEL-SCHEDULE-ANALYSIS-SNAPSHOT',
    originGapIds: ['BG-017'],
    canonicalName: 'Schedule Analysis Snapshot',
    kind: 'projection',
    definition: 'Rebuildable as-of schedule-analysis position containing calculated early/late dates, free/total float, critical/longest-path membership, schedule-health indicators and baseline variance for exact activity/network inputs.',
    identityRule: 'Projection or published snapshot references one Schedule Calculation Run; every metric retains the calculation basis and exact activity/dependency state.',
    keyData: ['calculation run', 'activity', 'early/late dates', 'free float', 'total float', 'critical/float path', 'baseline variance', 'health indicators'],
    lifecycle: ['Calculated', 'Reviewed', 'Published', 'Superseded'],
    governance: ['Criticality and float are calculated planning positions, not mutable flags on the Activity master.', 'Published snapshots can support delay/change evidence without replacing contemporaneous schedule/baseline truth.']
  },
  {
    modelId: 'DEL-RISK-SIMULATION-RUN',
    originGapIds: ['BG-019'],
    canonicalName: 'Project Risk Simulation Run',
    kind: 'event-evidence',
    definition: 'Immutable execution evidence for quantitative schedule/cost risk simulation against exact project, schedule, cost, risk and uncertainty inputs using a defined analysis method/model version.',
    identityRule: 'Stable run occurrence pinned to exact Enterprise Risk/Risk Assessment, Schedule/Activity, cost/forecast, uncertainty-distribution and response/scenario inputs so probabilistic results remain reproducible.',
    keyData: ['project', 'schedule/version', 'cost/forecast version', 'risks/assessments', 'uncertainty distributions', 'correlations/assumptions', 'simulation method/version', 'iterations', 'scenario/response basis', 'executed at/by'],
    lifecycle: ['Prepared', 'Running', 'Completed', 'Validated', 'Published', 'Superseded/Corrected'],
    governance: ['Simulation Run is analysis evidence and never replaces Enterprise Risk, Risk Assessment, Schedule or Forecast truth.', 'Historic results retain the exact assumptions and method version used.']
  },
  {
    modelId: 'DEL-RISK-ANALYSIS-SNAPSHOT',
    originGapIds: ['BG-019'],
    canonicalName: 'Project Risk Analysis Snapshot',
    kind: 'projection',
    definition: 'Rebuildable or published probabilistic project outcome position derived from a Project Risk Simulation Run, including schedule/cost distributions, confidence dates/values and risk contribution/sensitivity measures.',
    identityRule: 'Projection identity references one simulation run and exact target/scenario context; published snapshots are immutable comparison evidence.',
    keyData: ['simulation run', 'target/scenario', 'schedule outcome distribution', 'cost outcome distribution', 'confidence levels', 'P-values', 'sensitivity/contributors', 'contingency basis', 'published at'],
    lifecycle: ['Calculated', 'Reviewed', 'Published', 'Superseded'],
    governance: ['Probability outputs are analytical positions, not guaranteed completion dates/costs.', 'Accepted contingency or response decisions remain explicit downstream decisions/plans.']
  },
  {
    modelId: 'DEL-PROGRESS-MEASUREMENT-METHOD',
    originGapIds: ['BG-020'],
    canonicalName: 'Progress Measurement Method',
    kind: 'definition',
    definition: 'Versioned governed method defining how physical or deliverable progress is translated from attributable field/project evidence into comparable completion and earned-performance measures for a defined work scope.',
    identityRule: 'Stable method identity/version with explicit applicable work types, measurement basis and rules; Work Packages/Activities pin the exact method version used for each reporting period.',
    keyData: ['method reference', 'method type', 'applicable work scope', 'measurement basis', 'weighting/rules', 'quantity/UOM basis', 'validation criteria', 'effective version'],
    lifecycle: ['Draft', 'Validated', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: ['Progress Measurement Method is calculation policy, not Progress Record or actual completion truth.', 'Method changes never rewrite previously issued performance snapshots.']
  },
  {
    modelId: 'DEL-PERFORMANCE-CALCULATION-RUN',
    originGapIds: ['BG-020'],
    canonicalName: 'Project Performance Calculation Run',
    kind: 'event-evidence',
    definition: 'Immutable execution evidence combining exact baseline/budget, progress, cost, commitment, forecast, revenue/value and measurement-method inputs to calculate construction/project performance for a defined as-of period.',
    identityRule: 'Stable run occurrence pinned to exact source versions and as-of period so earned-value, productivity, forecast and cost/value outcomes are reproducible.',
    keyData: ['project/WBS/work package scope', 'as-of period', 'schedule baseline/version', 'budget/version', 'progress records', 'measurement-method version', 'actual costs', 'commitments', 'forecast/version', 'contract/value/revenue basis', 'calculation rules/version', 'executed at/by'],
    lifecycle: ['Prepared', 'Calculated', 'Validated', 'Published', 'Superseded/Corrected'],
    governance: ['Calculation Run never edits Progress, Budget, Contract, Commitment, Forecast or Ledger truth.', 'Manual overrides/management adjustments are explicit inputs with actor/reason/evidence.']
  },
  {
    modelId: 'DEL-PROJECT-PERFORMANCE-SNAPSHOT',
    originGapIds: ['BG-020'],
    canonicalName: 'Project Controls Performance Snapshot',
    kind: 'projection',
    definition: 'Rebuildable or published as-of project-controls position derived from one Project Performance Calculation Run, supporting earned value, productivity, forecast-at-completion, margin and construction cost/value reconciliation views.',
    identityRule: 'Projection or immutable published snapshot references one calculation run and exact reporting scope; every reported metric retains its source/calculation basis.',
    keyData: ['calculation run', 'scope', 'planned value', 'earned value', 'actual cost', 'schedule/cost variance', 'SPI/CPI', 'ETC/EAC', 'commitment/exposure', 'forecast cost/value', 'margin', 'installed/budget quantities', 'labour/plant productivity', 'CVR/value position', 'published at'],
    lifecycle: ['Calculated', 'Reviewed', 'Published', 'Superseded'],
    governance: ['Performance Snapshot is analytical/project-control evidence, not a second cost ledger, progress register or Contract valuation.', 'Earned value and CVR are views over canonical source facts and policies, not independently editable balances.']
  }
];

export const benchmarkRefinementRelationships: BenchmarkRefinementRelationship[] = [
  { id: 'BR-R01', from: 'PLN-SUPPLY-PLAN', predicate: 'responds to', to: 'PLN-DEMAND-PLAN', governance: 'Exact approved versions are linked so replanning never rewrites the original demand basis.' },
  { id: 'BR-R02', from: 'PLN-PLANNING-EXCEPTION', predicate: 'challenges', to: 'PLN-DEMAND-PLAN', governance: 'Exception pins the exact plan/scenario basis.' },
  { id: 'BR-R03', from: 'PLN-PLANNING-EXCEPTION', predicate: 'challenges', to: 'PLN-SUPPLY-PLAN', governance: 'Exception remains evidence even after plan revision.' },
  { id: 'BR-R04', from: 'TREASURY-HEDGE-RELATIONSHIP', predicate: 'hedges', to: 'TREASURY-EXPOSURE', governance: 'Designation/effectivity and hedge evidence are explicit.' },
  { id: 'BR-R05', from: 'MDG-DUPLICATE-CANDIDATE', predicate: 'may create', to: 'MDG-STEWARDSHIP-CASE', governance: 'Automated matching cannot merge identities without governed review.' },
  { id: 'BR-R06', from: 'MDG-MERGE-DECISION', predicate: 'authorises', to: 'MDG-IDENTITY-REDIRECT', governance: 'Redirect exists only with decision provenance.' },
  { id: 'BR-R07', from: 'REL-ASSET-CRITICALITY-ASSESSMENT', predicate: 'informs', to: 'REL-RELIABILITY-STRATEGY', governance: 'Strategy pins the assessment/method basis used for maintenance decisions.' },
  { id: 'BR-R08', from: 'REL-RELIABILITY-STRATEGY', predicate: 'addresses', to: 'REL-FAILURE-MODE', governance: 'Failure-mode applicability is explicit and versioned.' },
  { id: 'BR-R09', from: 'HCM-SUCCESSION-PLAN', predicate: 'draws from', to: 'HCM-TALENT-POOL', governance: 'Succession planning references governed pool context without changing Worker identity.' },
  { id: 'BR-R10', from: 'HCM-TALENT-POOL-MEMBERSHIP', predicate: 'participates in', to: 'HCM-TALENT-POOL', governance: 'Membership is effective-dated and evidence-based.' },
  { id: 'BR-R11', from: 'CFG-CONFIGURATION-INSTANCE', predicate: 'uses', to: 'CFG-PRODUCT-CONFIG-MODEL', governance: 'Accepted configurations pin the exact published model version.' },
  { id: 'BR-R12', from: 'HCM-BUSINESS-TRIP', predicate: 'originates from', to: 'HCM-TRAVEL-REQUEST', governance: 'The approved request remains distinct governance evidence.' },
  { id: 'BR-R13', from: 'HCM-TRAVEL-BOOKING-EVIDENCE', predicate: 'supports', to: 'HCM-BUSINESS-TRIP', governance: 'External booking evidence attaches without redefining trip identity.' },
  { id: 'BR-R14', from: 'DATA-MIGRATION-RUN', predicate: 'executes', to: 'DATA-MIGRATION-PROJECT', governance: 'Run pins the approved project and mapping versions.' },
  { id: 'BR-R15', from: 'DATA-TEST-DATA-RUN', predicate: 'uses', to: 'DATA-TEST-DATA-PROFILE', governance: 'Protection profile version is retained as audit evidence.' },
  { id: 'BR-R16', from: 'ENG-SYSTEM-MODEL-ELEMENT', predicate: 'belongs to', to: 'ENG-SYSTEM-MODEL', governance: 'Model-element identity remains scoped to its engineering model/version.' },
  { id: 'BR-R17', from: 'FIN-LEASE-VALUATION', predicate: 'values', to: 'FIN-LEASE-ACCOUNTING-RECORD', governance: 'Every valuation is immutable evidence against one accounting record/basis.' },
  { id: 'BR-R18', from: 'FIN-LEASE-PAYMENT-SCHEDULE', predicate: 'derives from', to: 'FIN-LEASE-ACCOUNTING-RECORD', governance: 'Schedule remains a projection and never replaces contract terms.' },
  { id: 'BR-R19', from: 'DEL-SCHEDULE-ANALYSIS-SNAPSHOT', predicate: 'derives from', to: 'DEL-SCHEDULE-CALCULATION-RUN', governance: 'Analysis pins the exact calculation evidence and scheduling basis.' },
  { id: 'BR-R20', from: 'DEL-RISK-ANALYSIS-SNAPSHOT', predicate: 'derives from', to: 'DEL-RISK-SIMULATION-RUN', governance: 'Probabilistic outcome snapshot pins the exact risk simulation evidence and assumptions.' },
  { id: 'BR-R21', from: 'DEL-PROJECT-PERFORMANCE-SNAPSHOT', predicate: 'derives from', to: 'DEL-PERFORMANCE-CALCULATION-RUN', governance: 'Published performance pins the exact calculation run and source versions.' },
  { id: 'BR-R22', from: 'DEL-PERFORMANCE-CALCULATION-RUN', predicate: 'uses', to: 'DEL-PROGRESS-MEASUREMENT-METHOD', governance: 'Performance calculation pins the exact approved progress-measurement method version.' }
];

export const benchmarkRefinementRules = [
  'Benchmark-driven refinements extend the canonical model without altering the historic 750-candidate discovery count.',
  'A vendor feature is never added solely because a vendor implements it; each refinement must represent a durable business identity, relationship, plan, event/evidence or projection.',
  'Planning truth remains separate from execution truth.',
  'Treasury risk positions remain separate from accounting and bank evidence.',
  'Master-data stewardship governs canonical identities but never creates a second master-data store.',
  'Advanced warehouse and freight execution must preserve Item, Inventory, Shipment, Contract and Finance truth boundaries.',
  'Reliability engineering reuses canonical Asset and Failure evidence rather than creating a parallel asset register.',
  'Succession and talent context reuses canonical Person/Worker/Position/Skill identity and remains access-controlled.',
  'Product configuration preserves Item, Variant, BOM and transaction history while pinning exact configuration-rule versions.',
  'Business travel connects approval, duty-of-care and expense without replacing specialist booking-provider truth.',
  'Migration and test-data operations are auditable platform evidence and never redefine canonical business semantics.',
  'Product requirements and engineering models remain distinct from information-delivery requirements and installed physical Systems.',
  'Lease accounting records financial consequences without replacing Lease, Contract, Property or physical Asset identity.',
  'CPM dates, float and critical-path status are reproducible schedule projections derived from explicit calendars, network logic and calculation evidence.',
  'Quantitative project-risk results are reproducible analysis evidence derived from explicit risk, schedule, cost, uncertainty and method inputs; they never replace source risk or plan truth.',
  'Earned value, productivity, EAC and CVR-style project-control positions are reproducible projections over governed progress, budget, commercial and accounting truth; reports never become a shadow cost ledger.'
];

export function validateBenchmarkRefinementModel() {
  if (new Set(benchmarkRefinementModel.map((entry) => entry.modelId)).size !== benchmarkRefinementModel.length) return false;
  if (!benchmarkRefinementModel.every((entry) => entry.originGapIds.length && entry.keyData.length && entry.governance.length)) return false;
  const ids = new Set(benchmarkRefinementModel.map((entry) => entry.modelId));
  if (!benchmarkRefinementRelationships.every((rel) => ids.has(rel.from) && ids.has(rel.to))) return false;
  for (const gapId of ['BG-001', 'BG-002', 'BG-003', 'BG-004', 'BG-005', 'BG-006', 'BG-012', 'BG-013', 'BG-014', 'BG-015', 'BG-016', 'BG-017', 'BG-019', 'BG-020']) {
    if (!benchmarkRefinementModel.some((entry) => entry.originGapIds.includes(gapId))) return false;
  }
  return true;
}
