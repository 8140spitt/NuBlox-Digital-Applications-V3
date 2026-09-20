import type {
  BaselineId,
  CanonicalObjectId,
  ChangeId,
  ConfigurationItemId,
  DecisionId,
  DeliverableApprovalId,
  DeliverableAuthoringBindingId,
  DeliverableConsequenceId,
  DeliverableItemId,
  DeliverableRequirementId,
  DeliverableResponsibilityId,
  DeliverableReviewId,
  DeliverableReworkId,
  EvidenceRecordId,
  FunctionId,
  FunctionalDeploymentId,
  PartyId,
  PersonId,
  ProcessDefinitionId,
  RecipientResponseId,
  RepresentationId,
  SubFunctionId,
  TaskDefinitionId,
  TenantId,
  TransmittalId,
  TransmittalRecipientId,
  WorkItemId
} from './ids.js';
import type { RecordStatus } from './model.js';
import type { WorkResponsibilityRole } from './work.js';

export type AuthoringMode =
  | 'NATIVE'
  | 'CONNECTED'
  | 'EXTERNAL_AUTHORITATIVE';

export interface DeliverableRequirement {
  id: DeliverableRequirementId;
  tenantId: TenantId;
  code: string;
  title: string;
  deliverableType: string;
  description: string;
  functionId?: FunctionId;
  subFunctionId?: SubFunctionId;
  processDefinitionId?: ProcessDefinitionId;
  taskDefinitionId?: TaskDefinitionId;
  functionalDeploymentId?: FunctionalDeploymentId;
  sourceRequirementObjectId?: CanonicalObjectId;
  sourceRequirementVersion?: string;
  contextObjectId: CanonicalObjectId;
  authoringMode: AuthoringMode;
  requiredRepresentationTypes: ReadonlyArray<string>;
  plannedDueAt?: string;
  acceptanceRequired: boolean;
  status: RecordStatus;
}

export type DeliverableItemStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'REWORK'
  | 'CLOSED'
  | 'CANCELLED';

export interface DeliverableAuthoringBinding {
  id: DeliverableAuthoringBindingId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  mode: AuthoringMode;
  providerKey: string;
  authoritativeObjectId?: CanonicalObjectId;
  externalIdentityId?: import('./ids.js').ExternalIdentityId;
  connectedReference?: string;
  createdAt: string;
  status: RecordStatus;
}

export interface DeliverableItem {
  id: DeliverableItemId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  requirementId: DeliverableRequirementId;
  contextObjectId: CanonicalObjectId;
  functionalDeploymentId?: FunctionalDeploymentId;
  code: string;
  title: string;
  deliverableType: string;
  status: DeliverableItemStatus;
  plannedAt?: string;
  forecastAt?: string;
  actualAt?: string;
  governedOutputObjectId?: CanonicalObjectId;
  governedOutputVersion?: string;
  configurationItemId?: ConfigurationItemId;
  baselineId?: BaselineId;
  linkedChangeId?: ChangeId;
}

export type DeliverablePrincipalType =
  | 'PERSON'
  | 'POSITION'
  | 'ORGANISATION_UNIT'
  | 'ORGANISATION';

export interface DeliverableResponsibility {
  id: DeliverableResponsibilityId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  principalType: DeliverablePrincipalType;
  principalId: string;
  responsibilityRole: WorkResponsibilityRole;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type DeliverableReviewType =
  | 'AUTHOR_REVIEW'
  | 'PEER_REVIEW'
  | 'CHECK'
  | 'TECHNICAL_REVIEW'
  | 'ASSURANCE'
  | 'CUSTOM';

export type DeliverableReviewOutcome =
  | 'NO_COMMENT'
  | 'COMMENTS'
  | 'REVISE'
  | 'REJECTED';

export interface DeliverableReview {
  id: DeliverableReviewId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  reviewType: DeliverableReviewType;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  reviewerPersonId: PersonId;
  reviewedAt: string;
  outcome: DeliverableReviewOutcome;
  comments?: string;
  evidenceRecordId?: EvidenceRecordId;
}

export interface DeliverableApproval {
  id: DeliverableApprovalId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  decisionId: DecisionId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  approvedAt: string;
}

export interface Transmittal {
  id: TransmittalId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  issueReference: string;
  issuePurpose: string;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  representationId?: RepresentationId;
  issuedByPersonId: PersonId;
  issuedAt: string;
  responseRequired: boolean;
}

export interface TransmittalRecipient {
  id: TransmittalRecipientId;
  tenantId: TenantId;
  transmittalId: TransmittalId;
  recipientPartyId: PartyId;
  responseRequired: boolean;
  dueAt?: string;
}

export type RecipientResponseOutcome =
  | 'ACCEPTED'
  | 'ACCEPTED_WITH_COMMENTS'
  | 'NO_OBJECTION'
  | 'REVISE'
  | 'REJECTED';

export interface RecipientResponse {
  id: RecipientResponseId;
  tenantId: TenantId;
  transmittalRecipientId: TransmittalRecipientId;
  responderPersonId?: PersonId;
  outcome: RecipientResponseOutcome;
  comments?: string;
  respondedAt: string;
  evidenceRecordId?: EvidenceRecordId;
}

export type DeliverableReworkTriggerType =
  | 'REVIEW'
  | 'DECISION'
  | 'RECIPIENT_RESPONSE';

export interface DeliverableRework {
  id: DeliverableReworkId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  triggerType: DeliverableReworkTriggerType;
  triggerId: string;
  previousSubjectObjectId: CanonicalObjectId;
  previousSubjectVersion?: string;
  reason: string;
  workItemId?: WorkItemId;
  createdAt: string;
}

export type DeliverableConsequenceStatus =
  | 'PENDING'
  | 'APPLIED'
  | 'FAILED';

export interface DeliverableConsequence {
  id: DeliverableConsequenceId;
  tenantId: TenantId;
  deliverableItemId: DeliverableItemId;
  consequenceType: string;
  targetObjectId?: CanonicalObjectId;
  targetVersion?: string;
  status: DeliverableConsequenceStatus;
  appliedAt?: string;
  evidenceRecordId?: EvidenceRecordId;
}
