import {
  PLATFORM_PERMISSION_KEYS,
  type EffectivePolicySet,
  type PolicyAssignmentMode,
  type PolicyScopeId,
  type PolicyScopeType,
  type PolicyType,
  type TenantId
} from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlPolicyRepository } from './policy-repository.js';

interface ScopeRow extends RowDataPacket {
  id: string;
  parent_policy_scope_id: string | null;
  scope_type: PolicyScopeType;
  scope_object_id: string | null;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface DefinitionRow extends RowDataPacket {
  id: string;
  code: string;
  name: string;
  description: string | null;
  policy_type: PolicyType;
  version: number;
  effective_from: Date | null;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

interface AssignmentRow extends RowDataPacket {
  id: string;
  policy_scope_id: string;
  scope_code: string;
  scope_name: string;
  policy_definition_id: string;
  definition_code: string;
  definition_name: string;
  policy_type: PolicyType;
  version: number;
  assignment_mode: PolicyAssignmentMode;
  precedence: number;
  effective_from: Date;
  effective_to: Date | null;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PolicyScopeView {
  id: string;
  parentPolicyScopeId?: string;
  scopeType: PolicyScopeType;
  scopeObjectId?: string;
  code: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PolicyDefinitionView {
  id: string;
  code: string;
  name: string;
  description?: string;
  policyType: PolicyType;
  version: number;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PolicyAssignmentView {
  id: string;
  policyScopeId: string;
  scopeCode: string;
  scopeName: string;
  policyDefinitionId: string;
  definitionCode: string;
  definitionName: string;
  policyType: PolicyType;
  version: number;
  assignmentMode: PolicyAssignmentMode;
  precedence: number;
  effectiveFrom: string;
  effectiveTo?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PolicyAdministrationProjection {
  scopes: PolicyScopeView[];
  definitions: PolicyDefinitionView[];
  assignments: PolicyAssignmentView[];
}

export class PolicyAdministrationReadError extends Error {
  constructor(message: string, readonly code: 'PERMISSION_DENIED') {
    super(message);
    this.name = 'PolicyAdministrationReadError';
  }
}

export class MySqlPolicyAdministrationReadRepository {
  private readonly access: MySqlAccessRepository;
  private readonly policies: MySqlPolicyRepository;

  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
    this.policies = new MySqlPolicyRepository(pool);
  }

  async getProjection(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<PolicyAdministrationProjection> {
    await this.requireReadPolicy(tenantId, actorPersonId);

    const [scopeResult, definitionResult, assignmentResult] = await Promise.all([
      this.pool.execute<ScopeRow[]>(
        `SELECT id, parent_policy_scope_id, scope_type, scope_object_id,
                code, name, status
           FROM policy_scopes
          WHERE tenant_id = ?
          ORDER BY code, id`,
        [tenantId]
      ),
      this.pool.execute<DefinitionRow[]>(
        `SELECT id, code, name, description, policy_type, version,
                effective_from, effective_to, status
           FROM policy_definitions
          WHERE tenant_id = ?
          ORDER BY code, version DESC, id`,
        [tenantId]
      ),
      this.pool.execute<AssignmentRow[]>(
        `SELECT pa.id, pa.policy_scope_id, ps.code AS scope_code, ps.name AS scope_name,
                pa.policy_definition_id, pd.code AS definition_code,
                pd.name AS definition_name, pd.policy_type, pd.version,
                pa.assignment_mode, pa.precedence, pa.effective_from,
                pa.effective_to, pa.status
           FROM policy_assignments pa
           JOIN policy_scopes ps
             ON ps.tenant_id = pa.tenant_id AND ps.id = pa.policy_scope_id
           JOIN policy_definitions pd
             ON pd.tenant_id = pa.tenant_id AND pd.id = pa.policy_definition_id
          WHERE pa.tenant_id = ?
          ORDER BY ps.code, pa.precedence DESC, pd.code, pd.version DESC`,
        [tenantId]
      )
    ]);

    return {
      scopes: scopeResult[0].map((row) => ({
        id: row.id,
        ...(row.parent_policy_scope_id
          ? { parentPolicyScopeId: row.parent_policy_scope_id }
          : {}),
        scopeType: row.scope_type,
        ...(row.scope_object_id ? { scopeObjectId: row.scope_object_id } : {}),
        code: row.code,
        name: row.name,
        status: row.status
      })),
      definitions: definitionResult[0].map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        ...(row.description ? { description: row.description } : {}),
        policyType: row.policy_type,
        version: row.version,
        ...(row.effective_from ? { effectiveFrom: row.effective_from.toISOString() } : {}),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      })),
      assignments: assignmentResult[0].map((row) => ({
        id: row.id,
        policyScopeId: row.policy_scope_id,
        scopeCode: row.scope_code,
        scopeName: row.scope_name,
        policyDefinitionId: row.policy_definition_id,
        definitionCode: row.definition_code,
        definitionName: row.definition_name,
        policyType: row.policy_type,
        version: row.version,
        assignmentMode: row.assignment_mode,
        precedence: row.precedence,
        effectiveFrom: row.effective_from.toISOString(),
        ...(row.effective_to ? { effectiveTo: row.effective_to.toISOString() } : {}),
        status: row.status
      }))
    };
  }

  async getEffectivePolicySet(
    tenantId: TenantId,
    actorPersonId: string,
    policyScopeId: PolicyScopeId,
    evaluatedAt = new Date().toISOString()
  ): Promise<EffectivePolicySet> {
    await this.requireReadPolicy(tenantId, actorPersonId);
    return this.policies.resolveEffectivePolicies(
      tenantId,
      policyScopeId,
      evaluatedAt
    );
  }

  private async requireReadPolicy(
    tenantId: TenantId,
    actorPersonId: string
  ): Promise<void> {
    const evaluation = await this.access.evaluatePermission(
      tenantId,
      actorPersonId,
      PLATFORM_PERMISSION_KEYS.POLICY_READ,
      { scopeType: 'TENANT' }
    );

    if (!evaluation.allowed) {
      throw new PolicyAdministrationReadError(
        evaluation.reason,
        'PERMISSION_DENIED'
      );
    }
  }
}
