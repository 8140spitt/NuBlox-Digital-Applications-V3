export type DeliveryContextKind =
  | 'governance-context'
  | 'foundation-reference'
  | 'classification-assignment'
  | 'scope-structure'
  | 'plan'
  | 'work'
  | 'event-evidence'
  | 'constraint';

export type DeliveryContextDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: DeliveryContextKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type DeliveryContextRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type DeliveryStructureBoundary = {
  name: string;
  purpose: string;
  structure: string;
  mustNotBecome: string;
};

export const deliveryContextModel: DeliveryContextDefinition[] = [
  {
    modelId: 'DEL-PORTFOLIO',
    candidateKeys: ['BOF-06-001'],
    canonicalName: 'Portfolio',
    kind: 'governance-context',
    definition: 'A governed collection of investments, programmes and projects managed together to achieve strategic outcomes and optimise enterprise resources.',
    identityRule: 'Stable Portfolio identity independent of the projects/programmes currently associated with it.',
    scope: ['tenant', 'legal entity', 'enterprise strategy'],
    keyData: ['portfolio code', 'purpose', 'owner/accountability', 'investment criteria', 'effective membership'],
    lifecycle: ['Proposed', 'Active', 'On Hold', 'Closed'],
    governance: [
      'Portfolio membership is an effective relationship; removing a Project never changes Project identity.',
      'Portfolio is not a financial ledger dimension, dashboard grouping or folder.',
      'Projects may be governed directly by a Portfolio without being forced into a Programme.'
    ]
  },
  {
    modelId: 'DEL-PROGRAMME',
    candidateKeys: ['BOF-06-002'],
    canonicalName: 'Programme',
    kind: 'governance-context',
    definition: 'A coordinated governance context for related projects and change activities managed together to realise outcomes and benefits.',
    identityRule: 'Stable Programme identity; its constituent Projects remain independent canonical identities.',
    scope: ['tenant', 'portfolio', 'legal entity', 'organisation unit'],
    keyData: ['programme code', 'outcomes', 'benefits', 'accountability', 'effective project membership'],
    lifecycle: ['Proposed', 'Approved', 'Active', 'On Hold', 'Completed', 'Closed', 'Cancelled'],
    governance: [
      'Programme coordination does not make Project data subordinate copies.',
      'A Project can be re-associated without renumbering or recreating it.',
      'Programme is distinct from a schedule/programme of works.'
    ]
  },
  {
    modelId: 'CBO-PROJECT',
    candidateKeys: ['BOF-06-003', 'BOF-06-004'],
    canonicalName: 'Project',
    kind: 'foundation-reference',
    definition: 'The stable governed delivery identity defined by the foundation object model and reused across every delivery structure.',
    identityRule: 'One immutable Project identity survives stage changes, rebaselines, organisational change, contract changes and handover.',
    scope: ['tenant', 'legal entity', 'organisation unit', 'portfolio/programme where applicable'],
    keyData: ['project ID', 'project/job number', 'accountable legal entity', 'responsible organisation unit'],
    lifecycle: ['Proposed', 'Approved', 'Active', 'On Hold', 'Completed', 'Closed', 'Cancelled'],
    governance: [
      'Job is an industry alias in the project-controls context, not a second master.',
      'Project stage, WBS, schedule, contracts, sites and assets are related structures/objects.',
      'No workspace may create its own Project identity.'
    ]
  },
  {
    modelId: 'DEL-STAGE-ASSIGNMENT',
    candidateKeys: ['BOF-06-006', 'BOF-06-007', 'BOF-12-002'],
    canonicalName: 'Delivery Stage Assignment',
    kind: 'classification-assignment',
    definition: 'An effective assignment of a governed project phase/stage definition to a Project, optionally carrying planned/actual dates and gate status.',
    identityRule: 'Stage/phase is contextual classification of the Project; it never creates a new Project identity.',
    scope: ['project', 'project-stage framework'],
    keyData: ['project', 'stage definition', 'level type', 'planned dates', 'actual dates', 'gate/effectivity'],
    lifecycle: ['Planned', 'Current', 'Completed', 'Skipped', 'Cancelled'],
    governance: [
      'Phase and Stage use one governed assignment pattern; configured definitions provide terminology and hierarchy.',
      'RIBA, client, infrastructure or tenant-specific stages are configuration, not hard-coded Project states.',
      'Stage assignment is separate from Project lifecycle and workflow approval tasks.'
    ]
  },
  {
    modelId: 'DEL-WBS-ELEMENT',
    candidateKeys: ['BOF-06-008'],
    canonicalName: 'WBS Element',
    kind: 'scope-structure',
    definition: 'A stable node in a project Work Breakdown Structure used to decompose and control delivery scope.',
    identityRule: 'Immutable WBS Element identity within a Project; code/title/hierarchy may change under governed change while history is retained.',
    scope: ['project', 'WBS hierarchy'],
    keyData: ['project', 'WBS code', 'title', 'parent WBS element', 'scope description', 'effective hierarchy'],
    lifecycle: ['Planned', 'Active', 'Closed', 'Cancelled'],
    governance: [
      'WBS represents scope decomposition, not schedule sequencing.',
      'Physical assets, contracts and cost accounts may reference WBS but do not become WBS nodes by identity.',
      'Hierarchy changes preserve historical reporting and baseline traceability.'
    ]
  },
  {
    modelId: 'DEL-WORK-PACKAGE',
    candidateKeys: ['BOF-06-009'],
    canonicalName: 'Work Package',
    kind: 'work',
    definition: 'A governed package of project delivery scope that can be assigned, planned, controlled and evidenced as a coherent unit of work.',
    identityRule: 'Stable Work Package identity linked to Project/WBS scope; schedule activities and commercial packages reference it rather than replace it.',
    scope: ['project', 'WBS element', 'organisation/responsibility context'],
    keyData: ['project', 'WBS link', 'scope', 'responsibility', 'planned dates', 'completion criteria'],
    lifecycle: ['Planned', 'Ready', 'In Progress', 'Blocked', 'Complete', 'Closed', 'Cancelled'],
    governance: [
      'Work Package is not automatically a Procurement Package, Commercial Package or Contract.',
      'A Work Package can map to many schedule activities and commercial/procurement packages.',
      'Completion requires governed evidence/acceptance rules rather than a percentage alone.'
    ]
  },
  {
    modelId: 'DEL-SCHEDULE',
    candidateKeys: ['BOF-06-013'],
    canonicalName: 'Schedule',
    kind: 'plan',
    definition: 'A time-planning network for a Project, Programme or governed delivery context containing activities, milestones and dependencies.',
    identityRule: 'Stable Schedule identity; updates change the current working plan while approved baselines remain immutable separate records.',
    scope: ['project', 'programme where applicable', 'schedule context'],
    keyData: ['schedule code', 'planning context', 'calendar', 'data date', 'current working version'],
    lifecycle: ['Draft', 'Current', 'Superseded', 'Closed'],
    governance: [
      'Schedule is a time model, not the WBS and not the Project lifecycle.',
      'Multiple schedules may exist for one Project where their purpose and ownership are explicit.',
      'External planning-system IDs are mappings, not NuBlox canonical identity.'
    ]
  },
  {
    modelId: 'DEL-SCHEDULE-ACTIVITY',
    candidateKeys: ['BOF-06-010', 'BOF-06-011'],
    canonicalName: 'Schedule Activity',
    kind: 'work',
    definition: 'A planned unit of time-based work within a Schedule, with duration, dates, progress and network relationships.',
    identityRule: 'Stable activity identity within its Schedule; activity code is a governed business identifier.',
    scope: ['schedule', 'project', 'WBS/work-package mapping'],
    keyData: ['activity code', 'schedule', 'description', 'duration', 'dates', 'calendar', 'WBS/work package links'],
    lifecycle: ['Not Started', 'In Progress', 'Complete', 'Cancelled'],
    governance: [
      'Project-controls Task is normalised to Schedule Activity in this context.',
      'Workflow Work Item/Approval Task remains a separate shared-work object.',
      'Activity mapping to WBS or Work Package is explicit and can be many-to-many where required.'
    ]
  },
  {
    modelId: 'DEL-MILESTONE',
    candidateKeys: ['BOF-06-012'],
    canonicalName: 'Milestone',
    kind: 'work',
    definition: 'A zero-duration schedule marker representing a significant planned or achieved point in time.',
    identityRule: 'Stable Milestone identity within a Schedule; it can reference a gate, contractual key date or completion event without becoming that object.',
    scope: ['schedule', 'project/programme'],
    keyData: ['milestone code', 'schedule', 'planned date', 'actual date', 'type', 'linked business object'],
    lifecycle: ['Planned', 'Achieved', 'Missed', 'Cancelled'],
    governance: [
      'Milestone is not a Gate Review, Contract Key Date or approval task; it may reference them.',
      'Milestone achievement must be evidenced where governance requires it.'
    ]
  },
  {
    modelId: 'DEL-SCHEDULE-BASELINE',
    candidateKeys: ['BOF-06-014'],
    canonicalName: 'Schedule Baseline',
    kind: 'plan',
    definition: 'An immutable approved snapshot of a Schedule used as a governed comparison point for performance and change control.',
    identityRule: 'Each baseline has its own immutable identity and approval/effective date while referencing one Schedule.',
    scope: ['schedule', 'project/programme', 'baseline approval context'],
    keyData: ['schedule', 'baseline number', 'as-of date', 'approved snapshot', 'approval evidence', 'supersession'],
    lifecycle: ['Proposed', 'Approved', 'Current', 'Superseded', 'Withdrawn'],
    governance: [
      'Approved baseline content is immutable.',
      'Rebaseline creates a new baseline; it never overwrites the prior approved record.',
      'Forecast/current schedule and baseline are separate views of truth.'
    ]
  },
  {
    modelId: 'DEL-PROGRESS-RECORD',
    candidateKeys: ['BOF-06-016', 'BOF-12-009'],
    canonicalName: 'Progress Record',
    kind: 'event-evidence',
    definition: 'An as-of-date evidence record describing measured progress against a governed delivery object such as an Activity or Work Package.',
    identityRule: 'Immutable observation/event identity; corrections create explicit correction/supersession evidence rather than silent overwrite.',
    scope: ['project', 'activity', 'work package', 'reporting period'],
    keyData: ['subject', 'as-of date/time', 'measure', 'quantity/percent where applicable', 'source', 'actor', 'evidence'],
    lifecycle: ['Recorded', 'Validated', 'Corrected', 'Superseded'],
    governance: [
      'Progress is event/evidence, not a mutable percentage field that destroys history.',
      'Derived current progress is a projection of validated records.',
      'Source and measurement basis must remain traceable.'
    ]
  },
  {
    modelId: 'DEL-RESOURCE-REQUIREMENT',
    candidateKeys: ['BOF-06-017'],
    canonicalName: 'Resource Requirement',
    kind: 'plan',
    definition: 'A planned need for a classified resource, quantity/capacity and time window against delivery scope or scheduled work.',
    identityRule: 'Stable requirement identity; fulfilment/allocation is a separate relationship and does not rewrite the requirement.',
    scope: ['project', 'work package', 'activity', 'planning period'],
    keyData: ['required resource classification', 'quantity/capacity', 'dates', 'target work', 'priority'],
    lifecycle: ['Draft', 'Approved', 'Open', 'Partially Fulfilled', 'Fulfilled', 'Cancelled'],
    governance: [
      'Requirement is distinct from Resource Allocation.',
      'A requirement may be fulfilled by people, plant, equipment, materials or other resource types through domain-specific allocations.',
      'Resource master identities remain authoritative in their own domains.'
    ]
  },
  {
    modelId: 'DEL-CONSTRAINT',
    candidateKeys: ['BOF-06-025', 'BOF-12-020'],
    canonicalName: 'Delivery Constraint',
    kind: 'constraint',
    definition: 'A governed delivery/project constraint that limits or blocks planned work, access, information, resources, sequence or conditions.',
    identityRule: 'Stable constraint identity shared by project controls and field operations, retaining exact source, scope, impact, owner and resolution history.',
    scope: ['project', 'WBS/work package', 'schedule activity', 'site/work area'],
    keyData: ['constraint type', 'scope', 'source/basis', 'description', 'impact', 'owner', 'needed-by date', 'mitigation/resolution'],
    lifecycle: ['Identified', 'Open', 'Mitigating', 'Resolved', 'Closed', 'Cancelled'],
    governance: [
      'Project-controls Constraint and Field Constraint use one canonical Delivery Constraint identity.',
      'Development Constraint remains a distinct land/development concept because it governs development feasibility/consent rather than delivery execution.',
      'Closing or resolving a constraint preserves its original impact and resolution evidence.'
    ]
  }
];

