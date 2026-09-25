import {
  SupplierSourcingCommandError,
  type MySqlAccessRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type SourceApprovalStatus,
  type SourcingRuleStatus,
  type SupplierRelationshipType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getSupplierSourcingCommandService,
  getSupplierSourcingReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];

const RELATIONSHIP_TYPES=['MANUFACTURER','VENDOR','SERVICE_PROVIDER','SUBCONTRACTOR','OTHER'] as const satisfies readonly SupplierRelationshipType[];
const SOURCE_STATUSES=['PREFERRED','APPROVED','DO_NOT_USE'] as const satisfies readonly SourceApprovalStatus[];
const RULE_STATUSES=['ACTIVE','DISABLED'] as const satisfies readonly SourcingRuleStatus[];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optional(form:FormData,name:string){const v=value(form,name);return v||undefined;}
function integer(raw:string,label:string){
  const n=Number(raw);
  if(!Number.isInteger(n)||n<1)throw new SupplierSourcingCommandError(label+' must be a positive integer.','INVALID_INPUT');
  return n;
}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T))throw new SupplierSourcingCommandError(label+' is invalid.','INVALID_INPUT');
  return raw as T;
}
function jsonObject(raw:string,label:string):Readonly<Record<string,unknown>>{
  let parsed:unknown;
  try{parsed=JSON.parse(raw);}catch{throw new SupplierSourcingCommandError(label+' must be valid JSON.','INVALID_INPUT');}
  if(typeof parsed!=='object'||parsed===null||Array.isArray(parsed)){
    throw new SupplierSourcingCommandError(label+' must be a JSON object.','INVALID_INPUT');
  }
  return parsed as Readonly<Record<string,unknown>>;
}
function failure(error:unknown,action:string){
  if(error instanceof SupplierSourcingCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session){
    return{
      allowed:false,canManage:false,canApprove:false,canManageRules:false,
      reason:'No authenticated tenant context is available.',projection:null
    };
  }
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,approve,rules]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_APPROVE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SUPPLIER_SOURCING_RULE_MANAGE,{scopeType:'TENANT'})
  ]);
  if(!read.allowed){
    return{
      allowed:false,canManage:false,canApprove:false,canManageRules:false,
      reason:read.reason,projection:null
    };
  }
  return{
    allowed:true,
    canManage:manage.allowed,
    canApprove:approve.allowed,
    canManageRules:rules.allowed,
    reason:read.reason,
    projection:await getSupplierSourcingReadRepository().getProjection(tenantId,session.personId)
  };
};

