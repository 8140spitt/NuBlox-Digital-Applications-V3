-- NuBlox V3 MySQL
-- 0036: cross-cutting work context, recoverable draft, edit lease and Party origination runtime.
-- Human edit leases are deliberately separate from database transactions. Aggregate versions remain
-- the hard lost-update control at command commit time.

CREATE TABLE work_contexts (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_identity_id VARCHAR(36) NOT NULL,
  actor_party_id VARCHAR(36) NOT NULL,
  context_key VARCHAR(191) NOT NULL,
  context_type VARCHAR(64) NOT NULL,
  object_type VARCHAR(64) NOT NULL,
  object_id VARCHAR(191) NOT NULL,
  object_version VARCHAR(64) NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500) NULL,
  route_path VARCHAR(1000) NOT NULL,
  workspace_function_id VARCHAR(16) NULL,
  status VARCHAR(32) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  opened_at VARCHAR(32) NOT NULL,
  last_accessed_at VARCHAR(32) NOT NULL,
  closed_at VARCHAR(32) NULL,
  CONSTRAINT fk_work_context_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_context_identity FOREIGN KEY (user_identity_id) REFERENCES user_identities(id),
  CONSTRAINT fk_work_context_actor FOREIGN KEY (actor_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_work_context_identity_key (tenant_id, user_identity_id, context_key),
  INDEX idx_work_context_open
    (tenant_id, user_identity_id, status, position, last_accessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_drafts (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  work_context_id VARCHAR(36) NOT NULL,
  user_identity_id VARCHAR(36) NOT NULL,
  form_key VARCHAR(191) NOT NULL,
  base_version VARCHAR(64) NULL,
  payload_json JSON NOT NULL,
  draft_version INT UNSIGNED NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  applied_at VARCHAR(32) NULL,
  discarded_at VARCHAR(32) NULL,
  CONSTRAINT fk_work_draft_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_draft_context FOREIGN KEY (work_context_id) REFERENCES work_contexts(id),
  CONSTRAINT fk_work_draft_identity FOREIGN KEY (user_identity_id) REFERENCES user_identities(id),
  UNIQUE KEY uq_work_draft_form (work_context_id, form_key),
  INDEX idx_work_draft_active
    (tenant_id, user_identity_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE edit_leases (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  object_type VARCHAR(64) NOT NULL,
  object_id VARCHAR(191) NOT NULL,
  lease_token VARCHAR(36) NOT NULL,
  holder_identity_id VARCHAR(36) NOT NULL,
  holder_party_id VARCHAR(36) NOT NULL,
  holder_display_name VARCHAR(255) NOT NULL,
  work_context_id VARCHAR(36) NULL,
  base_version VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  acquired_at VARCHAR(32) NOT NULL,
  heartbeat_at VARCHAR(32) NOT NULL,
  expires_at VARCHAR(32) NOT NULL,
  released_at VARCHAR(32) NULL,
  CONSTRAINT fk_edit_lease_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_edit_lease_identity FOREIGN KEY (holder_identity_id) REFERENCES user_identities(id),
  CONSTRAINT fk_edit_lease_party FOREIGN KEY (holder_party_id) REFERENCES parties(id),
  CONSTRAINT fk_edit_lease_context FOREIGN KEY (work_context_id) REFERENCES work_contexts(id),
  UNIQUE KEY uq_edit_lease_object (tenant_id, object_type, object_id),
  UNIQUE KEY uq_edit_lease_token (lease_token),
  INDEX idx_edit_lease_expiry (tenant_id, status, expires_at),
  INDEX idx_edit_lease_holder (tenant_id, holder_identity_id, status, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE party_originations (
  party_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  origin_function_id VARCHAR(16) NOT NULL,
  origin_object_type VARCHAR(64) NOT NULL,
  origin_object_id VARCHAR(191) NOT NULL,
  origin_reference VARCHAR(500) NULL,
  steward_function_id VARCHAR(16) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_party_origination_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_party_origination_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_party_origination_home
    (tenant_id, origin_function_id, origin_object_type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO party_originations
  (party_id,tenant_id,origin_function_id,origin_object_type,origin_object_id,
   origin_reference,steward_function_id,created_at)
SELECT p.id,p.tenant_id,'PLATFORM','LEGACY_OR_PLATFORM_IDENTITY',p.id,
       'Backfilled by migration 0036','PLATFORM',p.created_at
  FROM parties p
  LEFT JOIN party_originations po ON po.party_id=p.id
 WHERE po.party_id IS NULL;
