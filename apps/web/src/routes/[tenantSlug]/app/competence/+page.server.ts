import {
  CompetenceCommandError,
  type MySqlAccessRepository,
  type MySqlCompetenceReadRepository
} from '@nublox/persistence';
import {
  PLATFORM_PERMISSION_KEYS,
  type CompetenceSubjectType
} from '@nublox/kernel';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getCompetenceCommandService,
  getCompetenceReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlCompetenceReadRepository['getProjection']>[0];

function value(formData: FormData, name: string): string {
  return String(formData.get(name) ?? '').trim();
}
function optionalValue(formData: FormData, name: string): string | undefined {
  const result=value(formData,name); return result||undefined;
}
function failure(error:unknown,action:string){
  if(error instanceof CompetenceCommandError){
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}
function parseSubject(raw:string):{subjectType:CompetenceSubjectType;subjectId:string}{
  const [type='',...rest]=raw.split('|'); const subjectId=rest.join('|').trim();
  if(!subjectId||!['FUNCTION','SUB_FUNCTION','DEPLOYMENT'].includes(type)){
    throw new CompetenceCommandError('A valid competence subject is required.','INVALID_INPUT');
  }
  return {subjectType:type as CompetenceSubjectType,subjectId};
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {allowed:false,canManage:false,reason:'No authenticated tenant context is available.',projection:null};
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [readEvaluation,manageEvaluation]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.COMPETENCE_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.COMPETENCE_MANAGE,{scopeType:'TENANT'})
  ]);
  if(!readEvaluation.allowed) return {allowed:false,canManage:false,reason:readEvaluation.reason,projection:null};
  return {
    allowed:true,canManage:manageEvaluation.allowed,reason:readEvaluation.reason,
    projection:await getCompetenceReadRepository().getProjection(session.tenantId as ProjectionTenantId)
  };
};

export const actions:Actions={
  createRequirement:async({request,locals})=>{
    const session=locals.auth;
    if(!session) return fail(401,{action:'createRequirement',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try{
      const subject=parseSubject(value(formData,'subject'));
      const created=await getCompetenceCommandService().createRequirement(
        session.tenantId as TenantId,session.personId,{
          ...subject,
          competenceCode:value(formData,'competenceCode'),
          competenceName:value(formData,'competenceName'),
          requiredLevel:value(formData,'requiredLevel'),
          evidenceRequired:formData.has('evidenceRequired'),
          expiryRequired:formData.has('expiryRequired')
        }
      );
      return {action:'createRequirement',ok:true,message:`Competence requirement ${created.competenceCode} created.`};
    }catch(error){ return failure(error,'createRequirement'); }
  },
  createEvidence:async({request,locals})=>{
    const session=locals.auth;
    if(!session) return fail(401,{action:'createEvidence',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try{
      const created=await getCompetenceCommandService().createEvidence(
        session.tenantId as TenantId,session.personId,{
          personId:value(formData,'personId'),
          competenceCode:value(formData,'competenceCode'),
          attainedLevel:value(formData,'attainedLevel'),
          evidenceRecordId:optionalValue(formData,'evidenceRecordId'),
          issuedAt:optionalValue(formData,'issuedAt'),
          effectiveFrom:optionalValue(formData,'effectiveFrom'),
          effectiveTo:optionalValue(formData,'effectiveTo')
        }
      );
      return {action:'createEvidence',ok:true,message:`Competence evidence ${created.competenceCode} recorded.`};
    }catch(error){ return failure(error,'createEvidence'); }
  }
};
