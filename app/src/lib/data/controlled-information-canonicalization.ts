export type ControlledInformationCanonicalization = {
  candidateKey: string;
  decision: 'VALIDATE_OBJECT' | 'MERGE' | 'RENAME' | 'RELATIONSHIP' | 'CHILD' | 'EVENT_EVIDENCE' | 'PROJECTION' | 'REJECT';
  proposedCanonicalName?: string;
  targetCandidateKey?: string;
  notes: string;
};

export const controlledInformationCanonicalization: ControlledInformationCanonicalization[] = [
  { candidateKey: 'BOF-07-001', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Information Requirement', notes: 'Canonical governed requirement pattern for required information, purpose, acceptance criteria, timing, recipient and applicability.' },
  { candidateKey: 'BOF-07-002', decision: 'MERGE', targetCandidateKey: 'BOF-07-001', proposedCanonicalName: 'Information Requirement', notes: 'Project Information Requirement is a governed requirement type/scope rather than a separate requirement engine.' },
  { candidateKey: 'BOF-07-003', decision: 'MERGE', targetCandidateKey: 'BOF-07-001', proposedCanonicalName: 'Information Requirement', notes: 'Asset Information Requirement is a governed requirement type/scope rather than a separate requirement engine.' },
  { candidateKey: 'BOF-07-004', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Information Deliverable', notes: 'Stable delivery-control identity for required information output, independent of the containers used to satisfy it.' },
  { candidateKey: 'BOF-07-005', decision: 'MERGE', targetCandidateKey: 'BOF-06-020', proposedCanonicalName: 'Responsibility Assignment', notes: 'Information-management responsibility reuses the shared scoped Responsibility Assignment model.' },
  { candidateKey: 'BOF-07-006', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Information Delivery Plan', notes: 'Governed plan coordinating deliverables, responsibilities, milestones and dependencies.' },
  { candidateKey: 'BOF-07-007', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Information Container', notes: 'Foundation canonical identity for controlled information independent of files/renditions.' },
  { candidateKey: 'BOF-07-008', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Document is an Information Container type/behaviour, not a separate information master.' },
  { candidateKey: 'BOF-07-009', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Drawing is an Information Container type/behaviour, not a separate information master.' },
  { candidateKey: 'BOF-07-010', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Model is an Information Container type/behaviour; native/model files are representations.' },
  { candidateKey: 'BOF-07-011', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Specification is a governed Information Container type unless later structured semantics justify a separate aggregate.' },
  { candidateKey: 'BOF-07-012', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Technical Schedule is a governed Information Container type unless later structured semantics justify a separate aggregate.' },
  { candidateKey: 'BOF-07-013', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', proposedCanonicalName: 'Information Container', notes: 'Calculation is a governed Information Container type with controlled revision/provenance.' },
  { candidateKey: 'BOF-07-014', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Technical Evidence', notes: 'Immutable attributed evidence referencing authoritative technical information/records.' },
  { candidateKey: 'BOF-07-015', decision: 'CHILD', proposedCanonicalName: 'Information Container Revision', notes: 'Revision is subordinate version structure of one stable Information Container, not a standalone information master.' },
  { candidateKey: 'BOF-07-016', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Information Issue', notes: 'Controlled release event for an exact revision, purpose, suitability and audience; distinct from a project Issue case.' },
  { candidateKey: 'BOF-07-017', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Transmittal', notes: 'Immutable exchange evidence recording exactly what information revisions were transmitted, to whom, when and why.' },
  { candidateKey: 'BOF-07-018', decision: 'RELATIONSHIP', proposedCanonicalName: 'Information Distribution', notes: 'Effective rule/relationship between information scope and recipient Party/role/team; not evidence of actual transmission.' },
  { candidateKey: 'BOF-07-019', decision: 'MERGE', targetCandidateKey: 'BOF-07-020', proposedCanonicalName: 'Information Query', notes: 'RFI is a query type within the shared Information Query pattern, with contractual significance captured separately where applicable.' },
  { candidateKey: 'BOF-07-020', decision: 'RENAME', proposedCanonicalName: 'Information Query', notes: 'Technical Query becomes the canonical query pattern covering technical query/RFI terminology.' },
  { candidateKey: 'BOF-07-021', decision: 'RENAME', proposedCanonicalName: 'Information Submittal', notes: 'Submission case referencing exact container revisions for review/acceptance/approval; submitted content is not duplicated.' },
  { candidateKey: 'BOF-07-022', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Information Response', notes: 'Attributed issued response to a query, submittal or review request; intentionally distinguished from generic Response concepts.' },
  { candidateKey: 'BOF-07-023', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Design Review', notes: 'Governed technical review case tied to exact revisions, requirements, reviewers, comments and outcome.' },
  { candidateKey: 'BOF-07-024', decision: 'CHILD', proposedCanonicalName: 'Review Comment', notes: 'Attributable child record under a Design Review with retained response/resolution history.' },
  { candidateKey: 'BOF-07-025', decision: 'RENAME', proposedCanonicalName: 'Design Coordination Issue', notes: 'Canonical design-coordination issue pattern covering multidisciplinary coordination problems.' },
  { candidateKey: 'BOF-07-026', decision: 'MERGE', targetCandidateKey: 'BOF-07-025', proposedCanonicalName: 'Design Coordination Issue', notes: 'Clash Issue is a typed Design Coordination Issue with model/viewpoint evidence.' },
  { candidateKey: 'BOF-07-027', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Design Change', notes: 'Governed technical change case distinct from Commercial Change, producing controlled successor information/configuration.' },
  { candidateKey: 'BOF-07-028', decision: 'MERGE', targetCandidateKey: 'BOF-07-029', proposedCanonicalName: 'Design Input', notes: 'Survey Input is a typed Design Input retaining provenance to authoritative survey information/evidence.' },
  { candidateKey: 'BOF-07-029', decision: 'RELATIONSHIP', proposedCanonicalName: 'Design Input', notes: 'Governed relationship identifying validated source information/evidence used by a design output or decision.' },
  { candidateKey: 'BOF-07-030', decision: 'CHILD', proposedCanonicalName: 'Information Markup', notes: 'Markup is an attributable annotation against an exact revision/representation, not a new information master.' },
  { candidateKey: 'BOF-07-031', decision: 'MERGE', targetCandidateKey: 'BOF-07-004', proposedCanonicalName: 'Information Deliverable', notes: 'Handover Information Deliverable is a deliverable type/context, preserving the same delivery-control identity pattern.' }
];