export const deliveryContextRelationships: DeliveryContextRelationship[] = [
  { id: 'DEL-R01', from: 'DEL-PORTFOLIO', predicate: 'contains', to: 'DEL-PROGRAMME', cardinality: '0..* ↔ 0..*', relationshipObject: 'Portfolio Membership', governance: 'Membership is effective-dated; Programme identity remains independent.' },
  { id: 'DEL-R02', from: 'DEL-PORTFOLIO', predicate: 'governs', to: 'CBO-PROJECT', cardinality: '0..* ↔ 0..*', relationshipObject: 'Portfolio Project Membership', governance: 'Projects may be portfolio-governed without a Programme.' },
  { id: 'DEL-R03', from: 'DEL-PROGRAMME', predicate: 'coordinates', to: 'CBO-PROJECT', cardinality: '0..* ↔ 0..*', relationshipObject: 'Programme Project Membership', governance: 'Effective association; no duplicate Project master.' },
  { id: 'DEL-R04', from: 'CBO-PROJECT', predicate: 'classified through', to: 'DEL-STAGE-ASSIGNMENT', cardinality: '1 ↔ 0..*', governance: 'Assignments reference configured Project Stage Definitions and retain dates/history.' },
  { id: 'DEL-R05', from: 'CBO-PROJECT', predicate: 'decomposed by', to: 'DEL-WBS-ELEMENT', cardinality: '1 ↔ 0..*', governance: 'WBS is the controlled scope hierarchy.' },
  { id: 'DEL-R06', from: 'DEL-WBS-ELEMENT', predicate: 'parent of', to: 'DEL-WBS-ELEMENT', cardinality: '0..1 ↔ 0..*', governance: 'Hierarchy changes are controlled/effective and cannot create cycles.' },
  { id: 'DEL-R07', from: 'DEL-WBS-ELEMENT', predicate: 'scopes', to: 'DEL-WORK-PACKAGE', cardinality: '0..* ↔ 0..*', governance: 'Work Package scope mapping is explicit; package identity is independent.' },
  { id: 'DEL-R08', from: 'CBO-PROJECT', predicate: 'planned by', to: 'DEL-SCHEDULE', cardinality: '1 ↔ 0..*', governance: 'Schedule purpose/ownership must be explicit where multiple schedules exist.' },
  { id: 'DEL-R09', from: 'DEL-SCHEDULE', predicate: 'contains', to: 'DEL-SCHEDULE-ACTIVITY', cardinality: '1 ↔ 0..*', governance: 'Activity identity belongs to one Schedule; cross-schedule mappings are separate relationships.' },
  { id: 'DEL-R10', from: 'DEL-SCHEDULE', predicate: 'contains', to: 'DEL-MILESTONE', cardinality: '1 ↔ 0..*', governance: 'Milestone may reference business gates/key dates but does not replace them.' },
  { id: 'DEL-R11', from: 'DEL-SCHEDULE', predicate: 'baselined by', to: 'DEL-SCHEDULE-BASELINE', cardinality: '1 ↔ 0..*', governance: 'Approved baselines are immutable and superseded, never overwritten.' },
  { id: 'DEL-R12', from: 'DEL-SCHEDULE-ACTIVITY', predicate: 'depends on', to: 'DEL-SCHEDULE-ACTIVITY', cardinality: '0..* ↔ 0..*', relationshipObject: 'Dependency', governance: 'Dependency carries relationship type, lag/lead and planning provenance.' },
  { id: 'DEL-R13', from: 'DEL-SCHEDULE-ACTIVITY', predicate: 'maps to', to: 'DEL-WBS-ELEMENT', cardinality: '0..* ↔ 0..*', governance: 'Schedule network and WBS hierarchy remain independent structures.' },
  { id: 'DEL-R14', from: 'DEL-SCHEDULE-ACTIVITY', predicate: 'executes', to: 'DEL-WORK-PACKAGE', cardinality: '0..* ↔ 0..*', governance: 'Many activities may execute one package and vice versa where justified.' },
  { id: 'DEL-R15', from: 'DEL-PROGRESS-RECORD', predicate: 'evidences', to: 'DEL-SCHEDULE-ACTIVITY', cardinality: '0..* ↔ 1', governance: 'Progress history is append-only/correctable evidence.' },
  { id: 'DEL-R16', from: 'DEL-PROGRESS-RECORD', predicate: 'evidences', to: 'DEL-WORK-PACKAGE', cardinality: '0..* ↔ 1', governance: 'Package progress may be derived from validated evidence and lower-level work.' },
  { id: 'DEL-R17', from: 'DEL-RESOURCE-REQUIREMENT', predicate: 'required by', to: 'DEL-SCHEDULE-ACTIVITY', cardinality: '0..* ↔ 0..*', governance: 'Requirement and allocation are separate.' },
  { id: 'DEL-R18', from: 'DEL-RESOURCE-REQUIREMENT', predicate: 'required by', to: 'DEL-WORK-PACKAGE', cardinality: '0..* ↔ 0..*', governance: 'Requirements can be planned at the scope level before detailed activities exist.' },
  { id: 'DEL-R19', from: 'DEL-CONSTRAINT', predicate: 'constrains', to: 'DEL-WORK-PACKAGE', cardinality: '0..* ↔ 0..*', governance: 'Constraint scope is explicit and does not become Work Package state.' },
  { id: 'DEL-R20', from: 'DEL-CONSTRAINT', predicate: 'may constrain', to: 'DEL-SCHEDULE-ACTIVITY', cardinality: '0..* ↔ 0..*', governance: 'Schedule impact and constraint identity remain separate so delay/forecast evidence is reconstructable.' }
];

