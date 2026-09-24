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
  MySqlRecordsRetentionCommandService,
  RecordsRetentionCommandError
} from './records-retention-command-service.js';
import { MySqlRecordsRetentionReadRepository } from './records-retention-read-repository.js';
import { MySqlKernelControlRepository } from './control-repository.js';
import { createDatabasePool } from './database.js';
import { migrate } from './migrations.js';
import { MySqlKernelRepository } from './repository.js';

const enabled=Boolean(process.env.NUBLOX_DATABASE_URL);
const suite=enabled?describe:describe.skip;
const pool=enabled?createDatabasePool():undefined;

suite('governed records retention and disposition',()=>{
  beforeAll(async()=>{await migrate();});
  afterAll(async()=>{await pool?.end();});

  it('keeps policy, hold, disposition, archive, restore and destruction evidence independent and auditable',async()=>{
    if(!pool)throw new Error('Database pool missing.');
    const suffix=randomUUID().replaceAll('-','').slice(0,12);
    const tenantId=asId<'TenantId'>('TENANT-RET-'+suffix,'Tenant');
    const kernel=new MySqlKernelRepository(pool);
    const access=new MySqlAccessRepository(pool);
    const control=new MySqlKernelControlRepository(pool);
    const service=new MySqlRecordsRetentionCommandService(pool);
    const read=new MySqlRecordsRetentionReadRepository(pool);

    await kernel.createTenant({id:tenantId,name:'Records Retention Test',status:'ACTIVE'} satisfies Tenant);

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
      id:asId<'AccessRoleAssignmentId'>('ARA-RET-'+suffix,'Access Role Assignment'),
      tenantId,accessRoleId:PLATFORM_ADMINISTRATOR_ROLE_ID,
      principalType:'PERSON',principalId:admin.id,scopeType:'TENANT',
      effectiveFrom:'2026-09-24T00:00:00.000Z',status:'ACTIVE'
    };
    await access.assignAccessRole(tenantId,assignment,{actorPersonId:admin.id,correlationId:'RET-TEST'});

    const scope:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('OBJECT-RET-SCOPE-'+suffix,'Canonical Object'),
      tenantId,objectType:'INFORMATION_CONTAINER',stableKey:'RETENTION-SCOPE:'+suffix,
      createdAt:'2026-09-24T08:00:00.000Z'
    };
    const archiveSubject:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('OBJECT-RET-ARCH-'+suffix,'Canonical Object'),
      tenantId,objectType:'INFORMATION_CONTAINER',stableKey:'ARCHIVE-SUBJECT:'+suffix,
      createdAt:'2026-09-24T08:01:00.000Z'
    };
    const destroySubject:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>('OBJECT-RET-DEST-'+suffix,'Canonical Object'),
      tenantId,objectType:'INFORMATION_CONTAINER',stableKey:'DESTROY-SUBJECT:'+suffix,
      createdAt:'2026-09-24T08:02:00.000Z'
    };
    await kernel.createCanonicalObject(tenantId,scope,{actorPersonId:admin.id});
    await kernel.createCanonicalObject(tenantId,archiveSubject,{actorPersonId:admin.id});
    await kernel.createCanonicalObject(tenantId,destroySubject,{actorPersonId:admin.id});

    await expect(service.createPolicy(tenantId,worker.id,{
      scopeObjectId:scope.id,code:'DENIED',name:'Denied',version:1
    })).rejects.toMatchObject({
      name:'RecordsRetentionCommandError',code:'PERMISSION_DENIED'
    } satisfies Partial<RecordsRetentionCommandError>);

    const policy=await service.createPolicy(tenantId,admin.id,{
      scopeObjectId:scope.id,code:'CORP-RET-'+suffix,name:'Corporate records retention',
      version:1,createdAt:'2026-09-24T08:10:00.000Z'
    });
    const archiveRule=await service.addRule(tenantId,admin.id,{
      retentionPolicyId:policy.id,code:'ARCHIVE',name:'Archive controlled records',
      objectFamily:'INFORMATION_CONTAINER',triggerType:'CLOSED_AT',retentionPeriodDays:365,
      selectionCriteria:{recordClass:'CONTROLLED'},dispositionAction:'ARCHIVE',enabled:true,sequence:1
    });
    const destroyRule=await service.addRule(tenantId,admin.id,{
      retentionPolicyId:policy.id,code:'DESTROY',name:'Destroy expired records',
      objectFamily:'INFORMATION_CONTAINER',triggerType:'CLOSED_AT',retentionPeriodDays:2555,
      selectionCriteria:{recordClass:'EXPIRED'},dispositionAction:'DESTROY',enabled:true,sequence:2
    });
    const frozen=await service.freezePolicy(
      tenantId,admin.id,policy.id,'2026-09-24T08:20:00.000Z'
    );
    expect(frozen.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);

    const policyDecision:Decision={
      id:asId<'DecisionId'>('DEC-RET-POL-'+suffix,'Decision'),
      tenantId,decisionType:'RETENTION_POLICY_APPROVAL',
      subjectObjectId:scope.id,subjectVersion:frozen.checksum!,
      outcome:'APPROVED',reason:'Approve exact frozen retention policy version.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T08:25:00.000Z'
    };
    await control.createDecision(tenantId,policyDecision,{actorPersonId:admin.id,correlationId:'RET-POLICY'});
    const active=await service.activatePolicy(tenantId,admin.id,{
      policyId:policy.id,decisionId:policyDecision.id,activatedAt:'2026-09-24T08:26:00.000Z'
    });
    expect(active.status).toBe('ACTIVE');

    const policyV2=await service.createPolicy(tenantId,admin.id,{
      scopeObjectId:scope.id,code:policy.code,name:'Corporate records retention',
      version:2,createdAt:'2026-09-24T08:30:00.000Z'
    });
    await service.addRule(tenantId,admin.id,{
      retentionPolicyId:policyV2.id,code:'ARCHIVE',name:'Archive controlled records',
      objectFamily:'INFORMATION_CONTAINER',triggerType:'CLOSED_AT',retentionPeriodDays:365,
      selectionCriteria:{recordClass:'CONTROLLED'},dispositionAction:'ARCHIVE',enabled:true,sequence:1
    });
    await service.addRule(tenantId,admin.id,{
      retentionPolicyId:policyV2.id,code:'DESTROY',name:'Destroy expired records',
      objectFamily:'INFORMATION_CONTAINER',triggerType:'CLOSED_AT',retentionPeriodDays:2920,
      selectionCriteria:{recordClass:'EXPIRED'},dispositionAction:'DESTROY',enabled:true,sequence:2
    });
    const frozenV2=await service.freezePolicy(
      tenantId,admin.id,policyV2.id,'2026-09-24T08:35:00.000Z'
    );
    const policyV2Decision:Decision={
      id:asId<'DecisionId'>('DEC-RET-POL-V2-'+suffix,'Decision'),
      tenantId,decisionType:'RETENTION_POLICY_APPROVAL',
      subjectObjectId:scope.id,subjectVersion:frozenV2.checksum!,
      outcome:'APPROVED',reason:'Approve replacement retention policy version.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T08:36:00.000Z'
    };
    await control.createDecision(tenantId,policyV2Decision,{actorPersonId:admin.id,correlationId:'RET-POLICY-V2'});
    await service.activatePolicy(tenantId,admin.id,{
      policyId:policyV2.id,decisionId:policyV2Decision.id,activatedAt:'2026-09-24T08:37:00.000Z'
    });

    const projectionAfterV2=await read.getProjection(tenantId,admin.id);
    const policyV1Projection=projectionAfterV2.policies.find(item=>item.id===policy.id);
    expect(policyV1Projection?.status).toBe('SUPERSEDED');
    const archiveRuleV2=projectionAfterV2.policies
      .find(item=>item.id===policyV2.id)?.rules.find(item=>item.code==='ARCHIVE');
    const destroyRuleV2=projectionAfterV2.policies
      .find(item=>item.id===policyV2.id)?.rules.find(item=>item.code==='DESTROY');
    if(!archiveRuleV2||!destroyRuleV2)throw new Error('Replacement policy rules missing.');

    const hold=await service.imposeHold(tenantId,admin.id,{
      subjectObjectId:destroySubject.id,subjectVersion:'A',holdType:'LEGAL',
      reason:'Litigation preservation.',blocksArchive:true,blocksDestruction:true,
      imposedAt:'2026-09-24T08:40:00.000Z'
    });

    const heldRun=await service.createRun(tenantId,admin.id,{
      retentionRuleId:destroyRuleV2.id,runReference:'DISP-HELD-'+suffix,
      selectionSnapshot:{query:'expired controlled records',candidateCount:1},
      requestedAt:'2026-09-24T08:45:00.000Z'
    });
    await expect(service.createRun(tenantId,admin.id,{
      retentionRuleId:destroyRuleV2.id,runReference:'DISP-CONCURRENT-'+suffix,
      selectionSnapshot:{query:'duplicate active run'}
    })).rejects.toMatchObject({code:'CONFLICT'});

    await service.startRun(tenantId,admin.id,heldRun.id,'2026-09-24T08:46:00.000Z');

    const destroyDecisionWhileHeld:Decision={
      id:asId<'DecisionId'>('DEC-DEST-HELD-'+suffix,'Decision'),
      tenantId,decisionType:'RECORD_DESTRUCTION_APPROVAL',
      subjectObjectId:destroySubject.id,subjectVersion:'A',
      outcome:'APPROVED',reason:'Destruction decision exists but hold must still prevail.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T08:47:00.000Z'
    };
    await control.createDecision(tenantId,destroyDecisionWhileHeld,{actorPersonId:admin.id,correlationId:'RET-DEST-HELD'});
    await expect(service.createDestruction(tenantId,admin.id,{
      runId:heldRun.id,subjectObjectId:destroySubject.id,subjectVersion:'A',
      decisionId:destroyDecisionWhileHeld.id,method:'Cryptographic erase',
      metadataOutcome:'TOMBSTONE_RETAINED',contentOutcome:'DELETED',
      evidence:{storage:'vault-1',operatorAttestation:true},
      destroyedAt:'2026-09-24T08:48:00.000Z'
    })).rejects.toMatchObject({code:'INVALID_INPUT'});

    await service.recordItemResult(tenantId,admin.id,{
      runId:heldRun.id,subjectObjectId:destroySubject.id,subjectVersion:'A',
      outcome:'HELD',reason:'Active legal hold blocks destruction.',holdId:hold.id,
      recordedAt:'2026-09-24T08:49:00.000Z'
    });
    const heldCompleted=await service.completeRun(
      tenantId,admin.id,heldRun.id,'2026-09-24T08:50:00.000Z'
    );
    expect(heldCompleted.status).toBe('COMPLETED_WITH_EXCEPTIONS');

    const holdReleaseDecision:Decision={
      id:asId<'DecisionId'>('DEC-HOLD-REL-'+suffix,'Decision'),
      tenantId,decisionType:'HOLD_RELEASE_APPROVAL',
      subjectObjectId:destroySubject.id,subjectVersion:'A',
      outcome:'APPROVED',reason:'Matter closed; release legal hold.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T09:00:00.000Z'
    };
    await control.createDecision(tenantId,holdReleaseDecision,{actorPersonId:admin.id,correlationId:'RET-HOLD-RELEASE'});
    const released=await service.releaseHold(tenantId,admin.id,{
      holdId:hold.id,decisionId:holdReleaseDecision.id,releasedAt:'2026-09-24T09:01:00.000Z'
    });
    expect(released.status).toBe('RELEASED');

    const destroyRun=await service.createRun(tenantId,admin.id,{
      retentionRuleId:destroyRuleV2.id,runReference:'DISP-DEST-'+suffix,
      selectionSnapshot:{query:'expired controlled records after hold release',candidateCount:1},
      requestedAt:'2026-09-24T09:05:00.000Z'
    });
    await service.startRun(tenantId,admin.id,destroyRun.id,'2026-09-24T09:06:00.000Z');
    const destruction=await service.createDestruction(tenantId,admin.id,{
      runId:destroyRun.id,subjectObjectId:destroySubject.id,subjectVersion:'A',
      decisionId:destroyDecisionWhileHeld.id,method:'Cryptographic erase',
      metadataOutcome:'TOMBSTONE_RETAINED',contentOutcome:'DELETED',
      evidence:{storage:'vault-1',operatorAttestation:true,holdReleased:true},
      destroyedAt:'2026-09-24T09:07:00.000Z'
    });
    expect(destruction.integrityHash).toMatch(/^sha256:[0-9a-f]{64}$/);
    await service.recordItemResult(tenantId,admin.id,{
      runId:destroyRun.id,subjectObjectId:destroySubject.id,subjectVersion:'A',
      outcome:'DESTROYED',reason:'Retention expired and hold released.',
      destructionEvidenceId:destruction.id,recordedAt:'2026-09-24T09:08:00.000Z'
    });
    const destroyedCompleted=await service.completeRun(
      tenantId,admin.id,destroyRun.id,'2026-09-24T09:09:00.000Z'
    );
    expect(destroyedCompleted.status).toBe('COMPLETED');

    const schedule=await service.createSchedule(tenantId,admin.id,{
      retentionRuleId:archiveRuleV2.id,scheduleExpression:'RRULE:FREQ=DAILY',
      timezone:'Europe/London',enabled:true,createdAt:'2026-09-24T09:10:00.000Z'
    });
    const archiveRun=await service.createRun(tenantId,admin.id,{
      retentionRuleId:archiveRuleV2.id,scheduleId:schedule.id,
      runReference:'DISP-ARCH-'+suffix,
      selectionSnapshot:{query:'controlled records due for archive',candidateCount:1},
      requestedAt:'2026-09-24T09:11:00.000Z'
    });
    await service.startRun(tenantId,admin.id,archiveRun.id,'2026-09-24T09:12:00.000Z');
    const archive=await service.createArchive(tenantId,admin.id,{
      runId:archiveRun.id,subjectObjectId:archiveSubject.id,subjectVersion:'B',
      archiveReference:'archive://records/'+suffix,
      integrityHash:'sha256:archive-'+suffix,
      archiveManifest:{source:'primary-vault',format:'WORM',objectVersion:'B'},
      archivedAt:'2026-09-24T09:13:00.000Z'
    });
    await service.recordItemResult(tenantId,admin.id,{
      runId:archiveRun.id,subjectObjectId:archiveSubject.id,subjectVersion:'B',
      outcome:'ARCHIVED',reason:'Retention rule selected archive outcome.',
      archiveRecordId:archive.id,recordedAt:'2026-09-24T09:14:00.000Z'
    });
    const archiveCompleted=await service.completeRun(
      tenantId,admin.id,archiveRun.id,'2026-09-24T09:15:00.000Z'
    );
    expect(archiveCompleted.status).toBe('COMPLETED');

    const restoreDecision:Decision={
      id:asId<'DecisionId'>('DEC-RESTORE-'+suffix,'Decision'),
      tenantId,decisionType:'RECORD_RESTORE_APPROVAL',
      subjectObjectId:archiveSubject.id,subjectVersion:'B',
      outcome:'APPROVED',reason:'Restore archived evidence for authorised review.',
      deciderPersonId:admin.id,decidedAt:'2026-09-24T09:20:00.000Z'
    };
    await control.createDecision(tenantId,restoreDecision,{actorPersonId:admin.id,correlationId:'RET-RESTORE'});
    const restore=await service.createRestore(tenantId,admin.id,{
      archiveRecordId:archive.id,subjectObjectId:archiveSubject.id,subjectVersion:'B',
      restoreReference:'RESTORE-'+suffix,decisionId:restoreDecision.id,
      restoredContentReference:'content://restored/'+suffix,
      integrityHash:archive.integrityHash,status:'SUCCEEDED',
      restoredAt:'2026-09-24T09:21:00.000Z'
    });
    expect(restore.status).toBe('SUCCEEDED');

    const projection=await read.getProjection(tenantId,admin.id);
    expect(projection.totals.activePolicies).toBe(1);
    expect(projection.totals.activeHolds).toBe(0);
    expect(projection.totals.destroyed).toBe(1);
    expect(projection.totals.archived).toBe(1);
    expect(projection.totals.restored).toBe(1);
    expect(projection.totals.exceptionRuns).toBe(1);
  });
});
