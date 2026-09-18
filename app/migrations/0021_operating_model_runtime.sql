-- NuBlox V3 MySQL
-- 0021: F01.05 Operating Model runtime under AGG-02-STRATEGY.

CREATE TABLE strategy_operating_models (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  model_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  framework_id VARCHAR(36) NOT NULL,
  framework_version_no INT NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_operating_model_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_operating_model_framework FOREIGN KEY (framework_id) REFERENCES strategy_frameworks(id),
  CONSTRAINT fk_operating_model_framework_version FOREIGN KEY (framework_id, framework_version_no)
    REFERENCES strategy_framework_versions(framework_id, version_no),
  CONSTRAINT fk_operating_model_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_operating_model_ref (tenant_id, model_ref),
  INDEX idx_operating_model_scope (tenant_id, scope_type, scope_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategy_operating_model_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  operating_model_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  current_state_summary TEXT NOT NULL,
  target_state_summary TEXT NOT NULL,
  design_principles TEXT NOT NULL,
  centralisation_model TEXT NOT NULL,
  shared_service_requirements TEXT NOT NULL,
  organisation_model_reference VARCHAR(500) NULL,
  change_initiatives_summary TEXT NOT NULL,
  approval_decision_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_operating_model_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_operating_model_version_root FOREIGN KEY (operating_model_id) REFERENCES strategy_operating_models(id),
  CONSTRAINT fk_operating_model_version_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_operating_model_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_operating_model_version (operating_model_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategy_operating_model_capabilities (
  id VARCHAR(36) PRIMARY KEY,
  operating_model_version_id VARCHAR(36) NOT NULL,
  capability_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  criticality VARCHAR(32) NOT NULL,
  delivery_model VARCHAR(32) NOT NULL,
  CONSTRAINT fk_operating_model_capability_version
    FOREIGN KEY (operating_model_version_id) REFERENCES strategy_operating_model_versions(id),
  UNIQUE KEY uq_operating_model_capability (operating_model_version_id, capability_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategy_operating_model_accountabilities (
  id VARCHAR(36) PRIMARY KEY,
  operating_model_version_id VARCHAR(36) NOT NULL,
  accountability_key VARCHAR(191) NOT NULL,
  responsibility TEXT NOT NULL,
  accountable_role_key VARCHAR(191) NULL,
  accountable_party_id VARCHAR(36) NULL,
  decision_rights TEXT NOT NULL,
  CONSTRAINT fk_operating_model_accountability_version
    FOREIGN KEY (operating_model_version_id) REFERENCES strategy_operating_model_versions(id),
  CONSTRAINT fk_operating_model_accountability_party
    FOREIGN KEY (accountable_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_operating_model_accountability (operating_model_version_id, accountability_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
