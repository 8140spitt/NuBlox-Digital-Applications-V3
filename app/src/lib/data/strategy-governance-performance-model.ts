export type StrategyGovernancePerformanceKind =
  | 'framework'
  | 'objective'
  | 'classification'
  | 'initiative'
  | 'plan'
  | 'scenario'
  | 'assumption'
  | 'metric-definition'
  | 'target'
  | 'event-evidence'
  | 'projection'
  | 'governance-context'
  | 'governance-event'
  | 'child'
  | 'shared-reference'
  | 'controlled-framework';

export type StrategyGovernancePerformanceDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: StrategyGovernancePerformanceKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type StrategyGovernancePerformanceRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const sgp = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: StrategyGovernancePerformanceKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): StrategyGovernancePerformanceDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance
});

export const strategyGovernancePerformanceModel: StrategyGovernancePerformanceDefinition[] = [
  sgp('SGP-STRATEGY-FRAMEWORK', ['BOF-02-001'], 'Strategy Framework', 'framework',
    'Governed enterprise strategy architecture defining scope, horizon, principles, strategic themes/objectives, ownership and review cadence.',
    'Stable framework identity with approved versions/effectivity; strategy documents are representations and do not replace the structured framework.',
    ['framework/version','scope','planning horizon','principles','owner/sponsor','themes/objectives','review cadence','effective dates'],
    ['Draft','Review','Approved','Effective','Superseded','Retired'],
    ['Strategy Framework is not merely a document.', 'Approved versions remain reconstructable.', 'Objectives, themes, initiatives, plans and performance evidence retain separate identities.']),

  sgp('SGP-STRATEGIC-OBJECTIVE', ['BOF-02-002'], 'Strategic Objective', 'objective',
    'Governed desired enterprise outcome with defined scope, horizon, accountable owner and explicit measures/targets.',
    'Stable objective identity through review cycles; wording, ownership and target changes are governed/versioned rather than recreating performance history.',
    ['objective reference','statement','scope','horizon','owner','success criteria','KPI links','target links','priority'],
    ['Proposed','Approved','Active','Achieved','Not Achieved','Superseded','Retired'],
    ['Objective is not KPI Definition, Target or Performance Observation.', 'Objective may be supported by many initiatives.', 'Achievement is evidenced by governed performance/review records rather than a manually asserted status alone.']),

  sgp('SGP-STRATEGIC-THEME', ['BOF-02-003'], 'Strategic Theme', 'classification',
    'Governed strategic grouping/prioritisation context used to organise related objectives, initiatives and narrative direction.',
    'Stable theme identity within a Strategy Framework/version; membership links are explicit and can change under governed review.',
    ['theme reference','name','description','priority','framework/version','owner/sponsor','effective dates'],
    ['Proposed','Approved','Active','Superseded','Retired'],
    ['Theme is not an Organisation Unit or reporting-only tag.', 'Theme does not replace Objective or Initiative identity.', 'Membership changes preserve strategy-version context.']),

  sgp('SGP-STRATEGIC-INITIATIVE', ['BOF-02-004'], 'Strategic Initiative', 'initiative',
    'Governed strategic intervention or commitment intended to realise one or more Strategic Objectives.',
    'Stable initiative identity independent of delivery mechanisms; execution may later be linked to Programme, Project or Transformation Initiative.',
    ['initiative reference','purpose/outcomes','objectives supported','sponsor/owner','time horizon','investment envelope','success criteria','status'],
    ['Proposed','Prioritised','Approved','Mobilising','Active','Completed','Stopped','Superseded'],
    ['Strategic Initiative is not automatically a Project or Programme.', 'Delivery identities are explicitly linked when created.', 'Strategic outcome ownership survives delivery-vehicle changes.']),

  sgp('SGP-BUSINESS-PLAN', ['BOF-02-005'], 'Business Plan', 'plan',
    'Versioned enterprise/business-unit plan translating strategy into objectives, initiatives, resource/financial expectations and measurable outcomes for a defined period.',
    'Stable plan identity with approved immutable baselines/versions and explicit period/scope.',
    ['plan reference','scope/legal entity/org unit','period','objectives','initiatives','resource assumptions','financial expectations','KPI/targets','owner'],
    ['Draft','Review','Approved','Current','Reforecast/Revised','Superseded','Closed'],
    ['Business Plan is not Budget or Forecast truth although it references them.', 'Approved plan versions remain immutable comparison points.', 'Changes link to exact assumptions/decisions.']),

  sgp('SGP-SCENARIO', ['BOF-02-006'], 'Scenario', 'scenario',
    'Governed coherent possible future/planning case used to test strategy, plans, investment choices or resilience.',
    'Stable scenario identity/version with explicit horizon, drivers and linked assumptions; it is not asserted forecast truth.',
    ['scenario reference','name','horizon','scope','drivers','assumptions','narrative','owner','version/effectivity'],
    ['Draft','Reviewed','Approved','Active','Superseded','Retired'],
    ['Scenario is planning context, not Forecast Snapshot.', 'Scenarios may share assumptions.', 'Scenario changes never rewrite decisions already made against earlier versions.']),

  sgp('SGP-ASSUMPTION', ['BOF-02-007'], 'Assumption', 'assumption',
    'Explicit governed proposition accepted for planning/analysis despite uncertainty, with basis, confidence and validity context.',
    'Stable assumption identity/version reusable across scenarios, plans and appraisals; challenge/replacement preserves predecessor history.',
    ['assumption reference','statement','basis/source','owner','confidence','valid from/to','scope','status'],
    ['Proposed','Accepted','Active','Challenged','Superseded','Invalidated'],
    ['Assumption is not a fact or observation.', 'Consumers pin exact assumption/version.', 'Invalidation does not rewrite prior analyses/decisions.']),

  sgp('SGP-KPI-DEFINITION', ['BOF-02-008'], 'KPI Definition', 'metric-definition',
    'Versioned semantic definition of a key performance indicator, including formula, unit, dimensions, source data, frequency, quality and ownership.',
    'Stable KPI identity with immutable published definition versions; observations/targets pin the exact applicable version.',
    ['KPI code/name','business definition','formula','unit','dimensions','frequency','source data','quality rules','owner','effective dates'],
    ['Draft','Validated','Published','Effective','Superseded','Retired'],
    ['KPI Definition is not an observed value.', 'Formula/unit changes create successor definitions or versions.', 'Source-system identifiers do not replace canonical KPI identity.']),

  sgp('SGP-PERFORMANCE-TARGET', ['BOF-02-009'], 'Performance Target', 'target',
    'Governed expected KPI/measure outcome for an exact scope and period, including target value, threshold or trajectory.',
    'Stable target identity bound to KPI/version, scope and period; revisions preserve prior approved targets.',
    ['KPI/version','scope/dimensions','period','target/threshold/trajectory','owner','baseline/reference','approval'],
    ['Proposed','Approved','Active','Achieved','Missed','Superseded','Cancelled'],
    ['Target is planned expectation, not actual performance.', 'Target changes never overwrite historical performance observations.', 'Carbon and other specialist targets may link to this enterprise performance layer without losing specialist semantics.']),

  sgp('SGP-PERFORMANCE-OBSERVATION', ['BOF-02-010'], 'Performance Observation', 'event-evidence',
    'Dated attributable measurement/observation of a KPI or performance measure for a defined subject, dimensions and reporting period.',
    'Immutable observation occurrence retaining KPI version, value/unit, scope, source, quality and observation/as-of time.',
    ['KPI/version','subject/scope','period/as-of','dimensions','value/unit','source/provenance','quality/status','recorded by/at'],
    ['Recorded','Validated','Corrected','Superseded/Invalidated'],
    ['Observation is source evidence, not Snapshot or Target.', 'Corrections create explicit successor/correction evidence.', 'Derived dashboards never become authoritative observations.']),

  sgp('SGP-PERFORMANCE-SNAPSHOT', ['BOF-02-011'], 'Performance Snapshot', 'projection',
    'Point-in-time or period-end performance position combining exact KPI definitions, observations, targets and status calculations.',
    'Rebuildable projection with optional immutable published snapshot pinning all source versions and calculation rules.',
    ['scope/period','KPI versions','observation set','targets','calculation/status rules','results','quality/completeness','published at'],
    ['Calculated','Reviewed','Published','Superseded'],
    ['Snapshot is not source observation truth.', 'Published snapshots are reproducible from pinned inputs.', 'Subsequent observations/corrections do not silently rewrite issued snapshots.']),

  sgp('SGP-STRATEGIC-REVIEW', ['BOF-02-012'], 'Strategic Review', 'event-evidence',
    'Governed review occurrence evaluating strategy, objectives, assumptions, initiatives and performance to determine whether change or intervention is required.',
    'Each review occurrence pins exact strategy/plan/snapshot versions, participants, criteria, findings and resulting Decision/Action references.',
    ['review scope/date','framework/plan versions','performance snapshots','assumptions/scenarios','participants','findings','recommendations','decision/action refs'],
    ['Planned','In Review','Completed','Published','Superseded/Corrected'],
    ['Review is not Decision.', 'Review findings remain evidence and trigger explicit decisions/actions.', 'Prior reviews remain immutable historic governance evidence.']),

  sgp('SGP-GOVERNANCE-BODY', ['BOF-02-013'], 'Governance Body', 'governance-context',
    'Stable governance context such as a board, committee or steering body with mandate, jurisdiction/scope, membership, quorum and decision authority.',
    'Stable body identity independent of changing membership and meetings; membership/roles are effective-dated relationships.',
    ['body reference/name','body type','mandate/terms of reference','scope','chair/secretariat','membership rules','quorum','authority framework','effective dates'],
    ['Proposed','Constituted','Active','Suspended','Dissolved'],
    ['Governance Body is not Organisation Unit or Team.', 'Membership does not itself grant every decision authority.', 'Actual authority is evaluated through Authority Framework, role and Delegated Authority.']),

  sgp('SGP-GOVERNANCE-MEETING', ['BOF-02-014'], 'Governance Meeting', 'governance-event',
    'Governed meeting occurrence convened by or for a Governance Body with attendees, quorum, agenda, papers, decisions and minutes/evidence.',
    'Unique occurrence identity tied to body/context and scheduled/actual time; rescheduled/reconvened meetings preserve traceable relationships.',
    ['Governance Body','meeting type','scheduled/actual time','location/channel','attendees','quorum','agenda','papers','minutes/governance record'],
    ['Scheduled','Convened','Adjourned','Completed','Cancelled'],
    ['Meeting is not Governance Body.', 'Presence is not authority.', 'Decisions and actions remain separately governed immutable/business-work records.']),

  sgp('SGP-AGENDA-ITEM', ['BOF-02-015'], 'Agenda Item', 'child',
    'Governed item within a Governance Meeting defining subject, purpose, papers, presenter/owner and required review/decision.',
    'Agenda item identity is subordinate to one meeting/agenda version and references exact subject/papers.',
    ['meeting','item number','subject','purpose','papers/versions','presenter/owner','required outcome','time allocation'],
    ['Proposed','Confirmed','Considered','Deferred','Withdrawn','Closed'],
    ['Agenda Item is not Decision or Action.', 'Exact papers/versions are retained.', 'Deferral/reconsideration remains traceable.']),

  sgp('SGP-DECISION', ['BOF-02-016'], 'Decision', 'shared-reference',
    'Strategy/governance use of the enterprise shared immutable Decision evidence pattern.',
    'No governance-specific Decision master; the shared Decision binds exact subject/version, outcome, decider/body, authority basis and time.',
    ['shared Decision reference','subject/version','outcome','reason','decider/body','authority basis','decided at'],
    ['Recorded','Superseded','Corrected'],
    ['Governance Decision reuses shared Decision.', 'Meeting minutes do not substitute for structured Decision evidence.', 'Decision does not itself become the changed domain object.']),

  sgp('SGP-DECISION-ACTION', ['BOF-02-017'], 'Decision Action', 'shared-reference',
    'Strategy/governance use of the shared Decision Action/domain-action pattern for follow-up work created by governance outcomes.',
    'No governance-specific Action master; stable action identity retains source decision, owner, due date, status and closure evidence.',
    ['source Decision','action','owner','due date','status','closure evidence','verification where applicable'],
    ['Open','In Progress','Blocked','Completed','Cancelled'],
    ['Action reuses shared Decision Action.', 'Workflow Work Item may coordinate it but never replaces business action truth.', 'Completion does not rewrite source Decision.']),

  sgp('SGP-POLICY', ['BOF-02-018'], 'Policy', 'shared-reference',
    'Governance use of canonical Information Container for an approved policy with structured applicability/effectivity metadata.',
    'No separate policy-document master; Information Container owns stable identity, revision, approval, issue, representation and supersession.',
    ['Information Container','policy type','owner','applicability','jurisdiction/scope','effective revision/date','review date','approval'],
    ['Draft','Review','Approved','Effective','Superseded','Withdrawn','Archived'],
    ['Policy content reuses Information Container.', 'Machine-enforced configuration may implement policy but is not the policy record itself.', 'Historic effective policy revisions remain reconstructable.']),

  sgp('SGP-AUTHORITY-FRAMEWORK', ['BOF-02-019'], 'Authority Framework', 'controlled-framework',
    'Versioned governance framework defining decision/approval authority classes, monetary/non-monetary limits, reserved matters, delegation rules and segregation-of-duties constraints.',
    'Stable framework identity with immutable approved versions/effectivity; specific Delegated Authority grants reference the applicable framework/rule basis.',
    ['framework/version','authority classes','decision/action types','scope rules','limits/currency','reserved matters','delegation/subdelegation rules','SoD rules','effective dates'],
    ['Draft','Review','Approved','Effective','Superseded','Retired'],
    ['Authority Framework is not Delegated Authority.', 'Permission, role, assignment and delegated authority remain separate.', 'Historic decisions retain exact authority framework/grant basis.']),

  sgp('SGP-GOVERNANCE-RECORD', ['BOF-02-020'], 'Governance Record', 'shared-reference',
    'Governance-specific controlled Information Container profile for minutes, resolutions, packs, memoranda or comparable governance records.',
    'No separate governance-document identity; Information Container revision/issue semantics are reused and Record Declaration can overlay formal-record status.',
    ['Information Container','record type','meeting/body/context','approved revision','sign-off/issue','classification','record declaration/retention'],
    ['Draft','Review','Approved','Issued','Superseded','Archived'],
    ['Governance Record reuses Information Container.', 'Structured Meeting/Decision/Action truth remains separate from minutes/document narrative.', 'Records-management classification overlays the same authoritative information identity.'])
];

