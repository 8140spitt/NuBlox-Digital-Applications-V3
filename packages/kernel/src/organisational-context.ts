import type {
  CanonicalObjectId,
  DeploymentAssignmentId,
  FunctionId,
  FunctionalDeploymentId,
  JobProfileId,
  OrganisationId,
  OrganisationUnitId,
  OrganisationalContextId,
  OrganisationalResourceFulfilmentId,
  OrganisationalResourceRequirementId,
  PersonId,
  PositionId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';

export type OrganisationalContextType =
  | 'FUNCTION'
  | 'PROJECT'
  | 'PROGRAMME'
  | 'CONTRACT'
  | 'SERVICE'
  | 'ASSET_OPERATION'
  | 'CUSTOM';

export type OrganisationalContextLifecycle = 'PERMANENT' | 'TEMPORARY';

export interface OrganisationalContext {
  id: OrganisationalContextId;
  tenantId: TenantId;
  contextType: OrganisationalContextType;
  lifecycle: OrganisationalContextLifecycle;
  code: string;
  name: string;
  organisationId: OrganisationId;
  organisationUnitId?: OrganisationUnitId;
  functionId?: FunctionId;
  canonicalObjectId?: CanonicalObjectId;
  parentContextId?: OrganisationalContextId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type OrganisationalResourceRequirementStatus =
  | 'OPEN'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED';

export interface OrganisationalResourceRequirement {
  id: OrganisationalResourceRequirementId;
  tenantId: TenantId;
  requestingContextId: OrganisationalContextId;
  supplyingFunctionContextId: OrganisationalContextId;
  jobProfileId: JobProfileId;
  roleTitle: string;
  description: string;
  requiredHeadcount: number;
  requiredCapacityPercent: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: OrganisationalResourceRequirementStatus;
}

export interface OrganisationalResourceFulfilment {
  id: OrganisationalResourceFulfilmentId;
  tenantId: TenantId;
  requirementId: OrganisationalResourceRequirementId;
  personId: PersonId;
  positionId: PositionId;
  requirementSharePercent: number;
  resourceCapacityPercent: number;
  functionalDeploymentId: FunctionalDeploymentId;
  deploymentAssignmentId: DeploymentAssignmentId;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}
