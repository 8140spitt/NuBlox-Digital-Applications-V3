import type {
  CanonicalObjectId,
  DeliverableItemId,
  EvidenceRecordId,
  PersonId,
  TenantId,
  WorkItemId
} from './ids.js';
import type { WorkPriority, WorkResponsibilityRole } from './work.js';

export type NativeMyWorkKind =
  | 'WORK'
  | 'DELIVERABLE'
  | 'REVIEW'
  | 'APPROVAL'
  | 'ACCEPTANCE'
  | 'COMPETENCE';

export interface NativeMyWorkProjectionItem {
  key: string;
  tenantId: TenantId;
  personId: PersonId;
  kind: NativeMyWorkKind;
  title: string;
  sourceId: WorkItemId | DeliverableItemId | EvidenceRecordId | string;
  contextObjectId?: CanonicalObjectId;
  subjectObjectId?: CanonicalObjectId;
  subjectVersion?: string;
  responsibilityRole?: WorkResponsibilityRole;
  priority?: WorkPriority;
  dueAt?: string;
  isOverdue: boolean;
  reason: string;
}
