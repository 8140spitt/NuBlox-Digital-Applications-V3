import {
  PLATFORM_PERMISSION_KEYS,
  type MappingPolicy,
  type RelationshipConstraintPolicy,
  type TenantId,
  type ValidationRuleDefinition,
  type ValidationRuleSet
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';

interface RuleRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null;
  rule_type: ValidationRuleDefinition['ruleType']; version: number;
  severity: ValidationRuleDefinition['severity']; handler_key: string;
  configuration: unknown; effective_from: Date | null; effective_to: Date | null;
  status: ValidationRuleDefinition['status'];
}
interface SetRow extends RowDataPacket {
  id: string; code: string; name: string; description: string | null; version: number;
  effective_from: Date | null; effective_to: Date | null; status: ValidationRuleSet['status'];
}
interface MemberRow extends RowDataPacket {
  id: string; rule_set_id: string; rule_set_code: string; rule_definition_id: string;
  rule_code: string; rule_name: string; sequence_no: number; mandatory: number;
  status: 'ACTIVE' | 'INACTIVE';
}
interface ConstraintRow extends RowDataPacket {
  id: string; code: string; name: string; relationship_type: string;
  source_object_type: string; target_object_type: string; version: number;
  effective_from: Date | null; effective_to: Date | null;
  status: RelationshipConstraintPolicy['status'];
}
interface MappingRow extends RowDataPacket {
  id: string; code: string; name: string; source_type: string; target_type: string;
  mapping: unknown; precedence: number; version: number; effective_from: Date | null;
  effective_to: Date | null; status: MappingPolicy['status'];
}
interface EvaluationRow extends RowDataPacket {
  id: string; rule_set_id: string; rule_set_code: string; subject_object_id: string;
  subject_version: string | null; context_type: string | null; context_id: string | null;
  evaluated_at: Date; evaluation_status: string;
}
interface ConflictRow extends RowDataPacket {
  id: string; evaluation_run_id: string; subject_object_id: string; summary: string;
  conflict_status: string; resolution_reason: string | null; created_at: Date;
}

function objectValue(value: unknown): Readonly<Record<string, unknown>> {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
    ? parsed as Readonly<Record<string, unknown>>
    : {};
}

export interface ValidationRuleMemberView {
  id: string;
  ruleSetId: string;
  ruleSetCode: string;
  ruleDefinitionId: string;
  ruleCode: string;
  ruleName: string;
  sequence: number;
  mandatory: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ValidationEvaluationView {
  id: string;
  ruleSetId: string;
  ruleSetCode: string;
  subjectObjectId: string;
  subjectVersion?: string;
  contextType?: string;
  contextId?: string;
  evaluatedAt: string;
  status: string;
}

export interface ValidationConflictView {
  id: string;
  evaluationRunId: string;
  subjectObjectId: string;
  summary: string;
  status: string;
  resolutionReason?: string;
  createdAt: string;
}

export interface ValidationPolicyAdministrationProjection {
  rules: ValidationRuleDefinition[];
  ruleSets: ValidationRuleSet[];
  members: ValidationRuleMemberView[];
  relationshipConstraints: RelationshipConstraintPolicy[];
  mappings: MappingPolicy[];
  evaluations: ValidationEvaluationView[];
  conflicts: ValidationConflictView[];
}

export class ValidationPolicyAdministrationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'ValidationPolicyAdministrationReadError';
  }
}

