import { describe, expect, it } from 'vitest';
import {
  KernelInvariantError,
  asId,
  createMappingPolicy,
  createRelationshipConstraintPolicy,
  createValidationRuleDefinition,
  createValidationRuleSet,
  createValidationRuleSetMember,
  createDefaultValidationHandlerRegistry,
  executeValidationHandler,
  createValidationRuleEvaluationRun,
  createValidationRuleResult,
  createValidationConflict,
  dispositionValidationConflict,
  type ValidationRuleDefinition,
  type ValidationRuleSet
} from './index.js';

const tenantId = asId<'TenantId'>('TENANT-VALIDATION', 'Tenant');

const rule: ValidationRuleDefinition = createValidationRuleDefinition({
  id: asId<'ValidationRuleDefinitionId'>('VRD-1', 'Validation Rule Definition'),
  tenantId,
  code: 'RELEASE-STATE',
  name: 'Required release state',
  ruleType: 'STATE',
  version: 1,
  severity: 'BLOCKING',
  handlerKey: 'lifecycle.required_state',
  configuration: { allowedStates: ['RELEASED'] },
  effectiveFrom: '2026-09-23T00:00:00.000Z',
  status: 'ACTIVE'
});

const ruleSet: ValidationRuleSet = createValidationRuleSet({
  id: asId<'ValidationRuleSetId'>('VRS-1', 'Validation Rule Set'),
  tenantId,
  code: 'RELEASE-GATE',
  name: 'Release gate',
  version: 1,
  status: 'ACTIVE'
});

describe('kernel validation policy invariants', () => {
  it('requires versioned rules with explicit handlers', () => {
    expect(rule.version).toBe(1);
    expect(rule.handlerKey).toBe('lifecycle.required_state');

    expect(() => createValidationRuleDefinition({
      ...rule,
      id: asId<'ValidationRuleDefinitionId'>('VRD-BAD', 'Validation Rule Definition'),
      version: 0
    })).toThrow(KernelInvariantError);

    expect(() => createValidationRuleDefinition({
      ...rule,
      id: asId<'ValidationRuleDefinitionId'>('VRD-NO-HANDLER', 'Validation Rule Definition'),
      handlerKey: ' '
    })).toThrow(KernelInvariantError);
  });

  it('requires valid rule-set membership and deterministic sequence', () => {
    const member = createValidationRuleSetMember({
      id: asId<'ValidationRuleSetMemberId'>('VRM-1', 'Validation Rule Set Member'),
      tenantId,
      ruleSetId: ruleSet.id,
      ruleDefinitionId: rule.id,
      sequence: 10,
      mandatory: true,
      status: 'ACTIVE'
    }, ruleSet, rule);

    expect(member.sequence).toBe(10);
    expect(member.mandatory).toBe(true);

    expect(() => createValidationRuleSetMember({
      ...member,
      id: asId<'ValidationRuleSetMemberId'>('VRM-BAD', 'Validation Rule Set Member'),
      sequence: -1
    }, ruleSet, rule)).toThrow(KernelInvariantError);
  });

  it('keeps relationship constraints as governed versioned policy', () => {
    const constraint = createRelationshipConstraintPolicy({
      id: asId<'RelationshipConstraintPolicyId'>('RCP-1', 'Relationship Constraint Policy'),
      tenantId,
      code: 'CHANGE-AFFECTS',
      name: 'Change affected object constraint',
      relationshipType: 'CHANGE_AFFECTS',
      sourceObjectType: 'CHANGE',
      targetObjectType: 'INFORMATION_CONTAINER',
      version: 1,
      status: 'ACTIVE'
    });

    expect(constraint.relationshipType).toBe('CHANGE_AFFECTS');

    expect(() => createRelationshipConstraintPolicy({
      ...constraint,
      id: asId<'RelationshipConstraintPolicyId'>('RCP-BAD', 'Relationship Constraint Policy'),
      targetObjectType: ''
    })).toThrow(KernelInvariantError);
  });

  it('keeps mapping policy versioned and precedence controlled', () => {
    const mapping = createMappingPolicy({
      id: asId<'MappingPolicyId'>('MAP-1', 'Mapping Policy'),
      tenantId,
      code: 'CHANGE-INTENT-TO-STATE',
      name: 'Change intent to target state',
      sourceType: 'CHANGE_INTENT',
      targetType: 'LIFECYCLE_STATE',
      mapping: { RELEASE: 'RELEASED' },
      precedence: 100,
      version: 1,
      status: 'ACTIVE'
    });

    expect(mapping.mapping.RELEASE).toBe('RELEASED');

    expect(() => createMappingPolicy({
      ...mapping,
      id: asId<'MappingPolicyId'>('MAP-BAD', 'Mapping Policy'),
      precedence: -1
    })).toThrow(KernelInvariantError);
  });

  it('rejects invalid effective periods', () => {
    expect(() => createValidationRuleSet({
      ...ruleSet,
      id: asId<'ValidationRuleSetId'>('VRS-BAD', 'Validation Rule Set'),
      effectiveFrom: '2026-09-24T00:00:00.000Z',
      effectiveTo: '2026-09-23T00:00:00.000Z'
    })).toThrow(KernelInvariantError);
  });
  it('executes deterministic validation handlers and rejects unknown handlers', async () => {
    const registry = createDefaultValidationHandlerRegistry();
    const passed = await executeValidationHandler(registry, rule, {
      subject: { lifecycleState: 'RELEASED' }
    });
    expect(passed.status).toBe('PASSED');

    const failed = await executeValidationHandler(registry, rule, {
      subject: { lifecycleState: 'DRAFT' }
    });
    expect(failed.status).toBe('FAILED');

    const unknown = await executeValidationHandler(registry, {
      ...rule,
      id: asId<'ValidationRuleDefinitionId'>('VRD-UNKNOWN', 'Validation Rule Definition'),
      handlerKey: 'unknown.handler'
    }, { subject: {} });
    expect(unknown.status).toBe('ERROR');
  });

  it('governs evaluation evidence and conflict disposition', () => {
    const run = createValidationRuleEvaluationRun({
      id: asId<'ValidationRuleEvaluationRunId'>('VRE-1', 'Validation Rule Evaluation Run'),
      tenantId,
      ruleSetId: ruleSet.id,
      subjectObjectId: asId<'CanonicalObjectId'>('OBJ-1', 'Canonical Object'),
      evaluatedAt: '2026-09-23T12:00:00.000Z',
      status: 'RUNNING'
    });
    const result = createValidationRuleResult({
      id: asId<'ValidationRuleResultId'>('VRR-1', 'Validation Rule Result'),
      tenantId,
      evaluationRunId: run.id,
      ruleDefinitionId: rule.id,
      status: 'FAILED',
      message: 'State is not releasable.'
    });
    const conflict = createValidationConflict({
      id: asId<'ValidationConflictId'>('VRC-1', 'Validation Conflict'),
      tenantId,
      evaluationRunId: run.id,
      ruleResultId: result.id,
      subjectObjectId: run.subjectObjectId,
      summary: 'Release state conflict.',
      status: 'OPEN'
    });
    const waived = dispositionValidationConflict(
      conflict,
      'WAIVED',
      'Approved exception with evidence.'
    );
    expect(waived.status).toBe('WAIVED');
    expect(() => dispositionValidationConflict(
      waived,
      'RESOLVED',
      'Cannot disposition twice.'
    )).toThrow(KernelInvariantError);
  });
});
