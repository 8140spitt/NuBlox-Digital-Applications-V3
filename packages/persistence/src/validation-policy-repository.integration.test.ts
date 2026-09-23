import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  asId,
  type MappingPolicy,
  type RelationshipConstraintPolicy,
  type Tenant,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember
} from '@nublox/kernel';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlValidationPolicyRepository } from './validation-policy-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('MySQL validation policy repository', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('persists versioned rule catalogue, rule-set membership, constraints and mappings', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = Date.now().toString(36);
    const tenantId = asId<'TenantId'>(`TENANT-VALIDATION-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const validation = new MySqlValidationPolicyRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Validation Policy Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const rule: ValidationRuleDefinition = {
      id: asId<'ValidationRuleDefinitionId'>(`VRD-${suffix}`, 'Validation Rule Definition'),
      tenantId,
      code: `RELEASE-${suffix}`,
      name: 'Release state validation',
      ruleType: 'STATE',
      version: 1,
      severity: 'BLOCKING',
      handlerKey: 'lifecycle.required_state',
      configuration: { allowedStates: ['RELEASED'] },
      status: 'ACTIVE'
    };
    await validation.createRuleDefinition(rule);

    const ruleSet: ValidationRuleSet = {
      id: asId<'ValidationRuleSetId'>(`VRS-${suffix}`, 'Validation Rule Set'),
      tenantId,
      code: `GATE-${suffix}`,
      name: 'Release gate',
      version: 1,
      status: 'ACTIVE'
    };
    await validation.createRuleSet(ruleSet);

    const member: ValidationRuleSetMember = {
      id: asId<'ValidationRuleSetMemberId'>(`VRM-${suffix}`, 'Validation Rule Set Member'),
      tenantId,
      ruleSetId: ruleSet.id,
      ruleDefinitionId: rule.id,
      sequence: 10,
      mandatory: true,
      status: 'ACTIVE'
    };
    await validation.addRuleSetMember(member);

    const constraint: RelationshipConstraintPolicy = {
      id: asId<'RelationshipConstraintPolicyId'>(`RCP-${suffix}`, 'Relationship Constraint Policy'),
      tenantId,
      code: `CHANGE-AFFECTS-${suffix}`,
      name: 'Change affected object policy',
      relationshipType: 'CHANGE_AFFECTS',
      sourceObjectType: 'CHANGE',
      targetObjectType: 'INFORMATION_CONTAINER',
      version: 1,
      status: 'ACTIVE'
    };
    await validation.createRelationshipConstraintPolicy(constraint);

    const mapping: MappingPolicy = {
      id: asId<'MappingPolicyId'>(`MAP-${suffix}`, 'Mapping Policy'),
      tenantId,
      code: `INTENT-STATE-${suffix}`,
      name: 'Change intent to state',
      sourceType: 'CHANGE_INTENT',
      targetType: 'LIFECYCLE_STATE',
      mapping: { RELEASE: 'RELEASED' },
      precedence: 100,
      version: 1,
      status: 'ACTIVE'
    };
    await validation.createMappingPolicy(mapping);

    expect((await validation.getRuleDefinition(tenantId, rule.id))?.handlerKey)
      .toBe('lifecycle.required_state');
    expect((await validation.getRuleSet(tenantId, ruleSet.id))?.code)
      .toBe(ruleSet.code);

    await expect(validation.addRuleSetMember({
      ...member,
      id: asId<'ValidationRuleSetMemberId'>(`VRM-DUP-${suffix}`, 'Validation Rule Set Member')
    })).rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
  });
});
