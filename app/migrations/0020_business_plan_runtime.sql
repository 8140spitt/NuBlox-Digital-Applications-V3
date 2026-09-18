-- NuBlox V3 MySQL
-- 0020: F01.04 Business Planning runtime.
-- SGP-BUSINESS-PLAN is a stable governed identity under the existing AGG-02-STRATEGY boundary.

CREATE TABLE business_plans (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  plan_ref VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  framework_id VARCHAR(36) NOT NULL,
  framework_version_no INT NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(191) NOT NULL,
  period_start VARCHAR(32) NOT NULL,
  period_end VARCHAR(32) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_business_plan_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_business_plan_framework FOREIGN KEY (framework_id) REFERENCES strategy_frameworks(id),
  CONSTRAINT fk_business_plan_framework_version FOREIGN KEY (framework_id, framework_version_no)
    REFERENCES strategy_framework_versions(framework_id, version_no),
  CONSTRAINT fk_business_plan_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_business_plan_ref (tenant_id, plan_ref),
  INDEX idx_business_plan_scope (tenant_id, scope_type, scope_id, period_start, period_end, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE business_plan_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  resource_assumptions TEXT NOT NULL,
  financial_expectations TEXT NOT NULL,
  measurable_outcomes TEXT NOT NULL,
  delivery_roadmap TEXT NOT NULL,
  approval_decision_id VARCHAR(36) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_business_plan_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_business_plan_version_plan FOREIGN KEY (plan_id) REFERENCES business_plans(id),
  CONSTRAINT fk_business_plan_version_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_business_plan_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_business_plan_version (plan_id, version_no),
  INDEX idx_business_plan_version_status (tenant_id, plan_id, lifecycle_status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE business_plan_objectives (
  plan_version_id VARCHAR(36) NOT NULL,
  objective_id VARCHAR(36) NOT NULL,
  objective_version_no INT UNSIGNED NOT NULL,
  PRIMARY KEY (plan_version_id, objective_id),
  CONSTRAINT fk_business_plan_objective_version FOREIGN KEY (plan_version_id) REFERENCES business_plan_versions(id),
  CONSTRAINT fk_business_plan_objective FOREIGN KEY (objective_id) REFERENCES strategic_objectives(id),
  CONSTRAINT fk_business_plan_objective_exact_version FOREIGN KEY (objective_id, objective_version_no)
    REFERENCES strategic_objective_versions(objective_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE business_plan_assumptions (
  plan_version_id VARCHAR(36) NOT NULL,
  assumption_id VARCHAR(36) NOT NULL,
  assumption_version_no INT UNSIGNED NOT NULL,
  PRIMARY KEY (plan_version_id, assumption_id),
  CONSTRAINT fk_business_plan_assumption_version FOREIGN KEY (plan_version_id) REFERENCES business_plan_versions(id),
  CONSTRAINT fk_business_plan_assumption FOREIGN KEY (assumption_id) REFERENCES strategic_assumptions(id),
  CONSTRAINT fk_business_plan_assumption_exact_version FOREIGN KEY (assumption_id, assumption_version_no)
    REFERENCES strategic_assumption_versions(assumption_id, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
