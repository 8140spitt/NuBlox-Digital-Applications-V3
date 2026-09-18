import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const peopleHcmCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-18-001',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Worker Relationship',
    notes:
      'Effective relationship between canonical Person/Party and employing/engaging Organisation/Legal Entity. Worker identity remains the shared Person identity.'
  },
  {
    candidateKey: 'BOF-18-002',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-001',
    proposedCanonicalName: 'Worker Relationship',
    notes:
      'Employment is a governed Worker Relationship type with employment-specific terms, jurisdiction and effectivity.'
  },
  {
    candidateKey: 'BOF-18-003',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-001',
    proposedCanonicalName: 'Worker Relationship',
    notes:
      'Contractor/contingent engagement is a governed Worker Relationship type rather than a second worker master.'
  },
  {
    candidateKey: 'BOF-18-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Position',
    notes:
      'Governed organisational seat/capacity that may be vacant or occupied. Position is not Person, Job Profile or Role Assignment.'
  },
  {
    candidateKey: 'BOF-18-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Job Profile',
    notes:
      'Reusable job definition describing purpose, accountabilities, grade/family and competence requirements. A Job Profile is not a Position or worker identity.'
  },
  {
    candidateKey: 'BOF-18-006',
    decision: 'RELATIONSHIP',
    proposedCanonicalName: 'Reporting Relationship',
    notes:
      'Effective reporting relationship between Positions/Persons in organisational context. It is distinct from Role Assignment, Responsibility Assignment and authorisation.'
  },
  {
    candidateKey: 'BOF-18-007',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Career Profile',
    notes:
      'Worker career/profile context referencing aspirations, experience and development goals without changing Person identity.'
  },
  {
    candidateKey: 'BOF-18-008',
    decision: 'RENAME',
    proposedCanonicalName: 'Skill Definition',
    notes:
      'Governed reusable skill definition/classification. Person capability is represented through an effective/evidenced competence relationship, not by mutating the skill definition.'
  },
  {
    candidateKey: 'BOF-18-009',
    decision: 'RENAME',
    proposedCanonicalName: 'Competence Definition',
    notes:
      'Governed competence definition including proficiency/evidence expectations. A Person Competence relationship records assessed attainment.'
  },
  {
    candidateKey: 'BOF-18-010',
    decision: 'RENAME',
    proposedCanonicalName: 'Person Credential',
    notes:
      'Governed credential held by a Person, typed as qualification/licence/card/certification with issuer, verification, issue/expiry and evidence.'
  },
  {
    candidateKey: 'BOF-18-011',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-010',
    proposedCanonicalName: 'Person Credential',
    notes:
      'Licence uses the shared Person Credential identity pattern with licence-specific jurisdiction, scope and expiry rules.'
  },
  {
    candidateKey: 'BOF-18-012',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-010',
    proposedCanonicalName: 'Person Credential',
    notes:
      'Card is a credential type/representation; it does not require a separate Person or competence master.'
  },
  {
    candidateKey: 'BOF-18-013',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-010',
    proposedCanonicalName: 'Person Credential',
    notes:
      'Certification uses the shared Person Credential pattern with certification-specific issuer, scope and recertification rules.'
  },
  {
    candidateKey: 'BOF-18-014',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Training Course',
    notes:
      'Reusable controlled learning/training definition. Course definition is distinct from scheduled Training Session and Person Learning Record.'
  },
  {
    candidateKey: 'BOF-18-015',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Training Session',
    notes:
      'Scheduled delivery occurrence of a Training Course with trainer, venue/channel, participants and attendance/completion evidence.'
  },
  {
    candidateKey: 'BOF-18-016',
    decision: 'RENAME',
    proposedCanonicalName: 'Learning Record',
    notes:
      'Immutable/evidenced Person learning outcome record covering training completion/attendance and other governed learning evidence.'
  },
  {
    candidateKey: 'BOF-18-017',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-18-016',
    proposedCanonicalName: 'Learning Record',
    notes:
      'CPD Record uses the shared Learning Record pattern with CPD activity/type, hours/points, evidence and verification.'
  },
  {
    candidateKey: 'BOF-18-018',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Workforce Plan',
    notes:
      'Versioned workforce demand/supply plan by organisation, capability, location and time; it does not allocate individual workers by itself.'
  },
  {
    candidateKey: 'BOF-18-019',
    decision: 'PROJECTION',
    proposedCanonicalName: 'Worker Availability',
    notes:
      'Derived time-bounded availability from work pattern, shifts, leave/absence, workforce allocation and other constraints. Availability is not independently editable truth.'
  },
  {
    candidateKey: 'BOF-18-020',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Shift',
    notes:
      'Governed work-time window/roster occurrence or definition, linked to worker/position assignment where applicable.'
  },
  {
    candidateKey: 'BOF-18-021',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Work Pattern',
    notes:
      'Effective-dated working-time pattern defining normal work days/hours/cycle for a Worker Relationship or Position.'
  },
  {
    candidateKey: 'BOF-18-022',
    decision: 'RENAME',
    proposedCanonicalName: 'Workforce Allocation',
    notes:
      'Effective allocation of worker capacity to organisational/project/team/shift context. It is distinct from Finance Settlement Allocation and from project-controls Resource Allocation unless explicitly mapped.'
  },
  {
    candidateKey: 'BOF-18-023',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Attendance Record',
    notes:
      'Immutable/evidenced attendance occurrence such as clock/arrival/departure/presence. It is distinct from Time Entry and Timesheet.'
  },
  {
    candidateKey: 'BOF-18-024',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Time Entry',
    notes:
      'Governed declaration/record of worker time against date, activity/project/cost context and pay/work type, with approval/correction history.'
  },
  {
    candidateKey: 'BOF-18-025',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Timesheet',
    notes:
      'Controlled collection/submission of Time Entries for a worker and period. Approved timesheets are corrected by controlled adjustment rather than silent rewrite.'
  },
  {
    candidateKey: 'BOF-18-026',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Absence Record',
    notes:
      'Observed/recorded period of worker absence with cause/category and evidence; actual absence is distinct from a Leave Request.'
  },
  {
    candidateKey: 'BOF-18-027',
    decision: 'RENAME',
    proposedCanonicalName: 'Leave Request',
    notes:
      'Governed worker request/decision record for planned leave. Approved leave may create/drive absence and availability effects without sharing identity.'
  },
  {
    candidateKey: 'BOF-18-028',
    decision: 'RENAME',
    proposedCanonicalName: 'Compensation Arrangement',
    notes:
      'Effective-dated worker compensation terms/structure for a Worker Relationship. It is not Payroll Result or accounting posting truth.'
  },
  {
    candidateKey: 'BOF-18-029',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Pay Element',
    notes:
      'Governed earning/deduction/benefit element definition consumed by compensation and payroll calculation.'
  },
  {
    candidateKey: 'BOF-18-030',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Payroll Calendar',
    notes:
      'Governed payroll-specific pay-cycle/period calendar configuration. It is distinct from runtime Payroll Run and general working-time Calendar.'
  },
  {
    candidateKey: 'BOF-18-031',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Payroll Run',
    notes:
      'Governed payroll processing transaction/batch for a payroll population and period with retained calculation/version/control evidence.'
  },
  {
    candidateKey: 'BOF-18-032',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Payroll Result',
    notes:
      'Immutable worker/pay-period payroll result with earnings, deductions, tax/net and source provenance. Corrections create adjustment/reversal/successor results.'
  },
  {
    candidateKey: 'BOF-18-033',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-07-007',
    proposedCanonicalName: 'Information Container',
    notes:
      'Payslip is controlled information generated from Payroll Result; it uses Information Container identity/representation semantics rather than becoming payroll calculation truth.'
  },
  {
    candidateKey: 'BOF-18-034',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Expense Claim',
    notes:
      'Governed worker expense reimbursement claim with lines, receipts/evidence, policy validation, approval and settlement provenance.'
  },
  {
    candidateKey: 'BOF-18-035',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Vacancy',
    notes:
      'Governed recruitment demand/opening, usually linked to a Position or approved workforce need; vacancy is not a Person.'
  },
  {
    candidateKey: 'BOF-18-036',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-01-003',
    proposedCanonicalName: 'Person',
    notes:
      'Candidate is a recruitment context/role of canonical Person. Candidate-specific state belongs to Job Application/recruitment records, not a duplicate person master.'
  },
  {
    candidateKey: 'BOF-18-037',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Job Application',
    notes:
      'Recruitment case linking canonical Person to Vacancy with source, submissions, assessments, decisions and retained evidence.'
  },
  {
    candidateKey: 'BOF-18-038',
    decision: 'RENAME',
    proposedCanonicalName: 'Employment Offer',
    notes:
      'Controlled offer of employment/engagement terms to a Person for a Position/Job Profile. Acceptance may create Worker Relationship; the offer is not that relationship.'
  },
  {
    candidateKey: 'BOF-18-039',
    decision: 'RENAME',
    proposedCanonicalName: 'Worker Onboarding Case',
    notes:
      'Governed onboarding case coordinating prerequisites, documents, access, equipment, induction and assignments around a Worker Relationship.'
  },
  {
    candidateKey: 'BOF-18-040',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Performance Review',
    notes:
      'Attributed review evidence for a worker/period/objectives with ratings/comments/outcomes; it does not become current Person identity or authorisation.'
  },
  {
    candidateKey: 'BOF-18-041',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Learning Plan',
    notes:
      'Versioned person/team development plan linking competence gaps, learning goals and planned interventions.'
  },
  {
    candidateKey: 'BOF-18-042',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Employee Relations Case',
    notes:
      'Restricted-governance people case preserving allegations/issues, process, decisions, evidence, access and retention controls.'
  },
  {
    candidateKey: 'BOF-18-043',
    decision: 'RENAME',
    proposedCanonicalName: 'Worker Offboarding Case',
    notes:
      'Governed offboarding case coordinating termination/end-of-engagement obligations, access removal, property return, knowledge transfer and finalisation without deleting Person history.'
  }
];
