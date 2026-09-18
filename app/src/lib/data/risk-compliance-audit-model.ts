export type RiskComplianceAuditKind =
  | 'controlled-framework'
  | 'risk'
  | 'event-evidence'
  | 'plan'
  | 'obligation'
  | 'controlled-requirement'
  | 'controlled-definition'
  | 'case'
  | 'work';

export type RiskComplianceAuditDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: RiskComplianceAuditKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type RiskComplianceAuditRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const rca = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: RiskComplianceAuditKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): RiskComplianceAuditDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance
});

export const riskComplianceAuditModel: RiskComplianceAuditDefinition[] = [
  rca('RISK-FRAMEWORK', ['BOF-21-001'], 'Risk Framework', 'controlled-framework',
    'Governed enterprise framework defining risk taxonomy, assessment methodology, appetite/tolerance, scales, governance, ownership and review rules.',
    'Stable framework identity with immutable approved versions/effectivity; Risks and Assessments reference the applicable version.',
    ['framework/version','taxonomy','assessment scales','appetite/tolerance','risk categories','governance roles','review frequency','effective dates'],
    ['Draft','Review','Approved','Effective','Superseded','Retired'],
    ['Framework is configuration and governance, not an Enterprise Risk.', 'Historic assessments retain exact framework/method version.', 'Risk appetite/tolerance changes never rewrite prior decisions.']),

  rca('RISK-ENTERPRISE-RISK', ['BOF-21-002'], 'Enterprise Risk', 'risk',
    'Stable identity for an uncertain event, condition or exposure that may affect objectives, with causes, consequences, ownership and affected scope.',
    'One Risk identity survives reassessment, treatment and ownership changes; current position is derived from effective Assessments and Treatment evidence.',
    ['risk ID/title','description','causes','potential consequences','category','affected objectives/scope','owner','status'],
    ['Identified','Active','Treating','Monitoring','Accepted','Closed'],
    ['Risk identity is not its current rating.', 'Climate, resilience, project, cyber and other specialisations reuse this pattern where appropriate.', 'Closing a Risk does not delete assessment/treatment history.']),

  rca('RISK-ASSESSMENT', ['BOF-21-003'], 'Risk Assessment', 'event-evidence',
    'Dated/context-specific assessment of a Risk or other governed risk subject using an identified method, assumptions and evidence.',
    'Each material assessment is an attributable occurrence retaining inherent/current/residual position, controls, assessor and exact method/version.',
    ['risk/subject','assessment date','method/version','likelihood','impact/consequence','inherent rating','controls','residual rating','assessor','evidence'],
    ['Draft','Reviewed','Approved','Effective','Superseded','Expired/Invalidated'],
    ['Assessment is not Risk identity.', 'Reassessment creates new evidence rather than overwriting prior ratings.', 'QHSE and other domains reuse this pattern.']),

  rca('RISK-TREATMENT-PLAN', ['BOF-21-004'], 'Treatment Plan', 'plan',
    'Versioned plan selecting responses and actions intended to modify a Risk and reach a target position.',
    'Stable plan identity with approved versions; actions, owners, target dates and target assessment position remain traceable.',
    ['risk','response strategy','target position','actions','owners','dates','resources/cost context','approval'],
    ['Draft','Review','Approved','Active','Completed','Superseded','Cancelled'],
    ['Treatment Plan is not Risk Assessment.', 'Completion of actions does not automatically close Risk without reassessment/decision.', 'Actions may be coordinated by Work Items but remain domain-owned.']),

  rca('COMP-REGULATORY-OBLIGATION', ['BOF-21-005'], 'Regulatory Obligation', 'obligation',
    'Governed source duty imposed by legislation, regulation, regulator, licence, permit or statutory instrument.',
    'Stable obligation identity/version with authoritative source, jurisdiction, applicability and effectivity.',
    ['authority/source','citation/reference','obligation text/summary','jurisdiction','applicability','effective dates','affected subjects'],
    ['Draft/Captured','Effective','Amended','Superseded','Repealed/Expired'],
    ['Obligation is source legal/regulatory duty, not proof of compliance.', 'Amendment/effectivity history must remain reconstructable.', 'One obligation may generate multiple actionable Compliance Requirements.']),

  rca('COMP-REQUIREMENT', ['BOF-21-006'], 'Compliance Requirement', 'controlled-requirement',
    'Actionable and testable requirement derived from regulatory obligations, standards, permits, contracts or policy.',
    'Stable requirement identity/version with source, applicability, control/evidence expectation, ownership and effectivity.',
    ['source/basis','requirement statement','applicability','jurisdiction/scope','owner','evidence expectation','control expectation','effective dates'],
    ['Draft','Effective','Superseded','Retired'],
    ['Requirement is distinct from source Obligation and from compliance evidence.', 'QHSE and other domains reuse this pattern.', 'Applicability is governed explicitly rather than copied into local registers.']),

  rca('COMP-ASSESSMENT', ['BOF-21-007'], 'Compliance Assessment', 'event-evidence',
    'Dated assessment of compliance with applicable Requirements against exact evidence and assessment criteria.',
    'Each assessment occurrence preserves scope, requirement set/version, evidence set, assessor, result, exceptions and time.',
    ['subject/scope','requirements/version','assessment method','evidence','result/status','exceptions','assessor','assessed at'],
    ['Draft','Reviewed','Approved','Published','Superseded/Invalidated'],
    ['Assessment is evidence, not the Compliance Requirement.', 'A live compliance dashboard is a projection over retained assessments/evidence.', 'Assessment conclusions must remain reproducible from exact requirement/evidence versions.']),

  rca('CTRL-INTERNAL-CONTROL', ['BOF-21-008'], 'Internal Control', 'controlled-definition',
    'Persistent control definition designed to prevent, detect or correct risk/compliance/control failures.',
    'Stable control identity with controlled versions/effectivity; tests and executions reference exact effective definition.',
    ['control ID/title','objective','control type','risks/requirements addressed','owner','performer','frequency','procedure','evidence expectation'],
    ['Draft','Approved','Effective','Suspended','Superseded','Retired'],
    ['Control definition is not a Control Test or evidence occurrence.', 'Ownership/performance assignment does not itself confer authority.', 'Material control changes preserve version history.']),

  rca('CTRL-CONTROL-TEST', ['BOF-21-009'], 'Control Test', 'event-evidence',
    'Governed test occurrence evaluating design and/or operating effectiveness of an exact Internal Control version.',
    'Immutable test occurrence with procedure, period, population/sample, tester, evidence, exceptions and conclusion.',
    ['control/version','test objective','procedure','period','population/sample','tester','evidence','exceptions','conclusion'],
    ['Planned','In Progress','Completed','Reviewed','Finalised','Invalidated/Superseded'],
    ['Control Test is not the Internal Control.', 'Retesting creates a new occurrence.', 'Exceptions may create Findings or Remediation Actions without rewriting test evidence.']),

  rca('ASSURANCE-PLAN', ['BOF-21-010','BOF-21-011'], 'Assurance Plan', 'plan',
    'Versioned assurance programme defining planned audits, reviews, control tests and other assurance coverage for a period and scope.',
    'Stable plan identity with plan type, coverage universe, period, priorities, resources and approved versions; Audit Plan is a type.',
    ['plan type','period','assurance universe','risk basis','planned activities','resources','provider/owner','approved version'],
    ['Draft','Review','Approved','Current','Superseded','Closed'],
    ['Audit Plan is an Assurance Plan type rather than a second planning engine.', 'Plan items do not become Audit Engagements until explicitly instantiated.', 'Risk-based planning retains source Risk/Assessment basis.']),

  rca('AUDIT-ENGAGEMENT', ['BOF-21-012'], 'Audit Engagement', 'case',
    'Governed audit execution covering scope, criteria, objectives, team, independence, evidence, findings, report and closure.',
    'Stable engagement identity with exact plan/source scope and retained evidence; QHSE audits reuse the same pattern.',
    ['engagement reference','scope/objectives','criteria','audit team','independence/conflicts','fieldwork period','evidence','report'],
    ['Planned','Scoping','Fieldwork','Reporting','Management Response','Closed','Cancelled'],
    ['Audit Engagement is execution, not Assurance Plan.', 'Evidence and Findings remain separately governed.', 'Closure does not delete unresolved Remediation Actions.']),

  rca('AUDIT-FINDING', ['BOF-21-013'], 'Audit Finding', 'case',
    'Governed finding arising from an Audit Engagement, with criteria, condition, cause/context, significance, response and closure verification.',
    'Stable finding identity tied to exact engagement/evidence and retained management response/remediation history.',
    ['engagement','criteria','condition','evidence','significance','owner','management response','target date','closure evidence'],
    ['Open','Response Required','Actioning','Ready for Verification','Closed','Risk Accepted','Withdrawn'],
    ['Finding is not the Audit Engagement.', 'Finding may relate to Risk, Control or Compliance Requirement without replacing them.', 'Closure requires attributable verification or accepted-risk decision.']),

  rca('ASSURANCE-REMEDIATION-ACTION', ['BOF-21-014'], 'Remediation Action', 'work',
    'Governed action responding to a finding, control deficiency, compliance assessment, integrity case or risk issue.',
    'Stable action identity with source, owner, due date, expected outcome, completion evidence and verification.',
    ['source case/finding','action statement','owner','due date','priority','expected outcome','completion evidence','verification'],
    ['Proposed','Accepted','In Progress','Completed','Verified','Cancelled','Overdue'],
    ['Remediation Action is domain truth, not a workflow Work Item.', 'Work Items may coordinate the action.', 'Verification remains separate from self-reported completion.']),

  rca('INTEGRITY-CASE', ['BOF-21-015','BOF-21-016'], 'Integrity Case', 'case',
    'Restricted-governance case for alleged or confirmed fraud, misconduct or conduct concerns, preserving triage, investigation, evidence, decisions and outcomes.',
    'Stable case identity with explicit case type and strict access/evidence/retention rules; Fraud and Conduct are case types.',
    ['case type','allegation/issue','subject Parties/Persons','reporter/source','triage','investigation links','loss/impact','notifications','outcome'],
    ['Reported','Triage','Open','Investigating','Decision/Action','Appeal/Review','Closed','Unsubstantiated'],
    ['Fraud and Conduct share one case architecture while retaining type-specific rules.', 'Restricted access and need-to-know controls are mandatory.', 'Case state never substitutes for employment/legal/criminal outcomes in other domains.']),

  rca('COMP-EVIDENCE', ['BOF-21-017'], 'Compliance Evidence', 'event-evidence',
    'Immutable attributable evidence supporting compliance with one or more Requirements for a defined subject and time.',
    'Evidence identity preserves source, subject, validity, provenance, verification and exact requirement relationships.',
    ['subject','requirements','evidence type/source','captured/issued date','validity','provenance','verified by/at','information/evidence references'],
    ['Captured','Verified','Effective','Expired','Superseded/Invalidated'],
    ['Evidence is not the Requirement or Compliance Assessment.', 'Documents/files may represent evidence but do not replace structured provenance.', 'Expired/superseded evidence remains historically queryable.'])
];

