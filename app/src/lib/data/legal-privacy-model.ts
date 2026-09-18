export type LegalPrivacyKind =
  | 'case'
  | 'request'
  | 'obligation'
  | 'filing'
  | 'legal-asset'
  | 'preservation-control'
  | 'evidence-collection'
  | 'controlled-information-reference'
  | 'controlled-framework'
  | 'processing-definition'
  | 'event-evidence'
  | 'relationship'
  | 'shared-reference';

export type LegalPrivacyDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: LegalPrivacyKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type LegalPrivacyRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const lp = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: LegalPrivacyKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): LegalPrivacyDefinition => ({ modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance });

export const legalPrivacyModel: LegalPrivacyDefinition[] = [
  lp('LEGAL-MATTER', ['BOF-22-001','BOF-22-008'], 'Legal Matter', 'case',
    'Governed legal case/context linking exact Parties, Contracts, Projects, obligations, advice, disputes, proceedings, filings and evidence.',
    'Stable matter identity independent of the business objects it concerns; external counsel/regulator/matter references are alternate identifiers.',
    ['matter reference/type','subject/scope','Parties','owner/counsel','jurisdiction','related Contracts/Projects','privilege/confidentiality','status'],
    ['Opened','Assessment','Active','On Hold','Resolved','Closed','Reopened'],
    ['Legal Matter never duplicates Party, Contract, Project or regulator-case identity.', 'Regulatory Matter is a Legal Matter type unless a specialist domain owns a more specific regulator case.', 'Privilege/confidentiality and access are explicitly governed.']),

  lp('LEGAL-ADVICE-REQUEST', ['BOF-22-002'], 'Legal Advice Request', 'request',
    'Governed request for legal advice on a defined question, facts, subject/version and jurisdiction.',
    'Stable request identity bound to the exact question and source materials; advice output and resulting decisions/actions remain separate.',
    ['requester','question','facts/context','subject/version','jurisdiction','due date','assigned counsel','source materials'],
    ['Draft','Submitted','Triaged','In Advice','Responded','Closed','Withdrawn'],
    ['Advice Request is not the advice document or Legal Matter itself.', 'Material changes to facts/question create a new governed cycle/version.', 'Legal privilege status is retained separately from generic access.']),

  lp('LEGAL-OBLIGATION', ['BOF-22-003'], 'Legal Obligation', 'obligation',
    'Governed residual legal, court, fiduciary or statutory duty not already represented as Contract Obligation or Regulatory Obligation.',
    'Stable obligation identity with source authority, obligor/subject, beneficiary/authority where relevant, required outcome and effectivity.',
    ['source authority/order/statute','obligor/subject','beneficiary/authority','required outcome','jurisdiction','effective/due dates','status/evidence'],
    ['Captured','Effective','Due','Satisfied','Waived/Discharged','Breached','Superseded','Expired'],
    ['Contract duties remain Contract Obligations and regulatory duties remain Regulatory Obligations.', 'Legal Obligation can drive Compliance Requirements without becoming compliance evidence.', 'Satisfaction/breach remains evidenced and historically reconstructable.']),

  lp('LEGAL-STATUTORY-FILING', ['BOF-22-004'], 'Statutory Filing', 'filing',
    'Governed statutory, corporate-secretariat or registry filing obligation/case with due date, filing content and submission/acceptance evidence.',
    'Stable filing identity per filing type, legal entity/subject and filing period/event; each actual submission is separately evidenced.',
    ['filing type','legal entity/subject','authority/registry','period/event','due date','required content','submission reference','status'],
    ['Planned','Preparing','Ready','Submitted','Accepted','Returned/Rejected','Completed','Overdue','Cancelled'],
    ['Filing is not the submitted file; files are controlled information representations.', 'External submission evidence pins exact content/version and time.', 'Recurring filings create distinct period/event identities.']),

  lp('LEGAL-IP-ASSET', ['BOF-22-005'], 'Intellectual Property Asset', 'legal-asset',
    'Governed intangible legal-right asset such as patent, trademark, registered design, copyright/right, domain or other protectable IP.',
    'Stable IP identity survives ownership, registration, renewal, licence and status changes; external registry identifiers remain alternate identifiers.',
    ['IP type/title','owner Party','creator/inventor where relevant','jurisdiction','application/registration number','filing/registration dates','renewal/expiry','status'],
    ['Proposed','Filed/Created','Pending','Registered/Protected','Licensed','Expired','Lapsed','Abandoned','Transferred'],
    ['IP Asset is not a finance Fixed Asset although finance may reference it.', 'Registry documents/evidence remain controlled information/evidence.', 'Ownership/licence changes preserve history.']),

  lp('LEGAL-DISPUTE', ['BOF-22-006'], 'Dispute', 'case',
    'Governed dispute case between Parties concerning contractual, commercial, property, employment or other legal issues.',
    'Stable dispute identity with Parties, issues/claims, basis, exposure, resolution route and retained settlement/proceeding history.',
    ['Parties','issues/claims','basis','Contract/Project/context','value/exposure','forum/route','owner/counsel','evidence'],
    ['Raised','Negotiation','Formal Dispute','Mediation/Adjudication','Proceeding','Settled','Decided','Closed'],
    ['Dispute is not Contract or Claim identity.', 'A formal Legal Proceeding can arise from a Dispute without replacing it.', 'Settlement and decisions remain attributable evidence.']),

  lp('LEGAL-PROCEEDING', ['BOF-22-007'], 'Legal Proceeding', 'case',
    'Governed court, tribunal, arbitration or other formal litigation/proceeding with forum, pleadings/orders, hearings and outcome.',
    'Stable proceeding identity based on forum/case reference and Parties, linked to underlying matter/dispute but independent from them.',
    ['forum/court/tribunal','case/reference','Parties','claims/issues','jurisdiction','pleadings/orders','hearings/milestones','outcome'],
    ['Pre-Action','Filed','Active','Stayed','Hearing/Trial','Judgment/Award','Appeal','Settled','Closed'],
    ['Legal Proceeding is distinct from Dispute and Legal Matter.', 'Court orders/judgments may create Legal Obligations explicitly.', 'Proceeding evidence is preserved under legal-hold/retention rules.']),

  lp('LEGAL-HOLD', ['BOF-22-009'], 'Legal Hold', 'preservation-control',
    'Governed preservation instruction suspending normal disposition for defined records, objects, custodians, systems or evidence scope.',
    'Stable hold identity with legal basis, scope, authority, effective dates and release; exact held objects are related through Legal Hold Links.',
    ['matter/basis','issued by/authority','custodians','systems/data/record scope','effective date','instructions','release criteria/date'],
    ['Draft','Issued','Active','Amended','Released','Closed'],
    ['Legal Hold is the preservation instruction; Legal Hold Link is the object relationship.', 'Hold does not change source-object identity or content.', 'Release never deletes evidence of the hold period.']),

  lp('LEGAL-EDISCOVERY-COLLECTION', ['BOF-22-010'], 'eDiscovery Collection', 'evidence-collection',
    'Governed evidential collection/snapshot from identified custodians/systems/sources for legal review or production.',
    'Stable collection identity with collection scope, method, source set, hashes/integrity, chain of custody and exports/productions.',
    ['matter/hold','custodians/sources','query/scope','collection method/tool','collected at','manifest/hash','chain of custody','production/export refs'],
    ['Planned','Collecting','Collected','Validated','Processed/Reviewed','Produced','Archived','Invalidated'],
    ['Collection is not the live source dataset.', 'Source provenance and integrity metadata are mandatory.', 'Recollection creates a new traceable collection occurrence.']),

  lp('PRIV-POLICY', ['BOF-22-011'], 'Privacy Policy', 'controlled-information-reference',
    'Privacy-specific controlled Information Container type defining approved privacy policy or notice content.',
    'No separate privacy-document master; stable Information Container identity and revision/issue semantics are reused.',
    ['Information Container reference','policy/notice type','audience','jurisdiction','effective revision','publication/distribution'],
    ['Draft','Review','Approved','Issued','Superseded','Archived'],
    ['Privacy Policy reuses Information Container.', 'Published revision history and exact wording remain reconstructable.', 'Consent evidence references the exact applicable wording/version where relevant.']),

  lp('PRIV-FRAMEWORK', ['BOF-22-012'], 'Privacy Framework', 'controlled-framework',
    'Versioned privacy-governance framework defining principles, roles, accountability, assessment/control requirements and review rules.',
    'Stable framework identity with approved versions/effectivity; processing activities and DPIAs reference the applicable version.',
    ['framework/version','principles','roles/accountability','lawful-basis rules','DPIA thresholds','control requirements','review cycle','effective dates'],
    ['Draft','Review','Approved','Effective','Superseded','Retired'],
    ['Framework is governance/configuration, not a Processing Activity or policy document.', 'Historic assessments retain exact framework/version.', 'Jurisdictional overlays are explicit.']),

  lp('PRIV-PROCESSING-ACTIVITY', ['BOF-22-013'], 'Processing Activity', 'processing-definition',
    'Stable governed definition of how and why personal data is processed, including subjects/data, purpose, lawful basis, recipients, systems/processors, retention, transfers and controls.',
    'One processing identity survives review and controlled change; it is not one runtime processing event or dataset.',
    ['controller/legal entity','purpose','data-subject categories','personal-data categories','lawful basis','recipients/processors','systems/datasets','retention','transfers','controls'],
    ['Draft','Review','Approved','Active','Changed','Suspended','Retired'],
    ['Processing Activity is the governed RoPA-style processing definition, not execution telemetry.', 'Systems/Datasets/Parties are referenced canonically.', 'Material changes preserve change/review history and may trigger DPIA reassessment.']),

  lp('PRIV-DPIA', ['BOF-22-014'], 'Data Protection Impact Assessment', 'event-evidence',
    'Dated/versioned assessment evidence evaluating privacy risk and safeguards for a Processing Activity, project, technology or material change.',
    'Each assessment occurrence preserves scope, threshold decision, risks, controls, consultation, residual risk, approver and exact source versions.',
    ['processing/activity/change scope','trigger/threshold','data flows','risks','controls','residual risk','consultation','decision','assessed/approved at'],
    ['Draft','Consultation','Review','Approved','Actions Required','Superseded','Expired'],
    ['DPIA is assessment evidence, not Processing Activity identity.', 'Reassessment creates successor evidence rather than overwriting the previous assessment.', 'Risks can link to shared Enterprise Risk/Risk Assessment where enterprise treatment is required.']),

  lp('PRIV-CONSENT-EVIDENCE', ['BOF-22-015'], 'Consent Evidence', 'event-evidence',
    'Immutable evidence that a Person/data subject granted, refused or withdrew consent for defined purposes under exact wording/version and context.',
    'Each consent event retains subject identity, purpose, wording/version, channel, timestamp, proof and relationship to prior consent state.',
    ['Person/data subject','purpose','controller','wording/notice version','action grant/refuse/withdraw','channel','occurred at','proof/source'],
    ['Recorded','Verified','Effective','Withdrawn/Superseded','Invalidated'],
    ['Consent is evidence and lawful-basis context, not Person identity.', 'Withdrawal never erases earlier consent evidence.', 'Current consent position is derived from retained valid events.']),

  lp('PRIV-PREFERENCE-EVIDENCE', ['BOF-22-016'], 'Preference Evidence', 'event-evidence',
    'Immutable evidence of a person/customer preference such as communication channel, marketing choice or processing preference.',
    'Each preference change is an event retaining subject, preference type/value, channel, source and timestamp.',
    ['Person/Party','preference type','value','scope/purpose','channel/source','occurred at','evidence'],
    ['Recorded','Effective','Superseded','Invalidated'],
    ['Preference is distinct from Consent unless a legal rule explicitly maps it.', 'Current preference is derived from retained events.', 'Notification Preference configuration may consume this evidence but is not the same object.']),

  lp('PRIV-DATA-SUBJECT-REQUEST', ['BOF-22-017'], 'Data Subject Request', 'case',
    'Governed privacy-rights request/case such as access, deletion, rectification, restriction, objection or portability.',
    'Stable request identity linked to canonical Person/Party, request type and verified scope; searches, decisions, disclosures and actions remain traceable.',
    ['requester/data subject','request type','received at','identity verification','scope','jurisdictions/deadline','search/evidence','decision/response'],
    ['Received','Identity Verification','Scoping','Searching','Review','Response Ready','Responded','Extended','Rejected/Refused','Closed'],
    ['Request is not a generic Work Item.', 'Identity verification and legal exceptions are evidenced.', 'Response/disclosure references exact controlled information/evidence released.']),

  lp('PRIV-INCIDENT', ['BOF-22-018','BOF-22-019'], 'Privacy Incident', 'case',
    'Governed privacy/personal-data incident case covering suspected or actual confidentiality, integrity, availability or unlawful-processing events; Privacy Breach is a classification.',
    'Stable incident identity preserving occurrence facts, affected processing/data/subjects, impact, breach assessment, notifications and remediation.',
    ['incident type','occurred/detected at','Processing Activities/systems','data/categories','affected subjects','impact','breach determination','notifications','remediation'],
    ['Reported','Triage','Investigating','Breach Assessment','Notification','Remediation','Review','Closed'],
    ['Privacy Breach is a Privacy Incident type/classification.', 'Breach determination and notification decision are retained evidence.', 'Cyber/IT incidents may be linked without creating duplicate underlying event facts.']),

  lp('PRIV-INTERNATIONAL-TRANSFER', ['BOF-22-020'], 'International Data Transfer Arrangement', 'relationship',
    'Governed cross-border personal-data transfer relationship/arrangement between exporter/importer and Processing Activity under a defined transfer mechanism.',
    'Stable arrangement identity with Parties, jurisdictions, data/processing scope, mechanism, assessments/safeguards and effectivity.',
    ['exporter/controller','importer/processor','Processing Activity','origin/destination jurisdictions','data categories','transfer mechanism','supplementary safeguards','valid from/to'],
    ['Proposed','Assessed','Approved','Effective','Suspended','Superseded','Ended'],
    ['Arrangement is not one runtime data-transfer event.', 'Parties, systems and datasets retain canonical identity.', 'Mechanism and transfer-risk assessment/version are historically pinned.']),

  lp('PRIV-ASSURANCE-REVIEW', ['BOF-22-021'], 'Privacy Assurance Review', 'shared-reference',
    'Privacy-scoped use of the shared Assurance Review occurrence pattern.',
    'No separate review engine; exact privacy scope, criteria, evidence, findings and review date are retained in the shared Assurance Review.',
    ['shared Assurance Review reference','privacy scope','criteria/framework','evidence','reviewer','findings/outcome'],
    ['Planned','In Review','Reported','Closed','Cancelled'],
    ['Privacy Assurance Review reuses shared Assurance Review.', 'Formal audit work continues to use Audit Engagement.', 'Review findings/remediation remain separately governed.'])
];

