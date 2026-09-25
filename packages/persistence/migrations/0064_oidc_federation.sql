CREATE TABLE application_oidc_providers (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  issuer_url VARCHAR(512) NOT NULL,
  issuer_hash CHAR(64) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  client_secret_ciphertext TEXT NOT NULL,
  client_secret_iv VARCHAR(64) NOT NULL,
  client_secret_tag VARCHAR(64) NOT NULL,
  scopes VARCHAR(512) NOT NULL DEFAULT 'openid profile email',
  session_assurance VARCHAR(16) NOT NULL DEFAULT 'PASSWORD',
  email_claim VARCHAR(64) NOT NULL DEFAULT 'email',
  trust_email_claim BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NOT NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_application_oidc_provider_name (tenant_id, name),
  UNIQUE KEY uq_application_oidc_provider_client (tenant_id, issuer_hash, client_id),
  KEY ix_application_oidc_provider_status (tenant_id, status),
  CONSTRAINT fk_application_oidc_provider_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_application_oidc_provider_assurance CHECK (
    session_assurance IN ('PASSWORD', 'MFA')
  ),
  CONSTRAINT chk_application_oidc_provider_status CHECK (
    status IN ('ACTIVE', 'DISABLED')
  )
) ENGINE=InnoDB;

ALTER TABLE application_sessions
  DROP CHECK chk_application_sessions_authentication_method,
  ADD COLUMN authentication_provider_id VARCHAR(64) NULL AFTER authentication_method,
  ADD CONSTRAINT chk_application_sessions_authentication_method CHECK (
    authentication_method IN ('PASSWORD', 'PASSWORD_TOTP', 'PASSKEY', 'OIDC', 'OIDC_TOTP')
  ),
  ADD CONSTRAINT chk_application_sessions_provider_binding CHECK (
    (authentication_method IN ('OIDC', 'OIDC_TOTP') AND authentication_provider_id IS NOT NULL)
    OR
    (authentication_method NOT IN ('OIDC', 'OIDC_TOTP') AND authentication_provider_id IS NULL)
  ),
  ADD CONSTRAINT fk_application_sessions_authentication_provider
    FOREIGN KEY (authentication_provider_id)
    REFERENCES application_oidc_providers(id)
    ON DELETE RESTRICT;

CREATE TABLE application_oidc_login_challenges (
  state_hash CHAR(64) NOT NULL PRIMARY KEY,
  provider_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  nonce VARCHAR(128) NOT NULL,
  code_verifier_ciphertext TEXT NOT NULL,
  code_verifier_iv VARCHAR(64) NOT NULL,
  code_verifier_tag VARCHAR(64) NOT NULL,
  return_to VARCHAR(1024) NOT NULL,
  redirect_uri VARCHAR(1024) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_application_oidc_challenge_provider
    (provider_id, tenant_id, expires_at, consumed_at),
  CONSTRAINT fk_application_oidc_challenge_provider
    FOREIGN KEY (provider_id) REFERENCES application_oidc_providers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_application_oidc_challenge_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    ON DELETE CASCADE,
  CONSTRAINT chk_application_oidc_challenge_expiry CHECK (
    expires_at > created_at
  ),
  CONSTRAINT chk_application_oidc_challenge_attempts CHECK (
    attempt_count <= 10
  )
) ENGINE=InnoDB;

CREATE TABLE application_federated_identities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  provider_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  subject VARCHAR(512) NOT NULL,
  subject_hash CHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  person_id VARCHAR(64) NOT NULL,
  email_at_link VARCHAR(320) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_login_at DATETIME(6) NULL,
  UNIQUE KEY uq_application_federated_subject (provider_id, subject_hash),
  UNIQUE KEY uq_application_federated_membership (provider_id, user_id, tenant_id),
  KEY ix_application_federated_identity_membership (tenant_id, user_id),
  CONSTRAINT fk_application_federated_provider
    FOREIGN KEY (provider_id) REFERENCES application_oidc_providers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_application_federated_membership
    FOREIGN KEY (user_id, tenant_id, person_id)
    REFERENCES application_user_tenants(user_id, tenant_id, person_id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE application_mfa_login_challenges
  ADD COLUMN base_authentication_method VARCHAR(16) NOT NULL DEFAULT 'PASSWORD' AFTER mode,
  ADD COLUMN authentication_provider_id VARCHAR(64) NULL AFTER base_authentication_method,
  ADD CONSTRAINT chk_application_mfa_login_base_method CHECK (
    base_authentication_method IN ('PASSWORD', 'OIDC')
  ),
  ADD CONSTRAINT chk_application_mfa_login_provider_binding CHECK (
    (base_authentication_method = 'OIDC' AND authentication_provider_id IS NOT NULL)
    OR
    (base_authentication_method = 'PASSWORD' AND authentication_provider_id IS NULL)
  ),
  ADD CONSTRAINT fk_application_mfa_login_authentication_provider
    FOREIGN KEY (authentication_provider_id)
    REFERENCES application_oidc_providers(id)
    ON DELETE CASCADE;
