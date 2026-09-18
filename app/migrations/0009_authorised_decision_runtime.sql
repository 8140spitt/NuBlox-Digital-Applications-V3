-- NuBlox V3 MySQL
-- 0009: authorised decision runtime
-- Implements AGG-27-DECISION as immutable attributable outcome evidence.

CREATE TABLE work_decisions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  decision_type VARCHAR(64) NOT NULL,
  request_type VARCHAR(64) NULL,
  request_id VARCHAR(191) NULL,
  subject_type VARCHAR(128) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  outcome VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  decider_party_id VARCHAR(36) NOT NULL,
  authority_type VARCHAR(191) NULL,
  authority_grant_id VARCHAR(36) NULL,
  authority_scope_type VARCHAR(64) NULL,
  authority_scope_id VARCHAR(191) NULL,
  authority_currency_code CHAR(3) NULL,
  authority_value DECIMAL(19,4) NULL,
  authority_basis VARCHAR(500) NOT NULL,
  supersedes_decision_id VARCHAR(36) NULL,
  decided_at VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_work_decision_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_work_decision_decider
    FOREIGN KEY (decider_party_id) REFERENCES parties(id),
  CONSTRAINT fk_work_decision_authority_grant
    FOREIGN KEY (authority_grant_id) REFERENCES delegated_authorities(id),
  CONSTRAINT fk_work_decision_supersedes
    FOREIGN KEY (supersedes_decision_id) REFERENCES work_decisions(id),
  INDEX idx_work_decision_subject (tenant_id, subject_type, subject_id, decided_at),
  INDEX idx_work_decision_request (tenant_id, request_type, request_id, decided_at),
  INDEX idx_work_decision_decider (tenant_id, decider_party_id, decided_at),
  INDEX idx_work_decision_supersedes (tenant_id, supersedes_decision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
