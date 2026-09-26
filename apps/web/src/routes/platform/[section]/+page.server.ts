import { PlatformAdministrationError, type PlatformGlobalSectionKey } from '@nublox/persistence';
import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
  getPlatformControlPlaneCommandService,
  getPlatformControlPlaneReadRepository,
  requirePlatformOperator
} from '$lib/server/platform-control-plane';

function field(formData:FormData,name:string):string{return String(formData.get(name)??'').trim();}
function checked(formData:FormData,name:string):boolean{return formData.get(name)==='on'||formData.get(name)==='true';}
function failure(cause:unknown,action:string){
  if(cause instanceof PlatformAdministrationError) return fail(400,{action,ok:false,error:cause.message});
  throw cause;
}

export const load:PageServerLoad=async({cookies,params})=>{
  const operator=await requirePlatformOperator(cookies);
  const read=getPlatformControlPlaneReadRepository();
  const definition=read.globalSections().find(item=>item.key===params.section);
  if(!definition) throw error(404,'Platform administration section not found.');
  const section=await read.globalSection(params.section as PlatformGlobalSectionKey);
  return {operator,section};
};

export const actions:Actions={
  upsertFeatureFlag:async({cookies,request})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{
      await getPlatformControlPlaneCommandService().upsertFeatureFlag(operator,{
        flagKey:field(form,'flagKey'),name:field(form,'name'),description:field(form,'description'),defaultEnabled:checked(form,'defaultEnabled')
      });
      return {action:'upsertFeatureFlag',ok:true,message:'Feature flag saved.'};
    }catch(cause){return failure(cause,'upsertFeatureFlag');}
  },
  upsertConfiguration:async({cookies,request})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{
      await getPlatformControlPlaneCommandService().upsertPlatformConfiguration(operator,{
        configKey:field(form,'configKey'),description:field(form,'description'),sensitivity:field(form,'sensitivity'),jsonValue:field(form,'jsonValue')
      });
      return {action:'upsertConfiguration',ok:true,message:'Platform configuration saved.'};
    }catch(cause){return failure(cause,'upsertConfiguration');}
  },
  registerIntegration:async({cookies,request})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{
      await getPlatformControlPlaneCommandService().registerIntegration(operator,{
        tenantId:field(form,'tenantId')||undefined,code:field(form,'code'),name:field(form,'name'),integrationType:field(form,'integrationType'),endpointReference:field(form,'endpointReference')||undefined
      });
      return {action:'registerIntegration',ok:true,message:'Integration registered.'};
    }catch(cause){return failure(cause,'registerIntegration');}
  },
  retryJob:async({cookies,request})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{await getPlatformControlPlaneCommandService().retryBackgroundJob(operator,field(form,'jobId'));return {action:'retryJob',ok:true,message:'Background job queued for retry.'};}
    catch(cause){return failure(cause,'retryJob');}
  }
};
