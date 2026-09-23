import {
  createMappingPolicy,
  createRelationshipConstraintPolicy,
  createValidationRuleDefinition,
  createValidationRuleSet,
  createValidationRuleSetMember,
  createValidationRuleEvaluationRun,
  createValidationRuleResult,
  createValidationConflict,
  dispositionValidationConflict,
  type MappingPolicy,
  type RelationshipConstraintPolicy,
  type TenantId,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember,
  type ValidationRuleEvaluationRun,
  type ValidationRuleResult,
  type ValidationConflict,
  type ValidationConflictStatus
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface IdRow extends RowDataPacket { id: string; }

interface RuleRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  rule_type: ValidationRuleDefinition['ruleType']; version: number;
  severity: ValidationRuleDefinition['severity']; handler_key: string;
  configuration: unknown; effective_from: Date | null; effective_to: Date | null;
  status: ValidationRuleDefinition['status'];
}

interface RuleSetRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; name: string; description: string | null;
  version: number; effective_from: Date | null; effective_to: Date | null;
  status: ValidationRuleSet['status'];
}

interface RuleSetMemberJoinRow extends RuleRow {
  member_id: string;
  rule_set_id: string;
  sequence_no: number;
  mandatory: number;
  member_status: ValidationRuleSetMember['status'];
}

interface EvaluationRunRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  rule_set_id: string;
  subject_object_id: string;
  subject_version: string | null;
  context_type: string | null;
  context_id: string | null;
  evaluated_at: Date;
  evaluation_status: ValidationRuleEvaluationRun['status'];
}

interface ConflictRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  evaluation_run_id: string;
  rule_result_id: string;
  subject_object_id: string;
  summary: string;
  conflict_status: ValidationConflict['status'];
  resolution_reason: string | null;
}

function dbDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}

function jsonObject(value: unknown): Readonly<Record<string, unknown>> | undefined {
  if (value === null || value === undefined) return undefined;
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected JSON object.');
  }
  return parsed as Readonly<Record<string, unknown>>;
}

