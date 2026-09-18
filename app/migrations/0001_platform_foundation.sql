-- NuBlox V3 MySQL
-- 0001: canonical platform foundation
-- MySQL 8.0+

CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(36) PRIMARY KEY,
  slug VARCHAR(191) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS parties (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  party_type VARCHAR(32) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_parties_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_parties_tenant (tenant_id, party_type, display_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS organisations (
  party_id VARCHAR(36) PRIMARY KEY,
  legal_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255) NULL,
  registration_number VARCHAR(191) NULL,
  tax_identifier VARCHAR(191) NULL,
  country_code CHAR(2) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_organisations_party FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
  INDEX idx_organisations_registration (registration_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_identities (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NULL,
  provider VARCHAR(64) NOT NULL,
  provider_subject VARCHAR(191) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_user_identities_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_user_identities_party FOREIGN KEY (party_id) REFERENCES parties(id),
  UNIQUE KEY uq_user_identity_provider (tenant_id, provider, provider_subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS memberships (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  context_type VARCHAR(64) NOT NULL,
  context_id VARCHAR(64) NOT NULL,
  membership_type VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_memberships_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_memberships_party FOREIGN KEY (party_id) REFERENCES parties(id),
  INDEX idx_memberships_effective (tenant_id, party_id, context_type, context_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS permission_definitions (
  permission_key VARCHAR(191) PRIMARY KEY,
  resource VARCHAR(191) NOT NULL,
  action VARCHAR(64) NOT NULL,
  description VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_definitions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  role_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_role_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_role_definitions_tenant_key (tenant_id, role_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id VARCHAR(36) NOT NULL,
  permission_key VARCHAR(191) NOT NULL,
  PRIMARY KEY (role_id, permission_key),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES role_definitions(id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_key) REFERENCES permission_definitions(permission_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS role_assignments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  role_id VARCHAR(36) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  assignment_source VARCHAR(191) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_role_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_role_assignments_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_role_assignments_role FOREIGN KEY (role_id) REFERENCES role_definitions(id),
  INDEX idx_role_assignments_effective (tenant_id, party_id, scope_type, scope_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS platform_audit_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  tenant_slug VARCHAR(191) NOT NULL,
  aggregate_id VARCHAR(191) NOT NULL,
  object_type VARCHAR(191) NOT NULL,
  object_id VARCHAR(64) NOT NULL,
  action VARCHAR(191) NOT NULL,
  from_state VARCHAR(64) NULL,
  to_state VARCHAR(64) NULL,
  actor_identity_id VARCHAR(36) NOT NULL,
  actor_party_id VARCHAR(36) NOT NULL,
  actor_display_name VARCHAR(255) NOT NULL,
  correlation_id VARCHAR(36) NOT NULL,
  authority_snapshot_json JSON NOT NULL,
  note TEXT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_platform_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_platform_audit_identity FOREIGN KEY (actor_identity_id) REFERENCES user_identities(id),
  CONSTRAINT fk_platform_audit_party FOREIGN KEY (actor_party_id) REFERENCES parties(id),
  INDEX idx_platform_audit_object (tenant_id, object_type, object_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS business_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  aggregate_id VARCHAR(191) NOT NULL,
  aggregate_type VARCHAR(191) NOT NULL,
  aggregate_object_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(191) NOT NULL,
  aggregate_version INT NOT NULL,
  actor_identity_id VARCHAR(36) NOT NULL,
  correlation_id VARCHAR(36) NOT NULL,
  payload_json JSON NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_business_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_business_events_identity FOREIGN KEY (actor_identity_id) REFERENCES user_identities(id),
  INDEX idx_business_events_aggregate (tenant_id, aggregate_id, aggregate_object_id, aggregate_version, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS outbox_messages (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  business_event_id VARCHAR(36) NOT NULL,
  topic VARCHAR(191) NOT NULL,
  payload_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  available_at VARCHAR(32) NOT NULL,
  published_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_outbox_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_outbox_event FOREIGN KEY (business_event_id) REFERENCES business_events(id),
  UNIQUE KEY uq_outbox_business_event (business_event_id),
  INDEX idx_outbox_pending (status, available_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
