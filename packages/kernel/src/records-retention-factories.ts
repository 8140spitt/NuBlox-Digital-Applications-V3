import { invariant } from './errors.js';
import type { CanonicalObjectIdentity, Person } from './model.js';
import type { Decision } from './control.js';
import type {
  ArchiveRecord,
  DestructionEvidence,
  DispositionItemResult,
  DispositionRun,
  DispositionSchedule,
  Hold,
  RestoreRun,
  RetentionPolicy,
  RetentionRule
} from './records-retention.js';

function sameTenant(a:{tenantId:string},b:{tenantId:string},label:string){
  invariant(a.tenantId===b.tenantId,label+' must remain within one tenant.');
}
function required(value:string,label:string){
  invariant(value.trim().length>0,label+' must not be empty.');
}
function date(value:string,label:string){
  const parsed=Date.parse(value);
  invariant(!Number.isNaN(parsed),label+' must be a valid date/time.');
  return parsed;
}
function sameSubject(a:{subjectObjectId:string;subjectVersion?:string},b:{subjectObjectId:string;subjectVersion?:string},label:string){
  invariant(a.subjectObjectId===b.subjectObjectId,label+' subject object does not match.');
  invariant((a.subjectVersion??null)===(b.subjectVersion??null),label+' subject version does not match.');
}

export function createRetentionPolicy(input:RetentionPolicy,scope:CanonicalObjectIdentity,creator:Person):RetentionPolicy{
  sameTenant(input,scope,'Retention Policy scope');
  sameTenant(input,creator,'Retention Policy creator');
  invariant(input.scopeObjectId===scope.id,'Retention Policy scope reference does not match.');
  invariant(input.createdByPersonId===creator.id,'Retention Policy creator reference does not match.');
  required(input.code,'Retention Policy code');required(input.name,'Retention Policy name');
  invariant(Number.isInteger(input.version)&&input.version>0,'Retention Policy version must be positive.');
  date(input.createdAt,'Retention Policy createdAt');
  invariant(input.status==='DRAFT'&&!input.checksum&&!input.frozenAt&&!input.approvalDecisionId&&!input.activatedAt,'New Retention Policy must start DRAFT.');
  return Object.freeze({...input});
}

export function createRetentionRule(input:RetentionRule,policy:RetentionPolicy):RetentionRule{
  sameTenant(input,policy,'Retention Rule Policy');
  invariant(input.retentionPolicyId===policy.id,'Retention Rule must reference supplied Policy.');
  invariant(policy.status==='DRAFT','Retention Rules can only be added to a DRAFT Policy.');
  required(input.code,'Retention Rule code');required(input.name,'Retention Rule name');required(input.objectFamily,'Retention Rule objectFamily');
  invariant(Number.isInteger(input.retentionPeriodDays)&&input.retentionPeriodDays>=0,'Retention period days must be zero or greater.');
  invariant(Number.isInteger(input.sequence)&&input.sequence>0,'Retention Rule sequence must be positive.');
  if(input.triggerType==='CUSTOM')required(input.triggerField??'','CUSTOM Retention Rule triggerField');
  return Object.freeze({...input,selectionCriteria:Object.freeze({...input.selectionCriteria})});
}

export function freezeRetentionPolicy(
  current:RetentionPolicy,
  rules:readonly RetentionRule[],
  checksum:string,
  freezer:Person,
  frozenAt:string
):RetentionPolicy{
  sameTenant(current,freezer,'Retention Policy freezer');
  invariant(current.status==='DRAFT','Only a DRAFT Retention Policy can be frozen.');
  invariant(rules.length>0,'Retention Policy requires at least one Rule.');
  invariant(rules.every(rule=>rule.retentionPolicyId===current.id),'All Retention Rules must belong to the Policy.');
  required(checksum,'Retention Policy checksum');date(frozenAt,'Retention Policy frozenAt');
  invariant(Date.parse(frozenAt)>=Date.parse(current.createdAt),'Retention Policy cannot freeze before creation.');
  return Object.freeze({...current,status:'FROZEN',checksum,frozenByPersonId:freezer.id,frozenAt});
}

