export type ContinuityCrisisSecurityKind =
  | 'event-evidence'
  | 'strategy'
  | 'plan'
  | 'case'
  | 'shared-reference'
  | 'controlled-definition'
  | 'authorization'
  | 'requirement';

export type ContinuityCrisisSecurityDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: ContinuityCrisisSecurityKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type ContinuityCrisisSecurityRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const ccs = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: ContinuityCrisisSecurityKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): ContinuityCrisisSecurityDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance
});

export const continuityCrisisSecurityModel: ContinuityCrisisSecurityDefinition[] = [
  ccs('BCM-BUSINESS-IMPACT-ASSESSMENT', ['BOF-23-001'], 'Business Impact Assessment', 'event-evidence',
    'Dated attributable assessment of disruption impacts, critical activities/services, dependencies and recovery needs for a defined business/operational scope.',
    'Each material assessment occurrence pins exact scope, method, assumptions, participants, dependencies, impact profile and assessment date.',
    ['subject/scope','critical activity/service','impact dimensions','time-to-impact','dependencies/resources','assumptions','assessor/participants','assessed at'],
    ['Draft','Review','Approved','Effective','Superseded','Expired/Invalidated'],
    ['BIA is assessment evidence, not Continuity Plan.', 'Reassessment creates successor evidence rather than overwriting prior impact analysis.', 'Criticality and recovery requirements must remain traceable to exact assessment scope/version.']),

  ccs('BCM-RECOVERY-REQUIREMENT', [], 'Recovery Requirement', 'requirement',
    'Derived/governed requirement expressing recovery objectives and dependencies produced from impact/risk evidence for a critical service/activity or resource.',
    'Stable requirement identity per subject/scope and effective assessment basis, preserving RTO/RPO/MTPD or equivalent thresholds and dependencies.',
    ['subject/service/activity','BIA basis','RTO','RPO','MTPD/maximum tolerable disruption','minimum service level','critical dependencies','owner/effectivity'],
    ['Proposed','Approved','Effective','Superseded','Retired'],
    ['Recovery Requirement is not the Continuity Plan or Disaster Recovery Plan.', 'Thresholds retain source BIA/version provenance.', 'Technology recovery objectives may be consumed by BOF-24 DR planning.']),

  ccs('BCM-CONTINUITY-STRATEGY', ['BOF-23-002'], 'Continuity Strategy', 'strategy',
    'Versioned resilience/continuity strategy selecting approaches to sustain or restore critical activities/services within Recovery Requirements.',
    'Stable strategy identity/version for an enterprise, legal entity, service, site or other governed scope with explicit decision/evidence basis.',
    ['scope','critical services/activities','recovery requirements','strategy options','selected approaches','dependencies/resources','owner','approved version'],
    ['Draft','Review','Approved','Effective','Superseded','Retired'],
    ['Continuity Strategy is not an executable Continuity Plan.', 'Strategy choices retain BIA/Risk/Decision provenance.', 'Technology-specific DR strategies/plans remain within BOF-24 execution context.']),

  ccs('BCM-CONTINUITY-PLAN', ['BOF-23-003'], 'Continuity Plan', 'plan',
    'Versioned actionable business-continuity plan defining activation, roles, workarounds, resources, procedures, communications and recovery steps.',
    'Stable plan identity with immutable approved versions; activations/exercises pin the exact version used.',
    ['scope','activation criteria','recovery requirements','roles/responsibilities','procedures/workarounds','resources/dependencies','communications','contacts','review/test dates'],
    ['Draft','Review','Approved','Effective','Invoked','Superseded','Retired'],
    ['Plan content may be represented through Information Container but the structured plan semantics remain queryable.', 'Invoking a plan creates occurrence evidence rather than mutating the plan into a Crisis.', 'Approved plan versions are immutable.']),

  ccs('BCM-CONTINUITY-EXERCISE', ['BOF-23-004'], 'Continuity Exercise', 'event-evidence',
    'Governed test/exercise occurrence evaluating continuity or recovery arrangements against an exact scenario and plan/version.',
    'Unique exercise occurrence retaining objectives, scenario, participants, exact plans, observations, results and improvement actions.',
    ['exercise type','scenario','plan/version','objectives','participants','scheduled/actual time','observations','results','actions/evidence'],
    ['Planned','Prepared','Executing','Completed','Reviewed','Closed','Cancelled'],
    ['Exercise is evidence, not Plan state.', 'Improvement actions remain separately governed shared actions.', 'A failed exercise never rewrites the tested plan/result history.']),

  ccs('BCM-CRISIS', ['BOF-23-005'], 'Crisis', 'case',
    'Governed crisis-management case coordinating significant disruption/emergency response, command structure, decisions, actions, communications and recovery.',
    'Stable crisis identity independent of Emergency Events, incidents and affected business objects; declaration/stand-down remain attributable decisions/evidence.',
    ['crisis reference/type','declared at/by','trigger/events','affected services/sites/assets/people','command/roles','severity','objectives','status','stand-down'],
    ['Potential','Declared','Mobilising','Responding','Recovering','Stand-down','Review','Closed'],
    ['Crisis is not the Emergency Event itself.', 'Crisis team composition reuses Role/Responsibility Assignments rather than creating duplicate people/teams.', 'Decisions/actions/communications remain separate governed records.']),

  ccs('BCM-EMERGENCY-EVENT', ['BOF-23-006'], 'Emergency Event', 'event-evidence',
    'Immutable evidence of a material emergency/disruptive occurrence affecting people, operations, sites, services, assets or environment.',
    'Unique occurrence identity preserving source, occurred/detected times, location/scope, affected subjects and provenance.',
    ['event type','occurred/detected at','location/scope','affected people/services/assets','initial severity','source/reporting Party','evidence','correction links'],
    ['Recorded','Corrected/Superseded'],
    ['Emergency Event is occurrence evidence, not Crisis case.', 'Specialist QHSE, security, privacy or IT cases may reference the same event without duplicating occurrence facts.', 'Corrections preserve prior evidence.']),

  ccs('BCM-CRISIS-ACTION', ['BOF-23-007'], 'Crisis Action', 'shared-reference',
    'Crisis-context use of the shared Decision Action pattern for accountable response/recovery actions.',
    'No separate crisis-action engine; stable shared action identity retains crisis/event/decision source, owner, due time, status and closure evidence.',
    ['shared action reference','Crisis/Event/Decision source','action','owner','priority','due time','status','closure evidence'],
    ['Open','In Progress','Blocked','Completed','Cancelled'],
    ['Crisis Action reuses shared Decision Action.', 'Work Item may coordinate but does not replace the action.', 'Action completion does not alter immutable source event/decision evidence.']),

  ccs('BCM-CRISIS-COMMUNICATION', ['BOF-23-008'], 'Crisis Communication', 'shared-reference',
    'Crisis/emergency use of the shared Communication Item activity pattern for urgent internal/external communications.',
    'No separate communication master; activity references exact approved/emergency content, audience, channel, priority and delivery evidence.',
    ['Communication Item reference','crisis/event context','content/version','audience','channel','priority','issued at','delivery/acknowledgement evidence'],
    ['Planned','Prepared','Approved/Authorised','Sent/Published','Completed','Cancelled'],
    ['Crisis Communication reuses Communication Item.', 'Message content remains Information Container content.', 'Emergency communication may use exceptional approval paths but authority/evidence must still be retained.']),

  ccs('BCM-DR-INVOCATION', ['BOF-23-009'], 'Disaster Recovery Invocation', 'event-evidence',
    'Governed occurrence invoking an exact technology Disaster Recovery Plan/version in response to disruption or test.',
    'Unique invocation identity with trigger, authority, plan/version, affected technology/services, recovery timings, actions, outcome and evidence.',
    ['DR plan/version','trigger/event/crisis','invoked by/authority','affected services/resources','invoked at','recovery milestones','outcome','evidence'],
    ['Requested','Authorised','Invoked','Recovering','Recovered','Failed/Aborted','Closed'],
    ['Invocation is not Disaster Recovery Plan.', 'BOF-24 owns technology DR Plan semantics.', 'Recovery evidence retains actual timings against requirements without rewriting the plan.']),

  ccs('SEC-PHYSICAL-SECURITY-ZONE', ['BOF-23-010'], 'Physical Security Zone', 'controlled-definition',
    'Governed security-control zone defining protection level and physical-access rules over one or more canonical spatial extents.',
    'Stable security-zone identity/configuration with effective spatial coverage and rules; it does not create a duplicate Site/Space/Zone hierarchy.',
    ['zone code/name','security level','covered spatial extents','access rules','escort/visitor rules','owner','effective dates','status'],
    ['Draft','Approved','Effective','Suspended','Superseded','Retired'],
    ['Security Zone is a control overlay, not geometric/spatial identity.', 'Spatial extents reference canonical Site/Building/Level/Space/Zone.', 'Access rules/effectivity are historically reconstructable.']),

  ccs('SEC-PHYSICAL-ACCESS-CREDENTIAL', ['BOF-23-011','BOF-23-012'], 'Physical Access Credential', 'authorization',
    'Governed physical-access credential/pass authorising a canonical Person/Party for defined security zones and time.',
    'Stable credential issuance identity linked to subject, sponsor/basis, permitted zones, validity, issuer and revocation; Visitor Pass is a credential type.',
    ['subject Person/Party','credential type','sponsor/basis','permitted zones','valid from/to','issuer','credential token/reference','status/revocation'],
    ['Requested','Approved','Issued','Active','Suspended','Revoked','Expired','Returned'],
    ['Credential is authorization, not Person identity.', 'Visitor Pass is a typed credential with visitor/sponsor context.', 'Possessing a credential does not itself prove an access occurrence.']),

  ccs('SEC-PHYSICAL-ACCESS-EVENT', [], 'Physical Access Event', 'event-evidence',
    'Immutable physical-access occurrence such as entry, exit, denial or checkpoint use associated with credential/subject and controlled point/zone.',
    'Unique occurrence identity preserving event time, access point/zone, credential/subject, outcome and source system/evidence.',
    ['occurred at','access point/security zone','credential','subject','event type','outcome/reason','source device/system','evidence'],
    ['Recorded','Corrected/Invalidated'],
    ['Access Event is not credential state.', 'Corrections are append-only.', 'Monitoring/analytics are projections over retained access events.']),

  ccs('SEC-PHYSICAL-SECURITY-INCIDENT', ['BOF-23-013'], 'Physical Security Incident', 'case',
    'Governed physical-security case concerning intrusion, theft, threat/violence, access breach, suspicious activity or other security event.',
    'Stable incident-case identity linked to exact Emergency/Access events, Parties, Sites/Assets, evidence, investigation and response.',
    ['incident type','reported/detected at','Site/Zone/Asset','subjects/Parties','linked events','severity','investigation/evidence','actions/notifications','outcome'],
    ['Reported','Triage','Investigating','Containing/Responding','Recovery','Review','Closed','Unsubstantiated'],
    ['Physical Security Incident is distinct from Cyber Security Incident, Privacy Incident and QHSE Incident while cross-links may share underlying event facts.', 'Restricted access/need-to-know may apply.', 'Investigation findings/actions remain attributable.']),

  ccs('SEC-TRAVEL-RISK-ASSESSMENT', ['BOF-23-014'], 'Travel Risk Assessment', 'shared-reference',
    'Travel-context use of the shared Risk Assessment occurrence pattern.',
    'No separate travel-risk engine; assessment pins Person/Party/journey/destination scope, method, threat/exposure, controls and assessment date.',
    ['shared Risk Assessment','traveller/journey','destination/route','threat/context','controls','residual risk','assessor/date'],
    ['Draft','Reviewed','Approved','Effective','Superseded','Expired'],
    ['Travel Risk Assessment reuses shared Risk Assessment.', 'Travel itinerary/journey data remains in its authoritative source.', 'Reassessment creates new evidence.']),

  ccs('SEC-SECURITY-RISK-ASSESSMENT', ['BOF-23-015'], 'Security Risk Assessment', 'shared-reference',
    'Physical-security context use of the shared Risk Assessment occurrence pattern.',
    'No separate security-risk engine; assessment pins exact Site/Asset/Zone/threat scope, controls, vulnerabilities and assessment method/version.',
    ['shared Risk Assessment','Site/Asset/Zone scope','threats','vulnerabilities','controls','residual risk','assessor/date'],
    ['Draft','Reviewed','Approved','Effective','Superseded','Expired'],
    ['Security Risk Assessment reuses shared Risk Assessment.', 'Enterprise Risk may represent material enduring exposure while assessments remain evidence.', 'Controls/zone configuration remain separately governed.'])
];

