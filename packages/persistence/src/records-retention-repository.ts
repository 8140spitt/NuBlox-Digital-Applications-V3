import { createHash } from 'node:crypto';
import {
  activateRetentionPolicy,
  completeDispositionRun,
  createArchiveRecord,
  createDestructionEvidence,
  createDispositionItemResult,
  createDispositionRun,
  createDispositionSchedule,
  createHold,
  createRestoreRun,
  createRetentionPolicy,
  createRetentionRule,
  freezeRetentionPolicy,
  releaseHold,
  startDispositionRun,
  type ArchiveRecord,
  type CanonicalObjectIdentity,
  type Decision,
  type DestructionEvidence,
  type DispositionItemResult,
  type DispositionRun,
  type DispositionSchedule,
  type Hold,
  type Person,
  type RestoreRun,
  type RetentionPolicy,
  type RetentionRule,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface PolicyRow extends RowDataPacket {
  id:string;tenant_id:string;scope_object_id:string;code:string;name:string;description:string|null;
  version:number;status:RetentionPolicy['status'];checksum:string|null;created_by_person_id:string;
  policy_created_at:Date;frozen_by_person_id:string|null;frozen_at:Date|null;
  approval_decision_id:string|null;activated_at:Date|null;row_version:number;
}
interface RuleRow extends RowDataPacket {
  id:string;tenant_id:string;retention_policy_id:string;code:string;name:string;object_family:string;
  trigger_type:RetentionRule['triggerType'];trigger_field:string|null;retention_period_days:number;
  selection_criteria:string|Record<string,unknown>;disposition_action:RetentionRule['dispositionAction'];
  enabled:number;sequence:number;
}
interface HoldRow extends RowDataPacket {
  id:string;tenant_id:string;subject_object_id:string;subject_version:string|null;hold_type:Hold['holdType'];
  reason:string;blocks_archive:number;blocks_destruction:number;status:Hold['status'];
  imposed_by_person_id:string;imposed_at:Date;release_decision_id:string|null;
  released_by_person_id:string|null;released_at:Date|null;row_version:number;
}
interface ScheduleRow extends RowDataPacket {
  id:string;tenant_id:string;retention_rule_id:string;schedule_expression:string;timezone:string;
  enabled:number;created_by_person_id:string;schedule_created_at:Date;
}
interface RunRow extends RowDataPacket {
  id:string;tenant_id:string;retention_rule_id:string;schedule_id:string|null;run_reference:string;
  selection_snapshot:string|Record<string,unknown>;selection_checksum:string;requested_by_person_id:string;
  requested_at:Date;status:DispositionRun['status'];started_at:Date|null;completed_at:Date|null;row_version:number;
}
interface ArchiveRow extends RowDataPacket {
  id:string;tenant_id:string;disposition_run_id:string;subject_object_id:string;subject_version:string|null;
  archive_reference:string;integrity_hash:string;archive_manifest:string|Record<string,unknown>;
  status:ArchiveRecord['status'];archived_by_person_id:string;archived_at:Date;
}
interface RestoreRow extends RowDataPacket {
  id:string;tenant_id:string;archive_record_id:string;subject_object_id:string;subject_version:string|null;
  restore_reference:string;restore_decision_id:string;restored_content_reference:string;integrity_hash:string;
  restored_by_person_id:string;restored_at:Date;status:RestoreRun['status'];message:string|null;
}
interface DestructionRow extends RowDataPacket {
  id:string;tenant_id:string;disposition_run_id:string;subject_object_id:string;subject_version:string|null;
  archive_record_id:string|null;destruction_decision_id:string;method:string;
  metadata_outcome:DestructionEvidence['metadataOutcome'];content_outcome:DestructionEvidence['contentOutcome'];
  integrity_hash:string;destroyed_by_person_id:string;destroyed_at:Date;evidence:string|Record<string,unknown>;
}
interface ResultRow extends RowDataPacket {
  id:string;tenant_id:string;disposition_run_id:string;subject_object_id:string;subject_version:string|null;
  outcome:DispositionItemResult['outcome'];reason:string;hold_id:string|null;archive_record_id:string|null;
  destruction_evidence_id:string|null;recorded_by_person_id:string;recorded_at:Date;
}
interface PersonRow extends RowDataPacket {
  id:string;tenant_id:string;party_id:string;legal_name:string;preferred_name:string|null;status:Person['status'];
}
interface DecisionRow extends RowDataPacket {
  id:string;tenant_id:string;decision_type:string;subject_object_id:string;subject_version:string|null;
  outcome:string;reason:string;decider_person_id:string;authority_grant_id:string|null;decided_at:Date;
}
interface CanonicalObjectRow extends RowDataPacket {
  id:string;tenant_id:string;object_type:string;stable_key:string;created_at:Date;
}

function objectJson(value:unknown):Readonly<Record<string,unknown>>{
  const parsed=typeof value==='string'?JSON.parse(value):value;
  return typeof parsed==='object'&&parsed!==null&&!Array.isArray(parsed)
    ? parsed as Readonly<Record<string,unknown>>
    : {};
}
function stable(value:unknown):unknown{
  if(Array.isArray(value))return value.map(stable);
  if(typeof value==='object'&&value!==null){
    const obj=value as Record<string,unknown>;
    return Object.fromEntries(Object.keys(obj).sort().map(key=>[key,stable(obj[key])]));
  }
  return value;
}
function sha(value:unknown):string{
  return 'sha256:'+createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}
const mapPolicy=(r:PolicyRow):RetentionPolicy=>({
  id:r.id as RetentionPolicy['id'],tenantId:r.tenant_id as TenantId,
  scopeObjectId:r.scope_object_id as RetentionPolicy['scopeObjectId'],code:r.code,name:r.name,
  ...(r.description?{description:r.description}:{}),version:Number(r.version),status:r.status,
  ...(r.checksum?{checksum:r.checksum}:{}),
  createdByPersonId:r.created_by_person_id as RetentionPolicy['createdByPersonId'],
  createdAt:r.policy_created_at.toISOString(),
  ...(r.frozen_by_person_id?{frozenByPersonId:r.frozen_by_person_id as NonNullable<RetentionPolicy['frozenByPersonId']>}:{}),
  ...(r.frozen_at?{frozenAt:r.frozen_at.toISOString()}:{}),
  ...(r.approval_decision_id?{approvalDecisionId:r.approval_decision_id as NonNullable<RetentionPolicy['approvalDecisionId']>}:{}),
  ...(r.activated_at?{activatedAt:r.activated_at.toISOString()}:{})
});
const mapRule=(r:RuleRow):RetentionRule=>({
  id:r.id as RetentionRule['id'],tenantId:r.tenant_id as TenantId,
  retentionPolicyId:r.retention_policy_id as RetentionRule['retentionPolicyId'],
  code:r.code,name:r.name,objectFamily:r.object_family,triggerType:r.trigger_type,
  ...(r.trigger_field?{triggerField:r.trigger_field}:{}),retentionPeriodDays:Number(r.retention_period_days),
  selectionCriteria:objectJson(r.selection_criteria),dispositionAction:r.disposition_action,
  enabled:Boolean(r.enabled),sequence:Number(r.sequence)
});
const mapHold=(r:HoldRow):Hold=>({
  id:r.id as Hold['id'],tenantId:r.tenant_id as TenantId,
  subjectObjectId:r.subject_object_id as Hold['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),holdType:r.hold_type,reason:r.reason,
  blocksArchive:Boolean(r.blocks_archive),blocksDestruction:Boolean(r.blocks_destruction),status:r.status,
  imposedByPersonId:r.imposed_by_person_id as Hold['imposedByPersonId'],imposedAt:r.imposed_at.toISOString(),
  ...(r.release_decision_id?{releaseDecisionId:r.release_decision_id as NonNullable<Hold['releaseDecisionId']>}:{}),
  ...(r.released_by_person_id?{releasedByPersonId:r.released_by_person_id as NonNullable<Hold['releasedByPersonId']>}:{}),
  ...(r.released_at?{releasedAt:r.released_at.toISOString()}:{})
});
const mapSchedule=(r:ScheduleRow):DispositionSchedule=>({
  id:r.id as DispositionSchedule['id'],tenantId:r.tenant_id as TenantId,
  retentionRuleId:r.retention_rule_id as DispositionSchedule['retentionRuleId'],
  scheduleExpression:r.schedule_expression,timezone:r.timezone,enabled:Boolean(r.enabled),
  createdByPersonId:r.created_by_person_id as DispositionSchedule['createdByPersonId'],
  createdAt:r.schedule_created_at.toISOString()
});
const mapRun=(r:RunRow):DispositionRun=>({
  id:r.id as DispositionRun['id'],tenantId:r.tenant_id as TenantId,
  retentionRuleId:r.retention_rule_id as DispositionRun['retentionRuleId'],
  ...(r.schedule_id?{scheduleId:r.schedule_id as NonNullable<DispositionRun['scheduleId']>}:{}),
  runReference:r.run_reference,selectionSnapshot:objectJson(r.selection_snapshot),
  selectionChecksum:r.selection_checksum,requestedByPersonId:r.requested_by_person_id as DispositionRun['requestedByPersonId'],
  requestedAt:r.requested_at.toISOString(),status:r.status,
  ...(r.started_at?{startedAt:r.started_at.toISOString()}:{}),
  ...(r.completed_at?{completedAt:r.completed_at.toISOString()}:{})
});
const mapArchive=(r:ArchiveRow):ArchiveRecord=>({
  id:r.id as ArchiveRecord['id'],tenantId:r.tenant_id as TenantId,
  dispositionRunId:r.disposition_run_id as ArchiveRecord['dispositionRunId'],
  subjectObjectId:r.subject_object_id as ArchiveRecord['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),
  archiveReference:r.archive_reference,integrityHash:r.integrity_hash,archiveManifest:objectJson(r.archive_manifest),
  status:r.status,archivedByPersonId:r.archived_by_person_id as ArchiveRecord['archivedByPersonId'],
  archivedAt:r.archived_at.toISOString()
});
const mapRestore=(r:RestoreRow):RestoreRun=>({
  id:r.id as RestoreRun['id'],tenantId:r.tenant_id as TenantId,
  archiveRecordId:r.archive_record_id as RestoreRun['archiveRecordId'],
  subjectObjectId:r.subject_object_id as RestoreRun['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),restoreReference:r.restore_reference,
  restoreDecisionId:r.restore_decision_id as RestoreRun['restoreDecisionId'],
  restoredContentReference:r.restored_content_reference,integrityHash:r.integrity_hash,
  restoredByPersonId:r.restored_by_person_id as RestoreRun['restoredByPersonId'],
  restoredAt:r.restored_at.toISOString(),status:r.status,...(r.message?{message:r.message}:{})
});
const mapDestruction=(r:DestructionRow):DestructionEvidence=>({
  id:r.id as DestructionEvidence['id'],tenantId:r.tenant_id as TenantId,
  dispositionRunId:r.disposition_run_id as DestructionEvidence['dispositionRunId'],
  subjectObjectId:r.subject_object_id as DestructionEvidence['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),
  ...(r.archive_record_id?{archiveRecordId:r.archive_record_id as NonNullable<DestructionEvidence['archiveRecordId']>}:{}),
  destructionDecisionId:r.destruction_decision_id as DestructionEvidence['destructionDecisionId'],
  method:r.method,metadataOutcome:r.metadata_outcome,contentOutcome:r.content_outcome,
  integrityHash:r.integrity_hash,destroyedByPersonId:r.destroyed_by_person_id as DestructionEvidence['destroyedByPersonId'],
  destroyedAt:r.destroyed_at.toISOString(),evidence:objectJson(r.evidence)
});
const mapResult=(r:ResultRow):DispositionItemResult=>({
  id:r.id as DispositionItemResult['id'],tenantId:r.tenant_id as TenantId,
  dispositionRunId:r.disposition_run_id as DispositionItemResult['dispositionRunId'],
  subjectObjectId:r.subject_object_id as DispositionItemResult['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,reason:r.reason,
  ...(r.hold_id?{holdId:r.hold_id as NonNullable<DispositionItemResult['holdId']>}:{}),
  ...(r.archive_record_id?{archiveRecordId:r.archive_record_id as NonNullable<DispositionItemResult['archiveRecordId']>}:{}),
  ...(r.destruction_evidence_id?{destructionEvidenceId:r.destruction_evidence_id as NonNullable<DispositionItemResult['destructionEvidenceId']>}:{}),
  recordedByPersonId:r.recorded_by_person_id as DispositionItemResult['recordedByPersonId'],
  recordedAt:r.recorded_at.toISOString()
});
const mapPerson=(r:PersonRow):Person=>({
  id:r.id as Person['id'],tenantId:r.tenant_id as TenantId,partyId:r.party_id as Person['partyId'],
  legalName:r.legal_name,...(r.preferred_name?{preferredName:r.preferred_name}:{}),status:r.status
});
const mapDecision=(r:DecisionRow):Decision=>({
  id:r.id as Decision['id'],tenantId:r.tenant_id as TenantId,decisionType:r.decision_type,
  subjectObjectId:r.subject_object_id as Decision['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,reason:r.reason,
  deciderPersonId:r.decider_person_id as Decision['deciderPersonId'],
  ...(r.authority_grant_id?{authorityGrantId:r.authority_grant_id as NonNullable<Decision['authorityGrantId']>}:{}),
  decidedAt:r.decided_at.toISOString()
});
const mapCanonicalObject=(r:CanonicalObjectRow):CanonicalObjectIdentity=>({
  id:r.id as CanonicalObjectIdentity['id'],tenantId:r.tenant_id as TenantId,
  objectType:r.object_type,stableKey:r.stable_key,createdAt:r.created_at.toISOString()
});

async function evidence(
  c:PoolConnection,t:TenantId,type:string,id:string,action:string,audit:AuditContext,payload:unknown
){
  await c.execute(
    'INSERT INTO kernel_audit_entries (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload) VALUES (?,?,?,?,?,?,?)',
    [t,type,id,action,audit.actorPersonId??null,audit.correlationId??null,JSON.stringify(payload)]
  );
  await writeOutboxEvent(c,{tenantId:t,aggregateType:type,aggregateId:id,eventType:type+'.'+action,payload});
}

export class MySqlRecordsRetentionRepository {
  constructor(private readonly pool:Pool){}

  async createPolicy(input:RetentionPolicy,audit:AuditContext={}):Promise<void>{
    const [scope,creator]=await Promise.all([
      this.requireCanonicalObject(input.tenantId,input.scopeObjectId),
      this.requirePerson(input.tenantId,input.createdByPersonId)
    ]);
    createRetentionPolicy(input,scope,creator);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO retention_policies (id,tenant_id,scope_object_id,code,name,description,version,status,checksum,created_by_person_id,policy_created_at,frozen_by_person_id,frozen_at,approval_decision_id,activated_at,active_policy_guard_key,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.scopeObjectId,input.code,input.name,input.description??null,input.version,input.status,null,input.createdByPersonId,new Date(input.createdAt),null,null,null,null,null,audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'RETENTION_POLICY',input.id,'CREATED',audit,input);
    });
  }

  async addRule(input:RetentionRule,audit:AuditContext={}):Promise<void>{
    const policy=await this.requirePolicy(input.tenantId,input.retentionPolicyId);
    createRetentionRule(input,policy);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO retention_rules (id,tenant_id,retention_policy_id,code,name,object_family,trigger_type,trigger_field,retention_period_days,selection_criteria,disposition_action,enabled,sequence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.retentionPolicyId,input.code,input.name,input.objectFamily,input.triggerType,input.triggerField??null,input.retentionPeriodDays,JSON.stringify(input.selectionCriteria),input.dispositionAction,input.enabled,input.sequence]
      );
      await evidence(c,input.tenantId,'RETENTION_RULE',input.id,'CREATED',audit,input);
    });
  }

  async freezePolicy(
    t:TenantId,id:RetentionPolicy['id'],freezerId:Person['id'],frozenAt:string,audit:AuditContext={}
  ):Promise<RetentionPolicy>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<PolicyRow[]>('SELECT * FROM retention_policies WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Retention Policy not found in tenant.');
      const current=mapPolicy(rows[0]);
      const [ruleRows,personRows]=await Promise.all([
        c.execute<RuleRow[]>('SELECT * FROM retention_rules WHERE tenant_id=? AND retention_policy_id=? ORDER BY sequence,id',[t,id]),
        c.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,freezerId])
      ]);
      if(!personRows[0][0])throw new Error('Person not found in tenant.');
      const rules=ruleRows[0].map(mapRule);
      const checksum=sha({
        scopeObjectId:current.scopeObjectId,code:current.code,version:current.version,
        rules:rules.map(rule=>({
          sequence:rule.sequence,code:rule.code,objectFamily:rule.objectFamily,triggerType:rule.triggerType,
          triggerField:rule.triggerField,retentionPeriodDays:rule.retentionPeriodDays,
          selectionCriteria:rule.selectionCriteria,dispositionAction:rule.dispositionAction,enabled:rule.enabled
        }))
      });
      const next=freezeRetentionPolicy(current,rules,checksum,mapPerson(personRows[0][0]),frozenAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE retention_policies SET status=?,checksum=?,frozen_by_person_id=?,frozen_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.checksum!,next.frozenByPersonId!,new Date(frozenAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Retention Policy freeze detected.');
      await evidence(c,t,'RETENTION_POLICY',id,'FROZEN',audit,next);
      return next;
    });
  }

  async activatePolicy(
    t:TenantId,id:RetentionPolicy['id'],decisionId:Decision['id'],activatedAt:string,audit:AuditContext={}
  ):Promise<RetentionPolicy>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<PolicyRow[]>('SELECT * FROM retention_policies WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Retention Policy not found in tenant.');
      const current=mapPolicy(rows[0]);
      const decision=await this.requireDecision(t,decisionId,c);
      const next=activateRetentionPolicy(current,decision,activatedAt);
      await c.execute(
        'UPDATE retention_policies SET status=\'SUPERSEDED\',active_policy_guard_key=NULL,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND code=? AND status=\'ACTIVE\' AND id<>?',
        [audit.actorPersonId??null,t,current.code,id]
      );
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE retention_policies SET status=?,approval_decision_id=?,activated_at=?,active_policy_guard_key=code,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.approvalDecisionId!,new Date(activatedAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Retention Policy activation detected.');
      await evidence(c,t,'RETENTION_POLICY',id,'ACTIVATED',audit,next);
      return next;
    });
  }

  async createHold(input:Hold,audit:AuditContext={}):Promise<void>{
    const [subject,imposer]=await Promise.all([
      this.requireCanonicalObject(input.tenantId,input.subjectObjectId),
      this.requirePerson(input.tenantId,input.imposedByPersonId)
    ]);
    createHold(input,subject,imposer);
    const guard=[input.subjectObjectId,input.subjectVersion??'*',input.holdType].join(':');
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO retention_holds (id,tenant_id,subject_object_id,subject_version,hold_type,reason,blocks_archive,blocks_destruction,status,imposed_by_person_id,imposed_at,release_decision_id,released_by_person_id,released_at,active_hold_guard_key,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.subjectObjectId,input.subjectVersion??null,input.holdType,input.reason,input.blocksArchive,input.blocksDestruction,input.status,input.imposedByPersonId,new Date(input.imposedAt),null,null,null,guard,audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'HOLD',input.id,'IMPOSED',audit,input);
    });
  }

  async releaseHold(
    t:TenantId,id:Hold['id'],decisionId:Decision['id'],releaserId:Person['id'],releasedAt:string,audit:AuditContext={}
  ):Promise<Hold>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<HoldRow[]>('SELECT * FROM retention_holds WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Hold not found in tenant.');
      const [decision,releaser]=await Promise.all([
        this.requireDecision(t,decisionId,c),this.requirePerson(t,releaserId,c)
      ]);
      const next=releaseHold(mapHold(rows[0]),decision,releaser,releasedAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE retention_holds SET status=?,release_decision_id=?,released_by_person_id=?,released_at=?,active_hold_guard_key=NULL,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.releaseDecisionId!,next.releasedByPersonId!,new Date(releasedAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Hold release detected.');
      await evidence(c,t,'HOLD',id,'RELEASED',audit,next);
      return next;
    });
  }

  async createSchedule(input:DispositionSchedule,audit:AuditContext={}):Promise<void>{
    const [rule,creator]=await Promise.all([
      this.requireRule(input.tenantId,input.retentionRuleId),this.requirePerson(input.tenantId,input.createdByPersonId)
    ]);
    createDispositionSchedule(input,rule,creator);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO disposition_schedules (id,tenant_id,retention_rule_id,schedule_expression,timezone,enabled,created_by_person_id,schedule_created_at) VALUES (?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.retentionRuleId,input.scheduleExpression,input.timezone,input.enabled,input.createdByPersonId,new Date(input.createdAt)]
      );
      await evidence(c,input.tenantId,'DISPOSITION_SCHEDULE',input.id,'CREATED',audit,input);
    });
  }

  async createRun(input:DispositionRun,audit:AuditContext={}):Promise<void>{
    const rule=await this.requireRule(input.tenantId,input.retentionRuleId);
    const [policy,requester,schedule]=await Promise.all([
      this.requirePolicy(input.tenantId,rule.retentionPolicyId),
      this.requirePerson(input.tenantId,input.requestedByPersonId),
      input.scheduleId?this.requireSchedule(input.tenantId,input.scheduleId):Promise.resolve(undefined)
    ]);
    createDispositionRun(input,policy,rule,requester,schedule);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO disposition_runs (id,tenant_id,retention_rule_id,schedule_id,run_reference,selection_snapshot,selection_checksum,requested_by_person_id,requested_at,status,started_at,completed_at,active_rule_guard_key,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.retentionRuleId,input.scheduleId??null,input.runReference,JSON.stringify(input.selectionSnapshot),input.selectionChecksum,input.requestedByPersonId,new Date(input.requestedAt),input.status,null,null,input.retentionRuleId,audit.actorPersonId??null]
      );
      await evidence(c,input.tenantId,'DISPOSITION_RUN',input.id,'QUEUED',audit,input);
    });
  }

  async startRun(t:TenantId,id:DispositionRun['id'],startedAt:string,audit:AuditContext={}):Promise<DispositionRun>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<RunRow[]>('SELECT * FROM disposition_runs WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Disposition Run not found in tenant.');
      const next=startDispositionRun(mapRun(rows[0]),startedAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE disposition_runs SET status=?,started_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,new Date(startedAt),audit.actorPersonId??null,t,id,rows[0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Disposition Run start detected.');
      await evidence(c,t,'DISPOSITION_RUN',id,'STARTED',audit,next);
      return next;
    });
  }

  async createArchive(input:ArchiveRecord,audit:AuditContext={}):Promise<void>{
    const run=await this.requireRun(input.tenantId,input.dispositionRunId);
    const [rule,subject,archiver,holds]=await Promise.all([
      this.requireRule(input.tenantId,run.retentionRuleId),
      this.requireCanonicalObject(input.tenantId,input.subjectObjectId),
      this.requirePerson(input.tenantId,input.archivedByPersonId),
      this.listActiveHoldsForSubject(input.tenantId,input.subjectObjectId,input.subjectVersion)
    ]);
    createArchiveRecord(input,run,rule,subject,archiver,holds);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO archive_records (id,tenant_id,disposition_run_id,subject_object_id,subject_version,archive_reference,integrity_hash,archive_manifest,status,archived_by_person_id,archived_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.dispositionRunId,input.subjectObjectId,input.subjectVersion??null,input.archiveReference,input.integrityHash,JSON.stringify(input.archiveManifest),input.status,input.archivedByPersonId,new Date(input.archivedAt)]
      );
      await evidence(c,input.tenantId,'ARCHIVE_RECORD',input.id,'ARCHIVED',audit,input);
    });
  }

  async createDestruction(input:DestructionEvidence,audit:AuditContext={}):Promise<void>{
    const run=await this.requireRun(input.tenantId,input.dispositionRunId);
    const [rule,subject,decision,destroyer,holds,archive]=await Promise.all([
      this.requireRule(input.tenantId,run.retentionRuleId),
      this.requireCanonicalObject(input.tenantId,input.subjectObjectId),
      this.requireDecision(input.tenantId,input.destructionDecisionId),
      this.requirePerson(input.tenantId,input.destroyedByPersonId),
      this.listActiveHoldsForSubject(input.tenantId,input.subjectObjectId,input.subjectVersion),
      input.archiveRecordId?this.requireArchive(input.tenantId,input.archiveRecordId):Promise.resolve(undefined)
    ]);
    if(archive){
      if(archive.subjectObjectId!==input.subjectObjectId||(archive.subjectVersion??null)!==(input.subjectVersion??null)){
        throw new Error('Destruction archive reference does not match subject.');
      }
    }
    createDestructionEvidence(input,run,rule,subject,decision,destroyer,holds);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO destruction_evidence (id,tenant_id,disposition_run_id,subject_object_id,subject_version,archive_record_id,destruction_decision_id,method,metadata_outcome,content_outcome,integrity_hash,destroyed_by_person_id,destroyed_at,evidence) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.dispositionRunId,input.subjectObjectId,input.subjectVersion??null,input.archiveRecordId??null,input.destructionDecisionId,input.method,input.metadataOutcome,input.contentOutcome,input.integrityHash,input.destroyedByPersonId,new Date(input.destroyedAt),JSON.stringify(input.evidence)]
      );
      if(input.archiveRecordId){
        await c.execute(
          'UPDATE archive_records SET status=\'DESTROYED\' WHERE tenant_id=? AND id=? AND status=\'AVAILABLE\'',
          [input.tenantId,input.archiveRecordId]
        );
      }
      await evidence(c,input.tenantId,'DESTRUCTION_EVIDENCE',input.id,'RECORDED',audit,input);
    });
  }

  async recordItemResult(input:DispositionItemResult,audit:AuditContext={}):Promise<void>{
    const run=await this.requireRun(input.tenantId,input.dispositionRunId);
    const [rule,recorder,holds,archive,destruction]=await Promise.all([
      this.requireRule(input.tenantId,run.retentionRuleId),
      this.requirePerson(input.tenantId,input.recordedByPersonId),
      this.listActiveHoldsForSubject(input.tenantId,input.subjectObjectId,input.subjectVersion),
      input.archiveRecordId?this.requireArchive(input.tenantId,input.archiveRecordId):Promise.resolve(undefined),
      input.destructionEvidenceId?this.requireDestruction(input.tenantId,input.destructionEvidenceId):Promise.resolve(undefined)
    ]);
    if(input.holdId){
      const hold=await this.requireHold(input.tenantId,input.holdId);
      if(!holds.some(active=>active.id===hold.id))throw new Error('HELD disposition must cite an active matching Hold.');
    }
    createDispositionItemResult(input,run,rule,recorder,holds,archive,destruction);
    const [existing]=await this.pool.execute<ResultRow[]>(
      'SELECT * FROM disposition_item_results WHERE tenant_id=? AND disposition_run_id=? AND subject_object_id=? AND ((subject_version IS NULL AND ? IS NULL) OR subject_version=?) LIMIT 1',
      [input.tenantId,input.dispositionRunId,input.subjectObjectId,input.subjectVersion??null,input.subjectVersion??null]
    );
    if(existing[0])throw new Error('Disposition Item Result already exists for this subject/version in the Run.');
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO disposition_item_results (id,tenant_id,disposition_run_id,subject_object_id,subject_version,outcome,reason,hold_id,archive_record_id,destruction_evidence_id,recorded_by_person_id,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.dispositionRunId,input.subjectObjectId,input.subjectVersion??null,input.outcome,input.reason,input.holdId??null,input.archiveRecordId??null,input.destructionEvidenceId??null,input.recordedByPersonId,new Date(input.recordedAt)]
      );
      await evidence(c,input.tenantId,'DISPOSITION_ITEM_RESULT',input.id,input.outcome,audit,input);
    });
  }

  async completeRun(t:TenantId,id:DispositionRun['id'],completedAt:string,audit:AuditContext={}):Promise<DispositionRun>{
    return withTransaction(this.pool,async c=>{
      const [runRows,resultRows]=await Promise.all([
        c.execute<RunRow[]>('SELECT * FROM disposition_runs WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]),
        c.execute<ResultRow[]>('SELECT * FROM disposition_item_results WHERE tenant_id=? AND disposition_run_id=? ORDER BY recorded_at,id',[t,id])
      ]);
      if(!runRows[0][0])throw new Error('Disposition Run not found in tenant.');
      const next=completeDispositionRun(mapRun(runRows[0][0]),resultRows[0].map(mapResult),completedAt);
      const [u]=await c.execute<ResultSetHeader>(
        'UPDATE disposition_runs SET status=?,completed_at=?,active_rule_guard_key=NULL,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,new Date(completedAt),audit.actorPersonId??null,t,id,runRows[0][0].row_version]
      );
      if(u.affectedRows!==1)throw new Error('Concurrent Disposition Run completion detected.');
      await evidence(c,t,'DISPOSITION_RUN',id,next.status,audit,next);
      return next;
    });
  }

  async createRestore(input:RestoreRun,audit:AuditContext={}):Promise<void>{
    const [archive,decision,restorer]=await Promise.all([
      this.requireArchive(input.tenantId,input.archiveRecordId),
      this.requireDecision(input.tenantId,input.restoreDecisionId),
      this.requirePerson(input.tenantId,input.restoredByPersonId)
    ]);
    createRestoreRun(input,archive,decision,restorer);
    await withTransaction(this.pool,async c=>{
      await c.execute(
        'INSERT INTO restore_runs (id,tenant_id,archive_record_id,subject_object_id,subject_version,restore_reference,restore_decision_id,restored_content_reference,integrity_hash,restored_by_person_id,restored_at,status,message) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.archiveRecordId,input.subjectObjectId,input.subjectVersion??null,input.restoreReference,input.restoreDecisionId,input.restoredContentReference,input.integrityHash,input.restoredByPersonId,new Date(input.restoredAt),input.status,input.message??null]
      );
      await evidence(c,input.tenantId,'RESTORE_RUN',input.id,input.status,audit,input);
    });
  }

  async listPolicies(t:TenantId){const [r]=await this.pool.execute<PolicyRow[]>('SELECT * FROM retention_policies WHERE tenant_id=? ORDER BY code,version DESC',[t]);return r.map(mapPolicy);}
  async listRules(t:TenantId){const [r]=await this.pool.execute<RuleRow[]>('SELECT * FROM retention_rules WHERE tenant_id=? ORDER BY retention_policy_id,sequence,id',[t]);return r.map(mapRule);}
  async listHolds(t:TenantId){const [r]=await this.pool.execute<HoldRow[]>('SELECT * FROM retention_holds WHERE tenant_id=? ORDER BY imposed_at DESC,id',[t]);return r.map(mapHold);}
  async listSchedules(t:TenantId){const [r]=await this.pool.execute<ScheduleRow[]>('SELECT * FROM disposition_schedules WHERE tenant_id=? ORDER BY schedule_created_at DESC,id',[t]);return r.map(mapSchedule);}
  async listRuns(t:TenantId){const [r]=await this.pool.execute<RunRow[]>('SELECT * FROM disposition_runs WHERE tenant_id=? ORDER BY requested_at DESC,id',[t]);return r.map(mapRun);}
  async listArchives(t:TenantId){const [r]=await this.pool.execute<ArchiveRow[]>('SELECT * FROM archive_records WHERE tenant_id=? ORDER BY archived_at DESC,id',[t]);return r.map(mapArchive);}
  async listRestores(t:TenantId){const [r]=await this.pool.execute<RestoreRow[]>('SELECT * FROM restore_runs WHERE tenant_id=? ORDER BY restored_at DESC,id',[t]);return r.map(mapRestore);}
  async listDestructionEvidence(t:TenantId){const [r]=await this.pool.execute<DestructionRow[]>('SELECT * FROM destruction_evidence WHERE tenant_id=? ORDER BY destroyed_at DESC,id',[t]);return r.map(mapDestruction);}
  async listResults(t:TenantId){const [r]=await this.pool.execute<ResultRow[]>('SELECT * FROM disposition_item_results WHERE tenant_id=? ORDER BY recorded_at DESC,id',[t]);return r.map(mapResult);}

  async listActiveHoldsForSubject(t:TenantId,subjectId:string,subjectVersion?:string,c?:PoolConnection){
    const q=c??this.pool;
    const [r]=await q.execute<HoldRow[]>(
      'SELECT * FROM retention_holds WHERE tenant_id=? AND subject_object_id=? AND status=\'ACTIVE\' AND (subject_version IS NULL OR subject_version=?) ORDER BY imposed_at,id',
      [t,subjectId,subjectVersion??null]
    );
    return r.map(mapHold);
  }

  private async requirePolicy(t:TenantId,id:RetentionPolicy['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<PolicyRow[]>('SELECT * FROM retention_policies WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Retention Policy not found in tenant.');return mapPolicy(r[0]);}
  private async requireRule(t:TenantId,id:RetentionRule['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<RuleRow[]>('SELECT * FROM retention_rules WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Retention Rule not found in tenant.');return mapRule(r[0]);}
  private async requireHold(t:TenantId,id:Hold['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<HoldRow[]>('SELECT * FROM retention_holds WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Hold not found in tenant.');return mapHold(r[0]);}
  private async requireSchedule(t:TenantId,id:DispositionSchedule['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ScheduleRow[]>('SELECT * FROM disposition_schedules WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Disposition Schedule not found in tenant.');return mapSchedule(r[0]);}
  private async requireRun(t:TenantId,id:DispositionRun['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<RunRow[]>('SELECT * FROM disposition_runs WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Disposition Run not found in tenant.');return mapRun(r[0]);}
  private async requireArchive(t:TenantId,id:ArchiveRecord['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ArchiveRow[]>('SELECT * FROM archive_records WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Archive Record not found in tenant.');return mapArchive(r[0]);}
  private async requireDestruction(t:TenantId,id:DestructionEvidence['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<DestructionRow[]>('SELECT * FROM destruction_evidence WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Destruction Evidence not found in tenant.');return mapDestruction(r[0]);}
  private async requireDecision(t:TenantId,id:Decision['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<DecisionRow[]>('SELECT * FROM decisions WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Decision not found in tenant.');return mapDecision(r[0]);}
  private async requirePerson(t:TenantId,id:Person['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Person not found in tenant.');return mapPerson(r[0]);}
  private async requireCanonicalObject(t:TenantId,id:string,c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<CanonicalObjectRow[]>('SELECT id,tenant_id,object_type,stable_key,created_at FROM canonical_objects WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Canonical Object not found in tenant.');return mapCanonicalObject(r[0]);}
}

export function retentionEvidenceHash(value:unknown):string{return sha(value);}
