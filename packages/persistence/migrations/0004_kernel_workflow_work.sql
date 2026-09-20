CREATE TABLE workflow_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_workflow_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_workflow_definitions_tenant_code (tenant_id, code),
  CONSTRAINT fk_workflow_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_workflow_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE workflow_definition_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  workflow_definition_id VARCHAR(64) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_workflow_definition_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_workflow_definition_versions_number
    (tenant_id, workflow_definition_id, version),
  KEY ix_workflow_definition_versions_status
    (tenant_id, workflow_definition_id, status, effective_from, effective_to),
  CONSTRAINT fk_workflow_definition_versions_definition
    FOREIGN KEY (tenant_id, workflow_definition_id)
    REFERENCES workflow_definitions(tenant_id, id),
  CONSTRAINT chk_workflow_definition_versions_version CHECK (version >= 1),
  CONSTRAINT chk_workflow_definition_versions_status
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'RETIRED')),
  CONSTRAINT chk_workflow_definition_versions_period CHECK (
    effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from
  )
) ENGINE=InnoDB;

CREATE TABLE workflow_instances (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  workflow_definition_id VARCHAR(64) NOT NULL,
  workflow_definition_version_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  status VARCHAR(16) NOT NULL,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  completion_reason TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_workflow_instances_tenant_id_id (tenant_id, id),
  KEY ix_workflow_instances_subject (tenant_id, subject_object_id, status, started_at),
  KEY ix_workflow_instances_definition
    (tenant_id, workflow_definition_id, workflow_definition_version_id, status),
  CONSTRAINT fk_workflow_instances_definition
    FOREIGN KEY (tenant_id, workflow_definition_id)
    REFERENCES workflow_definitions(tenant_id, id),
  CONSTRAINT fk_workflow_instances_definition_version
    FOREIGN KEY (tenant_id, workflow_definition_version_id)
    REFERENCES workflow_definition_versions(tenant_id, id),
  CONSTRAINT fk_workflow_instances_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_workflow_instances_status
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT chk_workflow_instances_completion CHECK (
    (status = 'ACTIVE' AND completed_at IS NULL AND completion_reason IS NULL)
    OR
    (status IN ('COMPLETED', 'CANCELLED') AND completed_at IS NOT NULL AND completion_reason IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE workflow_instance_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  workflow_instance_id VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  reason TEXT NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  KEY ix_workflow_instance_history
    (tenant_id, workflow_instance_id, history_id),
  CONSTRAINT fk_workflow_instance_history_instance
    FOREIGN KEY (tenant_id, workflow_instance_id)
    REFERENCES workflow_instances(tenant_id, id),
  CONSTRAINT fk_workflow_instance_history_actor
    FOREIGN KEY (tenant_id, actor_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_workflow_instance_history_status
    CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE work_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  workflow_instance_id VARCHAR(64) NOT NULL,
  work_type VARCHAR(120) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  title VARCHAR(255) NOT NULL,
  instructions TEXT NULL,
  status VARCHAR(24) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  due_at DATETIME(6) NULL,
  sequence INT UNSIGNED NOT NULL,
  completion_note TEXT NULL,
  completed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_work_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_work_items_workflow_sequence (tenant_id, workflow_instance_id, sequence),
  KEY ix_work_items_workflow_status (tenant_id, workflow_instance_id, status, sequence),
  KEY ix_work_items_due (tenant_id, status, due_at, priority),
  KEY ix_work_items_subject (tenant_id, subject_object_id, status),
  CONSTRAINT fk_work_items_workflow
    FOREIGN KEY (tenant_id, workflow_instance_id)
    REFERENCES workflow_instances(tenant_id, id),
  CONSTRAINT fk_work_items_subject
    FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_work_items_status CHECK (
    status IN ('READY', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED')
  ),
  CONSTRAINT chk_work_items_priority CHECK (
    priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')
  ),
  CONSTRAINT chk_work_items_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_work_items_completion CHECK (
    (status <> 'COMPLETED' AND completed_at IS NULL AND completion_note IS NULL)
    OR
    (status = 'COMPLETED' AND completed_at IS NOT NULL AND completion_note IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE work_item_history (
  history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  work_item_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  note TEXT NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  KEY ix_work_item_history (tenant_id, work_item_id, history_id),
  CONSTRAINT fk_work_item_history_item
    FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id),
  CONSTRAINT fk_work_item_history_actor
    FOREIGN KEY (tenant_id, actor_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_work_item_history_status CHECK (
    status IN ('READY', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED')
  )
) ENGINE=InnoDB;

CREATE TABLE work_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  workflow_instance_id VARCHAR(64) NOT NULL,
  work_item_id VARCHAR(64) NOT NULL,
  assignee_type VARCHAR(32) NOT NULL,
  assignee_id VARCHAR(64) NOT NULL,
  responsibility_role VARCHAR(32) NOT NULL,
  assigned_at DATETIME(6) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_work_assignments_tenant_id_id (tenant_id, id),
  KEY ix_work_assignments_assignee
    (tenant_id, assignee_type, assignee_id, status, effective_from, effective_to),
  KEY ix_work_assignments_item
    (tenant_id, work_item_id, responsibility_role, status),
  CONSTRAINT fk_work_assignments_workflow
    FOREIGN KEY (tenant_id, workflow_instance_id)
    REFERENCES workflow_instances(tenant_id, id),
  CONSTRAINT fk_work_assignments_item
    FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id),
  CONSTRAINT chk_work_assignments_assignee_type CHECK (
    assignee_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT')
  ),
  CONSTRAINT chk_work_assignments_responsibility CHECK (
    responsibility_role IN (
      'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
      'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
    )
  ),
  CONSTRAINT chk_work_assignments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_work_assignments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE work_completion_evidence (
  tenant_id VARCHAR(64) NOT NULL,
  work_item_id VARCHAR(64) NOT NULL,
  evidence_record_id VARCHAR(64) NOT NULL,
  linked_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  linked_by_person_id VARCHAR(64) NULL,
  PRIMARY KEY (tenant_id, work_item_id, evidence_record_id),
  KEY ix_work_completion_evidence_evidence (tenant_id, evidence_record_id),
  CONSTRAINT fk_work_completion_evidence_item
    FOREIGN KEY (tenant_id, work_item_id)
    REFERENCES work_items(tenant_id, id),
  CONSTRAINT fk_work_completion_evidence_record
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT fk_work_completion_evidence_actor
    FOREIGN KEY (tenant_id, linked_by_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;