export const legalPrivacyRelationships: LegalPrivacyRelationship[] = [
  { id:'LP-R01', from:'LEGAL-ADVICE-REQUEST', predicate:'may belong to', to:'LEGAL-MATTER', cardinality:'many-to-zero-or-one', governance:'Advice remains separately traceable from matter lifecycle.' },
  { id:'LP-R02', from:'LEGAL-DISPUTE', predicate:'may belong to', to:'LEGAL-MATTER', cardinality:'many-to-zero-or-one', governance:'Dispute context does not replace overarching legal matter.' },
  { id:'LP-R03', from:'LEGAL-PROCEEDING', predicate:'may arise from', to:'LEGAL-DISPUTE', cardinality:'many-to-zero-or-one', governance:'Proceeding and dispute retain separate identities.' },
  { id:'LP-R04', from:'LEGAL-PROCEEDING', predicate:'may create', to:'LEGAL-OBLIGATION', cardinality:'one-to-many', governance:'Orders/judgments produce explicit obligations with source provenance.' },
  { id:'LP-R05', from:'LEGAL-STATUTORY-FILING', predicate:'may satisfy', to:'LEGAL-OBLIGATION', cardinality:'many-to-many', governance:'Filing and obligation remain distinct.' },
  { id:'LP-R06', from:'LEGAL-STATUTORY-FILING', predicate:'submitted through', to:'WORK-EXTERNAL-SUBMISSION', cardinality:'one-to-many', governance:'Actual filing submissions pin exact content/version and external evidence.' },
  { id:'LP-R07', from:'LEGAL-HOLD', predicate:'applies through', to:'EVID-LEGAL-HOLD-LINK', cardinality:'one-to-many', governance:'Hold links place exact objects/evidence in preservation scope.' },
  { id:'LP-R08', from:'LEGAL-EDISCOVERY-COLLECTION', predicate:'collected under', to:'LEGAL-HOLD', cardinality:'many-to-zero-or-many', governance:'Collection retains hold/matter provenance.' },
  { id:'LP-R09', from:'PRIV-POLICY', predicate:'reuses', to:'CBO-INFORMATION-CONTAINER', cardinality:'many-to-one-pattern', governance:'Policy content uses canonical controlled-information identity.' },
  { id:'LP-R10', from:'PRIV-PROCESSING-ACTIVITY', predicate:'governed by', to:'PRIV-FRAMEWORK', cardinality:'many-to-one-or-many', governance:'Applicable framework/version is retained.' },
  { id:'LP-R11', from:'PRIV-DPIA', predicate:'assesses', to:'PRIV-PROCESSING-ACTIVITY', cardinality:'many-to-one-or-many', governance:'DPIA remains assessment evidence, not processing identity.' },
  { id:'LP-R12', from:'PRIV-CONSENT-EVIDENCE', predicate:'relates to', to:'PRIV-PROCESSING-ACTIVITY', cardinality:'many-to-zero-or-many', governance:'Consent scope/purpose maps explicitly to processing.' },
  { id:'LP-R13', from:'PRIV-DATA-SUBJECT-REQUEST', predicate:'may concern', to:'PRIV-PROCESSING-ACTIVITY', cardinality:'many-to-many', governance:'Search/scope preserves exact processing context.' },
  { id:'LP-R14', from:'PRIV-INCIDENT', predicate:'may affect', to:'PRIV-PROCESSING-ACTIVITY', cardinality:'many-to-many', governance:'Affected processing scope remains explicit.' },
  { id:'LP-R15', from:'PRIV-INTERNATIONAL-TRANSFER', predicate:'applies to', to:'PRIV-PROCESSING-ACTIVITY', cardinality:'many-to-many', governance:'Transfer arrangement is connected to exact processing purpose/scope.' },
  { id:'LP-R16', from:'PRIV-ASSURANCE-REVIEW', predicate:'reuses', to:'QHSE-ASSURANCE-REVIEW', cardinality:'many-to-one-pattern', governance:'Privacy review uses the shared assurance-review occurrence architecture.' },
  { id:'LP-R17', from:'LEGAL-MATTER', predicate:'may concern', to:'CBO-CONTRACT', cardinality:'many-to-many', governance:'Legal matter references Contract without duplicating it.' },
  { id:'LP-R18', from:'LEGAL-MATTER', predicate:'may concern', to:'CBO-PARTY', cardinality:'many-to-many', governance:'Parties remain canonical identities.' },
  { id:'LP-R19', from:'LEGAL-IP-ASSET', predicate:'owned by', to:'CBO-PARTY', cardinality:'many-to-one-or-many', governance:'IP ownership references canonical Party and preserves history.' },
  { id:'LP-R20', from:'LEGAL-OBLIGATION', predicate:'may drive', to:'COMP-REQUIREMENT', cardinality:'many-to-many', governance:'Compliance requirement remains actionable/testable interpretation of source duty.' }
];

