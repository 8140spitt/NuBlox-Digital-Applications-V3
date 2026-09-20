CREATE TABLE changes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  change_type VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  raised_by_person_id VARCHAR(64) NOT NULL,
  raised_at DATETIME(6) NOT NULL,
  decision_id VARCHAR(64) NULL,
  decided_at DATETIME(6) NULL,
  resulting_baseline_id VARCHAR(64) NULL,
  closed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_changes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_changes_canonical_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_changes_code (tenant_id, code),
  KEY ix_changes_status (tenant_id, status, raised_at),
  CONSTRAINT fk_changes_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_changes_raiser
    FOREIGN KEY (tenant_id, raised_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_changes_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_changes_baseline
    FOREIGN KEY (tenant_id, resulting_baseline_id)
    REFERENCES baselines(tenant_id, id),
  CONSTRAINT chk_changes_status CHECK (
    status IN (
      'DRAFT', 'UNDER_ASSESSMENT', 'AWAITING_DECISION', 'APPROVED', 'REJECTED',
      'IMPLEMENTING', 'VERIFYING', 'CLOSED', 'CANCELLED'
    )
  ),
  CONSTRAINT chk_changes_decision_state CHECK (
    (status IN ('DRAFT', 'UNDER_ASSESSMENT', 'AWAITING_DECISION')
      AND decision_id IS NULL AND decided_at IS NULL)
    OR
    (status IN ('APPROVED', 'REJECTED', 'IMPLEMENTING', 'VERIFYING', 'CLOSED')
      AND decision_id IS NOT NULL AND decided_at IS NOT NULL)
    OR
    status = 'CANCELLED'
  ),
  CONSTRAINT chk_changes_closure_state CHECK (
    (status = 'CLOSED' AND closed_at IS NOT NULL)
    OR
    (status <> 'CLOSED' AND closed_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE change_status_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  decision_id VARCHAR(64) NULL,
  note TEXT NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  KEY ix_change_status_history (tenant_id, change_id, history_id),
  CONSTRAINT fk_change_status_history_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_status_history_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_change_status_history_actor
    FOREIGN KEY (tenant_id, actor_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_change_status_history_status CHECK (
    status IN (
      'DRAFT', 'UNDER_ASSESSMENT', 'AWAITING_DECISION', 'APPROVED', 'REJECTED',
      'IMPLEMENTING', 'VERIFYING', 'CLOSED', 'CANCELLED'
    )
  )
) ENGINE=InnoDB;

CREATE TABLE change_affected_objects (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  disposition VARCHAR(16) NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_change_affected_objects_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_change_affected_objects_subject
    (tenant_id, change_id, subject_object_id, subject_version),
  KEY ix_change_affected_objects_change (tenant_id, change_id, disposition),
  CONSTRAINT fk_change_affected_objects_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_affected_objects_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_change_affected_objects_disposition CHECK (
    disposition IN ('ADD', 'MODIFY', 'REMOVE', 'REVIEW')
  )
) ENGINE=InnoDB;

CREATE TABLE change_impact_assessments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  domain VARCHAR(120) NOT NULL,
  assessor_person_id VARCHAR(64) NOT NULL,
  assessed_at DATETIME(6) NOT NULL,
  impact_level VARCHAR(16) NOT NULL,
  summary TEXT NOT NULL,
  cost_impact DECIMAL(24,6) NULL,
  schedule_impact_days DECIMAL(12,3) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_change_impact_assessments_tenant_id_id (tenant_id, id),
  KEY ix_change_impact_assessments_change
    (tenant_id, change_id, domain, impact_level),
  CONSTRAINT fk_change_impact_assessments_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_impact_assessments_assessor
    FOREIGN KEY (tenant_id, assessor_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_change_impact_assessments_level CHECK (
    impact_level IN ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  )
) ENGINE=InnoDB;

CREATE TABLE change_implementation_actions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  action_type VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  target_object_id VARCHAR(64) NULL,
  target_version VARCHAR(120) NULL,
  work_item_id VARCHAR(64) NULL,
  status VARCHAR(20) NOT NULL,
  completed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_change_implementation_actions_tenant_id_id (tenant_id, id),
  KEY ix_change_implementation_actions_change (tenant_id, change_id, status),
  CONSTRAINT fk_change_implementation_actions_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_implementation_actions_target
    FOREIGN KEY (tenant_id, target_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_change_implementation_actions_work
    FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id),
  CONSTRAINT chk_change_implementation_actions_status CHECK (
    status IN ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  CONSTRAINT chk_change_implementation_actions_completion CHECK (
    (status = 'COMPLETED' AND completed_at IS NOT NULL)
    OR
    (status <> 'COMPLETED' AND completed_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE change_verifications (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  verifier_person_id VARCHAR(64) NOT NULL,
  verified_at DATETIME(6) NOT NULL,
  outcome VARCHAR(16) NOT NULL,
  evidence_record_id VARCHAR(64) NULL,
  notes TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_change_verifications_tenant_id_id (tenant_id, id),
  KEY ix_change_verifications_change (tenant_id, change_id, verified_at),
  CONSTRAINT fk_change_verifications_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_verifications_verifier
    FOREIGN KEY (tenant_id, verifier_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_change_verifications_evidence
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_change_verifications_outcome CHECK (
    outcome IN ('PASS', 'FAIL', 'PARTIAL')
  )
) ENGINE=InnoDB;

CREATE TABLE change_discrepancies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  change_id VARCHAR(64) NOT NULL,
  affected_object_id VARCHAR(64) NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  resolved_at DATETIME(6) NULL,
  resolution TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_change_discrepancies_tenant_id_id (tenant_id, id),
  KEY ix_change_discrepancies_change (tenant_id, change_id, status),
  CONSTRAINT fk_change_discrepancies_change
    FOREIGN KEY (tenant_id, change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_change_discrepancies_affected_object
    FOREIGN KEY (tenant_id, affected_object_id)
    REFERENCES change_affected_objects(tenant_id, id),
  CONSTRAINT chk_change_discrepancies_status CHECK (
    status IN ('OPEN', 'RESOLVED', 'ACCEPTED')
  ),
  CONSTRAINT chk_change_discrepancies_resolution CHECK (
    (status = 'OPEN' AND resolved_at IS NULL AND resolution IS NULL)
    OR
    (status IN ('RESOLVED', 'ACCEPTED') AND resolved_at IS NOT NULL AND resolution IS NOT NULL)
  )
) ENGINE=InnoDB;
