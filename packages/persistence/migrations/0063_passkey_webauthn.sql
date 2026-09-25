ALTER TABLE application_sessions
  ADD COLUMN authentication_method VARCHAR(32) NOT NULL DEFAULT 'PASSWORD' AFTER authentication_strength,
  ADD CONSTRAINT chk_application_sessions_authentication_method CHECK (
    authentication_method IN ('PASSWORD', 'PASSWORD_TOTP', 'PASSKEY')
  );

UPDATE application_sessions
   SET authentication_method = CASE
     WHEN authentication_strength = 'MFA' THEN 'PASSWORD_TOTP'
     ELSE 'PASSWORD'
   END;

CREATE TABLE application_passkey_profiles (
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  user_handle VARCHAR(128) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6),
  PRIMARY KEY (user_id, tenant_id),
  UNIQUE KEY uq_application_passkey_profile_handle (user_handle),
  CONSTRAINT fk_application_passkey_profile_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE application_passkeys (
  credential_id VARCHAR(1024) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  user_handle VARCHAR(128) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  public_key_cose BLOB NOT NULL,
  algorithm INT NOT NULL,
  signature_counter BIGINT UNSIGNED NOT NULL DEFAULT 0,
  transports VARCHAR(255) NULL,
  backup_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT UTC_TIMESTAMP(6),
  last_used_at DATETIME(6) NULL,
  revoked_at DATETIME(6) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_application_passkeys_membership (user_id, tenant_id, status),
  KEY ix_application_passkeys_tenant (tenant_id, status),
  CONSTRAINT fk_application_passkey_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_application_passkey_profile
    FOREIGN KEY (user_id, tenant_id)
    REFERENCES application_passkey_profiles(user_id, tenant_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_application_passkey_algorithm CHECK (algorithm IN (-7)),
  CONSTRAINT chk_application_passkey_status CHECK (
    status IN ('ACTIVE', 'REVOKED')
  )
) ENGINE=InnoDB;

CREATE TABLE application_passkey_challenges (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  challenge VARCHAR(128) NOT NULL,
  ceremony VARCHAR(16) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  rp_id VARCHAR(255) NOT NULL,
  expected_origin VARCHAR(512) NOT NULL,
  return_to VARCHAR(1024) NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_application_passkey_challenge_membership
    (user_id, tenant_id, ceremony, expires_at, consumed_at),
  CONSTRAINT fk_application_passkey_challenge_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id)
    ON DELETE CASCADE,
  CONSTRAINT chk_application_passkey_challenge_ceremony CHECK (
    ceremony IN ('REGISTER', 'AUTHENTICATE')
  ),
  CONSTRAINT chk_application_passkey_challenge_expiry CHECK (
    expires_at > created_at
  ),
  CONSTRAINT chk_application_passkey_challenge_attempts CHECK (
    attempt_count <= 10
  )
) ENGINE=InnoDB;
