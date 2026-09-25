import { fail } from '@sveltejs/kit';
import type {
  MySqlHcmReadRepository,
  MySqlUniversalFunctionReadRepository
} from '@nublox/persistence';
import {
  SalesCommandError,
  SalesReadError
} from '@nublox/persistence';
import type {
  SalesForecastCategory,
  SalesOpportunityStage
} from '@nublox/kernel';
import type { Actions, PageServerLoad } from './$types';
import {
  getHcmReadRepository,
  getSalesCommandService,
  getSalesReadRepository,
  getUniversalFunctionReadRepository
} from '$lib/server/platform';

type TenantId=Parameters<MySqlHcmReadRepository['getUserExperience']>[0];
type FunctionCode=Parameters<MySqlUniversalFunctionReadRepository['getFunction']>[0];

function value(formData:FormData,name:string):string {
  return String(formData.get(name)??'').trim();
}

function salesFailure(error:unknown,action:string) {
  if(error instanceof SalesCommandError||error instanceof SalesReadError) {
    const status=error.code==='PERMISSION_DENIED'?403:error.code==='NOT_FOUND'?404:error.code==='CONFLICT'?409:400;
    return fail(status,{action,ok:false,error:error.message});
  }
  throw error;
}

export const load:PageServerLoad=async({locals})=>{
  const session=locals.auth;
  if(!session) return {experience:null,workspace:null,sales:null};

  const experience=await getHcmReadRepository().getUserExperience(
    session.tenantId as TenantId,
    session.personId
  );

  const workspace=experience?.functionCode
    ? await getUniversalFunctionReadRepository().getFunction(
        experience.functionCode as FunctionCode
      )
    : null;

  const sales=experience?.functionCode==='F07'
    ? await getSalesReadRepository().getWorkbench(
        session.tenantId as TenantId,
        session.personId
      )
    : null;

  return {experience,workspace,sales};
};

export const actions:Actions={
  createSalesAccount:async({request,locals})=>{
    const session=locals.auth;
    if(!session) return fail(401,{action:'createSalesAccount',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const account=await getSalesCommandService().createAccount(
        session.tenantId as TenantId,
        session.personId,
        {
          organisationId:value(formData,'organisationId'),
          code:value(formData,'code'),
          ownerPositionId:value(formData,'ownerPositionId'),
          segment:value(formData,'segment')
        }
      );
      return {action:'createSalesAccount',ok:true,message:`Sales Account ${account.code} created.`};
    } catch(error){return salesFailure(error,'createSalesAccount');}
  },

  createSalesOpportunity:async({request,locals})=>{
    const session=locals.auth;
    if(!session) return fail(401,{action:'createSalesOpportunity',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const opportunity=await getSalesCommandService().createOpportunity(
        session.tenantId as TenantId,
        session.personId,
        {
          salesAccountId:value(formData,'salesAccountId'),
          code:value(formData,'code'),
          title:value(formData,'title'),
          description:value(formData,'description'),
          ownerPositionId:value(formData,'ownerPositionId'),
          stage:value(formData,'stage') as SalesOpportunityStage,
          probabilityPercent:value(formData,'probabilityPercent'),
          estimatedValue:value(formData,'estimatedValue'),
          currency:value(formData,'currency'),
          expectedCloseDate:value(formData,'expectedCloseDate'),
          forecastCategory:value(formData,'forecastCategory') as SalesForecastCategory
        }
      );
      return {action:'createSalesOpportunity',ok:true,message:`Opportunity ${opportunity.code} created.`};
    } catch(error){return salesFailure(error,'createSalesOpportunity');}
  },

  updateSalesOpportunity:async({request,locals})=>{
    const session=locals.auth;
    if(!session) return fail(401,{action:'updateSalesOpportunity',ok:false,error:'Sign in required.'});
    const formData=await request.formData();
    try {
      const opportunity=await getSalesCommandService().updateOpportunity(
        session.tenantId as TenantId,
        session.personId,
        {
          opportunityId:value(formData,'opportunityId'),
          rowVersion:value(formData,'rowVersion'),
          title:value(formData,'title'),
          description:value(formData,'description'),
          ownerPositionId:value(formData,'ownerPositionId'),
          stage:value(formData,'stage') as SalesOpportunityStage,
          probabilityPercent:value(formData,'probabilityPercent'),
          estimatedValue:value(formData,'estimatedValue'),
          currency:value(formData,'currency'),
          expectedCloseDate:value(formData,'expectedCloseDate'),
          forecastCategory:value(formData,'forecastCategory') as SalesForecastCategory
        }
      );
      return {action:'updateSalesOpportunity',ok:true,message:`Opportunity ${opportunity.code} updated.`};
    } catch(error){return salesFailure(error,'updateSalesOpportunity');}
  }
};
