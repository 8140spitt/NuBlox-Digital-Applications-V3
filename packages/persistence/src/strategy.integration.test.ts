import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlMyWorkRepository } from './my-work-repository.js';
import { MySqlKernelRepository } from './repository.js';
import { MySqlStrategyCommandService, StrategyCommandError } from './strategy-command-service.js';
import { MySqlStrategyReadRepository } from './strategy-read-repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('F01 Strategy & Enterprise Planning workbench', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('executes the native F01 strategy chain and preserves governance boundaries', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-F01-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const commands = new MySqlStrategyCommandService(pool);
    const reads = new MySqlStrategyReadRepository(pool);
    const myWork = new MySqlMyWorkRepository(pool);

    const tenant: Tenant = { id: tenantId, name: 'F01 Strategy Test', status: 'ACTIVE' };
    await kernel.createTenant(tenant);

    const party: Party = {
      id: asId<'PartyId'>(`PARTY-F01-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Strategy Lead',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, party);

    const person: Person = {
      id: asId<'PersonId'>(`PERSON-F01-${suffix}`, 'Person'),
      tenantId,
      partyId: party.id,
      legalName: 'Strategy Lead',
      preferredName: 'Strategy Lead',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, person);

    const role: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ARA-F01-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: person.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-22T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, role, {
      actorPersonId: person.id,
      correlationId: 'F01-STRATEGY-TEST'
    });

    const objectiveId = await commands.createObjective(tenantId, person.id, {
      code: `OBJ-${suffix}`,
      title: 'Grow recurring revenue',
      description: 'Increase recurring revenue while preserving target margin.',
      level: 'ENTERPRISE'
    });

    const keyResultId = await commands.createKeyResult(tenantId, person.id, {
      objectiveId,
      title: 'Increase recurring revenue share',
      measure: 'Recurring revenue percentage',
      baselineValue: 30,
      targetValue: 45
    });

    const initiativeId = await commands.createInitiative(tenantId, person.id, {
      objectiveId,
      code: `INIT-${suffix}`,
      title: 'Launch managed services portfolio',
      description: 'Create the capabilities and market offer required for managed services.',
      investmentAmount: 500000,
      capacityDemand: 8,
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2027-09-30T00:00:00.000Z'
    });

    const roadmapId = await commands.createRoadmap(tenantId, person.id, {
      code: `RM-${suffix}`,
      title: 'Managed services roadmap',
      description: 'Roadmap from strategic objective to market launch.',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2027-09-30T00:00:00.000Z'
    });

    await commands.addRoadmapItem(tenantId, person.id, {
      roadmapId,
      objectiveId,
      initiativeId,
      title: 'Pilot offer ready',
      milestoneDate: '2027-01-31T00:00:00.000Z',
      sequence: 1
    });

    const baseScenarioId = await commands.createScenario(tenantId, person.id, {
      code: `BASE-${suffix}`,
      title: 'Base investment case',
      description: 'Base case for managed services investment.',
      assumptions: JSON.stringify({ growth: 0.12, attrition: 0.05 }),
      budgetAmount: 500000,
      capacityAmount: 8,
      expectedOutcome: 'Reach target recurring revenue share by year end.'
    });

    const growthScenarioId = await commands.createScenario(tenantId, person.id, {
      code: `GROWTH-${suffix}`,
      title: 'Accelerated growth case',
      description: 'Accelerated investment and capacity case.',
      baseScenarioId,
      assumptions: JSON.stringify({ growth: 0.2, attrition: 0.04 }),
      budgetAmount: 750000,
      capacityAmount: 12,
      expectedOutcome: 'Reach target earlier with higher initial investment.'
    });

    const connectedPlanId = await commands.createPlan(tenantId, person.id, {
      code: `CP-${suffix}`,
      title: 'Connected enterprise plan',
      description: 'Connected strategic, financial and operational plan.',
      planType: 'CONNECTED_ENTERPRISE',
      assumptions: JSON.stringify({ growthScenario: growthScenarioId }),
      targetAmount: 2000000
    });

    await commands.createPlan(tenantId, person.id, {
      code: `CAP-${suffix}`,
      title: 'Capacity and investment plan',
      description: 'Capacity and funding allocation for the initiative.',
      planType: 'CAPACITY_INVESTMENT',
      targetAmount: 500000,
      forecastAmount: 525000
    });

    await commands.createPlan(tenantId, person.id, {
      code: `BF-${suffix}`,
      title: 'Annual budget and forecast',
      description: 'Top-down target aligned to bottom-up forecast.',
      planType: 'BUDGET_FORECAST',
      targetAmount: 500000,
      forecastAmount: 525000,
      actualAmount: 100000
    });

    const outcomeId = await commands.createOutcome(tenantId, person.id, {
      initiativeId,
      title: 'Recurring revenue growth',
      measure: 'Recurring revenue percentage',
      targetValue: 45,
      actualValue: 38,
      realisedValue: 400000
    });

    const analysisId = await commands.createAnalysis(tenantId, person.id, {
      title: 'Quarterly strategy review',
      summary: 'Growth is ahead of the base case but capacity investment remains the primary constraint.',
      planId: connectedPlanId
    });

    await commands.transition(tenantId, person.id, {
      entityType: 'OBJECTIVE',
      entityId: objectiveId,
      status: 'ALIGNED'
    });

    await expect(
      commands.transition(tenantId, person.id, {
        entityType: 'INITIATIVE',
        entityId: initiativeId,
        status: 'APPROVED'
      })
    ).rejects.toMatchObject({
      name: 'StrategyCommandError',
      code: 'INVALID_INPUT'
    } satisfies Partial<StrategyCommandError>);

    const projection = await reads.getWorkbench(tenantId);

    expect(projection.totals).toMatchObject({
      objectives: 1,
      initiatives: 1,
      roadmaps: 1,
      scenarios: 2,
      plans: 3,
      outcomes: 1,
      analyses: 1,
      benchmarkCore: 10
    });
    expect(projection.objectives[0]).toMatchObject({
      id: objectiveId,
      title: 'Grow recurring revenue',
      status: 'ALIGNED'
    });
    expect(projection.keyResults).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: keyResultId, objectiveId, targetValue: 45 })])
    );
    expect(projection.roadmaps[0]?.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ initiativeId, title: 'Pilot offer ready' })])
    );
    expect(projection.scenarios).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: growthScenarioId, baseScenarioId })
      ])
    );
    expect(projection.outcomes).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: outcomeId, initiativeId, actualValue: 38 })])
    );
    expect(projection.analyses).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: analysisId, planId: connectedPlanId })])
    );

    const ownedWork = await myWork.listMyWork(tenantId, person.id, '2026-09-22T01:00:00.000Z');
    expect(ownedWork).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'FUNCTION_WORK',
          sourceId: objectiveId,
          title: 'Grow recurring revenue',
          href: '/app/functions/F01'
        }),
        expect.objectContaining({
          kind: 'FUNCTION_WORK',
          sourceId: initiativeId,
          title: 'Launch managed services portfolio'
        }),
        expect.objectContaining({
          kind: 'FUNCTION_WORK',
          sourceId: connectedPlanId,
          title: 'Connected enterprise plan'
        })
      ])
    );
  });
});
