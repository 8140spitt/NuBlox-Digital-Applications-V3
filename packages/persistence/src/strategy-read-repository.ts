import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { TenantId } from '@nublox/kernel';

interface PersonRow extends RowDataPacket { id:string; name:string; }
interface ObjectiveRow extends RowDataPacket {
  id:string;canonical_object_id:string;parent_objective_id:string|null;code:string;title:string;description:string;
  owner_person_id:string;owner_name:string;objective_level:string;status:string;effective_from:Date|null;effective_to:Date|null;
}
interface KeyResultRow extends RowDataPacket {
  id:string;objective_id:string;title:string;measure:string;baseline_value:string|number|null;target_value:string|number|null;
  actual_value:string|number|null;owner_person_id:string;owner_name:string;status:string;
}
interface InitiativeRow extends RowDataPacket {
  id:string;canonical_object_id:string;objective_id:string;objective_title:string;code:string;title:string;description:string;
  owner_person_id:string;owner_name:string;investment_amount:string|number|null;capacity_demand:string|number|null;
  status:string;start_date:Date|null;end_date:Date|null;
}
interface RoadmapRow extends RowDataPacket {
  id:string;canonical_object_id:string;code:string;title:string;description:string;owner_person_id:string;owner_name:string;
  status:string;start_date:Date|null;end_date:Date|null;
}
interface RoadmapItemRow extends RowDataPacket {
  id:string;roadmap_id:string;objective_id:string|null;initiative_id:string|null;title:string;milestone_date:Date|null;
  sequence:number;status:string;
}
interface ScenarioRow extends RowDataPacket {
  id:string;canonical_object_id:string;code:string;title:string;description:string;owner_person_id:string;owner_name:string;
  base_scenario_id:string|null;base_scenario_title:string|null;assumptions:string|Record<string,unknown>;budget_amount:string|number|null;
  capacity_amount:string|number|null;expected_outcome:string;status:string;
}
interface PlanRow extends RowDataPacket {
  id:string;canonical_object_id:string;code:string;title:string;description:string;owner_person_id:string;owner_name:string;
  plan_type:string;period_start:Date|null;period_end:Date|null;assumptions:string|Record<string,unknown>;
  target_amount:string|number|null;forecast_amount:string|number|null;actual_amount:string|number|null;status:string;
}
interface OutcomeRow extends RowDataPacket {
  id:string;canonical_object_id:string;initiative_id:string;initiative_title:string;title:string;measure:string;
  target_value:string|number|null;actual_value:string|number|null;realised_value:string|number|null;
  owner_person_id:string;owner_name:string;status:string;
}
interface AnalysisRow extends RowDataPacket {
  id:string;canonical_object_id:string;title:string;summary:string;owner_person_id:string;owner_name:string;
  plan_id:string|null;plan_title:string|null;scenario_id:string|null;scenario_title:string|null;
  outcome_id:string|null;outcome_title:string|null;status:string;
}
interface CoverageRow extends RowDataPacket {
  capability_id:string;native_object:string;native_operation:string;status:string;
}

const iso=(d:Date|null)=>d?d.toISOString():undefined;
const n=(v:string|number|null)=>v===null?undefined:Number(v);
const json=(v:string|Record<string,unknown>)=>typeof v==='string'?JSON.parse(v):v;

export class MySqlStrategyReadRepository {
  constructor(private readonly pool:Pool){}

