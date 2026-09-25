ALTER TABLE application_identity_message_outbox
  ADD COLUMN attempt_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER status,
  ADD COLUMN last_attempt_at DATETIME(6) NULL AFTER attempt_count,
  ADD COLUMN next_attempt_at DATETIME(6) NULL AFTER last_attempt_at,
  ADD CONSTRAINT chk_application_identity_message_attempt_count CHECK (
    attempt_count <= 20
  );

UPDATE application_identity_message_outbox
   SET next_attempt_at = queued_at
 WHERE status IN ('QUEUED', 'FAILED')
   AND next_attempt_at IS NULL;

ALTER TABLE application_identity_message_outbox
  ADD KEY ix_application_identity_message_retry
    (status, next_attempt_at, attempt_count);
