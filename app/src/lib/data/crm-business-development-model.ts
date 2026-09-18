export type CrmModelKind =
  'classification' | 'plan' | 'event-evidence' | 'work' | 'case' | 'projection';

export type CrmModelDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: CrmModelKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type CrmRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

export type CrmBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const crm = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: CrmModelKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[],
  scope: string[] = ['tenant', 'legal entity', 'commercial context']
): CrmModelDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  scope,
  keyData,
  lifecycle,
  governance
});

export const crmBusinessDevelopmentModel: CrmModelDefinition[] = [
  crm(
    'CRM-MARKET-INSIGHT',
    ['BOF-03-001'],
    'Market Insight',
    'event-evidence',
    'Attributable market intelligence or analysis used to inform segmentation, targeting, pursuits and planning.',
    'Immutable insight/evidence identity with source and as-of context; later conclusions do not overwrite the original observation.',
    ['subject', 'source', 'as-of date', 'confidence', 'geography/sector', 'evidence links'],
    ['Captured', 'Validated', 'Superseded'],
    [
      'Insight is evidence/analysis, not a customer or market master.',
      'Source provenance and observation time are retained.'
    ]
  ),
  crm(
    'CRM-MARKET-SEGMENT',
    ['BOF-03-002'],
    'Market Segment',
    'classification',
    'Governed segmentation definition used to group markets, prospects, customers or opportunities for commercial analysis and targeting.',
    'Stable segment identity with effective-dated criteria/version.',
    ['name', 'criteria', 'geography', 'sector', 'effective dates'],
    ['Draft', 'Active', 'Retired'],
    ['Segment classification overlays Party/Opportunity identity and never replaces it.']
  ),
  crm(
    'CRM-ACCOUNT-PLAN',
    ['BOF-03-004'],
    'Account Plan',
    'plan',
    'Versioned commercial plan for developing a governed Party Relationship/account context.',
    'Stable plan identity scoped to one relationship/account context with retained versions/baselines.',
    ['relationship', 'objectives', 'stakeholders', 'opportunities', 'actions', 'review date'],
    ['Draft', 'Approved', 'Active', 'Superseded', 'Closed'],
    [
      'Account Plan references canonical Party/Party Relationship; it does not create an Account master.'
    ]
  ),
  crm(
    'CRM-INTERACTION',
    ['BOF-03-005'],
    'Customer Interaction',
    'event-evidence',
    'Attributable inbound or outbound interaction with a prospect/customer/contact, such as meeting, call, message or visit.',
    'Immutable interaction identity recording participants, channel, time and subject links.',
    ['participants', 'channel', 'occurred at', 'summary', 'related object', 'evidence'],
    ['Recorded', 'Corrected'],
    [
      'Interaction history is append-only evidence; correction adds attributable history.',
      'Contact/Party identity is referenced, not duplicated.'
    ]
  ),
  crm(
    'CRM-ACTIVITY',
    ['BOF-03-006'],
    'CRM Activity',
    'work',
    'Planned or assigned business-development/customer activity such as follow-up, call preparation, pursuit action or account-plan action.',
    'Stable activity identity scoped to a commercial context; completion does not replace the underlying Lead, Opportunity, Pursuit or Customer Case.',
    ['subject', 'owner/assignee', 'due date', 'priority', 'related Lead/Opportunity/Pursuit/Case'],
    ['Planned', 'Ready', 'In Progress', 'Completed', 'Cancelled'],
    [
      'CRM Activity is not Project Schedule Activity, Work Order or shared workflow Work Item.',
      'Assignment never implies approval or delegated authority.'
    ]
  ),
  crm(
    'CRM-LEAD',
    ['BOF-03-007'],
    'Lead',
    'case',
    'Early commercial signal or prospective demand that has not yet been qualified as an Opportunity.',
    'Stable lead identity that may initially have incomplete/unresolved Party details and later resolve to canonical Party/Relationship.',
    ['source', 'prospect/contact', 'need', 'value range', 'owner', 'qualification evidence'],
    ['New', 'Qualifying', 'Qualified', 'Disqualified', 'Converted', 'Closed'],
    [
      'Lead conversion references/creates the appropriate Opportunity without recreating Party identity.',
      'A Lead is not automatically a customer relationship.'
    ]
  ),
  crm(
    'CRM-OPPORTUNITY',
    ['BOF-03-008'],
    'Opportunity',
    'case',
    'Qualified commercial possibility with defined customer/prospect context, need, expected value, probability/range and decision horizon.',
    'Stable opportunity identity independent of later Pursuit, Estimate, Proposal, Contract or Project identities.',
    ['Party Relationship', 'need/scope', 'value range', 'stage', 'owner', 'expected decision date'],
    ['Qualified', 'Developing', 'Pursuit Proposed', 'Won', 'Lost', 'Withdrawn', 'Closed'],
    [
      'Opportunity never becomes Contract or Project identity.',
      'Commercial stage is not a universal enterprise lifecycle.'
    ]
  ),
  crm(
    'CRM-PURSUIT',
    ['BOF-03-009'],
    'Pursuit',
    'work',
    'Governed active effort to win a specific Opportunity, coordinating strategy, responsibilities, evidence and downstream bid/tender work.',
    'Stable pursuit identity linked to one primary Opportunity; multiple pursuits may be possible only where commercial structure requires explicit separation.',
    ['Opportunity', 'strategy', 'team', 'win themes', 'competitors', 'decision plan'],
    ['Proposed', 'Approved', 'Active', 'On Hold', 'Won', 'Lost', 'Closed'],
    [
      'Pursuit is not Opportunity identity and is not a Project.',
      'Bid/tender artefacts remain specialist downstream objects.'
    ]
  ),
  crm(
    'CRM-BID-DECISION',
    ['BOF-03-010'],
    'Bid/No-Bid Decision',
    'event-evidence',
    'Immutable attributable decision to pursue, conditionally pursue or decline a defined commercial opportunity/pursuit.',
    'Immutable decision identity bound to exact Opportunity/Pursuit context and decision evidence.',
    [
      'subject',
      'decision',
      'decision body/actor',
      'authority basis',
      'criteria',
      'timestamp',
      'conditions'
    ],
    ['Recorded'],
    [
      'Decision evidence is immutable and does not itself mutate downstream domain state.',
      'Protected decisions require applicable authority and segregation-of-duties evaluation.'
    ]
  ),
  crm(
    'CRM-PIPELINE-SNAPSHOT',
    ['BOF-03-011'],
    'Pipeline Snapshot',
    'projection',
    'Frozen as-of commercial pipeline position derived from canonical Leads/Opportunities/Pursuits.',
    'Snapshot identity contains as-of time and source population/query version; live pipeline remains derived.',
    ['as-of', 'filters', 'source set', 'stage/value aggregates', 'currency basis'],
    ['Frozen'],
    [
      'Pipeline is derived from canonical commercial objects and is never an independently edited truth store.'
    ]
  ),
  crm(
    'CRM-FORECAST-SNAPSHOT',
    ['BOF-03-012'],
    'Sales Forecast Snapshot',
    'projection',
    'Frozen forecast position derived from Opportunities, probability/range assumptions and governed forecasting rules.',
    'Immutable forecast snapshot identity with as-of time, scenario/rule version and source opportunities.',
    ['as-of', 'forecast horizon', 'scenario', 'rule version', 'source set', 'forecast value'],
    ['Frozen'],
    [
      'Forecast snapshot is not Opportunity truth and does not overwrite source probability/value assumptions.'
    ]
  ),
  crm(
    'CRM-CUSTOMER-ONBOARDING',
    ['BOF-03-013'],
    'Customer Onboarding Case',
    'case',
    'Governed case coordinating checks and tasks required to establish or activate a customer relationship for a defined Legal Entity/context.',
    'Stable onboarding-case identity linked to canonical Party and proposed/existing Party Relationship.',
    ['Party', 'relationship context', 'checks', 'owners', 'required evidence', 'decision/status'],
    ['Opened', 'In Progress', 'Pending Evidence', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
    [
      'Onboarding case does not create duplicate customer/organisation identity.',
      'Completion may activate relationship state only through explicit domain transition.'
    ]
  ),
  crm(
    'CRM-CUSTOMER-CASE',
    ['BOF-03-014', 'BOF-03-015'],
    'Customer Case',
    'case',
    'Governed customer matter requiring investigation, response or resolution; Complaint is a typed Customer Case.',
    'Stable case identity linked to canonical Party Relationship, subject business objects and attributable communications/evidence.',
    [
      'case type',
      'customer relationship',
      'subject',
      'severity',
      'owner',
      'SLA/target',
      'evidence'
    ],
    ['Opened', 'Triaged', 'In Progress', 'Awaiting Customer', 'Resolved', 'Closed', 'Reopened'],
    [
      'Complaint is a case type, not a parallel customer master.',
      'Resolution evidence is retained; case closure does not rewrite underlying Contract/Service/Asset truth.'
    ]
  )
];

export const crmRelationships: CrmRelationship[] = [
  {
    id: 'CRM-R01',
    from: 'CRM-MARKET-INSIGHT',
    predicate: 'informs',
    to: 'CRM-MARKET-SEGMENT',
    cardinality: 'many-to-many',
    governance: 'Insight may inform segment criteria without becoming classification truth.'
  },
  {
    id: 'CRM-R02',
    from: 'CRM-MARKET-SEGMENT',
    predicate: 'classifies',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-many',
    governance: 'Classification overlays the canonical Party Relationship.'
  },
  {
    id: 'CRM-R03',
    from: 'CRM-ACCOUNT-PLAN',
    predicate: 'plans',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-one',
    governance: 'Account planning uses the shared relationship identity.'
  },
  {
    id: 'CRM-R04',
    from: 'CRM-INTERACTION',
    predicate: 'concerns',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-one',
    governance: 'Interactions reference the customer/prospect relationship context.'
  },
  {
    id: 'CRM-R05',
    from: 'CRM-LEAD',
    predicate: 'may resolve to',
    to: 'CBO-PARTY',
    cardinality: 'many-to-zero-or-one',
    governance:
      'Lead capture may precede canonical Party resolution; duplicates must be reconciled before relationship activation.'
  },
  {
    id: 'CRM-R06',
    from: 'CRM-LEAD',
    predicate: 'converts to',
    to: 'CRM-OPPORTUNITY',
    cardinality: 'one-to-zero-or-many',
    governance: 'Conversion preserves lead provenance and creates/links Opportunity identity.'
  },
  {
    id: 'CRM-R07',
    from: 'CRM-OPPORTUNITY',
    predicate: 'relates to',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-one',
    governance: 'Opportunity customer/prospect context reuses Party Relationship.'
  },
  {
    id: 'CRM-R08',
    from: 'CRM-PURSUIT',
    predicate: 'executes',
    to: 'CRM-OPPORTUNITY',
    cardinality: 'many-to-one',
    governance: 'Pursuit is active work around Opportunity, not Opportunity identity.'
  },
  {
    id: 'CRM-R09',
    from: 'CRM-BID-DECISION',
    predicate: 'decides',
    to: 'CRM-PURSUIT',
    cardinality: 'many-to-one',
    governance: 'Decision binds to the exact pursuit/opportunity context and authority evidence.'
  },
  {
    id: 'CRM-R10',
    from: 'CRM-PIPELINE-SNAPSHOT',
    predicate: 'summarises',
    to: 'CRM-OPPORTUNITY',
    cardinality: 'one-to-many',
    governance: 'Snapshot retains source population and as-of context.'
  },
  {
    id: 'CRM-R11',
    from: 'CRM-FORECAST-SNAPSHOT',
    predicate: 'forecasts from',
    to: 'CRM-OPPORTUNITY',
    cardinality: 'one-to-many',
    governance:
      'Forecast remains rebuildable from source opportunities/rules except where intentionally frozen.'
  },
  {
    id: 'CRM-R12',
    from: 'CRM-CUSTOMER-ONBOARDING',
    predicate: 'establishes/activates',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-one',
    governance:
      'Relationship activation occurs only through explicit domain command after required checks.'
  },
  {
    id: 'CRM-R13',
    from: 'CRM-CUSTOMER-CASE',
    predicate: 'raised under',
    to: 'AUTH-PARTY-RELATIONSHIP',
    cardinality: 'many-to-one',
    governance: 'Customer matter reuses canonical customer/service relationship.'
  },
  {
    id: 'CRM-R14',
    from: 'CRM-ACTIVITY',
    predicate: 'works on',
    to: 'CRM-OPPORTUNITY',
    cardinality: 'many-to-zero-or-one',
    governance: 'CRM Activity coordinates commercial work without becoming Opportunity state.'
  },
  {
    id: 'CRM-R15',
    from: 'CRM-ACTIVITY',
    predicate: 'works on',
    to: 'CRM-CUSTOMER-CASE',
    cardinality: 'many-to-zero-or-one',
    governance: 'CRM Activity may support case handling while shared workflow remains separate.'
  }
];

export const crmBoundaries: CrmBoundary[] = [
  {
    name: 'Party identity',
    structure: 'Party / Organisation → Party Relationship',
    purpose: 'One canonical counterparty identity with contextual commercial relationships.',
    mustNotBecome: 'Prospect master / Customer master / Account master duplicates'
  },
  {
    name: 'Commercial funnel',
    structure: 'Lead → Opportunity → Pursuit → Bid decision',
    purpose: 'Preserve distinct qualification, possibility, execution and decision semantics.',
    mustNotBecome: 'One mutable CRM record whose meaning changes by status'
  },
  {
    name: 'Downstream conversion',
    structure: 'Opportunity/Pursuit → Estimate / Proposal / Contract / Project references',
    purpose: 'Create downstream specialist identities while retaining provenance.',
    mustNotBecome: 'Opportunity renamed into Contract or Project'
  },
  {
    name: 'Customer operations',
    structure: 'Party Relationship → Onboarding / Interaction / Customer Case',
    purpose: 'Manage customer context without duplicating Party or operational truth.',
    mustNotBecome: 'A second customer database'
  }
];

export const crmRules = [
  'Prospect, customer and account terminology never creates duplicate Party or Organisation masters.',
  'Account Relationship, Customer Relationship and Service Relationship use the shared Party Relationship pattern with explicit relationship type/context.',
  'Lead, Opportunity and Pursuit are separate identities with separate lifecycle meaning.',
  'Opportunity is not Contract, Project, Estimate or Proposal identity.',
  'CRM Activity is not Project Schedule Activity, Work Order or shared workflow Work Item.',
  'Bid/No-Bid Decision is immutable attributable decision evidence and protected decisions require applicable authority.',
  'Pipeline and forecast snapshots are derived/frozen projections, not independently editable commercial truth.',
  'Customer Onboarding is a case/process around Party Relationship activation; it does not create a customer master.',
  'Complaint is a typed Customer Case and reuses the same case/evidence model.',
  'Interactions are attributable append-only evidence linked to canonical Parties/relationships and relevant commercial objects.',
  'Downstream tendering, estimating, proposal, Contract and Project identities are linked by provenance rather than reusing Opportunity identity.',
  'Tenant/legal-entity scope, privacy, retention and access policy apply to customer/contact information and interaction evidence.'
] as const;

export function validateCrmBusinessDevelopmentModel() {
  const ids = new Set(crmBusinessDevelopmentModel.map((item) => item.modelId));
  const external = new Set(['CBO-PARTY', 'AUTH-PARTY-RELATIONSHIP']);
  if (ids.size !== crmBusinessDevelopmentModel.length) return false;
  if (
    crmBusinessDevelopmentModel.some(
      (item) => !item.canonicalName || !item.definition || !item.identityRule
    )
  )
    return false;
  if (
    crmRelationships.some(
      (rel) => !ids.has(rel.from) || (!ids.has(rel.to) && !external.has(rel.to))
    )
  )
    return false;
  return true;
}
