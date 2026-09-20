CREATE TABLE lifecycle_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  object_type VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_lifecycle_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_lifecycle_definitions_tenant_code (tenant_id, code),
  KEY ix_lifecycle_definitions_object_type (tenant_id, object_type, status),
  CONSTRAINT fk_lifecycle_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_lifecycle_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE lifecycle_state_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  lifecycle_definition_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(24) NOT NULL,
  is_initial BOOLEAN NOT NULL DEFAULT FALSE,
  is_terminal BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_lifecycle_states_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_lifecycle_states_definition_id (tenant_id, lifecycle_definition_id, id),
  UNIQUE KEY uq_lifecycle_states_definition_code (tenant_id, lifecycle_definition_id, code),
  KEY ix_lifecycle_states_initial (tenant_id, lifecycle_definition_id, is_initial, status),
  CONSTRAINT fk_lifecycle_states_definition FOREIGN KEY (tenant_id, lifecycle_definition_id)
    REFERENCES lifecycle_definitions(tenant_id, id),
  CONSTRAINT chk_lifecycle_states_category CHECK (
    category IN ('DRAFT', 'ACTIVE', 'RELEASED', 'CLOSED', 'CANCELLED', 'SUPERSEDED')
  ),
  CONSTRAINT chk_lifecycle_states_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE lifecycle_transition_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  lifecycle_definition_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  from_state_id VARCHAR(64) NOT NULL,
  to_state_id VARCHAR(64) NOT NULL,
  requires_decision BOOLEAN NOT NULL DEFAULT FALSE,
  required_decision_type VARCHAR(120) NULL,
  required_decision_outcome VARCHAR(120) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_lifecycle_transitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_lifecycle_transitions_definition_id (tenant_id, lifecycle_definition_id, id),
  UNIQUE KEY uq_lifecycle_transitions_definition_code (tenant_id, lifecycle_definition_id, code),
  KEY ix_lifecycle_transitions_from (tenant_id, lifecycle_definition_id, from_state_id, status),
  CONSTRAINT fk_lifecycle_transitions_definition FOREIGN KEY (tenant_id, lifecycle_definition_id)
    REFERENCES lifecycle_definitions(tenant_id, id),
  CONSTRAINT fk_lifecycle_transitions_from_state
    FOREIGN KEY (tenant_id, lifecycle_definition_id, from_state_id)
    REFERENCES lifecycle_state_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT fk_lifecycle_transitions_to_state
    FOREIGN KEY (tenant_id, lifecycle_definition_id, to_state_id)
    REFERENCES lifecycle_state_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT chk_lifecycle_transitions_state_change CHECK (from_state_id <> to_state_id),
  CONSTRAINT chk_lifecycle_transitions_decision CHECK (
    (requires_decision = FALSE AND required_decision_type IS NULL AND required_decision_outcome IS NULL)
    OR
    (requires_decision = TRUE AND required_decision_type IS NOT NULL AND required_decision_outcome IS NOT NULL)
  ),
  CONSTRAINT chk_lifecycle_transitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE decisions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  decision_type VARCHAR(120) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  outcome VARCHAR(120) NOT NULL,
  reason TEXT NOT NULL,
  decider_person_id VARCHAR(64) NOT NULL,
  authority_grant_id VARCHAR(64) NULL,
  decided_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  correlation_id VARCHAR(128) NULL,
  UNIQUE KEY uq_decisions_tenant_id_id (tenant_id, id),
  KEY ix_decisions_subject (tenant_id, subject_object_id, decided_at),
  KEY ix_decisions_type_outcome (tenant_id, decision_type, outcome, decided_at),
  CONSTRAINT fk_decisions_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_decisions_decider FOREIGN KEY (tenant_id, decider_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_decisions_authority_grant FOREIGN KEY (tenant_id, authority_grant_id)
    REFERENCES authority_grants(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE object_lifecycle_states (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  lifecycle_definition_id VARCHAR(64) NOT NULL,
  lifecycle_state_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  sequence BIGINT UNSIGNED NOT NULL,
  effective_at DATETIME(6) NOT NULL,
  transition_id VARCHAR(64) NULL,
  decision_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_object_lifecycle_states_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_object_lifecycle_states_object (tenant_id, canonical_object_id),
  KEY ix_object_lifecycle_states_definition_state
    (tenant_id, lifecycle_definition_id, lifecycle_state_id),
  CONSTRAINT fk_object_lifecycle_states_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_object_lifecycle_states_definition FOREIGN KEY (tenant_id, lifecycle_definition_id)
    REFERENCES lifecycle_definitions(tenant_id, id),
  CONSTRAINT fk_object_lifecycle_states_state
    FOREIGN KEY (tenant_id, lifecycle_definition_id, lifecycle_state_id)
    REFERENCES lifecycle_state_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT fk_object_lifecycle_states_transition
    FOREIGN KEY (tenant_id, lifecycle_definition_id, transition_id)
    REFERENCES lifecycle_transition_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT fk_object_lifecycle_states_decision FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_object_lifecycle_states_sequence CHECK (sequence >= 1)
) ENGINE=InnoDB;

CREATE TABLE object_lifecycle_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  object_lifecycle_state_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  lifecycle_definition_id VARCHAR(64) NOT NULL,
  lifecycle_state_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  sequence BIGINT UNSIGNED NOT NULL,
  transition_id VARCHAR(64) NULL,
  decision_id VARCHAR(64) NULL,
  effective_at DATETIME(6) NOT NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_object_lifecycle_history_object_sequence (tenant_id, canonical_object_id, sequence),
  KEY ix_object_lifecycle_history_state
    (tenant_id, lifecycle_definition_id, lifecycle_state_id, recorded_at),
  CONSTRAINT fk_object_lifecycle_history_current FOREIGN KEY (tenant_id, object_lifecycle_state_id)
    REFERENCES object_lifecycle_states(tenant_id, id),
  CONSTRAINT fk_object_lifecycle_history_object FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_object_lifecycle_history_definition FOREIGN KEY (tenant_id, lifecycle_definition_id)
    REFERENCES lifecycle_definitions(tenant_id, id),
  CONSTRAINT fk_object_lifecycle_history_state
    FOREIGN KEY (tenant_id, lifecycle_definition_id, lifecycle_state_id)
    REFERENCES lifecycle_state_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT fk_object_lifecycle_history_transition
    FOREIGN KEY (tenant_id, lifecycle_definition_id, transition_id)
    REFERENCES lifecycle_transition_definitions(tenant_id, lifecycle_definition_id, id),
  CONSTRAINT fk_object_lifecycle_history_decision FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_object_lifecycle_history_sequence CHECK (sequence >= 1)
) ENGINE=InnoDB;

CREATE TABLE business_events (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(120) NOT NULL,
  aggregate_type VARCHAR(120) NOT NULL,
  aggregate_id VARCHAR(160) NOT NULL,
  subject_object_id VARCHAR(64) NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  occurred_at DATETIME(6) NOT NULL,
  payload JSON NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_business_events_tenant_id_id (tenant_id, id),
  KEY ix_business_events_aggregate (tenant_id, aggregate_type, aggregate_id, occurred_at),
  KEY ix_business_events_subject (tenant_id, subject_object_id, occurred_at),
  CONSTRAINT fk_business_events_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_business_events_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_business_events_actor FOREIGN KEY (tenant_id, actor_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE evidence_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  evidence_type VARCHAR(120) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  captured_by_person_id VARCHAR(64) NULL,
  captured_at DATETIME(6) NOT NULL,
  content_reference VARCHAR(1024) NULL,
  integrity_hash VARCHAR(255) NULL,
  metadata JSON NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_evidence_records_tenant_id_id (tenant_id, id),
  KEY ix_evidence_records_subject (tenant_id, subject_object_id, captured_at),
  CONSTRAINT fk_evidence_records_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_evidence_records_captured_by FOREIGN KEY (tenant_id, captured_by_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;
