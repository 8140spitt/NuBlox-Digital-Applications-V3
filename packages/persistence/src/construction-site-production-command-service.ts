import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type SiteFieldEvidenceType,
  type SiteIssuePriority,
  type SiteIssueType,
  type TenantId
} from '@nublox/kernel';
import type { Pool } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlConstructionSiteProductionRepository } from './construction-site-production-repository.js';

export class ConstructionSiteProductionCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ) {
    super(message);
    this.name='ConstructionSiteProductionCommandError';
  }
}

function required(value:string|undefined,label:string) {
  const trimmed=value?.trim()??'';
  if(!trimmed) throw new ConstructionSiteProductionCommandError(`${label} is required.`,'INVALID_INPUT');
  return trimmed;
}
function optional(value:string|undefined) {
  const trimmed=value?.trim()??'';
  return trimmed||undefined;
}
function at(value?:string) {
  const date=new Date(value??new Date().toISOString());
  if(Number.isNaN(date.getTime())) throw new ConstructionSiteProductionCommandError('Date/time is invalid.','INVALID_INPUT');
  return date.toISOString();
}
function dateOnly(value:string|undefined) {
  const raw=required(value,'Log date');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new ConstructionSiteProductionCommandError('Log date must be YYYY-MM-DD.','INVALID_INPUT');
  return raw;
}
function numberValue(value:number|string|undefined,label:string,{integer=false,min=0,max=Number.POSITIVE_INFINITY}={}) {
  if(value===undefined||value==='') return undefined;
  const result=Number(value);
  if(!Number.isFinite(result)||result<min||result>max||(integer&&!Number.isInteger(result))) {
    throw new ConstructionSiteProductionCommandError(`${label} is invalid.`,'INVALID_INPUT');
  }
  return result;
}
function mapError(error:unknown):never {
  if(error instanceof ConstructionSiteProductionCommandError) throw error;
  if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY') {
    throw new ConstructionSiteProductionCommandError('Equivalent site-production record already exists.','CONFLICT');
  }
  if(error instanceof Error) {
    if(/not found/i.test(error.message)) throw new ConstructionSiteProductionCommandError(error.message,'NOT_FOUND');
    if(/must|required|invalid|only|cannot|requires|completion|progress|issue|evidence|predate|open/i.test(error.message)) {
      throw new ConstructionSiteProductionCommandError(error.message,'INVALID_INPUT');
    }
  }
  throw error;
}

export class MySqlConstructionSiteProductionCommandService {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlConstructionSiteProductionRepository;

  constructor(pool:Pool) {
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlConstructionSiteProductionRepository(pool);
  }

  async createWorkPackage(
    tenantId:TenantId,
    actor:string,
    input:{
      projectObjectId:string;
      code:string;
      title:string;
      description?:string;
      managerPersonId?:string;
      plannedStart?:string;
      plannedEnd?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_MANAGE);
    const description=optional(input.description);
    const plannedStart=optional(input.plannedStart);
    const plannedEnd=optional(input.plannedEnd);
    const createdAt=at();
    const workPackageId=asId<'SiteWorkPackageId'>('SITE-WP-'+randomUUID(),'Site Work Package');
    const workPackage={
      id:workPackageId,
      tenantId,
      canonicalObjectId:asId<'CanonicalObjectId'>('WORK-PACKAGE-'+randomUUID(),'Work Package canonical object'),
      projectObjectId:asId<'CanonicalObjectId'>(required(input.projectObjectId,'Project'),'Project'),
      code:required(input.code,'Work Package code').toUpperCase(),
      title:required(input.title,'Work Package title'),
      ...(description?{description}:{}),
      managerPersonId:asId<'PersonId'>(optional(input.managerPersonId)??actor,'Work Package manager'),
      ...(plannedStart?{plannedStart:at(plannedStart)}:{}),
      ...(plannedEnd?{plannedEnd:at(plannedEnd)}:{}),
      status:'PLANNED' as const,
      createdAt
    };
    try { return await this.repo.createWorkPackage(workPackage); } catch(error) { return mapError(error); }
  }

