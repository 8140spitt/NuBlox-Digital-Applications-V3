import {
  ConfigurationPromotionCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ConfigurationChangeOperation,
  type ConfigurationEnvironmentType,
  type ConfigurationPromotionConflictDispositionType,
  type ConfigurationPromotionConflictSeverity,
  type ConfigurationPromotionConflictType,
  type ConfigurationPromotionItemOutcome
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getConfigurationPromotionCommandService,
  getConfigurationPromotionReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const ENVIRONMENTS=['DEVELOPMENT','INTEGRATION','TEST','PREPRODUCTION','PRODUCTION'] as const satisfies readonly ConfigurationEnvironmentType[];
const OPERATIONS=['CREATE','UPDATE','DELETE'] as const satisfies readonly ConfigurationChangeOperation[];
const OUTCOMES=['APPLIED','NO_CHANGE','SKIPPED','FAILED','CONFLICT'] as const satisfies readonly ConfigurationPromotionItemOutcome[];
const CONFLICT_TYPES=['MAPPING','DEPENDENCY','VERSION','AUTHORITY','COMPATIBILITY','TARGET_DRIFT','DATA','OTHER'] as const satisfies readonly ConfigurationPromotionConflictType[];
const SEVERITIES=['WARNING','BLOCKING'] as const satisfies readonly ConfigurationPromotionConflictSeverity[];
const DISPOSITIONS=['MAP','USE_SOURCE','USE_TARGET','WAIVE','EXCLUDE','ABORT'] as const satisfies readonly ConfigurationPromotionConflictDispositionType[];

function value(f:FormData,n:string){return String(f.get(n)??'').trim();}
function optional(f:FormData,n:string){const v=value(f,n);return v||undefined;}
function integer(raw:string,label:string){const n=Number(raw);if(!Number.isInteger(n)||n<1)throw new ConfigurationPromotionCommandError(label+' must be a positive integer.','INVALID_INPUT');return n;}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T))throw new ConfigurationPromotionCommandError(label+' is invalid.','INVALID_INPUT');
  return raw as T;
}
function jsonObject(raw:string,label:string):Readonly<Record<string,unknown>>{
  let p:unknown;try{p=JSON.parse(raw);}catch{throw new ConfigurationPromotionCommandError(label+' must be valid JSON.','INVALID_INPUT');}
  if(typeof p!=='object'||p===null||Array.isArray(p))throw new ConfigurationPromotionCommandError(label+' must be a JSON object.','INVALID_INPUT');
  return p as Readonly<Record<string,unknown>>;
}
function dependencies(raw:string):readonly string[]|undefined{
  if(!raw.trim())return undefined;
  return raw.split(',').map(x=>x.trim()).filter(Boolean);
}
function failure(e:unknown,action:string){
  if(e instanceof ConfigurationPromotionCommandError){
    const status=e.code==='PERMISSION_DENIED'?403:e.code==='NOT_FOUND'?404:e.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:e.message,code:e.code});
  }
  throw e;
}

export const load:PageServerLoad=async({locals})=>{
  const s=locals.auth;
  if(!s)return{allowed:false,canManage:false,canApprove:false,canExecute:false,canDisposition:false,reason:'No authenticated tenant context is available.',projection:null};
  const t=s.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,approve,execute,disposition]=await Promise.all([
    access.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_APPROVE,{scopeType:'TENANT'}),
    access.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE,{scopeType:'TENANT'}),
    access.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_CONFLICT_DISPOSITION,{scopeType:'TENANT'})
  ]);
  if(!read.allowed)return{allowed:false,canManage:false,canApprove:false,canExecute:false,canDisposition:false,reason:read.reason,projection:null};
  return{
    allowed:true,canManage:manage.allowed,canApprove:approve.allowed,canExecute:execute.allowed,
    canDisposition:disposition.allowed,reason:read.reason,
    projection:await getConfigurationPromotionReadRepository().getProjection(t,s.personId)
  };
};

