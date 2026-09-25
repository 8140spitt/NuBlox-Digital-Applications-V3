CREATE TABLE tenant_authentication_policies (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  mfa_requirement VARCHAR(16) NOT NULL DEFAULT 'OPTIONAL',
  session_ttl_minutes INT UNSIGNED NOT NULL DEFAULT 720,
  idle_timeout_minutes INT UNSIGNED NOT NULL DEFAULT 120,
  max_active_sessions INT UNSIGNED NOT NULL DEFAULT 10,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_tenant_authentication_policy_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_tenant_authentication_policy_mfa CHECK (
    mfa_requirement IN ('OPTIONAL', 'REQUIRED')
  ),
  CONSTRAINT chk_tenant_authentication_policy_ttl CHECK (
    session_ttl_minutes BETWEEN 15 AND 1440
  ),
  CONSTRAINT chk_tenant_authentication_policy_idle CHECK (
    idle_timeout_minutes BETWEEN 5 AND 720
  ),
  CONSTRAINT chk_tenant_authentication_policy_max_sessions CHECK (
    max_active_sessions BETWEEN 1 AND 20
  )
) ENGINE=InnoDB;

INSERT IGNORE INTO tenant_authentication_policies
  (tenant_id, mfa_requirement, session_ttl_minutes, idle_timeout_minutes, max_active_sessions)
SELECT id, 'OPTIONAL', 720, 120, 10
  FROM tenants;

ALTER TABLE application_mfa_login_challenges
  ADD COLUMN mode VARCHAR(16) NOT NULL DEFAULT 'VERIFY' AFTER person_id,
  ADD CONSTRAINT chk_application_mfa_login_mode CHECK (
    mode IN ('VERIFY', 'ENROLL')
  );
