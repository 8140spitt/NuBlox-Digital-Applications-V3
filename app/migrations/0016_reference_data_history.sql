-- NuBlox V3 MySQL
-- 0016: immutable typed reference-data history
-- Preserves the exact governed meaning of each effective reference version.

CREATE TABLE reference_data_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  reference_type VARCHAR(64) NOT NULL,
  reference_id VARCHAR(36) NOT NULL,
  version_no BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  snapshot_json JSON NOT NULL,
  valid_from VARCHAR(32) NULL,
  valid_to VARCHAR(32) NULL,
  change_reason TEXT NULL,
  recorded_by_party_id VARCHAR(36) NULL,
  recorded_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_reference_data_version_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_reference_data_version_actor
    FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_reference_data_version
    (tenant_id, reference_type, reference_id, version_no),
  INDEX idx_reference_data_version_lookup
    (tenant_id, reference_type, reference_id, version_no),
  INDEX idx_reference_data_version_effective
    (tenant_id, reference_type, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO reference_data_versions
  (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json,
   valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at)
SELECT UUID(), tenant_id, 'JURISDICTION', id, version, status,
       JSON_OBJECT(
         'jurisdictionKey', jurisdiction_key,
         'name', name,
         'countryRegionCode', country_region_code,
         'parentJurisdictionId', parent_jurisdiction_id,
         'authorityContext', authority_context
       ),
       valid_from, valid_to, 'Backfilled from pre-history reference state.', NULL, updated_at
  FROM reference_jurisdictions;

INSERT INTO reference_data_versions
  (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json,
   valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at)
SELECT UUID(), tenant_id, 'CURRENCY', id, version, status,
       JSON_OBJECT('isoCode', iso_code, 'name', name, 'minorUnits', minor_units),
       valid_from, valid_to, 'Backfilled from pre-history reference state.', NULL, updated_at
  FROM reference_currencies;

INSERT INTO reference_data_versions
  (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json,
   valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at)
SELECT UUID(), tenant_id, 'UNIT_OF_MEASURE', id, version, status,
       JSON_OBJECT(
         'unitCode', unit_code,
         'symbol', symbol,
         'name', name,
         'dimensionKey', dimension_key,
         'baseUnitId', base_unit_id,
         'conversionMultiplier', conversion_multiplier,
         'conversionOffset', conversion_offset
       ),
       valid_from, valid_to, 'Backfilled from pre-history reference state.', NULL, updated_at
  FROM reference_units_of_measure;

INSERT INTO reference_data_versions
  (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json,
   valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at)
SELECT UUID(), tenant_id, 'TAX_REGIME', id, version, status,
       JSON_OBJECT(
         'regimeKey', regime_key,
         'name', name,
         'taxType', tax_type,
         'jurisdictionId', jurisdiction_id,
         'authorityName', authority_name
       ),
       valid_from, valid_to, 'Backfilled from pre-history reference state.', NULL, updated_at
  FROM reference_tax_regimes;

INSERT INTO reference_data_versions
  (id, tenant_id, reference_type, reference_id, version_no, status, snapshot_json,
   valid_from, valid_to, change_reason, recorded_by_party_id, recorded_at)
SELECT UUID(), tenant_id, 'CONTRACT_FORM_FAMILY', id, version, status,
       JSON_OBJECT(
         'familyKey', family_key,
         'name', name,
         'publisherBody', publisher_body,
         'editionFamily', edition_family,
         'jurisdictionId', jurisdiction_id
       ),
       valid_from, valid_to, 'Backfilled from pre-history reference state.', NULL, updated_at
  FROM reference_contract_form_families;
