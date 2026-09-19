-- NuBlox V3 MySQL
-- 0034: F05 Product, Service & Innovation Management canonical runtime.
-- Activates AGG-03-MARKET-INSIGHT, AGG-10-ITEM, AGG-10-CONFIGURATION and
-- the F05 profile of the shared AGG-04-BUSINESS-CASE boundary.

CREATE TABLE market_insights (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  insight_ref VARCHAR(191) NOT NULL,
  insight_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  subject TEXT NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  source_reference VARCHAR(500) NULL,
  as_of_at VARCHAR(32) NOT NULL,
  confidence VARCHAR(32) NOT NULL,
  geography VARCHAR(255) NULL,
  sector VARCHAR(255) NULL,
  problem_statement TEXT NOT NULL,
  need_statement TEXT NOT NULL,
  desired_outcome TEXT NULL,
  evidence_reference VARCHAR(500) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  supersedes_insight_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  validated_by_party_id VARCHAR(36) NULL,
  validated_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_market_insight_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_market_insight_supersedes FOREIGN KEY (supersedes_insight_id) REFERENCES market_insights(id),
  CONSTRAINT fk_market_insight_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  CONSTRAINT fk_market_insight_validator FOREIGN KEY (validated_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_market_insight_ref (tenant_id, insight_ref),
  INDEX idx_market_insight_status (tenant_id, insight_type, status, as_of_at),
  INDEX idx_market_insight_sector (tenant_id, sector, geography, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE items (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  item_number VARCHAR(191) NOT NULL,
  item_type VARCHAR(64) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  classification_code VARCHAR(191) NULL,
  base_uom_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_item_uom FOREIGN KEY (base_uom_id) REFERENCES reference_units_of_measure(id),
  CONSTRAINT fk_item_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_item_number (tenant_id, item_number),
  INDEX idx_item_status (tenant_id, item_type, status, updated_at),
  INDEX idx_item_classification (tenant_id, classification_code, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_concept_profiles (
  item_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  concept_type VARCHAR(32) NOT NULL,
  need_summary TEXT NOT NULL,
  opportunity_summary TEXT NOT NULL,
  feasibility_summary TEXT NULL,
  score DECIMAL(9,4) NULL,
  score_basis_json JSON NOT NULL,
  concept_status VARCHAR(32) NOT NULL,
  selected_decision_id VARCHAR(36) NULL,
  selected_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_concept_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_item_concept_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_item_concept_decision FOREIGN KEY (selected_decision_id) REFERENCES work_decisions(id),
  INDEX idx_item_concept_status (tenant_id, concept_status, score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_concept_assessments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  assessment_type VARCHAR(64) NOT NULL,
  rating VARCHAR(32) NULL,
  score DECIMAL(9,4) NULL,
  summary TEXT NOT NULL,
  evidence_reference VARCHAR(500) NULL,
  assessed_by_party_id VARCHAR(36) NOT NULL,
  assessed_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_concept_assessment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_item_concept_assessment_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_item_concept_assessment_actor FOREIGN KEY (assessed_by_party_id) REFERENCES parties(id),
  INDEX idx_item_concept_assessment (tenant_id, item_id, assessment_type, assessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_models (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  model_ref VARCHAR(191) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  title VARCHAR(500) NOT NULL,
  definition_scope TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  released_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_config_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_product_config_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_product_config_ref (tenant_id, model_ref),
  INDEX idx_product_config_item (tenant_id, item_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  model_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  design_summary TEXT NOT NULL,
  definition_json JSON NOT NULL,
  specification_json JSON NOT NULL,
  validation_criteria TEXT NOT NULL,
  prototype_basis_json JSON NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  released_at VARCHAR(32) NULL,
  CONSTRAINT fk_product_config_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_version_model FOREIGN KEY (model_id) REFERENCES product_configuration_models(id),
  CONSTRAINT fk_product_config_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_product_config_version (model_id, version_no),
  INDEX idx_product_config_version_status (tenant_id, model_id, lifecycle_status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_characteristics (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  configuration_version_id VARCHAR(36) NOT NULL,
  characteristic_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  value_type VARCHAR(64) NOT NULL,
  required_flag BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_values_json JSON NOT NULL,
  default_value VARCHAR(500) NULL,
  unit_of_measure_id VARCHAR(36) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_config_characteristic_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_characteristic_version FOREIGN KEY (configuration_version_id) REFERENCES product_configuration_versions(id),
  CONSTRAINT fk_product_config_characteristic_uom FOREIGN KEY (unit_of_measure_id) REFERENCES reference_units_of_measure(id),
  UNIQUE KEY uq_product_config_characteristic (configuration_version_id, characteristic_key),
  INDEX idx_product_config_characteristic_version (tenant_id, configuration_version_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_rules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  configuration_version_id VARCHAR(36) NOT NULL,
  rule_key VARCHAR(191) NOT NULL,
  rule_type VARCHAR(64) NOT NULL,
  expression_text TEXT NOT NULL,
  severity VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_config_rule_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_rule_version FOREIGN KEY (configuration_version_id) REFERENCES product_configuration_versions(id),
  UNIQUE KEY uq_product_config_rule (configuration_version_id, rule_key),
  INDEX idx_product_config_rule_version (tenant_id, configuration_version_id, rule_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_requirement_links (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  configuration_version_id VARCHAR(36) NOT NULL,
  requirement_type VARCHAR(64) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  traceability_role VARCHAR(64) NOT NULL,
  validation_status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_config_requirement_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_requirement_version FOREIGN KEY (configuration_version_id) REFERENCES product_configuration_versions(id),
  UNIQUE KEY uq_product_config_requirement
    (configuration_version_id, requirement_type, subject_id, traceability_role),
  INDEX idx_product_config_requirement_subject (tenant_id, requirement_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_configuration_trials (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  configuration_version_id VARCHAR(36) NOT NULL,
  trial_ref VARCHAR(191) NOT NULL,
  trial_type VARCHAR(64) NOT NULL,
  hypothesis TEXT NOT NULL,
  method TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  result_summary TEXT NOT NULL,
  evidence_reference VARCHAR(500) NULL,
  conducted_by_party_id VARCHAR(36) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_config_trial_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_config_trial_version FOREIGN KEY (configuration_version_id) REFERENCES product_configuration_versions(id),
  CONSTRAINT fk_product_config_trial_actor FOREIGN KEY (conducted_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_product_config_trial (configuration_version_id, trial_ref),
  INDEX idx_product_config_trial_outcome (tenant_id, configuration_version_id, outcome, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_service_business_case_profiles (
  business_case_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  case_domain VARCHAR(32) NOT NULL,
  portfolio_bucket VARCHAR(191) NOT NULL,
  item_id VARCHAR(36) NULL,
  primary_market_insight_id VARCHAR(36) NULL,
  innovation_stage VARCHAR(64) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_case_profile_case FOREIGN KEY (business_case_id) REFERENCES business_cases(id),
  CONSTRAINT fk_product_case_profile_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_product_case_profile_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_product_case_profile_insight FOREIGN KEY (primary_market_insight_id) REFERENCES market_insights(id),
  INDEX idx_product_case_profile_portfolio (tenant_id, case_domain, portfolio_bucket),
  INDEX idx_product_case_profile_item (tenant_id, item_id, case_domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_service_business_case_version_profiles (
  business_case_version_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  demand_forecast_json JSON NOT NULL,
  roi_json JSON NOT NULL,
  market_basis_json JSON NOT NULL,
  product_scope_json JSON NOT NULL,
  funding_envelope_json JSON NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_product_case_version_profile_version FOREIGN KEY (business_case_version_id) REFERENCES business_case_versions(id),
  CONSTRAINT fk_product_case_version_profile_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_product_case_version_profile_tenant (tenant_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_service_business_case_source_links (
  business_case_version_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  link_type VARCHAR(64) NOT NULL,
  subject_type VARCHAR(64) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  created_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (business_case_version_id, link_type, subject_type, subject_id),
  CONSTRAINT fk_product_case_source_version FOREIGN KEY (business_case_version_id) REFERENCES business_case_versions(id),
  CONSTRAINT fk_product_case_source_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_product_case_source_subject (tenant_id, subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE innovation_experiments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  business_case_version_id VARCHAR(36) NOT NULL,
  experiment_ref VARCHAR(191) NOT NULL,
  title VARCHAR(500) NOT NULL,
  hypothesis TEXT NOT NULL,
  method TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  outcome VARCHAR(32) NULL,
  result_summary TEXT NULL,
  evidence_reference VARCHAR(500) NULL,
  started_at VARCHAR(32) NULL,
  completed_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_innovation_experiment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_innovation_experiment_case_version FOREIGN KEY (business_case_version_id) REFERENCES business_case_versions(id),
  CONSTRAINT fk_innovation_experiment_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_innovation_experiment_ref (tenant_id, experiment_ref),
  INDEX idx_innovation_experiment_status (tenant_id, business_case_version_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE innovation_funding_allocations (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  business_case_version_id VARCHAR(36) NOT NULL,
  funding_type VARCHAR(64) NOT NULL,
  amount DECIMAL(30,10) NOT NULL,
  currency_id VARCHAR(36) NOT NULL,
  basis TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  recorded_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_innovation_funding_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_innovation_funding_case_version FOREIGN KEY (business_case_version_id) REFERENCES business_case_versions(id),
  CONSTRAINT fk_innovation_funding_currency FOREIGN KEY (currency_id) REFERENCES reference_currencies(id),
  CONSTRAINT fk_innovation_funding_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  INDEX idx_innovation_funding_case (tenant_id, business_case_version_id, status, recorded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_launch_profiles (
  item_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  launch_plan TEXT NOT NULL,
  channel_readiness TEXT NOT NULL,
  training_readiness TEXT NOT NULL,
  pricing_reference VARCHAR(500) NOT NULL,
  launch_status VARCHAR(32) NOT NULL,
  planned_launch_at VARCHAR(32) NULL,
  launched_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_launch_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_item_launch_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_item_launch_status (tenant_id, launch_status, planned_launch_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_lifecycle_reviews (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  item_id VARCHAR(36) NOT NULL,
  review_type VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  metrics_json JSON NOT NULL,
  recommendation TEXT NOT NULL,
  configuration_model_id VARCHAR(36) NULL,
  reviewed_by_party_id VARCHAR(36) NOT NULL,
  reviewed_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_lifecycle_review_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_item_lifecycle_review_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_item_lifecycle_review_config FOREIGN KEY (configuration_model_id) REFERENCES product_configuration_models(id),
  CONSTRAINT fk_item_lifecycle_review_actor FOREIGN KEY (reviewed_by_party_id) REFERENCES parties(id),
  INDEX idx_item_lifecycle_review (tenant_id, item_id, review_type, reviewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE item_retirement_profiles (
  item_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  rationale TEXT NOT NULL,
  stakeholder_notice_reference VARCHAR(500) NULL,
  customer_migration_plan TEXT NULL,
  support_end_at VARCHAR(32) NULL,
  archive_reference VARCHAR(500) NULL,
  retirement_status VARCHAR(32) NOT NULL,
  initiated_at VARCHAR(32) NOT NULL,
  retired_at VARCHAR(32) NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_item_retirement_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_item_retirement_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_item_retirement_status (tenant_id, retirement_status, support_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
