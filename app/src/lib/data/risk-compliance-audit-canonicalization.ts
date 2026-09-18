import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const riskComplianceAuditCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-21-001',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Risk Framework',
    notes:
      'Governed enterprise risk framework defining taxonomy, methodology, appetite/tolerance, scales, ownership and review rules. Framework/configuration is distinct from individual Risks and Assessments.'
  },
  {
    candidateKey: 'BOF-21-002',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Enterprise Risk',
    notes:
      'Stable governed risk identity describing uncertain event/condition, causes, consequences, scope and ownership. Current rating is derived from retained Risk Assessments.'
  },
  {
    candidateKey: 'BOF-21-003',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Risk Assessment',
    notes:
      'Dated/context-specific assessment evidence for an Enterprise Risk or other governed risk subject, retaining method, inherent/residual rating, controls and assessor provenance.'
  },
  {
    candidateKey: 'BOF-21-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Treatment Plan',
    notes:
      'Versioned plan defining selected risk responses, actions, owners, dates and target risk position. It does not overwrite Risk identity or Assessment evidence.'
  },
  {
    candidateKey: 'BOF-21-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Regulatory Obligation',
    notes:
      'Governed source duty imposed by legislation, regulation, licence, regulator or statutory instrument, with jurisdiction, applicability and effectivity.'
  },
  {
    candidateKey: 'BOF-21-006',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Compliance Requirement',
    notes:
      'Actionable/testable requirement derived from obligations, standards, contracts, permits or policy with applicability, ownership and evidence expectations.'
  },
  {
    candidateKey: 'BOF-21-007',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Compliance Assessment',
    notes:
      'Dated assessment evidence evaluating applicable Compliance Requirements against retained evidence and defined method.'
  },
  {
    candidateKey: 'BOF-21-008',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Internal Control',
    notes:
      'Persistent control definition describing objective, risk/requirement coverage, performer/owner, frequency, method and evidence expectations.'
  },
  {
    candidateKey: 'BOF-21-009',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Control Test',
    notes:
      'Immutable control-test occurrence/result against an exact Internal Control version, test procedure, sample/population and evidence set.'
  },
  {
    candidateKey: 'BOF-21-010',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Assurance Plan',
    notes:
      'Versioned assurance programme/plan covering planned reviews, audits, tests or other assurance activities by scope, period and assurance provider.'
  },
  {
    candidateKey: 'BOF-21-011',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-21-010',
    proposedCanonicalName: 'Assurance Plan',
    notes:
      'Audit Plan is an Assurance Plan type with audit-specific scope, methodology and engagement pipeline; no second planning engine is required.'
  },
  {
    candidateKey: 'BOF-21-012',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Audit Engagement',
    notes:
      'Governed audit execution/case with scope, criteria, team, independence, evidence, findings, report and closure provenance.'
  },
  {
    candidateKey: 'BOF-21-013',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Audit Finding',
    notes:
      'Governed audit finding/case linked to exact engagement, criteria, evidence, significance, management response and closure verification.'
  },
  {
    candidateKey: 'BOF-21-014',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Remediation Action',
    notes:
      'Governed domain action responding to a finding, assessment, control deficiency, risk or compliance issue. Workflow Work Items may coordinate it but never replace its business truth.'
  },
  {
    candidateKey: 'BOF-21-015',
    decision: 'RENAME',
    proposedCanonicalName: 'Integrity Case',
    notes:
      'Fraud Case uses a restricted Integrity Case pattern with case type Fraud, preserving allegation, triage, investigation, loss/impact, reporting and outcome evidence.'
  },
  {
    candidateKey: 'BOF-21-016',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-21-015',
    proposedCanonicalName: 'Integrity Case',
    notes:
      'Conduct Case uses the same restricted Integrity Case pattern with case type Conduct and appropriate policy/HR/legal links.'
  },
  {
    candidateKey: 'BOF-21-017',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Compliance Evidence',
    notes:
      'Immutable attributable evidence supporting compliance with one or more requirements, retaining source, subject, validity, provenance and verification.'
  }
];
