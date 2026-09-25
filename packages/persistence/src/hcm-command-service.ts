import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  createEmployment,
  createPositionFunctionAssignment,
  createPositionReportingLine,
  type Employment,
  type EmploymentStatus,
  type EmploymentType,
  type JobProfile,
  type Organisation,
  type Person,
  type Position,
  type PositionFunctionAssignment,
  type PositionReportingLine,
  type PositionReportingRelationshipType,
  type TenantId,
  type WorkerType,
  type WorkRelationshipType,
  type DeploymentPurpose
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

interface PersonRow extends RowDataPacket {
  id:string; tenant_id:string; party_id:string; legal_name:string; preferred_name:string|null; status:'ACTIVE'|'INACTIVE';
}
interface OrganisationRow extends RowDataPacket {
  id:string; tenant_id:string; party_id:string; legal_name:string; trading_name:string|null; status:'ACTIVE'|'INACTIVE';
}
interface PositionRow extends RowDataPacket {
  id:string; tenant_id:string; organisation_unit_id:string; job_profile_id:string|null;
  code:string; title:string; lifecycle_status:Position['lifecycleStatus']; incumbency_model:Position['incumbencyModel'];
  authorised_fte:string|number; effective_from:Date; effective_to:Date|null; status:'ACTIVE'|'INACTIVE';
}
interface EmploymentRow extends RowDataPacket {
  id:string; tenant_id:string; person_id:string; organisation_id:string; employee_number:string;
  assignment_id:string; relationship_type:WorkRelationshipType; is_primary:number|boolean;
  worker_type:WorkerType; employment_type:EmploymentType; start_date:Date; end_date:Date|null; status:EmploymentStatus;
}
interface FunctionRow extends RowDataPacket { id:string; code:string; name:string; status:'ACTIVE'|'INACTIVE'; }
interface CountRow extends RowDataPacket { count:number|string; }

export class HcmCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ){
    super(message);
    this.name='HcmCommandError';
  }
}

function required(value:string|undefined,label:string){
  const result=value?.trim()??'';
  if(!result) throw new HcmCommandError(`${label} is required.`,'INVALID_INPUT');
  return result;
}
function optional(value:string|undefined){
  const result=value?.trim()??'';
  return result||undefined;
}
function dateValue(value:string|undefined,label:string,defaultNow=false){
  const raw=optional(value);
  const date=raw?new Date(raw):(defaultNow?new Date():undefined);
  if(!date||Number.isNaN(date.getTime())) throw new HcmCommandError(`${label} must be a valid date/time.`,'INVALID_INPUT');
  return date.toISOString();
}
function optionalDate(value:string|undefined,label:string){
  const raw=optional(value);
  return raw?dateValue(raw,label):undefined;
}
function dbDate(value:string|undefined){return value?new Date(value):null;}
function farFuture(value:string|undefined){return value?new Date(value):new Date('9999-12-31T23:59:59.000Z');}
function duplicate(error:unknown){
  return typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY';
}
function mapError(error:unknown):never{
  if(error instanceof HcmCommandError) throw error;
  if(duplicate(error)) throw new HcmCommandError('An equivalent HCM record already exists.','CONFLICT');
  if(error instanceof Error&&/must|required|cannot|invalid|precede|belong|reference|active/i.test(error.message)){
    throw new HcmCommandError(error.message,'INVALID_INPUT');
  }
  throw error;
}

