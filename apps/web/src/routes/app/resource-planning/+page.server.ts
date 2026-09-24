import { PLATFORM_PERMISSION_KEYS } from '@nublox/kernel';
import {
  OrganisationalResourcePlanningCommandError,
  type MySqlAccessRepository,
  type MySqlOrganisationalResourcePlanningReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getOrganisationalResourcePlanningCommandService,
  getOrganisationalResourcePlanningReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId=Parameters<MySqlOrganisationalResourcePlanningReadRepository['getProjection']>[0];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optionalValue(form:FormData,name:string){const result=value(form,name);return result||undefined;}
function signedIn(locals:App.Locals){
  if(!locals.auth) throw new OrganisationalResourcePlanningCommandError('Sign in required.','PERMISSION_DENIED');
  return locals.auth;
}
function commandFailure(error:unknown,action:string){
  if(error instanceof OrganisationalResourcePlanningCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {allowed:false,canManage:false,canFulfil:false,reason:'No authenticated tenant context is available.',projection:null};
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,fulfil]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_FULFIL,{scopeType:'TENANT'})
  ]);
  if(!read.allowed) return {allowed:false,canManage:false,canFulfil:false,reason:read.reason,projection:null};
  return {
    allowed:true,canManage:manage.allowed,canFulfil:fulfil.allowed,reason:read.reason,
    projection:await getOrganisationalResourcePlanningReadRepository().getProjection(session.tenantId as ProjectionTenantId)
  };
};

export const actions:Actions={
  registerFunction:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const context=await getOrganisationalResourcePlanningCommandService().registerFunctionContext(
        session.tenantId as TenantId,session.personId,{
          functionId:value(form,'functionId'),organisationId:value(form,'organisationId'),
          organisationUnitId:value(form,'organisationUnitId'),effectiveFrom:optionalValue(form,'effectiveFrom')
        }
      );
      return {action:'registerFunction',ok:true,message:`${context.name} is now a permanent Function organisation.`};
    }catch(error){return commandFailure(error,'registerFunction');}
  },
  registerProject:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const context=await getOrganisationalResourcePlanningCommandService().registerProjectContext(
        session.tenantId as TenantId,session.personId,{
          projectObjectId:value(form,'projectObjectId'),organisationId:value(form,'organisationId'),
          effectiveFrom:optionalValue(form,'effectiveFrom'),effectiveTo:optionalValue(form,'effectiveTo')
        }
      );
      return {action:'registerProject',ok:true,message:`${context.code} is now a temporary Project organisation.`};
    }catch(error){return commandFailure(error,'registerProject');}
  },
  createRequirement:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const requirement=await getOrganisationalResourcePlanningCommandService().createResourceRequirement(
        session.tenantId as TenantId,session.personId,{
          requestingContextId:value(form,'requestingContextId'),
          supplyingFunctionContextId:value(form,'supplyingFunctionContextId'),
          jobProfileId:value(form,'jobProfileId'),roleTitle:value(form,'roleTitle'),
          description:value(form,'description'),requiredHeadcount:value(form,'requiredHeadcount'),
          requiredCapacityPercent:value(form,'requiredCapacityPercent'),
          effectiveFrom:value(form,'effectiveFrom'),effectiveTo:optionalValue(form,'effectiveTo')
        }
      );
      return {action:'createRequirement',ok:true,message:`${requirement.roleTitle} requested from the selected Function.`};
    }catch(error){return commandFailure(error,'createRequirement');}
  },
  fulfilRequirement:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getOrganisationalResourcePlanningCommandService().fulfilResourceRequirement(
        session.tenantId as TenantId,session.personId,{
          requirementId:value(form,'requirementId'),personId:value(form,'personId'),
          requirementSharePercent:value(form,'requirementSharePercent'),
          resourceCapacityPercent:optionalValue(form,'resourceCapacityPercent')
        }
      );
      return {action:'fulfilRequirement',ok:true,message:'Named Function resource deployed to the Project with capacity recorded.'};
    }catch(error){return commandFailure(error,'fulfilRequirement');}
  }
};
