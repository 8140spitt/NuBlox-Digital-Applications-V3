CREATE TABLE metadata_relationship_attribute_constraint_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  relationship_attribute_assignment_id VARCHAR(64) NOT NULL,
  constraint_definition_id VARCHAR(64) NOT NULL,
  sequence_no INT NOT NULL DEFAULT 0,
  mandatory BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_metadata_rel_attr_constraints_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_metadata_rel_attr_constraints_assignment_constraint
    (tenant_id,relationship_attribute_assignment_id,constraint_definition_id),
  KEY ix_metadata_rel_attr_constraints_assignment
    (tenant_id,relationship_attribute_assignment_id,status,sequence_no),
  CONSTRAINT fk_metadata_rel_attr_constraints_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_metadata_rel_attr_constraints_assignment
    FOREIGN KEY (tenant_id,relationship_attribute_assignment_id)
    REFERENCES metadata_relationship_attribute_assignments(tenant_id,id),
  CONSTRAINT fk_metadata_rel_attr_constraints_definition
    FOREIGN KEY (tenant_id,constraint_definition_id)
    REFERENCES metadata_constraint_definitions(tenant_id,id),
  CONSTRAINT chk_metadata_rel_attr_constraints_sequence CHECK (sequence_no >= 0),
  CONSTRAINT chk_metadata_rel_attr_constraints_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;
