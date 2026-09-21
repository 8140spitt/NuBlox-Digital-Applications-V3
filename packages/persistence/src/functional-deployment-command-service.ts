import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type DeploymentAssignment,
  type DeploymentAssigneeType,
  type DeploymentCapacity,
  type DeploymentContextType,
  type FunctionalDeployment,
  type ResponsibilityScope,
  type TenantId,
  type WorkResponsibilityRole
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlFunctionalRepository } from './functional-repository.js';

interface AssignmentRoleRow extends RowDataPacket {
  responsibility_role: WorkResponsibilityRole;
}

export class FunctionalDeploymentCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'FunctionalDeploymentCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new FunctionalDeploymentCommandError(
      `${label} is required.`,
      'INVALID_INPUT'
    );
  }
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function dateValue(value: string | undefined, label: string): string {
  const candidate = value?.trim() ? new Date(value) : new Date();
  if (Number.isNaN(candidate.getTime())) {
    throw new FunctionalDeploymentCommandError(
      `${label} is invalid.`,
      'INVALID_INPUT'
    );
  }
  return candidate.toISOString();
}

function optionalDate(value: string | undefined, label: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  const candidate = new Date(trimmed);
  if (Number.isNaN(candidate.getTime())) {
    throw new FunctionalDeploymentCommandError(
      `${label} is invalid.`,
      'INVALID_INPUT'
    );
  }
  return candidate.toISOString();
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof FunctionalDeploymentCommandError) throw error;

  if (isDuplicateEntry(error)) {
    throw new FunctionalDeploymentCommandError(
      'An equivalent deployment record already exists.',
      'CONFLICT'
    );
  }

  if (error instanceof Error) {
    if (
      /not found|does not exist|unavailable/i.test(error.message)
    ) {
      throw new FunctionalDeploymentCommandError(error.message, 'NOT_FOUND');
    }

    if (
      /must|required|cannot|invalid|belong|reference|between|effectiveTo/i.test(
        error.message
      )
    ) {
      throw new FunctionalDeploymentCommandError(error.message, 'INVALID_INPUT');
    }
  }

  throw error;
}

const CONTEXT_TYPES: ReadonlySet<DeploymentContextType> = new Set([
  'TENANT',
  'ORGANISATION',
  'PROJECT',
  'CONTRACT',
  'PACKAGE',
  'SITE',
  'ASSET',
  'SERVICE',
  'CUSTOM'
]);

const ASSIGNEE_TYPES: ReadonlySet<DeploymentAssigneeType> = new Set([
  'PERSON',
  'POSITION',
  'ORGANISATION_UNIT'
]);

const RESPONSIBILITY_ROLES: ReadonlySet<WorkResponsibilityRole> = new Set([
  'ACCOUNTABLE',
  'RESPONSIBLE',
  'CONTRIBUTOR',
  'REVIEWER',
  'CHECKER',
  'APPROVER',
  'ACCEPTOR',
  'CONSULTED',
  'INFORMED',
  'ASSURANCE'
]);

export class MySqlFunctionalDeploymentCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly functional: MySqlFunctionalRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.functional = new MySqlFunctionalRepository(pool);
  }

  async createDeployment(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      functionId: string;
      subFunctionId?: string;
      organisationId: string;
      organisationUnitId?: string;
      contextType: DeploymentContextType;
      contextObjectId?: string;
      scopeDescription: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<FunctionalDeployment> {
    await this.requireManageDeployment(tenantId, actorPersonId);

    if (!CONTEXT_TYPES.has(input.contextType)) {
      throw new FunctionalDeploymentCommandError(
        'Deployment context type is invalid.',
        'INVALID_INPUT'
      );
    }

    const contextObjectId = optional(input.contextObjectId);
    if (
      (input.contextType === 'TENANT' || input.contextType === 'ORGANISATION') &&
      contextObjectId
    ) {
      throw new FunctionalDeploymentCommandError(
        'TENANT and ORGANISATION deployments must not specify a context object.',
        'INVALID_INPUT'
      );
    }
    if (
      input.contextType !== 'TENANT' &&
      input.contextType !== 'ORGANISATION' &&
      !contextObjectId
    ) {
      throw new FunctionalDeploymentCommandError(
        'Scoped deployment contexts require a canonical context object.',
        'INVALID_INPUT'
      );
    }

    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = optionalDate(input.effectiveTo, 'Effective to');

    const deployment: FunctionalDeployment = {
      id: asId<'FunctionalDeploymentId'>(
        `DEPLOY-${randomUUID()}`,
        'Functional Deployment'
      ),
      tenantId,
      functionId: required(input.functionId, 'Function') as FunctionalDeployment['functionId'],
      ...(optional(input.subFunctionId)
        ? {
            subFunctionId: optional(input.subFunctionId) as NonNullable<
              FunctionalDeployment['subFunctionId']
            >
          }
        : {}),
      organisationId: required(
        input.organisationId,
        'Organisation'
      ) as FunctionalDeployment['organisationId'],
      ...(optional(input.organisationUnitId)
        ? {
            organisationUnitId: optional(
              input.organisationUnitId
            ) as NonNullable<FunctionalDeployment['organisationUnitId']>
          }
        : {}),
      contextType: input.contextType,
      ...(contextObjectId
        ? {
            contextObjectId:
              contextObjectId as NonNullable<FunctionalDeployment['contextObjectId']>
          }
        : {}),
      scopeDescription: required(input.scopeDescription, 'Scope description'),
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.functional.createDeployment(tenantId, deployment, {
        actorPersonId,
        correlationId: 'DEPLOYMENT-ADMIN'
      });
      return deployment;
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async createAssignment(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      functionalDeploymentId: string;
      assigneeType: DeploymentAssigneeType;
      assigneeId: string;
      jobProfileId?: string;
      responsibilityRole: WorkResponsibilityRole;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<DeploymentAssignment> {
    await this.requireManageDeployment(tenantId, actorPersonId);

    if (!ASSIGNEE_TYPES.has(input.assigneeType)) {
      throw new FunctionalDeploymentCommandError(
        'Deployment assignee type is invalid.',
        'INVALID_INPUT'
      );
    }
    if (!RESPONSIBILITY_ROLES.has(input.responsibilityRole)) {
      throw new FunctionalDeploymentCommandError(
        'Responsibility role is invalid.',
        'INVALID_INPUT'
      );
    }

    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = optionalDate(input.effectiveTo, 'Effective to');
    const jobProfileId = optional(input.jobProfileId);

    const assignment: DeploymentAssignment = {
      id: asId<'DeploymentAssignmentId'>(
        `DASG-${randomUUID()}`,
        'Deployment Assignment'
      ),
      tenantId,
      functionalDeploymentId: required(
        input.functionalDeploymentId,
        'Functional Deployment'
      ) as DeploymentAssignment['functionalDeploymentId'],
      assigneeType: input.assigneeType,
      assigneeId: required(input.assigneeId, 'Assignee'),
      ...(jobProfileId
        ? {
            jobProfileId:
              jobProfileId as NonNullable<DeploymentAssignment['jobProfileId']>
          }
        : {}),
      responsibilityRole: input.responsibilityRole,
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.functional.createDeploymentAssignment(tenantId, assignment, {
        actorPersonId,
        correlationId: 'DEPLOYMENT-ADMIN'
      });
      return assignment;
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async createResponsibilityScope(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deploymentAssignmentId: string;
      scopeType?: string;
      scopeId?: string;
      description?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<ResponsibilityScope> {
    await this.requireManageDeployment(tenantId, actorPersonId);

    const assignmentId = required(
      input.deploymentAssignmentId,
      'Deployment Assignment'
    );
    const [rows] = await this.pool.execute<AssignmentRoleRow[]>(
      `SELECT responsibility_role
         FROM deployment_assignments
        WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
      [tenantId, assignmentId]
    );
    const assignment = rows[0];
    if (!assignment) {
      throw new FunctionalDeploymentCommandError(
        'Deployment Assignment was not found or is inactive.',
        'NOT_FOUND'
      );
    }

    const scopeType = optional(input.scopeType)?.toUpperCase() ?? 'TENANT';
    const scopeId = optional(input.scopeId);
    if (scopeType === 'TENANT' && scopeId) {
      throw new FunctionalDeploymentCommandError(
        'TENANT responsibility scope must not specify a scope ID.',
        'INVALID_INPUT'
      );
    }
    if (scopeType !== 'TENANT' && !scopeId) {
      throw new FunctionalDeploymentCommandError(
        'Non-TENANT responsibility scope requires a scope ID.',
        'INVALID_INPUT'
      );
    }

    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = optionalDate(input.effectiveTo, 'Effective to');
    const description = optional(input.description);

    const scope: ResponsibilityScope = {
      id: asId<'ResponsibilityScopeId'>(
        `RSCOPE-${randomUUID()}`,
        'Responsibility Scope'
      ),
      tenantId,
      deploymentAssignmentId:
        assignmentId as ResponsibilityScope['deploymentAssignmentId'],
      responsibilityRole: assignment.responsibility_role,
      scopeType,
      ...(scopeId ? { scopeId } : {}),
      ...(description ? { description } : {}),
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.functional.createResponsibilityScope(tenantId, scope, {
        actorPersonId,
        correlationId: 'DEPLOYMENT-ADMIN'
      });
      return scope;
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  async createCapacity(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      deploymentAssignmentId: string;
      capacityPercent: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<DeploymentCapacity> {
    await this.requireManageDeployment(tenantId, actorPersonId);

    if (
      !Number.isFinite(input.capacityPercent) ||
      input.capacityPercent < 0 ||
      input.capacityPercent > 100
    ) {
      throw new FunctionalDeploymentCommandError(
        'Capacity percent must be between 0 and 100.',
        'INVALID_INPUT'
      );
    }

    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = optionalDate(input.effectiveTo, 'Effective to');

    const capacity: DeploymentCapacity = {
      id: asId<'DeploymentCapacityId'>(
        `DCAP-${randomUUID()}`,
        'Deployment Capacity'
      ),
      tenantId,
      deploymentAssignmentId: required(
        input.deploymentAssignmentId,
        'Deployment Assignment'
      ) as DeploymentCapacity['deploymentAssignmentId'],
      capacityPercent: input.capacityPercent,
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.functional.createDeploymentCapacity(tenantId, capacity, {
        actorPersonId,
        correlationId: 'DEPLOYMENT-ADMIN'
      });
      return capacity;
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  private async requireManageDeployment(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.DEPLOYMENT_MANAGE,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new FunctionalDeploymentCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }
}
