ALTER TABLE application_sessions
  ADD COLUMN id VARCHAR(64) NULL AFTER token_hash,
  ADD COLUMN client_user_agent VARCHAR(512) NULL AFTER mfa_verified_at,
  ADD COLUMN network_hash CHAR(64) NULL AFTER client_user_agent;

UPDATE application_sessions
   SET id = CONCAT('SESSION-', UUID())
 WHERE id IS NULL;

ALTER TABLE application_sessions
  MODIFY COLUMN id VARCHAR(64) NOT NULL,
  ADD UNIQUE KEY uq_application_sessions_id (id),
  ADD KEY ix_application_sessions_tenant_user (tenant_id, user_id, revoked_at, expires_at);
