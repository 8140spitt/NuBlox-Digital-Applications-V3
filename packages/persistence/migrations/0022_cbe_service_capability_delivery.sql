CREATE TABLE tenant_service_offerings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  industry_solution_id VARCHAR(32) NOT NULL,
  delivery_domain_id VARCHAR(16) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_tenant_service_offerings_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_tenant_service_offerings_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_tenant_service_offerings_code (tenant_id, code),
  KEY ix_tenant_service_offerings_domain (tenant_id, delivery_domain_id, status),
  CONSTRAINT fk_tenant_service_offerings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_service_offerings_object
    FOREIGN KEY (tenant_id, canonical_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_tenant_service_offerings_industry
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  CONSTRAINT fk_tenant_service_offerings_domain
    FOREIGN KEY (delivery_domain_id) REFERENCES delivery_domains(id),
  CONSTRAINT chk_tenant_service_offerings_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE tenant_service_job_profiles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  service_offering_id VARCHAR(64) NOT NULL,
  industry_job_profile_id VARCHAR(64) NOT NULL,
  role VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_tenant_service_job_profiles_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_tenant_service_job_profiles_profile
    (tenant_id, service_offering_id, industry_job_profile_id),
  CONSTRAINT fk_tenant_service_job_profiles_service
    FOREIGN KEY (tenant_id, service_offering_id)
    REFERENCES tenant_service_offerings(tenant_id, id),
  CONSTRAINT fk_tenant_service_job_profiles_profile
    FOREIGN KEY (industry_job_profile_id) REFERENCES industry_job_profiles(id),
  CONSTRAINT chk_tenant_service_job_profiles_role
    CHECK (role IN ('CORE', 'SUPPORTING', 'ASSURANCE')),
  CONSTRAINT chk_tenant_service_job_profiles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE tenant_industry_capabilities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  industry_job_profile_id VARCHAR(64) NOT NULL,
  supply_model VARCHAR(24) NOT NULL,
  notes TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_tenant_industry_capabilities_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_tenant_industry_capabilities_profile (tenant_id, industry_job_profile_id),
  CONSTRAINT fk_tenant_industry_capabilities_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_industry_capabilities_profile
    FOREIGN KEY (industry_job_profile_id) REFERENCES industry_job_profiles(id),
  CONSTRAINT chk_tenant_industry_capabilities_supply
    CHECK (supply_model IN ('INTERNAL', 'HYBRID')),
  CONSTRAINT chk_tenant_industry_capabilities_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE delivery_capability_requirements (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  context_object_id VARCHAR(64) NOT NULL,
  service_offering_id VARCHAR(64) NOT NULL,
  industry_job_profile_id VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  required_headcount INT UNSIGNED NOT NULL,
  sourcing_strategy VARCHAR(24) NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_delivery_capability_requirements_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_delivery_capability_requirements_object (tenant_id, canonical_object_id),
  KEY ix_delivery_capability_requirements_context (tenant_id, context_object_id, status),
  KEY ix_delivery_capability_requirements_job (tenant_id, industry_job_profile_id, status),
  CONSTRAINT fk_delivery_capability_requirements_object
    FOREIGN KEY (tenant_id, canonical_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_delivery_capability_requirements_context
    FOREIGN KEY (tenant_id, context_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_delivery_capability_requirements_service
    FOREIGN KEY (tenant_id, service_offering_id)
    REFERENCES tenant_service_offerings(tenant_id, id),
  CONSTRAINT fk_delivery_capability_requirements_profile
    FOREIGN KEY (industry_job_profile_id) REFERENCES industry_job_profiles(id),
  CONSTRAINT chk_delivery_capability_requirements_headcount CHECK (required_headcount >= 1),
  CONSTRAINT chk_delivery_capability_requirements_sourcing
    CHECK (sourcing_strategy IN ('INTERNAL', 'EXTERNAL', 'HYBRID', 'UNDECIDED')),
  CONSTRAINT chk_delivery_capability_requirements_period
    CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from),
  CONSTRAINT chk_delivery_capability_requirements_status
    CHECK (status IN ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE delivery_capability_fulfilments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  requirement_id VARCHAR(64) NOT NULL,
  fulfilment_type VARCHAR(16) NOT NULL,
  provider_type VARCHAR(32) NOT NULL,
  provider_id VARCHAR(64) NOT NULL,
  provider_organisation_id VARCHAR(64) NULL,
  requirement_share_percent DECIMAL(5,2) NOT NULL,
  resource_capacity_percent DECIMAL(5,2) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_delivery_capability_fulfilments_tenant_id_id (tenant_id, id),
  KEY ix_delivery_capability_fulfilments_requirement
    (tenant_id, requirement_id, status, effective_from, effective_to),
  KEY ix_delivery_capability_fulfilments_provider
    (tenant_id, provider_type, provider_id, status),
  CONSTRAINT fk_delivery_capability_fulfilments_requirement
    FOREIGN KEY (tenant_id, requirement_id)
    REFERENCES delivery_capability_requirements(tenant_id, id),
  CONSTRAINT fk_delivery_capability_fulfilments_provider_org
    FOREIGN KEY (tenant_id, provider_organisation_id) REFERENCES organisations(tenant_id, id),
  CONSTRAINT chk_delivery_capability_fulfilments_type
    CHECK (fulfilment_type IN ('INTERNAL', 'EXTERNAL')),
  CONSTRAINT chk_delivery_capability_fulfilments_provider_type
    CHECK (provider_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION')),
  CONSTRAINT chk_delivery_capability_fulfilments_share
    CHECK (requirement_share_percent > 0 AND requirement_share_percent <= 100),
  CONSTRAINT chk_delivery_capability_fulfilments_capacity
    CHECK (resource_capacity_percent IS NULL OR
      (resource_capacity_percent >= 0 AND resource_capacity_percent <= 100)),
  CONSTRAINT chk_delivery_capability_fulfilments_period
    CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT chk_delivery_capability_fulfilments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;
