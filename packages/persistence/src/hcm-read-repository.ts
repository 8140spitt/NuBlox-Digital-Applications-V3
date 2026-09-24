import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { DeploymentPurpose, TenantId } from '@nublox/kernel';

interface EmploymentViewRow extends RowDataPacket {
  id:string; employee_number:string; person_id:string; person_name:string; organisation_id:string; organisation_name:string;
  worker_type:string; employment_type:string; start_date:Date; end_date:Date|null; status:string;
}
interface PositionViewRow extends RowDataPacket {
  id:string; code:string; title:string; organisation_unit_id:string; unit_name:string; organisation_id:string; organisation_name:string;
  job_profile_id:string|null; job_profile_name:string|null; status:'ACTIVE'|'INACTIVE';
}
interface OccupancyRow extends RowDataPacket {
  id:string; position_id:string; person_id:string; person_name:string; employment_id:string|null; is_primary:number;
  effective_from:Date; effective_to:Date|null;
}
interface FunctionAssignmentRow extends RowDataPacket {
  id:string; position_id:string; function_id:string; function_code:string; function_name:string;
  deployment_purpose:DeploymentPurpose; is_primary:number; effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}
interface ReportingRow extends RowDataPacket {
  id:string; subordinate_position_id:string; manager_position_id:string; manager_title:string;
  relationship_type:string; effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}
interface FunctionRow extends RowDataPacket { id:string; code:string; name:string; }
interface ExperienceRow extends RowDataPacket {
  person_id:string; person_name:string; employment_id:string|null; employee_number:string|null;
  position_id:string; position_code:string; position_title:string; job_profile_id:string|null; job_profile_name:string|null;
  organisation_id:string; organisation_name:string; organisation_unit_id:string; organisation_unit_name:string;
  function_id:string|null; function_code:string|null; function_name:string|null; deployment_purpose:DeploymentPurpose|null;
  manager_position_id:string|null; manager_position_title:string|null; manager_person_id:string|null; manager_person_name:string|null;
}
interface ScopeRow extends RowDataPacket {
  position_id:string; position_code:string; position_title:string; person_id:string|null; person_name:string|null; depth:number;
}

export interface HcmEmploymentView {
  id:string; employeeNumber:string; personId:string; personName:string; organisationId:string; organisationName:string;
  workerType:string; employmentType:string; startDate:string; endDate?:string; status:string;
}
export interface HcmOccupancyView {
  id:string; personId:string; personName:string; employmentId?:string; isPrimary:boolean; effectiveFrom:string; effectiveTo?:string;
}
export interface HcmFunctionAssignmentView {
  id:string; functionId:string; functionCode:string; functionName:string; deploymentPurpose:DeploymentPurpose;
  isPrimary:boolean; effectiveFrom:string; effectiveTo?:string; status:'ACTIVE'|'INACTIVE';
}
export interface HcmReportingLineView {
  id:string; managerPositionId:string; managerTitle:string; relationshipType:string;
  effectiveFrom:string; effectiveTo?:string; status:'ACTIVE'|'INACTIVE';
}
export interface HcmPositionView {
  id:string; code:string; title:string; organisationUnitId:string; organisationUnitName:string;
  organisationId:string; organisationName:string; jobProfileId?:string; jobProfileName?:string; status:'ACTIVE'|'INACTIVE';
  occupants:HcmOccupancyView[]; functionAssignments:HcmFunctionAssignmentView[]; reportingLines:HcmReportingLineView[];
}
export interface HcmProjection {
  employments:HcmEmploymentView[];
  positions:HcmPositionView[];
  functions:{id:string;code:string;name:string}[];
  totals:{employments:number;activeEmployments:number;positions:number;occupiedPositions:number;functionOwnedPositions:number;managerPositions:number};
}
export interface HcmManagementScopeItem {
  positionId:string; positionCode:string; positionTitle:string; personId?:string; personName?:string; depth:number;
}
export interface HcmUserExperience {
  personId:string; personName:string; employmentId?:string; employeeNumber?:string;
  positionId:string; positionCode:string; positionTitle:string; jobProfileId?:string; jobProfileName?:string;
  organisationId:string; organisationName:string; organisationUnitId:string; organisationUnitName:string;
  functionId?:string; functionCode?:string; functionName?:string; deploymentPurpose?:DeploymentPurpose;
  managerPositionId?:string; managerPositionTitle?:string; managerPersonId?:string; managerPersonName?:string;
  managementScope:HcmManagementScopeItem[];
}

function iso(value:Date|string){return value instanceof Date?value.toISOString():new Date(value).toISOString();}

export class MySqlHcmReadRepository {
  constructor(private readonly pool:Pool){}

