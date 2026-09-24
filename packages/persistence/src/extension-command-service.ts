import { createHash, randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type ExtensionCompatibilityAssessment,
  type ExtensionCompatibilityOutcome,
  type ExtensionComponent,
  type ExtensionComponentKind,
  type ExtensionDefinition,
  type ExtensionKind,
  type ExtensionPackageVersion,
  type ExtensionReconciliationItem,
  type ExtensionReconciliationItemOutcome,
  type ExtensionReconciliationRun,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlExtensionRepository } from './extension-repository.js';

export class ExtensionCommandError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'){
    super(message);this.name='ExtensionCommandError';
  }
}
function required(v:string|undefined,l:string){const x=v?.trim()??'';if(!x)throw new ExtensionCommandError(l+' is required.','INVALID_INPUT');return x;}
function optional(v:string|undefined){const x=v?.trim()??'';return x||undefined;}
function stable(v:unknown):unknown{if(Array.isArray(v))return v.map(stable);if(typeof v==='object'&&v!==null){const o=v as Record<string,unknown>;return Object.fromEntries(Object.keys(o).sort().map(k=>[k,stable(o[k])]))}return v;}
function hash(v:unknown){return 'sha256:'+createHash('sha256').update(JSON.stringify(stable(v))).digest('hex');}
function now(v?:string){const d=new Date(v??new Date().toISOString());if(Number.isNaN(d.getTime()))throw new ExtensionCommandError('Date/time is invalid.','INVALID_INPUT');return d.toISOString();}
function mapError(e:unknown):never{
  if(e instanceof ExtensionCommandError)throw e;
  if(typeof e==='object'&&e!==null&&'code' in e&&(e as {code?:string}).code==='ER_DUP_ENTRY')throw new ExtensionCommandError('Equivalent extension governance evidence already exists.','CONFLICT');
  if(e instanceof Error){if(/not found/i.test(e.message))throw new ExtensionCommandError(e.message,'NOT_FOUND');if(/must|required|invalid|only|requires|belong|different/i.test(e.message))throw new ExtensionCommandError(e.message,'INVALID_INPUT');}
  throw e;
}
export class MySqlExtensionCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlExtensionRepository;
  constructor(pool:Pool){this.access=new MySqlAccessRepository(pool);this.repo=new MySqlExtensionRepository(pool);}
  async createDefinition(t:TenantId,actor:string,input:{code:string;name:string;description?:string;extensionKind:ExtensionKind;ownerReference:string}):Promise<ExtensionDefinition>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_MANAGE);
    const description=optional(input.description);
    const item:ExtensionDefinition={id:asId<'ExtensionDefinitionId'>('EXTDEF-'+randomUUID(),'Extension Definition'),tenantId:t,code:required(input.code,'Code').toUpperCase(),name:required(input.name,'Name'),...(description?{description}:{}),extensionKind:input.extensionKind,ownerReference:required(input.ownerReference,'Owner reference'),status:'ACTIVE'};
    try{await this.repo.createDefinition(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async createPackageVersion(t:TenantId,actor:string,input:{extensionDefinitionId:string;version:string;minimumPlatformVersion?:string;maximumPlatformVersion?:string;manifest:Readonly<Record<string,unknown>>;createdAt?:string}):Promise<ExtensionPackageVersion>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_MANAGE);
    const manifest=input.manifest;
    const item:ExtensionPackageVersion={id:asId<'ExtensionPackageVersionId'>('EXTPKG-'+randomUUID(),'Extension Package Version'),tenantId:t,extensionDefinitionId:asId<'ExtensionDefinitionId'>(required(input.extensionDefinitionId,'Extension Definition'),'Extension Definition'),version:required(input.version,'Version'),...(optional(input.minimumPlatformVersion)?{minimumPlatformVersion:optional(input.minimumPlatformVersion)!}:{}),...(optional(input.maximumPlatformVersion)?{maximumPlatformVersion:optional(input.maximumPlatformVersion)!}:{}),manifest,checksum:hash(manifest),status:'FROZEN',createdByPersonId:asId<'PersonId'>(actor,'Creator'),createdAt:now(input.createdAt)};
    try{await this.repo.createPackage(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async addComponent(t:TenantId,actor:string,input:{packageVersionId:string;componentKey:string;componentKind:ExtensionComponentKind;targetObjectType?:string;targetReference?:string;definition:Readonly<Record<string,unknown>>;sequence:number}):Promise<ExtensionComponent>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_MANAGE);
    if(!Number.isInteger(input.sequence)||input.sequence<1)throw new ExtensionCommandError('Sequence must be positive.','INVALID_INPUT');
    const item:ExtensionComponent={id:asId<'ExtensionComponentId'>('EXTCMP-'+randomUUID(),'Extension Component'),tenantId:t,packageVersionId:asId<'ExtensionPackageVersionId'>(required(input.packageVersionId,'Package Version'),'Package Version'),componentKey:required(input.componentKey,'Component key'),componentKind:input.componentKind,...(optional(input.targetObjectType)?{targetObjectType:optional(input.targetObjectType)!}:{}),...(optional(input.targetReference)?{targetReference:optional(input.targetReference)!}:{}),definition:input.definition,checksum:hash(input.definition),sequence:input.sequence};
    try{await this.repo.addComponent(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async assessCompatibility(t:TenantId,actor:string,input:{packageVersionId:string;platformVersion:string;outcome:ExtensionCompatibilityOutcome;evidence:Readonly<Record<string,unknown>>;assessedAt?:string}):Promise<ExtensionCompatibilityAssessment>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_ASSESS);
    const item:ExtensionCompatibilityAssessment={id:asId<'ExtensionCompatibilityAssessmentId'>('EXTCOMP-'+randomUUID(),'Extension Compatibility Assessment'),tenantId:t,packageVersionId:asId<'ExtensionPackageVersionId'>(required(input.packageVersionId,'Package Version'),'Package Version'),platformVersion:required(input.platformVersion,'Platform version'),outcome:input.outcome,evidence:input.evidence,assessedByPersonId:asId<'PersonId'>(actor,'Assessor'),assessedAt:now(input.assessedAt)};
    try{await this.repo.recordAssessment(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async startReconciliation(t:TenantId,actor:string,input:{extensionDefinitionId:string;fromPackageVersionId:string;toPackageVersionId:string;targetPlatformVersion:string;startedAt?:string}):Promise<ExtensionReconciliationRun>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_RECONCILE);
    const item:ExtensionReconciliationRun={id:asId<'ExtensionReconciliationRunId'>('EXTREC-'+randomUUID(),'Extension Reconciliation Run'),tenantId:t,extensionDefinitionId:asId<'ExtensionDefinitionId'>(required(input.extensionDefinitionId,'Extension Definition'),'Extension Definition'),fromPackageVersionId:asId<'ExtensionPackageVersionId'>(required(input.fromPackageVersionId,'Source Package'),'Source Package'),toPackageVersionId:asId<'ExtensionPackageVersionId'>(required(input.toPackageVersionId,'Target Package'),'Target Package'),targetPlatformVersion:required(input.targetPlatformVersion,'Target platform version'),startedByPersonId:asId<'PersonId'>(actor,'Starter'),startedAt:now(input.startedAt),status:'RUNNING'};
    try{await this.repo.createReconciliationRun(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async recordReconciliationItem(t:TenantId,actor:string,input:{runId:string;componentKey:string;outcome:ExtensionReconciliationItemOutcome;sourceChecksum?:string;targetChecksum?:string;resolvedDefinition?:Readonly<Record<string,unknown>>;rationale?:string;recordedAt?:string}):Promise<ExtensionReconciliationItem>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_RECONCILE);
    const item:ExtensionReconciliationItem={id:asId<'ExtensionReconciliationItemId'>('EXTRECI-'+randomUUID(),'Extension Reconciliation Item'),tenantId:t,reconciliationRunId:asId<'ExtensionReconciliationRunId'>(required(input.runId,'Reconciliation Run'),'Reconciliation Run'),componentKey:required(input.componentKey,'Component key'),outcome:input.outcome,...(optional(input.sourceChecksum)?{sourceChecksum:optional(input.sourceChecksum)!}:{}),...(optional(input.targetChecksum)?{targetChecksum:optional(input.targetChecksum)!}:{}),...(input.resolvedDefinition?{resolvedDefinition:input.resolvedDefinition}:{}),...(optional(input.rationale)?{rationale:optional(input.rationale)!}:{}),recordedByPersonId:asId<'PersonId'>(actor,'Recorder'),recordedAt:now(input.recordedAt)};
    try{await this.repo.addReconciliationItem(item,this.audit(actor));return item;}catch(e){return mapError(e);}
  }
  async completeReconciliation(t:TenantId,actor:string,input:{runId:string;summary:string;completedAt?:string}):Promise<ExtensionReconciliationRun>{
    await this.requirePermission(t,actor,PLATFORM_PERMISSION_KEYS.EXTENSION_RECONCILE);
    try{return await this.repo.completeReconciliationRun(t,asId<'ExtensionReconciliationRunId'>(required(input.runId,'Reconciliation Run'),'Reconciliation Run'),now(input.completedAt),required(input.summary,'Summary'),this.audit(actor));}catch(e){return mapError(e);}
  }
  private audit(actor:string){return{actorPersonId:actor,correlationId:'EXTENSION-GOVERNANCE'};}
  private async requirePermission(t:TenantId,actor:string,key:string){const e=await this.access.evaluatePermission(t,actor,key,{scopeType:'TENANT'});if(!e.allowed)throw new ExtensionCommandError(e.reason,'PERMISSION_DENIED');}
}
