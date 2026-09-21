CREATE TABLE strategy_objectives (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  parent_objective_id VARCHAR(64) NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  objective_level VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_objectives_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_objectives_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_strategy_objectives_code (tenant_id, code),
  KEY ix_strategy_objectives_owner (tenant_id, owner_person_id, status),
  CONSTRAINT fk_strategy_objectives_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_objectives_parent FOREIGN KEY (tenant_id, parent_objective_id)
    REFERENCES strategy_objectives(tenant_id, id),
  CONSTRAINT fk_strategy_objectives_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_strategy_objectives_level CHECK (objective_level IN ('ENTERPRISE','FUNCTION','TEAM'))
) ENGINE=InnoDB;

CREATE TABLE strategy_key_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  objective_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  measure VARCHAR(255) NOT NULL,
  baseline_value DECIMAL(20,4) NULL,
  target_value DECIMAL(20,4) NULL,
  actual_value DECIMAL(20,4) NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_key_results_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_strategy_key_results_objective FOREIGN KEY (tenant_id, objective_id)
    REFERENCES strategy_objectives(tenant_id, id),
  CONSTRAINT fk_strategy_key_results_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_initiatives (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  objective_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  investment_amount DECIMAL(20,2) NULL,
  capacity_demand DECIMAL(12,2) NULL,
  status VARCHAR(24) NOT NULL,
  start_date DATETIME(6) NULL,
  end_date DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_initiatives_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_initiatives_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_strategy_initiatives_code (tenant_id, code),
  CONSTRAINT fk_strategy_initiatives_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_initiatives_objective FOREIGN KEY (tenant_id, objective_id)
    REFERENCES strategy_objectives(tenant_id, id),
  CONSTRAINT fk_strategy_initiatives_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_roadmaps (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  start_date DATETIME(6) NULL,
  end_date DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_roadmaps_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_roadmaps_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_strategy_roadmaps_code (tenant_id, code),
  CONSTRAINT fk_strategy_roadmaps_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_roadmaps_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_roadmap_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  roadmap_id VARCHAR(64) NOT NULL,
  objective_id VARCHAR(64) NULL,
  initiative_id VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  milestone_date DATETIME(6) NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_strategy_roadmap_items_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_strategy_roadmap_items_roadmap FOREIGN KEY (tenant_id, roadmap_id)
    REFERENCES strategy_roadmaps(tenant_id, id),
  CONSTRAINT fk_strategy_roadmap_items_objective FOREIGN KEY (tenant_id, objective_id)
    REFERENCES strategy_objectives(tenant_id, id),
  CONSTRAINT fk_strategy_roadmap_items_initiative FOREIGN KEY (tenant_id, initiative_id)
    REFERENCES strategy_initiatives(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_scenarios (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  base_scenario_id VARCHAR(64) NULL,
  assumptions JSON NOT NULL,
  budget_amount DECIMAL(20,2) NULL,
  capacity_amount DECIMAL(12,2) NULL,
  expected_outcome TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_scenarios_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_scenarios_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_strategy_scenarios_code (tenant_id, code),
  CONSTRAINT fk_strategy_scenarios_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_scenarios_base FOREIGN KEY (tenant_id, base_scenario_id)
    REFERENCES strategy_scenarios(tenant_id, id),
  CONSTRAINT fk_strategy_scenarios_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_plans (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  plan_type VARCHAR(32) NOT NULL,
  period_start DATETIME(6) NULL,
  period_end DATETIME(6) NULL,
  assumptions JSON NOT NULL,
  target_amount DECIMAL(20,2) NULL,
  forecast_amount DECIMAL(20,2) NULL,
  actual_amount DECIMAL(20,2) NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_plans_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_plans_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_strategy_plans_code (tenant_id, code),
  CONSTRAINT fk_strategy_plans_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_plans_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_strategy_plans_type CHECK
    (plan_type IN ('CONNECTED_ENTERPRISE','CAPACITY_INVESTMENT','BUDGET_FORECAST'))
) ENGINE=InnoDB;

CREATE TABLE strategy_outcomes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  initiative_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  measure VARCHAR(255) NOT NULL,
  target_value DECIMAL(20,4) NULL,
  actual_value DECIMAL(20,4) NULL,
  realised_value DECIMAL(20,2) NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_outcomes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_outcomes_object (tenant_id, canonical_object_id),
  CONSTRAINT fk_strategy_outcomes_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_outcomes_initiative FOREIGN KEY (tenant_id, initiative_id)
    REFERENCES strategy_initiatives(tenant_id, id),
  CONSTRAINT fk_strategy_outcomes_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_analyses (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  owner_person_id VARCHAR(64) NOT NULL,
  plan_id VARCHAR(64) NULL,
  scenario_id VARCHAR(64) NULL,
  outcome_id VARCHAR(64) NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_strategy_analyses_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_strategy_analyses_object (tenant_id, canonical_object_id),
  CONSTRAINT fk_strategy_analyses_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_strategy_analyses_owner FOREIGN KEY (tenant_id, owner_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_strategy_analyses_plan FOREIGN KEY (tenant_id, plan_id)
    REFERENCES strategy_plans(tenant_id, id),
  CONSTRAINT fk_strategy_analyses_scenario FOREIGN KEY (tenant_id, scenario_id)
    REFERENCES strategy_scenarios(tenant_id, id),
  CONSTRAINT fk_strategy_analyses_outcome FOREIGN KEY (tenant_id, outcome_id)
    REFERENCES strategy_outcomes(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE strategy_benchmark_coverage (
  capability_id VARCHAR(32) NOT NULL PRIMARY KEY,
  native_object VARCHAR(64) NOT NULL,
  native_operation VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  verified_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

INSERT INTO strategy_benchmark_coverage
  (capability_id, native_object, native_operation, status)
VALUES
  ('ENT-MTC-0001','OBJECTIVE_INITIATIVE_ALIGNMENT','Align objectives, investments and initiatives','IMPLEMENTED_CORE'),
  ('ENT-MTC-0002','OBJECTIVE_KEY_RESULT','Create and cascade objectives and key results','IMPLEMENTED_CORE'),
  ('ENT-MTC-0003','STRATEGY_ROADMAP','Create strategic roadmaps and milestones','IMPLEMENTED_CORE'),
  ('ENT-MTC-0004','STRATEGY_SCENARIO','Model investment and capacity scenarios','IMPLEMENTED_CORE'),
  ('ENT-MTC-0005','STRATEGY_PLAN','Create capacity and investment plans','IMPLEMENTED_CORE'),
  ('ENT-MTC-0006','STRATEGY_OUTCOME','Trace initiatives to outcomes and realised value','IMPLEMENTED_CORE'),
  ('ENT-MTC-0007','STRATEGY_PLAN','Create connected enterprise planning records','IMPLEMENTED_CORE'),
  ('ENT-MTC-0008','STRATEGY_SCENARIO','Create and compare strategic scenarios','IMPLEMENTED_CORE'),
  ('ENT-MTC-0009','STRATEGY_PLAN','Create budget and forecast planning records','IMPLEMENTED_CORE'),
  ('ENT-MTC-0010','STRATEGY_ANALYSIS','Create management analysis from plans, scenarios and outcomes','IMPLEMENTED_CORE');
