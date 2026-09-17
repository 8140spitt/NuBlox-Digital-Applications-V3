import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const crmBusinessDevelopmentCanonicalization: FoundationCanonicalizationDecision[] = [
  { candidateKey: 'BOF-03-001', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Market Insight', notes: 'Attributable market intelligence/evidence with source and as-of context; not a market/customer master.' },
  { candidateKey: 'BOF-03-002', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Market Segment', notes: 'Governed classification/segmentation definition with effectivity; overlays Party/Opportunity identity.' },
  { candidateKey: 'BOF-03-003', decision: 'MERGE', targetCandidateKey: 'BOF-01-016', proposedCanonicalName: 'Party Relationship', notes: 'Account relationship is a contextual Party Relationship; do not create a duplicate Account/Organisation master.' },
  { candidateKey: 'BOF-03-004', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Account Plan', notes: 'Versioned plan scoped to a canonical Party Relationship/account context.' },
  { candidateKey: 'BOF-03-005', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Customer Interaction', notes: 'Attributable immutable interaction evidence linked to Party/relationship and relevant commercial objects.' },
  { candidateKey: 'BOF-03-006', decision: 'RENAME', proposedCanonicalName: 'CRM Activity', notes: 'Commercial/customer work activity distinct from Project Schedule Activity, Work Order and shared workflow Work Item.' },
  { candidateKey: 'BOF-03-007', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Lead', notes: 'Early commercial signal that may precede canonical Party resolution and may convert to Opportunity while preserving provenance.' },
  { candidateKey: 'BOF-03-008', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Opportunity', notes: 'Qualified commercial possibility with stable identity separate from Pursuit, Estimate, Proposal, Contract and Project.' },
  { candidateKey: 'BOF-03-009', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Pursuit', notes: 'Governed active commercial effort around an Opportunity; separate identity from Opportunity and Project.' },
  { candidateKey: 'BOF-03-010', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Bid/No-Bid Decision', notes: 'Immutable attributable decision evidence bound to exact opportunity/pursuit context and authority basis.' },
  { candidateKey: 'BOF-03-011', decision: 'PROJECTION', proposedCanonicalName: 'Pipeline Snapshot', notes: 'Frozen as-of projection derived from canonical Leads/Opportunities/Pursuits; never independently editable pipeline truth.' },
  { candidateKey: 'BOF-03-012', decision: 'PROJECTION', proposedCanonicalName: 'Sales Forecast Snapshot', notes: 'Frozen forecast projection with source opportunities, rule/scenario version and as-of context.' },
  { candidateKey: 'BOF-03-013', decision: 'RENAME', proposedCanonicalName: 'Customer Onboarding Case', notes: 'Onboarding is a governed case/process around establishing or activating a Party Relationship, not a relationship/master itself.' },
  { candidateKey: 'BOF-03-014', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Customer Case', notes: 'Governed customer matter requiring investigation/response/resolution and linked to canonical Party Relationship.' },
  { candidateKey: 'BOF-03-015', decision: 'MERGE', targetCandidateKey: 'BOF-03-014', proposedCanonicalName: 'Customer Case', notes: 'Complaint is a typed Customer Case with complaint-specific classification/severity/evidence rather than a parallel case architecture.' },
  { candidateKey: 'BOF-03-016', decision: 'MERGE', targetCandidateKey: 'BOF-01-016', proposedCanonicalName: 'Party Relationship', notes: 'Customer relationship is a typed/contextual Party Relationship between canonical Parties.' },
  { candidateKey: 'BOF-03-017', decision: 'MERGE', targetCandidateKey: 'BOF-01-016', proposedCanonicalName: 'Party Relationship', notes: 'Service relationship uses the shared Party Relationship identity pattern; service Contract/entitlement remain separate specialist objects.' }
];
