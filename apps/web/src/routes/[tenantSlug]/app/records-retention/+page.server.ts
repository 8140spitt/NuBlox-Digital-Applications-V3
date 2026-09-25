import {
  RecordsRetentionCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type DestructionContentOutcome,
  type DestructionMetadataOutcome,
  type DispositionAction,
  type DispositionItemOutcome,
  type HoldType,
  type RetentionTriggerType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getRecordsRetentionCommandService,
  getRecordsRetentionReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const TRIGGERS=['CREATED_AT','LAST_MODIFIED_AT','RELEASED_AT','CLOSED_AT','ARCHIVED_AT','CUSTOM'] as const satisfies readonly RetentionTriggerType[];
const ACTIONS=['ARCHIVE','DESTROY','REVIEW'] as const satisfies readonly DispositionAction[];
const HOLD_TYPES=['LEGAL','REGULATORY','RECORDS','INVESTIGATION','OTHER'] as const satisfies readonly HoldType[];
const OUTCOMES=['HELD','ARCHIVED','DESTROYED','REVIEW_REQUIRED','SKIPPED','FAILED'] as const satisfies readonly DispositionItemOutcome[];
const META_OUTCOMES=['TOMBSTONE_RETAINED','DELETED'] as const satisfies readonly DestructionMetadataOutcome[];
const CONTENT_OUTCOMES=['DELETED','NOT_APPLICABLE'] as const satisfies readonly DestructionContentOutcome[];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optional(form:FormData,name:string){const v=value(form,name);return v||undefined;}
function checked(form:FormData,name:string){return form.get(name)!==null;}
function integer(raw:string,label:string,allowZero=false){
  const n=Number(raw);
  if(!Number.isInteger(n)||(allowZero?n<0:n<1)){
    throw new RecordsRetentionCommandError(
      label+(allowZero?' must be zero or greater.':' must be a positive integer.'),
      'INVALID_INPUT'
    );
  }
  return n;
}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T)){
    throw new RecordsRetentionCommandError(label+' is invalid.','INVALID_INPUT');
  }
  return raw as T;
}
function jsonObject(raw:string,label:string):Readonly<Record<string,unknown>>{
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}
  catch{throw new RecordsRetentionCommandError(label+' must be valid JSON.','INVALID_INPUT');}
  if(typeof parsed!=='object'||parsed===null||Array.isArray(parsed)){
    throw new RecordsRetentionCommandError(label+' must be a JSON object.','INVALID_INPUT');
  }
  return parsed as Readonly<Record<string,unknown>>;
}
function failure(error:unknown,action:string){
  if(error instanceof RecordsRetentionCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session){
    return{
      allowed:false,canManage:false,canHold:false,canExecute:false,canDestroy:false,canRestore:false,
      reason:'No authenticated tenant context is available.',projection:null
    };
  }
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,hold,execute,destroy,restore]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_HOLD_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_DESTROY,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_RESTORE,{scopeType:'TENANT'})
  ]);
  if(!read.allowed){
    return{
      allowed:false,canManage:false,canHold:false,canExecute:false,canDestroy:false,canRestore:false,
      reason:read.reason,projection:null
    };
  }
  return{
    allowed:true,
    canManage:manage.allowed,
    canHold:hold.allowed,
    canExecute:execute.allowed,
    canDestroy:destroy.allowed,
    canRestore:restore.allowed,
    reason:read.reason,
    projection:await getRecordsRetentionReadRepository().getProjection(tenantId,session.personId)
  };
};

