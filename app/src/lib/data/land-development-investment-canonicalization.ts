import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const landDevelopmentInvestmentCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-04-001',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Development Opportunity',
    notes:
      'Governed development/investment opportunity concerning land/property and potential development outcomes. It is distinct from CRM Opportunity because it need not represent a customer sales opportunity.'
  },
  {
    candidateKey: 'BOF-04-002',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-04-003',
    proposedCanonicalName: 'Business Case',
    notes:
      'Investment Case is a Business Case type with investment-specific return, risk, funding and decision criteria rather than a separate case architecture.'
  },
  {
    candidateKey: 'BOF-04-003',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Business Case',
    notes:
      'Governed decision-support case bringing objectives, options, benefits, costs, risks, assumptions and evidence together for an investment/development decision.'
  },
  {
    candidateKey: 'BOF-04-004',
    decision: 'PROJECTION',
    proposedCanonicalName: 'Development Appraisal',
    notes:
      'Versioned/snapshotted development viability appraisal derived from exact land, cost, revenue, programme, funding and assumption sources. It is decision support, not financial-ledger truth.'
  },
  {
    candidateKey: 'BOF-04-005',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-08-002',
    proposedCanonicalName: 'Contract',
    notes:
      'Land/development Option is a Contract/agreement type with option-specific grantor/grantee, exercise window, price/mechanism, conditions and land/property scope; no parallel agreement master.'
  },
  {
    candidateKey: 'BOF-04-006',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Site Appraisal',
    notes:
      'Dated multi-disciplinary appraisal/assessment evidence for a Site/Land Parcel/Property covering planning, access, technical, environmental, legal and commercial considerations.'
  },
  {
    candidateKey: 'BOF-04-007',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-16-004',
    proposedCanonicalName: 'Land Parcel',
    notes:
      'Development/acquisition work reuses the canonical cadastral Land Parcel identity from the built-environment spatial model.'
  },
  {
    candidateKey: 'BOF-04-008',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Property Interest',
    notes:
      'Effective-dated legal/economic/beneficial interest relationship connecting Party to Property/Land Parcel and interest type, extent, share, tenure, source instrument and dates.'
  },
  {
    candidateKey: 'BOF-04-009',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-04-008',
    proposedCanonicalName: 'Property Interest',
    notes:
      'Ownership Interest is a Property Interest type; ownership changes preserve relationship history without changing Party or Property/Land Parcel identity.'
  },
  {
    candidateKey: 'BOF-04-010',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-04-008',
    proposedCanonicalName: 'Property Interest',
    notes:
      'Occupation Interest is a Property Interest type such as lease/licence/occupation right; it is not a duplicate Property or Party master.'
  },
  {
    candidateKey: 'BOF-04-011',
    decision: 'RENAME',
    proposedCanonicalName: 'Development Constraint',
    notes:
      'Constraint affecting development/land/property viability or consent. It is distinct from project-delivery Constraint, although an accepted development constraint may later create/map to project controls.'
  },
  {
    candidateKey: 'BOF-04-012',
    decision: 'RENAME',
    proposedCanonicalName: 'Property Valuation',
    notes:
      'Professional valuation opinion for Property/Land Parcel/Property Interest at an effective valuation date and basis. It is distinct from BOF-08 contract/payment Valuation.'
  },
  {
    candidateKey: 'BOF-04-013',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Land / Property Survey',
    notes:
      'Dated survey occurrence/evidence against exact land/property/spatial scope; resulting plans/reports/models use controlled Information Container semantics.'
  },
  {
    candidateKey: 'BOF-04-014',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Planning Application',
    notes:
      'Governed planning/development-consent application case with authority, jurisdiction, exact proposal/information revisions, submission history, consultation, determination and appeal links.'
  },
  {
    candidateKey: 'BOF-04-015',
    decision: 'RENAME',
    proposedCanonicalName: 'Planning Consent',
    notes:
      'Governed planning/development authorization/consent linked to exact application/proposal, authority, scope, decision date, expiry/effectivity and conditions.'
  },
  {
    candidateKey: 'BOF-04-016',
    decision: 'CHILD',
    proposedCanonicalName: 'Planning Condition',
    notes:
      'Condition attached to a Planning Consent with requirement, trigger, due/compliance point, discharge evidence and status. It is subordinate to the consent rather than a free-standing plan master.'
  },
  {
    candidateKey: 'BOF-04-017',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-22-003',
    proposedCanonicalName: 'Legal Obligation',
    notes:
      'Planning Obligation reuses the governed Legal Obligation pattern while preserving planning source/basis and links to the relevant consent, agreement, authority, land and Parties.'
  },
  {
    candidateKey: 'BOF-04-018',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Funding Evidence',
    notes:
      'Immutable attributable evidence supporting availability/commitment/approval of funding for a defined case/opportunity/project, linked to source facility/grant/finance instrument where applicable.'
  },
  {
    candidateKey: 'BOF-04-019',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-04-018',
    proposedCanonicalName: 'Funding Evidence',
    notes:
      'Grant Evidence is a Funding Evidence type retaining grant programme/award/source and exact evidence rather than a second evidence architecture.'
  }
];
