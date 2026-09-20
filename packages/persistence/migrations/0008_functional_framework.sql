CREATE TABLE function_definitions (
  id VARCHAR(16) NOT NULL PRIMARY KEY,
  code VARCHAR(16) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_function_definitions_code (code),
  CONSTRAINT chk_function_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE sub_function_definitions (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  function_id VARCHAR(16) NOT NULL,
  code VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_sub_function_definitions_code (code),
  UNIQUE KEY uq_sub_function_definitions_sequence (function_id, sequence),
  KEY ix_sub_function_definitions_function (function_id, status, sequence),
  CONSTRAINT fk_sub_function_definitions_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_sub_function_definitions_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_sub_function_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE functional_activity_definitions (
  id VARCHAR(48) NOT NULL PRIMARY KEY,
  sub_function_id VARCHAR(32) NOT NULL,
  name VARCHAR(512) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_functional_activity_definitions_sequence (sub_function_id, sequence),
  KEY ix_functional_activity_definitions_sub_function
    (sub_function_id, status, sequence),
  CONSTRAINT fk_functional_activity_definitions_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT chk_functional_activity_definitions_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_functional_activity_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE process_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  sub_function_id VARCHAR(32) NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_process_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_process_definitions_tenant_code (tenant_id, code),
  KEY ix_process_definitions_function
    (tenant_id, function_id, sub_function_id, status),
  CONSTRAINT fk_process_definitions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_process_definitions_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_process_definitions_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT chk_process_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE task_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  process_definition_id VARCHAR(64) NOT NULL,
  functional_activity_id VARCHAR(48) NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  instructions TEXT NULL,
  sequence INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_task_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_task_definitions_process_code
    (tenant_id, process_definition_id, code),
  UNIQUE KEY uq_task_definitions_process_sequence
    (tenant_id, process_definition_id, sequence),
  KEY ix_task_definitions_activity
    (functional_activity_id, status),
  CONSTRAINT fk_task_definitions_process
    FOREIGN KEY (tenant_id, process_definition_id)
    REFERENCES process_definitions(tenant_id, id),
  CONSTRAINT fk_task_definitions_activity
    FOREIGN KEY (functional_activity_id) REFERENCES functional_activity_definitions(id),
  CONSTRAINT chk_task_definitions_sequence CHECK (sequence >= 1),
  CONSTRAINT chk_task_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE function_governance_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  purpose TEXT NOT NULL,
  mandate TEXT NOT NULL,
  scope_in JSON NOT NULL,
  scope_out JSON NOT NULL,
  accountable_owner_type VARCHAR(16) NOT NULL,
  accountable_owner_id VARCHAR(64) NOT NULL,
  governance_body VARCHAR(255) NULL,
  policy_references JSON NOT NULL,
  standard_references JSON NOT NULL,
  procedure_references JSON NOT NULL,
  assurance_requirements JSON NOT NULL,
  performance_measures JSON NOT NULL,
  retention_requirements TEXT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_function_governance_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_function_governance_versions_number
    (tenant_id, function_id, version),
  KEY ix_function_governance_versions_status
    (tenant_id, function_id, status, effective_from, effective_to),
  CONSTRAINT fk_function_governance_versions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_function_governance_versions_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_function_governance_versions_version CHECK (version >= 1),
  CONSTRAINT chk_function_governance_versions_status CHECK (
    status IN ('DRAFT', 'PUBLISHED', 'RETIRED')
  ),
  CONSTRAINT chk_function_governance_versions_owner CHECK (
    accountable_owner_type IN ('PERSON', 'POSITION')
  ),
  CONSTRAINT chk_function_governance_versions_effectivity CHECK (
    (status = 'DRAFT' AND effective_from IS NULL AND effective_to IS NULL)
    OR
    (status = 'PUBLISHED' AND effective_from IS NOT NULL AND effective_to IS NULL)
    OR
    (status = 'RETIRED' AND effective_from IS NOT NULL AND effective_to IS NOT NULL
      AND effective_to >= effective_from)
  )
) ENGINE=InnoDB;

CREATE TABLE function_job_profile_participations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  catalogue_scope VARCHAR(16) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  catalogue_owner_key VARCHAR(64)
    GENERATED ALWAYS AS (COALESCE(tenant_id, '__PLATFORM__')) STORED,
  function_id VARCHAR(16) NOT NULL,
  sub_function_id VARCHAR(32) NULL,
  sub_function_key VARCHAR(32)
    GENERATED ALWAYS AS (COALESCE(sub_function_id, '__FUNCTION__')) STORED,
  job_profile_id VARCHAR(64) NOT NULL,
  mode VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_function_job_profile_participations
    (catalogue_scope, catalogue_owner_key, function_id, sub_function_key, job_profile_id, mode),
  KEY ix_function_job_profile_participations_function
    (function_id, sub_function_id, mode, status),
  KEY ix_function_job_profile_participations_job
    (job_profile_id, status),
  CONSTRAINT fk_function_job_profile_participations_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_function_job_profile_participations_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_function_job_profile_participations_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT fk_function_job_profile_participations_job
    FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT chk_function_job_profile_participations_scope CHECK (
    catalogue_scope IN ('PLATFORM', 'TENANT')
  ),
  CONSTRAINT chk_function_job_profile_participations_tenant_scope CHECK (
    (catalogue_scope = 'PLATFORM' AND tenant_id IS NULL)
    OR
    (catalogue_scope = 'TENANT' AND tenant_id IS NOT NULL)
  ),
  CONSTRAINT chk_function_job_profile_participations_mode CHECK (
    mode IN ('PRIMARY', 'DELIVERY', 'GOVERNANCE', 'ASSURANCE', 'SUPPORT')
  ),
  CONSTRAINT chk_function_job_profile_participations_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE competence_requirements (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  subject_type VARCHAR(24) NOT NULL,
  subject_id VARCHAR(64) NOT NULL,
  competence_code VARCHAR(120) NOT NULL,
  competence_name VARCHAR(255) NOT NULL,
  required_level VARCHAR(120) NOT NULL,
  evidence_required BOOLEAN NOT NULL,
  expiry_required BOOLEAN NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_competence_requirements_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_competence_requirements_subject_code
    (tenant_id, subject_type, subject_id, competence_code),
  KEY ix_competence_requirements_subject
    (tenant_id, subject_type, subject_id, status),
  CONSTRAINT fk_competence_requirements_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_competence_requirements_subject_type CHECK (
    subject_type IN ('FUNCTION', 'SUB_FUNCTION', 'ACTIVITY', 'PROCESS', 'TASK', 'DEPLOYMENT')
  ),
  CONSTRAINT chk_competence_requirements_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE competence_evidence (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  competence_code VARCHAR(120) NOT NULL,
  attained_level VARCHAR(120) NOT NULL,
  evidence_record_id VARCHAR(64) NULL,
  issued_at DATETIME(6) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_competence_evidence_tenant_id_id (tenant_id, id),
  KEY ix_competence_evidence_person_code
    (tenant_id, person_id, competence_code, effective_from, effective_to, status),
  CONSTRAINT fk_competence_evidence_person
    FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_competence_evidence_record
    FOREIGN KEY (tenant_id, evidence_record_id) REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_competence_evidence_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_competence_evidence_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE functional_deployments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  sub_function_id VARCHAR(32) NULL,
  organisation_id VARCHAR(64) NOT NULL,
  organisation_unit_id VARCHAR(64) NULL,
  context_type VARCHAR(24) NOT NULL,
  context_object_id VARCHAR(64) NULL,
  scope_description TEXT NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_functional_deployments_tenant_id_id (tenant_id, id),
  KEY ix_functional_deployments_function
    (tenant_id, function_id, sub_function_id, status, effective_from, effective_to),
  KEY ix_functional_deployments_context
    (tenant_id, context_type, context_object_id, status),
  KEY ix_functional_deployments_organisation
    (tenant_id, organisation_id, organisation_unit_id, status),
  CONSTRAINT fk_functional_deployments_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_functional_deployments_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT fk_functional_deployments_organisation
    FOREIGN KEY (tenant_id, organisation_id) REFERENCES organisations(tenant_id, id),
  CONSTRAINT fk_functional_deployments_unit
    FOREIGN KEY (tenant_id, organisation_unit_id) REFERENCES organisation_units(tenant_id, id),
  CONSTRAINT fk_functional_deployments_context
    FOREIGN KEY (tenant_id, context_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_functional_deployments_context_type CHECK (
    context_type IN (
      'TENANT', 'ORGANISATION', 'PROJECT', 'CONTRACT', 'PACKAGE',
      'SITE', 'ASSET', 'SERVICE', 'CUSTOM'
    )
  ),
  CONSTRAINT chk_functional_deployments_context CHECK (
    (context_type IN ('TENANT', 'ORGANISATION') AND context_object_id IS NULL)
    OR
    (context_type NOT IN ('TENANT', 'ORGANISATION') AND context_object_id IS NOT NULL)
  ),
  CONSTRAINT chk_functional_deployments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_functional_deployments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE deployment_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  functional_deployment_id VARCHAR(64) NOT NULL,
  assignee_type VARCHAR(32) NOT NULL,
  assignee_id VARCHAR(64) NOT NULL,
  job_profile_id VARCHAR(64) NULL,
  responsibility_role VARCHAR(32) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deployment_assignments_tenant_id_id (tenant_id, id),
  KEY ix_deployment_assignments_deployment
    (tenant_id, functional_deployment_id, status, effective_from, effective_to),
  KEY ix_deployment_assignments_assignee
    (tenant_id, assignee_type, assignee_id, status, effective_from, effective_to),
  CONSTRAINT fk_deployment_assignments_deployment
    FOREIGN KEY (tenant_id, functional_deployment_id)
    REFERENCES functional_deployments(tenant_id, id),
  CONSTRAINT fk_deployment_assignments_job
    FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT chk_deployment_assignments_assignee_type CHECK (
    assignee_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT')
  ),
  CONSTRAINT chk_deployment_assignments_responsibility CHECK (
    responsibility_role IN (
      'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
      'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
    )
  ),
  CONSTRAINT chk_deployment_assignments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_deployment_assignments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE responsibility_scopes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deployment_assignment_id VARCHAR(64) NOT NULL,
  responsibility_role VARCHAR(32) NOT NULL,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(160) NULL,
  description TEXT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_responsibility_scopes_tenant_id_id (tenant_id, id),
  KEY ix_responsibility_scopes_assignment
    (tenant_id, deployment_assignment_id, responsibility_role, status),
  KEY ix_responsibility_scopes_scope
    (tenant_id, scope_type, scope_id, status),
  CONSTRAINT fk_responsibility_scopes_assignment
    FOREIGN KEY (tenant_id, deployment_assignment_id)
    REFERENCES deployment_assignments(tenant_id, id),
  CONSTRAINT chk_responsibility_scopes_role CHECK (
    responsibility_role IN (
      'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
      'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
    )
  ),
  CONSTRAINT chk_responsibility_scopes_scope CHECK (
    (scope_type = 'TENANT' AND scope_id IS NULL)
    OR
    (scope_type <> 'TENANT' AND scope_id IS NOT NULL)
  ),
  CONSTRAINT chk_responsibility_scopes_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_responsibility_scopes_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE deployment_capacities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deployment_assignment_id VARCHAR(64) NOT NULL,
  capacity_percent DECIMAL(5,2) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deployment_capacities_tenant_id_id (tenant_id, id),
  KEY ix_deployment_capacities_assignment
    (tenant_id, deployment_assignment_id, status, effective_from, effective_to),
  CONSTRAINT fk_deployment_capacities_assignment
    FOREIGN KEY (tenant_id, deployment_assignment_id)
    REFERENCES deployment_assignments(tenant_id, id),
  CONSTRAINT chk_deployment_capacities_percent CHECK (
    capacity_percent >= 0 AND capacity_percent <= 100
  ),
  CONSTRAINT chk_deployment_capacities_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_deployment_capacities_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;
