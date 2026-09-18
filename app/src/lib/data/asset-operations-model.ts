export type AssetOperationsKind =
  | 'plan'
  | 'controlled-definition'
  | 'work'
  | 'event-evidence'
  | 'case'
  | 'relationship'
  | 'agreement'
  | 'package'
  | 'account'
  | 'projection';

export type AssetOperationsDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: AssetOperationsKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type AssetOperationsRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type AssetOperationsBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const assetOperationsModel: AssetOperationsDefinition[] = [
  {
    modelId: 'OPS-COMMISSIONING-PLAN',
    candidateKeys: ['BOF-15-001'],
    canonicalName: 'Commissioning Plan',
    kind: 'plan',
    definition:
      'A governed plan defining commissioning scope, sequence, responsibilities, evidence, witness requirements and acceptance criteria for Systems, Assets and associated works.',
    identityRule:
      'Stable plan identity with controlled baselines/revisions; changes do not recreate the Systems or Assets being commissioned.',
    scope: ['project', 'system', 'asset', 'contract/package'],
    keyData: [
      'plan number/version',
      'scope',
      'systems/assets',
      'activities',
      'acceptance criteria',
      'witness requirements',
      'responsibilities'
    ],
    lifecycle: ['Draft', 'Review', 'Approved', 'Current', 'Superseded', 'Closed'],
    governance: [
      'Commissioning plan is not a Schedule or Project stage.',
      'Commissioning System reuses the canonical System identity.',
      'Approved baselines remain historically reconstructable.'
    ]
  },
  {
    modelId: 'OPS-COMMISSIONING-ACTIVITY',
    candidateKeys: ['BOF-15-003'],
    canonicalName: 'Commissioning Activity',
    kind: 'work',
    definition:
      'A planned and executed commissioning task against a governed System, Asset or configuration with explicit prerequisites, evidence and acceptance criteria.',
    identityRule:
      'Stable activity identity scoped to a Commissioning Plan; retries/retests retain relationship to the original activity.',
    scope: ['commissioning plan', 'system/asset', 'project'],
    keyData: [
      'activity reference',
      'subject',
      'procedure',
      'prerequisites',
      'planned/actual dates',
      'responsibility',
      'status'
    ],
    lifecycle: [
      'Planned',
      'Ready',
      'In Progress',
      'Awaiting Witness',
      'Completed',
      'Failed',
      'Cancelled'
    ],
    governance: [
      'Commissioning Activity is not a Schedule Activity by identity, although it may be linked to one.',
      'Execution results are immutable evidence records.',
      'Retest does not erase the failed or earlier execution.'
    ]
  },
  {
    modelId: 'OPS-WITNESS-REQUIREMENT',
    candidateKeys: ['BOF-15-004'],
    canonicalName: 'Witness Requirement',
    kind: 'controlled-definition',
    definition:
      'A governed requirement that a defined Party/role witness, hold, review or accept a commissioning/test activity before progression.',
    identityRule:
      'Stable requirement identity/effectivity linked to the applicable plan, activity, contract or assurance basis.',
    scope: ['commissioning plan/activity', 'contract', 'quality/assurance context'],
    keyData: [
      'requirement type',
      'witnessing role/party',
      'notice period',
      'acceptance criteria',
      'applicability'
    ],
    lifecycle: ['Proposed', 'Approved', 'Effective', 'Satisfied', 'Waived', 'Superseded'],
    governance: [
      'Witness requirement is not evidence that witnessing occurred.',
      'Actual attendance/acceptance is captured as execution evidence.',
      'Waiver requires attributed authority and retained reason.'
    ]
  },
  {
    modelId: 'OPS-COMMISSIONING-EVIDENCE',
    candidateKeys: [
      'BOF-15-005',
      'BOF-15-006',
      'BOF-15-007',
      'BOF-15-009',
      'BOF-15-010',
      'BOF-15-011'
    ],
    canonicalName: 'Commissioning Evidence',
    kind: 'event-evidence',
    definition:
      'Immutable attributed evidence produced by commissioning execution, including test/inspection results, balancing records, retests, readiness records and commissioning certificates.',
    identityRule:
      'Each evidence record has immutable identity and points to the exact activity, System/Asset, procedure, actors, measurements and source information used.',
    scope: ['commissioning activity', 'system/asset', 'project/contract'],
    keyData: [
      'evidence type',
      'subject',
      'activity',
      'result/outcome',
      'measurements',
      'actor/witness',
      'timestamp',
      'source attachments/containers'
    ],
    lifecycle: ['Captured', 'Verified', 'Accepted', 'Rejected/Invalidated', 'Superseded'],
    governance: [
      'Retest creates new evidence and never overwrites prior failed evidence.',
      'Commissioning Certificate is evidence of an acceptance/certification decision, not a new Asset identity.',
      'Measurements retain units, method, calibration/provenance where relevant.'
    ]
  },
  {
    modelId: 'OPS-HANDOVER-PACKAGE',
    candidateKeys: ['BOF-15-012'],
    canonicalName: 'Handover Package',
    kind: 'package',
    definition:
      'A governed completion/handover assembly that references the exact Assets, Systems, deliverables, evidence, outstanding items and acceptance scope being transferred.',
    identityRule:
      'Stable package identity; package membership references canonical objects and information revisions rather than copying them.',
    scope: ['project', 'contract/package', 'facility/system/asset'],
    keyData: [
      'package number',
      'handover scope',
      'systems/assets',
      'required deliverables',
      'evidence set',
      'outstanding items',
      'recipient'
    ],
    lifecycle: ['Preparing', 'Ready for Review', 'Submitted', 'Accepted', 'Returned', 'Closed'],
    governance: [
      'Handover package is not a folder of uncontrolled files.',
      'Membership records exact versions/evidence included at handover.',
      'Acceptance transfers stewardship/status but does not recreate Asset or System identity.'
    ]
  },
  {
    modelId: 'OPS-HANDOVER-ACCEPTANCE',
    candidateKeys: ['BOF-15-017', 'BOF-15-019'],
    canonicalName: 'Handover Acceptance',
    kind: 'event-evidence',
    definition:
      'An attributable acceptance/closeout decision evidencing that a defined handover scope was accepted, conditionally accepted, returned or rejected.',
    identityRule:
      'Immutable decision/evidence identity linked to the Handover Package, authority, conditions and exact acceptance timestamp.',
    scope: ['handover package', 'project/contract', 'facility/system/asset'],
    keyData: [
      'decision',
      'accepting party/authority',
      'date',
      'conditions/reservations',
      'outstanding items',
      'evidence basis'
    ],
    lifecycle: ['Recorded', 'Effective', 'Superseded/Revoked'],
    governance: [
      'Closeout evidence is retained as part of the acceptance/closure evidence chain.',
      'Conditional acceptance does not silently close outstanding defects or obligations.',
      'Project closure and operational Asset lifecycle remain separate.'
    ]
  },
  {
    modelId: 'OPS-MAINTENANCE-STRATEGY',
    candidateKeys: ['BOF-17-001'],
    canonicalName: 'Maintenance Strategy',
    kind: 'plan',
    definition:
      'A governed strategy defining maintenance policy, criticality approach, preventive/predictive/reactive tactics and service objectives for an asset portfolio or class.',
    identityRule:
      'Stable strategy identity with controlled versions/effectivity; it guides plans without becoming an Asset master.',
    scope: ['estate/facility/network', 'asset/system class', 'operating organisation'],
    keyData: [
      'strategy code/version',
      'scope',
      'maintenance policy',
      'criticality/tactics',
      'service objectives',
      'effectivity'
    ],
    lifecycle: ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: [
      'Strategy is policy/planning, not executable work.',
      'Different asset classes may share a strategy without losing individual Asset identity.',
      'Changes are effective-dated/versioned.'
    ]
  },
  {
    modelId: 'OPS-MAINTENANCE-PLAN',
    candidateKeys: ['BOF-17-002', 'BOF-17-004', 'BOF-17-031'],
    canonicalName: 'Maintenance Plan',
    kind: 'plan',
    definition:
      'A governed asset/system maintenance plan combining task templates, frequencies/triggers, schedule logic and lifecycle replacement actions.',
    identityRule:
      'Stable plan identity; Maintenance Schedule and Lifecycle Replacement Plan are controlled planning views/parts of the same governed maintenance-planning architecture.',
    scope: ['asset/system', 'facility/network', 'maintenance strategy'],
    keyData: [
      'plan number/version',
      'subject assets/systems',
      'task templates',
      'trigger/frequency',
      'schedule',
      'replacement actions'
    ],
    lifecycle: ['Draft', 'Approved', 'Active', 'Suspended', 'Superseded', 'Closed'],
    governance: [
      'Maintenance schedule is not the Project delivery Schedule.',
      'Plan revisions do not rewrite completed work history.',
      'Condition/usage-based triggers may generate work without creating duplicate plans.'
    ]
  },
  {
    modelId: 'OPS-TASK-TEMPLATE',
    candidateKeys: ['BOF-17-003'],
    canonicalName: 'Maintenance Task Template',
    kind: 'controlled-definition',
    definition:
      'A reusable controlled definition of maintenance work steps, skills, permits, tools, parts, durations, evidence and acceptance criteria.',
    identityRule:
      'Stable template identity/version; generated Work Orders reference the exact effective template version.',
    scope: ['asset/item/type', 'maintenance strategy/plan', 'jurisdiction/site'],
    keyData: [
      'template number/version',
      'applicable asset types',
      'steps',
      'resources',
      'parts',
      'safety controls',
      'acceptance evidence'
    ],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Retired'],
    governance: [
      'Task Template is a definition, not an execution record.',
      'Completed Work Orders retain the template version actually used.',
      'Safety/permit requirements link to authoritative assurance records rather than being copied free text.'
    ]
  },
  {
    modelId: 'OPS-WORK-ORDER',
    candidateKeys: ['BOF-17-005'],
    canonicalName: 'Work Order',
    kind: 'work',
    definition:
      'A governed authorization and execution record for maintenance, repair, inspection, replacement or service work against a canonical Asset/System/location.',
    identityRule:
      'Stable Work Order identity from request/planning through execution and closeout; completed work is never replaced by current Asset state.',
    scope: ['asset/system', 'facility/site', 'service case/contract', 'maintenance plan'],
    keyData: [
      'work-order number',
      'work type',
      'subject',
      'priority',
      'responsibility',
      'planned/actual dates',
      'resources/parts',
      'completion evidence'
    ],
    lifecycle: [
      'Requested',
      'Planned',
      'Released',
      'In Progress',
      'Paused',
      'Completed',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'Work Order is operational work, not a workflow approval task or Project Schedule Activity.',
      'Parts consumption posts inventory events; it is not maintained as an isolated editable total.',
      'Closeout preserves labour, parts, findings, measurements and acceptance evidence.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-REQUEST',
    candidateKeys: ['BOF-17-006', 'BOF-17-027'],
    canonicalName: 'Service Request',
    kind: 'case',
    definition:
      'A governed intake record for a requested maintenance, facilities, operational or service outcome from a customer, occupant, user, sensor or internal source.',
    identityRule:
      'Stable request identity; Facilities Request is a typed Service Request rather than a separate request engine.',
    scope: ['customer/occupant', 'facility/space', 'asset/system', 'service organisation'],
    keyData: [
      'request number/type',
      'requester/source',
      'subject/location',
      'description',
      'priority',
      'requested-by date',
      'channel'
    ],
    lifecycle: [
      'New',
      'Triaged',
      'Accepted',
      'Rejected',
      'Converted/Assigned',
      'Resolved',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'Request intake is separate from Service Case and Work Order execution.',
      'Sensor-generated requests retain source telemetry/event provenance.',
      'SLA clocks derive from the applicable entitlement/agreement rather than being hard-coded into the request.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-CASE',
    candidateKeys: ['BOF-17-007'],
    canonicalName: 'Service Case',
    kind: 'case',
    definition:
      'A governed case coordinating diagnosis, communication, entitlement, work, parts, appointments, decisions and closure for a service outcome.',
    identityRule:
      'Stable case identity independent of individual requests, Work Orders, visits or correspondence.',
    scope: ['customer/party', 'asset/system/facility', 'service contract/entitlement'],
    keyData: [
      'case number',
      'subject',
      'customer/party',
      'entitlement',
      'priority/severity',
      'owner',
      'linked work/appointments'
    ],
    lifecycle: [
      'Open',
      'Investigating',
      'Action Required',
      'Awaiting Customer/Parts',
      'Resolved',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'One case may coordinate multiple Work Orders or Field Visits.',
      'Case status does not overwrite Asset condition or Work Order status.',
      'Communication and decisions remain attributable/auditable.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-LEVEL',
    candidateKeys: ['BOF-17-009', 'BOF-17-010'],
    canonicalName: 'Service Entitlement & SLA',
    kind: 'agreement',
    definition:
      'Effective service entitlement and service-level commitments governing coverage, response/resolution targets, exclusions, priority and remedies for a Party, Asset, location or service.',
    identityRule:
      'Stable entitlement/SLA identity or relationship linked to canonical Contract/Party/Asset context; commercial entitlement remains semantically separate.',
    scope: ['service contract', 'party/customer', 'asset/facility', 'service offering'],
    keyData: [
      'coverage',
      'service hours',
      'response target',
      'resolution target',
      'priority rules',
      'exclusions',
      'validity'
    ],
    lifecycle: ['Draft', 'Active', 'Suspended', 'Expired', 'Terminated'],
    governance: [
      'Service Entitlement is distinct from commercial claim/contract entitlement.',
      'SLA measurement is derived from timestamped service events.',
      'Contract remains the authoritative agreement identity where contractual.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-APPOINTMENT',
    candidateKeys: ['BOF-17-011', 'BOF-17-012', 'BOF-17-013'],
    canonicalName: 'Service Appointment',
    kind: 'work',
    definition:
      'A scheduled field/service commitment with dispatch and Field Visit execution evidence linked to a Service Case or Work Order.',
    identityRule:
      'Stable appointment identity; Dispatch is assignment/execution state and Field Visit records the actual attendance/work occurrence.',
    scope: ['work order/service case', 'resource/team', 'site/facility/asset'],
    keyData: [
      'appointment number',
      'time window',
      'resource/team',
      'location',
      'dispatch status',
      'arrival/departure',
      'visit outcome'
    ],
    lifecycle: [
      'Proposed',
      'Scheduled',
      'Dispatched',
      'En Route',
      'On Site',
      'Completed',
      'Failed Visit',
      'Cancelled'
    ],
    governance: [
      'Appointment scheduling does not replace Work Order planning.',
      'Actual Field Visit timestamps/evidence are retained.',
      'Resource assignment respects authority, competence and availability models.'
    ]
  },
  {
    modelId: 'OPS-MAINTENANCE-INSPECTION',
    candidateKeys: ['BOF-17-014'],
    canonicalName: 'Maintenance Inspection',
    kind: 'event-evidence',
    definition:
      'A dated inspection execution and evidence record against an Asset, System, Component or location, capturing observations, measurements and findings.',
    identityRule:
      'Immutable inspection occurrence identity; current condition is derived from retained observations/assessments.',
    scope: ['asset/system/component', 'work order/maintenance plan'],
    keyData: [
      'inspection type',
      'subject',
      'inspector',
      'date/time',
      'measurements',
      'findings',
      'evidence',
      'result'
    ],
    lifecycle: ['Planned', 'Performed', 'Verified', 'Closed', 'Invalidated'],
    governance: [
      'Inspection occurrence is not a mutable Asset condition field.',
      'Findings may create Defects, Service Cases or follow-up Work Orders without losing the source inspection.',
      'Condition Points identify where/how measurement is taken but are not separate Assets.'
    ]
  },
  {
    modelId: 'OPS-FAILURE',
    candidateKeys: ['BOF-17-015'],
    canonicalName: 'Failure Event',
    kind: 'event-evidence',
    definition:
      'An immutable occurrence recording loss/degradation of intended Asset/System function, including symptoms, operating context and observed time.',
    identityRule:
      'Stable failure-event identity; investigation, cause, repair and resulting condition are linked records rather than rewrites of the event.',
    scope: ['asset/system/component', 'service case/work order'],
    keyData: [
      'failure time',
      'subject',
      'failure mode/symptom',
      'operating context',
      'detected by',
      'impact/severity'
    ],
    lifecycle: ['Recorded', 'Verified', 'Investigated', 'Closed'],
    governance: [
      'Failure is an event; Defect is a managed nonconformity/condition case.',
      'Repeated failures remain separate occurrences for reliability analysis.',
      'Root cause and corrective action are related assurance records.'
    ]
  },
  {
    modelId: 'OPS-DEFECT',
    candidateKeys: ['BOF-13-008', 'BOF-17-016'],
    canonicalName: 'Defect',
    kind: 'case',
    definition:
      'A governed defect/nonconforming-condition case applicable across quality, commissioning, maintenance and aftercare, with one shared identity and lifecycle.',
    identityRule:
      'Stable Defect identity reused across delivery and operations; domain context/classification distinguishes commissioning, quality, latent or operational defects.',
    scope: ['project/contract', 'asset/system/component', 'quality/service context'],
    keyData: [
      'defect number',
      'subject',
      'classification',
      'severity',
      'reported by/at',
      'responsibility',
      'target date',
      'resolution evidence'
    ],
    lifecycle: [
      'Open',
      'Assigned',
      'In Remediation',
      'Ready for Verification',
      'Closed',
      'Rejected/Not a Defect'
    ],
    governance: [
      'Commissioning Defect and maintenance Defect reuse one canonical Defect pattern.',
      'Defect closure requires evidence/verification where configured.',
      'Commercial liability/entitlement is related but does not redefine defect identity.'
    ]
  },
  {
    modelId: 'OPS-WARRANTY-CLAIM',
    candidateKeys: ['BOF-17-019'],
    canonicalName: 'Warranty Claim',
    kind: 'case',
    definition:
      'A governed claim against an applicable Warranty for repair, replacement, credit or other remedy arising from a covered condition/failure.',
    identityRule:
      'Stable claim identity linked to Warranty, Asset/Item, claimant, provider and supporting defect/failure evidence.',
    scope: ['warranty', 'asset/item', 'supplier/manufacturer/service provider'],
    keyData: [
      'claim number',
      'warranty',
      'subject',
      'failure/defect',
      'claimed remedy/value',
      'provider',
      'decision/outcome'
    ],
    lifecycle: [
      'Draft',
      'Submitted',
      'Under Review',
      'Approved',
      'Rejected',
      'Fulfilment',
      'Closed'
    ],
    governance: [
      'Warranty is a separate governed coverage record; claim does not alter it.',
      'Claim outcome is attributable and evidence-backed.',
      'Replacement Asset/Item identity is explicitly linked if remedy changes physical configuration.'
    ]
  },
  {
    modelId: 'OPS-AFTERCARE-PERIOD',
    candidateKeys: ['BOF-17-020', 'BOF-17-021'],
    canonicalName: 'Aftercare / Defects Liability Period',
    kind: 'relationship',
    definition:
      'An effective period of post-completion obligation, defects liability or aftercare applying to a contract, package, facility, system or asset scope.',
    identityRule:
      'Effective obligation/coverage relationship with start/end and scope; it is not a new Contract or Asset identity.',
    scope: ['contract/package', 'handover scope', 'facility/system/asset'],
    keyData: [
      'period type',
      'start/end',
      'scope',
      'responsible party',
      'contract basis',
      'notice/remedy rules'
    ],
    lifecycle: ['Planned', 'Active', 'Expired', 'Extended', 'Closed'],
    governance: [
      'Defects Liability Period and Aftercare Period share one effective-period pattern with configurable legal/business meaning.',
      'Outstanding obligations survive Project closeout where contractually applicable.',
      'Period extension is effective-dated and auditable.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-QUOTE',
    candidateKeys: ['BOF-17-022'],
    canonicalName: 'Service Quotation',
    kind: 'work',
    definition:
      'A governed commercial quotation for service/maintenance work linked to a request, case, work scope and applicable Contract/customer context.',
    identityRule:
      'Stable quotation identity/version; acceptance can create/authorise commercial commitment or Work Order without rewriting the quote.',
    scope: ['service case/request', 'customer/contract', 'work scope'],
    keyData: [
      'quote number/version',
      'scope',
      'price/currency',
      'validity',
      'terms',
      'customer',
      'acceptance status'
    ],
    lifecycle: ['Draft', 'Issued', 'Accepted', 'Rejected', 'Expired', 'Withdrawn'],
    governance: [
      'Service quotation should converge with the enterprise quotation pattern when that canonical commercial model is defined.',
      'Accepted price is preserved as transaction evidence.',
      'Quote acceptance does not itself prove service completion.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-ACCEPTANCE',
    candidateKeys: ['BOF-17-023'],
    canonicalName: 'Service Acceptance',
    kind: 'event-evidence',
    definition:
      'An attributable acceptance record confirming a defined service/work outcome has been accepted, conditionally accepted or rejected by an authorised Party.',
    identityRule:
      'Immutable acceptance-event identity linked to exact Work Order/service scope and completion evidence.',
    scope: ['work order/service case', 'customer/party', 'contract/SLA'],
    keyData: ['decision', 'accepted by', 'timestamp', 'scope', 'conditions', 'evidence'],
    lifecycle: ['Recorded', 'Effective', 'Superseded/Revoked'],
    governance: [
      'Acceptance is evidence, not a mutable boolean on a Work Order.',
      'Conditional acceptance preserves outstanding obligations.',
      'Authority is evaluated through the shared authority model.'
    ]
  },
  {
    modelId: 'OPS-OCCUPANCY',
    candidateKeys: ['BOF-17-024', 'BOF-17-025', 'BOF-17-026'],
    canonicalName: 'Occupancy / Tenure Relationship',
    kind: 'relationship',
    definition:
      'An effective relationship connecting a Party to Property, Facility or Space through occupancy, lease or licence terms without changing spatial identity.',
    identityRule:
      'Stable/effective relationship identity; Lease and Licence are typed tenure relationships and Occupancy Record evidences actual occupation.',
    scope: ['property/facility/space', 'party', 'contract/legal context'],
    keyData: [
      'party',
      'space/property',
      'relationship type',
      'start/end',
      'rights/restrictions',
      'agreement reference'
    ],
    lifecycle: ['Proposed', 'Active', 'Suspended', 'Ended'],
    governance: [
      'Occupancy does not create duplicate Property, Space or Party masters.',
      'Lease/licence agreements may reference a canonical Contract where legally governed.',
      'Actual occupancy history is effective-dated and retained.'
    ]
  },
  {
    modelId: 'OPS-UTILITY-ACCOUNT',
    candidateKeys: ['BOF-17-029'],
    canonicalName: 'Utility Account',
    kind: 'account',
    definition:
      'A governed commercial/service account linking a utility provider relationship to a Property, Facility, Site, meter/Asset or billing context.',
    identityRule:
      'Stable account identity independent of individual meter readings, invoices or consumption records.',
    scope: ['legal entity/party', 'property/facility/site', 'meter/asset'],
    keyData: [
      'account number',
      'provider',
      'service type',
      'supply point/meter',
      'billing entity',
      'effective dates'
    ],
    lifecycle: ['Pending', 'Active', 'Suspended', 'Closed'],
    governance: [
      'Utility Account is not a Meter/Asset identity.',
      'Supplier/provider reuses canonical Party/Organisation identity.',
      'Billing transactions belong to finance/procurement semantics.'
    ]
  },
  {
    modelId: 'OPS-UTILITY-CONSUMPTION',
    candidateKeys: ['BOF-17-030'],
    canonicalName: 'Utility Consumption',
    kind: 'event-evidence',
    definition:
      'Time-bounded measured or calculated utility consumption evidence derived from meter/telemetry readings and governed calculation rules.',
    identityRule:
      'Immutable measurement/period record with source provenance; corrected values create retained adjustment/supersession history.',
    scope: ['utility account', 'meter/asset', 'property/facility/site'],
    keyData: [
      'service type',
      'period',
      'quantity/UOM',
      'source readings',
      'calculation method',
      'quality/status'
    ],
    lifecycle: ['Captured', 'Validated', 'Estimated', 'Corrected/Superseded'],
    governance: [
      'Consumption is evidence/measure, not an editable running total.',
      'Meter is a typed Asset; readings/telemetry remain separate time-series evidence.',
      'Carbon/cost projections derive from authoritative consumption without duplicating it.'
    ]
  },
  {
    modelId: 'OPS-SERVICE-HISTORY',
    candidateKeys: ['BOF-17-017'],
    canonicalName: 'Asset Service History',
    kind: 'projection',
    definition:
      'A chronological read model of commissioning, maintenance, failures, defects, work, parts, condition, warranty and service events for an Asset/System.',
    identityRule:
      'Projection only; history is reconstructed from immutable canonical records and never edited as an independent source of truth.',
    scope: ['asset/system/component'],
    keyData: [
      'event timeline',
      'source record IDs',
      'work/failure/defect/condition/warranty events',
      'provenance'
    ],
    lifecycle: ['Derived'],
    governance: [
      'Service History is not a mutable ledger separate from source records.',
      'Every timeline entry must trace to authoritative evidence/transaction identity.',
      'Projection can be rebuilt without data loss.'
    ]
  }
];

export const assetOperationsRelationships: AssetOperationsRelationship[] = [
  {
    id: 'OPS-R01',
    from: 'OPS-COMMISSIONING-PLAN',
    predicate: 'governs commissioning of',
    to: 'CBO-SYSTEM',
    cardinality: '1 ↔ 1..*',
    governance: 'System identity remains continuous from delivery through operations.'
  },
  {
    id: 'OPS-R02',
    from: 'OPS-COMMISSIONING-PLAN',
    predicate: 'governs commissioning of',
    to: 'CBO-ASSET',
    cardinality: '1 ↔ 0..*',
    governance: 'Asset identity is not recreated at commissioning.'
  },
  {
    id: 'OPS-R03',
    from: 'OPS-COMMISSIONING-ACTIVITY',
    predicate: 'executes under',
    to: 'OPS-COMMISSIONING-PLAN',
    cardinality: '* → 1',
    governance: 'Activity execution references the applicable plan/baseline.'
  },
  {
    id: 'OPS-R04',
    from: 'OPS-COMMISSIONING-EVIDENCE',
    predicate: 'evidences',
    to: 'OPS-COMMISSIONING-ACTIVITY',
    cardinality: '* → 1',
    governance: 'All attempts/retests remain traceable.'
  },
  {
    id: 'OPS-R05',
    from: 'OPS-HANDOVER-PACKAGE',
    predicate: 'transfers scope containing',
    to: 'CBO-ASSET',
    cardinality: '* ↔ *',
    governance: 'Package membership references canonical Asset identities.'
  },
  {
    id: 'OPS-R06',
    from: 'OPS-HANDOVER-PACKAGE',
    predicate: 'includes exact',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: '* ↔ *',
    governance: 'Exact revisions/issued information are referenced, not copied.'
  },
  {
    id: 'OPS-R07',
    from: 'OPS-HANDOVER-ACCEPTANCE',
    predicate: 'accepts',
    to: 'OPS-HANDOVER-PACKAGE',
    cardinality: '* → 1',
    governance: 'Acceptance retains conditions and authority evidence.'
  },
  {
    id: 'OPS-R08',
    from: 'OPS-MAINTENANCE-PLAN',
    predicate: 'applies to',
    to: 'CBO-ASSET',
    cardinality: '* ↔ *',
    governance: 'Plan changes do not alter Asset identity.'
  },
  {
    id: 'OPS-R09',
    from: 'OPS-TASK-TEMPLATE',
    predicate: 'is used by',
    to: 'OPS-MAINTENANCE-PLAN',
    cardinality: '* ↔ *',
    governance: 'Template version/effectivity is explicit.'
  },
  {
    id: 'OPS-R10',
    from: 'OPS-WORK-ORDER',
    predicate: 'performs work on',
    to: 'CBO-ASSET',
    cardinality: '* → 0..1',
    governance: 'Work history remains attached to the stable Asset.'
  },
  {
    id: 'OPS-R11',
    from: 'OPS-WORK-ORDER',
    predicate: 'may address',
    to: 'OPS-DEFECT',
    cardinality: '* ↔ *',
    governance: 'Defect closure is linked to but not replaced by work completion.'
  },
  {
    id: 'OPS-R12',
    from: 'OPS-SERVICE-REQUEST',
    predicate: 'may create',
    to: 'OPS-SERVICE-CASE',
    cardinality: '* → 0..1',
    governance: 'Intake and case-management identity remain separate.'
  },
  {
    id: 'OPS-R13',
    from: 'OPS-SERVICE-CASE',
    predicate: 'coordinates',
    to: 'OPS-WORK-ORDER',
    cardinality: '1 → 0..*',
    governance: 'Case status and work status remain independent.'
  },
  {
    id: 'OPS-R14',
    from: 'OPS-SERVICE-CASE',
    predicate: 'is governed by',
    to: 'OPS-SERVICE-LEVEL',
    cardinality: '* → 0..1',
    governance: 'Applicable entitlement/SLA is effective at the service event time.'
  },
  {
    id: 'OPS-R15',
    from: 'OPS-SERVICE-APPOINTMENT',
    predicate: 'executes',
    to: 'OPS-WORK-ORDER',
    cardinality: '* → 0..1',
    governance: 'Appointments/visits do not replace work authorization.'
  },
  {
    id: 'OPS-R16',
    from: 'OPS-MAINTENANCE-INSPECTION',
    predicate: 'assesses',
    to: 'CBO-ASSET',
    cardinality: '* → 1',
    governance: 'Condition is derived from retained observations/assessments.'
  },
  {
    id: 'OPS-R17',
    from: 'OPS-MAINTENANCE-INSPECTION',
    predicate: 'may identify',
    to: 'OPS-DEFECT',
    cardinality: '1 → 0..*',
    governance: 'Finding provenance is retained.'
  },
  {
    id: 'OPS-R18',
    from: 'OPS-FAILURE',
    predicate: 'occurs on',
    to: 'CBO-ASSET',
    cardinality: '* → 1',
    governance: 'Repeated failures remain independent events for reliability analysis.'
  },
  {
    id: 'OPS-R19',
    from: 'OPS-WARRANTY-CLAIM',
    predicate: 'claims against',
    to: 'CBO-WARRANTY',
    cardinality: '* → 1',
    governance: 'Warranty coverage and claim lifecycle remain separate.'
  },
  {
    id: 'OPS-R20',
    from: 'OPS-WARRANTY-CLAIM',
    predicate: 'concerns',
    to: 'CBO-ASSET',
    cardinality: '* → 0..1',
    governance: 'Replacement/repair creates explicit configuration/history links.'
  },
  {
    id: 'OPS-R21',
    from: 'OPS-AFTERCARE-PERIOD',
    predicate: 'covers',
    to: 'CBO-ASSET',
    cardinality: '* ↔ *',
    governance: 'Coverage/effectivity is explicit and survives Project closure.'
  },
  {
    id: 'OPS-R22',
    from: 'OPS-SERVICE-ACCEPTANCE',
    predicate: 'accepts outcome of',
    to: 'OPS-WORK-ORDER',
    cardinality: '* → 1',
    governance: 'Acceptance is evidence, not a status overwrite.'
  },
  {
    id: 'OPS-R23',
    from: 'OPS-OCCUPANCY',
    predicate: 'occupies/uses',
    to: 'BE-SPACE',
    cardinality: '* ↔ *',
    governance:
      'Occupancy/tenure is effective-dated; Space and Party identities remain independent.'
  },
  {
    id: 'OPS-R24',
    from: 'OPS-UTILITY-ACCOUNT',
    predicate: 'is measured through',
    to: 'CBO-ASSET',
    cardinality: '* → 0..*',
    governance: 'Meters are typed Assets; account identity remains commercial/service context.'
  },
  {
    id: 'OPS-R25',
    from: 'OPS-UTILITY-CONSUMPTION',
    predicate: 'records consumption for',
    to: 'OPS-UTILITY-ACCOUNT',
    cardinality: '* → 1',
    governance: 'Measurement periods/adjustments retain provenance.'
  },
  {
    id: 'OPS-R26',
    from: 'OPS-SERVICE-HISTORY',
    predicate: 'projects history of',
    to: 'CBO-ASSET',
    cardinality: '1 → 1',
    governance: 'Projection is rebuildable from canonical events and work records.'
  }
];

export const assetOperationsBoundaries: AssetOperationsBoundary[] = [
  {
    name: 'Delivery → operations',
    structure: 'Project / Commissioning → Handover → Asset operations',
    purpose: 'Transfer stewardship and evidence without recreating technical identity.',
    mustNotBecome: 'a second FM/EAM asset register'
  },
  {
    name: 'Maintenance planning',
    structure: 'Strategy → Plan → Task Template → Work Order',
    purpose: 'Separate policy/definition from executable work and history.',
    mustNotBecome: 'one mutable maintenance record'
  },
  {
    name: 'Service management',
    structure: 'Request → Case → Appointment / Work Order → Acceptance',
    purpose: 'Separate intake, coordination, execution and customer acceptance.',
    mustNotBecome: 'workflow status masquerading as domain truth'
  },
  {
    name: 'Reliability & evidence',
    structure: 'Inspection / Failure / Defect / Condition / Warranty',
    purpose: 'Preserve observations, cases and remedies as traceable records.',
    mustNotBecome: 'a single editable Asset status field'
  }
];

export const assetOperationsRules = [
  'Handover changes stewardship, responsibility and operational state; it does not recreate System, Asset or Component identity.',
  'Commissioning System reuses the canonical System identity; commissioning evidence records exact attempts, results, witnesses and acceptance.',
  'Retest never overwrites a failed or earlier commissioning result.',
  'Maintenance Strategy, Maintenance Plan, Task Template and Work Order are distinct semantic layers.',
  'Work Order is operational work; it is not a workflow task or Project Schedule Activity.',
  'Service Request, Service Case, Service Appointment and Work Order remain separate identities with explicit relationships.',
  'Failure is an event; Defect is a governed case/nonconforming condition; current condition is derived from retained evidence.',
  'Commissioning Defect and operational/quality Defect use one shared Defect identity pattern.',
  'Warranty, Warranty Claim and defects-liability/aftercare coverage are separate records.',
  'Parts Consumption posts through Inventory Movement; it is not a separate material truth store.',
  'Service History is a projection of canonical events and work, never independently editable truth.',
  'Meter is a typed Asset; readings and Utility Consumption are time-series evidence, not new Asset identities.',
  'Occupancy, Lease and Licence are effective Party-to-Property/Space relationships, not duplicate Party or spatial masters.',
  'Operations and Maintenance information remains controlled Information Container content/deliverables, not an FM-specific document silo.'
];

export function validateAssetOperationsModel() {
  const ids = new Set(assetOperationsModel.map((entry) => entry.modelId));
  if (ids.size !== assetOperationsModel.length) return false;
  const external = new Set([
    'CBO-SYSTEM',
    'CBO-ASSET',
    'CBO-WARRANTY',
    'CBO-INFORMATION-CONTAINER',
    'BE-SPACE'
  ]);
  for (const relationship of assetOperationsRelationships) {
    if (!ids.has(relationship.from) && !external.has(relationship.from)) return false;
    if (!ids.has(relationship.to) && !external.has(relationship.to)) return false;
  }
  return assetOperationsModel.every(
    (entry) =>
      entry.canonicalName && entry.definition && entry.identityRule && entry.governance.length > 0
  );
}
