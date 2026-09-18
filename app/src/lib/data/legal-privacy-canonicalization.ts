import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const legalPrivacyCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-22-001',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Legal Matter',
    notes:
      'Governed legal matter/case context linking Parties, Contracts, Projects, obligations, advice, disputes, proceedings, filings and evidence without duplicating those source identities.'
  },
  {
    candidateKey: 'BOF-22-002',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Legal Advice Request',
    notes:
      'Governed request for legal advice against exact facts, question, scope and source materials. Advice/output remains controlled information/evidence separate from the request.'
  },
  {
    candidateKey: 'BOF-22-003',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Legal Obligation',
    notes:
      'Governed residual legal/court/fiduciary/statutory duty where the source is not already represented as Contract Obligation or Regulatory Obligation. Source authority and effectivity are explicit.'
  },
  {
    candidateKey: 'BOF-22-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Statutory Filing',
    notes:
      'Governed filing obligation/case with authority, filing type, period/due date, exact submitted content, submission evidence and regulator/registry response.'
  },
  {
    candidateKey: 'BOF-22-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Intellectual Property Asset',
    notes:
      'Governed intangible legal-right asset such as patent, trademark, registered design, copyright/right or domain-related IP with owner, jurisdiction, registration and lifecycle evidence.'
  },
  {
    candidateKey: 'BOF-22-006',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Dispute',
    notes:
      'Governed dispute case between Parties with basis, claims/issues, amounts/exposure where relevant, forum/route, settlement/proceeding links and retained evidence.'
  },
  {
    candidateKey: 'BOF-22-007',
    decision: 'RENAME',
    proposedCanonicalName: 'Legal Proceeding',
    notes:
      'Court/tribunal/arbitration or formal litigation proceeding with forum, case reference, parties, pleadings/orders/hearings and outcome. It may arise from a Dispute but is not the same case identity.'
  },
  {
    candidateKey: 'BOF-22-008',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-22-001',
    proposedCanonicalName: 'Legal Matter',
    notes:
      'Regulatory Matter is a Legal Matter type/context unless a specialist domain such as building safety owns a more specific Regulator Case.'
  },
  {
    candidateKey: 'BOF-22-009',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Legal Hold',
    notes:
      'Governed preservation instruction defining matter/basis, custodians/systems/data scope, start/end, authority and release. Exact records/objects are placed under hold through Legal Hold Links.'
  },
  {
    candidateKey: 'BOF-22-010',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'eDiscovery Collection',
    notes:
      'Governed evidence collection/snapshot preserving collection scope, custodians/sources, search/collection method, chain of custody, integrity and export/production provenance.'
  },
  {
    candidateKey: 'BOF-22-011',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-07-007',
    proposedCanonicalName: 'Information Container',
    notes:
      'Privacy Policy is a controlled Information Container type with governed revision, approval, issue, distribution and supersession semantics.'
  },
  {
    candidateKey: 'BOF-22-012',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Privacy Framework',
    notes:
      'Versioned privacy-governance framework defining principles, roles, lawful-basis approach, assessment/control requirements, accountability and review rules.'
  },
  {
    candidateKey: 'BOF-22-013',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Processing Activity',
    notes:
      'Stable governed definition of personal-data processing purpose, data subjects/categories, data, lawful basis, recipients, systems/processors, retention, transfers and controls. It is not a runtime processing event.'
  },
  {
    candidateKey: 'BOF-22-014',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Data Protection Impact Assessment',
    notes:
      'Dated/versioned privacy-risk assessment evidence for a proposed/current Processing Activity or change, preserving scope, risks, controls, consultation, decision and review basis.'
  },
  {
    candidateKey: 'BOF-22-015',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Consent Evidence',
    notes:
      'Immutable attributable evidence of consent grant, refusal or withdrawal against exact subject, purpose, wording/version, channel and time. Consent is evidence/lawful-basis context, not Person identity.'
  },
  {
    candidateKey: 'BOF-22-016',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Preference Evidence',
    notes:
      'Immutable evidence of a person/customer communication or processing preference and change history. Preference is distinct from consent unless the legal basis/rule explicitly treats it as consent.'
  },
  {
    candidateKey: 'BOF-22-017',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Data Subject Request',
    notes:
      'Governed privacy-rights request/case linking canonical Person/Party identity to request type, verification, scope, searches, decisions, disclosures/actions and deadline evidence.'
  },
  {
    candidateKey: 'BOF-22-018',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-22-019',
    proposedCanonicalName: 'Privacy Incident',
    notes:
      'Privacy Breach is a Privacy Incident classification where breach criteria are met; assessment/notification decisions preserve the breach determination and reporting basis.'
  },
  {
    candidateKey: 'BOF-22-019',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Privacy Incident',
    notes:
      'Governed privacy/personal-data incident case covering suspected or actual confidentiality, integrity, availability or unlawful-processing events, impact, assessment, notification and remediation.'
  },
  {
    candidateKey: 'BOF-22-020',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'International Data Transfer Arrangement',
    notes:
      'Governed relationship/arrangement for transfer of personal data between exporter/importer, processing activity, jurisdictions and transfer mechanism. Actual data movement remains in source systems/events.'
  },
  {
    candidateKey: 'BOF-22-021',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-13-014',
    proposedCanonicalName: 'Assurance Review',
    notes:
      'Privacy Assurance Review reuses the shared Assurance Review occurrence pattern with privacy scope, criteria, evidence and findings.'
  }
];
