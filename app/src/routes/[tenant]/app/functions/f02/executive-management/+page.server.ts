import { fail,redirect } from '@sveltejs/kit';
import type { Actions,PageServerLoad } from './$types';
import { hasPermission } from '$lib/server/platform-context';
import { resolveRequestCommandContext } from '$lib/server/request-command-context';
import {
  completeExecutiveMeeting,conveneExecutiveMeeting,createExecutiveAction,createExecutiveMeeting,
  listExecutiveActionIds,listExecutiveAgenda,listExecutiveAttendees,listExecutiveDecisionIds,listExecutiveMeetings,
  recordExecutiveAttendance,recordExecutiveDecision
} from '$lib/server/executive-governance';

function text(data:FormData,name:string){const value=data.get(name);return typeof value==='string'?value.trim():'';}
function integer(data:FormData,name:string){const value=Number(text(data,name));if(!Number.isInteger(value)||value<1)throw new Error(name+' must be a positive whole number.');return value;}
function target(tenant:string,id?:string){return `/${tenant}/app/functions/f02/executive-management${id?'?meeting='+encodeURIComponent(id):''}`;}
function problem(error:unknown){return fail(400,{message:error instanceof Error?error.message:'The Executive Governance command could not be completed.'});}
function attendees(data:FormData){return text(data,'attendees').split(/\r?\n/).map(row=>row.trim()).filter(Boolean).map((row,index)=>{const [partyId,attendanceRole]=row.split('|').map(x=>x.trim());if(!partyId||!attendanceRole)throw new Error('Attendee row '+(index+1)+' requires Party ID and role.');return{partyId,attendanceRole};});}
function agenda(data:FormData){return text(data,'agenda').split(/\r?\n/).map(row=>row.trim()).filter(Boolean).map((row,index)=>{const [subject,requiredOutcome,purpose,subjectType='',subjectId='',subjectVersion='']=row.split('|').map(x=>x.trim());if(!subject||!requiredOutcome||!purpose)throw new Error('Agenda row '+(index+1)+' requires subject, required outcome and purpose.');return{subject,requiredOutcome,purpose,subjectType:subjectType||undefined,subjectId:subjectId||undefined,subjectVersion:subjectVersion||undefined};});}

export const load:PageServerLoad=async({params,url,locals})=>{
  const context=await resolveRequestCommandContext(params.tenant,locals);
  const meetings=await listExecutiveMeetings(context);
  const selected=meetings.find(row=>row.id===url.searchParams.get('meeting'))??meetings[0]??null;
  const [attendeeRows,agendaRows,decisions,actions]=selected?await Promise.all([
    listExecutiveAttendees(context,selected.id),listExecutiveAgenda(context,selected.id),listExecutiveDecisionIds(context,selected.id),listExecutiveActionIds(context,selected.id)
  ]):[[],[],[],[]];
  return{tenantSlug:params.tenant,meetings,selected,attendeeRows,agendaRows,decisions,actions,capabilities:{
    canManage:hasPermission(context,'governance.executive.manage'),
    canConduct:hasPermission(context,'governance.executive.conduct')
  }};
};

export const actions:Actions={
  create:async({request,params,locals})=>{const data=await request.formData();try{
    const id=await createExecutiveMeeting(await resolveRequestCommandContext(params.tenant,locals),{
      meetingRef:text(data,'meetingRef'),governanceContextType:text(data,'governanceContextType'),governanceContextId:text(data,'governanceContextId'),
      scheduledAt:text(data,'scheduledAt'),locationChannel:text(data,'locationChannel')||undefined,quorumRequired:integer(data,'quorumRequired'),
      attendees:attendees(data),agenda:agenda(data)
    });redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  attendance:async({request,params,locals})=>{const data=await request.formData(),id=text(data,'meetingId');try{
    await recordExecutiveAttendance(await resolveRequestCommandContext(params.tenant,locals),id,text(data,'partyId'),text(data,'status') as 'PRESENT'|'ABSENT');
    redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  convene:async({request,params,locals})=>{const data=await request.formData(),id=text(data,'meetingId');try{
    await conveneExecutiveMeeting(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'));redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  decision:async({request,params,locals})=>{const data=await request.formData(),id=text(data,'meetingId');try{
    await recordExecutiveDecision(await resolveRequestCommandContext(params.tenant,locals),id,{subjectType:text(data,'subjectType'),subjectId:text(data,'subjectId'),subjectVersion:text(data,'subjectVersion')||undefined,outcome:text(data,'outcome'),reason:text(data,'reason')});
    redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  action:async({request,params,locals})=>{const data=await request.formData(),id=text(data,'meetingId');try{
    await createExecutiveAction(await resolveRequestCommandContext(params.tenant,locals),id,{title:text(data,'title'),instructions:text(data,'instructions'),subjectType:text(data,'subjectType')||undefined,subjectId:text(data,'subjectId')||undefined,subjectVersion:text(data,'subjectVersion')||undefined,priority:text(data,'priority')||undefined,dueAt:text(data,'dueAt')||undefined});
    redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}},
  complete:async({request,params,locals})=>{const data=await request.formData(),id=text(data,'meetingId');try{
    await completeExecutiveMeeting(await resolveRequestCommandContext(params.tenant,locals),id,integer(data,'aggregateVersion'),{minutesSummary:text(data,'minutesSummary'),nextReviewAt:text(data,'nextReviewAt')||undefined});
    redirect(303,target(params.tenant,id));
  }catch(error){if(error&&typeof error==='object'&&'status'in error)throw error;return problem(error);}}
};
