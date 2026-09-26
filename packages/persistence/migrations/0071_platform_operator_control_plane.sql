CREATE TABLE platform_operators (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  email_normalized VARCHAR(320) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(512) NOT NULL,
  role VARCHAR(24) NOT NULL DEFAULT 'SUPER_ADMIN',
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  last_login_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_platform_operators_email (email_normalized),
  CONSTRAINT chk_platform_operators_role CHECK (
    role IN ('SUPER_ADMIN', 'OPERATOR', 'READ_ONLY')
  ),
  CONSTRAINT chk_platform_operators_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE platform_operator_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  operator_id VARCHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  last_seen_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  user_agent VARCHAR(512) NULL,
  KEY ix_platform_operator_sessions_operator (operator_id, expires_at, revoked_at),
  KEY ix_platform_operator_sessions_expiry (expires_at, revoked_at),
  CONSTRAINT fk_platform_operator_sessions_operator
    FOREIGN KEY (operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_operator_sessions_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB;

CREATE TABLE platform_tenant_controls (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  lifecycle_state VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  reason TEXT NULL,
  deletion_requested_at DATETIME(6) NULL,
  deleted_at DATETIME(6) NULL,
  updated_by_operator_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_platform_tenant_controls_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_platform_tenant_controls_operator
    FOREIGN KEY (updated_by_operator_id) REFERENCES platform_operators(id),
  CONSTRAINT chk_platform_tenant_controls_state CHECK (
    lifecycle_state IN ('ACTIVE', 'SUSPENDED', 'DELETION_REQUESTED', 'DELETED')
  )
) ENGINE=InnoDB;

INSERT INTO platform_tenant_controls (tenant_id, lifecycle_state)
SELECT id, CASE WHEN status = 'ACTIVE' THEN 'ACTIVE' ELSE 'SUSPENDED' END
  FROM tenants;

CREATE TABLE platform_operator_audit_entries (
  audit_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  operator_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NULL,
  action VARCHAR(80) NOT NULL,
  reason TEXT NULL,
  payload JSON NULL,
  occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_platform_operator_audit_operator (operator_id, occurred_at),
  KEY ix_platform_operator_audit_tenant (tenant_id, occurred_at),
  CONSTRAINT fk_platform_operator_audit_operator
    FOREIGN KEY (operator_id) REFERENCES platform_operators(id),
  CONSTRAINT fk_platform_operator_audit_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
) ENGINE=InnoDB;
