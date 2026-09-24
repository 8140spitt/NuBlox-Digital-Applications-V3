import type {
  CanonicalObjectId,
  OrganisationId,
  PositionId,
  SalesAccountId,
  SalesOpportunityId,
  TenantId
} from './ids.js';

export type SalesAccountStatus = 'ACTIVE' | 'INACTIVE';

export type SalesOpportunityStage =
  | 'QUALIFICATION'
  | 'DISCOVERY'
  | 'SOLUTION'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'COMMIT'
  | 'WON'
  | 'LOST';

export type SalesForecastCategory =
  | 'PIPELINE'
  | 'BEST_CASE'
  | 'COMMIT'
  | 'CLOSED';

export type SalesOpportunityStatus =
  | 'OPEN'
  | 'WON'
  | 'LOST'
  | 'CANCELLED';

export interface SalesAccount {
  id: SalesAccountId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  organisationId: OrganisationId;
  code: string;
  ownerPositionId: PositionId;
  segment?: string;
  status: SalesAccountStatus;
  createdAt: string;
  rowVersion: number;
}

export interface SalesOpportunity {
  id: SalesOpportunityId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  salesAccountId: SalesAccountId;
  code: string;
  title: string;
  description: string;
  ownerPositionId: PositionId;
  stage: SalesOpportunityStage;
  probabilityPercent: number;
  estimatedValue: number;
  currency: string;
  expectedCloseDate?: string;
  forecastCategory: SalesForecastCategory;
  status: SalesOpportunityStatus;
  createdAt: string;
  rowVersion: number;
}
