-- NuBlox V3 MySQL
-- 0013: authority configuration runtime
-- Implements AGG-29-AUTHORITY-CONFIG. Policy constrains runtime authority but never becomes an effective grant.

CREATE TABLE approval_authority_rules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  rule_key VARCHAR(191) NOT NULL,
  action_key VARCHAR(191) NOT NULL,
  object_type VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_approval_authority_rule_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_approval_authority_rule_key (tenant_id, rule_key),
  INDEX idx_approval_authority_rule_match (tenant_id, action_key, object_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE approval_authority_rule_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  approval_authority_rule_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  currency_code CHAR(3) NULL,
  minimum_value DECIMAL(19,4) NULL,
  maximum_value DECIMAL(19,4) NULL,
  required_authority_type VARCHAR(191) NOT NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_approval_rule_version_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_approval_rule_version_rule
    FOREIGN KEY (approval_authority_rule_id) REFERENCES approval_authority_rules(id),
  CONSTRAINT fk_approval_rule_version_creator
    FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_approval_authority_rule_version (approval_authority_rule_id, version_no),
  INDEX idx_approval_authority_rule_version_status
    (tenant_id, approval_authority_rule_id, status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE delegated_authority_rules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  rule_key VARCHAR(191) NOT NULL,
  authority_type VARCHAR(191) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_delegated_authority_rule_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_delegated_authority_rule_key (tenant_id, rule_key),
  INDEX idx_delegated_authority_rule_match (tenant_id, authority_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE delegated_authority_rule_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  delegated_authority_rule_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  allowed_scope_type VARCHAR(64) NOT NULL,
  allowed_scope_id VARCHAR(191) NULL,
  currency_code CHAR(3) NULL,
  maximum_value DECIMAL(19,4) NULL,
  maximum_duration_days INT UNSIGNED NULL,
  allow_subdelegation BOOLEAN NOT NULL DEFAULT FALSE,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_delegated_rule_version_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_delegated_rule_version_rule
    FOREIGN KEY (delegated_authority_rule_id) REFERENCES delegated_authority_rules(id),
  CONSTRAINT fk_delegated_rule_version_creator
    FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_delegated_authority_rule_version (delegated_authority_rule_id, version_no),
  INDEX idx_delegated_authority_rule_version_status
    (tenant_id, delegated_authority_rule_id, status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
