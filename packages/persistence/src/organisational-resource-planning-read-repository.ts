import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface ContextViewRow extends RowDataPacket {
  id:string; context_type:string; lifecycle:string; code:string; name:string;
  organisation_id:string; organisation_name:string; organisation_unit_id:string|null; organisation_unit_name:string|null;
  function_id:string|null; function_name:string|null; canonical_object_id:string|null;
  effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}
interface JobRow extends RowDataPacket { id:string; code:string; name:string; }
interface CandidateRow extends RowDataPacket {
  function_context_id:string; person_id:string; person_name:string; position_id:string; position_title:string;
  organisation_unit_id:string; organisation_unit_name:string; job_profile_id:string; job_profile_name:string;
}
interface RequirementRow extends RowDataPacket {
  id:string; requesting_context_id:string; requesting_code:string; requesting_name:string;
  supplying_function_context_id:string; function_code:string; function_name:string;
  job_profile_id:string; job_profile_name:string; role_title:string; description:string;
  required_headcount:number; required_capacity_percent:number|string; effective_from:Date; effective_to:Date|null;
  status:'OPEN'|'PARTIALLY_FULFILLED'|'FULFILLED'|'CANCELLED';
}
interface FulfilmentRow extends RowDataPacket {
  id:string; requirement_id:string; person_id:string; person_name:string; position_id:string; position_title:string;
  requirement_share_percent:number|string; resource_capacity_percent:number|string;
  functional_deployment_id:string; deployment_assignment_id:string;
  effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}

export interface OrganisationalResourcePlanningContextView {
  id:string;
  contextType:string;
  lifecycle:string;
  code:string;
  name:string;
  organisationId:string;
  organisationName:string;
  organisationUnitId?:string;
  organisationUnitName?:string;
  functionId?:string;
  functionName?:string;
  canonicalObjectId?:string;
  effectiveFrom:string;
  effectiveTo?:string;
  status:'ACTIVE'|'INACTIVE';
}
export interface OrganisationalResourceCandidateView {
  functionContextId:string;
  personId:string;
  personName:string;
  positionId:string;
  positionTitle:string;
  organisationUnitId:string;
  organisationUnitName:string;
  jobProfileId:string;
  jobProfileName:string;
}
export interface OrganisationalResourceFulfilmentView {
  id:string;
  personId:string;
  personName:string;
  positionId:string;
  positionTitle:string;
  requirementSharePercent:number;
  resourceCapacityPercent:number;
  functionalDeploymentId:string;
  deploymentAssignmentId:string;
  effectiveFrom:string;
  effectiveTo?:string;
  status:'ACTIVE'|'INACTIVE';
}
export interface OrganisationalResourceRequirementView {
  id:string;
  requestingContextId:string;
  requestingCode:string;
  requestingName:string;
  supplyingFunctionContextId:string;
  functionCode:string;
  functionName:string;
  jobProfileId:string;
  jobProfileName:string;
  roleTitle:string;
  description:string;
  requiredHeadcount:number;
  requiredCapacityPercent:number;
  effectiveFrom:string;
  effectiveTo?:string;
  status:'OPEN'|'PARTIALLY_FULFILLED'|'FULFILLED'|'CANCELLED';
  fulfilments:OrganisationalResourceFulfilmentView[];
}
export interface OrganisationalResourcePlanningProjection {
  functionContexts:OrganisationalResourcePlanningContextView[];
  projectContexts:OrganisationalResourcePlanningContextView[];
  availableProjects:{objectId:string;code:string;name:string}[];
  organisations:{id:string;name:string}[];
  organisationUnits:{id:string;organisationId:string;code:string;name:string}[];
  functions:{id:string;code:string;name:string}[];
  jobProfiles:{id:string;code:string;name:string}[];
  candidates:OrganisationalResourceCandidateView[];
  requirements:OrganisationalResourceRequirementView[];
  totals:{functions:number;projects:number;openRequirements:number;fulfilledRequirements:number;namedDeployments:number};
}

function date(value:Date|string) {
  return value instanceof Date?value.toISOString():new Date(value).toISOString();
}
function mapContext(row:ContextViewRow):OrganisationalResourcePlanningContextView {
  return {
    id:row.id,contextType:row.context_type,lifecycle:row.lifecycle,code:row.code,name:row.name,
    organisationId:row.organisation_id,organisationName:row.organisation_name,
    ...(row.organisation_unit_id?{organisationUnitId:row.organisation_unit_id}:{}),
    ...(row.organisation_unit_name?{organisationUnitName:row.organisation_unit_name}:{}),
    ...(row.function_id?{functionId:row.function_id}:{}),
    ...(row.function_name?{functionName:row.function_name}:{}),
    ...(row.canonical_object_id?{canonicalObjectId:row.canonical_object_id}:{}),
    effectiveFrom:date(row.effective_from),...(row.effective_to?{effectiveTo:date(row.effective_to)}:{}),status:row.status
  };
}

