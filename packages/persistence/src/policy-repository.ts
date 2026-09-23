import {
  createPolicyAssignment,
  createPolicyDefinition,
  createPolicyScope,
  isPolicyAssignmentEffective,
  resolveEffectivePolicySet,
  type EffectivePolicySet,
  type PolicyAssignment,
  type PolicyDefinition,
  type PolicyResolutionCandidate,
  type PolicyScope,
  type PolicyScopeId,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface PolicyScopeRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  parent_policy_scope_id: string | null;
  scope_type: PolicyScope['scopeType'];
  scope_object_id: string | null;
  code: string;
  name: string;
  status: PolicyScope['status'];
}

interface PolicyDefinitionRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description: string | null;
  policy_type: PolicyDefinition['policyType'];
  version: number;
  effective_from: Date | null;
  effective_to: Date | null;
  status: PolicyDefinition['status'];
}

interface PolicyAssignmentRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  policy_scope_id: string;
  policy_definition_id: string;
  assignment_mode: PolicyAssignment['assignmentMode'];
  precedence: number;
  effective_from: Date;
  effective_to: Date | null;
  status: PolicyAssignment['status'];
}

function databaseDate(value: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date/time value: ${value}`);
  return date;
}

function mapPolicyScope(row: PolicyScopeRow): PolicyScope {
  return {
    id: row.id as PolicyScope['id'],
    tenantId: row.tenant_id as TenantId,
    ...(row.parent_policy_scope_id
      ? { parentPolicyScopeId: row.parent_policy_scope_id as PolicyScopeId }
      : {}),
    scopeType: row.scope_type,
    ...(row.scope_object_id ? { scopeObjectId: row.scope_object_id } : {}),
    code: row.code,
    name: row.name,
    status: row.status
  };
}

function mapPolicyDefinition(row: PolicyDefinitionRow): PolicyDefinition {
  return {
    id: row.id as PolicyDefinition['id'],
    tenantId: row.tenant_id as TenantId,
    code: row.code,
    name: row.name,
    ...(row.description ? { description: row.description } : {}),
    policyType: row.policy_type,
    version: row.version,
    ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

function mapPolicyAssignment(row: PolicyAssignmentRow): PolicyAssignment {
  return {
    id: row.id as PolicyAssignment['id'],
    tenantId: row.tenant_id as TenantId,
    policyScopeId: row.policy_scope_id as PolicyAssignment['policyScopeId'],
    policyDefinitionId: row.policy_definition_id as PolicyAssignment['policyDefinitionId'],
    assignmentMode: row.assignment_mode,
    precedence: row.precedence,
    effectiveFrom: row.effective_from.toISOString(),
    ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
    status: row.status
  };
}

async function writeAudit(
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

export class MySqlPolicyRepository {
  constructor(private readonly pool: Pool) {}

  async createPolicyScope(scope: PolicyScope, audit: AuditContext = {}): Promise<void> {
    createPolicyScope(scope);

    if (scope.parentPolicyScopeId) {
      const parent = await this.requirePolicyScope(scope.tenantId, scope.parentPolicyScopeId);
      if (parent.status !== 'ACTIVE') throw new Error('Parent Policy Scope must be active.');
    }

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO policy_scopes
          (id, tenant_id, parent_policy_scope_id, scope_type, scope_object_id,
           code, name, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          scope.id,
          scope.tenantId,
          scope.parentPolicyScopeId ?? null,
          scope.scopeType,
          scope.scopeObjectId ?? null,
          scope.code,
          scope.name,
          scope.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );

      await writeAudit(
        connection,
        scope.tenantId,
        'POLICY_SCOPE',
        scope.id,
        'CREATED',
        audit,
        scope
      );
    });
  }

  async createPolicyDefinition(
    definition: PolicyDefinition,
    audit: AuditContext = {}
  ): Promise<void> {
    createPolicyDefinition(definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO policy_definitions
          (id, tenant_id, code, name, description, policy_type, version,
           effective_from, effective_to, status, created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          definition.id,
          definition.tenantId,
          definition.code,
          definition.name,
          definition.description ?? null,
          definition.policyType,
          definition.version,
          definition.effectiveFrom ? databaseDate(definition.effectiveFrom) : null,
          definition.effectiveTo ? databaseDate(definition.effectiveTo) : null,
          definition.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );

      await writeAudit(
        connection,
        definition.tenantId,
        'POLICY_DEFINITION',
        definition.id,
        'CREATED',
        audit,
        definition
      );
    });
  }

  async assignPolicy(
    assignment: PolicyAssignment,
    audit: AuditContext = {}
  ): Promise<void> {
    const [scope, definition] = await Promise.all([
      this.requirePolicyScope(assignment.tenantId, assignment.policyScopeId),
      this.requirePolicyDefinition(assignment.tenantId, assignment.policyDefinitionId)
    ]);
    createPolicyAssignment(assignment, scope, definition);

    await withTransaction(this.pool, async (connection) => {
      await connection.execute(
        `INSERT INTO policy_assignments
          (id, tenant_id, policy_scope_id, policy_definition_id, assignment_mode,
           precedence, effective_from, effective_to, status,
           created_by_person_id, updated_by_person_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assignment.id,
          assignment.tenantId,
          assignment.policyScopeId,
          assignment.policyDefinitionId,
          assignment.assignmentMode,
          assignment.precedence,
          databaseDate(assignment.effectiveFrom),
          assignment.effectiveTo ? databaseDate(assignment.effectiveTo) : null,
          assignment.status,
          audit.actorPersonId ?? null,
          audit.actorPersonId ?? null
        ]
      );

      await writeAudit(
        connection,
        assignment.tenantId,
        'POLICY_ASSIGNMENT',
        assignment.id,
        'ASSIGNED',
        audit,
        assignment
      );
    });
  }

  async getPolicyScope(
    tenantId: TenantId,
    policyScopeId: PolicyScopeId
  ): Promise<PolicyScope | undefined> {
    const [rows] = await this.pool.execute<PolicyScopeRow[]>(
      `SELECT id, tenant_id, parent_policy_scope_id, scope_type, scope_object_id,
              code, name, status
         FROM policy_scopes
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, policyScopeId]
    );
    return rows[0] ? mapPolicyScope(rows[0]) : undefined;
  }

  async getPolicyDefinition(
    tenantId: TenantId,
    policyDefinitionId: PolicyDefinition['id']
  ): Promise<PolicyDefinition | undefined> {
    const [rows] = await this.pool.execute<PolicyDefinitionRow[]>(
      `SELECT id, tenant_id, code, name, description, policy_type, version,
              effective_from, effective_to, status
         FROM policy_definitions
        WHERE tenant_id = ? AND id = ?`,
      [tenantId, policyDefinitionId]
    );
    return rows[0] ? mapPolicyDefinition(rows[0]) : undefined;
  }

  async listApplicablePolicyAssignments(
    tenantId: TenantId,
    policyScopeId: PolicyScopeId,
    evaluatedAt = new Date().toISOString()
  ): Promise<PolicyResolutionCandidate[]> {
    databaseDate(evaluatedAt);

    const lineage: PolicyScope[] = [];
    const visited = new Set<string>();
    let current = await this.requirePolicyScope(tenantId, policyScopeId);

    while (true) {
      if (visited.has(current.id)) {
        throw new Error('Policy Scope hierarchy contains a cycle.');
      }
      visited.add(current.id);
      lineage.push(current);

      if (!current.parentPolicyScopeId) break;
      current = await this.requirePolicyScope(tenantId, current.parentPolicyScopeId);

      if (lineage.length >= 64) {
        throw new Error('Policy Scope hierarchy exceeds supported depth.');
      }
    }

    const results: PolicyResolutionCandidate[] = [];

    for (let scopeDepth = 0; scopeDepth < lineage.length; scopeDepth += 1) {
      const scope = lineage[scopeDepth];
      if (!scope) continue;

      const [rows] = await this.pool.execute<PolicyAssignmentRow[]>(
        `SELECT id, tenant_id, policy_scope_id, policy_definition_id, assignment_mode,
                precedence, effective_from, effective_to, status
           FROM policy_assignments
          WHERE tenant_id = ?
            AND policy_scope_id = ?
            AND status = 'ACTIVE'
            AND effective_from <= ?
            AND (effective_to IS NULL OR effective_to >= ?)
          ORDER BY precedence DESC, id`,
        [tenantId, scope.id, databaseDate(evaluatedAt), databaseDate(evaluatedAt)]
      );

      for (const row of rows) {
        const assignment = mapPolicyAssignment(row);
        if (!isPolicyAssignmentEffective(assignment, evaluatedAt)) continue;

        const definition = await this.requirePolicyDefinition(
          tenantId,
          assignment.policyDefinitionId
        );
        if (definition.status !== 'ACTIVE') continue;
        if (
          definition.effectiveFrom &&
          Date.parse(definition.effectiveFrom) > Date.parse(evaluatedAt)
        ) {
          continue;
        }
        if (
          definition.effectiveTo &&
          Date.parse(definition.effectiveTo) < Date.parse(evaluatedAt)
        ) {
          continue;
        }

        results.push({ assignment, definition, scopeDepth });
      }
    }

    return results.sort(
      (a, b) =>
        b.scopeDepth - a.scopeDepth ||
        b.assignment.precedence - a.assignment.precedence ||
        a.assignment.id.localeCompare(b.assignment.id)
    );
  }

  async resolveEffectivePolicies(
    tenantId: TenantId,
    policyScopeId: PolicyScopeId,
    evaluatedAt = new Date().toISOString()
  ): Promise<EffectivePolicySet> {
    const candidates = await this.listApplicablePolicyAssignments(
      tenantId,
      policyScopeId,
      evaluatedAt
    );
    return resolveEffectivePolicySet(candidates);
  }

  private async requirePolicyScope(
    tenantId: TenantId,
    policyScopeId: PolicyScopeId
  ): Promise<PolicyScope> {
    const scope = await this.getPolicyScope(tenantId, policyScopeId);
    if (!scope) throw new Error('Policy Scope not found in tenant.');
    return scope;
  }

  private async requirePolicyDefinition(
    tenantId: TenantId,
    policyDefinitionId: PolicyDefinition['id']
  ): Promise<PolicyDefinition> {
    const definition = await this.getPolicyDefinition(tenantId, policyDefinitionId);
    if (!definition) throw new Error('Policy Definition not found in tenant.');
    return definition;
  }
}