export function activateRetentionPolicy(current:RetentionPolicy,decision:Decision,activatedAt:string):RetentionPolicy{
  sameTenant(current,decision,'Retention Policy activation Decision');
  invariant(current.status==='FROZEN','Only a FROZEN Retention Policy can be activated.');
  invariant(decision.subjectObjectId===current.scopeObjectId,'Retention Policy Decision must govern the Policy scope object.');
  invariant(decision.subjectVersion===current.checksum,'Retention Policy Decision must cite the exact frozen Policy checksum.');
  invariant(decision.outcome==='APPROVED','Retention Policy activation requires an APPROVED Decision.');
  date(activatedAt,'Retention Policy activatedAt');
  invariant(Boolean(current.frozenAt),'Frozen Retention Policy requires frozenAt evidence.');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(current.frozenAt!),'Retention Policy approval Decision cannot predate the frozen Policy version.');
  invariant(Date.parse(activatedAt)>=Date.parse(decision.decidedAt),'Retention Policy activation cannot predate its approval Decision.');
  return Object.freeze({...current,status:'ACTIVE',approvalDecisionId:decision.id,activatedAt});
}

export function createHold(input:Hold,subject:CanonicalObjectIdentity,imposer:Person):Hold{
  sameTenant(input,subject,'Hold subject');sameTenant(input,imposer,'Hold imposer');
  invariant(input.subjectObjectId===subject.id,'Hold subject reference does not match.');
  invariant(input.imposedByPersonId===imposer.id,'Hold imposer reference does not match.');
  required(input.reason,'Hold reason');date(input.imposedAt,'Hold imposedAt');
  invariant(input.status==='ACTIVE'&&!input.releaseDecisionId&&!input.releasedAt&&!input.releasedByPersonId,'New Hold must start ACTIVE.');
  if(input.holdType==='LEGAL'||input.holdType==='REGULATORY'){
    invariant(input.blocksDestruction,'Legal and Regulatory Holds must block destruction.');
  }
  return Object.freeze({...input});
}

export function releaseHold(current:Hold,decision:Decision,releaser:Person,releasedAt:string):Hold{
  sameTenant(current,decision,'Hold release Decision');sameTenant(current,releaser,'Hold releaser');
  invariant(current.status==='ACTIVE','Only an ACTIVE Hold can be released.');
  invariant(decision.subjectObjectId===current.subjectObjectId,'Hold release Decision must govern the held object.');
  if(current.subjectVersion!==undefined){
    invariant(decision.subjectVersion===current.subjectVersion,'Hold release Decision must cite the held subject version.');
  }
  invariant(decision.outcome==='APPROVED','Hold release requires an APPROVED Decision.');
  date(releasedAt,'Hold releasedAt');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(current.imposedAt),'Hold release Decision cannot predate the Hold.');
  invariant(Date.parse(releasedAt)>=Date.parse(decision.decidedAt),'Hold release cannot predate its approval Decision.');
  return Object.freeze({...current,status:'RELEASED',releaseDecisionId:decision.id,releasedByPersonId:releaser.id,releasedAt});
}

export function createDispositionSchedule(input:DispositionSchedule,rule:RetentionRule,creator:Person):DispositionSchedule{
  sameTenant(input,rule,'Disposition Schedule Rule');sameTenant(input,creator,'Disposition Schedule creator');
  invariant(input.retentionRuleId===rule.id,'Disposition Schedule Rule reference does not match.');
  invariant(rule.enabled,'Disposition Schedule requires an enabled Retention Rule.');
  invariant(input.createdByPersonId===creator.id,'Disposition Schedule creator reference does not match.');
  required(input.scheduleExpression,'Disposition Schedule expression');required(input.timezone,'Disposition Schedule timezone');
  date(input.createdAt,'Disposition Schedule createdAt');
  return Object.freeze({...input});
}

