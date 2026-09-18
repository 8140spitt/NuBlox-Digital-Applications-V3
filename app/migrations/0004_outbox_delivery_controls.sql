-- NuBlox V3 MySQL
-- 0004: transactional outbox delivery controls
-- Forward-only extension of the Wave 1 platform evidence spine.

ALTER TABLE outbox_messages
  ADD COLUMN locked_by VARCHAR(191) NULL AFTER attempts,
  ADD COLUMN locked_at VARCHAR(32) NULL AFTER locked_by,
  ADD COLUMN last_error TEXT NULL AFTER locked_at,
  ADD COLUMN dead_lettered_at VARCHAR(32) NULL AFTER published_at,
  ADD INDEX idx_outbox_claim (status, available_at, locked_at, created_at);
