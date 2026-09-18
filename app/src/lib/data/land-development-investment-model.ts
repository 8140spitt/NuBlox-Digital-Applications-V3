export type LandDevelopmentInvestmentKind =
  | 'case'
  | 'projection'
  | 'shared-reference'
  | 'event-evidence'
  | 'relationship'
  | 'constraint'
  | 'valuation'
  | 'authorization'
  | 'child'
  | 'obligation-reference';

export type LandDevelopmentInvestmentDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: LandDevelopmentInvestmentKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type LandDevelopmentInvestmentRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const ldi = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: LandDevelopmentInvestmentKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): LandDevelopmentInvestmentDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance
});

export const landDevelopmentInvestmentModel: LandDevelopmentInvestmentDefinition[] = [
  ldi('LDI-DEVELOPMENT-OPPORTUNITY', ['BOF-04-001'], 'Development Opportunity', 'case',
    'Governed land/property development or investment opportunity from initial prospect through qualification, option/acquisition strategy and investment decision.',
    'Stable development-opportunity identity independent of later Property, Contract, Project or acquisition/disposal identities.',
    ['opportunity reference','land/property/site context','development thesis','owner/sponsor','indicative use/scope','value/return range','stage','source'],
    ['Identified','Screening','Evaluating','Securing Control','Investment Decision','Approved','Rejected','On Hold','Converted/Closed'],
    ['Development Opportunity is not CRM Opportunity, Project, Property or Contract identity.', 'One opportunity may cover multiple Parcels/Properties and alternatives.', 'Conversion/approval links downstream identities rather than renaming the opportunity.']),

  ldi('LDI-BUSINESS-CASE', ['BOF-04-002','BOF-04-003'], 'Business Case', 'case',
    'Governed decision-support case defining need/objectives, options, benefits, costs, risks, assumptions, funding and recommendation for investment/development.',
    'Stable case identity with controlled versions/decision cycles; Investment Case is a case type rather than a second architecture.',
    ['case type','sponsor','objectives/need','options','benefits','cost/funding basis','risks','assumptions','recommendation','decision status'],
    ['Draft','Developing','Review','Decision Required','Approved','Rejected','Rework','Superseded','Closed'],
    ['Business Case is not the Decision itself.', 'Investment approval uses shared immutable Decision evidence and applicable authority.', 'Source appraisals/valuations/finance records remain authoritative.']),

  ldi('LDI-DEVELOPMENT-APPRAISAL', ['BOF-04-004'], 'Development Appraisal', 'projection',
    'Versioned or frozen viability/investment appraisal combining exact land cost, development cost, revenue/value, programme, finance and assumption inputs.',
    'Each material appraisal snapshot has its own identity/as-of and pins source versions/assumptions; it never becomes ledger truth.',
    ['scope/scenario','as-of/version','land/acquisition assumptions','cost sources','revenue/value assumptions','programme','finance assumptions','returns/metrics','sensitivity'],
    ['Working','Reviewed','Approved Snapshot','Superseded'],
    ['Development Appraisal is decision support, not a Budget, Estimate, Property Valuation or ledger.', 'Sensitivity/scenario runs preserve assumptions and source versions.', 'Approved snapshots are immutable.']),

  ldi('LDI-LAND-OPTION', ['BOF-04-005'], 'Land Option Agreement', 'shared-reference',
    'Development-context use of canonical Contract for an option or similar agreement granting rights over defined land/property on governed terms.',
    'No separate Option agreement identity: canonical Contract identity carries option-specific type/terms and references exact land/property interests.',
    ['Contract reference','grantor/grantee Parties','land/property scope','option type','exercise window','conditions','price/valuation mechanism','expiry'],
    ['Draft','Executed','Effective','Exercisable','Exercised','Expired','Terminated'],
    ['Option reuses Contract.', 'Option rights do not change Land Parcel or Property identity.', 'Exercise creates explicit downstream acquisition/interest/contract effects rather than mutating the agreement into another object.']),

  ldi('LDI-SITE-APPRAISAL', ['BOF-04-006'], 'Site Appraisal', 'event-evidence',
    'Dated multi-disciplinary assessment evidence of a Site, Land Parcel or Property for development/acquisition suitability.',
    'Each appraisal occurrence pins spatial scope, criteria/method, source evidence, assessor and as-of date.',
    ['Site/Parcel/Property','assessment scope','planning/access/technical/environmental/legal/commercial criteria','source evidence','findings','risks/constraints','assessor','assessed at'],
    ['Draft','Reviewed','Final','Superseded/Invalidated'],
    ['Site Appraisal is not Site or Land Parcel identity.', 'Findings may create Development Constraints/Risks but do not overwrite source evidence.', 'Resulting reports use controlled Information Container.']),

  ldi('LDI-LAND-PARCEL', ['BOF-04-007'], 'Land Parcel', 'shared-reference',
    'Development/acquisition reference to the canonical cadastral Land Parcel from the built-environment spatial model.',
    'One Land Parcel identity survives development opportunities, ownership/occupation changes, projects and transactions.',
    ['canonical parcel reference','geometry/boundary','cadastral/title refs','jurisdiction'],
    ['Proposed','Current','Superseded','Retired'],
    ['BOF-04 reuses BOF-16 Land Parcel.', 'Interests and opportunities are relationships/context around the Parcel.', 'Splits/consolidations preserve predecessor/successor traceability.']),

  ldi('LDI-PROPERTY-INTEREST', ['BOF-04-008','BOF-04-009','BOF-04-010'], 'Property Interest', 'relationship',
    'Effective-dated legal/economic/beneficial interest connecting a canonical Party to a Property or Land Parcel with explicit interest type and source.',
    'Stable relationship identity for one Party, subject property/parcel, interest type/extent and effective period; Ownership and Occupation are types.',
    ['Party','Property/Land Parcel','interest type','tenure/right','share/extent','source instrument/title/lease','valid from/to','registration/reference'],
    ['Proposed','Effective','Suspended/Disputed','Ended','Superseded'],
    ['Ownership and occupation never become fields that redefine Property/Parcel identity.', 'Party identity is reused.', 'Changes/transfers close/supersede relationships and preserve history.']),

  ldi('LDI-DEVELOPMENT-CONSTRAINT', ['BOF-04-011'], 'Development Constraint', 'constraint',
    'Governed condition limiting or shaping land/property development feasibility, scope, timing, use, access or consent.',
    'Stable constraint identity tied to exact spatial/development scope and source/basis; resolution/supersession preserves history.',
    ['constraint type','Site/Parcel/Property/opportunity scope','source/basis','description','severity/impact','owner','resolution/mitigation','effective dates'],
    ['Identified','Assessed','Active','Mitigating','Resolved','Superseded','Accepted'],
    ['Development Constraint is distinct from Project Delivery Constraint.', 'A constraint may predate any Project.', 'Where delivery impact emerges, explicit mapping creates project-control context without merging identities.']),

  ldi('LDI-PROPERTY-VALUATION', ['BOF-04-012'], 'Property Valuation', 'valuation',
    'Professional opinion/assessment of value for a Property, Land Parcel or Property Interest at a valuation date under a stated basis, purpose and assumptions.',
    'Each valuation occurrence/snapshot has an attributable valuer, effective date, subject scope, valuation basis and retained evidence.',
    ['subject Property/Parcel/Interest','valuation date','valuation basis/standard','purpose','assumptions','method','value/currency','valuer','report/evidence'],
    ['Instructed','In Progress','Draft','Final','Superseded/Expired'],
    ['Property Valuation is distinct from contract/payment Valuation in BOF-08.', 'It does not rewrite Property or finance Fixed Asset identity/value automatically.', 'Finance/investment decisions consume it through explicit references.']),

  ldi('LDI-LAND-PROPERTY-SURVEY', ['BOF-04-013'], 'Land / Property Survey', 'event-evidence',
    'Dated survey occurrence over defined land/property/spatial scope, including measured, boundary, condition, topographic, environmental or other survey types.',
    'Each survey occurrence records scope, survey type/method, surveyor, date, source observations and exact resulting information/evidence.',
    ['survey type','Site/Parcel/Property scope','instruction/purpose','method/standard','surveyor Party','survey date','observations','result information'],
    ['Planned','Fieldwork','Processing','Issued','Superseded/Invalidated'],
    ['Survey is evidence/work occurrence, not Land Parcel/Property identity.', 'Reports/models/drawings use Information Container.', 'Boundary/legal changes require explicit governed spatial/legal action rather than survey output alone.']),

  ldi('LDI-PLANNING-APPLICATION', ['BOF-04-014'], 'Planning Application', 'case',
    'Governed application to a planning/development authority for permission/consent concerning an exact proposal and spatial scope.',
    'Stable application identity with authority/reference, proposal/information revisions, submission history, consultation and determination/appeal evidence.',
    ['authority/jurisdiction','application reference/type','applicant Party','Site/Parcel/Property','proposal scope','submitted information revisions','submitted at','status/decision'],
    ['Preparing','Submitted','Validated','Consultation','Assessment','Determined','Appealed','Withdrawn','Closed'],
    ['Application is not the resulting Planning Consent.', 'Submitted information versions are pinned and immutable as-submitted evidence.', 'Changes after submission create governed amendment/revision history.']),

  ldi('LDI-PLANNING-CONSENT', ['BOF-04-015'], 'Planning Consent', 'authorization',
    'Governed planning/development authorization resulting from an authority determination and granting permission under defined scope, conditions and effectivity.',
    'Stable consent identity/reference tied to exact application/proposal/decision, authority, dates and conditions; amendments/supersession preserve history.',
    ['authority','consent/reference/type','application/proposal','Site/Parcel/Property','decision date','effective/expiry dates','approved scope','conditions','appeal/amendment refs'],
    ['Granted','Effective','Partially Discharged','Implemented','Expired','Revoked','Superseded'],
    ['Planning Consent is not generic privacy consent.', 'Consent does not create Project/Property identity.', 'Implementation/compliance is separately evidenced.']),

  ldi('LDI-PLANNING-CONDITION', ['BOF-04-016'], 'Planning Condition', 'child',
    'Binding condition attached to a Planning Consent requiring specified information, action, restriction, trigger or discharge before/through development.',
    'Condition identity is subordinate to one Consent/reference with condition number/text, trigger and discharge/compliance history.',
    ['Planning Consent','condition number','requirement/text','trigger/timing','responsible Party','submission/evidence requirements','discharge decision/status'],
    ['Outstanding','Submitted for Discharge','Partially Discharged','Discharged','Noncompliant','Superseded'],
    ['Planning Condition is not a standalone Plan.', 'Discharge submissions/decisions retain exact evidence and authority provenance.', 'Condition status never overwrites source consent wording.']),

  ldi('LDI-PLANNING-OBLIGATION', ['BOF-04-017'], 'Planning Obligation', 'obligation-reference',
    'Planning-context use of the shared Legal Obligation pattern for binding obligations associated with development, land, consent or authority agreements.',
    'No second obligation architecture; Legal Obligation identity retains source/basis, Parties/authority, scope, effectivity and satisfaction evidence.',
    ['Legal Obligation reference','planning source/basis','Site/Parcel/Property','Parties/authority','required outcome','trigger/due date','satisfaction evidence'],
    ['Captured','Effective','Due','Satisfied','Waived/Discharged','Breached','Superseded'],
    ['Planning Obligation reuses Legal Obligation.', 'Where duty is actually contractual/regulatory, the authoritative source obligation remains that specialised type.', 'Satisfaction is explicit evidence, not a status inferred from project completion.']),

  ldi('LDI-FUNDING-EVIDENCE', ['BOF-04-018','BOF-04-019'], 'Funding Evidence', 'event-evidence',
    'Immutable attributable evidence of funding availability, approval, commitment, award or grant support for a defined development/investment case.',
    'Each evidence occurrence pins funding source/instrument/programme, amount/currency where applicable, beneficiary/scope, conditions, validity and source artefact.',
    ['case/opportunity/project','funding/grant source','Party/issuer','instrument/programme','amount/currency','conditions','effective/expiry dates','source evidence'],
    ['Captured','Verified','Effective','Expired','Superseded/Invalidated'],
    ['Grant Evidence is a Funding Evidence type.', 'Evidence does not itself create a Treasury Facility, Contract or Finance posting.', 'Funding decisions/instruments remain authoritative in their source domains.'])
];

