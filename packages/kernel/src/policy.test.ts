import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createPolicyAssignment,
  createPolicyDefinition,
  createPolicyScope,
  isPolicyAssignmentEffective,
  resolveEffectivePolicySet,
  type PolicyAssignment,
  type PolicyDefinition,
  type PolicyResolutionCandidate,
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

  it('resolves inherited supplement, override and block semantics deterministically', () => {
    const projectScopeId = asId<'PolicyScopeId'>('POL-SCOPE-PROJECT', 'Policy Scope');
    const accessV2 = createPolicyDefinition({
      ...policy,
      id: asId<'PolicyDefinitionId'>('POL-DEF-ACCESS-V2', 'Policy Definition'),
      version: 2
    });
    const securityPolicy = createPolicyDefinition({
      id: asId<'PolicyDefinitionId'>('POL-DEF-SECURITY', 'Policy Definition'),
      tenantId,
      code: 'SECURITY-BASELINE',
      name: 'Security baseline',
      policyType: 'SECURITY',
      version: 1,
      status: 'ACTIVE'
    });

    const candidates: PolicyResolutionCandidate[] = [
      {
        assignment: {
          id: asId<'PolicyAssignmentId'>('POL-ASG-ROOT-ACCESS', 'Policy Assignment'),
          tenantId,
          policyScopeId: tenantScope.id,
          policyDefinitionId: policy.id,
          assignmentMode: 'SUPPLEMENT',
          precedence: 10,
          effectiveFrom: '2026-09-23T00:00:00.000Z',
          status: 'ACTIVE'
        },
        definition: policy,
        scopeDepth: 2
      },
      {
        assignment: {
          id: asId<'PolicyAssignmentId'>('POL-ASG-ROOT-SEC', 'Policy Assignment'),
          tenantId,
          policyScopeId: tenantScope.id,
          policyDefinitionId: securityPolicy.id,
          assignmentMode: 'SUPPLEMENT',
          precedence: 10,
          effectiveFrom: '2026-09-23T00:00:00.000Z',
          status: 'ACTIVE'
        },
        definition: securityPolicy,
        scopeDepth: 2
      },
      {
        assignment: {
          id: asId<'PolicyAssignmentId'>('POL-ASG-PROJECT-ACCESS', 'Policy Assignment'),
          tenantId,
          policyScopeId: projectScopeId,
          policyDefinitionId: accessV2.id,
          assignmentMode: 'OVERRIDE',
          precedence: 20,
          effectiveFrom: '2026-09-23T00:00:00.000Z',
          status: 'ACTIVE'
        },
        definition: accessV2,
        scopeDepth: 0
      },
      {
        assignment: {
          id: asId<'PolicyAssignmentId'>('POL-ASG-PROJECT-SEC-BLOCK', 'Policy Assignment'),
          tenantId,
          policyScopeId: projectScopeId,
          policyDefinitionId: securityPolicy.id,
          assignmentMode: 'BLOCK',
          precedence: 30,
          effectiveFrom: '2026-09-23T00:00:00.000Z',
          status: 'ACTIVE'
        },
        definition: securityPolicy,
        scopeDepth: 0
      }
    ];

    const resolved = resolveEffectivePolicySet(candidates);

    expect(resolved.active).toHaveLength(1);
    expect(resolved.active[0]?.definition.id).toBe(accessV2.id);
    expect(resolved.blocked).toHaveLength(1);
    expect(resolved.blocked[0]?.definition.id).toBe(securityPolicy.id);
  });

  it('requires explicit OVERRIDE to re-enable a blocked inherited policy', () => {
    const scopeId = asId<'PolicyScopeId'>('POL-SCOPE-LOCAL', 'Policy Scope');
    const blockedAssignment: PolicyAssignment = {
      id: asId<'PolicyAssignmentId'>('POL-ASG-BLOCK', 'Policy Assignment'),
      tenantId,
      policyScopeId: tenantScope.id,
      policyDefinitionId: policy.id,
      assignmentMode: 'BLOCK',
      precedence: 10,
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    const supplementAssignment: PolicyAssignment = {
      ...blockedAssignment,
      id: asId<'PolicyAssignmentId'>('POL-ASG-SUPPLEMENT', 'Policy Assignment'),
      policyScopeId: scopeId,
      assignmentMode: 'SUPPLEMENT'
    };
    const overrideAssignment: PolicyAssignment = {
      ...supplementAssignment,
      id: asId<'PolicyAssignmentId'>('POL-ASG-OVERRIDE', 'Policy Assignment'),
      assignmentMode: 'OVERRIDE',
      precedence: 20
    };

    const blocked = resolveEffectivePolicySet([
      { assignment: blockedAssignment, definition: policy, scopeDepth: 1 },
      { assignment: supplementAssignment, definition: policy, scopeDepth: 0 }
    ]);
    expect(blocked.active).toHaveLength(0);
    expect(blocked.blocked).toHaveLength(1);

    const restored = resolveEffectivePolicySet([
      { assignment: blockedAssignment, definition: policy, scopeDepth: 1 },
      { assignment: overrideAssignment, definition: policy, scopeDepth: 0 }
    ]);
    expect(restored.active).toHaveLength(1);
    expect(restored.blocked).toHaveLength(0);
  });
});
