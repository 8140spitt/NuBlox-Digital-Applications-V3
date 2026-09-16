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
  { candidateKey: 'BOF-01-012', decision: 'RELATIONSHIP', proposedCanonicalName: 'Membership', notes: 'Membership is an effective-dated participation relationship linking a Party to an organisation, organisation unit, project or other governed context. It establishes participation but does not itself grant unrestricted permission.' },
  { candidateKey: 'BOF-01-013', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'User Identity', notes: 'User Identity is the authenticated platform principal linked to canonical Person/Party identity. Authentication proves who is signed in; business authorization is evaluated separately.' },
  { candidateKey: 'BOF-01-016', decision: 'RELATIONSHIP', proposedCanonicalName: 'Party Relationship', notes: 'Customer, supplier, subcontractor, consultant, partner and similar contexts are governed relationships between canonical Parties, not duplicate Party/Organisation masters.' },
  { candidateKey: 'BOF-01-018', decision: 'RELATIONSHIP', proposedCanonicalName: 'Role Assignment', notes: 'Role Assignment binds a Party to a governed role within an explicit effective scope. Role is not identity, job title, position or delegated financial/commercial authority.' },
  { candidateKey: 'BOF-01-019', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Delegated Authority', notes: 'Delegated Authority is a governed authorization grant with its own identity, approval basis, scope, action types, value limits, effectivity and revocation history. Material decisions require valid authority in addition to permission.' },

  { candidateKey: 'BOF-06-001', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Portfolio', notes: 'Stable governance identity for investments, programmes and projects managed together. Portfolio membership is an effective relationship and does not redefine Project identity.' },
  { candidateKey: 'BOF-06-002', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Programme', notes: 'Stable governance identity coordinating related Projects and change activity to realise outcomes/benefits. Programme is distinct from a schedule/programme of works.' },
  { candidateKey: 'BOF-06-003', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Project', notes: 'Canonical delivery identity for a governed project/job. It is the stable context for scope, programme, commercial control, design information, construction execution, cost, risk, evidence and handover.' },
  { candidateKey: 'BOF-06-004', decision: 'MERGE', targetCandidateKey: 'BOF-06-003', notes: 'Within the project-controls family, Job is treated as an industry alias for Project rather than a second delivery master. Service/maintenance work orders remain separate operational objects.' },
  { candidateKey: 'BOF-06-006', decision: 'MERGE', targetCandidateKey: 'BOF-06-007', notes: 'Phase and Stage use one governed delivery-stage assignment pattern. Configured stage definitions can preserve phase/stage terminology and hierarchy without creating duplicate Project identities.' },
  { candidateKey: 'BOF-06-007', decision: 'RELATIONSHIP', proposedCanonicalName: 'Delivery Stage Assignment', notes: 'Effective assignment of a configured project stage/phase definition to one Project. Stage is project context, not Project lifecycle or workflow approval state.' },
  { candidateKey: 'BOF-06-008', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'WBS Element', notes: 'Canonical scope-decomposition node within a Project. WBS is the scope hierarchy and remains distinct from the schedule network, commercial structure and physical asset hierarchy.' },
  { candidateKey: 'BOF-06-009', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Work Package', notes: 'Governed package of delivery scope linked to Project/WBS and responsibility. It is not automatically a Procurement Package, Commercial Package or Contract.' },
  { candidateKey: 'BOF-06-010', decision: 'MERGE', targetCandidateKey: 'BOF-06-011', notes: 'In project controls, Task is normalised to Schedule Activity. Shared workflow Work Items and Approval Requests remain separate collaboration/workflow objects.' },
  { candidateKey: 'BOF-06-011', decision: 'RENAME', proposedCanonicalName: 'Schedule Activity', notes: 'Planned unit of time-based work within a Schedule. Activity maps to WBS/Work Package rather than becoming the scope hierarchy itself.' },
  { candidateKey: 'BOF-06-012', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Milestone', notes: 'Zero-duration schedule marker with stable identity. It may reference a gate, contractual key date or completion event without becoming that business object.' },
  { candidateKey: 'BOF-06-013', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Schedule', notes: 'Canonical time-planning network identity containing activities, milestones and dependencies. Schedule is distinct from WBS and Project lifecycle.' },
  { candidateKey: 'BOF-06-014', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Schedule Baseline', notes: 'Immutable approved snapshot of a Schedule. Rebaseline creates a new governed baseline and never overwrites prior approved planning truth.' },
  { candidateKey: 'BOF-06-015', decision: 'RELATIONSHIP', proposedCanonicalName: 'Dependency', notes: 'Network relationship between schedule activities/milestones carrying dependency type and lead/lag. It is not a standalone work identity.' },
  { candidateKey: 'BOF-06-016', decision: 'EVENT_EVIDENCE', proposedCanonicalName: 'Progress Record', notes: 'Dated observation/evidence of progress against Activity or Work Package. Current progress is derived from retained validated records rather than destructive overwrite.' },
  { candidateKey: 'BOF-06-017', decision: 'VALIDATE_OBJECT', proposedCanonicalName: 'Resource Requirement', notes: 'Planned requirement for resource classification/capacity against work and time. Requirement remains distinct from allocation/fulfilment.' },
  { candidateKey: 'BOF-06-018', decision: 'RELATIONSHIP', proposedCanonicalName: 'Resource Allocation', notes: 'Effective allocation of a resource or resource capacity to Project, Work Package or Schedule Activity. Allocation does not redefine resource identity.' },
  { candidateKey: 'BOF-06-019', decision: 'MERGE', targetCandidateKey: 'BOF-01-012', notes: 'Project Participant is represented through the shared Membership/participation model with Project scope rather than a separate participant master.' },
  { candidateKey: 'BOF-06-020', decision: 'RELATIONSHIP', proposedCanonicalName: 'Responsibility Assignment', notes: 'One reusable effective-dated relationship assigns accountability/responsibility to a Party for a governed object or context. Responsibility is distinct from permission and authority.' },
  { candidateKey: 'BOF-07-005', decision: 'MERGE', targetCandidateKey: 'BOF-06-020', notes: 'Information-management Responsibility Assignment uses the same canonical assignment pattern as project responsibility; target object and responsibility type supply context rather than a second model.' },
  { candidateKey: 'BOF-12-002', decision: 'MERGE', targetCandidateKey: 'BOF-06-007', notes: 'Construction-operations Phase reuses the canonical delivery-stage assignment pattern and configured stage definitions rather than creating a separate phase object.' },

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
