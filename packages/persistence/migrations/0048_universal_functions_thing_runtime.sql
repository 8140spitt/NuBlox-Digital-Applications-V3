-- NuBlox universal Function + metadata-driven Thing runtime.
-- Existing domain tables remain compatible while all Functions and configurable Things
-- converge on one object model.

ALTER TABLE function_definitions
  ADD COLUMN function_family VARCHAR(32) NOT NULL DEFAULT 'CORE_BUSINESS' AFTER name,
  ADD COLUMN industry_solution_id VARCHAR(32) NULL AFTER function_family,
  ADD COLUMN parent_function_id VARCHAR(16) NULL AFTER industry_solution_id,
  ADD COLUMN description TEXT NULL AFTER parent_function_id,
  ADD KEY ix_function_definitions_family (function_family, status, code),
  ADD KEY ix_function_definitions_solution (industry_solution_id, status, code),
  ADD KEY ix_function_definitions_parent (parent_function_id, status, code),
  ADD CONSTRAINT fk_function_definitions_solution
    FOREIGN KEY (industry_solution_id) REFERENCES industry_solutions(id),
  ADD CONSTRAINT fk_function_definitions_parent
    FOREIGN KEY (parent_function_id) REFERENCES function_definitions(id),
  ADD CONSTRAINT chk_function_definitions_family
    CHECK (function_family IN ('CORE_BUSINESS','CBE','CUSTOM')),
  ADD CONSTRAINT chk_function_definitions_parent
    CHECK (parent_function_id IS NULL OR parent_function_id <> id);

INSERT INTO function_definitions
  (id, code, name, function_family, industry_solution_id, parent_function_id, description, status)
SELECT
  d.id, d.code, d.name, 'CBE', d.industry_solution_id, NULL, d.purpose, d.status
FROM delivery_domains d
WHERE d.industry_solution_id = 'CBE'
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  function_family = 'CBE',
  industry_solution_id = VALUES(industry_solution_id),
  description = VALUES(description),
  status = VALUES(status);

ALTER TABLE delivery_domains
  ADD COLUMN function_id VARCHAR(16) NULL AFTER industry_solution_id,
  ADD UNIQUE KEY uq_delivery_domains_function (function_id),
  ADD CONSTRAINT fk_delivery_domains_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id);

UPDATE delivery_domains
   SET function_id = id
 WHERE industry_solution_id = 'CBE'
   AND function_id IS NULL;

ALTER TABLE canonical_objects
  ADD COLUMN type_definition_id VARCHAR(64) NULL AFTER object_type,
  ADD COLUMN display_name VARCHAR(255) NULL AFTER stable_key,
  ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' AFTER display_name,
  ADD KEY ix_canonical_objects_type (tenant_id, type_definition_id, status),
  ADD CONSTRAINT fk_canonical_objects_type
    FOREIGN KEY (tenant_id, type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id, id),
  ADD CONSTRAINT chk_canonical_objects_status
    CHECK (status IN ('ACTIVE','INACTIVE'));

