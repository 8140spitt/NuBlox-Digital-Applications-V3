import {
  PLATFORM_PERMISSION_KEYS,
  type SiteFieldEvidenceType,
  type SiteIssuePriority,
  type SiteIssueType
} from '@nublox/kernel';
import {
  ConstructionSiteProductionCommandError,
  type MySqlAccessRepository,
  type MySqlConstructionSiteProductionReadRepository
} from '@nublox/persistence';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getAccessRepository,
  getConstructionSiteProductionCommandService,
  getConstructionSiteProductionReadRepository
} from '$lib/server/platform';

type TenantId = Parameters<MySqlAccessRepository['evaluatePermission']>[0];
type ProjectionTenantId = Parameters<MySqlConstructionSiteProductionReadRepository['getProjection']>[0];

function value(formData:FormData,name:string) {
  return String(formData.get(name)??'').trim();
}
function optionalValue(formData:FormData,name:string) {
  const result=value(formData,name);
  return result||undefined;
}
function numberValue(formData:FormData,name:string) {
  const raw=optionalValue(formData,name);
  return raw===undefined?undefined:Number(raw);
}
function parseEnum<T extends string>(raw:string,allowed:ReadonlyArray<T>,label:string):T {
  if(!allowed.includes(raw as T)) throw new ConstructionSiteProductionCommandError(`A valid ${label} is required.`,'INVALID_INPUT');
  return raw as T;
}
function signedIn(locals:App.Locals) {
  if(!locals.auth) throw new ConstructionSiteProductionCommandError('Sign in required.','PERMISSION_DENIED');
  return locals.auth;
}
function commandFailure(error:unknown,action:string) {
  if(error instanceof ConstructionSiteProductionCommandError) {
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message,code:error.code});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {allowed:false,canManage:false,canExecute:false,canManageIssues:false,reason:'No authenticated tenant context is available.',projection:null};
  const tenantId=session.tenantId as TenantId;
  const access=getAccessRepository();
  const [read,manage,execute,issueManage]=await Promise.all([
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_READ,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_MANAGE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_EXECUTE,{scopeType:'TENANT'}),
    access.evaluatePermission(tenantId,session.personId,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_ISSUE_MANAGE,{scopeType:'TENANT'})
  ]);
  if(!read.allowed) return {allowed:false,canManage:false,canExecute:false,canManageIssues:false,reason:read.reason,projection:null};
  return {
    allowed:true,
    canManage:manage.allowed,
    canExecute:execute.allowed,
    canManageIssues:issueManage.allowed,
    reason:read.reason,
    projection:await getConstructionSiteProductionReadRepository().getProjection(session.tenantId as ProjectionTenantId,session.personId)
  };
};

export const actions:Actions={
  createWorkPackage:async({request,locals})=>{
    try{
      const session=signedIn(locals);
      const form=await request.formData();
      const result=await getConstructionSiteProductionCommandService().createWorkPackage(
        session.tenantId as TenantId,session.personId,{
          projectObjectId:value(form,'projectObjectId'),
          code:value(form,'code'),
          title:value(form,'title'),
          description:optionalValue(form,'description'),
          managerPersonId:optionalValue(form,'managerPersonId'),
          plannedStart:optionalValue(form,'plannedStart'),
          plannedEnd:optionalValue(form,'plannedEnd')
        }
      );
      return {action:'createWorkPackage',ok:true,message:`Work Package ${result.code} created.`};
    }catch(error){return commandFailure(error,'createWorkPackage');}
  },
  activateWorkPackage:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().activateWorkPackage(session.tenantId as TenantId,session.personId,value(form,'workPackageId'));
      return {action:'activateWorkPackage',ok:true,message:'Work Package activated.'};
    }catch(error){return commandFailure(error,'activateWorkPackage');}
  },
  dailyLog:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().createDailyLog(session.tenantId as TenantId,session.personId,{
        workPackageId:value(form,'workPackageId'),logDate:value(form,'logDate'),summary:value(form,'summary'),
        conditions:optionalValue(form,'conditions'),labourCount:numberValue(form,'labourCount'),
        plantSummary:optionalValue(form,'plantSummary'),materialsSummary:optionalValue(form,'materialsSummary')
      });
      return {action:'dailyLog',ok:true,message:'Daily site log recorded.'};
    }catch(error){return commandFailure(error,'dailyLog');}
  },
  progress:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().recordProgress(session.tenantId as TenantId,session.personId,{
        workPackageId:value(form,'workPackageId'),percentComplete:value(form,'percentComplete'),
        quantityCompleted:optionalValue(form,'quantityCompleted'),unit:optionalValue(form,'unit'),
        note:optionalValue(form,'note'),occurredAt:optionalValue(form,'occurredAt')
      });
      return {action:'progress',ok:true,message:'Progress recorded.'};
    }catch(error){return commandFailure(error,'progress');}
  },
  evidence:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().recordEvidence(session.tenantId as TenantId,session.personId,{
        workPackageId:value(form,'workPackageId'),
        evidenceType:parseEnum<SiteFieldEvidenceType>(value(form,'evidenceType'),['PHOTO','DOCUMENT','CHECKLIST','MEASUREMENT','DELIVERY','OTHER'],'evidence type'),
        reference:value(form,'reference'),description:optionalValue(form,'description'),occurredAt:optionalValue(form,'occurredAt')
      });
      return {action:'evidence',ok:true,message:'Field evidence recorded.'};
    }catch(error){return commandFailure(error,'evidence');}
  },
  issue:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().createIssue(session.tenantId as TenantId,session.personId,{
        workPackageId:value(form,'workPackageId'),
        issueType:parseEnum<SiteIssueType>(value(form,'issueType'),['RFI','PUNCH','DEFECT','BLOCKER','QUALITY','SAFETY','DESIGN','OTHER'],'issue type'),
        title:value(form,'title'),description:value(form,'description'),
        priority:parseEnum<SiteIssuePriority>(value(form,'priority'),['LOW','NORMAL','HIGH','CRITICAL'],'priority'),
        assignedToPersonId:optionalValue(form,'assignedToPersonId'),dueAt:optionalValue(form,'dueAt')
      });
      return {action:'issue',ok:true,message:'Site issue raised.'};
    }catch(error){return commandFailure(error,'issue');}
  },
  resolveIssue:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().resolveIssue(session.tenantId as TenantId,session.personId,value(form,'issueId'));
      return {action:'resolveIssue',ok:true,message:'Site issue resolved.'};
    }catch(error){return commandFailure(error,'resolveIssue');}
  },
  completeWorkPackage:async({request,locals})=>{
    try{
      const session=signedIn(locals);const form=await request.formData();
      await getConstructionSiteProductionCommandService().completeWorkPackage(session.tenantId as TenantId,session.personId,value(form,'workPackageId'));
      return {action:'completeWorkPackage',ok:true,message:'Work Package completed with progress, issue and evidence gates satisfied.'};
    }catch(error){return commandFailure(error,'completeWorkPackage');}
  }
};
