import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type JobProfile,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlIndustryDeliveryCommandService } from './industry-delivery-command-service.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import {
  MySqlOrganisationalResourcePlanningCommandService,
  OrganisationalResourcePlanningCommandError
} from './organisational-resource-planning-command-service.js';
import { MySqlOrganisationalResourcePlanningReadRepository } from './organisational-resource-planning-read-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('Function supply to Project organisational resource planning',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('lets Project ABC0001 request a Financial Controller from Finance and deploys a named employee',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-RP-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const organisation=new MySqlOrganisationCommandService(pool);
    const industry=new MySqlIndustryDeliveryCommandService(pool);
    const resources=new MySqlOrganisationalResourcePlanningCommandService(pool);
    const reads=new MySqlOrganisationalResourcePlanningReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Resource Planning Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-ADMIN-${suffix}`,'Party'),tenantId,kind:'PERSON',displayName:'Platform Admin',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-ADMIN-${suffix}`,'Person'),tenantId,partyId:adminParty.id,legalName:'Platform Admin',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    const roleAssignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-RP-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',principalId:admin.id,
      scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,roleAssignment,{actorPersonId:admin.id,correlationId:suffix});

    const company=await organisation.createOrganisation(tenantId,admin.id,{legalName:'ABC Construction Ltd'});
    const financeUnit=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'FIN',name:'Finance'
    });

    const financialControllerProfile:JobProfile={
      id:asId<'JobProfileId'>(`JOB-FC-${suffix}`,'Job Profile'),
      catalogueScope:'TENANT',tenantId,code:`FIN-CONTROLLER-${suffix}`,name:'Financial Controller',status:'ACTIVE'
    };
    await kernel.createJobProfile(financialControllerProfile,{actorPersonId:admin.id});

    const position=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:financeUnit.id,jobProfileId:financialControllerProfile.id,
      code:'FIN-FC-001',title:'Financial Controller'
    });
    const jane=await organisation.createPerson(tenantId,admin.id,{legalName:'Jane Smith'});
    await organisation.assignPersonToPosition(tenantId,admin.id,{
      positionId:position.id,personId:jane.id,effectiveFrom:'2026-09-24T08:00:00.000Z'
    });

    const finance=await resources.registerFunctionContext(tenantId,admin.id,{
      functionId:'F14',organisationId:company.id,organisationUnitId:financeUnit.id,
      effectiveFrom:'2026-09-24T08:00:00.000Z'
    });
    expect(finance).toMatchObject({contextType:'FUNCTION',lifecycle:'PERMANENT',functionId:'F14',code:'F14'});

    const project=await industry.createProjectContext(tenantId,admin.id,{
      code:'ABC0001',name:'ABC0001 Delivery Project'
    });
    const projectOrg=await resources.registerProjectContext(tenantId,admin.id,{
      projectObjectId:project.canonicalObjectId,organisationId:company.id,effectiveFrom:'2026-10-01T08:00:00.000Z',
      effectiveTo:'2027-03-31T17:00:00.000Z'
    });
    expect(projectOrg).toMatchObject({contextType:'PROJECT',lifecycle:'TEMPORARY',code:'ABC0001'});

    const request=await resources.createResourceRequirement(tenantId,admin.id,{
      requestingContextId:projectOrg.id,supplyingFunctionContextId:finance.id,
      jobProfileId:financialControllerProfile.id,roleTitle:'Project Financial Controller',
      description:'Provide financial control, project reporting and finance governance to ABC0001.',
      requiredHeadcount:1,requiredCapacityPercent:50,
      effectiveFrom:'2026-10-01T08:00:00.000Z',effectiveTo:'2027-03-31T17:00:00.000Z'
    });
    expect(request.status).toBe('OPEN');

    const fulfilment=await resources.fulfilResourceRequirement(tenantId,admin.id,{
      requirementId:request.id,personId:jane.id,requirementSharePercent:100,resourceCapacityPercent:50
    });
    expect(fulfilment).toMatchObject({personId:jane.id,positionId:position.id,resourceCapacityPercent:50});

    const [deploymentRows]=await pool.query<any[]>(
      `SELECT d.function_id,d.deployment_purpose,d.context_type,d.context_object_id,
              a.assignee_type,a.assignee_id,a.job_profile_id,c.capacity_percent
         FROM functional_deployments d
         JOIN deployment_assignments a ON a.tenant_id=d.tenant_id AND a.functional_deployment_id=d.id
         JOIN deployment_capacities c ON c.tenant_id=a.tenant_id AND c.deployment_assignment_id=a.id
        WHERE d.tenant_id=? AND d.id=?`,
      [tenantId,fulfilment.functionalDeploymentId]
    );
    expect(deploymentRows[0]).toMatchObject({
      function_id:'F14',deployment_purpose:'FUNCTIONAL_DELIVERY',context_type:'PROJECT',
      context_object_id:project.canonicalObjectId,assignee_type:'PERSON',assignee_id:jane.id,
      job_profile_id:financialControllerProfile.id
    });
    expect(Number(deploymentRows[0].capacity_percent)).toBe(50);

    const projection=await reads.getProjection(tenantId);
    expect(projection.requirements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        requestingCode:'ABC0001',functionCode:'F14',roleTitle:'Project Financial Controller',
        status:'FULFILLED',fulfilments:expect.arrayContaining([
          expect.objectContaining({personName:'Jane Smith',resourceCapacityPercent:50})
        ])
      })
    ]));

    const secondProject=await industry.createProjectContext(tenantId,admin.id,{
      code:'ABC0002',name:'ABC0002 Delivery Project'
    });
    const secondProjectOrg=await resources.registerProjectContext(tenantId,admin.id,{
      projectObjectId:secondProject.canonicalObjectId,organisationId:company.id,
      effectiveFrom:'2026-10-01T08:00:00.000Z',effectiveTo:'2027-03-31T17:00:00.000Z'
    });
    const secondRequest=await resources.createResourceRequirement(tenantId,admin.id,{
      requestingContextId:secondProjectOrg.id,supplyingFunctionContextId:finance.id,
      jobProfileId:financialControllerProfile.id,roleTitle:'Project Financial Controller',
      description:'Provide financial control to ABC0002.',requiredHeadcount:1,requiredCapacityPercent:60,
      effectiveFrom:'2026-10-01T08:00:00.000Z',effectiveTo:'2027-03-31T17:00:00.000Z'
    });
    await expect(resources.fulfilResourceRequirement(tenantId,admin.id,{
      requirementId:secondRequest.id,personId:jane.id,requirementSharePercent:100,resourceCapacityPercent:60
    })).rejects.toMatchObject({
      name:'OrganisationalResourcePlanningCommandError',code:'CONFLICT'
    } satisfies Partial<OrganisationalResourcePlanningCommandError>);
  });
});
