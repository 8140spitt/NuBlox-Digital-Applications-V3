import { ExtensionCommandError, type MySqlAccessRepository } from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ExtensionCompatibilityOutcome,
  type ExtensionComponentKind,
  type ExtensionKind,
  type ExtensionReconciliationItemOutcome
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getAccessRepository, getExtensionCommandService, getExtensionReadRepository } from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
const KINDS=['INDUSTRY','TENANT','PLATFORM','INTEGRATION'] as const satisfies readonly ExtensionKind[];
const COMPONENTS=['TYPE','ATTRIBUTE','POLICY','RULE','WORKFLOW','UI_ACTION','API','INTEGRATION','SEED_DATA','OTHER'] as const satisfies readonly ExtensionComponentKind[];
const OUTCOMES=['COMPATIBLE','RECONCILIATION_REQUIRED','INCOMPATIBLE'] as const satisfies readonly ExtensionCompatibilityOutcome[];
const RECON=['UNCHANGED','AUTO_MERGED','MANUAL_REQUIRED','CONFLICT','RESOLVED'] as const satisfies readonly ExtensionReconciliationItemOutcome[];
function value(f:FormData,n:string){return String(f.get(n)??'').trim();}
function optional(f:FormData,n:string){const v=value(f,n);return v||undefined;}
function enumValue<T extends string>(v:string,a:readonly T[],l:string):T{if(!a.includes(v as T))throw new ExtensionCommandError(l+' is invalid.','INVALID_INPUT');return v as T;}
function jsonObject(raw:string,label:string):Readonly<Record<string,unknown>>{let p:unknown;try{p=JSON.parse(raw);}catch{throw new ExtensionCommandError(label+' must be valid JSON.','INVALID_INPUT');}if(typeof p!=='object'||p===null||Array.isArray(p))throw new ExtensionCommandError(label+' must be a JSON object.','INVALID_INPUT');return p as Readonly<Record<string,unknown>>;}
function failure(e:unknown,action:string){if(e instanceof ExtensionCommandError){const s=e.code==='PERMISSION_DENIED'?403:e.code==='NOT_FOUND'?404:e.code==='CONFLICT'?409:400;return fail(s,{action,ok:false,error:e.message,code:e.code});}throw e;}

export const load:PageServerLoad=async({locals})=>{
 const s=locals.auth;if(!s)return{allowed:false,canManage:false,canAssess:false,canReconcile:false,reason:'No authenticated tenant context is available.',projection:null};
 const t=s.tenantId as TenantId,a=getAccessRepository();
 const [read,manage,assess,reconcile]=await Promise.all([
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.EXTENSION_READ,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.EXTENSION_MANAGE,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.EXTENSION_ASSESS,{scopeType:'TENANT'}),
  a.evaluatePermission(t,s.personId,PLATFORM_PERMISSION_KEYS.EXTENSION_RECONCILE,{scopeType:'TENANT'})
 ]);
 if(!read.allowed)return{allowed:false,canManage:false,canAssess:false,canReconcile:false,reason:read.reason,projection:null};
 return{allowed:true,canManage:manage.allowed,canAssess:assess.allowed,canReconcile:reconcile.allowed,reason:read.reason,projection:await getExtensionReadRepository().getProjection(t,s.personId)};
};

export const actions:Actions={
 createDefinition:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'createDefinition',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().createDefinition(s.tenantId as TenantId,s.personId,{code:value(f,'code'),name:value(f,'name'),description:optional(f,'description'),extensionKind:enumValue(value(f,'extensionKind'),KINDS,'Extension kind'),ownerReference:value(f,'ownerReference')});return{action:'createDefinition',ok:true,message:`Extension ${i.code} created.`};}catch(e){return failure(e,'createDefinition');}},
 createPackage:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'createPackage',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().createPackageVersion(s.tenantId as TenantId,s.personId,{extensionDefinitionId:value(f,'extensionDefinitionId'),version:value(f,'version'),minimumPlatformVersion:optional(f,'minimumPlatformVersion'),maximumPlatformVersion:optional(f,'maximumPlatformVersion'),manifest:jsonObject(value(f,'manifest'),'Manifest')});return{action:'createPackage',ok:true,message:`Package ${i.version} frozen with ${i.checksum}.`};}catch(e){return failure(e,'createPackage');}},
 addComponent:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'addComponent',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().addComponent(s.tenantId as TenantId,s.personId,{packageVersionId:value(f,'packageVersionId'),componentKey:value(f,'componentKey'),componentKind:enumValue(value(f,'componentKind'),COMPONENTS,'Component kind'),targetObjectType:optional(f,'targetObjectType'),targetReference:optional(f,'targetReference'),definition:jsonObject(value(f,'definition'),'Component definition'),sequence:Number(value(f,'sequence'))});return{action:'addComponent',ok:true,message:`Component ${i.componentKey} added.`};}catch(e){return failure(e,'addComponent');}},
 assess:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'assess',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().assessCompatibility(s.tenantId as TenantId,s.personId,{packageVersionId:value(f,'packageVersionId'),platformVersion:value(f,'platformVersion'),outcome:enumValue(value(f,'outcome'),OUTCOMES,'Compatibility outcome'),evidence:jsonObject(value(f,'evidence'),'Compatibility evidence')});return{action:'assess',ok:true,message:`Compatibility recorded as ${i.outcome}.`};}catch(e){return failure(e,'assess');}},
 startReconciliation:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'startReconciliation',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().startReconciliation(s.tenantId as TenantId,s.personId,{extensionDefinitionId:value(f,'extensionDefinitionId'),fromPackageVersionId:value(f,'fromPackageVersionId'),toPackageVersionId:value(f,'toPackageVersionId'),targetPlatformVersion:value(f,'targetPlatformVersion')});return{action:'startReconciliation',ok:true,message:`Reconciliation ${i.id} started.`};}catch(e){return failure(e,'startReconciliation');}},
 recordItem:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'recordItem',ok:false,error:'Sign in required.'});const f=await request.formData();try{const rd=optional(f,'resolvedDefinition');const i=await getExtensionCommandService().recordReconciliationItem(s.tenantId as TenantId,s.personId,{runId:value(f,'runId'),componentKey:value(f,'componentKey'),outcome:enumValue(value(f,'outcome'),RECON,'Reconciliation outcome'),sourceChecksum:optional(f,'sourceChecksum'),targetChecksum:optional(f,'targetChecksum'),resolvedDefinition:rd?jsonObject(rd,'Resolved definition'):undefined,rationale:optional(f,'rationale')});return{action:'recordItem',ok:true,message:`Reconciliation item ${i.componentKey} recorded as ${i.outcome}.`};}catch(e){return failure(e,'recordItem');}},
 complete:async({request,locals})=>{const s=locals.auth;if(!s)return fail(401,{action:'complete',ok:false,error:'Sign in required.'});const f=await request.formData();try{const i=await getExtensionCommandService().completeReconciliation(s.tenantId as TenantId,s.personId,{runId:value(f,'runId'),summary:value(f,'summary')});return{action:'complete',ok:true,message:`Reconciliation completed as ${i.status}.`};}catch(e){return failure(e,'complete');}}
};
