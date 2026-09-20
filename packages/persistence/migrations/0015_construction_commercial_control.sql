CREATE TABLE project_cost_codes (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(32) NOT NULL,
  parent_cost_code_id VARCHAR(64) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_project_cost_codes_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_project_cost_codes_project_code (tenant_id, project_object_id, code),
  UNIQUE KEY uq_project_cost_codes_project_id (tenant_id, project_object_id, id),
  KEY ix_project_cost_codes_parent (tenant_id, project_object_id, parent_cost_code_id),
  CONSTRAINT fk_project_cost_codes_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_project_cost_codes_parent
    FOREIGN KEY (tenant_id, project_object_id, parent_cost_code_id)
    REFERENCES project_cost_codes(tenant_id, project_object_id, id),
  CONSTRAINT chk_project_cost_codes_category CHECK (
    category IN (
      'LABOUR', 'MATERIAL', 'PLANT', 'SUBCONTRACT', 'PROFESSIONAL_FEE',
      'OVERHEAD', 'PRELIMINARIES', 'CONTINGENCY', 'OTHER'
    )
  ),
  CONSTRAINT chk_project_cost_codes_parent CHECK (
    parent_cost_code_id IS NULL OR parent_cost_code_id <> id
  ),
  CONSTRAINT chk_project_cost_codes_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE cost_plans (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cost_plans_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_cost_plans_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_cost_plans_project_code (tenant_id, project_object_id, code),
  CONSTRAINT fk_cost_plans_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_cost_plans_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_cost_plans_status CHECK (
    status IN ('ACTIVE', 'CLOSED', 'CANCELLED')
  )
) ENGINE=InnoDB;

CREATE TABLE cost_plan_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  cost_plan_id VARCHAR(64) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  currency CHAR(3) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  approved_decision_id VARCHAR(64) NULL,
  approved_at DATETIME(6) NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_cost_plan_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_cost_plan_versions_number (tenant_id, cost_plan_id, version),
  KEY ix_cost_plan_versions_status (tenant_id, cost_plan_id, status, version),
  CONSTRAINT fk_cost_plan_versions_plan
    FOREIGN KEY (tenant_id, cost_plan_id)
    REFERENCES cost_plans(tenant_id, id),
  CONSTRAINT fk_cost_plan_versions_decision
    FOREIGN KEY (tenant_id, approved_decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_cost_plan_versions_version CHECK (version >= 1),
  CONSTRAINT chk_cost_plan_versions_status CHECK (
    status IN ('DRAFT', 'APPROVED', 'SUPERSEDED', 'CANCELLED')
  ),
  CONSTRAINT chk_cost_plan_versions_approval CHECK (
    (status = 'DRAFT' AND approved_decision_id IS NULL AND approved_at IS NULL)
    OR
    (status IN ('APPROVED', 'SUPERSEDED')
      AND approved_decision_id IS NOT NULL AND approved_at IS NOT NULL)
    OR
    status = 'CANCELLED'
  )
) ENGINE=InnoDB;

CREATE TABLE cost_plan_lines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  cost_plan_version_id VARCHAR(64) NOT NULL,
  cost_code_id VARCHAR(64) NOT NULL,
  description VARCHAR(512) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_cost_plan_lines_tenant_id_id (tenant_id, id),
  KEY ix_cost_plan_lines_version (tenant_id, cost_plan_version_id, cost_code_id),
  CONSTRAINT fk_cost_plan_lines_version
    FOREIGN KEY (tenant_id, cost_plan_version_id)
    REFERENCES cost_plan_versions(tenant_id, id),
  CONSTRAINT fk_cost_plan_lines_cost_code
    FOREIGN KEY (tenant_id, cost_code_id)
    REFERENCES project_cost_codes(tenant_id, id),
  CONSTRAINT chk_cost_plan_lines_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

CREATE TABLE commercial_variations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  side VARCHAR(16) NOT NULL,
  linked_change_id VARCHAR(64) NULL,
  commercial_context_object_id VARCHAR(64) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_commercial_variations_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_variations_object (tenant_id, canonical_object_id),
  UNIQUE KEY uq_commercial_variations_project_code (tenant_id, project_object_id, code),
  KEY ix_commercial_variations_change (tenant_id, linked_change_id),
  CONSTRAINT fk_commercial_variations_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_variations_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_variations_change
    FOREIGN KEY (tenant_id, linked_change_id)
    REFERENCES changes(tenant_id, id),
  CONSTRAINT fk_commercial_variations_context
    FOREIGN KEY (tenant_id, commercial_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_commercial_variations_side CHECK (
    side IN ('REVENUE', 'COST', 'INTERNAL')
  ),
  CONSTRAINT chk_commercial_variations_status CHECK (
    status IN ('OPEN', 'CLOSED', 'CANCELLED')
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_variation_versions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  variation_id VARCHAR(64) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  currency CHAR(3) NOT NULL,
  submitted_amount DECIMAL(19,4) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  issued_at DATETIME(6) NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_commercial_variation_versions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_variation_versions_number
    (tenant_id, variation_id, version),
  KEY ix_commercial_variation_versions_status
    (tenant_id, variation_id, status, version),
  CONSTRAINT fk_commercial_variation_versions_variation
    FOREIGN KEY (tenant_id, variation_id)
    REFERENCES commercial_variations(tenant_id, id),
  CONSTRAINT chk_commercial_variation_versions_version CHECK (version >= 1),
  CONSTRAINT chk_commercial_variation_versions_status CHECK (
    status IN ('DRAFT', 'ISSUED', 'SUPERSEDED', 'WITHDRAWN')
  ),
  CONSTRAINT chk_commercial_variation_versions_issue CHECK (
    (status = 'DRAFT' AND issued_at IS NULL)
    OR
    (status IN ('ISSUED', 'SUPERSEDED', 'WITHDRAWN') AND issued_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_variation_lines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  variation_version_id VARCHAR(64) NOT NULL,
  cost_code_id VARCHAR(64) NULL,
  description VARCHAR(512) NOT NULL,
  amount DECIMAL(19,4) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_commercial_variation_lines_tenant_id_id (tenant_id, id),
  KEY ix_commercial_variation_lines_version
    (tenant_id, variation_version_id, cost_code_id),
  CONSTRAINT fk_commercial_variation_lines_version
    FOREIGN KEY (tenant_id, variation_version_id)
    REFERENCES commercial_variation_versions(tenant_id, id),
  CONSTRAINT fk_commercial_variation_lines_cost_code
    FOREIGN KEY (tenant_id, cost_code_id)
    REFERENCES project_cost_codes(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE commercial_variation_decisions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  variation_version_id VARCHAR(64) NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  outcome VARCHAR(24) NOT NULL,
  decided_amount DECIMAL(19,4) NOT NULL,
  decided_at DATETIME(6) NOT NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_commercial_variation_decisions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_variation_decisions_version
    (tenant_id, variation_version_id),
  UNIQUE KEY uq_commercial_variation_decisions_decision (tenant_id, decision_id),
  CONSTRAINT fk_commercial_variation_decisions_version
    FOREIGN KEY (tenant_id, variation_version_id)
    REFERENCES commercial_variation_versions(tenant_id, id),
  CONSTRAINT fk_commercial_variation_decisions_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_commercial_variation_decisions_outcome CHECK (
    outcome IN ('ACCEPTED', 'PARTIALLY_ACCEPTED', 'REJECTED', 'WITHDRAWN')
  ),
  CONSTRAINT chk_commercial_variation_decisions_rejected CHECK (
    outcome NOT IN ('REJECTED', 'WITHDRAWN') OR decided_amount = 0
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_valuations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  commercial_context_object_id VARCHAR(64) NULL,
  source_application_id VARCHAR(64) NULL,
  kind VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL,
  currency CHAR(3) NOT NULL,
  valuation_date DATETIME(6) NOT NULL,
  decision_id VARCHAR(64) NULL,
  certified_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_commercial_valuations_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_valuations_object (tenant_id, canonical_object_id),
  KEY ix_commercial_valuations_project
    (tenant_id, project_object_id, kind, status, valuation_date),
  CONSTRAINT fk_commercial_valuations_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_valuations_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_valuations_context
    FOREIGN KEY (tenant_id, commercial_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_valuations_source
    FOREIGN KEY (tenant_id, source_application_id)
    REFERENCES commercial_valuations(tenant_id, id),
  CONSTRAINT fk_commercial_valuations_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_commercial_valuations_kind CHECK (
    kind IN (
      'CLIENT_APPLICATION', 'CLIENT_CERTIFICATE',
      'SUPPLIER_APPLICATION', 'SUPPLIER_CERTIFICATE',
      'INTERNAL_ASSESSMENT'
    )
  ),
  CONSTRAINT chk_commercial_valuations_status CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'CERTIFIED', 'CLOSED', 'CANCELLED')
  ),
  CONSTRAINT chk_commercial_valuations_certification CHECK (
    (status IN ('DRAFT', 'SUBMITTED', 'CANCELLED')
      AND decision_id IS NULL AND certified_at IS NULL)
    OR
    (status IN ('CERTIFIED', 'CLOSED')
      AND decision_id IS NOT NULL AND certified_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_valuation_lines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  valuation_id VARCHAR(64) NOT NULL,
  cost_code_id VARCHAR(64) NULL,
  description VARCHAR(512) NOT NULL,
  cumulative_amount DECIMAL(19,4) NOT NULL,
  adjustment_type VARCHAR(32) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_commercial_valuation_lines_tenant_id_id (tenant_id, id),
  KEY ix_commercial_valuation_lines_valuation
    (tenant_id, valuation_id, cost_code_id),
  CONSTRAINT fk_commercial_valuation_lines_valuation
    FOREIGN KEY (tenant_id, valuation_id)
    REFERENCES commercial_valuations(tenant_id, id),
  CONSTRAINT fk_commercial_valuation_lines_cost_code
    FOREIGN KEY (tenant_id, cost_code_id)
    REFERENCES project_cost_codes(tenant_id, id),
  CONSTRAINT chk_commercial_valuation_lines_adjustment CHECK (
    adjustment_type IS NULL OR adjustment_type IN (
      'RETENTION', 'CONTRA', 'MATERIALS_ON_SITE',
      'ADVANCE_RECOVERY', 'PREVIOUS_CORRECTION', 'OTHER'
    )
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_forecasts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  reporting_cutoff_at DATETIME(6) NOT NULL,
  currency CHAR(3) NOT NULL,
  status VARCHAR(16) NOT NULL,
  forecast_revenue DECIMAL(19,4) NOT NULL,
  approved_decision_id VARCHAR(64) NULL,
  approved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_commercial_forecasts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_forecasts_object (tenant_id, canonical_object_id),
  KEY ix_commercial_forecasts_project_cutoff
    (tenant_id, project_object_id, reporting_cutoff_at, status),
  CONSTRAINT fk_commercial_forecasts_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_forecasts_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_forecasts_decision
    FOREIGN KEY (tenant_id, approved_decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_commercial_forecasts_status CHECK (
    status IN ('DRAFT', 'APPROVED', 'SUPERSEDED', 'CANCELLED')
  ),
  CONSTRAINT chk_commercial_forecasts_approval CHECK (
    (status = 'DRAFT' AND approved_decision_id IS NULL AND approved_at IS NULL)
    OR
    (status IN ('APPROVED', 'SUPERSEDED')
      AND approved_decision_id IS NOT NULL AND approved_at IS NOT NULL)
    OR
    status = 'CANCELLED'
  )
) ENGINE=InnoDB;

CREATE TABLE commercial_forecast_lines (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  forecast_id VARCHAR(64) NOT NULL,
  cost_code_id VARCHAR(64) NOT NULL,
  control_budget DECIMAL(19,4) NOT NULL,
  actual_cost DECIMAL(19,4) NOT NULL,
  remaining_commitment DECIMAL(19,4) NOT NULL,
  approved_change DECIMAL(19,4) NOT NULL,
  pending_change_exposure DECIMAL(19,4) NOT NULL,
  forecast_to_complete DECIMAL(19,4) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_commercial_forecast_lines_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_forecast_lines_cost_code
    (tenant_id, forecast_id, cost_code_id),
  CONSTRAINT fk_commercial_forecast_lines_forecast
    FOREIGN KEY (tenant_id, forecast_id)
    REFERENCES commercial_forecasts(tenant_id, id),
  CONSTRAINT fk_commercial_forecast_lines_cost_code
    FOREIGN KEY (tenant_id, cost_code_id)
    REFERENCES project_cost_codes(tenant_id, id)
) ENGINE=InnoDB;

CREATE TABLE commercial_final_accounts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  commercial_context_object_id VARCHAR(64) NULL,
  currency CHAR(3) NOT NULL,
  agreed_amount DECIMAL(19,4) NOT NULL,
  status VARCHAR(16) NOT NULL,
  decision_id VARCHAR(64) NULL,
  agreed_at DATETIME(6) NULL,
  evidence_record_id VARCHAR(64) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_commercial_final_accounts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_commercial_final_accounts_object (tenant_id, canonical_object_id),
  KEY ix_commercial_final_accounts_project
    (tenant_id, project_object_id, status),
  CONSTRAINT fk_commercial_final_accounts_object
    FOREIGN KEY (tenant_id, canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_final_accounts_project
    FOREIGN KEY (tenant_id, project_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_final_accounts_context
    FOREIGN KEY (tenant_id, commercial_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_commercial_final_accounts_decision
    FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_commercial_final_accounts_evidence
    FOREIGN KEY (tenant_id, evidence_record_id)
    REFERENCES evidence_records(tenant_id, id),
  CONSTRAINT chk_commercial_final_accounts_status CHECK (
    status IN ('DRAFT', 'AGREED', 'CLOSED', 'CANCELLED')
  ),
  CONSTRAINT chk_commercial_final_accounts_agreement CHECK (
    (status IN ('DRAFT', 'CANCELLED')
      AND decision_id IS NULL AND agreed_at IS NULL)
    OR
    (status IN ('AGREED', 'CLOSED')
      AND decision_id IS NOT NULL AND agreed_at IS NOT NULL)
  )
) ENGINE=InnoDB;
