import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  createDefaultValidationHandlerRegistry,
  executeValidationHandler,
  type CanonicalObjectId,
  type TenantId,
  type ValidationConflict,
  type ValidationConflictStatus,
  type ValidationHandlerRegistry,
  type ValidationRuleEvaluationRun,
  type ValidationRuleResult
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlValidationPolicyRepository } from './validation-policy-repository.js';

export interface ValidationGateInput {
  ruleSetCode: string;
  subjectObjectId: CanonicalObjectId | string;
  subjectVersion?: string;
  contextType?: string;
  contextId?: string;
  subject: Readonly<Record<string, unknown>>;
  evaluatedAt?: string;
}

export interface ValidationGateOutcome {
  configured: boolean;
  blocked: boolean;
  run?: ValidationRuleEvaluationRun;
  results: readonly ValidationRuleResult[];
  conflicts: readonly ValidationConflict[];
}

export class ValidationExecutionCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'ValidationExecutionCommandError';
  }
}

function required(value: string | undefined, label: string): string {
  const result = value?.trim() ?? '';
  if (!result) {
    throw new ValidationExecutionCommandError(`${label} is required.`, 'INVALID_INPUT');
  }
  return result;
}

function asDate(value: string | undefined): string {
  const raw = value ?? new Date().toISOString();
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationExecutionCommandError('Evaluation date/time is invalid.', 'INVALID_INPUT');
  }
  return parsed.toISOString();
}

function mapRepositoryError(error: unknown): never {
  if (error instanceof ValidationExecutionCommandError) throw error;
  if (typeof error === 'object' && error !== null && 'code' in error) {
    if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
      throw new ValidationExecutionCommandError(
        'Validation execution conflicts with existing evidence.',
        'CONFLICT'
      );
    }
  }
  if (error instanceof Error && /not found/i.test(error.message)) {
    throw new ValidationExecutionCommandError(error.message, 'NOT_FOUND');
  }
  if (error instanceof Error && /must|required|invalid|only|no longer/i.test(error.message)) {
    throw new ValidationExecutionCommandError(error.message, 'INVALID_INPUT');
  }
  throw error;
}

export class MySqlValidationExecutionService {
  private readonly access: MySqlAccessRepository;
  private readonly validation: MySqlValidationPolicyRepository;

  constructor(
    pool: Pool,
    private readonly handlers: ValidationHandlerRegistry = createDefaultValidationHandlerRegistry()
  ) {
    this.access = new MySqlAccessRepository(pool);
    this.validation = new MySqlValidationPolicyRepository(pool);
  }

  async executeRuleSet(
    tenantId: TenantId,
    actorPersonId: string,
    input: ValidationGateInput
  ): Promise<ValidationGateOutcome> {
    await this.requireExecute(tenantId, actorPersonId);
    return this.evaluateRuleSetForCommand(tenantId, actorPersonId, input);
  }

