CREATE TABLE configuration_resolution_definitions (
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
  UNIQUE KEY uq_configuration_resolution_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_resolution_definitions_code_version (tenant_id, code, version),
  CONSTRAINT fk_configuration_resolution_definitions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_configuration_resolution_definitions_version CHECK (version > 0),
  CONSTRAINT chk_configuration_resolution_definitions_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_configuration_resolution_definitions_status
    CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE configuration_resolution_criteria (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  definition_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL,
  criterion_type VARCHAR(40) NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  configuration JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_configuration_resolution_criteria_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_resolution_criteria_sequence (tenant_id, definition_id, sequence_no),
  CONSTRAINT fk_configuration_resolution_criteria_definition
    FOREIGN KEY (tenant_id, definition_id)
    REFERENCES configuration_resolution_definitions(tenant_id, id),
  CONSTRAINT chk_configuration_resolution_criteria_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_configuration_resolution_criteria_type CHECK (
    criterion_type IN ('BASELINE','EXPLICIT_VERSION','EFFECTIVITY','LATEST_ESTABLISHED_BASELINE')
  ),
  CONSTRAINT chk_configuration_resolution_criteria_status
    CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE configuration_resolution_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  definition_id VARCHAR(64) NOT NULL,
  context_object_id VARCHAR(64) NOT NULL,
  baseline_id VARCHAR(64) NULL,
  evaluated_at DATETIME(6) NOT NULL,
  input JSON NOT NULL,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  run_status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_configuration_resolution_runs_tenant_id_id (tenant_id, id),
  KEY ix_configuration_resolution_runs_context
    (tenant_id, context_object_id, evaluated_at),
  CONSTRAINT fk_configuration_resolution_runs_definition
    FOREIGN KEY (tenant_id, definition_id)
    REFERENCES configuration_resolution_definitions(tenant_id, id),
  CONSTRAINT fk_configuration_resolution_runs_context
    FOREIGN KEY (tenant_id, context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_configuration_resolution_runs_baseline
    FOREIGN KEY (tenant_id, baseline_id)
    REFERENCES baselines(tenant_id, id),
  CONSTRAINT chk_configuration_resolution_runs_status
    CHECK (run_status IN ('RUNNING','RESOLVED','PARTIAL','FAILED','ERROR')),
  CONSTRAINT chk_configuration_resolution_runs_completion CHECK (
    (run_status = 'RUNNING' AND completed_at IS NULL)
    OR (run_status <> 'RUNNING' AND completed_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE configuration_resolution_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  run_id VARCHAR(64) NOT NULL,
  configuration_item_id VARCHAR(64) NOT NULL,
  selected_version VARCHAR(120) NULL,
  criterion_id VARCHAR(64) NULL,
  result_status VARCHAR(16) NOT NULL,
  message TEXT NULL,
  evidence JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_configuration_resolution_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_configuration_resolution_items_run_item
    (tenant_id, run_id, configuration_item_id),
  CONSTRAINT fk_configuration_resolution_items_run
    FOREIGN KEY (tenant_id, run_id)
    REFERENCES configuration_resolution_runs(tenant_id, id),
  CONSTRAINT fk_configuration_resolution_items_configuration_item
    FOREIGN KEY (tenant_id, configuration_item_id)
    REFERENCES configuration_items(tenant_id, id),
  CONSTRAINT fk_configuration_resolution_items_criterion
    FOREIGN KEY (tenant_id, criterion_id)
    REFERENCES configuration_resolution_criteria(tenant_id, id),
  CONSTRAINT chk_configuration_resolution_items_status
    CHECK (result_status IN ('RESOLVED','UNRESOLVED','CONFLICT','ERROR')),
  CONSTRAINT chk_configuration_resolution_items_resolved CHECK (
    (result_status = 'RESOLVED' AND selected_version IS NOT NULL AND criterion_id IS NOT NULL)
    OR (result_status <> 'RESOLVED' AND selected_version IS NULL)
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.configuration_resolution.read', 'Read configuration resolution', 'View governed configuration resolution definitions, criteria, runs and exact result evidence.'),
  ('platform.configuration_resolution.manage', 'Manage configuration resolution', 'Administer governed configuration resolution definitions and criteria.'),
  ('platform.configuration_resolution.execute', 'Execute configuration resolution', 'Run governed configuration resolution and retain exact selected-version evidence.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-033', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_resolution.read'),
  ('ARP-PLATFORM-ADMIN-034', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_resolution.manage'),
  ('ARP-PLATFORM-ADMIN-035', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration_resolution.execute');
