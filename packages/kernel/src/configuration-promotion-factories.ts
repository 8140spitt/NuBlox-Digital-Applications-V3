import { invariant } from './errors.js';
import type { CanonicalObjectIdentity, Person } from './model.js';
import type { Decision } from './control.js';
import type {
  ConfigurationBaseline,
  ConfigurationBaselineItem,
  ConfigurationChangeItem,
  ConfigurationChangeSet,
  ConfigurationEnvironment,
  ConfigurationPromotionConflict,
  ConfigurationPromotionConflictDisposition,
  ConfigurationPromotionItemResult,
  ConfigurationPromotionRun
} from './configuration-promotion.js';

function sameTenant(a:{tenantId:string},b:{tenantId:string},label:string){invariant(a.tenantId===b.tenantId,label+' must stay within one tenant.');}
function text(v:string,label:string){invariant(v.trim().length>0,label+' must not be empty.');}
function date(v:string,label:string){const t=Date.parse(v);invariant(!Number.isNaN(t),label+' must be a valid date/time.');return t;}

export function createConfigurationEnvironment(input:ConfigurationEnvironment):ConfigurationEnvironment{
  text(input.code,'Configuration Environment code');text(input.name,'Configuration Environment name');
  text(input.platformVersion,'Configuration Environment platformVersion');text(input.environmentReference,'Configuration Environment reference');
  invariant(input.status==='ACTIVE','New Configuration Environment must start ACTIVE.');
  return Object.freeze({...input});
}
export function createConfigurationBaseline(input:ConfigurationBaseline,environment:ConfigurationEnvironment,creator:Person):ConfigurationBaseline{
  sameTenant(input,environment,'Configuration Baseline Environment');sameTenant(input,creator,'Configuration Baseline creator');
  invariant(input.environmentId===environment.id,'Configuration Baseline Environment reference does not match.');
  invariant(input.platformVersion===environment.platformVersion,'Configuration Baseline platform version must match its Environment.');
  invariant(input.createdByPersonId===creator.id,'Configuration Baseline creator reference does not match.');
  text(input.baselineReference,'Configuration Baseline reference');date(input.createdAt,'Configuration Baseline createdAt');
  invariant(input.status==='DRAFT'&&!input.checksum&&!input.frozenAt&&!input.frozenByPersonId,'New Configuration Baseline must start unfrozen DRAFT.');
  return Object.freeze({...input});
}
export function createConfigurationBaselineItem(input:ConfigurationBaselineItem,baseline:ConfigurationBaseline):ConfigurationBaselineItem{
  sameTenant(input,baseline,'Configuration Baseline Item');invariant(input.baselineId===baseline.id,'Configuration Baseline Item must reference supplied Baseline.');
  invariant(baseline.status==='DRAFT','Items can only be added to a DRAFT Configuration Baseline.');
  invariant(Number.isInteger(input.sequence)&&input.sequence>0,'Configuration Baseline Item sequence must be positive.');
  text(input.objectFamily,'Configuration Baseline Item objectFamily');text(input.objectReference,'Configuration Baseline Item objectReference');text(input.contentHash,'Configuration Baseline Item contentHash');
  return Object.freeze({...input,snapshot:Object.freeze({...input.snapshot})});
}
export function freezeConfigurationBaseline(current:ConfigurationBaseline,items:ReadonlyArray<ConfigurationBaselineItem>,checksum:string,freezer:Person,frozenAt:string):ConfigurationBaseline{
  sameTenant(current,freezer,'Configuration Baseline freezer');invariant(current.status==='DRAFT','Only a DRAFT Configuration Baseline can be frozen.');
  invariant(items.length>0,'Configuration Baseline requires at least one Item.');invariant(items.every(i=>i.baselineId===current.id),'All Baseline Items must belong to the Baseline.');
  text(checksum,'Configuration Baseline checksum');date(frozenAt,'Configuration Baseline frozenAt');invariant(Date.parse(frozenAt)>=Date.parse(current.createdAt),'Configuration Baseline cannot freeze before creation.');
  return Object.freeze({...current,status:'FROZEN',checksum,frozenByPersonId:freezer.id,frozenAt});
}
export function createConfigurationChangeSet(input:ConfigurationChangeSet,environment:ConfigurationEnvironment,baseline:ConfigurationBaseline,scope:CanonicalObjectIdentity,creator:Person):ConfigurationChangeSet{
  sameTenant(input,environment,'Configuration Change Set Environment');sameTenant(input,baseline,'Configuration Change Set Baseline');sameTenant(input,scope,'Configuration Change Set scope');sameTenant(input,creator,'Configuration Change Set creator');
  invariant(input.sourceEnvironmentId===environment.id,'Configuration Change Set source Environment does not match.');
  invariant(input.baseBaselineId===baseline.id,'Configuration Change Set base Baseline does not match.');
  invariant(baseline.environmentId===environment.id&&baseline.status==='FROZEN','Configuration Change Set requires a FROZEN Baseline from the source Environment.');
  invariant(input.scopeObjectId===scope.id,'Configuration Change Set scope object does not match.');invariant(input.createdByPersonId===creator.id,'Configuration Change Set creator does not match.');
  text(input.code,'Configuration Change Set code');text(input.name,'Configuration Change Set name');text(input.version,'Configuration Change Set version');date(input.createdAt,'Configuration Change Set createdAt');
  invariant(input.status==='DRAFT'&&!input.checksum&&!input.frozenAt&&!input.approvedAt,'New Configuration Change Set must start DRAFT.');
  return Object.freeze({...input});
}
export function createConfigurationChangeItem(input:ConfigurationChangeItem,set:ConfigurationChangeSet):ConfigurationChangeItem{
  sameTenant(input,set,'Configuration Change Item');invariant(input.changeSetId===set.id,'Configuration Change Item must reference supplied Change Set.');
  invariant(set.status==='DRAFT','Items can only be added to a DRAFT Configuration Change Set.');invariant(Number.isInteger(input.sequence)&&input.sequence>0,'Configuration Change Item sequence must be positive.');
  text(input.objectFamily,'Configuration Change Item objectFamily');text(input.objectReference,'Configuration Change Item objectReference');
  invariant(input.operation!=='CREATE'||!input.beforeHash,'CREATE Configuration Change Item must not have beforeHash.');
  invariant(input.operation!=='DELETE'||!input.afterHash,'DELETE Configuration Change Item must not have afterHash.');
  invariant(input.operation==='DELETE'||Boolean(input.afterHash),'CREATE/UPDATE Configuration Change Item requires afterHash.');
  return Object.freeze({...input,definition:Object.freeze({...input.definition}),...(input.dependencies?{dependencies:Object.freeze([...input.dependencies])}:{})});
}
export function freezeConfigurationChangeSet(current:ConfigurationChangeSet,items:ReadonlyArray<ConfigurationChangeItem>,checksum:string,freezer:Person,frozenAt:string):ConfigurationChangeSet{
  sameTenant(current,freezer,'Configuration Change Set freezer');invariant(current.status==='DRAFT','Only a DRAFT Configuration Change Set can be frozen.');
  invariant(items.length>0,'Configuration Change Set requires at least one Item.');invariant(items.every(i=>i.changeSetId===current.id),'All Change Items must belong to the Change Set.');
  text(checksum,'Configuration Change Set checksum');date(frozenAt,'Configuration Change Set frozenAt');
  return Object.freeze({...current,status:'FROZEN',checksum,frozenByPersonId:freezer.id,frozenAt});
}
export function approveConfigurationChangeSet(current:ConfigurationChangeSet,decision:Decision,approvedAt:string):ConfigurationChangeSet{
  sameTenant(current,decision,'Configuration Change Set approval');invariant(current.status==='FROZEN','Only a FROZEN Configuration Change Set can be approved.');
  invariant(decision.subjectObjectId===current.scopeObjectId,'Configuration Change Set approval Decision must govern the Change Set scope object.');
  invariant(decision.subjectVersion===current.checksum,'Configuration Change Set approval Decision must cite the exact frozen Change Set checksum.');
  invariant(decision.outcome==='APPROVED','Configuration Change Set approval requires an APPROVED Decision.');
  date(approvedAt,'Configuration Change Set approvedAt');return Object.freeze({...current,status:'APPROVED',approvedDecisionId:decision.id,approvedAt});
}
export function createConfigurationPromotionRun(input:ConfigurationPromotionRun,set:ConfigurationChangeSet,source:ConfigurationEnvironment,target:ConfigurationEnvironment,sourceBaseline:ConfigurationBaseline,targetBaseline:ConfigurationBaseline,requester:Person):ConfigurationPromotionRun{
  sameTenant(input,set,'Configuration Promotion Change Set');sameTenant(input,source,'Configuration Promotion source');sameTenant(input,target,'Configuration Promotion target');sameTenant(input,sourceBaseline,'Configuration Promotion source Baseline');sameTenant(input,targetBaseline,'Configuration Promotion target Baseline');sameTenant(input,requester,'Configuration Promotion requester');
  invariant(set.status==='APPROVED','Configuration Promotion requires an APPROVED Change Set.');invariant(input.changeSetId===set.id,'Promotion Run Change Set does not match.');
  invariant(source.id!==target.id,'Promotion source and target Environments must differ.');invariant(source.status==='ACTIVE'&&target.status==='ACTIVE','Promotion source and target Environments must be ACTIVE.');
  invariant(input.sourceEnvironmentId===source.id&&set.sourceEnvironmentId===source.id,'Promotion source Environment does not match Change Set.');
  invariant(input.targetEnvironmentId===target.id,'Promotion target Environment does not match.');
  invariant(input.sourceBaselineId===sourceBaseline.id&&sourceBaseline.id===set.baseBaselineId&&sourceBaseline.status==='FROZEN','Promotion source Baseline must be the frozen Change Set base Baseline.');
  invariant(input.expectedTargetBaselineId===targetBaseline.id&&targetBaseline.environmentId===target.id&&targetBaseline.status==='FROZEN','Promotion requires a frozen expected target Baseline.');
  invariant(input.requestedByPersonId===requester.id,'Promotion requester reference does not match.');text(input.runReference,'Configuration Promotion runReference');text(input.mappingChecksum,'Configuration Promotion mappingChecksum');text(input.rollbackChecksum,'Configuration Promotion rollbackChecksum');date(input.requestedAt,'Configuration Promotion requestedAt');
  invariant(input.status==='QUEUED'&&!input.startedAt&&!input.completedAt&&!input.resultingTargetBaselineId,'New Configuration Promotion Run must start QUEUED.');
  return Object.freeze({...input,mappingDefinition:Object.freeze({...input.mappingDefinition}),rollbackDefinition:Object.freeze({...input.rollbackDefinition})});
}
export function startConfigurationPromotionRun(current:ConfigurationPromotionRun,startedAt:string):ConfigurationPromotionRun{
  invariant(current.status==='QUEUED','Only a QUEUED Configuration Promotion Run can start.');date(startedAt,'Configuration Promotion startedAt');invariant(Date.parse(startedAt)>=Date.parse(current.requestedAt),'Promotion cannot start before request.');
  return Object.freeze({...current,status:'RUNNING',startedAt});
}
export function createConfigurationPromotionItemResult(input:ConfigurationPromotionItemResult,run:ConfigurationPromotionRun,item:ConfigurationChangeItem,recorder:Person):ConfigurationPromotionItemResult{
  sameTenant(input,run,'Configuration Promotion Item Result');sameTenant(input,item,'Configuration Promotion Change Item');sameTenant(input,recorder,'Configuration Promotion recorder');
  invariant(run.status==='RUNNING','Promotion Item Result requires a RUNNING Promotion Run.');invariant(input.promotionRunId===run.id,'Promotion Item Result Run reference does not match.');invariant(input.changeItemId===item.id&&item.changeSetId===run.changeSetId,'Promotion Item Result Change Item does not belong to Run Change Set.');invariant(input.recordedByPersonId===recorder.id,'Promotion Item Result recorder does not match.');
  date(input.recordedAt,'Promotion Item Result recordedAt');invariant(!['FAILED','CONFLICT'].includes(input.outcome)||Boolean(input.message),'FAILED/CONFLICT Promotion Item Result requires message.');
  invariant(!['APPLIED','NO_CHANGE'].includes(input.outcome)||Boolean(input.targetHash),'APPLIED/NO_CHANGE Promotion Item Result requires targetHash.');
  return Object.freeze({...input});
}
export function createConfigurationPromotionConflict(input:ConfigurationPromotionConflict,run:ConfigurationPromotionRun,result?:ConfigurationPromotionItemResult):ConfigurationPromotionConflict{
  sameTenant(input,run,'Configuration Promotion Conflict');invariant(input.promotionRunId===run.id,'Promotion Conflict Run reference does not match.');invariant(run.status==='RUNNING','Promotion Conflict requires a RUNNING Run.');
  if(result){sameTenant(input,result,'Configuration Promotion Conflict result');invariant(input.itemResultId===result.id&&result.promotionRunId===run.id,'Promotion Conflict Item Result does not belong to Run.');}
  text(input.code,'Configuration Promotion Conflict code');text(input.description,'Configuration Promotion Conflict description');date(input.detectedAt,'Configuration Promotion Conflict detectedAt');invariant(input.status==='OPEN'&&!input.resolvedAt,'New Promotion Conflict must start OPEN.');
  return Object.freeze({...input});
}
export function createConfigurationPromotionConflictDisposition(input:ConfigurationPromotionConflictDisposition,conflict:ConfigurationPromotionConflict,decision:Decision,disposer:Person):ConfigurationPromotionConflictDisposition{
  sameTenant(input,conflict,'Promotion Conflict Disposition');sameTenant(input,decision,'Promotion Conflict Decision');sameTenant(input,disposer,'Promotion Conflict disposer');
  invariant(conflict.status==='OPEN','Only OPEN Promotion Conflict can be dispositioned.');invariant(input.conflictId===conflict.id,'Promotion Conflict Disposition reference does not match.');invariant(input.decisionId===decision.id&&decision.outcome==='APPROVED','Promotion Conflict Disposition requires an APPROVED Decision.');invariant(input.disposedByPersonId===disposer.id,'Promotion Conflict disposer reference does not match.');text(input.rationale,'Promotion Conflict Disposition rationale');date(input.disposedAt,'Promotion Conflict disposedAt');
  return Object.freeze({...input});
}
export function applyConfigurationPromotionConflictDisposition(conflict:ConfigurationPromotionConflict,disposition:ConfigurationPromotionConflictDisposition):ConfigurationPromotionConflict{
  sameTenant(conflict,disposition,'Promotion Conflict Disposition');invariant(disposition.conflictId===conflict.id,'Disposition must belong to Conflict.');
  return Object.freeze({...conflict,status:'DISPOSITIONED',resolvedAt:disposition.disposedAt});
}
export function completeConfigurationPromotionRun(current:ConfigurationPromotionRun,changeItems:ReadonlyArray<ConfigurationChangeItem>,results:ReadonlyArray<ConfigurationPromotionItemResult>,conflicts:ReadonlyArray<ConfigurationPromotionConflict>,resultingBaseline:ConfigurationBaseline|undefined,completedAt:string):ConfigurationPromotionRun{
  invariant(current.status==='RUNNING','Only a RUNNING Configuration Promotion Run can complete.');date(completedAt,'Configuration Promotion completedAt');
  invariant(changeItems.length>0,'Promotion Run requires Change Items.');invariant(results.length===changeItems.length,'Promotion Run requires exactly one result for every Change Item.');
  const changeIds=new Set(changeItems.map(i=>i.id));invariant(results.every(r=>r.promotionRunId===current.id&&changeIds.has(r.changeItemId)),'Promotion Results must cover only Run Change Items.');
  const blocking=conflicts.some(c=>c.promotionRunId===current.id&&c.severity==='BLOCKING'&&c.status==='OPEN');
  const failed=results.some(r=>r.outcome==='FAILED');
  const conflictResult=results.some(r=>r.outcome==='CONFLICT');
  const status=blocking||conflictResult?'BLOCKED':failed?'FAILED':'SUCCEEDED';
  if(status==='SUCCEEDED'){
    invariant(Boolean(resultingBaseline),'Successful Promotion requires a resulting frozen target Baseline.');
    sameTenant(current,resultingBaseline!,'Promotion resulting Baseline');
    invariant(resultingBaseline!.environmentId===current.targetEnvironmentId&&resultingBaseline!.status==='FROZEN','Resulting Baseline must be frozen in target Environment.');
    invariant(Date.parse(resultingBaseline!.frozenAt!)>=Date.parse(current.startedAt!),'Resulting Baseline must be frozen after Promotion starts.');
  }else{
    invariant(!resultingBaseline,'Blocked/failed Promotion must not claim a resulting Baseline.');
  }
  return Object.freeze({...current,status,completedAt,...(resultingBaseline?{resultingTargetBaselineId:resultingBaseline.id}:{})});
}
