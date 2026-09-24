import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  createOrganisationalContext,
  createOrganisationalResourceFulfilment,
  createOrganisationalResourceRequirement,
  type DeploymentAssignment,
  type DeploymentCapacity,
  type FunctionalDeployment,
  type OrganisationalContext,
  type OrganisationalResourceFulfilment,
  type OrganisationalResourceRequirement,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface FunctionRow extends RowDataPacket {
  id: string; code: string; name: string; status: 'ACTIVE'|'INACTIVE';
}
interface OrganisationRow extends RowDataPacket {
  id: string; status: 'ACTIVE'|'INACTIVE';
}
interface UnitRow extends RowDataPacket {
  id: string; organisation_id: string; code: string; name: string; status: 'ACTIVE'|'INACTIVE';
}
interface ProjectRow extends RowDataPacket {
  canonical_object_id: string; code: string; name: string; status: 'ACTIVE'|'INACTIVE';
}
interface ContextRow extends RowDataPacket {
  id: string; tenant_id: string; context_type: OrganisationalContext['contextType'];
  lifecycle: OrganisationalContext['lifecycle']; code: string; name: string;
  organisation_id: string; organisation_unit_id: string|null; function_id: string|null;
  canonical_object_id: string|null; parent_context_id: string|null;
  effective_from: Date; effective_to: Date|null; status: 'ACTIVE'|'INACTIVE';
}
interface RequirementRow extends RowDataPacket {
  id: string; tenant_id: string; requesting_context_id: string; supplying_function_context_id: string;
  job_profile_id: string; role_title: string; description: string; required_headcount: number;
  required_capacity_percent: number|string; effective_from: Date; effective_to: Date|null;
  status: OrganisationalResourceRequirement['status'];
}
interface PositionMatchRow extends RowDataPacket {
  position_id: string; organisation_unit_id: string; person_id: string;
}
interface CountRow extends RowDataPacket { count: number|string; }
interface SumRow extends RowDataPacket { total: number|string|null; }
interface JobRow extends RowDataPacket { id: string; }

export class OrganisationalResourcePlanningCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ) {
    super(message);
    this.name='OrganisationalResourcePlanningCommandError';
  }
}

