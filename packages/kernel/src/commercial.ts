import type {
  CanonicalObjectId,
  ChangeId,
  CommercialFinalAccountId,
  CommercialForecastId,
  CommercialForecastLineId,
  CommercialValuationId,
  CommercialValuationLineId,
  CommercialVariationId,
  CommercialVariationLineId,
  CommercialVariationVersionId,
  CostPlanId,
  CostPlanLineId,
  CostPlanVersionId,
  DecisionId,
  EvidenceRecordId,
  ProjectCostCodeId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type CommercialMoney = string;

export type CommercialCostCategory =
  | 'LABOUR'
  | 'MATERIAL'
  | 'PLANT'
  | 'SUBCONTRACT'
  | 'PROFESSIONAL_FEE'
  | 'OVERHEAD'
  | 'PRELIMINARIES'
  | 'CONTINGENCY'
  | 'OTHER';

export interface ProjectCostCode {
  id: ProjectCostCodeId;
  tenantId: TenantId;
  projectObjectId: CanonicalObjectId;
  code: string;
  name: string;
  category: CommercialCostCategory;
  parentCostCodeId?: ProjectCostCodeId;
  status: RecordStatus;
}

export type CostPlanStatus = 'ACTIVE' | 'CLOSED' | 'CANCELLED';

export interface CostPlan {
  id: CostPlanId;
  tenantId: TenantId;
  projectObjectId: CanonicalObjectId;
  code: string;
  title: string;
  status: CostPlanStatus;
}

export type CostPlanVersionStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SUPERSEDED'
  | 'CANCELLED';

export interface CostPlanVersion {
  id: CostPlanVersionId;
  tenantId: TenantId;
  costPlanId: CostPlanId;
  version: number;
  status: CostPlanVersionStatus;
  currency: string;
  createdAt: string;
  approvedDecisionId?: DecisionId;
  approvedAt?: string;
}

export interface CostPlanLine {
  id: CostPlanLineId;
  tenantId: TenantId;
  costPlanVersionId: CostPlanVersionId;
  costCodeId: ProjectCostCodeId;
  description: string;
  amount: CommercialMoney;
}

export type CommercialVariationSide = 'REVENUE' | 'COST' | 'INTERNAL';
export type CommercialVariationStatus = 'OPEN' | 'CLOSED' | 'CANCELLED';

export interface CommercialVariation {
  id: CommercialVariationId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  projectObjectId: CanonicalObjectId;
  code: string;
  title: string;
  side: CommercialVariationSide;
  linkedChangeId?: ChangeId;
  commercialContextObjectId?: CanonicalObjectId;
  status: CommercialVariationStatus;
}

export type CommercialVariationVersionStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'SUPERSEDED'
  | 'WITHDRAWN';

export interface CommercialVariationVersion {
  id: CommercialVariationVersionId;
  tenantId: TenantId;
  variationId: CommercialVariationId;
  version: number;
  status: CommercialVariationVersionStatus;
  currency: string;
  submittedAmount: CommercialMoney;
  createdAt: string;
  issuedAt?: string;
}

export interface CommercialVariationLine {
  id: CommercialVariationLineId;
  tenantId: TenantId;
  variationVersionId: CommercialVariationVersionId;
  costCodeId?: ProjectCostCodeId;
  description: string;
  amount: CommercialMoney;
}

export type CommercialValuationKind =
  | 'CLIENT_APPLICATION'
  | 'CLIENT_CERTIFICATE'
  | 'SUPPLIER_APPLICATION'
  | 'SUPPLIER_CERTIFICATE'
  | 'INTERNAL_ASSESSMENT';

export type CommercialValuationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CERTIFIED'
  | 'CLOSED'
  | 'CANCELLED';

export interface CommercialValuation {
  id: CommercialValuationId;
  tenantId: TenantId;
  projectObjectId: CanonicalObjectId;
  commercialContextObjectId?: CanonicalObjectId;
  sourceApplicationId?: CommercialValuationId;
  kind: CommercialValuationKind;
  status: CommercialValuationStatus;
  currency: string;
  valuationDate: string;
  decisionId?: DecisionId;
  certifiedAt?: string;
}

export interface CommercialValuationLine {
  id: CommercialValuationLineId;
  tenantId: TenantId;
  valuationId: CommercialValuationId;
  costCodeId?: ProjectCostCodeId;
  description: string;
  cumulativeAmount: CommercialMoney;
  adjustmentType?:
    | 'RETENTION'
    | 'CONTRA'
    | 'MATERIALS_ON_SITE'
    | 'ADVANCE_RECOVERY'
    | 'PREVIOUS_CORRECTION'
    | 'OTHER';
}

export type CommercialForecastStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'SUPERSEDED'
  | 'CANCELLED';

export interface CommercialForecast {
  id: CommercialForecastId;
  tenantId: TenantId;
  projectObjectId: CanonicalObjectId;
  reportingCutoffAt: string;
  currency: string;
  status: CommercialForecastStatus;
  forecastRevenue: CommercialMoney;
  approvedDecisionId?: DecisionId;
  approvedAt?: string;
}

export interface CommercialForecastLine {
  id: CommercialForecastLineId;
  tenantId: TenantId;
  forecastId: CommercialForecastId;
  costCodeId: ProjectCostCodeId;
  controlBudget: CommercialMoney;
  actualCost: CommercialMoney;
  remainingCommitment: CommercialMoney;
  approvedChange: CommercialMoney;
  pendingChangeExposure: CommercialMoney;
  forecastToComplete: CommercialMoney;
}

export type CommercialFinalAccountStatus =
  | 'DRAFT'
  | 'AGREED'
  | 'CLOSED'
  | 'CANCELLED';

export interface CommercialFinalAccount {
  id: CommercialFinalAccountId;
  tenantId: TenantId;
  projectObjectId: CanonicalObjectId;
  commercialContextObjectId?: CanonicalObjectId;
  currency: string;
  agreedAmount: CommercialMoney;
  status: CommercialFinalAccountStatus;
  decisionId?: DecisionId;
  agreedAt?: string;
  evidenceRecordId?: EvidenceRecordId;
}
