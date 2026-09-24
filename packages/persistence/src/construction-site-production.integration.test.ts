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
import { MySqlIndustryDeliveryCommandService } from './industry-delivery-command-service.js';
import {
  ConstructionSiteProductionCommandError,
  MySqlConstructionSiteProductionCommandService
} from './construction-site-production-command-service.js';
import { MySqlConstructionSiteProductionReadRepository } from './construction-site-production-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlMyWorkRepository } from './my-work-repository.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('construction manager site production journey',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('runs a Work Package from Project setup through evidence-gated completion',async()=>{
    if(!pool) throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>(`TENANT-SITE-${suffix}`,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const industry=new MySqlIndustryDeliveryCommandService(pool);
    const site=new MySqlConstructionSiteProductionCommandService(pool);
    const reads=new MySqlConstructionSiteProductionReadRepository(pool);
    const myWork=new MySqlMyWorkRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Site Production Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    const party:Party={
      id:asId<'PartyId'>(`PARTY-SITE-${suffix}`,'Party'),
      tenantId,kind:'PERSON',displayName:'Construction Manager',status:'ACTIVE'
    };
    await kernel.createParty(tenantId,party);

    const manager:Person={
      id:asId<'PersonId'>(`PERSON-SITE-${suffix}`,'Person'),
      tenantId,partyId:party.id,legalName:'Construction Manager',status:'ACTIVE'
    };
    await kernel.createPerson(tenantId,manager);

    const roleAssignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>(`ARA-SITE-${suffix}`,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',principalId:manager.id,
      scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,roleAssignment,{actorPersonId:manager.id,correlationId:suffix});

    const project=await industry.createProjectContext(tenantId,manager.id,{
      code:`PRJ-${suffix}`,name:'Golden Path Construction Project'
    });

    const workPackage=await site.createWorkPackage(tenantId,manager.id,{
      projectObjectId:project.canonicalObjectId,
      code:'WP-001',
      title:'Groundworks',
      description:'Excavate, prepare formation and complete foundations.',
      plannedStart:'2026-09-24T08:00:00.000Z',
      plannedEnd:'2026-10-10T17:00:00.000Z'
    });
    expect(workPackage.status).toBe('PLANNED');

    const active=await site.activateWorkPackage(tenantId,manager.id,workPackage.id);
    expect(active.status).toBe('ACTIVE');

    await site.createDailyLog(tenantId,manager.id,{
      workPackageId:workPackage.id,
      logDate:'2026-09-24',
      summary:'Excavation and formation preparation progressed to plan.',
      conditions:'Dry',
      labourCount:8,
      plantSummary:'1 excavator, 1 dumper',
      materialsSummary:'Type 1 delivered'
    });

    await site.recordProgress(tenantId,manager.id,{
      workPackageId:workPackage.id,
      percentComplete:100,
      quantityCompleted:120,
      unit:'m3',
      note:'Groundworks scope complete.',
      occurredAt:'2026-09-24T15:00:00.000Z'
    });

    await site.recordEvidence(tenantId,manager.id,{
      workPackageId:workPackage.id,
      evidenceType:'PHOTO',
      reference:`urn:nublox:site:${suffix}:groundworks-complete`,
      description:'Completed formation and foundations.',
      occurredAt:'2026-09-24T15:10:00.000Z'
    });

    const issue=await site.createIssue(tenantId,manager.id,{
      workPackageId:workPackage.id,
      issueType:'PUNCH',
      title:'Remove surplus spoil',
      description:'Remove remaining spoil before package handoff.',
      priority:'HIGH',
      assignedToPersonId:manager.id,
      dueAt:'2026-09-25T12:00:00.000Z'
    });

    const workBeforeResolution=await myWork.listMyWork(
      tenantId,
      manager.id,
      '2026-09-24T17:00:00.000Z'
    );
    expect(workBeforeResolution).toEqual(expect.arrayContaining([
      expect.objectContaining({sourceId:workPackage.id,href:'/app/site-production'}),
      expect.objectContaining({sourceId:issue.id,href:'/app/site-production',priority:'HIGH'})
    ]));

    await expect(
      site.completeWorkPackage(tenantId,manager.id,workPackage.id)
    ).rejects.toMatchObject({
      name:'ConstructionSiteProductionCommandError',
      code:'INVALID_INPUT'
    } satisfies Partial<ConstructionSiteProductionCommandError>);

    await site.resolveIssue(tenantId,manager.id,issue.id);
    const completed=await site.completeWorkPackage(tenantId,manager.id,workPackage.id);
    expect(completed.status).toBe('COMPLETE');

    const projection=await reads.getProjection(tenantId,manager.id);
    expect(projection.totals).toMatchObject({
      workPackages:1,
      active:0,
      complete:1,
      openIssues:0,
      dailyLogs:1,
      evidence:1
    });
    expect(projection.workPackages[0]).toMatchObject({
      id:workPackage.id,
      latestPercentComplete:100,
      managerName:'Construction Manager'
    });

    const workAfterCompletion=await myWork.listMyWork(
      tenantId,
      manager.id,
      '2026-09-24T17:30:00.000Z'
    );
    expect(workAfterCompletion.some((item)=>item.sourceId===workPackage.id||item.sourceId===issue.id)).toBe(false);
  });
});
