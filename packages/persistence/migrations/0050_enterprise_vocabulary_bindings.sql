CREATE TABLE metadata_native_type_bindings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  native_object_type VARCHAR(120) NOT NULL,
  type_definition_id VARCHAR(64) NOT NULL,
  source_authority VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_metadata_native_type_bindings_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_metadata_native_type_bindings_object_type (tenant_id,native_object_type),
  KEY ix_metadata_native_type_bindings_type (tenant_id,type_definition_id,status),
  CONSTRAINT fk_metadata_native_type_bindings_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_metadata_native_type_bindings_type
    FOREIGN KEY (tenant_id,type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id,id),
  CONSTRAINT chk_metadata_native_type_bindings_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_native_relationship_bindings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  native_relationship_type VARCHAR(120) NOT NULL,
  relationship_type_definition_id VARCHAR(64) NOT NULL,
  source_authority VARCHAR(120) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_metadata_native_rel_bindings_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_metadata_native_rel_bindings_native_type (tenant_id,native_relationship_type),
  KEY ix_metadata_native_rel_bindings_definition (tenant_id,relationship_type_definition_id,status),
  CONSTRAINT fk_metadata_native_rel_bindings_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_metadata_native_rel_bindings_definition
    FOREIGN KEY (tenant_id,relationship_type_definition_id)
    REFERENCES metadata_relationship_type_definitions(tenant_id,id),
  CONSTRAINT chk_metadata_native_rel_bindings_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;
