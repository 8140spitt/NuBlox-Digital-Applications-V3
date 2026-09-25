import {
  PLATFORM_PERMISSION_KEYS,
  type CareerTrack
} from '@nublox/kernel';
import {
  HcmCommandError,
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
  getOrganisationReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type HcmTenantId=Parameters<MySqlHcmReadRepository['getProjection']>[0];
type OrganisationTenantId=Parameters<MySqlOrganisationReadRepository['getStructure']>[0];

const CAREER_TRACKS=['INDIVIDUAL_CONTRIBUTOR','MANAGEMENT','EXECUTIVE','SPECIALIST'] as const satisfies readonly CareerTrack[];

function value(form:FormData,name:string){return String(form.get(name)??'').trim();}
function optionalValue(form:FormData,name:string){const result=value(form,name);return result||undefined;}
function numberValue(form:FormData,name:string){const result=Number(value(form,name));if(!Number.isFinite(result))throw new HcmCommandError(`${name} must be numeric.`,'INVALID_INPUT');return result;}
function enumValue<T extends string>(raw:string,allowed:readonly T[],label:string):T{
  if(!allowed.includes(raw as T)) throw new HcmCommandError(`A valid ${label} is required.`,'INVALID_INPUT');
  return raw as T;
}
function signedIn(locals:App.Locals){
  if(!locals.auth) throw new HcmCommandError('Sign in required.','PERMISSION_DENIED');
  return locals.auth;
}
function actionFailure(error:unknown,action:string){
  if(error instanceof HcmCommandError){
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

export const actions:Actions={
  createJobFamily:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createJobFamily(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),name:value(form,'name'),description:optionalValue(form,'description')
      });
      return {action:'createJobFamily',ok:true,message:`Job Family ${result.code} — ${result.name} created.`};
    }catch(error){return actionFailure(error,'createJobFamily');}
  },
  createJobSubfamily:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createJobSubfamily(session.tenantId as TenantId,session.personId,{
        familyId:value(form,'familyId'),code:value(form,'code'),name:value(form,'name'),description:optionalValue(form,'description')
      });
      return {action:'createJobSubfamily',ok:true,message:`Job Sub-family ${result.code} — ${result.name} created.`};
    }catch(error){return actionFailure(error,'createJobSubfamily');}
  },
  createCareerLevel:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createCareerLevel(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),name:value(form,'name'),track:enumValue(value(form,'track'),CAREER_TRACKS,'career track'),
        sequence:numberValue(form,'sequence')
      });
      return {action:'createCareerLevel',ok:true,message:`Career Level ${result.code} — ${result.name} created.`};
    }catch(error){return actionFailure(error,'createCareerLevel');}
  },
  createGrade:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().createGrade(session.tenantId as TenantId,session.personId,{
        code:value(form,'code'),name:value(form,'name'),sequence:numberValue(form,'sequence')
      });
      return {action:'createGrade',ok:true,message:`Grade ${result.code} — ${result.name} created.`};
    }catch(error){return actionFailure(error,'createGrade');}
  },
  assignJobArchitecture:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      const result=await getHcmCommandService().assignJobProfileArchitecture(session.tenantId as TenantId,session.personId,{
        jobProfileId:value(form,'jobProfileId'),familyId:value(form,'familyId'),subfamilyId:optionalValue(form,'subfamilyId'),
        careerLevelId:optionalValue(form,'careerLevelId'),gradeId:optionalValue(form,'gradeId'),
        effectiveFrom:optionalValue(form,'effectiveFrom'),effectiveTo:optionalValue(form,'effectiveTo')
      });
      return {action:'assignJobArchitecture',ok:true,message:`Architecture assigned to Job Profile ${result.jobProfileId}.`};
    }catch(error){return actionFailure(error,'assignJobArchitecture');}
  }
};
