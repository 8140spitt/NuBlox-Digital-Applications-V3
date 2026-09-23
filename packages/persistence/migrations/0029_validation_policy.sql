CREATE TABLE validation_rule_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  rule_type VARCHAR(32) NOT NULL,
  version INT NOT NULL,
  severity VARCHAR(16) NOT NULL,
  handler_key VARCHAR(160) NOT NULL,
  configuration JSON NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_validation_rules_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_validation_rules_tenant_code_version (tenant_id, code, version),
  KEY ix_validation_rules_type_status (tenant_id, rule_type, status),
  CONSTRAINT fk_validation_rules_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_validation_rules_type CHECK (
    rule_type IN ('ELIGIBILITY','REQUIRED_DATA','STATE','RELATIONSHIP','CONSISTENCY','MAPPING','CUSTOM')
  ),
  CONSTRAINT chk_validation_rules_severity CHECK (
    severity IN ('INFO','WARNING','ERROR','BLOCKING')
  ),
  CONSTRAINT chk_validation_rules_version CHECK (version > 0),
  CONSTRAINT chk_validation_rules_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_validation_rules_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE validation_rule_sets (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_validation_rule_sets_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_validation_rule_sets_tenant_code_version (tenant_id, code, version),
  CONSTRAINT fk_validation_rule_sets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_validation_rule_sets_version CHECK (version > 0),
  CONSTRAINT chk_validation_rule_sets_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_validation_rule_sets_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE validation_rule_set_members (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  rule_set_id VARCHAR(64) NOT NULL,
  rule_definition_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_validation_members_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_validation_members_set_rule (tenant_id, rule_set_id, rule_definition_id),
  UNIQUE KEY uq_validation_members_set_sequence (tenant_id, rule_set_id, sequence_no),
  CONSTRAINT fk_validation_members_set FOREIGN KEY (tenant_id, rule_set_id)
    REFERENCES validation_rule_sets(tenant_id, id),
  CONSTRAINT fk_validation_members_rule FOREIGN KEY (tenant_id, rule_definition_id)
    REFERENCES validation_rule_definitions(tenant_id, id),
  CONSTRAINT chk_validation_members_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_validation_members_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE validation_rule_evaluation_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  rule_set_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  context_type VARCHAR(80) NULL,
  context_id VARCHAR(160) NULL,
  evaluated_at DATETIME(6) NOT NULL,
  evaluation_status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_validation_runs_tenant_id_id (tenant_id, id),
  KEY ix_validation_runs_subject
    (tenant_id, subject_object_id, subject_version, evaluated_at),
  CONSTRAINT fk_validation_runs_set FOREIGN KEY (tenant_id, rule_set_id)
    REFERENCES validation_rule_sets(tenant_id, id),
  CONSTRAINT fk_validation_runs_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_validation_runs_status CHECK (
    evaluation_status IN ('RUNNING','PASSED','FAILED','ERROR')
  )
) ENGINE=InnoDB;

CREATE TABLE validation_rule_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  evaluation_run_id VARCHAR(64) NOT NULL,
  rule_definition_id VARCHAR(64) NOT NULL,
  result_status VARCHAR(24) NOT NULL,
  message TEXT NULL,
  evidence JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_validation_results_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_validation_results_run_rule (tenant_id, evaluation_run_id, rule_definition_id),
  CONSTRAINT fk_validation_results_run FOREIGN KEY (tenant_id, evaluation_run_id)
    REFERENCES validation_rule_evaluation_runs(tenant_id, id),
  CONSTRAINT fk_validation_results_rule FOREIGN KEY (tenant_id, rule_definition_id)
    REFERENCES validation_rule_definitions(tenant_id, id),
  CONSTRAINT chk_validation_results_status CHECK (
    result_status IN ('PASSED','FAILED','NOT_APPLICABLE','ERROR')
  )
) ENGINE=InnoDB;

CREATE TABLE validation_conflicts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  evaluation_run_id VARCHAR(64) NOT NULL,
  rule_result_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  conflict_status VARCHAR(16) NOT NULL,
  resolution_reason TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_validation_conflicts_tenant_id_id (tenant_id, id),
  KEY ix_validation_conflicts_subject (tenant_id, subject_object_id, conflict_status),
  CONSTRAINT fk_validation_conflicts_run FOREIGN KEY (tenant_id, evaluation_run_id)
    REFERENCES validation_rule_evaluation_runs(tenant_id, id),
  CONSTRAINT fk_validation_conflicts_result FOREIGN KEY (tenant_id, rule_result_id)
    REFERENCES validation_rule_results(tenant_id, id),
  CONSTRAINT fk_validation_conflicts_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_validation_conflicts_status CHECK (
    conflict_status IN ('OPEN','RESOLVED','WAIVED','CANCELLED')
  )
) ENGINE=InnoDB;

CREATE TABLE relationship_constraint_policies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  relationship_type VARCHAR(120) NOT NULL,
  source_object_type VARCHAR(120) NOT NULL,
  target_object_type VARCHAR(120) NOT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_relationship_constraint_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_relationship_constraint_code_version (tenant_id, code, version),
  KEY ix_relationship_constraint_signature
    (tenant_id, relationship_type, source_object_type, target_object_type, status),
  CONSTRAINT fk_relationship_constraint_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_relationship_constraint_version CHECK (version > 0),
  CONSTRAINT chk_relationship_constraint_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_relationship_constraint_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE mapping_policies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(120) NOT NULL,
  target_type VARCHAR(120) NOT NULL,
  mapping JSON NOT NULL,
  precedence INT NOT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_mapping_policy_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_mapping_policy_code_version (tenant_id, code, version),
  KEY ix_mapping_policy_types (tenant_id, source_type, target_type, status, precedence),
  CONSTRAINT fk_mapping_policy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_mapping_policy_precedence CHECK (precedence >= 0),
  CONSTRAINT chk_mapping_policy_version CHECK (version > 0),
  CONSTRAINT chk_mapping_policy_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_mapping_policy_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.validation_policy.read', 'Read validation policy', 'View governed validation rules, rule sets, relationship constraints, mappings and evaluation evidence.'),
  ('platform.validation_policy.manage', 'Manage validation policy', 'Administer governed validation rules, rule sets, relationship constraints and mappings.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-027', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.validation_policy.read'),
  ('ARP-PLATFORM-ADMIN-028', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.validation_policy.manage');
