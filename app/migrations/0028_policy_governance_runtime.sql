-- NuBlox V3 MySQL
-- 0028: F02.06 / AGG-02-POLICY governance profile over canonical AGG-07-INFORMATION identity.
--
-- Policy does not create a second document/master identity. The Policy profile shares the
-- Information Container ID and adds governed policy semantics to immutable information revisions.

CREATE TABLE policy_profiles (
  information_container_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  policy_type VARCHAR(64) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_policy_profile_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_policy_profile_container FOREIGN KEY (information_container_id) REFERENCES information_containers(id),
  UNIQUE KEY uq_policy_profile_tenant_container (tenant_id, information_container_id),
  INDEX idx_policy_profile_type (tenant_id, policy_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

ALTER TABLE information_revisions
  ADD UNIQUE KEY uq_information_revision_container_identity (container_id, id);

CREATE TABLE policy_revision_profiles (
  information_revision_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  information_container_id VARCHAR(36) NOT NULL,
  revision_no INT UNSIGNED NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  governance_body_id VARCHAR(36) NULL,
  applicability_summary TEXT NOT NULL,
  scope_type VARCHAR(64) NULL,
  scope_id VARCHAR(191) NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  review_due_at VARCHAR(32) NULL,
  attestation_required BOOLEAN NOT NULL DEFAULT FALSE,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_policy_revision_profile_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_policy_revision_profile_policy FOREIGN KEY (information_container_id) REFERENCES policy_profiles(information_container_id),
  CONSTRAINT fk_policy_revision_profile_revision FOREIGN KEY (information_container_id, information_revision_id)
    REFERENCES information_revisions(container_id, id),
  CONSTRAINT fk_policy_revision_profile_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_policy_revision_profile_body FOREIGN KEY (governance_body_id) REFERENCES governance_bodies(id),
  UNIQUE KEY uq_policy_revision_profile_number (information_container_id, revision_no),
  INDEX idx_policy_revision_profile_owner (tenant_id, owner_party_id),
  INDEX idx_policy_revision_profile_body (tenant_id, governance_body_id),
  INDEX idx_policy_revision_profile_effectivity (tenant_id, effective_from, effective_to),
  INDEX idx_policy_revision_profile_review (tenant_id, review_due_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
