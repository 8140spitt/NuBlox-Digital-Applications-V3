import type {
  CanonicalObjectId,
  PersonId,
  TenantId
} from './ids.js';

export type StrategyRecordStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'ALIGNED'
  | 'PRIORITISED'
  | 'APPROVED'
  | 'FUNDED'
  | 'ACTIVE'
  | 'TRACKING'
  | 'REVIEW'
  | 'SELECTED'
  | 'COMMITTED'
  | 'REBALANCED'
  | 'COMPLETE'
  | 'CANCELLED';

export interface StrategyObjective {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  parentObjectiveId?: string;
  code: string;
  title: string;
  description: string;
  ownerPersonId: PersonId;
  level: 'ENTERPRISE' | 'FUNCTION' | 'TEAM';
  status: StrategyRecordStatus;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface StrategyKeyResult {
  id: string;
  tenantId: TenantId;
  objectiveId: string;
  title: string;
  measure: string;
  baselineValue?: number;
  targetValue?: number;
  actualValue?: number;
  ownerPersonId: PersonId;
  status: StrategyRecordStatus;
}

export interface StrategyInitiative {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  objectiveId: string;
  code: string;
  title: string;
  description: string;
  ownerPersonId: PersonId;
  investmentAmount?: number;
  capacityDemand?: number;
  status: StrategyRecordStatus;
  startDate?: string;
  endDate?: string;
}

export interface StrategyRoadmap {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  code: string;
  title: string;
  description: string;
  ownerPersonId: PersonId;
  status: StrategyRecordStatus;
  startDate?: string;
  endDate?: string;
}

export interface StrategyRoadmapItem {
  id: string;
  tenantId: TenantId;
  roadmapId: string;
  objectiveId?: string;
  initiativeId?: string;
  title: string;
  milestoneDate?: string;
  sequence: number;
  status: StrategyRecordStatus;
}

export interface StrategyScenario {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  code: string;
  title: string;
  description: string;
  ownerPersonId: PersonId;
  baseScenarioId?: string;
  assumptions: string;
  budgetAmount?: number;
  capacityAmount?: number;
  expectedOutcome: string;
  status: StrategyRecordStatus;
}

export type StrategyPlanType =
  | 'CONNECTED_ENTERPRISE'
  | 'CAPACITY_INVESTMENT'
  | 'BUDGET_FORECAST';

export interface StrategyPlan {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  code: string;
  title: string;
  description: string;
  ownerPersonId: PersonId;
  planType: StrategyPlanType;
  periodStart?: string;
  periodEnd?: string;
  assumptions: string;
  targetAmount?: number;
  forecastAmount?: number;
  actualAmount?: number;
  status: StrategyRecordStatus;
}

export interface StrategyOutcome {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  initiativeId: string;
  title: string;
  measure: string;
  targetValue?: number;
  actualValue?: number;
  realisedValue?: number;
  ownerPersonId: PersonId;
  status: StrategyRecordStatus;
}

export interface StrategyAnalysis {
  id: string;
  tenantId: TenantId;
  canonicalObjectId: CanonicalObjectId;
  title: string;
  summary: string;
  ownerPersonId: PersonId;
  planId?: string;
  scenarioId?: string;
  outcomeId?: string;
  status: StrategyRecordStatus;
}

export const F01_BENCHMARK_COVERAGE = {
  OBJECTIVE_INITIATIVE_ALIGNMENT: ['ENT-MTC-0001'],
  OKR_HIERARCHY: ['ENT-MTC-0002'],
  ROADMAP: ['ENT-MTC-0003'],
  INVESTMENT_SCENARIO: ['ENT-MTC-0004'],
  CAPACITY_INVESTMENT_PLAN: ['ENT-MTC-0005'],
  OUTCOME_TRACKING: ['ENT-MTC-0006'],
  CONNECTED_PLANNING: ['ENT-MTC-0007'],
  SCENARIO_COMPARISON: ['ENT-MTC-0008'],
  BUDGET_FORECAST: ['ENT-MTC-0009'],
  MANAGEMENT_ANALYSIS: ['ENT-MTC-0010']
} as const;
