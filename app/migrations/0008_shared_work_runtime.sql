-- NuBlox V3 MySQL
-- 0008: shared work orchestration runtime
-- Implements AGG-27-WORKFLOW without taking ownership of domain lifecycle truth.

CREATE TABLE workflow_instances (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  definition_key VARCHAR(191) NOT NULL,
  definition_version VARCHAR(64) NOT NULL,
  subject_type VARCHAR(128) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  started_by_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_state VARCHAR(128) NULL,
  started_at VARCHAR(32) NOT NULL,
  completed_at VARCHAR(32) NULL,
  completion_reason TEXT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_workflow_instance_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_workflow_instance_started_by
    FOREIGN KEY (started_by_party_id) REFERENCES parties(id),
  INDEX idx_workflow_instance_tenant_status (tenant_id, status, updated_at),
  INDEX idx_workflow_instance_subject (tenant_id, subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_items (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_type VARCHAR(128) NOT NULL,
  subject_type VARCHAR(128) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  instructions TEXT NULL,
  status VARCHAR(32) NOT NULL,
  priority VARCHAR(32) NOT NULL,
  due_at VARCHAR(32) NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_by_party_id VARCHAR(36) NOT NULL,
  completion_note TEXT NULL,
  completed_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_item_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_item_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_item_created_by
    FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_work_item_tenant_status_due (tenant_id, status, due_at, priority),
  INDEX idx_work_item_workflow (workflow_instance_id, status, created_at),
  INDEX idx_work_item_subject (tenant_id, subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_assignments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  assignee_type VARCHAR(32) NOT NULL,
  assignee_id VARCHAR(191) NOT NULL,
  assigned_by_party_id VARCHAR(36) NOT NULL,
  assignment_basis TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_assignment_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_assignment_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_assignment_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  CONSTRAINT fk_work_assignment_assigned_by
    FOREIGN KEY (assigned_by_party_id) REFERENCES parties(id),
  INDEX idx_work_assignment_item_status (work_item_id, status, valid_from),
  INDEX idx_work_assignment_assignee (tenant_id, assignee_type, assignee_id, status, valid_from)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_acknowledgements (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NULL,
  actor_party_id VARCHAR(36) NOT NULL,
  subject_type VARCHAR(128) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  acknowledgement_type VARCHAR(64) NOT NULL,
  statement TEXT NULL,
  channel VARCHAR(64) NULL,
  occurred_at VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_ack_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_ack_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_ack_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  CONSTRAINT fk_work_ack_actor
    FOREIGN KEY (actor_party_id) REFERENCES parties(id),
  INDEX idx_work_ack_subject (tenant_id, subject_type, subject_id, occurred_at),
  INDEX idx_work_ack_workflow (workflow_instance_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_escalations (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  trigger_code VARCHAR(128) NOT NULL,
  rule_key VARCHAR(191) NULL,
  from_assignment_ref VARCHAR(191) NULL,
  to_assignment_ref VARCHAR(191) NULL,
  reason TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  resolved_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_escalation_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_escalation_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_escalation_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  INDEX idx_work_escalation_item (work_item_id, status, occurred_at),
  INDEX idx_work_escalation_tenant (tenant_id, status, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_due_date_changes (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  prior_due_at VARCHAR(32) NULL,
  new_due_at VARCHAR(32) NULL,
  changed_by_party_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_due_change_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_due_change_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_due_change_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  CONSTRAINT fk_work_due_change_actor
    FOREIGN KEY (changed_by_party_id) REFERENCES parties(id),
  INDEX idx_work_due_change_item (work_item_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE work_priority_changes (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  prior_priority VARCHAR(32) NOT NULL,
  new_priority VARCHAR(32) NOT NULL,
  changed_by_party_id VARCHAR(36) NOT NULL,
  reason TEXT NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_priority_change_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_priority_change_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_work_priority_change_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  CONSTRAINT fk_work_priority_change_actor
    FOREIGN KEY (changed_by_party_id) REFERENCES parties(id),
  INDEX idx_work_priority_change_item (work_item_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
