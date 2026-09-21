import type {
  CanonicalObjectId,
  DeliveryCapabilityFulfilmentId,
  DeliveryCapabilityRequirementId,
  DeliveryDomainId,
  IndustryDisciplineDeploymentId,
  IndustryJobProfileId,
  IndustrySolutionId,
  OrganisationId,
  TenantId,
  TenantIndustryCapabilityId,
  TenantServiceJobProfileId,
  TenantServiceOfferingId
} from './ids.js';
import type { RecordStatus } from './model.js';
import type {
  DeploymentAssigneeType,
  DeploymentContextType,
  DeploymentPurpose
} from './functional.js';
import type { WorkResponsibilityRole } from './work.js';

export type ServiceCapabilityRole = 'CORE' | 'SUPPORTING' | 'ASSURANCE';
export type TenantCapabilitySupplyModel = 'INTERNAL' | 'HYBRID';
export type DeliveryCapabilitySourcingStrategy =
  | 'INTERNAL'
  | 'EXTERNAL'
  | 'HYBRID'
  | 'UNDECIDED';
export type DeliveryCapabilityRequirementStatus =
  | 'OPEN'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';
export type DeliveryCapabilityFulfilmentType = 'INTERNAL' | 'EXTERNAL';
export type DeliveryCapabilityProviderType =
  | 'PERSON'
  | 'POSITION'
  | 'ORGANISATION_UNIT'
  | 'ORGANISATION';

export interface TenantServiceOffering {
  id: TenantServiceOfferingId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  industrySolutionId: IndustrySolutionId;
  deliveryDomainId: DeliveryDomainId;
  code: string;
  name: string;
  description: string;
  status: RecordStatus;
}

export interface TenantServiceJobProfile {
  id: TenantServiceJobProfileId;
  tenantId: TenantId;
  serviceOfferingId: TenantServiceOfferingId;
  industryJobProfileId: IndustryJobProfileId;
  role: ServiceCapabilityRole;
  status: RecordStatus;
}

export interface TenantIndustryCapability {
  id: TenantIndustryCapabilityId;
  tenantId: TenantId;
  industryJobProfileId: IndustryJobProfileId;
  supplyModel: TenantCapabilitySupplyModel;
  notes?: string;
  status: RecordStatus;
}

export interface DeliveryCapabilityRequirement {
  id: DeliveryCapabilityRequirementId;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  contextObjectId: CanonicalObjectId;
  serviceOfferingId: TenantServiceOfferingId;
  industryJobProfileId: IndustryJobProfileId;
  description: string;
  requiredHeadcount: number;
  sourcingStrategy: DeliveryCapabilitySourcingStrategy;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: DeliveryCapabilityRequirementStatus;
}

export interface IndustryDisciplineDeployment {
  id: IndustryDisciplineDeploymentId;
  tenantId: TenantId;
  industryJobProfileId: IndustryJobProfileId;
  deploymentPurpose: DeploymentPurpose;
  organisationId: OrganisationId;
  organisationUnitId?: import('./ids.js').OrganisationUnitId;
  assigneeType: Exclude<DeploymentAssigneeType, 'ORGANISATION_UNIT'>;
  assigneeId: string;
  roleTitle: string;
  responsibilityRole: WorkResponsibilityRole;
  contextType: DeploymentContextType;
  contextObjectId?: CanonicalObjectId;
  scopeDescription: string;
  capacityPercent?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface DeliveryCapabilityFulfilment {
  id: DeliveryCapabilityFulfilmentId;
  tenantId: TenantId;
  requirementId: DeliveryCapabilityRequirementId;
  fulfilmentType: DeliveryCapabilityFulfilmentType;
  providerType: DeliveryCapabilityProviderType;
  providerId: string;
  providerOrganisationId?: OrganisationId;
  requirementSharePercent: number;
  resourceCapacityPercent?: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}
