-- NuBlox V3 MySQL
-- 0031: F03 Enterprise Performance Management extensions over AGG-02-PERFORMANCE.

CREATE TABLE performance_scorecards (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  scorecard_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_scorecard_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_scorecard_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_performance_scorecard_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_scorecard_ref (tenant_id, scorecard_ref),
  INDEX idx_performance_scorecard_scope (tenant_id, scope_type, scope_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_scorecard_nodes (
  id VARCHAR(36) PRIMARY KEY,
  scorecard_id VARCHAR(36) NOT NULL,
  parent_node_id VARCHAR(36) NULL,
  node_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_performance_scorecard_node_scorecard FOREIGN KEY (scorecard_id) REFERENCES performance_scorecards(id),
  CONSTRAINT fk_performance_scorecard_node_parent FOREIGN KEY (parent_node_id) REFERENCES performance_scorecard_nodes(id),
  UNIQUE KEY uq_performance_scorecard_node_key (scorecard_id, node_key),
  INDEX idx_performance_scorecard_node_parent (scorecard_id, parent_node_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_scorecard_kpis (
  scorecard_id VARCHAR(36) NOT NULL,
  node_id VARCHAR(36) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  weight DECIMAL(18,8) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (scorecard_id, node_id, kpi_id),
  CONSTRAINT fk_performance_scorecard_kpi_scorecard FOREIGN KEY (scorecard_id) REFERENCES performance_scorecards(id),
  CONSTRAINT fk_performance_scorecard_kpi_node FOREIGN KEY (node_id) REFERENCES performance_scorecard_nodes(id),
  CONSTRAINT fk_performance_scorecard_kpi_root FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_scorecard_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  INDEX idx_performance_scorecard_kpi_lookup (scorecard_id, sort_order, kpi_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  snapshot_ref VARCHAR(191) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  period_start VARCHAR(32) NOT NULL,
  period_end VARCHAR(32) NOT NULL,
  as_of_at VARCHAR(32) NOT NULL,
  calculation_rules_json JSON NOT NULL,
  quality_status VARCHAR(32) NOT NULL,
  completeness_percent DECIMAL(9,4) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  review_decision_id VARCHAR(36) NULL,
  reviewed_at VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  supersedes_snapshot_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_snapshot_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_snapshot_decision FOREIGN KEY (review_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_performance_snapshot_supersedes FOREIGN KEY (supersedes_snapshot_id) REFERENCES performance_snapshots(id),
  CONSTRAINT fk_performance_snapshot_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_performance_snapshot_ref (tenant_id, snapshot_ref),
  INDEX idx_performance_snapshot_scope (tenant_id, scope_type, scope_id, period_start, period_end, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_snapshot_items (
  id VARCHAR(36) PRIMARY KEY,
  snapshot_id VARCHAR(36) NOT NULL,
  kpi_id VARCHAR(36) NOT NULL,
  kpi_version_no INT UNSIGNED NOT NULL,
  observation_id VARCHAR(36) NULL,
  target_id VARCHAR(36) NULL,
  actual_value DECIMAL(30,10) NULL,
  target_value DECIMAL(30,10) NULL,
  variance_value DECIMAL(30,10) NULL,
  variance_percent DECIMAL(30,10) NULL,
  performance_status VARCHAR(32) NOT NULL,
  source_quality_status VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_snapshot_item_snapshot FOREIGN KEY (snapshot_id) REFERENCES performance_snapshots(id),
  CONSTRAINT fk_performance_snapshot_item_kpi FOREIGN KEY (kpi_id) REFERENCES performance_kpis(id),
  CONSTRAINT fk_performance_snapshot_item_kpi_version FOREIGN KEY (kpi_id, kpi_version_no)
    REFERENCES performance_kpi_versions(kpi_id, version_no),
  CONSTRAINT fk_performance_snapshot_item_observation FOREIGN KEY (observation_id) REFERENCES performance_observations(id),
  CONSTRAINT fk_performance_snapshot_item_target FOREIGN KEY (target_id) REFERENCES performance_targets(id),
  UNIQUE KEY uq_performance_snapshot_item_kpi (snapshot_id, kpi_id),
  INDEX idx_performance_snapshot_item_status (snapshot_id, performance_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_snapshot_distributions (
  id VARCHAR(36) PRIMARY KEY,
  snapshot_id VARCHAR(36) NOT NULL,
  recipient_party_id VARCHAR(36) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  distribution_reference VARCHAR(500) NULL,
  distributed_by_party_id VARCHAR(36) NOT NULL,
  distributed_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_snapshot_distribution_snapshot FOREIGN KEY (snapshot_id) REFERENCES performance_snapshots(id),
  CONSTRAINT fk_performance_snapshot_distribution_recipient FOREIGN KEY (recipient_party_id) REFERENCES parties(id),
  CONSTRAINT fk_performance_snapshot_distribution_actor FOREIGN KEY (distributed_by_party_id) REFERENCES parties(id),
  INDEX idx_performance_snapshot_distribution (snapshot_id, distributed_at, recipient_party_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_target_benchmark_basis (
  target_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  benchmark_type VARCHAR(64) NOT NULL,
  source_reference VARCHAR(500) NOT NULL,
  source_as_of VARCHAR(32) NOT NULL,
  comparator_scope VARCHAR(500) NOT NULL,
  benchmark_value DECIMAL(30,10) NOT NULL,
  evidence_item_id VARCHAR(36) NULL,
  approval_decision_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_benchmark_target FOREIGN KEY (target_id) REFERENCES performance_targets(id),
  CONSTRAINT fk_performance_benchmark_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_benchmark_evidence FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  CONSTRAINT fk_performance_benchmark_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_performance_benchmark_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_performance_benchmark_status (tenant_id, status, source_as_of)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_benefit_profiles (
  target_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  benefit_type VARCHAR(64) NOT NULL,
  transformation_subject_type VARCHAR(64) NOT NULL,
  transformation_subject_id VARCHAR(191) NOT NULL,
  benefit_owner_party_id VARCHAR(36) NOT NULL,
  value_category VARCHAR(64) NOT NULL,
  baseline_id VARCHAR(36) NOT NULL,
  benefit_statement TEXT NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_benefit_target FOREIGN KEY (target_id) REFERENCES performance_targets(id),
  CONSTRAINT fk_performance_benefit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_performance_benefit_owner FOREIGN KEY (benefit_owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_performance_benefit_baseline FOREIGN KEY (baseline_id) REFERENCES performance_baselines(id),
  CONSTRAINT fk_performance_benefit_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_performance_benefit_subject (tenant_id, transformation_subject_type, transformation_subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE performance_benefit_validations (
  id VARCHAR(36) PRIMARY KEY,
  target_id VARCHAR(36) NOT NULL,
  observation_id VARCHAR(36) NOT NULL,
  validation_status VARCHAR(32) NOT NULL,
  realised_value DECIMAL(30,10) NOT NULL,
  evidence_item_id VARCHAR(36) NULL,
  validation_note TEXT NOT NULL,
  validated_by_party_id VARCHAR(36) NOT NULL,
  validated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_performance_benefit_validation_target FOREIGN KEY (target_id) REFERENCES performance_benefit_profiles(target_id),
  CONSTRAINT fk_performance_benefit_validation_observation FOREIGN KEY (observation_id) REFERENCES performance_observations(id),
  CONSTRAINT fk_performance_benefit_validation_evidence FOREIGN KEY (evidence_item_id) REFERENCES evidence_items(id),
  CONSTRAINT fk_performance_benefit_validation_actor FOREIGN KEY (validated_by_party_id) REFERENCES parties(id),
  INDEX idx_performance_benefit_validation (target_id, validated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE governance_meeting_performance_snapshots (
  meeting_id VARCHAR(36) NOT NULL,
  snapshot_id VARCHAR(36) NOT NULL,
  linked_by_party_id VARCHAR(36) NOT NULL,
  linked_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (meeting_id, snapshot_id),
  CONSTRAINT fk_governance_meeting_performance_meeting FOREIGN KEY (meeting_id) REFERENCES governance_meetings(id),
  CONSTRAINT fk_governance_meeting_performance_snapshot FOREIGN KEY (snapshot_id) REFERENCES performance_snapshots(id),
  CONSTRAINT fk_governance_meeting_performance_actor FOREIGN KEY (linked_by_party_id) REFERENCES parties(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
