import {
  ServiceDeliveryCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type ServiceExecutionRecordType,
  type ServiceOrderType,
  type ServicePriority
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getServiceDeliveryCommandService,
  getServiceDeliveryReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];
const ORDER_TYPES=['FIELD_SERVICE','INSTALLATION','MAINTENANCE','REPAIR','INSPECTION','PROFESSIONAL_SERVICE','OTHER'] as const satisfies readonly ServiceOrderType[];
const PRIORITIES=['LOW','NORMAL','HIGH','URGENT'] as const satisfies readonly ServicePriority[];
const RECORD_TYPES=['TRAVEL','ARRIVAL','WORK','INSPECTION','TEST','NOTE','COMPLETION'] as const satisfies readonly ServiceExecutionRecordType[];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optional(form:FormData,name:string){const raw=value(form,name);return raw||undefined;}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T)) throw new ServiceDeliveryCommandError(label+' is invalid.','INVALID_INPUT');
  return raw as T;
}
function numberValue(form:FormData,name:string,label:string){
  const raw=value(form,name);
  if(!raw) return undefined;
  const parsed=Number(raw);
  if(!Number.isFinite(parsed)||parsed<0) throw new ServiceDeliveryCommandError(label+' must be zero or greater.','INVALID_INPUT');
  return parsed;
}
function jsonObject(raw:string,label:string){
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{throw new ServiceDeliveryCommandError(label+' must be valid JSON.','INVALID_INPUT');}
  if(typeof parsed!=='object'||parsed===null||Array.isArray(parsed)) throw new ServiceDeliveryCommandError(label+' must be a JSON object.','INVALID_INPUT');
  return parsed as Readonly<Record<string,unknown>>;
}
function failure(error:unknown,action:string){
  if(error instanceof ServiceDeliveryCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return{allowed:false,canManage:false,canDispatch:false,canExecute:false,canAccept:false,reason:'No authenticated tenant context is available.',projection:null};
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,dispatch,execute,accept]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_DISPATCH,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_EXECUTE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SERVICE_DELIVERY_ACCEPT,{scopeType:'TENANT'})
  ]);
  if(!read.allowed) return{allowed:false,canManage:false,canDispatch:false,canExecute:false,canAccept:false,reason:read.reason,projection:null};
  return{
    allowed:true,
    canManage:manage.allowed,
    canDispatch:dispatch.allowed,
    canExecute:execute.allowed,
    canAccept:accept.allowed,
    reason:read.reason,
    projection:await getServiceDeliveryReadRepository().getProjection(tenantId,session.personId)
  };
};

export const actions:Actions={
  createOrder:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'createOrder',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const order=await getServiceDeliveryCommandService().createOrder(session.tenantId as TenantId,session.personId,{
        scopeObjectId:value(form,'scopeObjectId'),
        orderNumber:value(form,'orderNumber'),
        title:value(form,'title'),
        serviceType:enumValue(value(form,'serviceType'),ORDER_TYPES,'Service type'),
        priority:enumValue(value(form,'priority'),PRIORITIES,'Priority'),
        description:optional(form,'description'),
        serviceLocation:optional(form,'serviceLocation'),
        requestedStart:optional(form,'requestedStart'),
        requestedEnd:optional(form,'requestedEnd'),
        slaDueAt:optional(form,'slaDueAt')
      });
      return{action:'createOrder',ok:true,message:'Service Order '+order.orderNumber+' created.'};
    }catch(error){return failure(error,'createOrder');}
  },
  createAssignment:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'createAssignment',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      await getServiceDeliveryCommandService().createAssignment(session.tenantId as TenantId,session.personId,{
        serviceOrderId:value(form,'serviceOrderId'),
        assigneePersonId:value(form,'assigneePersonId'),
        scheduledStart:value(form,'scheduledStart'),
        scheduledEnd:value(form,'scheduledEnd'),
        dispatchNotes:optional(form,'dispatchNotes')
      });
      return{action:'createAssignment',ok:true,message:'Service assignment scheduled.'};
    }catch(error){return failure(error,'createAssignment');}
  },
  dispatchAssignment:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'dispatchAssignment',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      await getServiceDeliveryCommandService().dispatchAssignment(session.tenantId as TenantId,session.personId,value(form,'assignmentId'));
      return{action:'dispatchAssignment',ok:true,message:'Service assignment dispatched.'};
    }catch(error){return failure(error,'dispatchAssignment');}
  },
  startAssignment:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'startAssignment',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      await getServiceDeliveryCommandService().startAssignment(session.tenantId as TenantId,session.personId,value(form,'assignmentId'));
      return{action:'startAssignment',ok:true,message:'Field execution started.'};
    }catch(error){return failure(error,'startAssignment');}
  },
  recordExecution:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'recordExecution',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const evidence=value(form,'evidence');
      await getServiceDeliveryCommandService().recordExecution(session.tenantId as TenantId,session.personId,{
        serviceOrderId:value(form,'serviceOrderId'),
        assignmentId:optional(form,'assignmentId'),
        recordType:enumValue(value(form,'recordType'),RECORD_TYPES,'Record type'),
        occurredAt:optional(form,'occurredAt'),
        durationMinutes:numberValue(form,'durationMinutes','Duration minutes'),
        notes:optional(form,'notes'),
        evidence:evidence?jsonObject(evidence,'Evidence'):undefined
      });
      return{action:'recordExecution',ok:true,message:'Execution evidence recorded.'};
    }catch(error){return failure(error,'recordExecution');}
  },
  completeOrder:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'completeOrder',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const order=await getServiceDeliveryCommandService().completeOrder(session.tenantId as TenantId,session.personId,value(form,'serviceOrderId'));
      return{action:'completeOrder',ok:true,message:'Service Order '+order.orderNumber+' completed.'};
    }catch(error){return failure(error,'completeOrder');}
  },
  acceptOrder:async({request,locals})=>{
    const session=locals.auth;if(!session)return fail(401,{action:'acceptOrder',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const order=await getServiceDeliveryCommandService().acceptOrder(session.tenantId as TenantId,session.personId,{
        serviceOrderId:value(form,'serviceOrderId'),
        acceptanceNote:optional(form,'acceptanceNote')
      });
      return{action:'acceptOrder',ok:true,message:'Service Order '+order.orderNumber+' accepted.'};
    }catch(error){return failure(error,'acceptOrder');}
  }
};
