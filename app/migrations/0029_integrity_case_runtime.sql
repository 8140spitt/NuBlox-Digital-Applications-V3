-- NuBlox V3 MySQL
-- 0029: F02.07 Ethics Governance using restricted AGG-21-CASE / INTEGRITY-CASE runtime.

CREATE TABLE integrity_cases (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  case_ref VARCHAR(191) NOT NULL,
  case_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  issue_summary TEXT NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  source_reference VARCHAR(500) NULL,
  reported_by_party_id VARCHAR(36) NULL,
  received_at VARCHAR(32) NOT NULL,
  severity VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  investigation_owner_party_id VARCHAR(36) NULL,
  impact_summary TEXT NULL,
  outcome_summary TEXT NULL,
  closed_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_integrity_case_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_integrity_case_reporter FOREIGN KEY (reported_by_party_id) REFERENCES parties(id),
  CONSTRAINT fk_integrity_case_owner FOREIGN KEY (investigation_owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_integrity_case_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_integrity_case_ref (tenant_id, case_ref),
  INDEX idx_integrity_case_status (tenant_id, status, received_at),
  INDEX idx_integrity_case_owner (tenant_id, investigation_owner_party_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_subjects (
  case_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  subject_role VARCHAR(64) NOT NULL,
  added_by_party_id VARCHAR(36) NOT NULL,
  added_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (case_id, party_id, subject_role),
  CONSTRAINT fk_integrity_case_subject_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_subject_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_integrity_case_subject_actor FOREIGN KEY (added_by_party_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_access (
  case_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  access_role VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  granted_by_party_id VARCHAR(36) NOT NULL,
  granted_at VARCHAR(32) NOT NULL,
  revoked_by_party_id VARCHAR(36) NULL,
  revoked_at VARCHAR(32) NULL,
  PRIMARY KEY (case_id, party_id),
  CONSTRAINT fk_integrity_case_access_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_access_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_integrity_case_access_grantor FOREIGN KEY (granted_by_party_id) REFERENCES parties(id),
  CONSTRAINT fk_integrity_case_access_revoker FOREIGN KEY (revoked_by_party_id) REFERENCES parties(id),
  INDEX idx_integrity_case_access_party (party_id, status, access_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_entries (
  id VARCHAR(36) PRIMARY KEY,
  case_id VARCHAR(36) NOT NULL,
  entry_type VARCHAR(64) NOT NULL,
  entry_summary TEXT NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_integrity_case_entry_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_entry_actor FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_integrity_case_entry_case (case_id, created_at, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_evidence (
  case_id VARCHAR(36) NOT NULL,
  evidence_item_id VARCHAR(36) NOT NULL,
  link_type VARCHAR(64) NOT NULL,
  linked_by_party_id VARCHAR(36) NOT NULL,
  linked_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (case_id, evidence_item_id),
  CONSTRAINT fk_integrity_case_evidence_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_evidence_item FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  CONSTRAINT fk_integrity_case_evidence_actor FOREIGN KEY (linked_by_party_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_decisions (
  case_id VARCHAR(36) NOT NULL,
  decision_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (case_id, decision_id),
  CONSTRAINT fk_integrity_case_decision_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_decision FOREIGN KEY (decision_id) REFERENCES work_decisions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE integrity_case_actions (
  case_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (case_id, work_item_id),
  CONSTRAINT fk_integrity_case_action_case FOREIGN KEY (case_id) REFERENCES integrity_cases(id),
  CONSTRAINT fk_integrity_case_action_work FOREIGN KEY (work_item_id) REFERENCES work_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