export const actions:Actions={
  createSupplierRelationship:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createSupplierRelationship',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const supplier=await getSupplierSourcingCommandService().createSupplierRelationship(
        session.tenantId as TenantId,session.personId,{
          supplierOrganisationId:value(form,'supplierOrganisationId'),
          relationshipType:enumValue(value(form,'relationshipType'),RELATIONSHIP_TYPES,'Relationship type'),
          code:value(form,'code'),name:value(form,'name')
        }
      );
      return{action:'createSupplierRelationship',ok:true,message:`Supplier Relationship ${supplier.code} created in IN_WORK.`};
    }catch(error){return failure(error,'createSupplierRelationship');}
  },

  releaseSupplierRelationship:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'releaseSupplierRelationship',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const supplier=await getSupplierSourcingCommandService().releaseSupplierRelationship(
        session.tenantId as TenantId,session.personId,{
          supplierRelationshipId:value(form,'supplierRelationshipId'),
          decisionId:value(form,'decisionId')
        }
      );
      return{action:'releaseSupplierRelationship',ok:true,message:`Supplier Relationship ${supplier.code} released.`};
    }catch(error){return failure(error,'releaseSupplierRelationship');}
  },

  cancelSupplierRelationship:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'cancelSupplierRelationship',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const supplier=await getSupplierSourcingCommandService().cancelSupplierRelationship(
        session.tenantId as TenantId,session.personId,{
          supplierRelationshipId:value(form,'supplierRelationshipId'),
          decisionId:value(form,'decisionId')
        }
      );
      return{action:'cancelSupplierRelationship',ok:true,message:`Supplier Relationship ${supplier.code} cancelled.`};
    }catch(error){return failure(error,'cancelSupplierRelationship');}
  },

  createSourcingContext:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createSourcingContext',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const context=await getSupplierSourcingCommandService().createSourcingContext(
        session.tenantId as TenantId,session.personId,{
          code:value(form,'code'),name:value(form,'name'),description:optional(form,'description'),
          scopeType:value(form,'scopeType'),scopeObjectId:optional(form,'scopeObjectId'),
          criteria:jsonObject(value(form,'criteria'),'Criteria')
        }
      );
      return{action:'createSourcingContext',ok:true,message:`Sourcing Context ${context.code} created.`};
    }catch(error){return failure(error,'createSourcingContext');}
  },

  previewApprovalVersion:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'previewApprovalVersion',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const fingerprint=getSupplierSourcingCommandService().getSourceApprovalDecisionVersion({
        sourcingContextId:value(form,'sourcingContextId'),
        supplierRelationshipId:value(form,'supplierRelationshipId'),
        supplierItemObjectId:value(form,'supplierItemObjectId'),
        sourceStatus:enumValue(value(form,'sourceStatus'),SOURCE_STATUSES,'Source status'),
        effectiveFrom:value(form,'effectiveFrom'),
        effectiveTo:optional(form,'effectiveTo')
      });
      return{
        action:'previewApprovalVersion',ok:true,
        message:'Exact Decision subject version generated. Create the approval in Control using this value.',
        approvalFingerprint:fingerprint,
        approvalSubjectObjectId:value(form,'internalItemObjectId')
      };
    }catch(error){return failure(error,'previewApprovalVersion');}
  },

  createSourceApproval:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createSourceApproval',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const approval=await getSupplierSourcingCommandService().createSourceApproval(
        session.tenantId as TenantId,session.personId,{
          sourcingContextId:value(form,'sourcingContextId'),
          supplierRelationshipId:value(form,'supplierRelationshipId'),
          internalItemObjectId:value(form,'internalItemObjectId'),
          supplierItemObjectId:value(form,'supplierItemObjectId'),
          sourceStatus:enumValue(value(form,'sourceStatus'),SOURCE_STATUSES,'Source status'),
          rationale:value(form,'rationale'),
          effectiveFrom:value(form,'effectiveFrom'),
          effectiveTo:optional(form,'effectiveTo'),
          decisionId:value(form,'decisionId')
        }
      );
      return{action:'createSourceApproval',ok:true,message:`Source status ${approval.sourceStatus} recorded for exact sourcing context/effectivity.`};
    }catch(error){return failure(error,'createSourceApproval');}
  },

  createSourcingRule:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'createSourcingRule',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const rule=await getSupplierSourcingCommandService().createSourcingRule(
        session.tenantId as TenantId,session.personId,{
          code:value(form,'code'),name:value(form,'name'),
          sourcingContextId:optional(form,'sourcingContextId'),
          supplierRelationshipId:optional(form,'supplierRelationshipId'),
          itemObjectType:optional(form,'itemObjectType'),
          criteria:jsonObject(value(form,'criteria'),'Criteria'),
          assignedStatus:enumValue(value(form,'assignedStatus'),SOURCE_STATUSES,'Assigned status'),
          priority:integer(value(form,'priority'),'Priority'),
          status:enumValue(value(form,'status'),RULE_STATUSES,'Rule status')
        }
      );
      return{action:'createSourcingRule',ok:true,message:`Sourcing Rule ${rule.code} created.`};
    }catch(error){return failure(error,'createSourcingRule');}
  },

  setSourcingRuleStatus:async({request,locals})=>{
    const session=locals.auth;
    if(!session)return fail(401,{action:'setSourcingRuleStatus',ok:false,error:'Sign in required.'});
    const form=await request.formData();
    try{
      const rule=await getSupplierSourcingCommandService().setSourcingRuleStatus(
        session.tenantId as TenantId,session.personId,{
          ruleId:value(form,'ruleId'),
          status:enumValue(value(form,'status'),RULE_STATUSES,'Rule status')
        }
      );
      return{action:'setSourcingRuleStatus',ok:true,message:`Sourcing Rule ${rule.code} is now ${rule.status}.`};
    }catch(error){return failure(error,'setSourcingRuleStatus');}
  }
};
