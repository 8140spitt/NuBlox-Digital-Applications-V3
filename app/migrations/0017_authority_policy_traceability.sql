-- NuBlox V3 MySQL
-- 0017: exact authority-policy traceability
-- Decisions and approved Delegated Authority grants retain the published policy version that governed them.

ALTER TABLE approval_authority_rule_versions
  ADD UNIQUE KEY uq_approval_authority_version_rule_pair
    (id, approval_authority_rule_id);

ALTER TABLE delegated_authority_rule_versions
  ADD UNIQUE KEY uq_delegated_authority_version_rule_pair
    (id, delegated_authority_rule_id);

ALTER TABLE work_decisions
  ADD COLUMN approval_policy_rule_id VARCHAR(36) NULL AFTER authority_basis,
  ADD COLUMN approval_policy_version_id VARCHAR(36) NULL AFTER approval_policy_rule_id,
  ADD CONSTRAINT fk_work_decision_approval_policy_pair
    FOREIGN KEY (approval_policy_version_id, approval_policy_rule_id)
    REFERENCES approval_authority_rule_versions(id, approval_authority_rule_id),
  ADD INDEX idx_work_decision_approval_policy
    (tenant_id, approval_policy_rule_id, approval_policy_version_id);

ALTER TABLE delegated_authorities
  ADD COLUMN policy_rule_id VARCHAR(36) NULL AFTER revocation_reason,
  ADD COLUMN policy_version_id VARCHAR(36) NULL AFTER policy_rule_id,
  ADD CONSTRAINT fk_delegated_authority_policy_pair
    FOREIGN KEY (policy_version_id, policy_rule_id)
    REFERENCES delegated_authority_rule_versions(id, delegated_authority_rule_id),
  ADD INDEX idx_delegated_authority_policy
    (tenant_id, policy_rule_id, policy_version_id);
