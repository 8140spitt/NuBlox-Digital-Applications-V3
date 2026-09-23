import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type PolicyAssignment,
  type PolicyAssignmentMode,
  type PolicyDefinition,
  type PolicyScope,
  type PolicyScopeType,
  type PolicyType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlPolicyRepository } from './policy-repository.js';

export class PolicyAdministrationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'PolicyAdministrationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new PolicyAdministrationCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function dateValue(value: string | undefined, label: string): string | undefined {
  const raw = optional(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new PolicyAdministrationCommandError(
      `${label} must be a valid date/time.`,
      'INVALID_INPUT'
    );
  }
  return date.toISOString();
}

function isDuplicateEntry(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY'
  );
}

export class MySqlPolicyAdministrationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly policies: MySqlPolicyRepository;

  constructor(pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.policies = new MySqlPolicyRepository(pool);
  }

  async createScope(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      parentPolicyScopeId?: string;
      scopeType: PolicyScopeType;
      scopeObjectId?: string;
      code?: string;
      name?: string;
    }
  ): Promise<PolicyScope> {
    await this.requireManagePolicy(tenantId, actorPersonId);

    const scopeObjectId = optional(input.scopeObjectId);
    const parentPolicyScopeId = optional(input.parentPolicyScopeId);
    const scope: PolicyScope = {
      id: asId<'PolicyScopeId'>(`POL-SCOPE-${randomUUID()}`, 'Policy Scope'),
      tenantId,
      ...(parentPolicyScopeId
        ? {
            parentPolicyScopeId: asId<'PolicyScopeId'>(
              parentPolicyScopeId,
              'Parent Policy Scope'
            )
          }
        : {}),
      scopeType: input.scopeType,
      ...(scopeObjectId ? { scopeObjectId } : {}),
      code: required(input.code, 'Policy Scope code').toUpperCase(),
      name: required(input.name, 'Policy Scope name'),
      status: 'ACTIVE'
    };

    try {
      await this.policies.createPolicyScope(scope, {
        actorPersonId,
        correlationId: 'POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Policy Scope');
    }

    return scope;
  }

  async createDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      policyType: PolicyType;
      version?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<PolicyDefinition> {
    await this.requireManagePolicy(tenantId, actorPersonId);

    const description = optional(input.description);
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const version = input.version ?? 1;

    if (!Number.isInteger(version) || version <= 0) {
      throw new PolicyAdministrationCommandError(
        'Policy Definition version must be a positive integer.',
        'INVALID_INPUT'
      );
    }

    const definition: PolicyDefinition = {
      id: asId<'PolicyDefinitionId'>(
        `POL-DEF-${randomUUID()}`,
        'Policy Definition'
      ),
      tenantId,
      code: required(input.code, 'Policy Definition code').toUpperCase(),
      name: required(input.name, 'Policy Definition name'),
      ...(description ? { description } : {}),
      policyType: input.policyType,
      version,
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.policies.createPolicyDefinition(definition, {
        actorPersonId,
        correlationId: 'POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Policy Definition');
    }

    return definition;
  }

  async assignPolicy(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      policyScopeId?: string;
      policyDefinitionId?: string;
      assignmentMode: PolicyAssignmentMode;
      precedence?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<PolicyAssignment> {
    await this.requireManagePolicy(tenantId, actorPersonId);

    const precedence = input.precedence ?? 0;
    if (!Number.isInteger(precedence) || precedence < 0) {
      throw new PolicyAdministrationCommandError(
        'Policy Assignment precedence must be a non-negative integer.',
        'INVALID_INPUT'
      );
    }

    const effectiveFrom =
      dateValue(input.effectiveFrom, 'Effective from') ?? new Date().toISOString();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');

    const assignment: PolicyAssignment = {
      id: asId<'PolicyAssignmentId'>(
        `POL-ASG-${randomUUID()}`,
        'Policy Assignment'
      ),
      tenantId,
      policyScopeId: asId<'PolicyScopeId'>(
        required(input.policyScopeId, 'Policy Scope'),
        'Policy Scope'
      ),
      policyDefinitionId: asId<'PolicyDefinitionId'>(
        required(input.policyDefinitionId, 'Policy Definition'),
        'Policy Definition'
      ),
      assignmentMode: input.assignmentMode,
      precedence,
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.policies.assignPolicy(assignment, {
        actorPersonId,
        correlationId: 'POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Policy Assignment');
    }

    return assignment;
  }

  private async requireManagePolicy(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.POLICY_MANAGE,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new PolicyAdministrationCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }

  private mapRepositoryError(error: unknown, label: string): never {
    if (isDuplicateEntry(error)) {
      throw new PolicyAdministrationCommandError(
        `${label} conflicts with an existing governed record.`,
        'CONFLICT'
      );
    }

    if (
      error instanceof Error &&
      (error.message.includes('not found') || error.message.includes('must be active'))
    ) {
      throw new PolicyAdministrationCommandError(error.message, 'NOT_FOUND');
    }

    if (error instanceof Error && error.name === 'KernelInvariantError') {
      throw new PolicyAdministrationCommandError(error.message, 'INVALID_INPUT');
    }

    throw error;
  }
}
