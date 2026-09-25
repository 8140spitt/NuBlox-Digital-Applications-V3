CREATE TABLE application_auth_throttle_buckets (
  bucket_key CHAR(64) NOT NULL PRIMARY KEY,
  purpose VARCHAR(40) NOT NULL,
  dimension VARCHAR(32) NOT NULL,
  subject_hash CHAR(64) NULL,
  network_hash CHAR(64) NOT NULL,
  attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME(6) NOT NULL,
  last_attempt_at DATETIME(6) NOT NULL,
  blocked_until DATETIME(6) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_application_auth_throttle_blocked (purpose, blocked_until),
  KEY ix_application_auth_throttle_network (purpose, network_hash, window_started_at),
  CONSTRAINT chk_application_auth_throttle_purpose CHECK (
    purpose IN ('LOGIN', 'TENANT_REGISTRATION', 'EMAIL_VERIFICATION_RESEND', 'PASSWORD_RESET_REQUEST')
  ),
  CONSTRAINT chk_application_auth_throttle_dimension CHECK (
    dimension IN ('SUBJECT_NETWORK', 'NETWORK')
  )
) ENGINE=InnoDB;
