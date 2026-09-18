export type BenchmarkRefinementKind =
  | 'plan'
  | 'transaction'
  | 'relationship'
  | 'event-evidence'
  | 'governance-case'
  | 'projection'
  | 'reference-snapshot';

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
  }
];

export const benchmarkRefinementRelationships: BenchmarkRefinementRelationship[] = [
  { id: 'BR-R01', from: 'PLN-SUPPLY-PLAN', predicate: 'responds to', to: 'PLN-DEMAND-PLAN', governance: 'Exact approved versions are linked so replanning never rewrites the original demand basis.' },
  { id: 'BR-R02', from: 'PLN-PLANNING-EXCEPTION', predicate: 'challenges', to: 'PLN-DEMAND-PLAN', governance: 'Exception pins the exact plan/scenario basis.' },
  { id: 'BR-R03', from: 'PLN-PLANNING-EXCEPTION', predicate: 'challenges', to: 'PLN-SUPPLY-PLAN', governance: 'Exception remains evidence even after plan revision.' },
  { id: 'BR-R04', from: 'TREASURY-HEDGE-RELATIONSHIP', predicate: 'hedges', to: 'TREASURY-EXPOSURE', governance: 'Designation/effectivity and hedge evidence are explicit.' },
  { id: 'BR-R05', from: 'MDG-DUPLICATE-CANDIDATE', predicate: 'may create', to: 'MDG-STEWARDSHIP-CASE', governance: 'Automated matching cannot merge identities without governed review.' },
  { id: 'BR-R06', from: 'MDG-MERGE-DECISION', predicate: 'authorises', to: 'MDG-IDENTITY-REDIRECT', governance: 'Redirect exists only with decision provenance.' }
];

export const benchmarkRefinementRules = [
  'Benchmark-driven refinements extend the canonical model without altering the historic 750-candidate discovery count.',
  'A vendor feature is never added solely because a vendor implements it; each refinement must represent a durable business identity, relationship, plan, event/evidence or projection.',
  'Planning truth remains separate from execution truth.',
  'Treasury risk positions remain separate from accounting and bank evidence.',
  'Master-data stewardship governs canonical identities but never creates a second master-data store.'
];

export function validateBenchmarkRefinementModel() {
  if (new Set(benchmarkRefinementModel.map((entry) => entry.modelId)).size !== benchmarkRefinementModel.length) return false;
  if (!benchmarkRefinementModel.every((entry) => entry.originGapIds.length && entry.keyData.length && entry.governance.length)) return false;
  const ids = new Set(benchmarkRefinementModel.map((entry) => entry.modelId));
  if (!benchmarkRefinementRelationships.every((rel) => ids.has(rel.from) && ids.has(rel.to))) return false;
  for (const gapId of ['BG-001', 'BG-002', 'BG-003']) {
    if (!benchmarkRefinementModel.some((entry) => entry.originGapIds.includes(gapId))) return false;
  }
  return true;
}
