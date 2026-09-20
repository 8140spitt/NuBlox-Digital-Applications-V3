-- NuBlox V3 MySQL
-- 0040: managed deliverable review, approval and acceptance control.
-- Preserves immutable Decision evidence separately from Deliverable Item state transitions.

CREATE TABLE deliverable_stage_decisions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  deliverable_item_id VARCHAR(36) NOT NULL,
  stage VARCHAR(32) NOT NULL,
  item_version BIGINT UNSIGNED NOT NULL,
  revision_label VARCHAR(64) NULL,
  decision_id VARCHAR(36) NOT NULL,
  outcome VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_deliverable_stage_decision_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_deliverable_stage_decision_item
    FOREIGN KEY (deliverable_item_id) REFERENCES deliverable_items(id),
  CONSTRAINT fk_deliverable_stage_decision_decision
    FOREIGN KEY (decision_id) REFERENCES work_decisions(id),
  UNIQUE KEY uq_deliverable_stage_decision (tenant_id, decision_id),
  INDEX idx_deliverable_stage_item
    (tenant_id, deliverable_item_id, stage, created_at),
  INDEX idx_deliverable_stage_outcome
    (tenant_id, stage, outcome, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
