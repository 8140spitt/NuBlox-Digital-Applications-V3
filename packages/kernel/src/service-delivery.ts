import type {
  CanonicalObjectId,
  PersonId,
  ServiceAssignmentId,
  ServiceExecutionRecordId,
  ServiceOrderId,
  TenantId
} from './ids.js';

export type ServiceOrderType =
  | 'FIELD_SERVICE'
  | 'INSTALLATION'
  | 'MAINTENANCE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'PROFESSIONAL_SERVICE'
  | 'OTHER';

export type ServicePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ServiceOrderStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ACCEPTED'
  | 'CANCELLED';

export interface ServiceOrder {
  id: ServiceOrderId;
  tenantId: TenantId;
  scopeObjectId: CanonicalObjectId;
  orderNumber: string;
  title: string;
  serviceType: ServiceOrderType;
  priority: ServicePriority;
  status: ServiceOrderStatus;
  description?: string;
  serviceLocation?: string;
  requestedStart?: string;
  requestedEnd?: string;
  slaDueAt?: string;
  createdByPersonId: PersonId;
  createdAt: string;
  completedByPersonId?: PersonId;
  completedAt?: string;
  acceptedByPersonId?: PersonId;
  acceptedAt?: string;
  acceptanceNote?: string;
}

export type ServiceAssignmentStatus =
  | 'PLANNED'
  | 'DISPATCHED'
  | 'ACKNOWLEDGED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ServiceAssignment {
  id: ServiceAssignmentId;
  tenantId: TenantId;
  serviceOrderId: ServiceOrderId;
  assigneePersonId: PersonId;
  scheduledStart: string;
  scheduledEnd: string;
  status: ServiceAssignmentStatus;
  dispatchNotes?: string;
  dispatchedAt?: string;
  acknowledgedAt?: string;
  enRouteAt?: string;
  onSiteAt?: string;
  completedAt?: string;
}

export type ServiceExecutionRecordType =
  | 'TRAVEL'
  | 'ARRIVAL'
  | 'WORK'
  | 'INSPECTION'
  | 'TEST'
  | 'NOTE'
  | 'COMPLETION';

export interface ServiceExecutionRecord {
  id: ServiceExecutionRecordId;
  tenantId: TenantId;
  serviceOrderId: ServiceOrderId;
  assignmentId?: ServiceAssignmentId;
  recordedByPersonId: PersonId;
  recordType: ServiceExecutionRecordType;
  occurredAt: string;
  durationMinutes?: number;
  notes?: string;
  evidence?: Readonly<Record<string, unknown>>;
}
