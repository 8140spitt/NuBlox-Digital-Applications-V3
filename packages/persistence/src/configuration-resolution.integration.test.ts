import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type Baseline,
  type BaselineItem,
  type CanonicalObjectIdentity,
  type ConfigurationItem,
  type Decision,
  type Effectivity,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import {
  ConfigurationResolutionCommandError,
  MySqlConfigurationResolutionCommandService
} from './configuration-resolution-command-service.js';
import { MySqlConfigurationResolutionReadRepository } from './configuration-resolution-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlInformationRepository } from './information-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('configuration resolution', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('resolves exact versions from ordered baseline and effectivity criteria and retains conflicts', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>('TENANT-CONFIG-RES-' + suffix, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const information = new MySqlInformationRepository(pool);
    const control = new MySqlKernelControlRepository(pool);
    const service = new MySqlConfigurationResolutionCommandService(pool);
    const reads = new MySqlConfigurationResolutionReadRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Configuration Resolution Test',
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

    const admin = await createPerson('Configuration-Resolver');
    const worker = await createPerson('Configuration-Worker');

    const roleAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>('ARA-CONFIG-RES-' + suffix, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-23T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, roleAssignment, {
      actorPersonId: admin.id,
      correlationId: 'CONFIGURATION-RESOLUTION-TEST'
    });

    const context: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('PROJECT-' + suffix, 'Canonical Object'),
      tenantId,
      objectType: 'PROJECT',
      stableKey: 'PROJECT:' + suffix,
      createdAt: '2026-09-23T18:00:00.000Z'
    };
    const objectOne: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-CI-ONE-' + suffix, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'CONFIG-ONE:' + suffix,
      createdAt: '2026-09-23T18:00:00.000Z'
    };
    const objectTwo: CanonicalObjectIdentity = {
      id: asId<'CanonicalObjectId'>('OBJ-CI-TWO-' + suffix, 'Canonical Object'),
      tenantId,
      objectType: 'INFORMATION_CONTAINER',
      stableKey: 'CONFIG-TWO:' + suffix,
      createdAt: '2026-09-23T18:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId, context, { actorPersonId: admin.id });
    await kernel.createCanonicalObject(tenantId, objectOne, { actorPersonId: admin.id });
    await kernel.createCanonicalObject(tenantId, objectTwo, { actorPersonId: admin.id });

    const itemOne: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>('CI-ONE-' + suffix, 'Configuration Item'),
      tenantId,
      canonicalObjectId: objectOne.id,
      code: 'CI-ONE-' + suffix,
      name: 'Baseline-controlled item',
      status: 'ACTIVE'
    };
    const itemTwo: ConfigurationItem = {
      id: asId<'ConfigurationItemId'>('CI-TWO-' + suffix, 'Configuration Item'),
      tenantId,
      canonicalObjectId: objectTwo.id,
      code: 'CI-TWO-' + suffix,
      name: 'Effectivity-controlled item',
      status: 'ACTIVE'
    };
    await information.createConfigurationItem(tenantId, itemOne, { actorPersonId: admin.id });
    await information.createConfigurationItem(tenantId, itemTwo, { actorPersonId: admin.id });

    const baseline: Baseline = {
      id: asId<'BaselineId'>('BL-CONFIG-RES-' + suffix, 'Baseline'),
      tenantId,
      contextObjectId: context.id,
      code: 'BL-' + suffix,
      name: 'Project controlled baseline',
      status: 'DRAFT'
    };
    await information.createBaseline(tenantId, baseline, { actorPersonId: admin.id });

    const baselineItem: BaselineItem = {
      id: asId<'BaselineItemId'>('BLI-CONFIG-RES-' + suffix, 'Baseline Item'),
      tenantId,
      baselineId: baseline.id,
      configurationItemId: itemOne.id,
      subjectVersion: 'A'
    };
    await information.addBaselineItem(tenantId, baselineItem, { actorPersonId: admin.id });

    const decision: Decision = {
      id: asId<'DecisionId'>('DEC-CONFIG-RES-' + suffix, 'Decision'),
      tenantId,
      decisionType: 'BASELINE_ESTABLISHMENT',
      subjectObjectId: context.id,
      outcome: 'APPROVED',
      reason: 'Establish controlled configuration for resolution test.',
      deciderPersonId: admin.id,
      decidedAt: '2026-09-23T18:30:00.000Z'
    };
    await control.createDecision(tenantId, decision, {
      actorPersonId: admin.id,
      correlationId: 'CONFIGURATION-RESOLUTION-TEST'
    });
    await information.establishBaseline(
      tenantId,
      baseline.id,
      decision.id,
      '2026-09-23T18:31:00.000Z',
      { actorPersonId: admin.id }
    );

    const effectivity: Effectivity = {
      id: asId<'EffectivityId'>('EFF-C-' + suffix, 'Effectivity'),
      tenantId,
      configurationItemId: itemTwo.id,
      subjectVersion: 'C',
      effectivityType: 'PROJECT',
      scopeType: 'PROJECT',
      scopeId: context.id,
      effectiveFrom: '2026-09-23T18:00:00.000Z',
      effectiveTo: '2026-09-24T18:00:00.000Z',
      status: 'ACTIVE'
    };
    await information.createEffectivity(tenantId, effectivity, { actorPersonId: admin.id });

    const definition = await service.createDefinition(tenantId, admin.id, {
      code: 'PROJECT_CONTROLLED',
      name: 'Project controlled configuration'
    });
    await service.addCriterion(tenantId, admin.id, {
      definitionId: definition.id,
      sequence: 10,
      criterionType: 'BASELINE',
      mandatory: true,
      configuration: {}
    });
    await service.addCriterion(tenantId, admin.id, {
      definitionId: definition.id,
      sequence: 20,
      criterionType: 'EFFECTIVITY',
      mandatory: true,
      configuration: { effectivityTypes: ['PROJECT'] }
    });

    await expect(service.execute(tenantId, worker.id, {
      definitionCode: definition.code,
      contextObjectId: context.id,
      baselineId: baseline.id,
      configurationItemIds: [itemTwo.id],
      scopeType: 'PROJECT',
      scopeId: context.id,
      evaluatedAt: '2026-09-23T19:00:00.000Z'
    })).rejects.toMatchObject({
      name: 'ConfigurationResolutionCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<ConfigurationResolutionCommandError>);

    const resolved = await service.execute(tenantId, admin.id, {
      definitionCode: definition.code,
      contextObjectId: context.id,
      baselineId: baseline.id,
      configurationItemIds: [itemTwo.id],
      scopeType: 'PROJECT',
      scopeId: context.id,
      evaluatedAt: '2026-09-23T19:00:00.000Z'
    });

    expect(resolved.run.status).toBe('RESOLVED');
    expect(resolved.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        configurationItemId: itemOne.id,
        selectedVersion: 'A',
        status: 'RESOLVED',
        evidence: expect.objectContaining({ source: 'BASELINE' })
      }),
      expect.objectContaining({
        configurationItemId: itemTwo.id,
        selectedVersion: 'C',
        status: 'RESOLVED',
        evidence: expect.objectContaining({ source: 'EFFECTIVITY' })
      })
    ]));

    const conflictingEffectivity: Effectivity = {
      id: asId<'EffectivityId'>('EFF-D-' + suffix, 'Effectivity'),
      tenantId,
      configurationItemId: itemTwo.id,
      subjectVersion: 'D',
      effectivityType: 'PROJECT',
      scopeType: 'PROJECT',
      scopeId: context.id,
      effectiveFrom: '2026-09-23T18:00:00.000Z',
      effectiveTo: '2026-09-24T18:00:00.000Z',
      status: 'ACTIVE'
    };
    await information.createEffectivity(tenantId, conflictingEffectivity, { actorPersonId: admin.id });

    const conflict = await service.execute(tenantId, admin.id, {
      definitionCode: definition.code,
      contextObjectId: context.id,
      baselineId: baseline.id,
      configurationItemIds: [itemTwo.id],
      scopeType: 'PROJECT',
      scopeId: context.id,
      evaluatedAt: '2026-09-23T19:05:00.000Z'
    });

    expect(conflict.run.status).toBe('PARTIAL');
    expect(conflict.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        configurationItemId: itemTwo.id,
        status: 'CONFLICT'
      })
    ]));

    const projection = await reads.getProjection(tenantId, admin.id);
    expect(projection.runs).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: resolved.run.id, status: 'RESOLVED' }),
      expect.objectContaining({ id: conflict.run.id, status: 'PARTIAL' })
    ]));
    expect(projection.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        runId: resolved.run.id,
        configurationItemCode: itemOne.code,
        selectedVersion: 'A'
      }),
      expect.objectContaining({
        runId: conflict.run.id,
        configurationItemCode: itemTwo.code,
        status: 'CONFLICT'
      })
    ]));

    await expect(reads.getProjection(tenantId, worker.id)).rejects.toMatchObject({
      name: 'ConfigurationResolutionReadError',
      code: 'PERMISSION_DENIED'
    });
  });
});
