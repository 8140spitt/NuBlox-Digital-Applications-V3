ALTER TABLE source_approvals
  ADD COLUMN decision_fingerprint VARCHAR(120) NULL AFTER approval_decision_id;

UPDATE source_approvals sa
JOIN decisions d
  ON d.tenant_id = sa.tenant_id
 AND d.id = sa.approval_decision_id
SET sa.decision_fingerprint = d.subject_version
WHERE sa.decision_fingerprint IS NULL;

ALTER TABLE source_approvals
  MODIFY decision_fingerprint VARCHAR(120) NOT NULL;
