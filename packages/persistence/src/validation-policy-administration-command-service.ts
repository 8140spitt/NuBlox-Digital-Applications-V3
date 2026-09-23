import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type MappingPolicy,
  type RelationshipConstraintPolicy,
  type TenantId,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember,
  type ValidationRuleType,
  type ValidationSeverity
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlValidationPolicyRepository } from './validation-policy-repository.js';

export class ValidationPolicyAdministrationCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'ValidationPolicyAdministrationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) throw new ValidationPolicyAdministrationCommandError(`${label} is required.`, 'INVALID_INPUT');
  return trimmed;
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? '';
  return trimmed || undefined;
}

function positiveInteger(value: number | undefined, label: string, defaultValue = 1): number {
  const result = value ?? defaultValue;
  if (!Number.isInteger(result) || result <= 0) {
    throw new ValidationPolicyAdministrationCommandError(`${label} must be a positive integer.`, 'INVALID_INPUT');
  }
  return result;
}

function nonNegativeInteger(value: number | undefined, label: string, defaultValue = 0): number {
  const result = value ?? defaultValue;
  if (!Number.isInteger(result) || result < 0) {
    throw new ValidationPolicyAdministrationCommandError(`${label} must be a non-negative integer.`, 'INVALID_INPUT');
  }
  return result;
}

function dateValue(value: string | undefined, label: string): string | undefined {
  const raw = optional(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationPolicyAdministrationCommandError(`${label} must be a valid date/time.`, 'INVALID_INPUT');
  }
  return date.toISOString();
}

function isDuplicateEntry(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error &&
    (error as { code?: string }).code === 'ER_DUP_ENTRY';
}

export class MySqlValidationPolicyAdministrationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly validation: MySqlValidationPolicyRepository;

  constructor(pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.validation = new MySqlValidationPolicyRepository(pool);
  }

  async createRuleDefinition(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      ruleType: ValidationRuleType;
      version?: number;
      severity: ValidationSeverity;
      handlerKey?: string;
      configuration?: Readonly<Record<string, unknown>>;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<ValidationRuleDefinition> {
    await this.requireManage(tenantId, actorPersonId);
    const description = optional(input.description);
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');

    const rule: ValidationRuleDefinition = {
      id: asId<'ValidationRuleDefinitionId'>(`VRD-${randomUUID()}`, 'Validation Rule Definition'),
      tenantId,
      code: required(input.code, 'Rule code').toUpperCase(),
      name: required(input.name, 'Rule name'),
      ...(description ? { description } : {}),
      ruleType: input.ruleType,
      version: positiveInteger(input.version, 'Rule version'),
      severity: input.severity,
      handlerKey: required(input.handlerKey, 'Handler key'),
      ...(input.configuration ? { configuration: input.configuration } : {}),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.validation.createRuleDefinition(rule, {
        actorPersonId,
        correlationId: 'VALIDATION-POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Validation Rule Definition');
    }
    return rule;
  }

  async createRuleSet(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      version?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<ValidationRuleSet> {
    await this.requireManage(tenantId, actorPersonId);
    const description = optional(input.description);
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const ruleSet: ValidationRuleSet = {
      id: asId<'ValidationRuleSetId'>(`VRS-${randomUUID()}`, 'Validation Rule Set'),
      tenantId,
      code: required(input.code, 'Rule Set code').toUpperCase(),
      name: required(input.name, 'Rule Set name'),
      ...(description ? { description } : {}),
      version: positiveInteger(input.version, 'Rule Set version'),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.validation.createRuleSet(ruleSet, {
        actorPersonId,
        correlationId: 'VALIDATION-POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Validation Rule Set');
    }
    return ruleSet;
  }

  async addRuleSetMember(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      ruleSetId?: string;
      ruleDefinitionId?: string;
      sequence?: number;
      mandatory?: boolean;
    }
  ): Promise<ValidationRuleSetMember> {
    await this.requireManage(tenantId, actorPersonId);
    const member: ValidationRuleSetMember = {
      id: asId<'ValidationRuleSetMemberId'>(`VRM-${randomUUID()}`, 'Validation Rule Set Member'),
      tenantId,
      ruleSetId: asId<'ValidationRuleSetId'>(required(input.ruleSetId, 'Rule Set'), 'Validation Rule Set'),
      ruleDefinitionId: asId<'ValidationRuleDefinitionId'>(required(input.ruleDefinitionId, 'Rule Definition'), 'Validation Rule Definition'),
      sequence: nonNegativeInteger(input.sequence, 'Sequence'),
      mandatory: input.mandatory ?? true,
      status: 'ACTIVE'
    };
    try {
      await this.validation.addRuleSetMember(member, {
        actorPersonId,
        correlationId: 'VALIDATION-POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Validation Rule Set Member');
    }
    return member;
  }

  async createRelationshipConstraint(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      relationshipType?: string;
      sourceObjectType?: string;
      targetObjectType?: string;
      version?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<RelationshipConstraintPolicy> {
    await this.requireManage(tenantId, actorPersonId);
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const policy: RelationshipConstraintPolicy = {
      id: asId<'RelationshipConstraintPolicyId'>(`RCP-${randomUUID()}`, 'Relationship Constraint Policy'),
      tenantId,
      code: required(input.code, 'Constraint code').toUpperCase(),
      name: required(input.name, 'Constraint name'),
      relationshipType: required(input.relationshipType, 'Relationship type').toUpperCase(),
      sourceObjectType: required(input.sourceObjectType, 'Source object type').toUpperCase(),
      targetObjectType: required(input.targetObjectType, 'Target object type').toUpperCase(),
      version: positiveInteger(input.version, 'Constraint version'),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.validation.createRelationshipConstraintPolicy(policy, {
        actorPersonId,
        correlationId: 'VALIDATION-POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Relationship Constraint Policy');
    }
    return policy;
  }

  async createMappingPolicy(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      sourceType?: string;
      targetType?: string;
      mapping?: Readonly<Record<string, unknown>>;
      precedence?: number;
      version?: number;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<MappingPolicy> {
    await this.requireManage(tenantId, actorPersonId);
    const effectiveFrom = dateValue(input.effectiveFrom, 'Effective from');
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');
    const policy: MappingPolicy = {
      id: asId<'MappingPolicyId'>(`MAP-${randomUUID()}`, 'Mapping Policy'),
      tenantId,
      code: required(input.code, 'Mapping code').toUpperCase(),
      name: required(input.name, 'Mapping name'),
      sourceType: required(input.sourceType, 'Source type').toUpperCase(),
      targetType: required(input.targetType, 'Target type').toUpperCase(),
      mapping: input.mapping ?? {},
      precedence: nonNegativeInteger(input.precedence, 'Precedence'),
      version: positiveInteger(input.version, 'Mapping version'),
      ...(effectiveFrom ? { effectiveFrom } : {}),
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };
    try {
      await this.validation.createMappingPolicy(policy, {
        actorPersonId,
        correlationId: 'VALIDATION-POLICY-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Mapping Policy');
    }
    return policy;
  }

  private async requireManage(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.VALIDATION_POLICY_MANAGE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ValidationPolicyAdministrationCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private mapRepositoryError(error: unknown, label: string): never {
    if (isDuplicateEntry(error)) {
      throw new ValidationPolicyAdministrationCommandError(
        `${label} conflicts with an existing governed record.`,
        'CONFLICT'
      );
    }
    if (error instanceof Error && error.message.includes('not found')) {
      throw new ValidationPolicyAdministrationCommandError(error.message, 'NOT_FOUND');
    }
    if (error instanceof Error && error.name === 'KernelInvariantError') {
      throw new ValidationPolicyAdministrationCommandError(error.message, 'INVALID_INPUT');
    }
    throw error;
  }
}
