-- NuBlox V3 MySQL
-- 0002: strategy runtime and canonical architecture review ledger

CREATE TABLE IF NOT EXISTS strategy_frameworks (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  vision TEXT NOT NULL,
  mission TEXT NOT NULL,
  direction TEXT NOT NULL,
  review_cadence VARCHAR(191) NOT NULL,
  status VARCHAR(32) NOT NULL,
  current_version INT NOT NULL DEFAULT 0,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  submitted_at VARCHAR(32) NULL,
  approved_at VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  CONSTRAINT fk_strategy_frameworks_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_strategy_frameworks_tenant (tenant_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS strategy_framework_versions (
  id VARCHAR(36) PRIMARY KEY,
  framework_id VARCHAR(36) NOT NULL,
  version_no INT NOT NULL,
  snapshot_json JSON NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  decision_note TEXT NULL,
  CONSTRAINT fk_strategy_versions_framework FOREIGN KEY (framework_id) REFERENCES strategy_frameworks(id) ON DELETE CASCADE,
  UNIQUE KEY uq_strategy_version (framework_id, version_no),
  INDEX idx_strategy_versions_framework (framework_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS business_object_reviews (
  candidate_key VARCHAR(64) PRIMARY KEY,
  decision VARCHAR(64) NOT NULL,
  proposed_canonical_name VARCHAR(255) NULL,
  target_candidate_key VARCHAR(64) NULL,
  notes TEXT NULL,
  reviewed_by VARCHAR(255) NOT NULL,
  reviewed_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  INDEX idx_business_object_reviews_decision (decision, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS business_object_review_events (
  id VARCHAR(36) PRIMARY KEY,
  candidate_key VARCHAR(64) NOT NULL,
  decision VARCHAR(64) NOT NULL,
  proposed_canonical_name VARCHAR(255) NULL,
  target_candidate_key VARCHAR(64) NULL,
  notes TEXT NULL,
  actor VARCHAR(255) NOT NULL,
  context_tenant_slug VARCHAR(191) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  INDEX idx_business_object_review_events_candidate (candidate_key, occurred_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
