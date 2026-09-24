CREATE TABLE employments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  employee_number VARCHAR(80) NOT NULL,
  worker_type VARCHAR(24) NOT NULL,
  employment_type VARCHAR(24) NOT NULL,
  start_date DATETIME(6) NOT NULL,
  end_date DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_employments_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_employments_employee_number (tenant_id,employee_number),
  KEY ix_employments_person_period (tenant_id,person_id,start_date,end_date,status),
  KEY ix_employments_organisation (tenant_id,organisation_id,status),
  CONSTRAINT fk_employments_person
    FOREIGN KEY (tenant_id,person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_employments_organisation
    FOREIGN KEY (tenant_id,organisation_id) REFERENCES organisations(tenant_id,id),
  CONSTRAINT chk_employments_worker_type CHECK (
    worker_type IN ('EMPLOYEE','CONTINGENT')
  ),
  CONSTRAINT chk_employments_employment_type CHECK (
    employment_type IN ('PERMANENT','FIXED_TERM','TEMPORARY','APPRENTICE','INTERN','CONTRACTOR')
  ),
  CONSTRAINT chk_employments_period CHECK (end_date IS NULL OR end_date>=start_date),
  CONSTRAINT chk_employments_status CHECK (
    status IN ('PENDING','ACTIVE','SUSPENDED','ENDED')
  ),
  CONSTRAINT chk_employments_ended CHECK (
    status<>'ENDED' OR end_date IS NOT NULL
  )
) ENGINE=InnoDB;

ALTER TABLE position_occupancies
  ADD COLUMN employment_id VARCHAR(64) NULL AFTER person_id,
  ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT TRUE AFTER employment_id,
  ADD KEY ix_position_occupancies_employment_period
    (tenant_id,employment_id,effective_from,effective_to),
  ADD CONSTRAINT fk_position_occupancies_employment
    FOREIGN KEY (tenant_id,employment_id) REFERENCES employments(tenant_id,id);

CREATE TABLE position_function_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  position_id VARCHAR(64) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  deployment_purpose VARCHAR(32) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_position_function_assignments_tenant_id_id (tenant_id,id),
  KEY ix_position_function_assignments_position
    (tenant_id,position_id,status,effective_from,effective_to,is_primary),
  KEY ix_position_function_assignments_function
    (tenant_id,function_id,deployment_purpose,status,effective_from,effective_to),
  CONSTRAINT fk_position_function_assignments_position
    FOREIGN KEY (tenant_id,position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT fk_position_function_assignments_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_position_function_assignments_purpose CHECK (
    deployment_purpose IN ('FUNCTIONAL_GOVERNANCE','FUNCTIONAL_DELIVERY')
  ),
  CONSTRAINT chk_position_function_assignments_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_position_function_assignments_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE position_reporting_lines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  subordinate_position_id VARCHAR(64) NOT NULL,
  manager_position_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(24) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_position_reporting_lines_tenant_id_id (tenant_id,id),
  KEY ix_position_reporting_lines_subordinate
    (tenant_id,subordinate_position_id,relationship_type,status,effective_from,effective_to),
  KEY ix_position_reporting_lines_manager
    (tenant_id,manager_position_id,relationship_type,status,effective_from,effective_to),
  CONSTRAINT fk_position_reporting_lines_subordinate
    FOREIGN KEY (tenant_id,subordinate_position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT fk_position_reporting_lines_manager
    FOREIGN KEY (tenant_id,manager_position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT chk_position_reporting_lines_distinct CHECK (
    subordinate_position_id<>manager_position_id
  ),
  CONSTRAINT chk_position_reporting_lines_type CHECK (
    relationship_type IN ('LINE_MANAGER','FUNCTIONAL_MANAGER','DOTTED_LINE')
  ),
  CONSTRAINT chk_position_reporting_lines_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_position_reporting_lines_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('domain.hcm.read','Read Human Capital Management','View the governed HCM workforce, Employment, Position, Function ownership and reporting hierarchy.'),
 ('domain.hcm.manage','Manage Human Capital Management','Create and maintain Employment, Position Function ownership, Position occupancy and reporting hierarchy.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-086','ROLE-PLATFORM-ADMINISTRATOR','domain.hcm.read'),
 ('ARP-PLATFORM-ADMIN-087','ROLE-PLATFORM-ADMINISTRATOR','domain.hcm.manage');
