import {
  createSiteDailyLog,
  createSiteFieldEvidence,
  createSiteIssue,
  createSiteProgressRecord,
  createSiteWorkPackage,
  completeSiteWorkPackage,
  resolveSiteIssue,
  type CanonicalObjectIdentity,
  type Person,
  type SiteDailyLog,
  type SiteFieldEvidence,
  type SiteIssue,
  type SiteProgressRecord,
  type SiteWorkPackage,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface ObjectRow extends RowDataPacket {
  id:string; tenant_id:string; object_type:string; stable_key:string; created_at:Date;
}
interface PersonRow extends RowDataPacket {
  id:string; tenant_id:string; party_id:string; legal_name:string; preferred_name:string|null; status:'ACTIVE'|'INACTIVE';
}
interface WorkPackageRow extends RowDataPacket {
  id:string; tenant_id:string; canonical_object_id:string; project_object_id:string; code:string; title:string;
  description:string|null; manager_person_id:string; planned_start:Date|null; planned_end:Date|null;
  status:SiteWorkPackage['status']; work_package_created_at:Date; completed_at:Date|null;
}
interface DailyLogRow extends RowDataPacket {
  id:string; tenant_id:string; work_package_id:string; log_date:Date|string; summary:string; conditions:string|null;
  labour_count:number|null; plant_summary:string|null; materials_summary:string|null; created_by_person_id:string; log_created_at:Date;
}
interface ProgressRow extends RowDataPacket {
  id:string; tenant_id:string; work_package_id:string; recorded_by_person_id:string; occurred_at:Date;
  percent_complete:string|number; quantity_completed:string|number|null; unit:string|null; note:string|null;
}
interface EvidenceRow extends RowDataPacket {
  id:string; tenant_id:string; work_package_id:string; recorded_by_person_id:string;
  evidence_type:SiteFieldEvidence['evidenceType']; evidence_reference:string; description:string|null; occurred_at:Date;
}
interface IssueRow extends RowDataPacket {
  id:string; tenant_id:string; work_package_id:string; issue_type:SiteIssue['issueType']; title:string; description:string;
  priority:SiteIssue['priority']; status:SiteIssue['status']; raised_by_person_id:string; assigned_to_person_id:string|null;
  due_at:Date|null; raised_at:Date; resolved_at:Date|null;
}

function iso(value:Date|string) { return value instanceof Date ? value.toISOString() : new Date(value).toISOString(); }
function dateOnly(value:Date|string) { return value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10); }