function mapRule(row: RuleRow): ValidationRuleDefinition {
  const configuration = jsonObject(row.configuration);
  return {
    id: row.id as ValidationRuleDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    ruleType: row.rule_type,
    version: Number(row.version),
    severity: row.severity,
    handlerKey: row.handler_key,
    ...(configuration ? { configuration } : {}),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapRuleSet(row: RuleSetRow): ValidationRuleSet {
  return {
    id: row.id as ValidationRuleSet['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    version: Number(row.version),
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

async function evidence(
  connection: PoolConnection,
  tenantId: TenantId,
  entityType: string,
  entityId: string,
  action: string,
  audit: AuditContext,
  payload: unknown
): Promise<void> {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      tenantId,
      entityType,
      entityId,
      action,
      audit.actorPersonId ?? null,
      audit.correlationId ?? null,
      JSON.stringify(payload)
    ]
  );

  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

export class MySqlValidationPolicyRepository {
  constructor(private readonly pool: Pool) {}

  async createRuleDefinition(
    rule: ValidationRuleDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createValidationRuleDefinition(rule);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_rule_definitions
          (id, tenant_id, code, name, description, rule_type, version, severity,
           handler_key, configuration, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rule.id, rule.tenantId, rule.code, rule.name, rule.description ?? null,
          rule.ruleType, rule.version, rule.severity, rule.handlerKey,
          rule.configuration ? JSON.stringify(rule.configuration) : null,
          rule.effectiveFrom ? dbDate(rule.effectiveFrom) : null,
          rule.effectiveTo ? dbDate(rule.effectiveTo) : null,
          rule.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, rule.tenantId, 'VALIDATION_RULE_DEFINITION', rule.id, 'CREATED', audit, rule);
    });
  }

  async createRuleSet(ruleSet: ValidationRuleSet, audit: AuditContext = {}): Promise<void> {
    createValidationRuleSet(ruleSet);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_rule_sets
          (id, tenant_id, code, name, description, version, effective_from, effective_to,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ruleSet.id, ruleSet.tenantId, ruleSet.code, ruleSet.name, ruleSet.description ?? null,
          ruleSet.version, ruleSet.effectiveFrom ? dbDate(ruleSet.effectiveFrom) : null,
          ruleSet.effectiveTo ? dbDate(ruleSet.effectiveTo) : null, ruleSet.status,
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, ruleSet.tenantId, 'VALIDATION_RULE_SET', ruleSet.id, 'CREATED', audit, ruleSet);
    });
  }

  async addRuleSetMember(member: ValidationRuleSetMember, audit: AuditContext = {}): Promise<void> {
    const [ruleSet, rule] = await Promise.all([
      this.requireRuleSet(member.tenantId, member.ruleSetId),
      this.requireRuleDefinition(member.tenantId, member.ruleDefinitionId)
    ]);
    createValidationRuleSetMember(member, ruleSet, rule);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_rule_set_members
          (id, tenant_id, rule_set_id, rule_definition_id, sequence_no, mandatory,
           status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          member.id, member.tenantId, member.ruleSetId, member.ruleDefinitionId,
          member.sequence, member.mandatory, member.status,
          audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, member.tenantId, 'VALIDATION_RULE_SET_MEMBER', member.id, 'ADDED', audit, member);
    });
  }

  async createRelationshipConstraintPolicy(
    policy: RelationshipConstraintPolicy,
    audit: AuditContext = {}
  ): Promise<void> {
    createRelationshipConstraintPolicy(policy);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO relationship_constraint_policies
          (id, tenant_id, code, name, relationship_type, source_object_type,
           target_object_type, version, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policy.id, policy.tenantId, policy.code, policy.name, policy.relationshipType,
          policy.sourceObjectType, policy.targetObjectType, policy.version,
          policy.effectiveFrom ? dbDate(policy.effectiveFrom) : null,
          policy.effectiveTo ? dbDate(policy.effectiveTo) : null,
          policy.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, policy.tenantId, 'RELATIONSHIP_CONSTRAINT_POLICY', policy.id, 'CREATED', audit, policy);
    });
  }

  async createMappingPolicy(policy: MappingPolicy, audit: AuditContext = {}): Promise<void> {
    createMappingPolicy(policy);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO mapping_policies
          (id, tenant_id, code, name, source_type, target_type, mapping, precedence,
           version, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          policy.id, policy.tenantId, policy.code, policy.name, policy.sourceType,
          policy.targetType, JSON.stringify(policy.mapping), policy.precedence, policy.version,
          policy.effectiveFrom ? dbDate(policy.effectiveFrom) : null,
          policy.effectiveTo ? dbDate(policy.effectiveTo) : null,
          policy.status, audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, policy.tenantId, 'MAPPING_POLICY', policy.id, 'CREATED', audit, policy);
    });
  }

  async getRuleDefinition(
    tenantId: TenantId,
    id: ValidationRuleDefinition['id']
  ): Promise<ValidationRuleDefinition | undefined> {
    const [rows] = await this.pool.execute<RuleRow[]>(
      `SELECT id, tenant_id, code, name, description, rule_type, version, severity,
              handler_key, configuration, effective_from, effective_to, status
         FROM validation_rule_definitions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapRule(rows[0]) : undefined;
  }

  async getRuleSet(
    tenantId: TenantId,
    id: ValidationRuleSet['id']
  ): Promise<ValidationRuleSet | undefined> {
    const [rows] = await this.pool.execute<RuleSetRow[]>(
      `SELECT id, tenant_id, code, name, description, version, effective_from, effective_to, status
         FROM validation_rule_sets
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    return rows[0] ? mapRuleSet(rows[0]) : undefined;
  }

  private async requireRuleDefinition(
    tenantId: TenantId,
    id: ValidationRuleDefinition['id']
  ): Promise<ValidationRuleDefinition> {
    const rule = await this.getRuleDefinition(tenantId, id);
    if (!rule) throw new Error('Validation Rule Definition not found in tenant.');
    return rule;
  }

  private async requireRuleSet(
    tenantId: TenantId,
    id: ValidationRuleSet['id']
  ): Promise<ValidationRuleSet> {
    const ruleSet = await this.getRuleSet(tenantId, id);
    if (!ruleSet) throw new Error('Validation Rule Set not found in tenant.');
    return ruleSet;
  }


  async getActiveRuleSetByCode(
    tenantId: TenantId,
    code: string,
    evaluatedAt: string
  ): Promise<ValidationRuleSet | undefined> {
    const at = dbDate(evaluatedAt);
    const [rows] = await this.pool.execute<RuleSetRow[]>(
      `SELECT id, tenant_id, code, name, description, version, effective_from, effective_to, status
         FROM validation_rule_sets
        WHERE tenant_id = ? AND code = ? AND status = 'ACTIVE'
          AND (effective_from IS NULL OR effective_from <= ?)
          AND (effective_to IS NULL OR effective_to >= ?)
        ORDER BY version DESC
        LIMIT 1`,
      [tenantId, code.toUpperCase(), at, at]
    );
    return rows[0] ? mapRuleSet(rows[0]) : undefined;
  }

  async listActiveRuleSetMembers(
    tenantId: TenantId,
    ruleSetId: ValidationRuleSet['id'],
    evaluatedAt: string
  ): Promise<Array<{ member: ValidationRuleSetMember; rule: ValidationRuleDefinition }>> {
    const at = dbDate(evaluatedAt);
    const [rows] = await this.pool.execute<RuleSetMemberJoinRow[]>(
      `SELECT m.id AS member_id, m.rule_set_id, m.sequence_no, m.mandatory,
              m.status AS member_status,
              r.id, r.tenant_id, r.code, r.name, r.description, r.rule_type,
              r.version, r.severity, r.handler_key, r.configuration,
              r.effective_from, r.effective_to, r.status
         FROM validation_rule_set_members m
         JOIN validation_rule_definitions r
           ON r.tenant_id = m.tenant_id AND r.id = m.rule_definition_id
        WHERE m.tenant_id = ? AND m.rule_set_id = ?
          AND m.status = 'ACTIVE' AND r.status = 'ACTIVE'
          AND (r.effective_from IS NULL OR r.effective_from <= ?)
          AND (r.effective_to IS NULL OR r.effective_to >= ?)
        ORDER BY m.sequence_no ASC, r.code ASC, r.version DESC`,
      [tenantId, ruleSetId, at, at]
    );
    return rows.map((row) => ({
      member: {
        id: row.member_id as ValidationRuleSetMember['id'],
        tenantId: row.tenant_id as TenantId,
        ruleSetId: row.rule_set_id as ValidationRuleSetMember['ruleSetId'],
        ruleDefinitionId: row.id as ValidationRuleSetMember['ruleDefinitionId'],
        sequence: Number(row.sequence_no),
        mandatory: Boolean(row.mandatory),
        status: row.member_status
      },
      rule: mapRule(row)
    }));
  }

  async createEvaluationRun(
    run: ValidationRuleEvaluationRun,
    audit: AuditContext = {}
  ): Promise<void> {
    createValidationRuleEvaluationRun(run);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_rule_evaluation_runs
          (id, tenant_id, rule_set_id, subject_object_id, subject_version,
           context_type, context_id, evaluated_at, evaluation_status, created_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          run.id, run.tenantId, run.ruleSetId, run.subjectObjectId,
          run.subjectVersion ?? null, run.contextType ?? null, run.contextId ?? null,
          dbDate(run.evaluatedAt), run.status, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, run.tenantId, 'VALIDATION_EVALUATION_RUN', run.id, 'STARTED', audit, run);
    });
  }

  async completeEvaluationRun(
    tenantId: TenantId,
    runId: ValidationRuleEvaluationRun['id'],
    status: Exclude<ValidationRuleEvaluationRun['status'], 'RUNNING'>,
    audit: AuditContext = {}
  ): Promise<void> {
    await withTransaction(this.pool, async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE validation_rule_evaluation_runs
            SET evaluation_status = ?
          WHERE tenant_id = ? AND id = ? AND evaluation_status = 'RUNNING'`,
        [status, tenantId, runId]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Validation Evaluation Run was not found in RUNNING state.');
      }
      await evidence(connection, tenantId, 'VALIDATION_EVALUATION_RUN', runId, 'COMPLETED', audit, { status });
    });
  }

  async createRuleResult(
    result: ValidationRuleResult,
    audit: AuditContext = {}
  ): Promise<void> {
    createValidationRuleResult(result);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_rule_results
          (id, tenant_id, evaluation_run_id, rule_definition_id, result_status, message, evidence)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          result.id, result.tenantId, result.evaluationRunId, result.ruleDefinitionId,
          result.status, result.message ?? null,
          result.evidence ? JSON.stringify(result.evidence) : null
        ]
      );
      await evidence(connection, result.tenantId, 'VALIDATION_RULE_RESULT', result.id, 'RECORDED', audit, result);
    });
  }

  async createConflict(
    conflict: ValidationConflict,
    audit: AuditContext = {}
  ): Promise<void> {
    createValidationConflict(conflict);
    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO validation_conflicts
          (id, tenant_id, evaluation_run_id, rule_result_id, subject_object_id,
           summary, conflict_status, resolution_reason, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          conflict.id, conflict.tenantId, conflict.evaluationRunId, conflict.ruleResultId,
          conflict.subjectObjectId, conflict.summary, conflict.status,
          conflict.resolutionReason ?? null, audit.actorPersonId ?? null, audit.actorPersonId ?? null
        ]
      );
      await evidence(connection, conflict.tenantId, 'VALIDATION_CONFLICT', conflict.id, 'OPENED', audit, conflict);
    });
  }

  async getConflict(
    tenantId: TenantId,
    conflictId: ValidationConflict['id']
  ): Promise<ValidationConflict | undefined> {
    const [rows] = await this.pool.execute<ConflictRow[]>(
      `SELECT id, tenant_id, evaluation_run_id, rule_result_id, subject_object_id,
              summary, conflict_status, resolution_reason
         FROM validation_conflicts
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, conflictId]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id as ValidationConflict['id'],
      tenantId: row.tenant_id as TenantId,
      evaluationRunId: row.evaluation_run_id as ValidationConflict['evaluationRunId'],
      ruleResultId: row.rule_result_id as ValidationConflict['ruleResultId'],
      subjectObjectId: row.subject_object_id as ValidationConflict['subjectObjectId'],
      summary: row.summary,
      status: row.conflict_status,
      ...(row.resolution_reason ? { resolutionReason: row.resolution_reason } : {})
    };
  }

  async dispositionConflict(
    tenantId: TenantId,
    conflictId: ValidationConflict['id'],
    status: Exclude<ValidationConflictStatus, 'OPEN'>,
    resolutionReason: string,
    audit: AuditContext = {}
  ): Promise<ValidationConflict> {
    const existing = await this.getConflict(tenantId, conflictId);
    if (!existing) throw new Error('Validation Conflict not found in tenant.');
    const updated = dispositionValidationConflict(existing, status, resolutionReason);
    await withTransaction(this.pool, async (connection) => {
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE validation_conflicts
            SET conflict_status = ?, resolution_reason = ?, updated_by_person_id = ?
          WHERE tenant_id = ? AND id = ? AND conflict_status = 'OPEN'`,
        [updated.status, updated.resolutionReason ?? null, audit.actorPersonId ?? null, tenantId, conflictId]
      );
      if (result.affectedRows !== 1) {
        throw new Error('Validation Conflict is no longer OPEN.');
      }
      await evidence(connection, tenantId, 'VALIDATION_CONFLICT', conflictId, 'DISPOSITIONED', audit, updated);
    });
    return updated;
  }

  async getEvaluationRun(
    tenantId: TenantId,
    runId: ValidationRuleEvaluationRun['id']
  ): Promise<ValidationRuleEvaluationRun | undefined> {
    const [rows] = await this.pool.execute<EvaluationRunRow[]>(
      `SELECT id, tenant_id, rule_set_id, subject_object_id, subject_version,
              context_type, context_id, evaluated_at, evaluation_status
         FROM validation_rule_evaluation_runs
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, runId]
    );
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id as ValidationRuleEvaluationRun['id'],
      tenantId: row.tenant_id as TenantId,
      ruleSetId: row.rule_set_id as ValidationRuleEvaluationRun['ruleSetId'],
      subjectObjectId: row.subject_object_id as ValidationRuleEvaluationRun['subjectObjectId'],
      ...(row.subject_version ? { subjectVersion: row.subject_version } : {}),
      ...(row.context_type ? { contextType: row.context_type } : {}),
      ...(row.context_id ? { contextId: row.context_id } : {}),
      evaluatedAt: row.evaluated_at.toISOString(),
      status: row.evaluation_status
    };
  }

  async hasCanonicalObject(tenantId: TenantId, objectId: string): Promise<boolean> {
    const [rows] = await this.pool.execute<IdRow[]>(
      'SELECT id FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, objectId]
    );
    return Boolean(rows[0]);
  }
}
