import type {
  CanonicalObjectId,
  DecisionId,
  OrganisationId,
  PersonId,
  SourcingContextId,
  SourcingRuleId,
  SourceApprovalId,
  SupplierRelationshipId,
  TenantId
} from './ids.js';

export type SupplierRelationshipType = 'MANUFACTURER' | 'VENDOR' | 'SERVICE_PROVIDER' | 'SUBCONTRACTOR' | 'OTHER';
export type SupplierRelationshipStatus = 'IN_WORK' | 'RELEASED' | 'CANCELLED';

export interface SupplierRelationship {
  id: SupplierRelationshipId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  supplierOrganisationId: OrganisationId;
  relationshipType: SupplierRelationshipType;
  code: string;
  name: string;
  status: SupplierRelationshipStatus;
  createdByPersonId: PersonId;
  createdAt: string;
  releasedDecisionId?: DecisionId;
  releasedAt?: string;
  cancelledDecisionId?: DecisionId;
  cancelledAt?: string;
}

export type SourcingContextStatus = 'ACTIVE' | 'INACTIVE';

export interface SourcingContext {
  id: SourcingContextId;
  tenantId: TenantId;
  code: string;
  name: string;
  description?: string;
  scopeType: string;
  scopeObjectId?: CanonicalObjectId;
  criteria: Readonly<Record<string, unknown>>;
  status: SourcingContextStatus;
  createdByPersonId: PersonId;
  createdAt: string;
}

export type SourceApprovalStatus = 'PREFERRED' | 'APPROVED' | 'DO_NOT_USE';

export interface SourceApproval {
  id: SourceApprovalId;
  tenantId: TenantId;
  sourcingContextId: SourcingContextId;
  supplierRelationshipId: SupplierRelationshipId;
  internalItemObjectId: CanonicalObjectId;
  supplierItemObjectId: CanonicalObjectId;
  sourceStatus: SourceApprovalStatus;
  rationale: string;
  effectiveFrom: string;
  effectiveTo?: string;
  approvalDecisionId: DecisionId;
  approvedByPersonId: PersonId;
  approvedAt: string;
  supersededBySourceApprovalId?: SourceApprovalId;
}

export type SourcingRuleStatus = 'ACTIVE' | 'DISABLED';

export interface SourcingRule {
  id: SourcingRuleId;
  tenantId: TenantId;
  code: string;
  name: string;
  sourcingContextId?: SourcingContextId;
  supplierRelationshipId?: SupplierRelationshipId;
  itemObjectType?: string;
  criteria: Readonly<Record<string, unknown>>;
  assignedStatus: SourceApprovalStatus;
  priority: number;
  status: SourcingRuleStatus;
  createdByPersonId: PersonId;
  createdAt: string;
}