export function createDispositionRun(input:DispositionRun,policy:RetentionPolicy,rule:RetentionRule,requester:Person,schedule?:DispositionSchedule):DispositionRun{
  sameTenant(input,policy,'Disposition Run Policy');sameTenant(input,rule,'Disposition Run Rule');sameTenant(input,requester,'Disposition Run requester');
  invariant(policy.status==='ACTIVE','Disposition Run requires an ACTIVE Retention Policy.');
  invariant(rule.retentionPolicyId===policy.id&&input.retentionRuleId===rule.id,'Disposition Run Rule must belong to active Policy.');
  invariant(rule.enabled,'Disposition Run requires an enabled Retention Rule.');
  invariant(input.requestedByPersonId===requester.id,'Disposition Run requester reference does not match.');
  if(schedule){
    sameTenant(input,schedule,'Disposition Run Schedule');
    invariant(schedule.id===input.scheduleId&&schedule.retentionRuleId===rule.id&&schedule.enabled,'Disposition Run Schedule must be enabled and belong to Rule.');
  }else{
    invariant(input.scheduleId===undefined,'Ad-hoc Disposition Run must not reference a Schedule.');
  }
  required(input.runReference,'Disposition Run reference');required(input.selectionChecksum,'Disposition Run selection checksum');
  date(input.requestedAt,'Disposition Run requestedAt');
  invariant(input.status==='QUEUED'&&!input.startedAt&&!input.completedAt,'New Disposition Run must start QUEUED.');
  return Object.freeze({...input,selectionSnapshot:Object.freeze({...input.selectionSnapshot})});
}

export function startDispositionRun(current:DispositionRun,startedAt:string):DispositionRun{
  invariant(current.status==='QUEUED','Only a QUEUED Disposition Run can start.');
  date(startedAt,'Disposition Run startedAt');invariant(Date.parse(startedAt)>=Date.parse(current.requestedAt),'Disposition Run cannot start before request.');
  return Object.freeze({...current,status:'RUNNING',startedAt});
}

export function createArchiveRecord(
  input:ArchiveRecord,
  run:DispositionRun,
  rule:RetentionRule,
  subject:CanonicalObjectIdentity,
  archiver:Person,
  activeHolds:readonly Hold[]
):ArchiveRecord{
  sameTenant(input,run,'Archive Record Run');sameTenant(input,rule,'Archive Record Rule');sameTenant(input,subject,'Archive Record subject');sameTenant(input,archiver,'Archive Record archiver');
  invariant(run.status==='RUNNING','Archive Record requires a RUNNING Disposition Run.');
  invariant(run.retentionRuleId===rule.id&&rule.dispositionAction==='ARCHIVE','Archive Record requires an ARCHIVE Retention Rule.');
  invariant(input.dispositionRunId===run.id&&input.subjectObjectId===subject.id,'Archive Record references do not match execution context.');
  invariant(input.archivedByPersonId===archiver.id,'Archive Record archiver reference does not match.');
  const blocking=activeHolds.find(hold=>hold.status==='ACTIVE'&&hold.blocksArchive&&hold.subjectObjectId===input.subjectObjectId&&(hold.subjectVersion===undefined||hold.subjectVersion===input.subjectVersion));
  invariant(!blocking,'Active Hold blocks archive of this subject.');
  required(input.archiveReference,'Archive reference');required(input.integrityHash,'Archive integrity hash');date(input.archivedAt,'Archive archivedAt');
  invariant(Boolean(run.startedAt)&&Date.parse(input.archivedAt)>=Date.parse(run.startedAt!),'Archive evidence cannot predate Disposition Run start.');
  invariant(input.status==='AVAILABLE','New Archive Record must start AVAILABLE.');
  return Object.freeze({...input,archiveManifest:Object.freeze({...input.archiveManifest})});
}

