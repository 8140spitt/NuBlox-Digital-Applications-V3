CREATE TABLE kernel_schema_migrations (
  version VARCHAR(255) NOT NULL PRIMARY KEY,
  checksum CHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL,
  applied_at TIMESTAMP(6) NULL,
  error_message TEXT NULL,
  CONSTRAINT chk_kernel_schema_migrations_status
    CHECK (status IN ('APPLYING', 'APPLIED', 'FAILED'))
) ENGINE=InnoDB;

CREATE TABLE tenants (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT chk_tenants_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE parties (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  kind VARCHAR(24) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_parties_tenant_id_id (tenant_id, id),
  KEY ix_parties_tenant_kind (tenant_id, kind),
  CONSTRAINT fk_parties_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_parties_kind CHECK (kind IN ('PERSON', 'ORGANISATION')),
  CONSTRAINT chk_parties_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE persons (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  party_id VARCHAR(64) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  preferred_name VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_persons_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_persons_tenant_party (tenant_id, party_id),
  CONSTRAINT fk_persons_party FOREIGN KEY (tenant_id, party_id)
    REFERENCES parties(tenant_id, id),
  CONSTRAINT chk_persons_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE organisations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  party_id VARCHAR(64) NOT NULL,
  legal_name VARCHAR(255) NOT NULL,
  trading_name VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_organisations_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_organisations_tenant_party (tenant_id, party_id),
  CONSTRAINT fk_organisations_party FOREIGN KEY (tenant_id, party_id)
    REFERENCES parties(tenant_id, id),
  CONSTRAINT chk_organisations_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE organisation_units (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  parent_unit_id VARCHAR(64) NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_organisation_units_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_organisation_units_tenant_org_code (tenant_id, organisation_id, code),
  CONSTRAINT fk_organisation_units_organisation FOREIGN KEY (tenant_id, organisation_id)
    REFERENCES organisations(tenant_id, id),
  CONSTRAINT fk_organisation_units_parent FOREIGN KEY (tenant_id, parent_unit_id)
    REFERENCES organisation_units(tenant_id, id),
  CONSTRAINT chk_organisation_units_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE job_profiles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  catalogue_scope VARCHAR(16) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  KEY ix_job_profiles_tenant_code (tenant_id, code),
  CONSTRAINT fk_job_profiles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_job_profiles_scope CHECK (catalogue_scope IN ('PLATFORM', 'TENANT')),
  CONSTRAINT chk_job_profiles_tenant_scope CHECK (
    (catalogue_scope = 'PLATFORM' AND tenant_id IS NULL)
    OR (catalogue_scope = 'TENANT' AND tenant_id IS NOT NULL)
  ),
  CONSTRAINT chk_job_profiles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE positions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  organisation_unit_id VARCHAR(64) NOT NULL,
  job_profile_id VARCHAR(64) NULL,
  code VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_positions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_positions_tenant_unit_code (tenant_id, organisation_unit_id, code),
  CONSTRAINT fk_positions_unit FOREIGN KEY (tenant_id, organisation_unit_id)
    REFERENCES organisation_units(tenant_id, id),
  CONSTRAINT fk_positions_job_profile FOREIGN KEY (job_profile_id) REFERENCES job_profiles(id),
  CONSTRAINT chk_positions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE position_occupancies (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  position_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_position_occupancies_tenant_id_id (tenant_id, id),
  KEY ix_position_occupancies_position_period (tenant_id, position_id, effective_from, effective_to),
  KEY ix_position_occupancies_person_period (tenant_id, person_id, effective_from, effective_to),
  CONSTRAINT fk_position_occupancies_position FOREIGN KEY (tenant_id, position_id)
    REFERENCES positions(tenant_id, id),
  CONSTRAINT fk_position_occupancies_person FOREIGN KEY (tenant_id, person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_position_occupancies_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
) ENGINE=InnoDB;

CREATE TABLE authority_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  authority_type VARCHAR(24) NOT NULL,
  unit VARCHAR(32) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_authority_definitions_tenant_code (tenant_id, code),
  UNIQUE KEY uq_authority_definitions_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_authority_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_authority_definitions_type CHECK (
    authority_type IN ('FINANCIAL', 'CONTRACTUAL', 'TECHNICAL', 'OPERATIONAL', 'GOVERNANCE')
  ),
  CONSTRAINT chk_authority_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE authority_grants (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  authority_definition_id VARCHAR(64) NOT NULL,
  grantee_type VARCHAR(32) NOT NULL,
  grantee_id VARCHAR(64) NOT NULL,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(64) NULL,
  limit_value DECIMAL(24,6) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_authority_grants_tenant_id_id (tenant_id, id),
  KEY ix_authority_grants_grantee (tenant_id, grantee_type, grantee_id, effective_from, effective_to),
  CONSTRAINT fk_authority_grants_definition FOREIGN KEY (tenant_id, authority_definition_id)
    REFERENCES authority_definitions(tenant_id, id),
  CONSTRAINT chk_authority_grants_grantee_type CHECK (
    grantee_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT')
  ),
  CONSTRAINT chk_authority_grants_limit CHECK (limit_value IS NULL OR limit_value >= 0),
  CONSTRAINT chk_authority_grants_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_authority_grants_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE delegations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  authority_grant_id VARCHAR(64) NOT NULL,
  delegated_by_person_id VARCHAR(64) NOT NULL,
  delegated_to_person_id VARCHAR(64) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  reason TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_delegations_tenant_id_id (tenant_id, id),
  CONSTRAINT fk_delegations_grant FOREIGN KEY (tenant_id, authority_grant_id)
    REFERENCES authority_grants(tenant_id, id),
  CONSTRAINT fk_delegations_from_person FOREIGN KEY (tenant_id, delegated_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_delegations_to_person FOREIGN KEY (tenant_id, delegated_to_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_delegations_people CHECK (delegated_by_person_id <> delegated_to_person_id),
  CONSTRAINT chk_delegations_period CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT chk_delegations_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE permission_definitions (
  permission_key VARCHAR(160) NOT NULL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE canonical_objects (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  object_type VARCHAR(120) NOT NULL,
  stable_key VARCHAR(160) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  UNIQUE KEY uq_canonical_objects_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_canonical_objects_tenant_type_key (tenant_id, object_type, stable_key),
  CONSTRAINT fk_canonical_objects_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;

CREATE TABLE canonical_relationships (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(120) NOT NULL,
  from_object_id VARCHAR(64) NOT NULL,
  to_object_id VARCHAR(64) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  metadata JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_canonical_relationships_tenant_id_id (tenant_id, id),
  KEY ix_canonical_relationships_from (tenant_id, from_object_id, relationship_type),
  KEY ix_canonical_relationships_to (tenant_id, to_object_id, relationship_type),
  CONSTRAINT fk_canonical_relationships_from FOREIGN KEY (tenant_id, from_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_canonical_relationships_to FOREIGN KEY (tenant_id, to_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_canonical_relationships_not_self CHECK (from_object_id <> to_object_id),
  CONSTRAINT chk_canonical_relationships_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_canonical_relationships_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE kernel_audit_entries (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  entity_type VARCHAR(120) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  action VARCHAR(80) NOT NULL,
  actor_person_id VARCHAR(64) NULL,
  correlation_id VARCHAR(128) NULL,
  occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  payload JSON NULL,
  KEY ix_kernel_audit_entries_entity (tenant_id, entity_type, entity_id, occurred_at),
  KEY ix_kernel_audit_entries_actor (tenant_id, actor_person_id, occurred_at),
  CONSTRAINT fk_kernel_audit_entries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;
