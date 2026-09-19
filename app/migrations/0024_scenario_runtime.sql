-- NuBlox V3 MySQL
-- 0024: F01.08 Scenario & Foresight / AGG-02-SCENARIO.

CREATE TABLE strategic_scenarios (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  scenario_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  scenario_type VARCHAR(32) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  horizon_start VARCHAR(32) NOT NULL,
  horizon_end VARCHAR(32) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_scenario_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_scenario_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_scenario_ref (tenant_id, scenario_ref),
  INDEX idx_strategic_scenario_scope (tenant_id, scenario_type, scope_type, scope_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  scenario_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  narrative TEXT NOT NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_scenario_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_scenario_version_root FOREIGN KEY (scenario_id) REFERENCES strategic_scenarios(id),
  CONSTRAINT fk_strategic_scenario_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_scenario_version (scenario_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_drivers (
  id VARCHAR(36) PRIMARY KEY,
  scenario_version_id VARCHAR(36) NOT NULL,
  driver_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  base_state TEXT NOT NULL,
  direction VARCHAR(32) NOT NULL,
  rationale TEXT NOT NULL,
  CONSTRAINT fk_strategic_scenario_driver_version FOREIGN KEY (scenario_version_id) REFERENCES strategic_scenario_versions(id),
  UNIQUE KEY uq_strategic_scenario_driver (scenario_version_id, driver_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_assumptions (
  scenario_version_id VARCHAR(36) NOT NULL,
  assumption_id VARCHAR(36) NOT NULL,
  assumption_version_no INT UNSIGNED NOT NULL,
  PRIMARY KEY (scenario_version_id, assumption_id),
  CONSTRAINT fk_strategic_scenario_assumption_version FOREIGN KEY (scenario_version_id) REFERENCES strategic_scenario_versions(id),
  CONSTRAINT fk_strategic_scenario_assumption FOREIGN KEY (assumption_id) REFERENCES strategic_assumptions(id),
  CONSTRAINT fk_strategic_scenario_assumption_exact FOREIGN KEY (assumption_id, assumption_version_no)
    REFERENCES strategic_assumption_versions(assumption_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_kpi_projections (
  id VARCHAR(36) PRIMARY KEY,
  scenario_version_id VARCHAR(36) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  projected_value DECIMAL(30,10) NOT NULL,
  projection_note TEXT NOT NULL,
  CONSTRAINT fk_strategic_scenario_projection_version FOREIGN KEY (scenario_version_id) REFERENCES strategic_scenario_versions(id),
  CONSTRAINT fk_strategic_scenario_projection_kpi FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_strategic_scenario_projection_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  UNIQUE KEY uq_strategic_scenario_projection (scenario_version_id, kpi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_sensitivity_runs (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  scenario_id VARCHAR(36) NOT NULL,
  scenario_version_no INT UNSIGNED NOT NULL,
  variable_key VARCHAR(191) NOT NULL,
  low_case DECIMAL(30,10) NULL,
  base_case DECIMAL(30,10) NULL,
  high_case DECIMAL(30,10) NULL,
  result_summary TEXT NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_scenario_sensitivity_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_scenario_sensitivity_scenario FOREIGN KEY (scenario_id) REFERENCES strategic_scenarios(id),
  CONSTRAINT fk_strategic_scenario_sensitivity_version FOREIGN KEY (scenario_id, scenario_version_no)
    REFERENCES strategic_scenario_versions(scenario_id, version_no),
  CONSTRAINT fk_strategic_scenario_sensitivity_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_strategic_scenario_sensitivity (tenant_id, scenario_id, scenario_version_no, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_scenario_contingencies (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  scenario_id VARCHAR(36) NOT NULL,
  scenario_version_no INT UNSIGNED NOT NULL,
  contingency_ref VARCHAR(191) NOT NULL,
  trigger_condition TEXT NOT NULL,
  response_strategy TEXT NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_scenario_contingency_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_scenario_contingency_scenario FOREIGN KEY (scenario_id) REFERENCES strategic_scenarios(id),
  CONSTRAINT fk_strategic_scenario_contingency_version FOREIGN KEY (scenario_id, scenario_version_no)
    REFERENCES strategic_scenario_versions(scenario_id, version_no),
  CONSTRAINT fk_strategic_scenario_contingency_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_scenario_contingency (tenant_id, contingency_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
