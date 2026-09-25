ALTER TABLE tenant_configuration_template_criteria
  DROP CHECK chk_tenant_configuration_template_criterion_type,
  ADD CONSTRAINT chk_tenant_configuration_template_criterion_type CHECK (
    criterion_type IN (
      'INDUSTRY_CLASSIFICATION',
      'INDUSTRY_SOLUTION',
      'SIZE_TIER',
      'OPERATING_MODEL',
      'REGULATORY_REGIME',
      'COUNTRY'
    )
  );

UPDATE tenant_configuration_template_criteria
   SET criterion_type = 'INDUSTRY_SOLUTION',
       criterion_value = 'CBE'
 WHERE id = 'TCR-CBE-CLASSIFICATION-1';

INSERT INTO business_classification_schemes
  (id, code, name, edition, jurisdiction, description, status)
VALUES
  (
    'BCS-NAICS-2022',
    'NAICS',
    'North American Industry Classification System',
    '2022',
    'North America',
    'NAICS 2022 sector-level industry classification reference used as governed external business classification metadata.',
    'ACTIVE'
  );

INSERT INTO business_classification_values
  (id, scheme_id, code, name, parent_value_id, description, status)
VALUES
  ('BCV-NAICS-2022-11', 'BCS-NAICS-2022', '11', 'Agriculture, Forestry, Fishing and Hunting', NULL, 'Primary sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-21', 'BCS-NAICS-2022', '21', 'Mining, Quarrying, and Oil and Gas Extraction', NULL, 'Primary sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-22', 'BCS-NAICS-2022', '22', 'Utilities', NULL, 'Infrastructure sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-23', 'BCS-NAICS-2022', '23', 'Construction', NULL, 'Project-based sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-31-33', 'BCS-NAICS-2022', '31-33', 'Manufacturing', NULL, 'Production sector group spanning NAICS sectors 31, 32 and 33.', 'ACTIVE'),
  ('BCV-NAICS-2022-42', 'BCS-NAICS-2022', '42', 'Wholesale Trade', NULL, 'Distribution sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-44-45', 'BCS-NAICS-2022', '44-45', 'Retail Trade', NULL, 'Commerce sector group spanning NAICS sectors 44 and 45.', 'ACTIVE'),
  ('BCV-NAICS-2022-48-49', 'BCS-NAICS-2022', '48-49', 'Transportation and Warehousing', NULL, 'Logistics sector group spanning NAICS sectors 48 and 49.', 'ACTIVE'),
  ('BCV-NAICS-2022-51', 'BCS-NAICS-2022', '51', 'Information', NULL, 'Knowledge sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-52', 'BCS-NAICS-2022', '52', 'Finance and Insurance', NULL, 'Financial sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-53', 'BCS-NAICS-2022', '53', 'Real Estate and Rental and Leasing', NULL, 'Asset-based sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-54', 'BCS-NAICS-2022', '54', 'Professional, Scientific, and Technical Services', NULL, 'Professional services sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-55', 'BCS-NAICS-2022', '55', 'Management of Companies and Enterprises', NULL, 'Holding and management sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-56', 'BCS-NAICS-2022', '56', 'Administrative and Support and Waste Management', NULL, 'Support services sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-61', 'BCS-NAICS-2022', '61', 'Educational Services', NULL, 'Education sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-62', 'BCS-NAICS-2022', '62', 'Health Care and Social Assistance', NULL, 'Healthcare sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-71', 'BCS-NAICS-2022', '71', 'Arts, Entertainment, and Recreation', NULL, 'Leisure sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-72', 'BCS-NAICS-2022', '72', 'Accommodation and Food Services', NULL, 'Hospitality sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-81', 'BCS-NAICS-2022', '81', 'Other Services (except Public Administration)', NULL, 'Other services sector.', 'ACTIVE'),
  ('BCV-NAICS-2022-92', 'BCS-NAICS-2022', '92', 'Public Administration', NULL, 'Government sector.', 'ACTIVE');

INSERT INTO industry_solution_business_classifications
  (industry_solution_id, classification_value_id, relationship_type)
VALUES
  ('CBE', 'BCV-NAICS-2022-23', 'APPLICABLE');

INSERT INTO business_classification_mappings
  (id, source_value_id, target_value_id, mapping_type, status)
VALUES
  (
    'BCM-NAICS23-NUBLOX-CBE',
    'BCV-NAICS-2022-23',
    'BCV-NUBLOX-CBE',
    'NARROWER',
    'ACTIVE'
  );
