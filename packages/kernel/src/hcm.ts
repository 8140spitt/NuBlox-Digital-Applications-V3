import type {
  EmploymentId,
  FunctionId,
  OrganisationId,
  PersonId,
  PositionFunctionAssignmentId,
  PositionId,
  PositionReportingLineId,
  TenantId
} from './ids.js';
import type { RecordStatus } from './model.js';
import type { DeploymentPurpose } from './functional.js';

export type WorkerType = 'EMPLOYEE' | 'CONTINGENT';
export type EmploymentType =
  | 'PERMANENT'
  | 'FIXED_TERM'
  | 'TEMPORARY'
  | 'APPRENTICE'
  | 'INTERN'
  | 'CONTRACTOR';

export type EmploymentStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'ENDED';

export interface Employment {
  id: EmploymentId;
  tenantId: TenantId;
  personId: PersonId;
  organisationId: OrganisationId;
  employeeNumber: string;
  workerType: WorkerType;
  employmentType: EmploymentType;
  startDate: string;
  endDate?: string;
  status: EmploymentStatus;
}

export interface PositionFunctionAssignment {
  id: PositionFunctionAssignmentId;
  tenantId: TenantId;
  positionId: PositionId;
  functionId: FunctionId;
  deploymentPurpose: DeploymentPurpose;
  isPrimary: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}

export type PositionReportingRelationshipType =
  | 'LINE_MANAGER'
  | 'FUNCTIONAL_MANAGER'
  | 'DOTTED_LINE';

export interface PositionReportingLine {
  id: PositionReportingLineId;
  tenantId: TenantId;
  subordinatePositionId: PositionId;
  managerPositionId: PositionId;
  relationshipType: PositionReportingRelationshipType;
  effectiveFrom: string;
  effectiveTo?: string;
  status: RecordStatus;
}
