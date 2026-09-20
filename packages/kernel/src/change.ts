import type {
  BaselineId,
  CanonicalObjectId,
  ChangeAffectedObjectId,
  ChangeDiscrepancyId,
  ChangeId,
  ChangeImpactAssessmentId,
  ChangeImplementationActionId,
  ChangeVerificationId,
  DecisionId,
  EvidenceRecordId,
  PersonId,
  TenantId,
  WorkItemId
} from './ids.js';

export type ChangeStatus =
  | 'DRAFT'
  | 'UNDER_ASSESSMENT'
  | 'AWAITING_DECISION'
  | 'APPROVED'
  | 'REJECTED'
  | 'IMPLEMENTING'
  | 'VERIFYING'
  | 'CLOSED'
  | 'CANCELLED';

export interface Change {
  id: ChangeId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  code: string;
  title: string;
  description: string;
  changeType: string;
  status: ChangeStatus;
  raisedByPersonId: PersonId;
  raisedAt: string;
  decisionId?: DecisionId;
  decidedAt?: string;
  resultingBaselineId?: BaselineId;
  closedAt?: string;
}

export type ChangeDisposition = 'ADD' | 'MODIFY' | 'REMOVE' | 'REVIEW';

export interface ChangeAffectedObject {
  id: ChangeAffectedObjectId;
  tenantId: TenantId;
  changeId: ChangeId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  disposition: ChangeDisposition;
  rationale: string;
}

export type ChangeImpactLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ChangeImpactAssessment {
  id: ChangeImpactAssessmentId;
  tenantId: TenantId;
  changeId: ChangeId;
  domain: string;
  assessorPersonId: PersonId;
  assessedAt: string;
  impactLevel: ChangeImpactLevel;
  summary: string;
  costImpact?: number;
  scheduleImpactDays?: number;
}

export type ChangeImplementationStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ChangeImplementationAction {
  id: ChangeImplementationActionId;
  tenantId: TenantId;
  changeId: ChangeId;
  actionType: string;
  description: string;
  targetObjectId?: CanonicalObjectId;
  targetVersion?: string;
  workItemId?: WorkItemId;
  status: ChangeImplementationStatus;
  completedAt?: string;
}

export type ChangeVerificationOutcome = 'PASS' | 'FAIL' | 'PARTIAL';

export interface ChangeVerification {
  id: ChangeVerificationId;
  tenantId: TenantId;
  changeId: ChangeId;
  verifierPersonId: PersonId;
  verifiedAt: string;
  outcome: ChangeVerificationOutcome;
  evidenceRecordId?: EvidenceRecordId;
  notes: string;
}

export type ChangeDiscrepancyStatus = 'OPEN' | 'RESOLVED' | 'ACCEPTED';

export interface ChangeDiscrepancy {
  id: ChangeDiscrepancyId;
  tenantId: TenantId;
  changeId: ChangeId;
  affectedObjectId?: ChangeAffectedObjectId;
  description: string;
  status: ChangeDiscrepancyStatus;
  resolvedAt?: string;
  resolution?: string;
}
