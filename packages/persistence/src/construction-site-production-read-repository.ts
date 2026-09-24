import { PLATFORM_PERMISSION_KEYS, type TenantId } from '@nublox/kernel';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { MySqlConstructionSiteProductionRepository } from './construction-site-production-repository.js';

interface ProjectRow extends RowDataPacket { object_id:string; code:string; name:string; }
interface PersonRow extends RowDataPacket { id:string; legal_name:string; preferred_name:string|null; }

export class ConstructionSiteProductionReadError extends Error {
  constructor(message:string,readonly code:'PERMISSION_DENIED') {
    super(message);
    this.name='ConstructionSiteProductionReadError';
  }
}

export class MySqlConstructionSiteProductionReadRepository {
  private readonly access:MySqlAccessRepository;
  private readonly repo:MySqlConstructionSiteProductionRepository;

  constructor(private readonly pool:Pool) {
    this.access=new MySqlAccessRepository(pool);
    this.repo=new MySqlConstructionSiteProductionRepository(pool);
  }

  async getProjection(tenantId:TenantId,actor:string) {
    const evaluation=await this.access.evaluatePermission(
      tenantId,actor,PLATFORM_PERMISSION_KEYS.SITE_PRODUCTION_READ,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new ConstructionSiteProductionReadError(evaluation.reason,'PERMISSION_DENIED');

    const [workPackages,logs,progress,evidence,issues,projectsResult,peopleResult]=await Promise.all([
      this.repo.listWorkPackages(tenantId),
      this.repo.listDailyLogs(tenantId),
      this.repo.listProgress(tenantId),
      this.repo.listEvidence(tenantId),
      this.repo.listIssues(tenantId),
      this.pool.execute<ProjectRow[]>(
        `SELECT ccp.canonical_object_id AS object_id,ccp.code,ccp.name
           FROM construction_context_profiles ccp
          WHERE ccp.tenant_id=? AND ccp.context_type='PROJECT' AND ccp.status='ACTIVE'
          ORDER BY ccp.code,ccp.name`,[tenantId]
      ),
      this.pool.execute<PersonRow[]>(
        "SELECT id,legal_name,preferred_name FROM persons WHERE tenant_id=? AND status='ACTIVE' ORDER BY legal_name,id",[tenantId]
      )
    ]);
    const peopleById=new Map(peopleResult[0].map((p)=>[p.id,p.preferred_name??p.legal_name]));
    const projectsById=new Map(projectsResult[0].map((p)=>[p.object_id,p]));

    return {
      workPackages:workPackages.map((wp)=>{
        const packageProgress=progress.filter((record)=>record.workPackageId===wp.id);
        const latestProgress=[...packageProgress].sort((a,b)=>Date.parse(b.occurredAt)-Date.parse(a.occurredAt))[0];
        return {
          ...wp,
          managerName:peopleById.get(wp.managerPersonId)??wp.managerPersonId,
          project:projectsById.get(wp.projectObjectId)??{object_id:wp.projectObjectId,code:wp.projectObjectId,name:'Project'},
          latestPercentComplete:latestProgress?.percentComplete??0,
          logs:logs.filter((log)=>log.workPackageId===wp.id),
          progress:packageProgress,
          evidence:evidence.filter((record)=>record.workPackageId===wp.id),
          issues:issues.filter((issue)=>issue.workPackageId===wp.id).map((issue)=>({
            ...issue,
            raisedByName:peopleById.get(issue.raisedByPersonId)??issue.raisedByPersonId,
            ...(issue.assignedToPersonId?{assignedToName:peopleById.get(issue.assignedToPersonId)??issue.assignedToPersonId}:{})
          }))
        };
      }),
      projects:projectsResult[0].map((p)=>({id:p.object_id,code:p.code,name:p.name})),
      people:peopleResult[0].map((p)=>({id:p.id,name:p.preferred_name??p.legal_name})),
      totals:{
        workPackages:workPackages.length,
        active:workPackages.filter((wp)=>wp.status==='ACTIVE').length,
        complete:workPackages.filter((wp)=>wp.status==='COMPLETE').length,
        openIssues:issues.filter((issue)=>issue.status==='OPEN'||issue.status==='IN_PROGRESS').length,
        dailyLogs:logs.length,
        evidence:evidence.length
      }
    };
  }
}
