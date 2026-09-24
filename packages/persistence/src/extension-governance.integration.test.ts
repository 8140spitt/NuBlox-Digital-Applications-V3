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
import { MySqlExtensionCommandService } from './extension-command-service.js';
import { MySqlExtensionReadRepository } from './extension-read-repository.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('governed extension packages',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('keeps package compatibility and upgrade reconciliation explicit',async()=>{
    if(!pool)throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>('TENANT-EXT-'+suffix,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const service=new MySqlExtensionCommandService(pool);
    const read=new MySqlExtensionReadRepository(pool);

    const tenant:Tenant={id:tenantId,name:'Extension Test',status:'ACTIVE'};
    await kernel.createTenant(tenant);

    async function person(label:string):Promise<Person>{
      const party:Party={id:asId<'PartyId'>('PARTY-'+label+'-'+suffix,'Party'),tenantId,kind:'PERSON',displayName:label,status:'ACTIVE'};
      await kernel.createParty(tenantId,party);
      const p:Person={id:asId<'PersonId'>('PERSON-'+label+'-'+suffix,'Person'),tenantId,partyId:party.id,legalName:label,status:'ACTIVE'};
      await kernel.createPerson(tenantId,p);
      return p;
    }
    const admin=await person('Admin');
    const worker=await person('Worker');
    const assignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>('ARA-EXT-'+suffix,'Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType:'PERSON',principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,assignment,{actorPersonId:admin.id,correlationId:'EXT-TEST'});

    await expect(service.createDefinition(tenantId,worker.id,{
      code:'DENIED',name:'Denied',extensionKind:'TENANT',ownerReference:'tenant'
    })).rejects.toMatchObject({code:'PERMISSION_DENIED'});

    const definition=await service.createDefinition(tenantId,admin.id,{
      code:'CBE-'+suffix,name:'CBE extension',extensionKind:'INDUSTRY',ownerReference:'NuBlox CBE'
    });
    const v1=await service.createPackageVersion(tenantId,admin.id,{
      extensionDefinitionId:definition.id,version:'1.0.0',
      minimumPlatformVersion:'2026.1',
      manifest:{name:'CBE',schema:1,features:['work-product-type']},
      createdAt:'2026-09-24T10:00:00.000Z'
    });
    const v2=await service.createPackageVersion(tenantId,admin.id,{
      extensionDefinitionId:definition.id,version:'2.0.0',
      minimumPlatformVersion:'2027.1',
      manifest:{name:'CBE',schema:2,features:['work-product-type','classification']},
      createdAt:'2026-09-24T11:00:00.000Z'
    });
    expect(v1.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(v2.checksum).not.toBe(v1.checksum);

    const c1=await service.addComponent(tenantId,admin.id,{
      packageVersionId:v1.id,componentKey:'CBE.WORK_PRODUCT',
      componentKind:'TYPE',targetObjectType:'INFORMATION_CONTAINER',
      definition:{type:'CBE_WORK_PRODUCT',version:1},sequence:1
    });
    const c2=await service.addComponent(tenantId,admin.id,{
      packageVersionId:v2.id,componentKey:'CBE.WORK_PRODUCT',
      componentKind:'TYPE',targetObjectType:'INFORMATION_CONTAINER',
      definition:{type:'CBE_WORK_PRODUCT',version:2,classification:true},sequence:1
    });
    expect(c1.checksum).not.toBe(c2.checksum);

    const assessment=await service.assessCompatibility(tenantId,admin.id,{
      packageVersionId:v2.id,platformVersion:'2027.1',
      outcome:'RECONCILIATION_REQUIRED',
      evidence:{changedKernelContracts:['metadata.type'],reason:'Type contract changed'},
      assessedAt:'2026-09-24T12:00:00.000Z'
    });
    expect(assessment.outcome).toBe('RECONCILIATION_REQUIRED');

    const run=await service.startReconciliation(tenantId,admin.id,{
      extensionDefinitionId:definition.id,
      fromPackageVersionId:v1.id,toPackageVersionId:v2.id,
      targetPlatformVersion:'2027.1',startedAt:'2026-09-24T12:10:00.000Z'
    });
    await service.recordReconciliationItem(tenantId,admin.id,{
      runId:run.id,componentKey:'CBE.WORK_PRODUCT',outcome:'CONFLICT',
      sourceChecksum:c1.checksum,targetChecksum:c2.checksum,
      rationale:'Target package changes the governed type contract.',
      recordedAt:'2026-09-24T12:15:00.000Z'
    });
    const blocked=await service.completeReconciliation(tenantId,admin.id,{
      runId:run.id,summary:'Manual reconciliation remains required.',
      completedAt:'2026-09-24T12:20:00.000Z'
    });
    expect(blocked.status).toBe('BLOCKED');

    const projection=await read.getProjection(tenantId,admin.id);
    expect(projection.totals.definitions).toBe(1);
    expect(projection.totals.packageVersions).toBe(2);
    expect(projection.totals.compatibilityAssessments).toBe(1);
    expect(projection.totals.blockedReconciliations).toBe(1);
  });
});
