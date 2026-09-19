-- NuBlox V3 MySQL
-- 0027: AGG-07-INFORMATION controlled Information Container runtime.

CREATE TABLE information_containers (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  container_ref VARCHAR(191) NOT NULL,
  container_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  originator_party_id VARCHAR(36) NOT NULL,
  subject_type VARCHAR(64) NULL,
  subject_id VARCHAR(191) NULL,
  classification_code VARCHAR(191) NULL,
  security_classification VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_revision_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_information_container_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_information_container_originator FOREIGN KEY (originator_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_information_container_ref (tenant_id, container_ref),
  INDEX idx_information_container_subject (tenant_id, subject_type, subject_id),
  INDEX idx_information_container_status (tenant_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE information_revisions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  container_id VARCHAR(36) NOT NULL,
  revision_no INT UNSIGNED NOT NULL,
  revision_code VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  purpose_of_issue VARCHAR(128) NULL,
  suitability_code VARCHAR(64) NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  approval_decision_id VARCHAR(36) NULL,
  approved_at VARCHAR(32) NULL,
  issued_at VARCHAR(32) NULL,
  supersedes_revision_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_information_revision_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_information_revision_container FOREIGN KEY (container_id) REFERENCES information_containers(id),
  CONSTRAINT fk_information_revision_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_information_revision_supersedes FOREIGN KEY (supersedes_revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_information_revision_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_information_revision_no (container_id, revision_no),
  UNIQUE KEY uq_information_revision_code (container_id, revision_code),
  INDEX idx_information_revision_status (tenant_id, container_id, lifecycle_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE information_representations (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  container_id VARCHAR(36) NOT NULL,
  revision_id VARCHAR(36) NOT NULL,
  representation_type VARCHAR(64) NOT NULL,
  content_reference VARCHAR(1000) NOT NULL,
  content_media_type VARCHAR(191) NULL,
  source_filename VARCHAR(500) NULL,
  hash_algorithm VARCHAR(32) NOT NULL,
  content_hash VARCHAR(191) NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_information_representation_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_information_representation_container FOREIGN KEY (container_id) REFERENCES information_containers(id),
  CONSTRAINT fk_information_representation_revision FOREIGN KEY (revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_information_representation_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_information_representation_hash (revision_id, representation_type, hash_algorithm, content_hash),
  INDEX idx_information_representation_revision (tenant_id, revision_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
