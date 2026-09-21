CREATE TABLE access_permission_requests (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  requestor_person_id VARCHAR(64) NOT NULL,
  permission_key VARCHAR(160) NOT NULL,
  scope_type VARCHAR(80) NOT NULL,
  scope_id VARCHAR(160) NULL,
  reason TEXT NOT NULL,
  status VARCHAR(16) NOT NULL,
  requested_at DATETIME(6) NOT NULL,
  resolved_by_person_id VARCHAR(64) NULL,
  resolved_at DATETIME(6) NULL,
  resolution_reason TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_access_permission_requests_pending
    (tenant_id, status, requested_at),
  KEY ix_access_permission_requests_requestor
    (tenant_id, requestor_person_id, status, requested_at),
  KEY ix_access_permission_requests_permission
    (tenant_id, permission_key, scope_type, scope_id, status),
  CONSTRAINT fk_access_permission_requests_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_access_permission_requests_requestor
    FOREIGN KEY (tenant_id, requestor_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_access_permission_requests_permission
    FOREIGN KEY (permission_key) REFERENCES permission_definitions(permission_key),
  CONSTRAINT fk_access_permission_requests_resolver
    FOREIGN KEY (tenant_id, resolved_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_access_permission_requests_scope CHECK (
    (scope_type = 'TENANT' AND scope_id IS NULL)
    OR
    (scope_type <> 'TENANT' AND scope_id IS NOT NULL)
  ),
  CONSTRAINT chk_access_permission_requests_status CHECK (
    status IN ('PENDING', 'FULFILLED', 'REJECTED', 'CANCELLED')
  ),
  CONSTRAINT chk_access_permission_requests_resolution CHECK (
    (status = 'PENDING' AND resolved_by_person_id IS NULL AND resolved_at IS NULL)
    OR
    (status <> 'PENDING' AND resolved_by_person_id IS NOT NULL AND resolved_at IS NOT NULL)
  )
) ENGINE=InnoDB;
