export type KnowledgeRecordsCommsKind =
  | 'shared-reference'
  | 'collection'
  | 'relationship'
  | 'controlled-definition'
  | 'aggregation'
  | 'policy'
  | 'request'
  | 'plan'
  | 'work'
  | 'case'
  | 'campaign'
  | 'event-evidence';

export type KnowledgeRecordsCommsDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: KnowledgeRecordsCommsKind;
  definition: string;
  identityRule: string;
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type KnowledgeRecordsCommsRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  governance: string;
};

const krc = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: KnowledgeRecordsCommsKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[]
): KnowledgeRecordsCommsDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  keyData,
  lifecycle,
  governance
});

export const knowledgeRecordsCommunicationsModel: KnowledgeRecordsCommsDefinition[] = [
  krc(
    'KRC-KNOWLEDGE-ARTICLE',
    ['BOF-25-001', 'BOF-25-010'],
    'Knowledge Article',
    'shared-reference',
    'Knowledge-specific use of the canonical Information Container for reusable approved organisational knowledge; Lesson Learned is a knowledge-article type.',
    'No separate knowledge-content identity: stable Information Container identity owns revisions/representations while knowledge metadata governs audience, applicability, review and expiry.',
    [
      'Information Container',
      'knowledge type',
      'source/context',
      'summary/content',
      'applicability',
      'owner/author',
      'review date',
      'expiry/supersession',
      'classification/tags'
    ],
    ['Draft', 'Review', 'Published', 'Under Review', 'Superseded', 'Expired', 'Archived'],
    [
      'Knowledge Article reuses Information Container identity.',
      'Lesson Learned is a typed knowledge article, not a parallel lesson database.',
      'Knowledge publication does not rewrite the authoritative project/incident/process source facts.'
    ]
  ),

  krc(
    'KRC-KNOWLEDGE-COLLECTION',
    ['BOF-25-002'],
    'Knowledge Collection',
    'collection',
    'Governed curated collection of knowledge articles and approved references for a topic, capability, community or audience.',
    'Stable collection identity; membership is a relationship to authoritative knowledge/content identities rather than copied content.',
    [
      'collection name/purpose',
      'owner/curator',
      'audience',
      'membership',
      'ordering/sections',
      'classification',
      'review cadence'
    ],
    ['Draft', 'Published', 'Under Review', 'Superseded', 'Archived'],
    [
      'Collection membership never duplicates article content.',
      'One article may belong to many collections.',
      'Collection access cannot override source-content permission/security.'
    ]
  ),

  krc(
    'KRC-CONTROLLED-DOCUMENT',
    ['BOF-25-003', 'BOF-25-004'],
    'Controlled Document / Information Container',
    'shared-reference',
    'Records/knowledge-management use of the canonical Information Container identity for controlled documents and other governed information.',
    'One Information Container identity survives revisions, iterations, file replacements, renditions and publication/issue events.',
    [
      'Information Container',
      'type',
      'revision/iteration',
      'status/purpose',
      'classification',
      'owner',
      'retention/record metadata'
    ],
    ['WIP', 'Review', 'Approved', 'Issued/Published', 'Superseded', 'Archived'],
    [
      'Controlled Document is an Information Container type.',
      'A binary file/rendition is not the business identity.',
      'Record declaration and retention overlay the same authoritative object rather than copying it.'
    ]
  ),

  krc(
    'KRC-RECORD-DECLARATION',
    ['BOF-25-005'],
    'Record Declaration',
    'relationship',
    'Governed declaration relationship identifying an existing authoritative business object, Information Container, transaction or evidence item as a record for records-management purposes.',
    'Stable declaration relationship binds exact source identity/version where required to Record Type, series/file, retention class and declaration event/provenance.',
    [
      'source object/version',
      'Record Type',
      'Record Series/File',
      'retention class/schedule',
      'declared by/at',
      'business context',
      'security/handling'
    ],
    [
      'Declared',
      'Under Hold',
      'Eligible for Disposition',
      'Disposed/Transferred',
      'Superseded/Corrected'
    ],
    [
      'Declared Record is not a copied document or duplicate business object.',
      'Source identity/provenance remains authoritative.',
      'Legal Hold and disposition decisions constrain the declaration/record relationship without changing the source object identity.'
    ]
  ),

  krc(
    'KRC-RECORD-SERIES',
    ['BOF-25-006'],
    'Record Series',
    'controlled-definition',
    'Controlled records-series definition grouping records by business function, activity, subject or legal/operational purpose.',
    'Stable series identity/version with classification, ownership, retention/appraisal rules and applicability.',
    [
      'series code/title',
      'business function/activity',
      'description/scope',
      'Record Types',
      'owner',
      'retention schedule',
      'jurisdiction',
      'effective dates'
    ],
    ['Draft', 'Approved', 'Effective', 'Superseded', 'Retired'],
    [
      'Record Series is classification/aggregation policy, not content storage.',
      'Series changes preserve historic applicability.',
      'Retention rules remain separately governed/versioned.'
    ]
  ),

  krc(
    'KRC-RECORD-FILE',
    ['BOF-25-007'],
    'Record File Aggregation',
    'aggregation',
    'Governed aggregation of declared records for one case, subject, transaction set, period or business activity.',
    'Stable aggregation identity with membership relationships to declared records; it is neither a binary file nor a filesystem folder.',
    [
      'file/aggregation reference',
      'subject/case/activity',
      'opening/closing dates',
      'owner',
      'record memberships',
      'series',
      'security/retention context'
    ],
    ['Open', 'Closed', 'Transferred', 'Archived', 'Disposed'],
    [
      'Record File is an aggregation, not file content.',
      'Membership references record declarations/source identities.',
      'Closing an aggregation does not modify individual record evidence.'
    ]
  ),

  krc(
    'KRC-RETENTION-SCHEDULE',
    ['BOF-25-008'],
    'Retention Schedule',
    'policy',
    'Versioned records-retention and appraisal policy mapping record classes/series and triggers to periods, review, archive, transfer or disposition outcomes.',
    'Stable schedule identity with approved versions/effectivity; records pin the applicable schedule/rule version.',
    [
      'schedule/version',
      'jurisdiction/policy basis',
      'Record Types/Series',
      'retention trigger',
      'retention period',
      'appraisal/disposition action',
      'owner',
      'effective dates'
    ],
    ['Draft', 'Review', 'Approved', 'Effective', 'Superseded', 'Retired'],
    [
      'Retention Schedule is policy/configuration, not a disposal event.',
      'Legal Hold overrides otherwise-eligible disposition.',
      'Historic records retain the exact schedule/rule basis used.'
    ]
  ),

  krc(
    'KRC-DISPOSITION-REQUEST',
    ['BOF-25-009'],
    'Disposition Request',
    'request',
    'Governed request proposing disposition, archive or transfer of an exact record population after retention eligibility and legal-hold checks.',
    'Stable request identity pins the candidate record set, applicable schedule/rules, eligibility evidence and authority path; final outcome is a Retention Disposition Decision.',
    [
      'record population/snapshot',
      'retention schedule/rules',
      'eligibility date',
      'hold checks',
      'requested action',
      'requester',
      'authority/review',
      'evidence'
    ],
    [
      'Prepared',
      'Eligibility Checked',
      'Submitted',
      'Review',
      'Approved/Rejected',
      'Executed',
      'Closed',
      'Cancelled'
    ],
    [
      'Disposition Request is not the disposition decision.',
      'Record population is pinned before approval.',
      'Execution must preserve disposition evidence and never silently delete held/ineligible records.'
    ]
  ),

  krc(
    'KRC-COMMS-PLAN',
    ['BOF-25-011'],
    'Communications Plan',
    'plan',
    'Versioned plan coordinating communication objectives, audiences, messages, channels, activities, owners, timing and measurement.',
    'Stable plan identity with approved versions; individual Communication Items and content retain separate identities.',
    [
      'scope/context',
      'objectives',
      'audiences',
      'key messages',
      'channels',
      'activities',
      'owners',
      'schedule',
      'measures'
    ],
    ['Draft', 'Review', 'Approved', 'Active', 'Superseded', 'Closed'],
    [
      'Plan is not Communication Item execution or message content.',
      'Approved plan changes preserve version history.',
      'Audiences reference Parties/stakeholder definitions rather than copied contact masters.'
    ]
  ),

  krc(
    'KRC-COMMUNICATION-ITEM',
    ['BOF-25-012'],
    'Communication Item',
    'work',
    'Governed planned or executed communication activity delivering exact approved content to a defined audience through a channel.',
    'Stable activity identity linking content revision, audience, channel, owner, schedule and publication/delivery evidence.',
    [
      'plan/campaign/context',
      'content/revision',
      'audience',
      'channel',
      'owner',
      'scheduled/published at',
      'distribution/delivery evidence',
      'measures'
    ],
    [
      'Planned',
      'Content Ready',
      'Approved',
      'Scheduled',
      'Published/Sent',
      'Completed',
      'Cancelled'
    ],
    [
      'Communication Item is not the content itself.',
      'Content reuses Information Container.',
      'Delivery/publication evidence remains attributable and retention-aware.'
    ]
  ),

  krc(
    'KRC-MEDIA-ENQUIRY',
    ['BOF-25-013'],
    'Media Enquiry',
    'case',
    'Governed inbound media request requiring triage, investigation, approved response and retained interaction/publication evidence.',
    'Stable enquiry identity tied to source/media Party, question, deadline, subject and approved response content.',
    [
      'media/source Party',
      'contact',
      'received at',
      'question/topic',
      'subject/business context',
      'deadline',
      'owner',
      'response content/evidence'
    ],
    ['Received', 'Triaged', 'Preparing Response', 'Approval', 'Responded', 'Closed', 'Declined'],
    [
      'Media Enquiry is not a generic email/message record.',
      'Response content is controlled information.',
      'Interaction evidence references canonical Party/contact identities.'
    ]
  ),

  krc(
    'KRC-PUBLICATION-CONTENT',
    ['BOF-25-014', 'BOF-25-015', 'BOF-25-020'],
    'Public Communication Content',
    'shared-reference',
    'Controlled Information Container profiles for Media Release, Statement and Annual Report content.',
    'No separate content identities: each publication uses Information Container revision/approval/issue semantics with type-specific metadata.',
    [
      'Information Container',
      'content type',
      'reporting/subject period',
      'audience',
      'approver/authority',
      'approved revision',
      'publication date',
      'distribution'
    ],
    ['Draft', 'Review', 'Approved', 'Published/Issued', 'Superseded', 'Archived'],
    [
      'Media Release, Statement and Annual Report are controlled Information Container types.',
      'Annual Report source financial/non-financial positions remain authoritative in their source domains.',
      'Published revisions are immutable and corrections/new editions are explicit.'
    ]
  ),

  krc(
    'KRC-COMMS-CAMPAIGN',
    ['BOF-25-016'],
    'Communications Campaign',
    'campaign',
    'Governed campaign coordinating communications/PR objectives, audiences, key messages, content, activities, channels and measures.',
    'Stable campaign identity with planned period, scope, ownership and outcome evidence; PR is a campaign type/context.',
    [
      'campaign type',
      'objectives',
      'audiences',
      'messages',
      'content/items',
      'channels',
      'period',
      'owner',
      'budget context',
      'measures'
    ],
    ['Proposed', 'Planned', 'Approved', 'Active', 'Paused', 'Completed', 'Closed', 'Cancelled'],
    [
      'Campaign is not the content or Communication Item.',
      'Measures/outcomes are evidence/projections rather than campaign identity.',
      'Campaign links to issues/stakeholders without duplicating them.'
    ]
  ),

  krc(
    'KRC-EXTERNAL-AFFAIRS-ISSUE',
    ['BOF-25-017', 'BOF-25-018'],
    'External Affairs Issue',
    'case',
    'Governed external-affairs case for reputation, public affairs or related stakeholder issue requiring assessment, monitoring and coordinated response.',
    'Stable issue identity with explicit issue type, subject, stakeholders, impact, position/response, owner and evidence history.',
    [
      'issue type',
      'subject/context',
      'stakeholders',
      'severity/impact',
      'position/response',
      'owner',
      'actions/communications',
      'evidence'
    ],
    ['Identified', 'Assessing', 'Active', 'Monitoring', 'Resolved', 'Closed', 'Reopened'],
    [
      'Reputation and Public Affairs are issue types, not separate case engines.',
      'Issue assessment does not overwrite underlying legal/regulatory/customer/project facts.',
      'Responses/content remain separately governed.'
    ]
  ),

  krc(
    'KRC-STAKEHOLDER-ENGAGEMENT',
    ['BOF-25-019'],
    'Stakeholder Engagement',
    'event-evidence',
    'Attributed engagement occurrence with an investor or other stakeholder through meeting, call, consultation, presentation or other channel.',
    'Immutable engagement identity recording participants/Parties, purpose, channel, time, subjects, commitments/actions and source evidence.',
    [
      'stakeholder Parties/participants',
      'engagement type',
      'purpose',
      'occurred at',
      'channel/location',
      'subjects',
      'commitments/actions',
      'evidence'
    ],
    ['Recorded', 'Corrected'],
    [
      'Investor Engagement is a Stakeholder Engagement type.',
      'Party identity is referenced, not duplicated.',
      'Corrections add attributable history rather than replacing the original engagement evidence.'
    ]
  ),

  krc(
    'KRC-STAKEHOLDER-PLAN',
    ['BOF-25-021'],
    'Stakeholder Engagement Plan',
    'plan',
    'Versioned plan defining relevant stakeholders, engagement objectives, methods, cadence, responsibilities, issues/commitments and measures.',
    'Stable plan identity with approved versions; stakeholder Parties/groups and engagement occurrences retain separate identities.',
    [
      'scope/context',
      'stakeholder groups/Parties',
      'objectives',
      'methods/channels',
      'cadence',
      'owners',
      'issues/commitments',
      'measures'
    ],
    ['Draft', 'Review', 'Approved', 'Active', 'Superseded', 'Closed'],
    [
      'Stakeholder Engagement Plan is broader than a Communications Plan.',
      'Stakeholder identification references canonical Parties/groups.',
      'Actual engagement is separate attributable evidence.'
    ]
  )
];

