export type QhseKind =
  | 'plan'
  | 'controlled-definition'
  | 'work'
  | 'case'
  | 'event-evidence'
  | 'relationship'
  | 'projection'
  | 'controlled-information'
  | 'reference';

export type QhseDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: QhseKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type QhseRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const q = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: QhseKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): QhseDefinition => ({ modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance });

export const qhseAssuranceModel: QhseDefinition[] = [
  q('QHSE-QUALITY-PLAN', ['BOF-13-001'], 'Quality Plan', 'plan',
    'Governed quality-management plan for defined organisational, project, contract, product or service scope.',
    'Stable plan identity with controlled approved versions/baselines; plan scope references canonical business objects.',
    ['scope', 'standards', 'objectives', 'responsibilities', 'controls', 'records/evidence requirements'], ['Draft','Review','Approved','Current','Superseded','Closed'],
    ['Quality Plan is not Project or Contract identity.', 'Approved versions remain reconstructable.']),
  q('QHSE-ITP', ['BOF-13-002'], 'Inspection and Test Plan', 'plan',
    'Controlled verification plan defining inspections, tests, acceptance criteria and verification points for exact scope.',
    'Stable ITP identity with controlled versions; execution records reference the exact effective version/point.',
    ['scope', 'activity/item', 'inspection/test requirements', 'acceptance criteria', 'verification points', 'responsibilities'], ['Draft','Review','Approved','Current','Superseded','Closed'],
    ['ITP is planning/definition, not execution evidence.', 'Revisions never rewrite completed inspection/test history.']),
  q('QHSE-INSPECTION', ['BOF-13-003','BOF-13-031'], 'Inspection', 'work',
    'Governed inspection occurrence against a defined subject and criteria, including statutory inspection where configured.',
    'Each occurrence has stable identity and retains exact criteria, inspector/competence, date, observations, outcome and evidence.',
    ['subject', 'inspection type', 'criteria/requirement', 'inspector', 'date/time', 'observations', 'result'], ['Planned','Ready','Performed','Verified','Closed','Invalidated'],
    ['Statutory inspection is a typed Inspection with jurisdiction/requirement context.', 'Inspection evidence is not current Asset/Project state.']),
  q('QHSE-TEST', ['BOF-13-004'], 'Test', 'work',
    'Governed test occurrence retaining method, equipment, measurements and acceptance result.',
    'Stable occurrence identity; retest creates a new occurrence/evidence link and never overwrites prior result.',
    ['subject', 'test method', 'equipment/calibration', 'measurements', 'criteria', 'tester/witness', 'result'], ['Planned','Ready','Performed','Verified','Accepted','Rejected','Invalidated'],
    ['Test and inspection may satisfy ITP points but remain distinct execution evidence.', 'Measurement provenance is retained.']),
  q('QHSE-VERIFICATION-POINT', ['BOF-13-005','BOF-13-006'], 'Verification Point', 'controlled-definition',
    'Controlled ITP point typed as hold, witness, review or surveillance, defining notification/release requirements.',
    'Identity is subordinate to an ITP/version and remains fixed for recorded execution.',
    ['point type', 'activity/sequence', 'notification requirement', 'responsible/witness role', 'release criteria'], ['Draft','Effective','Satisfied','Waived','Superseded'],
    ['Hold and Witness Point are types on one model.', 'Waiver/release requires attributable authority/evidence.']),
  q('QHSE-NCR', ['BOF-13-007'], 'Nonconformance Report', 'case',
    'Governed case for departure from an applicable requirement, including containment, disposition, responsibility and verification.',
    'Stable NCR identity linked to exact requirement, affected subject, evidence and disposition history.',
    ['requirement', 'subject', 'description/evidence', 'classification', 'containment', 'disposition', 'responsibility'], ['Open','Contained','Under Review','Disposition Approved','Remediation','Verification','Closed','Rejected'],
    ['NCR is not automatically a Defect.', 'Closure never deletes original evidence or disposition history.']),
  q('QHSE-DEFECT', ['BOF-13-008','BOF-13-009','BOF-17-016'], 'Defect', 'case',
    'Shared governed defect/nonconforming-condition case across delivery, quality, commissioning, aftercare and operations.',
    'Stable identity; Snag is a classification/type and context determines severity/source without a second master.',
    ['subject', 'type/classification', 'severity', 'source', 'responsibility', 'target', 'resolution/verification evidence'], ['Open','Assigned','In Remediation','Ready for Verification','Closed','Rejected'],
    ['Snag is a Defect type.', 'Commercial liability and operational work remain related but distinct.']),
  q('QHSE-CAPA-CASE', ['BOF-13-012'], 'CAPA Case', 'case',
    'Governed corrective/preventive action case coordinating causes, actions and effectiveness review.',
    'Stable case identity linked to source NCR/incident/audit/finding and retained decision/evidence history.',
    ['source', 'problem/cause', 'actions', 'owners', 'target dates', 'verification', 'effectiveness review'], ['Open','Analysis','Actioning','Verification','Effectiveness Review','Closed','Cancelled'],
    ['CAPA case does not replace source incident/NCR/audit finding.', 'Effectiveness review is explicit.']),
  q('QHSE-CAPA-ACTION', ['BOF-13-010','BOF-13-011'], 'CAPA Action', 'work',
    'Governed corrective or preventive action arising from assurance findings and investigations.',
    'Stable action identity with type, owner, due date, completion evidence and verification.',
    ['action type', 'source/case', 'owner', 'due date', 'completion evidence', 'verified by/at'], ['Proposed','Accepted','In Progress','Completed','Verified','Cancelled'],
    ['Corrective and preventive are action types.', 'Workflow Work Item may coordinate action but does not become domain truth.']),
  q('QHSE-AUDIT-ENGAGEMENT', ['BOF-13-013','BOF-21-012'], 'Audit Engagement', 'case',
    'Shared governed audit engagement applicable to QHSE, compliance, internal control and other assurance scopes.',
    'Stable engagement identity with scope, criteria, team, evidence, findings and report provenance.',
    ['scope', 'criteria/standard', 'audit team', 'period', 'evidence', 'findings', 'report'], ['Planned','Fieldwork','Reporting','Response','Closed','Cancelled'],
    ['QHSE Audit reuses the enterprise audit pattern.', 'Audit findings/actions remain separate governed records.']),
  q('QHSE-ASSURANCE-REVIEW', ['BOF-13-014'], 'Assurance Review', 'case',
    'Governed assurance/review occurrence that is not necessarily a formal audit.',
    'Stable review identity with scope, criteria, reviewers, conclusions and retained evidence.',
    ['scope', 'review type', 'criteria', 'reviewers', 'evidence', 'conclusions/actions'], ['Planned','In Review','Reported','Closed','Cancelled'],
    ['Assurance Review is distinct from Audit Engagement while sharing evidence principles.']),
  q('QHSE-CALIBRATION', ['BOF-13-015'], 'Calibration Record', 'event-evidence',
    'Immutable calibration/verification evidence for measuring/test equipment.',
    'Each occurrence binds equipment/Asset, method/standard, measurements, result and validity.',
    ['equipment/Asset', 'method/standard', 'performed by', 'date', 'result', 'uncertainty/tolerance', 'valid to'], ['Recorded','Verified','Accepted','Rejected/Invalidated'],
    ['Calibration status is derived from retained records/effectivity.', 'Failed calibration does not erase previous evidence.']),
  q('QHSE-QUALITY-CERTIFICATE', ['BOF-13-016'], 'Quality Certificate', 'event-evidence',
    'Immutable certificate/conformity evidence for defined subject and criteria.',
    'Certificate identity retains issuer, exact subject/scope, criteria, issue date and source evidence.',
    ['certificate number/type', 'issuer', 'subject', 'criteria', 'issue/expiry', 'supporting evidence'], ['Issued','Effective','Expired','Revoked','Superseded'],
    ['Certificate is evidence, not the subject identity.']),
  q('QHSE-HAZARD', ['BOF-13-017'], 'Hazard', 'reference',
    'Governed hazard definition/identified hazard applicable to work, location, equipment, material or activity.',
    'Stable hazard identity/context; assessments reference it and retain applicability/effectivity.',
    ['hazard type', 'description', 'source/context', 'potential consequences', 'applicability'], ['Identified','Active','Controlled','Retired'],
    ['Hazard is not Risk Assessment or Incident.', 'One hazard may be assessed many times in different contexts.']),
  q('QHSE-RISK-ASSESSMENT', ['BOF-13-018','BOF-21-003'], 'Risk Assessment', 'event-evidence',
    'Shared governed assessment of likelihood/consequence/exposure for a risk/hazard under an identified method and context.',
    'Each assessment is time/context/version-specific evidence; current risk position is derived from retained assessments.',
    ['subject/hazard/risk', 'method', 'context', 'initial rating', 'controls', 'residual rating', 'assessor', 'date'], ['Draft','Reviewed','Approved','Effective','Superseded','Expired'],
    ['Assessment is not the Hazard/Risk identity itself.', 'QHSE and enterprise risk reuse one assessment pattern.']),
  q('QHSE-METHOD-STATEMENT', ['BOF-13-019','BOF-13-020'], 'Method Statement / RAMS Controlled Information', 'controlled-information',
    'Typed controlled information describing safe/work method and, for RAMS, the coordinated risk-assessment/method-statement issue basis.',
    'Stable Information Container identity with controlled revisions/issues; files are representations only.',
    ['container/type', 'scope', 'method/sequence', 'controls', 'linked risk assessment', 'revision/status', 'issue/effectivity'], ['WIP','Review','Approved','Issued','Superseded','Archived'],
    ['Method Statement and RAMS use Information Container semantics.', 'RAMS references exact assessment/method basis and does not duplicate them.']),
  q('QHSE-PERMIT', ['BOF-13-021','BOF-12-017'], 'Permit to Work', 'case',
    'Temporary controlled authorisation for defined work under stated hazards, controls and validity.',
    'Stable permit identity from request/preparation through issue, suspension, handback and closure.',
    ['work/scope', 'location/asset', 'hazards/controls', 'issuer/receiver', 'valid from/to', 'isolations', 'handback/closure'], ['Draft','Ready','Issued','Active','Suspended','Handback','Closed','Cancelled'],
    ['Permit is an authorisation record, not generic workflow approval.', 'Field operations and QHSE reuse one permit identity.']),
  q('QHSE-ISOLATION', ['BOF-13-022','BOF-12-018'], 'Isolation', 'case',
    'Governed isolation/lockout record controlling hazardous energy/system state for work.',
    'Stable isolation identity with exact isolation points, applied/verified/restored evidence and effectivity.',
    ['system/asset/energy source', 'isolation points', 'applied by/at', 'verified by/at', 'permit/work link', 'restoration'], ['Planned','Applied','Verified','In Force','Released','Restored','Cancelled'],
    ['Isolation is shared between site operations and QHSE.', 'Isolation state must never be inferred only from a workflow task.']),
  q('QHSE-SAFETY-BRIEFING', ['BOF-13-023','BOF-13-024','BOF-13-025'], 'Safety Briefing Session', 'work',
    'Typed induction, briefing or toolbox-talk session delivering controlled safety/quality information to defined participants.',
    'Stable session identity with source information/version, presenter, audience and attendance/outcome evidence.',
    ['session type', 'subject/source revision', 'presenter', 'date/location', 'participants', 'acknowledgement/outcome'], ['Planned','Delivered','Closed','Cancelled'],
    ['Induction/Briefing/Toolbox Talk are session types.', 'Person attendance/outcome may create Learning Record evidence.']),
  q('QHSE-OBSERVATION', ['BOF-13-026'], 'Safety / Quality Observation', 'event-evidence',
    'Attributed observation of condition, behaviour or conformance captured at a point in time.',
    'Immutable occurrence identity with subject/location, observer, timestamp and evidence.',
    ['observation type', 'subject/location', 'observer', 'timestamp', 'description', 'evidence', 'immediate action'], ['Recorded','Reviewed','Closed','Invalidated'],
    ['Observation may trigger actions/cases without becoming the resulting case.']),
  q('QHSE-INCIDENT', ['BOF-13-027','BOF-13-028','BOF-13-036'], 'Incident', 'case',
    'Governed incident case for safety, environmental or quality occurrence; Near Miss and Pollution Event are classifications.',
    'Stable incident identity preserving event facts, classification, consequences, notifications, investigation and closure.',
    ['incident type', 'occurred at', 'location/subject', 'people/assets affected', 'actual/potential consequence', 'notifications', 'evidence'], ['Reported','Triaged','Open','Investigating','Actions','Review','Closed'],
    ['Near Miss is an Incident type with no realised harmful consequence.', 'Pollution Event is an environmental Incident type.', 'Incident case does not overwrite source observations/evidence.']),
  q('QHSE-INVESTIGATION', ['BOF-13-029'], 'Investigation', 'case',
    'Governed investigation linked to incident, NCR, audit finding or other assurance trigger.',
    'Stable investigation identity preserving evidence, analysis method, findings, causes and conclusions.',
    ['trigger/source', 'scope', 'investigator/team', 'evidence', 'analysis method', 'findings', 'conclusion'], ['Opened','Evidence Gathering','Analysis','Review','Completed','Reopened'],
    ['Investigation is separate from Incident lifecycle.', 'Conclusions/cause findings are retained and attributable.']),
  q('QHSE-CAUSE', ['BOF-13-030'], 'Cause Finding', 'event-evidence',
    'Governed cause/contributing-factor finding produced by an Investigation.',
    'Finding identity is subordinate to exact Investigation and retains analysis method/evidence basis.',
    ['cause type', 'statement', 'analysis method', 'evidence references', 'confidence/validation'], ['Proposed','Validated','Rejected/Superseded'],
    ['Cause is not a free-text field silently overwritten as investigation develops.']),
  q('QHSE-COMPLIANCE-REQUIREMENT', ['BOF-13-032','BOF-21-006'], 'Compliance Requirement', 'controlled-definition',
    'Shared requirement/obligation definition derived from regulation, standard, permit, contract or policy with applicability/effectivity.',
    'Stable requirement identity/version with source, jurisdiction, applicability and effective dates.',
    ['source/authority', 'requirement text/reference', 'jurisdiction', 'applicability', 'effective dates', 'evidence expectations'], ['Draft','Effective','Superseded','Retired'],
    ['QHSE and enterprise compliance reuse one requirement pattern.', 'Requirement is distinct from evidence of compliance.']),
  q('QHSE-COMPLIANCE-REGISTER', ['BOF-13-033'], 'Compliance Register', 'projection',
    'Governed read model of applicable requirements, ownership, evidence and assessment/status for a defined scope.',
    'Rebuildable projection from requirements, applicability, responsibilities, evidence and assessments.',
    ['scope', 'requirements', 'owners', 'evidence', 'assessment/status', 'next review'], ['Current'],
    ['Compliance Register is not authoritative requirement/evidence truth.', 'Changes in applicability/evidence recalculate the register.']),
  q('QHSE-ENV-ASPECT', ['BOF-13-034'], 'Environmental Aspect', 'reference',
    'Governed aspect of activities, products or services that can interact with the environment.',
    'Stable aspect identity/context with applicability/effectivity and links to impacts/controls.',
    ['activity/product/service', 'aspect type', 'context', 'normal/abnormal/emergency condition', 'applicability'], ['Identified','Active','Controlled','Retired'],
    ['Aspect is the interaction source; Impact is the resulting/potential environmental change.']),
  q('QHSE-ENV-IMPACT', ['BOF-13-035'], 'Environmental Impact', 'reference',
    'Governed actual or potential environmental consequence associated with one or more aspects.',
    'Stable impact definition/context; significance assessments retain method and date separately.',
    ['impact type', 'affected receptor/environment', 'positive/negative', 'scope', 'significance basis'], ['Identified','Active','Mitigated','Retired'],
    ['Impact does not replace Pollution Incident evidence or Sustainability measures.']),
  q('QHSE-WASTE-CONSIGNMENT', ['BOF-13-037'], 'Waste Consignment', 'event-evidence',
    'Immutable regulated waste transfer/consignment evidence recording movement from origin to carrier/destination.',
    'Stable consignment identity with exact waste classification, quantity, parties, locations, dates and documentation.',
    ['consignment/reference', 'waste stream/classification', 'quantity/UOM', 'producer', 'carrier', 'origin/destination', 'date/evidence'], ['Prepared','Transferred','Received','Completed','Cancelled/Invalidated'],
    ['Waste Consignment is movement/evidence, not Waste Stream master.', 'Regulatory documents remain controlled information/evidence.'])
];