  async getWorkbench(tenantId:TenantId){
    const [people,objectives,keyResults,initiatives,roadmaps,roadmapItems,scenarios,plans,outcomes,analyses,coverage]=await Promise.all([
      this.pool.query<PersonRow[]>(
        `SELECT id, COALESCE(preferred_name, legal_name) AS name FROM persons
          WHERE tenant_id=? AND status='ACTIVE' ORDER BY name`,[tenantId]),
      this.pool.query<ObjectiveRow[]>(
        `SELECT o.id,o.canonical_object_id,o.parent_objective_id,o.code,o.title,o.description,o.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,o.objective_level,o.status,o.effective_from,o.effective_to
           FROM strategy_objectives o JOIN persons p ON p.tenant_id=o.tenant_id AND p.id=o.owner_person_id
          WHERE o.tenant_id=? ORDER BY o.created_at DESC`,[tenantId]),
      this.pool.query<KeyResultRow[]>(
        `SELECT k.id,k.objective_id,k.title,k.measure,k.baseline_value,k.target_value,k.actual_value,k.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,k.status
           FROM strategy_key_results k JOIN persons p ON p.tenant_id=k.tenant_id AND p.id=k.owner_person_id
          WHERE k.tenant_id=? ORDER BY k.created_at DESC`,[tenantId]),
      this.pool.query<InitiativeRow[]>(
        `SELECT i.id,i.canonical_object_id,i.objective_id,o.title AS objective_title,i.code,i.title,i.description,
                i.owner_person_id,COALESCE(p.preferred_name,p.legal_name) AS owner_name,i.investment_amount,i.capacity_demand,
                i.status,i.start_date,i.end_date
           FROM strategy_initiatives i JOIN strategy_objectives o ON o.tenant_id=i.tenant_id AND o.id=i.objective_id
           JOIN persons p ON p.tenant_id=i.tenant_id AND p.id=i.owner_person_id
          WHERE i.tenant_id=? ORDER BY i.created_at DESC`,[tenantId]),
      this.pool.query<RoadmapRow[]>(
        `SELECT r.id,r.canonical_object_id,r.code,r.title,r.description,r.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,r.status,r.start_date,r.end_date
           FROM strategy_roadmaps r JOIN persons p ON p.tenant_id=r.tenant_id AND p.id=r.owner_person_id
          WHERE r.tenant_id=? ORDER BY r.created_at DESC`,[tenantId]),
      this.pool.query<RoadmapItemRow[]>(
        `SELECT id,roadmap_id,objective_id,initiative_id,title,milestone_date,sequence,status
           FROM strategy_roadmap_items WHERE tenant_id=? ORDER BY roadmap_id,sequence`,[tenantId]),
      this.pool.query<ScenarioRow[]>(
        `SELECT s.id,s.canonical_object_id,s.code,s.title,s.description,s.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,s.base_scenario_id,b.title AS base_scenario_title,
                s.assumptions,s.budget_amount,s.capacity_amount,s.expected_outcome,s.status
           FROM strategy_scenarios s JOIN persons p ON p.tenant_id=s.tenant_id AND p.id=s.owner_person_id
           LEFT JOIN strategy_scenarios b ON b.tenant_id=s.tenant_id AND b.id=s.base_scenario_id
          WHERE s.tenant_id=? ORDER BY s.created_at DESC`,[tenantId]),
      this.pool.query<PlanRow[]>(
        `SELECT pl.id,pl.canonical_object_id,pl.code,pl.title,pl.description,pl.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,pl.plan_type,pl.period_start,pl.period_end,
                pl.assumptions,pl.target_amount,pl.forecast_amount,pl.actual_amount,pl.status
           FROM strategy_plans pl JOIN persons p ON p.tenant_id=pl.tenant_id AND p.id=pl.owner_person_id
          WHERE pl.tenant_id=? ORDER BY pl.created_at DESC`,[tenantId]),
      this.pool.query<OutcomeRow[]>(
        `SELECT o.id,o.canonical_object_id,o.initiative_id,i.title AS initiative_title,o.title,o.measure,
                o.target_value,o.actual_value,o.realised_value,o.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,o.status
           FROM strategy_outcomes o JOIN strategy_initiatives i ON i.tenant_id=o.tenant_id AND i.id=o.initiative_id
           JOIN persons p ON p.tenant_id=o.tenant_id AND p.id=o.owner_person_id
          WHERE o.tenant_id=? ORDER BY o.created_at DESC`,[tenantId]),
      this.pool.query<AnalysisRow[]>(
        `SELECT a.id,a.canonical_object_id,a.title,a.summary,a.owner_person_id,
                COALESCE(p.preferred_name,p.legal_name) AS owner_name,
                a.plan_id,pl.title AS plan_title,a.scenario_id,s.title AS scenario_title,
                a.outcome_id,o.title AS outcome_title,a.status
           FROM strategy_analyses a JOIN persons p ON p.tenant_id=a.tenant_id AND p.id=a.owner_person_id
           LEFT JOIN strategy_plans pl ON pl.tenant_id=a.tenant_id AND pl.id=a.plan_id
           LEFT JOIN strategy_scenarios s ON s.tenant_id=a.tenant_id AND s.id=a.scenario_id
           LEFT JOIN strategy_outcomes o ON o.tenant_id=a.tenant_id AND o.id=a.outcome_id
          WHERE a.tenant_id=? ORDER BY a.created_at DESC`,[tenantId]),
      this.pool.query<CoverageRow[]>(
        `SELECT capability_id,native_object,native_operation,status FROM strategy_benchmark_coverage ORDER BY capability_id`)
    ]);

    const itemsByRoadmap=new Map<string,any[]>();
    for(const row of roadmapItems[0]){
      const list=itemsByRoadmap.get(row.roadmap_id)??[];
      list.push({id:row.id,objectiveId:row.objective_id??undefined,initiativeId:row.initiative_id??undefined,title:row.title,
        milestoneDate:iso(row.milestone_date),sequence:Number(row.sequence),status:row.status});
      itemsByRoadmap.set(row.roadmap_id,list);
    }

    return {
      people: people[0],
      objectives: objectives[0].map(r=>({...r,canonicalObjectId:r.canonical_object_id,parentObjectiveId:r.parent_objective_id??undefined,
        ownerPersonId:r.owner_person_id,ownerName:r.owner_name,level:r.objective_level,effectiveFrom:iso(r.effective_from),effectiveTo:iso(r.effective_to)})),
      keyResults: keyResults[0].map(r=>({id:r.id,objectiveId:r.objective_id,title:r.title,measure:r.measure,
        baselineValue:n(r.baseline_value),targetValue:n(r.target_value),actualValue:n(r.actual_value),
        ownerPersonId:r.owner_person_id,ownerName:r.owner_name,status:r.status})),
      initiatives: initiatives[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,objectiveId:r.objective_id,
        objectiveTitle:r.objective_title,code:r.code,title:r.title,description:r.description,ownerPersonId:r.owner_person_id,
        ownerName:r.owner_name,investmentAmount:n(r.investment_amount),capacityDemand:n(r.capacity_demand),status:r.status,
        startDate:iso(r.start_date),endDate:iso(r.end_date)})),
      roadmaps: roadmaps[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,code:r.code,title:r.title,
        description:r.description,ownerPersonId:r.owner_person_id,ownerName:r.owner_name,status:r.status,
        startDate:iso(r.start_date),endDate:iso(r.end_date),items:itemsByRoadmap.get(r.id)??[]})),
      scenarios: scenarios[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,code:r.code,title:r.title,
        description:r.description,ownerPersonId:r.owner_person_id,ownerName:r.owner_name,
        baseScenarioId:r.base_scenario_id??undefined,baseScenarioTitle:r.base_scenario_title??undefined,
        assumptions:json(r.assumptions),budgetAmount:n(r.budget_amount),capacityAmount:n(r.capacity_amount),
        expectedOutcome:r.expected_outcome,status:r.status})),
      plans: plans[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,code:r.code,title:r.title,
        description:r.description,ownerPersonId:r.owner_person_id,ownerName:r.owner_name,planType:r.plan_type,
        periodStart:iso(r.period_start),periodEnd:iso(r.period_end),assumptions:json(r.assumptions),
        targetAmount:n(r.target_amount),forecastAmount:n(r.forecast_amount),actualAmount:n(r.actual_amount),status:r.status})),
      outcomes: outcomes[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,initiativeId:r.initiative_id,
        initiativeTitle:r.initiative_title,title:r.title,measure:r.measure,targetValue:n(r.target_value),
        actualValue:n(r.actual_value),realisedValue:n(r.realised_value),ownerPersonId:r.owner_person_id,
        ownerName:r.owner_name,status:r.status})),
      analyses: analyses[0].map(r=>({id:r.id,canonicalObjectId:r.canonical_object_id,title:r.title,summary:r.summary,
        ownerPersonId:r.owner_person_id,ownerName:r.owner_name,planId:r.plan_id??undefined,planTitle:r.plan_title??undefined,
        scenarioId:r.scenario_id??undefined,scenarioTitle:r.scenario_title??undefined,outcomeId:r.outcome_id??undefined,
        outcomeTitle:r.outcome_title??undefined,status:r.status})),
      coverage:coverage[0],
      totals:{
        objectives:objectives[0].length,
        initiatives:initiatives[0].length,
        roadmaps:roadmaps[0].length,
        scenarios:scenarios[0].length,
        plans:plans[0].length,
        outcomes:outcomes[0].length,
        analyses:analyses[0].length,
        benchmarkCore:coverage[0].filter(r=>r.status==='IMPLEMENTED_CORE').length
      }
    };
  }
}
