-- NuBlox V3 MySQL
-- 0018: F01.02 Environmental Analysis / AGG-02-ASSUMPTION runtime.

CREATE TABLE strategic_assumptions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  assumption_ref VARCHAR(191) NOT NULL,
  category VARCHAR(64) NOT NULL,
  owner_party_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_assumption_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_assumption_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_assumption_ref (tenant_id, assumption_ref),
  INDEX idx_strategic_assumption_category (tenant_id, category, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_assumption_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  assumption_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  statement TEXT NOT NULL,
  basis_summary TEXT NOT NULL,
  evidence_item_id VARCHAR(36) NULL,
  confidence_percent DECIMAL(5,2) NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  assessment_note TEXT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_assumption_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_assumption_version_root FOREIGN KEY (assumption_id) REFERENCES strategic_assumptions(id),
  CONSTRAINT fk_strategic_assumption_version_evidence FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  CONSTRAINT fk_strategic_assumption_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_strategic_assumption_version (assumption_id, version_no),
  INDEX idx_strategic_assumption_version_evidence (tenant_id, evidence_item_id),
  INDEX idx_strategic_assumption_version_effective (tenant_id, lifecycle_status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
