import { randomUUID } from 'node:crypto';
import {
  asId,
  createSalesAccount,
  createSalesOpportunity,
  type CanonicalObjectIdentity,
  type Organisation,
  type Position,
  type SalesAccount,
  type SalesForecastCategory,
  type SalesOpportunity,
  type SalesOpportunityStage,
  type SalesOpportunityStatus,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { withTransaction } from './database.js';
import { MySqlFunctionWorkAuthorizationService } from './function-work-authorization.js';
import { writeOutboxEvent } from './platform-writes.js';
import { upsertPartyType } from './party-type-writes.js';

interface OrganisationRow extends RowDataPacket {
  id:string;tenant_id:string;party_id:string;legal_name:string;trading_name:string|null;status:'ACTIVE'|'INACTIVE';
}
interface PositionRow extends RowDataPacket {
  id:string;tenant_id:string;organisation_unit_id:string;job_profile_id:string|null;code:string;title:string;status:'ACTIVE'|'INACTIVE';
}
interface AccountRow extends RowDataPacket {
  id:string;tenant_id:string;canonical_object_id:string;organisation_id:string;code:string;
  owner_position_id:string;segment:string|null;status:'ACTIVE'|'INACTIVE';created_at:Date;row_version:number|string;
}
interface OpportunityRow extends RowDataPacket {
  id:string;tenant_id:string;canonical_object_id:string;sales_account_id:string;code:string;title:string;description:string;
  owner_position_id:string;stage:SalesOpportunityStage;probability_percent:string|number;estimated_value:string|number;
  currency:string;expected_close_date:Date|null;forecast_category:SalesForecastCategory;status:SalesOpportunityStatus;
  created_at:Date;row_version:number|string;
}
interface IdRow extends RowDataPacket { id:string; }
interface BindingRow extends RowDataPacket { type_definition_id:string; }
interface RelationshipBindingRow extends RowDataPacket { relationship_type_definition_id:string; }
interface FunctionAssignmentRow extends RowDataPacket { id:string;deployment_purpose:string; }

export class SalesCommandError extends Error {
  constructor(
    message:string,
    readonly code:'PERMISSION_DENIED'|'INVALID_INPUT'|'NOT_FOUND'|'CONFLICT'
  ) {
    super(message);
    this.name='SalesCommandError';
  }
}

function required(value:string|undefined,label:string):string {
  const result=value?.trim()??'';
  if(!result) throw new SalesCommandError(`${label} is required.`,'INVALID_INPUT');
  return result;
}
function optional(value:string|undefined):string|undefined {
  const result=value?.trim()??'';
  return result||undefined;
}
function decimal(value:number|string,label:string,min=0,max?:number):number {
  const result=Number(value);
  if(!Number.isFinite(result)||result<min||(max!==undefined&&result>max)) {
    throw new SalesCommandError(
      max===undefined?`${label} must be at least ${min}.`:`${label} must be between ${min} and ${max}.`,
      'INVALID_INPUT'
    );
  }
  return result;
}
function currency(value:string):string {
  const result=required(value,'Currency').toUpperCase();
  if(!/^[A-Z]{3}$/.test(result)) throw new SalesCommandError('Currency must be a three-letter code.','INVALID_INPUT');
  return result;
}
function dateOnly(value:string|undefined,label:string):string|undefined {
  const raw=optional(value);
  if(!raw) return undefined;
  const date=new Date(raw);
  if(Number.isNaN(date.getTime())) throw new SalesCommandError(`${label} must be a valid date.`,'INVALID_INPUT');
  return date.toISOString().slice(0,10);
}
function mapError(error:unknown):never {
  if(error instanceof SalesCommandError) throw error;
  if(typeof error==='object'&&error!==null&&'code' in error) {
    if((error as {code?:string}).code==='ER_DUP_ENTRY') {
      throw new SalesCommandError('An equivalent Sales record already exists.','CONFLICT');
    }
  }
  if(error instanceof Error&&/must|required|invalid|not found|cannot|active|same tenant/i.test(error.message)) {
    throw new SalesCommandError(error.message,/not found/i.test(error.message)?'NOT_FOUND':'INVALID_INPUT');
  }
  throw error;
}
function auditPayload(value:unknown){return JSON.stringify(value);}
const SALES_STAGES=new Set<SalesOpportunityStage>([
  'QUALIFICATION','DISCOVERY','SOLUTION','PROPOSAL','NEGOTIATION','COMMIT','WON','LOST'
]);
const FORECAST_CATEGORIES=new Set<SalesForecastCategory>(['PIPELINE','BEST_CASE','COMMIT','CLOSED']);

function validStage(value:SalesOpportunityStage):SalesOpportunityStage {
  if(!SALES_STAGES.has(value)) throw new SalesCommandError('Opportunity stage is invalid.','INVALID_INPUT');
  return value;
}
function validForecast(value:SalesForecastCategory):SalesForecastCategory {
  if(!FORECAST_CATEGORIES.has(value)) throw new SalesCommandError('Forecast category is invalid.','INVALID_INPUT');
  return value;
}

function opportunityStatus(stage:SalesOpportunityStage):SalesOpportunityStatus {
  if(stage==='WON') return 'WON';
  if(stage==='LOST') return 'LOST';
  return 'OPEN';
}
function opportunityForecast(stage:SalesOpportunityStage,requested:SalesForecastCategory):SalesForecastCategory {
  return stage==='WON'||stage==='LOST'?'CLOSED':requested;
}

export class MySqlSalesCommandService {
  private readonly authorization:MySqlFunctionWorkAuthorizationService;

  constructor(private readonly pool:Pool) {
    this.authorization=new MySqlFunctionWorkAuthorizationService(pool);
  }

  async createAccount(
    tenantId:TenantId,
    actorPersonId:string,
    input:{organisationId:string;code:string;ownerPositionId:string;segment?:string}
  ):Promise<SalesAccount> {
    const authority=await this.authorization.resolveF07Work(tenantId,actorPersonId);
    this.requireAuthority(authority.allowed,authority.reason);
    this.requireOwnerScope(authority.unrestricted,authority.positionIds,input.ownerPositionId);

    const code=required(input.code,'Sales Account code').toUpperCase();
    try {
      return await withTransaction(this.pool,async connection=>{
        const [organisation,ownerPosition]=await Promise.all([
          this.requireOrganisation(connection,tenantId,required(input.organisationId,'Organisation')),
          this.requireF07Position(connection,tenantId,required(input.ownerPositionId,'Owner Position'))
        ]);
        const canonical=await this.createCanonicalObject(
          connection,tenantId,'SALES_ACCOUNT',`SALES_ACCOUNT:${code}`,
          organisation.tradingName??organisation.legalName,actorPersonId
        );
        const segment=optional(input.segment);
        const account:SalesAccount={
          id:asId<'SalesAccountId'>(`SACC-${randomUUID()}`,'Sales Account'),
          tenantId,
          canonicalObjectId:canonical.id,
          organisationId:organisation.id,
          code,
          ownerPositionId:ownerPosition.id,
          ...(segment?{segment}:{}),
          status:'ACTIVE',
          createdAt:new Date().toISOString(),
          rowVersion:1
        };
        createSalesAccount(account,canonical,organisation,ownerPosition);
        await connection.execute(
          `INSERT INTO sales_accounts
            (id,tenant_id,canonical_object_id,organisation_id,code,owner_position_id,segment,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,'ACTIVE',?,?)`,
          [account.id,tenantId,account.canonicalObjectId,account.organisationId,account.code,
           account.ownerPositionId,account.segment??null,actorPersonId,actorPersonId]
        );
        await upsertPartyType(connection,{
          tenantId,
          partyId:organisation.partyId,
          partyType:'CLIENT',
          actorPersonId
        });
        const organisationObject=await this.requireCanonicalObject(connection,tenantId,'ORGANISATION',organisation.id);
        await this.createCanonicalRelationship(
          connection,tenantId,'ORGANISATION_HAS_SALES_ACCOUNT',organisationObject.id,canonical.id,actorPersonId
        );
        await this.writeAudit(connection,tenantId,'SALES_ACCOUNT',account.id,'CREATED',actorPersonId,account);
        return account;
      });
    } catch(error){return mapError(error);}
  }

  async createOpportunity(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      salesAccountId:string;code:string;title:string;description:string;ownerPositionId:string;
      stage:SalesOpportunityStage;probabilityPercent:number|string;estimatedValue:number|string;
      currency:string;expectedCloseDate?:string;forecastCategory:SalesForecastCategory;
    }
  ):Promise<SalesOpportunity> {
    const authority=await this.authorization.resolveF07Work(tenantId,actorPersonId);
    this.requireAuthority(authority.allowed,authority.reason);
    this.requireOwnerScope(authority.unrestricted,authority.positionIds,input.ownerPositionId);

    const code=required(input.code,'Opportunity code').toUpperCase();
    const title=required(input.title,'Opportunity title');
    const expectedCloseDate=dateOnly(input.expectedCloseDate,'Expected close date');
    try {
      return await withTransaction(this.pool,async connection=>{
        const [account,ownerPosition]=await Promise.all([
          this.requireAccount(connection,tenantId,required(input.salesAccountId,'Sales Account')),
          this.requireF07Position(connection,tenantId,required(input.ownerPositionId,'Owner Position'))
        ]);
        if(account.status!=='ACTIVE') throw new SalesCommandError('Sales Account must be ACTIVE.','INVALID_INPUT');
        if(!authority.unrestricted&&!authority.positionIds.includes(account.ownerPositionId)) {
          throw new SalesCommandError('Sales Account is outside your Position management scope.','PERMISSION_DENIED');
        }
        const canonical=await this.createCanonicalObject(
          connection,tenantId,'OPPORTUNITY',`OPPORTUNITY:${code}`,title,actorPersonId
        );
        const stage=validStage(input.stage);
        const opportunity:SalesOpportunity={
          id:asId<'SalesOpportunityId'>(`OPP-${randomUUID()}`,'Sales Opportunity'),
          tenantId,
          canonicalObjectId:canonical.id,
          salesAccountId:account.id,
          code,
          title,
          description:required(input.description,'Opportunity description'),
          ownerPositionId:ownerPosition.id,
          stage,
          probabilityPercent:decimal(input.probabilityPercent,'Probability',0,100),
          estimatedValue:decimal(input.estimatedValue,'Estimated value',0),
          currency:currency(input.currency),
          ...(expectedCloseDate?{expectedCloseDate}:{}),
          forecastCategory:opportunityForecast(stage,validForecast(input.forecastCategory)),
          status:opportunityStatus(stage),
          createdAt:new Date().toISOString(),
          rowVersion:1
        };
        createSalesOpportunity(opportunity,canonical,account,ownerPosition);
        await connection.execute(
          `INSERT INTO sales_opportunities
            (id,tenant_id,canonical_object_id,sales_account_id,code,title,description,owner_position_id,
             stage,probability_percent,estimated_value,currency,expected_close_date,forecast_category,status,
             created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [opportunity.id,tenantId,opportunity.canonicalObjectId,opportunity.salesAccountId,opportunity.code,
           opportunity.title,opportunity.description,opportunity.ownerPositionId,opportunity.stage,
           opportunity.probabilityPercent,opportunity.estimatedValue,opportunity.currency,
           opportunity.expectedCloseDate?new Date(`${opportunity.expectedCloseDate}T00:00:00.000Z`):null,
           opportunity.forecastCategory,opportunity.status,actorPersonId,actorPersonId]
        );
        await this.createCanonicalRelationship(
          connection,tenantId,'SALES_ACCOUNT_HAS_OPPORTUNITY',account.canonicalObjectId,canonical.id,actorPersonId
        );
        await this.writeAudit(connection,tenantId,'SALES_OPPORTUNITY',opportunity.id,'CREATED',actorPersonId,opportunity);
        return opportunity;
      });
    } catch(error){return mapError(error);}
  }

  async updateOpportunity(
    tenantId:TenantId,
    actorPersonId:string,
    input:{
      opportunityId:string;rowVersion:number|string;title:string;description:string;ownerPositionId:string;
      stage:SalesOpportunityStage;probabilityPercent:number|string;estimatedValue:number|string;
      currency:string;expectedCloseDate?:string;forecastCategory:SalesForecastCategory;
    }
  ):Promise<SalesOpportunity> {
    const authority=await this.authorization.resolveF07Work(tenantId,actorPersonId);
    this.requireAuthority(authority.allowed,authority.reason);
    const expectedVersion=Number(input.rowVersion);
    if(!Number.isInteger(expectedVersion)||expectedVersion<1) {
      throw new SalesCommandError('Opportunity row version is invalid.','INVALID_INPUT');
    }
    const expectedCloseDate=dateOnly(input.expectedCloseDate,'Expected close date');

    try {
      return await withTransaction(this.pool,async connection=>{
        const current=await this.requireOpportunity(connection,tenantId,required(input.opportunityId,'Opportunity'));
        if(!authority.unrestricted&&!authority.positionIds.includes(current.ownerPositionId)) {
          throw new SalesCommandError('Opportunity is outside your Position management scope.','PERMISSION_DENIED');
        }
        if(current.status==='WON'||current.status==='LOST'||current.status==='CANCELLED') {
          throw new SalesCommandError('A terminal Opportunity cannot be reopened or edited.','CONFLICT');
        }
        this.requireOwnerScope(authority.unrestricted,authority.positionIds,input.ownerPositionId);
        await this.requireF07Position(connection,tenantId,required(input.ownerPositionId,'Owner Position'));

        const stage=validStage(input.stage);
        const status=opportunityStatus(stage);
        const forecastCategory=opportunityForecast(stage,validForecast(input.forecastCategory));
        const title=required(input.title,'Opportunity title');
        const [result]=await connection.execute<ResultSetHeader>(
          `UPDATE sales_opportunities
              SET title=?,description=?,owner_position_id=?,stage=?,probability_percent=?,estimated_value=?,
                  currency=?,expected_close_date=?,forecast_category=?,status=?,updated_by_person_id=?,
                  row_version=row_version+1
            WHERE tenant_id=? AND id=? AND row_version=?`,
          [title,required(input.description,'Opportunity description'),input.ownerPositionId,stage,
           decimal(input.probabilityPercent,'Probability',0,100),decimal(input.estimatedValue,'Estimated value',0),
           currency(input.currency),expectedCloseDate?new Date(`${expectedCloseDate}T00:00:00.000Z`):null,
           forecastCategory,status,actorPersonId,tenantId,current.id,expectedVersion]
        );
        if(result.affectedRows!==1) {
          throw new SalesCommandError('Opportunity changed since it was loaded. Refresh and try again.','CONFLICT');
        }
        await connection.execute(
          'UPDATE canonical_objects SET display_name=? WHERE tenant_id=? AND id=?',
          [title,tenantId,current.canonicalObjectId]
        );
        const updated=await this.requireOpportunity(connection,tenantId,current.id);
        await this.writeAudit(connection,tenantId,'SALES_OPPORTUNITY',updated.id,'UPDATED',actorPersonId,updated);
        return updated;
      });
    } catch(error){return mapError(error);}
  }

  private requireAuthority(allowed:boolean,reason:string):void {
    if(!allowed) throw new SalesCommandError(reason,'PERMISSION_DENIED');
  }

  private requireOwnerScope(unrestricted:boolean,positionIds:readonly string[],ownerPositionId:string):void {
    if(!unrestricted&&!positionIds.includes(ownerPositionId)) {
      throw new SalesCommandError('Owner Position is outside your Position management scope.','PERMISSION_DENIED');
    }
  }

  private async requireOrganisation(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Organisation> {
    const [rows]=await connection.execute<OrganisationRow[]>(
      'SELECT id,tenant_id,party_id,legal_name,trading_name,status FROM organisations WHERE tenant_id=? AND id=?',
      [tenantId,id]
    );
    const row=rows[0];
    if(!row||row.status!=='ACTIVE') throw new SalesCommandError('Organisation was not found or is inactive.','NOT_FOUND');
    return {
      id:row.id as Organisation['id'],tenantId:row.tenant_id as TenantId,partyId:row.party_id as Organisation['partyId'],
      legalName:row.legal_name,...(row.trading_name?{tradingName:row.trading_name}:{}),status:row.status
    };
  }

  private async requireF07Position(connection:PoolConnection,tenantId:TenantId,id:string):Promise<Position> {
    const [rows]=await connection.execute<PositionRow[]>(
      'SELECT id,tenant_id,organisation_unit_id,job_profile_id,code,title,status FROM positions WHERE tenant_id=? AND id=?',
      [tenantId,id]
    );
    const row=rows[0];
    if(!row||row.status!=='ACTIVE') throw new SalesCommandError('Owner Position was not found or is inactive.','NOT_FOUND');
    const [assignments]=await connection.execute<FunctionAssignmentRow[]>(
      `SELECT id,deployment_purpose FROM position_function_assignments
        WHERE tenant_id=? AND position_id=? AND function_id='F07' AND status='ACTIVE'
          AND effective_from<=NOW(6) AND (effective_to IS NULL OR effective_to>=NOW(6))
        ORDER BY is_primary DESC LIMIT 1`,
      [tenantId,id]
    );
    if(!assignments[0]||assignments[0].deployment_purpose!=='FUNCTIONAL_DELIVERY') {
      throw new SalesCommandError('Owner Position must be an active F07 Functional Delivery Position.','INVALID_INPUT');
    }
    return {
      id:row.id as Position['id'],tenantId:row.tenant_id as TenantId,
      organisationUnitId:row.organisation_unit_id as Position['organisationUnitId'],
      ...(row.job_profile_id?{jobProfileId:row.job_profile_id as NonNullable<Position['jobProfileId']>}:{ }),
      code:row.code,title:row.title,status:row.status
    };
  }

  private async requireAccount(connection:PoolConnection,tenantId:TenantId,id:string):Promise<SalesAccount> {
    const [rows]=await connection.execute<AccountRow[]>(
      'SELECT id,tenant_id,canonical_object_id,organisation_id,code,owner_position_id,segment,status,created_at,row_version FROM sales_accounts WHERE tenant_id=? AND id=?',
      [tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new SalesCommandError('Sales Account was not found.','NOT_FOUND');
    return this.mapAccount(row);
  }

  private async requireOpportunity(connection:PoolConnection,tenantId:TenantId,id:string):Promise<SalesOpportunity> {
    const [rows]=await connection.execute<OpportunityRow[]>(
      `SELECT id,tenant_id,canonical_object_id,sales_account_id,code,title,description,owner_position_id,
              stage,probability_percent,estimated_value,currency,expected_close_date,forecast_category,status,created_at,row_version
         FROM sales_opportunities WHERE tenant_id=? AND id=?`,
      [tenantId,id]
    );
    const row=rows[0];
    if(!row) throw new SalesCommandError('Sales Opportunity was not found.','NOT_FOUND');
    return this.mapOpportunity(row);
  }

  private mapAccount(row:AccountRow):SalesAccount {
    return {
      id:row.id as SalesAccount['id'],tenantId:row.tenant_id as TenantId,
      canonicalObjectId:row.canonical_object_id as SalesAccount['canonicalObjectId'],
      organisationId:row.organisation_id as SalesAccount['organisationId'],code:row.code,
      ownerPositionId:row.owner_position_id as SalesAccount['ownerPositionId'],
      ...(row.segment?{segment:row.segment}:{}),status:row.status,createdAt:row.created_at.toISOString(),
      rowVersion:Number(row.row_version)
    };
  }

  private mapOpportunity(row:OpportunityRow):SalesOpportunity {
    return {
      id:row.id as SalesOpportunity['id'],tenantId:row.tenant_id as TenantId,
      canonicalObjectId:row.canonical_object_id as SalesOpportunity['canonicalObjectId'],
      salesAccountId:row.sales_account_id as SalesOpportunity['salesAccountId'],
      code:row.code,title:row.title,description:row.description,
      ownerPositionId:row.owner_position_id as SalesOpportunity['ownerPositionId'],
      stage:row.stage,probabilityPercent:Number(row.probability_percent),estimatedValue:Number(row.estimated_value),
      currency:row.currency,...(row.expected_close_date?{expectedCloseDate:row.expected_close_date.toISOString().slice(0,10)}:{}),
      forecastCategory:row.forecast_category,status:row.status,createdAt:row.created_at.toISOString(),
      rowVersion:Number(row.row_version)
    };
  }

  private async createCanonicalObject(
    connection:PoolConnection,tenantId:TenantId,objectType:string,stableKey:string,
    displayName:string,actorPersonId:string
  ):Promise<CanonicalObjectIdentity> {
    const [bindings]=await connection.execute<BindingRow[]>(
      `SELECT type_definition_id FROM metadata_native_type_bindings
        WHERE tenant_id=? AND native_object_type=? AND status='ACTIVE' LIMIT 1`,
      [tenantId,objectType]
    );
    const object:CanonicalObjectIdentity={
      id:asId<'CanonicalObjectId'>(`OBJ-${randomUUID()}`,'Canonical Object'),
      tenantId,objectType,stableKey,createdAt:new Date().toISOString()
    };
    await connection.execute(
      `INSERT INTO canonical_objects
        (id,tenant_id,object_type,type_definition_id,stable_key,display_name,status,created_at)
       VALUES (?,?,?,?,?,?,'ACTIVE',?)`,
      [object.id,tenantId,objectType,bindings[0]?.type_definition_id??null,stableKey,displayName,new Date(object.createdAt)]
    );
    await this.writeAudit(connection,tenantId,'CANONICAL_OBJECT',object.id,'CREATED',actorPersonId,{
      ...object,displayName
    });
    return object;
  }

  private async requireCanonicalObject(
    connection:PoolConnection,tenantId:TenantId,objectType:string,stableKey:string
  ):Promise<{id:string}> {
    const [rows]=await connection.execute<IdRow[]>(
      'SELECT id FROM canonical_objects WHERE tenant_id=? AND object_type=? AND stable_key=? LIMIT 1',
      [tenantId,objectType,stableKey]
    );
    if(!rows[0]) throw new SalesCommandError(`${objectType} canonical identity was not found.`,'NOT_FOUND');
    return rows[0];
  }

  private async createCanonicalRelationship(
    connection:PoolConnection,tenantId:TenantId,relationshipType:string,
    fromObjectId:string,toObjectId:string,actorPersonId:string
  ):Promise<void> {
    const [bindings]=await connection.execute<RelationshipBindingRow[]>(
      `SELECT relationship_type_definition_id FROM metadata_native_relationship_bindings
        WHERE tenant_id=? AND native_relationship_type=? AND status='ACTIVE' LIMIT 1`,
      [tenantId,relationshipType]
    );
    const id=`REL-${randomUUID()}`;
    await connection.execute(
      `INSERT INTO canonical_relationships
        (id,tenant_id,relationship_type,relationship_type_definition_id,from_object_id,to_object_id,
         effective_from,status,created_by_person_id)
       VALUES (?,?,?,?,?,?,NOW(6),'ACTIVE',?)`,
      [id,tenantId,relationshipType,bindings[0]?.relationship_type_definition_id??null,fromObjectId,toObjectId,actorPersonId]
    );
    await this.writeAudit(connection,tenantId,'CANONICAL_RELATIONSHIP',id,'CREATED',actorPersonId,{
      relationshipType,fromObjectId,toObjectId
    });
  }

  private async writeAudit(
    connection:PoolConnection,tenantId:TenantId,entityType:string,entityId:string,
    action:string,actorPersonId:string,payload:unknown
  ):Promise<void> {
    await connection.execute(
      `INSERT INTO kernel_audit_entries
        (tenant_id,entity_type,entity_id,action,actor_person_id,correlation_id,payload)
       VALUES (?,?,?,?,?,'F07-SALES',?)`,
      [tenantId,entityType,entityId,action,actorPersonId,auditPayload(payload)]
    );
    await writeOutboxEvent(connection,{
      tenantId,aggregateType:entityType,aggregateId:entityId,eventType:`${entityType}.${action}`,payload
    });
  }
}