export const legalPrivacyRules = [
  'Legal and privacy objects reference canonical Party, Person, Contract, Project, Information Container, system/dataset and evidence identities rather than duplicating them.',
  'Contract Obligation, Regulatory Obligation and residual Legal Obligation retain their distinct source authority and legal meaning.',
  'Legal Matter is an overarching case/context; Dispute and Legal Proceeding retain separate identities and lifecycles.',
  'Statutory Filing is the governed filing obligation/case; each actual external submission remains immutable submission evidence.',
  'Legal Hold is the preservation instruction while Legal Hold Link is the relationship placing exact records/objects under hold.',
  'eDiscovery Collection is a source-provenance and chain-of-custody snapshot, never the live source dataset.',
  'Privacy Policy reuses controlled Information Container identity and revision/issue semantics.',
  'Processing Activity is a stable governed processing definition, not a runtime event or Dataset.',
  'DPIA is dated assessment evidence and material reassessment creates successor evidence.',
  'Consent Evidence and Preference Evidence remain distinct; withdrawal/change never erases historic events.',
  'Data Subject Request is a privacy-rights case, not a generic workflow item.',
  'Privacy Breach is a Privacy Incident classification based on retained breach assessment and notification evidence.',
  'International Data Transfer Arrangement is an effective relationship/configuration, not one runtime data movement.',
  'Privacy Assurance Review reuses the shared Assurance Review pattern; formal audit work uses Audit Engagement.',
  'Legal privilege, privacy sensitivity, legal holds, retention and need-to-know access are separate governance dimensions and must all be enforceable.'
] as const;

export function validateLegalPrivacyModel() {
  const ids = new Set(legalPrivacyModel.map((x) => x.modelId));
  const relIds = new Set(legalPrivacyRelationships.map((x) => x.id));
  const external = new Set([
    'WORK-EXTERNAL-SUBMISSION','EVID-LEGAL-HOLD-LINK','CBO-INFORMATION-CONTAINER',
    'QHSE-ASSURANCE-REVIEW','CBO-CONTRACT','CBO-PARTY','COMP-REQUIREMENT'
  ]);
  if (ids.size !== legalPrivacyModel.length || relIds.size !== legalPrivacyRelationships.length) return false;
  const candidates = new Set(legalPrivacyModel.flatMap((x) => x.candidateKeys));
  for (let i=1;i<=21;i+=1) if (!candidates.has(`BOF-22-${String(i).padStart(3,'0')}`)) return false;
  if (legalPrivacyModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return legalPrivacyRelationships.every((x) => (ids.has(x.from)||external.has(x.from)) && (ids.has(x.to)||external.has(x.to)));
}