export function createDestructionEvidence(
  input:DestructionEvidence,
  run:DispositionRun,
  rule:RetentionRule,
  subject:CanonicalObjectIdentity,
  decision:Decision,
  destroyer:Person,
  activeHolds:readonly Hold[]
):DestructionEvidence{
  sameTenant(input,run,'Destruction Evidence Run');sameTenant(input,rule,'Destruction Evidence Rule');sameTenant(input,subject,'Destruction Evidence subject');sameTenant(input,decision,'Destruction Decision');sameTenant(input,destroyer,'Destruction executor');
  invariant(run.status==='RUNNING','Destruction Evidence requires a RUNNING Disposition Run.');
  invariant(run.retentionRuleId===rule.id&&rule.dispositionAction==='DESTROY','Destruction Evidence requires a DESTROY Retention Rule.');
  invariant(input.dispositionRunId===run.id&&input.subjectObjectId===subject.id,'Destruction Evidence references do not match execution context.');
  invariant(input.destructionDecisionId===decision.id&&decision.subjectObjectId===input.subjectObjectId,'Destruction Decision must govern the destroyed object.');
  if(input.subjectVersion!==undefined)invariant(decision.subjectVersion===input.subjectVersion,'Destruction Decision must cite the exact subject version.');
  invariant(decision.outcome==='APPROVED','Destruction requires an APPROVED Decision.');
  invariant(input.destroyedByPersonId===destroyer.id,'Destruction executor reference does not match.');
  const blocking=activeHolds.find(hold=>hold.status==='ACTIVE'&&hold.blocksDestruction&&hold.subjectObjectId===input.subjectObjectId&&(hold.subjectVersion===undefined||hold.subjectVersion===input.subjectVersion));
  invariant(!blocking,'Active Hold blocks destruction of this subject.');
  required(input.method,'Destruction method');required(input.integrityHash,'Destruction evidence integrity hash');date(input.destroyedAt,'Destroyed at');
  invariant(Boolean(run.startedAt)&&Date.parse(input.destroyedAt)>=Date.parse(run.startedAt!),'Destruction evidence cannot predate Disposition Run start.');
  invariant(Date.parse(input.destroyedAt)>=Date.parse(decision.decidedAt),'Destruction execution cannot predate its approval Decision.');
  return Object.freeze({...input,evidence:Object.freeze({...input.evidence})});
}

export function createDispositionItemResult(
  input:DispositionItemResult,
  run:DispositionRun,
  rule:RetentionRule,
  recorder:Person,
  activeHolds:readonly Hold[],
  archive?:ArchiveRecord,
  destruction?:DestructionEvidence
):DispositionItemResult{
  sameTenant(input,run,'Disposition Item Result Run');sameTenant(input,rule,'Disposition Item Result Rule');sameTenant(input,recorder,'Disposition Item Result recorder');
  invariant(run.status==='RUNNING','Disposition Item Result requires a RUNNING Run.');
  invariant(input.dispositionRunId===run.id&&run.retentionRuleId===rule.id,'Disposition Item Result execution references do not match.');
  invariant(input.recordedByPersonId===recorder.id,'Disposition Item Result recorder reference does not match.');
  required(input.reason,'Disposition Item Result reason');date(input.recordedAt,'Disposition Item Result recordedAt');
  invariant(Boolean(run.startedAt)&&Date.parse(input.recordedAt)>=Date.parse(run.startedAt!),'Disposition Item Result cannot predate Run start.');
  const blockingHold=activeHolds.find(hold=>hold.status==='ACTIVE'&&hold.subjectObjectId===input.subjectObjectId&&(hold.subjectVersion===undefined||hold.subjectVersion===input.subjectVersion)&&(
    rule.dispositionAction==='DESTROY'?hold.blocksDestruction:rule.dispositionAction==='ARCHIVE'?hold.blocksArchive:false
  ));
  if(blockingHold){
    invariant(input.outcome==='HELD','A blocking Hold requires HELD disposition outcome.');
    invariant(input.holdId===blockingHold.id,'HELD disposition must cite the blocking Hold.');
  }
  if(input.outcome==='ARCHIVED'){
    invariant(rule.dispositionAction==='ARCHIVE'&&archive!==undefined,'ARCHIVED result requires Archive Record under ARCHIVE Rule.');
    sameSubject(input,archive!,'Archived result');
    invariant(input.archiveRecordId===archive!.id,'ARCHIVED result must cite supplied Archive Record.');
  }
  if(input.outcome==='DESTROYED'){
    invariant(rule.dispositionAction==='DESTROY'&&destruction!==undefined,'DESTROYED result requires Destruction Evidence under DESTROY Rule.');
    sameSubject(input,destruction!,'Destroyed result');
    invariant(input.destructionEvidenceId===destruction!.id,'DESTROYED result must cite supplied Destruction Evidence.');
  }
  if(input.outcome==='REVIEW_REQUIRED')invariant(rule.dispositionAction==='REVIEW','REVIEW_REQUIRED outcome requires REVIEW Rule.');
  return Object.freeze({...input});
}