export const riskComplianceAuditRelationships: RiskComplianceAuditRelationship[] = [
  { id:'RCA-R01', from:'RISK-ENTERPRISE-RISK', predicate:'governed by', to:'RISK-FRAMEWORK', cardinality:'many-to-one-or-many', governance:'Risk interpretation retains applicable framework/version.' },
  { id:'RCA-R02', from:'RISK-ASSESSMENT', predicate:'assesses', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-one', governance:'Current rating is derived from retained assessments.' },
  { id:'RCA-R03', from:'RISK-TREATMENT-PLAN', predicate:'treats', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-one', governance:'Treatment lifecycle remains separate from Risk identity.' },
  { id:'RCA-R04', from:'RISK-TREATMENT-PLAN', predicate:'may contain', to:'ASSURANCE-REMEDIATION-ACTION', cardinality:'one-to-many', governance:'Actions remain individually owned and evidenced.' },
  { id:'RCA-R05', from:'COMP-REGULATORY-OBLIGATION', predicate:'gives rise to', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Actionable requirements retain source-obligation provenance.' },
  { id:'RCA-R06', from:'COMP-ASSESSMENT', predicate:'assesses', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Exact requirement versions are retained.' },
  { id:'RCA-R07', from:'COMP-ASSESSMENT', predicate:'uses', to:'COMP-EVIDENCE', cardinality:'many-to-many', governance:'Assessment result remains reproducible from source evidence.' },
  { id:'RCA-R08', from:'CTRL-INTERNAL-CONTROL', predicate:'may satisfy', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Control mapping is explicit and effective-dated.' },
  { id:'RCA-R09', from:'CTRL-INTERNAL-CONTROL', predicate:'may mitigate', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-many', governance:'Control-to-risk mapping does not change either identity.' },
  { id:'RCA-R10', from:'CTRL-CONTROL-TEST', predicate:'tests', to:'CTRL-INTERNAL-CONTROL', cardinality:'many-to-one', governance:'Test references exact control version.' },
  { id:'RCA-R11', from:'ASSURANCE-PLAN', predicate:'plans assurance over', to:'RISK-ENTERPRISE-RISK', cardinality:'many-to-many', governance:'Risk-based plan retains assessment basis.' },
  { id:'RCA-R12', from:'ASSURANCE-PLAN', predicate:'may instantiate', to:'AUDIT-ENGAGEMENT', cardinality:'one-to-many', governance:'Engagement is separate execution identity.' },
  { id:'RCA-R13', from:'AUDIT-ENGAGEMENT', predicate:'produces', to:'AUDIT-FINDING', cardinality:'one-to-many', governance:'Findings remain separately tracked.' },
  { id:'RCA-R14', from:'AUDIT-FINDING', predicate:'may concern', to:'CTRL-INTERNAL-CONTROL', cardinality:'many-to-many', governance:'Finding and control remain distinct.' },
  { id:'RCA-R15', from:'AUDIT-FINDING', predicate:'may concern', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Requirement context is retained.' },
  { id:'RCA-R16', from:'AUDIT-FINDING', predicate:'may create', to:'ASSURANCE-REMEDIATION-ACTION', cardinality:'one-to-many', governance:'Remediation action lifecycle is separate from finding closure.' },
  { id:'RCA-R17', from:'CTRL-CONTROL-TEST', predicate:'may create', to:'ASSURANCE-REMEDIATION-ACTION', cardinality:'one-to-many', governance:'Control deficiency response remains explicit.' },
  { id:'RCA-R18', from:'COMP-ASSESSMENT', predicate:'may create', to:'ASSURANCE-REMEDIATION-ACTION', cardinality:'one-to-many', governance:'Noncompliance remediation does not overwrite assessment evidence.' },
  { id:'RCA-R19', from:'INTEGRITY-CASE', predicate:'may create', to:'ASSURANCE-REMEDIATION-ACTION', cardinality:'one-to-many', governance:'Case outcome/actions remain traceable and access-controlled.' },
  { id:'RCA-R20', from:'COMP-EVIDENCE', predicate:'supports', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Evidence remains source-linked and attributable.' },
  { id:'RCA-R21', from:'ASSURANCE-REMEDIATION-ACTION', predicate:'may be coordinated by', to:'WORK-WORK-ITEM', cardinality:'one-to-many', governance:'Workflow work coordinates but does not replace remediation truth.' },
  { id:'RCA-R22', from:'AUDIT-ENGAGEMENT', predicate:'may use', to:'WORK-DECISION', cardinality:'many-to-many', governance:'Material audit/closure decisions retain shared immutable decision evidence where required.' }
];

export const riskComplianceAuditRules = [
  'Enterprise Risk identity is separate from every Risk Assessment; current rating is derived from retained assessment evidence.',
  'Risk Framework is versioned governance/configuration and historic assessments retain the exact framework/method version used.',
  'Treatment Plan is forward-looking response planning and never overwrites Risk or assessment history.',
  'Regulatory Obligation is source duty; Compliance Requirement is actionable/testable requirement derived from obligations, standards, contracts, permits or policy.',
  'Compliance Assessment and Compliance Evidence are separate evidence layers and both remain distinct from the Requirement.',
  'Internal Control is the persistent control definition; Control Test is a dated test occurrence against an exact control version.',
  'Audit Plan is an Assurance Plan type; Audit Engagement is execution and Audit Finding is a separate governed case.',
  'Remediation Action is domain work and is not replaced by a shared workflow Work Item.',
  'Fraud and Conduct use one restricted Integrity Case architecture with explicit case type.',
  'QHSE Risk Assessment, Compliance Requirement and Audit Engagement reuse these enterprise-shared semantics.',
  'Climate and Resilience Risk reuse Enterprise Risk rather than maintaining sustainability-specific risk registers.',
  'All assessment, test, finding, evidence and remediation records preserve actor, source, timestamp, authority where applicable and immutable provenance.'
] as const;

export function validateRiskComplianceAuditModel() {
  const ids = new Set(riskComplianceAuditModel.map((x) => x.modelId));
  const relIds = new Set(riskComplianceAuditRelationships.map((x) => x.id));
  const external = new Set(['WORK-WORK-ITEM','WORK-DECISION']);
  if (ids.size !== riskComplianceAuditModel.length || relIds.size !== riskComplianceAuditRelationships.length) return false;
  const candidates = new Set(riskComplianceAuditModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 17; i += 1) {
    if (!candidates.has(`BOF-21-${String(i).padStart(3, '0')}`)) return false;
  }
  if (riskComplianceAuditModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return riskComplianceAuditRelationships.every((x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to)));
}
