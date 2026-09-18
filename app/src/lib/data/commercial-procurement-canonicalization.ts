import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const commercialProcurementCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-08-001',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-002',
    notes:
      'Appointment uses the canonical Contract identity pattern with contract type/classification preserving appointment semantics. It does not require a parallel agreement master.'
  },
  {
    candidateKey: 'BOF-08-003',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-002',
    notes:
      'Subcontract is a governed Contract type. Subcontract-specific terms, roles and processes are configuration/context over one Contract identity pattern.'
  },
  {
    candidateKey: 'BOF-08-004',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-002',
    notes:
      'Framework Agreement uses the canonical Contract identity pattern with framework-specific call-off and effectivity semantics.'
  },
  {
    candidateKey: 'BOF-08-005',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Contract Party Role',
    notes:
      'Effective relationship binding a canonical Party to a Contract in a contractual role. Contract roles never create duplicate Party/Organisation masters.'
  },
  {
    candidateKey: 'BOF-08-006',
    decision: 'CHILD',
    proposedCanonicalName: 'Contract Clause',
    notes:
      'Controlled contractual term within a Contract/version/amendment. Clauses retain provenance and amendment history rather than existing as an unrelated enterprise master.'
  },
  {
    candidateKey: 'BOF-08-007',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Obligation',
    notes:
      'Structured contractual duty with explicit obligor, beneficiary, basis, effectivity and evidence. Obligation is business truth; workflow tasks may be generated to fulfil it.'
  },
  {
    candidateKey: 'BOF-08-008',
    decision: 'RENAME',
    proposedCanonicalName: 'Contract Key Date',
    notes:
      'Contractually significant date/period. It remains distinct from a Schedule Milestone, although an explicit mapping may connect them.'
  },
  {
    candidateKey: 'BOF-08-009',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Contract Notice',
    notes:
      'Formal issued contractual communication with legally material issue/delivery evidence. General application notifications cannot substitute for it.'
  },
  {
    candidateKey: 'BOF-08-011',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Commercial Package',
    notes:
      'Commercial grouping of project/delivery scope. It maps to WBS/Work Packages, Procurement Packages and Contracts but is not any of those objects.'
  },
  {
    candidateKey: 'BOF-08-012',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Procurement Package',
    notes:
      'Canonical sourcing-scope package reused across commercial and procurement workspaces. It is not the resulting Purchase Order, Subcontract or Contract.'
  },
  {
    candidateKey: 'BOF-08-014',
    decision: 'RENAME',
    proposedCanonicalName: 'Commercial Change',
    notes:
      'Canonical governed commercial/contractual change case. Contract-form terminology and process are expressed by change type/configuration.'
  },
  {
    candidateKey: 'BOF-08-015',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-014',
    notes:
      'Variation is a contract-form/context-specific type of Commercial Change, not a separate change engine.'
  },
  {
    candidateKey: 'BOF-08-016',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-014',
    notes:
      'Compensation Event is represented as a governed Commercial Change type with NEC-specific rules and evidence, preserving terminology without duplicate core identity.'
  },
  {
    candidateKey: 'BOF-08-017',
    decision: 'RENAME',
    proposedCanonicalName: 'Change Quotation',
    notes:
      'Controlled priced/time proposal linked to a Commercial Change. Submitted versions remain immutable evidence and do not themselves amend the Contract.'
  },
  {
    candidateKey: 'BOF-08-018',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Claim Entitlement Basis',
    notes:
      'Entitlement is the governed contractual basis supporting a Commercial Claim; it is contextual to contract/claim and not an independent party/master identity.'
  },
  {
    candidateKey: 'BOF-08-019',
    decision: 'RENAME',
    proposedCanonicalName: 'Commercial Claim',
    notes:
      'Governed assertion of contractual entitlement and requested remedy with evidence, assessment and decision history.'
  },
  {
    candidateKey: 'BOF-09-001',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-01-016',
    notes:
      'Supplier Relationship is a typed Party Relationship using canonical Organisation/Party identity rather than a separate supplier master.'
  },
  {
    candidateKey: 'BOF-09-006',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-012',
    notes:
      'Procurement workspace reuses the same canonical Procurement Package identity first encountered in commercial management.'
  },
  {
    candidateKey: 'BOF-09-007',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Requisition',
    notes:
      'Authorised request to procure before external commitment. Requisition remains distinct from sourcing, award and purchase-order records.'
  },
  {
    candidateKey: 'BOF-09-008',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Sourcing Event',
    notes:
      'Governed competition/negotiation process spanning requests, supplier responses, evaluation and award.'
  },
  {
    candidateKey: 'BOF-09-009',
    decision: 'RENAME',
    proposedCanonicalName: 'Sourcing Request',
    notes:
      'Canonical controlled request issued in a Sourcing Event. RFQ is a request type, not a separate procurement architecture.'
  },
  {
    candidateKey: 'BOF-09-010',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-09-009',
    notes:
      'RFP uses the same Sourcing Request pattern as RFQ with configured information/response requirements.'
  },
  {
    candidateKey: 'BOF-09-012',
    decision: 'RENAME',
    proposedCanonicalName: 'Sourcing Response',
    notes:
      'Canonical supplier response pattern retaining submitted technical/commercial offer and evidence.'
  },
  {
    candidateKey: 'BOF-09-013',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-09-012',
    notes: 'Tender Response uses the same Sourcing Response identity pattern as Bid Response.'
  },
  {
    candidateKey: 'BOF-09-014',
    decision: 'RENAME',
    proposedCanonicalName: 'Sourcing Evaluation',
    notes:
      'Governed evaluation round preserving criteria, reviewers, scores, moderation and decision provenance.'
  },
  {
    candidateKey: 'BOF-09-015',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-09-014',
    notes:
      'Comparison is an output/view of governed Sourcing Evaluation, not a separate supplier-response or award master.'
  },
  {
    candidateKey: 'BOF-09-016',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Award',
    notes:
      'Authorised procurement decision selecting response(s) and forming the basis of resulting commitment. Award is distinct from the Contract or Purchase Order.'
  },
  {
    candidateKey: 'BOF-09-017',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Purchase Order',
    notes: 'External procurement commitment with controlled child lines and amendment history.'
  },
  {
    candidateKey: 'BOF-09-018',
    decision: 'CHILD',
    proposedCanonicalName: 'Purchase Order Line',
    notes:
      'Value-bearing child of Purchase Order; it does not become an independent commitment master.'
  },
  {
    candidateKey: 'BOF-09-022',
    decision: 'CHILD',
    proposedCanonicalName: 'Purchase Order Amendment',
    notes:
      'Controlled amendment history belonging to the Purchase Order rather than a second commitment identity.'
  },
  {
    candidateKey: 'BOF-09-023',
    decision: 'RENAME',
    proposedCanonicalName: 'Procurement Receipt',
    notes: 'Canonical immutable fulfilment event pattern; Goods Receipt is a typed receipt.'
  },
  {
    candidateKey: 'BOF-09-024',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-09-023',
    notes:
      'Service Receipt uses the same Procurement Receipt event pattern with service-specific acceptance/evidence.'
  },
  {
    candidateKey: 'BOF-08-010',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Contract Correspondence',
    notes:
      'Attributed issued/received commercial correspondence linked to Contract and subject, retaining content/version, parties and timestamp. It remains distinct from formal Contract Notice where notice rules apply.'
  },
  {
    candidateKey: 'BOF-08-013',
    decision: 'RENAME',
    proposedCanonicalName: 'Contract Instruction',
    notes:
      'Governed contractual/commercial direction with stable identity, issuer authority, basis, scope, issue evidence and response/implementation traceability. It may initiate Commercial Change but is not the change itself.'
  },
  {
    candidateKey: 'BOF-08-020',
    decision: 'RENAME',
    proposedCanonicalName: 'Contract Payment Application',
    notes:
      'Governed payment application transaction against a Contract/payment cycle with valuation basis, claimed amount, supporting evidence and immutable submitted versions.'
  },
  {
    candidateKey: 'BOF-08-021',
    decision: 'RENAME',
    proposedCanonicalName: 'Commercial Valuation',
    notes:
      'Governed valuation transaction measuring work/value for a defined Contract, period and valuation basis. It remains distinct from invoice, payment and accounting postings.'
  },
  {
    candidateKey: 'BOF-08-022',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Commercial Assessment',
    notes:
      'Dated assessment evidence recording the authorised commercial assessment of an application, change or claim, including basis, quantities/amounts, assessor and retained reasoning.'
  },
  {
    candidateKey: 'BOF-08-023',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Payment Certificate',
    notes:
      'Immutable certification evidence of the amount/status certified under a Contract for a payment cycle, linked to exact valuation/assessment and authority.'
  },
  {
    candidateKey: 'BOF-08-024',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-009',
    proposedCanonicalName: 'Contract Notice',
    notes:
      'Pay-less Record is governed as a typed Contract Notice with payment-cycle, amount/basis and statutory/contractual delivery evidence rather than a second notice architecture.'
  },
  {
    candidateKey: 'BOF-08-025',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Payment Withholding Record',
    notes:
      'Immutable evidence of an authorised withholding/deduction against a payment position with contractual/legal basis, amount, reason and linkage to valuation/certificate/payment cycle.'
  },
  {
    candidateKey: 'BOF-08-026',
    decision: 'PROJECTION',
    proposedCanonicalName: 'Retention Position',
    notes:
      'Current retention is a derived commercial position from Contract retention terms and certified/paid transactions. Source terms and transaction evidence remain authoritative; the balance is not a separate mutable ledger.'
  },
  {
    candidateKey: 'BOF-08-027',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Bond',
    notes:
      'Governed security instrument linked to Contract, issuing/beneficiary Parties, value, terms, expiry/call conditions and retained instrument evidence.'
  },
  {
    candidateKey: 'BOF-08-028',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Guarantee',
    notes:
      'Governed guarantee/security instrument with guarantor, beneficiary, underlying obligation, limits, effectivity and evidence; distinct from Bond where legal form/risk differs.'
  },
  {
    candidateKey: 'BOF-08-029',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Insurance Evidence',
    notes:
      'Immutable evidence that required insurance cover exists for an exact Party/Contract/risk scope and period, retaining insurer, policy reference, limits and verification provenance.'
  },
  {
    candidateKey: 'BOF-08-030',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Daywork Record',
    notes:
      'Attributed contemporaneous record of labour, plant, materials and other daywork evidence for a defined instruction/change/date, retained as commercial valuation evidence.'
  },
  {
    candidateKey: 'BOF-08-031',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Final Account',
    notes:
      'Governed commercial closeout/settlement identity consolidating agreed contract value, changes, adjustments, retention and residual matters without replacing underlying transactions or finance ledger truth.'
  },

  {
    candidateKey: 'BOF-09-002',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Supplier Qualification Assessment',
    notes:
      'Dated assessment evidence evaluating a Supplier Relationship against configured qualification criteria, evidence and scope; qualification evidence is distinct from current approved status.'
  },
  {
    candidateKey: 'BOF-09-003',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Approved Supplier Status',
    notes:
      'Effective-dated approval relationship/status for a Supplier Relationship by category, organisation, jurisdiction or procurement scope, with decision basis and expiry/suspension history.'
  },
  {
    candidateKey: 'BOF-09-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Procurement Strategy',
    notes:
      'Governed strategy defining procurement objectives, routes, packaging principles, market approach, risk/controls and approval basis for a defined enterprise/programme/project scope.'
  },
  {
    candidateKey: 'BOF-09-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Procurement Plan',
    notes:
      'Versioned executable plan of Procurement Packages, sourcing routes, target dates, responsibilities and dependencies derived from approved strategy and delivery need.'
  },
  {
    candidateKey: 'BOF-09-011',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Sourcing Invitation',
    notes:
      'Attributed invitation/issue evidence linking a Sourcing Request/Event to an invited supplier Party with issue channel, timestamp and response eligibility; request content remains separately controlled.'
  },
  {
    candidateKey: 'BOF-09-019',
    decision: 'RENAME',
    proposedCanonicalName: 'Call-off Order',
    notes:
      'Governed commitment transaction placing defined quantity/value/scope under an existing Framework/Contract or ordering arrangement, with independent reference, authority and fulfilment history.'
  },
  {
    candidateKey: 'BOF-09-020',
    decision: 'CHILD',
    proposedCanonicalName: 'Delivery Schedule',
    notes:
      'Controlled delivery-plan component attached to a procurement commitment/call-off, retaining planned dates/quantities/locations and revisions without becoming the Project Schedule.'
  },
  {
    candidateKey: 'BOF-09-021',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-002',
    proposedCanonicalName: 'Contract',
    notes:
      'Subcontract Commitment uses the canonical Contract/Subcontract identity and award provenance rather than a separate procurement commitment master.'
  },
  {
    candidateKey: 'BOF-09-025',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Supplier Performance Review',
    notes:
      'Dated supplier-performance assessment evidence against defined relationship/category/contract scope, criteria and period; trend/status is derived from retained reviews.'
  },
  {
    candidateKey: 'BOF-09-026',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-21-002',
    proposedCanonicalName: 'Enterprise Risk',
    notes:
      'Supplier Risk reuses the canonical Enterprise Risk identity with Supplier Relationship/procurement scope and retained Risk Assessments rather than a second risk engine.'
  },
  {
    candidateKey: 'BOF-09-027',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-22-006',
    proposedCanonicalName: 'Dispute',
    notes:
      'Supplier Dispute reuses the canonical Dispute case with Supplier Relationship/Contract/procurement context rather than a procurement-only dispute architecture.'
  },
  {
    candidateKey: 'BOF-09-028',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Sourcing Evidence',
    notes:
      'Immutable evidence supporting sourcing execution and decisions, including communications, clarifications, submissions, evaluation provenance and governed exceptions, linked to the authoritative Sourcing Event.'
  }
];