export class MySqlOrganisationalResourcePlanningReadRepository {
  constructor(private readonly pool:Pool) {}

  async getProjection(tenantId:TenantId):Promise<OrganisationalResourcePlanningProjection> {
    const [
      contextsResult,projectsResult,organisationsResult,unitsResult,functionsResult,jobsResult,candidatesResult,
      requirementsResult,fulfilmentsResult
    ]=await Promise.all([
      this.pool.execute<ContextViewRow[]>(
        `SELECT oc.id,oc.context_type,oc.lifecycle,oc.code,oc.name,oc.organisation_id,
                COALESCE(o.trading_name,o.legal_name) AS organisation_name,
                oc.organisation_unit_id,ou.name AS organisation_unit_name,oc.function_id,fd.name AS function_name,
                oc.canonical_object_id,oc.effective_from,oc.effective_to,oc.status
           FROM organisational_contexts oc
           JOIN organisations o ON o.tenant_id=oc.tenant_id AND o.id=oc.organisation_id
           LEFT JOIN organisation_units ou ON ou.tenant_id=oc.tenant_id AND ou.id=oc.organisation_unit_id
           LEFT JOIN function_definitions fd ON fd.id=oc.function_id
          WHERE oc.tenant_id=?
          ORDER BY oc.context_type,oc.code`,[tenantId]
      ),
      this.pool.execute<(RowDataPacket&{object_id:string;code:string;name:string})[]>(
        `SELECT canonical_object_id AS object_id,code,name
           FROM construction_context_profiles
          WHERE tenant_id=? AND context_type='PROJECT' AND status='ACTIVE'
          ORDER BY code,name`,[tenantId]
      ),
      this.pool.execute<(RowDataPacket&{id:string;name:string})[]>(
        `SELECT id,COALESCE(trading_name,legal_name) AS name FROM organisations
          WHERE tenant_id=? AND status='ACTIVE' ORDER BY name`,[tenantId]
      ),
      this.pool.execute<(RowDataPacket&{id:string;organisation_id:string;code:string;name:string})[]>(
        `SELECT id,organisation_id,code,name FROM organisation_units
          WHERE tenant_id=? AND status='ACTIVE' ORDER BY organisation_id,code,name`,[tenantId]
      ),
      this.pool.execute<(RowDataPacket&{id:string;code:string;name:string})[]>(
        `SELECT id,code,name FROM function_definitions WHERE status='ACTIVE' ORDER BY code`
      ),
      this.pool.execute<JobRow[]>(
        `SELECT id,code,name FROM job_profiles WHERE status='ACTIVE'
          AND (catalogue_scope='PLATFORM' OR tenant_id=?) ORDER BY name,code`,[tenantId]
      ),
      this.pool.execute<CandidateRow[]>(
        `WITH RECURSIVE function_units AS (
           SELECT oc.id AS function_context_id,ou.id AS unit_id
             FROM organisational_contexts oc
             JOIN organisation_units ou ON ou.tenant_id=oc.tenant_id AND ou.id=oc.organisation_unit_id
            WHERE oc.tenant_id=? AND oc.context_type='FUNCTION' AND oc.status='ACTIVE' AND ou.status='ACTIVE'
           UNION ALL
           SELECT fu.function_context_id,child.id
             FROM function_units fu
             JOIN organisation_units child ON child.parent_unit_id=fu.unit_id
            WHERE child.tenant_id=? AND child.status='ACTIVE'
         )
         SELECT DISTINCT fu.function_context_id,pe.id AS person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,
                p.id AS position_id,p.title AS position_title,p.organisation_unit_id,ou.name AS organisation_unit_name,
                p.job_profile_id,jp.name AS job_profile_name
           FROM function_units fu
           JOIN positions p ON p.tenant_id=? AND p.organisation_unit_id=fu.unit_id AND p.status='ACTIVE'
           JOIN organisation_units ou ON ou.tenant_id=p.tenant_id AND ou.id=p.organisation_unit_id
           JOIN job_profiles jp ON jp.id=p.job_profile_id AND jp.status='ACTIVE'
           JOIN position_occupancies po ON po.tenant_id=p.tenant_id AND po.position_id=p.id
           JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id AND pe.status='ACTIVE'
          WHERE po.effective_from<=CURRENT_TIMESTAMP(6)
            AND (po.effective_to IS NULL OR po.effective_to>=CURRENT_TIMESTAMP(6))
          ORDER BY person_name,position_title`,[tenantId,tenantId,tenantId]
      ),
      this.pool.execute<RequirementRow[]>(
        `SELECT r.id,r.requesting_context_id,rc.code AS requesting_code,rc.name AS requesting_name,
                r.supplying_function_context_id,fc.code AS function_code,fc.name AS function_name,
                r.job_profile_id,jp.name AS job_profile_name,r.role_title,r.description,r.required_headcount,
                r.required_capacity_percent,r.effective_from,r.effective_to,r.status
           FROM organisational_resource_requirements r
           JOIN organisational_contexts rc ON rc.tenant_id=r.tenant_id AND rc.id=r.requesting_context_id
           JOIN organisational_contexts fc ON fc.tenant_id=r.tenant_id AND fc.id=r.supplying_function_context_id
           JOIN job_profiles jp ON jp.id=r.job_profile_id
          WHERE r.tenant_id=?
          ORDER BY r.status='FULFILLED',r.effective_from,r.id`,[tenantId]
      ),
      this.pool.execute<FulfilmentRow[]>(
        `SELECT f.id,f.requirement_id,f.person_id,COALESCE(pe.preferred_name,pe.legal_name) AS person_name,
                f.position_id,p.title AS position_title,f.requirement_share_percent,f.resource_capacity_percent,
                f.functional_deployment_id,f.deployment_assignment_id,f.effective_from,f.effective_to,f.status
           FROM organisational_resource_fulfilments f
           JOIN persons pe ON pe.tenant_id=f.tenant_id AND pe.id=f.person_id
           JOIN positions p ON p.tenant_id=f.tenant_id AND p.id=f.position_id
          WHERE f.tenant_id=?
          ORDER BY f.created_at,f.id`,[tenantId]
      )
    ]);

    const contexts=contextsResult[0].map(mapContext);
    const fulfilmentsByRequirement=new Map<string,OrganisationalResourceFulfilmentView[]>();
    for(const row of fulfilmentsResult[0]) {
      const list=fulfilmentsByRequirement.get(row.requirement_id)??[];
      list.push({
        id:row.id,personId:row.person_id,personName:row.person_name,positionId:row.position_id,positionTitle:row.position_title,
        requirementSharePercent:Number(row.requirement_share_percent),resourceCapacityPercent:Number(row.resource_capacity_percent),
        functionalDeploymentId:row.functional_deployment_id,deploymentAssignmentId:row.deployment_assignment_id,
        effectiveFrom:date(row.effective_from),...(row.effective_to?{effectiveTo:date(row.effective_to)}:{}),status:row.status
      });
      fulfilmentsByRequirement.set(row.requirement_id,list);
    }
    const requirements:OrganisationalResourceRequirementView[]=requirementsResult[0].map(row=>({
      id:row.id,requestingContextId:row.requesting_context_id,requestingCode:row.requesting_code,requestingName:row.requesting_name,
      supplyingFunctionContextId:row.supplying_function_context_id,functionCode:row.function_code,functionName:row.function_name,
      jobProfileId:row.job_profile_id,jobProfileName:row.job_profile_name,roleTitle:row.role_title,description:row.description,
      requiredHeadcount:Number(row.required_headcount),requiredCapacityPercent:Number(row.required_capacity_percent),
      effectiveFrom:date(row.effective_from),...(row.effective_to?{effectiveTo:date(row.effective_to)}:{}),status:row.status,
      fulfilments:fulfilmentsByRequirement.get(row.id)??[]
    }));

    return {
      functionContexts:contexts.filter(item=>item.contextType==='FUNCTION'),
      projectContexts:contexts.filter(item=>item.contextType==='PROJECT'),
      availableProjects:projectsResult[0].map(row=>({objectId:row.object_id,code:row.code,name:row.name})),
      organisations:organisationsResult[0],
      organisationUnits:unitsResult[0].map(row=>({id:row.id,organisationId:row.organisation_id,code:row.code,name:row.name})),
      functions:functionsResult[0],
      jobProfiles:jobsResult[0],
      candidates:candidatesResult[0].map(row=>({
        functionContextId:row.function_context_id,personId:row.person_id,personName:row.person_name,
        positionId:row.position_id,positionTitle:row.position_title,organisationUnitId:row.organisation_unit_id,
        organisationUnitName:row.organisation_unit_name,jobProfileId:row.job_profile_id,jobProfileName:row.job_profile_name
      })),
      requirements,
      totals:{
        functions:contexts.filter(item=>item.contextType==='FUNCTION'&&item.status==='ACTIVE').length,
        projects:contexts.filter(item=>item.contextType==='PROJECT'&&item.status==='ACTIVE').length,
        openRequirements:requirements.filter(item=>item.status==='OPEN'||item.status==='PARTIALLY_FULFILLED').length,
        fulfilledRequirements:requirements.filter(item=>item.status==='FULFILLED').length,
        namedDeployments:requirements.flatMap(item=>item.fulfilments).filter(item=>item.status==='ACTIVE').length
      }
    };
  }
}
