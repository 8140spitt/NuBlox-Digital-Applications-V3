import { randomUUID } from 'node:crypto';
import {
  PLATFORM_PERMISSION_KEYS,
  asId,
  type StrategyPlanType,
  type StrategyRecordStatus,
  type TenantId
} from '@nublox/kernel';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { MySqlAccessRepository } from './access-repository.js';
import { withTransaction } from './database.js';
import { writeOutboxEvent } from './platform-writes.js';

type StrategyEntity =
  | 'OBJECTIVE'
  | 'KEY_RESULT'
  | 'INITIATIVE'
  | 'ROADMAP'
  | 'ROADMAP_ITEM'
  | 'SCENARIO'
  | 'PLAN'
  | 'OUTCOME'
  | 'ANALYSIS';

const TABLES: Record<StrategyEntity, string> = {
  OBJECTIVE: 'strategy_objectives',
  KEY_RESULT: 'strategy_key_results',
  INITIATIVE: 'strategy_initiatives',
  ROADMAP: 'strategy_roadmaps',
  ROADMAP_ITEM: 'strategy_roadmap_items',
  SCENARIO: 'strategy_scenarios',
  PLAN: 'strategy_plans',
  OUTCOME: 'strategy_outcomes',
  ANALYSIS: 'strategy_analyses'
};

const STATUSES = new Set<StrategyRecordStatus>([
  'DRAFT','PROPOSED','ALIGNED','PRIORITISED','APPROVED','FUNDED','ACTIVE',
  'TRACKING','REVIEW','SELECTED','COMMITTED','REBALANCED','COMPLETE','CANCELLED'
]);

interface IdRow extends RowDataPacket { id: string; }

export class StrategyCommandError extends Error {
  constructor(
    message: string,
    readonly code: 'PERMISSION_DENIED' | 'INVALID_INPUT' | 'NOT_FOUND' | 'CONFLICT'
  ) {
    super(message);
    this.name = 'StrategyCommandError';
  }
}

function required(value: string | undefined, label: string) {
  const v = value?.trim() ?? '';
  if (!v) throw new StrategyCommandError(`${label} is required.`, 'INVALID_INPUT');
  return v;
}
function optional(value: string | undefined) {
  const v = value?.trim() ?? '';
  return v || undefined;
}
function numberValue(value: string | number | undefined, label: string) {
  if (value === undefined || value === '') return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new StrategyCommandError(`${label} must be numeric.`, 'INVALID_INPUT');
  return n;
}
function dateValue(value: string | undefined, label: string) {
  const v = optional(value);
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw new StrategyCommandError(`${label} must be a valid date.`, 'INVALID_INPUT');
  return d;
}
function parseAssumptions(value: string | undefined) {
  const raw = optional(value);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error();
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new StrategyCommandError('Assumptions must be a JSON object.', 'INVALID_INPUT');
  }
}

async function evidence(
  connection: PoolConnection,
  tenantId: string,
  entityType: string,
  entityId: string,
  action: string,
  actorPersonId: string,
  payload: unknown
) {
  await connection.execute(
    `INSERT INTO kernel_audit_entries
      (tenant_id, entity_type, entity_id, action, actor_person_id, correlation_id, payload)
     VALUES (?, ?, ?, ?, ?, 'F01-STRATEGY', ?)`,
    [tenantId, entityType, entityId, action, actorPersonId, JSON.stringify(payload)]
  );
  await writeOutboxEvent(connection, {
    tenantId,
    aggregateType: entityType,
    aggregateId: entityId,
    eventType: `${entityType}.${action}`,
    payload
  });
}

export class MySqlStrategyCommandService {
  private readonly access: MySqlAccessRepository;
  constructor(private readonly pool: Pool) {
    this.access = new MySqlAccessRepository(pool);
  }

  private async requireWork(tenantId: TenantId, personId: string) {
    const result = await this.access.evaluatePermission(
      tenantId, personId, PLATFORM_PERMISSION_KEYS.F01_WORK, { scopeType: 'TENANT' }
    );
    if (!result.allowed) throw new StrategyCommandError(result.reason, 'PERMISSION_DENIED');
  }

  private async requirePerson(tenantId: TenantId, personId: string) {
    const [rows] = await this.pool.query<IdRow[]>(
      `SELECT id FROM persons WHERE tenant_id = ? AND id = ? AND status = 'ACTIVE'`,
      [tenantId, personId]
    );
    if (!rows[0]) throw new StrategyCommandError('Owner Person was not found in tenant.', 'NOT_FOUND');
  }

