-- NuBlox V3 MySQL
-- 0011: governed classification runtime
-- Implements AGG-29-CLASSIFICATION. Classification overlays business identity; it never replaces it.

CREATE TABLE classification_systems (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  system_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  publisher VARCHAR(255) NOT NULL,
  system_identifier VARCHAR(255) NULL,
  purpose TEXT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_classification_system_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_classification_system_key (tenant_id, system_key),
  INDEX idx_classification_system_status (tenant_id, status, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE classification_releases (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  classification_system_id VARCHAR(36) NOT NULL,
  release_key VARCHAR(191) NOT NULL,
  publication_date VARCHAR(32) NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  source_digest_algorithm VARCHAR(32) NOT NULL,
  source_digest VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  published_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_classification_release_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_classification_release_system
    FOREIGN KEY (classification_system_id) REFERENCES classification_systems(id),
  UNIQUE KEY uq_classification_release_key (classification_system_id, release_key),
  INDEX idx_classification_release_status (tenant_id, classification_system_id, status, publication_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE classification_codes (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  classification_system_id VARCHAR(36) NOT NULL,
  classification_release_id VARCHAR(36) NOT NULL,
  code VARCHAR(191) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT NULL,
  parent_code_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_classification_code_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_classification_code_system
    FOREIGN KEY (classification_system_id) REFERENCES classification_systems(id),
  CONSTRAINT fk_classification_code_release
    FOREIGN KEY (classification_release_id) REFERENCES classification_releases(id),
  CONSTRAINT fk_classification_code_parent
    FOREIGN KEY (parent_code_id) REFERENCES classification_codes(id),
  UNIQUE KEY uq_classification_release_code (classification_release_id, code),
  INDEX idx_classification_code_lookup (tenant_id, classification_system_id, classification_release_id, status, code),
  INDEX idx_classification_code_parent (classification_release_id, parent_code_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