CREATE TABLE metadata_object_attribute_values (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  type_attribute_assignment_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL DEFAULT 0,
  string_value TEXT NULL,
  integer_value BIGINT NULL,
  decimal_value DECIMAL(30,10) NULL,
  boolean_value BOOLEAN NULL,
  date_value DATE NULL,
  datetime_value DATETIME(6) NULL,
  enumeration_value_id VARCHAR(64) NULL,
  reference_object_id VARCHAR(64) NULL,
  json_value JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_metadata_object_values_slot
    (tenant_id, canonical_object_id, type_attribute_assignment_id, sequence_no),
  KEY ix_metadata_object_values_assignment
    (tenant_id, type_attribute_assignment_id, canonical_object_id),
  KEY ix_metadata_object_values_reference
    (tenant_id, reference_object_id),
  CONSTRAINT fk_metadata_object_values_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_metadata_object_values_assignment
    FOREIGN KEY (tenant_id, type_attribute_assignment_id)
    REFERENCES metadata_type_attribute_assignments(tenant_id, id),
  CONSTRAINT fk_metadata_object_values_enumeration
    FOREIGN KEY (tenant_id, enumeration_value_id)
    REFERENCES metadata_enumeration_values(tenant_id, id),
  CONSTRAINT fk_metadata_object_values_reference
    FOREIGN KEY (tenant_id, reference_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_metadata_object_values_sequence CHECK (sequence_no >= 0)
) ENGINE=InnoDB;

CREATE TABLE metadata_relationship_type_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  from_type_definition_id VARCHAR(64) NOT NULL,
  to_type_definition_id VARCHAR(64) NOT NULL,
  from_cardinality VARCHAR(16) NOT NULL,
  to_cardinality VARCHAR(16) NOT NULL,
  inverse_name VARCHAR(255) NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_metadata_relationship_types_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_relationship_types_code_version (tenant_id, code, version),
  KEY ix_metadata_relationship_types_from
    (tenant_id, from_type_definition_id, status),
  KEY ix_metadata_relationship_types_to
    (tenant_id, to_type_definition_id, status),
  CONSTRAINT fk_metadata_relationship_types_from
    FOREIGN KEY (tenant_id, from_type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id, id),
  CONSTRAINT fk_metadata_relationship_types_to
    FOREIGN KEY (tenant_id, to_type_definition_id)
    REFERENCES metadata_type_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_relationship_types_from_cardinality
    CHECK (from_cardinality IN ('ONE','MANY')),
  CONSTRAINT chk_metadata_relationship_types_to_cardinality
    CHECK (to_cardinality IN ('ONE','MANY')),
  CONSTRAINT chk_metadata_relationship_types_version CHECK (version > 0),
  CONSTRAINT chk_metadata_relationship_types_period CHECK (
    effective_to IS NULL OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_metadata_relationship_types_status
    CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE metadata_relationship_attribute_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  relationship_type_definition_id VARCHAR(64) NOT NULL,
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
  UNIQUE KEY uq_metadata_relationship_attrs_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_metadata_relationship_attrs_attribute
    (tenant_id, relationship_type_definition_id, attribute_definition_id),
  UNIQUE KEY uq_metadata_relationship_attrs_sequence
    (tenant_id, relationship_type_definition_id, sequence_no),
  CONSTRAINT fk_metadata_relationship_attrs_type
    FOREIGN KEY (tenant_id, relationship_type_definition_id)
    REFERENCES metadata_relationship_type_definitions(tenant_id, id),
  CONSTRAINT fk_metadata_relationship_attrs_attribute
    FOREIGN KEY (tenant_id, attribute_definition_id)
    REFERENCES metadata_attribute_definitions(tenant_id, id),
  CONSTRAINT chk_metadata_relationship_attrs_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_metadata_relationship_attrs_cardinality
    CHECK (cardinality IN ('SINGLE','MULTIPLE')),
  CONSTRAINT chk_metadata_relationship_attrs_status
    CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

ALTER TABLE canonical_relationships
  ADD COLUMN relationship_type_definition_id VARCHAR(64) NULL AFTER relationship_type,
  ADD KEY ix_canonical_relationships_typed
    (tenant_id, relationship_type_definition_id, from_object_id, to_object_id, status),
  ADD CONSTRAINT fk_canonical_relationships_type_definition
    FOREIGN KEY (tenant_id, relationship_type_definition_id)
    REFERENCES metadata_relationship_type_definitions(tenant_id, id);

CREATE TABLE metadata_relationship_attribute_values (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_relationship_id VARCHAR(64) NOT NULL,
  relationship_attribute_assignment_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL DEFAULT 0,
  string_value TEXT NULL,
  integer_value BIGINT NULL,
  decimal_value DECIMAL(30,10) NULL,
  boolean_value BOOLEAN NULL,
  date_value DATE NULL,
  datetime_value DATETIME(6) NULL,
  enumeration_value_id VARCHAR(64) NULL,
  reference_object_id VARCHAR(64) NULL,
  json_value JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_metadata_relationship_values_slot
    (tenant_id, canonical_relationship_id, relationship_attribute_assignment_id, sequence_no),
  KEY ix_metadata_relationship_values_assignment
    (tenant_id, relationship_attribute_assignment_id, canonical_relationship_id),
  CONSTRAINT fk_metadata_relationship_values_relationship
    FOREIGN KEY (tenant_id, canonical_relationship_id)
    REFERENCES canonical_relationships(tenant_id, id),
  CONSTRAINT fk_metadata_relationship_values_assignment
    FOREIGN KEY (tenant_id, relationship_attribute_assignment_id)
    REFERENCES metadata_relationship_attribute_assignments(tenant_id, id),
  CONSTRAINT fk_metadata_relationship_values_enumeration
    FOREIGN KEY (tenant_id, enumeration_value_id)
    REFERENCES metadata_enumeration_values(tenant_id, id),
  CONSTRAINT fk_metadata_relationship_values_reference
    FOREIGN KEY (tenant_id, reference_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_metadata_relationship_values_sequence CHECK (sequence_no >= 0)
) ENGINE=InnoDB;