export const strategyGovernancePerformanceRelationships: StrategyGovernancePerformanceRelationship[] = [
  { id:'SGP-R01', from:'SGP-STRATEGY-FRAMEWORK', predicate:'contains', to:'SGP-STRATEGIC-THEME', cardinality:'one-to-many', governance:'Theme identity/version remains explicit.' },
  { id:'SGP-R02', from:'SGP-STRATEGY-FRAMEWORK', predicate:'defines', to:'SGP-STRATEGIC-OBJECTIVE', cardinality:'one-to-many', governance:'Objectives retain independent ownership and lifecycle.' },
  { id:'SGP-R03', from:'SGP-STRATEGIC-THEME', predicate:'groups', to:'SGP-STRATEGIC-OBJECTIVE', cardinality:'many-to-many', governance:'Grouping never replaces objective identity.' },
  { id:'SGP-R04', from:'SGP-STRATEGIC-INITIATIVE', predicate:'supports', to:'SGP-STRATEGIC-OBJECTIVE', cardinality:'many-to-many', governance:'Strategic benefit/outcome linkage remains explicit.' },
  { id:'SGP-R05', from:'SGP-BUSINESS-PLAN', predicate:'operationalises', to:'SGP-STRATEGIC-OBJECTIVE', cardinality:'many-to-many', governance:'Plan pins objective/version context.' },
  { id:'SGP-R06', from:'SGP-BUSINESS-PLAN', predicate:'includes', to:'SGP-STRATEGIC-INITIATIVE', cardinality:'many-to-many', governance:'Initiative identity survives plan revisions.' },
  { id:'SGP-R07', from:'SGP-SCENARIO', predicate:'uses', to:'SGP-ASSUMPTION', cardinality:'many-to-many', governance:'Exact assumption/version is retained.' },
  { id:'SGP-R08', from:'SGP-BUSINESS-PLAN', predicate:'uses', to:'SGP-ASSUMPTION', cardinality:'many-to-many', governance:'Planning basis remains challengeable and reproducible.' },
  { id:'SGP-R09', from:'SGP-KPI-DEFINITION', predicate:'measures', to:'SGP-STRATEGIC-OBJECTIVE', cardinality:'many-to-many', governance:'Metric meaning remains separate from objective.' },
  { id:'SGP-R10', from:'SGP-PERFORMANCE-TARGET', predicate:'targets', to:'SGP-KPI-DEFINITION', cardinality:'many-to-one', governance:'Target pins exact KPI/version.' },
  { id:'SGP-R11', from:'SGP-PERFORMANCE-OBSERVATION', predicate:'observes', to:'SGP-KPI-DEFINITION', cardinality:'many-to-one', governance:'Observation pins exact KPI/version and scope.' },
  { id:'SGP-R12', from:'SGP-PERFORMANCE-SNAPSHOT', predicate:'derived from', to:'SGP-PERFORMANCE-OBSERVATION', cardinality:'many-to-many', governance:'Snapshot remains reproducible from retained observations.' },
  { id:'SGP-R13', from:'SGP-PERFORMANCE-SNAPSHOT', predicate:'compares against', to:'SGP-PERFORMANCE-TARGET', cardinality:'many-to-many', governance:'Actual and target remain distinct.' },
  { id:'SGP-R14', from:'SGP-STRATEGIC-REVIEW', predicate:'reviews', to:'SGP-STRATEGY-FRAMEWORK', cardinality:'many-to-one-or-many', governance:'Exact strategy versions are pinned.' },
  { id:'SGP-R15', from:'SGP-STRATEGIC-REVIEW', predicate:'uses', to:'SGP-PERFORMANCE-SNAPSHOT', cardinality:'many-to-many', governance:'Review basis retains exact issued snapshot.' },
  { id:'SGP-R16', from:'SGP-GOVERNANCE-MEETING', predicate:'convened by', to:'SGP-GOVERNANCE-BODY', cardinality:'many-to-one', governance:'Body identity persists across meetings.' },
  { id:'SGP-R17', from:'SGP-GOVERNANCE-MEETING', predicate:'contains', to:'SGP-AGENDA-ITEM', cardinality:'one-to-many', governance:'Agenda item is subordinate to meeting.' },
  { id:'SGP-R18', from:'SGP-AGENDA-ITEM', predicate:'may result in', to:'WORK-DECISION', cardinality:'one-to-zero-or-many', governance:'Decision remains shared immutable evidence.' },
  { id:'SGP-R19', from:'WORK-DECISION', predicate:'may create', to:'WORK-FOLLOW-UP-ACTION', cardinality:'one-to-many', governance:'Action remains separately owned and evidenced.' },
  { id:'SGP-R20', from:'SGP-GOVERNANCE-BODY', predicate:'governed by', to:'SGP-AUTHORITY-FRAMEWORK', cardinality:'many-to-one-or-many', governance:'Applicable authority rules/effectivity are explicit.' },
  { id:'SGP-R21', from:'SGP-AUTHORITY-FRAMEWORK', predicate:'governs grants of', to:'AUTH-DELEGATED-AUTHORITY', cardinality:'one-to-many', governance:'Framework/rule and specific grant remain separate.' },
  { id:'SGP-R22', from:'SGP-POLICY', predicate:'reuses', to:'CBO-INFORMATION-CONTAINER', cardinality:'many-to-one-pattern', governance:'Policy identity/revision remains controlled information.' },
  { id:'SGP-R23', from:'SGP-GOVERNANCE-RECORD', predicate:'reuses', to:'CBO-INFORMATION-CONTAINER', cardinality:'many-to-one-pattern', governance:'Governance record is controlled information representation.' },
  { id:'SGP-R24', from:'SGP-STRATEGIC-INITIATIVE', predicate:'may be delivered by', to:'DEL-PROGRAMME', cardinality:'many-to-zero-or-many', governance:'Programme delivery does not replace strategic initiative.' },
  { id:'SGP-R25', from:'SGP-STRATEGIC-INITIATIVE', predicate:'may be delivered by', to:'CBO-PROJECT', cardinality:'many-to-zero-or-many', governance:'Project identity remains delivery truth.' },
  { id:'SGP-R26', from:'SGP-STRATEGIC-INITIATIVE', predicate:'may belong to', to:'DEL-PORTFOLIO', cardinality:'many-to-zero-or-many', governance:'Portfolio is governance/investment context, not initiative identity.' }
];