  private async requireRow(tenantId: TenantId, table: string, id: string, label: string) {
    const [rows] = await this.pool.query<IdRow[]>(
      `SELECT id FROM ${table} WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
    if (!rows[0]) throw new StrategyCommandError(`${label} was not found in tenant.`, 'NOT_FOUND');
  }

  private async canonicalObject(
    connection: PoolConnection,
    tenantId: TenantId,
    objectType: string,
    stableKey: string
  ) {
    const id = asId<'CanonicalObjectId'>(`F01-${randomUUID()}`, 'Canonical Object');
    await connection.execute(
      `INSERT INTO canonical_objects (id, tenant_id, object_type, stable_key, created_at)
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(6))`,
      [id, tenantId, objectType, stableKey]
    );
    return id;
  }

  async createObjective(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      code?: string; title?: string; description?: string; ownerPersonId?: string;
      parentObjectiveId?: string; level?: 'ENTERPRISE'|'FUNCTION'|'TEAM';
      effectiveFrom?: string; effectiveTo?: string;
    }
  ) {
    await this.requireWork(tenantId, actorPersonId);
    const ownerPersonId = optional(input.ownerPersonId) ?? actorPersonId;
    await this.requirePerson(tenantId, ownerPersonId);
    const parent = optional(input.parentObjectiveId);
    if (parent) await this.requireRow(tenantId, 'strategy_objectives', parent, 'Parent Objective');
    const code = required(input.code, 'Objective code').toUpperCase();
    const id = `OBJ-${randomUUID()}`;
    try {
      await withTransaction(this.pool, async (connection) => {
        const objectId = await this.canonicalObject(connection, tenantId, 'STRATEGY_OBJECTIVE', `F01:OBJECTIVE:${code}`);
        await connection.execute(
          `INSERT INTO strategy_objectives
            (id, tenant_id, canonical_object_id, parent_objective_id, code, title, description,
             owner_person_id, objective_level, status, effective_from, effective_to,
             created_by_person_id, updated_by_person_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?)`,
          [id, tenantId, objectId, parent ?? null, code, required(input.title,'Objective title'),
           required(input.description,'Objective description'), ownerPersonId, input.level ?? 'ENTERPRISE',
           dateValue(input.effectiveFrom,'Effective from') ?? null,
           dateValue(input.effectiveTo,'Effective to') ?? null, actorPersonId, actorPersonId]
        );
        await evidence(connection, tenantId, 'STRATEGY_OBJECTIVE', id, 'CREATED', actorPersonId, { code, benchmark: ['ENT-MTC-0001','ENT-MTC-0002'] });
      });
      return id;
    } catch (e) { return this.mapError(e); }
  }

  async createKeyResult(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      objectiveId?: string; title?: string; measure?: string; ownerPersonId?: string;
      baselineValue?: string|number; targetValue?: string|number; actualValue?: string|number;
    }
  ) {
    await this.requireWork(tenantId, actorPersonId);
    const objectiveId = required(input.objectiveId,'Objective');
    await this.requireRow(tenantId,'strategy_objectives',objectiveId,'Objective');
    const ownerPersonId = optional(input.ownerPersonId) ?? actorPersonId;
    await this.requirePerson(tenantId,ownerPersonId);
    const id=`KR-${randomUUID()}`;
    await this.pool.execute(
      `INSERT INTO strategy_key_results
        (id, tenant_id, objective_id, title, measure, baseline_value, target_value, actual_value,
         owner_person_id, status, created_by_person_id, updated_by_person_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?)`,
      [id,tenantId,objectiveId,required(input.title,'Key Result title'),required(input.measure,'Measure'),
       numberValue(input.baselineValue,'Baseline'),numberValue(input.targetValue,'Target'),
       numberValue(input.actualValue,'Actual'),ownerPersonId,actorPersonId,actorPersonId]
    );
    return id;
  }

  async createInitiative(
    tenantId: TenantId,
    actorPersonId: string,
    input: {
      objectiveId?: string; code?: string; title?: string; description?: string; ownerPersonId?: string;
      investmentAmount?: string|number; capacityDemand?: string|number; startDate?: string; endDate?: string;
    }
  ) {
    await this.requireWork(tenantId,actorPersonId);
    const objectiveId=required(input.objectiveId,'Objective');
    await this.requireRow(tenantId,'strategy_objectives',objectiveId,'Objective');
    const ownerPersonId=optional(input.ownerPersonId)??actorPersonId;
    await this.requirePerson(tenantId,ownerPersonId);
    const code=required(input.code,'Initiative code').toUpperCase(), id=`INIT-${randomUUID()}`;
    try {
      await withTransaction(this.pool, async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_INITIATIVE',`F01:INITIATIVE:${code}`);
        await connection.execute(
          `INSERT INTO strategy_initiatives
            (id,tenant_id,canonical_object_id,objective_id,code,title,description,owner_person_id,
             investment_amount,capacity_demand,status,start_date,end_date,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,'PROPOSED',?,?,?,?)`,
          [id,tenantId,objectId,objectiveId,code,required(input.title,'Initiative title'),
           required(input.description,'Initiative description'),ownerPersonId,
           numberValue(input.investmentAmount,'Investment amount'),numberValue(input.capacityDemand,'Capacity demand'),
           dateValue(input.startDate,'Start date')??null,dateValue(input.endDate,'End date')??null,actorPersonId,actorPersonId]
        );
        await evidence(connection,tenantId,'STRATEGY_INITIATIVE',id,'CREATED',actorPersonId,{objectiveId,benchmark:['ENT-MTC-0001','ENT-MTC-0005','ENT-MTC-0006']});
      });
      return id;
    } catch(e){return this.mapError(e);}
  }

  async createRoadmap(
    tenantId: TenantId,
    actorPersonId: string,
    input: {code?:string;title?:string;description?:string;ownerPersonId?:string;startDate?:string;endDate?:string}
  ) {
    await this.requireWork(tenantId,actorPersonId);
    const owner=optional(input.ownerPersonId)??actorPersonId; await this.requirePerson(tenantId,owner);
    const code=required(input.code,'Roadmap code').toUpperCase(),id=`RMAP-${randomUUID()}`;
    try{
      await withTransaction(this.pool,async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_ROADMAP',`F01:ROADMAP:${code}`);
        await connection.execute(
          `INSERT INTO strategy_roadmaps
            (id,tenant_id,canonical_object_id,code,title,description,owner_person_id,status,start_date,end_date,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,'PROPOSED',?,?,?,?)`,
          [id,tenantId,objectId,code,required(input.title,'Roadmap title'),required(input.description,'Roadmap description'),owner,
           dateValue(input.startDate,'Start date')??null,dateValue(input.endDate,'End date')??null,actorPersonId,actorPersonId]
        );
        await evidence(connection,tenantId,'STRATEGY_ROADMAP',id,'CREATED',actorPersonId,{benchmark:['ENT-MTC-0003']});
      }); return id;
    }catch(e){return this.mapError(e);}
  }

  async addRoadmapItem(
    tenantId: TenantId,
    actorPersonId: string,
    input:{roadmapId?:string;objectiveId?:string;initiativeId?:string;title?:string;milestoneDate?:string;sequence?:string|number}
  ){
    await this.requireWork(tenantId,actorPersonId);
    const roadmapId=required(input.roadmapId,'Roadmap'); await this.requireRow(tenantId,'strategy_roadmaps',roadmapId,'Roadmap');
    const objectiveId=optional(input.objectiveId), initiativeId=optional(input.initiativeId);
    if(objectiveId) await this.requireRow(tenantId,'strategy_objectives',objectiveId,'Objective');
    if(initiativeId) await this.requireRow(tenantId,'strategy_initiatives',initiativeId,'Initiative');
    const id=`RMI-${randomUUID()}`;
    await this.pool.execute(
      `INSERT INTO strategy_roadmap_items
        (id,tenant_id,roadmap_id,objective_id,initiative_id,title,milestone_date,sequence,status,created_by_person_id,updated_by_person_id)
       VALUES (?,?,?,?,?,?,?,?, 'PROPOSED',?,?)`,
      [id,tenantId,roadmapId,objectiveId??null,initiativeId??null,required(input.title,'Roadmap item title'),
       dateValue(input.milestoneDate,'Milestone date')??null,Number(input.sequence??1),actorPersonId,actorPersonId]
    );
    return id;
  }

  async createScenario(
    tenantId: TenantId,
    actorPersonId: string,
    input:{code?:string;title?:string;description?:string;ownerPersonId?:string;baseScenarioId?:string;
      assumptions?:string;budgetAmount?:string|number;capacityAmount?:string|number;expectedOutcome?:string}
  ){
    await this.requireWork(tenantId,actorPersonId);
    const owner=optional(input.ownerPersonId)??actorPersonId; await this.requirePerson(tenantId,owner);
    const base=optional(input.baseScenarioId); if(base) await this.requireRow(tenantId,'strategy_scenarios',base,'Base Scenario');
    const code=required(input.code,'Scenario code').toUpperCase(),id=`SCN-${randomUUID()}`;
    try{
      await withTransaction(this.pool,async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_SCENARIO',`F01:SCENARIO:${code}`);
        await connection.execute(
          `INSERT INTO strategy_scenarios
            (id,tenant_id,canonical_object_id,code,title,description,owner_person_id,base_scenario_id,
             assumptions,budget_amount,capacity_amount,expected_outcome,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?, 'DRAFT',?,?)`,
          [id,tenantId,objectId,code,required(input.title,'Scenario title'),required(input.description,'Scenario description'),
           owner,base??null,JSON.stringify(parseAssumptions(input.assumptions)),numberValue(input.budgetAmount,'Budget'),
           numberValue(input.capacityAmount,'Capacity'),required(input.expectedOutcome,'Expected outcome'),actorPersonId,actorPersonId]
        );
        await evidence(connection,tenantId,'STRATEGY_SCENARIO',id,'CREATED',actorPersonId,{baseScenarioId:base,benchmark:['ENT-MTC-0004','ENT-MTC-0008']});
      }); return id;
    }catch(e){return this.mapError(e);}
  }

  async createPlan(
    tenantId: TenantId,
    actorPersonId: string,
    input:{code?:string;title?:string;description?:string;ownerPersonId?:string;planType?:StrategyPlanType;
      periodStart?:string;periodEnd?:string;assumptions?:string;targetAmount?:string|number;forecastAmount?:string|number;actualAmount?:string|number}
  ){
    await this.requireWork(tenantId,actorPersonId);
    const owner=optional(input.ownerPersonId)??actorPersonId; await this.requirePerson(tenantId,owner);
    const allowed:StrategyPlanType[]=['CONNECTED_ENTERPRISE','CAPACITY_INVESTMENT','BUDGET_FORECAST'];
    if(!input.planType||!allowed.includes(input.planType)) throw new StrategyCommandError('A valid plan type is required.','INVALID_INPUT');
    const code=required(input.code,'Plan code').toUpperCase(),id=`PLAN-${randomUUID()}`;
    try{
      await withTransaction(this.pool,async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_PLAN',`F01:PLAN:${code}`);
        await connection.execute(
          `INSERT INTO strategy_plans
            (id,tenant_id,canonical_object_id,code,title,description,owner_person_id,plan_type,period_start,period_end,
             assumptions,target_amount,forecast_amount,actual_amount,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'DRAFT',?,?)`,
          [id,tenantId,objectId,code,required(input.title,'Plan title'),required(input.description,'Plan description'),owner,input.planType,
           dateValue(input.periodStart,'Period start')??null,dateValue(input.periodEnd,'Period end')??null,
           JSON.stringify(parseAssumptions(input.assumptions)),numberValue(input.targetAmount,'Target amount'),
           numberValue(input.forecastAmount,'Forecast amount'),numberValue(input.actualAmount,'Actual amount'),actorPersonId,actorPersonId]
        );
        const benchmark=input.planType==='CONNECTED_ENTERPRISE'?['ENT-MTC-0007']:
          input.planType==='CAPACITY_INVESTMENT'?['ENT-MTC-0005']:['ENT-MTC-0009'];
        await evidence(connection,tenantId,'STRATEGY_PLAN',id,'CREATED',actorPersonId,{planType:input.planType,benchmark});
      }); return id;
    }catch(e){return this.mapError(e);}
  }

  async createOutcome(
    tenantId: TenantId,
    actorPersonId: string,
    input:{initiativeId?:string;title?:string;measure?:string;ownerPersonId?:string;
      targetValue?:string|number;actualValue?:string|number;realisedValue?:string|number}
  ){
    await this.requireWork(tenantId,actorPersonId);
    const initiativeId=required(input.initiativeId,'Initiative'); await this.requireRow(tenantId,'strategy_initiatives',initiativeId,'Initiative');
    const owner=optional(input.ownerPersonId)??actorPersonId; await this.requirePerson(tenantId,owner);
    const id=`OUT-${randomUUID()}`;
    try{
      await withTransaction(this.pool,async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_OUTCOME',`F01:OUTCOME:${id}`);
        await connection.execute(
          `INSERT INTO strategy_outcomes
            (id,tenant_id,canonical_object_id,initiative_id,title,measure,target_value,actual_value,realised_value,
             owner_person_id,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,?,'TRACKING',?,?)`,
          [id,tenantId,objectId,initiativeId,required(input.title,'Outcome title'),required(input.measure,'Measure'),
           numberValue(input.targetValue,'Target'),numberValue(input.actualValue,'Actual'),numberValue(input.realisedValue,'Realised value'),
           owner,actorPersonId,actorPersonId]
        );
        await evidence(connection,tenantId,'STRATEGY_OUTCOME',id,'CREATED',actorPersonId,{initiativeId,benchmark:['ENT-MTC-0006']});
      });return id;
    }catch(e){return this.mapError(e);}
  }

  async createAnalysis(
    tenantId: TenantId,
    actorPersonId: string,
    input:{title?:string;summary?:string;ownerPersonId?:string;planId?:string;scenarioId?:string;outcomeId?:string}
  ){
    await this.requireWork(tenantId,actorPersonId);
    const owner=optional(input.ownerPersonId)??actorPersonId; await this.requirePerson(tenantId,owner);
    const plan=optional(input.planId),scenario=optional(input.scenarioId),outcome=optional(input.outcomeId);
    if(plan) await this.requireRow(tenantId,'strategy_plans',plan,'Plan');
    if(scenario) await this.requireRow(tenantId,'strategy_scenarios',scenario,'Scenario');
    if(outcome) await this.requireRow(tenantId,'strategy_outcomes',outcome,'Outcome');
    if(!plan&&!scenario&&!outcome) throw new StrategyCommandError('Analysis must reference a plan, scenario or outcome.','INVALID_INPUT');
    const id=`ANL-${randomUUID()}`;
    try{
      await withTransaction(this.pool,async connection=>{
        const objectId=await this.canonicalObject(connection,tenantId,'STRATEGY_ANALYSIS',`F01:ANALYSIS:${id}`);
        await connection.execute(
          `INSERT INTO strategy_analyses
            (id,tenant_id,canonical_object_id,title,summary,owner_person_id,plan_id,scenario_id,outcome_id,status,created_by_person_id,updated_by_person_id)
           VALUES (?,?,?,?,?,?,?,?,?,'DRAFT',?,?)`,
          [id,tenantId,objectId,required(input.title,'Analysis title'),required(input.summary,'Analysis summary'),owner,
           plan??null,scenario??null,outcome??null,actorPersonId,actorPersonId]
        );
        await evidence(connection,tenantId,'STRATEGY_ANALYSIS',id,'CREATED',actorPersonId,{plan,scenario,outcome,benchmark:['ENT-MTC-0010']});
      }); return id;
    }catch(e){return this.mapError(e);}
  }

  async transition(
    tenantId: TenantId,
    actorPersonId: string,
    input:{entityType?:StrategyEntity;entityId?:string;status?:StrategyRecordStatus}
  ){
    await this.requireWork(tenantId,actorPersonId);
    if(!input.entityType||!TABLES[input.entityType]) throw new StrategyCommandError('Valid strategy entity type is required.','INVALID_INPUT');
    if(!input.status||!STATUSES.has(input.status)) throw new StrategyCommandError('Valid strategy status is required.','INVALID_INPUT');
    if (['APPROVED','FUNDED','SELECTED','COMMITTED'].includes(input.status)) {
      throw new StrategyCommandError(
        'This state requires an Authority-backed Decision. Use of privileged strategy states is blocked until that control is wired.',
        'INVALID_INPUT'
      );
    }
    const id=required(input.entityId,'Strategy record');
    await this.requireRow(tenantId,TABLES[input.entityType],id,'Strategy record');
    await withTransaction(this.pool,async connection=>{
      await connection.execute(
        `UPDATE ${TABLES[input.entityType]} SET status=?, updated_by_person_id=? WHERE tenant_id=? AND id=?`,
        [input.status,actorPersonId,tenantId,id]
      );
      await evidence(connection,tenantId,`STRATEGY_${input.entityType}`,id,'STATUS_CHANGED',actorPersonId,{status:input.status});
    });
  }

  private mapError(error:unknown):never{
    if(error instanceof StrategyCommandError) throw error;
    if(typeof error==='object'&&error!==null&&'code' in error&&(error as {code?:string}).code==='ER_DUP_ENTRY')
      throw new StrategyCommandError('A strategy record with that code already exists.','CONFLICT');
    throw error;
  }
}
