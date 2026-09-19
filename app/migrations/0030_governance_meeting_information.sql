-- NuBlox V3 MySQL
-- 0030: exact controlled-information references for Governance Meetings.

CREATE TABLE governance_meeting_information (
  meeting_id VARCHAR(36) NOT NULL,
  information_revision_id VARCHAR(36) NOT NULL,
  link_role VARCHAR(64) NOT NULL,
  linked_by_party_id VARCHAR(36) NOT NULL,
  linked_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (meeting_id, information_revision_id, link_role),
  CONSTRAINT fk_governance_meeting_information_meeting
    FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_governance_meeting_information_revision
    FOREIGN KEY (information_revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_governance_meeting_information_actor
    FOREIGN KEY (linked_by_party_id) REFERENCES parties(id),
  INDEX idx_governance_meeting_information_revision (information_revision_id, meeting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
