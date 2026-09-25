import {
  ManufacturingCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ControlCharacteristicSeverity,
  type ControlCharacteristicType,
  type ManufacturingOperationType,
  type ManufacturingResourceType,
  type ManufacturingSequenceType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import {
  getAccessRepository,
  getManufacturingCommandService,
  getManufacturingReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];
const OP_TYPES=['PROCESS','INSPECTION','MOVE','WAIT','PACK','OTHER'] as const satisfies readonly ManufacturingOperationType[];
const SEQ_TYPES=['FINISH_START','START_START','FINISH_FINISH','START_FINISH'] as const satisfies readonly ManufacturingSequenceType[];
const RES_TYPES=['WORK_CENTER','LABOUR','SKILL','TOOLING','EQUIPMENT','PROCESSING_MATERIAL'] as const satisfies readonly ManufacturingResourceType[];
const CC_TYPES=['DIMENSION','ATTRIBUTE','MATERIAL','PROCESS_PARAMETER','VISUAL','FUNCTIONAL','OTHER'] as const satisfies readonly ControlCharacteristicType[];
const SEVERITIES=['CRITICAL','MAJOR','MINOR','INFORMATIONAL'] as const satisfies readonly ControlCharacteristicSeverity[];

function value(f:FormData,n:string){return String(f.get(n)??'').trim();}
function optional(f:FormData,n:string){const v=value(f,n);return v||undefined;}
function numberValue(f:FormData,n:string,label:string){const v=Number(value(f,n));if(!Number.isFinite(v))throw new ManufacturingCommandError(label+' must be numeric.','INVALID_INPUT');return v;}
function integer(f:FormData,n:string,label:string){const v=numberValue(f,n,label);if(!Number.isInteger(v)||v<1)throw new ManufacturingCommandError(label+' must be a positive integer.','INVALID_INPUT');return v;}
function checked(f:FormData,n:string){return f.get(n)!==null;}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{if(!allowed.includes(raw as T))throw new ManufacturingCommandError(label+' is invalid.','INVALID_INPUT');return raw as T;}
function jsonObject(raw:string,label:string){let p:unknown;try{p=JSON.parse(raw);}catch{throw new ManufacturingCommandError(label+' must be valid JSON.','INVALID_INPUT');}if(typeof p!=='object'||p===null||Array.isArray(p))throw new ManufacturingCommandError(label+' must be a JSON object.','INVALID_INPUT');return p as Readonly<Record<string,unknown>>;}
function failure(e:unknown,action:string){if(e instanceof ManufacturingCommandError){const s=e.code==='PERMISSION_DENIED'?403:e.code==='NOT_FOUND'?404:e.code==='CONFLICT'?409:400;return fail(s,{action,ok:false,error:e.message,code:e.code});}throw e;}

export const load:PageServerLoad=async({locals})=>{
 const s=locals.auth;if(!s)return{allowed:false,canManage:false,canRelease:false,canResources:false,canCharacteristics:false,reason:'No authenticated tenant context is available.',projection:null};
 const t=s.tenantId as TenantId,a=getAccessRepository();
 const [read,manage,release,resources,characteristics]=await Promise.all([
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.MANUFACTURING_READ,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.MANUFACTURING_MANAGE,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RELEASE,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.MANUFACTURING_RESOURCE_MANAGE,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.MANUFACTURING_CONTROL_CHARACTERISTIC_MANAGE,{scopeType:'TENANT'})
 ]);
 if(!read.allowed)return{allowed:false,canManage:false,canRelease:false,canResources:false,canCharacteristics:false,reason:read.reason,projection:null};
 return{allowed:true,canManage:manage.allowed,canRelease:release.allowed,canResources:resources.allowed,canCharacteristics:characteristics.allowed,reason:read.reason,projection:await getManufacturingReadRepository().getProjection(t,s.personId)};
};

