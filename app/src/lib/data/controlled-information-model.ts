export type ControlledInformationKind =
  | 'foundation-reference'
  | 'controlled-requirement'
  | 'delivery-control'
  | 'version-structure'
  | 'representation'
  | 'event-evidence'
  | 'relationship'
  | 'case'
  | 'child-record';

export type ControlledInformationDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: ControlledInformationKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type ControlledInformationRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type ControlledInformationBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

export const controlledInformationModel: ControlledInformationDefinition[] = [
  {
    modelId: 'INFO-REQUIREMENT',
    candidateKeys: ['BOF-07-001', 'BOF-07-002', 'BOF-07-003'],
    canonicalName: 'Information Requirement',
    kind: 'controlled-requirement',
    definition:
      'A governed statement of required information, its purpose, acceptance criteria, timing, recipient and applicability. Project and Asset Information Requirements are typed uses of the same requirement pattern.',
    identityRule:
      'Stable requirement identity with controlled revisions/effectivity; project, asset and enterprise requirement types do not create separate requirement engines.',
    scope: [
      'tenant',
      'project/programme',
      'asset/site/system',
      'appointing-party/contract context'
    ],
    keyData: [
      'requirement number',
      'requirement type',
      'purpose',
      'required information',
      'acceptance criteria',
      'due/milestone',
      'recipient',
      'applicability/effectivity'
    ],
    lifecycle: ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Withdrawn'],
    governance: [
      'Project Information Requirement and Asset Information Requirement are governed requirement types, not duplicate master-data systems.',
      'Approved requirement revisions are immutable and superseded rather than overwritten.',
      'A requirement may drive one or many deliverables without becoming the deliverable itself.'
    ]
  },
  {
    modelId: 'INFO-DELIVERABLE',
    candidateKeys: ['BOF-07-004', 'BOF-07-031'],
    canonicalName: 'Information Deliverable',
    kind: 'delivery-control',
    definition:
      'A governed obligation/planned output requiring defined information to be delivered for a purpose, milestone, recipient or handover event.',
    identityRule:
      'Stable deliverable identity independent of the Information Containers ultimately used to satisfy it.',
    scope: [
      'project/programme',
      'contract/appointment',
      'information requirement',
      'handover/asset context'
    ],
    keyData: [
      'deliverable ID',
      'requirement',
      'responsible party',
      'recipient',
      'due date/milestone',
      'acceptance criteria',
      'required container types'
    ],
    lifecycle: [
      'Planned',
      'In Preparation',
      'Submitted',
      'Accepted',
      'Returned',
      'Satisfied',
      'Cancelled'
    ],
    governance: [
      'Handover Information Deliverable is a typed deliverable, not a second deliverable master.',
      'Deliverable status does not overwrite the lifecycle/status of individual Information Containers.',
      'One deliverable may be satisfied by multiple containers and one container may support multiple deliverables where governed.'
    ]
  },
  {
    modelId: 'INFO-DELIVERY-PLAN',
    candidateKeys: ['BOF-07-006'],
    canonicalName: 'Information Delivery Plan',
    kind: 'delivery-control',
    definition:
      'A governed plan scheduling information deliverables, responsibilities, milestones and dependencies for a project, programme, appointment or team.',
    identityRule:
      'Stable plan identity with controlled baselines/versions; plan changes do not recreate deliverable or container identity.',
    scope: ['project/programme', 'appointment/team', 'information-management context'],
    keyData: [
      'plan ID/version',
      'deliverables',
      'responsibilities',
      'milestones',
      'dependencies',
      'status/baseline'
    ],
    lifecycle: ['Draft', 'Review', 'Approved', 'Current', 'Superseded', 'Closed'],
    governance: [
      'The delivery plan coordinates commitments; it is not the authoritative Information Container register.',
      'Responsibility uses the shared Responsibility Assignment model.',
      'Plan baselines retain history rather than being silently overwritten.'
    ]
  },
  {
    modelId: 'CBO-INFORMATION-CONTAINER',
    candidateKeys: [
      'BOF-07-007',
      'BOF-07-008',
      'BOF-07-009',
      'BOF-07-010',
      'BOF-07-011',
      'BOF-07-012',
      'BOF-07-013'
    ],
    canonicalName: 'Information Container',
    kind: 'foundation-reference',
    definition:
      'The stable governed information identity for documents, drawings, models, specifications, schedules, calculations and other controlled information, independent of any binary file or rendition.',
    identityRule:
      'One immutable Information Container identity survives revisions, iterations, file replacements, format changes and publication events.',
    scope: ['tenant', 'project', 'asset/site/system', 'contract', 'enterprise subject context'],
    keyData: [
      'container ID/number',
      'container type',
      'title',
      'originator',
      'subject/context',
      'classification',
      'security classification',
      'current revision/status'
    ],
    lifecycle: ['Work in Progress', 'In Review', 'Shared', 'Published', 'Superseded', 'Archived'],
    governance: [
      'Document, Drawing, Model, Specification, Technical Schedule and Calculation are governed container types/behaviours, not parallel information masters.',
      'Container identity is independent of files, renditions and native-authoring formats.',
      'Suitability, purpose of issue, security classification and revision are explicit governed metadata rather than encoded only in file names.'
    ]
  },
  {
    modelId: 'INFO-REVISION',
    candidateKeys: ['BOF-07-015'],
    canonicalName: 'Information Container Revision',
    kind: 'version-structure',
    definition:
      'A controlled major business revision of an Information Container representing a governed change in issued/shared information while retaining the stable container identity.',
    identityRule:
      'Revision identity is subordinate to one Information Container; revisions are sequential/branch-aware according to configured policy and are never standalone document masters.',
    scope: ['information container'],
    keyData: [
      'revision identifier',
      'container',
      'revision status',
      'created/approved by',
      'effective/issue date',
      'supersedes revision'
    ],
    lifecycle: ['Working', 'Review', 'Approved', 'Issued', 'Superseded'],
    governance: [
      'Revision is not a standalone business object detached from its Information Container.',
      'Published/issued revisions are immutable; corrections create a new controlled revision or iteration according to policy.',
      'Working iterations can occur beneath a revision without changing stable container identity.'
    ]
  },
  {
    modelId: 'INFO-REPRESENTATION',
    candidateKeys: [],
    canonicalName: 'Information Representation',
    kind: 'representation',
    definition:
      'A file, rendition, viewable, native-authoring file, export or other technical representation of a specific Information Container revision/iteration.',
    identityRule:
      'Representation identity is subordinate to a specific container revision/iteration and content hash/storage identity; replacing content creates new representation history.',
    scope: ['information container revision/iteration'],
    keyData: [
      'file/rendition name',
      'media type',
      'content hash',
      'size',
      'storage reference',
      'created by/at',
      'representation purpose'
    ],
    lifecycle: ['Current', 'Superseded', 'Archived'],
    governance: [
      'A PDF, IFC, DWG, spreadsheet, image or native model file is a representation, not the canonical business identity.',
      'Multiple representations may exist for one revision.',
      'Content integrity, provenance and malware/security controls belong to the representation/content layer.'
    ]
  },
  {
    modelId: 'INFO-TECHNICAL-EVIDENCE',
    candidateKeys: ['BOF-07-014'],
    canonicalName: 'Technical Evidence',
    kind: 'event-evidence',
    definition:
      'Attributed evidence demonstrating a technical fact, verification, validation, decision basis or compliance outcome and referencing authoritative information containers or structured records.',
    identityRule:
      'Immutable evidence-record identity linked to its source information and business context.',
    scope: ['project', 'asset/system', 'design/engineering decision', 'quality/compliance context'],
    keyData: [
      'evidence type',
      'subject',
      'source containers/records',
      'actor',
      'timestamp',
      'verification status'
    ],
    lifecycle: ['Captured', 'Verified', 'Accepted', 'Superseded/Invalidated'],
    governance: [
      'Evidence references authoritative information; it does not duplicate the source content.',
      'Accepted evidence remains immutable and auditable.',
      'Evidence validity can change without rewriting the original evidence event.'
    ]
  },
  {
    modelId: 'INFO-ISSUE',
    candidateKeys: ['BOF-07-016'],
    canonicalName: 'Information Issue',
    kind: 'event-evidence',
    definition:
      'A controlled release/issue event making a specific Information Container revision available for a defined purpose, suitability and audience.',
    identityRule:
      'Immutable issue-event identity referencing the exact container revision and representations released.',
    scope: ['information container revision', 'project/contract/information context'],
    keyData: [
      'issue reference',
      'revision',
      'purpose of issue',
      'suitability/status',
      'issued by/at',
      'audience/distribution'
    ],
    lifecycle: ['Prepared', 'Issued', 'Superseded/Withdrawn'],
    governance: [
      'Information Issue is distinct from a project Problem/Issue case.',
      'The issue event never rewrites the revision it released.',
      'Issue purpose and suitability are explicit and historically reconstructable.'
    ]
  },
  {
    modelId: 'INFO-TRANSMITTAL',
    candidateKeys: ['BOF-07-017'],
    canonicalName: 'Transmittal',
    kind: 'event-evidence',
    definition:
      'A controlled exchange record evidencing that defined information revisions were transmitted from one Party/context to another for a defined purpose.',
    identityRule:
      'Immutable transmittal identity once sent; corrections occur through subsequent transmittals rather than editing issued evidence.',
    scope: ['project', 'contract/appointment', 'parties/teams'],
    keyData: [
      'transmittal number',
      'sender',
      'recipient(s)',
      'sent at',
      'purpose',
      'included information issues/revisions',
      'delivery/acknowledgement evidence'
    ],
    lifecycle: ['Draft', 'Sent', 'Delivered', 'Acknowledged', 'Closed'],
    governance: [
      'Transmittal is exchange evidence, not a folder or document container.',
      'The exact revisions transmitted must remain reconstructable.',
      'Recipient acknowledgement does not imply technical acceptance unless a separate governed decision says so.'
    ]
  },
  {
    modelId: 'INFO-DISTRIBUTION',
    candidateKeys: ['BOF-07-018'],
    canonicalName: 'Information Distribution',
    kind: 'relationship',
    definition:
      'A governed relationship/rule defining which Party, role or team should receive or have access to specified information under stated conditions.',
    identityRule:
      'Effective relationship/rule identity; it does not duplicate Party, role or Information Container identity.',
    scope: ['information context', 'party/role/team', 'project/contract'],
    keyData: [
      'recipient/role',
      'information scope',
      'purpose',
      'channel/access basis',
      'validity/effectivity'
    ],
    lifecycle: ['Proposed', 'Active', 'Suspended', 'Ended'],
    governance: [
      'Distribution is not evidence that information was actually transmitted; Transmittal/Issue records provide that evidence.',
      'Access authorization and security classification remain separately enforced.',
      'Role-based distribution uses canonical role/assignment identities.'
    ]
  },
  {
    modelId: 'INFO-QUERY',
    candidateKeys: ['BOF-07-019', 'BOF-07-020'],
    canonicalName: 'Information Query',
    kind: 'case',
    definition:
      'A governed request for clarification or additional technical/project information. RFI and Technical Query are typed uses of one query pattern.',
    identityRule:
      'Stable query identity independent of responses, attachments, workflow tasks and resulting changes.',
    scope: [
      'project',
      'contract/appointment',
      'design/engineering context',
      'information container/subject'
    ],
    keyData: [
      'query number',
      'query type',
      'raised by',
      'assigned/responsible party',
      'subject',
      'required-by date',
      'linked information',
      'contractual basis where applicable'
    ],
    lifecycle: ['Draft', 'Open', 'Under Review', 'Answered', 'Closed', 'Cancelled'],
    governance: [
      'RFI and Technical Query terminology remains configurable without creating duplicate query engines.',
      'A response does not silently amend design, contract or baseline information.',
      'Queries with contractual notice significance may additionally reference Contract Notice/Commercial Change records.'
    ]
  },
  {
    modelId: 'INFO-SUBMITTAL',
    candidateKeys: ['BOF-07-021'],
    canonicalName: 'Information Submittal',
    kind: 'case',
    definition:
      'A governed submission case presenting defined information for review, acceptance, approval, record or another stated purpose.',
    identityRule:
      'Stable submittal identity; submitted container revisions are frozen references and subsequent submissions create controlled history.',
    scope: ['project', 'contract/appointment', 'information deliverable'],
    keyData: [
      'submittal number',
      'purpose',
      'submitter/recipient',
      'submitted revisions',
      'due/response dates',
      'review/decision status'
    ],
    lifecycle: ['Draft', 'Submitted', 'Under Review', 'Accepted', 'Returned', 'Rejected', 'Closed'],
    governance: [
      'Submittal is not the Information Container and does not own duplicate files.',
      'Submitted revision references are immutable evidence.',
      'Approval/acceptance is a governed decision with authority, not merely a workflow button.'
    ]
  },
  {
    modelId: 'INFO-RESPONSE',
    candidateKeys: ['BOF-07-022'],
    canonicalName: 'Information Response',
    kind: 'event-evidence',
    definition:
      'An attributable response to an Information Query, Submittal or review request, capturing the responder, statement, decision/effect and evidence.',
    identityRule: 'Immutable submitted response identity linked to the originating case/request.',
    scope: ['information query', 'submittal', 'review'],
    keyData: [
      'response ID',
      'responding party/person',
      'response text/structured outcome',
      'issued at',
      'linked containers/evidence',
      'effect/decision classification'
    ],
    lifecycle: ['Draft', 'Issued', 'Superseded/Withdrawn where permitted'],
    governance: [
      'Information Response is intentionally distinguished from generic customer/service/workflow responses.',
      'A response may trigger a Design Change but is not itself the changed design.',
      'Issued response evidence is retained even if later superseded.'
    ]
  },
  {
    modelId: 'INFO-DESIGN-REVIEW',
    candidateKeys: ['BOF-07-023'],
    canonicalName: 'Design Review',
    kind: 'case',
    definition:
      'A governed technical review record assessing defined design/information revisions against requirements, criteria and coordination obligations.',
    identityRule:
      'Stable review identity referencing the exact revisions/subjects reviewed; review comments and outcomes remain subordinate evidence.',
    scope: ['project', 'design package/system/asset', 'information revisions'],
    keyData: [
      'review ID/type',
      'scope',
      'reviewed revisions',
      'reviewers',
      'criteria',
      'comments/issues',
      'outcome/decision'
    ],
    lifecycle: [
      'Planned',
      'In Review',
      'Comments Raised',
      'Response/Resolution',
      'Complete',
      'Closed'
    ],
    governance: [
      'Review status does not alter Information Container lifecycle without an authorised transition.',
      'Reviewers act under role/responsibility/authority rules.',
      'Review history remains tied to the exact revisions reviewed.'
    ]
  },
  {
    modelId: 'INFO-REVIEW-COMMENT',
    candidateKeys: ['BOF-07-024'],
    canonicalName: 'Review Comment',
    kind: 'child-record',
    definition:
      'An attributable comment/observation raised within a Design Review against a defined information subject or revision.',
    identityRule: 'Child identity under its review with stable attribution and resolution history.',
    scope: ['design review', 'information revision/subject'],
    keyData: [
      'comment number',
      'author',
      'subject/location',
      'comment',
      'classification',
      'response/resolution'
    ],
    lifecycle: ['Open', 'Responded', 'Resolved', 'Accepted', 'Closed'],
    governance: [
      'Review Comment is not a standalone Project Issue unless explicitly promoted/linked.',
      'Resolution does not erase the original comment or response history.',
      'Comments can reference exact model/drawing locations without redefining container identity.'
    ]
  },
  {
    modelId: 'INFO-COORDINATION-ISSUE',
    candidateKeys: ['BOF-07-025', 'BOF-07-026'],
    canonicalName: 'Design Coordination Issue',
    kind: 'case',
    definition:
      'A governed design-coordination problem requiring resolution between disciplines, systems or information sources. Clash Issue is a typed coordination issue.',
    identityRule:
      'Stable issue identity independent of model/viewpoint files, comments and workflow tasks.',
    scope: [
      'project',
      'design coordination',
      'systems/assets/spatial subjects',
      'information revisions'
    ],
    keyData: [
      'issue number/type',
      'discipline/subject',
      'location',
      'detected against revisions',
      'owner/responsibility',
      'severity',
      'resolution evidence'
    ],
    lifecycle: [
      'Open',
      'Assigned',
      'In Resolution',
      'Ready for Verification',
      'Verified',
      'Closed'
    ],
    governance: [
      'Clash Issue is a coordination-issue type, not a separate issue master.',
      'BIM viewpoints/screenshots are evidence/representations rather than the issue identity.',
      'Resolution may require Design Change but must not silently mutate approved information.'
    ]
  },
  {
    modelId: 'INFO-DESIGN-CHANGE',
    candidateKeys: ['BOF-07-027'],
    canonicalName: 'Design Change',
    kind: 'case',
    definition:
      'A governed technical change case controlling proposed changes to design intent, requirements, information revisions or technical configuration.',
    identityRule:
      'Stable change identity independent of affected Information Containers, resulting revisions, commercial changes and workflow tasks.',
    scope: ['project', 'design/engineering', 'system/asset/item', 'information containers'],
    keyData: [
      'change number',
      'reason/basis',
      'affected subjects/containers',
      'technical impact',
      'approvals',
      'resulting revisions',
      'commercial/schedule links'
    ],
    lifecycle: [
      'Proposed',
      'Impact Assessment',
      'Review',
      'Approved',
      'Implemented',
      'Verified',
      'Closed',
      'Rejected'
    ],
    governance: [
      'Design Change is distinct from Commercial Change although the two can be causally linked.',
      'Approved change produces controlled new revisions/configuration; it never overwrites published information.',
      'Technical approval authority and commercial authority may differ and must both be respected where applicable.'
    ]
  },
  {
    modelId: 'INFO-DESIGN-INPUT',
    candidateKeys: ['BOF-07-028', 'BOF-07-029'],
    canonicalName: 'Design Input',
    kind: 'relationship',
    definition:
      'A governed relationship identifying information, survey data, requirements or other source material used as an input to a design/engineering output or decision.',
    identityRule:
      'Relationship identity between source information/evidence and the design subject/output; source container identities remain authoritative.',
    scope: ['project', 'design package/system/asset', 'information container/evidence'],
    keyData: [
      'input type',
      'source',
      'recipient/design subject',
      'revision/effectivity',
      'validation status'
    ],
    lifecycle: ['Proposed', 'Validated', 'Current', 'Superseded/Withdrawn'],
    governance: [
      'Survey Input is a typed Design Input and retains provenance to the authoritative survey/evidence source.',
      'Copying a source file into a design folder does not create new authoritative information identity.',
      'Design outputs retain traceability to the input revisions actually used.'
    ]
  },
  {
    modelId: 'INFO-MARKUP',
    candidateKeys: ['BOF-07-030'],
    canonicalName: 'Information Markup',
    kind: 'child-record',
    definition:
      'An attributable annotation/markup against a specific information revision or representation used for review, coordination or proposed correction.',
    identityRule:
      'Markup identity is subordinate to the exact revision/representation it annotates.',
    scope: ['information revision/representation', 'review/query/change context'],
    keyData: [
      'markup ID',
      'author',
      'created at',
      'geometry/location',
      'annotation',
      'status/context'
    ],
    lifecycle: ['Open', 'Addressed', 'Closed', 'Superseded'],
    governance: [
      'Markup is not a new Drawing/Document/Model identity.',
      'The annotated revision remains immutable; accepted markup can lead to a new controlled revision.',
      'Markup provenance must survive export/import where technically possible.'
    ]
  }
];

