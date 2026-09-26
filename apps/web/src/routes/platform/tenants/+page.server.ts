import { PlatformAdministrationError } from '@nublox/persistence';
import { fail, type RequestEvent } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import { getPlatformAdministrationService } from '$lib/server/platform-auth';
import { requirePlatformOperator } from '$lib/server/platform-control-plane';

function field(formData:FormData,name:string){return String(formData.get(name)??'').trim();}
async function run(event:RequestEvent,action:(operator:Awaited<ReturnType<typeof requirePlatformOperator>>,tenantId:string,reason:string,form:FormData)=>Promise<void>){
  const operator=await requirePlatformOperator(event.cookies);const form=await event.request.formData();const tenantId=field(form,'tenantId');const reason=field(form,'reason');
  if(!tenantId)return fail(400,{error:'Tenant ID is required.'});
  try{await action(operator,tenantId,reason,form);return {success:true,tenantId};}catch(cause){if(cause instanceof PlatformAdministrationError)return fail(400,{error:cause.message,tenantId});throw cause;}
}

export const load:PageServerLoad=async({cookies,url})=>{
  const operator=await requirePlatformOperator(cookies);const search=url.searchParams.get('q')?.trim()??'';
  return {operator,search,tenants:await getPlatformAdministrationService().listTenants(search)};
};

export const actions:Actions={
  suspend:event=>run(event,(operator,tenantId,reason)=>getPlatformAdministrationService().suspendTenant(operator,tenantId,reason)),
  reactivate:event=>run(event,(operator,tenantId,reason)=>getPlatformAdministrationService().reactivateTenant(operator,tenantId,reason)),
  requestDeletion:event=>run(event,(operator,tenantId,reason)=>getPlatformAdministrationService().requestTenantDeletion(operator,tenantId,reason)),
  finaliseDeletion:event=>run(event,(operator,tenantId,reason,form)=>getPlatformAdministrationService().finaliseTenantDeletion(operator,tenantId,field(form,'confirmationSlug'),reason))
};