export const deliveryStructureBoundaries: DeliveryStructureBoundary[] = [
  { name: 'Governance hierarchy', purpose: 'Investment and outcome governance', structure: 'Portfolio → Programme → Project', mustNotBecome: 'Schedule/WBS/cost hierarchy' },
  { name: 'Stage model', purpose: 'Delivery maturity and gates', structure: 'Project → Delivery Stage Assignment → configured stage definition', mustNotBecome: 'Project lifecycle or approval workflow' },
  { name: 'Scope hierarchy', purpose: 'Decompose controlled project scope', structure: 'Project → WBS Element → Work Package', mustNotBecome: 'Schedule network or asset hierarchy' },
  { name: 'Time network', purpose: 'Plan sequence and dates', structure: 'Schedule → Activity / Milestone + Dependency', mustNotBecome: 'WBS or workflow task list' },
  { name: 'Commercial structure', purpose: 'Contractual/procurement commitments', structure: 'Contract / Commercial Package / Procurement Package', mustNotBecome: 'Work Package by default' },
  { name: 'Physical structure', purpose: 'Represent the built environment', structure: 'Site / System / Asset / Component', mustNotBecome: 'WBS or schedule nodes' },
  { name: 'Information structure', purpose: 'Controlled project/asset information', structure: 'Information Container + classification/relationships', mustNotBecome: 'Project folder tree as canonical business model' }
];