export const continuityCrisisSecurityRelationships: ContinuityCrisisSecurityRelationship[] = [
  { id:'CCS-R01', from:'BCM-BUSINESS-IMPACT-ASSESSMENT', predicate:'produces', to:'BCM-RECOVERY-REQUIREMENT', cardinality:'one-to-many', governance:'Recovery objectives retain exact BIA basis/version.' },
  { id:'CCS-R02', from:'BCM-CONTINUITY-STRATEGY', predicate:'satisfies', to:'BCM-RECOVERY-REQUIREMENT', cardinality:'many-to-many', governance:'Strategy choice explicitly maps to required recovery objectives.' },
  { id:'CCS-R03', from:'BCM-CONTINUITY-PLAN', predicate:'implements', to:'BCM-CONTINUITY-STRATEGY', cardinality:'many-to-one-or-many', governance:'Plan execution remains distinct from strategic approach.' },
  { id:'CCS-R04', from:'BCM-CONTINUITY-PLAN', predicate:'must meet', to:'BCM-RECOVERY-REQUIREMENT', cardinality:'many-to-many', governance:'Plan version retains exact requirements/effectivity.' },
  { id:'CCS-R05', from:'BCM-CONTINUITY-EXERCISE', predicate:'tests', to:'BCM-CONTINUITY-PLAN', cardinality:'many-to-one-or-many', governance:'Exercise pins exact plan/version.' },
  { id:'CCS-R06', from:'BCM-CONTINUITY-EXERCISE', predicate:'may create', to:'WORK-FOLLOW-UP-ACTION', cardinality:'one-to-many', governance:'Improvement action remains shared action truth.' },
  { id:'CCS-R07', from:'BCM-CRISIS', predicate:'may be triggered by', to:'BCM-EMERGENCY-EVENT', cardinality:'one-to-many', governance:'Crisis and occurrence evidence remain distinct.' },
  { id:'CCS-R08', from:'BCM-CRISIS', predicate:'may require', to:'WORK-DECISION', cardinality:'one-to-many', governance:'Material command/response decisions use shared immutable Decision evidence.' },
  { id:'CCS-R09', from:'BCM-CRISIS-ACTION', predicate:'reuses', to:'WORK-FOLLOW-UP-ACTION', cardinality:'many-to-one-pattern', governance:'Crisis actions use shared action architecture.' },
  { id:'CCS-R10', from:'BCM-CRISIS-COMMUNICATION', predicate:'reuses', to:'KRC-COMMUNICATION-ITEM', cardinality:'many-to-one-pattern', governance:'Communication execution and content remain shared.' },
  { id:'CCS-R11', from:'BCM-DR-INVOCATION', predicate:'invokes', to:'IT-DISASTER-RECOVERY-PLAN', cardinality:'many-to-one', governance:'Invocation pins exact future BOF-24 DR Plan/version.' },
  { id:'CCS-R12', from:'BCM-DR-INVOCATION', predicate:'may be triggered by', to:'BCM-CRISIS', cardinality:'many-to-zero-or-one', governance:'Technology recovery and enterprise crisis case remain separable.' },
  { id:'CCS-R13', from:'SEC-PHYSICAL-SECURITY-ZONE', predicate:'covers', to:'CBO-SITE', cardinality:'many-to-many', governance:'Security overlay references canonical Site.' },
  { id:'CCS-R14', from:'SEC-PHYSICAL-SECURITY-ZONE', predicate:'may cover', to:'BE-SPACE', cardinality:'many-to-many', governance:'Space identity remains canonical.' },
  { id:'CCS-R15', from:'SEC-PHYSICAL-ACCESS-CREDENTIAL', predicate:'authorises access to', to:'SEC-PHYSICAL-SECURITY-ZONE', cardinality:'many-to-many', governance:'Zone entitlement is explicit and effective-dated.' },
  { id:'CCS-R16', from:'SEC-PHYSICAL-ACCESS-CREDENTIAL', predicate:'issued to', to:'CBO-PARTY', cardinality:'many-to-one', governance:'Credential never becomes Person/Party identity.' },
  { id:'CCS-R17', from:'SEC-PHYSICAL-ACCESS-EVENT', predicate:'uses', to:'SEC-PHYSICAL-ACCESS-CREDENTIAL', cardinality:'many-to-one', governance:'Occurrence retains exact credential/subject context.' },
  { id:'CCS-R18', from:'SEC-PHYSICAL-ACCESS-EVENT', predicate:'occurs in', to:'SEC-PHYSICAL-SECURITY-ZONE', cardinality:'many-to-one-or-many', governance:'Access event and security-zone configuration remain separate.' },
  { id:'CCS-R19', from:'SEC-PHYSICAL-SECURITY-INCIDENT', predicate:'may reference', to:'SEC-PHYSICAL-ACCESS-EVENT', cardinality:'one-to-many', governance:'Incident case preserves source occurrence evidence.' },
  { id:'CCS-R20', from:'SEC-PHYSICAL-SECURITY-INCIDENT', predicate:'may affect', to:'CBO-ASSET', cardinality:'many-to-many', governance:'Asset identity remains whole-life canonical object.' },
  { id:'CCS-R21', from:'SEC-PHYSICAL-SECURITY-INCIDENT', predicate:'may create', to:'WORK-FOLLOW-UP-ACTION', cardinality:'one-to-many', governance:'Response/remediation actions remain separately governed.' },
  { id:'CCS-R22', from:'SEC-TRAVEL-RISK-ASSESSMENT', predicate:'reuses', to:'RISK-ASSESSMENT', cardinality:'many-to-one-pattern', governance:'Travel assessment uses shared enterprise risk-assessment evidence.' },
  { id:'CCS-R23', from:'SEC-SECURITY-RISK-ASSESSMENT', predicate:'reuses', to:'RISK-ASSESSMENT', cardinality:'many-to-one-pattern', governance:'Security assessment uses shared enterprise risk-assessment evidence.' },
  { id:'CCS-R24', from:'SEC-SECURITY-RISK-ASSESSMENT', predicate:'may assess', to:'SEC-PHYSICAL-SECURITY-ZONE', cardinality:'many-to-many', governance:'Zone configuration does not become risk evidence.' },
  { id:'CCS-R25', from:'BCM-BUSINESS-IMPACT-ASSESSMENT', predicate:'may concern', to:'CBO-ASSET', cardinality:'many-to-many', governance:'Critical asset dependencies reference canonical Assets.' },
  { id:'CCS-R26', from:'BCM-CRISIS', predicate:'may affect', to:'CBO-SITE', cardinality:'many-to-many', governance:'Crisis scope references canonical physical context.' }
];

