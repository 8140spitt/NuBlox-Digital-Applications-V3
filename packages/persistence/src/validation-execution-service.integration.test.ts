import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Party,
  type Person,
  type Tenant,
  type ValidationRuleDefinition,
  type ValidationRuleSet,
  type ValidationRuleSetMember
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';
import {
  MySqlValidationExecutionService,
  ValidationExecutionCommandError
} from './validation-execution-service.js';
import { MySqlValidationPolicyRepository } from './validation-policy-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('validation execution service', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('executes ordered rules, persists conflicts and permission-gates disposition', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-VALIDATION-EXEC-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const policies = new MySqlValidationPolicyRepository(pool);
    const execution = new MySqlValidationExecutionService(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Validation Execution Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    async function createPerson(label: string): Promise<Person> {
      const party: Party = {
        id: asId<'PartyId'>('PARTY-' + label + '-' + suffix, 'Party'),
        tenantId,
        kind: 'PERSON',
        displayName: label,
        status: 'ACTIVE'
      };
      await kernel.createParty(tenantId, party);
      const person: Person = {
        id: asId<'PersonId'>('PERSON-' + label + '-' + suffix, 'Person'),
        tenantId,
        partyId: party.id,
        legalName: label,
        status: 'ACTIVE'
      };
      await kernel.createPerson(tenantId, person);
      return person;
    }

    const admin = await createPerson('Validation-Administrator');
    const worker = await createPerson('Validation-Worker');

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ARA-VALIDATION-EXEC-' + suffix, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'VALIDATION-EXECUTION-TEST'
    });

    const subject: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-VALIDATION-' + suffix, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'VALIDATION:' + suffix,
      createdAt: new Date().toISOString()
    };
    await kernel.createCanonicalObject(tenantId, subject, {
      actorPersonId: admin.id,
      correlationId: 'VALIDATION-EXECUTION-TEST'
    });

    const blockingRule: ValidationRuleDefinition = {
      id: asId<'ValidationRuleDefinitionId'>('VRD-BLOCK-' + suffix, 'Validation Rule Definition'),
      tenantId,
      code: 'BLOCK-' + suffix,
      name: 'Blocking validation rule',
      ruleType: 'REQUIRED_DATA',
      version: 1,
      severity: 'BLOCKING',
      handlerKey: 'subject.required_fields',
      configuration: { fields: ['releaseEvidence'] },
      status: 'ACTIVE'
    };
    await policies.createRuleDefinition(blockingRule, {
      actorPersonId: admin.id,
      correlationId: 'VALIDATION-EXECUTION-TEST'
    });

    const ruleSet: ValidationRuleSet = {
      id: asId<'ValidationRuleSetId'>('VRS-EXEC-' + suffix, 'Validation Rule Set'),
      tenantId,
      code: 'EXECUTION-GATE-' + suffix,
      name: 'Execution gate',
      version: 1,
      status: 'ACTIVE'
    };
    await policies.createRuleSet(ruleSet, {
      actorPersonId: admin.id,
      correlationId: 'VALIDATION-EXECUTION-TEST'
    });

    const member: ValidationRuleSetMember = {
      id: asId<'ValidationRuleSetMemberId'>('VRM-EXEC-' + suffix, 'Validation Rule Set Member'),
      tenantId,
      ruleSetId: ruleSet.id,
      ruleDefinitionId: blockingRule.id,
      sequence: 10,
      mandatory: true,
      status: 'ACTIVE'
    };
    await policies.addRuleSetMember(member, {
      actorPersonId: admin.id,
      correlationId: 'VALIDATION-EXECUTION-TEST'
    });

    await expect(
      execution.executeRuleSet(tenantId, worker.id, {
        ruleSetCode: ruleSet.code,
        subjectObjectId: subject.id,
        subject: {}
      })
    ).rejects.toMatchObject({
      name: 'ValidationExecutionCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ValidationExecutionCommandError>);

    const outcome = await execution.executeRuleSet(tenantId, admin.id, {
      ruleSetCode: ruleSet.code,
      subjectObjectId: subject.id,
      subjectVersion: 'A',
      contextType: 'COMMAND',
      contextId: 'TEST_RELEASE',
      subject: { objectType: 'INFORMATION_CONTAINER' }
    });

    expect(outcome.configured).toBe(true);
    expect(outcome.blocked).toBe(true);
    expect(outcome.run?.status).toBe('FAILED');
    expect(outcome.results).toHaveLength(1);
    expect(outcome.results[0]?.status).toBe('FAILED');
    expect(outcome.conflicts).toHaveLength(1);
    expect((await policies.getEvaluationRun(tenantId, outcome.run!.id))?.status).toBe('FAILED');

    await expect(
      execution.dispositionConflict(tenantId, worker.id, {
        conflictId: outcome.conflicts[0]!.id,
        status: 'WAIVED',
        resolutionReason: 'Worker may not waive this conflict.'
      })
    ).rejects.toMatchObject({
      name: 'ValidationExecutionCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ValidationExecutionCommandError>);

    const waived = await execution.dispositionConflict(tenantId, admin.id, {
      conflictId: outcome.conflicts[0]!.id,
      status: 'WAIVED',
      resolutionReason: 'Approved test exception.'
    });
    expect(waived.status).toBe('WAIVED');
    expect(waived.resolutionReason).toBe('Approved test exception.');
  });
});