export const controlledInformationRelationships: ControlledInformationRelationship[] = [
  {
    id: 'INFO-R01',
    from: 'INFO-REQUIREMENT',
    predicate: 'drives',
    to: 'INFO-DELIVERABLE',
    cardinality: 'many-to-many',
    governance:
      'Requirements and deliverables remain independent identities with traceable satisfaction mapping.'
  },
  {
    id: 'INFO-R02',
    from: 'INFO-DELIVERY-PLAN',
    predicate: 'plans',
    to: 'INFO-DELIVERABLE',
    cardinality: 'one-to-many',
    governance: 'Plan versions coordinate deliverables without owning their identity.'
  },
  {
    id: 'INFO-R03',
    from: 'INFO-DELIVERABLE',
    predicate: 'is satisfied by',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance: 'Satisfaction references the exact accepted revisions required by the deliverable.'
  },
  {
    id: 'INFO-R04',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'has revision',
    to: 'INFO-REVISION',
    cardinality: 'one-to-many',
    governance:
      'Revision is subordinate version structure; the stable container identity remains unchanged.'
  },
  {
    id: 'INFO-R05',
    from: 'INFO-REVISION',
    predicate: 'has representation',
    to: 'INFO-REPRESENTATION',
    cardinality: 'one-to-many',
    governance:
      'Many files/renditions may represent one revision; file identity never replaces container identity.'
  },
  {
    id: 'INFO-R06',
    from: 'INFO-ISSUE',
    predicate: 'releases',
    to: 'INFO-REVISION',
    cardinality: 'many-to-one',
    governance:
      'Issue event fixes purpose, suitability, audience and time for the exact revision released.'
  },
  {
    id: 'INFO-R07',
    from: 'INFO-TRANSMITTAL',
    predicate: 'transmits',
    to: 'INFO-ISSUE',
    cardinality: 'many-to-many',
    governance:
      'Transmittal records exchange of exact issued information without duplicating the content.'
  },
  {
    id: 'INFO-R08',
    from: 'INFO-DISTRIBUTION',
    predicate: 'governs recipients of',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance:
      'Distribution rules define intended recipients/access but are not evidence of actual transmission.'
  },
  {
    id: 'INFO-R09',
    from: 'INFO-QUERY',
    predicate: 'references',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance:
      'Queries reference authoritative information and do not copy it into a separate query data silo.'
  },
  {
    id: 'INFO-R10',
    from: 'INFO-RESPONSE',
    predicate: 'responds to',
    to: 'INFO-QUERY',
    cardinality: 'many-to-one',
    governance:
      'Responses preserve attribution and history; query closure does not erase response evidence.'
  },
  {
    id: 'INFO-R11',
    from: 'INFO-SUBMITTAL',
    predicate: 'submits',
    to: 'INFO-REVISION',
    cardinality: 'many-to-many',
    governance:
      'Submitted revisions are frozen references; later revisions require a subsequent controlled submission.'
  },
  {
    id: 'INFO-R12',
    from: 'INFO-RESPONSE',
    predicate: 'may respond to',
    to: 'INFO-SUBMITTAL',
    cardinality: 'many-to-one',
    governance:
      'Submittal response/decision is evidence separate from the submitted information itself.'
  },
  {
    id: 'INFO-R13',
    from: 'INFO-DESIGN-REVIEW',
    predicate: 'reviews',
    to: 'INFO-REVISION',
    cardinality: 'many-to-many',
    governance: 'A review records exactly which revisions were assessed.'
  },
  {
    id: 'INFO-R14',
    from: 'INFO-DESIGN-REVIEW',
    predicate: 'contains',
    to: 'INFO-REVIEW-COMMENT',
    cardinality: 'one-to-many',
    governance: 'Comments remain attributable children of the review.'
  },
  {
    id: 'INFO-R15',
    from: 'INFO-COORDINATION-ISSUE',
    predicate: 'detected against',
    to: 'INFO-REVISION',
    cardinality: 'many-to-many',
    governance: 'Coordination issue provenance retains the revisions/models on which it was found.'
  },
  {
    id: 'INFO-R16',
    from: 'INFO-DESIGN-CHANGE',
    predicate: 'changes',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance:
      'Approved design change leads to controlled new revisions rather than mutating existing published information.'
  },
  {
    id: 'INFO-R17',
    from: 'INFO-DESIGN-INPUT',
    predicate: 'feeds',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance: 'Output information keeps provenance to the exact validated source input revisions.'
  },
  {
    id: 'INFO-R18',
    from: 'INFO-MARKUP',
    predicate: 'annotates',
    to: 'INFO-REPRESENTATION',
    cardinality: 'many-to-one',
    governance:
      'Markup is anchored to a representation/revision and does not become a replacement master.'
  },
  {
    id: 'INFO-R19',
    from: 'INFO-TECHNICAL-EVIDENCE',
    predicate: 'evidences',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-many',
    governance:
      'Evidence references authoritative containers/records and preserves source provenance.'
  },
  {
    id: 'INFO-R20',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-PROJECT',
    cardinality: 'many-to-many',
    governance:
      'Information container identity is independent of project/folder hierarchy and can persist into operations.'
  },
  {
    id: 'INFO-R21',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-ASSET',
    cardinality: 'many-to-many',
    governance:
      'Asset information references the same canonical Asset identity across design, handover and operations.'
  },
  {
    id: 'INFO-R22',
    from: 'CBO-INFORMATION-CONTAINER',
    predicate: 'describes / evidences',
    to: 'CBO-CONTRACT',
    cardinality: 'many-to-many',
    governance:
      'Contract-related information is linked without moving Contract truth into a document store.'
  }
];

