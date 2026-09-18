export type SiteFieldOperationsKind =
  | 'shared-reference'
  | 'execution-context'
  | 'event-evidence'
  | 'daily-record'
  | 'temporary-works'
  | 'instruction'
  | 'controlled-information'
  | 'case';

export type SiteFieldOperationsDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: SiteFieldOperationsKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type SiteFieldOperationsRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const field = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: SiteFieldOperationsKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): SiteFieldOperationsDefinition => ({
  modelId, candidateKeys, canonicalName, kind, definition, identityRule, keyData, lifecycle, governance
});

export const siteFieldOperationsModel: SiteFieldOperationsDefinition[] = [
  field('FIELD-SITE', ['BOF-12-001'], 'Site', 'shared-reference',
    'Field-operations use of the canonical built-environment Site identity.',
    'No site-only Project/field master is created; the same Site identity is reused throughout delivery, logistics and operations.',
    ['Site reference','Project context','field-operation applicability'], ['Referenced'],
    ['Site identity is owned by the built-environment model.', 'Field status never changes Site identity.']),

  field('FIELD-STAGE', ['BOF-12-002'], 'Delivery Stage Assignment', 'shared-reference',
    'Construction Phase use of the governed Delivery Stage Assignment pattern.',
    'Phase is an effective project-stage assignment using configured stage definitions, not another Project or lifecycle identity.',
    ['Project','stage definition','planned/actual dates','effectivity'], ['Planned','Current','Completed','Skipped','Cancelled'],
    ['Construction Phase reuses Delivery Stage Assignment.', 'Project lifecycle and stage assignment remain separate.']),

  field('FIELD-ZONE', ['BOF-12-003'], 'Zone', 'shared-reference',
    'Field-operations use of canonical spatial/functional Zone.',
    'No construction-only Zone master is created; operational uses reference the built-environment Zone identity.',
    ['Zone reference','Site/spatial context','field applicability'], ['Referenced'],
    ['Zone is spatial/functional context, not WBS or Work Area.', 'Temporary field overlays must not rewrite permanent spatial hierarchy.']),

  field('FIELD-WORK-AREA', ['BOF-12-004'], 'Work Area', 'execution-context',
    'Effective field-execution overlay defining the area in which a package/activity/crew is authorised or planned to work.',
    'Stable Work Area identity/effectivity references Site/Zone/Space/linear extent and delivery scope without becoming permanent spatial identity.',
    ['Site','spatial extent/Zone','Project/WBS/Work Package','description','owner','valid from/to','status'], ['Proposed','Active','Restricted','Closed','Cancelled'],
    ['Work Area is an operational overlay, not Site/Zone/Space identity.', 'It may change as construction progresses without changing permanent built-environment structure.', 'WBS and spatial extent remain orthogonal.']),

  field('FIELD-SITE-ESTABLISHMENT', ['BOF-12-005'], 'Site Establishment Record', 'event-evidence',
    'Attributed evidence that defined site-establishment facilities and controls were established, inspected, changed or removed.',
    'Each occurrence pins Site/Project, establishment scope, exact facilities/controls, actor and timestamp.',
    ['Site/Project','establishment scope','temporary facilities/controls','utilities/access/welfare/security','actor','occurred at','evidence'], ['Recorded','Verified','Corrected/Superseded'],
    ['This is evidence about site establishment, not Site identity.', 'Temporary facilities/assets retain their own identities where governed.', 'Corrections preserve prior evidence.']),

  field('FIELD-MOBILISATION', ['BOF-12-006'], 'Mobilisation Record', 'event-evidence',
    'Attributed mobilisation occurrence recording movement/availability of workforce, plant, temporary facilities or capability to field scope.',
    'Each record identifies exact mobilisation scope, resources, Site/Work Area, timing and source evidence.',
    ['Project/Site','Work Area','mobilisation type','resources/Parties/Assets','planned/actual dates','actor/source','evidence'], ['Planned','Recorded','Verified','Corrected/Superseded'],
    ['Mobilisation does not create Worker, Asset or Site identities.', 'Planned resource allocation and actual mobilisation remain distinct.', 'Demobilisation may be represented by a typed successor occurrence.']),

  field('FIELD-ACCESS-EVENT', ['BOF-12-007'], 'Physical Access Event', 'shared-reference',
    'Site-access use of the shared physical-access occurrence semantics.',
    'An entry, exit, denial or checkpoint occurrence is immutable evidence tied to canonical subject, credential, access point/zone and time.',
    ['subject','credential','Site/access point/security zone','event type','occurred at','outcome','source'], ['Recorded','Corrected/Invalidated'],
    ['Access Event is not Attendance or Time Entry.', 'Credential authorisation and actual access occurrence remain separate.', 'Security/access telemetry remains attributable evidence.']),

  field('FIELD-DAILY-DIARY', ['BOF-12-008'], 'Daily Site Diary', 'daily-record',
    'Governed daily field record summarising conditions, activities and referenced evidence for a Site/Project/day.',
    'One diary identity per governed diary scope/day/version; closing the diary freezes its issued content while corrections are explicit.',
    ['Project/Site','date/shift','weather/conditions','work summary','labour/plant references','deliveries','constraints/events','author','evidence links'], ['Open','Reviewed','Closed/Issued','Corrected/Superseded'],
    ['Diary is an evidence envelope, not replacement truth for Progress, Labour, Plant, Delivery, Incident or other source records.', 'Referenced source records keep their own identity.', 'Closed diary history is retained.']),

  field('FIELD-PROGRESS', ['BOF-12-009'], 'Progress Record', 'shared-reference',
    'Field-originated use of canonical immutable Progress Record evidence.',
    'Progress occurrence pins exact Work Package/Activity/WBS/location scope, as-of date, measure, source and evidence.',
    ['Progress Record reference','work scope','location','as-of date','measure/quantity','source/evidence'], ['Recorded','Validated','Corrected','Superseded'],
    ['Field progress and project-controls progress use one evidence pattern.', 'Current percent/progress is derived from retained records.']),

  field('FIELD-LABOUR', ['BOF-12-010'], 'Field Labour Record', 'event-evidence',
    'Attributed field-operational evidence of labour presence or effort by worker/crew/trade and work scope.',
    'Each occurrence or daily/shift record pins the canonical worker/Party or governed crew basis, work context, hours/units and source.',
    ['Person/Worker/Party','crew/trade','Project/Work Package/Activity','Work Area','date/shift','hours/units','source','evidence'], ['Recorded','Verified','Corrected/Superseded'],
    ['Field Labour Record is not Person/Worker identity.', 'It is distinct from HCM Attendance, Time Entry and payroll truth but may reconcile to them.', 'Subcontract labour remains linked to canonical Parties/people where known.']),

  field('FIELD-PLANT-USAGE', ['BOF-12-011'], 'Plant Usage Record', 'event-evidence',
    'Attributed utilisation occurrence for canonical Plant/Asset against defined field work, location and period.',
    'Each record references the canonical Asset/Plant identity and exact work/time/operator/source context.',
    ['Asset/Plant','operator/Party','Project/Work Package/Activity','Work Area','start/end or duration','meter/usage units','source/evidence'], ['Recorded','Verified','Corrected/Superseded'],
    ['Plant Usage never creates a duplicate Plant/Asset master.', 'Planned allocation and actual usage are separate.', 'Usage evidence can feed cost/productivity/maintenance projections without becoming those ledgers.']),

  field('FIELD-MATERIAL-USAGE', ['BOF-12-012'], 'Inventory Movement', 'shared-reference',
    'Field material consumption/issue use of immutable Inventory Movement.',
    'Posted movement identity captures exact Item, quantity/UOM, traceability, source/destination/custody and work context.',
    ['Inventory Movement reference','Item','quantity/UOM','lot/batch/serial','work/location','movement reason','posted at'], ['Draft','Posted','Reversed/Corrected'],
    ['No separate site material-consumption ledger.', 'Posted movement is corrected by reversal/correction evidence.', 'Cost/accounting effects remain downstream finance truth.']),

  field('FIELD-DELIVERY', ['BOF-12-013'], 'Delivery', 'shared-reference',
    'Field use of logistics Delivery evidence that specified shipment contents reached a Site/work destination.',
    'Delivery occurrence retains Shipment, recipient, date/time, accepted/rejected quantities and proof/exception evidence.',
    ['Delivery reference','Shipment','Site/Work Area','delivered at','recipient','accepted/rejected quantities','proof/exceptions'], ['Recorded','Validated','Corrected/Superseded'],
    ['Delivery is not Goods Receipt where procurement/financial receipt semantics apply.', 'Site logistics booking, shipment and delivery remain distinct.']),

  field('FIELD-TEMPORARY-WORKS-ITEM', ['BOF-12-014'], 'Temporary Works Control Item', 'temporary-works',
    'Governed control/register identity for a temporary works arrangement, need or engineered temporary condition requiring design/check/use controls.',
    'Stable control-item identity survives design revisions, checks, erection/use changes and removal; physical Items/Assets are referenced separately.',
    ['temporary-works reference/type/category','Project/Site/Work Area','description/purpose','design/check category','responsible Parties','status','physical Asset/Item links'], ['Identified','Design Required','Under Design','Checked','Approved for Use','In Use','Modified','Removed','Closed'],
    ['Temporary Works Control Item is not canonical Product/Material Item.', 'It is not permanent Asset identity by default.', 'Design/check/use evidence references exact control item and versions.']),

  field('FIELD-TEMPORARY-WORKS-DESIGN', ['BOF-12-015'], 'Temporary Works Design', 'controlled-information',
    'Temporary-works-specific use of controlled Information Container revision/issue semantics.',
    'No separate design document master; the exact Information Container/revision is linked to the Temporary Works Control Item.',
    ['Information Container/revision','Temporary Works Control Item','designer','design basis','status/issue','effective/use scope'], ['WIP','Review','Approved/Issued','Superseded','Archived'],
    ['Temporary Works Design reuses Information Container.', 'Files are representations only.', 'Checks and field use pin exact issued design revision.']),

  field('FIELD-TEMPORARY-WORKS-CHECK', ['BOF-12-016'], 'Temporary Works Check', 'shared-reference',
    'Temporary-works-specific use of Design Review against an exact design revision and checking category.',
    'One review/check identity records exact design revision, checker/competence/independence, criteria, comments and outcome.',
    ['Design Review reference','Temporary Works Control Item','design revision','check category','checker/competence','criteria','outcome'], ['Planned','In Review','Comments Raised','Complete','Closed'],
    ['Temporary Works Check reuses Design Review.', 'Check outcome does not silently change Information Container status.', 'Independent-check requirements are explicit governance.']),

  field('FIELD-PERMIT', ['BOF-12-017'], 'Permit to Work', 'shared-reference',
    'Field use of shared QHSE Permit to Work authorisation.',
    'One permit identity controls exact work, location/asset, hazards, controls, validity, issuer/receiver and handback.',
    ['Permit reference','work/scope','location/asset','controls','validity','issuer/receiver','isolations','handback'], ['Draft','Ready','Issued','Active','Suspended','Handback','Closed','Cancelled'],
    ['Field operations and QHSE share one Permit identity.', 'Permit is not generic workflow approval.', 'Expired/closed permit never remains implied-active.']),

  field('FIELD-ISOLATION', ['BOF-12-018'], 'Isolation', 'shared-reference',
    'Field use of shared QHSE isolation/lockout control.',
    'One isolation identity records exact system/asset/energy source, points, applied/verified/restored evidence and linkage to work/permit.',
    ['Isolation reference','system/asset/energy source','isolation points','applied/verified by/at','permit/work','restoration'], ['Planned','Applied','Verified','In Force','Released','Restored','Cancelled'],
    ['Field and QHSE share one Isolation identity.', 'Isolation state is not inferred from workflow.', 'Restoration is explicit evidence.']),

  field('FIELD-WORK-INSTRUCTION', ['BOF-12-019'], 'Field Work Instruction', 'instruction',
    'Governed instruction directing execution of defined field work under an identified issuing basis and authority.',
    'Stable instruction identity pins exact work/location/information scope, issuer, issue time, required action and acknowledgement/response.',
    ['instruction reference/type','Project/Work Package/Activity','Work Area','subject/information revision','issuer/authority','issued at','required action/date','acknowledgement/status'], ['Draft','Issued','Acknowledged','In Execution','Completed','Superseded','Cancelled'],
    ['Field Work Instruction is not automatically a contractual Instruction or Commercial Change.', 'Any contractual/time/cost effect is explicitly linked to commercial change processes.', 'Instruction content/version and authority basis are retained.']),

  field('FIELD-DELIVERY-CONSTRAINT', ['BOF-06-025','BOF-12-020'], 'Delivery Constraint', 'case',
    'Governed constraint limiting or blocking delivery work, access, information, resources, sequence or conditions.',
    'Stable constraint identity shared by project controls and field operations with exact scope, source, impact, owner and resolution history.',
    ['constraint type','Project/WBS/Work Package/Activity','Work Area/location','source/basis','description','impact','owner','needed-by','resolution'], ['Identified','Open','Mitigating','Resolved','Closed','Cancelled'],
    ['Field Constraint and project-controls Constraint use one canonical identity.', 'Development Constraint remains a separate land/development concept.', 'Closing a constraint preserves its impact/resolution evidence.']),

  field('FIELD-FORM', ['BOF-12-021'], 'Field Form', 'controlled-information',
    'Field-form/checklist use of controlled Information Container identity, revision and issue semantics.',
    'Form/template and issued/completed controlled record retain exact Information Container revision/provenance rather than becoming an ad-hoc file.',
    ['Information Container','form type/revision','scope','required fields','issuer/completer','issue/completion evidence'], ['Draft','Approved','Issued','Completed','Superseded','Archived'],
    ['Field Form reuses Information Container.', 'Binary/PDF form is a representation.', 'Completed values/evidence must retain exact form revision.']),

  field('FIELD-PHOTOGRAPHIC-EVIDENCE', ['BOF-12-022'], 'Photographic Evidence', 'shared-reference',
    'Photograph-specific use of generic governed Evidence Item.',
    'Evidence identity retains subject/location, capture time, actor/device, content representation, integrity and provenance.',
    ['Evidence Item','subject','Site/Work Area','capture time','actor/device','content/hash','caption/classification','provenance'], ['Captured','Verified','Invalidated/Superseded'],
    ['Photo is evidence, not Asset/Progress/Defect truth by itself.', 'Original capture and integrity metadata are retained.', 'Derived annotations never erase source evidence.']),

  field('FIELD-GEOSPATIAL-EVIDENCE', ['BOF-12-023'], 'Geospatial Evidence', 'shared-reference',
    'Survey/location/geospatial-specific use of generic governed Evidence Item.',
    'Evidence identity retains exact CRS/coordinates/geometry or linear reference, capture method, source, time and integrity provenance.',
    ['Evidence Item','subject','CRS','coordinates/geometry/linear reference','capture method/device','captured at/by','accuracy','content/hash/provenance'], ['Captured','Verified','Invalidated/Superseded'],
    ['Geospatial evidence does not create new Site/Zone/Asset identity.', 'Coordinate reference system and accuracy are explicit.', 'Corrections preserve source evidence/provenance.']),

  field('FIELD-ACTION', ['BOF-12-024'], 'Site Action', 'shared-reference',
    'Field-context use of shared Decision Action for accountable site actions.',
    'No site-only action engine; one shared action identity records source event/decision, owner, due date, status and closure evidence.',
    ['Decision Action reference','site/field source','action','owner','due date','status','closure evidence'], ['Open','In Progress','Blocked','Completed','Cancelled'],
    ['Site Action reuses shared Decision Action.', 'Workflow Work Item may coordinate it but does not replace it.', 'Action completion never rewrites source evidence.']),

  field('FIELD-COMPLETION', ['BOF-12-025'], 'Field Completion Record', 'event-evidence',
    'Attributed evidence that defined field work scope at a location met stated completion criteria at a point in time.',
    'Each completion occurrence pins exact Project/WBS/Work Package/Activity/location, criteria, actor/acceptor, timestamp and supporting evidence.',
    ['Project/WBS/Work Package/Activity','Work Area/location','completion criteria','completed/accepted by','completed at','outstanding items','evidence'], ['Recorded','Reviewed','Accepted','Returned','Corrected/Superseded'],
    ['Field completion is not Project closure, Contract completion, regulatory completion or Handover Acceptance.', 'Outstanding defects/snags remain separate cases.', 'Completion evidence may support downstream readiness/handover.']),

  field('FIELD-HANDOVER-READINESS', ['BOF-12-026'], 'Handover Readiness Record', 'shared-reference',
    'Field-context use of governed readiness evidence against defined handover prerequisites.',
    'Each readiness occurrence pins exact scope, prerequisite/criteria set, outstanding items, assessor, date and evidence.',
    ['Readiness Record reference','handover scope','criteria/prerequisites','completion records','outstanding items','assessor','assessed at','evidence'], ['Captured','Verified','Accepted','Rejected/Invalidated','Superseded'],
    ['Handover readiness reuses the shared readiness-evidence pattern.', 'Readiness is not Handover Acceptance.', 'A later readiness assessment creates new evidence rather than overwriting prior results.'])
];

