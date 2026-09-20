CREATE TABLE industry_solutions (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_industry_solutions_code (code),
  CONSTRAINT chk_industry_solutions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE delivery_domains (
  id VARCHAR(16) NOT NULL PRIMARY KEY,
  industry_solution_id VARCHAR(32) NOT NULL,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_delivery_domains_solution_code (industry_solution_id, code),
  UNIQUE KEY uq_delivery_domains_solution_sequence (industry_solution_id, sequence),
  CONSTRAINT fk_delivery_domains_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT chk_delivery_domains_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_delivery_domains_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE industry_job_profiles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  industry_solution_id VARCHAR(32) NOT NULL,
  job_profile_id VARCHAR(64) NOT NULL,
  primary_delivery_domain_id VARCHAR(16) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  canonical_name VARCHAR(255) NOT NULL,
  source_name VARCHAR(255) NOT NULL,
  source_verified_date DATE NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_industry_job_profiles_solution_job
    (industry_solution_id, job_profile_id),
  UNIQUE KEY uq_industry_job_profiles_solution_sequence
    (industry_solution_id, sequence),
  KEY ix_industry_job_profiles_domain
    (industry_solution_id, primary_delivery_domain_id, status),
  CONSTRAINT fk_industry_job_profiles_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT fk_industry_job_profiles_job
    FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT fk_industry_job_profiles_domain
    FOREIGN KEY (primary_delivery_domain_id) REFERENCES delivery_domains(id),
  CONSTRAINT chk_industry_job_profiles_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_industry_job_profiles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE sector_classification_schemes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  industry_solution_id VARCHAR(32) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(80) NOT NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_sector_classification_schemes_code
    (industry_solution_id, code, version),
  CONSTRAINT fk_sector_classification_schemes_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT chk_sector_classification_schemes_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE sector_classification_values (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  scheme_id VARCHAR(64) NOT NULL,
  code VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_value_id VARCHAR(64) NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_sector_classification_values_scheme_code (scheme_id, code),
  UNIQUE KEY uq_sector_classification_values_scheme_id (scheme_id, id),
  KEY ix_sector_classification_values_parent (scheme_id, parent_value_id),
  CONSTRAINT fk_sector_classification_values_scheme
    FOREIGN KEY (scheme_id) REFERENCES sector_classification_schemes(id),
  CONSTRAINT fk_sector_classification_values_parent
    FOREIGN KEY (scheme_id, parent_value_id)
    REFERENCES sector_classification_values(scheme_id, id),
  CONSTRAINT chk_sector_classification_values_self CHECK (
    parent_value_id IS NULL OR parent_value_id <> id
  ),
  CONSTRAINT chk_sector_classification_values_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE industry_object_classifications (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  classification_value_id VARCHAR(64) NOT NULL,
  assigned_at DATETIME(6) NOT NULL,
  assigned_by_person_id VARCHAR(64) NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_industry_object_classifications_object_value
    (tenant_id, canonical_object_id, classification_value_id),
  KEY ix_industry_object_classifications_value
    (tenant_id, classification_value_id, canonical_object_id),
  CONSTRAINT fk_industry_object_classifications_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_industry_object_classifications_value
    FOREIGN KEY (classification_value_id)
    REFERENCES sector_classification_values(id),
  CONSTRAINT fk_industry_object_classifications_actor
    FOREIGN KEY (tenant_id, assigned_by_person_id)
    REFERENCES persons(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE construction_context_profiles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  context_type VARCHAR(32) NOT NULL,
  code VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  parent_context_object_id VARCHAR(64) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_construction_context_profiles_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_construction_context_profiles_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_construction_context_profiles_type_code (tenant_id, context_type, code),
  KEY ix_construction_context_profiles_parent
    (tenant_id, parent_context_object_id, context_type, status),
  CONSTRAINT fk_construction_context_profiles_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_construction_context_profiles_parent
    FOREIGN KEY (tenant_id, parent_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_construction_context_profiles_type CHECK (
    context_type IN (
      'PORTFOLIO', 'PROGRAMME', 'OPPORTUNITY', 'TENDER', 'PROJECT',
      'CONTRACT', 'APPOINTMENT', 'WORK_PACKAGE', 'SITE', 'FACILITY',
      'BUILDING', 'ZONE', 'LEVEL', 'SPACE', 'SYSTEM', 'ASSET',
      'PRODUCTION_ORDER', 'FABRICATION_ORDER', 'SERVICE', 'MAINTENANCE'
    )
  ),
  CONSTRAINT chk_construction_context_profiles_parent CHECK (
    parent_context_object_id IS NULL OR parent_context_object_id <> canonical_object_id
  ),
  CONSTRAINT chk_construction_context_profiles_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE construction_work_product_types (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  industry_solution_id VARCHAR(32) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(40) NOT NULL,
  default_authoring_mode VARCHAR(32) NOT NULL,
  governed_output_type VARCHAR(120) NOT NULL,
  default_representation_types JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_construction_work_product_types_code
    (industry_solution_id, code),
  KEY ix_construction_work_product_types_category
    (industry_solution_id, category, status),
  CONSTRAINT fk_construction_work_product_types_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT chk_construction_work_product_types_category CHECK (
    category IN (
      'DESIGN_TECHNICAL',
      'COMMERCIAL_CONTRACTUAL',
      'PROCUREMENT_SUPPLY',
      'PRODUCTION_FABRICATION',
      'SITE_DELIVERY',
      'COMMISSIONING_HANDOVER',
      'OPERATIONS_MAINTENANCE'
    )
  ),
  CONSTRAINT chk_construction_work_product_types_authoring CHECK (
    default_authoring_mode IN ('NATIVE', 'CONNECTED', 'EXTERNAL_AUTHORITATIVE')
  ),
  CONSTRAINT chk_construction_work_product_types_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;
