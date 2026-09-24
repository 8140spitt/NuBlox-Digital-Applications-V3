import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type DestructionContentOutcome,
  type DestructionMetadataOutcome,
  type DispositionAction,
  type DispositionItemOutcome,
  type HoldType,
  type RetentionTriggerType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import {
  MySqlRecordsRetentionRepository,
  retentionEvidenceHash
} from './records-retention-repository.js';

export class RecordsRetentionCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ){
    super(message);
    this.name='RecordsRetentionCommandError';
  }
}

function required(value:string|undefined,label:string){
  const v=value?.trim()??'';
  if(!v)throw new RecordsRetentionCommandError(label+' is required.','INVALID_INPUT');
  return v;
}
function optional(value:string|undefined){
  const v=value?.trim()??'';
  return v||undefined;
}
function positiveInt(value:number,label:string,allowZero=false){
  if(!Number.isInteger(value)||(allowZero?value<0:value<1)){
    throw new RecordsRetentionCommandError(
      label+(allowZero?' must be zero or greater.':' must be a positive integer.'),
      'INVALID_INPUT'
    );
  }
  return value;
}
function at(value?:string){
  const d=new Date(value??new Date().toISOString());
  if(Number.isNaN(d.getTime()))throw new RecordsRetentionCommandError('Date/time is invalid.','INVALID_INPUT');
  return d.toISOString();
}
function mapError(error:unknown):never{
  if(error instanceof RecordsRetentionCommandError)throw error;
  if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY'){
    throw new RecordsRetentionCommandError(
      'Equivalent retention evidence already exists or an active policy/run/hold conflicts with this operation.',
      'CONFLICT'
    );
  }
  if(error instanceof Error){
    if(/not found/i.test(error.message)){
      throw new RecordsRetentionCommandError(error.message,'NOT_FOUND');
    }
    if(/must|required|invalid|only|requires|belong|match|cannot|blocks|active|duplicate|already exists/i.test(error.message)){
      throw new RecordsRetentionCommandError(error.message,'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlRecordsRetentionCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlRecordsRetentionRepository;

  constructor(pool:Pool){
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlRecordsRetentionRepository(pool);
  }

  async createPolicy(
    tenantId:TenantId,
    actor:string,
    input:{
      scopeObjectId:string;
      code:string;
      name:string;
      description?:string;
      version:number;
      createdAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE);
    const description=optional(input.description);
    const policy={
      id:asId<'RetentionPolicyId'>('RET-POL-'+randomUUID(),'Retention Policy'),
      tenantId,
      scopeObjectId:asId<'CanonicalObjectId'>(required(input.scopeObjectId,'Scope object'),'Scope object'),
      code:required(input.code,'Code').toUpperCase(),
      name:required(input.name,'Name'),
      ...(description?{description}:{}),
      version:positiveInt(input.version,'Version'),
      status:'DRAFT' as const,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt:at(input.createdAt)
    };
    try{
      await this.repo.createPolicy(policy,this.audit(actor));
      return policy;
    }catch(error){
      return mapError(error);
    }
  }

  async addRule(
    tenantId:TenantId,
    actor:string,
    input:{
      retentionPolicyId:string;
      code:string;
      name:string;
      objectFamily:string;
      triggerType:RetentionTriggerType;
      triggerField?:string;
      retentionPeriodDays:number;
      selectionCriteria:Readonly<Record<string,unknown>>;
      dispositionAction:DispositionAction;
      enabled:boolean;
      sequence:number;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE);
    const triggerField=optional(input.triggerField);
    const rule={
      id:asId<'RetentionRuleId'>('RET-RULE-'+randomUUID(),'Retention Rule'),
      tenantId,
      retentionPolicyId:asId<'RetentionPolicyId'>(required(input.retentionPolicyId,'Retention Policy'),'Retention Policy'),
      code:required(input.code,'Code').toUpperCase(),
      name:required(input.name,'Name'),
      objectFamily:required(input.objectFamily,'Object family'),
      triggerType:input.triggerType,
      ...(triggerField?{triggerField}:{}),
      retentionPeriodDays:positiveInt(input.retentionPeriodDays,'Retention period days',true),
      selectionCriteria:input.selectionCriteria,
      dispositionAction:input.dispositionAction,
      enabled:input.enabled,
      sequence:positiveInt(input.sequence,'Sequence')
    };
    try{
      await this.repo.addRule(rule,this.audit(actor));
      return rule;
    }catch(error){
      return mapError(error);
    }
  }

  async freezePolicy(
    tenantId:TenantId,
    actor:string,
    policyId:string,
    frozenAt?:string
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE);
    try{
      return await this.repo.freezePolicy(
        tenantId,
        asId<'RetentionPolicyId'>(required(policyId,'Retention Policy'),'Retention Policy'),
        asId<'PersonId'>(actor,'Freezer'),
        at(frozenAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async activatePolicy(
    tenantId:TenantId,
    actor:string,
    input:{policyId:string;decisionId:string;activatedAt?:string}
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE);
    try{
      return await this.repo.activatePolicy(
        tenantId,
        asId<'RetentionPolicyId'>(required(input.policyId,'Retention Policy'),'Retention Policy'),
        asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
        at(input.activatedAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async imposeHold(
    tenantId:TenantId,
    actor:string,
    input:{
      subjectObjectId:string;
      subjectVersion?:string;
      holdType:HoldType;
      reason:string;
      blocksArchive:boolean;
      blocksDestruction:boolean;
      imposedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_HOLD_MANAGE);
    const subjectVersion=optional(input.subjectVersion);
    const hold={
      id:asId<'HoldId'>('HOLD-'+randomUUID(),'Hold'),
      tenantId,
      subjectObjectId:asId<'CanonicalObjectId'>(required(input.subjectObjectId,'Subject object'),'Subject object'),
      ...(subjectVersion?{subjectVersion}:{}),
      holdType:input.holdType,
      reason:required(input.reason,'Reason'),
      blocksArchive:input.blocksArchive,
      blocksDestruction:input.blocksDestruction,
      status:'ACTIVE' as const,
      imposedByPersonId:asId<'PersonId'>(actor,'Imposer'),
      imposedAt:at(input.imposedAt)
    };
    try{
      await this.repo.createHold(hold,this.audit(actor));
      return hold;
    }catch(error){
      return mapError(error);
    }
  }

  async releaseHold(
    tenantId:TenantId,
    actor:string,
    input:{holdId:string;decisionId:string;releasedAt?:string}
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_HOLD_MANAGE);
    try{
      return await this.repo.releaseHold(
        tenantId,
        asId<'HoldId'>(required(input.holdId,'Hold'),'Hold'),
        asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
        asId<'PersonId'>(actor,'Releaser'),
        at(input.releasedAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async createSchedule(
    tenantId:TenantId,
    actor:string,
    input:{
      retentionRuleId:string;
      scheduleExpression:string;
      timezone:string;
      enabled:boolean;
      createdAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_MANAGE);
    const schedule={
      id:asId<'DispositionScheduleId'>('DISP-SCH-'+randomUUID(),'Disposition Schedule'),
      tenantId,
      retentionRuleId:asId<'RetentionRuleId'>(required(input.retentionRuleId,'Retention Rule'),'Retention Rule'),
      scheduleExpression:required(input.scheduleExpression,'Schedule expression'),
      timezone:required(input.timezone,'Timezone'),
      enabled:input.enabled,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),
      createdAt:at(input.createdAt)
    };
    try{
      await this.repo.createSchedule(schedule,this.audit(actor));
      return schedule;
    }catch(error){
      return mapError(error);
    }
  }

  async createRun(
    tenantId:TenantId,
    actor:string,
    input:{
      retentionRuleId:string;
      scheduleId?:string;
      runReference:string;
      selectionSnapshot:Readonly<Record<string,unknown>>;
      requestedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE);
    const scheduleId=optional(input.scheduleId);
    const selectionChecksum=retentionEvidenceHash(input.selectionSnapshot);
    const run={
      id:asId<'DispositionRunId'>('DISP-RUN-'+randomUUID(),'Disposition Run'),
      tenantId,
      retentionRuleId:asId<'RetentionRuleId'>(required(input.retentionRuleId,'Retention Rule'),'Retention Rule'),
      ...(scheduleId?{scheduleId:asId<'DispositionScheduleId'>(scheduleId,'Disposition Schedule')}:{}),
      runReference:required(input.runReference,'Run reference'),
      selectionSnapshot:input.selectionSnapshot,
      selectionChecksum,
      requestedByPersonId:asId<'PersonId'>(actor,'Requester'),
      requestedAt:at(input.requestedAt),
      status:'QUEUED' as const
    };
    try{
      await this.repo.createRun(run,this.audit(actor));
      return run;
    }catch(error){
      return mapError(error);
    }
  }

  async startRun(tenantId:TenantId,actor:string,runId:string,startedAt?:string){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE);
    try{
      return await this.repo.startRun(
        tenantId,
        asId<'DispositionRunId'>(required(runId,'Disposition Run'),'Disposition Run'),
        at(startedAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async createArchive(
    tenantId:TenantId,
    actor:string,
    input:{
      runId:string;
      subjectObjectId:string;
      subjectVersion?:string;
      archiveReference:string;
      integrityHash:string;
      archiveManifest:Readonly<Record<string,unknown>>;
      archivedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE);
    const subjectVersion=optional(input.subjectVersion);
    const archive={
      id:asId<'ArchiveRecordId'>('ARCH-'+randomUUID(),'Archive Record'),
      tenantId,
      dispositionRunId:asId<'DispositionRunId'>(required(input.runId,'Disposition Run'),'Disposition Run'),
      subjectObjectId:asId<'CanonicalObjectId'>(required(input.subjectObjectId,'Subject object'),'Subject object'),
      ...(subjectVersion?{subjectVersion}:{}),
      archiveReference:required(input.archiveReference,'Archive reference'),
      integrityHash:required(input.integrityHash,'Integrity hash'),
      archiveManifest:input.archiveManifest,
      status:'AVAILABLE' as const,
      archivedByPersonId:asId<'PersonId'>(actor,'Archiver'),
      archivedAt:at(input.archivedAt)
    };
    try{
      await this.repo.createArchive(archive,this.audit(actor));
      return archive;
    }catch(error){
      return mapError(error);
    }
  }

  async createDestruction(
    tenantId:TenantId,
    actor:string,
    input:{
      runId:string;
      subjectObjectId:string;
      subjectVersion?:string;
      archiveRecordId?:string;
      decisionId:string;
      method:string;
      metadataOutcome:DestructionMetadataOutcome;
      contentOutcome:DestructionContentOutcome;
      evidence:Readonly<Record<string,unknown>>;
      destroyedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_DESTROY);
    const subjectVersion=optional(input.subjectVersion);
    const archiveRecordId=optional(input.archiveRecordId);
    const destroyedAt=at(input.destroyedAt);
    const integrityHash=retentionEvidenceHash({
      subjectObjectId:input.subjectObjectId,
      subjectVersion,
      archiveRecordId,
      decisionId:input.decisionId,
      method:input.method,
      metadataOutcome:input.metadataOutcome,
      contentOutcome:input.contentOutcome,
      evidence:input.evidence,
      destroyedAt
    });
    const destruction={
      id:asId<'DestructionEvidenceId'>('DEST-'+randomUUID(),'Destruction Evidence'),
      tenantId,
      dispositionRunId:asId<'DispositionRunId'>(required(input.runId,'Disposition Run'),'Disposition Run'),
      subjectObjectId:asId<'CanonicalObjectId'>(required(input.subjectObjectId,'Subject object'),'Subject object'),
      ...(subjectVersion?{subjectVersion}:{}),
      ...(archiveRecordId?{archiveRecordId:asId<'ArchiveRecordId'>(archiveRecordId,'Archive Record')}:{}),
      destructionDecisionId:asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
      method:required(input.method,'Method'),
      metadataOutcome:input.metadataOutcome,
      contentOutcome:input.contentOutcome,
      integrityHash,
      destroyedByPersonId:asId<'PersonId'>(actor,'Destroyer'),
      destroyedAt,
      evidence:input.evidence
    };
    try{
      await this.repo.createDestruction(destruction,this.audit(actor));
      return destruction;
    }catch(error){
      return mapError(error);
    }
  }

  async recordItemResult(
    tenantId:TenantId,
    actor:string,
    input:{
      runId:string;
      subjectObjectId:string;
      subjectVersion?:string;
      outcome:DispositionItemOutcome;
      reason:string;
      holdId?:string;
      archiveRecordId?:string;
      destructionEvidenceId?:string;
      recordedAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE);
    const subjectVersion=optional(input.subjectVersion);
    const holdId=optional(input.holdId);
    const archiveRecordId=optional(input.archiveRecordId);
    const destructionEvidenceId=optional(input.destructionEvidenceId);
    const result={
      id:asId<'DispositionItemResultId'>('DISP-ITEM-'+randomUUID(),'Disposition Item Result'),
      tenantId,
      dispositionRunId:asId<'DispositionRunId'>(required(input.runId,'Disposition Run'),'Disposition Run'),
      subjectObjectId:asId<'CanonicalObjectId'>(required(input.subjectObjectId,'Subject object'),'Subject object'),
      ...(subjectVersion?{subjectVersion}:{}),
      outcome:input.outcome,
      reason:required(input.reason,'Reason'),
      ...(holdId?{holdId:asId<'HoldId'>(holdId,'Hold')}:{}),
      ...(archiveRecordId?{archiveRecordId:asId<'ArchiveRecordId'>(archiveRecordId,'Archive Record')}:{}),
      ...(destructionEvidenceId?{
        destructionEvidenceId:asId<'DestructionEvidenceId'>(destructionEvidenceId,'Destruction Evidence')
      }:{}),
      recordedByPersonId:asId<'PersonId'>(actor,'Recorder'),
      recordedAt:at(input.recordedAt)
    };
    try{
      await this.repo.recordItemResult(result,this.audit(actor));
      return result;
    }catch(error){
      return mapError(error);
    }
  }

  async completeRun(tenantId:TenantId,actor:string,runId:string,completedAt?:string){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_EXECUTE);
    try{
      return await this.repo.completeRun(
        tenantId,
        asId<'DispositionRunId'>(required(runId,'Disposition Run'),'Disposition Run'),
        at(completedAt),
        this.audit(actor)
      );
    }catch(error){
      return mapError(error);
    }
  }

  async createRestore(
    tenantId:TenantId,
    actor:string,
    input:{
      archiveRecordId:string;
      subjectObjectId:string;
      subjectVersion?:string;
      restoreReference:string;
      decisionId:string;
      restoredContentReference:string;
      integrityHash:string;
      status:'SUCCEEDED'|'FAILED';
      message?:string;
      restoredAt?:string;
    }
  ){
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.RECORDS_RETENTION_RESTORE);
    const subjectVersion=optional(input.subjectVersion);
    const message=optional(input.message);
    const restore={
      id:asId<'RestoreRunId'>('RESTORE-'+randomUUID(),'Restore Run'),
      tenantId,
      archiveRecordId:asId<'ArchiveRecordId'>(required(input.archiveRecordId,'Archive Record'),'Archive Record'),
      subjectObjectId:asId<'CanonicalObjectId'>(required(input.subjectObjectId,'Subject object'),'Subject object'),
      ...(subjectVersion?{subjectVersion}:{}),
      restoreReference:required(input.restoreReference,'Restore reference'),
      restoreDecisionId:asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
      restoredContentReference:required(input.restoredContentReference,'Restored content reference'),
      integrityHash:required(input.integrityHash,'Integrity hash'),
      restoredByPersonId:asId<'PersonId'>(actor,'Restorer'),
      restoredAt:at(input.restoredAt),
      status:input.status,
      ...(message?{message}:{})
    };
    try{
      await this.repo.createRestore(restore,this.audit(actor));
      return restore;
    }catch(error){
      return mapError(error);
    }
  }

  private audit(actor:string){
    return{actorPersonId:actor,correlationId:'RECORDS-RETENTION'};
  }

  private async require(tenantId:TenantId,actor:string,key:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,actor,key,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed){
      throw new RecordsRetentionCommandError(evaluation.reason,'PERMISSION_DENIED');
    }
  }
}