export const siteFieldOperationsRelationships: SiteFieldOperationsRelationship[] = [
  { id:'FIELD-R01', from:'FIELD-WORK-AREA', predicate:'located within', to:'CBO-SITE', cardinality:'many-to-one', governance:'Work Area references canonical Site.' },
  { id:'FIELD-R02', from:'FIELD-WORK-AREA', predicate:'may overlay', to:'BE-ZONE', cardinality:'many-to-many', governance:'Operational area does not rewrite spatial Zone.' },
  { id:'FIELD-R03', from:'FIELD-WORK-AREA', predicate:'may scope', to:'DEL-WORK-PACKAGE', cardinality:'many-to-many', governance:'Spatial and WBS/work scope remain orthogonal.' },
  { id:'FIELD-R04', from:'FIELD-SITE-ESTABLISHMENT', predicate:'evidences establishment at', to:'CBO-SITE', cardinality:'many-to-one', governance:'Site identity is reused.' },
  { id:'FIELD-R05', from:'FIELD-MOBILISATION', predicate:'mobilises into', to:'FIELD-WORK-AREA', cardinality:'many-to-zero-or-one', governance:'Mobilisation occurrence and work-area context remain separate.' },
  { id:'FIELD-R06', from:'FIELD-ACCESS-EVENT', predicate:'reuses', to:'SEC-PHYSICAL-ACCESS-EVENT', cardinality:'many-to-one-pattern', governance:'Site access uses shared physical-access occurrence semantics.' },
  { id:'FIELD-R07', from:'FIELD-DAILY-DIARY', predicate:'records day for', to:'CBO-SITE', cardinality:'many-to-one', governance:'Diary never replaces Site identity.' },
  { id:'FIELD-R08', from:'FIELD-PROGRESS', predicate:'reuses', to:'DEL-PROGRESS-RECORD', cardinality:'many-to-one-pattern', governance:'One progress-evidence pattern across field and project controls.' },
  { id:'FIELD-R09', from:'FIELD-PROGRESS', predicate:'measures', to:'DEL-WORK-PACKAGE', cardinality:'many-to-one-or-many', governance:'Progress pins exact work scope.' },
  { id:'FIELD-R10', from:'FIELD-LABOUR', predicate:'may reconcile to', to:'HCM-TIME-ENTRY', cardinality:'many-to-many', governance:'Operational and HCM/payroll time evidence remain distinct.' },
  { id:'FIELD-R11', from:'FIELD-PLANT-USAGE', predicate:'uses', to:'CBO-ASSET', cardinality:'many-to-one', governance:'Plant is canonical Asset role/type.' },
  { id:'FIELD-R12', from:'FIELD-MATERIAL-USAGE', predicate:'reuses', to:'INV-MOVEMENT', cardinality:'many-to-one-pattern', governance:'Material consumption posts through inventory movement truth.' },
  { id:'FIELD-R13', from:'FIELD-DELIVERY', predicate:'reuses', to:'LOG-DELIVERY', cardinality:'many-to-one-pattern', governance:'One delivery evidence pattern.' },
  { id:'FIELD-R14', from:'FIELD-TEMPORARY-WORKS-ITEM', predicate:'located in', to:'FIELD-WORK-AREA', cardinality:'many-to-one-or-many', governance:'Temporary works control and operational location remain separate.' },
  { id:'FIELD-R15', from:'FIELD-TEMPORARY-WORKS-DESIGN', predicate:'reuses', to:'CBO-INFORMATION-CONTAINER', cardinality:'many-to-one-pattern', governance:'Design revision/issue is controlled information.' },
  { id:'FIELD-R16', from:'FIELD-TEMPORARY-WORKS-DESIGN', predicate:'defines', to:'FIELD-TEMPORARY-WORKS-ITEM', cardinality:'many-to-one', governance:'Control item identity survives design revisions.' },
  { id:'FIELD-R17', from:'FIELD-TEMPORARY-WORKS-CHECK', predicate:'reuses', to:'INFO-DESIGN-REVIEW', cardinality:'many-to-one-pattern', governance:'Check uses shared technical review semantics.' },
  { id:'FIELD-R18', from:'FIELD-PERMIT', predicate:'reuses', to:'QHSE-PERMIT', cardinality:'many-to-one-pattern', governance:'One permit identity across QHSE and field operations.' },
  { id:'FIELD-R19', from:'FIELD-ISOLATION', predicate:'reuses', to:'QHSE-ISOLATION', cardinality:'many-to-one-pattern', governance:'One isolation identity across QHSE and field operations.' },
  { id:'FIELD-R20', from:'FIELD-WORK-INSTRUCTION', predicate:'directs', to:'DEL-WORK-PACKAGE', cardinality:'many-to-one-or-many', governance:'Instruction references exact delivery scope.' },
  { id:'FIELD-R21', from:'FIELD-DELIVERY-CONSTRAINT', predicate:'constrains', to:'DEL-WORK-PACKAGE', cardinality:'many-to-many', governance:'Constraint and work scope retain independent identities.' },
  { id:'FIELD-R22', from:'FIELD-FORM', predicate:'reuses', to:'CBO-INFORMATION-CONTAINER', cardinality:'many-to-one-pattern', governance:'Field form uses controlled information.' },
  { id:'FIELD-R23', from:'FIELD-PHOTOGRAPHIC-EVIDENCE', predicate:'reuses', to:'EVID-EVIDENCE-ITEM', cardinality:'many-to-one-pattern', governance:'Photo is typed generic evidence.' },
  { id:'FIELD-R24', from:'FIELD-GEOSPATIAL-EVIDENCE', predicate:'reuses', to:'EVID-EVIDENCE-ITEM', cardinality:'many-to-one-pattern', governance:'Geospatial capture is typed generic evidence.' },
  { id:'FIELD-R25', from:'FIELD-ACTION', predicate:'reuses', to:'WORK-FOLLOW-UP-ACTION', cardinality:'many-to-one-pattern', governance:'Site actions use shared enterprise action.' },
  { id:'FIELD-R26', from:'FIELD-COMPLETION', predicate:'completes', to:'DEL-WORK-PACKAGE', cardinality:'many-to-one-or-many', governance:'Completion is evidence against exact scope.' },
  { id:'FIELD-R27', from:'FIELD-HANDOVER-READINESS', predicate:'reuses', to:'OPS-COMMISSIONING-EVIDENCE', cardinality:'many-to-one-pattern', governance:'Readiness uses governed commissioning/handover evidence semantics.' },
  { id:'FIELD-R28', from:'FIELD-HANDOVER-READINESS', predicate:'may use', to:'FIELD-COMPLETION', cardinality:'many-to-many', governance:'Readiness retains exact completion evidence basis.' }
];