  async evaluateRuleSetForCommand(
    tenantId: TenantId,
    actorPersonId: string,
    input: ValidationGateInput
  ): Promise<ValidationGateOutcome> {
    const ruleSetCode = required(input.ruleSetCode, 'Rule Set code').toUpperCase();
    const subjectObjectId = required(String(input.subjectObjectId), 'Subject object');
    const evaluatedAt = asDate(input.evaluatedAt);

    if (!(await this.validation.hasCanonicalObject(tenantId, subjectObjectId))) {
      throw new ValidationExecutionCommandError(
        'Validation subject was not found in tenant.',
        'NOT_FOUND'
      );
    }

    const ruleSet = await this.validation.getActiveRuleSetByCode(
      tenantId,
      ruleSetCode,
      evaluatedAt
    );
    if (!ruleSet) {
      return { configured: false, blocked: false, results: [], conflicts: [] };
    }

    const members = await this.validation.listActiveRuleSetMembers(
      tenantId,
      ruleSet.id,
      evaluatedAt
    );

    const run: ValidationRuleEvaluationRun = {
      id: asId<'ValidationRuleEvaluationRunId'>(
        `VRE-${randomUUID()}`,
        'Validation Rule Evaluation Run'
      ),
      tenantId,
      ruleSetId: ruleSet.id,
      subjectObjectId: subjectObjectId as CanonicalObjectId,
      ...(input.subjectVersion ? { subjectVersion: input.subjectVersion } : {}),
      ...(input.contextType ? { contextType: input.contextType } : {}),
      ...(input.contextId ? { contextId: input.contextId } : {}),
      evaluatedAt,
      status: 'RUNNING'
    };

    const audit = {
      actorPersonId,
      correlationId: `VALIDATION:${ruleSetCode}`
    };

    const results: ValidationRuleResult[] = [];
    const conflicts: ValidationConflict[] = [];
    let blocked = false;
    let executionError = false;

    try {
      await this.validation.createEvaluationRun(run, audit);

      for (const { member, rule } of members) {
        const outcome = await executeValidationHandler(this.handlers, rule, {
          subject: input.subject
        });
        const result: ValidationRuleResult = {
          id: asId<'ValidationRuleResultId'>(
            `VRR-${randomUUID()}`,
            'Validation Rule Result'
          ),
          tenantId,
          evaluationRunId: run.id,
          ruleDefinitionId: rule.id,
          status: outcome.status,
          ...(outcome.message ? { message: outcome.message } : {}),
          ...(outcome.evidence ? { evidence: outcome.evidence } : {})
        };
        await this.validation.createRuleResult(result, audit);
        results.push(result);

        const failed = outcome.status === 'FAILED' || outcome.status === 'ERROR';
        const material =
          failed &&
          (member.mandatory || rule.severity === 'ERROR' || rule.severity === 'BLOCKING');

        if (material) {
          const conflict: ValidationConflict = {
            id: asId<'ValidationConflictId'>(
              `VRC-${randomUUID()}`,
              'Validation Conflict'
            ),
            tenantId,
            evaluationRunId: run.id,
            ruleResultId: result.id,
            subjectObjectId: run.subjectObjectId,
            summary:
              outcome.message ??
              `Validation rule ${rule.code} did not pass.`,
            status: 'OPEN'
          };
          await this.validation.createConflict(conflict, audit);
          conflicts.push(conflict);
        }

        if (
          member.mandatory &&
          (rule.severity === 'ERROR' || rule.severity === 'BLOCKING') &&
          failed
        ) {
          blocked = true;
        }
        if (member.mandatory && outcome.status === 'ERROR') {
          executionError = true;
          blocked = true;
        }
      }

      const finalStatus: Exclude<ValidationRuleEvaluationRun['status'], 'RUNNING'> =
        executionError ? 'ERROR' : blocked ? 'FAILED' : 'PASSED';
      await this.validation.completeEvaluationRun(tenantId, run.id, finalStatus, audit);

      return {
        configured: true,
        blocked,
        run: { ...run, status: finalStatus },
        results,
        conflicts
      };
    } catch (error) {
      try {
        await this.validation.completeEvaluationRun(tenantId, run.id, 'ERROR', audit);
      } catch {
        // Preserve the original execution/persistence error.
      }
      return mapRepositoryError(error);
    }
  }

  async dispositionConflict(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      conflictId: string;
      status: Exclude<ValidationConflictStatus, 'OPEN'>;
      resolutionReason: string;
    }
  ): Promise<ValidationConflict> {
    await this.requireDisposition(tenantId, actorPersonId);
    try {
      return await this.validation.dispositionConflict(
        tenantId,
        asId<'ValidationConflictId'>(
          required(input.conflictId, 'Validation Conflict'),
          'Validation Conflict'
        ),
        input.status,
        required(input.resolutionReason, 'Resolution reason'),
        {
          actorPersonId,
          correlationId: 'VALIDATION-CONFLICT-DISPOSITION'
        }
      );
    } catch (error) {
      return mapRepositoryError(error);
    }
  }

  private async requireExecute(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.VALIDATION_EXECUTE,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ValidationExecutionCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }

  private async requireDisposition(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.VALIDATION_CONFLICT_DISPOSITION,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ValidationExecutionCommandError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