  async getProjection(tenantId:TenantId,evaluatedAt=new Date().toISOString()):Promise<HcmProjection>{
    const at=new Date(evaluatedAt);
    if(Number.isNaN(at.getTime())) throw new Error('HCM projection evaluation time is invalid.');
    const [employmentResult,positionResult,occupancyResult,functionAssignmentResult,reportingResult,functionResult]=await Promise.all([
      this.pool.execute<EmploymentViewRow[]>(
        `SELECT e.id,e.employee_number,e.person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,
                e.organisation_id,COALESCE(o.trading_name,o.legal_name) AS organisation_name,
                e.worker_type,e.employment_type,e.start_date,e.end_date,e.status
           FROM employments e
           JOIN persons pe ON pe.tenant_id=e.tenant_id AND pe.id=e.person_id
           JOIN organisations o ON o.tenant_id=e.tenant_id AND o.id=e.organisation_id
          WHERE e.tenant_id=?
          ORDER BY e.status='ACTIVE' DESC,person_name,e.employee_number`,[tenantId]
      ),
      this.pool.execute<PositionViewRow[]>(
        `SELECT p.id,p.code,p.title,p.organisation_unit_id,ou.name AS unit_name,ou.organisation_id,
                COALESCE(o.trading_name,o.legal_name) AS organisation_name,p.job_profile_id,jp.name AS job_profile_name,p.status
           FROM positions p
           JOIN organisation_units ou ON ou.tenant_id=p.tenant_id AND ou.id=p.organisation_unit_id
           JOIN organisations o ON o.tenant_id=ou.tenant_id AND o.id=ou.organisation_id
           LEFT JOIN job_profiles jp ON jp.id=p.job_profile_id
          WHERE p.tenant_id=?
          ORDER BY p.status='ACTIVE' DESC,ou.code,p.code,p.title`,[tenantId]
      ),
      this.pool.execute<OccupancyRow[]>(
        `SELECT po.id,po.position_id,po.person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,
                po.employment_id,po.is_primary,po.effective_from,po.effective_to
           FROM position_occupancies po
           JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
          WHERE po.tenant_id=? AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
          ORDER BY po.is_primary DESC,person_name`,[tenantId,at,at]
      ),
      this.pool.execute<FunctionAssignmentRow[]>(
        `SELECT pfa.id,pfa.position_id,pfa.function_id,fd.code AS function_code,fd.name AS function_name,
                pfa.deployment_purpose,pfa.is_primary,pfa.effective_from,pfa.effective_to,pfa.status
           FROM position_function_assignments pfa
           JOIN function_definitions fd ON fd.id=pfa.function_id
          WHERE pfa.tenant_id=? AND pfa.effective_from<=? AND (pfa.effective_to IS NULL OR pfa.effective_to>=?)
          ORDER BY pfa.is_primary DESC,fd.code`,[tenantId,at,at]
      ),
      this.pool.execute<ReportingRow[]>(
        `SELECT pr.id,pr.subordinate_position_id,pr.manager_position_id,mp.title AS manager_title,
                pr.relationship_type,pr.effective_from,pr.effective_to,pr.status
           FROM position_reporting_lines pr
           JOIN positions mp ON mp.tenant_id=pr.tenant_id AND mp.id=pr.manager_position_id
          WHERE pr.tenant_id=? AND pr.effective_from<=? AND (pr.effective_to IS NULL OR pr.effective_to>=?)
          ORDER BY pr.relationship_type,mp.title`,[tenantId,at,at]
      ),
      this.pool.execute<FunctionRow[]>(
        `SELECT id,code,name FROM function_definitions WHERE status='ACTIVE' ORDER BY code`
      )
    ]);

    const occupantsByPosition=new Map<string,HcmOccupancyView[]>();
    for(const row of occupancyResult[0]){
      const list=occupantsByPosition.get(row.position_id)??[];
      list.push({
        id:row.id,personId:row.person_id,personName:row.person_name,
        ...(row.employment_id?{employmentId:row.employment_id}:{}),isPrimary:Boolean(row.is_primary),
        effectiveFrom:iso(row.effective_from),...(row.effective_to?{effectiveTo:iso(row.effective_to)}:{})
      });
      occupantsByPosition.set(row.position_id,list);
    }
    const functionsByPosition=new Map<string,HcmFunctionAssignmentView[]>();
    for(const row of functionAssignmentResult[0]){
      const list=functionsByPosition.get(row.position_id)??[];
      list.push({
        id:row.id,functionId:row.function_id,functionCode:row.function_code,functionName:row.function_name,
        deploymentPurpose:row.deployment_purpose,isPrimary:Boolean(row.is_primary),effectiveFrom:iso(row.effective_from),
        ...(row.effective_to?{effectiveTo:iso(row.effective_to)}:{}),status:row.status
      });
      functionsByPosition.set(row.position_id,list);
    }
    const reportingByPosition=new Map<string,HcmReportingLineView[]>();
    for(const row of reportingResult[0]){
      const list=reportingByPosition.get(row.subordinate_position_id)??[];
      list.push({
        id:row.id,managerPositionId:row.manager_position_id,managerTitle:row.manager_title,
        relationshipType:row.relationship_type,effectiveFrom:iso(row.effective_from),
        ...(row.effective_to?{effectiveTo:iso(row.effective_to)}:{}),status:row.status
      });
      reportingByPosition.set(row.subordinate_position_id,list);
    }

    const positions:HcmPositionView[]=positionResult[0].map(row=>({
      id:row.id,code:row.code,title:row.title,organisationUnitId:row.organisation_unit_id,organisationUnitName:row.unit_name,
      organisationId:row.organisation_id,organisationName:row.organisation_name,
      ...(row.job_profile_id?{jobProfileId:row.job_profile_id}:{}),
      ...(row.job_profile_name?{jobProfileName:row.job_profile_name}:{}),
      status:row.status,occupants:occupantsByPosition.get(row.id)??[],
      functionAssignments:functionsByPosition.get(row.id)??[],reportingLines:reportingByPosition.get(row.id)??[]
    }));

    return {
      employments:employmentResult[0].map(row=>({
        id:row.id,employeeNumber:row.employee_number,personId:row.person_id,personName:row.person_name,
        organisationId:row.organisation_id,organisationName:row.organisation_name,workerType:row.worker_type,
        employmentType:row.employment_type,startDate:iso(row.start_date),...(row.end_date?{endDate:iso(row.end_date)}:{}),status:row.status
      })),
      positions,
      functions:functionResult[0],
      totals:{
        employments:employmentResult[0].length,
        activeEmployments:employmentResult[0].filter(row=>row.status==='ACTIVE').length,
        positions:positions.length,
        occupiedPositions:positions.filter(item=>item.occupants.length>0).length,
        functionOwnedPositions:positions.filter(item=>item.functionAssignments.some(f=>f.isPrimary&&f.status==='ACTIVE')).length,
        managerPositions:new Set(reportingResult[0].filter(row=>row.status==='ACTIVE'&&row.relationship_type==='LINE_MANAGER').map(row=>row.manager_position_id)).size
      }
    };
  }

