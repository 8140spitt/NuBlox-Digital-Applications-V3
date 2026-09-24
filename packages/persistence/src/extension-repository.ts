import {
  completeExtensionReconciliationRun,
  createExtensionCompatibilityAssessment,
  createExtensionComponent,
  createExtensionDefinition,
  createExtensionPackageVersion,
  createExtensionReconciliationItem,
  createExtensionReconciliationRun,
  type ExtensionCompatibilityAssessment,
  type ExtensionComponent,
  type ExtensionDefinition,
  type ExtensionPackageVersion,
  type ExtensionReconciliationItem,
  type ExtensionReconciliationRun,
  type Person,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';
import type { AuditContext } from './repository.js';

interface PersonRow extends RowDataPacket { id:string; tenant_id:string; party_id:string; legal_name:string; preferred_name:string|null; status:Person['status']; }
interface DefinitionRow extends RowDataPacket { id:string; tenant_id:string; code:string; name:string; description:string|null; extension_kind:ExtensionDefinition['extensionKind']; owner_reference:string; status:ExtensionDefinition['status']; }
interface PackageRow extends RowDataPacket { id:string; tenant_id:string; extension_definition_id:string; version:string; minimum_platform_version:string|null; maximum_platform_version:string|null; manifest:string|Record<string,unknown>; checksum:string; status:ExtensionPackageVersion['status']; created_by_person_id:string; package_created_at:Date; }
interface ComponentRow extends RowDataPacket { id:string; tenant_id:string; package_version_id:string; component_key:string; component_kind:ExtensionComponent['componentKind']; target_object_type:string|null; target_reference:string|null; definition:string|Record<string,unknown>; checksum:string; sequence:number; }
interface AssessmentRow extends RowDataPacket { id:string; tenant_id:string; package_version_id:string; platform_version:string; outcome:ExtensionCompatibilityAssessment['outcome']; evidence:string|Record<string,unknown>; assessed_by_person_id:string; assessed_at:Date; }
interface RunRow extends RowDataPacket { id:string; tenant_id:string; extension_definition_id:string; from_package_version_id:string; to_package_version_id:string; target_platform_version:string; started_by_person_id:string; started_at:Date; status:ExtensionReconciliationRun['status']; completed_at:Date|null; summary:string|null; row_version:number; }
interface ItemRow extends RowDataPacket { id:string; tenant_id:string; reconciliation_run_id:string; component_key:string; outcome:ExtensionReconciliationItem['outcome']; source_checksum:string|null; target_checksum:string|null; resolved_definition:string|Record<string,unknown>|null; rationale:string|null; recorded_by_person_id:string; recorded_at:Date; }

function objectJson(value:unknown):Readonly<Record<string,unknown>> {
  if(typeof value==='string'){const p=JSON.parse(value) as unknown;return typeof p==='object'&&p!==null&&!Array.isArray(p)?p as Readonly<Record<string,unknown>>:{};}
  return typeof value==='object'&&value!==null&&!Array.isArray(value)?value as Readonly<Record<string,unknown>>:{};
}
const mapPerson=(r:PersonRow):Person=>({id:r.id as Person['id'],tenantId:r.tenant_id as TenantId,partyId:r.party_id as Person['partyId'],legalName:r.legal_name,...(r.preferred_name?{preferredName:r.preferred_name}:{}),status:r.status});
const mapDefinition=(r:DefinitionRow):ExtensionDefinition=>({id:r.id as ExtensionDefinition['id'],tenantId:r.tenant_id as TenantId,code:r.code,name:r.name,...(r.description?{description:r.description}:{}),extensionKind:r.extension_kind,ownerReference:r.owner_reference,status:r.status});
const mapPackage=(r:PackageRow):ExtensionPackageVersion=>({id:r.id as ExtensionPackageVersion['id'],tenantId:r.tenant_id as TenantId,extensionDefinitionId:r.extension_definition_id as ExtensionPackageVersion['extensionDefinitionId'],version:r.version,...(r.minimum_platform_version?{minimumPlatformVersion:r.minimum_platform_version}:{}),...(r.maximum_platform_version?{maximumPlatformVersion:r.maximum_platform_version}:{}),manifest:objectJson(r.manifest),checksum:r.checksum,status:r.status,createdByPersonId:r.created_by_person_id as ExtensionPackageVersion['createdByPersonId'],createdAt:r.package_created_at.toISOString()});
const mapComponent=(r:ComponentRow):ExtensionComponent=>({id:r.id as ExtensionComponent['id'],tenantId:r.tenant_id as TenantId,packageVersionId:r.package_version_id as ExtensionComponent['packageVersionId'],componentKey:r.component_key,componentKind:r.component_kind,...(r.target_object_type?{targetObjectType:r.target_object_type}:{}),...(r.target_reference?{targetReference:r.target_reference}:{}),definition:objectJson(r.definition),checksum:r.checksum,sequence:Number(r.sequence)});
const mapAssessment=(r:AssessmentRow):ExtensionCompatibilityAssessment=>({id:r.id as ExtensionCompatibilityAssessment['id'],tenantId:r.tenant_id as TenantId,packageVersionId:r.package_version_id as ExtensionCompatibilityAssessment['packageVersionId'],platformVersion:r.platform_version,outcome:r.outcome,evidence:objectJson(r.evidence),assessedByPersonId:r.assessed_by_person_id as ExtensionCompatibilityAssessment['assessedByPersonId'],assessedAt:r.assessed_at.toISOString()});
const mapRun=(r:RunRow):ExtensionReconciliationRun=>({id:r.id as ExtensionReconciliationRun['id'],tenantId:r.tenant_id as TenantId,extensionDefinitionId:r.extension_definition_id as ExtensionReconciliationRun['extensionDefinitionId'],fromPackageVersionId:r.from_package_version_id as ExtensionReconciliationRun['fromPackageVersionId'],toPackageVersionId:r.to_package_version_id as ExtensionReconciliationRun['toPackageVersionId'],targetPlatformVersion:r.target_platform_version,startedByPersonId:r.started_by_person_id as ExtensionReconciliationRun['startedByPersonId'],startedAt:r.started_at.toISOString(),status:r.status,...(r.completed_at?{completedAt:r.completed_at.toISOString()}:{}),...(r.summary?{summary:r.summary}:{})});
const mapItem=(r:ItemRow):ExtensionReconciliationItem=>({id:r.id as ExtensionReconciliationItem['id'],tenantId:r.tenant_id as TenantId,reconciliationRunId:r.reconciliation_run_id as ExtensionReconciliationItem['reconciliationRunId'],componentKey:r.component_key,outcome:r.outcome,...(r.source_checksum?{sourceChecksum:r.source_checksum}:{}),...(r.target_checksum?{targetChecksum:r.target_checksum}:{}),...(r.resolved_definition?{resolvedDefinition:objectJson(r.resolved_definition)}:{}),...(r.rationale?{rationale:r.rationale}:{}),recordedByPersonId:r.recorded_by_person_id as ExtensionReconciliationItem['recordedByPersonId'],recordedAt:r.recorded_at.toISOString()});

async function evidence(c:PoolConnection,t:TenantId,type:string,id:string,action:string,audit:AuditContext,payload:unknown){
  await c.execute('INSERT INTO kernel_audit_entries (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload) VALUES (?, ?, ?, ?, ?, ?, ?)',[t,type,id,action,audit.actorPersonId??null,audit.correlationId??null,JSON.stringify(payload)]);
  await writeOutboxEvent(c,{tenantId:t,aggregateType:type,aggregateId:id,eventType:type+'.'+action,payload});
}

export class MySqlExtensionRepository {
  constructor(private readonly pool:Pool){}
  async createDefinition(input:ExtensionDefinition,audit:AuditContext={}){
    createExtensionDefinition(input);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_definitions (id,tenant_id,code,name,description,extension_kind,owner_reference,status,created_by_person_id,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.code,input.name,input.description??null,input.extensionKind,input.ownerReference,input.status,audit.actorPersonId??null,audit.actorPersonId??null]);await evidence(c,input.tenantId,'EXTENSION_DEFINITION',input.id,'CREATED',audit,input);});
  }
  async createPackage(input:ExtensionPackageVersion,audit:AuditContext={}){
    const [d,p]=await Promise.all([this.requireDefinition(input.tenantId,input.extensionDefinitionId),this.requirePerson(input.tenantId,input.createdByPersonId)]);createExtensionPackageVersion(input,d,p);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_package_versions (id,tenant_id,extension_definition_id,version,minimum_platform_version,maximum_platform_version,manifest,checksum,status,created_by_person_id,package_created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.extensionDefinitionId,input.version,input.minimumPlatformVersion??null,input.maximumPlatformVersion??null,JSON.stringify(input.manifest),input.checksum,input.status,input.createdByPersonId,new Date(input.createdAt)]);await evidence(c,input.tenantId,'EXTENSION_PACKAGE_VERSION',input.id,'FROZEN',audit,input);});
  }
  async addComponent(input:ExtensionComponent,audit:AuditContext={}){
    const p=await this.requirePackage(input.tenantId,input.packageVersionId);createExtensionComponent(input,p);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_components (id,tenant_id,package_version_id,component_key,component_kind,target_object_type,target_reference,definition,checksum,sequence) VALUES (?,?,?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.packageVersionId,input.componentKey,input.componentKind,input.targetObjectType??null,input.targetReference??null,JSON.stringify(input.definition),input.checksum,input.sequence]);await evidence(c,input.tenantId,'EXTENSION_COMPONENT',input.id,'CREATED',audit,input);});
  }
  async recordAssessment(input:ExtensionCompatibilityAssessment,audit:AuditContext={}){
    const [p,a]=await Promise.all([this.requirePackage(input.tenantId,input.packageVersionId),this.requirePerson(input.tenantId,input.assessedByPersonId)]);createExtensionCompatibilityAssessment(input,p,a);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_compatibility_assessments (id,tenant_id,package_version_id,platform_version,outcome,evidence,assessed_by_person_id,assessed_at) VALUES (?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.packageVersionId,input.platformVersion,input.outcome,JSON.stringify(input.evidence),input.assessedByPersonId,new Date(input.assessedAt)]);await evidence(c,input.tenantId,'EXTENSION_COMPATIBILITY_ASSESSMENT',input.id,input.outcome,audit,input);});
  }
  async createReconciliationRun(input:ExtensionReconciliationRun,audit:AuditContext={}){
    const [d,f,t,s]=await Promise.all([this.requireDefinition(input.tenantId,input.extensionDefinitionId),this.requirePackage(input.tenantId,input.fromPackageVersionId),this.requirePackage(input.tenantId,input.toPackageVersionId),this.requirePerson(input.tenantId,input.startedByPersonId)]);createExtensionReconciliationRun(input,d,f,t,s);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_reconciliation_runs (id,tenant_id,extension_definition_id,from_package_version_id,to_package_version_id,target_platform_version,started_by_person_id,started_at,status,updated_by_person_id) VALUES (?,?,?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.extensionDefinitionId,input.fromPackageVersionId,input.toPackageVersionId,input.targetPlatformVersion,input.startedByPersonId,new Date(input.startedAt),input.status,audit.actorPersonId??null]);await evidence(c,input.tenantId,'EXTENSION_RECONCILIATION_RUN',input.id,'STARTED',audit,input);});
  }
  async addReconciliationItem(input:ExtensionReconciliationItem,audit:AuditContext={}){
    const [r,p]=await Promise.all([this.requireRun(input.tenantId,input.reconciliationRunId),this.requirePerson(input.tenantId,input.recordedByPersonId)]);createExtensionReconciliationItem(input,r,p);
    await withTransaction(this.pool,async c=>{await c.execute('INSERT INTO extension_reconciliation_items (id,tenant_id,reconciliation_run_id,component_key,outcome,source_checksum,target_checksum,resolved_definition,rationale,recorded_by_person_id,recorded_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)',[input.id,input.tenantId,input.reconciliationRunId,input.componentKey,input.outcome,input.sourceChecksum??null,input.targetChecksum??null,input.resolvedDefinition?JSON.stringify(input.resolvedDefinition):null,input.rationale??null,input.recordedByPersonId,new Date(input.recordedAt)]);await evidence(c,input.tenantId,'EXTENSION_RECONCILIATION_ITEM',input.id,input.outcome,audit,input);});
  }
  async completeReconciliationRun(t:TenantId,id:ExtensionReconciliationRun['id'],at:string,summary:string,audit:AuditContext={}){
    return withTransaction(this.pool,async c=>{const [rows]=await c.execute<RunRow[]>('SELECT * FROM extension_reconciliation_runs WHERE tenant_id=? AND id=? FOR UPDATE',[t,id]);if(!rows[0])throw new Error('Extension Reconciliation Run not found in tenant.');const [items]=await c.execute<ItemRow[]>('SELECT * FROM extension_reconciliation_items WHERE tenant_id=? AND reconciliation_run_id=? ORDER BY component_key',[t,id]);const next=completeExtensionReconciliationRun(mapRun(rows[0]),items.map(mapItem),at,summary);const [u]=await c.execute<ResultSetHeader>('UPDATE extension_reconciliation_runs SET status=?,completed_at=?,summary=?,updated_by_person_id=?,row_version=row_version+1 WHERE tenant_id=? AND id=? AND row_version=?',[next.status,new Date(at),summary,audit.actorPersonId??null,t,id,rows[0].row_version]);if(u.affectedRows!==1)throw new Error('Concurrent Extension Reconciliation completion detected.');await evidence(c,t,'EXTENSION_RECONCILIATION_RUN',id,next.status,audit,next);return next;});
  }
  async listDefinitions(t:TenantId){const [r]=await this.pool.execute<DefinitionRow[]>('SELECT * FROM extension_definitions WHERE tenant_id=? ORDER BY code',[t]);return r.map(mapDefinition);}
  async listPackages(t:TenantId){const [r]=await this.pool.execute<PackageRow[]>('SELECT * FROM extension_package_versions WHERE tenant_id=? ORDER BY extension_definition_id,package_created_at DESC',[t]);return r.map(mapPackage);}
  async listComponents(t:TenantId){const [r]=await this.pool.execute<ComponentRow[]>('SELECT * FROM extension_components WHERE tenant_id=? ORDER BY package_version_id,sequence',[t]);return r.map(mapComponent);}
  async listAssessments(t:TenantId){const [r]=await this.pool.execute<AssessmentRow[]>('SELECT * FROM extension_compatibility_assessments WHERE tenant_id=? ORDER BY assessed_at DESC',[t]);return r.map(mapAssessment);}
  async listRuns(t:TenantId){const [r]=await this.pool.execute<RunRow[]>('SELECT * FROM extension_reconciliation_runs WHERE tenant_id=? ORDER BY started_at DESC',[t]);return r.map(mapRun);}
  async listItems(t:TenantId){const [r]=await this.pool.execute<ItemRow[]>('SELECT * FROM extension_reconciliation_items WHERE tenant_id=? ORDER BY recorded_at',[t]);return r.map(mapItem);}
  async getDefinition(t:TenantId,id:ExtensionDefinition['id']){return this.requireDefinition(t,id).catch(()=>undefined);}
  async getPackage(t:TenantId,id:ExtensionPackageVersion['id']){return this.requirePackage(t,id).catch(()=>undefined);}
  private async requireDefinition(t:TenantId,id:ExtensionDefinition['id']){const [r]=await this.pool.execute<DefinitionRow[]>('SELECT * FROM extension_definitions WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Extension Definition not found in tenant.');return mapDefinition(r[0]);}
  private async requirePackage(t:TenantId,id:ExtensionPackageVersion['id']){const [r]=await this.pool.execute<PackageRow[]>('SELECT * FROM extension_package_versions WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Extension Package Version not found in tenant.');return mapPackage(r[0]);}
  private async requireRun(t:TenantId,id:ExtensionReconciliationRun['id']){const [r]=await this.pool.execute<RunRow[]>('SELECT * FROM extension_reconciliation_runs WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Extension Reconciliation Run not found in tenant.');return mapRun(r[0]);}
  private async requirePerson(t:TenantId,id:Person['id']){const [r]=await this.pool.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[t,id]);if(!r[0])throw new Error('Person not found in tenant.');return mapPerson(r[0]);}
}