export const deliveryContextRules = [
  'Portfolio, Programme and Project are governance identities; membership between them is effective-dated.',
  'Project identity survives every phase, stage, schedule update, rebaseline, contract change and handover.',
  'Phase/Stage is classification context and is not Project lifecycle.',
  'WBS is the scope hierarchy; Schedule is the time network. They are related but never collapsed into one structure.',
  'Work Package is delivery scope; Procurement Package and Commercial Package remain separate business objects.',
  'Project-controls Task is normalised to Schedule Activity; workflow Work Item/Approval Request remains separate.',
  'Approved Schedule Baselines are immutable. Rebaseline creates a new governed baseline.',
  'Progress is captured as dated evidence/events; current percentage/status is derived rather than destructively overwritten.',
  'Project-controls and field constraints converge on Delivery Constraint; Development Constraint remains separate land/development semantics.',
  'Physical Site/System/Asset identity is independent of Project/WBS/Schedule and survives handover.',
  'Responsibility, participation and authority use the shared Authority & Participation model rather than bespoke project-role columns.'
];

export function validateDeliveryContextModel() {
  const ids = new Set<string>();
  const candidates = new Set<string>();
  for (const item of deliveryContextModel) {
    if (!item.modelId || ids.has(item.modelId)) throw new Error(`Duplicate delivery model ID: ${item.modelId}`);
    if (!item.candidateKeys.length || !item.scope.length || !item.keyData.length || !item.governance.length) throw new Error(`Incomplete delivery context definition: ${item.modelId}`);
    ids.add(item.modelId);
    for (const candidate of item.candidateKeys) {
      if (candidates.has(candidate)) throw new Error(`Delivery candidate used twice: ${candidate}`);
      candidates.add(candidate);
    }
  }
  for (const relationship of deliveryContextRelationships) {
    if (!ids.has(relationship.from) || !ids.has(relationship.to)) throw new Error(`Unknown delivery relationship endpoint: ${relationship.id}`);
  }
  return true;
}
