import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createPolicyAssignment,
  createPolicyDefinition,
  createPolicyScope,
  isPolicyAssignmentEffective,
  type PolicyAssignment,
  type PolicyDefinition,
  type PolicyScope
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-POLICY', 'Tenant');

const tenantScope: PolicyScope = createPolicyScope({
  id: asId<'PolicyScopeId'>('POL-SCOPE-TENANT', 'Policy Scope'),
  tenantId,
  scopeType: 'TENANT',
  code: 'TENANT',
  name: 'Tenant policy scope',
  status: 'ACTIVE'
});

const policy: PolicyDefinition = createPolicyDefinition({
  id: asId<'PolicyDefinitionId'>('POL-DEF-ACCESS', 'Policy Definition'),
  tenantId,
  code: 'ACCESS-BASELINE',
  name: 'Access baseline',
  policyType: 'ACCESS',
  version: 1,
  effectiveFrom: '2026-09-23T00:00:00.000Z',
  status: 'ACTIVE'
});

describe('kernel policy governance invariants', () => {
  it('keeps TENANT scope distinct from object-bound scopes', () => {
    expect(tenantScope.scopeObjectId).toBeUndefined();

    expect(() =>
      createPolicyScope({
        id: asId<'PolicyScopeId'>('POL-SCOPE-BAD', 'Policy Scope'),
        tenantId,
        scopeType: 'PROJECT',
        code: 'PROJECT',
        name: 'Project scope without project',
        status: 'ACTIVE'
      })
    ).toThrow(KernelInvariantError);
  });

  it('prevents a Policy Scope from parenting itself', () => {
    const id = asId<'PolicyScopeId'>('POL-SCOPE-SELF', 'Policy Scope');

    expect(() =>
      createPolicyScope({
        id,
        tenantId,
        parentPolicyScopeId: id,
        scopeType: 'TENANT',
        code: 'SELF',
        name: 'Self parent',
        status: 'ACTIVE'
      })
    ).toThrow(KernelInvariantError);
  });

  it('requires positive versioned Policy Definitions', () => {
    expect(policy.version).toBe(1);

    expect(() =>
      createPolicyDefinition({
        ...policy,
        id: asId<'PolicyDefinitionId'>('POL-DEF-BAD', 'Policy Definition'),
        version: 0
      })
    ).toThrow(KernelInvariantError);
  });

  it('binds assignments to one tenant, scope and definition', () => {
    const assignment: PolicyAssignment = {
      id: asId<'PolicyAssignmentId'>('POL-ASG-1', 'Policy Assignment'),
      tenantId,
      policyScopeId: tenantScope.id,
      policyDefinitionId: policy.id,
      assignmentMode: 'SUPPLEMENT',
      precedence: 100,
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };

    expect(createPolicyAssignment(assignment, tenantScope, policy)).toEqual(assignment);
    expect(isPolicyAssignmentEffective(assignment, '2026-09-23T12:00:00.000Z')).toBe(true);
  });

  it('rejects invalid assignment periods and negative precedence', () => {
    const base: PolicyAssignment = {
      id: asId<'PolicyAssignmentId'>('POL-ASG-BAD', 'Policy Assignment'),
      tenantId,
      policyScopeId: tenantScope.id,
      policyDefinitionId: policy.id,
      assignmentMode: 'OVERRIDE',
      precedence: 0,
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };

    expect(() =>
      createPolicyAssignment({ ...base, precedence: -1 }, tenantScope, policy)
    ).toThrow(KernelInvariantError);

    expect(() =>
      createPolicyAssignment(
        {
          ...base,
          effectiveFrom: '2026-09-24T00:00:00.000Z',
          effectiveTo: '2026-09-23T00:00:00.000Z'
        },
        tenantScope,
        policy
      )
    ).toThrow(KernelInvariantError);
  });
});
