-- NuBlox V3 MySQL
-- 0037: personal enterprise navigation state for Saved Views, Recent and Favourites.
-- These records are user interaction state, not domain classifications or canonical business truth.

CREATE TABLE saved_views (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  owner_identity_id VARCHAR(36) NOT NULL,
  target_key VARCHAR(191) NOT NULL,
  name VARCHAR(191) NOT NULL,
  definition_json JSON NOT NULL,
  scope_type VARCHAR(32) NOT NULL DEFAULT 'PERSONAL',
  audience_type VARCHAR(64) NULL,
  audience_id VARCHAR(191) NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_saved_view_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_saved_view_owner FOREIGN KEY (owner_identity_id) REFERENCES user_identities(id),
  UNIQUE KEY uq_saved_view_owner_name (tenant_id, owner_identity_id, target_key, name),
  INDEX idx_saved_view_target
    (tenant_id, owner_identity_id, target_key, is_pinned, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_recent_items (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_identity_id VARCHAR(36) NOT NULL,
  item_key VARCHAR(255) NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  object_type VARCHAR(64) NULL,
  object_id VARCHAR(191) NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500) NULL,
  route_path VARCHAR(1000) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  last_opened_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_recent_item_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_recent_item_identity FOREIGN KEY (user_identity_id) REFERENCES user_identities(id),
  UNIQUE KEY uq_recent_item_identity_key (tenant_id, user_identity_id, item_key),
  INDEX idx_recent_item_opened
    (tenant_id, user_identity_id, last_opened_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_favourites (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  user_identity_id VARCHAR(36) NOT NULL,
  item_key VARCHAR(255) NOT NULL,
  item_type VARCHAR(32) NOT NULL,
  object_type VARCHAR(64) NULL,
  object_id VARCHAR(191) NULL,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(500) NULL,
  route_path VARCHAR(1000) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_favourite_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_favourite_identity FOREIGN KEY (user_identity_id) REFERENCES user_identities(id),
  UNIQUE KEY uq_favourite_identity_key (tenant_id, user_identity_id, item_key),
  INDEX idx_favourite_created
    (tenant_id, user_identity_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
