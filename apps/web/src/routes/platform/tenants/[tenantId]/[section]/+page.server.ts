import {
  PLATFORM_TENANT_SECTIONS,
  PlatformAdministrationError,
  type PlatformTenantSectionKey
} from '@nublox/persistence';
import { error,fail } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import { getPlatformAdministrationService } from '$lib/server/platform-auth';
import {
  getPlatformControlPlaneCommandService,
  getPlatformControlPlaneReadRepository,
  requirePlatformOperator
} from '$lib/server/platform-control-plane';

function field(formData:FormData,name:string):string{return String(formData.get(name)??'').trim();}
function checked(formData:FormData,name:string):boolean{return formData.get(name)==='on'||formData.get(name)==='true';}
function failure(cause:unknown,action:string){if(cause instanceof PlatformAdministrationError)return fail(400,{action,ok:false,error:cause.message});throw cause;}

export const load:PageServerLoad=async({cookies,params})=>{
  const operator=await requirePlatformOperator(cookies);
  const definition=PLATFORM_TENANT_SECTIONS.find(item=>item.key===params.section);
  if(!definition) throw error(404,'Tenant administration section not found.');
  const read=getPlatformControlPlaneReadRepository();
  const tenant=await read.tenantHeader(params.tenantId);
  if(!tenant) throw error(404,'Tenant not found.');
  const section=await read.tenantSection(params.tenantId,params.section as PlatformTenantSectionKey);
  return {operator,tenant,section,tenantSections:PLATFORM_TENANT_SECTIONS};
};

export const actions:Actions={
  upsertSubscription:async({cookies,request,params})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{await getPlatformControlPlaneCommandService().upsertSubscription(operator,{tenantId:params.tenantId,planCode:field(form,'planCode'),status:field(form,'status'),seatLimit:field(form,'seatLimit')||undefined,storageLimitBytes:field(form,'storageLimitBytes')||undefined,billingCustomerReference:field(form,'billingCustomerReference')||undefined});return {action:'upsertSubscription',ok:true,message:'Subscription saved.'};}
    catch(cause){return failure(cause,'upsertSubscription');}
  },
  setFeatureOverride:async({cookies,request,params})=>{
    const operator=await requirePlatformOperator(cookies);const form=await request.formData();
    try{await getPlatformControlPlaneCommandService().setTenantFeatureOverride(operator,{tenantId:params.tenantId,flagKey:field(form,'flagKey'),enabled:checked(form,'enabled'),reason:field(form,'reason')});return {action:'setFeatureOverride',ok:true,message:'Tenant feature override saved.'};}
    catch(cause){return failure(cause,'setFeatureOverride');}
  },
  suspend:async({cookies,request,params})=>{const operator=await requirePlatformOperator(cookies);const form=await request.formData();try{await getPlatformAdministrationService().suspendTenant(operator,params.tenantId,field(form,'reason'));return {action:'suspend',ok:true,message:'Tenant suspended.'};}catch(cause){return failure(cause,'suspend');}},
  reactivate:async({cookies,request,params})=>{const operator=await requirePlatformOperator(cookies);const form=await request.formData();try{await getPlatformAdministrationService().reactivateTenant(operator,params.tenantId,field(form,'reason'));return {action:'reactivate',ok:true,message:'Tenant reactivated.'};}catch(cause){return failure(cause,'reactivate');}},
  requestDeletion:async({cookies,request,params})=>{const operator=await requirePlatformOperator(cookies);const form=await request.formData();try{await getPlatformAdministrationService().requestTenantDeletion(operator,params.tenantId,field(form,'reason'));return {action:'requestDeletion',ok:true,message:'Tenant deletion requested.'};}catch(cause){return failure(cause,'requestDeletion');}},
  finaliseDeletion:async({cookies,request,params})=>{const operator=await requirePlatformOperator(cookies);const form=await request.formData();try{await getPlatformAdministrationService().finaliseTenantDeletion(operator,params.tenantId,field(form,'confirmationSlug'),field(form,'reason'));return {action:'finaliseDeletion',ok:true,message:'Tenant deleted from service.'};}catch(cause){return failure(cause,'finaliseDeletion');}}
};
