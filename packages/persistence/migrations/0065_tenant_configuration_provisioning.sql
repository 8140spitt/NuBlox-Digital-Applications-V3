CREATE TABLE business_classification_schemes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(255) NOT NULL,
  edition VARCHAR(64) NOT NULL,
  jurisdiction VARCHAR(120) NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_business_classification_scheme_code_edition (code, edition),
  CONSTRAINT chk_business_classification_scheme_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE business_classification_values (
  id VARCHAR(96) NOT NULL PRIMARY KEY,
  scheme_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_value_id VARCHAR(96) NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_business_classification_value_code (scheme_id, code),
  KEY ix_business_classification_parent (scheme_id, parent_value_id),
  CONSTRAINT fk_business_classification_value_scheme
    FOREIGN KEY (scheme_id) REFERENCES business_classification_schemes(id),
  CONSTRAINT fk_business_classification_value_parent
    FOREIGN KEY (parent_value_id) REFERENCES business_classification_values(id),
  CONSTRAINT chk_business_classification_value_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE business_classification_mappings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  source_value_id VARCHAR(96) NOT NULL,
  target_value_id VARCHAR(96) NOT NULL,
  mapping_type VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_business_classification_mapping_pair (source_value_id, target_value_id),
  CONSTRAINT fk_business_classification_mapping_source
    FOREIGN KEY (source_value_id) REFERENCES business_classification_values(id),
  CONSTRAINT fk_business_classification_mapping_target
    FOREIGN KEY (target_value_id) REFERENCES business_classification_values(id),
  CONSTRAINT chk_business_classification_mapping_distinct CHECK (
    source_value_id <> target_value_id
  ),
  CONSTRAINT chk_business_classification_mapping_type CHECK (
    mapping_type IN ('EXACT', 'BROADER', 'NARROWER', 'RELATED')
  ),
  CONSTRAINT chk_business_classification_mapping_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE operating_model_definitions (
  code VARCHAR(40) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT chk_operating_model_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE regulatory_regimes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  jurisdiction VARCHAR(120) NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_regulatory_regime_code (code),
  CONSTRAINT chk_regulatory_regime_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE industry_solution_business_classifications (
  industry_solution_id VARCHAR(32) NOT NULL,
  classification_value_id VARCHAR(96) NOT NULL,
  relationship_type VARCHAR(16) NOT NULL DEFAULT 'APPLICABLE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (industry_solution_id, classification_value_id),
  CONSTRAINT fk_industry_solution_business_classification_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT fk_industry_solution_business_classification_value
    FOREIGN KEY (classification_value_id) REFERENCES business_classification_values(id),
  CONSTRAINT chk_industry_solution_business_classification_type CHECK (
    relationship_type IN ('PRIMARY', 'APPLICABLE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_business_profiles (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  primary_classification_value_id VARCHAR(96) NOT NULL,
  size_tier VARCHAR(16) NOT NULL,
  employee_count INT UNSIGNED NULL,
  legal_entity_count INT UNSIGNED NOT NULL DEFAULT 1,
  primary_country_code CHAR(2) NOT NULL,
  primary_language_code VARCHAR(16) NOT NULL,
  configuration_state VARCHAR(24) NOT NULL DEFAULT 'PROFILED',
  provisioned_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_tenant_business_profile_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_business_profile_classification
    FOREIGN KEY (primary_classification_value_id) REFERENCES business_classification_values(id),
  CONSTRAINT chk_tenant_business_profile_size CHECK (
    size_tier IN ('MICRO', 'SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE')
  ),
  CONSTRAINT chk_tenant_business_profile_employee_count CHECK (
    employee_count IS NULL OR employee_count > 0
  ),
  CONSTRAINT chk_tenant_business_profile_legal_entity_count CHECK (
    legal_entity_count > 0
  ),
  CONSTRAINT chk_tenant_business_profile_country CHECK (
    primary_country_code REGEXP '^[A-Z]{2}$'
  ),
  CONSTRAINT chk_tenant_business_profile_state CHECK (
    configuration_state IN ('PROFILED', 'PROVISIONING', 'ACTIVE', 'FAILED')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_operating_models (
  tenant_id VARCHAR(64) NOT NULL,
  operating_model_code VARCHAR(40) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  primary_slot TINYINT
    GENERATED ALWAYS AS (
      CASE WHEN is_primary = TRUE THEN 1 ELSE NULL END
    ) STORED,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  PRIMARY KEY (tenant_id, operating_model_code),
  UNIQUE KEY uq_tenant_operating_model_primary (tenant_id, primary_slot),
  CONSTRAINT fk_tenant_operating_model_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_operating_model_definition
    FOREIGN KEY (operating_model_code) REFERENCES operating_model_definitions(code),
  CONSTRAINT chk_tenant_operating_model_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_regulatory_regime_assignments (
  tenant_id VARCHAR(64) NOT NULL,
  regulatory_regime_id VARCHAR(64) NOT NULL,
  source VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  PRIMARY KEY (tenant_id, regulatory_regime_id),
  CONSTRAINT fk_tenant_regulatory_regime_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_regulatory_regime_definition
    FOREIGN KEY (regulatory_regime_id) REFERENCES regulatory_regimes(id),
  CONSTRAINT chk_tenant_regulatory_regime_source CHECK (
    source IN ('TENANT_SELECTED', 'COUNTRY_DEFAULT', 'INDUSTRY_TEMPLATE')
  ),
  CONSTRAINT chk_tenant_regulatory_regime_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_industry_solution_assignments (
  tenant_id VARCHAR(64) NOT NULL,
  industry_solution_id VARCHAR(32) NOT NULL,
  source_template_id VARCHAR(64) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  activated_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  PRIMARY KEY (tenant_id, industry_solution_id),
  CONSTRAINT fk_tenant_industry_solution_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_industry_solution_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT chk_tenant_industry_solution_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_configuration_templates (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  template_kind VARCHAR(24) NOT NULL,
  version INT UNSIGNED NOT NULL,
  priority INT NOT NULL DEFAULT 100,
  industry_solution_id VARCHAR(32) NULL,
  configuration_payload JSON NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_tenant_configuration_template_code_version (code, version),
  KEY ix_tenant_configuration_template_kind_status (template_kind, status, priority),
  CONSTRAINT fk_tenant_configuration_template_industry
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT chk_tenant_configuration_template_kind CHECK (
    template_kind IN ('CORE', 'INDUSTRY', 'SIZE', 'OPERATING_MODEL', 'REGULATORY', 'COMPOSITE')
  ),
  CONSTRAINT chk_tenant_configuration_template_version CHECK (
    version > 0
  ),
  CONSTRAINT chk_tenant_configuration_template_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_configuration_template_criteria (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  template_id VARCHAR(64) NOT NULL,
  criterion_type VARCHAR(32) NOT NULL,
  criterion_value VARCHAR(255) NOT NULL,
  sequence INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_tenant_configuration_template_criterion
    (template_id, criterion_type, criterion_value),
  CONSTRAINT fk_tenant_configuration_template_criterion_template
    FOREIGN KEY (template_id) REFERENCES tenant_configuration_templates(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_tenant_configuration_template_criterion_type CHECK (
    criterion_type IN (
      'INDUSTRY_CLASSIFICATION',
      'SIZE_TIER',
      'OPERATING_MODEL',
      'REGULATORY_REGIME',
      'COUNTRY'
    )
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_configuration_template_components (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  template_id VARCHAR(64) NOT NULL,
  component_key VARCHAR(160) NOT NULL,
  component_type VARCHAR(32) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  configuration_payload JSON NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_tenant_configuration_template_component
    (template_id, component_key),
  KEY ix_tenant_configuration_template_component_sequence
    (template_id, sequence),
  CONSTRAINT fk_tenant_configuration_template_component_template
    FOREIGN KEY (template_id) REFERENCES tenant_configuration_templates(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_tenant_configuration_template_component_type CHECK (
    component_type IN (
      'INDUSTRY_SOLUTION',
      'TERMINOLOGY',
      'METADATA_PACKAGE',
      'WORKFLOW_TEMPLATE',
      'RULE_SET',
      'DASHBOARD',
      'CLASSIFICATION',
      'PREFERENCE',
      'SPECIALIST_CAPABILITY',
      'SEED_DATA'
    )
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_configuration_template_applications (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  template_id VARCHAR(64) NOT NULL,
  template_version INT UNSIGNED NOT NULL,
  applied_configuration JSON NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'APPLIED',
  applied_at DATETIME(6) NOT NULL,
  applied_by_person_id VARCHAR(64) NULL,
  superseded_at DATETIME(6) NULL,
  UNIQUE KEY uq_tenant_configuration_template_application
    (tenant_id, template_id, template_version),
  KEY ix_tenant_configuration_application_status
    (tenant_id, status, applied_at),
  CONSTRAINT fk_tenant_configuration_application_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_configuration_application_template
    FOREIGN KEY (template_id) REFERENCES tenant_configuration_templates(id),
  CONSTRAINT chk_tenant_configuration_application_status CHECK (
    status IN ('APPLIED', 'SUPERSEDED')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_configuration_overrides (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  component_key VARCHAR(160) NOT NULL,
  configuration_payload JSON NOT NULL,
  rationale TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  active_component_key VARCHAR(160)
    GENERATED ALWAYS AS (
      CASE WHEN status = 'ACTIVE' THEN component_key ELSE NULL END
    ) STORED,
  created_at DATETIME(6) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  superseded_at DATETIME(6) NULL,
  UNIQUE KEY uq_tenant_configuration_override_active
    (tenant_id, active_component_key),
  CONSTRAINT fk_tenant_configuration_override_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_tenant_configuration_override_status CHECK (
    status IN ('ACTIVE', 'SUPERSEDED')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_provisioning_runs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  profile_snapshot JSON NOT NULL,
  template_resolution JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  error_message TEXT NULL,
  initiated_by_person_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_tenant_provisioning_run_status (tenant_id, status, started_at),
  CONSTRAINT fk_tenant_provisioning_run_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_tenant_provisioning_run_status CHECK (
    status IN ('PENDING', 'APPLYING', 'APPLIED', 'FAILED')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_provisioning_steps (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  provisioning_run_id VARCHAR(64) NOT NULL,
  step_key VARCHAR(120) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  evidence JSON NULL,
  error_message TEXT NULL,
  started_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  UNIQUE KEY uq_tenant_provisioning_step
    (provisioning_run_id, step_key),
  KEY ix_tenant_provisioning_step_sequence
    (provisioning_run_id, sequence),
  CONSTRAINT fk_tenant_provisioning_step_run
    FOREIGN KEY (provisioning_run_id) REFERENCES tenant_provisioning_runs(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_tenant_provisioning_step_status CHECK (
    status IN ('PENDING', 'APPLYING', 'APPLIED', 'FAILED', 'SKIPPED')
  )
) ENGINE=InnoDB;

ALTER TABLE tenant_industry_solution_assignments
  ADD CONSTRAINT fk_tenant_industry_solution_source_template
    FOREIGN KEY (source_template_id) REFERENCES tenant_configuration_templates(id)
    ON DELETE SET NULL;

INSERT INTO business_classification_schemes
  (id, code, name, edition, jurisdiction, description, status)
VALUES
  (
    'BCS-NUBLOX-INDUSTRY-1',
    'NUBLOX_INDUSTRY',
    'NuBlox Industry Classification',
    '1',
    NULL,
    'NuBlox platform classification used to bind a Tenant business profile to one or more Industry Solutions while external standards such as NAICS, ISIC, NACE and SIC remain separately governed reference datasets.',
    'ACTIVE'
  );

INSERT INTO business_classification_values
  (id, scheme_id, code, name, parent_value_id, description, status)
VALUES
  (
    'BCV-NUBLOX-CBE',
    'BCS-NUBLOX-INDUSTRY-1',
    'CBE',
    'Construction & Built Environment',
    NULL,
    'Organisations that design, develop, construct, manufacture, manage, operate or maintain the built environment.',
    'ACTIVE'
  );

INSERT INTO industry_solution_business_classifications
  (industry_solution_id, classification_value_id, relationship_type)
VALUES
  ('CBE', 'BCV-NUBLOX-CBE', 'PRIMARY');

INSERT INTO operating_model_definitions
  (code, name, description, status)
VALUES
  ('SINGLE_SITE', 'Single-site', 'Predominantly operates from one principal business location.', 'ACTIVE'),
  ('MULTI_SITE', 'Multi-site', 'Operates across multiple organisational or delivery locations.', 'ACTIVE'),
  ('FRANCHISE', 'Franchise', 'Operates through a franchise or franchise-like organisational model.', 'ACTIVE'),
  ('PROJECT_BASED', 'Project-based', 'Organises material value delivery around projects, programmes or contracts.', 'ACTIVE'),
  ('MANUFACTURING', 'Manufacturing', 'Operates material production or manufacturing processes.', 'ACTIVE'),
  ('DISTRIBUTION', 'Distribution', 'Operates material distribution, fulfilment or logistics processes.', 'ACTIVE');

INSERT INTO tenant_configuration_templates
  (id, code, name, description, template_kind, version, priority,
   industry_solution_id, configuration_payload, status)
VALUES
  (
    'TPL-NUBLOX-CORE-1',
    'NUBLOX_CORE',
    'NuBlox Enterprise Core',
    'Universal NuBlox enterprise capability baseline. Core Functions remain available for every Tenant; templates configure behaviour and extensions rather than removing core enterprise capability.',
    'CORE',
    1,
    10,
    NULL,
    JSON_OBJECT(
      'coreFunctions', 'ALL',
      'configurationPrinciple', 'CORE_CAPABILITY_RETAINED'
    ),
    'ACTIVE'
  ),
  (
    'TPL-CBE-BASE-1',
    'CBE_BASE',
    'Construction & Built Environment',
    'Base CBE Industry Solution configuration applied when the Tenant business classification selects Construction & Built Environment.',
    'INDUSTRY',
    1,
    100,
    'CBE',
    JSON_OBJECT(
      'industrySolutionId', 'CBE',
      'configurationPrinciple', 'INDUSTRY_EXTENSION'
    ),
    'ACTIVE'
  );

INSERT INTO tenant_configuration_template_criteria
  (id, template_id, criterion_type, criterion_value, sequence)
VALUES
  (
    'TCR-CBE-CLASSIFICATION-1',
    'TPL-CBE-BASE-1',
    'INDUSTRY_CLASSIFICATION',
    'NUBLOX_INDUSTRY:CBE',
    1
  );

INSERT INTO tenant_configuration_template_components
  (id, template_id, component_key, component_type, sequence, required, configuration_payload)
VALUES
  (
    'TCM-CBE-SOLUTION-1',
    'TPL-CBE-BASE-1',
    'NUBLOX.INDUSTRY.CBE',
    'INDUSTRY_SOLUTION',
    10,
    TRUE,
    JSON_OBJECT(
      'industrySolutionId', 'CBE'
    )
  );


INSERT INTO permission_definitions (permission_key, name, description) VALUES
  (
    'platform.tenant_configuration.read',
    'Read Tenant configuration',
    'View the Tenant Business Profile, Industry Solution assignments, applied configuration templates and provisioning evidence.'
  ),
  (
    'platform.tenant_configuration.manage',
    'Manage Tenant configuration',
    'Govern Tenant Business Profile changes, configuration overrides and template adoption subject to configuration impact and authority controls.'
  );

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  (
    'ARP-PLATFORM-ADMIN-090',
    'ROLE-PLATFORM-ADMINISTRATOR',
    'platform.tenant_configuration.read'
  ),
  (
    'ARP-PLATFORM-ADMIN-091',
    'ROLE-PLATFORM-ADMINISTRATOR',
    'platform.tenant_configuration.manage'
  );
