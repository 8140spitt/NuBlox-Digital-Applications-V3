import type {
  CanonicalObjectId,
  EvidenceRecordId,
  TenantId,
  WorkAssignmentId,
  WorkItemId,
  WorkflowDefinitionId,
  WorkflowDefinitionVersionId,
  WorkflowInstanceId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type WorkflowDefinitionVersionStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type WorkflowInstanceStatus = 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type WorkItemStatus =
  | 'READY'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';
export type WorkPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type WorkAssigneeType = 'PERSON' | 'POSITION' | 'ORGANISATION_UNIT';
export type WorkResponsibilityRole =
  | 'ACCOUNTABLE'
  | 'RESPONSIBLE'
  | 'CONTRIBUTOR'
  | 'REVIEWER'
  | 'CHECKER'
  | 'APPROVER'
  | 'ACCEPTOR'
  | 'CONSULTED'
  | 'INFORMED'
  | 'ASSURANCE';

export interface WorkflowDefinition {
  id: WorkflowDefinitionId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  status: RecordStatus;
}

export interface WorkflowDefinitionVersion {
  id: WorkflowDefinitionVersionId;
  tenantId: TenantId;
  workflowDefinitionId: WorkflowDefinitionId;
  version: number;
  status: WorkflowDefinitionVersionStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface WorkflowInstance {
  id: WorkflowInstanceId;
  tenantId: TenantId;
  workflowDefinitionId: WorkflowDefinitionId;
  workflowDefinitionVersionId: WorkflowDefinitionVersionId;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  status: WorkflowInstanceStatus;
  startedAt: string;
  completedAt?: string;
  completionReason?: string;
}

export interface WorkItem {
  id: WorkItemId;
  tenantId: TenantId;
  workflowInstanceId: WorkflowInstanceId;
  workType: string;
  subjectObjectId: CanonicalObjectId;
  subjectVersion?: string;
  title: string;
  instructions?: string;
  status: WorkItemStatus;
  priority: WorkPriority;
  dueAt?: string;
  sequence: number;
  completionNote?: string;
  completedAt?: string;
}

export interface WorkAssignment {
  id: WorkAssignmentId;
  tenantId: TenantId;
  workflowInstanceId: WorkflowInstanceId;
  workItemId: WorkItemId;
  assigneeType: WorkAssigneeType;
  assigneeId: string;
  responsibilityRole: WorkResponsibilityRole;
  assignedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface WorkCompletionEvidence {
  workItemId: WorkItemId;
  evidenceRecordId: EvidenceRecordId;
}

export interface MyWorkProjectionItem {
  workItem: WorkItem;
  assignmentId: WorkAssignmentId;
  responsibilityRole: WorkResponsibilityRole;
  assignedThrough: WorkAssigneeType;
  isOverdue: boolean;
}
