import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const continuityCrisisSecurityCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-23-001',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Business Impact Assessment',
    notes:
      'Dated attributable assessment of disruption impacts, criticality, dependencies and recovery requirements for a governed business/operational scope. It is not the continuity plan itself.'
  },
  {
    candidateKey: 'BOF-23-002',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Continuity Strategy',
    notes:
      'Versioned strategy selecting resilience and continuity approaches for critical services/resources based on impact/risk evidence. It is distinct from operational Continuity Plans.'
  },
  {
    candidateKey: 'BOF-23-003',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Continuity Plan',
    notes:
      'Versioned actionable continuity plan defining activation criteria, roles, procedures, workarounds, resources, communications and recovery steps for a defined scope.'
  },
  {
    candidateKey: 'BOF-23-004',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Continuity Exercise',
    notes:
      'Governed exercise occurrence testing exact continuity/recovery plan versions, scenarios, participants and objectives, with observations, outcomes and improvement evidence.'
  },
  {
    candidateKey: 'BOF-23-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Crisis',
    notes:
      'Governed crisis case coordinating material disruption/emergency response, decisions, actions, communications and recovery across affected canonical subjects.'
  },
  {
    candidateKey: 'BOF-23-006',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Emergency Event',
    notes:
      'Immutable occurrence evidence describing an emergency/disruptive event, time, location/scope, affected people/assets/services and source evidence. A Crisis may be declared around one or more events.'
  },
  {
    candidateKey: 'BOF-23-007',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-06-024',
    proposedCanonicalName: 'Decision Action',
    notes:
      'Crisis Action reuses the shared enterprise action pattern with source event/crisis/decision, owner, due time, status and closure evidence; no crisis-only action engine.'
  },
  {
    candidateKey: 'BOF-23-008',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-25-012',
    proposedCanonicalName: 'Communication Item',
    notes:
      'Crisis Communication is a typed Communication Item with emergency/crisis context, priority, audience/channel and delivery evidence. Message content remains controlled Information Container content.'
  },
  {
    candidateKey: 'BOF-23-009',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Disaster Recovery Invocation',
    notes:
      'Governed invocation occurrence of an exact Disaster Recovery Plan/version, retaining trigger, authority, affected technology/services, timings, actions, outcome and recovery evidence.'
  },
  {
    candidateKey: 'BOF-23-010',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Physical Security Zone',
    notes:
      'Governed security-control zone/overlay defining protection/access requirements across canonical physical extents. It never creates a duplicate Site, Space or physical Zone hierarchy.'
  },
  {
    candidateKey: 'BOF-23-011',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-23-012',
    proposedCanonicalName: 'Physical Access Credential',
    notes:
      'Visitor Pass is a typed time-bounded Physical Access Credential with sponsor/visitor context and approved zones; no separate visitor credential architecture.'
  },
  {
    candidateKey: 'BOF-23-012',
    decision: 'RENAME',
    proposedCanonicalName: 'Physical Access Credential',
    notes:
      'Governed physical-access authorization/credential linked to canonical Person/Party identity, permitted security zones, validity, issuing authority and revocation history.'
  },
  {
    candidateKey: 'BOF-23-013',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Physical Security Incident',
    notes:
      'Governed physical-security case for intrusion, theft, violence/threat, access breach, suspicious activity or other physical-security event, with investigation/evidence and response links.'
  },
  {
    candidateKey: 'BOF-23-014',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-21-003',
    proposedCanonicalName: 'Risk Assessment',
    notes:
      'Travel Risk Assessment reuses the shared Risk Assessment pattern with travel/person/journey/location scope and specialist method/context.'
  },
  {
    candidateKey: 'BOF-23-015',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-21-003',
    proposedCanonicalName: 'Risk Assessment',
    notes:
      'Security Risk Assessment reuses the shared Risk Assessment pattern with threat/vulnerability/security-control context rather than a separate risk engine.'
  }
];
