CREATE TABLE platform_subscriptions (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  plan_code VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
  billing_customer_reference VARCHAR(160) NULL,
  seat_limit INT UNSIGNED NULL,
  storage_limit_bytes BIGINT UNSIGNED NULL,
  starts_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  renews_at DATETIME(6) NULL,
  ends_at DATETIME(6) NULL,
  metadata JSON NULL,
  updated_by_operator_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_platform_subscriptions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_platform_subscriptions_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_subscriptions_status CHECK (
    status IN ('TRIAL','ACTIVE','PAST_DUE','SUSPENDED','CANCELLED')
  ),
  CONSTRAINT chk_platform_subscriptions_period CHECK (
    ends_at IS NULL OR ends_at >= starts_at
  )
) ENGINE=InnoDB;

CREATE TABLE platform_feature_flags (
  flag_key VARCHAR(120) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  default_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  updated_by_operator_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_platform_feature_flags_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_feature_flags_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE platform_tenant_feature_overrides (
  tenant_id VARCHAR(64) NOT NULL,
  flag_key VARCHAR(120) NOT NULL,
  enabled BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  updated_by_operator_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (tenant_id, flag_key),
  CONSTRAINT fk_platform_tenant_feature_override_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_platform_tenant_feature_override_flag
    FOREIGN KEY (flag_key) REFERENCES platform_feature_flags(flag_key),
  CONSTRAINT fk_platform_tenant_feature_override_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id)
) ENGINE=InnoDB;

CREATE TABLE platform_integrations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NULL,
  code VARCHAR(96) NOT NULL,
  name VARCHAR(255) NOT NULL,
  integration_type VARCHAR(32) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'CONFIGURED',
  endpoint_reference VARCHAR(512) NULL,
  configuration_metadata JSON NULL,
  last_health_status VARCHAR(16) NULL,
  last_checked_at DATETIME(6) NULL,
  updated_by_operator_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_platform_integrations_scope (tenant_id, status, integration_type),
  CONSTRAINT fk_platform_integrations_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_platform_integrations_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_integrations_type CHECK (
    integration_type IN ('API','WEBHOOK','IDENTITY','DATA_EXCHANGE','MESSAGING','OBSERVABILITY','OTHER')
  ),
  CONSTRAINT chk_platform_integrations_status CHECK (
    status IN ('CONFIGURED','ACTIVE','PAUSED','ERROR','DISABLED')
  ),
  CONSTRAINT chk_platform_integrations_health CHECK (
    last_health_status IS NULL OR last_health_status IN ('HEALTHY','DEGRADED','FAILED','UNKNOWN')
  )
) ENGINE=InnoDB;

CREATE TABLE platform_background_jobs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NULL,
  job_type VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 5,
  scheduled_at DATETIME(6) NOT NULL,
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  last_error TEXT NULL,
  payload JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_platform_background_jobs_queue (status, scheduled_at),
  KEY ix_platform_background_jobs_tenant (tenant_id, status, scheduled_at),
  CONSTRAINT fk_platform_background_jobs_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_platform_background_jobs_status CHECK (
    status IN ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED')
  ),
  CONSTRAINT chk_platform_background_jobs_attempts CHECK (attempts <= max_attempts)
) ENGINE=InnoDB;

CREATE TABLE platform_configuration (
  config_key VARCHAR(160) NOT NULL PRIMARY KEY,
  description TEXT NOT NULL,
  sensitivity VARCHAR(24) NOT NULL DEFAULT 'INTERNAL',
  value_json JSON NOT NULL,
  updated_by_operator_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_platform_configuration_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_configuration_sensitivity CHECK (
    sensitivity IN ('PUBLIC','INTERNAL','SECRET_REFERENCE')
  )
) ENGINE=InnoDB;

CREATE TABLE platform_usage_snapshots (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  metric_key VARCHAR(120) NOT NULL,
  metric_value DECIMAL(24,6) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  captured_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_platform_usage_snapshot (tenant_id, metric_key, captured_at),
  KEY ix_platform_usage_snapshot_tenant (tenant_id, captured_at),
  CONSTRAINT fk_platform_usage_snapshot_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

INSERT INTO platform_configuration
  (config_key, description, sensitivity, value_json)
VALUES
  ('tenant.lifecycle.deletion.mode', 'Tenant deletion remains logical until an explicit retention-controlled purge is authorised.', 'INTERNAL', JSON_OBJECT('mode','LOGICAL_DELETE')),
  ('routing.tenant.mode', 'Canonical Tenant routing pattern.', 'PUBLIC', JSON_OBJECT('pattern','/{tenantSlug}/app','publicPattern','/{tenantSlug}/public'));