export const actions:Actions={
 createPlan:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'createPlan',ok:false,error:'Sign in required.'});const f=await request.formData();try{const p=await getManufacturingCommandService().createProcessPlan(s.tenantId as TenantId,s.personId,{scopeObjectId:value(f,'scopeObjectId'),code:value(f,'code'),name:value(f,'name'),version:integer(f,'version','Version'),description:optional(f,'description'),plantReference:optional(f,'plantReference')});return{action:'createPlan',ok:true,message:`Process Plan ${p.code} v${p.version} created.`};}catch(e){return failure(e,'createPlan');}},
 addOperation:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'addOperation',ok:false,error:'Sign in required.'});const f=await request.formData();try{const o=await getManufacturingCommandService().addOperation(s.tenantId as TenantId,s.personId,{processPlanId:value(f,'processPlanId'),operationNumber:value(f,'operationNumber'),name:value(f,'name'),operationType:enumValue(value(f,'operationType'),OP_TYPES,'Operation type'),description:optional(f,'description'),setupMinutes:numberValue(f,'setupMinutes','Setup minutes'),runMinutes:numberValue(f,'runMinutes','Run minutes'),yieldPercent:numberValue(f,'yieldPercent','Yield percent'),workInstructions:value(f,'workInstructions')?jsonObject(value(f,'workInstructions'),'Work instructions'):undefined});return{action:'addOperation',ok:true,message:`Operation ${o.operationNumber} added.`};}catch(e){return failure(e,'addOperation');}},
 addSequence:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'addSequence',ok:false,error:'Sign in required.'});const f=await request.formData();try{await getManufacturingCommandService().addSequence(s.tenantId as TenantId,s.personId,{processPlanId:value(f,'processPlanId'),predecessorOperationId:value(f,'predecessorOperationId'),successorOperationId:value(f,'successorOperationId'),sequenceType:enumValue(value(f,'sequenceType'),SEQ_TYPES,'Sequence type'),lagMinutes:numberValue(f,'lagMinutes','Lag minutes')});return{action:'addSequence',ok:true,message:'Operation sequence added.'};}catch(e){return failure(e,'addSequence');}},
 createResource:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'createResource',ok:false,error:'Sign in required.'});const f=await request.formData();try{const r=await getManufacturingCommandService().createResource(s.tenantId as TenantId,s.personId,{code:value(f,'code'),name:value(f,'name'),resourceType:enumValue(value(f,'resourceType'),RES_TYPES,'Resource type'),description:optional(f,'description'),capacityUnit:optional(f,'capacityUnit'),capacityPerDay:optional(f,'capacityPerDay')?numberValue(f,'capacityPerDay','Capacity per day'):undefined,effectiveFrom:optional(f,'effectiveFrom'),effectiveTo:optional(f,'effectiveTo'),status:value(f,'status')==='INACTIVE'?'INACTIVE':'ACTIVE'});return{action:'createResource',ok:true,message:`Resource ${r.code} created.`};}catch(e){return failure(e,'createResource');}},
 allocateResource:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'allocateResource',ok:false,error:'Sign in required.'});const f=await request.formData();try{await getManufacturingCommandService().allocateResource(s.tenantId as TenantId,s.personId,{operationId:value(f,'operationId'),resourceId:value(f,'resourceId'),quantity:numberValue(f,'quantity','Quantity'),usageUnit:value(f,'usageUnit'),required:checked(f,'required')});return{action:'allocateResource',ok:true,message:'Resource allocated.'};}catch(e){return failure(e,'allocateResource');}},
 createCharacteristic:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'createCharacteristic',ok:false,error:'Sign in required.'});const f=await request.formData();try{const c=await getManufacturingCommandService().createControlCharacteristic(s.tenantId as TenantId,s.personId,{scopeObjectId:value(f,'scopeObjectId'),operationId:optional(f,'operationId'),code:value(f,'code'),name:value(f,'name'),characteristicType:enumValue(value(f,'characteristicType'),CC_TYPES,'Characteristic type'),severity:enumValue(value(f,'severity'),SEVERITIES,'Severity'),unit:optional(f,'unit'),nominalValue:optional(f,'nominalValue')?numberValue(f,'nominalValue','Nominal value'):undefined,lowerLimit:optional(f,'lowerLimit')?numberValue(f,'lowerLimit','Lower limit'):undefined,upperLimit:optional(f,'upperLimit')?numberValue(f,'upperLimit','Upper limit'):undefined,specification:optional(f,'specification'),samplingPlan:value(f,'samplingPlan')?jsonObject(value(f,'samplingPlan'),'Sampling plan'):undefined,effectiveFrom:optional(f,'effectiveFrom'),effectiveTo:optional(f,'effectiveTo'),status:value(f,'status')==='INACTIVE'?'INACTIVE':'ACTIVE'});return{action:'createCharacteristic',ok:true,message:`Control Characteristic ${c.code} created.`};}catch(e){return failure(e,'createCharacteristic');}},
 freezePlan:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'freezePlan',ok:false,error:'Sign in required.'});const f=await request.formData();try{const p=await getManufacturingCommandService().freezePlan(s.tenantId as TenantId,s.personId,value(f,'planId'));return{action:'freezePlan',ok:true,message:`Process Plan frozen at ${p.checksum}.`};}catch(e){return failure(e,'freezePlan');}},
 releasePlan:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'releasePlan',ok:false,error:'Sign in required.'});const f=await request.formData();try{const p=await getManufacturingCommandService().releasePlan(s.tenantId as TenantId,s.personId,{planId:value(f,'planId'),decisionId:value(f,'decisionId')});return{action:'releasePlan',ok:true,message:`Process Plan ${p.code} v${p.version} released.`};}catch(e){return failure(e,'releasePlan');}}
};
