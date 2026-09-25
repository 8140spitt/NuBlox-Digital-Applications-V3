import {
  PLATFORM_PERMISSION_KEYS,
  type EmploymentStatus,
  type EmploymentType,
  type PositionReportingRelationshipType,
  type WorkerType,
  type DeploymentPurpose
} from '@nublox/kernel';
import {
  HcmCommandError,
  OrganisationCommandError,
  type MySqlAccessRepository,
  type MySqlHcmReadRepository,
  type MySqlOrganisationReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import {
  getAccessRepository,
  getHcmCommandService,
  getHcmReadRepository,
  getOrganisationCommandService,
  getOrganisationReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type HcmTenantId=Parameters<MySqlHcmReadRepository['getProjection']>[0];
type OrganisationTenantId=Parameters<MySqlOrganisationReadRepository['getStructure']>[0];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optionalValue(form:FormData,name:string){const result=value(form,name);return result||undefined;}
function boolValue(form:FormData,name:string){return ['true','1','on','yes'].includes(value(form,name).toLowerCase());}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T)) throw new HcmCommandError(`A valid ${label} is required.`,'INVALID_INPUT');
  return raw as T;
}
function signedIn(locals:App.Locals){
  if(!locals.auth) throw new HcmCommandError('Sign in required.','PERMISSION_DENIED');
  return locals.auth;
}
function actionFailure(error:unknown,action:string){
  if(error instanceof HcmCommandError||error instanceof OrganisationCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {allowed:false,canManage:false,reason:'No authenticated tenant context is available.',projection:null,structure:null};
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.HCM_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.HCM_MANAGE,{scopeType:'TENANT'})
  ]);
  if(!read.allowed) return {allowed:false,canManage:false,reason:read.reason,projection:null,structure:null};
  const [projection,structure]=await Promise.all([
    getHcmReadRepository().getProjection(session.tenantId as HcmTenantId),
    getOrganisationReadRepository().getStructure(session.tenantId as OrganisationTenantId)
  ]);
  return {allowed:true,canManage:manage.allowed,reason:read.reason,projection,structure};
};

const WORKER_TYPES=['EMPLOYEE','CONTINGENT'] as const satisfies readonly WorkerType[];
const EMPLOYMENT_TYPES=['PERMANENT','FIXED_TERM','TEMPORARY','APPRENTICE','INTERN','CONTRACTOR'] as const satisfies readonly EmploymentType[];
const EMPLOYMENT_STATUSES=['PENDING','ACTIVE','SUSPENDED','ENDED'] as const satisfies readonly EmploymentStatus[];
const PURPOSES=['FUNCTIONAL_GOVERNANCE','FUNCTIONAL_DELIVERY'] as const satisfies readonly DeploymentPurpose[];
const REPORTING_TYPES=['LINE_MANAGER','FUNCTIONAL_MANAGER','DOTTED_LINE'] as const satisfies readonly PositionReportingRelationshipType[];

export const actions:Actions={
  createJobProfile:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createJobProfile(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),name:value(form,'name')
      });
      return {action:'createJobProfile',ok:true,message:`Job Profile ${result.code} — ${result.name} created.`};
    }catch(error){return actionFailure(error,'createJobProfile');}
  },
  createPerson:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getOrganisationCommandService().createPerson(session.tenantId as TenantId,session.personId,{
        legalName:value(form,'legalName'),preferredName:optionalValue(form,'preferredName')
      });
      return {action:'createPerson',ok:true,message:`Person ${result.preferredName??result.legalName} created.`};
    }catch(error){return actionFailure(error,'createPerson');}
  },
  createPosition:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getOrganisationCommandService().createPosition(session.tenantId as TenantId,session.personId,{
        organisationUnitId:value(form,'organisationUnitId'),jobProfileId:optionalValue(form,'jobProfileId'),
        code:value(form,'code'),title:value(form,'title')
      });
      return {action:'createPosition',ok:true,message:`Position ${result.code} — ${result.title} created.`};
    }catch(error){return actionFailure(error,'createPosition');}
  },
  createEmployment:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createEmployment(session.tenantId as TenantId,session.personId,{
        personId:value(form,'personId'),organisationId:value(form,'organisationId'),employeeNumber:value(form,'employeeNumber'),
        workerType:enumValue(value(form,'workerType'),WORKER_TYPES,'worker type'),
        employmentType:enumValue(value(form,'employmentType'),EMPLOYMENT_TYPES,'employment type'),
        startDate:value(form,'startDate'),endDate:optionalValue(form,'endDate'),
        status:enumValue(value(form,'status')||'ACTIVE',EMPLOYMENT_STATUSES,'employment status')
      });
      return {action:'createEmployment',ok:true,message:`Employment ${result.employeeNumber} created.`};
    }catch(error){return actionFailure(error,'createEmployment');}
  },
  assignFunction:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().assignPositionToFunction(session.tenantId as TenantId,session.personId,{
        positionId:value(form,'positionId'),functionId:value(form,'functionId'),
        deploymentPurpose:enumValue(value(form,'deploymentPurpose'),PURPOSES,'Function side'),
        isPrimary:boolValue(form,'isPrimary'),effectiveFrom:optionalValue(form,'effectiveFrom'),
        effectiveTo:optionalValue(form,'effectiveTo')
      });
      return {action:'assignFunction',ok:true,message:`Position assigned to ${result.functionId} ${result.deploymentPurpose==='FUNCTIONAL_DELIVERY'?'Delivery':'Governance'}.`};
    }catch(error){return actionFailure(error,'assignFunction');}
  },
  assignPosition:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getHcmCommandService().assignEmploymentToPosition(session.tenantId as TenantId,session.personId,{
        employmentId:value(form,'employmentId'),positionId:value(form,'positionId'),
        isPrimary:boolValue(form,'isPrimary'),effectiveFrom:optionalValue(form,'effectiveFrom'),effectiveTo:optionalValue(form,'effectiveTo')
      });
      return {action:'assignPosition',ok:true,message:'Employment assigned to Position.'};
    }catch(error){return actionFailure(error,'assignPosition');}
  },
  setManager:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().setReportingLine(session.tenantId as TenantId,session.personId,{
        subordinatePositionId:value(form,'subordinatePositionId'),managerPositionId:value(form,'managerPositionId'),
        relationshipType:enumValue(value(form,'relationshipType')||'LINE_MANAGER',REPORTING_TYPES,'reporting relationship'),
        effectiveFrom:optionalValue(form,'effectiveFrom'),effectiveTo:optionalValue(form,'effectiveTo')
      });
      return {action:'setManager',ok:true,message:`Position hierarchy updated (${result.relationshipType.replaceAll('_',' ').toLowerCase()}).`};
    }catch(error){return actionFailure(error,'setManager');}
  }
};