export const siteFieldOperationsRules = [
  'Site, Delivery Stage Assignment and Zone are shared canonical context and are never recreated for field operations.',
  'Work Area is a temporary operational overlay and is not permanent spatial hierarchy, WBS or Asset identity.',
  'Site Establishment, Mobilisation, Access, Labour, Plant Usage, Progress, Completion and Readiness are attributable evidence/transactions, not mutable status fields.',
  'Physical Access Event is separate from HCM Attendance/Time Entry and from access credential authorisation.',
  'Daily Site Diary is an evidence envelope that references authoritative source records rather than replacing them.',
  'Field Progress reuses Progress Record; Material Usage reuses Inventory Movement; Delivery Record reuses Delivery.',
  'Field Labour Record is operational evidence and remains distinct from HCM Attendance, Time Entry, Timesheet and payroll results.',
  'Plant Usage references canonical Asset/Plant identity and does not create a site plant master.',
  'Temporary Works Control Item is a governance/register identity, not canonical Product/Material Item and not permanent Asset by default.',
  'Temporary Works Design reuses Information Container and Temporary Works Check reuses Design Review.',
  'Permit to Work and Isolation are shared QHSE controls and never duplicated in a field-only register.',
  'Field Work Instruction does not by itself amend the Contract; commercial/time/cost effects require explicit commercial-change linkage.',
  'Project-controls Constraint and Field Constraint converge on Delivery Constraint; Development Constraint remains a separate land/development concept.',
  'Field Form reuses Information Container; photographic and geospatial evidence reuse Evidence Item with provenance/integrity.',
  'Site Action reuses Decision Action; workflow Work Item remains coordination rather than domain truth.',
  'Field Completion does not equal Project/Contract/regulatory completion or Handover Acceptance.',
  'Handover Readiness is evidence against prerequisites and remains distinct from Handover Acceptance.'
] as const;