export const knowledgeRecordsCommunicationsRelationships: KnowledgeRecordsCommsRelationship[] = [
  {
    id: 'KRC-R01',
    from: 'KRC-KNOWLEDGE-COLLECTION',
    predicate: 'contains references to',
    to: 'KRC-KNOWLEDGE-ARTICLE',
    cardinality: 'many-to-many',
    governance: 'Collection membership never copies article content.'
  },
  {
    id: 'KRC-R02',
    from: 'KRC-RECORD-DECLARATION',
    predicate: 'may classify under',
    to: 'KRC-RECORD-SERIES',
    cardinality: 'many-to-one',
    governance: 'Series membership is explicit and effective.'
  },
  {
    id: 'KRC-R03',
    from: 'KRC-RECORD-FILE',
    predicate: 'aggregates',
    to: 'KRC-RECORD-DECLARATION',
    cardinality: 'one-to-many',
    governance: 'Aggregation references declarations/source records.'
  },
  {
    id: 'KRC-R04',
    from: 'KRC-RECORD-SERIES',
    predicate: 'governed by',
    to: 'KRC-RETENTION-SCHEDULE',
    cardinality: 'many-to-one-or-many',
    governance: 'Exact schedule/version applicability is retained.'
  },
  {
    id: 'KRC-R05',
    from: 'KRC-RECORD-DECLARATION',
    predicate: 'classified by',
    to: 'REF-RECORD-TYPE',
    cardinality: 'many-to-one-or-many',
    governance: 'Record Type is reference/configuration, not record identity.'
  },
  {
    id: 'KRC-R06',
    from: 'KRC-RECORD-DECLARATION',
    predicate: 'uses retention class',
    to: 'REF-DATA-RETENTION-CLASS',
    cardinality: 'many-to-zero-or-one',
    governance: 'Retention Class selects policy and does not itself dispose records.'
  },
  {
    id: 'KRC-R07',
    from: 'KRC-DISPOSITION-REQUEST',
    predicate: 'requests decision under',
    to: 'EVID-RETENTION-DISPOSITION-DECISION',
    cardinality: 'many-to-zero-or-one',
    governance: 'Request and final authorised decision remain separate.'
  },
  {
    id: 'KRC-R08',
    from: 'KRC-DISPOSITION-REQUEST',
    predicate: 'must respect',
    to: 'EVID-LEGAL-HOLD-LINK',
    cardinality: 'many-to-many',
    governance: 'Held records are excluded from destructive disposition.'
  },
  {
    id: 'KRC-R09',
    from: 'KRC-KNOWLEDGE-ARTICLE',
    predicate: 'reuses',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-one-pattern',
    governance: 'Knowledge content remains canonical controlled information.'
  },
  {
    id: 'KRC-R10',
    from: 'KRC-CONTROLLED-DOCUMENT',
    predicate: 'reuses',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-one-pattern',
    governance: 'Controlled-document identity is the Information Container.'
  },
  {
    id: 'KRC-R11',
    from: 'KRC-COMMUNICATION-ITEM',
    predicate: 'delivers content from',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-one-or-many',
    governance: 'Activity references exact approved content revisions.'
  },
  {
    id: 'KRC-R12',
    from: 'KRC-COMMS-PLAN',
    predicate: 'plans',
    to: 'KRC-COMMUNICATION-ITEM',
    cardinality: 'one-to-many',
    governance: 'Execution has its own identity/status/evidence.'
  },
  {
    id: 'KRC-R13',
    from: 'KRC-MEDIA-ENQUIRY',
    predicate: 'may produce',
    to: 'KRC-PUBLICATION-CONTENT',
    cardinality: 'many-to-zero-or-many',
    governance: 'Response/publication content is separately controlled.'
  },
  {
    id: 'KRC-R14',
    from: 'KRC-PUBLICATION-CONTENT',
    predicate: 'reuses',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-one-pattern',
    governance: 'Public communication content uses canonical information identity.'
  },
  {
    id: 'KRC-R15',
    from: 'KRC-COMMS-CAMPAIGN',
    predicate: 'contains',
    to: 'KRC-COMMUNICATION-ITEM',
    cardinality: 'one-to-many',
    governance: 'Campaign coordinates activities without becoming content.'
  },
  {
    id: 'KRC-R16',
    from: 'KRC-EXTERNAL-AFFAIRS-ISSUE',
    predicate: 'may drive',
    to: 'KRC-COMMUNICATION-ITEM',
    cardinality: 'one-to-many',
    governance: 'Response activity remains separately attributable.'
  },
  {
    id: 'KRC-R17',
    from: 'KRC-STAKEHOLDER-PLAN',
    predicate: 'results in',
    to: 'KRC-STAKEHOLDER-ENGAGEMENT',
    cardinality: 'one-to-many',
    governance: 'Plan and actual engagement evidence remain separate.'
  },
  {
    id: 'KRC-R18',
    from: 'KRC-STAKEHOLDER-ENGAGEMENT',
    predicate: 'engages',
    to: 'CBO-PARTY',
    cardinality: 'many-to-many',
    governance: 'Stakeholder/investor identity reuses canonical Party.'
  },
  {
    id: 'KRC-R19',
    from: 'KRC-STAKEHOLDER-PLAN',
    predicate: 'plans engagement with',
    to: 'CBO-PARTY',
    cardinality: 'many-to-many',
    governance: 'Party identity is referenced rather than recreated.'
  },
  {
    id: 'KRC-R20',
    from: 'KRC-RECORD-DECLARATION',
    predicate: 'may point to',
    to: 'CBO-INFORMATION-CONTAINER',
    cardinality: 'many-to-zero-or-one',
    governance: 'Information Container remains authoritative content identity.'
  }
];