function mapObject(row:ObjectRow):CanonicalObjectIdentity {
  return { id:row.id as CanonicalObjectIdentity['id'], tenantId:row.tenant_id as TenantId, objectType:row.object_type, stableKey:row.stable_key, createdAt:iso(row.created_at) };
}
function mapPerson(row:PersonRow):Person {
  return {
    id:row.id as Person['id'],
    tenantId:row.tenant_id as TenantId,
    partyId:row.party_id as Person['partyId'],
    legalName:row.legal_name,
    ...(row.preferred_name?{preferredName:row.preferred_name}:{}),
    status:row.status
  };
}
function mapWorkPackage(row:WorkPackageRow):SiteWorkPackage {
  return {
    id:row.id as SiteWorkPackage['id'], tenantId:row.tenant_id as TenantId,
    canonicalObjectId:row.canonical_object_id as SiteWorkPackage['canonicalObjectId'],
    projectObjectId:row.project_object_id as SiteWorkPackage['projectObjectId'],
    code:row.code,title:row.title,...(row.description?{description:row.description}:{}),
    managerPersonId:row.manager_person_id as SiteWorkPackage['managerPersonId'],
    ...(row.planned_start?{plannedStart:row.planned_start.toISOString()}:{}),
    ...(row.planned_end?{plannedEnd:row.planned_end.toISOString()}:{}),
    status:row.status,createdAt:row.work_package_created_at.toISOString(),
    ...(row.completed_at?{completedAt:row.completed_at.toISOString()}:{})
  };
}
function mapDailyLog(row:DailyLogRow):SiteDailyLog {
  return {
    id:row.id as SiteDailyLog['id'],tenantId:row.tenant_id as TenantId,
    workPackageId:row.work_package_id as SiteDailyLog['workPackageId'],logDate:dateOnly(row.log_date),
    summary:row.summary,...(row.conditions?{conditions:row.conditions}:{}),
    ...(row.labour_count!==null?{labourCount:Number(row.labour_count)}:{}),
    ...(row.plant_summary?{plantSummary:row.plant_summary}:{}),
    ...(row.materials_summary?{materialsSummary:row.materials_summary}:{}),
    createdByPersonId:row.created_by_person_id as SiteDailyLog['createdByPersonId'],
    createdAt:row.log_created_at.toISOString()
  };
}
function mapProgress(row:ProgressRow):SiteProgressRecord {
  return {
    id:row.id as SiteProgressRecord['id'],tenantId:row.tenant_id as TenantId,
    workPackageId:row.work_package_id as SiteProgressRecord['workPackageId'],
    recordedByPersonId:row.recorded_by_person_id as SiteProgressRecord['recordedByPersonId'],
    occurredAt:row.occurred_at.toISOString(),percentComplete:Number(row.percent_complete),
    ...(row.quantity_completed!==null?{quantityCompleted:Number(row.quantity_completed)}:{}),
    ...(row.unit?{unit:row.unit}:{}),...(row.note?{note:row.note}:{})
  };
}
function mapEvidence(row:EvidenceRow):SiteFieldEvidence {
  return {
    id:row.id as SiteFieldEvidence['id'],tenantId:row.tenant_id as TenantId,
    workPackageId:row.work_package_id as SiteFieldEvidence['workPackageId'],
    recordedByPersonId:row.recorded_by_person_id as SiteFieldEvidence['recordedByPersonId'],
    evidenceType:row.evidence_type,reference:row.evidence_reference,
    ...(row.description?{description:row.description}:{}),occurredAt:row.occurred_at.toISOString()
  };
}
function mapIssue(row:IssueRow):SiteIssue {
  return {
    id:row.id as SiteIssue['id'],tenantId:row.tenant_id as TenantId,
    workPackageId:row.work_package_id as SiteIssue['workPackageId'],issueType:row.issue_type,
    title:row.title,description:row.description,priority:row.priority,status:row.status,
    raisedByPersonId:row.raised_by_person_id as SiteIssue['raisedByPersonId'],
    ...(row.assigned_to_person_id?{assignedToPersonId:row.assigned_to_person_id as SiteIssue['assignedToPersonId']}:{}),
    ...(row.due_at?{dueAt:row.due_at.toISOString()}:{}),raisedAt:row.raised_at.toISOString(),
    ...(row.resolved_at?{resolvedAt:row.resolved_at.toISOString()}:{})
  };
}

export class MySqlConstructionSiteProductionRepository {
  constructor(private readonly pool:Pool) {}

