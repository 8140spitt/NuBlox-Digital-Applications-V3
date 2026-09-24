CREATE TABLE extension_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  extension_kind VARCHAR(24) NOT NULL,
  owner_reference VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_extension_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_extension_definitions_code (tenant_id, code),
  CONSTRAINT fk_extension_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_extension_definitions_kind CHECK (
    extension_kind IN ('INDUSTRY','TENANT','PLATFORM','INTEGRATION')
  ),
  CONSTRAINT chk_extension_definitions_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE extension_package_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  extension_definition_id VARCHAR(64) NOT NULL,
  version VARCHAR(80) NOT NULL,
  minimum_platform_version VARCHAR(80) NULL,
  maximum_platform_version VARCHAR(80) NULL,
  manifest JSON NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  package_created_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_extension_package_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_extension_package_versions_version (tenant_id, extension_definition_id, version),
  UNIQUE KEY uq_extension_package_versions_checksum (tenant_id, extension_definition_id, checksum),
  CONSTRAINT fk_extension_package_versions_definition
    FOREIGN KEY (tenant_id, extension_definition_id) REFERENCES extension_definitions(tenant_id, id),
  CONSTRAINT fk_extension_package_versions_creator
    FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_extension_package_versions_status CHECK (status IN ('FROZEN','SUPERSEDED'))
) ENGINE=InnoDB;

CREATE TABLE extension_components (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  package_version_id VARCHAR(64) NOT NULL,
  component_key VARCHAR(255) NOT NULL,
  component_kind VARCHAR(24) NOT NULL,
  target_object_type VARCHAR(160) NULL,
  target_reference VARCHAR(512) NULL,
  definition JSON NOT NULL,
  checksum VARCHAR(255) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_extension_components_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_extension_components_key (tenant_id, package_version_id, component_key),
  UNIQUE KEY uq_extension_components_sequence (tenant_id, package_version_id, sequence),
  CONSTRAINT fk_extension_components_package
    FOREIGN KEY (tenant_id, package_version_id) REFERENCES extension_package_versions(tenant_id, id),
  CONSTRAINT chk_extension_components_kind CHECK (
    component_kind IN ('TYPE','ATTRIBUTE','POLICY','RULE','WORKFLOW','UI_ACTION','API','INTEGRATION','SEED_DATA','OTHER')
  ),
  CONSTRAINT chk_extension_components_sequence CHECK (sequence > 0)
) ENGINE=InnoDB;

CREATE TABLE extension_compatibility_assessments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  package_version_id VARCHAR(64) NOT NULL,
  platform_version VARCHAR(80) NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  evidence JSON NOT NULL,
  assessed_by_person_id VARCHAR(64) NOT NULL,
  assessed_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_extension_compatibility_assessments_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_extension_compatibility_assessments_target (tenant_id, package_version_id, platform_version),
  CONSTRAINT fk_extension_compatibility_assessments_package
    FOREIGN KEY (tenant_id, package_version_id) REFERENCES extension_package_versions(tenant_id, id),
  CONSTRAINT fk_extension_compatibility_assessments_person
    FOREIGN KEY (tenant_id, assessed_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_extension_compatibility_assessments_outcome CHECK (
    outcome IN ('COMPATIBLE','RECONCILIATION_REQUIRED','INCOMPATIBLE')
  )
) ENGINE=InnoDB;

CREATE TABLE extension_reconciliation_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  extension_definition_id VARCHAR(64) NOT NULL,
  from_package_version_id VARCHAR(64) NOT NULL,
  to_package_version_id VARCHAR(64) NOT NULL,
  target_platform_version VARCHAR(80) NOT NULL,
  started_by_person_id VARCHAR(64) NOT NULL,
  started_at DATETIME(6) NOT NULL,
  status VARCHAR(24) NOT NULL,
  completed_at DATETIME(6) NULL,
  summary TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_extension_reconciliation_runs_tenant_id_id (tenant_id, id),
  KEY ix_extension_reconciliation_runs_definition (tenant_id, extension_definition_id, status, started_at),
  CONSTRAINT fk_extension_reconciliation_runs_definition
    FOREIGN KEY (tenant_id, extension_definition_id) REFERENCES extension_definitions(tenant_id, id),
  CONSTRAINT fk_extension_reconciliation_runs_from
    FOREIGN KEY (tenant_id, from_package_version_id) REFERENCES extension_package_versions(tenant_id, id),
  CONSTRAINT fk_extension_reconciliation_runs_to
    FOREIGN KEY (tenant_id, to_package_version_id) REFERENCES extension_package_versions(tenant_id, id),
  CONSTRAINT fk_extension_reconciliation_runs_person
    FOREIGN KEY (tenant_id, started_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_extension_reconciliation_runs_status CHECK (
    status IN ('RUNNING','RESOLVED','BLOCKED','FAILED')
  ),
  CONSTRAINT chk_extension_reconciliation_runs_state CHECK (
    (status = 'RUNNING' AND completed_at IS NULL AND summary IS NULL)
    OR (status <> 'RUNNING' AND completed_at IS NOT NULL AND summary IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE extension_reconciliation_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  reconciliation_run_id VARCHAR(64) NOT NULL,
  component_key VARCHAR(255) NOT NULL,
  outcome VARCHAR(24) NOT NULL,
  source_checksum VARCHAR(255) NULL,
  target_checksum VARCHAR(255) NULL,
  resolved_definition JSON NULL,
  rationale TEXT NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  recorded_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_extension_reconciliation_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_extension_reconciliation_items_component (tenant_id, reconciliation_run_id, component_key),
  CONSTRAINT fk_extension_reconciliation_items_run
    FOREIGN KEY (tenant_id, reconciliation_run_id) REFERENCES extension_reconciliation_runs(tenant_id, id),
  CONSTRAINT fk_extension_reconciliation_items_person
    FOREIGN KEY (tenant_id, recorded_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_extension_reconciliation_items_outcome CHECK (
    outcome IN ('UNCHANGED','AUTO_MERGED','MANUAL_REQUIRED','CONFLICT','RESOLVED')
  ),
  CONSTRAINT chk_extension_reconciliation_items_manual CHECK (
    outcome NOT IN ('MANUAL_REQUIRED','CONFLICT') OR rationale IS NOT NULL
  ),
  CONSTRAINT chk_extension_reconciliation_items_resolved CHECK (
    outcome <> 'RESOLVED' OR resolved_definition IS NOT NULL
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.extension.read', 'Read extension governance', 'View governed extension definitions, package versions, components, compatibility assessments and reconciliation evidence.'),
  ('platform.extension.manage', 'Manage extension packages', 'Create governed extension definitions and immutable package versions/components.'),
  ('platform.extension.assess', 'Assess extension compatibility', 'Record explicit compatibility assessments against a target NuBlox platform version.'),
  ('platform.extension.reconcile', 'Reconcile extensions', 'Execute governed extension upgrade reconciliation and retain per-component evidence.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-050', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.extension.read'),
  ('ARP-PLATFORM-ADMIN-051', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.extension.manage'),
  ('ARP-PLATFORM-ADMIN-052', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.extension.assess'),
  ('ARP-PLATFORM-ADMIN-053', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.extension.reconcile');
