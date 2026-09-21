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
import { MySqlFunctionalDeploymentCommandService } from './functional-deployment-command-service.js';
import { MySqlFunctionalDeploymentReadRepository } from './functional-deployment-read-repository.js';
import { MySqlFunctionalRepository } from './functional-repository.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('functional deployment administration', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('deploys governed capability with responsibility and capacity while denying unauthorised mutation', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(
      `TENANT-DEPLOY-ADMIN-${suffix}`,
      'Tenant'
    );
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const organisations = new MySqlOrganisationCommandService(pool);
    const commands = new MySqlFunctionalDeploymentCommandService(pool);
    const reads = new MySqlFunctionalDeploymentReadRepository(pool);
    const functional = new MySqlFunctionalRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'Functional Deployment Administration Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-DEPLOY-ADMIN-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Deployment Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);

    const admin: Person = {
      id: asId<'PersonId'>(`PERSON-DEPLOY-ADMIN-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Deployment Administrator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, admin);

    const administratorAssignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(
        `ARA-DEPLOY-ADMIN-${suffix}`,
        'Access Role Assignment'
      ),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, administratorAssignment, {
      actorPersonId: admin.id,
      correlationId: 'DEPLOYMENT-ADMIN-TEST'
    });

    const organisation = await organisations.createOrganisation(
      tenantId,
      admin.id,
      {
        legalName: 'NuBlox Deployment Test Limited',
        tradingName: 'NuBlox Deployment Test'
      }
    );

    const unit = await organisations.createOrganisationUnit(
      tenantId,
      admin.id,
      {
        organisationId: organisation.id,
        code: 'DELIVERY',
        name: 'Delivery'
      }
    );

    const worker = await organisations.createPerson(tenantId, admin.id, {
      legalName: 'Functional Worker',
      preferredName: 'Functional Worker'
    });

    const deployment = await commands.createDeployment(
      tenantId,
      admin.id,
      {
        functionId: 'F01',
        subFunctionId: 'F01.01',
        deploymentPurpose: 'FUNCTIONAL_DELIVERY',
        organisationId: organisation.id,
        organisationUnitId: unit.id,
        contextType: 'ORGANISATION',
        scopeDescription:
          'Deploy F01.01 Strategy Development into the Delivery organisation unit.',
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      }
    );

    const deploymentAssignment = await commands.createAssignment(
      tenantId,
      admin.id,
      {
        functionalDeploymentId: deployment.id,
        assigneeType: 'PERSON',
        assigneeId: worker.id,
        responsibilityRole: 'RESPONSIBLE',
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      }
    );

    const responsibility = await commands.createResponsibilityScope(
      tenantId,
      admin.id,
      {
        deploymentAssignmentId: deploymentAssignment.id,
        scopeType: 'TENANT',
        description: 'Responsible for the deployed F01.01 scope.',
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      }
    );

    const capacity = await commands.createCapacity(
      tenantId,
      admin.id,
      {
        deploymentAssignmentId: deploymentAssignment.id,
        capacityPercent: 75,
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      }
    );

    expect(responsibility.responsibilityRole).toBe('RESPONSIBLE');
    expect(capacity.capacityPercent).toBe(75);

    const projection = await reads.getProjection(
      tenantId,
      '2026-09-21T12:00:00.000Z'
    );

    expect(projection.deployments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: deployment.id,
          functionCode: 'F01',
          subFunctionCode: 'F01.01',
          deploymentPurpose: 'FUNCTIONAL_DELIVERY',
          organisationId: organisation.id,
          organisationUnitId: unit.id,
          contextType: 'ORGANISATION',
          assignments: expect.arrayContaining([
            expect.objectContaining({
              id: deploymentAssignment.id,
              assigneeType: 'PERSON',
              assigneeId: worker.id,
              assigneeLabel: 'Functional Worker',
              responsibilityRole: 'RESPONSIBLE',
              activeCapacityPercent: 75,
              responsibilityScopes: expect.arrayContaining([
                expect.objectContaining({
                  role: 'RESPONSIBLE',
                  scopeType: 'TENANT'
                })
              ])
            })
          ])
        })
      ])
    );

    const gate = await functional.evaluateDeploymentGate(
      tenantId,
      deployment.id,
      worker.id,
      {
        minimumCapacityPercent: 50
      },
      '2026-09-21T12:00:00.000Z'
    );

    expect(gate.allowed).toBe(true);
    expect(gate.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          check: 'ACTIVE_DEPLOYMENT',
          passed: true
        }),
        expect.objectContaining({
          check: 'ACTIVE_ASSIGNMENT',
          passed: true
        }),
        expect.objectContaining({
          check: 'POSITION_OCCUPANCY',
          passed: true
        }),
        expect.objectContaining({
          check: 'COMPETENCE',
          passed: true
        }),
        expect.objectContaining({
          check: 'AUTHORITY',
          passed: true
        }),
        expect.objectContaining({
          check: 'PERMISSION',
          passed: true
        }),
        expect.objectContaining({
          check: 'AVAILABILITY',
          passed: true
        })
      ])
    );

    await expect(
      commands.createDeployment(tenantId, worker.id, {
        functionId: 'F02',
        deploymentPurpose: 'FUNCTIONAL_DELIVERY',
        organisationId: organisation.id,
        contextType: 'ORGANISATION',
        scopeDescription: 'Unauthorised deployment attempt.',
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      })
    ).rejects.toMatchObject({
      name: 'FunctionalDeploymentCommandError',
      code: 'PERMISSION_DENIED'
    });

    const [auditRows] = await pool.query(
      `SELECT entity_type, action
         FROM kernel_audit_entries
        WHERE tenant_id = ?
          AND correlation_id = 'DEPLOYMENT-ADMIN'`,
      [tenantId]
    );

    expect(auditRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity_type: 'FUNCTIONAL_DEPLOYMENT',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'DEPLOYMENT_ASSIGNMENT',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'RESPONSIBILITY_SCOPE',
          action: 'CREATED'
        }),
        expect.objectContaining({
          entity_type: 'DEPLOYMENT_CAPACITY',
          action: 'CREATED'
        })
      ])
    );
  });
});
