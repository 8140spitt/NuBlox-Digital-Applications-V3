import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ClearanceGrant,
  type SecurityAccessException,
  type SecurityClassificationAssignment,
  type SecurityClassificationLevel,
  type SecurityClassificationScheme,
  type SecurityClassificationSchemeKind,
  type SecurityPrincipalType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlSecurityClassificationRepository } from './security-classification-repository.js';

export class SecurityClassificationAdministrationCommandError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'PERMISSION_DENIED'
      | 'INVALID_INPUT'
      | 'NOT_FOUND'
      | 'CONFLICT'
  ) {
    super(message);
    this.name = 'SecurityClassificationAdministrationCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) {
    throw new SecurityClassificationAdministrationCommandError(
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

function dateValue(value: string | undefined, label: string): string | undefined {
  const raw = optional(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new SecurityClassificationAdministrationCommandError(
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

export class MySqlSecurityClassificationAdministrationCommandService {
  private readonly access: MySqlAccessRepository;
  private readonly security: MySqlSecurityClassificationRepository;

  constructor(pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.security = new MySqlSecurityClassificationRepository(pool);
  }

  async createScheme(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string;
      name?: string;
      description?: string;
      kind: SecurityClassificationSchemeKind;
    }
  ): Promise<SecurityClassificationScheme> {
    await this.requireManage(tenantId, actorPersonId);

    const description = optional(input.description);
    const scheme: SecurityClassificationScheme = {
      id: asId<'SecurityClassificationSchemeId'>(
        `SCS-${randomUUID()}`,
        'Security Classification Scheme'
      ),
      tenantId,
      code: required(input.code, 'Scheme code').toUpperCase(),
      name: required(input.name, 'Scheme name'),
      ...(description ? { description } : {}),
      kind: input.kind,
      status: 'ACTIVE'
    };

    try {
      await this.security.createScheme(scheme, {
        actorPersonId,
        correlationId: 'SECURITY-CLASSIFICATION-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Security Classification Scheme');
    }

    return scheme;
  }

  async createLevel(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      schemeId?: string;
      code?: string;
      name?: string;
      description?: string;
      rankOrder?: number;
    }
  ): Promise<SecurityClassificationLevel> {
    await this.requireManage(tenantId, actorPersonId);

    const description = optional(input.description);
    const level: SecurityClassificationLevel = {
      id: asId<'SecurityClassificationLevelId'>(
        `SCL-${randomUUID()}`,
        'Security Classification Level'
      ),
      tenantId,
      schemeId: asId<'SecurityClassificationSchemeId'>(
        required(input.schemeId, 'Classification Scheme'),
        'Security Classification Scheme'
      ),
      code: required(input.code, 'Level code').toUpperCase(),
      name: required(input.name, 'Level name'),
      ...(description ? { description } : {}),
      ...(input.rankOrder === undefined ? {} : { rankOrder: input.rankOrder }),
      status: 'ACTIVE'
    };

    try {
      await this.security.createLevel(level, {
        actorPersonId,
        correlationId: 'SECURITY-CLASSIFICATION-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Security Classification Level');
    }

    return level;
  }

  async assignClassification(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      subjectObjectId?: string;
      subjectVersion?: string;
      classificationLevelId?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<SecurityClassificationAssignment> {
    await this.requireManage(tenantId, actorPersonId);

    const subjectVersion = optional(input.subjectVersion);
    const effectiveFrom =
      dateValue(input.effectiveFrom, 'Effective from') ?? new Date().toISOString();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');

    const assignment: SecurityClassificationAssignment = {
      id: asId<'SecurityClassificationAssignmentId'>(
        `SCA-${randomUUID()}`,
        'Security Classification Assignment'
      ),
      tenantId,
      subjectObjectId: asId<'CanonicalObjectId'>(
        required(input.subjectObjectId, 'Canonical subject'),
        'Canonical Object'
      ),
      ...(subjectVersion ? { subjectVersion } : {}),
      classificationLevelId: asId<'SecurityClassificationLevelId'>(
        required(input.classificationLevelId, 'Classification Level'),
        'Security Classification Level'
      ),
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.security.assignClassification(assignment, {
        actorPersonId,
        correlationId: 'SECURITY-CLASSIFICATION-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Security Classification Assignment');
    }

    return assignment;
  }

  async grantClearance(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      principalType: SecurityPrincipalType;
      principalId?: string;
      classificationLevelId?: string;
      includeLowerLevels?: boolean;
      scopeType?: string;
      scopeId?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<ClearanceGrant> {
    await this.requireManage(tenantId, actorPersonId);

    const scopeType = required(input.scopeType, 'Clearance scope type').toUpperCase();
    const scopeId = optional(input.scopeId);
    const effectiveFrom =
      dateValue(input.effectiveFrom, 'Effective from') ?? new Date().toISOString();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');

    const grant: ClearanceGrant = {
      id: asId<'ClearanceGrantId'>(`CLR-${randomUUID()}`, 'Clearance Grant'),
      tenantId,
      principalType: input.principalType,
      principalId: required(input.principalId, 'Clearance principal'),
      classificationLevelId: asId<'SecurityClassificationLevelId'>(
        required(input.classificationLevelId, 'Classification Level'),
        'Security Classification Level'
      ),
      includeLowerLevels: Boolean(input.includeLowerLevels),
      scopeType,
      ...(scopeId ? { scopeId } : {}),
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.security.grantClearance(grant, {
        actorPersonId,
        correlationId: 'SECURITY-CLASSIFICATION-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Clearance Grant');
    }

    return grant;
  }

  async createAccessException(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      subjectObjectId?: string;
      subjectVersion?: string;
      principalType: SecurityPrincipalType;
      principalId?: string;
      classificationLevelId?: string;
      approvalDecisionId?: string;
      reason?: string;
      effectiveFrom?: string;
      effectiveTo?: string;
    }
  ): Promise<SecurityAccessException> {
    await this.requireManage(tenantId, actorPersonId);

    const subjectVersion = optional(input.subjectVersion);
    const effectiveFrom =
      dateValue(input.effectiveFrom, 'Effective from') ?? new Date().toISOString();
    const effectiveTo = dateValue(input.effectiveTo, 'Effective to');

    const exception: SecurityAccessException = {
      id: asId<'SecurityAccessExceptionId'>(
        `SAE-${randomUUID()}`,
        'Security Access Exception'
      ),
      tenantId,
      subjectObjectId: asId<'CanonicalObjectId'>(
        required(input.subjectObjectId, 'Canonical subject'),
        'Canonical Object'
      ),
      ...(subjectVersion ? { subjectVersion } : {}),
      principalType: input.principalType,
      principalId: required(input.principalId, 'Exception principal'),
      classificationLevelId: asId<'SecurityClassificationLevelId'>(
        required(input.classificationLevelId, 'Classification Level'),
        'Security Classification Level'
      ),
      approvalDecisionId: asId<'DecisionId'>(
        required(input.approvalDecisionId, 'Approval Decision'),
        'Decision'
      ),
      reason: required(input.reason, 'Exception reason'),
      effectiveFrom,
      ...(effectiveTo ? { effectiveTo } : {}),
      status: 'ACTIVE'
    };

    try {
      await this.security.createAccessException(exception, {
        actorPersonId,
        correlationId: 'SECURITY-CLASSIFICATION-ADMIN'
      });
    } catch (error) {
      this.mapRepositoryError(error, 'Security Access Exception');
    }

    return exception;
  }

  private async requireManage(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.SECURITY_CLASSIFICATION_MANAGE,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new SecurityClassificationAdministrationCommandError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }

  private mapRepositoryError(error: unknown, label: string): never {
    if (isDuplicateEntry(error)) {
      throw new SecurityClassificationAdministrationCommandError(
        `${label} conflicts with an existing governed record.`,
        'CONFLICT'
      );
    }

    if (
      error instanceof Error &&
      (
        error.message.includes('not found') ||
        error.message.includes('inactive') ||
        error.message.includes('requires a Decision')
      )
    ) {
      throw new SecurityClassificationAdministrationCommandError(
        error.message,
        'NOT_FOUND'
      );
    }

    if (
      error instanceof Error &&
      (
        error.name === 'KernelInvariantError' ||
        error.message.includes('overlapping active classification')
      )
    ) {
      throw new SecurityClassificationAdministrationCommandError(
        error.message,
        error.message.includes('overlapping') ? 'CONFLICT' : 'INVALID_INPUT'
      );
    }

    throw error;
  }
}
