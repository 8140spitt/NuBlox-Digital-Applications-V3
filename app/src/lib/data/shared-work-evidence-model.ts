export type SharedWorkEvidenceKind =
  | 'workflow-definition'
  | 'workflow-runtime'
  | 'work'
  | 'request'
  | 'relationship'
  | 'configuration'
  | 'decision-evidence'
  | 'event-evidence'
  | 'retention-control'
  | 'integration-evidence';

export type SharedWorkEvidenceDefinition = {
  modelId: string;
  candidateKeys: string[];
  canonicalName: string;
  kind: SharedWorkEvidenceKind;
  definition: string;
  identityRule: string;
  scope: string[];
  keyData: string[];
  lifecycle: string[];
  governance: string[];
};

export type SharedWorkEvidenceRelationship = {
  id: string;
  from: string;
  predicate: string;
  to: string;
  cardinality: string;
  relationshipObject?: string;
  governance: string;
};

export type SharedWorkEvidenceBoundary = {
  name: string;
  structure: string;
  purpose: string;
  mustNotBecome: string;
};

const def = (
  modelId: string,
  candidateKeys: string[],
  canonicalName: string,
  kind: SharedWorkEvidenceKind,
  definition: string,
  identityRule: string,
  keyData: string[],
  lifecycle: string[],
  governance: string[],
  scope: string[] = ['tenant', 'governed subject/context']
): SharedWorkEvidenceDefinition => ({
  modelId,
  candidateKeys,
  canonicalName,
  kind,
  definition,
  identityRule,
  scope,
  keyData,
  lifecycle,
  governance
});

