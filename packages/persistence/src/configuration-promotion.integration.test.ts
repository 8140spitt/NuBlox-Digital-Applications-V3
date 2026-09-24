import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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
import {
  ConfigurationPromotionCommandError,
  MySqlConfigurationPromotionCommandService
} from './configuration-promotion-command-service.js';
import { MySqlConfigurationPromotionReadRepository } from './configuration-promotion-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('governed administrative configuration promotion',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('promotes an exact approved configuration delta between frozen environment baselines',async()=>{
    if(!pool)throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>('TENANT-CFGP-'+suffix,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const control=new MySqlKernelControlRepository(pool);
    const service=new MySqlConfigurationPromotionCommandService(pool);
    const read=new MySqlConfigurationPromotionReadRepository(pool);

    await kernel.createTenant({id:tenantId,name:'Configuration Promotion Test',status:'ACTIVE'} satisfies Tenant);

    async function createPerson(label:string):Promise<Person>{
      const party:Party={
        id:asId<'PartyId'>('PARTY-'+label+'-'+suffix,'Party'),
        tenantId,kind:'PERSON',displayName:label,status:'ACTIVE'
      };
      await kernel.createParty(tenantId,party);
      const person:Person={
        id:asId<'PersonId'>('PERSON-'+label+'-'+suffix,'Person'),
        tenantId,partyId:party.id,legalName:label,status:'ACTIVE'
      };
      await kernel.createPerson(tenantId,person);
      return person;
    }

    const admin=await createPerson('Admin');
    const worker=await createPerson('Worker');
    const assignment:AccessRoleAssignment={
      id:asId<'AccessRoleAssignmentId'>('ARA-CFGP-'+suffix,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType:'PERSON',principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,assignment,{actorPersonId:admin.id,correlationId:'CFGP-TEST'});

    await expect(service.createEnvironment(tenantId,worker.id,{
      code:'DENIED',name:'Denied',environmentType:'TEST',
      platformVersion:'2026.9',environmentReference:'env://denied'
    })).rejects.toMatchObject({
      name:'ConfigurationPromotionCommandError',code:'PERMISSION_DENIED'
    } satisfies Partial<ConfigurationPromotionCommandError>);

    const dev=await service.createEnvironment(tenantId,admin.id,{
      code:'DEV-'+suffix,name:'Development',environmentType:'DEVELOPMENT',
      platformVersion:'2026.9',environmentReference:'env://dev/'+suffix
    });
    const prod=await service.createEnvironment(tenantId,admin.id,{
      code:'PROD-'+suffix,name:'Production',environmentType:'PRODUCTION',
      platformVersion:'2026.9',environmentReference:'env://prod/'+suffix
    });

    async function frozenBaseline(
      environmentId:string,
      reference:string,
      hash:string,
      snapshotVersion:number,
      createdAt:string,
      frozenAt:string
    ){
      const baseline=await service.createBaseline(tenantId,admin.id,{
        environmentId,baselineReference:reference,platformVersion:'2026.9',createdAt
      });
      await service.addBaselineItem(tenantId,admin.id,{
        baselineId:baseline.id,sequence:1,objectFamily:'TYPE_DEFINITION',
        objectReference:'TYPE:CBE_WORK_PRODUCT',objectVersion:String(snapshotVersion),
        contentHash:hash,snapshot:{code:'CBE_WORK_PRODUCT',version:snapshotVersion}
      });
      return service.freezeBaseline(tenantId,admin.id,baseline.id,frozenAt);
    }

    const devBase=await frozenBaseline(
      dev.id,'DEV-BL-1-'+suffix,'sha256:dev-base',1,
      '2026-09-24T09:00:00.000Z','2026-09-24T09:05:00.000Z'
    );
    const prodBase=await frozenBaseline(
      prod.id,'PROD-BL-1-'+suffix,'sha256:prod-base',1,
      '2026-09-24T09:10:00.000Z','2026-09-24T09:15:00.000Z'
    );

    const scope:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('OBJECT-CFGP-'+suffix,'Canonical Object'),
      tenantId,objectType:'TYPE_DEFINITION',stableKey:'CONFIG-SCOPE:'+suffix,
      createdAt:'2026-09-24T09:20:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId,scope,{actorPersonId:admin.id});

    const changeSet=await service.createChangeSet(tenantId,admin.id,{
      sourceEnvironmentId:dev.id,baseBaselineId:devBase.id,scopeObjectId:scope.id,
      code:'CFG-'+suffix,name:'Promote CBE metadata',version:'1.0.0',
      createdAt:'2026-09-24T09:30:00.000Z'
    });
    const changeItem=await service.addChangeItem(tenantId,admin.id,{
      changeSetId:changeSet.id,sequence:1,operation:'UPDATE',
      objectFamily:'TYPE_DEFINITION',objectReference:'TYPE:CBE_WORK_PRODUCT',
      beforeHash:'sha256:dev-base',afterHash:'sha256:dev-next',
      definition:{code:'CBE_WORK_PRODUCT',version:2,classification:true}
    });
    const frozenChangeSet=await service.freezeChangeSet(
      tenantId,admin.id,changeSet.id,'2026-09-24T09:35:00.000Z'
    );
    expect(frozenChangeSet.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    const approval:Decision={
      id:asId<'DecisionId'>('DEC-CFGP-'+suffix,'Decision'),
      tenantId,decisionType:'CONFIGURATION_CHANGE_SET_APPROVAL',
      subjectObjectId:scope.id,subjectVersion:frozenChangeSet.checksum,
      outcome:'APPROVED',reason:'Approved exact frozen administrative delta.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T09:40:00.000Z'
    };
    await control.createDecision(tenantId,approval,{actorPersonId:admin.id,correlationId:'CFGP-APPROVAL'});
    const approved=await service.approveChangeSet(tenantId,admin.id,{
      changeSetId:changeSet.id,decisionId:approval.id,approvedAt:'2026-09-24T09:41:00.000Z'
    });
    expect(approved.status).toBe('APPROVED');

    const newerProdBase=await frozenBaseline(
      prod.id,'PROD-BL-2-'+suffix,'sha256:prod-current',1,
      '2026-09-24T09:45:00.000Z','2026-09-24T09:50:00.000Z'
    );

    await expect(service.createRun(tenantId,admin.id,{
      changeSetId:approved.id,sourceEnvironmentId:dev.id,targetEnvironmentId:prod.id,
      sourceBaselineId:devBase.id,expectedTargetBaselineId:prodBase.id,
      runReference:'PROMO-STALE-'+suffix,
      mappingDefinition:{contexts:{DEV:'PROD'}},
      rollbackDefinition:{strategy:'RESTORE_BASELINE',baselineId:prodBase.id},
      requestedAt:'2026-09-24T10:00:00.000Z'
    })).rejects.toMatchObject({code:'INVALID_INPUT'});

    const run=await service.createRun(tenantId,admin.id,{
      changeSetId:approved.id,sourceEnvironmentId:dev.id,targetEnvironmentId:prod.id,
      sourceBaselineId:devBase.id,expectedTargetBaselineId:newerProdBase.id,
      runReference:'PROMO-'+suffix,
      mappingDefinition:{contexts:{DEV:'PROD'}},
      rollbackDefinition:{strategy:'RESTORE_BASELINE',baselineId:newerProdBase.id},
      requestedAt:'2026-09-24T10:05:00.000Z'
    });
    expect(run.mappingChecksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(run.rollbackChecksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    await expect(service.createRun(tenantId,admin.id,{
      changeSetId:approved.id,sourceEnvironmentId:dev.id,targetEnvironmentId:prod.id,
      sourceBaselineId:devBase.id,expectedTargetBaselineId:newerProdBase.id,
      runReference:'PROMO-CONCURRENT-'+suffix,
      mappingDefinition:{contexts:{DEV:'PROD'}},
      rollbackDefinition:{strategy:'RESTORE_BASELINE',baselineId:newerProdBase.id}
    })).rejects.toMatchObject({code:'CONFLICT'});

    await service.startRun(tenantId,admin.id,run.id,'2026-09-24T10:10:00.000Z');
    await service.recordItemResult(tenantId,admin.id,{
      runId:run.id,changeItemId:changeItem.id,outcome:'APPLIED',
      targetHash:'sha256:dev-next',recordedAt:'2026-09-24T10:12:00.000Z'
    });

    const resultingProdBase=await frozenBaseline(
      prod.id,'PROD-BL-3-'+suffix,'sha256:dev-next',2,
      '2026-09-24T10:13:00.000Z','2026-09-24T10:14:00.000Z'
    );
    const succeeded=await service.completeRun(tenantId,admin.id,{
      runId:run.id,resultingTargetBaselineId:resultingProdBase.id,
      completedAt:'2026-09-24T10:15:00.000Z'
    });
    expect(succeeded.status).toBe('SUCCEEDED');
    expect(succeeded.resultingTargetBaselineId).toBe(resultingProdBase.id);

    const blockedRun=await service.createRun(tenantId,admin.id,{
      changeSetId:approved.id,sourceEnvironmentId:dev.id,targetEnvironmentId:prod.id,
      sourceBaselineId:devBase.id,expectedTargetBaselineId:resultingProdBase.id,
      runReference:'PROMO-BLOCKED-'+suffix,
      mappingDefinition:{contexts:{DEV:'PROD'}},
      rollbackDefinition:{strategy:'RESTORE_BASELINE',baselineId:resultingProdBase.id},
      requestedAt:'2026-09-24T10:20:00.000Z'
    });
    await service.startRun(tenantId,admin.id,blockedRun.id,'2026-09-24T10:21:00.000Z');
    const blockedResult=await service.recordItemResult(tenantId,admin.id,{
      runId:blockedRun.id,changeItemId:changeItem.id,outcome:'APPLIED',
      targetHash:'sha256:dev-next',recordedAt:'2026-09-24T10:22:00.000Z'
    });
    const conflict=await service.createConflict(tenantId,admin.id,{
      runId:blockedRun.id,itemResultId:blockedResult.id,
      conflictType:'AUTHORITY',severity:'BLOCKING',code:'PROD-AUTHORITY-'+suffix,
      description:'Production authority review required.',
      detectedAt:'2026-09-24T10:23:00.000Z'
    });
    const blocked=await service.completeRun(tenantId,admin.id,{
      runId:blockedRun.id,completedAt:'2026-09-24T10:24:00.000Z'
    });
    expect(blocked.status).toBe('BLOCKED');

    const dispositionDecision:Decision={
      id:asId<'DecisionId'>('DEC-CFGP-DISP-'+suffix,'Decision'),
      tenantId,decisionType:'CONFIGURATION_PROMOTION_CONFLICT_DISPOSITION',
      subjectObjectId:scope.id,subjectVersion:frozenChangeSet.checksum,
      outcome:'APPROVED',reason:'Approve explicit waiver evidence for blocked promotion.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T10:25:00.000Z'
    };
    await control.createDecision(tenantId,dispositionDecision,{actorPersonId:admin.id,correlationId:'CFGP-DISPOSITION'});
    const dispositioned=await service.dispositionConflict(tenantId,admin.id,{
      conflictId:conflict.id,disposition:'WAIVE',rationale:'Waived by authorised configuration decision.',
      decisionId:dispositionDecision.id,disposedAt:'2026-09-24T10:26:00.000Z'
    });
    expect(dispositioned.status).toBe('DISPOSITIONED');

    const projection=await read.getProjection(tenantId,admin.id);
    expect(projection.totals.environments).toBe(2);
    expect(projection.totals.approvedChangeSets).toBe(1);
    expect(projection.totals.succeededPromotions).toBe(1);
    expect(projection.totals.blockedPromotions).toBe(1);
  });
});
