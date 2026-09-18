-- NuBlox V3 MySQL
-- 0022: F01.06 Goal & KPI Management / AGG-02-PERFORMANCE.

CREATE TABLE performance_kpis (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  kpi_code VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_kpi_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_kpi_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_kpi_code (tenant_id, kpi_code),
  INDEX idx_performance_kpi_status (tenant_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_kpi_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  business_definition TEXT NOT NULL,
  formula TEXT NOT NULL,
  unit_of_measure_id VARCHAR(36) NOT NULL,
  frequency VARCHAR(64) NOT NULL,
  dimensions_json JSON NOT NULL,
  source_data TEXT NOT NULL,
  quality_rules TEXT NOT NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_kpi_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_kpi_version_root FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_kpi_version_uom FOREIGN KEY (unit_of_measure_id) REFERENCES reference_units_of_measure(id),
  CONSTRAINT fk_performance_kpi_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_kpi_version (kpi_id, version_no),
  INDEX idx_performance_kpi_version_status (tenant_id, kpi_id, lifecycle_status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_kpi_objectives (
  kpi_version_id VARCHAR(36) NOT NULL,
  objective_id VARCHAR(36) NOT NULL,
  objective_version_no INT UNSIGNED NOT NULL,
  PRIMARY KEY (kpi_version_id, objective_id),
  CONSTRAINT fk_performance_kpi_objective_version FOREIGN KEY (kpi_version_id) REFERENCES performance_kpi_versions(id),
  CONSTRAINT fk_performance_kpi_objective FOREIGN KEY (objective_id) REFERENCES strategic_objectives(id),
  CONSTRAINT fk_performance_kpi_objective_exact FOREIGN KEY (objective_id, objective_version_no)
    REFERENCES strategic_objective_versions(objective_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_targets (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  target_ref VARCHAR(191) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  period_start VARCHAR(32) NOT NULL,
  period_end VARCHAR(32) NOT NULL,
  target_value DECIMAL(30,10) NOT NULL,
  comparison_operator VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_target_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_target_kpi FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_target_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  CONSTRAINT fk_performance_target_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_target_ref (tenant_id, target_ref),
  INDEX idx_performance_target_lookup (tenant_id, kpi_id, scope_type, scope_id, period_start, period_end, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_observations (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  subject_type VARCHAR(64) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  period_start VARCHAR(32) NOT NULL,
  period_end VARCHAR(32) NOT NULL,
  observed_at VARCHAR(32) NOT NULL,
  numeric_value DECIMAL(30,10) NOT NULL,
  unit_of_measure_id VARCHAR(36) NOT NULL,
  source_reference VARCHAR(500) NOT NULL,
  quality_status VARCHAR(32) NOT NULL,
  correction_of_id VARCHAR(36) NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_observation_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_observation_kpi FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_observation_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  CONSTRAINT fk_performance_observation_uom FOREIGN KEY (unit_of_measure_id) REFERENCES reference_units_of_measure(id),
  CONSTRAINT fk_performance_observation_correction FOREIGN KEY (correction_of_id) REFERENCES performance_observations(id),
  CONSTRAINT fk_performance_observation_recorder FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  INDEX idx_performance_observation_lookup (tenant_id, kpi_id, subject_type, subject_id, period_start, period_end, quality_status, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_baselines (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  baseline_ref VARCHAR(191) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  period_start VARCHAR(32) NOT NULL,
  period_end VARCHAR(32) NOT NULL,
  observation_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_baseline_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_baseline_kpi FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_baseline_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  CONSTRAINT fk_performance_baseline_observation FOREIGN KEY (observation_id) REFERENCES performance_observations(id),
  CONSTRAINT fk_performance_baseline_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_baseline_ref (tenant_id, baseline_ref),
  INDEX idx_performance_baseline_lookup (tenant_id, kpi_id, scope_type, scope_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
