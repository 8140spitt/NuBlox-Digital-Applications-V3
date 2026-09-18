-- NuBlox V3 MySQL
-- 0012: governed lifecycle configuration runtime
-- Implements AGG-29-LIFECYCLE-CONFIG. Configuration constrains domain transitions but never owns runtime domain state.

CREATE TABLE lifecycle_definitions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lifecycle_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  applies_to_type VARCHAR(128) NOT NULL,
  purpose TEXT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_lifecycle_definition_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_lifecycle_definition_key (tenant_id, lifecycle_key),
  INDEX idx_lifecycle_definition_type (tenant_id, applies_to_type, status, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lifecycle_definition_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lifecycle_definition_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  description TEXT NULL,
  initial_state_key VARCHAR(128) NULL,
  published_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_lifecycle_version_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lifecycle_version_definition
    FOREIGN KEY (lifecycle_definition_id) REFERENCES lifecycle_definitions(id),
  CONSTRAINT fk_lifecycle_version_creator
    FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_lifecycle_definition_version (lifecycle_definition_id, version_no),
  INDEX idx_lifecycle_version_status (tenant_id, lifecycle_definition_id, status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lifecycle_state_definitions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lifecycle_definition_id VARCHAR(36) NOT NULL,
  lifecycle_version_id VARCHAR(36) NOT NULL,
  state_key VARCHAR(128) NOT NULL,
  label VARCHAR(255) NOT NULL,
  terminal_flag BOOLEAN NOT NULL DEFAULT FALSE,
  entry_constraints_json JSON NULL,
  exit_constraints_json JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_lifecycle_state_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lifecycle_state_definition
    FOREIGN KEY (lifecycle_definition_id) REFERENCES lifecycle_definitions(id),
  CONSTRAINT fk_lifecycle_state_version
    FOREIGN KEY (lifecycle_version_id) REFERENCES lifecycle_definition_versions(id),
  UNIQUE KEY uq_lifecycle_state_key (lifecycle_version_id, state_key),
  INDEX idx_lifecycle_state_order (lifecycle_version_id, sort_order, state_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lifecycle_transition_rules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lifecycle_definition_id VARCHAR(36) NOT NULL,
  lifecycle_version_id VARCHAR(36) NOT NULL,
  transition_key VARCHAR(128) NOT NULL,
  from_state_key VARCHAR(128) NOT NULL,
  to_state_key VARCHAR(128) NOT NULL,
  guard_json JSON NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_lifecycle_transition_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lifecycle_transition_definition
    FOREIGN KEY (lifecycle_definition_id) REFERENCES lifecycle_definitions(id),
  CONSTRAINT fk_lifecycle_transition_version
    FOREIGN KEY (lifecycle_version_id) REFERENCES lifecycle_definition_versions(id),
  UNIQUE KEY uq_lifecycle_transition_key (lifecycle_version_id, transition_key),
  UNIQUE KEY uq_lifecycle_transition_path (lifecycle_version_id, from_state_key, to_state_key, transition_key),
  INDEX idx_lifecycle_transition_from (lifecycle_version_id, from_state_key, transition_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