export const continuityCrisisSecurityRules = [
  'Business Impact Assessment, Recovery Requirement, Continuity Strategy and Continuity Plan remain separate assessment, requirement, strategy and execution-plan layers.',
  'Continuity Exercise is an attributable occurrence against exact plan/scenario versions and never overwrites plan history.',
  'Emergency Event is occurrence evidence while Crisis is the coordinated response case; one does not replace the other.',
  'Crisis Action reuses shared Decision Action and Crisis Communication reuses shared Communication Item.',
  'Crisis teams reuse Party, Role Assignment and Responsibility Assignment semantics rather than creating duplicate people/team masters.',
  'Disaster Recovery Invocation is occurrence evidence against BOF-24 Disaster Recovery Plan; business continuity and technology DR remain connected but distinct.',
  'Physical Security Zone is a security-control overlay over canonical spatial extents, never a duplicate Site/Building/Space hierarchy.',
  'Visitor Pass is a Physical Access Credential type; credential authorization is separate from Person identity and from Physical Access Event evidence.',
  'Physical Access Events are immutable occurrence evidence; credentials and zone rules remain configuration/authorization.',
  'Physical Security Incident is distinct from Cyber Security, Privacy and QHSE incident cases while shared underlying Emergency/Access events may be linked.',
  'Travel Risk Assessment and Security Risk Assessment reuse the enterprise Risk Assessment pattern.',
  'Site, Asset, Party, Decision, Action, Communication, Risk and controlled information identities are always reused rather than recreated in continuity/security.'
] as const;

export function validateContinuityCrisisSecurityModel() {
  const ids = new Set(continuityCrisisSecurityModel.map((x) => x.modelId));
  const relIds = new Set(continuityCrisisSecurityRelationships.map((x) => x.id));
  const external = new Set([
    'WORK-FOLLOW-UP-ACTION','WORK-DECISION','KRC-COMMUNICATION-ITEM','IT-DISASTER-RECOVERY-PLAN',
    'CBO-SITE','BE-SPACE','CBO-PARTY','CBO-ASSET','RISK-ASSESSMENT'
  ]);
  if (ids.size !== continuityCrisisSecurityModel.length || relIds.size !== continuityCrisisSecurityRelationships.length) return false;
  const candidates = new Set(continuityCrisisSecurityModel.flatMap((x) => x.candidateKeys));
  for (let i=1;i<=15;i+=1) if (!candidates.has(`BOF-23-${String(i).padStart(3,'0')}`)) return false;
  if (continuityCrisisSecurityModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return continuityCrisisSecurityRelationships.every((x) => (ids.has(x.from)||external.has(x.from)) && (ids.has(x.to)||external.has(x.to)));
}
