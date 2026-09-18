export type CommercialProcurementKind =
  | 'foundation-reference'
  | 'typed-agreement'
  | 'relationship'
  | 'scope-structure'
  | 'controlled-term'
  | 'case'
  | 'transaction'
  | 'plan'
  | 'event-evidence';

export type CommercialProcurementDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: CommercialProcurementKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type CommercialProcurementRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type CommercialBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const commercialProcurementModel: CommercialProcurementDefinition[] = [
  {
    modelId: 'CBO-CONTRACT',
    candidateKeys: ['BOF-08-001', 'BOF-08-002', 'BOF-08-003', 'BOF-08-004'],
    canonicalName: 'Contract',
    kind: 'foundation-reference',
    definition:
      'The stable legally/commercially governed agreement identity. Appointment, subcontract and framework agreement are governed contract types rather than parallel agreement masters.',
    identityRule:
      'One immutable Contract identity survives negotiation, execution, amendments, commercial change, suspension, expiry and closeout.',
    scope: ['tenant', 'legal entity', 'project/programme', 'commercial relationship'],
    keyData: [
      'contract number',
      'contract type/form',
      'parties',
      'effective dates',
      'governing law',
      'currency',
      'commercial value where applicable'
    ],
    lifecycle: [
      'Draft',
      'Negotiation',
      'Executed',
      'Effective',
      'Suspended',
      'Expired',
      'Terminated',
      'Closed'
    ],
    governance: [
      'Appointment, Subcontract and Framework Agreement use Contract type/classification rather than separate master identity systems.',
      'Executed terms are not silently overwritten; amendments and controlled change retain history.',
      'A Contract can relate to one or more Projects/Work Packages without becoming the Project or WBS hierarchy.'
    ]
  },
  {
    modelId: 'COM-CONTRACT-PARTY-ROLE',
    candidateKeys: ['BOF-08-005'],
    canonicalName: 'Contract Party Role',
    kind: 'relationship',
    definition:
      'An effective relationship binding a canonical Party to a Contract in a governed contractual role.',
    identityRule:
      'Immutable role-assignment relationship identity; role/effectivity changes create new history rather than changing Party identity.',
    scope: ['contract', 'party', 'legal entity'],
    keyData: [
      'contract',
      'party',
      'role type',
      'valid from/to',
      'signatory/authority basis where relevant'
    ],
    lifecycle: ['Proposed', 'Active', 'Superseded', 'Ended'],
    governance: [
      'Employer/client, contractor, subcontractor, consultant, supplier and guarantor roles never create duplicate Party masters.',
      'Role is contextual to a Contract and may coexist with other Party relationships.',
      'Authorised signatory evidence is separate from the Party role itself.'
    ]
  },
  {
    modelId: 'COM-CONTRACT-CLAUSE',
    candidateKeys: ['BOF-08-006'],
    canonicalName: 'Contract Clause',
    kind: 'controlled-term',
    definition:
      'A controlled contractual term forming part of an executed or working Contract version, optionally derived from a contract template/form.',
    identityRule:
      'Stable clause identity within the Contract/contract version; amendments supersede terms with retained provenance.',
    scope: ['contract', 'contract version/amendment'],
    keyData: [
      'clause reference',
      'text/structured terms',
      'source form/template',
      'effective version',
      'amendment provenance'
    ],
    lifecycle: ['Draft', 'Agreed', 'Effective', 'Amended', 'Superseded'],
    governance: [
      'Clause is controlled content, not a free-text field on Contract.',
      'Contract-form templates may supply clauses but never replace the executed Contract truth.',
      'Structured obligations, notices and entitlement rules may reference clauses without duplicating them.'
    ]
  },
  {
    modelId: 'COM-OBLIGATION',
    candidateKeys: ['BOF-08-007'],
    canonicalName: 'Obligation',
    kind: 'controlled-term',
    definition:
      'A structured contractual duty or requirement owed by a Party under a Contract, clause, instruction, change or other contractual basis.',
    identityRule:
      'Stable obligation identity with explicit obligor, beneficiary, basis and effectivity.',
    scope: ['contract', 'party role', 'project/work package where relevant'],
    keyData: [
      'obligor',
      'beneficiary',
      'basis',
      'required outcome',
      'due/effective dates',
      'status/evidence'
    ],
    lifecycle: ['Proposed', 'Effective', 'Due', 'Satisfied', 'Waived', 'Breached', 'Superseded'],
    governance: [
      'Obligation is not a workflow task; tasks may be generated to fulfil or monitor it.',
      'Obligation state must remain distinct from Contract lifecycle.',
      'Satisfaction/breach is evidenced and historically reconstructable.'
    ]
  },
  {
    modelId: 'COM-KEY-DATE',
    candidateKeys: ['BOF-08-008'],
    canonicalName: 'Contract Key Date',
    kind: 'controlled-term',
    definition:
      'A contractual date or period with explicit legal/commercial significance under a Contract.',
    identityRule:
      'Stable key-date identity tied to its contractual basis; revisions arise only through governed contractual change.',
    scope: ['contract', 'obligation', 'project/schedule mapping'],
    keyData: [
      'date/period',
      'contractual basis',
      'responsible party',
      'condition',
      'linked schedule milestone where applicable'
    ],
    lifecycle: ['Proposed', 'Effective', 'Achieved', 'Missed', 'Superseded'],
    governance: [
      'Contract Key Date is not a Schedule Milestone, although the two may be mapped.',
      'Changing a planning milestone does not change the contractual date.',
      'Contractual date change requires valid commercial/contractual authority.'
    ]
  },
  {
    modelId: 'COM-NOTICE',
    candidateKeys: ['BOF-08-009'],
    canonicalName: 'Contract Notice',
    kind: 'event-evidence',
    definition:
      'A formally issued contractual communication intended to satisfy a notice requirement or preserve a contractual right.',
    identityRule:
      'Immutable issued-notice identity; drafts may evolve before issue, but the issued evidence is retained.',
    scope: ['contract', 'party role', 'commercial event/change/claim'],
    keyData: [
      'notice type',
      'sender/recipient',
      'contractual basis',
      'issued at',
      'delivery evidence',
      'linked subject'
    ],
    lifecycle: [
      'Draft',
      'Issued',
      'Delivered',
      'Acknowledged',
      'Superseded/Withdrawn where contract permits'
    ],
    governance: [
      'Notice is distinct from general Correspondence.',
      'Issue/delivery timestamps and evidence are legally material.',
      'A notification UI message is never a substitute for Contract Notice evidence.'
    ]
  },
  {
    modelId: 'COM-COMMERCIAL-PACKAGE',
    candidateKeys: ['BOF-08-011'],
    canonicalName: 'Commercial Package',
    kind: 'scope-structure',
    definition:
      'A commercial grouping of delivery scope used for cost, contract and package-management purposes.',
    identityRule: 'Stable Commercial Package identity within its Project/commercial context.',
    scope: ['project', 'WBS/work package mapping', 'commercial plan'],
    keyData: [
      'package code',
      'scope',
      'commercial owner',
      'WBS/work package mappings',
      'contract/procurement mappings'
    ],
    lifecycle: ['Planned', 'Active', 'Committed', 'Closed', 'Cancelled'],
    governance: [
      'Commercial Package is not a WBS Element, Work Package, Procurement Package or Contract.',
      'Mappings across structures are explicit and may be many-to-many.',
      'Package coding is a business identifier, not object identity.'
    ]
  },
  {
    modelId: 'COM-PROCUREMENT-PACKAGE',
    candidateKeys: ['BOF-08-012', 'BOF-09-006'],
    canonicalName: 'Procurement Package',
    kind: 'scope-structure',
    definition:
      'A governed grouping of requirements/scope taken through a sourcing and award process.',
    identityRule:
      'Stable Procurement Package identity reused by procurement and commercial workspaces.',
    scope: ['project', 'procurement plan', 'commercial/WBS/work-package mapping'],
    keyData: [
      'package code',
      'scope/requirements',
      'procurement route',
      'target dates',
      'responsibility',
      'mapped delivery/commercial scope'
    ],
    lifecycle: [
      'Planned',
      'Approved for Sourcing',
      'In Sourcing',
      'Awarded',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'The BOF-08 and BOF-09 occurrences are the same canonical Procurement Package.',
      'Procurement Package is not the resulting Purchase Order, Subcontract or Contract.',
      'One package may result in multiple commitments and one commitment may cover multiple packages where explicitly governed.'
    ]
  },
  {
    modelId: 'COM-COMMERCIAL-CHANGE',
    candidateKeys: ['BOF-08-014', 'BOF-08-015', 'BOF-08-016'],
    canonicalName: 'Commercial Change',
    kind: 'case',
    definition:
      'A governed commercial/contractual change case. Change, Variation and Compensation Event are typed uses governed by the applicable contract form.',
    identityRule:
      'Stable change identity independent of quotations, assessments, instructions, approvals and resulting contract amendments.',
    scope: ['contract', 'project', 'work/commercial package'],
    keyData: [
      'change type',
      'contractual basis',
      'initiator',
      'scope/time/cost impacts',
      'status',
      'linked instruction/notice/quotation/assessment'
    ],
    lifecycle: [
      'Identified',
      'Notified',
      'Under Assessment',
      'Quoted',
      'Decided',
      'Implemented',
      'Closed',
      'Rejected/Withdrawn'
    ],
    governance: [
      'Variation and Compensation Event terminology is preserved as governed change type, not separate duplicate change engines.',
      'Contract-form-specific rules can configure required states/actions without redefining the canonical identity.',
      'Approved change does not overwrite the original Contract or baseline; resulting amendments/effectivity are explicit.'
    ]
  },
  {
    modelId: 'COM-CHANGE-QUOTATION',
    candidateKeys: ['BOF-08-017'],
    canonicalName: 'Change Quotation',
    kind: 'transaction',
    definition:
      'A priced and/or time-assessed proposal submitted in relation to a Commercial Change.',
    identityRule:
      'Each submitted quotation has its own identity/version and remains linked to the change it addresses.',
    scope: ['commercial change', 'contract'],
    keyData: [
      'change',
      'submitter',
      'price',
      'time effect',
      'assumptions',
      'validity',
      'submission version'
    ],
    lifecycle: ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Rejected', 'Superseded'],
    governance: [
      'Quotation is not the Change itself and acceptance is not automatic Contract amendment.',
      'Submitted versions are immutable evidence.',
      'Assessment may differ from submitted quotation and is retained separately.'
    ]
  },
  {
    modelId: 'COM-CLAIM',
    candidateKeys: ['BOF-08-018', 'BOF-08-019'],
    canonicalName: 'Commercial Claim',
    kind: 'case',
    definition:
      'A governed assertion of contractual entitlement and requested remedy, with its basis, evidence, assessment and decision history.',
    identityRule:
      'Stable claim identity; entitlement grounds are structured within/against the claim rather than a separate party master.',
    scope: ['contract', 'commercial change/event', 'party role'],
    keyData: [
      'claimant',
      'basis/entitlement',
      'relief sought',
      'amount/time',
      'notices',
      'evidence',
      'assessment/decision'
    ],
    lifecycle: [
      'Draft',
      'Notified',
      'Submitted',
      'Under Assessment',
      'Agreed',
      'Rejected',
      'Disputed',
      'Closed'
    ],
    governance: [
      'Entitlement is a claim/basis relationship and does not become an independent master detached from its contractual context.',
      'Claims retain submitted evidence and assessment history.',
      'Dispute escalation is related but does not erase the original Claim.'
    ]
  },
  {
    modelId: 'PROC-REQUISITION',
    candidateKeys: ['BOF-09-007'],
    canonicalName: 'Requisition',
    kind: 'transaction',
    definition:
      'An authorised request to procure goods, services or subcontract scope before external commitment is created.',
    identityRule:
      'Stable requisition identity with immutable approved versions/decision evidence where required.',
    scope: ['tenant', 'project/organisation unit', 'procurement package'],
    keyData: [
      'requestor',
      'required items/scope',
      'quantity/value estimate',
      'need date',
      'cost/project context',
      'approval basis'
    ],
    lifecycle: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Converted', 'Closed', 'Cancelled'],
    governance: [
      'Requisition is not a Purchase Order or commitment.',
      'Approval authority is evaluated using the shared authority model.',
      'Conversion retains traceability to resulting sourcing/commitment records.'
    ]
  },
  {
    modelId: 'PROC-SOURCING-EVENT',
    candidateKeys: ['BOF-09-008'],
    canonicalName: 'Sourcing Event',
    kind: 'case',
    definition:
      'A governed procurement competition/negotiation process through which market responses are requested, evaluated and awarded.',
    identityRule:
      'Stable event identity spanning invitations, responses, clarification, evaluation and award.',
    scope: ['procurement package', 'project/organisation', 'supplier market'],
    keyData: [
      'event type/route',
      'package',
      'participants',
      'timeline',
      'evaluation method',
      'status'
    ],
    lifecycle: [
      'Planned',
      'Open',
      'Responses Received',
      'Under Evaluation',
      'Awarded',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'Sourcing Event is not merely an audit event; it is a governed business case/process identity.',
      'Supplier responses and evaluation records remain separate evidence-bearing objects.',
      'Award requires valid authority and preserves the evaluated basis.'
    ]
  },
  {
    modelId: 'PROC-SOURCING-REQUEST',
    candidateKeys: ['BOF-09-009', 'BOF-09-010'],
    canonicalName: 'Sourcing Request',
    kind: 'controlled-term',
    definition:
      'The controlled request issued to prospective suppliers within a Sourcing Event. RFQ and RFP are governed request types.',
    identityRule:
      'Stable request identity and controlled issue/version; issued content is immutable evidence.',
    scope: ['sourcing event', 'procurement package'],
    keyData: [
      'request type',
      'requirements',
      'commercial terms',
      'response deadline',
      'issue/version',
      'recipient set'
    ],
    lifecycle: ['Draft', 'Issued', 'Clarification', 'Closed', 'Superseded/Withdrawn'],
    governance: [
      'RFQ and RFP use one request pattern with different configured information requirements.',
      'Invitation/recipient relationships are separate from the request content.',
      'Issued request versions remain traceable.'
    ]
  },
  {
    modelId: 'PROC-SOURCING-RESPONSE',
    candidateKeys: ['BOF-09-012', 'BOF-09-013'],
    canonicalName: 'Sourcing Response',
    kind: 'transaction',
    definition:
      'A supplier response to a Sourcing Request, carrying the commercial/technical offer and controlled submission evidence.',
    identityRule:
      'Stable response identity per responding Party/request; resubmissions create retained versions or superseding responses according to event rules.',
    scope: ['sourcing event', 'sourcing request', 'supplier relationship'],
    keyData: [
      'supplier',
      'request',
      'offer',
      'qualifications',
      'price',
      'programme/time',
      'submission evidence'
    ],
    lifecycle: ['Draft', 'Submitted', 'Clarified', 'Final', 'Withdrawn', 'Superseded'],
    governance: [
      'Bid Response and Tender Response are one response pattern with context-specific terminology.',
      'Submitted evidence is immutable.',
      'Response does not create commitment until an authorised Award/commitment exists.'
    ]
  },
  {
    modelId: 'PROC-EVALUATION',
    candidateKeys: ['BOF-09-014', 'BOF-09-015'],
    canonicalName: 'Sourcing Evaluation',
    kind: 'event-evidence',
    definition:
      'A governed evaluation/comparison of supplier responses against approved criteria, preserving scoring, rationale, reviewers and evidence.',
    identityRule:
      'Stable evaluation round identity; recalculation or moderation produces retained revisions/rounds.',
    scope: ['sourcing event', 'responses', 'evaluation criteria'],
    keyData: [
      'criteria',
      'responses',
      'scores',
      'commercial normalization',
      'reviewers',
      'moderation',
      'recommendation'
    ],
    lifecycle: ['Planned', 'In Progress', 'Moderated', 'Final', 'Superseded'],
    governance: [
      'Comparison is a view/output of governed evaluation, not a parallel supplier-response master.',
      'Evaluation must preserve conflicts, reviewer identity and decision provenance.',
      'Recommendation alone does not constitute Award authority.'
    ]
  },
  {
    modelId: 'PROC-AWARD',
    candidateKeys: ['BOF-09-016'],
    canonicalName: 'Award',
    kind: 'transaction',
    definition:
      'The authorised procurement decision selecting one or more supplier responses and defining the basis for resulting commitment.',
    identityRule:
      'Immutable award decision identity tied to authority evidence, evaluation basis and selected response(s).',
    scope: ['sourcing event', 'procurement package', 'supplier response'],
    keyData: [
      'selected supplier/response',
      'award value/scope',
      'authority basis',
      'decision date',
      'conditions',
      'resulting commitment type'
    ],
    lifecycle: ['Proposed', 'Approved', 'Notified', 'Committed', 'Withdrawn/Superseded'],
    governance: [
      'Award is a decision/transaction, not the Purchase Order, Subcontract or Contract.',
      'Authority is re-evaluated server-side at award execution.',
      'Award evidence remains immutable even if later commitment changes.'
    ]
  },
  {
    modelId: 'PROC-PURCHASE-ORDER',
    candidateKeys: ['BOF-09-017', 'BOF-09-018', 'BOF-09-022'],
    canonicalName: 'Purchase Order',
    kind: 'transaction',
    definition:
      'An external procurement commitment for goods/services, containing controlled order lines and amendments.',
    identityRule:
      'Stable Purchase Order identity; lines are child records and approved amendments create controlled commercial history.',
    scope: ['legal entity', 'supplier relationship', 'project/procurement package'],
    keyData: [
      'PO number',
      'supplier',
      'currency',
      'order lines',
      'delivery/terms',
      'project/cost context',
      'award/requisition provenance'
    ],
    lifecycle: [
      'Draft',
      'Approved',
      'Issued',
      'Partially Fulfilled',
      'Fulfilled',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'Purchase Order Line is a child of Purchase Order, not an independent commitment master.',
      'Order Amendment changes committed terms through controlled history rather than destructive overwrite.',
      'Purchase Order is distinct from Contract/Subcontract where the business requires a separately governed agreement.'
    ]
  },
  {
    modelId: 'PROC-CALLOFF',
    candidateKeys: ['BOF-09-019', 'BOF-10-035'],
    canonicalName: 'Call-off Order',
    kind: 'transaction',
    definition:
      'A governed release of defined goods, service or scope under an existing framework, Contract or blanket procurement commitment.',
    identityRule:
      'One stable Call-off Order identity is created by procurement/commercial authority and reused by inventory/logistics for fulfilment; the logistics context never creates a second call-off master.',
    scope: ['framework/contract', 'purchase order/commitment', 'project/site demand'],
    keyData: [
      'call-off number',
      'governing agreement/commitment',
      'item/service/scope',
      'quantity/value',
      'required date/location',
      'authority'
    ],
    lifecycle: [
      'Draft',
      'Approved',
      'Released',
      'Acknowledged',
      'Partially Fulfilled',
      'Fulfilled',
      'Closed',
      'Cancelled'
    ],
    governance: [
      'BOF-09 Call-off and BOF-10 Call-off are one canonical Call-off Order identity.',
      'The Call-off Order preserves the governing agreement/commitment and authority basis.',
      'Shipment, Delivery and Procurement Receipt reference fulfilment of the Call-off Order without redefining it.'
    ]
  },
  {
    modelId: 'PROC-RECEIPT',
    candidateKeys: ['BOF-09-023', 'BOF-09-024'],
    canonicalName: 'Procurement Receipt',
    kind: 'event-evidence',
    definition:
      'Evidence that goods or services have been received/accepted against a procurement commitment. Goods Receipt and Service Receipt are typed receipt events.',
    identityRule:
      'Immutable receipt-event identity with correction/reversal rather than silent overwrite.',
    scope: ['purchase order/commitment', 'site/project/organisation', 'item/service scope'],
    keyData: [
      'receipt type',
      'commitment/line',
      'quantity/value',
      'received/accepted by',
      'date/time',
      'location',
      'evidence'
    ],
    lifecycle: ['Recorded', 'Validated', 'Corrected/Reversed'],
    governance: [
      'Goods and service receipts use one event pattern with type-specific evidence.',
      'Receipt does not itself equal supplier invoice approval.',
      'Corrections preserve the original receipt and explicit reversal/correction trail.'
    ]
  }
];

