CREATE TABLE deliverable_requirements (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  deliverable_type VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  function_id VARCHAR(16) NULL,
  sub_function_id VARCHAR(32) NULL,
  process_definition_id VARCHAR(64) NULL,
  task_definition_id VARCHAR(64) NULL,
  functional_deployment_id VARCHAR(64) NULL,
  source_requirement_object_id VARCHAR(64) NULL,
  source_requirement_version VARCHAR(120) NULL,
  context_object_id VARCHAR(64) NOT NULL,
  authoring_mode VARCHAR(32) NOT NULL,
  required_representation_types JSON NOT NULL,
  planned_due_at DATETIME(6) NULL,
  acceptance_required BOOLEAN NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deliverable_requirements_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_deliverable_requirements_tenant_code (tenant_id, code),
  KEY ix_deliverable_requirements_context
    (tenant_id, context_object_id, status, planned_due_at),
  KEY ix_deliverable_requirements_function
    (tenant_id, function_id, sub_function_id, status),
  CONSTRAINT fk_deliverable_requirements_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_deliverable_requirements_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_deliverable_requirements_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT fk_deliverable_requirements_process
    FOREIGN KEY (tenant_id, process_definition_id)
    REFERENCES process_definitions(tenant_id, id),
  CONSTRAINT fk_deliverable_requirements_task
    FOREIGN KEY (tenant_id, task_definition_id)
    REFERENCES task_definitions(tenant_id, id),
  CONSTRAINT fk_deliverable_requirements_deployment
    FOREIGN KEY (tenant_id, functional_deployment_id)
    REFERENCES functional_deployments(tenant_id, id),
  CONSTRAINT fk_deliverable_requirements_source
    FOREIGN KEY (tenant_id, source_requirement_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_requirements_context
    FOREIGN KEY (tenant_id, context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_deliverable_requirements_authoring_mode CHECK (
    authoring_mode IN ('NATIVE', 'CONNECTED', 'EXTERNAL_AUTHORITATIVE')
  ),
  CONSTRAINT chk_deliverable_requirements_source_version CHECK (
    source_requirement_version IS NULL OR source_requirement_object_id IS NOT NULL
  ),
  CONSTRAINT chk_deliverable_requirements_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  requirement_id VARCHAR(64) NOT NULL,
  context_object_id VARCHAR(64) NOT NULL,
  functional_deployment_id VARCHAR(64) NULL,
  code VARCHAR(160) NOT NULL,
  title VARCHAR(255) NOT NULL,
  deliverable_type VARCHAR(120) NOT NULL,
  status VARCHAR(24) NOT NULL,
  planned_at DATETIME(6) NULL,
  forecast_at DATETIME(6) NULL,
  actual_at DATETIME(6) NULL,
  governed_output_object_id VARCHAR(64) NULL,
  governed_output_version VARCHAR(120) NULL,
  configuration_item_id VARCHAR(64) NULL,
  baseline_id VARCHAR(64) NULL,
  linked_change_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deliverable_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_deliverable_items_canonical_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_deliverable_items_tenant_code (tenant_id, code),
  KEY ix_deliverable_items_requirement (tenant_id, requirement_id, status),
  KEY ix_deliverable_items_context
    (tenant_id, context_object_id, status, forecast_at, planned_at),
  KEY ix_deliverable_items_output
    (tenant_id, governed_output_object_id, governed_output_version),
  CONSTRAINT fk_deliverable_items_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_items_requirement
    FOREIGN KEY (tenant_id, requirement_id)
    REFERENCES deliverable_requirements(tenant_id, id),
  CONSTRAINT fk_deliverable_items_context
    FOREIGN KEY (tenant_id, context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_items_deployment
    FOREIGN KEY (tenant_id, functional_deployment_id)
    REFERENCES functional_deployments(tenant_id, id),
  CONSTRAINT fk_deliverable_items_output
    FOREIGN KEY (tenant_id, governed_output_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_items_configuration
    FOREIGN KEY (tenant_id, configuration_item_id)
    REFERENCES configuration_items(tenant_id, id),
  CONSTRAINT fk_deliverable_items_baseline
    FOREIGN KEY (tenant_id, baseline_id)
    REFERENCES baselines(tenant_id, id),
  CONSTRAINT fk_deliverable_items_change
    FOREIGN KEY (tenant_id, linked_change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT chk_deliverable_items_status CHECK (
    status IN (
      'PLANNED', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED',
      'ISSUED', 'ACCEPTED', 'REWORK', 'CLOSED', 'CANCELLED'
    )
  ),
  CONSTRAINT chk_deliverable_items_output_version CHECK (
    governed_output_version IS NULL OR governed_output_object_id IS NOT NULL
  ),
  CONSTRAINT chk_deliverable_items_controlled_output CHECK (
    status IN ('PLANNED', 'IN_PROGRESS', 'CANCELLED')
    OR governed_output_object_id IS NOT NULL
  ),
  CONSTRAINT chk_deliverable_items_actual CHECK (
    (status = 'CLOSED' AND actual_at IS NOT NULL)
    OR
    (status <> 'CLOSED' AND actual_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_item_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  governed_output_object_id VARCHAR(64) NULL,
  governed_output_version VARCHAR(120) NULL,
  recorded_at DATETIME(6) NOT NULL,
  note TEXT NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  KEY ix_deliverable_item_history
    (tenant_id, deliverable_item_id, history_id),
  CONSTRAINT fk_deliverable_item_history_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_item_history_output
    FOREIGN KEY (tenant_id, governed_output_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_item_history_actor
    FOREIGN KEY (tenant_id, actor_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_deliverable_item_history_status CHECK (
    status IN (
      'PLANNED', 'IN_PROGRESS', 'IN_REVIEW', 'APPROVED',
      'ISSUED', 'ACCEPTED', 'REWORK', 'CLOSED', 'CANCELLED'
    )
  ),
  CONSTRAINT chk_deliverable_item_history_output_version CHECK (
    governed_output_version IS NULL OR governed_output_object_id IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_responsibilities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  principal_type VARCHAR(32) NOT NULL,
  principal_id VARCHAR(64) NOT NULL,
  responsibility_role VARCHAR(32) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deliverable_responsibilities_tenant_id_id (tenant_id, id),
  KEY ix_deliverable_responsibilities_item
    (tenant_id, deliverable_item_id, responsibility_role, status),
  KEY ix_deliverable_responsibilities_principal
    (tenant_id, principal_type, principal_id, status, effective_from, effective_to),
  CONSTRAINT fk_deliverable_responsibilities_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT chk_deliverable_responsibilities_principal_type CHECK (
    principal_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION')
  ),
  CONSTRAINT chk_deliverable_responsibilities_role CHECK (
    responsibility_role IN (
      'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
      'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
    )
  ),
  CONSTRAINT chk_deliverable_responsibilities_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_deliverable_responsibilities_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_reviews (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  review_type VARCHAR(32) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  reviewer_person_id VARCHAR(64) NOT NULL,
  reviewed_at DATETIME(6) NOT NULL,
  outcome VARCHAR(24) NOT NULL,
  comments TEXT NULL,
  evidence_record_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_deliverable_reviews_tenant_id_id (tenant_id, id),
  KEY ix_deliverable_reviews_item
    (tenant_id, deliverable_item_id, reviewed_at),
  KEY ix_deliverable_reviews_subject
    (tenant_id, subject_object_id, subject_version, reviewed_at),
  CONSTRAINT fk_deliverable_reviews_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_reviews_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_reviews_reviewer
    FOREIGN KEY (tenant_id, reviewer_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_deliverable_reviews_evidence
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_deliverable_reviews_type CHECK (
    review_type IN (
      'AUTHOR_REVIEW', 'PEER_REVIEW', 'CHECK',
      'TECHNICAL_REVIEW', 'ASSURANCE', 'CUSTOM'
    )
  ),
  CONSTRAINT chk_deliverable_reviews_outcome CHECK (
    outcome IN ('NO_COMMENT', 'COMMENTS', 'REVISE', 'REJECTED')
  ),
  CONSTRAINT chk_deliverable_reviews_comments CHECK (
    outcome = 'NO_COMMENT' OR comments IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_approvals (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  approved_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_deliverable_approvals_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_deliverable_approvals_decision (tenant_id, decision_id),
  KEY ix_deliverable_approvals_item
    (tenant_id, deliverable_item_id, approved_at),
  CONSTRAINT fk_deliverable_approvals_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_approvals_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_deliverable_approvals_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE transmittals (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  issue_reference VARCHAR(160) NOT NULL,
  issue_purpose VARCHAR(160) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  representation_id VARCHAR(64) NULL,
  issued_by_person_id VARCHAR(64) NOT NULL,
  issued_at DATETIME(6) NOT NULL,
  response_required BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_transmittals_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_transmittals_reference (tenant_id, issue_reference),
  KEY ix_transmittals_item (tenant_id, deliverable_item_id, issued_at),
  KEY ix_transmittals_subject
    (tenant_id, subject_object_id, subject_version, issued_at),
  CONSTRAINT fk_transmittals_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_transmittals_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_transmittals_representation
    FOREIGN KEY (tenant_id, representation_id)
    REFERENCES representations(tenant_id, id),
  CONSTRAINT fk_transmittals_issuer
    FOREIGN KEY (tenant_id, issued_by_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE transmittal_recipients (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  transmittal_id VARCHAR(64) NOT NULL,
  recipient_party_id VARCHAR(64) NOT NULL,
  response_required BOOLEAN NOT NULL,
  due_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_transmittal_recipients_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_transmittal_recipients_party
    (tenant_id, transmittal_id, recipient_party_id),
  KEY ix_transmittal_recipients_response
    (tenant_id, transmittal_id, response_required, due_at),
  CONSTRAINT fk_transmittal_recipients_transmittal
    FOREIGN KEY (tenant_id, transmittal_id)
    REFERENCES transmittals(tenant_id, id),
  CONSTRAINT fk_transmittal_recipients_party
    FOREIGN KEY (tenant_id, recipient_party_id)
    REFERENCES parties(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE recipient_responses (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  transmittal_recipient_id VARCHAR(64) NOT NULL,
  responder_person_id VARCHAR(64) NULL,
  outcome VARCHAR(32) NOT NULL,
  comments TEXT NULL,
  responded_at DATETIME(6) NOT NULL,
  evidence_record_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_recipient_responses_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_recipient_responses_recipient
    (tenant_id, transmittal_recipient_id),
  CONSTRAINT fk_recipient_responses_recipient
    FOREIGN KEY (tenant_id, transmittal_recipient_id)
    REFERENCES transmittal_recipients(tenant_id, id),
  CONSTRAINT fk_recipient_responses_responder
    FOREIGN KEY (tenant_id, responder_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_recipient_responses_evidence
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_recipient_responses_outcome CHECK (
    outcome IN (
      'ACCEPTED', 'ACCEPTED_WITH_COMMENTS', 'NO_OBJECTION', 'REVISE', 'REJECTED'
    )
  ),
  CONSTRAINT chk_recipient_responses_comments CHECK (
    outcome IN ('ACCEPTED', 'NO_OBJECTION') OR comments IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_rework (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  trigger_type VARCHAR(32) NOT NULL,
  trigger_id VARCHAR(64) NOT NULL,
  previous_subject_object_id VARCHAR(64) NOT NULL,
  previous_subject_version VARCHAR(120) NULL,
  reason TEXT NOT NULL,
  work_item_id VARCHAR(64) NULL,
  created_at DATETIME(6) NOT NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_deliverable_rework_tenant_id_id (tenant_id, id),
  KEY ix_deliverable_rework_item
    (tenant_id, deliverable_item_id, created_at),
  CONSTRAINT fk_deliverable_rework_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_rework_subject
    FOREIGN KEY (tenant_id, previous_subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_rework_work
    FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id),
  CONSTRAINT chk_deliverable_rework_trigger CHECK (
    trigger_type IN ('REVIEW', 'DECISION', 'RECIPIENT_RESPONSE')
  )
) ENGINE=InnoDB;

CREATE TABLE deliverable_consequences (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  consequence_type VARCHAR(120) NOT NULL,
  target_object_id VARCHAR(64) NULL,
  target_version VARCHAR(120) NULL,
  status VARCHAR(16) NOT NULL,
  applied_at DATETIME(6) NULL,
  evidence_record_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deliverable_consequences_tenant_id_id (tenant_id, id),
  KEY ix_deliverable_consequences_item
    (tenant_id, deliverable_item_id, status),
  CONSTRAINT fk_deliverable_consequences_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_consequences_target
    FOREIGN KEY (tenant_id, target_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_consequences_evidence
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_deliverable_consequences_target_version CHECK (
    target_version IS NULL OR target_object_id IS NOT NULL
  ),
  CONSTRAINT chk_deliverable_consequences_status CHECK (
    status IN ('PENDING', 'APPLIED', 'FAILED')
  ),
  CONSTRAINT chk_deliverable_consequences_applied CHECK (
    (status = 'APPLIED' AND applied_at IS NOT NULL)
    OR
    (status <> 'APPLIED' AND applied_at IS NULL)
  )
) ENGINE=InnoDB;
