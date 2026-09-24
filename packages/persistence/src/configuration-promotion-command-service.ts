import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ConfigurationChangeOperation,
  type ConfigurationEnvironmentType,
  type ConfigurationPromotionConflictDispositionType,
  type ConfigurationPromotionConflictSeverity,
  type ConfigurationPromotionConflictType,
  type ConfigurationPromotionItemOutcome,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import {
  MySqlConfigurationPromotionRepository,
  configurationEvidenceHash
} from './configuration-promotion-repository.js';

export class ConfigurationPromotionCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ){super(message);this.name='ConfigurationPromotionCommandError';}
}
function required(v:string|undefined,label:string){const x=v?.trim()??'';if(!x)throw new ConfigurationPromotionCommandError(label+' is required.','INVALID_INPUT');return x;}
function optional(v:string|undefined){const x=v?.trim()??'';return x||undefined;}
function positive(n:number,label:string){if(!Number.isInteger(n)||n<1)throw new ConfigurationPromotionCommandError(label+' must be a positive integer.','INVALID_INPUT');return n;}
function at(v?:string){const d=new Date(v??new Date().toISOString());if(Number.isNaN(d.getTime()))throw new ConfigurationPromotionCommandError('Date/time is invalid.','INVALID_INPUT');return d.toISOString();}
function mapError(e:unknown):never{
  if(e instanceof ConfigurationPromotionCommandError)throw e;
  if(typeof e==='object'&&e!==null&&'code' in e&&(e as {code?:string}).code==='ER_DUP_ENTRY'){
    throw new ConfigurationPromotionCommandError('Equivalent configuration-promotion evidence already exists or the target already has an active promotion.','CONFLICT');
  }
  if(e instanceof Error){
    if(/not found/i.test(e.message))throw new ConfigurationPromotionCommandError(e.message,'NOT_FOUND');
    if(/must|required|invalid|only|requires|belong|differ|exactly one|cannot|stale|drift/i.test(e.message)){
      throw new ConfigurationPromotionCommandError(e.message,'INVALID_INPUT');
    }
  }
  throw e;
}

export class MySqlConfigurationPromotionCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlConfigurationPromotionRepository;
  constructor(pool:Pool){this.access=new MySqlAccessRepository(pool);this.repo=new MySqlConfigurationPromotionRepository(pool);}

  async createEnvironment(t:TenantId,actor:string,input:{code:string;name:string;environmentType:ConfigurationEnvironmentType;platformVersion:string;environmentReference:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    const item={
      id:asId<'ConfigurationEnvironmentId'>('CFGENV-'+randomUUID(),'Configuration Environment'),
      tenantId:t,code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),
      environmentType:input.environmentType,platformVersion:required(input.platformVersion,'Platform version'),
      environmentReference:required(input.environmentReference,'Environment reference'),status:'ACTIVE' as const
    };
    try{await this.repo.createEnvironment(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async createBaseline(t:TenantId,actor:string,input:{environmentId:string;baselineReference:string;platformVersion:string;createdAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    const item={
      id:asId<'ConfigurationBaselineId'>('CFGBL-'+randomUUID(),'Configuration Baseline'),tenantId:t,
      environmentId:asId<'ConfigurationEnvironmentId'>(required(input.environmentId,'Environment'),'Environment'),
      baselineReference:required(input.baselineReference,'Baseline reference'),platformVersion:required(input.platformVersion,'Platform version'),
      status:'DRAFT' as const,createdByPersonId:asId<'PersonId'>(actor,'Creator'),createdAt:at(input.createdAt)
    };
    try{await this.repo.createBaseline(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async addBaselineItem(t:TenantId,actor:string,input:{baselineId:string;sequence:number;objectFamily:string;objectReference:string;objectVersion?:string;contentHash:string;snapshot:Readonly<Record<string,unknown>>}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    const item={
      id:asId<'ConfigurationBaselineItemId'>('CFGBLI-'+randomUUID(),'Configuration Baseline Item'),tenantId:t,
      baselineId:asId<'ConfigurationBaselineId'>(required(input.baselineId,'Baseline'),'Baseline'),sequence:positive(input.sequence,'Sequence'),
      objectFamily:required(input.objectFamily,'Object family'),objectReference:required(input.objectReference,'Object reference'),
      ...(optional(input.objectVersion)?{objectVersion:optional(input.objectVersion)!}:{}),contentHash:required(input.contentHash,'Content hash'),snapshot:input.snapshot
    };
    try{await this.repo.addBaselineItem(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async freezeBaseline(t:TenantId,actor:string,baselineId:string,frozenAt?:string){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    try{return await this.repo.freezeBaseline(t,asId<'ConfigurationBaselineId'>(required(baselineId,'Baseline'),'Baseline'),asId<'PersonId'>(actor,'Freezer'),at(frozenAt),this.audit(actor));}catch(e){return mapError(e);}
  }

  async createChangeSet(t:TenantId,actor:string,input:{sourceEnvironmentId:string;baseBaselineId:string;scopeObjectId:string;code:string;name:string;description?:string;version:string;createdAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    const description=optional(input.description);
    const item={
      id:asId<'ConfigurationChangeSetId'>('CFGCS-'+randomUUID(),'Configuration Change Set'),tenantId:t,
      sourceEnvironmentId:asId<'ConfigurationEnvironmentId'>(required(input.sourceEnvironmentId,'Source Environment'),'Source Environment'),
      baseBaselineId:asId<'ConfigurationBaselineId'>(required(input.baseBaselineId,'Base Baseline'),'Base Baseline'),
      scopeObjectId:required(input.scopeObjectId,'Scope object'),code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),
      ...(description?{description}:{}),version:required(input.version,'Version'),status:'DRAFT' as const,
      createdByPersonId:asId<'PersonId'>(actor,'Creator'),createdAt:at(input.createdAt)
    };
    try{await this.repo.createChangeSet(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async addChangeItem(t:TenantId,actor:string,input:{changeSetId:string;sequence:number;operation:ConfigurationChangeOperation;objectFamily:string;objectReference:string;beforeHash?:string;afterHash?:string;definition:Readonly<Record<string,unknown>>;dependencies?:readonly string[]}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    const item={
      id:asId<'ConfigurationChangeItemId'>('CFGCI-'+randomUUID(),'Configuration Change Item'),tenantId:t,
      changeSetId:asId<'ConfigurationChangeSetId'>(required(input.changeSetId,'Change Set'),'Change Set'),sequence:positive(input.sequence,'Sequence'),
      operation:input.operation,objectFamily:required(input.objectFamily,'Object family'),objectReference:required(input.objectReference,'Object reference'),
      ...(optional(input.beforeHash)?{beforeHash:optional(input.beforeHash)!}:{}),...(optional(input.afterHash)?{afterHash:optional(input.afterHash)!}:{}),
      definition:input.definition,...(input.dependencies&&input.dependencies.length?{dependencies:input.dependencies}:{})
    };
    try{await this.repo.addChangeItem(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async freezeChangeSet(t:TenantId,actor:string,changeSetId:string,frozenAt?:string){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_MANAGE);
    try{return await this.repo.freezeChangeSet(t,asId<'ConfigurationChangeSetId'>(required(changeSetId,'Change Set'),'Change Set'),asId<'PersonId'>(actor,'Freezer'),at(frozenAt),this.audit(actor));}catch(e){return mapError(e);}
  }

  async approveChangeSet(t:TenantId,actor:string,input:{changeSetId:string;decisionId:string;approvedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_APPROVE);
    try{return await this.repo.approveChangeSet(t,asId<'ConfigurationChangeSetId'>(required(input.changeSetId,'Change Set'),'Change Set'),asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),at(input.approvedAt),this.audit(actor));}catch(e){return mapError(e);}
  }

  async createRun(t:TenantId,actor:string,input:{changeSetId:string;sourceEnvironmentId:string;targetEnvironmentId:string;sourceBaselineId:string;expectedTargetBaselineId:string;runReference:string;mappingDefinition:Readonly<Record<string,unknown>>;rollbackDefinition:Readonly<Record<string,unknown>>;requestedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE);
    const mappingChecksum=configurationEvidenceHash(input.mappingDefinition);
    const rollbackChecksum=configurationEvidenceHash(input.rollbackDefinition);
    const item={
      id:asId<'ConfigurationPromotionRunId'>('CFGPR-'+randomUUID(),'Configuration Promotion Run'),tenantId:t,
      changeSetId:asId<'ConfigurationChangeSetId'>(required(input.changeSetId,'Change Set'),'Change Set'),
      sourceEnvironmentId:asId<'ConfigurationEnvironmentId'>(required(input.sourceEnvironmentId,'Source Environment'),'Source Environment'),
      targetEnvironmentId:asId<'ConfigurationEnvironmentId'>(required(input.targetEnvironmentId,'Target Environment'),'Target Environment'),
      sourceBaselineId:asId<'ConfigurationBaselineId'>(required(input.sourceBaselineId,'Source Baseline'),'Source Baseline'),
      expectedTargetBaselineId:asId<'ConfigurationBaselineId'>(required(input.expectedTargetBaselineId,'Expected target Baseline'),'Expected target Baseline'),
      runReference:required(input.runReference,'Run reference'),mappingDefinition:input.mappingDefinition,mappingChecksum,
      rollbackDefinition:input.rollbackDefinition,rollbackChecksum,requestedByPersonId:asId<'PersonId'>(actor,'Requester'),
      requestedAt:at(input.requestedAt),status:'QUEUED' as const
    };
    try{await this.repo.createPromotionRun(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async startRun(t:TenantId,actor:string,runId:string,startedAt?:string){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE);
    try{return await this.repo.startPromotionRun(t,asId<'ConfigurationPromotionRunId'>(required(runId,'Promotion Run'),'Promotion Run'),at(startedAt),this.audit(actor));}catch(e){return mapError(e);}
  }

  async recordItemResult(t:TenantId,actor:string,input:{runId:string;changeItemId:string;outcome:ConfigurationPromotionItemOutcome;targetHash?:string;message?:string;recordedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE);
    const item={
      id:asId<'ConfigurationPromotionItemResultId'>('CFGPRI-'+randomUUID(),'Configuration Promotion Item Result'),tenantId:t,
      promotionRunId:asId<'ConfigurationPromotionRunId'>(required(input.runId,'Promotion Run'),'Promotion Run'),
      changeItemId:asId<'ConfigurationChangeItemId'>(required(input.changeItemId,'Change Item'),'Change Item'),outcome:input.outcome,
      ...(optional(input.targetHash)?{targetHash:optional(input.targetHash)!}:{}),...(optional(input.message)?{message:optional(input.message)!}:{}),
      recordedByPersonId:asId<'PersonId'>(actor,'Recorder'),recordedAt:at(input.recordedAt)
    };
    try{await this.repo.recordItemResult(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async createConflict(t:TenantId,actor:string,input:{runId:string;itemResultId?:string;conflictType:ConfigurationPromotionConflictType;severity:ConfigurationPromotionConflictSeverity;code:string;description:string;detectedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE);
    const item={
      id:asId<'ConfigurationPromotionConflictId'>('CFGPC-'+randomUUID(),'Configuration Promotion Conflict'),tenantId:t,
      promotionRunId:asId<'ConfigurationPromotionRunId'>(required(input.runId,'Promotion Run'),'Promotion Run'),
      ...(optional(input.itemResultId)?{itemResultId:asId<'ConfigurationPromotionItemResultId'>(optional(input.itemResultId)!,'Promotion Item Result')}:{}),
      conflictType:input.conflictType,severity:input.severity,code:required(input.code,'Conflict code').toUpperCase(),
      description:required(input.description,'Description'),status:'OPEN' as const,detectedAt:at(input.detectedAt)
    };
    try{await this.repo.createConflict(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }

  async dispositionConflict(t:TenantId,actor:string,input:{conflictId:string;disposition:ConfigurationPromotionConflictDispositionType;rationale:string;decisionId:string;disposedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_CONFLICT_DISPOSITION);
    const item={
      id:asId<'ConfigurationPromotionConflictDispositionId'>('CFGPCD-'+randomUUID(),'Configuration Promotion Conflict Disposition'),tenantId:t,
      conflictId:asId<'ConfigurationPromotionConflictId'>(required(input.conflictId,'Conflict'),'Conflict'),
      disposition:input.disposition,rationale:required(input.rationale,'Rationale'),
      decisionId:asId<'DecisionId'>(required(input.decisionId,'Decision'),'Decision'),
      disposedByPersonId:asId<'PersonId'>(actor,'Disposer'),disposedAt:at(input.disposedAt)
    };
    try{return await this.repo.dispositionConflict(item,this.audit(actor));}catch(e){return mapError(e);}
  }

  async completeRun(t:TenantId,actor:string,input:{runId:string;resultingTargetBaselineId?:string;completedAt?:string}){
    await this.require(t,actor,PLATFORM_PERMISSION_KEYS.CONFIGURATION_PROMOTION_EXECUTE);
    try{return await this.repo.completePromotionRun(
      t,
      asId<'ConfigurationPromotionRunId'>(required(input.runId,'Promotion Run'),'Promotion Run'),
      optional(input.resultingTargetBaselineId)?asId<'ConfigurationBaselineId'>(optional(input.resultingTargetBaselineId)!,'Resulting Baseline'):undefined,
      at(input.completedAt),
      this.audit(actor)
    );}catch(e){return mapError(e);}
  }

  private audit(actor:string){return{actorPersonId:actor,correlationId:'CONFIGURATION-PROMOTION'};}
  private async require(t:TenantId,actor:string,key:string){
    const e=await this.access.evaluatePermission(t,actor,key,{scopeType:'TENANT'});
    if(!e.allowed)throw new ConfigurationPromotionCommandError(e.reason,'PERMISSION_DENIED');
  }
}
