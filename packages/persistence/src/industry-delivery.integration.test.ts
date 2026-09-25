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
import {
  IndustryDeliveryCommandError,
  MySqlIndustryDeliveryCommandService
} from './industry-delivery-command-service.js';
import { MySqlIndustryDeliveryReadRepository } from './industry-delivery-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';

const enabled = Boolean(process.env.NUBLOX_DATABASE_URL);
const suite = enabled ? describe : describe.skip;
const pool = enabled ? createDatabasePool() : undefined;

suite('CBE service capability delivery', () => {
  beforeAll(async () => {
    await migrate();
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('fulfils hybrid Project capability demand from an internal professional and external provider', async () => {
    if (!pool) throw new Error('Database pool missing.');

    const suffix = randomUUID().replaceAll('-', '').slice(0, 12);
    const tenantId = asId<'TenantId'>(`TENANT-IND-DEL-${suffix}`, 'Tenant');
    const kernel = new MySqlKernelRepository(pool);
    const access = new MySqlAccessRepository(pool);
    const organisations = new MySqlOrganisationCommandService(pool);
    const commands = new MySqlIndustryDeliveryCommandService(pool);
    const reads = new MySqlIndustryDeliveryReadRepository(pool);

    const tenant: Tenant = {
      id: tenantId,
      name: 'CBE Service Capability Test',
      status: 'ACTIVE'
    };
    await kernel.createTenant(tenant);

    const adminParty: Party = {
      id: asId<'PartyId'>(`PARTY-IND-DEL-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Delivery Administrator',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, adminParty);

    const admin: Person = {
      id: asId<'PersonId'>(`PERSON-IND-DEL-${suffix}`, 'Person'),
      tenantId,
      partyId: adminParty.id,
      legalName: 'Delivery Administrator',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, admin);

    const assignment: AccessRoleAssignment = {
      id: asId<'AccessRoleAssignmentId'>(`ARA-IND-DEL-${suffix}`, 'Access Role Assignment'),
      tenantId,
      accessRoleId: PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType: 'PERSON',
      principalId: admin.id,
      scopeType: 'TENANT',
      effectiveFrom: '2026-09-21T00:00:00.000Z',
      status: 'ACTIVE'
    };
    await access.assignAccessRole(tenantId, assignment, {
      actorPersonId: admin.id,
      correlationId: 'INDUSTRY-DELIVERY-TEST'
    });

    const internalOrganisation = await organisations.createOrganisation(
      tenantId,
      admin.id,
      {
        legalName: 'Integrated Design Practice Limited',
        tradingName: 'Integrated Design Practice'
      }
    );
    const architectureUnit = await organisations.createOrganisationUnit(
      tenantId,
      admin.id,
      {
        organisationId: internalOrganisation.id,
        code: 'ARCH',
        name: 'Architecture'
      }
    );
    const architect = await organisations.createPerson(
      tenantId,
      admin.id,
      {
        legalName: 'Project Architect',
        preferredName: 'Project Architect'
      }
    );
    const architectPosition = await organisations.createPosition(
      tenantId,
      admin.id,
      {
        organisationUnitId: architectureUnit.id,
        jobProfileId: asId<'JobProfileId'>('JP-CBE-003', 'Job Profile'),
        code: 'ARCH-01',
        title: 'Project Architect',
        effectiveFrom: '2026-09-21T00:00:00.000Z'
      }
    );
    await organisations.assignPersonToPosition(
      tenantId,
      admin.id,
      {
        positionId: architectPosition.id,
        personId: architect.id,
        effectiveFrom: '2026-09-21T00:00:00.000Z'
      }
    );

    const externalProvider = await organisations.createOrganisation(
      tenantId,
      admin.id,
      {
        legalName: 'Specialist Design Partner Limited',
        tradingName: 'Specialist Design Partner'
      }
    );

    const service = await commands.createServiceOffering(
      tenantId,
      admin.id,
      {
        deliveryDomainId: 'D01',
        code: `ARCH-${suffix}`,
        name: 'Architectural Design',
        description: 'Architectural design and coordination service.'
      }
    );
    await commands.addServiceProfession(
      tenantId,
      admin.id,
      {
        serviceOfferingId: service.id,
        industryJobProfileId: 'CBE-JP-003',
        role: 'CORE'
      }
    );
    await commands.declareInternalCapability(
      tenantId,
      admin.id,
      {
        industryJobProfileId: 'CBE-JP-003',
        supplyModel: 'HYBRID',
        notes: 'Internal architectural capability with external capacity available when required.'
      }
    );

    const project = await commands.createProjectContext(
      tenantId,
      admin.id,
      {
        code: `PRJ-${suffix}`,
        name: 'City Centre Development'
      }
    );

    const governanceDeployment = await commands.createDisciplineDeployment(
      tenantId,
      admin.id,
      {
        industryJobProfileId: 'CBE-JP-003',
        deploymentPurpose: 'FUNCTIONAL_GOVERNANCE',
        assigneeType: 'PERSON',
        assigneeId: architect.id,
        roleTitle: 'Architecture Standards Lead',
        responsibilityRole: 'ACCOUNTABLE',
        contextType: 'ORGANISATION',
        scopeDescription:
          'Govern architectural standards, methods, templates and technical assurance.',
        capacityPercent: 15,
        effectiveFrom: '2026-09-21T08:00:00.000Z'
      }
    );

    const deliveryDeployment = await commands.createDisciplineDeployment(
      tenantId,
      admin.id,
      {
        industryJobProfileId: 'CBE-JP-003',
        deploymentPurpose: 'FUNCTIONAL_DELIVERY',
        assigneeType: 'PERSON',
        assigneeId: architect.id,
        roleTitle: 'Project Architect',
        responsibilityRole: 'RESPONSIBLE',
        contextType: 'PROJECT',
        contextObjectId: project.canonicalObjectId,
        scopeDescription:
          'Lead architectural design and coordination for the City Centre Development.',
        capacityPercent: 60,
        effectiveFrom: '2026-10-01T08:00:00.000Z'
      }
    );

    expect(governanceDeployment.deploymentPurpose).toBe('FUNCTIONAL_GOVERNANCE');
    expect(deliveryDeployment.deploymentPurpose).toBe('FUNCTIONAL_DELIVERY');

    const requirement = await commands.createRequirement(
      tenantId,
      admin.id,
      {
        contextObjectId: project.canonicalObjectId,
        serviceOfferingId: service.id,
        industryJobProfileId: 'CBE-JP-003',
        description: 'Provide lead architectural design capability for the Project.',
        requiredHeadcount: 2,
        sourcingStrategy: 'HYBRID',
        effectiveFrom: '2026-10-01T08:00:00.000Z'
      }
    );

    const internal = await commands.fulfilRequirement(
      tenantId,
      admin.id,
      {
        requirementId: requirement.id,
        fulfilmentType: 'INTERNAL',
        providerType: 'PERSON',
        providerId: architect.id,
        requirementSharePercent: 60,
        resourceCapacityPercent: 70,
        effectiveFrom: '2026-10-01T08:00:00.000Z'
      }
    );
    expect(internal.providerOrganisationId).toBe(internalOrganisation.id);

    const external = await commands.fulfilRequirement(
      tenantId,
      admin.id,
      {
        requirementId: requirement.id,
        fulfilmentType: 'EXTERNAL',
        providerType: 'ORGANISATION',
        providerId: externalProvider.id,
        requirementSharePercent: 40,
        effectiveFrom: '2026-10-01T08:00:00.000Z'
      }
    );
    expect(external.providerOrganisationId).toBe(externalProvider.id);

    const projection = await reads.getProjection(tenantId);
    expect(projection.totals).toMatchObject({
      services: 1,
      internalCapabilities: 1,
      governanceDeployments: 1,
      deliveryDeployments: 1,
      projects: 1,
      requirements: 1,
      fulfilled: 1,
      partiallyFulfilled: 0,
      sourcingRequired: 0
    });
    expect(projection.disciplineDeployments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: governanceDeployment.id,
          canonicalName: 'Architect',
          deploymentPurpose: 'FUNCTIONAL_GOVERNANCE',
          roleTitle: 'Architecture Standards Lead',
          assigneeName: 'Project Architect',
          contextType: 'ORGANISATION',
          capacityPercent: 15
        }),
        expect.objectContaining({
          id: deliveryDeployment.id,
          canonicalName: 'Architect',
          deploymentPurpose: 'FUNCTIONAL_DELIVERY',
          roleTitle: 'Project Architect',
          assigneeName: 'Project Architect',
          contextType: 'PROJECT',
          contextObjectId: project.canonicalObjectId,
          capacityPercent: 60
        })
      ])
    );

    expect(projection.requirements).toEqual([
      expect.objectContaining({
        id: requirement.id,
        contextCode: project.code,
        serviceName: 'Architectural Design',
        canonicalName: 'Architect',
        sourcingStrategy: 'HYBRID',
        status: 'FULFILLED',
        fulfilledPercent: 100,
        remainingPercent: 0,
        fulfilments: expect.arrayContaining([
          expect.objectContaining({
            fulfilmentType: 'INTERNAL',
            providerName: 'Project Architect',
            requirementSharePercent: 60
          }),
          expect.objectContaining({
            fulfilmentType: 'EXTERNAL',
            providerName: 'Specialist Design Partner',
            requirementSharePercent: 40
          })
        ])
      })
    ]);

    const unprivilegedParty: Party = {
      id: asId<'PartyId'>(`PARTY-NO-IND-DEL-${suffix}`, 'Party'),
      tenantId,
      kind: 'PERSON',
      displayName: 'Unprivileged Person',
      status: 'ACTIVE'
    };
    await kernel.createParty(tenantId, unprivilegedParty);
    const unprivileged: Person = {
      id: asId<'PersonId'>(`PERSON-NO-IND-DEL-${suffix}`, 'Person'),
      tenantId,
      partyId: unprivilegedParty.id,
      legalName: 'Unprivileged Person',
      status: 'ACTIVE'
    };
    await kernel.createPerson(tenantId, unprivileged);

    await expect(
      commands.createDisciplineDeployment(tenantId, unprivileged.id, {
        industryJobProfileId: 'CBE-JP-003',
        deploymentPurpose: 'FUNCTIONAL_DELIVERY',
        assigneeType: 'PERSON',
        assigneeId: architect.id,
        roleTitle: 'Unauthorised Project Architect',
        responsibilityRole: 'RESPONSIBLE',
        contextType: 'PROJECT',
        contextObjectId: project.canonicalObjectId,
        scopeDescription: 'Unauthorised discipline deployment.',
        capacityPercent: 10
      })
    ).rejects.toMatchObject({
      name: 'IndustryDeliveryCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<IndustryDeliveryCommandError>);

    await expect(
      commands.createProjectContext(tenantId, unprivileged.id, {
        code: `DENIED-${suffix}`,
        name: 'Denied Project'
      })
    ).rejects.toMatchObject({
      name: 'IndustryDeliveryCommandError',
      code: 'PERMISSION_DENIED'
    } satisfies Partial<IndustryDeliveryCommandError>);
  });
});
