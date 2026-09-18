import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const knowledgeRecordsCommunicationsCanonicalization: FoundationCanonicalizationDecision[] =
  [
    {
      candidateKey: 'BOF-25-001',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Knowledge Article is a governed Information Container type/profile with knowledge metadata, publication, review and expiry semantics; it is not a second content master.'
    },
    {
      candidateKey: 'BOF-25-002',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Knowledge Collection',
      notes:
        'Governed curated collection grouping Knowledge Articles and other approved knowledge references without duplicating their identities/content.'
    },
    {
      candidateKey: 'BOF-25-003',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Controlled Document uses the canonical Information Container identity/revision/issue model.'
    },
    {
      candidateKey: 'BOF-25-004',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Knowledge/records management reuses the canonical Information Container rather than maintaining a separate document master.'
    },
    {
      candidateKey: 'BOF-25-005',
      decision: 'RELATIONSHIP',
      proposedCanonicalName: 'Record Declaration',
      notes:
        'Declaring something as a record creates a governed relationship over the authoritative object/evidence item with Record Type, series/file, retention and declaration provenance; it does not copy the object into a record silo.'
    },
    {
      candidateKey: 'BOF-25-006',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Record Series',
      notes:
        'Controlled records-series definition grouping related records by business function/activity and retention/appraisal rules. It is not content storage.'
    },
    {
      candidateKey: 'BOF-25-007',
      decision: 'RENAME',
      proposedCanonicalName: 'Record File Aggregation',
      notes:
        'Governed aggregation of declared records for a case, subject, period or activity. Record File is not a binary file, filesystem folder or Information Container.'
    },
    {
      candidateKey: 'BOF-25-008',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Retention Schedule',
      notes:
        'Versioned retention/appraisal policy mapping Record Types/Series and jurisdictional triggers to retention, review, archive and disposition rules.'
    },
    {
      candidateKey: 'BOF-25-009',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Disposition Request',
      notes:
        'Governed domain request proposing disposition of an exact eligible record set after retention, legal-hold and authority checks. Final disposition outcome is the BOF-28 Retention Disposition Decision.'
    },
    {
      candidateKey: 'BOF-25-010',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-25-001',
      proposedCanonicalName: 'Knowledge Article',
      notes:
        'Lesson Learned is a typed Knowledge Article with source context, observation, recommendation, applicability, validation and review metadata.'
    },
    {
      candidateKey: 'BOF-25-011',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Communications Plan',
      notes:
        'Versioned communications plan defining objectives, audiences, messages, channels, activities, owners, timing and measures.'
    },
    {
      candidateKey: 'BOF-25-012',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Communication Item',
      notes:
        'Governed planned/executed communication activity linking exact approved content to audience, channel, owner, timing and publication/delivery evidence. It is not the message content itself.'
    },
    {
      candidateKey: 'BOF-25-013',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Media Enquiry',
      notes:
        'Governed inbound media request/case with source, question, deadline, subject, owner, approved response content and interaction evidence.'
    },
    {
      candidateKey: 'BOF-25-014',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Media Release is controlled public content and reuses Information Container identity, revision, approval and issue semantics.'
    },
    {
      candidateKey: 'BOF-25-015',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Statement is controlled approved content and reuses Information Container identity/revision semantics.'
    },
    {
      candidateKey: 'BOF-25-016',
      decision: 'RENAME',
      proposedCanonicalName: 'Communications Campaign',
      notes:
        'PR Campaign is a Communications Campaign type with objectives, audiences, messages, activities, content, schedule, budget context and outcome measures.'
    },
    {
      candidateKey: 'BOF-25-017',
      decision: 'RENAME',
      proposedCanonicalName: 'External Affairs Issue',
      notes:
        'Reputation Issue uses one governed External Affairs Issue case pattern with type Reputation and retained assessment, stakeholders, response and evidence.'
    },
    {
      candidateKey: 'BOF-25-018',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-25-017',
      proposedCanonicalName: 'External Affairs Issue',
      notes:
        'Public Affairs Issue uses the same External Affairs Issue case pattern with type Public Affairs rather than a parallel issue engine.'
    },
    {
      candidateKey: 'BOF-25-019',
      decision: 'RENAME',
      proposedCanonicalName: 'Stakeholder Engagement',
      notes:
        'Investor Engagement is a typed attributable Stakeholder Engagement occurrence with Party/participants, purpose, channel, time, subjects, commitments/actions and evidence.'
    },
    {
      candidateKey: 'BOF-25-020',
      decision: 'MERGE',
      targetCandidateKey: 'BOF-07-007',
      proposedCanonicalName: 'Information Container',
      notes:
        'Annual Report is a controlled Information Container type with exact reporting period, approved revision, publication and evidence provenance; finance/reporting snapshots remain source truth.'
    },
    {
      candidateKey: 'BOF-25-021',
      decision: 'VALIDATE_OBJECT',
      proposedCanonicalName: 'Stakeholder Engagement Plan',
      notes:
        'Versioned plan defining stakeholder groups/Parties, objectives, engagement methods, cadence, responsibilities, issues, commitments and measures.'
    }
  ];
