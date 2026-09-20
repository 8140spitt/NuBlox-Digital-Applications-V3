CREATE TABLE outbox_messages (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  aggregate_type VARCHAR(120) NOT NULL,
  aggregate_id VARCHAR(160) NOT NULL,
  event_type VARCHAR(160) NOT NULL,
  payload JSON NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  status VARCHAR(16) NOT NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(6) NULL,
  published_at DATETIME(6) NULL,
  last_error TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_outbox_messages_tenant_id_id (tenant_id, id),
  KEY ix_outbox_messages_dispatch
    (status, next_attempt_at, occurred_at, id),
  KEY ix_outbox_messages_aggregate
    (tenant_id, aggregate_type, aggregate_id, occurred_at),
  CONSTRAINT fk_outbox_messages_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_outbox_messages_status CHECK (
    status IN ('PENDING', 'PUBLISHED', 'FAILED')
  ),
  CONSTRAINT chk_outbox_messages_publication CHECK (
    (status = 'PUBLISHED' AND published_at IS NOT NULL)
    OR
    (status <> 'PUBLISHED' AND published_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE integration_jobs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  job_type VARCHAR(24) NOT NULL,
  source_system VARCHAR(160) NULL,
  target_system VARCHAR(160) NULL,
  requested_by_person_id VARCHAR(64) NULL,
  requested_at DATETIME(6) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  cursor_value VARCHAR(1024) NULL,
  result_reference VARCHAR(1024) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_integration_jobs_tenant_id_id (tenant_id, id),
  KEY ix_integration_jobs_status (tenant_id, status, requested_at),
  CONSTRAINT fk_integration_jobs_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_integration_jobs_requester
    FOREIGN KEY (tenant_id, requested_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_integration_jobs_type CHECK (
    job_type IN ('IMPORT', 'EXPORT', 'SYNC', 'RECONCILE', 'PROJECTION')
  ),
  CONSTRAINT chk_integration_jobs_status CHECK (
    status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT chk_integration_jobs_import_source CHECK (
    job_type <> 'IMPORT' OR source_system IS NOT NULL
  ),
  CONSTRAINT chk_integration_jobs_export_target CHECK (
    job_type <> 'EXPORT' OR target_system IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE idempotency_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scope_key VARCHAR(160) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  request_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_reference VARCHAR(1024) NULL,
  error_message TEXT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_idempotency_records_tenant_scope_key
    (tenant_id, scope_key, idempotency_key),
  KEY ix_idempotency_records_expiry (tenant_id, expires_at, status),
  CONSTRAINT fk_idempotency_records_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_idempotency_records_status CHECK (
    status IN ('IN_PROGRESS', 'COMPLETED', 'FAILED')
  ),
  CONSTRAINT chk_idempotency_records_period CHECK (
    expires_at IS NULL OR expires_at >= created_at
  )
) ENGINE=InnoDB;

CREATE TABLE canonical_data_envelopes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  direction VARCHAR(16) NOT NULL,
  schema_name VARCHAR(255) NOT NULL,
  schema_version VARCHAR(80) NOT NULL,
  object_type VARCHAR(120) NOT NULL,
  stable_key VARCHAR(160) NOT NULL,
  payload JSON NOT NULL,
  external_system VARCHAR(160) NULL,
  external_object_id VARCHAR(512) NULL,
  checksum VARCHAR(255) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_canonical_data_envelopes_tenant_id_id (tenant_id, id),
  KEY ix_canonical_data_envelopes_object
    (tenant_id, object_type, stable_key, created_at),
  KEY ix_canonical_data_envelopes_external
    (tenant_id, external_system, external_object_id),
  CONSTRAINT fk_canonical_data_envelopes_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_canonical_data_envelopes_direction CHECK (
    direction IN ('IMPORT', 'EXPORT')
  ),
  CONSTRAINT chk_canonical_data_envelopes_external CHECK (
    external_object_id IS NULL OR external_system IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE external_identities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  external_system VARCHAR(160) NOT NULL,
  external_object_type VARCHAR(160) NOT NULL,
  external_object_id VARCHAR(320) NOT NULL,
  external_version VARCHAR(160) NULL,
  source_reference VARCHAR(1024) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_external_identities_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_external_identities_external
    (tenant_id, external_system, external_object_type, external_object_id),
  KEY ix_external_identities_canonical
    (tenant_id, canonical_object_id, external_system),
  CONSTRAINT fk_external_identities_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE migration_reconciliations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  external_identity_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL,
  source_hash VARCHAR(255) NULL,
  target_hash VARCHAR(255) NULL,
  checked_at DATETIME(6) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_migration_reconciliations_tenant_id_id (tenant_id, id),
  KEY ix_migration_reconciliations_identity
    (tenant_id, external_identity_id, checked_at),
  KEY ix_migration_reconciliations_object
    (tenant_id, canonical_object_id, status, checked_at),
  CONSTRAINT fk_migration_reconciliations_external
    FOREIGN KEY (tenant_id, external_identity_id)
    REFERENCES external_identities(tenant_id, id),
  CONSTRAINT fk_migration_reconciliations_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_migration_reconciliations_status CHECK (
    status IN ('PENDING', 'MATCHED', 'CONFLICT', 'MISSING', 'VERIFIED')
  ),
  CONSTRAINT chk_migration_reconciliations_verified CHECK (
    status <> 'VERIFIED'
    OR
    (source_hash IS NOT NULL AND target_hash IS NOT NULL AND source_hash = target_hash)
  )
) ENGINE=InnoDB;

CREATE TABLE projection_checkpoints (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  projection_name VARCHAR(255) NOT NULL,
  partition_key VARCHAR(255) NOT NULL,
  last_event_sequence BIGINT UNSIGNED NULL,
  last_occurred_at DATETIME(6) NULL,
  checkpoint_updated_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_projection_checkpoints_projection_partition
    (tenant_id, projection_name, partition_key),
  CONSTRAINT fk_projection_checkpoints_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;
