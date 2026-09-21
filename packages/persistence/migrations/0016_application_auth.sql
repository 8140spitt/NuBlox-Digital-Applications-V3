CREATE TABLE application_users (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  email VARCHAR(320) NOT NULL,
  email_normalized VARCHAR(320) NOT NULL,
  password_hash VARCHAR(512) NOT NULL,
  status VARCHAR(16) NOT NULL,
  password_changed_at DATETIME(6) NOT NULL,
  last_login_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_application_users_email_normalized (email_normalized),
  CONSTRAINT chk_application_users_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE application_user_tenants (
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, tenant_id),
  UNIQUE KEY uq_application_user_tenants_person (tenant_id, person_id),
  UNIQUE KEY uq_application_user_tenants_membership (user_id, tenant_id, person_id),
  KEY ix_application_user_tenants_user_default (user_id, is_default, status),
  CONSTRAINT fk_application_user_tenants_user
    FOREIGN KEY (user_id) REFERENCES application_users(id),
  CONSTRAINT fk_application_user_tenants_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_application_user_tenants_person
    FOREIGN KEY (tenant_id, person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_application_user_tenants_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE application_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  last_seen_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6) NULL,
  KEY ix_application_sessions_user (user_id, expires_at),
  KEY ix_application_sessions_expiry (expires_at, revoked_at),
  CONSTRAINT fk_application_sessions_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id),
  CONSTRAINT chk_application_sessions_expiry CHECK (expires_at > created_at)
) ENGINE=InnoDB;

CREATE TABLE application_auth_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  tenant_id VARCHAR(64) NULL,
  email_normalized VARCHAR(320) NULL,
  event_type VARCHAR(48) NOT NULL,
  outcome VARCHAR(16) NOT NULL,
  occurred_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  metadata JSON NULL,
  KEY ix_application_auth_events_user (user_id, occurred_at),
  KEY ix_application_auth_events_tenant (tenant_id, occurred_at),
  CONSTRAINT fk_application_auth_events_user
    FOREIGN KEY (user_id) REFERENCES application_users(id),
  CONSTRAINT fk_application_auth_events_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_application_auth_events_outcome CHECK (outcome IN ('SUCCESS', 'DENIED', 'ERROR'))
) ENGINE=InnoDB;