export function completeDispositionRun(current:DispositionRun,results:readonly DispositionItemResult[],completedAt:string):DispositionRun{
  invariant(current.status==='RUNNING','Only a RUNNING Disposition Run can complete.');
  invariant(results.length>0,'Disposition Run requires at least one Item Result.');
  invariant(results.every(result=>result.dispositionRunId===current.id),'All Item Results must belong to the Disposition Run.');
  date(completedAt,'Disposition Run completedAt');
  invariant(Boolean(current.startedAt)&&Date.parse(completedAt)>=Date.parse(current.startedAt!),'Disposition Run cannot complete before it started.');
  const exceptions=results.some(result=>['HELD','REVIEW_REQUIRED','SKIPPED','FAILED'].includes(result.outcome));
  const allFailed=results.every(result=>result.outcome==='FAILED');
  return Object.freeze({...current,status:allFailed?'FAILED':exceptions?'COMPLETED_WITH_EXCEPTIONS':'COMPLETED',completedAt});
}

export function createRestoreRun(input:RestoreRun,archive:ArchiveRecord,decision:Decision,restorer:Person):RestoreRun{
  sameTenant(input,archive,'Restore Run Archive');sameTenant(input,decision,'Restore Decision');sameTenant(input,restorer,'Restore executor');
  invariant(archive.status==='AVAILABLE','Restore requires an AVAILABLE Archive Record.');
  invariant(input.archiveRecordId===archive.id,'Restore Run Archive reference does not match.');
  invariant(input.subjectObjectId===archive.subjectObjectId&&(input.subjectVersion??null)===(archive.subjectVersion??null),'Restore subject must match archived subject.');
  invariant(input.restoreDecisionId===decision.id&&decision.subjectObjectId===input.subjectObjectId,'Restore Decision must govern archived subject.');
  if(input.subjectVersion!==undefined)invariant(decision.subjectVersion===input.subjectVersion,'Restore Decision must cite exact archived version.');
  invariant(decision.outcome==='APPROVED','Restore requires an APPROVED Decision.');
  invariant(input.restoredByPersonId===restorer.id,'Restore executor reference does not match.');
  required(input.restoreReference,'Restore reference');required(input.restoredContentReference,'Restored content reference');required(input.integrityHash,'Restore integrity hash');date(input.restoredAt,'Restored at');
  invariant(Date.parse(decision.decidedAt)>=Date.parse(archive.archivedAt),'Restore approval Decision cannot predate the Archive Record.');
  invariant(Date.parse(input.restoredAt)>=Date.parse(decision.decidedAt),'Restore execution cannot predate its approval Decision.');
  if(input.status==='FAILED')required(input.message??'','Failed Restore message');
  return Object.freeze({...input});
}