  async createWorkPackage(workPackage:SiteWorkPackage) {
    return withTransaction(this.pool, async (connection) => {
      const [project,manager]=await Promise.all([
        this.requireProject(workPackage.tenantId,workPackage.projectObjectId,connection),
        this.requirePerson(workPackage.tenantId,workPackage.managerPersonId,connection)
      ]);
      const object:CanonicalObjectIdentity={
        id:workPackage.canonicalObjectId,tenantId:workPackage.tenantId,objectType:'WORK_PACKAGE',
        stableKey:`WORK_PACKAGE:${workPackage.projectObjectId}:${workPackage.code}`,createdAt:workPackage.createdAt
      };
      const validated=createSiteWorkPackage(workPackage,object,project,manager);
      await connection.execute(
        'INSERT INTO canonical_objects (id,tenant_id,object_type,stable_key,created_at) VALUES (?,?,?,?,?)',
        [object.id,object.tenantId,object.objectType,object.stableKey,new Date(object.createdAt)]
      );
      await connection.execute(
        `INSERT INTO construction_context_profiles
          (id,tenant_id,canonical_object_id,context_type,code,name,parent_context_object_id,status,created_by_person_id,updated_by_person_id)
         VALUES (?,?,?,?,?,?,?,'ACTIVE',?,?)`,
        [`CCTX-${validated.id}`,validated.tenantId,validated.canonicalObjectId,'WORK_PACKAGE',validated.code,validated.title,
          validated.projectObjectId,validated.managerPersonId,validated.managerPersonId]
      );
      await connection.execute(
        `INSERT INTO site_work_packages
          (id,tenant_id,canonical_object_id,project_object_id,code,title,description,manager_person_id,planned_start,planned_end,status,work_package_created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.canonicalObjectId,validated.projectObjectId,validated.code,validated.title,
          validated.description??null,validated.managerPersonId,validated.plannedStart?new Date(validated.plannedStart):null,
          validated.plannedEnd?new Date(validated.plannedEnd):null,validated.status,new Date(validated.createdAt)]
      );
      await writeOutboxEvent(connection,{tenantId:validated.tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:validated.id,eventType:'site.work_package.created',payload:validated});
      return validated;
    });
  }

  async activateWorkPackage(tenantId:TenantId,id:SiteWorkPackage['id']) {
    return withTransaction(this.pool, async (connection) => {
      const current=await this.requireWorkPackage(tenantId,id,connection,true);
      if (!['PLANNED','ON_HOLD'].includes(current.status)) throw new Error('Only a planned or on-hold Work Package can be activated.');
      const [result]=await connection.execute<ResultSetHeader>(
        "UPDATE site_work_packages SET status='ACTIVE' WHERE tenant_id=? AND id=? AND status IN ('PLANNED','ON_HOLD')",
        [tenantId,id]
      );
      if(result.affectedRows!==1) throw new Error('Concurrent Work Package activation detected.');
      const next={...current,status:'ACTIVE' as const};
      await writeOutboxEvent(connection,{tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:id,eventType:'site.work_package.activated',payload:next});
      return next;
    });
  }

  async createDailyLog(log:SiteDailyLog) {
    return withTransaction(this.pool,async(connection)=>{
      const [workPackage,creator]=await Promise.all([
        this.requireWorkPackage(log.tenantId,log.workPackageId,connection),
        this.requirePerson(log.tenantId,log.createdByPersonId,connection)
      ]);
      const validated=createSiteDailyLog(log,workPackage,creator);
      await connection.execute(
        `INSERT INTO site_daily_logs
          (id,tenant_id,work_package_id,log_date,summary,conditions,labour_count,plant_summary,materials_summary,created_by_person_id,log_created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.workPackageId,validated.logDate,validated.summary,validated.conditions??null,
          validated.labourCount??null,validated.plantSummary??null,validated.materialsSummary??null,validated.createdByPersonId,new Date(validated.createdAt)]
      );
      await writeOutboxEvent(connection,{tenantId:validated.tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:validated.workPackageId,eventType:'site.daily_log.recorded',payload:validated});
      return validated;
    });
  }

  async recordProgress(record:SiteProgressRecord) {
    return withTransaction(this.pool,async(connection)=>{
      const [workPackage,recorder]=await Promise.all([
        this.requireWorkPackage(record.tenantId,record.workPackageId,connection),
        this.requirePerson(record.tenantId,record.recordedByPersonId,connection)
      ]);
      const validated=createSiteProgressRecord(record,workPackage,recorder);
      await connection.execute(
        `INSERT INTO site_progress_records
          (id,tenant_id,work_package_id,recorded_by_person_id,occurred_at,percent_complete,quantity_completed,unit,note)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.workPackageId,validated.recordedByPersonId,new Date(validated.occurredAt),
          validated.percentComplete,validated.quantityCompleted??null,validated.unit??null,validated.note??null]
      );
      if(workPackage.status==='PLANNED') {
        await connection.execute("UPDATE site_work_packages SET status='ACTIVE' WHERE tenant_id=? AND id=? AND status='PLANNED'",[validated.tenantId,validated.workPackageId]);
      }
      await writeOutboxEvent(connection,{tenantId:validated.tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:validated.workPackageId,eventType:'site.progress.recorded',payload:validated});
      return validated;
    });
  }

  async recordEvidence(evidence:SiteFieldEvidence) {
    return withTransaction(this.pool,async(connection)=>{
      const [workPackage,recorder]=await Promise.all([
        this.requireWorkPackage(evidence.tenantId,evidence.workPackageId,connection),
        this.requirePerson(evidence.tenantId,evidence.recordedByPersonId,connection)
      ]);
      const validated=createSiteFieldEvidence(evidence,workPackage,recorder);
      await connection.execute(
        `INSERT INTO site_field_evidence
          (id,tenant_id,work_package_id,recorded_by_person_id,evidence_type,evidence_reference,description,occurred_at)
         VALUES (?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.workPackageId,validated.recordedByPersonId,validated.evidenceType,
          validated.reference,validated.description??null,new Date(validated.occurredAt)]
      );
      await writeOutboxEvent(connection,{tenantId:validated.tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:validated.workPackageId,eventType:'site.field_evidence.recorded',payload:validated});
      return validated;
    });
  }

