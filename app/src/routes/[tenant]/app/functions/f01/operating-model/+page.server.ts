import { fail,redirect } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import { listStrategyFrameworks } from '$lib/server/strategy-framework';
import { recordWorkDecision } from '$lib/server/work-decision';
import {
  activateOperatingModel,approveOperatingModel,createOperatingModel,listOperatingModelAccountabilities,
  listOperatingModelCapabilities,listOperatingModels,listOperatingModelVersions,reviseOperatingModel,
  submitOperatingModel,supersedeOperatingModel,type OperatingModelAccountabilityInput,type OperatingModelCapabilityInput
} from '$lib/server/operating-model';

function text(data:FormData,name:string){const value=data.get(name);return typeof value==='string'?value.trim():'';}
function integer(data:FormData,name:string){const value=Number(text(data,name));if(!Number.isInteger(value)||value<1)throw new Error(name+' must be a positive whole number.');return value;}
function problem(error:unknown){return fail(400,{message:error instanceof Error?error.message:'The Operating Model command could not be completed.'});}
function target(tenant:string,id?:string){return `/${tenant}/app/functions/f01/operating-model${id?'?model='+encodeURIComponent(id):''}`;}

function capabilities(data:FormData):OperatingModelCapabilityInput[]{
  const rows=text(data,'capabilities').split(/\r?\n/).map(row=>row.trim()).filter(Boolean);
  return rows.map((row,index)=>{
    const [capabilityKey,name,criticality,deliveryModel,...description]=row.split('|').map(part=>part.trim());
    if(!capabilityKey||!name||!criticality||!deliveryModel||!description.join(' | ')) throw new Error('Capability row '+(index+1)+' requires key, name, criticality, delivery model and description.');
    return {capabilityKey,name,criticality:criticality as OperatingModelCapabilityInput['criticality'],deliveryModel:deliveryModel as OperatingModelCapabilityInput['deliveryModel'],description:description.join(' | ')};
  });
}

function accountabilities(data:FormData):OperatingModelAccountabilityInput[]{
  const rows=text(data,'accountabilities').split(/\r?\n/).map(row=>row.trim()).filter(Boolean);
  return rows.map((row,index)=>{
    const [accountabilityKey,accountableRoleKey,responsibility,...decisionRights]=row.split('|').map(part=>part.trim());
    if(!accountabilityKey||!accountableRoleKey||!responsibility||!decisionRights.join(' | ')) throw new Error('Accountability row '+(index+1)+' requires key, role, responsibility and decision rights.');
    return {accountabilityKey,accountableRoleKey,responsibility,decisionRights:decisionRights.join(' | ')};
  });
}

export const load:PageServerLoad=async({params,url,locals})=>{
  const context=await resolveRequestCommandContext(params.tenant,locals);
  const [models,frameworks]=await Promise.all([listOperatingModels(context),listStrategyFrameworks(context)]);
  const selected=models.find(row=>row.id===url.searchParams.get('model'))??models[0]??null;
  const versions=selected?await listOperatingModelVersions(context,selected.id):[];
  const currentVersion=versions.find(version=>version.versionNo===selected?.currentVersionNo)??null;
  const [capabilityRows,accountabilityRows]=currentVersion?await Promise.all([listOperatingModelCapabilities(context,currentVersion.id),listOperatingModelAccountabilities(context,currentVersion.id)]):[[],[]];
  return {
    tenantSlug:params.tenant,models,selected,versions,capabilityRows,accountabilityRows,
    frameworks:frameworks.filter(row=>row.status==='PUBLISHED'),
    capabilities:{canManage:hasPermission(context,'strategy.operating-model.manage'),canApprove:hasPermission(context,'strategy.operating-model.approve')}
  };
};

export const actions:Actions={
  create:async({request,params,locals})=>{
    const data=await request.formData();
    try{
      const id=await createOperatingModel(await resolveRequestCommandContext(params.tenant,locals),{
        modelRef:text(data,'modelRef'),name:text(data,'name'),frameworkId:text(data,'frameworkId'),frameworkVersionNo:integer(data,'frameworkVersionNo'),
        scopeType:text(data,'scopeType'),scopeId:text(data,'scopeId'),currentStateSummary:text(data,'currentStateSummary'),targetStateSummary:text(data,'targetStateSummary'),
        designPrinciples:text(data,'designPrinciples'),centralisationModel:text(data,'centralisationModel'),sharedServiceRequirements:text(data,'sharedServiceRequirements'),
        organisationModelReference:text(data,'organisationModelReference')||undefined,changeInitiativesSummary:text(data,'changeInitiativesSummary'),
        capabilities:capabilities(data),accountabilities:accountabilities(data)
      });
      redirect(303,target(params.tenant,id));
    }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}
  },
  revise:async({request,params,locals})=>{
    const data=await request.formData();const id=text(data,'modelId');
    try{
      await reviseOperatingModel(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'),{
        currentStateSummary:text(data,'currentStateSummary'),targetStateSummary:text(data,'targetStateSummary'),designPrinciples:text(data,'designPrinciples'),
        centralisationModel:text(data,'centralisationModel'),sharedServiceRequirements:text(data,'sharedServiceRequirements'),organisationModelReference:text(data,'organisationModelReference')||undefined,
        changeInitiativesSummary:text(data,'changeInitiativesSummary'),capabilities:capabilities(data),accountabilities:accountabilities(data)
      });
      redirect(303,target(params.tenant,id));
    }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}
  },
  submit:async({request,params,locals})=>{const data=await request.formData();const id=text(data,'modelId');try{await submitOperatingModel(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'));redirect(303,target(params.tenant,id));}catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  approve:async({request,params,locals})=>{
    const data=await request.formData();const id=text(data,'modelId');
    try{
      const context=await resolveRequestCommandContext(params.tenant,locals);
      const model=(await listOperatingModels(context)).find(row=>row.id===id);if(!model)throw new Error('Operating Model not found.');
      const decisionId=await recordWorkDecision(context,{decisionType:'OPERATING_MODEL_APPROVAL',subjectType:'OPERATING_MODEL',subjectId:id,subjectVersion:String(model.currentVersionNo),outcome:'APPROVED',reason:text(data,'reason')||'Target Operating Model approved.'});
      await approveOperatingModel(context,id,integer(data,'aggregateVersion'),decisionId);redirect(303,target(params.tenant,id));
    }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}
  },
  activate:async({request,params,locals})=>{const data=await request.formData();const id=text(data,'modelId');try{await activateOperatingModel(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'));redirect(303,target(params.tenant,id));}catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  supersede:async({request,params,locals})=>{const data=await request.formData();const id=text(data,'modelId');try{await supersedeOperatingModel(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'));redirect(303,target(params.tenant,id));}catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}}
};