export const landDevelopmentInvestmentRelationships: LandDevelopmentInvestmentRelationship[] = [
  { id:'LDI-R01', from:'LDI-DEVELOPMENT-OPPORTUNITY', predicate:'may concern', to:'LDI-LAND-PARCEL', cardinality:'many-to-many', governance:'Opportunity context never recreates parcel identity.' },
  { id:'LDI-R02', from:'LDI-DEVELOPMENT-OPPORTUNITY', predicate:'may concern', to:'BE-PROPERTY', cardinality:'many-to-many', governance:'Property identity is reused.' },
  { id:'LDI-R03', from:'LDI-BUSINESS-CASE', predicate:'supports decision on', to:'LDI-DEVELOPMENT-OPPORTUNITY', cardinality:'many-to-one-or-many', governance:'Case and opportunity retain separate identities.' },
  { id:'LDI-R04', from:'LDI-BUSINESS-CASE', predicate:'may use', to:'LDI-DEVELOPMENT-APPRAISAL', cardinality:'many-to-many', governance:'Exact appraisal version/snapshot is retained.' },
  { id:'LDI-R05', from:'LDI-DEVELOPMENT-APPRAISAL', predicate:'may use', to:'LDI-PROPERTY-VALUATION', cardinality:'many-to-many', governance:'Property valuation remains independent professional evidence.' },
  { id:'LDI-R06', from:'LDI-LAND-OPTION', predicate:'reuses', to:'CBO-CONTRACT', cardinality:'many-to-one-pattern', governance:'Land Option is a Contract type/context.' },
  { id:'LDI-R07', from:'LDI-LAND-OPTION', predicate:'applies to', to:'LDI-LAND-PARCEL', cardinality:'many-to-many', governance:'Land rights reference exact parcels.' },
  { id:'LDI-R08', from:'LDI-PROPERTY-INTEREST', predicate:'held by', to:'CBO-PARTY', cardinality:'many-to-one', governance:'Party identity remains canonical.' },
  { id:'LDI-R09', from:'LDI-PROPERTY-INTEREST', predicate:'over', to:'LDI-LAND-PARCEL', cardinality:'many-to-zero-or-many', governance:'Parcel identity is not owned by the relationship.' },
  { id:'LDI-R10', from:'LDI-PROPERTY-INTEREST', predicate:'over', to:'BE-PROPERTY', cardinality:'many-to-zero-or-many', governance:'Property identity is stable through interest changes.' },
  { id:'LDI-R11', from:'LDI-SITE-APPRAISAL', predicate:'assesses', to:'CBO-SITE', cardinality:'many-to-zero-or-one', governance:'Site appraisal preserves exact scope/date.' },
  { id:'LDI-R12', from:'LDI-SITE-APPRAISAL', predicate:'may identify', to:'LDI-DEVELOPMENT-CONSTRAINT', cardinality:'one-to-many', governance:'Constraint is separately governed from assessment evidence.' },
  { id:'LDI-R13', from:'LDI-PROPERTY-VALUATION', predicate:'values', to:'BE-PROPERTY', cardinality:'many-to-zero-or-one', governance:'Valuation is an occurrence, not Property state.' },
  { id:'LDI-R14', from:'LDI-PROPERTY-VALUATION', predicate:'may value', to:'LDI-PROPERTY-INTEREST', cardinality:'many-to-zero-or-one', governance:'Interest scope/basis is explicit.' },
  { id:'LDI-R15', from:'LDI-LAND-PROPERTY-SURVEY', predicate:'surveys', to:'LDI-LAND-PARCEL', cardinality:'many-to-zero-or-many', governance:'Survey result does not mutate parcel boundary automatically.' },
  { id:'LDI-R16', from:'LDI-LAND-PROPERTY-SURVEY', predicate:'produces', to:'CBO-INFORMATION-CONTAINER', cardinality:'one-to-many', governance:'Reports/drawings/models use controlled information identity.' },
  { id:'LDI-R17', from:'LDI-PLANNING-APPLICATION', predicate:'applies for consent over', to:'LDI-LAND-PARCEL', cardinality:'many-to-many', governance:'Application references exact spatial scope.' },
  { id:'LDI-R18', from:'LDI-PLANNING-APPLICATION', predicate:'results in', to:'LDI-PLANNING-CONSENT', cardinality:'one-to-zero-or-many', governance:'Consent is separate authority outcome/identity.' },
  { id:'LDI-R19', from:'LDI-PLANNING-CONSENT', predicate:'contains', to:'LDI-PLANNING-CONDITION', cardinality:'one-to-many', governance:'Condition wording/history remains subordinate to consent.' },
  { id:'LDI-R20', from:'LDI-PLANNING-OBLIGATION', predicate:'reuses', to:'LEGAL-OBLIGATION', cardinality:'many-to-one-pattern', governance:'Planning obligation uses shared legal-obligation architecture.' },
  { id:'LDI-R21', from:'LDI-FUNDING-EVIDENCE', predicate:'supports', to:'LDI-BUSINESS-CASE', cardinality:'many-to-many', governance:'Funding evidence and business case remain independent.' },
  { id:'LDI-R22', from:'LDI-BUSINESS-CASE', predicate:'resolved by', to:'WORK-DECISION', cardinality:'one-to-many', governance:'Investment/governance approval is immutable shared Decision evidence.' },
  { id:'LDI-R23', from:'LDI-DEVELOPMENT-OPPORTUNITY', predicate:'may create', to:'CBO-PROJECT', cardinality:'one-to-zero-or-many', governance:'Approved development creates/links Projects without changing opportunity identity.' },
  { id:'LDI-R24', from:'LDI-DEVELOPMENT-OPPORTUNITY', predicate:'may create/acquire', to:'BE-PROPERTY', cardinality:'one-to-zero-or-many', governance:'Property identity remains separate from opportunity.' }
];