  async createIssue(issue:SiteIssue) {
    return withTransaction(this.pool,async(connection)=>{
      const [workPackage,raiser,assignee]=await Promise.all([
        this.requireWorkPackage(issue.tenantId,issue.workPackageId,connection),
        this.requirePerson(issue.tenantId,issue.raisedByPersonId,connection),
        issue.assignedToPersonId?this.requirePerson(issue.tenantId,issue.assignedToPersonId,connection):Promise.resolve(undefined)
      ]);
      const validated=createSiteIssue(issue,workPackage,raiser,assignee);
      await connection.execute(
        `INSERT INTO site_issues
          (id,tenant_id,work_package_id,issue_type,title,description,priority,status,raised_by_person_id,assigned_to_person_id,due_at,raised_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [validated.id,validated.tenantId,validated.workPackageId,validated.issueType,validated.title,validated.description,
          validated.priority,validated.status,validated.raisedByPersonId,validated.assignedToPersonId??null,
          validated.dueAt?new Date(validated.dueAt):null,new Date(validated.raisedAt)]
      );
      await writeOutboxEvent(connection,{tenantId:validated.tenantId,aggregateType:'SITE_ISSUE',aggregateId:validated.id,eventType:'site.issue.raised',payload:validated});
      return validated;
    });
  }

  async resolveIssue(tenantId:TenantId,id:SiteIssue['id'],resolvedAt:string) {
    return withTransaction(this.pool,async(connection)=>{
      const current=await this.requireIssue(tenantId,id,connection,true);
      const next=resolveSiteIssue(current,resolvedAt);
      const [result]=await connection.execute<ResultSetHeader>(
        "UPDATE site_issues SET status='RESOLVED',resolved_at=? WHERE tenant_id=? AND id=? AND status IN ('OPEN','IN_PROGRESS')",
        [new Date(resolvedAt),tenantId,id]
      );
      if(result.affectedRows!==1) throw new Error('Concurrent Site Issue resolution detected.');
      await writeOutboxEvent(connection,{tenantId,aggregateType:'SITE_ISSUE',aggregateId:id,eventType:'site.issue.resolved',payload:next});
      return next;
    });
  }

  async completeWorkPackage(tenantId:TenantId,id:SiteWorkPackage['id'],completedAt:string) {
    return withTransaction(this.pool,async(connection)=>{
      const [current,progress,issues,evidence]=await Promise.all([
        this.requireWorkPackage(tenantId,id,connection,true),
        this.listProgress(tenantId,id,connection),
        this.listIssues(tenantId,id,connection),
        this.listEvidence(tenantId,id,connection)
      ]);
      const next=completeSiteWorkPackage(current,completedAt,progress,issues,evidence);
      const [result]=await connection.execute<ResultSetHeader>(
        "UPDATE site_work_packages SET status='COMPLETE',completed_at=? WHERE tenant_id=? AND id=? AND status IN ('PLANNED','ACTIVE','ON_HOLD')",
        [new Date(completedAt),tenantId,id]
      );
      if(result.affectedRows!==1) throw new Error('Concurrent Work Package completion detected.');
      await writeOutboxEvent(connection,{tenantId,aggregateType:'SITE_WORK_PACKAGE',aggregateId:id,eventType:'site.work_package.completed',payload:next});
      return next;
    });
  }

  async listWorkPackages(tenantId:TenantId) {
    const [rows]=await this.pool.execute<WorkPackageRow[]>('SELECT * FROM site_work_packages WHERE tenant_id=? ORDER BY work_package_created_at DESC,id',[tenantId]);
    return rows.map(mapWorkPackage);
  }
  async listDailyLogs(tenantId:TenantId,workPackageId?:SiteWorkPackage['id'],connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=workPackageId
      ? await q.execute<DailyLogRow[]>('SELECT * FROM site_daily_logs WHERE tenant_id=? AND work_package_id=? ORDER BY log_date DESC,id',[tenantId,workPackageId])
      : await q.execute<DailyLogRow[]>('SELECT * FROM site_daily_logs WHERE tenant_id=? ORDER BY log_date DESC,id',[tenantId]);
    return rows.map(mapDailyLog);
  }
  async listProgress(tenantId:TenantId,workPackageId?:SiteWorkPackage['id'],connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=workPackageId
      ? await q.execute<ProgressRow[]>('SELECT * FROM site_progress_records WHERE tenant_id=? AND work_package_id=? ORDER BY occurred_at DESC,id',[tenantId,workPackageId])
      : await q.execute<ProgressRow[]>('SELECT * FROM site_progress_records WHERE tenant_id=? ORDER BY occurred_at DESC,id',[tenantId]);
    return rows.map(mapProgress);
  }
  async listEvidence(tenantId:TenantId,workPackageId?:SiteWorkPackage['id'],connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=workPackageId
      ? await q.execute<EvidenceRow[]>('SELECT * FROM site_field_evidence WHERE tenant_id=? AND work_package_id=? ORDER BY occurred_at DESC,id',[tenantId,workPackageId])
      : await q.execute<EvidenceRow[]>('SELECT * FROM site_field_evidence WHERE tenant_id=? ORDER BY occurred_at DESC,id',[tenantId]);
    return rows.map(mapEvidence);
  }
  async listIssues(tenantId:TenantId,workPackageId?:SiteWorkPackage['id'],connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=workPackageId
      ? await q.execute<IssueRow[]>('SELECT * FROM site_issues WHERE tenant_id=? AND work_package_id=? ORDER BY raised_at DESC,id',[tenantId,workPackageId])
      : await q.execute<IssueRow[]>('SELECT * FROM site_issues WHERE tenant_id=? ORDER BY raised_at DESC,id',[tenantId]);
    return rows.map(mapIssue);
  }

  private async requireProject(tenantId:TenantId,id:string,connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=await q.execute<ObjectRow[]>(
      `SELECT co.id,co.tenant_id,co.object_type,co.stable_key,co.created_at
         FROM canonical_objects co
         JOIN construction_context_profiles ccp ON ccp.tenant_id=co.tenant_id AND ccp.canonical_object_id=co.id
        WHERE co.tenant_id=? AND co.id=? AND co.object_type='PROJECT' AND ccp.context_type='PROJECT' AND ccp.status='ACTIVE'`,
      [tenantId,id]
    );
    if(!rows[0]) throw new Error('Project context not found in tenant.');
    return mapObject(rows[0]);
  }
  private async requirePerson(tenantId:TenantId,id:string,connection?:PoolConnection) {
    const q=connection??this.pool;
    const [rows]=await q.execute<PersonRow[]>('SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?',[tenantId,id]);
    if(!rows[0]||rows[0].status!=='ACTIVE') throw new Error('Active Person not found in tenant.');
    return mapPerson(rows[0]);
  }
  private async requireWorkPackage(tenantId:TenantId,id:string,connection?:PoolConnection,lock=false) {
    const q=connection??this.pool;
    const [rows]=await q.execute<WorkPackageRow[]>('SELECT * FROM site_work_packages WHERE tenant_id=? AND id=?'+(lock?' FOR UPDATE':''),[tenantId,id]);
    if(!rows[0]) throw new Error('Site Work Package not found in tenant.');
    return mapWorkPackage(rows[0]);
  }
  private async requireIssue(tenantId:TenantId,id:string,connection?:PoolConnection,lock=false) {
    const q=connection??this.pool;
    const [rows]=await q.execute<IssueRow[]>('SELECT * FROM site_issues WHERE tenant_id=? AND id=?'+(lock?' FOR UPDATE':''),[tenantId,id]);
    if(!rows[0]) throw new Error('Site Issue not found in tenant.');
    return mapIssue(rows[0]);
  }
}
