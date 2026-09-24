import { randomUUID } from 'node:crypto';
import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import {
  PLATFORM_ADMINISTRATOR_ROLE_ID,
  asId,
  type AccessRoleAssignment,
  type CanonicalObjectIdentity,
  type Decision,
  type Party,
  type Person,
  type Tenant
} from '@nublox/kernel';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlManufacturingCommandService,ManufacturingCommandError } from './manufacturing-command-service.js';
import { MySqlManufacturingReadRepository } from './manufacturing-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('governed manufacturing process model',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('governs process plan, operation sequence, resources and control characteristics through release',async()=>{
    if(!pool)throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>('TENANT-MFG-'+suffix,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const control=new MySqlKernelControlRepository(pool);
    const service=new MySqlManufacturingCommandService(pool);
    const read=new MySqlManufacturingReadRepository(pool);

    await kernel.createTenant({id:tenantId,name:'Manufacturing Test',status:'ACTIVE'} satisfies Tenant);
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
      id:asId<'AccessRoleAssignmentId'>('ARA-MFG-'+suffix,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,principalType:'PERSON',principalId:admin.id,
      scopeType:'TENANT',effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,assignment,{actorPersonId:admin.id,correlationId:'MFG-TEST'});

    const scope:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('OBJECT-MFG-'+suffix,'Canonical Object'),tenantId,
      objectType:'CONFIGURATION_ITEM',stableKey:'MFG-ITEM:'+suffix,createdAt:'2026-09-24T10:00:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId,scope,{actorPersonId:admin.id});

    await expect(service.createProcessPlan(tenantId,worker.id,{
      scopeObjectId:scope.id,code:'DENIED',name:'Denied',version:1
    })).rejects.toMatchObject({name:'ManufacturingCommandError',code:'PERMISSION_DENIED'} satisfies Partial<ManufacturingCommandError>);

    const resource=await service.createResource(tenantId,admin.id,{
      code:'WC-'+suffix,name:'Fabrication Cell',resourceType:'WORK_CENTER',
      capacityUnit:'HOURS',capacityPerDay:16,status:'ACTIVE'
    });
    const tooling=await service.createResource(tenantId,admin.id,{
      code:'TOOL-'+suffix,name:'Weld Fixture',resourceType:'TOOLING',status:'ACTIVE'
    });

    async function buildAndRelease(version:number,runMinutes:number,releaseTime:string){
      const plan=await service.createProcessPlan(tenantId,admin.id,{
        scopeObjectId:scope.id,code:'PLAN-'+suffix,name:'Assembly Plan',version,
        plantReference:'PLANT-01',createdAt:'2026-09-24T10:0'+version+':00.000Z'
      });
      const op10=await service.addOperation(tenantId,admin.id,{
        processPlanId:plan.id,operationNumber:'0010',name:'Prepare',operationType:'PROCESS',
        setupMinutes:10,runMinutes:20,yieldPercent:100,workInstructions:{instruction:'Prepare components'}
      });
      const op20=await service.addOperation(tenantId,admin.id,{
        processPlanId:plan.id,operationNumber:'0020',name:'Assemble',operationType:'PROCESS',
        setupMinutes:5,runMinutes,yieldPercent:99.5,workInstructions:{instruction:'Assemble and weld'}
      });
      await service.addSequence(tenantId,admin.id,{
        processPlanId:plan.id,predecessorOperationId:op10.id,successorOperationId:op20.id,
        sequenceType:'FINISH_START',lagMinutes:0
      });
      await service.allocateResource(tenantId,admin.id,{
        operationId:op20.id,resourceId:resource.id,quantity:1,usageUnit:'WORK_CENTER',required:true
      });
      await service.allocateResource(tenantId,admin.id,{
        operationId:op20.id,resourceId:tooling.id,quantity:1,usageUnit:'EACH',required:true
      });
      await service.createControlCharacteristic(tenantId,admin.id,{
        scopeObjectId:scope.id,operationId:op20.id,code:'CC-WELD-'+version,name:'Weld dimension',
        characteristicType:'DIMENSION',severity:'CRITICAL',unit:'mm',nominalValue:6,lowerLimit:5.5,upperLimit:6.5,
        samplingPlan:{method:'100_PERCENT'},status:'ACTIVE'
      });
      const frozen=await service.freezePlan(tenantId,admin.id,plan.id,'2026-09-24T10:1'+version+':00.000Z');
      expect(frozen.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
      const decision:Decision={
        id:asId<'DecisionId'>('DEC-MFG-'+version+'-'+suffix,'Decision'),tenantId,
        decisionType:'MANUFACTURING_PROCESS_PLAN_RELEASE',subjectObjectId:scope.id,subjectVersion:frozen.checksum!,
        outcome:'APPROVED',reason:'Release exact frozen manufacturing definition.',
        deciderPersonId:admin.id,decidedAt:releaseTime
      };
      await control.createDecision(tenantId,decision,{actorPersonId:admin.id,correlationId:'MFG-RELEASE'});
      return service.releasePlan(tenantId,admin.id,{planId:plan.id,decisionId:decision.id,releasedAt:releaseTime});
    }

    const v1=await buildAndRelease(1,45,'2026-09-24T10:20:00.000Z');
    expect(v1.status).toBe('RELEASED');
    const v2=await buildAndRelease(2,40,'2026-09-24T10:30:00.000Z');
    expect(v2.status).toBe('RELEASED');

    const projection=await read.getProjection(tenantId,admin.id);
    expect(projection.totals.releasedPlans).toBe(1);
    expect(projection.totals.operations).toBe(4);
    expect(projection.totals.resources).toBe(2);
    expect(projection.totals.controlCharacteristics).toBe(2);
    expect(projection.plans.find(p=>p.id===v1.id)?.status).toBe('SUPERSEDED');
    expect(projection.plans.find(p=>p.id===v2.id)?.operations).toHaveLength(2);
  });
});