export const qhseAssuranceRelationships: QhseRelationship[] = [
  { id:'QHSE-R01', from:'QHSE-ITP', predicate:'implements', to:'QHSE-QUALITY-PLAN', cardinality:'many-to-one', governance:'ITP remains a scoped verification plan under wider quality governance.' },
  { id:'QHSE-R02', from:'QHSE-ITP', predicate:'defines', to:'QHSE-VERIFICATION-POINT', cardinality:'one-to-many', governance:'Points are versioned with the ITP.' },
  { id:'QHSE-R03', from:'QHSE-INSPECTION', predicate:'satisfies', to:'QHSE-VERIFICATION-POINT', cardinality:'many-to-zero-or-many', governance:'Execution references exact point/version and evidence.' },
  { id:'QHSE-R04', from:'QHSE-TEST', predicate:'satisfies', to:'QHSE-VERIFICATION-POINT', cardinality:'many-to-zero-or-many', governance:'Test result never overwrites point definition.' },
  { id:'QHSE-R05', from:'QHSE-NCR', predicate:'may identify', to:'QHSE-DEFECT', cardinality:'one-to-zero-or-many', governance:'Nonconformance and physical/functional defect remain separable.' },
  { id:'QHSE-R06', from:'QHSE-CAPA-CASE', predicate:'may originate from', to:'QHSE-NCR', cardinality:'many-to-zero-or-one', governance:'CAPA preserves source provenance.' },
  { id:'QHSE-R07', from:'QHSE-CAPA-CASE', predicate:'contains', to:'QHSE-CAPA-ACTION', cardinality:'one-to-many', governance:'Corrective/preventive action type is explicit.' },
  { id:'QHSE-R08', from:'QHSE-AUDIT-ENGAGEMENT', predicate:'may create', to:'QHSE-CAPA-CASE', cardinality:'one-to-zero-or-many', governance:'Audit and remediation lifecycles remain separate.' },
  { id:'QHSE-R09', from:'QHSE-ASSURANCE-REVIEW', predicate:'may create', to:'QHSE-CAPA-CASE', cardinality:'one-to-zero-or-many', governance:'Review findings retain source.' },
  { id:'QHSE-R10', from:'QHSE-INSPECTION', predicate:'uses evidence of', to:'QHSE-CALIBRATION', cardinality:'many-to-zero-or-many', governance:'Applicable equipment calibration is retained with execution.' },
  { id:'QHSE-R11', from:'QHSE-RISK-ASSESSMENT', predicate:'assesses', to:'QHSE-HAZARD', cardinality:'many-to-many', governance:'Hazard identity survives assessment revisions.' },
  { id:'QHSE-R12', from:'QHSE-PERMIT', predicate:'requires/uses', to:'QHSE-RISK-ASSESSMENT', cardinality:'many-to-many', governance:'Permit binds exact effective assessment basis.' },
  { id:'QHSE-R13', from:'QHSE-PERMIT', predicate:'controls with', to:'QHSE-ISOLATION', cardinality:'many-to-many', governance:'Isolation state/evidence remains independently governed.' },
  { id:'QHSE-R14', from:'QHSE-SAFETY-BRIEFING', predicate:'communicates controls from', to:'QHSE-RISK-ASSESSMENT', cardinality:'many-to-many', governance:'Session references exact assessment/information basis.' },
  { id:'QHSE-R15', from:'QHSE-OBSERVATION', predicate:'may initiate', to:'QHSE-INCIDENT', cardinality:'many-to-zero-or-one', governance:'Observation remains immutable source evidence.' },
  { id:'QHSE-R16', from:'QHSE-INCIDENT', predicate:'may be investigated by', to:'QHSE-INVESTIGATION', cardinality:'one-to-zero-or-many', governance:'Incident and investigation have independent states.' },
  { id:'QHSE-R17', from:'QHSE-INVESTIGATION', predicate:'produces', to:'QHSE-CAUSE', cardinality:'one-to-zero-or-many', governance:'Cause findings retain analysis provenance.' },
  { id:'QHSE-R18', from:'QHSE-INVESTIGATION', predicate:'may create', to:'QHSE-CAPA-CASE', cardinality:'one-to-zero-or-many', governance:'Actions do not overwrite incident/investigation truth.' },
  { id:'QHSE-R19', from:'QHSE-COMPLIANCE-REGISTER', predicate:'projects applicability of', to:'QHSE-COMPLIANCE-REQUIREMENT', cardinality:'many-to-many', governance:'Register is rebuildable from requirements/evidence.' },
  { id:'QHSE-R20', from:'QHSE-ENV-ASPECT', predicate:'may cause', to:'QHSE-ENV-IMPACT', cardinality:'many-to-many', governance:'Aspect and impact remain distinct concepts.' },
  { id:'QHSE-R21', from:'QHSE-INCIDENT', predicate:'may concern', to:'QHSE-ENV-ASPECT', cardinality:'many-to-many', governance:'Environmental incident classification references applicable aspects/impacts.' },
  { id:'QHSE-R22', from:'QHSE-WASTE-CONSIGNMENT', predicate:'may evidence compliance with', to:'QHSE-COMPLIANCE-REQUIREMENT', cardinality:'many-to-many', governance:'Waste movement evidence remains immutable.' },
  { id:'QHSE-R23', from:'QHSE-QUALITY-CERTIFICATE', predicate:'may evidence result of', to:'QHSE-INSPECTION', cardinality:'many-to-zero-or-many', governance:'Certificate is evidence, not inspection identity.' },
  { id:'QHSE-R24', from:'QHSE-QUALITY-CERTIFICATE', predicate:'may evidence result of', to:'QHSE-TEST', cardinality:'many-to-zero-or-many', governance:'Certificate preserves exact verification basis.' }
];

