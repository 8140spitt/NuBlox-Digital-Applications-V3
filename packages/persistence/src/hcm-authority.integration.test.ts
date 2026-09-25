import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
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
import { HcmCommandError,MySqlHcmCommandService } from './hcm-command-service.js';
import { MySqlHcmReadRepository } from './hcm-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('HCM authority drives Function world and management hierarchy',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('resolves a Sales Executive into Sales Delivery and rolls the Position into the Sales Manager scope',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-HCM-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const organisation=new MySqlOrganisationCommandService(pool);
    const hcm=new MySqlHcmCommandService(pool);
    const reads=new MySqlHcmReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'HCM Authority Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);
    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-ADMIN-${suffix}`,'Party'),tenantId,kind:'PERSON',displayName:'HCM Admin',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-ADMIN-${suffix}`,'Person'),tenantId,partyId:adminParty.id,legalName:'HCM Admin',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);
    const role:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-HCM-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',principalId:admin.id,
      scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,role,{actorPersonId:admin.id,correlationId:suffix});

    const company=await organisation.createOrganisation(tenantId,admin.id,{
      legalName:'Market Leading Construction plc',tradingName:'Market Leading'
    });
    const salesUnit=await organisation.createOrganisationUnit(tenantId,admin.id,{
      organisationId:company.id,code:'SALES',name:'Sales & Commercial Management'
    });

    const managerJob=await hcm.createJobProfile(tenantId,admin.id,{code:`SALES-MGR-${suffix}`,name:'Sales Manager'});
    const executiveJob=await hcm.createJobProfile(tenantId,admin.id,{code:`SALES-EXEC-${suffix}`,name:'Sales Executive'});
    const salesFamily=await hcm.createJobFamily(tenantId,admin.id,{code:`COMM-${suffix}`,name:'Commercial'});
    const salesSubfamily=await hcm.createJobSubfamily(tenantId,admin.id,{
      familyId:salesFamily.id,code:`SALES-${suffix}`,name:'Sales'
    });
    const professionalLevel=await hcm.createCareerLevel(tenantId,admin.id,{
      code:`P3-${suffix}`,name:'Senior Professional',track:'INDIVIDUAL_CONTRIBUTOR',sequence:30
    });
    const grade=await hcm.createGrade(tenantId,admin.id,{code:`G7-${suffix}`,name:'Grade 7',sequence:70});
    const jobArchitecture=await hcm.assignJobProfileArchitecture(tenantId,admin.id,{
      jobProfileId:executiveJob.id,familyId:salesFamily.id,subfamilyId:salesSubfamily.id,
      careerLevelId:professionalLevel.id,gradeId:grade.id,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    expect(jobArchitecture).toMatchObject({
      jobProfileId:executiveJob.id,familyId:salesFamily.id,subfamilyId:salesSubfamily.id,
      careerLevelId:professionalLevel.id,gradeId:grade.id,status:'ACTIVE'
    });
    await expect(hcm.assignJobProfileArchitecture(tenantId,admin.id,{
      jobProfileId:executiveJob.id,familyId:salesFamily.id,effectiveFrom:'2026-06-01T00:00:00.000Z'
    })).rejects.toMatchObject({name:'HcmCommandError',code:'CONFLICT'} satisfies Partial<HcmCommandError>);
    const managerPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,jobProfileId:managerJob.id,code:'SALES-MGR-001',title:'Sales Manager'
    });
    const executivePosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,jobProfileId:executiveJob.id,code:'SALES-EXEC-001',title:'Sales Executive'
    });
    const sharedPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,jobProfileId:executiveJob.id,code:'SALES-SHARED-001',title:'Shared Sales Role',
      lifecycleStatus:'APPROVED',incumbencyModel:'SHARED',authorisedFte:1.5,effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    const plannedPosition=await organisation.createPosition(tenantId,admin.id,{
      organisationUnitId:salesUnit.id,jobProfileId:executiveJob.id,code:'SALES-PLAN-001',title:'Future Sales Role',
      lifecycleStatus:'PLANNED',authorisedFte:1,effectiveFrom:'2027-01-01T00:00:00.000Z'
    });
    expect(sharedPosition).toMatchObject({lifecycleStatus:'APPROVED',incumbencyModel:'SHARED',authorisedFte:1.5});

    const manager=await organisation.createPerson(tenantId,admin.id,{legalName:'Jane Manager'});
    const executive=await organisation.createPerson(tenantId,admin.id,{legalName:'Stephen Sales'});
    const sharedA=await organisation.createPerson(tenantId,admin.id,{legalName:'Shared Worker A'});
    const sharedB=await organisation.createPerson(tenantId,admin.id,{legalName:'Shared Worker B'});
    await organisation.assignPersonToPosition(tenantId,admin.id,{positionId:sharedPosition.id,personId:sharedA.id,fte:0.75,effectiveFrom:'2026-01-01T00:00:00.000Z'});
    await organisation.assignPersonToPosition(tenantId,admin.id,{positionId:sharedPosition.id,personId:sharedB.id,fte:0.75,effectiveFrom:'2026-01-01T00:00:00.000Z'});
    await expect(organisation.assignPersonToPosition(tenantId,admin.id,{positionId:sharedPosition.id,personId:executive.id,fte:0.25,effectiveFrom:'2026-01-01T00:00:00.000Z'})).rejects.toMatchObject({name:'OrganisationCommandError',code:'CONFLICT'});
    await expect(organisation.assignPersonToPosition(tenantId,admin.id,{positionId:plannedPosition.id,personId:executive.id,fte:1,effectiveFrom:'2027-01-01T00:00:00.000Z'})).rejects.toMatchObject({name:'OrganisationCommandError',code:'CONFLICT'});

    const managerEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:manager.id,organisationId:company.id,employeeNumber:`MGR-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });
    const executiveEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:executive.id,organisationId:company.id,employeeNumber:`EXEC-${suffix}`,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-01-01T00:00:00.000Z'
    });

    expect(executiveEmployment).toMatchObject({
      relationshipType:'PRIMARY_EMPLOYMENT',isPrimary:true
    });
    expect(executiveEmployment.assignmentId).toMatch(/^WR-/);

    const secondaryEmployment=await hcm.createEmployment(tenantId,admin.id,{
      personId:executive.id,organisationId:company.id,employeeNumber:`EXEC-SECONDARY-${suffix}`,
      assignmentId:`WR-SECONDARY-${suffix}`,relationshipType:'SECONDARY_EMPLOYMENT',isPrimary:false,
      workerType:'EMPLOYEE',employmentType:'FIXED_TERM',startDate:'2026-04-01T00:00:00.000Z',endDate:'2026-12-31T00:00:00.000Z'
    });
    expect(secondaryEmployment).toMatchObject({
      assignmentId:`WR-SECONDARY-${suffix}`.toUpperCase(),relationshipType:'SECONDARY_EMPLOYMENT',isPrimary:false
    });

    await expect(hcm.createEmployment(tenantId,admin.id,{
      personId:executive.id,organisationId:company.id,employeeNumber:`EXEC-PRIMARY-2-${suffix}`,
      relationshipType:'PRIMARY_EMPLOYMENT',isPrimary:true,
      workerType:'EMPLOYEE',employmentType:'PERMANENT',startDate:'2026-06-01T00:00:00.000Z'
    })).rejects.toMatchObject({name:'HcmCommandError',code:'CONFLICT'} satisfies Partial<HcmCommandError>);

    await hcm.assignPositionToFunction(tenantId,admin.id,{
      positionId:managerPosition.id,functionId:'F07',deploymentPurpose:'FUNCTIONAL_DELIVERY',
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignPositionToFunction(tenantId,admin.id,{
      positionId:executivePosition.id,functionId:'F07',deploymentPurpose:'FUNCTIONAL_DELIVERY',
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:managerEmployment.id,positionId:managerPosition.id,isPrimary:true,
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });
    await hcm.assignEmploymentToPosition(tenantId,admin.id,{
      employmentId:executiveEmployment.id,positionId:executivePosition.id,isPrimary:true,
      effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    await hcm.setReportingLine(tenantId,admin.id,{
      subordinatePositionId:executivePosition.id,managerPositionId:managerPosition.id,
      relationshipType:'LINE_MANAGER',effectiveFrom:'2026-01-01T00:00:00.000Z'
    });

    const projection=await reads.getProjection(tenantId,'2026-09-24T12:00:00.000Z');
    expect(projection.jobArchitecture).toEqual(expect.arrayContaining([
      expect.objectContaining({
        jobProfileId:executiveJob.id,familyCode:salesFamily.code,subfamilyCode:salesSubfamily.code,
        careerLevelCode:professionalLevel.code,gradeCode:grade.code,status:'ACTIVE'
      })
    ]));

    const executiveWorld=await reads.getUserExperience(tenantId,executive.id,'2026-09-24T12:00:00.000Z');
    expect(executiveWorld).toMatchObject({
      personName:'Stephen Sales',positionTitle:'Sales Executive',
      functionCode:'F07',functionName:'Sales & Commercial Management',
      deploymentPurpose:'FUNCTIONAL_DELIVERY',
      managerPositionId:managerPosition.id,managerPersonId:manager.id,managerPersonName:'Jane Manager'
    });

    const managerWorld=await reads.getUserExperience(tenantId,manager.id,'2026-09-24T12:00:00.000Z');
    expect(managerWorld).toMatchObject({
      positionTitle:'Sales Manager',functionCode:'F07',deploymentPurpose:'FUNCTIONAL_DELIVERY'
    });
    expect(managerWorld?.managementScope).toEqual(expect.arrayContaining([
      expect.objectContaining({
        positionId:executivePosition.id,positionTitle:'Sales Executive',
        personId:executive.id,personName:'Stephen Sales',depth:1
      })
    ]));

    await expect(hcm.assignPositionToFunction(tenantId,admin.id,{
      positionId:executivePosition.id,functionId:'F15',deploymentPurpose:'FUNCTIONAL_DELIVERY',
      effectiveFrom:'2026-06-01T00:00:00.000Z'
    })).rejects.toMatchObject({
      name:'HcmCommandError',code:'CONFLICT'
    } satisfies Partial<HcmCommandError>);

    await expect(hcm.setReportingLine(tenantId,admin.id,{
      subordinatePositionId:managerPosition.id,managerPositionId:executivePosition.id,
      relationshipType:'LINE_MANAGER',effectiveFrom:'2026-01-01T00:00:00.000Z'
    })).rejects.toMatchObject({
      name:'HcmCommandError',code:'CONFLICT'
    } satisfies Partial<HcmCommandError>);
  });
});