function required(value:string|undefined,label:string) {
  const result=value?.trim()??'';
  if(!result) throw new OrganisationalResourcePlanningCommandError(`${label} is required.`,'INVALID_INPUT');
  return result;
}
function optional(value:string|undefined) {
  const result=value?.trim()??'';
  return result||undefined;
}
function dateValue(value:string|undefined,label:string,defaultNow=false) {
  const raw=optional(value);
  const parsed=raw?new Date(raw):(defaultNow?new Date():undefined);
  if(!parsed || Number.isNaN(parsed.getTime())) {
    throw new OrganisationalResourcePlanningCommandError(`${label} must be a valid date/time.`,'INVALID_INPUT');
  }
  return parsed.toISOString();
}
function optionalDate(value:string|undefined,label:string) {
  const raw=optional(value);
  if(!raw) return undefined;
  return dateValue(raw,label);
}
function integer(value:number|string,label:string) {
  const n=Number(value);
  if(!Number.isInteger(n)||n<1) throw new OrganisationalResourcePlanningCommandError(`${label} must be a positive whole number.`,'INVALID_INPUT');
  return n;
}
function percent(value:number|string,label:string) {
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0||n>100) throw new OrganisationalResourcePlanningCommandError(`${label} must be greater than 0 and no more than 100.`,'INVALID_INPUT');
  return n;
}
function dbDate(value?:string) { return value?new Date(value):null; }
function isDuplicate(error:unknown) {
  return typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY';
}
function mapError(error:unknown):never {
  if(error instanceof OrganisationalResourcePlanningCommandError) throw error;
  if(isDuplicate(error)) throw new OrganisationalResourcePlanningCommandError('An equivalent organisational resource record already exists.','CONFLICT');
  if(error instanceof Error && /must|required|cannot|invalid|precede|greater|less|belong|reference/i.test(error.message)) {
    throw new OrganisationalResourcePlanningCommandError(error.message,'INVALID_INPUT');
  }
  throw error;
}
function mapContext(row:ContextRow):OrganisationalContext {
  return {
    id:row.id as OrganisationalContext['id'],
    tenantId:row.tenant_id as TenantId,
    contextType:row.context_type,
    lifecycle:row.lifecycle,
    code:row.code,
    name:row.name,
    organisationId:row.organisation_id as OrganisationalContext['organisationId'],
    ...(row.organisation_unit_id?{organisationUnitId:row.organisation_unit_id as NonNullable<OrganisationalContext['organisationUnitId']>}:{}),
    ...(row.function_id?{functionId:row.function_id as NonNullable<OrganisationalContext['functionId']>}:{}),
    ...(row.canonical_object_id?{canonicalObjectId:row.canonical_object_id as NonNullable<OrganisationalContext['canonicalObjectId']>}:{}),
    ...(row.parent_context_id?{parentContextId:row.parent_context_id as NonNullable<OrganisationalContext['parentContextId']>}:{}),
    effectiveFrom:row.effective_from.toISOString(),
    ...(row.effective_to?{effectiveTo:row.effective_to.toISOString()}:{}),
    status:row.status
  };
}
function mapRequirement(row:RequirementRow):OrganisationalResourceRequirement {
  return {
    id:row.id as OrganisationalResourceRequirement['id'],
    tenantId:row.tenant_id as TenantId,
    requestingContextId:row.requesting_context_id as OrganisationalResourceRequirement['requestingContextId'],
    supplyingFunctionContextId:row.supplying_function_context_id as OrganisationalResourceRequirement['supplyingFunctionContextId'],
    jobProfileId:row.job_profile_id as OrganisationalResourceRequirement['jobProfileId'],
    roleTitle:row.role_title,
    description:row.description,
    requiredHeadcount:Number(row.required_headcount),
    requiredCapacityPercent:Number(row.required_capacity_percent),
    effectiveFrom:row.effective_from.toISOString(),
    ...(row.effective_to?{effectiveTo:row.effective_to.toISOString()}:{}),
    status:row.status
  };
}