  async getUserExperience(
    tenantId:TenantId,personId:string,evaluatedAt=new Date().toISOString()
  ):Promise<HcmUserExperience|null>{
    const at=new Date(evaluatedAt);
    if(Number.isNaN(at.getTime())) throw new Error('HCM user experience evaluation time is invalid.');
    const [rows]=await this.pool.execute<ExperienceRow[]>(
      `SELECT pe.id AS person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,
              e.id AS employment_id,e.employee_number,
              p.id AS position_id,p.code AS position_code,p.title AS position_title,
              p.job_profile_id,jp.name AS job_profile_name,
              ou.organisation_id,COALESCE(o.trading_name,o.legal_name) AS organisation_name,
              p.organisation_unit_id,ou.name AS organisation_unit_name,
              pfa.function_id,fd.code AS function_code,fd.name AS function_name,pfa.deployment_purpose,
              pr.manager_position_id,mp.title AS manager_position_title,
              mpo.person_id AS manager_person_id,COALESCE(mpe.preferred_name,mpe.legal_name) AS manager_person_name
         FROM persons pe
         JOIN position_occupancies po
           ON po.tenant_id=pe.tenant_id AND po.person_id=pe.id
          AND po.is_primary=TRUE AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
         JOIN positions p ON p.tenant_id=po.tenant_id AND p.id=po.position_id AND p.status='ACTIVE'
         JOIN organisation_units ou ON ou.tenant_id=p.tenant_id AND ou.id=p.organisation_unit_id
         JOIN organisations o ON o.tenant_id=ou.tenant_id AND o.id=ou.organisation_id
         LEFT JOIN job_profiles jp ON jp.id=p.job_profile_id
         LEFT JOIN employments e ON e.tenant_id=po.tenant_id AND e.id=po.employment_id
         LEFT JOIN position_function_assignments pfa
           ON pfa.tenant_id=p.tenant_id AND pfa.position_id=p.id AND pfa.is_primary=TRUE AND pfa.status='ACTIVE'
          AND pfa.effective_from<=? AND (pfa.effective_to IS NULL OR pfa.effective_to>=?)
         LEFT JOIN function_definitions fd ON fd.id=pfa.function_id
         LEFT JOIN position_reporting_lines pr
           ON pr.tenant_id=p.tenant_id AND pr.subordinate_position_id=p.id
          AND pr.relationship_type='LINE_MANAGER' AND pr.status='ACTIVE'
          AND pr.effective_from<=? AND (pr.effective_to IS NULL OR pr.effective_to>=?)
         LEFT JOIN positions mp ON mp.tenant_id=pr.tenant_id AND mp.id=pr.manager_position_id
         LEFT JOIN position_occupancies mpo
           ON mpo.tenant_id=mp.tenant_id AND mpo.position_id=mp.id AND mpo.is_primary=TRUE
          AND mpo.effective_from<=? AND (mpo.effective_to IS NULL OR mpo.effective_to>=?)
         LEFT JOIN persons mpe ON mpe.tenant_id=mpo.tenant_id AND mpe.id=mpo.person_id
        WHERE pe.tenant_id=? AND pe.id=? AND pe.status='ACTIVE'
        ORDER BY po.effective_from DESC,pfa.is_primary DESC,pr.effective_from DESC
        LIMIT 1`,
      [at,at,at,at,at,at,at,at,tenantId,personId]
    );
    const row=rows[0];
    if(!row) return null;
    const managementScope=await this.getManagementScope(tenantId,row.position_id,evaluatedAt);
    return {
      personId:row.person_id,personName:row.person_name,
      ...(row.employment_id?{employmentId:row.employment_id}:{}),
      ...(row.employee_number?{employeeNumber:row.employee_number}:{}),
      positionId:row.position_id,positionCode:row.position_code,positionTitle:row.position_title,
      ...(row.job_profile_id?{jobProfileId:row.job_profile_id}:{}),
      ...(row.job_profile_name?{jobProfileName:row.job_profile_name}:{}),
      organisationId:row.organisation_id,organisationName:row.organisation_name,
      organisationUnitId:row.organisation_unit_id,organisationUnitName:row.organisation_unit_name,
      ...(row.function_id?{functionId:row.function_id}:{}),
      ...(row.function_code?{functionCode:row.function_code}:{}),
      ...(row.function_name?{functionName:row.function_name}:{}),
      ...(row.deployment_purpose?{deploymentPurpose:row.deployment_purpose}:{}),
      ...(row.manager_position_id?{managerPositionId:row.manager_position_id}:{}),
      ...(row.manager_position_title?{managerPositionTitle:row.manager_position_title}:{}),
      ...(row.manager_person_id?{managerPersonId:row.manager_person_id}:{}),
      ...(row.manager_person_name?{managerPersonName:row.manager_person_name}:{}),
      managementScope
    };
  }