export const commercialProcurementRelationships: CommercialProcurementRelationship[] = [
  {
    id: 'CP-R01',
    from: 'CBO-CONTRACT',
    predicate: 'has party via',
    to: 'COM-CONTRACT-PARTY-ROLE',
    cardinality: '1 ↔ 2..*',
    governance: 'Party role is contextual/effective; Party identity remains canonical.'
  },
  {
    id: 'CP-R02',
    from: 'COM-CONTRACT-PARTY-ROLE',
    predicate: 'references',
    to: 'CBO-PARTY',
    cardinality: '1 ↔ 1',
    governance: 'Role references shared Party identity.'
  },
  {
    id: 'CP-R03',
    from: 'CBO-CONTRACT',
    predicate: 'contains',
    to: 'COM-CONTRACT-CLAUSE',
    cardinality: '1 ↔ 0..*',
    governance: 'Clause content is version/amendment controlled.'
  },
  {
    id: 'CP-R04',
    from: 'CBO-CONTRACT',
    predicate: 'creates',
    to: 'COM-OBLIGATION',
    cardinality: '1 ↔ 0..*',
    governance: 'Obligations retain contractual basis and responsible Party roles.'
  },
  {
    id: 'CP-R05',
    from: 'CBO-CONTRACT',
    predicate: 'defines',
    to: 'COM-KEY-DATE',
    cardinality: '1 ↔ 0..*',
    governance: 'Contract dates remain separate from schedule milestones.'
  },
  {
    id: 'CP-R06',
    from: 'CBO-CONTRACT',
    predicate: 'receives/issues',
    to: 'COM-NOTICE',
    cardinality: '1 ↔ 0..*',
    governance: 'Issued notice evidence is immutable.'
  },
  {
    id: 'CP-R07',
    from: 'CBO-PROJECT',
    predicate: 'commercially grouped by',
    to: 'COM-COMMERCIAL-PACKAGE',
    cardinality: '1 ↔ 0..*',
    governance: 'Commercial package maps to delivery scope; it does not replace WBS.'
  },
  {
    id: 'CP-R08',
    from: 'DEL-WORK-PACKAGE',
    predicate: 'maps to',
    to: 'COM-COMMERCIAL-PACKAGE',
    cardinality: '0..* ↔ 0..*',
    governance: 'Delivery and commercial structures remain independent.'
  },
  {
    id: 'CP-R09',
    from: 'COM-COMMERCIAL-PACKAGE',
    predicate: 'sourced through',
    to: 'COM-PROCUREMENT-PACKAGE',
    cardinality: '0..* ↔ 0..*',
    governance: 'Mappings support packaging strategies without shared identity.'
  },
  {
    id: 'CP-R10',
    from: 'CBO-CONTRACT',
    predicate: 'covers',
    to: 'COM-COMMERCIAL-PACKAGE',
    cardinality: '0..* ↔ 0..*',
    governance: 'Contract coverage is explicit and effective-dated where required.'
  },
  {
    id: 'CP-R11',
    from: 'CBO-CONTRACT',
    predicate: 'governs',
    to: 'COM-COMMERCIAL-CHANGE',
    cardinality: '1 ↔ 0..*',
    governance: 'Change case never overwrites the Contract directly.'
  },
  {
    id: 'CP-R12',
    from: 'COM-COMMERCIAL-CHANGE',
    predicate: 'priced by',
    to: 'COM-CHANGE-QUOTATION',
    cardinality: '1 ↔ 0..*',
    governance: 'Each submitted quotation/version is retained.'
  },
  {
    id: 'CP-R13',
    from: 'CBO-CONTRACT',
    predicate: 'subject to',
    to: 'COM-CLAIM',
    cardinality: '1 ↔ 0..*',
    governance: 'Claim retains basis, evidence and decision history.'
  },
  {
    id: 'CP-R14',
    from: 'COM-COMMERCIAL-CHANGE',
    predicate: 'may generate',
    to: 'COM-CLAIM',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Claim and change remain separate case identities.'
  },
  {
    id: 'CP-R15',
    from: 'COM-PROCUREMENT-PACKAGE',
    predicate: 'requested by',
    to: 'PROC-REQUISITION',
    cardinality: '1 ↔ 0..*',
    governance: 'Requisition precedes external commitment.'
  },
  {
    id: 'CP-R16',
    from: 'COM-PROCUREMENT-PACKAGE',
    predicate: 'sourced through',
    to: 'PROC-SOURCING-EVENT',
    cardinality: '1 ↔ 0..*',
    governance: 'Package may have multiple sourcing rounds/events.'
  },
  {
    id: 'CP-R17',
    from: 'PROC-SOURCING-EVENT',
    predicate: 'issues',
    to: 'PROC-SOURCING-REQUEST',
    cardinality: '1 ↔ 1..*',
    governance: 'Issued request versions are controlled.'
  },
  {
    id: 'CP-R18',
    from: 'PROC-SOURCING-REQUEST',
    predicate: 'answered by',
    to: 'PROC-SOURCING-RESPONSE',
    cardinality: '1 ↔ 0..*',
    governance: 'Each supplier response preserves submission evidence.'
  },
  {
    id: 'CP-R19',
    from: 'PROC-SOURCING-EVENT',
    predicate: 'evaluated by',
    to: 'PROC-EVALUATION',
    cardinality: '1 ↔ 0..*',
    governance: 'Evaluation rounds retain criteria and reviewer provenance.'
  },
  {
    id: 'CP-R20',
    from: 'PROC-EVALUATION',
    predicate: 'recommends',
    to: 'PROC-AWARD',
    cardinality: '0..* ↔ 0..*',
    governance: 'Recommendation is not authority; Award remains explicit.'
  },
  {
    id: 'CP-R21',
    from: 'PROC-AWARD',
    predicate: 'creates/bases',
    to: 'PROC-PURCHASE-ORDER',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Award and commitment are distinct records.'
  },
  {
    id: 'CP-R22',
    from: 'PROC-AWARD',
    predicate: 'may create',
    to: 'CBO-CONTRACT',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Subcontract/appointment/framework are Contract types linked back to Award.'
  },
  {
    id: 'CP-R23',
    from: 'PROC-PURCHASE-ORDER',
    predicate: 'fulfilled by',
    to: 'PROC-RECEIPT',
    cardinality: '1 ↔ 0..*',
    governance: 'Receipts evidence fulfilment and preserve corrections/reversals.'
  },
  {
    id: 'CP-R25',
    from: 'PROC-PURCHASE-ORDER',
    predicate: 'may release through',
    to: 'PROC-CALLOFF',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Call-off is one authorised release identity reused by downstream logistics.'
  },
  {
    id: 'CP-R26',
    from: 'CBO-CONTRACT',
    predicate: 'may govern',
    to: 'PROC-CALLOFF',
    cardinality: '0..1 ↔ 0..*',
    governance: 'Framework/contract call-off retains governing agreement and authority provenance.'
  },
  {
    id: 'CP-R24',
    from: 'COM-PROCUREMENT-PACKAGE',
    predicate: 'maps to',
    to: 'DEL-WORK-PACKAGE',
    cardinality: '0..* ↔ 0..*',
    governance: 'Procurement and delivery structures remain distinct.'
  }
];

