CREATE TABLE policy_scopes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  parent_policy_scope_id VARCHAR(64) NULL,
  scope_type VARCHAR(32) NOT NULL,
  scope_object_id VARCHAR(160) NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_policy_scopes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_policy_scopes_tenant_code (tenant_id, code),
  KEY ix_policy_scopes_parent (tenant_id, parent_policy_scope_id, status),
  KEY ix_policy_scopes_object (tenant_id, scope_type, scope_object_id, status),
  CONSTRAINT fk_policy_scopes_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_policy_scopes_parent FOREIGN KEY (tenant_id, parent_policy_scope_id)
    REFERENCES policy_scopes(tenant_id, id),
  CONSTRAINT chk_policy_scopes_type CHECK (
    scope_type IN (
      'TENANT', 'ORGANISATION', 'ORGANISATION_UNIT', 'PROGRAMME', 'PROJECT',
      'CONTRACT', 'WORK_PACKAGE', 'SITE', 'ASSET', 'SERVICE', 'CUSTOM'
    )
  ),
  CONSTRAINT chk_policy_scopes_object CHECK (
    (scope_type = 'TENANT' AND scope_object_id IS NULL)
    OR
    (scope_type <> 'TENANT' AND scope_object_id IS NOT NULL)
  ),
  CONSTRAINT chk_policy_scopes_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE policy_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  policy_type VARCHAR(32) NOT NULL,
  version INT NOT NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_policy_definitions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_policy_definitions_tenant_code_version (tenant_id, code, version),
  KEY ix_policy_definitions_type_status (tenant_id, policy_type, status),
  CONSTRAINT fk_policy_definitions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_policy_definitions_type CHECK (
    policy_type IN (
      'ACCESS', 'SECURITY', 'GOVERNANCE', 'CONFIGURATION',
      'CREATION', 'RETENTION', 'CUSTOM'
    )
  ),
  CONSTRAINT chk_policy_definitions_version CHECK (version > 0),
  CONSTRAINT chk_policy_definitions_period CHECK (
    effective_to IS NULL
    OR (effective_from IS NOT NULL AND effective_to >= effective_from)
  ),
  CONSTRAINT chk_policy_definitions_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE policy_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  policy_scope_id VARCHAR(64) NOT NULL,
  policy_definition_id VARCHAR(64) NOT NULL,
  assignment_mode VARCHAR(16) NOT NULL,
  precedence INT NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_policy_assignments_tenant_id_id (tenant_id, id),
  KEY ix_policy_assignments_scope_effective
    (tenant_id, policy_scope_id, status, effective_from, effective_to, precedence),
  KEY ix_policy_assignments_definition
    (tenant_id, policy_definition_id, status),
  CONSTRAINT fk_policy_assignments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_policy_assignments_scope FOREIGN KEY (tenant_id, policy_scope_id)
    REFERENCES policy_scopes(tenant_id, id),
  CONSTRAINT fk_policy_assignments_definition FOREIGN KEY (tenant_id, policy_definition_id)
    REFERENCES policy_definitions(tenant_id, id),
  CONSTRAINT chk_policy_assignments_mode CHECK (
    assignment_mode IN ('SUPPLEMENT', 'OVERRIDE', 'BLOCK')
  ),
  CONSTRAINT chk_policy_assignments_precedence CHECK (precedence >= 0),
  CONSTRAINT chk_policy_assignments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_policy_assignments_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.policy.read', 'Read governed policy', 'View policy scopes, versioned policy definitions and policy assignments in the tenant.'),
  ('platform.policy.manage', 'Manage governed policy', 'Create and maintain policy scopes, versioned policy definitions and policy assignments.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-023', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.policy.read'),
  ('ARP-PLATFORM-ADMIN-024', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.policy.manage');
