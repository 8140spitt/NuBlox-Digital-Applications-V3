import type { FoundationCanonicalizationDecision } from './foundation-canonicalization';

export const strategyGovernancePerformanceCanonicalization: FoundationCanonicalizationDecision[] = [
  {
    candidateKey: 'BOF-02-001',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Strategy Framework',
    notes:
      'Governed strategy architecture defining strategic horizon, scope, principles, themes, objectives, review cadence and ownership. It is not merely a strategy document representation.'
  },
  {
    candidateKey: 'BOF-02-002',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Strategic Objective',
    notes:
      'Governed desired outcome with accountable owner, horizon, measures and target relationships. Objective is distinct from KPI Definition, Target and observed performance.'
  },
  {
    candidateKey: 'BOF-02-003',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Strategic Theme',
    notes:
      'Governed strategic grouping/prioritisation context linking related objectives and initiatives. Theme is not a performance measure or organisational unit.'
  },
  {
    candidateKey: 'BOF-02-004',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Strategic Initiative',
    notes:
      'Governed strategic intervention/change commitment intended to realise objectives. Delivery may later be represented by Programme, Project or Transformation Initiative without changing strategic-initiative identity.'
  },
  {
    candidateKey: 'BOF-02-005',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Business Plan',
    notes:
      'Versioned operating/business plan translating strategy into objectives, initiatives, resources, financial/performance expectations and accountable execution over a defined period.'
  },
  {
    candidateKey: 'BOF-02-006',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Scenario',
    notes:
      'Governed scenario defining a coherent possible future or planning case with horizon, drivers and linked assumptions. It is decision/planning context, not forecast truth.'
  },
  {
    candidateKey: 'BOF-02-007',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Assumption',
    notes:
      'Governed explicit planning assumption with basis, owner, validity/effectivity and confidence. Assumptions can be reused by scenarios, plans and appraisals and must remain independently challengeable.'
  },
  {
    candidateKey: 'BOF-02-008',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'KPI Definition',
    notes:
      'Versioned metric definition describing business meaning, formula, unit, frequency, dimensions, source data, quality rules and accountable owner.'
  },
  {
    candidateKey: 'BOF-02-009',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Performance Target',
    notes:
      'Governed target for an exact KPI/measure, scope, period and threshold/trajectory. Target is planned expectation and remains separate from actual observations.'
  },
  {
    candidateKey: 'BOF-02-010',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Performance Observation',
    notes:
      'Dated attributable observation of KPI/measure performance for a defined scope and period, retaining source, value, dimensions, quality and provenance.'
  },
  {
    candidateKey: 'BOF-02-011',
    decision: 'PROJECTION',
    proposedCanonicalName: 'Performance Snapshot',
    notes:
      'Point-in-time or period-end projection combining exact KPI definitions, observations and targets. Published snapshots are reproducible and do not become source observations.'
  },
  {
    candidateKey: 'BOF-02-012',
    decision: 'EVENT_EVIDENCE',
    proposedCanonicalName: 'Strategic Review',
    notes:
      'Governed review occurrence evaluating strategy, assumptions, performance and required changes against exact source versions/snapshots, with findings and resulting decisions/actions retained separately.'
  },
  {
    candidateKey: 'BOF-02-013',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Governance Body',
    notes:
      'Stable governance context such as board, committee or steering body with mandate, scope, membership, quorum and authority rules. It is not an Organisation Unit or Team.'
  },
  {
    candidateKey: 'BOF-02-014',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Governance Meeting',
    notes:
      'Governed meeting occurrence of a Governance Body with scheduled/actual time, attendees, quorum, agenda, papers, decisions and minutes/evidence.'
  },
  {
    candidateKey: 'BOF-02-015',
    decision: 'CHILD',
    proposedCanonicalName: 'Agenda Item',
    notes:
      'Governed agenda item subordinate to a Governance Meeting, referencing exact subject/papers and intended decision/review outcome.'
  },
  {
    candidateKey: 'BOF-02-016',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-06-023',
    proposedCanonicalName: 'Decision',
    notes:
      'Governance Decision reuses the shared immutable Decision evidence pattern also used by project controls. Decision is separate from Meeting, Agenda Item and resulting domain state.'
  },
  {
    candidateKey: 'BOF-02-017',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-06-024',
    proposedCanonicalName: 'Decision Action',
    notes:
      'Governance Action reuses the shared Decision Action pattern with accountable owner, due date and closure evidence; workflow Work Items coordinate but never replace it.'
  },
  {
    candidateKey: 'BOF-02-018',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-07-007',
    proposedCanonicalName: 'Information Container',
    notes:
      'Policy is a controlled Information Container type/profile with structured policy metadata, applicability, owner, approval, effective revision, issue and supersession history.'
  },
  {
    candidateKey: 'BOF-02-019',
    decision: 'VALIDATE_OBJECT',
    proposedCanonicalName: 'Authority Framework',
    notes:
      'Versioned governance/configuration defining authority classes, approval/decision rules, limits, delegation rules, reserved matters, escalation and segregation-of-duties expectations. It is not a Delegated Authority grant.'
  },
  {
    candidateKey: 'BOF-02-020',
    decision: 'MERGE',
    targetCandidateKey: 'BOF-07-007',
    proposedCanonicalName: 'Information Container',
    notes:
      'Governance Record such as approved minutes, resolution pack or governance memorandum uses controlled Information Container identity; Record Declaration may additionally classify it as a formal record.'
  }
];
