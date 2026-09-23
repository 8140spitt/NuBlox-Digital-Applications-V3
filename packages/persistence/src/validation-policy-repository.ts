import {
  createMappingPolicy,
  createRelationshipConstraintPolicy,
  createValidationRuleDefinition,
  createValidationRuleSet,
  createValidationRuleSetMember,
  type MappingPolicy,
  type RelationshipConstraintPolicy,
  type TenantId,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
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

  async hasCanonicalObject(tenantId: TenantId, objectId: string): Promise<boolean> {
    const [rows] = await this.pool.execute<IdRow[]>(
      'SELECT id FROM canonical_objects WHERE tenant_id = ? AND id = ?',
      [tenantId, objectId]
    );
    return Boolean(rows[0]);
  }
}
