CREATE TABLE configuration_environments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  environment_type VARCHAR(24) NOT NULL,
  platform_version VARCHAR(80) NOT NULL,
  environment_reference VARCHAR(512) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_environments_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_environments_code (tenant_id, code),
  CONSTRAINT fk_configuration_environments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_configuration_environments_type CHECK (
    environment_type IN ('DEVELOPMENT','INTEGRATION','TEST','PREPRODUCTION','PRODUCTION')
  ),
  CONSTRAINT chk_configuration_environments_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE configuration_baselines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  environment_id VARCHAR(64) NOT NULL,
  baseline_reference VARCHAR(160) NOT NULL,
  platform_version VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL,
  checksum VARCHAR(255) NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  baseline_created_at DATETIME(6) NOT NULL,
  frozen_by_person_id VARCHAR(64) NULL,
  frozen_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_baselines_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_baselines_reference (tenant_id, environment_id, baseline_reference),
  CONSTRAINT fk_configuration_baselines_environment
    FOREIGN KEY (tenant_id, environment_id) REFERENCES configuration_environments(tenant_id, id),
  CONSTRAINT fk_configuration_baselines_creator
    FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_configuration_baselines_freezer
    FOREIGN KEY (tenant_id, frozen_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_configuration_baselines_status CHECK (
    status IN ('DRAFT','FROZEN','SUPERSEDED')
  ),
  CONSTRAINT chk_configuration_baselines_freeze CHECK (
    (status='DRAFT' AND checksum IS NULL AND frozen_by_person_id IS NULL AND frozen_at IS NULL)
    OR (status IN ('FROZEN','SUPERSEDED') AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_baseline_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  baseline_id VARCHAR(64) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  object_family VARCHAR(160) NOT NULL,
  object_reference VARCHAR(320) NOT NULL,
  object_version VARCHAR(160) NULL,
  content_hash VARCHAR(255) NOT NULL,
  snapshot JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_configuration_baseline_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_baseline_items_sequence (tenant_id, baseline_id, sequence),
  UNIQUE KEY uq_configuration_baseline_items_object (tenant_id, baseline_id, object_family, object_reference),
  CONSTRAINT fk_configuration_baseline_items_baseline
    FOREIGN KEY (tenant_id, baseline_id) REFERENCES configuration_baselines(tenant_id, id),
  CONSTRAINT chk_configuration_baseline_items_sequence CHECK (sequence > 0)
) ENGINE=InnoDB;

CREATE TABLE configuration_change_sets (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  source_environment_id VARCHAR(64) NOT NULL,
  base_baseline_id VARCHAR(64) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  version VARCHAR(80) NOT NULL,
  status VARCHAR(24) NOT NULL,
  checksum VARCHAR(255) NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  change_set_created_at DATETIME(6) NOT NULL,
  frozen_by_person_id VARCHAR(64) NULL,
  frozen_at DATETIME(6) NULL,
  approved_decision_id VARCHAR(64) NULL,
  approved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_change_sets_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_change_sets_code_version (tenant_id, code, version),
  CONSTRAINT fk_configuration_change_sets_environment
    FOREIGN KEY (tenant_id, source_environment_id) REFERENCES configuration_environments(tenant_id, id),
  CONSTRAINT fk_configuration_change_sets_baseline
    FOREIGN KEY (tenant_id, base_baseline_id) REFERENCES configuration_baselines(tenant_id, id),
  CONSTRAINT fk_configuration_change_sets_scope
    FOREIGN KEY (tenant_id, scope_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_configuration_change_sets_creator
    FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_configuration_change_sets_freezer
    FOREIGN KEY (tenant_id, frozen_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_configuration_change_sets_decision
    FOREIGN KEY (tenant_id, approved_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_configuration_change_sets_status CHECK (
    status IN ('DRAFT','FROZEN','APPROVED','SUPERSEDED','CANCELLED')
  ),
  CONSTRAINT chk_configuration_change_sets_freeze CHECK (
    (status='DRAFT' AND checksum IS NULL AND frozen_by_person_id IS NULL AND frozen_at IS NULL AND approved_decision_id IS NULL AND approved_at IS NULL)
    OR (status='FROZEN' AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL AND approved_decision_id IS NULL AND approved_at IS NULL)
    OR (status IN ('APPROVED','SUPERSEDED') AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL AND approved_decision_id IS NOT NULL AND approved_at IS NOT NULL)
    OR status='CANCELLED'
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_change_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_set_id VARCHAR(64) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  operation VARCHAR(16) NOT NULL,
  object_family VARCHAR(160) NOT NULL,
  object_reference VARCHAR(320) NOT NULL,
  before_hash VARCHAR(255) NULL,
  after_hash VARCHAR(255) NULL,
  definition JSON NOT NULL,
  dependencies JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_configuration_change_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_change_items_sequence (tenant_id, change_set_id, sequence),
  UNIQUE KEY uq_configuration_change_items_object (tenant_id, change_set_id, object_family, object_reference),
  CONSTRAINT fk_configuration_change_items_set
    FOREIGN KEY (tenant_id, change_set_id) REFERENCES configuration_change_sets(tenant_id, id),
  CONSTRAINT chk_configuration_change_items_sequence CHECK (sequence > 0),
  CONSTRAINT chk_configuration_change_items_operation CHECK (
    operation IN ('CREATE','UPDATE','DELETE')
  ),
  CONSTRAINT chk_configuration_change_items_hashes CHECK (
    (operation='CREATE' AND before_hash IS NULL AND after_hash IS NOT NULL)
    OR (operation='UPDATE' AND after_hash IS NOT NULL)
    OR (operation='DELETE' AND before_hash IS NOT NULL AND after_hash IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_promotion_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_set_id VARCHAR(64) NOT NULL,
  source_environment_id VARCHAR(64) NOT NULL,
  target_environment_id VARCHAR(64) NOT NULL,
  source_baseline_id VARCHAR(64) NOT NULL,
  expected_target_baseline_id VARCHAR(64) NOT NULL,
  resulting_target_baseline_id VARCHAR(64) NULL,
  run_reference VARCHAR(160) NOT NULL,
  mapping_definition JSON NOT NULL,
  mapping_checksum VARCHAR(255) NOT NULL,
  rollback_definition JSON NOT NULL,
  rollback_checksum VARCHAR(255) NOT NULL,
  requested_by_person_id VARCHAR(64) NOT NULL,
  requested_at DATETIME(6) NOT NULL,
  status VARCHAR(24) NOT NULL,
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  active_target_guard_key VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_promotion_runs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_promotion_runs_reference (tenant_id, run_reference),
  UNIQUE KEY uq_configuration_promotion_active_target (tenant_id, active_target_guard_key),
  CONSTRAINT fk_configuration_promotion_runs_set
    FOREIGN KEY (tenant_id, change_set_id) REFERENCES configuration_change_sets(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_source_environment
    FOREIGN KEY (tenant_id, source_environment_id) REFERENCES configuration_environments(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_target_environment
    FOREIGN KEY (tenant_id, target_environment_id) REFERENCES configuration_environments(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_source_baseline
    FOREIGN KEY (tenant_id, source_baseline_id) REFERENCES configuration_baselines(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_expected_target
    FOREIGN KEY (tenant_id, expected_target_baseline_id) REFERENCES configuration_baselines(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_resulting_target
    FOREIGN KEY (tenant_id, resulting_target_baseline_id) REFERENCES configuration_baselines(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_runs_requester
    FOREIGN KEY (tenant_id, requested_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_configuration_promotion_runs_environments CHECK (
    source_environment_id <> target_environment_id
  ),
  CONSTRAINT chk_configuration_promotion_runs_status CHECK (
    status IN ('QUEUED','RUNNING','BLOCKED','SUCCEEDED','FAILED','CANCELLED')
  ),
  CONSTRAINT chk_configuration_promotion_runs_state CHECK (
    (status='QUEUED' AND started_at IS NULL AND completed_at IS NULL AND resulting_target_baseline_id IS NULL)
    OR (status='RUNNING' AND started_at IS NOT NULL AND completed_at IS NULL AND resulting_target_baseline_id IS NULL)
    OR (status='SUCCEEDED' AND started_at IS NOT NULL AND completed_at IS NOT NULL AND resulting_target_baseline_id IS NOT NULL)
    OR (status IN ('BLOCKED','FAILED','CANCELLED') AND completed_at IS NOT NULL AND resulting_target_baseline_id IS NULL)
  ),
  CONSTRAINT chk_configuration_promotion_runs_guard CHECK (
    (status IN ('QUEUED','RUNNING') AND active_target_guard_key IS NOT NULL)
    OR (status NOT IN ('QUEUED','RUNNING') AND active_target_guard_key IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_promotion_item_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  promotion_run_id VARCHAR(64) NOT NULL,
  change_item_id VARCHAR(64) NOT NULL,
  outcome VARCHAR(24) NOT NULL,
  target_hash VARCHAR(255) NULL,
  message TEXT NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_configuration_promotion_item_results_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_promotion_item_results_item (tenant_id, promotion_run_id, change_item_id),
  CONSTRAINT fk_configuration_promotion_item_results_run
    FOREIGN KEY (tenant_id, promotion_run_id) REFERENCES configuration_promotion_runs(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_item_results_item
    FOREIGN KEY (tenant_id, change_item_id) REFERENCES configuration_change_items(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_item_results_person
    FOREIGN KEY (tenant_id, recorded_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_configuration_promotion_item_results_outcome CHECK (
    outcome IN ('APPLIED','NO_CHANGE','SKIPPED','FAILED','CONFLICT')
  ),
  CONSTRAINT chk_configuration_promotion_item_results_success CHECK (
    outcome NOT IN ('APPLIED','NO_CHANGE') OR target_hash IS NOT NULL
  ),
  CONSTRAINT chk_configuration_promotion_item_results_failure CHECK (
    outcome NOT IN ('FAILED','CONFLICT') OR message IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_promotion_conflicts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  promotion_run_id VARCHAR(64) NOT NULL,
  item_result_id VARCHAR(64) NULL,
  conflict_type VARCHAR(24) NOT NULL,
  severity VARCHAR(16) NOT NULL,
  code VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  detected_at DATETIME(6) NOT NULL,
  resolved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_configuration_promotion_conflicts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_promotion_conflicts_code (tenant_id, promotion_run_id, code),
  CONSTRAINT fk_configuration_promotion_conflicts_run
    FOREIGN KEY (tenant_id, promotion_run_id) REFERENCES configuration_promotion_runs(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_conflicts_item
    FOREIGN KEY (tenant_id, item_result_id) REFERENCES configuration_promotion_item_results(tenant_id, id),
  CONSTRAINT chk_configuration_promotion_conflicts_type CHECK (
    conflict_type IN ('MAPPING','DEPENDENCY','VERSION','AUTHORITY','COMPATIBILITY','TARGET_DRIFT','DATA','OTHER')
  ),
  CONSTRAINT chk_configuration_promotion_conflicts_severity CHECK (severity IN ('WARNING','BLOCKING')),
  CONSTRAINT chk_configuration_promotion_conflicts_status CHECK (status IN ('OPEN','DISPOSITIONED','RESOLVED')),
  CONSTRAINT chk_configuration_promotion_conflicts_state CHECK (
    (status='OPEN' AND resolved_at IS NULL)
    OR (status IN ('DISPOSITIONED','RESOLVED') AND resolved_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_promotion_conflict_dispositions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  conflict_id VARCHAR(64) NOT NULL,
  disposition VARCHAR(24) NOT NULL,
  rationale TEXT NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  disposed_by_person_id VARCHAR(64) NOT NULL,
  disposed_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_configuration_promotion_conflict_dispositions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_promotion_conflict_dispositions_conflict (tenant_id, conflict_id),
  CONSTRAINT fk_configuration_promotion_conflict_dispositions_conflict
    FOREIGN KEY (tenant_id, conflict_id) REFERENCES configuration_promotion_conflicts(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_conflict_dispositions_decision
    FOREIGN KEY (tenant_id, decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_configuration_promotion_conflict_dispositions_person
    FOREIGN KEY (tenant_id, disposed_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_configuration_promotion_conflict_dispositions_type CHECK (
    disposition IN ('MAP','USE_SOURCE','USE_TARGET','WAIVE','EXCLUDE','ABORT')
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.configuration_promotion.read', 'Read configuration promotion', 'View configuration environments, baselines, change sets, promotion runs, results and conflict evidence.'),
  ('platform.configuration_promotion.manage', 'Manage configuration promotion definitions', 'Create environments, baselines, baseline items, change sets and change items and freeze controlled configuration evidence.'),
  ('platform.configuration_promotion.approve', 'Approve configuration change sets', 'Bind an approved Decision to an exact frozen configuration change-set checksum.'),
  ('platform.configuration_promotion.execute', 'Execute configuration promotion', 'Queue, start and complete governed configuration promotion runs and record exact item results.'),
  ('platform.configuration_promotion.conflict_disposition', 'Disposition configuration promotion conflicts', 'Record Decision-backed mappings, waivers, exclusions and other conflict dispositions.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-054', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_promotion.read'),
  ('ARP-PLATFORM-ADMIN-055', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_promotion.manage'),
  ('ARP-PLATFORM-ADMIN-056', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_promotion.approve'),
  ('ARP-PLATFORM-ADMIN-057', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_promotion.execute'),
  ('ARP-PLATFORM-ADMIN-058', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_promotion.conflict_disposition');
