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
import { MySqlCompetenceCommandService } from './competence-command-service.js';
import { MySqlCompetenceReadRepository } from './competence-read-repository.js';
import { createDatabasePool } from './database.js';
import { MySqlFunctionalDeploymentCommandService } from './functional-deployment-command-service.js';
import { MySqlFunctionalRepository } from './functional-repository.js';
import { migrate } from './migrations.js';
import { MySqlOrganisationCommandService } from './organisation-command-service.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('competence administration',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('changes deployment-gate outcome when governed competence evidence becomes effective',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-COMP-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const organisations=new MySqlOrganisationCommandService(pool);
    const deployments=new MySqlFunctionalDeploymentCommandService(pool);
    const competence=new MySqlCompetenceCommandService(pool);
    const competenceReads=new MySqlCompetenceReadRepository(pool);
    const functional=new MySqlFunctionalRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Competence Administration Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const adminParty:Party={
      id:asId<'PartyId'>(`PARTY-COMP-ADMIN-${suffix}`,'Party'),tenantId,
      kind:'PERSON',displayName:'Competence Administrator',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,adminParty);
    const admin:Person={
      id:asId<'PersonId'>(`PERSON-COMP-ADMIN-${suffix}`,'Person'),tenantId,
      partyId:adminParty.id,legalName:'Competence Administrator',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,admin);

    const adminAssignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-COMP-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',
      principalId:admin.id,scopeType:'TENANT',effectiveFrom:'2026-09-21T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,adminAssignment,{actorPersonId:admin.id,correlationId:'COMPETENCE-TEST'});

    const organisation=await organisations.createOrganisation(tenantId,admin.id,{
      legalName:'Competence Test Limited'
    });
    const worker=await organisations.createPerson(tenantId,admin.id,{
      legalName:'Competent Worker',preferredName:'Competent Worker'
    });

    const deployment=await deployments.createDeployment(tenantId,admin.id,{
      functionId:'F01',organisationId:organisation.id,contextType:'ORGANISATION',
      scopeDescription:'F01 competence-gated deployment.',effectiveFrom:'2026-09-21T08:00:00.000Z'
    });
    const assignment=await deployments.createAssignment(tenantId,admin.id,{
      functionalDeploymentId:deployment.id,assigneeType:'PERSON',assigneeId:worker.id,
      responsibilityRole:'RESPONSIBLE',effectiveFrom:'2026-09-21T08:00:00.000Z'
    });
    await deployments.createCapacity(tenantId,admin.id,{
      deploymentAssignmentId:assignment.id,capacityPercent:100,effectiveFrom:'2026-09-21T08:00:00.000Z'
    });

    const requirement=await competence.createRequirement(tenantId,admin.id,{
      subjectType:'FUNCTION',subjectId:'F01',competenceCode:'F01_STRATEGY_TEST',
      competenceName:'F01 Strategy Test Competence',requiredLevel:'COMPETENT',
      evidenceRequired:false,expiryRequired:true
    });

    const denied=await functional.evaluateDeploymentGate(
      tenantId,deployment.id,worker.id,{minimumCapacityPercent:50},'2026-09-21T12:00:00.000Z'
    );
    expect(denied.allowed).toBe(false);
    expect(denied.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({check:'COMPETENCE',passed:false})
    ]));

    const evidence=await competence.createEvidence(tenantId,admin.id,{
      personId:worker.id,competenceCode:'F01_STRATEGY_TEST',attainedLevel:'COMPETENT',
      issuedAt:'2026-09-20T09:00:00.000Z',effectiveFrom:'2026-09-20T09:00:00.000Z',
      effectiveTo:'2027-09-20T09:00:00.000Z'
    });

    const allowed=await functional.evaluateDeploymentGate(
      tenantId,deployment.id,worker.id,{minimumCapacityPercent:50},'2026-09-21T12:00:00.000Z'
    );
    expect(allowed.allowed).toBe(true);
    expect(allowed.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({check:'COMPETENCE',passed:true})
    ]));

    const projection=await competenceReads.getProjection(tenantId,'2026-09-21T12:00:00.000Z');
    expect(projection.requirements).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id:requirement.id,subjectType:'FUNCTION',subjectId:'F01',
        competenceCode:'F01_STRATEGY_TEST',requiredLevel:'COMPETENT',expiryRequired:true
      })
    ]));
    expect(projection.evidence).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id:evidence.id,personId:worker.id,competenceCode:'F01_STRATEGY_TEST',
        attainedLevel:'COMPETENT',isExpired:false
      })
    ]));

    await expect(
      competence.createRequirement(tenantId,worker.id,{
        subjectType:'FUNCTION',subjectId:'F02',competenceCode:'UNAUTHORISED',
        competenceName:'Unauthorised',requiredLevel:'COMPETENT',
        evidenceRequired:false,expiryRequired:false
      })
    ).rejects.toMatchObject({
      name:'CompetenceCommandError',code:'PERMISSION_DENIED'
    });
  });
});
