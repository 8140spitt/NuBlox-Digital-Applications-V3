CREATE TABLE metadata_enumeration_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_enumerations_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_enumerations_code_version (tenant_id, code, version),
  CONSTRAINT fk_metadata_enumerations_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_metadata_enumerations_version CHECK (version > 0),
  CONSTRAINT chk_metadata_enumerations_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_metadata_enumerations_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_enumeration_values (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  enumeration_definition_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sequence_no INT NOT NULL,
  external_value VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_enum_values_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_enum_values_code (tenant_id, enumeration_definition_id, code),
  UNIQUE KEY uq_metadata_enum_values_sequence (tenant_id, enumeration_definition_id, sequence_no),
  CONSTRAINT fk_metadata_enum_values_definition FOREIGN KEY (tenant_id, enumeration_definition_id)
    REFERENCES metadata_enumeration_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_enum_values_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_metadata_enum_values_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_type_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  object_family VARCHAR(120) NOT NULL,
  parent_type_definition_id VARCHAR(64) NULL,
  version INT NOT NULL,
  lifecycle_definition_id VARCHAR(64) NULL,
  default_template_reference VARCHAR(255) NULL,
  creation_policy_reference VARCHAR(255) NULL,
  classification_applicability JSON NULL,
  extension_package VARCHAR(160) NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_types_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_types_code_version (tenant_id, code, version),
  KEY ix_metadata_types_family (tenant_id, object_family, status),
  CONSTRAINT fk_metadata_types_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_metadata_types_parent FOREIGN KEY (tenant_id, parent_type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_types_version CHECK (version > 0),
  CONSTRAINT chk_metadata_types_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_metadata_types_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_attribute_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  data_type VARCHAR(24) NOT NULL,
  version INT NOT NULL,
  unit_code VARCHAR(40) NULL,
  enumeration_definition_id VARCHAR(64) NULL,
  reference_object_family VARCHAR(120) NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_attributes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_attributes_code_version (tenant_id, code, version),
  KEY ix_metadata_attributes_type (tenant_id, data_type, status),
  CONSTRAINT fk_metadata_attributes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_metadata_attributes_enumeration FOREIGN KEY (tenant_id, enumeration_definition_id)
    REFERENCES metadata_enumeration_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_attributes_type CHECK (
    data_type IN ('STRING','INTEGER','DECIMAL','BOOLEAN','DATE','DATETIME','ENUMERATION','REFERENCE','JSON')
  ),
  CONSTRAINT chk_metadata_attributes_version CHECK (version > 0),
  CONSTRAINT chk_metadata_attributes_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_metadata_attributes_status CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT chk_metadata_attributes_enum_reference CHECK (
    (data_type = 'ENUMERATION' AND enumeration_definition_id IS NOT NULL)
    OR (data_type <> 'ENUMERATION' AND enumeration_definition_id IS NULL)
  ),
  CONSTRAINT chk_metadata_attributes_object_reference CHECK (
    (data_type = 'REFERENCE' AND reference_object_family IS NOT NULL)
    OR (data_type <> 'REFERENCE' AND reference_object_family IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE metadata_type_attribute_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  type_definition_id VARCHAR(64) NOT NULL,
  attribute_definition_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT FALSE,
  cardinality VARCHAR(16) NOT NULL,
  local_label VARCHAR(255) NULL,
  default_value JSON NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_type_attrs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_type_attrs_attribute (tenant_id, type_definition_id, attribute_definition_id),
  UNIQUE KEY uq_metadata_type_attrs_sequence (tenant_id, type_definition_id, sequence_no),
  CONSTRAINT fk_metadata_type_attrs_type FOREIGN KEY (tenant_id, type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id, id),
  CONSTRAINT fk_metadata_type_attrs_attribute FOREIGN KEY (tenant_id, attribute_definition_id)
    REFERENCES metadata_attribute_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_type_attrs_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_metadata_type_attrs_cardinality CHECK (cardinality IN ('SINGLE','MULTIPLE')),
  CONSTRAINT chk_metadata_type_attrs_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_constraint_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  constraint_type VARCHAR(24) NOT NULL,
  configuration JSON NOT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_constraints_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_constraints_code_version (tenant_id, code, version),
  CONSTRAINT fk_metadata_constraints_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_metadata_constraints_type CHECK (
    constraint_type IN ('REQUIRED','MIN_MAX','LENGTH','PATTERN','ENUMERATION','REFERENCE','CUSTOM')
  ),
  CONSTRAINT chk_metadata_constraints_version CHECK (version > 0),
  CONSTRAINT chk_metadata_constraints_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_metadata_constraints_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_attribute_constraint_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  type_attribute_assignment_id VARCHAR(64) NOT NULL,
  constraint_definition_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_attr_constraints_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_attr_constraints_constraint
    (tenant_id, type_attribute_assignment_id, constraint_definition_id),
  UNIQUE KEY uq_metadata_attr_constraints_sequence
    (tenant_id, type_attribute_assignment_id, sequence_no),
  CONSTRAINT fk_metadata_attr_constraints_assignment FOREIGN KEY (tenant_id, type_attribute_assignment_id)
    REFERENCES metadata_type_attribute_assignments(tenant_id, id),
  CONSTRAINT fk_metadata_attr_constraints_definition FOREIGN KEY (tenant_id, constraint_definition_id)
    REFERENCES metadata_constraint_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_attr_constraints_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_metadata_attr_constraints_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.metadata.read', 'Read governed metadata', 'View governed type, attribute, constraint and enumeration definitions.'),
  ('platform.metadata.manage', 'Manage governed metadata', 'Administer governed type, attribute, constraint and enumeration definitions.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-031', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.metadata.read'),
  ('ARP-PLATFORM-ADMIN-032', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.metadata.manage');
