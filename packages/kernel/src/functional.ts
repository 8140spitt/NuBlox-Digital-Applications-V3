import type {
  CanonicalObjectId,
  CompetenceEvidenceId,
  CompetenceRequirementId,
  DeploymentAssignmentId,
  DeploymentCapacityId,
  EvidenceRecordId,
  FunctionGovernanceVersionId,
  FunctionId,
  FunctionalActivityId,
  FunctionalDeploymentId,
  FunctionJobProfileParticipationId,
  JobProfileId,
  OrganisationId,
  OrganisationUnitId,
  PersonId,
  PositionId,
  ProcessDefinitionId,
  ResponsibilityScopeId,
  SubFunctionId,
  TaskDefinitionId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';
import type { WorkResponsibilityRole } from './work.js';

export interface FunctionDefinition {
  id: FunctionId;
  code: string;
  name: string;
  status: RecordStatus;
}

export interface SubFunctionDefinition {
  id: SubFunctionId;
  functionId: FunctionId;
  code: string;
  name: string;
  sequence: number;
  status: RecordStatus;
}

export interface FunctionalActivityDefinition {
  id: FunctionalActivityId;
  subFunctionId: SubFunctionId;
  name: string;
  sequence: number;
  status: RecordStatus;
}

export interface ProcessDefinition {
  id: ProcessDefinitionId;
  tenantId: TenantId;
  functionId: FunctionId;
  subFunctionId?: SubFunctionId;
  code: string;
  name: string;
  purpose: string;
  status: RecordStatus;
}

export interface TaskDefinition {
  id: TaskDefinitionId;
  tenantId: TenantId;
  processDefinitionId: ProcessDefinitionId;
  functionalActivityId?: FunctionalActivityId;
  code: string;
  name: string;
  instructions?: string;
  sequence: number;
  status: RecordStatus;
}

export type FunctionGovernanceVersionStatus = 'DRAFT' | 'PUBLISHED' | 'RETIRED';
export type FunctionOwnerType = 'PERSON' | 'POSITION';

export interface FunctionGovernanceVersion {
  id: FunctionGovernanceVersionId;
  tenantId: TenantId;
  functionId: FunctionId;
  version: number;
  status: FunctionGovernanceVersionStatus;
  purpose: string;
  mandate: string;
  scopeIn: ReadonlyArray<string>;
  scopeOut: ReadonlyArray<string>;
  accountableOwnerType: FunctionOwnerType;
  accountableOwnerId: string;
  governanceBody?: string;
  policyReferences: ReadonlyArray<string>;
  standardReferences: ReadonlyArray<string>;
  procedureReferences: ReadonlyArray<string>;
  assuranceRequirements: ReadonlyArray<string>;
  performanceMeasures: ReadonlyArray<string>;
  retentionRequirements?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export type FunctionParticipationMode =
  | 'PRIMARY'
  | 'DELIVERY'
  | 'GOVERNANCE'
  | 'ASSURANCE'
  | 'SUPPORT';

export interface FunctionJobProfileParticipation {
  id: FunctionJobProfileParticipationId;
  catalogueScope: 'PLATFORM' | 'TENANT';
  tenantId?: TenantId;
  functionId: FunctionId;
  subFunctionId?: SubFunctionId;
  jobProfileId: JobProfileId;
  mode: FunctionParticipationMode;
  status: RecordStatus;
}

export type CompetenceSubjectType =
  | 'FUNCTION'
  | 'SUB_FUNCTION'
  | 'ACTIVITY'
  | 'PROCESS'
  | 'TASK'
  | 'DEPLOYMENT';

export interface CompetenceRequirement {
  id: CompetenceRequirementId;
  tenantId: TenantId;
  subjectType: CompetenceSubjectType;
  subjectId: string;
  competenceCode: string;
  competenceName: string;
  requiredLevel: string;
  evidenceRequired: boolean;
  expiryRequired: boolean;
  status: RecordStatus;
}

export interface CompetenceEvidence {
  id: CompetenceEvidenceId;
  tenantId: TenantId;
  personId: PersonId;
  competenceCode: string;
  attainedLevel: string;
  evidenceRecordId?: EvidenceRecordId;
  issuedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type DeploymentPurpose = 'FUNCTIONAL_GOVERNANCE' | 'FUNCTIONAL_DELIVERY';

export type DeploymentContextType =
  | 'TENANT'
  | 'ORGANISATION'
  | 'PROJECT'
  | 'CONTRACT'
  | 'PACKAGE'
  | 'SITE'
  | 'ASSET'
  | 'SERVICE'
  | 'CUSTOM';

export interface FunctionalDeployment {
  id: FunctionalDeploymentId;
  tenantId: TenantId;
  functionId: FunctionId;
  subFunctionId?: SubFunctionId;
  deploymentPurpose: DeploymentPurpose;
  organisationId: OrganisationId;
  organisationUnitId?: OrganisationUnitId;
  contextType: DeploymentContextType;
  contextObjectId?: CanonicalObjectId;
  scopeDescription: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type DeploymentAssigneeType = 'PERSON' | 'POSITION' | 'ORGANISATION_UNIT';

export interface DeploymentAssignment {
  id: DeploymentAssignmentId;
  tenantId: TenantId;
  functionalDeploymentId: FunctionalDeploymentId;
  assigneeType: DeploymentAssigneeType;
  assigneeId: string;
  jobProfileId?: JobProfileId;
  responsibilityRole: WorkResponsibilityRole;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface ResponsibilityScope {
  id: ResponsibilityScopeId;
  tenantId: TenantId;
  deploymentAssignmentId: DeploymentAssignmentId;
  responsibilityRole: WorkResponsibilityRole;
  scopeType: string;
  scopeId?: string;
  description?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export interface DeploymentCapacity {
  id: DeploymentCapacityId;
  tenantId: TenantId;
  deploymentAssignmentId: DeploymentAssignmentId;
  capacityPercent: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type DeploymentGateCheck =
  | 'ACTIVE_DEPLOYMENT'
  | 'ACTIVE_ASSIGNMENT'
  | 'POSITION_OCCUPANCY'
  | 'COMPETENCE'
  | 'AUTHORITY'
  | 'PERMISSION'
  | 'AVAILABILITY';

export interface DeploymentGateResult {
  tenantId: TenantId;
  functionalDeploymentId: FunctionalDeploymentId;
  personId: PersonId;
  evaluatedAt: string;
  allowed: boolean;
  checks: ReadonlyArray<{
    check: DeploymentGateCheck;
    passed: boolean;
    reason: string;
  }>;
}
