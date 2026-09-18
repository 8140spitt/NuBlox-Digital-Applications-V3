-- NuBlox V3 MySQL
-- 0010: governed evidence runtime
-- Implements AGG-28-EVIDENCE with immutable captured content references, provenance and integrity metadata.

CREATE TABLE evidence_items (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  evidence_type VARCHAR(128) NOT NULL,
  subject_type VARCHAR(128) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  captured_by_party_id VARCHAR(36) NOT NULL,
  captured_at VARCHAR(32) NOT NULL,
  content_reference VARCHAR(2048) NOT NULL,
  content_media_type VARCHAR(191) NULL,
  hash_algorithm VARCHAR(32) NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  classification VARCHAR(128) NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  verified_by_party_id VARCHAR(36) NULL,
  verified_at VARCHAR(32) NULL,
  archived_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_evidence_item_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_evidence_item_captured_by
    FOREIGN KEY (captured_by_party_id) REFERENCES parties(id),
  CONSTRAINT fk_evidence_item_verified_by
    FOREIGN KEY (verified_by_party_id) REFERENCES parties(id),
  INDEX idx_evidence_item_subject (tenant_id, subject_type, subject_id, captured_at),
  INDEX idx_evidence_item_status (tenant_id, status, captured_at),
  INDEX idx_evidence_item_hash (tenant_id, hash_algorithm, content_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evidence_source_references (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  evidence_item_id VARCHAR(36) NOT NULL,
  source_system VARCHAR(191) NOT NULL,
  source_identifier VARCHAR(255) NOT NULL,
  source_version VARCHAR(128) NULL,
  source_as_of VARCHAR(32) NULL,
  reference_uri VARCHAR(2048) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_evidence_source_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_evidence_source_item
    FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  INDEX idx_evidence_source_item (tenant_id, evidence_item_id),
  INDEX idx_evidence_source_identifier (tenant_id, source_system, source_identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE evidence_provenance_references (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  evidence_item_id VARCHAR(36) NOT NULL,
  source_object_type VARCHAR(128) NOT NULL,
  source_object_id VARCHAR(191) NOT NULL,
  source_object_version VARCHAR(64) NULL,
  provenance_type VARCHAR(64) NOT NULL,
  transformation VARCHAR(500) NULL,
  captured_at VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_evidence_provenance_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_evidence_provenance_item
    FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  INDEX idx_evidence_provenance_item (tenant_id, evidence_item_id),
  INDEX idx_evidence_provenance_source (tenant_id, source_object_type, source_object_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