  async activateWorkPackage(tenantId:TenantId,actor:string,id:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_MANAGE);
    try { return await this.repo.activateWorkPackage(tenantId,asId<'SiteWorkPackageId'>(required(id,'Work Package'),'Work Package')); }
    catch(error) { return mapError(error); }
  }

  async createDailyLog(
    tenantId:TenantId,
    actor:string,
    input:{
      workPackageId:string;
      logDate:string;
      summary:string;
      conditions?:string;
      labourCount?:number|string;
      plantSummary?:string;
      materialsSummary?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_EXECUTE);
    const conditions=optional(input.conditions);
    const plantSummary=optional(input.plantSummary);
    const materialsSummary=optional(input.materialsSummary);
    const labourCount=numberValue(input.labourCount,'Labour count',{integer:true,min:0});
    const log={
      id:asId<'SiteDailyLogId'>('SITE-LOG-'+randomUUID(),'Site Daily Log'),
      tenantId,
      workPackageId:asId<'SiteWorkPackageId'>(required(input.workPackageId,'Work Package'),'Work Package'),
      logDate:dateOnly(input.logDate),
      summary:required(input.summary,'Daily summary'),
      ...(conditions?{conditions}:{}),
      ...(labourCount!==undefined?{labourCount}:{}),
      ...(plantSummary?{plantSummary}:{}),
      ...(materialsSummary?{materialsSummary}:{}),
      createdByPersonId:asId<'PersonId'>(actor,'Daily Log creator'),
      createdAt:at()
    };
    try { return await this.repo.createDailyLog(log); } catch(error) { return mapError(error); }
  }

  async recordProgress(
    tenantId:TenantId,
    actor:string,
    input:{
      workPackageId:string;
      percentComplete:number|string;
      quantityCompleted?:number|string;
      unit?:string;
      note?:string;
      occurredAt?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_EXECUTE);
    const percentComplete=numberValue(input.percentComplete,'Percent complete',{min:0,max:100});
    if(percentComplete===undefined) throw new ConstructionSiteProductionCommandError('Percent complete is required.','INVALID_INPUT');
    const quantityCompleted=numberValue(input.quantityCompleted,'Quantity completed',{min:0});
    const unit=optional(input.unit);
    const note=optional(input.note);
    const record={
      id:asId<'SiteProgressRecordId'>('SITE-PROG-'+randomUUID(),'Site Progress Record'),
      tenantId,
      workPackageId:asId<'SiteWorkPackageId'>(required(input.workPackageId,'Work Package'),'Work Package'),
      recordedByPersonId:asId<'PersonId'>(actor,'Progress recorder'),
      occurredAt:at(input.occurredAt),
      percentComplete,
      ...(quantityCompleted!==undefined?{quantityCompleted}:{}),
      ...(unit?{unit}:{}),
      ...(note?{note}:{})
    };
    try { return await this.repo.recordProgress(record); } catch(error) { return mapError(error); }
  }

  async recordEvidence(
    tenantId:TenantId,
    actor:string,
    input:{
      workPackageId:string;
      evidenceType:SiteFieldEvidenceType;
      reference:string;
      description?:string;
      occurredAt?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_EXECUTE);
    const description=optional(input.description);
    const evidence={
      id:asId<'SiteFieldEvidenceId'>('SITE-EVD-'+randomUUID(),'Site Field Evidence'),
      tenantId,
      workPackageId:asId<'SiteWorkPackageId'>(required(input.workPackageId,'Work Package'),'Work Package'),
      recordedByPersonId:asId<'PersonId'>(actor,'Evidence recorder'),
      evidenceType:input.evidenceType,
      reference:required(input.reference,'Evidence reference'),
      ...(description?{description}:{}),
      occurredAt:at(input.occurredAt)
    };
    try { return await this.repo.recordEvidence(evidence); } catch(error) { return mapError(error); }
  }

  async createIssue(
    tenantId:TenantId,
    actor:string,
    input:{
      workPackageId:string;
      issueType:SiteIssueType;
      title:string;
      description:string;
      priority:SiteIssuePriority;
      assignedToPersonId?:string;
      dueAt?:string;
    }
  ) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_ISSUE_MANAGE);
    const assignedToPersonId=optional(input.assignedToPersonId);
    const dueAt=optional(input.dueAt);
    const issue={
      id:asId<'SiteIssueId'>('SITE-ISSUE-'+randomUUID(),'Site Issue'),
      tenantId,
      workPackageId:asId<'SiteWorkPackageId'>(required(input.workPackageId,'Work Package'),'Work Package'),
      issueType:input.issueType,
      title:required(input.title,'Issue title'),
      description:required(input.description,'Issue description'),
      priority:input.priority,
      status:'OPEN' as const,
      raisedByPersonId:asId<'PersonId'>(actor,'Issue raiser'),
      ...(assignedToPersonId?{assignedToPersonId:asId<'PersonId'>(assignedToPersonId,'Issue assignee')}:{}),
      ...(dueAt?{dueAt:at(dueAt)}:{}),
      raisedAt:at()
    };
    try { return await this.repo.createIssue(issue); } catch(error) { return mapError(error); }
  }

  async resolveIssue(tenantId:TenantId,actor:string,id:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_ISSUE_MANAGE);
    try { return await this.repo.resolveIssue(tenantId,asId<'SiteIssueId'>(required(id,'Site Issue'),'Site Issue'),at()); }
    catch(error) { return mapError(error); }
  }

  async completeWorkPackage(tenantId:TenantId,actor:string,id:string) {
    await this.require(tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_MANAGE);
    try { return await this.repo.completeWorkPackage(tenantId,asId<'SiteWorkPackageId'>(required(id,'Work Package'),'Work Package'),at()); }
    catch(error) { return mapError(error); }
  }

  private async require(tenantId:TenantId,actor:string,permissionKey:string) {
    const evaluation=await this.access.evaluatePermission(tenantId,actor,permissionKey,{scopeType:'TENANT'});
    if(!evaluation.allowed) throw new ConstructionSiteProductionCommandError(evaluation.reason,'PERMISSION_DENIED');
  }
}
