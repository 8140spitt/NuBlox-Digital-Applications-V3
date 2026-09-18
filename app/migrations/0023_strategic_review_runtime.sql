-- NuBlox V3 MySQL
-- 0023: F01.07 Strategic Review using AGG-02-GOVERNANCE-MEETING.

CREATE TABLE governance_meetings (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  meeting_ref VARCHAR(191) NOT NULL,
  meeting_type VARCHAR(64) NOT NULL,
  governance_context_type VARCHAR(64) NOT NULL,
  governance_context_id VARCHAR(191) NOT NULL,
  scheduled_at VARCHAR(32) NOT NULL,
  actual_started_at VARCHAR(32) NULL,
  completed_at VARCHAR(32) NULL,
  location_channel VARCHAR(500) NULL,
  quorum_required INT UNSIGNED NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  minutes_summary TEXT NULL,
  next_review_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_governance_meeting_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_governance_meeting_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_governance_meeting_ref (tenant_id, meeting_ref),
  INDEX idx_governance_meeting_schedule (tenant_id, meeting_type, scheduled_at, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_meeting_attendees (
  meeting_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NOT NULL,
  attendance_role VARCHAR(64) NOT NULL,
  attendance_status VARCHAR(32) NOT NULL,
  PRIMARY KEY (meeting_id, party_id),
  CONSTRAINT fk_governance_meeting_attendee_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_governance_meeting_attendee_party FOREIGN KEY (party_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_meeting_agenda_items (
  id VARCHAR(36) PRIMARY KEY,
  meeting_id VARCHAR(36) NOT NULL,
  item_no INT UNSIGNED NOT NULL,
  subject VARCHAR(500) NOT NULL,
  purpose TEXT NOT NULL,
  required_outcome VARCHAR(64) NOT NULL,
  subject_type VARCHAR(64) NULL,
  subject_id VARCHAR(191) NULL,
  subject_version VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  CONSTRAINT fk_governance_meeting_agenda_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  UNIQUE KEY uq_governance_meeting_agenda_item (meeting_id, item_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE strategic_review_findings (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  meeting_id VARCHAR(36) NOT NULL,
  finding_type VARCHAR(64) NOT NULL,
  subject_type VARCHAR(64) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  subject_version VARCHAR(64) NULL,
  finding TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_strategic_review_finding_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_strategic_review_finding_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_strategic_review_finding_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_strategic_review_finding_subject (tenant_id, subject_type, subject_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_meeting_decisions (
  meeting_id VARCHAR(36) NOT NULL,
  decision_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (meeting_id, decision_id),
  CONSTRAINT fk_governance_meeting_decision_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_governance_meeting_decision FOREIGN KEY (decision_id) REFERENCES work_decisions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_meeting_actions (
  meeting_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (meeting_id, work_item_id),
  CONSTRAINT fk_governance_meeting_action_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_governance_meeting_action_work FOREIGN KEY (work_item_id) REFERENCES work_items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