  async getManagementScope(
    tenantId:TenantId,managerPositionId:string,evaluatedAt=new Date().toISOString()
  ):Promise<HcmManagementScopeItem[]>{
    const at=new Date(evaluatedAt);
    if(Number.isNaN(at.getTime())) throw new Error('Management scope evaluation time is invalid.');
    const [rows]=await this.pool.query<ScopeRow[]>(
      `WITH RECURSIVE reports(position_id,depth) AS (
         SELECT pr.subordinate_position_id,1
           FROM position_reporting_lines pr
          WHERE pr.tenant_id=? AND pr.manager_position_id=? AND pr.relationship_type='LINE_MANAGER'
            AND pr.status='ACTIVE' AND pr.effective_from<=? AND (pr.effective_to IS NULL OR pr.effective_to>=?)
         UNION ALL
         SELECT pr.subordinate_position_id,reports.depth+1
           FROM position_reporting_lines pr
           JOIN reports ON pr.manager_position_id=reports.position_id
          WHERE pr.tenant_id=? AND pr.relationship_type='LINE_MANAGER'
            AND pr.status='ACTIVE' AND pr.effective_from<=? AND (pr.effective_to IS NULL OR pr.effective_to>=?)
       )
       SELECT r.position_id,p.code AS position_code,p.title AS position_title,
              po.person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,r.depth
         FROM reports r
         JOIN positions p ON p.tenant_id=? AND p.id=r.position_id
         LEFT JOIN position_occupancies po
           ON po.tenant_id=p.tenant_id AND po.position_id=p.id AND po.is_primary=TRUE
          AND po.effective_from<=? AND (po.effective_to IS NULL OR po.effective_to>=?)
         LEFT JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
        ORDER BY r.depth,p.title,p.code`,
      [tenantId,managerPositionId,at,at,tenantId,at,at,tenantId,at,at]
    );
    return rows.map(row=>({
      positionId:row.position_id,positionCode:row.position_code,positionTitle:row.position_title,
      ...(row.person_id?{personId:row.person_id}:{}),...(row.person_name?{personName:row.person_name}:{}),depth:Number(row.depth)
    }));
  }
}
