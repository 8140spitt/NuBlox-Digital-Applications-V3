-- NuBlox V3 MySQL
-- 0026: F02.02 / AGG-02-AUTHORITY-FRAMEWORK runtime.

CREATE TABLE authority_frameworks (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  framework_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  active_version_no INT UNSIGNED NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_authority_framework_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_authority_framework_ref (tenant_id, framework_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE authority_framework_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  framework_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  purpose TEXT NOT NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  approval_decision_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_authority_framework_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_authority_framework_version_root FOREIGN KEY (framework_id) REFERENCES authority_frameworks(id),
  CONSTRAINT fk_authority_framework_version_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_authority_framework_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_authority_framework_version (framework_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE authority_framework_rules (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  framework_id VARCHAR(36) NOT NULL,
  framework_version_no INT UNSIGNED NOT NULL,
  rule_key VARCHAR(191) NOT NULL,
  rule_type VARCHAR(64) NOT NULL,
  action_type VARCHAR(191) NULL,
  authority_class VARCHAR(191) NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  currency_code CHAR(3) NULL,
  minimum_value DECIMAL(19,4) NULL,
  maximum_value DECIMAL(19,4) NULL,
  reserved_matter BOOLEAN NOT NULL DEFAULT FALSE,
  allow_delegation BOOLEAN NOT NULL DEFAULT FALSE,
  allow_subdelegation BOOLEAN NOT NULL DEFAULT FALSE,
  incompatible_role_key VARCHAR(191) NULL,
  description TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_authority_framework_rule_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_authority_framework_rule_version FOREIGN KEY (framework_id, framework_version_no)
    REFERENCES authority_framework_versions(framework_id, version_no),
  UNIQUE KEY uq_authority_framework_rule (framework_id, framework_version_no, rule_key),
  INDEX idx_authority_framework_rule_match
    (tenant_id, framework_id, framework_version_no, rule_type, action_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
