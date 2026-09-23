CREATE TABLE migration_plans (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  source_system VARCHAR(160) NOT NULL,
  target_system VARCHAR(160) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  scope_definition JSON NOT NULL,
  cutover_strategy VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  plan_created_at DATETIME(6) NOT NULL,
  approved_decision_id VARCHAR(64) NULL,
  approved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_migration_plans_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_plans_code (tenant_id, code),
  KEY ix_migration_plans_source_status (tenant_id, source_system, status),
  CONSTRAINT fk_migration_plans_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_migration_plans_scope
    FOREIGN KEY (tenant_id, scope_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_migration_plans_creator
    FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_migration_plans_approval
    FOREIGN KEY (tenant_id, approved_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_migration_plans_systems CHECK (source_system <> target_system),
  CONSTRAINT chk_migration_plans_strategy CHECK (
    cutover_strategy IN ('BIG_BANG','PHASED','PARALLEL','ROLLING')
  ),
  CONSTRAINT chk_migration_plans_status CHECK (
    status IN ('DRAFT','APPROVED','ACTIVE','COMPLETED','CANCELLED')
  ),
  CONSTRAINT chk_migration_plans_approval_state CHECK (
    (status = 'DRAFT' AND approved_decision_id IS NULL AND approved_at IS NULL)
    OR (status <> 'DRAFT' AND approved_decision_id IS NOT NULL AND approved_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE migration_mapping_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_plan_id VARCHAR(64) NOT NULL,
  version VARCHAR(80) NOT NULL,
  source_schema_version VARCHAR(160) NOT NULL,
  target_schema_version VARCHAR(160) NOT NULL,
  mapping_definition JSON NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  mapping_created_at DATETIME(6) NOT NULL,
  frozen_by_person_id VARCHAR(64) NULL,
  frozen_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_migration_mapping_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_mapping_versions_version (tenant_id, migration_plan_id, version),
  CONSTRAINT fk_migration_mapping_versions_plan
    FOREIGN KEY (tenant_id, migration_plan_id) REFERENCES migration_plans(tenant_id, id),
  CONSTRAINT fk_migration_mapping_versions_creator
    FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_migration_mapping_versions_freezer
    FOREIGN KEY (tenant_id, frozen_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_migration_mapping_versions_status CHECK (
    status IN ('DRAFT','FROZEN','SUPERSEDED')
  ),
  CONSTRAINT chk_migration_mapping_versions_freeze_state CHECK (
    (status = 'DRAFT' AND frozen_by_person_id IS NULL AND frozen_at IS NULL)
    OR (status IN ('FROZEN','SUPERSEDED') AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE migration_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_plan_id VARCHAR(64) NOT NULL,
  mapping_version_id VARCHAR(64) NOT NULL,
  run_reference VARCHAR(160) NOT NULL,
  run_type VARCHAR(24) NOT NULL,
  integration_job_id VARCHAR(64) NULL,
  requested_by_person_id VARCHAR(64) NOT NULL,
  requested_at DATETIME(6) NOT NULL,
  status VARCHAR(32) NOT NULL,
  started_at DATETIME(6) NULL,
  load_completed_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  error_message TEXT NULL,
  active_production_guard_key VARCHAR(128) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_migration_runs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_runs_reference (tenant_id, migration_plan_id, run_reference),
  UNIQUE KEY uq_migration_runs_active_production (tenant_id, active_production_guard_key),
  KEY ix_migration_runs_plan_status (tenant_id, migration_plan_id, status, requested_at),
  CONSTRAINT fk_migration_runs_plan
    FOREIGN KEY (tenant_id, migration_plan_id) REFERENCES migration_plans(tenant_id, id),
  CONSTRAINT fk_migration_runs_mapping
    FOREIGN KEY (tenant_id, mapping_version_id) REFERENCES migration_mapping_versions(tenant_id, id),
  CONSTRAINT fk_migration_runs_job
    FOREIGN KEY (tenant_id, integration_job_id) REFERENCES integration_jobs(tenant_id, id),
  CONSTRAINT fk_migration_runs_requester
    FOREIGN KEY (tenant_id, requested_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_migration_runs_type CHECK (
    run_type IN ('DRY_RUN','REHEARSAL','PRODUCTION')
  ),
  CONSTRAINT chk_migration_runs_status CHECK (
    status IN ('QUEUED','RUNNING','AWAITING_RECONCILIATION','RECONCILED','BLOCKED','FAILED','CANCELLED')
  ),
  CONSTRAINT chk_migration_runs_state CHECK (
    (status = 'QUEUED' AND started_at IS NULL AND load_completed_at IS NULL AND completed_at IS NULL)
    OR (status = 'RUNNING' AND started_at IS NOT NULL AND completed_at IS NULL)
    OR (status IN ('AWAITING_RECONCILIATION','BLOCKED') AND started_at IS NOT NULL AND load_completed_at IS NOT NULL AND completed_at IS NULL)
    OR (status IN ('RECONCILED','FAILED','CANCELLED') AND completed_at IS NOT NULL)
  ),
  CONSTRAINT chk_migration_runs_guard CHECK (
    (run_type = 'PRODUCTION' AND status IN ('QUEUED','RUNNING','AWAITING_RECONCILIATION','BLOCKED') AND active_production_guard_key IS NOT NULL)
    OR (NOT (run_type = 'PRODUCTION' AND status IN ('QUEUED','RUNNING','AWAITING_RECONCILIATION','BLOCKED')) AND active_production_guard_key IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE migration_item_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_run_id VARCHAR(64) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  source_system VARCHAR(160) NOT NULL,
  source_object_type VARCHAR(160) NOT NULL,
  source_object_id VARCHAR(512) NOT NULL,
  source_version VARCHAR(160) NULL,
  source_identity_key CHAR(64) NOT NULL,
  source_envelope_id VARCHAR(64) NOT NULL,
  target_canonical_object_id VARCHAR(64) NULL,
  target_version VARCHAR(160) NULL,
  external_identity_id VARCHAR(64) NULL,
  outcome VARCHAR(24) NOT NULL,
  source_hash VARCHAR(255) NOT NULL,
  target_hash VARCHAR(255) NULL,
  message TEXT NULL,
  recorded_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_migration_item_results_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_item_results_sequence (tenant_id, migration_run_id, sequence),
  UNIQUE KEY uq_migration_item_results_source (
    tenant_id, migration_run_id, source_identity_key
  ),
  KEY ix_migration_item_results_outcome (tenant_id, migration_run_id, outcome),
  CONSTRAINT fk_migration_item_results_run
    FOREIGN KEY (tenant_id, migration_run_id) REFERENCES migration_runs(tenant_id, id),
  CONSTRAINT fk_migration_item_results_envelope
    FOREIGN KEY (tenant_id, source_envelope_id) REFERENCES canonical_data_envelopes(tenant_id, id),
  CONSTRAINT fk_migration_item_results_target
    FOREIGN KEY (tenant_id, target_canonical_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_migration_item_results_external_identity
    FOREIGN KEY (tenant_id, external_identity_id) REFERENCES external_identities(tenant_id, id),
  CONSTRAINT chk_migration_item_results_sequence CHECK (sequence > 0),
  CONSTRAINT chk_migration_item_results_outcome CHECK (
    outcome IN ('CREATED','UPDATED','MATCHED','SKIPPED','FAILED','CONFLICT')
  ),
  CONSTRAINT chk_migration_item_results_success CHECK (
    outcome NOT IN ('CREATED','UPDATED','MATCHED')
    OR (target_canonical_object_id IS NOT NULL AND target_hash IS NOT NULL)
  ),
  CONSTRAINT chk_migration_item_results_failure CHECK (
    outcome NOT IN ('FAILED','CONFLICT') OR message IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE migration_conflicts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_run_id VARCHAR(64) NOT NULL,
  migration_item_result_id VARCHAR(64) NULL,
  conflict_type VARCHAR(24) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  code VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  detected_at DATETIME(6) NOT NULL,
  resolved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_migration_conflicts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_conflicts_code (tenant_id, migration_run_id, code),
  KEY ix_migration_conflicts_status (tenant_id, migration_run_id, severity, status),
  CONSTRAINT fk_migration_conflicts_run
    FOREIGN KEY (tenant_id, migration_run_id) REFERENCES migration_runs(tenant_id, id),
  CONSTRAINT fk_migration_conflicts_item
    FOREIGN KEY (tenant_id, migration_item_result_id) REFERENCES migration_item_results(tenant_id, id),
  CONSTRAINT chk_migration_conflicts_type CHECK (
    conflict_type IN ('IDENTITY','MAPPING','VALIDATION','VERSION','AUTHORITY','DUPLICATE','DATA','OTHER')
  ),
  CONSTRAINT chk_migration_conflicts_severity CHECK (severity IN ('WARNING','BLOCKING')),
  CONSTRAINT chk_migration_conflicts_status CHECK (status IN ('OPEN','DISPOSITIONED','RESOLVED')),
  CONSTRAINT chk_migration_conflicts_resolution CHECK (
    (status = 'OPEN' AND resolved_at IS NULL)
    OR (status IN ('DISPOSITIONED','RESOLVED') AND resolved_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE migration_conflict_dispositions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_conflict_id VARCHAR(64) NOT NULL,
  disposition VARCHAR(24) NOT NULL,
  rationale TEXT NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  disposed_by_person_id VARCHAR(64) NOT NULL,
  disposed_at DATETIME(6) NOT NULL,
  retry_run_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_migration_conflict_dispositions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_conflict_dispositions_conflict (tenant_id, migration_conflict_id),
  CONSTRAINT fk_migration_conflict_dispositions_conflict
    FOREIGN KEY (tenant_id, migration_conflict_id) REFERENCES migration_conflicts(tenant_id, id),
  CONSTRAINT fk_migration_conflict_dispositions_decision
    FOREIGN KEY (tenant_id, decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_migration_conflict_dispositions_person
    FOREIGN KEY (tenant_id, disposed_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_migration_conflict_dispositions_retry
    FOREIGN KEY (tenant_id, retry_run_id) REFERENCES migration_runs(tenant_id, id),
  CONSTRAINT chk_migration_conflict_dispositions_type CHECK (
    disposition IN ('USE_SOURCE','USE_TARGET','MAP','WAIVE','RETRY','EXCLUDE')
  ),
  CONSTRAINT chk_migration_conflict_dispositions_retry CHECK (
    (disposition = 'RETRY' AND retry_run_id IS NOT NULL)
    OR (disposition <> 'RETRY' AND retry_run_id IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE migration_reconciliation_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_run_id VARCHAR(64) NOT NULL,
  checkpoint VARCHAR(24) NOT NULL,
  status VARCHAR(24) NOT NULL,
  started_by_person_id VARCHAR(64) NOT NULL,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  source_count INT UNSIGNED NULL,
  target_count INT UNSIGNED NULL,
  verified_count INT UNSIGNED NULL,
  conflict_count INT UNSIGNED NULL,
  missing_count INT UNSIGNED NULL,
  details TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_migration_reconciliation_runs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_migration_reconciliation_runs_checkpoint (tenant_id, migration_run_id, checkpoint),
  CONSTRAINT fk_migration_reconciliation_runs_run
    FOREIGN KEY (tenant_id, migration_run_id) REFERENCES migration_runs(tenant_id, id),
  CONSTRAINT fk_migration_reconciliation_runs_starter
    FOREIGN KEY (tenant_id, started_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_migration_reconciliation_runs_checkpoint CHECK (
    checkpoint IN ('PRE_CUTOVER','CUTOVER','POST_CUTOVER')
  ),
  CONSTRAINT chk_migration_reconciliation_runs_status CHECK (
    status IN ('RUNNING','VERIFIED','CONFLICT','FAILED')
  ),
  CONSTRAINT chk_migration_reconciliation_runs_state CHECK (
    (status = 'RUNNING' AND completed_at IS NULL)
    OR (status <> 'RUNNING' AND completed_at IS NOT NULL)
  )
) ENGINE=InnoDB;

ALTER TABLE migration_reconciliations
  ADD COLUMN reconciliation_run_id VARCHAR(64) NULL AFTER tenant_id,
  ADD KEY ix_migration_reconciliations_run (tenant_id, reconciliation_run_id, status),
  ADD CONSTRAINT fk_migration_reconciliations_run
    FOREIGN KEY (tenant_id, reconciliation_run_id)
    REFERENCES migration_reconciliation_runs(tenant_id, id);

CREATE TABLE cutover_decisions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  migration_plan_id VARCHAR(64) NOT NULL,
  migration_run_id VARCHAR(64) NOT NULL,
  reconciliation_run_id VARCHAR(64) NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  outcome VARCHAR(16) NOT NULL,
  target_authority_rule_id VARCHAR(64) NULL,
  decided_by_person_id VARCHAR(64) NOT NULL,
  decided_at DATETIME(6) NOT NULL,
  effective_at DATETIME(6) NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_cutover_decisions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_cutover_decisions_run (tenant_id, migration_run_id),
  CONSTRAINT fk_cutover_decisions_plan
    FOREIGN KEY (tenant_id, migration_plan_id) REFERENCES migration_plans(tenant_id, id),
  CONSTRAINT fk_cutover_decisions_run
    FOREIGN KEY (tenant_id, migration_run_id) REFERENCES migration_runs(tenant_id, id),
  CONSTRAINT fk_cutover_decisions_reconciliation
    FOREIGN KEY (tenant_id, reconciliation_run_id) REFERENCES migration_reconciliation_runs(tenant_id, id),
  CONSTRAINT fk_cutover_decisions_decision
    FOREIGN KEY (tenant_id, decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_cutover_decisions_authority_rule
    FOREIGN KEY (tenant_id, target_authority_rule_id) REFERENCES source_authority_rules(tenant_id, id),
  CONSTRAINT fk_cutover_decisions_person
    FOREIGN KEY (tenant_id, decided_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_cutover_decisions_outcome CHECK (outcome IN ('APPROVED','REJECTED')),
  CONSTRAINT chk_cutover_decisions_state CHECK (
    (outcome = 'APPROVED' AND target_authority_rule_id IS NOT NULL AND effective_at IS NOT NULL)
    OR (outcome = 'REJECTED' AND target_authority_rule_id IS NULL AND effective_at IS NULL)
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.migration.read', 'Read migration control', 'View migration plans, mapping versions, runs, item outcomes, conflicts, reconciliation and cutover evidence.'),
  ('platform.migration.manage', 'Manage migration definitions', 'Create and approve migration plans and create/freeze immutable mapping versions.'),
  ('platform.migration.execute', 'Execute migrations', 'Queue and execute governed migration runs, item outcomes and reconciliation evidence.'),
  ('platform.migration.conflict_disposition', 'Disposition migration conflicts', 'Record authority-backed conflict resolution, waiver, exclusion, mapping or retry dispositions.'),
  ('platform.migration.cutover_approve', 'Approve migration cutover', 'Record authority-backed production cutover decisions after verified reconciliation.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-045', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.migration.read'),
  ('ARP-PLATFORM-ADMIN-046', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.migration.manage'),
  ('ARP-PLATFORM-ADMIN-047', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.migration.execute'),
  ('ARP-PLATFORM-ADMIN-048', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.migration.conflict_disposition'),
  ('ARP-PLATFORM-ADMIN-049', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.migration.cutover_approve');