export const commercialBoundaries: CommercialBoundary[] = [
  {
    name: 'Agreement identity',
    structure: 'Contract → Party roles / clauses / obligations / key dates',
    purpose: 'Govern legal/commercial agreement truth.',
    mustNotBecome: 'Project/WBS structure or supplier master.'
  },
  {
    name: 'Delivery scope',
    structure: 'Project → WBS → Work Package',
    purpose: 'Decompose what is being delivered.',
    mustNotBecome: 'Commercial/procurement packaging.'
  },
  {
    name: 'Commercial scope',
    structure: 'Commercial Package ↔ Work Package / Contract',
    purpose: 'Group scope for commercial control.',
    mustNotBecome: 'Procurement Package or Contract identity.'
  },
  {
    name: 'Procurement scope',
    structure: 'Procurement Package → sourcing → award → commitment',
    purpose: 'Group and source external requirements.',
    mustNotBecome: 'WBS, Commercial Package or Purchase Order.'
  },
  {
    name: 'Commercial change',
    structure: 'Commercial Change → quotation / assessment / decision',
    purpose: 'Govern contract-form change mechanisms.',
    mustNotBecome: 'Silent Contract edit or generic workflow task.'
  },
  {
    name: 'Sourcing competition',
    structure: 'Sourcing Event → Request → Response → Evaluation → Award',
    purpose: 'Preserve market engagement and decision provenance.',
    mustNotBecome: 'Supplier relationship or external commitment.'
  }
];

