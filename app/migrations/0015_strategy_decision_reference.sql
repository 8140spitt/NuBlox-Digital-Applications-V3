-- NuBlox V3 MySQL
-- 0015: bind Strategy Framework review outcomes to immutable shared Decision evidence.

ALTER TABLE strategy_framework_versions
  ADD COLUMN decision_id VARCHAR(36) NULL AFTER decision_note,
  ADD CONSTRAINT fk_strategy_version_decision
    FOREIGN KEY (decision_id) REFERENCES work_decisions(id),
  ADD INDEX idx_strategy_version_decision (decision_id);
