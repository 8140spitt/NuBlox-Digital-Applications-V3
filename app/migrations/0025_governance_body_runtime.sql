-- NuBlox V3 MySQL
-- 0025: F02.01 / F02.05 Governance Body runtime under AGG-02-GOVERNANCE.

CREATE TABLE governance_bodies (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  body_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  body_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_governance_body_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_governance_body_ref (tenant_id, body_ref),
  INDEX idx_governance_body_type_status (tenant_id, body_type, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_body_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  body_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  mandate TEXT NOT NULL,
  terms_of_reference TEXT NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  membership_rules TEXT NOT NULL,
  quorum_required INT UNSIGNED NOT NULL,
  chair_party_id VARCHAR(36) NOT NULL,
  secretariat_party_id VARCHAR(36) NOT NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_governance_body_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_governance_body_version_body FOREIGN KEY (body_id) REFERENCES governance_bodies(id),
  CONSTRAINT fk_governance_body_version_chair FOREIGN KEY (chair_party_id) REFERENCES parties(id),
  CONSTRAINT fk_governance_body_version_secretariat FOREIGN KEY (secretariat_party_id) REFERENCES parties(id),
  CONSTRAINT fk_governance_body_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_governance_body_version (body_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_body_memberships (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  body_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  role_key VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_governance_body_membership_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_governance_body_membership_body FOREIGN KEY (body_id) REFERENCES governance_bodies(id),
  CONSTRAINT fk_governance_body_membership_party FOREIGN KEY (party_id) REFERENCES parties(id),
  INDEX idx_governance_body_membership_effective (tenant_id, body_id, status, valid_from, valid_to),
  INDEX idx_governance_body_membership_party (tenant_id, party_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