async function writeAudit(
  connection:PoolConnection,tenantId:string,entityType:string,entityId:string,
  action:string,actorPersonId:string,payload:unknown
) {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
     VALUES (?,?,?,?,?,?,?)`,
    [tenantId,entityType,entityId,action,actorPersonId,'ORG-RESOURCE-PLANNING',JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection,{
    tenantId,aggregateType:entityType,aggregateId:entityId,eventType:`${entityType}.${action}`,payload
  });
}

export class MySqlOrganisationalResourcePlanningCommandService {
  private readonly access:MySqlAccessRepository;
  constructor(private readonly pool:Pool) { this.access=new MySqlAccessRepository(pool); }

  async registerFunctionContext(
    tenantId:TenantId,actorPersonId:string,
    input:{functionId:string;organisationId:string;organisationUnitId:string;effectiveFrom?:string}
  ):Promise<OrganisationalContext> {
    await this.requirePermission(tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_MANAGE);
    const functionId=required(input.functionId,'Function');
    const organisationId=required(input.organisationId,'Organisation');
    const organisationUnitId=required(input.organisationUnitId,'Organisation Unit');
    const effectiveFrom=dateValue(input.effectiveFrom,'Effective from',true);
    try {
      return await withTransaction(this.pool,async(connection)=>{
        const [fnRows]=await connection.execute<FunctionRow[]>(
          `SELECT id,code,name,status FROM function_definitions WHERE id=? AND status='ACTIVE'`,[functionId]
        );
        const fn=fnRows[0];
        if(!fn) throw new OrganisationalResourcePlanningCommandError('Function was not found or is inactive.','NOT_FOUND');
        const [orgRows]=await connection.execute<OrganisationRow[]>(
          `SELECT id,status FROM organisations WHERE tenant_id=? AND id=? AND status='ACTIVE'`,[tenantId,organisationId]
        );
        if(!orgRows[0]) throw new OrganisationalResourcePlanningCommandError('Organisation was not found or is inactive.','NOT_FOUND');
        const [unitRows]=await connection.execute<UnitRow[]>(
          `SELECT id,organisation_id,code,name,status FROM organisation_units
            WHERE tenant_id=? AND id=? AND organisation_id=? AND status='ACTIVE'`,
          [tenantId,organisationUnitId,organisationId]
        );
        const unit=unitRows[0];
        if(!unit) throw new OrganisationalResourcePlanningCommandError('Organisation Unit was not found in the selected Organisation.','NOT_FOUND');

        const context:OrganisationalContext={
          id:asId<'OrganisationalContextId'>(`OCTX-${randomUUID()}`,'Organisational Context'),
          tenantId,contextType:'FUNCTION',lifecycle:'PERMANENT',
          code:fn.code,name:fn.name,
          organisationId:organisationId as OrganisationalContext['organisationId'],
          organisationUnitId:organisationUnitId as NonNullable<OrganisationalContext['organisationUnitId']>,
          functionId:fn.id as NonNullable<OrganisationalContext['functionId']>,
          effectiveFrom,status:'ACTIVE'
        };
        createOrganisationalContext(context);
        await connection.execute(
          `INSERT INTO organisational_contexts
            (id,tenant_id,context_type,lifecycle,code,name,organisation_id,organisation_unit_id,function_id,
             canonical_object_id,parent_context_id,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,NULL,NULL,?,NULL,?,?,?)`,
          [context.id,tenantId,context.contextType,context.lifecycle,context.code,context.name,context.organisationId,
           context.organisationUnitId,context.functionId,new Date(context.effectiveFrom),context.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'ORGANISATIONAL_CONTEXT',context.id,'CREATED',actorPersonId,context);
        return context;
      });
    } catch(error) { return mapError(error); }
  }

  async registerProjectContext(
    tenantId:TenantId,actorPersonId:string,
    input:{projectObjectId:string;organisationId:string;parentContextId?:string;effectiveFrom?:string;effectiveTo?:string}
  ):Promise<OrganisationalContext> {
    await this.requirePermission(tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_MANAGE);
    const projectObjectId=required(input.projectObjectId,'Project');
    const organisationId=required(input.organisationId,'Organisation');
    const parentContextId=optional(input.parentContextId);
    const effectiveFrom=dateValue(input.effectiveFrom,'Effective from',true);
    const effectiveTo=optionalDate(input.effectiveTo,'Effective to');
    try {
      return await withTransaction(this.pool,async(connection)=>{
        const [projectRows]=await connection.execute<ProjectRow[]>(
          `SELECT canonical_object_id,code,name,status FROM construction_context_profiles
            WHERE tenant_id=? AND canonical_object_id=? AND context_type='PROJECT' AND status='ACTIVE'`,
          [tenantId,projectObjectId]
        );
        const project=projectRows[0];
        if(!project) throw new OrganisationalResourcePlanningCommandError('Active Project context was not found.','NOT_FOUND');
        const [orgRows]=await connection.execute<OrganisationRow[]>(
          `SELECT id,status FROM organisations WHERE tenant_id=? AND id=? AND status='ACTIVE'`,[tenantId,organisationId]
        );
        if(!orgRows[0]) throw new OrganisationalResourcePlanningCommandError('Organisation was not found or is inactive.','NOT_FOUND');
        const parent=parentContextId?await this.requireContext(connection,tenantId,parentContextId):undefined;
        const context:OrganisationalContext={
          id:asId<'OrganisationalContextId'>(`OCTX-${randomUUID()}`,'Organisational Context'),
          tenantId,contextType:'PROJECT',lifecycle:'TEMPORARY',code:project.code,name:project.name,
          organisationId:organisationId as OrganisationalContext['organisationId'],
          canonicalObjectId:projectObjectId as NonNullable<OrganisationalContext['canonicalObjectId']>,
          ...(parent?{parentContextId:parent.id}:{}),
          effectiveFrom,...(effectiveTo?{effectiveTo}:{}),status:'ACTIVE'
        };
        createOrganisationalContext(context,parent);
        await connection.execute(
          `INSERT INTO organisational_contexts
            (id,tenant_id,context_type,lifecycle,code,name,organisation_id,organisation_unit_id,function_id,
             canonical_object_id,parent_context_id,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,NULL,NULL,?,?,?,?,?,?,?)`,
          [context.id,tenantId,context.contextType,context.lifecycle,context.code,context.name,context.organisationId,
           context.canonicalObjectId,context.parentContextId??null,new Date(context.effectiveFrom),dbDate(context.effectiveTo),
           context.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'ORGANISATIONAL_CONTEXT',context.id,'CREATED',actorPersonId,context);
        return context;
      });
    } catch(error) { return mapError(error); }
  }

  async createResourceRequirement(
    tenantId:TenantId,actorPersonId:string,
    input:{
      requestingContextId:string;supplyingFunctionContextId:string;jobProfileId:string;
      roleTitle:string;description:string;requiredHeadcount:number|string;requiredCapacityPercent:number|string;
      effectiveFrom:string;effectiveTo?:string;
    }
  ):Promise<OrganisationalResourceRequirement> {
    await this.requirePermission(tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_MANAGE);
    const requestingContextId=required(input.requestingContextId,'Requesting context');
    const supplyingFunctionContextId=required(input.supplyingFunctionContextId,'Supplying Function');
    const jobProfileId=required(input.jobProfileId,'Job Profile');
    const effectiveFrom=dateValue(input.effectiveFrom,'Effective from');
    const effectiveTo=optionalDate(input.effectiveTo,'Effective to');
    try {
      return await withTransaction(this.pool,async(connection)=>{
        const [requesting,supplying]=await Promise.all([
          this.requireContext(connection,tenantId,requestingContextId),
          this.requireContext(connection,tenantId,supplyingFunctionContextId)
        ]);
        const [jobs]=await connection.execute<JobRow[]>(
          `SELECT id FROM job_profiles WHERE id=? AND status='ACTIVE'
            AND (catalogue_scope='PLATFORM' OR tenant_id=?)`,[jobProfileId,tenantId]
        );
        if(!jobs[0]) throw new OrganisationalResourcePlanningCommandError('Job Profile was not found or is unavailable to this tenant.','NOT_FOUND');
        const requirement:OrganisationalResourceRequirement={
          id:asId<'OrganisationalResourceRequirementId'>(`ORR-${randomUUID()}`,'Organisational Resource Requirement'),
          tenantId,
          requestingContextId:requesting.id,
          supplyingFunctionContextId:supplying.id,
          jobProfileId:jobProfileId as OrganisationalResourceRequirement['jobProfileId'],
          roleTitle:required(input.roleTitle,'Role title'),
          description:required(input.description,'Requirement description'),
          requiredHeadcount:integer(input.requiredHeadcount,'Required headcount'),
          requiredCapacityPercent:percent(input.requiredCapacityPercent,'Required capacity'),
          effectiveFrom,...(effectiveTo?{effectiveTo}:{}),status:'OPEN'
        };
        createOrganisationalResourceRequirement(requirement,requesting,supplying);
        await connection.execute(
          `INSERT INTO organisational_resource_requirements
            (id,tenant_id,requesting_context_id,supplying_function_context_id,job_profile_id,role_title,description,
             required_headcount,required_capacity_percent,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [requirement.id,tenantId,requirement.requestingContextId,requirement.supplyingFunctionContextId,
           requirement.jobProfileId,requirement.roleTitle,requirement.description,requirement.requiredHeadcount,
           requirement.requiredCapacityPercent,new Date(requirement.effectiveFrom),dbDate(requirement.effectiveTo),
           requirement.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'ORGANISATIONAL_RESOURCE_REQUIREMENT',requirement.id,'CREATED',actorPersonId,requirement);
        return requirement;
      });
    } catch(error) { return mapError(error); }
  }

  async fulfilResourceRequirement(
    tenantId:TenantId,actorPersonId:string,
    input:{requirementId:string;personId:string;requirementSharePercent:number|string;resourceCapacityPercent?:number|string}
  ):Promise<OrganisationalResourceFulfilment> {
    await this.requirePermission(tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.RESOURCE_PLANNING_FULFIL);
    const requirementId=required(input.requirementId,'Resource Requirement');
    const personId=required(input.personId,'Person');
    const share=percent(input.requirementSharePercent,'Requirement share');
    try {
      return await withTransaction(this.pool,async(connection)=>{
        const requirement=await this.requireRequirementForUpdate(connection,tenantId,requirementId);
        if(requirement.status==='CANCELLED'||requirement.status==='FULFILLED') {
          throw new OrganisationalResourcePlanningCommandError('Resource Requirement is not open for further fulfilment.','CONFLICT');
        }
        const [requesting,supplying]=await Promise.all([
          this.requireContext(connection,tenantId,requirement.requestingContextId),
          this.requireContext(connection,tenantId,requirement.supplyingFunctionContextId)
        ]);
        if(requesting.contextType!=='PROJECT'||!requesting.canonicalObjectId) {
          throw new OrganisationalResourcePlanningCommandError('The first resource-planning slice fulfils Project organisational contexts only.','INVALID_INPUT');
        }
        if(supplying.contextType!=='FUNCTION'||!supplying.functionId||!supplying.organisationUnitId) {
          throw new OrganisationalResourcePlanningCommandError('Supplying context must be a configured Function organisation.','INVALID_INPUT');
        }

        const [positionRows]=await connection.execute<PositionMatchRow[]>(
          `WITH RECURSIVE function_units AS (
             SELECT id FROM organisation_units
              WHERE tenant_id=? AND id=? AND organisation_id=? AND status='ACTIVE'
             UNION ALL
             SELECT ou.id FROM organisation_units ou
             JOIN function_units fu ON ou.parent_unit_id=fu.id
              WHERE ou.tenant_id=? AND ou.organisation_id=? AND ou.status='ACTIVE'
           )
           SELECT p.id AS position_id,p.organisation_unit_id,po.person_id
             FROM position_occupancies po
             JOIN positions p ON p.tenant_id=po.tenant_id AND p.id=po.position_id
             JOIN persons pe ON pe.tenant_id=po.tenant_id AND pe.id=po.person_id
             JOIN function_units fu ON fu.id=p.organisation_unit_id
            WHERE po.tenant_id=? AND po.person_id=? AND p.job_profile_id=?
              AND p.status='ACTIVE' AND pe.status='ACTIVE'
              AND po.effective_from<=?
              AND (po.effective_to IS NULL OR po.effective_to>=?)
            ORDER BY po.effective_from DESC LIMIT 1`,
          [
            tenantId,supplying.organisationUnitId,supplying.organisationId,
            tenantId,supplying.organisationId,
            tenantId,personId,requirement.jobProfileId,
            dbDate(requirement.effectiveTo??requirement.effectiveFrom),new Date(requirement.effectiveFrom)
          ]
        );
        const match=positionRows[0];
        if(!match) {
          throw new OrganisationalResourcePlanningCommandError(
            'The selected Person does not currently occupy a matching Position within the supplying Function organisation.',
            'INVALID_INPUT'
          );
        }

        const [shareRows]=await connection.execute<SumRow[]>(
          `SELECT COALESCE(SUM(requirement_share_percent),0) AS total
             FROM organisational_resource_fulfilments
            WHERE tenant_id=? AND requirement_id=? AND status='ACTIVE' FOR UPDATE`,
          [tenantId,requirement.id]
        );
        const existingShare=Number(shareRows[0]?.total??0);
        if(existingShare+share>100.00001) {
          throw new OrganisationalResourcePlanningCommandError('Resource fulfilment would exceed 100 percent of the Project requirement.','CONFLICT');
        }

        const capacity=percent(input.resourceCapacityPercent??requirement.requiredCapacityPercent,'Resource capacity');
        const [capacityRows]=await connection.execute<SumRow[]>(
          `SELECT COALESCE(SUM(resource_capacity_percent),0) AS total
             FROM organisational_resource_fulfilments
            WHERE tenant_id=? AND person_id=? AND status='ACTIVE'
              AND effective_from<=?
              AND (effective_to IS NULL OR effective_to>=?) FOR UPDATE`,
          [tenantId,personId,dbDate(requirement.effectiveTo??'9999-12-31T23:59:59.000Z'),new Date(requirement.effectiveFrom)]
        );
        const allocated=Number(capacityRows[0]?.total??0);
        if(allocated+capacity>100.00001) {
          throw new OrganisationalResourcePlanningCommandError(
            `The selected Person has only ${Math.max(0,100-allocated).toFixed(2)}% capacity available for the requested period.`,
            'CONFLICT'
          );
        }

        const deployment:FunctionalDeployment={
          id:asId<'FunctionalDeploymentId'>(`DEPLOY-${randomUUID()}`,'Functional Deployment'),
          tenantId,functionId:supplying.functionId,deploymentPurpose:'FUNCTIONAL_DELIVERY',
          organisationId:supplying.organisationId,organisationUnitId:supplying.organisationUnitId,
          contextType:'PROJECT',contextObjectId:requesting.canonicalObjectId,
          scopeDescription:`${requesting.code} · ${requirement.roleTitle}: ${requirement.description}`,
          effectiveFrom:requirement.effectiveFrom,...(requirement.effectiveTo?{effectiveTo:requirement.effectiveTo}:{}),
          status:'ACTIVE'
        };
        const assignment:DeploymentAssignment={
          id:asId<'DeploymentAssignmentId'>(`DASG-${randomUUID()}`,'Deployment Assignment'),
          tenantId,functionalDeploymentId:deployment.id,assigneeType:'PERSON',assigneeId:personId,
          jobProfileId:requirement.jobProfileId,responsibilityRole:'RESPONSIBLE',
          effectiveFrom:requirement.effectiveFrom,...(requirement.effectiveTo?{effectiveTo:requirement.effectiveTo}:{}),
          status:'ACTIVE'
        };
        const capacityRecord:DeploymentCapacity={
          id:asId<'DeploymentCapacityId'>(`DCAP-${randomUUID()}`,'Deployment Capacity'),
          tenantId,deploymentAssignmentId:assignment.id,capacityPercent:capacity,
          effectiveFrom:requirement.effectiveFrom,...(requirement.effectiveTo?{effectiveTo:requirement.effectiveTo}:{}),
          status:'ACTIVE'
        };

        await connection.execute(
          `INSERT INTO functional_deployments
            (id,tenant_id,function_id,sub_function_id,deployment_purpose,organisation_id,organisation_unit_id,
             context_type,context_object_id,scope_description,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,NULL,?,?,?,?,?,?,?,?,?,?,?)`,
          [deployment.id,tenantId,deployment.functionId,deployment.deploymentPurpose,deployment.organisationId,
           deployment.organisationUnitId,deployment.contextType,deployment.contextObjectId,deployment.scopeDescription,
           new Date(deployment.effectiveFrom),dbDate(deployment.effectiveTo),deployment.status,actorPersonId,actorPersonId]
        );
        await connection.execute(
          `INSERT INTO deployment_assignments
            (id,tenant_id,functional_deployment_id,assignee_type,assignee_id,job_profile_id,responsibility_role,
             effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
          [assignment.id,tenantId,assignment.functionalDeploymentId,assignment.assigneeType,assignment.assigneeId,
           assignment.jobProfileId,assignment.responsibilityRole,new Date(assignment.effectiveFrom),dbDate(assignment.effectiveTo),
           assignment.status,actorPersonId,actorPersonId]
        );
        await connection.execute(
          `INSERT INTO deployment_capacities
            (id,tenant_id,deployment_assignment_id,capacity_percent,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [capacityRecord.id,tenantId,capacityRecord.deploymentAssignmentId,capacityRecord.capacityPercent,
           new Date(capacityRecord.effectiveFrom),dbDate(capacityRecord.effectiveTo),capacityRecord.status,actorPersonId,actorPersonId]
        );

        const fulfilment:OrganisationalResourceFulfilment={
          id:asId<'OrganisationalResourceFulfilmentId'>(`ORF-${randomUUID()}`,'Organisational Resource Fulfilment'),
          tenantId,requirementId:requirement.id,
          personId:personId as OrganisationalResourceFulfilment['personId'],
          positionId:match.position_id as OrganisationalResourceFulfilment['positionId'],
          requirementSharePercent:share,resourceCapacityPercent:capacity,
          functionalDeploymentId:deployment.id,deploymentAssignmentId:assignment.id,
          effectiveFrom:requirement.effectiveFrom,...(requirement.effectiveTo?{effectiveTo:requirement.effectiveTo}:{}),
          status:'ACTIVE'
        };
        createOrganisationalResourceFulfilment(fulfilment,requirement);
        await connection.execute(
          `INSERT INTO organisational_resource_fulfilments
            (id,tenant_id,requirement_id,person_id,position_id,requirement_share_percent,resource_capacity_percent,
             functional_deployment_id,deployment_assignment_id,effective_from,effective_to,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [fulfilment.id,tenantId,fulfilment.requirementId,fulfilment.personId,fulfilment.positionId,
           fulfilment.requirementSharePercent,fulfilment.resourceCapacityPercent,fulfilment.functionalDeploymentId,
           fulfilment.deploymentAssignmentId,new Date(fulfilment.effectiveFrom),dbDate(fulfilment.effectiveTo),
           fulfilment.status,actorPersonId,actorPersonId]
        );

        const total=existingShare+share;
        const nextStatus:OrganisationalResourceRequirement['status']=total>=99.99999?'FULFILLED':'PARTIALLY_FULFILLED';
        await connection.execute(
          `UPDATE organisational_resource_requirements SET status=?,updated_by_person_id=?,row_version=row_version+1
            WHERE tenant_id=? AND id=?`,
          [nextStatus,actorPersonId,tenantId,requirement.id]
        );
        await writeAudit(connection,tenantId,'FUNCTIONAL_DEPLOYMENT',deployment.id,'CREATED',actorPersonId,deployment);
        await writeAudit(connection,tenantId,'DEPLOYMENT_ASSIGNMENT',assignment.id,'CREATED',actorPersonId,assignment);
        await writeAudit(connection,tenantId,'DEPLOYMENT_CAPACITY',capacityRecord.id,'CREATED',actorPersonId,capacityRecord);
        await writeAudit(connection,tenantId,'ORGANISATIONAL_RESOURCE_FULFILMENT',fulfilment.id,'CREATED',actorPersonId,fulfilment);
        await writeAudit(connection,tenantId,'ORGANISATIONAL_RESOURCE_REQUIREMENT',requirement.id,'STATUS_CHANGED',actorPersonId,{from:requirement.status,to:nextStatus});
        return fulfilment;
      });
    } catch(error) { return mapError(error); }
  }

  private async requirePermission(tenantId:TenantId,personId:string,permissionKey:string) {
    const evaluation=await this.access.evaluatePermission(tenantId,personId,permissionKey,{scopeType:'TENANT'});
    if(!evaluation.allowed) throw new OrganisationalResourcePlanningCommandError(evaluation.reason,'PERMISSION_DENIED');
  }

  private async requireContext(connection:PoolConnection,tenantId:TenantId,id:string):Promise<OrganisationalContext> {
    const [rows]=await connection.execute<ContextRow[]>(
      `SELECT id,tenant_id,context_type,lifecycle,code,name,organisation_id,organisation_unit_id,function_id,
              canonical_object_id,parent_context_id,effective_from,effective_to,status
         FROM organisational_contexts WHERE tenant_id=? AND id=?`,[tenantId,id]
    );
    if(!rows[0]) throw new OrganisationalResourcePlanningCommandError('Organisational Context was not found.','NOT_FOUND');
    return mapContext(rows[0]);
  }

  private async requireRequirementForUpdate(
    connection:PoolConnection,tenantId:TenantId,id:string
  ):Promise<OrganisationalResourceRequirement> {
    const [rows]=await connection.execute<RequirementRow[]>(
      `SELECT id,tenant_id,requesting_context_id,supplying_function_context_id,job_profile_id,role_title,description,
              required_headcount,required_capacity_percent,effective_from,effective_to,status
         FROM organisational_resource_requirements WHERE tenant_id=? AND id=? FOR UPDATE`,[tenantId,id]
    );
    if(!rows[0]) throw new OrganisationalResourcePlanningCommandError('Resource Requirement was not found.','NOT_FOUND');
    return mapRequirement(rows[0]);
  }
}
