CREATE TABLE organisational_contexts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  context_type VARCHAR(32) NOT NULL,
  lifecycle VARCHAR(16) NOT NULL,
  code VARCHAR(160) NOT NULL,
  name VARCHAR(255) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  organisation_unit_id VARCHAR(64) NULL,
  function_id VARCHAR(16) NULL,
  canonical_object_id VARCHAR(64) NULL,
  parent_context_id VARCHAR(64) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_organisational_contexts_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_organisational_contexts_code (tenant_id,context_type,code),
  UNIQUE KEY uq_organisational_contexts_function (tenant_id,function_id,organisation_id),
  UNIQUE KEY uq_organisational_contexts_object (tenant_id,canonical_object_id),
  KEY ix_organisational_contexts_parent (tenant_id,parent_context_id,status),
  KEY ix_organisational_contexts_unit (tenant_id,organisation_unit_id,status),
  CONSTRAINT fk_organisational_contexts_organisation
    FOREIGN KEY (tenant_id,organisation_id) REFERENCES organisations(tenant_id,id),
  CONSTRAINT fk_organisational_contexts_unit
    FOREIGN KEY (tenant_id,organisation_unit_id) REFERENCES organisation_units(tenant_id,id),
  CONSTRAINT fk_organisational_contexts_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_organisational_contexts_object
    FOREIGN KEY (tenant_id,canonical_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_organisational_contexts_parent
    FOREIGN KEY (tenant_id,parent_context_id) REFERENCES organisational_contexts(tenant_id,id),
  CONSTRAINT chk_organisational_contexts_type CHECK (
    context_type IN ('FUNCTION','PROJECT','PROGRAMME','CONTRACT','SERVICE','ASSET_OPERATION','CUSTOM')
  ),
  CONSTRAINT chk_organisational_contexts_lifecycle CHECK (lifecycle IN ('PERMANENT','TEMPORARY')),
  CONSTRAINT chk_organisational_contexts_semantics CHECK (
    (context_type='FUNCTION' AND lifecycle='PERMANENT' AND function_id IS NOT NULL
      AND organisation_unit_id IS NOT NULL AND canonical_object_id IS NULL)
    OR
    (context_type<>'FUNCTION' AND function_id IS NULL AND canonical_object_id IS NOT NULL)
  ),
  CONSTRAINT chk_organisational_contexts_project CHECK (
    context_type<>'PROJECT' OR lifecycle='TEMPORARY'
  ),
  CONSTRAINT chk_organisational_contexts_parent_self CHECK (
    parent_context_id IS NULL OR parent_context_id<>id
  ),
  CONSTRAINT chk_organisational_contexts_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_organisational_contexts_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE organisational_resource_requirements (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  requesting_context_id VARCHAR(64) NOT NULL,
  supplying_function_context_id VARCHAR(64) NOT NULL,
  job_profile_id VARCHAR(64) NOT NULL,
  role_title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  required_headcount INT UNSIGNED NOT NULL,
  required_capacity_percent DECIMAL(5,2) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(24) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_organisational_resource_requirements_tenant_id_id (tenant_id,id),
  KEY ix_org_resource_requirements_requester (tenant_id,requesting_context_id,status,effective_from,effective_to),
  KEY ix_org_resource_requirements_supplier (tenant_id,supplying_function_context_id,status,effective_from,effective_to),
  CONSTRAINT fk_org_resource_requirements_requester
    FOREIGN KEY (tenant_id,requesting_context_id) REFERENCES organisational_contexts(tenant_id,id),
  CONSTRAINT fk_org_resource_requirements_supplier
    FOREIGN KEY (tenant_id,supplying_function_context_id) REFERENCES organisational_contexts(tenant_id,id),
  CONSTRAINT fk_org_resource_requirements_job
    FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT chk_org_resource_requirements_contexts CHECK (
    requesting_context_id<>supplying_function_context_id
  ),
  CONSTRAINT chk_org_resource_requirements_headcount CHECK (required_headcount>=1),
  CONSTRAINT chk_org_resource_requirements_capacity CHECK (
    required_capacity_percent>0 AND required_capacity_percent<=100
  ),
  CONSTRAINT chk_org_resource_requirements_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_org_resource_requirements_status CHECK (
    status IN ('OPEN','PARTIALLY_FULFILLED','FULFILLED','CANCELLED')
  )
) ENGINE=InnoDB;

CREATE TABLE organisational_resource_fulfilments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  requirement_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  position_id VARCHAR(64) NOT NULL,
  requirement_share_percent DECIMAL(5,2) NOT NULL,
  resource_capacity_percent DECIMAL(5,2) NOT NULL,
  functional_deployment_id VARCHAR(64) NOT NULL,
  deployment_assignment_id VARCHAR(64) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_organisational_resource_fulfilments_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_org_resource_fulfilments_assignment (tenant_id,deployment_assignment_id),
  KEY ix_org_resource_fulfilments_requirement (tenant_id,requirement_id,status),
  KEY ix_org_resource_fulfilments_person_period (tenant_id,person_id,status,effective_from,effective_to),
  CONSTRAINT fk_org_resource_fulfilments_requirement
    FOREIGN KEY (tenant_id,requirement_id) REFERENCES organisational_resource_requirements(tenant_id,id),
  CONSTRAINT fk_org_resource_fulfilments_person
    FOREIGN KEY (tenant_id,person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_org_resource_fulfilments_position
    FOREIGN KEY (tenant_id,position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT fk_org_resource_fulfilments_deployment
    FOREIGN KEY (tenant_id,functional_deployment_id) REFERENCES functional_deployments(tenant_id,id),
  CONSTRAINT fk_org_resource_fulfilments_assignment
    FOREIGN KEY (tenant_id,deployment_assignment_id) REFERENCES deployment_assignments(tenant_id,id),
  CONSTRAINT chk_org_resource_fulfilments_share CHECK (
    requirement_share_percent>0 AND requirement_share_percent<=100
  ),
  CONSTRAINT chk_org_resource_fulfilments_capacity CHECK (
    resource_capacity_percent>0 AND resource_capacity_percent<=100
  ),
  CONSTRAINT chk_org_resource_fulfilments_period CHECK (
    effective_to IS NULL OR effective_to>=effective_from
  ),
  CONSTRAINT chk_org_resource_fulfilments_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('platform.resource_planning.read','Read organisational resource planning','View Function and Project organisational contexts, resource demand, named fulfilment and capacity.'),
 ('platform.resource_planning.manage','Manage organisational resource planning','Register Function and Project organisational contexts and create resource requirements.'),
 ('platform.resource_planning.fulfil','Fulfil organisational resource demand','Supply named employees from a Function into Project resource requirements.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-083','ROLE-PLATFORM-ADMINISTRATOR','platform.resource_planning.read'),
 ('ARP-PLATFORM-ADMIN-084','ROLE-PLATFORM-ADMINISTRATOR','platform.resource_planning.manage'),
 ('ARP-PLATFORM-ADMIN-085','ROLE-PLATFORM-ADMINISTRATOR','platform.resource_planning.fulfil');
