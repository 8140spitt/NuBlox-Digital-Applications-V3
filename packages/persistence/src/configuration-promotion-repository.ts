import { createHash } from 'node:crypto';
import {
  applyConfigurationPromotionConflictDisposition,
  approveConfigurationChangeSet,
  completeConfigurationPromotionRun,
  createConfigurationBaseline,
  createConfigurationBaselineItem,
  createConfigurationChangeItem,
  createConfigurationChangeSet,
  createConfigurationEnvironment,
  createConfigurationPromotionConflict,
  createConfigurationPromotionConflictDisposition,
  createConfigurationPromotionItemResult,
  createConfigurationPromotionRun,
  freezeConfigurationBaseline,
  freezeConfigurationChangeSet,
  startConfigurationPromotionRun,
  type CanonicalObjectIdentity,
  type ConfigurationBaseline,
  type ConfigurationBaselineItem,
  type ConfigurationChangeItem,
  type ConfigurationChangeSet,
  type ConfigurationEnvironment,
  type ConfigurationPromotionConflict,
  type ConfigurationPromotionConflictDisposition,
  type ConfigurationPromotionItemResult,
  type ConfigurationPromotionRun,
  type Decision,
  type Person,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface EnvironmentRow extends RowDataPacket {
  id:string; tenant_id:string; code:string; name:string; environment_type:ConfigurationEnvironment['environmentType'];
  platform_version:string; environment_reference:string; status:ConfigurationEnvironment['status'];
}
interface BaselineRow extends RowDataPacket {
  id:string; tenant_id:string; environment_id:string; baseline_reference:string; platform_version:string;
  status:ConfigurationBaseline['status']; checksum:string|null; created_by_person_id:string;
  baseline_created_at:Date; frozen_by_person_id:string|null; frozen_at:Date|null; row_version:number;
}
interface BaselineItemRow extends RowDataPacket {
  id:string; tenant_id:string; baseline_id:string; sequence:number; object_family:string; object_reference:string;
  object_version:string|null; content_hash:string; snapshot:string|Record<string,unknown>;
}
interface ChangeSetRow extends RowDataPacket {
  id:string; tenant_id:string; source_environment_id:string; base_baseline_id:string; scope_object_id:string;
  code:string; name:string; description:string|null; version:string; status:ConfigurationChangeSet['status'];
  checksum:string|null; created_by_person_id:string; change_set_created_at:Date; frozen_by_person_id:string|null;
  frozen_at:Date|null; approved_decision_id:string|null; approved_at:Date|null; row_version:number;
}
interface ChangeItemRow extends RowDataPacket {
  id:string; tenant_id:string; change_set_id:string; sequence:number; operation:ConfigurationChangeItem['operation'];
  object_family:string; object_reference:string; before_hash:string|null; after_hash:string|null;
  definition:string|Record<string,unknown>; dependencies:string|string[]|null;
}
interface RunRow extends RowDataPacket {
  id:string; tenant_id:string; change_set_id:string; source_environment_id:string; target_environment_id:string;
  source_baseline_id:string; expected_target_baseline_id:string; resulting_target_baseline_id:string|null;
  run_reference:string; mapping_definition:string|Record<string,unknown>; mapping_checksum:string;
  rollback_definition:string|Record<string,unknown>; rollback_checksum:string; requested_by_person_id:string;
  requested_at:Date; status:ConfigurationPromotionRun['status']; started_at:Date|null; completed_at:Date|null;
  row_version:number;
}
interface ResultRow extends RowDataPacket {
  id:string; tenant_id:string; promotion_run_id:string; change_item_id:string;
  outcome:ConfigurationPromotionItemResult['outcome']; target_hash:string|null; message:string|null;
  recorded_by_person_id:string; recorded_at:Date;
}
interface ConflictRow extends RowDataPacket {
  id:string; tenant_id:string; promotion_run_id:string; item_result_id:string|null;
  conflict_type:ConfigurationPromotionConflict['conflictType']; severity:ConfigurationPromotionConflict['severity'];
  code:string; description:string; status:ConfigurationPromotionConflict['status']; detected_at:Date; resolved_at:Date|null;
  row_version:number;
}
interface DecisionRow extends RowDataPacket {
  id:string; tenant_id:string; decision_type:string; subject_object_id:string; subject_version:string|null;
  outcome:string; reason:string; decider_person_id:string; authority_grant_id:string|null; decided_at:Date;
}
interface PersonRow extends RowDataPacket {
  id:string; tenant_id:string; party_id:string; legal_name:string; preferred_name:string|null; status:Person['status'];
}
interface CanonicalObjectRow extends RowDataPacket {
  id:string; tenant_id:string; object_type:string; stable_key:string; created_at:Date;
}

function objectJson(v:unknown):Readonly<Record<string,unknown>>{
  const p=typeof v==='string'?JSON.parse(v):v;
  return typeof p==='object'&&p!==null&&!Array.isArray(p)?p as Readonly<Record<string,unknown>>:{};
}
function stringArray(v:unknown):readonly string[]|undefined{
  if(v===null||v===undefined)return undefined;
  const p=typeof v==='string'?JSON.parse(v):v;
  return Array.isArray(p)?p.map(String):undefined;
}
function stable(v:unknown):unknown{
  if(Array.isArray(v))return v.map(stable);
  if(typeof v==='object'&&v!==null){
    const o=v as Record<string,unknown>;
    return Object.fromEntries(Object.keys(o).sort().map(k=>[k,stable(o[k])]));
  }
  return v;
}
function hash(v:unknown):string{
  return 'sha256:'+createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');
}
const mapEnvironment=(r:EnvironmentRow):ConfigurationEnvironment=>({
  id:r.id as ConfigurationEnvironment['id'],tenantId:r.tenant_id as TenantId,code:r.code,name:r.name,
  environmentType:r.environment_type,platformVersion:r.platform_version,environmentReference:r.environment_reference,status:r.status
});
const mapBaseline=(r:BaselineRow):ConfigurationBaseline=>({
  id:r.id as ConfigurationBaseline['id'],tenantId:r.tenant_id as TenantId,environmentId:r.environment_id as ConfigurationBaseline['environmentId'],
  baselineReference:r.baseline_reference,platformVersion:r.platform_version,status:r.status,...(r.checksum?{checksum:r.checksum}:{}),
  createdByPersonId:r.created_by_person_id as ConfigurationBaseline['createdByPersonId'],createdAt:r.baseline_created_at.toISOString(),
  ...(r.frozen_by_person_id?{frozenByPersonId:r.frozen_by_person_id as NonNullable<ConfigurationBaseline['frozenByPersonId']>}:{}),
  ...(r.frozen_at?{frozenAt:r.frozen_at.toISOString()}:{})
});
const mapBaselineItem=(r:BaselineItemRow):ConfigurationBaselineItem=>({
  id:r.id as ConfigurationBaselineItem['id'],tenantId:r.tenant_id as TenantId,baselineId:r.baseline_id as ConfigurationBaselineItem['baselineId'],
  sequence:Number(r.sequence),objectFamily:r.object_family,objectReference:r.object_reference,...(r.object_version?{objectVersion:r.object_version}:{}),
  contentHash:r.content_hash,snapshot:objectJson(r.snapshot)
});
const mapChangeSet=(r:ChangeSetRow):ConfigurationChangeSet=>({
  id:r.id as ConfigurationChangeSet['id'],tenantId:r.tenant_id as TenantId,sourceEnvironmentId:r.source_environment_id as ConfigurationChangeSet['sourceEnvironmentId'],
  baseBaselineId:r.base_baseline_id as ConfigurationChangeSet['baseBaselineId'],scopeObjectId:r.scope_object_id,code:r.code,name:r.name,
  ...(r.description?{description:r.description}:{}),version:r.version,status:r.status,...(r.checksum?{checksum:r.checksum}:{}),
  createdByPersonId:r.created_by_person_id as ConfigurationChangeSet['createdByPersonId'],createdAt:r.change_set_created_at.toISOString(),
  ...(r.frozen_by_person_id?{frozenByPersonId:r.frozen_by_person_id as NonNullable<ConfigurationChangeSet['frozenByPersonId']>}:{}),
  ...(r.frozen_at?{frozenAt:r.frozen_at.toISOString()}:{}),
  ...(r.approved_decision_id?{approvedDecisionId:r.approved_decision_id as NonNullable<ConfigurationChangeSet['approvedDecisionId']>}:{}),
  ...(r.approved_at?{approvedAt:r.approved_at.toISOString()}:{})
});
const mapChangeItem=(r:ChangeItemRow):ConfigurationChangeItem=>({
  id:r.id as ConfigurationChangeItem['id'],tenantId:r.tenant_id as TenantId,changeSetId:r.change_set_id as ConfigurationChangeItem['changeSetId'],
  sequence:Number(r.sequence),operation:r.operation,objectFamily:r.object_family,objectReference:r.object_reference,
  ...(r.before_hash?{beforeHash:r.before_hash}:{}),...(r.after_hash?{afterHash:r.after_hash}:{}),definition:objectJson(r.definition),
  ...(stringArray(r.dependencies)?{dependencies:stringArray(r.dependencies)!}:{})
});
const mapRun=(r:RunRow):ConfigurationPromotionRun=>({
  id:r.id as ConfigurationPromotionRun['id'],tenantId:r.tenant_id as TenantId,changeSetId:r.change_set_id as ConfigurationPromotionRun['changeSetId'],
  sourceEnvironmentId:r.source_environment_id as ConfigurationPromotionRun['sourceEnvironmentId'],targetEnvironmentId:r.target_environment_id as ConfigurationPromotionRun['targetEnvironmentId'],
  sourceBaselineId:r.source_baseline_id as ConfigurationPromotionRun['sourceBaselineId'],expectedTargetBaselineId:r.expected_target_baseline_id as ConfigurationPromotionRun['expectedTargetBaselineId'],
  ...(r.resulting_target_baseline_id?{resultingTargetBaselineId:r.resulting_target_baseline_id as NonNullable<ConfigurationPromotionRun['resultingTargetBaselineId']>}:{}),
  runReference:r.run_reference,mappingDefinition:objectJson(r.mapping_definition),mappingChecksum:r.mapping_checksum,
  rollbackDefinition:objectJson(r.rollback_definition),rollbackChecksum:r.rollback_checksum,
  requestedByPersonId:r.requested_by_person_id as ConfigurationPromotionRun['requestedByPersonId'],requestedAt:r.requested_at.toISOString(),status:r.status,
  ...(r.started_at?{startedAt:r.started_at.toISOString()}:{}),...(r.completed_at?{completedAt:r.completed_at.toISOString()}:{})
});
const mapResult=(r:ResultRow):ConfigurationPromotionItemResult=>({
  id:r.id as ConfigurationPromotionItemResult['id'],tenantId:r.tenant_id as TenantId,promotionRunId:r.promotion_run_id as ConfigurationPromotionItemResult['promotionRunId'],
  changeItemId:r.change_item_id as ConfigurationPromotionItemResult['changeItemId'],outcome:r.outcome,...(r.target_hash?{targetHash:r.target_hash}:{}),
  ...(r.message?{message:r.message}:{}),recordedByPersonId:r.recorded_by_person_id as ConfigurationPromotionItemResult['recordedByPersonId'],recordedAt:r.recorded_at.toISOString()
});
const mapConflict=(r:ConflictRow):ConfigurationPromotionConflict=>({
  id:r.id as ConfigurationPromotionConflict['id'],tenantId:r.tenant_id as TenantId,promotionRunId:r.promotion_run_id as ConfigurationPromotionConflict['promotionRunId'],
  ...(r.item_result_id?{itemResultId:r.item_result_id as NonNullable<ConfigurationPromotionConflict['itemResultId']>}:{}),conflictType:r.conflict_type,
  severity:r.severity,code:r.code,description:r.description,status:r.status,detectedAt:r.detected_at.toISOString(),...(r.resolved_at?{resolvedAt:r.resolved_at.toISOString()}:{})
});
const mapDecision=(r:DecisionRow):Decision=>({
  id:r.id as Decision['id'],tenantId:r.tenant_id as TenantId,decisionType:r.decision_type,subjectObjectId:r.subject_object_id as Decision['subjectObjectId'],
  ...(r.subject_version?{subjectVersion:r.subject_version}:{}),outcome:r.outcome,reason:r.reason,deciderPersonId:r.decider_person_id as Decision['deciderPersonId'],
  ...(r.authority_grant_id?{authorityGrantId:r.authority_grant_id as NonNullable<Decision['authorityGrantId']>}:{}),decidedAt:r.decided_at.toISOString()
});
const mapPerson=(r:PersonRow):Person=>({
  id:r.id as Person['id'],tenantId:r.tenant_id as TenantId,partyId:r.party_id as Person['partyId'],legalName:r.legal_name,
  ...(r.preferred_name?{preferredName:r.preferred_name}:{}),status:r.status
});
const mapCanonicalObject=(r:CanonicalObjectRow):CanonicalObjectIdentity=>({
  id:r.id as CanonicalObjectIdentity['id'],tenantId:r.tenant_id as TenantId,objectType:r.object_type,stableKey:r.stable_key,createdAt:r.created_at.toISOString()
});

async function evidence(c:PoolConnection,t:TenantId,type:string,id:string,action:string,audit:AuditContext,payload:unknown){
  await c.execute('INSERT INTO kernel_audit_entries (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [t,type,id,action,audit.actorPersonId??null,audit.correlationId??null,JSON.stringify(payload)]);
  await writeOutboxEvent(c,{tenantId:t,aggregateType:type,aggregateId:id,eventType:type+'.'+action,payload});
}

export class MySqlConfigurationPromotionRepository {
  constructor(private readonly pool:Pool){}

  async createEnvironment(input:ConfigurationEnvironment,audit:AuditContext={}){
    createConfigurationEnvironment(input);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_environments (id,tenant_id,code,name,environment_type,platform_version,environment_reference,status,created_by_person_id,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.code,input.name,input.environmentType,input.platformVersion,input.environmentReference,input.status,audit.actorPersonId??null,audit.actorPersonId??null]);
      await evidence(c,input.tenantId,'CONFIGURATION_ENVIRONMENT',input.id,'CREATED',audit,input);
    });
  }

  async createBaseline(input:ConfigurationBaseline,audit:AuditContext={}){
    const [environment,creator]=await Promise.all([this.requireEnvironment(input.tenantId,input.environmentId),this.requirePerson(input.tenantId,input.createdByPersonId)]);
    createConfigurationBaseline(input,environment,creator);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_baselines (id,tenant_id,environment_id,baseline_reference,platform_version,status,checksum,created_by_person_id,baseline_created_at,frozen_by_person_id,frozen_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.environmentId,input.baselineReference,input.platformVersion,input.status,null,input.createdByPersonId,new Date(input.createdAt),null,null,audit.actorPersonId??null]);
      await evidence(c,input.tenantId,'CONFIGURATION_BASELINE',input.id,'CREATED',audit,input);
    });
  }

  async addBaselineItem(input:ConfigurationBaselineItem,audit:AuditContext={}){
    const baseline=await this.requireBaseline(input.tenantId,input.baselineId);
    createConfigurationBaselineItem(input,baseline);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_baseline_items (id,tenant_id,baseline_id,sequence,object_family,object_reference,object_version,content_hash,snapshot) VALUES (?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.baselineId,input.sequence,input.objectFamily,input.objectReference,input.objectVersion??null,input.contentHash,JSON.stringify(input.snapshot)]);
      await evidence(c,input.tenantId,'CONFIGURATION_BASELINE_ITEM',input.id,'CREATED',audit,input);
    });
  }

  async freezeBaseline(t:TenantId,id:ConfigurationBaseline['id'],freezerId:Person['id'],frozenAt:string,audit:AuditContext={}):Promise<ConfigurationBaseline>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<BaselineRow[]>('SELECT * FROM configuration_baselines WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Configuration Baseline not found in tenant.');
      const current=mapBaseline(rows[0]);
      const [itemRows,personRows]=await Promise.all([
        c.execute<BaselineItemRow[]>('SELECT * FROM configuration_baseline_items WHERE tenant_id=? AND baseline_id=? ORDER BY sequence,id',[t,id]),
        c.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,freezerId])
      ]);
      const items=itemRows[0].map(mapBaselineItem);if(!personRows[0][0])throw new Error('Person not found in tenant.');
      const checksum=hash({environmentId:current.environmentId,platformVersion:current.platformVersion,items:items.map(i=>({sequence:i.sequence,objectFamily:i.objectFamily,objectReference:i.objectReference,objectVersion:i.objectVersion,contentHash:i.contentHash,snapshot:i.snapshot}))});
      const next=freezeConfigurationBaseline(current,items,checksum,mapPerson(personRows[0][0]),frozenAt);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_baselines SET status=?,checksum=?,frozen_by_person_id=?,frozen_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.checksum!,next.frozenByPersonId!,new Date(frozenAt),audit.actorPersonId??null,t,id,rows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Baseline freeze detected.');
      await evidence(c,t,'CONFIGURATION_BASELINE',id,'FROZEN',audit,next);return next;
    });
  }

  async createChangeSet(input:ConfigurationChangeSet,audit:AuditContext={}){
    const [environment,baseline,scope,creator]=await Promise.all([
      this.requireEnvironment(input.tenantId,input.sourceEnvironmentId),this.requireBaseline(input.tenantId,input.baseBaselineId),
      this.requireCanonicalObject(input.tenantId,input.scopeObjectId),this.requirePerson(input.tenantId,input.createdByPersonId)
    ]);
    createConfigurationChangeSet(input,environment,baseline,scope,creator);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_change_sets (id,tenant_id,source_environment_id,base_baseline_id,scope_object_id,code,name,description,version,status,checksum,created_by_person_id,change_set_created_at,frozen_by_person_id,frozen_at,approved_decision_id,approved_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.sourceEnvironmentId,input.baseBaselineId,input.scopeObjectId,input.code,input.name,input.description??null,input.version,input.status,null,input.createdByPersonId,new Date(input.createdAt),null,null,null,null,audit.actorPersonId??null]);
      await evidence(c,input.tenantId,'CONFIGURATION_CHANGE_SET',input.id,'CREATED',audit,input);
    });
  }

  async addChangeItem(input:ConfigurationChangeItem,audit:AuditContext={}){
    const set=await this.requireChangeSet(input.tenantId,input.changeSetId);
    createConfigurationChangeItem(input,set);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_change_items (id,tenant_id,change_set_id,sequence,operation,object_family,object_reference,before_hash,after_hash,definition,dependencies) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.changeSetId,input.sequence,input.operation,input.objectFamily,input.objectReference,input.beforeHash??null,input.afterHash??null,JSON.stringify(input.definition),input.dependencies?JSON.stringify(input.dependencies):null]);
      await evidence(c,input.tenantId,'CONFIGURATION_CHANGE_ITEM',input.id,'CREATED',audit,input);
    });
  }

  async freezeChangeSet(t:TenantId,id:ConfigurationChangeSet['id'],freezerId:Person['id'],frozenAt:string,audit:AuditContext={}):Promise<ConfigurationChangeSet>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<ChangeSetRow[]>('SELECT * FROM configuration_change_sets WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Configuration Change Set not found in tenant.');
      const current=mapChangeSet(rows[0]);
      const [itemRows,personRows]=await Promise.all([
        c.execute<ChangeItemRow[]>('SELECT * FROM configuration_change_items WHERE tenant_id=? AND change_set_id=? ORDER BY sequence,id',[t,id]),
        c.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,freezerId])
      ]);
      const items=itemRows[0].map(mapChangeItem);if(!personRows[0][0])throw new Error('Person not found in tenant.');
      const checksum=hash({sourceEnvironmentId:current.sourceEnvironmentId,baseBaselineId:current.baseBaselineId,scopeObjectId:current.scopeObjectId,code:current.code,version:current.version,items:items.map(i=>({sequence:i.sequence,operation:i.operation,objectFamily:i.objectFamily,objectReference:i.objectReference,beforeHash:i.beforeHash,afterHash:i.afterHash,definition:i.definition,dependencies:i.dependencies}))});
      const next=freezeConfigurationChangeSet(current,items,checksum,mapPerson(personRows[0][0]),frozenAt);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_change_sets SET status=?,checksum=?,frozen_by_person_id=?,frozen_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.checksum,next.frozenByPersonId,new Date(frozenAt),audit.actorPersonId??null,t,id,rows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Change Set freeze detected.');
      await evidence(c,t,'CONFIGURATION_CHANGE_SET',id,'FROZEN',audit,next);return next;
    });
  }

  async approveChangeSet(t:TenantId,id:ConfigurationChangeSet['id'],decisionId:Decision['id'],approvedAt:string,audit:AuditContext={}):Promise<ConfigurationChangeSet>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<ChangeSetRow[]>('SELECT * FROM configuration_change_sets WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Configuration Change Set not found in tenant.');
      const decision=await this.requireDecision(t,decisionId,c);
      const next=approveConfigurationChangeSet(mapChangeSet(rows[0]),decision,approvedAt);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_change_sets SET status=?,approved_decision_id=?,approved_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.approvedDecisionId!,new Date(approvedAt),audit.actorPersonId??null,t,id,rows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Change Set approval detected.');
      await evidence(c,t,'CONFIGURATION_CHANGE_SET',id,'APPROVED',audit,next);return next;
    });
  }

  async createPromotionRun(input:ConfigurationPromotionRun,audit:AuditContext={}){
    const [set,source,target,sourceBaseline,targetBaseline,requester,latestTargetBaseline]=await Promise.all([
      this.requireChangeSet(input.tenantId,input.changeSetId),this.requireEnvironment(input.tenantId,input.sourceEnvironmentId),
      this.requireEnvironment(input.tenantId,input.targetEnvironmentId),this.requireBaseline(input.tenantId,input.sourceBaselineId),
      this.requireBaseline(input.tenantId,input.expectedTargetBaselineId),this.requirePerson(input.tenantId,input.requestedByPersonId),
      this.requireLatestFrozenBaseline(input.tenantId,input.targetEnvironmentId)
    ]);
    if (targetBaseline.id !== latestTargetBaseline.id) {
      throw new Error('Expected target Baseline is stale; refresh target configuration before promotion.');
    }
    createConfigurationPromotionRun(input,set,source,target,sourceBaseline,targetBaseline,requester);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_promotion_runs (id,tenant_id,change_set_id,source_environment_id,target_environment_id,source_baseline_id,expected_target_baseline_id,resulting_target_baseline_id,run_reference,mapping_definition,mapping_checksum,rollback_definition,rollback_checksum,requested_by_person_id,requested_at,status,started_at,completed_at,active_target_guard_key,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.changeSetId,input.sourceEnvironmentId,input.targetEnvironmentId,input.sourceBaselineId,input.expectedTargetBaselineId,null,input.runReference,JSON.stringify(input.mappingDefinition),input.mappingChecksum,JSON.stringify(input.rollbackDefinition),input.rollbackChecksum,input.requestedByPersonId,new Date(input.requestedAt),input.status,null,null,input.targetEnvironmentId,audit.actorPersonId??null]);
      await evidence(c,input.tenantId,'CONFIGURATION_PROMOTION_RUN',input.id,'QUEUED',audit,input);
    });
  }

  async startPromotionRun(t:TenantId,id:ConfigurationPromotionRun['id'],startedAt:string,audit:AuditContext={}):Promise<ConfigurationPromotionRun>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<RunRow[]>('SELECT * FROM configuration_promotion_runs WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!rows[0])throw new Error('Configuration Promotion Run not found in tenant.');
      const current=mapRun(rows[0]);
      const latestTargetBaseline=await this.requireLatestFrozenBaseline(t,current.targetEnvironmentId,c);
      if (latestTargetBaseline.id !== current.expectedTargetBaselineId) {
        throw new Error('Target configuration drift detected before promotion start.');
      }
      const next=startConfigurationPromotionRun(current,startedAt);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_promotion_runs SET status=?,started_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,new Date(startedAt),audit.actorPersonId??null,t,id,rows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Promotion start detected.');
      await evidence(c,t,'CONFIGURATION_PROMOTION_RUN',id,'STARTED',audit,next);return next;
    });
  }

  async recordItemResult(input:ConfigurationPromotionItemResult,audit:AuditContext={}){
    const [run,item,recorder]=await Promise.all([
      this.requireRun(input.tenantId,input.promotionRunId),this.requireChangeItem(input.tenantId,input.changeItemId),this.requirePerson(input.tenantId,input.recordedByPersonId)
    ]);
    createConfigurationPromotionItemResult(input,run,item,recorder);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_promotion_item_results (id,tenant_id,promotion_run_id,change_item_id,outcome,target_hash,message,recorded_by_person_id,recorded_at) VALUES (?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.promotionRunId,input.changeItemId,input.outcome,input.targetHash??null,input.message??null,input.recordedByPersonId,new Date(input.recordedAt)]);
      await evidence(c,input.tenantId,'CONFIGURATION_PROMOTION_ITEM_RESULT',input.id,input.outcome,audit,input);
    });
  }

  async createConflict(input:ConfigurationPromotionConflict,audit:AuditContext={}){
    const [run,result]=await Promise.all([
      this.requireRun(input.tenantId,input.promotionRunId),
      input.itemResultId?this.requireResult(input.tenantId,input.itemResultId):Promise.resolve(undefined)
    ]);
    createConfigurationPromotionConflict(input,run,result);
    await withTransaction(this.pool,async c=>{
      await c.execute('INSERT INTO configuration_promotion_conflicts (id,tenant_id,promotion_run_id,item_result_id,conflict_type,severity,code,description,status,detected_at,resolved_at,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.promotionRunId,input.itemResultId??null,input.conflictType,input.severity,input.code,input.description,input.status,new Date(input.detectedAt),null,audit.actorPersonId??null]);
      await evidence(c,input.tenantId,'CONFIGURATION_PROMOTION_CONFLICT',input.id,'OPENED',audit,input);
    });
  }

  async dispositionConflict(input:ConfigurationPromotionConflictDisposition,audit:AuditContext={}):Promise<ConfigurationPromotionConflict>{
    return withTransaction(this.pool,async c=>{
      const [rows]=await c.execute<ConflictRow[]>('SELECT * FROM configuration_promotion_conflicts WHERE tenant_id=? AND id=? FOR UPDATE',[input.tenantId,input.conflictId]);
      if(!rows[0])throw new Error('Configuration Promotion Conflict not found in tenant.');
      const [decision,disposer]=await Promise.all([this.requireDecision(input.tenantId,input.decisionId,c),this.requirePerson(input.tenantId,input.disposedByPersonId,c)]);
      const conflict=mapConflict(rows[0]);createConfigurationPromotionConflictDisposition(input,conflict,decision,disposer);
      const next=applyConfigurationPromotionConflictDisposition(conflict,input);
      await c.execute('INSERT INTO configuration_promotion_conflict_dispositions (id,tenant_id,conflict_id,disposition,rationale,decision_id,disposed_by_person_id,disposed_at) VALUES (?,?,?,?,?,?,?,?)',
        [input.id,input.tenantId,input.conflictId,input.disposition,input.rationale,input.decisionId,input.disposedByPersonId,new Date(input.disposedAt)]);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_promotion_conflicts SET status=?,resolved_at=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,new Date(input.disposedAt),audit.actorPersonId??null,input.tenantId,input.conflictId,rows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Promotion Conflict disposition detected.');
      await evidence(c,input.tenantId,'CONFIGURATION_PROMOTION_CONFLICT_DISPOSITION',input.id,input.disposition,audit,input);
      return next;
    });
  }

  async completePromotionRun(t:TenantId,id:ConfigurationPromotionRun['id'],resultingBaselineId:ConfigurationBaseline['id']|undefined,completedAt:string,audit:AuditContext={}):Promise<ConfigurationPromotionRun>{
    return withTransaction(this.pool,async c=>{
      const [runRows]=await c.execute<RunRow[]>('SELECT * FROM configuration_promotion_runs WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);
      if(!runRows[0])throw new Error('Configuration Promotion Run not found in tenant.');
      const current=mapRun(runRows[0]);
      const [itemRows,resultRows,conflictRows,resultingBaseline]=await Promise.all([
        c.execute<ChangeItemRow[]>('SELECT ci.* FROM configuration_change_items ci WHERE ci.tenant_id=? AND ci.change_set_id=? ORDER BY ci.sequence,ci.id',[t,current.changeSetId]),
        c.execute<ResultRow[]>('SELECT * FROM configuration_promotion_item_results WHERE tenant_id=? AND promotion_run_id=? ORDER BY recorded_at,id',[t,id]),
        c.execute<ConflictRow[]>('SELECT * FROM configuration_promotion_conflicts WHERE tenant_id=? AND promotion_run_id=? ORDER BY detected_at,id',[t,id]),
        resultingBaselineId?this.requireBaseline(t,resultingBaselineId,c):Promise.resolve(undefined)
      ]);
      if (resultingBaseline && current.startedAt) {
        const [driftRows]=await c.execute<RowDataPacket[]>(
          'SELECT id FROM configuration_baselines WHERE tenant_id=? AND environment_id=? AND status IN (\'FROZEN\',\'SUPERSEDED\') AND frozen_at>? AND id<>? LIMIT 1',
          [t,current.targetEnvironmentId,new Date(current.startedAt),resultingBaseline.id]
        );
        if (driftRows.length>0) {
          throw new Error('Target configuration drift detected during promotion execution.');
        }
      }
      const next=completeConfigurationPromotionRun(current,itemRows[0].map(mapChangeItem),resultRows[0].map(mapResult),conflictRows[0].map(mapConflict),resultingBaseline,completedAt);
      const [u]=await c.execute<ResultSetHeader>('UPDATE configuration_promotion_runs SET status=?,resulting_target_baseline_id=?,completed_at=?,active_target_guard_key=NULL,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',
        [next.status,next.resultingTargetBaselineId??null,new Date(completedAt),audit.actorPersonId??null,t,id,runRows[0].row_version]);
      if(u.affectedRows!==1)throw new Error('Concurrent Configuration Promotion completion detected.');
      await evidence(c,t,'CONFIGURATION_PROMOTION_RUN',id,next.status,audit,next);return next;
    });
  }

  async listEnvironments(t:TenantId){const [r]=await this.pool.execute<EnvironmentRow[]>('SELECT * FROM configuration_environments WHERE tenant_id=? ORDER BY environment_type,code',[t]);return r.map(mapEnvironment);}
  async listBaselines(t:TenantId){const [r]=await this.pool.execute<BaselineRow[]>('SELECT * FROM configuration_baselines WHERE tenant_id=? ORDER BY baseline_created_at DESC,id',[t]);return r.map(mapBaseline);}
  async listBaselineItems(t:TenantId){const [r]=await this.pool.execute<BaselineItemRow[]>('SELECT * FROM configuration_baseline_items WHERE tenant_id=? ORDER BY baseline_id,sequence',[t]);return r.map(mapBaselineItem);}
  async listChangeSets(t:TenantId){const [r]=await this.pool.execute<ChangeSetRow[]>('SELECT * FROM configuration_change_sets WHERE tenant_id=? ORDER BY change_set_created_at DESC,id',[t]);return r.map(mapChangeSet);}
  async listChangeItems(t:TenantId){const [r]=await this.pool.execute<ChangeItemRow[]>('SELECT * FROM configuration_change_items WHERE tenant_id=? ORDER BY change_set_id,sequence',[t]);return r.map(mapChangeItem);}
  async listRuns(t:TenantId){const [r]=await this.pool.execute<RunRow[]>('SELECT * FROM configuration_promotion_runs WHERE tenant_id=? ORDER BY requested_at DESC,id',[t]);return r.map(mapRun);}
  async listResults(t:TenantId){const [r]=await this.pool.execute<ResultRow[]>('SELECT * FROM configuration_promotion_item_results WHERE tenant_id=? ORDER BY recorded_at,id',[t]);return r.map(mapResult);}
  async listConflicts(t:TenantId){const [r]=await this.pool.execute<ConflictRow[]>('SELECT * FROM configuration_promotion_conflicts WHERE tenant_id=? ORDER BY detected_at,id',[t]);return r.map(mapConflict);}
  async getBaseline(t:TenantId,id:ConfigurationBaseline['id']){return this.requireBaseline(t,id).catch(()=>undefined);}
  async getChangeSet(t:TenantId,id:ConfigurationChangeSet['id']){return this.requireChangeSet(t,id).catch(()=>undefined);}

  private async requireLatestFrozenBaseline(t:TenantId,environmentId:ConfigurationEnvironment['id'],c?:PoolConnection){
    const q=c??this.pool;
    const [r]=await q.execute<BaselineRow[]>(
      'SELECT * FROM configuration_baselines WHERE tenant_id=? AND environment_id=? AND status IN (\'FROZEN\',\'SUPERSEDED\') ORDER BY frozen_at DESC,id DESC LIMIT 1',
      [t,environmentId]
    );
    if(!r[0])throw new Error('Target Environment has no frozen Configuration Baseline.');
    return mapBaseline(r[0]);
  }
  private async requireEnvironment(t:TenantId,id:ConfigurationEnvironment['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<EnvironmentRow[]>('SELECT * FROM configuration_environments WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Environment not found in tenant.');return mapEnvironment(r[0]);}
  private async requireBaseline(t:TenantId,id:ConfigurationBaseline['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<BaselineRow[]>('SELECT * FROM configuration_baselines WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Baseline not found in tenant.');return mapBaseline(r[0]);}
  private async requireChangeSet(t:TenantId,id:ConfigurationChangeSet['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ChangeSetRow[]>('SELECT * FROM configuration_change_sets WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Change Set not found in tenant.');return mapChangeSet(r[0]);}
  private async requireChangeItem(t:TenantId,id:ConfigurationChangeItem['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ChangeItemRow[]>('SELECT * FROM configuration_change_items WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Change Item not found in tenant.');return mapChangeItem(r[0]);}
  private async requireRun(t:TenantId,id:ConfigurationPromotionRun['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<RunRow[]>('SELECT * FROM configuration_promotion_runs WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Promotion Run not found in tenant.');return mapRun(r[0]);}
  private async requireResult(t:TenantId,id:ConfigurationPromotionItemResult['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<ResultRow[]>('SELECT * FROM configuration_promotion_item_results WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Configuration Promotion Item Result not found in tenant.');return mapResult(r[0]);}
  private async requireDecision(t:TenantId,id:Decision['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<DecisionRow[]>('SELECT * FROM decisions WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Decision not found in tenant.');return mapDecision(r[0]);}
  private async requirePerson(t:TenantId,id:Person['id'],c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Person not found in tenant.');return mapPerson(r[0]);}
  private async requireCanonicalObject(t:TenantId,id:string,c?:PoolConnection){const q=c??this.pool;const [r]=await q.execute<CanonicalObjectRow[]>('SELECT id,tenant_id,object_type,stable_key,created_at FROM canonical_objects WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Canonical scope object not found in tenant.');return mapCanonicalObject(r[0]);}
}

export function configurationEvidenceHash(value:unknown):string{return hash(value);}