export function validateSiteFieldOperationsModel() {
  const ids = new Set(siteFieldOperationsModel.map((x) => x.modelId));
  const relIds = new Set(siteFieldOperationsRelationships.map((x) => x.id));
  const external = new Set([
    'CBO-SITE','BE-ZONE','DEL-STAGE-ASSIGNMENT','DEL-WORK-PACKAGE','DEL-PROGRESS-RECORD',
    'SEC-PHYSICAL-ACCESS-EVENT','HCM-TIME-ENTRY','CBO-ASSET','INV-MOVEMENT','LOG-DELIVERY',
    'CBO-INFORMATION-CONTAINER','INFO-DESIGN-REVIEW','QHSE-PERMIT','QHSE-ISOLATION',
    'EVID-EVIDENCE-ITEM','WORK-FOLLOW-UP-ACTION','OPS-COMMISSIONING-EVIDENCE'
  ]);
  if (ids.size !== siteFieldOperationsModel.length || relIds.size !== siteFieldOperationsRelationships.length) return false;
  const candidates = new Set(siteFieldOperationsModel.flatMap((x) => x.candidateKeys));
  for (let i=1;i<=26;i+=1) {
    const key = 'BOF-12-' + String(i).padStart(3,'0');
    if (!candidates.has(key)) return false;
  }
  if (!candidates.has('BOF-06-025')) return false;
  if (siteFieldOperationsModel.some((x) => !x.definition || !x.identityRule || !x.governance.length)) return false;
  return siteFieldOperationsRelationships.every((x) => (ids.has(x.from)||external.has(x.from)) && (ids.has(x.to)||external.has(x.to)));
}
