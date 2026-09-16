export type FoundationReviewDecision =
  | 'VALIDATE_OBJECT'
  | 'MERGE'
  | 'RENAME'
  | 'RELATIONSHIP'
  | 'CHILD'
  | 'EVENT_EVIDENCE'
  | 'PROJECTION'
  | 'REJECT';

export type FoundationCanonicalizationDecision = {
  candidateKey: string;
  decision: FoundationReviewDecision;
  proposedCanonicalName?: string;
  targetCandidateKey?: string;
  notes: string;
};

export const foundationCanonicalization: FoundationCanonicalizationDecision[] = [
  { candidateKey: 'BOF-01-002', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Party', notes: 'Canonical identity abstraction for persons and organisations. Party identity is shared across customer, supplier, subcontractor, consultant, regulator and project-participant relationships; those contexts must not create duplicate party masters.' },
  { candidateKey: 'BOF-01-003', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Person', notes: 'Governed Party specialization for a natural person. User, worker, contact, competent-person and project-participant semantics are contextual relationships or assignments, not separate person masters.' },
  { candidateKey: 'BOF-01-004', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Organisation', notes: 'Governed Party specialization for an organisation. Customer, supplier, subcontractor, consultant and other commercial roles attach through relationships rather than duplicate organisation records.' },
  { candidateKey: 'BOF-01-005', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Legal Entity', notes: 'Governed organisational specialization representing an incorporated or otherwise legally accountable entity with statutory, tax and accounting significance. It must reference the canonical Organisation/Party identity rather than duplicate it.' },
  { candidateKey: 'BOF-01-007', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Organisation Unit', notes: 'Canonical structural unit within the enterprise hierarchy. It provides responsibility, reporting and operating scope but does not become a separate external-party master unless it has an independently governed party identity.' },
  { candidateKey: 'BOF-06-003', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Project', notes: 'Canonical delivery identity for a governed project/job. It is the stable context for scope, programme, commercial control, design information, construction execution, cost, risk, evidence and handover.' },
  { candidateKey: 'BOF-06-004', decision: 'MERGE', targetCandidateKey: 'BOF-06-003', notes: 'Within the project-controls family, Job is treated as an industry alias for Project rather than a second delivery master. Service/maintenance work orders remain separate operational objects.' },
  { candidateKey: 'BOF-16-003', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Site', notes: 'Canonical spatial/business location used across land, property, projects, construction operations, logistics, assets and facilities. Site identity must be reused across workspaces.' },
  { candidateKey: 'BOF-12-001', decision: 'MERGE', targetCandidateKey: 'BOF-16-003', notes: 'The construction-operations occurrence refers to the same Site identity governed by the property/spatial model; field operations consume it rather than owning a duplicate site master.' },
  { candidateKey: 'BOF-08-002', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Contract', notes: 'Canonical legally/commercially governed agreement identity. Contract-form family, party roles, clauses, obligations, changes, notices, valuations and evidence attach to this stable identity rather than redefining it by workspace.' },
  { candidateKey: 'BOF-07-007', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Information Container', notes: 'Canonical governed information identity for controlled documents, drawings, models and related containers requiring revision/status/issue/distribution semantics. Binary files are representations of this object, not the object itself.' },
  { candidateKey: 'BOF-25-004', decision: 'MERGE', targetCandidateKey: 'BOF-07-007', notes: 'Knowledge/records management reuses the same canonical Information Container identity instead of maintaining a separate document master.' },
  { candidateKey: 'BOF-10-001', decision: 'RENAME', proposedCanonicalName: 'Item', notes: 'Use one canonical Item master for product, material and service definitions. Item type/classification and commercial/technical relationships distinguish products, materials and services without parallel masters.' },
  { candidateKey: 'BOF-10-002', decision: 'MERGE', targetCandidateKey: 'BOF-10-001', notes: 'Material Item is a typed use of the canonical Item master, not an independent identity model.' },
  { candidateKey: 'BOF-10-003', decision: 'MERGE', targetCandidateKey: 'BOF-10-001', notes: 'Service Item is a typed use of the canonical Item master for catalogued/procurable/saleable services, not a separate master architecture.' },
  { candidateKey: 'BOF-16-014', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'System', notes: 'Canonical functional/technical system within a built asset or infrastructure network. Systems aggregate components/assets and provide commissioning, performance, compliance and operational context.' },
  { candidateKey: 'BOF-16-016', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Asset', notes: 'Canonical physical or logical asset identity that persists across delivery, commissioning, warranty, operation, maintenance, finance, sustainability, modification and retirement. No separate construction/FM/finance asset masters.' }
];
