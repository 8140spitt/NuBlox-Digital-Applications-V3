ALTER TABLE application_users
  ADD COLUMN email_verified_at DATETIME(6) NULL AFTER status;

UPDATE application_users
   SET email_verified_at = created_at
 WHERE email_verified_at IS NULL;

CREATE TABLE application_identity_challenges (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  email_normalized VARCHAR(320) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  consumed_at DATETIME(6) NULL,
  invalidated_at DATETIME(6) NULL,
  request_metadata JSON NULL,
  UNIQUE KEY uq_application_identity_challenge_token (token_hash),
  KEY ix_application_identity_challenge_active
    (user_id, tenant_id, purpose, consumed_at, invalidated_at, expires_at),
  CONSTRAINT fk_application_identity_challenge_user
    FOREIGN KEY (user_id) REFERENCES application_users(id),
  CONSTRAINT fk_application_identity_challenge_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_application_identity_challenge_purpose CHECK (
    purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
  ),
  CONSTRAINT chk_application_identity_challenge_expiry CHECK (
    expires_at > created_at
  )
) ENGINE=InnoDB;

CREATE TABLE application_identity_message_outbox (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  challenge_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  tenant_id VARCHAR(64) NOT NULL,
  destination VARCHAR(320) NOT NULL,
  message_type VARCHAR(32) NOT NULL,
  template_key VARCHAR(80) NOT NULL,
  action_path TEXT NOT NULL,
  payload JSON NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'QUEUED',
  queued_at DATETIME(6) NOT NULL,
  sent_at DATETIME(6) NULL,
  failed_at DATETIME(6) NULL,
  failure_message VARCHAR(1000) NULL,
  secret_purged_at DATETIME(6) NULL,
  KEY ix_application_identity_message_queue (status, queued_at),
  KEY ix_application_identity_message_tenant (tenant_id, status, queued_at),
  CONSTRAINT fk_application_identity_message_challenge
    FOREIGN KEY (challenge_id) REFERENCES application_identity_challenges(id),
  CONSTRAINT fk_application_identity_message_user
    FOREIGN KEY (user_id) REFERENCES application_users(id),
  CONSTRAINT fk_application_identity_message_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT chk_application_identity_message_type CHECK (
    message_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET')
  ),
  CONSTRAINT chk_application_identity_message_status CHECK (
    status IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED')
  )
) ENGINE=InnoDB;
