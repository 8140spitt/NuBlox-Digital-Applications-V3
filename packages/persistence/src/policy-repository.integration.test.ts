import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type PolicyAssignment,
  type PolicyDefinition,
  type PolicyScope,
  type Tenant
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlPolicyRepository } from './policy-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL policy governance runtime', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('resolves inherited policy with local override/block and retains audit/outbox evidence', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-POLICY-${suffix}`, 'Tenant');
    const otherTenantId = asId<'TenantId'>(`TENANT-POLICY-OTHER-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const policies = new MySqlPolicyRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Policy Governance Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const rootScope: PolicyScope = {
      id: asId<'PolicyScopeId'>(`POL-SCOPE-ROOT-${suffix}`, 'Policy Scope'),
      tenantId,
      scopeType: 'TENANT',
      code: `TENANT-${suffix}`,
      name: 'Tenant policy scope',
      status: 'ACTIVE'
    };
    await policies.createPolicyScope(rootScope);

    const projectScope: PolicyScope = {
      id: asId<'PolicyScopeId'>(`POL-SCOPE-PROJECT-${suffix}`, 'Policy Scope'),
      tenantId,
      parentPolicyScopeId: rootScope.id,
      scopeType: 'PROJECT',
      scopeObjectId: `PROJECT-${suffix}`,
      code: `PROJECT-${suffix}`,
      name: 'Project policy scope',
      status: 'ACTIVE'
    };
    await policies.createPolicyScope(projectScope);

    const accessV1: PolicyDefinition = {
      id: asId<'PolicyDefinitionId'>(`POL-ACCESS-V1-${suffix}`, 'Policy Definition'),
      tenantId,
      code: `ACCESS-BASELINE-${suffix}`,
      name: 'Access baseline',
      policyType: 'ACCESS',
      version: 1,
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    };
    const accessV2: PolicyDefinition = {
      ...accessV1,
      id: asId<'PolicyDefinitionId'>(`POL-ACCESS-V2-${suffix}`, 'Policy Definition'),
      version: 2
    };
    const security: PolicyDefinition = {
      id: asId<'PolicyDefinitionId'>(`POL-SECURITY-${suffix}`, 'Policy Definition'),
      tenantId,
      code: `SECURITY-BASELINE-${suffix}`,
      name: 'Security baseline',
      policyType: 'SECURITY',
      version: 1,
      effectiveFrom: '2026-09-01T00:00:00.000Z',
      status: 'ACTIVE'
    };

    await policies.createPolicyDefinition(accessV1);
    await policies.createPolicyDefinition(accessV2);
    await policies.createPolicyDefinition(security);

    const assignments: PolicyAssignment[] = [
      {
        id: asId<'PolicyAssignmentId'>(`POL-ASG-ACCESS-V1-${suffix}`, 'Policy Assignment'),
        tenantId,
        policyScopeId: rootScope.id,
        policyDefinitionId: accessV1.id,
        assignmentMode: 'SUPPLEMENT',
        precedence: 10,
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      {
        id: asId<'PolicyAssignmentId'>(`POL-ASG-SECURITY-${suffix}`, 'Policy Assignment'),
        tenantId,
        policyScopeId: rootScope.id,
        policyDefinitionId: security.id,
        assignmentMode: 'SUPPLEMENT',
        precedence: 10,
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      {
        id: asId<'PolicyAssignmentId'>(`POL-ASG-ACCESS-V2-${suffix}`, 'Policy Assignment'),
        tenantId,
        policyScopeId: projectScope.id,
        policyDefinitionId: accessV2.id,
        assignmentMode: 'OVERRIDE',
        precedence: 20,
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      },
      {
        id: asId<'PolicyAssignmentId'>(`POL-ASG-SECURITY-BLOCK-${suffix}`, 'Policy Assignment'),
        tenantId,
        policyScopeId: projectScope.id,
        policyDefinitionId: security.id,
        assignmentMode: 'BLOCK',
        precedence: 30,
        effectiveFrom: '2026-09-01T00:00:00.000Z',
        status: 'ACTIVE'
      }
    ];

    for (const assignment of assignments) {
      await policies.assignPolicy(assignment);
    }

    const candidates = await policies.listApplicablePolicyAssignments(
      tenantId,
      projectScope.id,
      '2026-09-23T12:00:00.000Z'
    );
    expect(candidates).toHaveLength(4);
    expect(candidates.some((item) => item.scopeDepth === 1)).toBe(true);
    expect(candidates.some((item) => item.scopeDepth === 0)).toBe(true);

    const resolved = await policies.resolveEffectivePolicies(
      tenantId,
      projectScope.id,
      '2026-09-23T12:00:00.000Z'
    );

    expect(resolved.active).toHaveLength(1);
    expect(resolved.active[0]?.definition.id).toBe(accessV2.id);
    expect(resolved.blocked).toHaveLength(1);
    expect(resolved.blocked[0]?.definition.id).toBe(security.id);

    expect(await policies.getPolicyScope(otherTenantId, rootScope.id)).toBeUndefined();

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND entity_type IN ('POLICY_SCOPE', 'POLICY_DEFINITION', 'POLICY_ASSIGNMENT')`,
      [tenantId]
    );

    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ entity_type: 'POLICY_SCOPE', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'POLICY_DEFINITION', action: 'CREATED' }),
        expect.objectContaining({ entity_type: 'POLICY_ASSIGNMENT', action: 'ASSIGNED' })
      ])
    );

    const [outboxRows] = await pool.query(
      `SELECT aggregate_type, event_type
         FROM outbox_messages
        WHERE tenant_id = ?
          AND aggregate_type IN ('POLICY_SCOPE', 'POLICY_DEFINITION', 'POLICY_ASSIGNMENT')`,
      [tenantId]
    );

    expect(outboxRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          aggregate_type: 'POLICY_SCOPE',
          event_type: 'POLICY_SCOPE.CREATED'
        }),
        expect.objectContaining({
          aggregate_type: 'POLICY_DEFINITION',
          event_type: 'POLICY_DEFINITION.CREATED'
        }),
        expect.objectContaining({
          aggregate_type: 'POLICY_ASSIGNMENT',
          event_type: 'POLICY_ASSIGNMENT.ASSIGNED'
        })
      ])
    );
  });
});