export const knowledgeRecordsCommunicationsRules = [
  'Knowledge, records and communications reuse canonical Information Container, Party, evidence, retention and legal-hold identities rather than creating parallel repositories.',
  'Knowledge Article, Controlled Document, Media Release, Statement and Annual Report are Information Container types/profiles, not separate document masters.',
  'Lesson Learned is a typed Knowledge Article whose source context remains linked to authoritative project/process/incident truth.',
  'Record Declaration overlays an authoritative business object/evidence item; declaring a record never copies the underlying object into a records silo.',
  'Record Series and Record File Aggregation are classification/aggregation structures, not file storage hierarchies.',
  'Retention Schedule is versioned policy; Record Type and Data Retention Class remain reference/configuration; Legal Hold overrides otherwise-eligible disposition.',
  'Disposition Request is domain request; final Retention Disposition Decision remains immutable BOF-28 decision evidence.',
  'Communication Item is the activity of communicating; its message/content is separately controlled Information Container content.',
  'Reputation Issue and Public Affairs Issue share one External Affairs Issue case pattern with explicit issue type.',
  'Investor Engagement is a Stakeholder Engagement occurrence/evidence linked to canonical Parties.',
  'Stakeholder Engagement Plan is distinct from Communications Plan because engagement includes consultation, relationship and commitment activity beyond outbound communications.',
  'Published communication revisions are immutable; correction/new publication preserves prior issued content.',
  'Records retention, privacy, legal privilege, security classification and access are independent governance dimensions and may all apply simultaneously.'
] as const;