export const actions:Actions={
  createEnvironment:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'createEnvironment',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().createEnvironment(s.tenantId as TenantId,s.personId,{
        code:value(f,'code'),name:value(f,'name'),
        environmentType:enumValue(value(f,'environmentType'),ENVIRONMENTS,'Environment type'),
        platformVersion:value(f,'platformVersion'),environmentReference:value(f,'environmentReference')
      });
      return{action:'createEnvironment',ok:true,message:`Environment ${i.code} created.`};
    }catch(e){return failure(e,'createEnvironment');}
  },
  createBaseline:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'createBaseline',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().createBaseline(s.tenantId as TenantId,s.personId,{
        environmentId:value(f,'environmentId'),baselineReference:value(f,'baselineReference'),platformVersion:value(f,'platformVersion')
      });
      return{action:'createBaseline',ok:true,message:`Baseline ${i.baselineReference} created in DRAFT.`};
    }catch(e){return failure(e,'createBaseline');}
  },
  addBaselineItem:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'addBaselineItem',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().addBaselineItem(s.tenantId as TenantId,s.personId,{
        baselineId:value(f,'baselineId'),sequence:integer(value(f,'sequence'),'Sequence'),
        objectFamily:value(f,'objectFamily'),objectReference:value(f,'objectReference'),
        objectVersion:optional(f,'objectVersion'),contentHash:value(f,'contentHash'),
        snapshot:jsonObject(value(f,'snapshot'),'Snapshot')
      });
      return{action:'addBaselineItem',ok:true,message:`Baseline item ${i.objectReference} added.`};
    }catch(e){return failure(e,'addBaselineItem');}
  },
  freezeBaseline:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'freezeBaseline',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().freezeBaseline(s.tenantId as TenantId,s.personId,value(f,'baselineId'));
      return{action:'freezeBaseline',ok:true,message:`Baseline ${i.baselineReference} frozen with ${i.checksum}.`};
    }catch(e){return failure(e,'freezeBaseline');}
  },
  createChangeSet:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'createChangeSet',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().createChangeSet(s.tenantId as TenantId,s.personId,{
        sourceEnvironmentId:value(f,'sourceEnvironmentId'),baseBaselineId:value(f,'baseBaselineId'),
        scopeObjectId:value(f,'scopeObjectId'),code:value(f,'code'),name:value(f,'name'),
        description:optional(f,'description'),version:value(f,'version')
      });
      return{action:'createChangeSet',ok:true,message:`Change Set ${i.code} v${i.version} created.`};
    }catch(e){return failure(e,'createChangeSet');}
  },
  addChangeItem:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'addChangeItem',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().addChangeItem(s.tenantId as TenantId,s.personId,{
        changeSetId:value(f,'changeSetId'),sequence:integer(value(f,'sequence'),'Sequence'),
        operation:enumValue(value(f,'operation'),OPERATIONS,'Operation'),objectFamily:value(f,'objectFamily'),
        objectReference:value(f,'objectReference'),beforeHash:optional(f,'beforeHash'),afterHash:optional(f,'afterHash'),
        definition:jsonObject(value(f,'definition'),'Definition'),dependencies:dependencies(value(f,'dependencies'))
      });
      return{action:'addChangeItem',ok:true,message:`Change item ${i.objectReference} added.`};
    }catch(e){return failure(e,'addChangeItem');}
  },
  freezeChangeSet:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'freezeChangeSet',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().freezeChangeSet(s.tenantId as TenantId,s.personId,value(f,'changeSetId'));
      return{action:'freezeChangeSet',ok:true,message:`Change Set ${i.code} frozen at ${i.checksum}.`};
    }catch(e){return failure(e,'freezeChangeSet');}
  },
  approveChangeSet:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'approveChangeSet',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().approveChangeSet(s.tenantId as TenantId,s.personId,{
        changeSetId:value(f,'changeSetId'),decisionId:value(f,'decisionId')
      });
      return{action:'approveChangeSet',ok:true,message:`Change Set ${i.code} approved against exact checksum.`};
    }catch(e){return failure(e,'approveChangeSet');}
  },
  createRun:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'createRun',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().createRun(s.tenantId as TenantId,s.personId,{
        changeSetId:value(f,'changeSetId'),sourceEnvironmentId:value(f,'sourceEnvironmentId'),
        targetEnvironmentId:value(f,'targetEnvironmentId'),sourceBaselineId:value(f,'sourceBaselineId'),
        expectedTargetBaselineId:value(f,'expectedTargetBaselineId'),runReference:value(f,'runReference'),
        mappingDefinition:jsonObject(value(f,'mappingDefinition'),'Mapping definition'),
        rollbackDefinition:jsonObject(value(f,'rollbackDefinition'),'Rollback definition')
      });
      return{action:'createRun',ok:true,message:`Promotion ${i.runReference} queued.`};
    }catch(e){return failure(e,'createRun');}
  },
  startRun:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'startRun',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().startRun(s.tenantId as TenantId,s.personId,value(f,'runId'));
      return{action:'startRun',ok:true,message:`Promotion ${i.runReference} started.`};
    }catch(e){return failure(e,'startRun');}
  },
  recordResult:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'recordResult',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().recordItemResult(s.tenantId as TenantId,s.personId,{
        runId:value(f,'runId'),changeItemId:value(f,'changeItemId'),
        outcome:enumValue(value(f,'outcome'),OUTCOMES,'Promotion outcome'),
        targetHash:optional(f,'targetHash'),message:optional(f,'message')
      });
      return{action:'recordResult',ok:true,message:`Promotion item recorded as ${i.outcome}.`};
    }catch(e){return failure(e,'recordResult');}
  },
  createConflict:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'createConflict',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().createConflict(s.tenantId as TenantId,s.personId,{
        runId:value(f,'runId'),itemResultId:optional(f,'itemResultId'),
        conflictType:enumValue(value(f,'conflictType'),CONFLICT_TYPES,'Conflict type'),
        severity:enumValue(value(f,'severity'),SEVERITIES,'Severity'),
        code:value(f,'code'),description:value(f,'description')
      });
      return{action:'createConflict',ok:true,message:`Conflict ${i.code} opened as ${i.severity}.`};
    }catch(e){return failure(e,'createConflict');}
  },
  dispositionConflict:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'dispositionConflict',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().dispositionConflict(s.tenantId as TenantId,s.personId,{
        conflictId:value(f,'conflictId'),
        disposition:enumValue(value(f,'disposition'),DISPOSITIONS,'Disposition'),
        rationale:value(f,'rationale'),decisionId:value(f,'decisionId')
      });
      return{action:'dispositionConflict',ok:true,message:`Conflict is now ${i.status}.`};
    }catch(e){return failure(e,'dispositionConflict');}
  },
  completeRun:async({request,locals})=>{
    const s=locals.auth;if(!s)return fail(401,{action:'completeRun',ok:false,error:'Sign in required.'});
    const f=await request.formData();
    try{
      const i=await getConfigurationPromotionCommandService().completeRun(s.tenantId as TenantId,s.personId,{
        runId:value(f,'runId'),resultingTargetBaselineId:optional(f,'resultingTargetBaselineId')
      });
      return{action:'completeRun',ok:true,message:`Promotion completed as ${i.status}.`};
    }catch(e){return failure(e,'completeRun');}
  }
};
