-- NuBlox V3 MySQL
-- 0019: F01.03 / AGG-02-OBJECTIVE Strategic Objective runtime.

CREATE TABLE strategic_objectives (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  objective_ref VARCHAR(191) NOT NULL,
  framework_id VARCHAR(36) NOT NULL,
  framework_version_no INT NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_objective_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_objective_framework FOREIGN KEY (framework_id) REFERENCES strategy_frameworks(id),
  CONSTRAINT fk_strategic_objective_framework_version FOREIGN KEY (framework_id, framework_version_no)
    REFERENCES strategy_framework_versions(framework_id, version_no),
  CONSTRAINT fk_strategic_objective_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_objective_ref (tenant_id, objective_ref),
  INDEX idx_strategic_objective_framework (tenant_id, framework_id, framework_version_no, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_objective_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  objective_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  statement TEXT NOT NULL,
  success_criteria TEXT NOT NULL,
  priority VARCHAR(32) NOT NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  horizon_start VARCHAR(32) NULL,
  horizon_end VARCHAR(32) NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_objective_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_objective_version_root FOREIGN KEY (objective_id) REFERENCES strategic_objectives(id),
  CONSTRAINT fk_strategic_objective_version_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_strategic_objective_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_objective_version (objective_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