export const qhseAssuranceRules = [
  'Quality Plan and ITP are controlled plans; Inspection/Test are execution/evidence and never overwrite plan definitions.',
  'Hold Point and Witness Point use one Verification Point pattern with point type and explicit waiver/release evidence.',
  'NCR, Defect and CAPA remain distinct: nonconformance describes departure, Defect manages a condition, CAPA manages corrective/preventive response.',
  'Snag is a Defect classification rather than a second defect master.',
  'QHSE Audit reuses the enterprise Audit Engagement pattern; Risk Assessment and Compliance Requirement are shared cross-enterprise patterns.',
  'Method Statement and RAMS are controlled Information Container types; a PDF/file is only a representation.',
  'Permit to Work and Isolation are shared with site operations and are domain authority records, not workflow-task state.',
  'Induction, Briefing and Toolbox Talk use a Safety Briefing Session pattern; individual attendance/outcome may create HCM Learning Record evidence.',
  'Near Miss and Pollution Event are Incident classifications; event facts, investigation and CAPA retain separate identities.',
  'Statutory Inspection uses the shared Inspection pattern with statutory requirement, jurisdiction and competence context.',
  'Compliance Register is a projection and must never become the editable source of regulatory/compliance truth.',
  'Environmental Aspect and Environmental Impact are distinct; Pollution Event is incident evidence, and Waste Consignment is regulated transfer evidence.',
  'All material assurance decisions/actions retain actor, authority, source requirement, timestamp and evidence provenance.'
] as const;

export function validateQhseAssuranceModel() {
  const ids = new Set(qhseAssuranceModel.map((x) => x.modelId));
  const relIds = new Set(qhseAssuranceRelationships.map((x) => x.id));
  if (ids.size !== qhseAssuranceModel.length) return false;
  if (relIds.size !== qhseAssuranceRelationships.length) return false;
  if (qhseAssuranceModel.some((x) => !x.canonicalName || !x.definition || !x.identityRule || !x.governance.length)) return false;
  if (qhseAssuranceRelationships.some((x) => !ids.has(x.from) || !ids.has(x.to))) return false;
  return true;
}