export const strategyGovernancePerformanceRules = [
  'Strategy Framework, Objective, Theme, Initiative and Business Plan are separate governed concepts; none is merely a document heading.',
  'Strategic Initiative is not automatically a Programme, Project or Transformation Initiative; delivery vehicles are explicitly linked.',
  'Scenario is planning context and Assumption is an independently governed proposition; neither is forecast/observed truth.',
  'KPI Definition, Performance Target, Performance Observation and Performance Snapshot are distinct definition, plan, evidence and projection layers.',
  'Published Performance Snapshots pin exact KPI definitions, observations, targets and calculation rules and remain reproducible.',
  'Strategic Review is an attributable review occurrence; resulting Decisions and Actions are separate shared records.',
  'Governance Body is not Organisation Unit/Team and membership is not decision authority by itself.',
  'Governance Meeting, Agenda Item, Decision and Decision Action retain separate identities/lifecycles.',
  'BOF-02 Decision/Action and BOF-06 Decision/Action converge on the enterprise shared Decision and Decision Action patterns.',
  'Policy and Governance Record reuse Information Container; structured governance truth must not be flattened into meeting minutes or documents.',
  'Authority Framework is governance/configuration while Delegated Authority is a specific grant; permission, role, assignment and authority remain separate.',
  'Material governance decisions retain exact subject/version, actor/body, authority basis and timestamp as immutable evidence.'
] as const;

export function validateStrategyGovernancePerformanceModel() {
  const ids = new Set(strategyGovernancePerformanceModel.map((x) => x.modelId));
  const relIds = new Set(strategyGovernancePerformanceRelationships.map((x) => x.id));
  const external = new Set([
    'WORK-DECISION','WORK-FOLLOW-UP-ACTION','AUTH-DELEGATED-AUTHORITY',
    'CBO-INFORMATION-CONTAINER','DEL-PROGRAMME','CBO-PROJECT','DEL-PORTFOLIO'
  ]);
  if (ids.size !== strategyGovernancePerformanceModel.length || relIds.size !== strategyGovernancePerformanceRelationships.length) return false;
  const candidates = new Set(strategyGovernancePerformanceModel.flatMap((x) => x.candidateKeys));
  for (let i=1;i<=20;i+=1) if (!candidates.has(`BOF-02-${String(i).padStart(3,'0')}`)) return false;
  if (strategyGovernancePerformanceModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return strategyGovernancePerformanceRelationships.every((x) => (ids.has(x.from)||external.has(x.from)) && (ids.has(x.to)||external.has(x.to)));
}