export const sharedWorkEvidenceModel: SharedWorkEvidenceDefinition[] = [
  def(
    'WORK-WORKFLOW-DEFINITION',
    [],
    'Workflow Definition',
    'workflow-definition',
    'Versioned orchestration configuration describing permitted steps, routing, timers, conditions and completion rules around canonical business work.',
    'Stable definition identity with immutable published versions. Running instances retain the exact definition version used.',
    ['definition key', 'version', 'trigger/subject types', 'steps', 'routing rules', 'timers', 'completion rules'],
    ['Draft', 'Validated', 'Published', 'Retired'],
    [
      'Workflow configuration never defines the authoritative lifecycle of every domain object.',
      'Published definition versions are immutable; a material change creates a new version.',
      'Domain services remain authoritative for business-state transition validation.'
    ],
    ['tenant', 'configuration']
  ),
  def(
    'WORK-WORKFLOW-INSTANCE',
    [],
    'Workflow Instance',
    'workflow-runtime',
    'Runtime orchestration instance coordinating work around one or more exact canonical subjects using a fixed Workflow Definition version.',
    'Unique runtime identity linked to the exact definition version and subject references; it never becomes the business object being coordinated.',
    ['workflow definition/version', 'subject references', 'started by', 'started at', 'current orchestration state', 'completion reason'],
    ['Pending', 'Running', 'Waiting', 'Completed', 'Cancelled', 'Failed'],
    [
      'Runtime state is orchestration state, not domain lifecycle state.',
      'Cancellation of workflow does not delete or roll back authoritative domain facts unless a governed domain command explicitly does so.',
      'Completed instances retain traceability to work, decisions and evidence.'
    ]
  ),
  def(
    'WORK-WORK-ITEM',
    ['BOF-27-001'],
    'Work Item',
    'work',
    'Reusable actionable unit of shared human/system work linked to an authoritative subject, request or workflow instance.',
    'Stable Work Item identity independent of the domain object, Schedule Activity, Work Order or service task it may reference.',
    ['subject', 'work type', 'assignment', 'status', 'due date', 'priority', 'instructions', 'completion evidence'],
    ['Ready', 'Assigned', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
    [
      'Work Items coordinate action but never replace domain truth.',
      'A Work Item may be regenerated/reassigned while the subject identity remains unchanged.',
      'Completion must record the action/outcome required by the relevant domain rule.'
    ]
  ),
  def(
    'WORK-ASSIGNMENT',
    ['BOF-27-002'],
    'Work Assignment',
    'relationship',
    'Effective relationship assigning a Work Item to an eligible Party, User Identity, Role or queue.',
    'Immutable assignment relationship identity; reassignment closes/supersedes the earlier assignment rather than rewriting history.',
    ['work item', 'assignee/queue', 'assigned by', 'assignment basis', 'valid from/to', 'status'],
    ['Proposed', 'Active', 'Completed', 'Reassigned', 'Ended'],
    [
      'Assignment is not responsibility, permission or delegated authority.',
      'Eligibility is evaluated against membership, role, permission and scope.',
      'Assignment history remains queryable.'
    ]
  ),
  def(
    'WORK-REVIEW-REQUEST',
    ['BOF-27-003'],
    'Review Request',
    'request',
    'Governed request to review an exact subject, revision, version, configuration or evidence set against stated criteria.',
    'Stable request identity bound to exact subject/version references; a resubmission/re-review is separately traceable.',
    ['subject/version', 'review criteria', 'requester', 'reviewers', 'due date', 'required response form'],
    ['Draft', 'Issued', 'In Review', 'Responded', 'Closed', 'Cancelled'],
    [
      'Review is advisory/evaluative unless a domain rule explicitly gives its outcome business effect.',
      'Review Request is distinct from Approval Request.',
      'Responses and resulting decisions/evidence are retained separately.'
    ]
  ),
  def(
    'WORK-APPROVAL-REQUEST',
    ['BOF-27-004'],
    'Approval Request',
    'request',
    'Governed request for an authorised approve/reject/return decision against an exact business subject and version/configuration.',
    'Stable request identity bound to the exact subject/version and approval basis. A new approval cycle creates a new request or governed cycle occurrence.',
    ['subject/version', 'approval rule', 'required authority', 'requester', 'eligible approver', 'decision options', 'due date'],
    ['Draft', 'Submitted', 'Pending Decision', 'Decided', 'Withdrawn', 'Expired'],
    [
      'Approval Request does not itself change domain state.',
      'A valid decision requires permission plus applicable delegated/statutory authority.',
      'The exact approved subject/version must be retained in evidence.'
    ]
  ),
  def(
    'WORK-DECISION-REQUEST',
    ['BOF-27-005'],
    'Decision Request',
    'request',
    'Governed request asking an authorised person, role or decision body to resolve a defined question.',
    'Stable request identity containing the question, options and exact supporting context; the Decision is a separate immutable outcome.',
    ['question', 'options', 'subject/context', 'requester', 'decision authority', 'required-by date', 'supporting evidence'],
    ['Draft', 'Submitted', 'Under Consideration', 'Decided', 'Withdrawn', 'Expired'],
    [
      'A Decision Request is not the Decision.',
      'Decision authority is evaluated independently from assignment.',
      'Material changes to the question/options require a new governed request version/cycle.'
    ]
  ),
  def(
    'WORK-DECISION',
    [],
    'Decision',
    'decision-evidence',
    'Immutable attributable outcome resolving an Approval Request, Decision Request or other governed decision point.',
    'Unique decision occurrence identity bound to the exact request/subject/version, actor/body and authority basis at decision time.',
    ['request', 'subject/version', 'outcome', 'reason', 'decider', 'authority basis', 'decided at', 'conditions/actions'],
    ['Recorded', 'Superseded', 'Corrected'],
    [
      'Decisions are append-only evidence; they are never silently edited.',
      'A superseding/corrective decision references the earlier decision and reason.',
      'Domain state changes happen through explicit domain commands that consume a valid decision.'
    ]
  ),
  def(
    'WORK-FOLLOW-UP-ACTION',
    [],
    'Decision Action',
    'work',
    'Action/obligation created by a Decision, review outcome, audit finding or other governed event.',
    'Stable action identity with accountable owner, due date and closure evidence; it does not become the source Decision.',
    ['source decision/event', 'action description', 'owner', 'due date', 'status', 'closure evidence'],
    ['Open', 'In Progress', 'Blocked', 'Completed', 'Cancelled'],
    [
      'Actions preserve traceability to the decision/event that created them.',
      'Closing an action does not rewrite the source evidence.',
      'Where execution belongs to a specialist domain, the action references the specialist object rather than duplicating it.'
    ]
  ),
  def(
    'WORK-ACKNOWLEDGEMENT',
    ['BOF-27-006'],
    'Acknowledgement',
    'event-evidence',
    'Attributed evidence that a Party/User acknowledged receipt, reading or awareness of a defined subject.',
    'Unique acknowledgement occurrence bound to actor, exact subject/version and timestamp.',
    ['actor', 'subject/version', 'acknowledgement type', 'statement', 'timestamp', 'channel'],
    ['Recorded'],
    [
      'Acknowledgement is not approval unless a specific business rule defines it as such.',
      'Evidence remains immutable after recording.',
      'Required acknowledgements can generate Work Items without changing subject lifecycle.'
    ]
  ),
  def(
    'WORK-ESCALATION',
    ['BOF-27-007'],
    'Escalation Record',
    'event-evidence',
    'Retained evidence that work/request handling was escalated under a defined timer, exception or policy rule.',
    'Unique escalation occurrence referencing the affected work/request and escalation rule.',
    ['work/request', 'trigger', 'rule', 'from/to actor or queue', 'reason', 'occurred at'],
    ['Recorded', 'Resolved'],
    [
      'Escalation changes routing/attention, not business authority.',
      'Escalation history is retained.',
      'Authority still must be evaluated at the eventual decision/action.'
    ]
  ),
  def(
    'WORK-DUE-DATE-CHANGE',
    ['BOF-27-008'],
    'Due Date Change Record',
    'event-evidence',
    'Immutable record of a due-date change for a Work Item or governed request.',
    'Unique change occurrence retaining prior/new values, actor and rationale.',
    ['target work/request', 'prior due date', 'new due date', 'actor', 'reason', 'occurred at'],
    ['Recorded'],
    ['Current due date is derived from authoritative work state plus retained changes.', 'Changes are auditable and cannot erase previous due dates.']
  ),
  def(
    'WORK-PRIORITY-CHANGE',
    ['BOF-27-009'],
    'Priority Change Record',
    'event-evidence',
    'Immutable record of a priority change for work-routing purposes.',
    'Unique change occurrence retaining prior/new priority, actor, rationale and time.',
    ['target work/request', 'prior priority', 'new priority', 'actor', 'reason', 'occurred at'],
    ['Recorded'],
    ['Priority is work-routing context, not business-object lifecycle state.', 'Priority history remains queryable.']
  ),
  def(
    'WORK-DELEGATION',
    ['BOF-27-010'],
    'Work Delegation',
    'relationship',
    'Effective temporary delegation of assigned work from one eligible actor to another.',
    'Stable delegation relationship with explicit scope and effectivity; it never grants business Delegated Authority.',
    ['delegator', 'delegate', 'work/queue scope', 'valid from/to', 'reason', 'status'],
    ['Proposed', 'Active', 'Revoked', 'Expired', 'Ended'],
    [
      'Work Delegation is distinct from AUTH-DELEGATED-AUTHORITY.',
      'The delegate must still pass permission and authority evaluation for protected actions.',
      'Delegation cannot bypass segregation-of-duties controls.'
    ]
  ),
  def(
    'WORK-COLLABORATION-INVITATION',
    ['BOF-27-011', 'BOF-27-012'],
    'Collaboration Invitation',
    'request',
    'Governed invitation for a Party/User to participate in a Project, collaboration or other controlled context.',
    'Stable invitation identity; project participation is a typed invitation use, and acceptance may create a separate Membership relationship.',
    ['invitee', 'context', 'inviter', 'proposed role/membership', 'expiry', 'status'],
    ['Draft', 'Sent', 'Accepted', 'Declined', 'Expired', 'Revoked'],
    [
      'Invitation acceptance does not automatically create unrestricted permission or authority.',
      'Project Participation Invitation uses this same canonical pattern.',
      'Membership/role assignments created on acceptance remain separate governed relationships.'
    ]
  ),
  def(
    'WORK-EXTERNAL-SUBMISSION',
    ['BOF-27-013'],
    'External Submission',
    'event-evidence',
    'Immutable attributable evidence that exact governed content/data was submitted to an external Party, authority or system.',
    'Unique submission occurrence preserving exact subject/content version, recipient, channel, external reference and timestamp.',
    ['subject/content version', 'sender', 'recipient', 'channel', 'external reference', 'submitted at', 'delivery evidence'],
    ['Prepared', 'Submitted', 'Accepted', 'Rejected', 'Failed'],
    [
      'The submission references the canonical content/object; it does not clone it.',
      'Retries create traceable delivery attempts rather than rewriting the original submission occurrence.',
      'External acknowledgement/status is retained as evidence.'
    ]
  ),
  def(
    'WORK-REQUEST-RESPONSE',
    ['BOF-27-014'],
    'Request Response',
    'event-evidence',
    'Generic attributable response to a governed review, approval, decision or collaboration request.',
    'Unique response occurrence linked to one originating request and responder.',
    ['request', 'responder', 'response type', 'statement', 'attachments/evidence', 'responded at'],
    ['Recorded', 'Superseded'],
    [
      'Request Response is distinct from INFO-RESPONSE, which answers an Information Query/Submittal.',
      'A response may inform a Decision but does not automatically become the Decision.',
      'Superseding responses remain traceable.'
    ]
  ),
  def(
    'WORK-NOTIFICATION-PREFERENCE',
    ['BOF-27-015'],
    'Notification Preference',
    'configuration',
    'User-scoped preference controlling non-authoritative notification channels, digests and categories.',
    'Stable preference identity per user/category/context with auditable changes where required.',
    ['user identity', 'category', 'channel', 'frequency', 'quiet/digest settings', 'effectivity'],
    ['Active', 'Disabled'],
    [
      'Preferences cannot suppress mandatory legal/statutory notices, assignments or security events.',
      'Notification delivery is a communication concern; Work Item existence remains authoritative.',
      'A notification is not evidence that the user completed the assigned work.'
    ],
    ['tenant', 'user']
  ),

  def(
    'EVID-BUSINESS-EVENT',
    ['BOF-28-001'],
    'Business Event',
    'event-evidence',
    'Immutable semantic occurrence emitted when an authoritative business fact occurs or governed state transition is committed.',
    'Globally unique event occurrence linked to source aggregate/object, event type, source version and transaction/correlation context.',
    ['event id', 'event type', 'source object', 'source version', 'occurred at', 'actor/system', 'correlation/causation'],
    ['Recorded', 'Published'],
    [
      'A Business Event describes committed business truth but is not a second mutable copy of the source object.',
      'Event payload/schema is versioned for compatibility.',
      'Publishing failure does not roll back an already committed domain fact; reliable outbox delivery handles transport.'
    ]
  ),
  def(
    'EVID-AUDIT-EVENT',
    ['BOF-28-002'],
    'Audit Event',
    'event-evidence',
    'Append-only accountability/security evidence recording an auditable action or access against a governed object/context.',
    'Unique immutable occurrence containing actor/principal, action, target, tenant/context, timestamp and result.',
    ['actor/principal', 'action', 'target', 'tenant/context', 'timestamp', 'result', 'request/session correlation'],
    ['Recorded'],
    [
      'Audit Events are append-only and protected from ordinary application editing.',
      'Audit Event is distinct from Business Event and Change Event.',
      'Sensitive audit access is permission-controlled and itself auditable.'
    ]
  ),
  def(
    'EVID-CHANGE-EVENT',
    ['BOF-28-003'],
    'Change Event',
    'event-evidence',
    'Immutable before/after evidence of an authorised change to mutable business state or configuration.',
    'Unique change occurrence linked to target object/version and change command/actor.',
    ['target', 'prior version/value', 'new version/value', 'actor', 'reason', 'changed at', 'command/correlation'],
    ['Recorded'],
    [
      'Change evidence complements domain history; it does not replace current state.',
      'Material changes retain prior values or stable references sufficient to reconstruct accountability.',
      'Corrections reference the original Change Event rather than rewriting it.'
    ]
  ),
  def(
    'EVID-APPROVAL',
    ['BOF-28-004'],
    'Approval Evidence',
    'decision-evidence',
    'Immutable evidence proving an approval/rejection/return decision against an exact subject/version and approval request.',
    'Unique approval evidence occurrence bound to Decision, request, actor, authority basis and exact subject/version hash/reference.',
    ['decision', 'approval request', 'subject/version', 'actor', 'authority basis', 'timestamp', 'statement/signature'],
    ['Recorded'],
    [
      'Approval Evidence is immutable.',
      'It must identify the exact approved/rejected content/configuration.',
      'It never substitutes for delegated authority or the authoritative business object.'
    ]
  ),
  def(
    'EVID-SIGNATURE',
    ['BOF-28-005'],
    'Signature',
    'event-evidence',
    'Cryptographic or procedurally attributable evidence that a signer signed exact content/data under a defined signature policy.',
    'Unique signature occurrence bound to signer identity and exact signed payload/version digest.',
    ['signer', 'signed subject/version', 'digest', 'signature method', 'certificate/provider reference', 'signed at', 'policy'],
    ['Recorded', 'Invalidated'],
    [
      'Signature evidence cannot float independently from the exact signed content/version.',
      'Invalidation/revocation does not erase the original signature occurrence.',
      'Signature policy determines legal/assurance strength.'
    ]
  ),
  def(
    'EVID-ATTESTATION',
    ['BOF-28-006'],
    'Attestation',
    'event-evidence',
    'Attributed statement asserting specified facts, conditions or compliance under a defined attestation basis.',
    'Unique immutable attestation occurrence bound to attestor, subject, statement and timestamp.',
    ['attestor', 'subject', 'statement', 'basis', 'evidence references', 'attested at'],
    ['Recorded', 'Withdrawn', 'Superseded'],
    [
      'Withdrawal/supersession creates new evidence and never deletes the original attestation.',
      'Attestation is distinct from approval unless the governing process explicitly equates them.',
      'Authority/competence requirements are evaluated independently.'
    ]
  ),
  def(
    'EVID-EVIDENCE-ITEM',
    ['BOF-28-007'],
    'Evidence Item',
    'event-evidence',
    'Generic governed evidence identity for a file, dataset extract, measurement, statement, photograph or other evidential artefact linked to business truth.',
    'Stable evidence identity with immutable captured content/version, provenance and integrity metadata.',
    ['evidence type', 'subject links', 'captured by', 'captured at', 'content/reference', 'hash/integrity', 'classification'],
    ['Captured', 'Verified', 'Superseded', 'Archived'],
    [
      'Evidence references/supports domain facts; it does not replace structured domain state.',
      'Integrity metadata and provenance are preserved.',
      'Superseded evidence remains retained according to applicable policy.'
    ]
  ),
  def(
    'EVID-PROVENANCE-REFERENCE',
    ['BOF-28-008'],
    'Provenance Reference',
    'relationship',
    'Traceability relationship linking evidence, derived information or projections to the authoritative inputs/origins that produced them.',
    'Stable provenance edge with source identity/version, transformation/context and effectivity.',
    ['derived/evidence object', 'source object/version', 'provenance type', 'transformation/process', 'captured at'],
    ['Active'],
    ['Provenance never creates a duplicate source master.', 'Derived outputs should remain explainable back to authoritative sources.']
  ),
  def(
    'EVID-SOURCE-REFERENCE',
    ['BOF-28-009'],
    'Source Reference',
    'relationship',
    'Explicit traceability link to an originating internal or external source identifier/object/system.',
    'Stable source link containing source system/authority, identifier, version/time and retrieval/context metadata.',
    ['target/evidence', 'source system/authority', 'external/internal identifier', 'version/as-of', 'reference URI/key'],
    ['Active', 'Superseded'],
    ['A Source Reference adapts external identity to NuBlox without redefining canonical identity.', 'Source changes are historically retained where evidentially relevant.']
  ),
  def(
    'EVID-CORRECTION',
    ['BOF-28-010'],
    'Correction Record',
    'event-evidence',
    'Immutable evidence that a previous record/fact/evidence item was corrected by a new governed record.',
    'Unique correction occurrence linking original and corrective records plus reason and authority.',
    ['original record', 'corrective record', 'reason', 'actor', 'authority', 'corrected at'],
    ['Recorded'],
    ['Correction never erases or edits the original evidence.', 'The corrected current view is derived from the complete correction chain.']
  ),
  def(
    'EVID-REVERSAL',
    ['BOF-28-011'],
    'Reversal Record',
    'event-evidence',
    'Immutable evidence that a previous posting/event/effect was reversed through a new governed action.',
    'Unique reversal occurrence linking the original effect and reversing record with reason/authority.',
    ['original record/effect', 'reversing record', 'reason', 'actor', 'authority', 'reversed at'],
    ['Recorded'],
    ['Reversal preserves the original record.', 'A reversal is not destructive deletion and must retain causal traceability.']
  ),
  def(
    'EVID-ARCHIVE-PACKAGE',
    ['BOF-28-012'],
    'Archive Package',
    'retention-control',
    'Governed preservation package containing exact records/evidence plus a manifest, provenance, integrity and retention metadata.',
    'Stable package identity with immutable package versions/manifests once sealed.',
    ['package manifest', 'record/evidence references', 'integrity digests', 'retention class', 'created/sealed by', 'custody/location'],
    ['Preparing', 'Sealed', 'Transferred', 'Preserved', 'Disposed'],
    [
      'Archive Package preserves records; it is not a second operational master.',
      'Sealed package manifests are immutable.',
      'Disposition remains subject to legal holds and authority.'
    ],
    ['tenant', 'records/evidence scope']
  ),
  def(
    'EVID-RETENTION-DISPOSITION',
    ['BOF-28-013'],
    'Retention Disposition Decision',
    'retention-control',
    'Authorised evidenced decision to retain, transfer, archive or destroy eligible records/evidence under applicable retention rules.',
    'Unique decision occurrence covering exact record/evidence scope, rule basis, hold evaluation, authority and execution evidence.',
    ['scope', 'retention rule/schedule', 'eligibility date', 'hold check', 'decision', 'authoriser', 'execution evidence'],
    ['Proposed', 'Approved', 'Executed', 'Cancelled'],
    [
      'No disposition can execute while an applicable Legal Hold Link is active.',
      'Disposition decisions are immutable evidence; cancellation/supersession creates new records.',
      'Destruction requires proof of authorised execution where policy requires it.'
    ]
  ),
  def(
    'EVID-LEGAL-HOLD-LINK',
    ['BOF-28-014'],
    'Legal Hold Link',
    'relationship',
    'Effective relationship placing exact business objects, records or evidence scope under a legal/regulatory preservation hold.',
    'Stable hold link with hold matter/reference, scope, effectivity and release history.',
    ['hold/matter reference', 'subject/record/evidence scope', 'effective from/to', 'basis', 'placed/released by'],
    ['Active', 'Released'],
    [
      'Active hold blocks otherwise-eligible disposition.',
      'Hold does not alter canonical object identity or business lifecycle.',
      'Release history remains auditable.'
    ]
  ),
  def(
    'EVID-OUTBOX-MESSAGE',
    ['BOF-28-015'],
    'Outbox Message',
    'integration-evidence',
    'Immutable reliable-publication envelope created transactionally from a committed Business Event for downstream delivery.',
    'Unique message identity referencing exactly one source Business Event plus destination/topic and delivery metadata.',
    ['business event', 'topic/destination', 'payload/schema version', 'created at', 'delivery attempts', 'published at'],
    ['Pending', 'Published', 'Failed', 'Dead Lettered'],
    [
      'Outbox Message is transport evidence, not a second authoritative Business Event.',
      'Retries update delivery attempt history without mutating the source event.',
      'Consumers use idempotency/event identity to avoid duplicate business effects.'
    ],
    ['tenant', 'integration']
  )
];

export const sharedWorkEvidenceRelationships: SharedWorkEvidenceRelationship[] = [
  { id: 'SWE-R01', from: 'WORK-WORKFLOW-DEFINITION', predicate: 'instantiates', to: 'WORK-WORKFLOW-INSTANCE', cardinality: '1:N', governance: 'Each instance records the exact published definition version used.' },
  { id: 'SWE-R02', from: 'WORK-WORKFLOW-INSTANCE', predicate: 'coordinates', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:N', governance: 'Workflow runtime references canonical subjects; it never becomes their authoritative record.' },
  { id: 'SWE-R03', from: 'WORK-WORKFLOW-INSTANCE', predicate: 'creates', to: 'WORK-WORK-ITEM', cardinality: '1:N', governance: 'Generated work remains traceable to workflow instance and subject.' },
  { id: 'SWE-R04', from: 'WORK-WORK-ITEM', predicate: 'assigned via', to: 'WORK-ASSIGNMENT', cardinality: '1:N', governance: 'Assignment history is retained across reassignments.' },
  { id: 'SWE-R05', from: 'WORK-ASSIGNMENT', predicate: 'assigns to', to: 'AUTH-USER-IDENTITY', cardinality: 'N:1', governance: 'Assignment to a user never bypasses membership, permission or authority checks.' },
  { id: 'SWE-R06', from: 'WORK-REVIEW-REQUEST', predicate: 'reviews', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Request binds to an exact subject/version/configuration.' },
  { id: 'SWE-R07', from: 'WORK-APPROVAL-REQUEST', predicate: 'seeks approval of', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Request identifies exact subject/version and approval basis.' },
  { id: 'SWE-R08', from: 'WORK-DECISION-REQUEST', predicate: 'seeks decision about', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Question/options remain fixed for the governed decision occurrence.' },
  { id: 'SWE-R09', from: 'WORK-APPROVAL-REQUEST', predicate: 'requires authority under', to: 'AUTH-DELEGATED-AUTHORITY', cardinality: 'N:N', governance: 'Applicable delegated/statutory authority is validated at decision time.' },
  { id: 'SWE-R10', from: 'WORK-DECISION-REQUEST', predicate: 'results in', to: 'WORK-DECISION', cardinality: '1:N', governance: 'A Decision is separate immutable outcome evidence.' },
  { id: 'SWE-R11', from: 'WORK-APPROVAL-REQUEST', predicate: 'results in', to: 'WORK-DECISION', cardinality: '1:N', governance: 'Approval/rejection/return outcome remains separately evidenced.' },
  { id: 'SWE-R12', from: 'WORK-DECISION', predicate: 'creates', to: 'WORK-FOLLOW-UP-ACTION', cardinality: '1:N', governance: 'Actions reference the decision that created them.' },
  { id: 'SWE-R13', from: 'WORK-ACKNOWLEDGEMENT', predicate: 'acknowledges', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Acknowledgement records exact subject/version and actor.' },
  { id: 'SWE-R14', from: 'WORK-ESCALATION', predicate: 'escalates', to: 'WORK-WORK-ITEM', cardinality: 'N:1', governance: 'Escalation affects routing/attention but does not transfer authority.' },
  { id: 'SWE-R15', from: 'WORK-DUE-DATE-CHANGE', predicate: 'changes due date of', to: 'WORK-WORK-ITEM', cardinality: 'N:1', governance: 'Prior/new values are immutable evidence.' },
  { id: 'SWE-R16', from: 'WORK-PRIORITY-CHANGE', predicate: 'changes priority of', to: 'WORK-WORK-ITEM', cardinality: 'N:1', governance: 'Priority is routing context, not domain lifecycle.' },
  { id: 'SWE-R17', from: 'WORK-DELEGATION', predicate: 'delegates', to: 'WORK-ASSIGNMENT', cardinality: 'N:1', governance: 'Work delegation remains separate from Delegated Authority.' },
  { id: 'SWE-R18', from: 'WORK-COLLABORATION-INVITATION', predicate: 'may create on acceptance', to: 'AUTH-MEMBERSHIP', cardinality: '1:0..1', governance: 'Acceptance creates explicit membership/participation; permissions remain separately governed.' },
  { id: 'SWE-R19', from: 'WORK-EXTERNAL-SUBMISSION', predicate: 'submits', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Submission points to exact canonical content/object version rather than cloning it.' },
  { id: 'SWE-R20', from: 'WORK-REQUEST-RESPONSE', predicate: 'responds to', to: 'WORK-REVIEW-REQUEST', cardinality: 'N:1', governance: 'Response is attributable and retained separately from request.' },
  { id: 'SWE-R21', from: 'WORK-REQUEST-RESPONSE', predicate: 'responds to', to: 'WORK-APPROVAL-REQUEST', cardinality: 'N:1', governance: 'Response may inform a Decision but is not automatically the Decision.' },
  { id: 'SWE-R22', from: 'WORK-REQUEST-RESPONSE', predicate: 'responds to', to: 'WORK-DECISION-REQUEST', cardinality: 'N:1', governance: 'Response supports decision evidence without replacing it.' },
  { id: 'SWE-R23', from: 'WORK-NOTIFICATION-PREFERENCE', predicate: 'belongs to', to: 'AUTH-USER-IDENTITY', cardinality: 'N:1', governance: 'Preference is user configuration only; mandatory notices/work remain authoritative.' },
  { id: 'SWE-R24', from: 'EVID-BUSINESS-EVENT', predicate: 'describes committed occurrence on', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Event records a committed fact while source aggregate remains authoritative.' },
  { id: 'SWE-R25', from: 'EVID-AUDIT-EVENT', predicate: 'records action by', to: 'AUTH-USER-IDENTITY', cardinality: 'N:0..1', governance: 'System actors are supported; human actions retain principal identity.' },
  { id: 'SWE-R26', from: 'EVID-AUDIT-EVENT', predicate: 'targets', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:0..1', governance: 'Audit target/context is explicit without duplicating target state.' },
  { id: 'SWE-R27', from: 'EVID-CHANGE-EVENT', predicate: 'records change to', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Before/after evidence remains distinct from current state.' },
  { id: 'SWE-R28', from: 'EVID-APPROVAL', predicate: 'proves', to: 'WORK-DECISION', cardinality: '1:1', governance: 'Approval evidence binds decision, subject/version and authority basis.' },
  { id: 'SWE-R29', from: 'EVID-SIGNATURE', predicate: 'signs', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Signature binds exact payload/version digest.' },
  { id: 'SWE-R30', from: 'EVID-ATTESTATION', predicate: 'attests to', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Statement, subject and attestor are fixed for the occurrence.' },
  { id: 'SWE-R31', from: 'EVID-EVIDENCE-ITEM', predicate: 'evidences', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:N', governance: 'Evidence supports facts without becoming structured domain truth.' },
  { id: 'SWE-R32', from: 'EVID-EVIDENCE-ITEM', predicate: 'traced through', to: 'EVID-PROVENANCE-REFERENCE', cardinality: '1:N', governance: 'Evidence keeps source/transformation traceability.' },
  { id: 'SWE-R33', from: 'EVID-EVIDENCE-ITEM', predicate: 'references source via', to: 'EVID-SOURCE-REFERENCE', cardinality: '1:N', governance: 'External/internal source keys are adapters, not duplicate masters.' },
  { id: 'SWE-R34', from: 'EVID-CORRECTION', predicate: 'corrects', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Original remains immutable and discoverable.' },
  { id: 'SWE-R35', from: 'EVID-REVERSAL', predicate: 'reverses effect of', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:1', governance: 'Reversal adds a compensating record and preserves the original.' },
  { id: 'SWE-R36', from: 'EVID-ARCHIVE-PACKAGE', predicate: 'preserves', to: 'EVID-EVIDENCE-ITEM', cardinality: 'N:N', governance: 'Sealed manifest identifies exact evidence/records and integrity metadata.' },
  { id: 'SWE-R37', from: 'EVID-RETENTION-DISPOSITION', predicate: 'is blocked by active', to: 'EVID-LEGAL-HOLD-LINK', cardinality: 'N:N', governance: 'Disposition execution is prohibited while applicable holds are active.' },
  { id: 'SWE-R38', from: 'EVID-LEGAL-HOLD-LINK', predicate: 'holds', to: 'CBO-GOVERNED-SUBJECT', cardinality: 'N:N', governance: 'Hold changes retention eligibility, not object identity/lifecycle.' },
  { id: 'SWE-R39', from: 'EVID-OUTBOX-MESSAGE', predicate: 'publishes', to: 'EVID-BUSINESS-EVENT', cardinality: 'N:1', governance: 'Outbox is a transport envelope referencing one authoritative event occurrence.' }
];

export const sharedWorkEvidenceBoundaries: SharedWorkEvidenceBoundary[] = [
  {
    name: 'Work orchestration',
    structure: 'Subject → Workflow Instance → Work Item → Assignment',
    purpose: 'Coordinate cross-workspace work while keeping canonical business objects authoritative.',
    mustNotBecome: 'a universal domain-state engine, a duplicate Work Order/Schedule Activity model or a screen exposing every lifecycle step to every user'
  },
  {
    name: 'Decision & authority',
    structure: 'Request → Response → Decision → Domain Command / Action',
    purpose: 'Separate requests, opinions/responses, authorised decisions and resulting business effects.',
    mustNotBecome: 'approval-by-assignment, role-equals-authority or a mutable request record that overwrites decision evidence'
  },
  {
    name: 'Evidence & audit',
    structure: 'Business Event / Change Event / Audit Event → Evidence / Signature / Attestation',
    purpose: 'Retain attributable, immutable proof of what happened, what changed, who acted and what exact content was involved.',
    mustNotBecome: 'a second mutable truth store or an undifferentiated event log with no semantic ownership'
  },
  {
    name: 'Retention & traceability',
    structure: 'Evidence / Records → Archive Package → Disposition, constrained by Legal Hold',
    purpose: 'Preserve provenance, correction/reversal chains, retention decisions and defensible disposition.',
    mustNotBecome: 'destructive history rewriting, an uncontrolled archive folder or automatic deletion that ignores active holds'
  }
];

export const sharedWorkEvidenceRules = [
  'Workflow coordinates work around canonical objects; it never becomes the authoritative business object or universal domain lifecycle.',
  'A Work Item is distinct from Project Schedule Activity, operational Work Order, Service Appointment and the domain transaction/case it references.',
  'Assignment, responsibility, permission and delegated authority are separate concepts; assignment alone never authorises a protected business decision.',
  'Work Delegation does not grant Delegated Authority and cannot bypass segregation-of-duties or scope controls.',
  'Review Request, Approval Request and Decision Request are separate governed requests with exact subject/version bindings.',
  'Response is not Decision; Decision is immutable attributable outcome evidence and domain state changes occur only through explicit domain commands.',
  'Approval evidence must identify the exact approved/rejected subject/version plus actor and authority basis.',
  'Users see actionable work appropriate to current state, assignment, permissions and authority; NuBlox does not expose an entire lifecycle/debug workflow as the primary user experience.',
  'Due date, priority, escalation and routing are work-coordination concerns and must not be confused with domain lifecycle state.',
  'Business Event, Change Event, Audit Event and Outbox Message have different purposes and are not interchangeable.',
  'Evidence, decisions, signatures, attestations, corrections and reversals are append-only; corrections/supersession preserve the original chain.',
  'Signature and approval evidence bind to exact content/version/configuration and cannot float to a later revision.',
  'Archive packages preserve records and evidence but never become a replacement operational master.',
  'Active Legal Hold blocks otherwise-eligible disposition without changing canonical object identity or lifecycle.',
  'Outbox Message is reliable transport evidence derived from Business Event, not a second authoritative event stream.',
  'All work, decisions, evidence and audit records carry explicit tenant/context boundaries and attributable actor/system provenance.'
];

const externalModelIds = new Set([
  'CBO-GOVERNED-SUBJECT',
  'AUTH-USER-IDENTITY',
  'AUTH-MEMBERSHIP',
  'AUTH-DELEGATED-AUTHORITY'
]);

export function validateSharedWorkEvidenceModel() {
  const ids = new Set<string>();
  const candidateKeys = new Set<string>();

  for (const entry of sharedWorkEvidenceModel) {
    if (!entry.modelId || ids.has(entry.modelId)) return false;
    ids.add(entry.modelId);
    if (!entry.canonicalName || !entry.definition || !entry.identityRule) return false;
    if (!entry.scope.length || !entry.keyData.length || !entry.lifecycle.length || !entry.governance.length) return false;
    for (const key of entry.candidateKeys) {
      if (candidateKeys.has(key)) return false;
      candidateKeys.add(key);
    }
  }

  for (let index = 1; index <= 15; index += 1) {
    const suffix = String(index).padStart(3, '0');
    if (!candidateKeys.has(`BOF-27-${suffix}`)) return false;
    if (!candidateKeys.has(`BOF-28-${suffix}`)) return false;
  }

  const relationshipIds = new Set<string>();
  for (const relationship of sharedWorkEvidenceRelationships) {
    if (!relationship.id || relationshipIds.has(relationship.id)) return false;
    relationshipIds.add(relationship.id);
    if (!ids.has(relationship.from) && !externalModelIds.has(relationship.from)) return false;
    if (!ids.has(relationship.to) && !externalModelIds.has(relationship.to)) return false;
    if (!relationship.predicate || !relationship.cardinality || !relationship.governance) return false;
  }

  return true;
}