export const actions:Actions={
  createPolicy:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createPolicy',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const policy=await getRecordsRetentionCommandService().createPolicy(
        session.tenantId as TenantId,
        session.personId,
        {
          scopeObjectId:value(form,'scopeObjectId'),
          code:value(form,'code'),
          name:value(form,'name'),
          description:optional(form,'description'),
          version:integer(value(form,'version'),'Version')
        }
      );
      return{action:'createPolicy',ok:true,message:`Retention Policy ${policy.code} v${policy.version} created.`};
    }catch(error){return failure(error,'createPolicy');}
  },

  addRule:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'addRule',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const rule=await getRecordsRetentionCommandService().addRule(
        session.tenantId as TenantId,
        session.personId,
        {
          retentionPolicyId:value(form,'retentionPolicyId'),
          code:value(form,'code'),
          name:value(form,'name'),
          objectFamily:value(form,'objectFamily'),
          triggerType:enumValue(value(form,'triggerType'),TRIGGERS,'Trigger type'),
          triggerField:optional(form,'triggerField'),
          retentionPeriodDays:integer(value(form,'retentionPeriodDays'),'Retention period days',true),
          selectionCriteria:jsonObject(value(form,'selectionCriteria'),'Selection criteria'),
          dispositionAction:enumValue(value(form,'dispositionAction'),ACTIONS,'Disposition action'),
          enabled:checked(form,'enabled'),
          sequence:integer(value(form,'sequence'),'Sequence')
        }
      );
      return{action:'addRule',ok:true,message:`Retention Rule ${rule.code} added.`};
    }catch(error){return failure(error,'addRule');}
  },

  freezePolicy:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'freezePolicy',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const policy=await getRecordsRetentionCommandService().freezePolicy(
        session.tenantId as TenantId,session.personId,value(form,'policyId')
      );
      return{action:'freezePolicy',ok:true,message:`Policy ${policy.code} frozen at ${policy.checksum}.`};
    }catch(error){return failure(error,'freezePolicy');}
  },

  activatePolicy:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'activatePolicy',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const policy=await getRecordsRetentionCommandService().activatePolicy(
        session.tenantId as TenantId,session.personId,
        {policyId:value(form,'policyId'),decisionId:value(form,'decisionId')}
      );
      return{action:'activatePolicy',ok:true,message:`Policy ${policy.code} v${policy.version} activated.`};
    }catch(error){return failure(error,'activatePolicy');}
  },

  imposeHold:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'imposeHold',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const hold=await getRecordsRetentionCommandService().imposeHold(
        session.tenantId as TenantId,session.personId,
        {
          subjectObjectId:value(form,'subjectObjectId'),
          subjectVersion:optional(form,'subjectVersion'),
          holdType:enumValue(value(form,'holdType'),HOLD_TYPES,'Hold type'),
          reason:value(form,'reason'),
          blocksArchive:checked(form,'blocksArchive'),
          blocksDestruction:checked(form,'blocksDestruction')
        }
      );
      return{action:'imposeHold',ok:true,message:`${hold.holdType} Hold imposed.`};
    }catch(error){return failure(error,'imposeHold');}
  },

  releaseHold:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'releaseHold',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const hold=await getRecordsRetentionCommandService().releaseHold(
        session.tenantId as TenantId,session.personId,
        {holdId:value(form,'holdId'),decisionId:value(form,'decisionId')}
      );
      return{action:'releaseHold',ok:true,message:`Hold released at ${hold.releasedAt}.`};
    }catch(error){return failure(error,'releaseHold');}
  },

  createSchedule:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createSchedule',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const schedule=await getRecordsRetentionCommandService().createSchedule(
        session.tenantId as TenantId,session.personId,
        {
          retentionRuleId:value(form,'retentionRuleId'),
          scheduleExpression:value(form,'scheduleExpression'),
          timezone:value(form,'timezone'),
          enabled:checked(form,'enabled')
        }
      );
      return{action:'createSchedule',ok:true,message:`Disposition Schedule ${schedule.scheduleExpression} created.`};
    }catch(error){return failure(error,'createSchedule');}
  },

  createRun:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createRun',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const run=await getRecordsRetentionCommandService().createRun(
        session.tenantId as TenantId,session.personId,
        {
          retentionRuleId:value(form,'retentionRuleId'),
          scheduleId:optional(form,'scheduleId'),
          runReference:value(form,'runReference'),
          selectionSnapshot:jsonObject(value(form,'selectionSnapshot'),'Selection snapshot')
        }
      );
      return{action:'createRun',ok:true,message:`Disposition Run ${run.runReference} queued.`};
    }catch(error){return failure(error,'createRun');}
  },

  startRun:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'startRun',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const run=await getRecordsRetentionCommandService().startRun(
        session.tenantId as TenantId,session.personId,value(form,'runId')
      );
      return{action:'startRun',ok:true,message:`Disposition Run ${run.runReference} started.`};
    }catch(error){return failure(error,'startRun');}
  },

  createArchive:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createArchive',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const archive=await getRecordsRetentionCommandService().createArchive(
        session.tenantId as TenantId,session.personId,
        {
          runId:value(form,'runId'),
          subjectObjectId:value(form,'subjectObjectId'),
          subjectVersion:optional(form,'subjectVersion'),
          archiveReference:value(form,'archiveReference'),
          integrityHash:value(form,'integrityHash'),
          archiveManifest:jsonObject(value(form,'archiveManifest'),'Archive manifest')
        }
      );
      return{action:'createArchive',ok:true,message:`Archive Record ${archive.archiveReference} created.`};
    }catch(error){return failure(error,'createArchive');}
  },

  createDestruction:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createDestruction',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const evidence=await getRecordsRetentionCommandService().createDestruction(
        session.tenantId as TenantId,session.personId,
        {
          runId:value(form,'runId'),
          subjectObjectId:value(form,'subjectObjectId'),
          subjectVersion:optional(form,'subjectVersion'),
          archiveRecordId:optional(form,'archiveRecordId'),
          decisionId:value(form,'decisionId'),
          method:value(form,'method'),
          metadataOutcome:enumValue(value(form,'metadataOutcome'),META_OUTCOMES,'Metadata outcome'),
          contentOutcome:enumValue(value(form,'contentOutcome'),CONTENT_OUTCOMES,'Content outcome'),
          evidence:jsonObject(value(form,'evidence'),'Destruction evidence')
        }
      );
      return{action:'createDestruction',ok:true,message:`Destruction Evidence ${evidence.integrityHash} recorded.`};
    }catch(error){return failure(error,'createDestruction');}
  },

  recordResult:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'recordResult',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const result=await getRecordsRetentionCommandService().recordItemResult(
        session.tenantId as TenantId,session.personId,
        {
          runId:value(form,'runId'),
          subjectObjectId:value(form,'subjectObjectId'),
          subjectVersion:optional(form,'subjectVersion'),
          outcome:enumValue(value(form,'outcome'),OUTCOMES,'Outcome'),
          reason:value(form,'reason'),
          holdId:optional(form,'holdId'),
          archiveRecordId:optional(form,'archiveRecordId'),
          destructionEvidenceId:optional(form,'destructionEvidenceId')
        }
      );
      return{action:'recordResult',ok:true,message:`Disposition Item recorded as ${result.outcome}.`};
    }catch(error){return failure(error,'recordResult');}
  },

  completeRun:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'completeRun',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const run=await getRecordsRetentionCommandService().completeRun(
        session.tenantId as TenantId,session.personId,value(form,'runId')
      );
      return{action:'completeRun',ok:true,message:`Disposition Run completed as ${run.status}.`};
    }catch(error){return failure(error,'completeRun');}
  },

  createRestore:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createRestore',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const restore=await getRecordsRetentionCommandService().createRestore(
        session.tenantId as TenantId,session.personId,
        {
          archiveRecordId:value(form,'archiveRecordId'),
          subjectObjectId:value(form,'subjectObjectId'),
          subjectVersion:optional(form,'subjectVersion'),
          restoreReference:value(form,'restoreReference'),
          decisionId:value(form,'decisionId'),
          restoredContentReference:value(form,'restoredContentReference'),
          integrityHash:value(form,'integrityHash'),
          status:value(form,'status')==='FAILED'?'FAILED':'SUCCEEDED',
          message:optional(form,'message')
        }
      );
      return{action:'createRestore',ok:true,message:`Restore ${restore.restoreReference} recorded as ${restore.status}.`};
    }catch(error){return failure(error,'createRestore');}
  }
};