export const landDevelopmentInvestmentRules = [
  'Development and acquisition reuse canonical Site, Land Parcel, Property, Party, Contract and Project identities rather than creating a development-specific estate model.',
  'Development Opportunity is distinct from CRM Opportunity, Project and Property.',
  'Investment Case is a Business Case type; Business Case is not the approval Decision.',
  'Development Appraisal is a versioned/frozen decision-support projection and never becomes Finance ledger, Estimate or Property Valuation truth.',
  'Land/development Option reuses canonical Contract identity with option-specific terms and land/property scope.',
  'Site Appraisal and Survey are dated evidence/assessment occurrences around stable spatial identities.',
  'Ownership Interest and Occupation Interest are typed Property Interest relationships, not Party or Property master attributes.',
  'Development Constraint is distinct from Project Delivery Constraint; explicit mapping carries a constraint into delivery controls where necessary.',
  'Property Valuation is distinct from BOF-08 contract/payment Valuation and does not automatically rewrite accounting values.',
  'Planning Application is the request/case; Planning Consent is the authority outcome/authorization; Planning Condition is subordinate to the Consent.',
  'Planning Obligation reuses shared Legal Obligation semantics and preserves its actual legal/regulatory/contractual source basis.',
  'Grant Evidence is a Funding Evidence type; evidence never creates finance postings or treasury/funding instruments by itself.',
  'Material investment/acquisition decisions use shared immutable Decision evidence and evaluated authority/delegated-authority rules.'
] as const;

export function validateLandDevelopmentInvestmentModel() {
  const ids = new Set(landDevelopmentInvestmentModel.map((x) => x.modelId));
  const relIds = new Set(landDevelopmentInvestmentRelationships.map((x) => x.id));
  const external = new Set([
    'BE-PROPERTY','CBO-CONTRACT','CBO-PARTY','CBO-SITE','CBO-INFORMATION-CONTAINER',
    'LEGAL-OBLIGATION','WORK-DECISION','CBO-PROJECT'
  ]);
  if (ids.size !== landDevelopmentInvestmentModel.length || relIds.size !== landDevelopmentInvestmentRelationships.length) return false;
  const candidates = new Set(landDevelopmentInvestmentModel.flatMap((x) => x.candidateKeys));
  for (let i=1;i<=19;i+=1) if (!candidates.has(`BOF-04-${String(i).padStart(3,'0')}`)) return false;
  if (landDevelopmentInvestmentModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return landDevelopmentInvestmentRelationships.every((x) => (ids.has(x.from)||external.has(x.from)) && (ids.has(x.to)||external.has(x.to)));
}
