export type PeopleHcmKind =
  | 'foundation-reference'
  | 'relationship'
  | 'master-data'
  | 'reference'
  | 'plan'
  | 'case'
  | 'work'
  | 'event-evidence'
  | 'transaction'
  | 'controlled-definition'
  | 'projection'
  | 'configuration';

export type PeopleHcmDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: PeopleHcmKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type PeopleHcmRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

export type PeopleHcmBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const hcm = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: PeopleHcmKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[],
  scope: string[] = ['tenant', 'legal entity', 'organisation']
): PeopleHcmDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, scope, keyData, lifecycle, governance
});

export const peopleHcmModel: PeopleHcmDefinition[] = [
  hcm('HCM-PERSON', [], 'Person', 'foundation-reference',
    'Reference to the canonical Person identity used across recruitment, employment, competence, time, payroll and expenses.',
    'One immutable Person identity survives recruitment, multiple employments/engagements, transfers, leave, offboarding and later re-engagement.',
    ['person ID', 'Party identity', 'name/history', 'contact/privacy references'], ['Proposed', 'Active', 'Inactive', 'Deceased'],
    ['HCM never creates a separate employee/candidate/person master.', 'Employment and engagement state belongs to Worker Relationship, not Person.']),

  hcm('HCM-WORKER-RELATIONSHIP', ['BOF-18-001', 'BOF-18-002', 'BOF-18-003'], 'Worker Relationship', 'relationship',
    'Effective relationship between canonical Person and an employing/engaging Organisation/Legal Entity. Employment and contingent engagement are governed relationship types.',
    'Stable relationship identity per legally/operationally distinct engagement; a Person may hold sequential or concurrent relationships without new Person identity.',
    ['Person', 'employer/engager', 'relationship type', 'start/end', 'jurisdiction', 'terms basis', 'status'], ['Proposed', 'Active', 'Suspended', 'Ended', 'Cancelled'],
    ['Worker Relationship is not Person identity.', 'Employment and engagement use relationship type/configuration.', 'Rehire normally creates a new effective Worker Relationship while reusing Person identity.']),

  hcm('HCM-POSITION', ['BOF-18-004'], 'Position', 'master-data',
    'Governed organisational seat/capacity within an Organisation Unit, independently identifiable whether occupied or vacant.',
    'Stable Position identity survives occupant changes; organisational assignment/effectivity is historically controlled.',
    ['position code', 'organisation unit', 'legal entity', 'Job Profile', 'FTE/capacity', 'location', 'effective dates'], ['Planned', 'Open', 'Occupied', 'Frozen', 'Closed'],
    ['Position is not Person, Job Profile, business Role Assignment or Cost Centre.', 'Occupancy is an effective relationship, not a Person attribute.']),

  hcm('HCM-JOB-PROFILE', ['BOF-18-005'], 'Job Profile', 'controlled-definition',
    'Reusable definition of work purpose, accountabilities, job family/level and capability/credential requirements.',
    'Stable Job Profile identity with controlled versions/effectivity; Positions and workers reference the applicable version.',
    ['job code', 'family', 'level/grade', 'purpose', 'accountabilities', 'skill/competence requirements', 'credential requirements'], ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    ['Job Profile is a definition, not a Position or Person.', 'Business Role Assignment remains separate from job/position semantics.']),

  hcm('HCM-REPORTING-RELATIONSHIP', ['BOF-18-006'], 'Reporting Relationship', 'relationship',
    'Effective organisational reporting relationship between Positions and/or Persons.',
    'Relationship identity/effectivity is retained through reorganisations and occupant changes.',
    ['manager position/person', 'report position/person', 'relationship type', 'valid from/to'], ['Proposed', 'Active', 'Ended'],
    ['Reporting does not grant permission, delegated authority or approval rights.', 'Prefer Position-to-Position reporting where organisational structure is intended to survive occupant changes.']),

  hcm('HCM-CAREER-PROFILE', ['BOF-18-007'], 'Career Profile', 'plan',
    'Worker career context capturing experience, aspirations, mobility/preferences and development direction.',
    'Stable profile identity tied to Person with controlled history; it does not replace Job Profile or Learning Plan.',
    ['Person', 'experience summary', 'aspirations', 'mobility', 'career interests', 'review date'], ['Draft', 'Current', 'Superseded', 'Archived'],
    ['Career Profile is private worker context and access-controlled.', 'It does not determine authorisation or competence by itself.']),

  hcm('HCM-SKILL-DEFINITION', ['BOF-18-008'], 'Skill Definition', 'reference',
    'Governed reusable definition/classification of a skill or knowledge capability.',
    'Stable skill definition with taxonomy/version/effectivity; people records reference it rather than copying free-text skill masters.',
    ['skill code', 'name', 'category', 'description', 'level scale', 'effective version'], ['Draft', 'Active', 'Superseded', 'Retired'],
    ['Skill definition is not proof that a Person possesses the skill.', 'Classification release/version is retained where external frameworks apply.']),

  hcm('HCM-COMPETENCE-DEFINITION', ['BOF-18-009'], 'Competence Definition', 'controlled-definition',
    'Governed definition of demonstrated capability in context, including expected proficiency, evidence and reassessment rules.',
    'Stable competence definition/version; person attainment is a separate effective/evidenced Person Competence relationship.',
    ['competence code', 'description', 'context', 'level scale', 'evidence requirements', 'reassessment/expiry rule'], ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    ['Competence is more than a label or training completion.', 'Competence requirements may reference skills and credentials without duplicating them.']),

  hcm('HCM-PERSON-COMPETENCE', [], 'Person Competence', 'relationship',
    'Effective/evidenced relationship recording a Person\'s assessed competence against a governed Competence Definition.',
    'Relationship identity records level, assessor, evidence, valid period and reassessment; expired competence history is retained.',
    ['Person', 'competence', 'level', 'assessor', 'evidence', 'assessed at', 'valid from/to'], ['Proposed', 'Verified', 'Effective', 'Expired', 'Revoked', 'Superseded'],
    ['Training attendance alone does not prove competence unless the competence definition permits it.', 'Current competence is derived from effective verified records.']),

  hcm('HCM-CREDENTIAL', ['BOF-18-010', 'BOF-18-011', 'BOF-18-012', 'BOF-18-013'], 'Person Credential', 'event-evidence',
    'Governed credential held by a Person, including qualification, licence, card or certification with issuer and verification evidence.',
    'Each credential has stable identity tied to issuer/reference/scope and retains issue, verification, expiry, revocation and renewal history.',
    ['Person', 'credential type', 'issuer', 'credential/reference number', 'scope/class', 'issued at', 'valid to', 'verification evidence'], ['Reported', 'Verified', 'Effective', 'Expired', 'Revoked', 'Superseded'],
    ['Credential type preserves qualification/licence/card/certification semantics.', 'Credential evidence never creates a duplicate Person.', 'Expiry/revocation affects eligibility but does not erase history.']),

  hcm('HCM-TRAINING-COURSE', ['BOF-18-014'], 'Training Course', 'controlled-definition',
    'Reusable controlled learning/training definition with objectives, syllabus, prerequisites, assessment and competence/credential outcomes.',
    'Stable course identity with controlled revisions; sessions reference exact effective course version.',
    ['course code/version', 'objectives', 'content', 'prerequisites', 'duration', 'assessment', 'outcomes'], ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    ['Course is definition, not attendance/completion evidence.', 'External course/provider identifiers are mapped rather than replacing identity.']),

  hcm('HCM-TRAINING-SESSION', ['BOF-18-015'], 'Training Session', 'work',
    'Scheduled occurrence/delivery of a Training Course with trainer/provider, time, venue/channel and participant roster.',
    'Stable session identity for one occurrence; rescheduling retains history and actual attendance/completion is separate evidence.',
    ['course/version', 'trainer/provider', 'start/end', 'venue/channel', 'capacity', 'participants', 'status'], ['Planned', 'Open', 'In Progress', 'Completed', 'Cancelled'],
    ['Training Session is not Course definition.', 'Attendance/completion generates Learning Records; it does not mutate course definition.']),

  hcm('HCM-LEARNING-RECORD', ['BOF-18-016', 'BOF-18-017'], 'Learning Record', 'event-evidence',
    'Immutable/evidenced Person learning record for training participation/completion, CPD or other governed development evidence.',
    'Each learning occurrence has attributable identity, date, learning type, source/session and evidence; corrections add history.',
    ['Person', 'learning type', 'course/session/source', 'date', 'hours/points', 'outcome', 'evidence', 'verified by'], ['Recorded', 'Verified', 'Invalidated/Superseded'],
    ['Learning Record is evidence, not automatic competence.', 'CPD uses the same record pattern with CPD-specific attributes.', 'Handover training evidence reuses this pattern.']),

  hcm('HCM-WORKFORCE-PLAN', ['BOF-18-018'], 'Workforce Plan', 'plan',
    'Versioned plan of workforce demand, supply, capability and capacity by organisation, location and time horizon.',
    'Stable plan identity with immutable approved versions/baselines; individual allocations remain separate.',
    ['planning horizon', 'organisation', 'roles/skills', 'demand', 'supply', 'gaps', 'assumptions'], ['Draft', 'Review', 'Approved', 'Current', 'Superseded', 'Closed'],
    ['Workforce Plan does not create workers or positions.', 'Demand may consume delivery Resource Requirements without collapsing planning domains.']),

  hcm('HCM-AVAILABILITY', ['BOF-18-019'], 'Worker Availability', 'projection',
    'Derived time-bounded worker/capacity availability after considering work pattern, shifts, leave/absence, allocations and restrictions.',
    'Rebuildable position for a Person/Worker Relationship and time window; source records remain authoritative.',
    ['Person/worker', 'time window', 'capacity', 'work pattern', 'leave/absence', 'allocations', 'restrictions'], ['Available', 'Part Available', 'Unavailable'],
    ['Availability is never independently edited truth.', 'Scheduling consumes availability but does not own worker identity.']),

  hcm('HCM-SHIFT', ['BOF-18-020'], 'Shift', 'work',
    'Governed work-time window/roster occurrence defining when capacity is expected or assigned.',
    'Stable shift identity for the scheduled window; actual attendance/time remain separate.',
    ['shift code', 'date/time', 'location/team', 'work pattern', 'assigned worker/position', 'status'], ['Planned', 'Published', 'In Progress', 'Completed', 'Cancelled'],
    ['Shift is planned work time, not Attendance or Time Entry.', 'Assignment must respect effective Worker Relationship, competence and availability.']),

  hcm('HCM-WORK-PATTERN', ['BOF-18-021'], 'Work Pattern', 'configuration',
    'Effective-dated recurring working-time pattern applied to a Worker Relationship or Position.',
    'Stable configuration identity/version defining normal days/hours/cycle and exceptions.',
    ['pattern code', 'cycle', 'working periods', 'break rules', 'timezone', 'effective dates'], ['Draft', 'Effective', 'Superseded', 'Retired'],
    ['Work Pattern is not a Schedule or actual attendance.', 'Changes are effective-dated and never rewrite historic time interpretation.']),

  hcm('HCM-WORKFORCE-ALLOCATION', ['BOF-18-022'], 'Workforce Allocation', 'relationship',
    'Effective allocation of worker capacity to an organisation, project, team, location, shift or other governed workforce context.',
    'Relationship identity preserves worker, target context, capacity/percentage, dates and allocation basis.',
    ['Person/worker', 'target context', 'capacity/FTE/percentage', 'valid from/to', 'allocation reason/source'], ['Proposed', 'Active', 'Ended', 'Cancelled'],
    ['Workforce Allocation is distinct from Finance Settlement Allocation.', 'Project-controls Resource Allocation may map to it but is not silently the same identity.', 'Allocation never changes Person or Position identity.']),

  hcm('HCM-ATTENDANCE', ['BOF-18-023'], 'Attendance Record', 'event-evidence',
    'Observed/evidenced presence event or interval such as clock-in/out, arrival/departure or verified attendance.',
    'Immutable source occurrence with device/source and correction history.',
    ['Person/worker', 'occurred at', 'event/interval type', 'location', 'source/device', 'correction provenance'], ['Recorded', 'Validated', 'Corrected/Invalidated'],
    ['Attendance is evidence, not Time Entry or payroll result.', 'Original clock/source evidence is retained when corrected.']),

  hcm('HCM-TIME-ENTRY', ['BOF-18-024'], 'Time Entry', 'transaction',
    'Governed declaration/record of worker time against date, activity/project/cost context and work/pay type.',
    'Stable entry identity; submitted/approved entries retain adjustment history rather than silent overwrite.',
    ['Person/worker', 'date', 'duration/units', 'project/activity/cost context', 'work/pay type', 'source', 'status'], ['Draft', 'Submitted', 'Approved', 'Rejected', 'Posted/Exported', 'Adjusted'],
    ['Time Entry is not Attendance; one may be informed by the other.', 'Project/cost dimensions reference canonical objects rather than duplicate them.']),

  hcm('HCM-TIMESHEET', ['BOF-18-025'], 'Timesheet', 'transaction',
    'Controlled worker/period submission grouping Time Entries for review, approval and downstream use.',
    'Stable timesheet identity for worker and period; approved revisions use controlled adjustment/successor records.',
    ['worker', 'period', 'time entries', 'total hours', 'submission', 'approval', 'adjustment history'], ['Open', 'Submitted', 'Approved', 'Rejected', 'Exported/Posted', 'Adjusted', 'Closed'],
    ['Timesheet is a control/submission envelope, not a duplicate of its Time Entries.', 'Approval authority and segregation rules are evaluated separately.']),

  hcm('HCM-ABSENCE', ['BOF-18-026'], 'Absence Record', 'event-evidence',
    'Actual/evidenced period of worker absence with category, dates and applicable evidence.',
    'Stable absence occurrence identity; updates/corrections retain history and are distinct from leave request/entitlement.',
    ['worker', 'absence type', 'start/end', 'duration', 'evidence', 'source', 'related leave request'], ['Recorded', 'Confirmed', 'Corrected', 'Closed'],
    ['Absence records actual absence; Leave Request records planned/requested leave.', 'Health/sensitive detail access must be separately controlled.']),

  hcm('HCM-LEAVE-REQUEST', ['BOF-18-027'], 'Leave Request', 'case',
    'Governed request and decision record for planned worker leave.',
    'Stable request identity with requested period/type, decision and resulting calendar/availability effects.',
    ['worker', 'leave type', 'requested start/end', 'duration', 'reason where permitted', 'decision', 'authority'], ['Draft', 'Submitted', 'Approved', 'Rejected', 'Withdrawn', 'Taken', 'Closed'],
    ['Leave Request is not actual Absence.', 'Approval may affect availability/work scheduling but does not rewrite work pattern.']),

  hcm('HCM-COMPENSATION', ['BOF-18-028'], 'Compensation Arrangement', 'relationship',
    'Effective-dated compensation terms/structure applicable to a Worker Relationship.',
    'Stable arrangement identity/version preserving salary/rate basis, pay elements, currency, frequency and effectivity.',
    ['worker relationship', 'pay basis/rate', 'currency', 'frequency', 'pay elements', 'effective dates'], ['Proposed', 'Effective', 'Superseded', 'Ended'],
    ['Compensation Arrangement is not Payroll Result or accounting posting.', 'Changes are effective-dated and historic payroll retains the terms/rates actually used.']),

  hcm('HCM-PAY-ELEMENT', ['BOF-18-029'], 'Pay Element', 'configuration',
    'Governed earning, deduction, benefit or employer-cost element definition consumed by compensation/payroll rules.',
    'Stable element identity with calculation/tax/accounting classification versions and effectivity.',
    ['element code', 'type', 'calculation rule', 'tax treatment', 'accounting mapping', 'effective dates'], ['Draft', 'Effective', 'Superseded', 'Retired'],
    ['Pay Element is configuration, not worker payment/result.', 'Payroll Result retains exact element/rule version applied.']),

  hcm('HCM-PAYROLL-CALENDAR', ['BOF-18-030'], 'Payroll Calendar', 'configuration',
    'Payroll-specific pay-cycle and pay-period calendar configuration.',
    'Stable calendar identity/version defining payroll periods, cut-off and payment dates.',
    ['calendar code', 'frequency', 'periods', 'cut-off dates', 'pay dates', 'timezone/jurisdiction'], ['Draft', 'Published', 'Effective', 'Superseded', 'Retired'],
    ['Payroll Calendar is not Payroll Run or general working-time Calendar.', 'Published historic periods are not silently moved.']),

  hcm('HCM-PAYROLL-RUN', ['BOF-18-031'], 'Payroll Run', 'transaction',
    'Governed payroll processing batch for a population and pay period, coordinating inputs, calculation, validation, approval and posting/export.',
    'Stable run identity with calculation version, population, period and control totals; reruns/corrections retain provenance.',
    ['legal entity/payroll', 'period', 'population', 'rule/version', 'status', 'control totals', 'approval/posting references'], ['Planned', 'Open', 'Calculated', 'Validated', 'Approved', 'Posted/Released', 'Closed', 'Reversed/Corrected'],
    ['Payroll Run coordinates calculation; worker-level truth is preserved in Payroll Results.', 'Financial posting is created in Finance and does not replace payroll evidence.']),

  hcm('HCM-PAYROLL-RESULT', ['BOF-18-032'], 'Payroll Result', 'event-evidence',
    'Immutable worker/pay-period payroll calculation result containing earnings, deductions, tax, employer costs and net pay.',
    'Each accepted calculation result has immutable identity and exact input/rule provenance; correction creates adjustment/reversal/successor result.',
    ['worker relationship', 'pay period', 'earnings/elements', 'deductions', 'tax', 'net pay', 'rule versions', 'source inputs'], ['Calculated', 'Validated', 'Approved', 'Released', 'Adjusted/Reversed'],
    ['Payroll Result is not Payslip representation, Payment or Ledger Entry.', 'Sensitive payroll data is access-controlled and retained under jurisdictional policy.']),

  hcm('HCM-EXPENSE-CLAIM', ['BOF-18-034'], 'Expense Claim', 'case',
    'Governed worker reimbursement claim with expense lines, evidence, policy checks, approval and settlement provenance.',
    'Stable claim identity; approved/paid corrections preserve original evidence and decision history.',
    ['claimant', 'worker relationship', 'expense lines', 'receipts/evidence', 'currency', 'policy', 'approval', 'settlement'], ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid', 'Part Paid', 'Closed', 'Adjusted'],
    ['Expense Claim is not Finance Payment or Ledger Entry.', 'Receipts are evidence; policy/authority decisions remain attributable.']),

  hcm('HCM-VACANCY', ['BOF-18-035'], 'Vacancy', 'case',
    'Governed recruitment demand/opening for a Position or approved workforce requirement.',
    'Stable vacancy identity with requested capacity, Job Profile/Position, hiring context and approval.',
    ['Position/Job Profile', 'organisation', 'location', 'capacity', 'reason', 'recruiter/owner', 'approval', 'target dates'], ['Draft', 'Approved', 'Open', 'On Hold', 'Filled', 'Cancelled', 'Closed'],
    ['Vacancy is not Position or Person identity.', 'One Position may have sequential vacancies; bulk hiring may use governed multi-position scope.']),

  hcm('HCM-JOB-APPLICATION', ['BOF-18-037'], 'Job Application', 'case',
    'Recruitment case linking canonical Person to Vacancy with application submissions, assessments, decisions and evidence.',
    'Stable application identity per Person/Vacancy/application route; candidate status is derived from applications, not a duplicate Person master.',
    ['Person', 'Vacancy', 'application source', 'submitted data', 'assessment/interview evidence', 'decision', 'status'], ['Started', 'Submitted', 'Screening', 'Assessment', 'Interview', 'Offer', 'Rejected', 'Withdrawn', 'Closed'],
    ['Candidate is Person in recruitment context.', 'Recruitment notes/evidence are access/retention controlled.', 'Application decision does not grant employment or system access.']),

  hcm('HCM-EMPLOYMENT-OFFER', ['BOF-18-038'], 'Employment Offer', 'transaction',
    'Controlled offer of employment/engagement terms to a Person for a Position/Job Profile.',
    'Stable offer identity with immutable issued versions, validity and acceptance/rejection evidence.',
    ['Person', 'Position/Job Profile', 'worker relationship type', 'terms', 'compensation basis', 'start date', 'validity', 'issued version'], ['Draft', 'Approved', 'Issued', 'Accepted', 'Rejected', 'Expired', 'Withdrawn', 'Superseded'],
    ['Employment Offer is not Worker Relationship.', 'Accepted offer may create a Worker Relationship through explicit domain action.']),

  hcm('HCM-ONBOARDING', ['BOF-18-039'], 'Worker Onboarding Case', 'case',
    'Governed case coordinating prerequisites and actions required to make a new/re-engaged worker operational.',
    'Stable onboarding case linked to Person and Worker Relationship; tasks/evidence remain separate shared-work records.',
    ['Person', 'worker relationship', 'Position', 'required checks', 'documents', 'induction', 'access/equipment requests', 'status'], ['Planned', 'In Progress', 'Blocked', 'Ready', 'Completed', 'Cancelled'],
    ['Onboarding is a case around canonical identities, not the source of Person/Position/permission truth.', 'System access is granted only by the authority/identity controls, not onboarding completion alone.']),

  hcm('HCM-PERFORMANCE-REVIEW', ['BOF-18-040'], 'Performance Review', 'event-evidence',
    'Attributed review evidence for a worker and period covering objectives, feedback, ratings/outcomes and development actions.',
    'Stable review occurrence identity; submitted/finalised evidence is retained and corrections/successors are explicit.',
    ['worker', 'review period', 'reviewer', 'objectives', 'feedback', 'ratings/outcomes', 'development actions'], ['Planned', 'In Progress', 'Employee Review', 'Manager Review', 'Finalised', 'Acknowledged', 'Superseded'],
    ['Performance Review is not Job Profile, competence proof or authorisation.', 'Access and retention follow workforce/privacy policy.']),

  hcm('HCM-LEARNING-PLAN', ['BOF-18-041'], 'Learning Plan', 'plan',
    'Versioned development plan linking competence gaps, learning objectives and planned learning interventions for a Person/team.',
    'Stable plan identity with controlled versions and target dates; actual learning remains Learning Record evidence.',
    ['Person/team', 'competence gaps', 'objectives', 'planned courses/actions', 'target dates', 'owner'], ['Draft', 'Agreed', 'Active', 'Completed', 'Superseded', 'Cancelled'],
    ['Learning Plan is forward-looking; Learning Record is actual evidence.', 'Plans do not themselves confer competence.']),

  hcm('HCM-ER-CASE', ['BOF-18-042'], 'Employee Relations Case', 'case',
    'Restricted-governance workforce case for grievance, disciplinary, conduct or other employee-relations matters.',
    'Stable case identity with strict access, evidence, process/decision history and retention controls.',
    ['worker', 'case type', 'issue/allegation', 'case owner', 'participants', 'evidence', 'decisions/outcomes'], ['Opened', 'Assessment', 'Investigation', 'Hearing/Review', 'Decision', 'Appeal', 'Closed'],
    ['ER Case is not a generic workflow task.', 'Sensitive evidence access is explicitly scoped and audited.', 'Case outcome does not silently alter employment terms without governed action.']),

  hcm('HCM-OFFBOARDING', ['BOF-18-043'], 'Worker Offboarding Case', 'case',
    'Governed case coordinating end-of-employment/engagement obligations and operational closure.',
    'Stable case identity linked to Person and ending Worker Relationship; Person/history remain after relationship end.',
    ['Person', 'worker relationship', 'end reason/date', 'access removal', 'property return', 'knowledge transfer', 'final pay/expense actions'], ['Planned', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
    ['Offboarding never deletes Person or historical evidence.', 'Ending employment does not automatically erase project/commercial responsibility history.', 'Access/authority revocation is executed by authoritative security/authority services.'])
];

export const peopleHcmRelationships: PeopleHcmRelationship[] = [
  { id: 'HCM-R01', from: 'HCM-WORKER-RELATIONSHIP', predicate: 'relates worker', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Person identity is reused across all employments/engagements.' },
  { id: 'HCM-R02', from: 'HCM-POSITION', predicate: 'is defined by', to: 'HCM-JOB-PROFILE', cardinality: 'many-to-one', governance: 'Reusable Job Profile may define many Positions.' },
  { id: 'HCM-R03', from: 'HCM-WORKER-RELATIONSHIP', predicate: 'occupies via assignment', to: 'HCM-POSITION', cardinality: 'many-to-many over time', governance: 'Position occupancy is effective-dated and does not change Person identity.' },
  { id: 'HCM-R04', from: 'HCM-REPORTING-RELATIONSHIP', predicate: 'organises', to: 'HCM-POSITION', cardinality: 'many-to-many over time', governance: 'Reporting hierarchy is effective-dated and separate from authorization.' },
  { id: 'HCM-R05', from: 'HCM-COMPETENCE-DEFINITION', predicate: 'may require', to: 'HCM-SKILL-DEFINITION', cardinality: 'many-to-many', governance: 'Competence definitions may compose skills without duplicating them.' },
  { id: 'HCM-R06', from: 'HCM-PERSON-COMPETENCE', predicate: 'assesses', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Person competence is evidence/effectivity, not Person master data.' },
  { id: 'HCM-R07', from: 'HCM-PERSON-COMPETENCE', predicate: 'against', to: 'HCM-COMPETENCE-DEFINITION', cardinality: 'many-to-one', governance: 'Competence record always identifies the governed definition/version.' },
  { id: 'HCM-R08', from: 'HCM-JOB-PROFILE', predicate: 'may require', to: 'HCM-COMPETENCE-DEFINITION', cardinality: 'many-to-many', governance: 'Requirements are effective and do not imply current Person attainment.' },
  { id: 'HCM-R09', from: 'HCM-CREDENTIAL', predicate: 'held by', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Credentials reference one canonical Person.' },
  { id: 'HCM-R10', from: 'HCM-TRAINING-SESSION', predicate: 'delivers', to: 'HCM-TRAINING-COURSE', cardinality: 'many-to-one', governance: 'Session references exact Course version.' },
  { id: 'HCM-R11', from: 'HCM-LEARNING-RECORD', predicate: 'records learning for', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Learning evidence accumulates without changing Person identity.' },
  { id: 'HCM-R12', from: 'HCM-LEARNING-RECORD', predicate: 'may evidence', to: 'HCM-PERSON-COMPETENCE', cardinality: 'many-to-many', governance: 'Learning contributes evidence only where competence rules permit.' },
  { id: 'HCM-R13', from: 'HCM-WORKFORCE-PLAN', predicate: 'plans demand for', to: 'HCM-JOB-PROFILE', cardinality: 'many-to-many', governance: 'Demand planning uses job/capability definitions rather than individual worker identity.' },
  { id: 'HCM-R14', from: 'HCM-AVAILABILITY', predicate: 'projects availability of', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Availability is calculated from authoritative source records.' },
  { id: 'HCM-R15', from: 'HCM-SHIFT', predicate: 'may be assigned to', to: 'HCM-PERSON', cardinality: 'many-to-zero-or-one', governance: 'Planned assignment remains separate from attendance evidence.' },
  { id: 'HCM-R16', from: 'HCM-WORKFORCE-ALLOCATION', predicate: 'allocates', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Allocation changes capacity/context, not Person identity.' },
  { id: 'HCM-R17', from: 'HCM-TIME-ENTRY', predicate: 'declared by/for', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Time entry references worker and canonical project/cost dimensions as applicable.' },
  { id: 'HCM-R18', from: 'HCM-TIMESHEET', predicate: 'contains', to: 'HCM-TIME-ENTRY', cardinality: 'one-to-many', governance: 'Timesheet controls submission/approval; entries remain traceable.' },
  { id: 'HCM-R19', from: 'HCM-ABSENCE', predicate: 'records absence of', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Actual absence is retained separately from request.' },
  { id: 'HCM-R20', from: 'HCM-LEAVE-REQUEST', predicate: 'requested by', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Approval affects availability but remains a separate decision record.' },
  { id: 'HCM-R21', from: 'HCM-COMPENSATION', predicate: 'applies to', to: 'HCM-WORKER-RELATIONSHIP', cardinality: 'many-to-one', governance: 'Compensation terms belong to exact employment/engagement context.' },
  { id: 'HCM-R22', from: 'HCM-PAYROLL-RUN', predicate: 'produces', to: 'HCM-PAYROLL-RESULT', cardinality: 'one-to-many', governance: 'Worker results preserve run/calculation provenance.' },
  { id: 'HCM-R23', from: 'HCM-PAYROLL-RESULT', predicate: 'for', to: 'HCM-WORKER-RELATIONSHIP', cardinality: 'many-to-one', governance: 'Payroll is tied to exact legal/employment context and pay period.' },
  { id: 'HCM-R24', from: 'HCM-PAYROLL-RUN', predicate: 'posts financial effect through', to: 'FIN-JOURNAL', cardinality: 'one-to-zero-or-many', governance: 'Finance owns journals/ledger entries; payroll retains source provenance.' },
  { id: 'HCM-R25', from: 'HCM-EXPENSE-CLAIM', predicate: 'claimed by', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Claimant reuses canonical Person identity.' },
  { id: 'HCM-R26', from: 'HCM-EXPENSE-CLAIM', predicate: 'may settle through', to: 'FIN-PAYMENT', cardinality: 'many-to-zero-or-many', governance: 'Expense approval and payment remain separate records.' },
  { id: 'HCM-R27', from: 'HCM-JOB-APPLICATION', predicate: 'submitted by', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Candidate context never creates a duplicate Person.' },
  { id: 'HCM-R28', from: 'HCM-JOB-APPLICATION', predicate: 'applies to', to: 'HCM-VACANCY', cardinality: 'many-to-one', governance: 'Application and vacancy lifecycle remain separate.' },
  { id: 'HCM-R29', from: 'HCM-EMPLOYMENT-OFFER', predicate: 'offered to', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Offer acceptance does not change Person identity.' },
  { id: 'HCM-R30', from: 'HCM-EMPLOYMENT-OFFER', predicate: 'may create', to: 'HCM-WORKER-RELATIONSHIP', cardinality: 'one-to-zero-or-one', governance: 'Worker Relationship creation is explicit after accepted/valid offer.' },
  { id: 'HCM-R31', from: 'HCM-ONBOARDING', predicate: 'onboards', to: 'HCM-WORKER-RELATIONSHIP', cardinality: 'many-to-one', governance: 'Onboarding coordinates work; relationship remains authoritative employment/engagement context.' },
  { id: 'HCM-R32', from: 'HCM-PERFORMANCE-REVIEW', predicate: 'reviews', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Review evidence does not redefine Person or authorization.' },
  { id: 'HCM-R33', from: 'HCM-LEARNING-PLAN', predicate: 'develops', to: 'HCM-PERSON', cardinality: 'many-to-one', governance: 'Plan is prospective; actual learning/competence evidence stays separate.' },
  { id: 'HCM-R34', from: 'HCM-OFFBOARDING', predicate: 'closes operational context for', to: 'HCM-WORKER-RELATIONSHIP', cardinality: 'many-to-one', governance: 'Relationship end and access/authority revocation are explicit actions with retained history.' }
];

export const peopleHcmBoundaries: PeopleHcmBoundary[] = [
  { name: 'People identity', structure: 'Person → Worker Relationship → Position Assignment', purpose: 'Preserve one human identity across every employment/engagement and organisational move.', mustNotBecome: 'employee / contractor / candidate duplicate person masters' },
  { name: 'Organisation & work', structure: 'Position → Job Profile; Worker ↔ Position; Reporting Relationship', purpose: 'Separate structural seat, reusable work definition and occupant.', mustNotBecome: 'Role Assignment or permission model' },
  { name: 'Competence', structure: 'Skill / Competence Definition → Person Competence ← Credential / Learning evidence', purpose: 'Prove current capability from governed evidence and effectivity.', mustNotBecome: 'training attendance = competence' },
  { name: 'Time & pay', structure: 'Work Pattern / Shift → Attendance / Time Entry → Timesheet → Payroll Result', purpose: 'Keep planned work, observed presence, declared time and pay calculation traceable.', mustNotBecome: 'one mutable hours/pay record' }
];

export const peopleHcmRules = [
  'Person is the canonical human identity; candidate, employee, contractor, learner and claimant are contexts around the same Person.',
  'Worker Relationship captures employment/engagement; Person lifecycle never doubles as employment lifecycle.',
  'Position is an organisational seat, Job Profile is a reusable definition, and Role Assignment is contextual business authority/responsibility; none are interchangeable.',
  'Position occupancy, reporting and workforce allocations are effective-dated relationships with reconstructable history.',
  'Skill and Competence definitions are reusable definitions; Person Competence records assessed/evidenced attainment separately.',
  'Qualification, Licence, Card and Certification use one Person Credential identity pattern with type-specific rules.',
  'Training Course, Training Session and Learning Record are distinct definition, occurrence and evidence layers.',
  'Learning completion never automatically proves competence unless the governed competence rule explicitly allows it.',
  'Worker Availability is a derived projection from work pattern, shifts, leave/absence, allocations and restrictions.',
  'Attendance, Time Entry and Timesheet are separate evidence/transaction layers and corrections preserve history.',
  'Leave Request is planned/requested leave; Absence Record is the actual absence occurrence.',
  'Compensation Arrangement and Pay Element are terms/configuration; Payroll Result is immutable worker-period outcome evidence.',
  'Payslip is controlled Information Container content/representation generated from Payroll Result, not payroll calculation truth.',
  'Payroll financial consequences post through Finance journals/ledger entries without turning finance into the worker/payroll master.',
  'Candidate is a recruitment context of Person; Job Application carries recruitment state and evidence.',
  'Onboarding and Offboarding coordinate work around Worker Relationship but never grant/revoke authority merely by workflow state.',
  'Sensitive workforce, performance, payroll and employee-relations data requires explicit scoped access, audit and retention controls.'
] as const;

export function validatePeopleHcmModel() {
  const ids = new Set(peopleHcmModel.map((item) => item.modelId));
  const relationshipIds = new Set(peopleHcmRelationships.map((rel) => rel.id));
  const external = new Set(['FIN-JOURNAL', 'FIN-PAYMENT']);
  if (ids.size !== peopleHcmModel.length) return false;
  if (relationshipIds.size !== peopleHcmRelationships.length) return false;
  if (peopleHcmModel.some((item) => !item.canonicalName || !item.definition || !item.identityRule || !item.governance.length)) return false;
  if (peopleHcmRelationships.some((rel) => !ids.has(rel.from) && !external.has(rel.from))) return false;
  if (peopleHcmRelationships.some((rel) => !ids.has(rel.to) && !external.has(rel.to))) return false;
  return true;
}
