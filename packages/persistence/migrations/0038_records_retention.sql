CREATE TABLE retention_policies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL,
  checksum VARCHAR(255) NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  policy_created_at DATETIME(6) NOT NULL,
  frozen_by_person_id VARCHAR(64) NULL,
  frozen_at DATETIME(6) NULL,
  approval_decision_id VARCHAR(64) NULL,
  activated_at DATETIME(6) NULL,
  active_policy_guard_key VARCHAR(120) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_retention_policies_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_retention_policies_code_version (tenant_id, code, version),
  UNIQUE KEY uq_retention_policies_active_code (tenant_id, active_policy_guard_key),
  CONSTRAINT fk_retention_policies_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_retention_policies_scope FOREIGN KEY (tenant_id, scope_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_retention_policies_creator FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_retention_policies_freezer FOREIGN KEY (tenant_id, frozen_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_retention_policies_decision FOREIGN KEY (tenant_id, approval_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_retention_policies_version CHECK (version > 0),
  CONSTRAINT chk_retention_policies_status CHECK (status IN ('DRAFT','FROZEN','ACTIVE','SUPERSEDED','RETIRED')),
  CONSTRAINT chk_retention_policies_state CHECK (
    (status='DRAFT' AND checksum IS NULL AND frozen_by_person_id IS NULL AND frozen_at IS NULL AND approval_decision_id IS NULL AND activated_at IS NULL AND active_policy_guard_key IS NULL)
    OR (status='FROZEN' AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL AND approval_decision_id IS NULL AND activated_at IS NULL AND active_policy_guard_key IS NULL)
    OR (status='ACTIVE' AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL AND approval_decision_id IS NOT NULL AND activated_at IS NOT NULL AND active_policy_guard_key=code)
    OR (status IN ('SUPERSEDED','RETIRED') AND checksum IS NOT NULL AND frozen_by_person_id IS NOT NULL AND frozen_at IS NOT NULL AND approval_decision_id IS NOT NULL AND activated_at IS NOT NULL AND active_policy_guard_key IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE retention_rules (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  retention_policy_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  object_family VARCHAR(160) NOT NULL,
  trigger_type VARCHAR(24) NOT NULL,
  trigger_field VARCHAR(160) NULL,
  retention_period_days INT UNSIGNED NOT NULL,
  selection_criteria JSON NOT NULL,
  disposition_action VARCHAR(16) NOT NULL,
  enabled BOOLEAN NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_retention_rules_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_retention_rules_policy_code (tenant_id, retention_policy_id, code),
  UNIQUE KEY uq_retention_rules_policy_sequence (tenant_id, retention_policy_id, sequence),
  CONSTRAINT fk_retention_rules_policy FOREIGN KEY (tenant_id, retention_policy_id) REFERENCES retention_policies(tenant_id, id),
  CONSTRAINT chk_retention_rules_trigger CHECK (
    trigger_type IN ('CREATED_AT','LAST_MODIFIED_AT','RELEASED_AT','CLOSED_AT','ARCHIVED_AT','CUSTOM')
  ),
  CONSTRAINT chk_retention_rules_action CHECK (disposition_action IN ('ARCHIVE','DESTROY','REVIEW')),
  CONSTRAINT chk_retention_rules_sequence CHECK (sequence > 0),
  CONSTRAINT chk_retention_rules_custom_trigger CHECK (trigger_type <> 'CUSTOM' OR trigger_field IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE retention_holds (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  hold_type VARCHAR(24) NOT NULL,
  reason TEXT NOT NULL,
  blocks_archive BOOLEAN NOT NULL,
  blocks_destruction BOOLEAN NOT NULL,
  status VARCHAR(16) NOT NULL,
  imposed_by_person_id VARCHAR(64) NOT NULL,
  imposed_at DATETIME(6) NOT NULL,
  release_decision_id VARCHAR(64) NULL,
  released_by_person_id VARCHAR(64) NULL,
  released_at DATETIME(6) NULL,
  active_hold_guard_key VARCHAR(512) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_retention_holds_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_retention_holds_active_guard (tenant_id, active_hold_guard_key(500)),
  CONSTRAINT fk_retention_holds_subject FOREIGN KEY (tenant_id, subject_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_retention_holds_imposer FOREIGN KEY (tenant_id, imposed_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_retention_holds_release_decision FOREIGN KEY (tenant_id, release_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_retention_holds_releaser FOREIGN KEY (tenant_id, released_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_retention_holds_type CHECK (hold_type IN ('LEGAL','REGULATORY','RECORDS','INVESTIGATION','OTHER')),
  CONSTRAINT chk_retention_holds_status CHECK (status IN ('ACTIVE','RELEASED')),
  CONSTRAINT chk_retention_holds_state CHECK (
    (status='ACTIVE' AND release_decision_id IS NULL AND released_by_person_id IS NULL AND released_at IS NULL AND active_hold_guard_key IS NOT NULL)
    OR (status='RELEASED' AND release_decision_id IS NOT NULL AND released_by_person_id IS NOT NULL AND released_at IS NOT NULL AND active_hold_guard_key IS NULL)
  ),
  CONSTRAINT chk_retention_holds_protected CHECK (
    hold_type NOT IN ('LEGAL','REGULATORY') OR blocks_destruction=TRUE
  )
) ENGINE=InnoDB;

CREATE TABLE disposition_schedules (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  retention_rule_id VARCHAR(64) NOT NULL,
  schedule_expression VARCHAR(512) NOT NULL,
  timezone VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  schedule_created_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_disposition_schedules_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_disposition_schedules_rule FOREIGN KEY (tenant_id, retention_rule_id) REFERENCES retention_rules(tenant_id, id),
  CONSTRAINT fk_disposition_schedules_creator FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE disposition_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  retention_rule_id VARCHAR(64) NOT NULL,
  schedule_id VARCHAR(64) NULL,
  run_reference VARCHAR(160) NOT NULL,
  selection_snapshot JSON NOT NULL,
  selection_checksum VARCHAR(255) NOT NULL,
  requested_by_person_id VARCHAR(64) NOT NULL,
  requested_at DATETIME(6) NOT NULL,
  status VARCHAR(32) NOT NULL,
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  active_rule_guard_key VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_disposition_runs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_disposition_runs_reference (tenant_id, run_reference),
  UNIQUE KEY uq_disposition_runs_active_rule (tenant_id, active_rule_guard_key),
  CONSTRAINT fk_disposition_runs_rule FOREIGN KEY (tenant_id, retention_rule_id) REFERENCES retention_rules(tenant_id, id),
  CONSTRAINT fk_disposition_runs_schedule FOREIGN KEY (tenant_id, schedule_id) REFERENCES disposition_schedules(tenant_id, id),
  CONSTRAINT fk_disposition_runs_requester FOREIGN KEY (tenant_id, requested_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_disposition_runs_status CHECK (
    status IN ('QUEUED','RUNNING','COMPLETED','COMPLETED_WITH_EXCEPTIONS','FAILED','CANCELLED')
  ),
  CONSTRAINT chk_disposition_runs_state CHECK (
    (status='QUEUED' AND started_at IS NULL AND completed_at IS NULL AND active_rule_guard_key IS NOT NULL)
    OR (status='RUNNING' AND started_at IS NOT NULL AND completed_at IS NULL AND active_rule_guard_key IS NOT NULL)
    OR (status IN ('COMPLETED','COMPLETED_WITH_EXCEPTIONS','FAILED','CANCELLED') AND completed_at IS NOT NULL AND active_rule_guard_key IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE archive_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  disposition_run_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  archive_reference VARCHAR(512) NOT NULL,
  integrity_hash VARCHAR(255) NOT NULL,
  archive_manifest JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  archived_by_person_id VARCHAR(64) NOT NULL,
  archived_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_archive_records_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_archive_records_reference (tenant_id, archive_reference(500)),
  CONSTRAINT fk_archive_records_run FOREIGN KEY (tenant_id, disposition_run_id) REFERENCES disposition_runs(tenant_id, id),
  CONSTRAINT fk_archive_records_archiver FOREIGN KEY (tenant_id, archived_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_archive_records_status CHECK (status IN ('AVAILABLE','DESTROYED'))
) ENGINE=InnoDB;

CREATE TABLE restore_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  archive_record_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  restore_reference VARCHAR(160) NOT NULL,
  restore_decision_id VARCHAR(64) NOT NULL,
  restored_content_reference VARCHAR(512) NOT NULL,
  integrity_hash VARCHAR(255) NOT NULL,
  restored_by_person_id VARCHAR(64) NOT NULL,
  restored_at DATETIME(6) NOT NULL,
  status VARCHAR(16) NOT NULL,
  message TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_restore_runs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_restore_runs_reference (tenant_id, restore_reference),
  CONSTRAINT fk_restore_runs_archive FOREIGN KEY (tenant_id, archive_record_id) REFERENCES archive_records(tenant_id, id),
  CONSTRAINT fk_restore_runs_decision FOREIGN KEY (tenant_id, restore_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_restore_runs_person FOREIGN KEY (tenant_id, restored_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_restore_runs_status CHECK (status IN ('SUCCEEDED','FAILED')),
  CONSTRAINT chk_restore_runs_failure CHECK (status <> 'FAILED' OR message IS NOT NULL)
) ENGINE=InnoDB;

CREATE TABLE destruction_evidence (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  disposition_run_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  archive_record_id VARCHAR(64) NULL,
  destruction_decision_id VARCHAR(64) NOT NULL,
  method VARCHAR(255) NOT NULL,
  metadata_outcome VARCHAR(32) NOT NULL,
  content_outcome VARCHAR(24) NOT NULL,
  integrity_hash VARCHAR(255) NOT NULL,
  destroyed_by_person_id VARCHAR(64) NOT NULL,
  destroyed_at DATETIME(6) NOT NULL,
  evidence JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_destruction_evidence_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_destruction_evidence_run FOREIGN KEY (tenant_id, disposition_run_id) REFERENCES disposition_runs(tenant_id, id),
  CONSTRAINT fk_destruction_evidence_archive FOREIGN KEY (tenant_id, archive_record_id) REFERENCES archive_records(tenant_id, id),
  CONSTRAINT fk_destruction_evidence_decision FOREIGN KEY (tenant_id, destruction_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_destruction_evidence_person FOREIGN KEY (tenant_id, destroyed_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_destruction_evidence_metadata CHECK (metadata_outcome IN ('TOMBSTONE_RETAINED','DELETED')),
  CONSTRAINT chk_destruction_evidence_content CHECK (content_outcome IN ('DELETED','NOT_APPLICABLE'))
) ENGINE=InnoDB;

CREATE TABLE disposition_item_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  disposition_run_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  outcome VARCHAR(24) NOT NULL,
  reason TEXT NOT NULL,
  hold_id VARCHAR(64) NULL,
  archive_record_id VARCHAR(64) NULL,
  destruction_evidence_id VARCHAR(64) NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_disposition_item_results_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_disposition_item_results_run FOREIGN KEY (tenant_id, disposition_run_id) REFERENCES disposition_runs(tenant_id, id),
  CONSTRAINT fk_disposition_item_results_hold FOREIGN KEY (tenant_id, hold_id) REFERENCES retention_holds(tenant_id, id),
  CONSTRAINT fk_disposition_item_results_archive FOREIGN KEY (tenant_id, archive_record_id) REFERENCES archive_records(tenant_id, id),
  CONSTRAINT fk_disposition_item_results_destruction FOREIGN KEY (tenant_id, destruction_evidence_id) REFERENCES destruction_evidence(tenant_id, id),
  CONSTRAINT fk_disposition_item_results_person FOREIGN KEY (tenant_id, recorded_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_disposition_item_results_outcome CHECK (
    outcome IN ('HELD','ARCHIVED','DESTROYED','REVIEW_REQUIRED','SKIPPED','FAILED')
  ),
  CONSTRAINT chk_disposition_item_results_hold CHECK (
    outcome <> 'HELD' OR hold_id IS NOT NULL
  ),
  CONSTRAINT chk_disposition_item_results_archive CHECK (
    outcome <> 'ARCHIVED' OR archive_record_id IS NOT NULL
  ),
  CONSTRAINT chk_disposition_item_results_destruction CHECK (
    outcome <> 'DESTROYED' OR destruction_evidence_id IS NOT NULL
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.records_retention.read', 'Read records retention', 'View retention policies, holds, schedules, disposition executions, archives, restores and destruction evidence.'),
  ('platform.records_retention.manage', 'Manage records retention', 'Create, freeze and activate retention policies and rules and manage disposition schedules.'),
  ('platform.records_retention.hold_manage', 'Manage records holds', 'Impose and release legal, regulatory, records and investigation holds.'),
  ('platform.records_retention.execute', 'Execute disposition', 'Queue, start and complete governed disposition runs and record item outcomes and archives.'),
  ('platform.records_retention.destroy', 'Record authorised destruction', 'Record Decision-backed destruction evidence when no active hold blocks destruction.'),
  ('platform.records_retention.restore', 'Restore archived records', 'Record Decision-backed restoration from governed archive records.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-059', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.read'),
  ('ARP-PLATFORM-ADMIN-060', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.manage'),
  ('ARP-PLATFORM-ADMIN-061', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.hold_manage'),
  ('ARP-PLATFORM-ADMIN-062', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.execute'),
  ('ARP-PLATFORM-ADMIN-063', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.destroy'),
  ('ARP-PLATFORM-ADMIN-064', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.records_retention.restore');