async function writeAudit(
  connection:PoolConnection,tenantId:string,entityType:string,entityId:string,
  action:string,actorPersonId:string,payload:unknown
){
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
     VALUES (?,?,?,?,?,?,?)`,
    [tenantId,entityType,entityId,action,actorPersonId,'HCM-AUTHORITY',JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection,{
    tenantId,aggregateType:entityType,aggregateId:entityId,eventType:`${entityType}.${action}`,payload
  });
}

export class MySqlHcmCommandService {
  private readonly access:MySqlAccessRepository;
  constructor(private readonly pool:Pool){this.access=new MySqlAccessRepository(pool);}

  async createJobProfile(
    tenantId:TenantId,actorPersonId:string,
    input:{code:string;name:string}
  ):Promise<JobProfile>{
    await this.requireManage(tenantId,actorPersonId);
    const code=required(input.code,'Job Profile code').toUpperCase();
    const name=required(input.name,'Job Profile name');
    const profile:JobProfile={
      id:asId<'JobProfileId'>(`JOB-${randomUUID()}`,'Job Profile'),
      catalogueScope:'TENANT',tenantId,code,name,status:'ACTIVE'
    };
    try{
      await withTransaction(this.pool,async connection=>{
        await connection.execute(
          `INSERT INTO job_profiles
            (id,catalogue_scope,tenant_id,code,name,status,created_by_person_id,updated_by_person_id)
           VALUES (?,'TENANT',?,?,?,?,?,?)`,
          [profile.id,tenantId,profile.code,profile.name,profile.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'JOB_PROFILE',profile.id,'CREATED',actorPersonId,profile);
      });
      return profile;
    }catch(error){return mapError(error);}
  }

  async createEmployment(
    tenantId:TenantId,actorPersonId:string,
    input:{
      personId:string;organisationId:string;employeeNumber:string;assignmentId?:string;
      relationshipType?:WorkRelationshipType;isPrimary?:boolean;workerType:WorkerType;
      employmentType:EmploymentType;startDate:string;endDate?:string;status?:EmploymentStatus;
    }
  ):Promise<Employment>{
    await this.requireManage(tenantId,actorPersonId);
    const personId=required(input.personId,'Person');
    const organisationId=required(input.organisationId,'Organisation');
    const startDate=dateValue(input.startDate,'Employment start date');
    const endDate=optionalDate(input.endDate,'Employment end date');
    const status=input.status??'ACTIVE';
    const relationshipType=input.relationshipType??(input.workerType==='CONTINGENT'?'CONTINGENT_ENGAGEMENT':'PRIMARY_EMPLOYMENT');
    const isPrimary=input.isPrimary??relationshipType==='PRIMARY_EMPLOYMENT';
    if(input.workerType==='CONTINGENT'&&relationshipType!=='CONTINGENT_ENGAGEMENT') throw new HcmCommandError('Contingent workers require a CONTINGENT_ENGAGEMENT work relationship.','INVALID_INPUT');
    if(input.workerType==='EMPLOYEE'&&relationshipType==='CONTINGENT_ENGAGEMENT') throw new HcmCommandError('Employees cannot use a CONTINGENT_ENGAGEMENT work relationship.','INVALID_INPUT');
    if(isPrimary&&relationshipType!=='PRIMARY_EMPLOYMENT') throw new HcmCommandError('Only PRIMARY_EMPLOYMENT may be marked as the primary work relationship.','INVALID_INPUT');
    const employment:Employment={
      id:asId<'EmploymentId'>(`EMP-${randomUUID()}`,'Employment'),tenantId,
      personId:personId as Employment['personId'],
      organisationId:organisationId as Employment['organisationId'],
      employeeNumber:required(input.employeeNumber,'Employee number').toUpperCase(),
      assignmentId:(optional(input.assignmentId)??`WR-${randomUUID()}`).toUpperCase(),relationshipType,isPrimary,
      workerType:input.workerType,employmentType:input.employmentType,startDate,
      ...(endDate?{endDate}:{}),status
    };
    try{
      return await withTransaction(this.pool,async connection=>{
        const [person,organisation]=await Promise.all([
          this.requirePerson(connection,tenantId,personId),
          this.requireOrganisation(connection,tenantId,organisationId)
        ]);
        createEmployment(employment,person,organisation);
        if(employment.isPrimary){
          const [rows]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM employments
              WHERE tenant_id=? AND person_id=? AND is_primary=TRUE
                AND status IN ('PENDING','ACTIVE','SUSPENDED')
                AND start_date<=? AND (end_date IS NULL OR end_date>=?)`,
            [tenantId,employment.personId,farFuture(employment.endDate),new Date(employment.startDate)]
          );
          if(Number(rows[0]?.count??0)>0) throw new HcmCommandError('Person already has an overlapping primary work relationship.','CONFLICT');
        }
        await connection.execute(
          `INSERT INTO employments
            (id,tenant_id,person_id,organisation_id,employee_number,assignment_id,relationship_type,is_primary,
             worker_type,employment_type,start_date,end_date,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [employment.id,tenantId,employment.personId,employment.organisationId,employment.employeeNumber,
           employment.assignmentId,employment.relationshipType,employment.isPrimary,employment.workerType,employment.employmentType,
           new Date(employment.startDate),dbDate(employment.endDate),employment.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'EMPLOYMENT',employment.id,'CREATED',actorPersonId,employment);
        return employment;
      });
    }catch(error){return mapError(error);}
  }

  async assignPositionToFunction(
    tenantId:TenantId,actorPersonId:string,
    input:{
      positionId:string;functionId:string;deploymentPurpose:DeploymentPurpose;isPrimary?:boolean;
      effectiveFrom?:string;effectiveTo?:string;
    }
  ):Promise<PositionFunctionAssignment>{
    await this.requireManage(tenantId,actorPersonId);
    const positionId=required(input.positionId,'Position');
    const functionId=required(input.functionId,'Function');
    const effectiveFrom=dateValue(input.effectiveFrom,'Effective from',true);
    const effectiveTo=optionalDate(input.effectiveTo,'Effective to');
    const isPrimary=input.isPrimary??true;
    try{
      return await withTransaction(this.pool,async connection=>{
        const position=await this.requirePosition(connection,tenantId,positionId);
        const [functionRows]=await connection.execute<FunctionRow[]>(
          `SELECT id,code,name,status FROM function_definitions WHERE id=? AND status='ACTIVE'`,[functionId]
        );
        const fn=functionRows[0];
        if(!fn) throw new HcmCommandError('Function was not found or is inactive.','NOT_FOUND');

        if(isPrimary){
          const [rows]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM position_function_assignments
              WHERE tenant_id=? AND position_id=? AND is_primary=TRUE AND status='ACTIVE'
                AND effective_from<=?
                AND (effective_to IS NULL OR effective_to>=?)`,
            [tenantId,positionId,farFuture(effectiveTo),new Date(effectiveFrom)]
          );
          if(Number(rows[0]?.count??0)>0){
            throw new HcmCommandError('Position already has an overlapping primary Function assignment.','CONFLICT');
          }
        }

        const assignment:PositionFunctionAssignment={
          id:asId<'PositionFunctionAssignmentId'>(`PFA-${randomUUID()}`,'Position Function Assignment'),
          tenantId,positionId:position.id,
          functionId:fn.id as PositionFunctionAssignment['functionId'],
          deploymentPurpose:input.deploymentPurpose,isPrimary,effectiveFrom,
          ...(effectiveTo?{effectiveTo}:{}),status:'ACTIVE'
        };
        createPositionFunctionAssignment(assignment,position);
        await connection.execute(
          `INSERT INTO position_function_assignments
            (id,tenant_id,position_id,function_id,deployment_purpose,is_primary,effective_from,effective_to,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [assignment.id,tenantId,assignment.positionId,assignment.functionId,assignment.deploymentPurpose,
           assignment.isPrimary,new Date(assignment.effectiveFrom),dbDate(assignment.effectiveTo),assignment.status,
           actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'POSITION_FUNCTION_ASSIGNMENT',assignment.id,'CREATED',actorPersonId,assignment);
        return assignment;
      });
    }catch(error){return mapError(error);}
  }

  async assignEmploymentToPosition(
    tenantId:TenantId,actorPersonId:string,
    input:{employmentId:string;positionId:string;isPrimary?:boolean;effectiveFrom?:string;effectiveTo?:string}
  ){
    await this.requireManage(tenantId,actorPersonId);
    const employmentId=required(input.employmentId,'Employment');
    const positionId=required(input.positionId,'Position');
    const effectiveFrom=dateValue(input.effectiveFrom,'Position assignment effective from',true);
    const effectiveTo=optionalDate(input.effectiveTo,'Position assignment effective to');
    const isPrimary=input.isPrimary??true;
    try{
      return await withTransaction(this.pool,async connection=>{
        const [employment,position]=await Promise.all([
          this.requireEmployment(connection,tenantId,employmentId),
          this.requirePosition(connection,tenantId,positionId)
        ]);
        if(employment.status!=='ACTIVE'&&employment.status!=='PENDING'){
          throw new HcmCommandError('Employment must be ACTIVE or PENDING before assigning a Position.','INVALID_INPUT');
        }
        if(Date.parse(effectiveFrom)<Date.parse(employment.startDate)||
          (employment.endDate&&Date.parse(effectiveFrom)>Date.parse(employment.endDate))){
          throw new HcmCommandError('Position assignment must start within the Employment period.','INVALID_INPUT');
        }
        if(effectiveTo&&employment.endDate&&Date.parse(effectiveTo)>Date.parse(employment.endDate)){
          throw new HcmCommandError('Position assignment cannot extend beyond the Employment end date.','INVALID_INPUT');
        }
        if(isPrimary){
          const [rows]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM position_occupancies
              WHERE tenant_id=? AND person_id=? AND is_primary=TRUE
                AND effective_from<=?
                AND (effective_to IS NULL OR effective_to>=?)`,
            [tenantId,employment.personId,farFuture(effectiveTo),new Date(effectiveFrom)]
          );
          if(Number(rows[0]?.count??0)>0){
            throw new HcmCommandError('Person already has an overlapping primary Position assignment.','CONFLICT');
          }
        }
        const id=asId<'PositionOccupancyId'>(`OCC-${randomUUID()}`,'Position Occupancy');
        await connection.execute(
          `INSERT INTO position_occupancies
            (id,tenant_id,position_id,person_id,employment_id,is_primary,effective_from,effective_to,created_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [id,tenantId,position.id,employment.personId,employment.id,isPrimary,new Date(effectiveFrom),dbDate(effectiveTo),actorPersonId]
        );
        const payload={id,tenantId,positionId:position.id,personId:employment.personId,employmentId:employment.id,isPrimary,effectiveFrom,...(effectiveTo?{effectiveTo}:{})};
        await writeAudit(connection,tenantId,'POSITION_OCCUPANCY',id,'CREATED',actorPersonId,payload);
        return payload;
      });
    }catch(error){return mapError(error);}
  }

  async setReportingLine(
    tenantId:TenantId,actorPersonId:string,
    input:{
      subordinatePositionId:string;managerPositionId:string;relationshipType?:PositionReportingRelationshipType;
      effectiveFrom?:string;effectiveTo?:string;
    }
  ):Promise<PositionReportingLine>{
    await this.requireManage(tenantId,actorPersonId);
    const subordinatePositionId=required(input.subordinatePositionId,'Subordinate Position');
    const managerPositionId=required(input.managerPositionId,'Manager Position');
    const relationshipType=input.relationshipType??'LINE_MANAGER';
    const effectiveFrom=dateValue(input.effectiveFrom,'Reporting line effective from',true);
    const effectiveTo=optionalDate(input.effectiveTo,'Reporting line effective to');
    try{
      return await withTransaction(this.pool,async connection=>{
        const [subordinate,manager]=await Promise.all([
          this.requirePosition(connection,tenantId,subordinatePositionId),
          this.requirePosition(connection,tenantId,managerPositionId)
        ]);

        if(relationshipType==='LINE_MANAGER'){
          const [existing]=await connection.execute<CountRow[]>(
            `SELECT COUNT(*) AS count FROM position_reporting_lines
              WHERE tenant_id=? AND subordinate_position_id=? AND relationship_type='LINE_MANAGER'
                AND status='ACTIVE' AND effective_from<=?
                AND (effective_to IS NULL OR effective_to>=?)`,
            [tenantId,subordinatePositionId,farFuture(effectiveTo),new Date(effectiveFrom)]
          );
          if(Number(existing[0]?.count??0)>0){
            throw new HcmCommandError('Subordinate Position already has an overlapping line manager.','CONFLICT');
          }
        }

        const [cycleRows]=await connection.query<CountRow[]>(
          `WITH RECURSIVE manager_chain(position_id) AS (
             SELECT ? AS position_id
             UNION ALL
             SELECT pr.manager_position_id
               FROM position_reporting_lines pr
               JOIN manager_chain mc ON pr.subordinate_position_id=mc.position_id
              WHERE pr.tenant_id=? AND pr.status='ACTIVE'
                AND pr.relationship_type IN ('LINE_MANAGER','FUNCTIONAL_MANAGER')
                AND pr.effective_from<=?
                AND (pr.effective_to IS NULL OR pr.effective_to>=?)
           )
           SELECT COUNT(*) AS count FROM manager_chain WHERE position_id=?`,
          [managerPositionId,tenantId,farFuture(effectiveTo),new Date(effectiveFrom),subordinatePositionId]
        );
        if(Number(cycleRows[0]?.count??0)>0){
          throw new HcmCommandError('Reporting line would create a cycle in the Position hierarchy.','CONFLICT');
        }

        const line:PositionReportingLine={
          id:asId<'PositionReportingLineId'>(`PRL-${randomUUID()}`,'Position Reporting Line'),tenantId,
          subordinatePositionId:subordinate.id,managerPositionId:manager.id,relationshipType,effectiveFrom,
          ...(effectiveTo?{effectiveTo}:{}),status:'ACTIVE'
        };
        createPositionReportingLine(line,subordinate,manager);
        await connection.execute(
          `INSERT INTO position_reporting_lines
            (id,tenant_id,subordinate_position_id,manager_position_id,relationship_type,effective_from,effective_to,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?)`,
          [line.id,tenantId,line.subordinatePositionId,line.managerPositionId,line.relationshipType,
           new Date(line.effectiveFrom),dbDate(line.effectiveTo),line.status,actorPersonId,actorPersonId]
        );
        await writeAudit(connection,tenantId,'POSITION_REPORTING_LINE',line.id,'CREATED',actorPersonId,line);
        return line;
      });
    }catch(error){return mapError(error);}
  }

  private async requireManage(tenantId:TenantId,actorPersonId:string){
    const evaluation=await this.access.evaluatePermission(
      tenantId,actorPersonId,PLATFORM_PERMISSION_KEYS.HCM_MANAGE,{scopeType:'TENANT'}
    );
    if(!evaluation.allowed) throw new HcmCommandError(evaluation.reason,'PERMISSION_DENIED');
  }

  private async requirePerson(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Person>{
    const [rows]=await connection.execute<PersonRow[]>(
      `SELECT id,tenant_id,party_id,legal_name,preferred_name,status FROM persons WHERE tenant_id=? AND id=?`,[tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new HcmCommandError('Person was not found in this tenant.','NOT_FOUND');
    return {id:row.id as Person['id'],tenantId:row.tenant_id as TenantId,partyId:row.party_id as Person['partyId'],
      legalName:row.legal_name,...(row.preferred_name?{preferredName:row.preferred_name}:{}),status:row.status};
  }

  private async requireOrganisation(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Organisation>{
    const [rows]=await connection.execute<OrganisationRow[]>(
      `SELECT id,tenant_id,party_id,legal_name,trading_name,status FROM organisations WHERE tenant_id=? AND id=?`,[tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new HcmCommandError('Organisation was not found in this tenant.','NOT_FOUND');
    return {id:row.id as Organisation['id'],tenantId:row.tenant_id as TenantId,partyId:row.party_id as Organisation['partyId'],
      legalName:row.legal_name,...(row.trading_name?{tradingName:row.trading_name}:{}),status:row.status};
  }

  private async requirePosition(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Position>{
    const [rows]=await connection.execute<PositionRow[]>(
      `SELECT id,tenant_id,organisation_unit_id,job_profile_id,code,title,lifecycle_status,incumbency_model,authorised_fte,effective_from,effective_to,status FROM positions WHERE tenant_id=? AND id=?`,[tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new HcmCommandError('Position was not found in this tenant.','NOT_FOUND');
    return {id:row.id as Position['id'],tenantId:row.tenant_id as TenantId,
      organisationUnitId:row.organisation_unit_id as Position['organisationUnitId'],
      ...(row.job_profile_id?{jobProfileId:row.job_profile_id as NonNullable<Position['jobProfileId']>}:{}),
      code:row.code,title:row.title,lifecycleStatus:row.lifecycle_status,incumbencyModel:row.incumbency_model,
      authorisedFte:Number(row.authorised_fte),effectiveFrom:row.effective_from.toISOString(),
      ...(row.effective_to?{effectiveTo:row.effective_to.toISOString()}:{}),status:row.status};
  }

  private async requireEmployment(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Employment>{
    const [rows]=await connection.execute<EmploymentRow[]>(
      `SELECT id,tenant_id,person_id,organisation_id,employee_number,assignment_id,relationship_type,is_primary,
                worker_type,employment_type,start_date,end_date,status
         FROM employments WHERE tenant_id=? AND id=?`,[tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new HcmCommandError('Employment was not found in this tenant.','NOT_FOUND');
    return {id:row.id as Employment['id'],tenantId:row.tenant_id as TenantId,
      personId:row.person_id as Employment['personId'],organisationId:row.organisation_id as Employment['organisationId'],
      employeeNumber:row.employee_number,assignmentId:row.assignment_id,relationshipType:row.relationship_type,
      isPrimary:Boolean(row.is_primary),workerType:row.worker_type,employmentType:row.employment_type,
      startDate:row.start_date.toISOString(),...(row.end_date?{endDate:row.end_date.toISOString()}:{}),status:row.status};
  }
}
