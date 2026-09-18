-- NuBlox V3 MySQL
-- 0014: typed reference-data runtime
-- Implements AGG-29-REFERENCE-DATA without collapsing governed semantics into generic key/value rows.

CREATE TABLE reference_jurisdictions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  jurisdiction_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  country_region_code VARCHAR(64) NULL,
  parent_jurisdiction_id VARCHAR(36) NULL,
  authority_context VARCHAR(500) NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_jurisdiction_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_jurisdiction_parent FOREIGN KEY (parent_jurisdiction_id) REFERENCES reference_jurisdictions(id),
  UNIQUE KEY uq_reference_jurisdiction_key (tenant_id, jurisdiction_key),
  INDEX idx_reference_jurisdiction_effective (tenant_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_currencies (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  iso_code CHAR(3) NOT NULL,
  name VARCHAR(255) NOT NULL,
  minor_units TINYINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_currency_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_reference_currency_code (tenant_id, iso_code),
  INDEX idx_reference_currency_effective (tenant_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_units_of_measure (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  unit_code VARCHAR(64) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  name VARCHAR(255) NOT NULL,
  dimension_key VARCHAR(128) NOT NULL,
  base_unit_id VARCHAR(36) NULL,
  conversion_multiplier DECIMAL(30,12) NOT NULL DEFAULT 1,
  conversion_offset DECIMAL(30,12) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_uom_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_uom_base FOREIGN KEY (base_unit_id) REFERENCES reference_units_of_measure(id),
  UNIQUE KEY uq_reference_uom_code (tenant_id, unit_code),
  INDEX idx_reference_uom_dimension (tenant_id, dimension_key, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_tax_regimes (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  regime_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tax_type VARCHAR(128) NOT NULL,
  jurisdiction_id VARCHAR(36) NOT NULL,
  authority_name VARCHAR(255) NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_tax_regime_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_tax_regime_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES reference_jurisdictions(id),
  UNIQUE KEY uq_reference_tax_regime_key (tenant_id, regime_key),
  INDEX idx_reference_tax_regime_jurisdiction (tenant_id, jurisdiction_id, tax_type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_contract_form_families (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  family_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  publisher_body VARCHAR(255) NULL,
  edition_family VARCHAR(191) NULL,
  jurisdiction_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_contract_family_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_contract_family_jurisdiction FOREIGN KEY (jurisdiction_id) REFERENCES reference_jurisdictions(id),
  UNIQUE KEY uq_reference_contract_family_key (tenant_id, family_key),
  INDEX idx_reference_contract_family_jurisdiction (tenant_id, jurisdiction_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_calendars (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  calendar_key VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_calendar_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE KEY uq_reference_calendar_key (tenant_id, calendar_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reference_calendar_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  calendar_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  timezone_name VARCHAR(191) NOT NULL,
  working_pattern_json JSON NOT NULL,
  holidays_json JSON NULL,
  exceptions_json JSON NULL,
  effective_from VARCHAR(32) NULL,
  effective_to VARCHAR(32) NULL,
  published_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_calendar_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_calendar_version_calendar FOREIGN KEY (calendar_id) REFERENCES reference_calendars(id),
  CONSTRAINT fk_reference_calendar_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_reference_calendar_version (calendar_id, version_no),
  INDEX idx_reference_calendar_version_status (tenant_id, calendar_id, status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
