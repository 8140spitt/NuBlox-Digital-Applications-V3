CREATE TABLE security_classification_schemes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  scheme_kind VARCHAR(16) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_security_schemes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_security_schemes_tenant_code (tenant_id, code),
  CONSTRAINT fk_security_schemes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_security_schemes_kind CHECK (scheme_kind IN ('ORDINAL', 'CATEGORICAL')),
  CONSTRAINT chk_security_schemes_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE security_classification_levels (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scheme_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  rank_order INT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_security_levels_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_security_levels_scheme_code (tenant_id, scheme_id, code),
  UNIQUE KEY uq_security_levels_scheme_rank (tenant_id, scheme_id, rank_order),
  CONSTRAINT fk_security_levels_scheme FOREIGN KEY (tenant_id, scheme_id)
    REFERENCES security_classification_schemes(tenant_id, id),
  CONSTRAINT chk_security_levels_rank CHECK (rank_order IS NULL OR rank_order >= 0),
  CONSTRAINT chk_security_levels_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE security_classification_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  classification_level_id VARCHAR(64) NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_security_assignments_tenant_id_id (tenant_id, id),
  KEY ix_security_assignments_subject
    (tenant_id, subject_object_id, subject_version, status, effective_from, effective_to),
  KEY ix_security_assignments_level
    (tenant_id, classification_level_id, status),
  CONSTRAINT fk_security_assignments_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_security_assignments_level FOREIGN KEY (tenant_id, classification_level_id)
    REFERENCES security_classification_levels(tenant_id, id),
  CONSTRAINT chk_security_assignments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_security_assignments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE clearance_grants (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  principal_type VARCHAR(32) NOT NULL,
  principal_id VARCHAR(64) NOT NULL,
  classification_level_id VARCHAR(64) NOT NULL,
  include_lower_levels BOOLEAN NOT NULL DEFAULT FALSE,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(160) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_clearance_grants_tenant_id_id (tenant_id, id),
  KEY ix_clearance_grants_principal
    (tenant_id, principal_type, principal_id, status, effective_from, effective_to),
  KEY ix_clearance_grants_level
    (tenant_id, classification_level_id, status),
  CONSTRAINT fk_clearance_grants_level FOREIGN KEY (tenant_id, classification_level_id)
    REFERENCES security_classification_levels(tenant_id, id),
  CONSTRAINT chk_clearance_grants_principal_type CHECK (
    principal_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION')
  ),
  CONSTRAINT chk_clearance_grants_scope CHECK (
    (scope_type = 'TENANT' AND scope_id IS NULL)
    OR (scope_type <> 'TENANT' AND scope_id IS NOT NULL)
  ),
  CONSTRAINT chk_clearance_grants_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_clearance_grants_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE security_access_exceptions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  principal_type VARCHAR(32) NOT NULL,
  principal_id VARCHAR(64) NOT NULL,
  classification_level_id VARCHAR(64) NOT NULL,
  approval_decision_id VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_security_exceptions_tenant_id_id (tenant_id, id),
  KEY ix_security_exceptions_subject
    (tenant_id, subject_object_id, subject_version, status, effective_from, effective_to),
  KEY ix_security_exceptions_principal
    (tenant_id, principal_type, principal_id, status, effective_from, effective_to),
  CONSTRAINT fk_security_exceptions_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_security_exceptions_level FOREIGN KEY (tenant_id, classification_level_id)
    REFERENCES security_classification_levels(tenant_id, id),
  CONSTRAINT fk_security_exceptions_decision FOREIGN KEY (tenant_id, approval_decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_security_exceptions_principal_type CHECK (
    principal_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT', 'ORGANISATION')
  ),
  CONSTRAINT chk_security_exceptions_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_security_exceptions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.security_classification.read', 'Read security classification', 'View classification schemes, levels, assignments, clearance grants and approved access exceptions.'),
  ('platform.security_classification.manage', 'Manage security classification', 'Administer classification schemes, levels, assignments, clearance grants and approved access exceptions.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-025', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.security_classification.read'),
  ('ARP-PLATFORM-ADMIN-026', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.security_classification.manage');
