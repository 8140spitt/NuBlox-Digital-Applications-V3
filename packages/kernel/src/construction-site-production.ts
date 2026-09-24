import type {
  CanonicalObjectId,
  PersonId,
  SiteDailyLogId,
  SiteFieldEvidenceId,
  SiteIssueId,
  SiteProgressRecordId,
  SiteWorkPackageId,
  TenantId
} from './ids.js';

export type SiteWorkPackageStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETE' | 'CANCELLED';
export type SiteIssueType = 'RFI' | 'PUNCH' | 'DEFECT' | 'BLOCKER' | 'QUALITY' | 'SAFETY' | 'DESIGN' | 'OTHER';
export type SiteIssuePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
export type SiteIssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type SiteFieldEvidenceType = 'PHOTO' | 'DOCUMENT' | 'CHECKLIST' | 'MEASUREMENT' | 'DELIVERY' | 'OTHER';

export interface SiteWorkPackage {
  id: SiteWorkPackageId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  projectObjectId: CanonicalObjectId;
  code: string;
  title: string;
  description?: string;
  managerPersonId: PersonId;
  plannedStart?: string;
  plannedEnd?: string;
  status: SiteWorkPackageStatus;
  createdAt: string;
  completedAt?: string;
}

export interface SiteDailyLog {
  id: SiteDailyLogId;
  tenantId: TenantId;
  workPackageId: SiteWorkPackageId;
  logDate: string;
  summary: string;
  conditions?: string;
  labourCount?: number;
  plantSummary?: string;
  materialsSummary?: string;
  createdByPersonId: PersonId;
  createdAt: string;
}

export interface SiteProgressRecord {
  id: SiteProgressRecordId;
  tenantId: TenantId;
  workPackageId: SiteWorkPackageId;
  recordedByPersonId: PersonId;
  occurredAt: string;
  percentComplete: number;
  quantityCompleted?: number;
  unit?: string;
  note?: string;
}

export interface SiteFieldEvidence {
  id: SiteFieldEvidenceId;
  tenantId: TenantId;
  workPackageId: SiteWorkPackageId;
  recordedByPersonId: PersonId;
  evidenceType: SiteFieldEvidenceType;
  reference: string;
  description?: string;
  occurredAt: string;
}

export interface SiteIssue {
  id: SiteIssueId;
  tenantId: TenantId;
  workPackageId: SiteWorkPackageId;
  issueType: SiteIssueType;
  title: string;
  description: string;
  priority: SiteIssuePriority;
  status: SiteIssueStatus;
  raisedByPersonId: PersonId;
  assignedToPersonId?: PersonId;
  dueAt?: string;
  raisedAt: string;
  resolvedAt?: string;
}
