ALTER TABLE functional_deployments
  ADD COLUMN deployment_purpose VARCHAR(32) NOT NULL DEFAULT 'FUNCTIONAL_DELIVERY'
    AFTER sub_function_id,
  ADD CONSTRAINT chk_functional_deployments_purpose
    CHECK (deployment_purpose IN ('FUNCTIONAL_GOVERNANCE', 'FUNCTIONAL_DELIVERY'));

CREATE TABLE industry_discipline_deployments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  industry_job_profile_id VARCHAR(64) NOT NULL,
  deployment_purpose VARCHAR(32) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  organisation_unit_id VARCHAR(64) NULL,
  assignee_type VARCHAR(24) NOT NULL,
  assignee_id VARCHAR(64) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  responsibility_role VARCHAR(32) NOT NULL,
  context_type VARCHAR(24) NOT NULL,
  context_object_id VARCHAR(64) NULL,
  scope_description TEXT NOT NULL,
  capacity_percent DECIMAL(5,2) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_industry_discipline_deployments_tenant_id_id (tenant_id, id),
  KEY ix_industry_discipline_deployments_profile
    (tenant_id, industry_job_profile_id, deployment_purpose, status),
  KEY ix_industry_discipline_deployments_assignee
    (tenant_id, assignee_type, assignee_id, status, effective_from, effective_to),
  KEY ix_industry_discipline_deployments_context
    (tenant_id, context_type, context_object_id, deployment_purpose, status),
  CONSTRAINT fk_industry_discipline_deployments_profile
    FOREIGN KEY (industry_job_profile_id) REFERENCES industry_job_profiles(id),
  CONSTRAINT fk_industry_discipline_deployments_organisation
    FOREIGN KEY (tenant_id, organisation_id) REFERENCES organisations(tenant_id, id),
  CONSTRAINT fk_industry_discipline_deployments_unit
    FOREIGN KEY (tenant_id, organisation_unit_id) REFERENCES organisation_units(tenant_id, id),
  CONSTRAINT fk_industry_discipline_deployments_context
    FOREIGN KEY (tenant_id, context_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_industry_discipline_deployments_purpose
    CHECK (deployment_purpose IN ('FUNCTIONAL_GOVERNANCE', 'FUNCTIONAL_DELIVERY')),
  CONSTRAINT chk_industry_discipline_deployments_assignee
    CHECK (assignee_type IN ('PERSON', 'POSITION')),
  CONSTRAINT chk_industry_discipline_deployments_responsibility
    CHECK (responsibility_role IN (
      'ACCOUNTABLE', 'RESPONSIBLE', 'CONTRIBUTOR', 'REVIEWER', 'CHECKER',
      'APPROVER', 'ACCEPTOR', 'CONSULTED', 'INFORMED', 'ASSURANCE'
    )),
  CONSTRAINT chk_industry_discipline_deployments_context_type
    CHECK (context_type IN (
      'TENANT', 'ORGANISATION', 'PROJECT', 'CONTRACT', 'PACKAGE',
      'SITE', 'ASSET', 'SERVICE', 'CUSTOM'
    )),
  CONSTRAINT chk_industry_discipline_deployments_context
    CHECK (
      (context_type IN ('TENANT', 'ORGANISATION') AND context_object_id IS NULL)
      OR
      (context_type NOT IN ('TENANT', 'ORGANISATION') AND context_object_id IS NOT NULL)
    ),
  CONSTRAINT chk_industry_discipline_deployments_capacity
    CHECK (capacity_percent IS NULL OR (capacity_percent >= 0 AND capacity_percent <= 100)),
  CONSTRAINT chk_industry_discipline_deployments_period
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT chk_industry_discipline_deployments_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;
