CREATE TABLE access_roles (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  catalogue_scope VARCHAR(16) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  catalogue_owner_key VARCHAR(64)
    GENERATED ALWAYS AS (COALESCE(tenant_id, '__PLATFORM__')) STORED,
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_access_roles_scope_code (catalogue_scope, catalogue_owner_key, code),
  KEY ix_access_roles_tenant_status (tenant_id, status),
  CONSTRAINT fk_access_roles_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_access_roles_catalogue_scope CHECK (
    catalogue_scope IN ('PLATFORM', 'TENANT')
  ),
  CONSTRAINT chk_access_roles_tenant_scope CHECK (
    (catalogue_scope = 'PLATFORM' AND tenant_id IS NULL)
    OR
    (catalogue_scope = 'TENANT' AND tenant_id IS NOT NULL)
  ),
  CONSTRAINT chk_access_roles_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE access_role_permissions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  access_role_id VARCHAR(64) NOT NULL,
  permission_key VARCHAR(160) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_access_role_permissions_role_permission (access_role_id, permission_key),
  KEY ix_access_role_permissions_permission (permission_key, access_role_id),
  CONSTRAINT fk_access_role_permissions_role FOREIGN KEY (access_role_id)
    REFERENCES access_roles(id),
  CONSTRAINT fk_access_role_permissions_permission FOREIGN KEY (permission_key)
    REFERENCES permission_definitions(permission_key)
) ENGINE=InnoDB;

CREATE TABLE access_role_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  access_role_id VARCHAR(64) NOT NULL,
  principal_type VARCHAR(32) NOT NULL,
  principal_id VARCHAR(64) NOT NULL,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(160) NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_access_role_assignments_tenant_id_id (tenant_id, id),
  KEY ix_access_role_assignments_principal
    (tenant_id, principal_type, principal_id, effective_from, effective_to, status),
  KEY ix_access_role_assignments_scope
    (tenant_id, scope_type, scope_id, status),
  CONSTRAINT fk_access_role_assignments_tenant FOREIGN KEY (tenant_id)
    REFERENCES tenants(id),
  CONSTRAINT fk_access_role_assignments_role FOREIGN KEY (access_role_id)
    REFERENCES access_roles(id),
  CONSTRAINT chk_access_role_assignments_principal_type CHECK (
    principal_type IN ('PERSON', 'POSITION', 'ORGANISATION_UNIT')
  ),
  CONSTRAINT chk_access_role_assignments_scope CHECK (
    (scope_type = 'TENANT' AND scope_id IS NULL)
    OR
    (scope_type <> 'TENANT' AND scope_id IS NOT NULL)
  ),
  CONSTRAINT chk_access_role_assignments_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_access_role_assignments_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;