export function validateKnowledgeRecordsCommunicationsModel() {
  const ids = new Set(knowledgeRecordsCommunicationsModel.map((x) => x.modelId));
  const relIds = new Set(knowledgeRecordsCommunicationsRelationships.map((x) => x.id));
  const external = new Set([
    'REF-RECORD-TYPE',
    'REF-DATA-RETENTION-CLASS',
    'EVID-RETENTION-DISPOSITION-DECISION',
    'EVID-LEGAL-HOLD-LINK',
    'CBO-INFORMATION-CONTAINER',
    'CBO-PARTY'
  ]);
  if (
    ids.size !== knowledgeRecordsCommunicationsModel.length ||
    relIds.size !== knowledgeRecordsCommunicationsRelationships.length
  )
    return false;
  const candidates = new Set(knowledgeRecordsCommunicationsModel.flatMap((x) => x.candidateKeys));
  for (let i = 1; i <= 21; i += 1)
    if (!candidates.has(`BOF-25-${String(i).padStart(3, '0')}`)) return false;
  if (
    knowledgeRecordsCommunicationsModel.some(
      (x) => !x.definition || !x.identityRule || !x.governance.length
    )
  )
    return false;
  return knowledgeRecordsCommunicationsRelationships.every(
    (x) => (ids.has(x.from) || external.has(x.from)) && (ids.has(x.to) || external.has(x.to))
  );
}
