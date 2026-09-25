ALTER TABLE application_sessions
  ADD COLUMN authentication_strength VARCHAR(16) NOT NULL DEFAULT 'PASSWORD' AFTER person_id,
  ADD COLUMN mfa_verified_at DATETIME(6) NULL AFTER authentication_strength,
  ADD CONSTRAINT chk_application_sessions_authentication_strength CHECK (
    authentication_strength IN ('PASSWORD', 'MFA')
  );

CREATE TABLE application_mfa_enrollments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  method VARCHAR(16) NOT NULL DEFAULT 'TOTP',
  secret_ciphertext TEXT NOT NULL,
  secret_iv VARCHAR(64) NOT NULL,
  secret_tag VARCHAR(64) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  verified_at DATETIME(6) NULL,
  disabled_at DATETIME(6) NULL,
  last_used_at DATETIME(6) NULL,
  last_used_counter BIGINT UNSIGNED NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_application_mfa_enrollment_user_tenant_method (user_id, tenant_id, method),
  KEY ix_application_mfa_enrollment_tenant (tenant_id, status),
  CONSTRAINT fk_application_mfa_enrollment_membership
    FOREIGN KEY (user_id, tenant_id)
    REFERENCES application_user_tenants(user_id, tenant_id),
  CONSTRAINT chk_application_mfa_enrollment_method CHECK (
    method IN ('TOTP')
  ),
  CONSTRAINT chk_application_mfa_enrollment_status CHECK (
    status IN ('PENDING', 'ACTIVE', 'DISABLED')
  )
) ENGINE=InnoDB;

CREATE TABLE application_mfa_recovery_codes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  enrollment_id VARCHAR(64) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  code_hint VARCHAR(4) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  UNIQUE KEY uq_application_mfa_recovery_code_hash (code_hash),
  KEY ix_application_mfa_recovery_enrollment (enrollment_id, consumed_at),
  CONSTRAINT fk_application_mfa_recovery_enrollment
    FOREIGN KEY (enrollment_id) REFERENCES application_mfa_enrollments(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE application_mfa_login_challenges (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  return_to VARCHAR(1024) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_application_mfa_login_user (user_id, tenant_id, expires_at, consumed_at),
  CONSTRAINT fk_application_mfa_login_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id),
  CONSTRAINT chk_application_mfa_login_expiry CHECK (expires_at > created_at),
  CONSTRAINT chk_application_mfa_login_attempt_count CHECK (attempt_count <= 10)
) ENGINE=InnoDB;