export const controlledInformationBoundaries: ControlledInformationBoundary[] = [
  {
    name: 'Identity',
    structure: 'Information Container → Revision → Representation',
    purpose: 'Separates stable business information identity from version and file/content layers.',
    mustNotBecome: 'file name = object identity'
  },
  {
    name: 'Requirement & delivery',
    structure: 'Requirement → Deliverable → accepted revision(s)',
    purpose: 'Makes information obligations and satisfaction traceable.',
    mustNotBecome: 'folder checklist = information requirement'
  },
  {
    name: 'Exchange',
    structure: 'Issue → Transmittal → recipient / acknowledgement',
    purpose: 'Preserves exactly what was released and exchanged, when and why.',
    mustNotBecome: 'email attachment = controlled transmittal'
  },
  {
    name: 'Review & change',
    structure: 'Query / Submittal / Review / Issue → Change → new Revision',
    purpose:
      'Controls technical questions, review and design change without overwriting approved information.',
    mustNotBecome: 'workflow task = domain truth'
  }
];

export const controlledInformationRules = [
  'An Information Container is the stable business identity; a file, rendition or native model is a representation of a revision/iteration.',
  'Document, Drawing, Model, Specification, Technical Schedule and Calculation are governed Information Container types unless independent semantics later justify a distinct aggregate.',
  'Revision and working iteration are subordinate version structures and never replace the stable Information Container identity.',
  'Published/issued revisions are immutable. Correction or change creates controlled successor history.',
  'Purpose of issue, suitability/status, security classification and revision are explicit metadata; file naming alone is not authoritative governance.',
  'Information Requirement, Deliverable, Delivery Plan and Information Container are separate identities connected by traceable satisfaction relationships.',
  'Project Information Requirement and Asset Information Requirement are typed uses of one governed requirement pattern.',
  'Handover Information Deliverable is a deliverable type, not a second handover-document master.',
  'Responsibility uses the shared Authority & Participation model; information management does not create a second responsibility engine.',
  'Transmittal and Information Issue are immutable evidence of release/exchange, not mutable folders or container copies.',
  'RFI and Technical Query use one Information Query pattern with configurable type and contractual significance.',
  'Submittal is a case/transaction referencing submitted revisions; it never owns duplicate copies of those information identities.',
  'Review comments, markups and responses preserve attribution and history without mutating the reviewed revision.',
  'Clash Issue is a typed Design Coordination Issue, not a separate issue master.',
  'Design Change is technically distinct from Commercial Change; causal links between them are explicit.',
  'Survey Input is a typed Design Input with retained source provenance.',
  'CDE, folder and collaboration-platform structures are views/containers around canonical information and do not redefine NuBlox object identity.',
  'Handover transfers governed information relationships to asset/operations contexts without recreating the Information Container or Asset identity.'
] as const;

export function validateControlledInformationModel() {
  const ids = new Set(controlledInformationModel.map((entry) => entry.modelId));
  if (ids.size !== controlledInformationModel.length) return false;
  const externalIds = new Set(['CBO-PROJECT', 'CBO-ASSET', 'CBO-CONTRACT']);
  const validId = (id: string) => ids.has(id) || externalIds.has(id);
  return controlledInformationRelationships.every(
    (relationship) => validId(relationship.from) && validId(relationship.to)
  );
}