export class MySqlValidationPolicyAdministrationReadRepository {
  private readonly access: MySqlAccessRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<ValidationPolicyAdministrationProjection> {
    await this.requireRead(tenantId, actorPersonId);

    const [ruleResult, setResult, memberResult, constraintResult, mappingResult, evaluationResult, conflictResult] =
      await Promise.all([
        this.pool.execute<RuleRow[]>(
          `SELECT id, code, name, description, rule_type, version, severity, handler_key,
                  configuration, effective_from, effective_to, status
             FROM validation_rule_definitions WHERE tenant_id = ?
            ORDER BY code, version DESC, id`, [tenantId]),
        this.pool.execute<SetRow[]>(
          `SELECT id, code, name, description, version, effective_from, effective_to, status
             FROM validation_rule_sets WHERE tenant_id = ?
            ORDER BY code, version DESC, id`, [tenantId]),
        this.pool.execute<MemberRow[]>(
          `SELECT m.id, m.rule_set_id, s.code AS rule_set_code, m.rule_definition_id,
                  r.code AS rule_code, r.name AS rule_name, m.sequence_no, m.mandatory, m.status
             FROM validation_rule_set_members m
             JOIN validation_rule_sets s ON s.tenant_id = m.tenant_id AND s.id = m.rule_set_id
             JOIN validation_rule_definitions r ON r.tenant_id = m.tenant_id AND r.id = m.rule_definition_id
            WHERE m.tenant_id = ?
            ORDER BY s.code, m.sequence_no, r.code`, [tenantId]),
        this.pool.execute<ConstraintRow[]>(
          `SELECT id, code, name, relationship_type, source_object_type, target_object_type,
                  version, effective_from, effective_to, status
             FROM relationship_constraint_policies WHERE tenant_id = ?
            ORDER BY code, version DESC, id`, [tenantId]),
        this.pool.execute<MappingRow[]>(
          `SELECT id, code, name, source_type, target_type, mapping, precedence, version,
                  effective_from, effective_to, status
             FROM mapping_policies WHERE tenant_id = ?
            ORDER BY source_type, target_type, precedence DESC, code, version DESC`, [tenantId]),
        this.pool.execute<EvaluationRow[]>(
          `SELECT e.id, e.rule_set_id, s.code AS rule_set_code, e.subject_object_id,
                  e.subject_version, e.context_type, e.context_id, e.evaluated_at, e.evaluation_status
             FROM validation_rule_evaluation_runs e
             JOIN validation_rule_sets s ON s.tenant_id = e.tenant_id AND s.id = e.rule_set_id
            WHERE e.tenant_id = ?
            ORDER BY e.evaluated_at DESC LIMIT 100`, [tenantId]),
        this.pool.execute<ConflictRow[]>(
          `SELECT id, evaluation_run_id, subject_object_id, summary, conflict_status,
                  resolution_reason, created_at
             FROM validation_conflicts WHERE tenant_id = ?
            ORDER BY created_at DESC LIMIT 100`, [tenantId])
      ]);

    return {
      rules: ruleResult[0].map((row) => ({
        id: row.id as ValidationRuleDefinition['id'],
        tenantId,
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        ruleType: row.rule_type,
        version: Number(row.version),
        severity: row.severity,
        handlerKey: row.handler_key,
        ...(row.configuration ? { configuration: objectValue(row.configuration) } : {}),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      ruleSets: setResult[0].map((row) => ({
        id: row.id as ValidationRuleSet['id'],
        tenantId,
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      members: memberResult[0].map((row) => ({
        id: row.id,
        ruleSetId: row.rule_set_id,
        ruleSetCode: row.rule_set_code,
        ruleDefinitionId: row.rule_definition_id,
        ruleCode: row.rule_code,
        ruleName: row.rule_name,
        sequence: Number(row.sequence_no),
        mandatory: Boolean(row.mandatory),
        status: row.status
      })),
      relationshipConstraints: constraintResult[0].map((row) => ({
        id: row.id as RelationshipConstraintPolicy['id'],
        tenantId,
        code: row.code,
        name: row.name,
        relationshipType: row.relationship_type,
        sourceObjectType: row.source_object_type,
        targetObjectType: row.target_object_type,
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      mappings: mappingResult[0].map((row) => ({
        id: row.id as MappingPolicy['id'],
        tenantId,
        code: row.code,
        name: row.name,
        sourceType: row.source_type,
        targetType: row.target_type,
        mapping: objectValue(row.mapping),
        precedence: Number(row.precedence),
        version: Number(row.version),
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      evaluations: evaluationResult[0].map((row) => ({
        id: row.id,
        ruleSetId: row.rule_set_id,
        ruleSetCode: row.rule_set_code,
        subjectObjectId: row.subject_object_id,
        ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
        ...(row.context_type ? { contextType: row.context_type } : {}),
        ...(row.context_id ? { contextId: row.context_id } : {}),
        evaluatedAt: row.evaluated_at.toISOString(),
        status: row.evaluation_status
      })),
      conflicts: conflictResult[0].map((row) => ({
        id: row.id,
        evaluationRunId: row.evaluation_run_id,
        subjectObjectId: row.subject_object_id,
        summary: row.summary,
        status: row.conflict_status,
        ...(row.resolution_reason ? { resolutionReason: row.resolution_reason } : {}),
        createdAt: row.created_at.toISOString()
      }))
    };
  }

  private async requireRead(tenantId: TenantId, actorPersonId: string): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.VALIDATION_POLICY_READ,
      { scopeType: 'TENANT' }
    );
    if (!evaluation.allowed) {
      throw new ValidationPolicyAdministrationReadError(evaluation.reason, 'PERMISSION_DENIED');
    }
  }
}
