export type BuildingSafetyRegulatoryKind =
  | 'relationship'
  | 'case'
  | 'event-evidence'
  | 'shared-reference'
  | 'projection'
  | 'controlled-change'
  | 'formal-notice'
  | 'certificate';

export type BuildingSafetyRegulatoryDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: BuildingSafetyRegulatoryKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type BuildingSafetyRegulatoryRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const reg = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: BuildingSafetyRegulatoryKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): BuildingSafetyRegulatoryDefinition => ({
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

export const buildingSafetyRegulatoryModel: BuildingSafetyRegulatoryDefinition[] = [
  reg(
    'REG-DUTYHOLDER-ASSIGNMENT',
    ['BOF-14-001'],
    'Dutyholder Assignment',
    'relationship',
    'Effective statutory/regulatory assignment of a canonical Party to a defined dutyholder role for Building, Project or regulated scope.',
    'Stable assignment identity with role, legal/regulatory basis, scope and effectivity; Party identity remains canonical.',
    [
      'Party',
      'dutyholder role/type',
      'regulated scope',
      'regime/jurisdiction',
      'valid from/to',
      'appointment/basis',
      'acceptance/evidence'
    ],
    ['Proposed', 'Effective', 'Suspended', 'Ended', 'Revoked'],
    [
      'Dutyholder Assignment is not job title, Position, generic Role Assignment or permission.',
      'Legal responsibility can survive workflow reassignment and must remain historically reconstructable.',
      'Protected actions still require separate permission/authority evaluation.'
    ]
  ),

  reg(
    'REG-COMPETENCE-EVIDENCE',
    ['BOF-14-002'],
    'Regulatory Competence Evidence',
    'event-evidence',
    'Attributed evidence demonstrating competence/capability for a defined statutory role, activity or regulated scope.',
    'Immutable evidence occurrence referencing exact Person/Party competence, credential, assessment and organisational evidence used at that time.',
    [
      'subject Party/Person/organisation',
      'role/scope',
      'competence criteria',
      'credentials/assessments',
      'evidence sources',
      'assessor/reviewer',
      'validity'
    ],
    ['Captured', 'Verified', 'Accepted', 'Expired', 'Superseded/Invalidated'],
    [
      'Competence evidence does not create a duplicate Person or Organisation.',
      'Evidence may reference HCM Person Competence/Credentials without becoming those records.',
      'Regulatory acceptance of evidence is separately attributable.'
    ]
  ),

  reg(
    'REG-CASE',
    ['BOF-14-003'],
    'Regulator Case',
    'case',
    'Governed case/context representing interaction with a regulator/statutory authority for a defined regulated subject and regime.',
    'Stable case identity from opening through decisions/closure; applications, inspections, notices and submissions retain separate identities.',
    [
      'regulator/authority',
      'regime/jurisdiction',
      'subject Building/Project/Site',
      'case reference',
      'case type',
      'opened/closed dates',
      'status'
    ],
    [
      'Opened',
      'Active',
      'Awaiting Applicant',
      'Awaiting Regulator',
      'Decision Pending',
      'Closed',
      'Reopened'
    ],
    [
      'Regulator Case does not become Building/Project identity.',
      'External regulator references are alternate identifiers only.',
      'Case closure never erases retained decisions/evidence.'
    ]
  ),

  reg(
    'REG-APPLICATION',
    ['BOF-14-004', 'BOF-14-005'],
    'Regulatory Application',
    'case',
    'Governed application/request submitted for regulatory permission, approval, registration, building control or other statutory process.',
    'Stable application identity with controlled submission iterations and exact basis; Building Control Application is a type.',
    [
      'application type',
      'regulator case',
      'applicant Party',
      'regulated subject',
      'requirements/basis',
      'submitted content',
      'dates',
      'external reference'
    ],
    [
      'Draft',
      'Ready',
      'Submitted',
      'Under Review',
      'More Information Required',
      'Decided',
      'Withdrawn',
      'Closed'
    ],
    [
      'Building Control Application is a Regulatory Application type.',
      'Application state is separate from regulator Decision.',
      'Submitted content/revisions remain immutable/reconstructable.'
    ]
  ),

  reg(
    'REG-CONTROLLED-CHANGE',
    ['BOF-14-006'],
    'Regulatory Controlled Change',
    'controlled-change',
    'Governed regulatory change case for a change whose classification, notification, approval or evidence is controlled by a regulatory regime.',
    'Stable change identity linked to the technical/design change and regulated subject; each regulator interaction/decision remains separate evidence.',
    [
      'regulated subject',
      'source Design Change/technical change',
      'change category',
      'regulatory basis',
      'impact',
      'required route',
      'submission/decision',
      'effectivity'
    ],
    [
      'Raised',
      'Classifying',
      'Notification Required',
      'Approval Required',
      'Submitted',
      'Approved',
      'Rejected',
      'Implemented',
      'Closed',
      'Cancelled'
    ],
    [
      'Regulatory Controlled Change is not Design Change or Commercial Change.',
      'Change classification and decision basis are retained.',
      'Implementation cannot be inferred merely from approval workflow state.'
    ]
  ),

  reg(
    'REG-INSPECTION',
    ['BOF-14-007'],
    'Regulatory Inspection',
    'shared-reference',
    'Regulatory use of the shared QHSE Inspection execution/evidence pattern against statutory criteria.',
    'No separate regulatory-inspection master; the shared Inspection identity carries regulator, requirement and jurisdiction context.',
    [
      'shared Inspection reference',
      'regulator/inspector',
      'regime/requirement',
      'regulated subject',
      'date',
      'observations',
      'result'
    ],
    ['Planned', 'Performed', 'Verified', 'Closed', 'Invalidated'],
    [
      'Regulatory Inspection reuses QHSE Inspection.',
      'Inspection findings are separately governed Regulatory Findings.',
      'Inspector competence/authority context is retained.'
    ]
  ),

  reg(
    'REG-FINDING',
    ['BOF-14-008'],
    'Regulatory Finding',
    'case',
    'Governed regulator finding, observation or noncompliance resulting from inspection, review, application or other statutory assurance activity.',
    'Stable finding identity with exact requirement, evidence, severity, response/action and closure/acceptance history.',
    [
      'source inspection/review/case',
      'requirement',
      'finding type/severity',
      'evidence',
      'responsible Party',
      'response/action',
      'due date',
      'closure evidence'
    ],
    [
      'Open',
      'Response Required',
      'Under Review',
      'Remediation',
      'Ready for Closure',
      'Closed',
      'Withdrawn'
    ],
    [
      'Regulatory Finding is not an Audit Finding or NCR by default, though explicit relationships may exist.',
      'Closure decision and source evidence remain attributable.'
    ]
  ),

  reg(
    'REG-MANDATORY-OCCURRENCE',
    ['BOF-14-009'],
    'Mandatory Occurrence Report',
    'event-evidence',
    'Statutory report/evidence that a qualifying occurrence or condition was reported to the competent authority.',
    'Immutable reporting occurrence identity bound to underlying Incident/condition, threshold/basis, exact submitted content and timestamp.',
    [
      'underlying occurrence/condition',
      'reporting rule',
      'reporter',
      'authority',
      'submitted content/version',
      'submitted at',
      'external reference/acknowledgement'
    ],
    ['Prepared', 'Submitted', 'Acknowledged', 'Follow-up Required', 'Closed'],
    [
      'The report is not the Incident itself.',
      'Reportability determination and evidence remain traceable.',
      'Corrections/follow-ups create new retained submissions/evidence.'
    ]
  ),

  reg(
    'REG-STATUTORY-NOTICE',
    ['BOF-14-010'],
    'Statutory Notice',
    'formal-notice',
    'Formal statutory/regulatory notice issued or received under a defined legal/regulatory power.',
    'Stable notice identity preserving issuer, recipient, legal basis, exact requirements, dates and service evidence.',
    [
      'notice type/reference',
      'issuer',
      'recipient',
      'legal/regulatory basis',
      'requirements/actions',
      'issue/service date',
      'effective/deadline dates',
      'appeal/compliance status'
    ],
    [
      'Prepared',
      'Issued/Served',
      'Effective',
      'Under Appeal',
      'Complied',
      'Withdrawn',
      'Expired',
      'Closed'
    ],
    [
      'Statutory Notice is not a generic correspondence record.',
      'Notice content/service evidence is immutable once issued.',
      'Compliance actions and appeals are separate governed records.'
    ]
  ),

  reg(
    'REG-DECISION',
    ['BOF-14-011'],
    'Regulatory Decision',
    'event-evidence',
    'Immutable decision by a regulator/statutory authority concerning an application, controlled change, case, finding, submission or completion.',
    'Unique decision occurrence bound to exact subject/version, decision maker/body, statutory authority basis, outcome, conditions and time.',
    [
      'subject/version',
      'decision type/outcome',
      'authority/body',
      'regulatory basis',
      'reasons',
      'conditions',
      'decided at',
      'external reference'
    ],
    ['Recorded', 'Superseded', 'Corrected/Appealed'],
    [
      'Regulatory Decision follows shared immutable Decision semantics.',
      'Decision does not itself mutate the Building/Project or submitted information.',
      'Any domain state consequence is applied explicitly with retained decision provenance.'
    ]
  ),

  reg(
    'REG-COMPLETION-EVIDENCE',
    ['BOF-14-012'],
    'Regulatory Completion Evidence',
    'event-evidence',
    'Immutable evidence set demonstrating satisfaction of defined statutory/regulatory completion requirements.',
    'Evidence occurrence/snapshot references exact requirements, inspections, tests, declarations, information revisions and responsible actors.',
    [
      'regulated scope',
      'requirements',
      'inspection/test evidence',
      'declarations',
      'information revisions',
      'dutyholders',
      'compiled/verified at'
    ],
    ['Compiling', 'Submitted', 'Accepted', 'Returned', 'Superseded'],
    [
      'Completion evidence does not become the statutory certificate.',
      'Evidence references authoritative source records rather than copying/retyping truth.',
      'Submitted evidence sets remain reconstructable.'
    ]
  ),

  reg(
    'REG-COMPLETION-CERTIFICATE',
    ['BOF-14-013'],
    'Statutory Completion Certificate',
    'certificate',
    'Formal statutory/regulatory completion certificate for exact regulated scope under a defined regime.',
    'Stable certificate identity preserving authority, statutory basis, scope, issue date, conditions and source decision/evidence.',
    [
      'certificate reference',
      'authority',
      'regime/jurisdiction',
      'regulated subject/scope',
      'issue date',
      'conditions',
      'decision/evidence basis'
    ],
    ['Issued', 'Effective', 'Superseded', 'Revoked/Withdrawn'],
    [
      'Statutory Completion Certificate is distinct from Delivery Completion Certificate.',
      'Certificate is evidence/authority outcome, not Building identity.',
      'Revocation/supersession preserves original certificate history.'
    ]
  ),

  reg(
    'REG-GOLDEN-THREAD',
    ['BOF-14-014'],
    'Golden Thread Information Set',
    'projection',
    'Governed reconstructable information/evidence view over authoritative building-safety records across design, construction, handover and operation.',
    'No single duplicate golden-thread master; the view resolves authoritative canonical objects, exact information revisions, relationships, decisions and evidence as-of a point in time.',
    [
      'regulated Building/scope',
      'dutyholders',
      'requirements',
      'controlled information revisions',
      'changes',
      'inspections/findings',
      'decisions/certificates',
      'asset/safety evidence',
      'as-of time'
    ],
    ['Current View', 'Historic As-of View', 'Submission Snapshot'],
    [
      'Golden Thread is not a folder, PDF or duplicate database of all building information.',
      'Every surfaced fact retains canonical source identity and provenance.',
      'Submission snapshots pin exact source revisions/evidence at submission time.'
    ]
  ),

  reg(
    'REG-SUBMISSION',
    ['BOF-14-015'],
    'Regulatory Submission',
    'shared-reference',
    'Regulatory use of the shared External Submission pattern for exact governed information/evidence sent to a regulator/statutory authority.',
    'No second submission master; each immutable submission pins exact content/revisions, recipient, channel, external reference and time.',
    [
      'subject/application/case',
      'content/revision set',
      'sender',
      'authority/recipient',
      'channel',
      'submitted at',
      'external reference',
      'acknowledgement/status'
    ],
    ['Prepared', 'Submitted', 'Accepted', 'Rejected', 'Failed', 'Superseded'],
    [
      'Regulatory Submission reuses shared External Submission evidence.',
      'A new/corrected submission is a new traceable occurrence.',
      'Submission does not clone Information Containers or Golden Thread source records.'
    ]
  )
];

export const buildingSafetyRegulatoryRelationships: BuildingSafetyRegulatoryRelationship[] = [
  {
    id: 'REG-R01',
    from: 'REG-DUTYHOLDER-ASSIGNMENT',
    predicate: 'assigns',
    to: 'CBO-PARTY',
    cardinality: 'many-to-one',
    governance: 'Dutyholder role references canonical Party identity.'
  },
  {
    id: 'REG-R02',
    from: 'REG-DUTYHOLDER-ASSIGNMENT',
    predicate: 'for regulated subject',
    to: 'BE-BUILDING',
    cardinality: 'many-to-many over time',
    governance: 'Building identity remains persistent across dutyholder changes.'
  },
  {
    id: 'REG-R03',
    from: 'REG-DUTYHOLDER-ASSIGNMENT',
    predicate: 'governed by',
    to: 'REF-REGULATORY-REGIME',
    cardinality: 'many-to-many',
    governance: 'Role applicability/effectivity derives from exact regime/jurisdiction.'
  },
  {
    id: 'REG-R04',
    from: 'REG-COMPETENCE-EVIDENCE',
    predicate: 'may evidence',
    to: 'HCM-PERSON-COMPETENCE',
    cardinality: 'many-to-many',
    governance: 'Regulatory evidence references HCM competence without replacing it.'
  },
  {
    id: 'REG-R05',
    from: 'REG-COMPETENCE-EVIDENCE',
    predicate: 'may reference',
    to: 'HCM-CREDENTIAL',
    cardinality: 'many-to-many',
    governance: 'Credential evidence is reused with exact verification/effectivity.'
  },
  {
    id: 'REG-R06',
    from: 'REG-CASE',
    predicate: 'concerns',
    to: 'BE-BUILDING',
    cardinality: 'many-to-one-or-many',
    governance: 'Case context never recreates Building identity.'
  },
  {
    id: 'REG-R07',
    from: 'REG-CASE',
    predicate: 'contains/coordinates',
    to: 'REG-APPLICATION',
    cardinality: 'one-to-many',
    governance: 'Application lifecycle remains independently governed.'
  },
  {
    id: 'REG-R08',
    from: 'REG-APPLICATION',
    predicate: 'may create',
    to: 'REG-SUBMISSION',
    cardinality: 'one-to-many',
    governance: 'Each submitted package/version is separately evidenced.'
  },
  {
    id: 'REG-R09',
    from: 'REG-CONTROLLED-CHANGE',
    predicate: 'may require',
    to: 'REG-SUBMISSION',
    cardinality: 'one-to-many',
    governance: 'Change submission pins exact technical/change information basis.'
  },
  {
    id: 'REG-R10',
    from: 'REG-INSPECTION',
    predicate: 'may create',
    to: 'REG-FINDING',
    cardinality: 'one-to-many',
    governance: 'Finding is separate from inspection execution evidence.'
  },
  {
    id: 'REG-R11',
    from: 'REG-FINDING',
    predicate: 'belongs to',
    to: 'REG-CASE',
    cardinality: 'many-to-one',
    governance: 'Finding retains exact regulator-case context.'
  },
  {
    id: 'REG-R12',
    from: 'REG-MANDATORY-OCCURRENCE',
    predicate: 'reported within',
    to: 'REG-CASE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Reporting occurrence can relate to regulator case without sharing identity.'
  },
  {
    id: 'REG-R13',
    from: 'REG-STATUTORY-NOTICE',
    predicate: 'issued within',
    to: 'REG-CASE',
    cardinality: 'many-to-one',
    governance: 'Notice remains formal evidence independent of case status.'
  },
  {
    id: 'REG-R14',
    from: 'REG-DECISION',
    predicate: 'decides',
    to: 'REG-APPLICATION',
    cardinality: 'many-to-zero-or-one',
    governance: 'Decision is immutable outcome evidence, not application state.'
  },
  {
    id: 'REG-R15',
    from: 'REG-DECISION',
    predicate: 'may decide',
    to: 'REG-CONTROLLED-CHANGE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Approved/rejected change effect is applied explicitly.'
  },
  {
    id: 'REG-R16',
    from: 'REG-COMPLETION-EVIDENCE',
    predicate: 'supports',
    to: 'REG-COMPLETION-CERTIFICATE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Evidence and certificate remain distinct.'
  },
  {
    id: 'REG-R17',
    from: 'REG-DECISION',
    predicate: 'may authorise issue of',
    to: 'REG-COMPLETION-CERTIFICATE',
    cardinality: 'many-to-zero-or-one',
    governance: 'Certificate retains decision/authority provenance.'
  },
  {
    id: 'REG-R18',
    from: 'REG-GOLDEN-THREAD',
    predicate: 'projects authoritative information for',
    to: 'BE-BUILDING',
    cardinality: 'many-to-one',
    governance: 'Golden Thread view never duplicates the Building.'
  },
  {
    id: 'REG-R19',
    from: 'REG-GOLDEN-THREAD',
    predicate: 'includes exact controlled information from',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance: 'Exact revisions/issues remain authoritative source content.'
  },
  {
    id: 'REG-R20',
    from: 'REG-GOLDEN-THREAD',
    predicate: 'includes',
    to: 'REG-DUTYHOLDER-ASSIGNMENT',
    cardinality: 'many-to-many',
    governance: 'Historical dutyholder effectivity remains reconstructable.'
  },
  {
    id: 'REG-R21',
    from: 'REG-GOLDEN-THREAD',
    predicate: 'includes',
    to: 'REG-CONTROLLED-CHANGE',
    cardinality: 'many-to-many',
    governance: 'Regulated-change history is source-linked.'
  },
  {
    id: 'REG-R22',
    from: 'REG-SUBMISSION',
    predicate: 'may snapshot',
    to: 'REG-GOLDEN-THREAD',
    cardinality: 'many-to-one',
    governance: 'Submission snapshot pins exact as-of source set.'
  },
  {
    id: 'REG-R23',
    from: 'REG-DECISION',
    predicate: 'follows shared decision semantics of',
    to: 'WORK-DECISION',
    cardinality: 'many-to-one-pattern',
    governance: 'Regulatory decision remains domain-typed immutable decision evidence.'
  },
  {
    id: 'REG-R24',
    from: 'REG-SUBMISSION',
    predicate: 'reuses',
    to: 'WORK-EXTERNAL-SUBMISSION',
    cardinality: 'many-to-one-pattern',
    governance: 'Shared submission mechanics/evidence prevent parallel submission engines.'
  }
];

export const buildingSafetyRegulatoryRules = [
  'Building, Project, Site, Party/Person and Information Container identities are reused; regulation never creates parallel masters.',
  'Dutyholder Assignment is statutory accountability context and is distinct from Position, Job Profile, generic Role Assignment, permission and delegated authority.',
  'Competence Evidence references canonical competence/credential evidence and remains attributable to exact regulated role/scope and time.',
  'Building Control Application is a Regulatory Application type, not a separate application engine.',
  'Regulatory Controlled Change is distinct from Design Change and Commercial Change, though it may reference both.',
  'Regulatory Inspection reuses the shared QHSE Inspection identity/evidence pattern.',
  'Mandatory Occurrence Report is reporting evidence linked to an occurrence/condition; it is not the underlying Incident itself.',
  'Regulatory Decision is immutable attributable evidence and domain consequences are applied explicitly.',
  'Statutory Completion Certificate is distinct from Delivery Completion Certificate.',
  'Golden Thread is a governed reconstructable information/evidence set, not one document, folder or duplicate truth store.',
  'Regulatory Submission reuses shared External Submission evidence and pins exact information/evidence versions.',
  'Every historic regulatory view remains interpretable against the exact Regulatory Regime, Jurisdiction and reference/configuration versions applicable at the time.'
] as const;

export function validateBuildingSafetyRegulatoryModel() {
  const ids = new Set(buildingSafetyRegulatoryModel.map((x) => x.modelId));
  const relIds = new Set(buildingSafetyRegulatoryRelationships.map((x) => x.id));
  const external = new Set([
    'CBO-PARTY',
    'BE-BUILDING',
    'REF-REGULATORY-REGIME',
    'HCM-PERSON-COMPETENCE',
    'HCM-CREDENTIAL',
    'CBO-INFORMATION-CONTAINER',
    'WORK-DECISION',
    'WORK-EXTERNAL-SUBMISSION'
  ]);
  if (ids.size !== buildingSafetyRegulatoryModel.length) return false;
  if (relIds.size !== buildingSafetyRegulatoryRelationships.length) return false;
  const candidates = new Set(buildingSafetyRegulatoryModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 15; i += 1)
    if (!candidates.has(`BOF-14-${String(i).padStart(3, '0')}`)) return false;
  if (
    buildingSafetyRegulatoryModel.some(
      (x) => !x.definition || !x.identityRule || !x.governance.length
    )
  )
    return false;
  return buildingSafetyRegulatoryRelationships.every(
    (x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to))
  );
}