export const commercialProcurementRules = [
  'Appointment, Subcontract and Framework Agreement are governed Contract types; they do not create parallel agreement master systems.',
  'Contract Party Role references canonical Party identity; employer, contractor, supplier and consultant roles never duplicate organisations.',
  'WBS, Work Package, Commercial Package and Procurement Package are different structures linked by explicit mappings.',
  'A Procurement Package is not a Purchase Order, Subcontract or Contract.',
  'Contract Key Date and Schedule Milestone are separate objects that may be mapped.',
  'Obligation is contractual truth; workflow tasks are work generated to fulfil or review it.',
  'Variation and Compensation Event are contract-form-specific types of Commercial Change, not separate change engines.',
  'RFQ/RFP use one controlled Sourcing Request pattern; Bid/Tender responses use one Sourcing Response pattern.',
  'Evaluation/recommendation does not constitute Award; Award requires authority and retained decision evidence.',
  'Purchase Order Line is a child of Purchase Order; amendments retain commitment history.',
  'BOF-09 and BOF-10 Call-off occurrences converge on one canonical Call-off Order owned by commercial/procurement truth and consumed by logistics.',
  'Goods/Service Receipt is immutable fulfilment evidence and does not itself approve an invoice.',
  'Every external commitment traces back to authorised sourcing/requisition/award or an explicit governed exception.'
];

export function validateCommercialProcurementModel() {
  const ids = new Set<string>();
  for (const item of commercialProcurementModel) {
    if (!item.modelId || ids.has(item.modelId))
      throw new Error(`Duplicate commercial/procurement model ID: ${item.modelId}`);
    if (
      !item.candidateKeys.length ||
      !item.scope.length ||
      !item.keyData.length ||
      !item.governance.length
    ) {
      throw new Error(`Incomplete commercial/procurement definition: ${item.modelId}`);
    }
    ids.add(item.modelId);
  }

  const externalIds = new Set(['CBO-PARTY', 'CBO-PROJECT', 'DEL-WORK-PACKAGE']);
  for (const relation of commercialProcurementRelationships) {
    if (!ids.has(relation.from) && !externalIds.has(relation.from))
      throw new Error(`Unknown commercial relationship source: ${relation.from}`);
    if (!ids.has(relation.to) && !externalIds.has(relation.to))
      throw new Error(`Unknown commercial relationship target: ${relation.to}`);
  }
  return true;
}
