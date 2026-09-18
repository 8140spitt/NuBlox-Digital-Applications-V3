export type TransformationProcessImprovementKind =
  | 'shared-reference'
  | 'initiative'
  | 'event-evidence'
  | 'relationship'
  | 'plan'
  | 'work'
  | 'transition'
  | 'architecture'
  | 'process'
  | 'controlled-definition'
  | 'child'
  | 'case'
  | 'proposal';

export type TransformationProcessImprovementDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: TransformationProcessImprovementKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type TransformationProcessImprovementRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const tpi = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: TransformationProcessImprovementKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): TransformationProcessImprovementDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  keyData,
  lifecycle,
  governance
});

export const transformationProcessImprovementModel: TransformationProcessImprovementDefinition[] = [
  tpi(
    'TRANS-PORTFOLIO',
    ['BOF-26-001'],
    'Transformation Portfolio',
    'shared-reference',
    'Transformation-context use of shared Portfolio governance for investments, programmes, projects and change initiatives managed together for strategic outcomes.',
    'No parallel transformation-portfolio master; the shared Portfolio identity carries transformation purpose/classification and effective initiative/programme/project membership.',
    [
      'Portfolio reference',
      'transformation purpose',
      'sponsor/owner',
      'investment criteria',
      'outcomes/benefits',
      'membership',
      'effective dates'
    ],
    ['Proposed', 'Active', 'On Hold', 'Closed'],
    [
      'Transformation Portfolio reuses shared Portfolio.',
      'Portfolio membership is effective and never changes constituent initiative/project identity.',
      'Portfolio is not a dashboard grouping or finance ledger dimension.'
    ]
  ),

  tpi(
    'TRANS-INITIATIVE',
    ['BOF-26-002', 'BOF-26-023'],
    'Transformation Initiative',
    'initiative',
    'Governed organisational/process transformation or improvement intervention with outcomes, sponsor, affected scope, benefits, impacts and adoption responsibilities.',
    'Stable initiative identity independent of Strategic Initiative and the Programme/Project/work used to deliver it; Improvement Initiative is a type/scale of the same pattern.',
    [
      'initiative reference/type',
      'purpose/outcomes',
      'sponsor/owner',
      'affected scope',
      'benefits',
      'impacts',
      'readiness/adoption criteria',
      'delivery links',
      'status'
    ],
    [
      'Proposed',
      'Assessment',
      'Prioritised',
      'Approved',
      'Mobilising',
      'Active',
      'Transitioning',
      'Completed',
      'Stopped',
      'Closed'
    ],
    [
      'Transformation Initiative is not Strategic Initiative, Programme or Project.',
      'It may implement/support a Strategic Initiative and be delivered through Programme/Project.',
      'Improvement Initiative uses the same initiative architecture with improvement classification.'
    ]
  ),

  tpi(
    'TRANS-CHANGE-IMPACT-ASSESSMENT',
    ['BOF-26-003'],
    'Change Impact Assessment',
    'event-evidence',
    'Dated attributable assessment of impacts from a proposed change/transformation across people, roles, processes, organisation, technology, controls and locations.',
    'Each assessment occurrence pins exact initiative/change scope, current/target state, methodology, affected cohorts/objects, findings and assessment date.',
    [
      'initiative/change',
      'current/target state',
      'impact dimensions',
      'affected cohorts/objects',
      'severity/materiality',
      'dependencies',
      'assessor',
      'assessed at',
      'evidence'
    ],
    ['Draft', 'Review', 'Approved', 'Superseded/Invalidated'],
    [
      'Assessment is evidence, not the Transformation Initiative.',
      'Reassessment creates successor evidence.',
      'Findings may drive readiness, learning, communication and transition plans without becoming those plans.'
    ]
  ),

  tpi(
    'TRANS-STAKEHOLDER-COHORT',
    ['BOF-26-004'],
    'Stakeholder Cohort',
    'relationship',
    'Governed grouping/relationship of canonical Parties or organisational populations used for change impact, engagement, learning and adoption planning.',
    'Cohort identity/definition references canonical Parties, roles, organisation units or selection criteria and never creates duplicate people/organisation masters.',
    [
      'cohort name/type',
      'selection criteria',
      'Party/role/org-unit membership',
      'impact profile',
      'engagement needs',
      'effective dates',
      'owner'
    ],
    ['Proposed', 'Active', 'Superseded', 'Closed'],
    [
      'Stakeholder Cohort is not Party identity.',
      'Membership may be explicit or rule-derived and is historically reconstructable.',
      'Cohort membership does not grant permission or authority.'
    ]
  ),

  tpi(
    'TRANS-CHANGE-ACTION',
    ['BOF-26-005'],
    'Change Action',
    'shared-reference',
    'Transformation-context use of the shared Decision Action pattern for accountable change/readiness/adoption work.',
    'No change-specific action engine; the shared action retains source assessment/decision/initiative, owner, due date, status and closure evidence.',
    [
      'Decision Action reference',
      'source initiative/assessment/decision',
      'action',
      'owner',
      'priority',
      'due date',
      'status',
      'closure evidence'
    ],
    ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
    [
      'Change Action reuses shared Decision Action.',
      'Workflow Work Items can coordinate it but do not replace it.',
      'Completion does not rewrite source assessment or decision.'
    ]
  ),

  tpi(
    'TRANS-CHANGE-COMMUNICATION',
    ['BOF-26-006'],
    'Change Communication',
    'shared-reference',
    'Transformation-context use of shared Communication Item for planned/executed communications to affected stakeholder cohorts.',
    'No change-specific communication master; the shared activity references exact controlled content, audience, channel, timing and delivery evidence.',
    [
      'Communication Item reference',
      'initiative/context',
      'content/version',
      'stakeholder cohort/audience',
      'channel',
      'owner',
      'schedule',
      'delivery evidence'
    ],
    [
      'Planned',
      'Content Ready',
      'Approved',
      'Scheduled',
      'Published/Sent',
      'Completed',
      'Cancelled'
    ],
    [
      'Change Communication reuses Communication Item.',
      'Message content is Information Container content.',
      'Communication activity and measured adoption/readiness remain separate.'
    ]
  ),

  tpi(
    'TRANS-READINESS-PLAN',
    ['BOF-26-007'],
    'Readiness Plan',
    'plan',
    'Versioned plan coordinating readiness outcomes, cohorts, actions, communications, learning/support and acceptance criteria for a transformation or transition.',
    'Stable plan identity with controlled approved versions; readiness assessments and actual interventions remain separate evidence/work.',
    [
      'initiative/transition scope',
      'cohorts',
      'readiness outcomes',
      'actions',
      'communications',
      'learning/support',
      'criteria',
      'owners',
      'milestones'
    ],
    ['Draft', 'Review', 'Approved', 'Active', 'Updated', 'Completed', 'Superseded', 'Cancelled'],
    [
      'Readiness Plan is not Readiness Assessment.',
      'Approved versions remain comparison/evidence points.',
      'Actions/communications/learning reuse their authoritative patterns.'
    ]
  ),

  tpi(
    'TRANS-CHANGE-LEARNING-PLAN',
    ['BOF-26-008'],
    'Change Learning Plan',
    'plan',
    'Transformation-scoped learning rollout plan mapping affected cohorts/capability gaps to learning objectives, courses/sessions, timing and completion expectations.',
    'Stable plan identity/version for one transformation scope; it coordinates HCM learning objects but does not replace individual/team Learning Plans or actual Learning Records.',
    [
      'initiative/transition',
      'stakeholder cohorts',
      'capability gaps',
      'learning objectives',
      'Training Courses/Sessions',
      'schedule',
      'completion criteria',
      'owners'
    ],
    ['Draft', 'Review', 'Approved', 'Active', 'Completed', 'Superseded', 'Cancelled'],
    [
      'Change Learning Plan is not HCM Learning Plan.',
      'Training Courses/Sessions are reused from HCM.',
      'Actual participation/completion remains Learning Record evidence.'
    ]
  ),

  tpi(
    'TRANS-READINESS-ASSESSMENT',
    ['BOF-26-009'],
    'Readiness Assessment',
    'event-evidence',
    'Dated assessment of organisational/stakeholder readiness against defined criteria for an exact transformation/transition scope.',
    'Each assessment occurrence preserves cohort/scope, criteria, method, responses/evidence, results, gaps and assessor/date.',
    [
      'initiative/transition',
      'cohort/scope',
      'criteria',
      'method',
      'evidence/responses',
      'results',
      'gaps/risks',
      'assessor/date'
    ],
    ['Draft', 'Reviewed', 'Approved', 'Published', 'Superseded/Invalidated'],
    [
      'Readiness Assessment is evidence, not plan or adoption intervention.',
      'Repeated assessments preserve trend/history.',
      'Derived readiness dashboards remain projections.'
    ]
  ),

  tpi(
    'TRANS-ADOPTION-INTERVENTION',
    ['BOF-26-010'],
    'Adoption Intervention',
    'work',
    'Governed targeted intervention such as coaching, champion activity, reinforcement, support, nudges or facilitated engagement intended to improve adoption.',
    'Stable intervention identity/occurrence with target cohort, objective, method, timing, owner and attributable outcome evidence.',
    [
      'initiative',
      'target cohort',
      'objective',
      'intervention type',
      'owner/facilitator',
      'planned/actual dates',
      'outcome measures',
      'evidence'
    ],
    ['Planned', 'Approved', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    [
      'Intervention is not a Communication Item by default, though it may include communications.',
      'Outcome evidence remains separate from intervention plan.',
      'Participants reuse canonical Party identities.'
    ]
  ),

  tpi(
    'TRANS-ORGANISATION-TRANSITION',
    ['BOF-26-011'],
    'Organisation Transition',
    'transition',
    'Governed transition/cutover context moving from an approved current state to a target organisation/process operating state.',
    'Stable transition identity with exact current/target baselines, effective date/window, affected organisation units/positions/processes, decisions, actions and evidence.',
    [
      'initiative',
      'current state/version',
      'target state/version',
      'effective/cutover date',
      'affected org units/positions/processes',
      'transition actions',
      'authority/decisions',
      'evidence'
    ],
    [
      'Planned',
      'Readiness Review',
      'Approved',
      'Executing',
      'Effective',
      'Stabilising',
      'Completed',
      'Rolled Back/Stopped'
    ],
    [
      'Transition does not recreate Organisation Unit, Position or Person identities.',
      'Effective-dated source-domain assignments/relationships carry the actual structural change.',
      'Transition retains cutover/decision/evidence history.'
    ]
  ),

  tpi(
    'PROC-ARCHITECTURE',
    ['BOF-26-012'],
    'Process Architecture',
    'architecture',
    'Governed enterprise process framework organising process domains, hierarchy, relationships, ownership and architecture principles.',
    'Stable architecture identity with controlled versions/effectivity; process hierarchy membership never replaces Enterprise Process identity.',
    [
      'architecture/version',
      'scope',
      'process domains/hierarchy',
      'relationship rules',
      'owners',
      'classification framework',
      'effective dates'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Retired'],
    [
      'Process Architecture is not organisation chart, application architecture or workflow definition.',
      'Hierarchy changes preserve history.',
      'Processes may span many workspaces/organisation units.'
    ]
  ),

  tpi(
    'PROC-ENTERPRISE-PROCESS',
    ['BOF-26-013'],
    'Enterprise Process',
    'process',
    'Stable identity for an end-to-end business process/capability flow crossing organisation, role, system and workspace boundaries.',
    'One process identity survives redesign, new models/SOPs, ownership changes and automation changes; versions/models represent how it operates over time.',
    [
      'process code/name',
      'purpose/outcomes',
      'scope/start/end',
      'customers/stakeholders',
      'owner assignment',
      'architecture position',
      'criticality'
    ],
    ['Proposed', 'Active', 'Suspended', 'Retired'],
    [
      'Enterprise Process is not Workflow Definition or one Process Model version.',
      'Process identity is cross-workspace and not owned by one UI workspace.',
      'Automation/workflow may implement parts without replacing process identity.'
    ]
  ),

  tpi(
    'PROC-MODEL',
    ['BOF-26-014'],
    'Process Model',
    'controlled-definition',
    'Governed structured representation/definition of how an Enterprise Process operates, including activities, roles, events, decisions, controls and information interactions.',
    'Stable model identity subordinate to an Enterprise Process, with controlled Process Versions and optional controlled Information Container representations.',
    [
      'Enterprise Process',
      'model type/notation',
      'scope',
      'activities/roles/events',
      'controls/information links',
      'current version',
      'owner'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Retired'],
    [
      'Process Model is structured process definition, not a binary diagram/file.',
      'Visual/document representations may use Information Container.',
      'Workflow implementation is separate from process semantic model.'
    ]
  ),

  tpi(
    'PROC-VERSION',
    ['BOF-26-015'],
    'Process Version',
    'child',
    'Controlled effective version of a Process Model/Enterprise Process definition representing an approved operating design at a point in time.',
    'Version identity is subordinate to one Process Model/Enterprise Process and preserves predecessor/successor, approval and effectivity.',
    [
      'Process Model',
      'version identifier',
      'effective from/to',
      'approved structure/rules',
      'approval evidence',
      'predecessor/successor'
    ],
    ['Working', 'Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn'],
    [
      'Approved/effective Process Versions are immutable.',
      'Redesign creates successor version rather than overwriting history.',
      'SOP/compliance assessment pins exact applicable version.'
    ]
  ),

  tpi(
    'PROC-OWNER-ASSIGNMENT',
    ['BOF-26-016'],
    'Process Owner Assignment',
    'shared-reference',
    'Process-owner use of the shared Responsibility Assignment pattern over an Enterprise Process.',
    'No process-specific owner master; effective Responsibility Assignment links canonical Party to Enterprise Process with owner/accountability type.',
    [
      'Responsibility Assignment',
      'Party',
      'Enterprise Process',
      'responsibility type',
      'valid from/to',
      'source/basis'
    ],
    ['Proposed', 'Active', 'Superseded', 'Ended'],
    [
      'Process Owner Assignment reuses Responsibility Assignment.',
      'Ownership is not permission or Delegated Authority.',
      'Historical owner at any effective date remains reconstructable.'
    ]
  ),

  tpi(
    'PROC-MEASURE',
    ['BOF-26-017'],
    'Process Measure',
    'shared-reference',
    'Process-context use of enterprise KPI/metric-definition semantics for throughput, quality, cycle time, cost, reliability, compliance or outcome measures.',
    'No process-specific measurement engine; metric/KPI definition has stable identity/version and the Enterprise Process relationship supplies process scope.',
    [
      'KPI/metric definition',
      'Enterprise Process',
      'formula/unit',
      'frequency',
      'dimensions',
      'source data',
      'owner',
      'effective version'
    ],
    ['Draft', 'Validated', 'Published', 'Effective', 'Superseded', 'Retired'],
    [
      'Process Measure reuses enterprise KPI definition semantics.',
      'Targets and observations remain separate.',
      'A process metric need not become a strategic objective.'
    ]
  ),

  tpi(
    'PROC-ANALYSIS',
    ['BOF-26-018'],
    'Process Analysis',
    'event-evidence',
    'Dated analytical assessment of an exact Process Version and evidence set covering performance, variation, bottlenecks, controls, waste, risk and improvement potential.',
    'Each analysis occurrence pins process/version, period/data/evidence, method, findings and analyst/date.',
    [
      'Enterprise Process/Version',
      'analysis period',
      'method',
      'measures/data/evidence',
      'bottlenecks/variation',
      'risk/control findings',
      'waste/root causes',
      'analyst/date'
    ],
    ['Draft', 'Reviewed', 'Approved', 'Published', 'Superseded/Invalidated'],
    [
      'Process Analysis is evidence, not Enterprise Process state.',
      'Analysis inputs/results remain reproducible.',
      'Improvement Opportunities are separately governed cases.'
    ]
  ),

  tpi(
    'PROC-IMPROVEMENT-OPPORTUNITY',
    ['BOF-26-019'],
    'Improvement Opportunity',
    'case',
    'Governed case identifying a potential improvement to process/operating performance, control, quality, cost, safety, customer outcome or efficiency.',
    'Stable opportunity identity linked to exact process/version/analysis/evidence, expected benefit, scope, owner and prioritisation.',
    [
      'process/version',
      'source analysis/evidence',
      'problem/opportunity statement',
      'expected benefit',
      'scope',
      'owner',
      'priority',
      'status'
    ],
    [
      'Identified',
      'Triage',
      'Assessment',
      'Prioritised',
      'Approved for Redesign',
      'Rejected',
      'Converted',
      'Closed'
    ],
    [
      'Opportunity is not Transformation Initiative until explicitly converted/approved.',
      'Evidence remains linked rather than copied.',
      'Benefits/risks remain explicit and testable.'
    ]
  ),

  tpi(
    'PROC-REDESIGN-PROPOSAL',
    ['BOF-26-020'],
    'Process Redesign Proposal',
    'proposal',
    'Governed proposal for a future-state process design with exact current-version basis, target design, impacts, controls, expected benefits and decision evidence.',
    'Stable proposal identity/version independent of the resulting approved Process Version or Transformation Initiative.',
    [
      'current Process Version',
      'target design/model',
      'rationale',
      'impact assessment',
      'benefits/measures',
      'risks/controls',
      'implementation approach',
      'decision'
    ],
    ['Draft', 'Review', 'Submitted', 'Approved', 'Rejected', 'Returned', 'Superseded'],
    [
      'Proposal is not the future Process Version until approved and created.',
      'Material redesign approval uses shared Decision evidence.',
      'Implementation may create/link a Transformation Initiative/Project.'
    ]
  ),

  tpi(
    'PROC-SOP',
    ['BOF-26-021'],
    'Standard Operating Procedure',
    'shared-reference',
    'Process-context use of controlled Information Container for an approved SOP/instruction applying to exact Process Version and scope.',
    'No separate SOP document master; Information Container identity/revision/issue semantics govern the procedure representation.',
    [
      'Information Container',
      'Enterprise Process/Version',
      'scope/applicability',
      'owner',
      'effective revision/date',
      'approval',
      'training/acknowledgement requirements'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn', 'Archived'],
    [
      'SOP reuses Information Container.',
      'SOP document is not Enterprise Process identity.',
      'Historic execution/compliance retains exact applicable revision.'
    ]
  ),

  tpi(
    'PROC-COMPLIANCE-ASSESSMENT',
    ['BOF-26-022'],
    'Process Compliance Assessment',
    'shared-reference',
    'Process-context use of shared Compliance Assessment evidence against exact Process Version, applicable requirements/controls and retained evidence.',
    'No process-specific compliance engine; shared assessment occurrence pins process/version, requirement/evidence set, method and result.',
    [
      'Compliance Assessment',
      'Enterprise Process/Version',
      'requirements/controls',
      'method',
      'evidence',
      'result/exceptions',
      'assessor/date'
    ],
    ['Draft', 'Reviewed', 'Approved', 'Published', 'Superseded/Invalidated'],
    [
      'Process Compliance Assessment reuses shared Compliance Assessment.',
      'Assessment is evidence, not Process state.',
      'Findings/remediation retain their own identities.'
    ]
  )
];

export const transformationProcessImprovementRelationships: TransformationProcessImprovementRelationship[] =
  [
    {
      id: 'TPI-R01',
      from: 'TRANS-PORTFOLIO',
      predicate: 'reuses',
      to: 'DEL-PORTFOLIO',
      cardinality: 'many-to-one-pattern',
      governance: 'Transformation portfolio uses shared Portfolio identity.'
    },
    {
      id: 'TPI-R02',
      from: 'TRANS-PORTFOLIO',
      predicate: 'governs',
      to: 'TRANS-INITIATIVE',
      cardinality: 'one-to-many',
      governance: 'Membership is effective; initiative identity remains independent.'
    },
    {
      id: 'TPI-R03',
      from: 'TRANS-INITIATIVE',
      predicate: 'may implement',
      to: 'SGP-STRATEGIC-INITIATIVE',
      cardinality: 'many-to-zero-or-many',
      governance: 'Transformation and strategic initiative identities remain separate.'
    },
    {
      id: 'TPI-R04',
      from: 'TRANS-INITIATIVE',
      predicate: 'may be delivered by',
      to: 'DEL-PROGRAMME',
      cardinality: 'many-to-zero-or-many',
      governance: 'Programme is delivery/governance context.'
    },
    {
      id: 'TPI-R05',
      from: 'TRANS-INITIATIVE',
      predicate: 'may be delivered by',
      to: 'CBO-PROJECT',
      cardinality: 'many-to-zero-or-many',
      governance: 'Project identity remains delivery truth.'
    },
    {
      id: 'TPI-R06',
      from: 'TRANS-CHANGE-IMPACT-ASSESSMENT',
      predicate: 'assesses',
      to: 'TRANS-INITIATIVE',
      cardinality: 'many-to-one',
      governance: 'Assessment pins exact initiative/scope/version.'
    },
    {
      id: 'TPI-R07',
      from: 'TRANS-CHANGE-IMPACT-ASSESSMENT',
      predicate: 'identifies',
      to: 'TRANS-STAKEHOLDER-COHORT',
      cardinality: 'many-to-many',
      governance: 'Affected cohorts remain independently governed groupings.'
    },
    {
      id: 'TPI-R08',
      from: 'TRANS-READINESS-PLAN',
      predicate: 'supports',
      to: 'TRANS-INITIATIVE',
      cardinality: 'many-to-one',
      governance: 'Plan version is separate from initiative state.'
    },
    {
      id: 'TPI-R09',
      from: 'TRANS-CHANGE-LEARNING-PLAN',
      predicate: 'supports',
      to: 'TRANS-INITIATIVE',
      cardinality: 'many-to-one',
      governance: 'Learning rollout remains separate plan.'
    },
    {
      id: 'TPI-R10',
      from: 'TRANS-CHANGE-LEARNING-PLAN',
      predicate: 'may schedule',
      to: 'HCM-TRAINING-SESSION',
      cardinality: 'many-to-many',
      governance: 'Training Sessions retain HCM identity.'
    },
    {
      id: 'TPI-R11',
      from: 'TRANS-CHANGE-LEARNING-PLAN',
      predicate: 'may align with',
      to: 'HCM-LEARNING-PLAN',
      cardinality: 'many-to-many',
      governance: 'Individual/team development plans remain HCM truth.'
    },
    {
      id: 'TPI-R12',
      from: 'TRANS-READINESS-ASSESSMENT',
      predicate: 'assesses',
      to: 'TRANS-STAKEHOLDER-COHORT',
      cardinality: 'many-to-many',
      governance: 'Assessment preserves exact cohort/scope.'
    },
    {
      id: 'TPI-R13',
      from: 'TRANS-ADOPTION-INTERVENTION',
      predicate: 'targets',
      to: 'TRANS-STAKEHOLDER-COHORT',
      cardinality: 'many-to-many',
      governance: 'Participants reuse canonical Party identities.'
    },
    {
      id: 'TPI-R14',
      from: 'TRANS-CHANGE-ACTION',
      predicate: 'reuses',
      to: 'WORK-FOLLOW-UP-ACTION',
      cardinality: 'many-to-one-pattern',
      governance: 'Change action uses shared enterprise action.'
    },
    {
      id: 'TPI-R15',
      from: 'TRANS-CHANGE-COMMUNICATION',
      predicate: 'reuses',
      to: 'KRC-COMMUNICATION-ITEM',
      cardinality: 'many-to-one-pattern',
      governance: 'Change communication uses shared communication activity.'
    },
    {
      id: 'TPI-R16',
      from: 'TRANS-ORGANISATION-TRANSITION',
      predicate: 'executes',
      to: 'TRANS-INITIATIVE',
      cardinality: 'many-to-one',
      governance: 'Transition and initiative remain distinct.'
    },
    {
      id: 'TPI-R17',
      from: 'PROC-ARCHITECTURE',
      predicate: 'organises',
      to: 'PROC-ENTERPRISE-PROCESS',
      cardinality: 'one-to-many',
      governance: 'Architecture membership/hierarchy does not replace process identity.'
    },
    {
      id: 'TPI-R18',
      from: 'PROC-MODEL',
      predicate: 'models',
      to: 'PROC-ENTERPRISE-PROCESS',
      cardinality: 'many-to-one',
      governance: 'One process may have multiple model purposes/representations.'
    },
    {
      id: 'TPI-R19',
      from: 'PROC-MODEL',
      predicate: 'has version',
      to: 'PROC-VERSION',
      cardinality: 'one-to-many',
      governance: 'Approved process versions are immutable/effective.'
    },
    {
      id: 'TPI-R20',
      from: 'PROC-OWNER-ASSIGNMENT',
      predicate: 'reuses',
      to: 'AUTH-RESPONSIBILITY-ASSIGNMENT',
      cardinality: 'many-to-one-pattern',
      governance: 'Process ownership uses shared accountability relationship.'
    },
    {
      id: 'TPI-R21',
      from: 'PROC-MEASURE',
      predicate: 'reuses',
      to: 'SGP-KPI-DEFINITION',
      cardinality: 'many-to-one-pattern',
      governance: 'Process measures share enterprise metric definition semantics.'
    },
    {
      id: 'TPI-R22',
      from: 'PROC-ANALYSIS',
      predicate: 'analyses',
      to: 'PROC-VERSION',
      cardinality: 'many-to-one',
      governance: 'Analysis pins exact effective process version.'
    },
    {
      id: 'TPI-R23',
      from: 'PROC-ANALYSIS',
      predicate: 'may identify',
      to: 'PROC-IMPROVEMENT-OPPORTUNITY',
      cardinality: 'one-to-many',
      governance: 'Opportunity lifecycle is separate from analysis evidence.'
    },
    {
      id: 'TPI-R24',
      from: 'PROC-REDESIGN-PROPOSAL',
      predicate: 'responds to',
      to: 'PROC-IMPROVEMENT-OPPORTUNITY',
      cardinality: 'many-to-one-or-many',
      governance: 'Proposal retains exact opportunity/evidence basis.'
    },
    {
      id: 'TPI-R25',
      from: 'PROC-REDESIGN-PROPOSAL',
      predicate: 'may be approved by',
      to: 'WORK-DECISION',
      cardinality: 'many-to-one-or-many',
      governance: 'Material redesign decisions use shared immutable Decision evidence.'
    },
    {
      id: 'TPI-R26',
      from: 'PROC-SOP',
      predicate: 'reuses',
      to: 'CBO-INFORMATION-CONTAINER',
      cardinality: 'many-to-one-pattern',
      governance: 'SOP uses controlled information identity/revision.'
    },
    {
      id: 'TPI-R27',
      from: 'PROC-SOP',
      predicate: 'applies to',
      to: 'PROC-VERSION',
      cardinality: 'many-to-many',
      governance: 'SOP applicability pins exact process version.'
    },
    {
      id: 'TPI-R28',
      from: 'PROC-COMPLIANCE-ASSESSMENT',
      predicate: 'reuses',
      to: 'COMP-ASSESSMENT',
      cardinality: 'many-to-one-pattern',
      governance: 'Process compliance uses shared compliance evidence.'
    },
    {
      id: 'TPI-R29',
      from: 'PROC-COMPLIANCE-ASSESSMENT',
      predicate: 'assesses',
      to: 'PROC-VERSION',
      cardinality: 'many-to-one',
      governance: 'Assessment pins exact process version.'
    },
    {
      id: 'TPI-R30',
      from: 'PROC-IMPROVEMENT-OPPORTUNITY',
      predicate: 'may convert to',
      to: 'TRANS-INITIATIVE',
      cardinality: 'many-to-zero-or-one',
      governance: 'Approval/conversion creates explicit link rather than mutating identity.'
    }
  ];

export const transformationProcessImprovementRules = [
  'Transformation Portfolio reuses shared Portfolio; Transformation Initiative remains distinct from Strategic Initiative, Programme and Project.',
  'Improvement Initiative uses the Transformation Initiative pattern rather than creating a second initiative master.',
  'Change Impact Assessment and Readiness Assessment are attributable evidence, not mutable status fields.',
  'Stakeholder Cohort groups canonical Parties/populations and never creates duplicate Person or Organisation identity.',
  'Change Action reuses shared Decision Action and Change Communication reuses shared Communication Item.',
  'Change Learning Plan coordinates transformation learning while HCM owns Training Course, Training Session, Learning Plan and Learning Record truth.',
  'Organisation Transition coordinates cutover but actual Organisation Unit, Position and Worker assignments change through their authoritative effective-dated models.',
  'Enterprise Process identity is stable and distinct from Process Model, Process Version, SOP and workflow/automation implementation.',
  'Approved Process Versions are immutable; redesign creates successor versions with explicit decision/effectivity.',
  'Process Owner Assignment reuses Responsibility Assignment and never grants permission or delegated authority by itself.',
  'Process Measure reuses enterprise KPI/metric-definition semantics; target, observation and dashboard remain separate layers.',
  'Process Analysis is evidence; Improvement Opportunity is a case; Process Redesign Proposal is a proposal; Transformation Initiative is execution/change governance.',
  'Standard Operating Procedure reuses Information Container and Process Compliance Assessment reuses shared Compliance Assessment.',
  'Cross-workspace processes remain enterprise identities; the F29 workspace governs process architecture/improvement but does not own duplicate transaction truth.'
] as const;

export function validateTransformationProcessImprovementModel() {
  const ids = new Set(transformationProcessImprovementModel.map((x) => x.modelId));
  const relIds = new Set(transformationProcessImprovementRelationships.map((x) => x.id));
  const external = new Set([
    'DEL-PORTFOLIO',
    'SGP-STRATEGIC-INITIATIVE',
    'DEL-PROGRAMME',
    'CBO-PROJECT',
    'HCM-TRAINING-SESSION',
    'HCM-LEARNING-PLAN',
    'WORK-FOLLOW-UP-ACTION',
    'KRC-COMMUNICATION-ITEM',
    'AUTH-RESPONSIBILITY-ASSIGNMENT',
    'SGP-KPI-DEFINITION',
    'WORK-DECISION',
    'CBO-INFORMATION-CONTAINER',
    'COMP-ASSESSMENT'
  ]);
  if (
    ids.size !== transformationProcessImprovementModel.length ||
    relIds.size !== transformationProcessImprovementRelationships.length
  )
    return false;
  const candidates = new Set(transformationProcessImprovementModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 23; i += 1) {
    const key = 'BOF-26-' + String(i).padStart(3, '0');
    if (!candidates.has(key)) return false;
  }
  if (
    transformationProcessImprovementModel.some(
      (x) => !x.definition || !x.identityRule || !x.governance.length
    )
  )
    return false;
  return transformationProcessImprovementRelationships.every(
    (x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to))
  );
}
