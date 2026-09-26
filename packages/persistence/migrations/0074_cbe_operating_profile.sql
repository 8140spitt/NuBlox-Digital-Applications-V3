-- CBE-first operating-profile resolver.
-- This deliberately extends the existing NuBlox provisioning framework rather than creating
-- a generic multi-sector abstraction before a second Industry Solution exists.

CREATE TABLE cbe_operating_archetypes (
  code VARCHAR(16) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT chk_cbe_operating_archetype_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE cbe_contractual_positions (
  code VARCHAR(24) NOT NULL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  effective_archetype_code VARCHAR(16) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_cbe_contractual_position_archetype
    FOREIGN KEY (effective_archetype_code) REFERENCES cbe_operating_archetypes(code),
  CONSTRAINT chk_cbe_contractual_position_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE cbe_base_function_rules (
  function_id VARCHAR(16) NOT NULL PRIMARY KEY,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_cbe_base_function_rule_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id)
) ENGINE=InnoDB;

CREATE TABLE cbe_size_capability_adders (
  size_band VARCHAR(4) NOT NULL,
  band_rank INT UNSIGNED NOT NULL,
  capability_type VARCHAR(16) NOT NULL,
  function_id VARCHAR(16) NULL,
  sub_function_id VARCHAR(24) NULL,
  capability_name VARCHAR(255) NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (size_band, capability_type, capability_name),
  KEY ix_cbe_size_capability_rank (band_rank, capability_type),
  CONSTRAINT fk_cbe_size_capability_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_cbe_size_capability_sub_function
    FOREIGN KEY (sub_function_id) REFERENCES sub_function_definitions(id),
  CONSTRAINT chk_cbe_size_capability_band CHECK (size_band IN ('T1','T2','T3','T4')),
  CONSTRAINT chk_cbe_size_capability_type CHECK (capability_type IN ('FUNCTION','SUB_FUNCTION')),
  CONSTRAINT chk_cbe_size_capability_reference CHECK (
    (capability_type='FUNCTION' AND function_id IS NOT NULL AND sub_function_id IS NULL)
    OR
    (capability_type='SUB_FUNCTION' AND function_id IS NULL AND sub_function_id IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE cbe_archetype_function_rules (
  archetype_code VARCHAR(16) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  recommendation_state VARCHAR(32) NOT NULL,
  rationale TEXT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (archetype_code, function_id),
  CONSTRAINT fk_cbe_archetype_function_rule_archetype
    FOREIGN KEY (archetype_code) REFERENCES cbe_operating_archetypes(code),
  CONSTRAINT fk_cbe_archetype_function_rule_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_cbe_archetype_function_rule_state CHECK (
    recommendation_state IN ('DEFAULT_ENABLED','AVAILABLE_DISABLED','HIDDEN_NOT_APPLICABLE')
  )
) ENGINE=InnoDB;

CREATE TABLE tenant_cbe_operating_profiles (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  resolver_version INT UNSIGNED NOT NULL,
  intake_archetype_code VARCHAR(16) NOT NULL,
  effective_archetype_code VARCHAR(16) NOT NULL,
  contractual_position_code VARCHAR(24) NOT NULL,
  employs_operatives BOOLEAN NOT NULL,
  size_band VARCHAR(4) NOT NULL,
  provisioning_code VARCHAR(160) NOT NULL,
  profile_snapshot JSON NOT NULL,
  created_at DATETIME(6) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_tenant_cbe_operating_profile_code (tenant_id, provisioning_code),
  CONSTRAINT fk_tenant_cbe_operating_profile_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_cbe_operating_profile_intake_archetype
    FOREIGN KEY (intake_archetype_code) REFERENCES cbe_operating_archetypes(code),
  CONSTRAINT fk_tenant_cbe_operating_profile_effective_archetype
    FOREIGN KEY (effective_archetype_code) REFERENCES cbe_operating_archetypes(code),
  CONSTRAINT fk_tenant_cbe_operating_profile_contract
    FOREIGN KEY (contractual_position_code) REFERENCES cbe_contractual_positions(code),
  CONSTRAINT chk_tenant_cbe_operating_profile_version CHECK (resolver_version > 0),
  CONSTRAINT chk_tenant_cbe_operating_profile_size CHECK (size_band IN ('T1','T2','T3','T4'))
) ENGINE=InnoDB;

CREATE TABLE tenant_function_configurations (
  tenant_id VARCHAR(64) NOT NULL,
  function_id VARCHAR(16) NOT NULL,
  recommendation_state VARCHAR(32) NOT NULL,
  effective_state VARCHAR(32) NOT NULL,
  source_profile_code VARCHAR(160) NOT NULL,
  rationale TEXT NOT NULL,
  created_at DATETIME(6) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NOT NULL,
  PRIMARY KEY (tenant_id, function_id),
  KEY ix_tenant_function_configuration_state (tenant_id, effective_state, function_id),
  CONSTRAINT fk_tenant_function_configuration_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_function_configuration_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_tenant_function_configuration_recommendation CHECK (
    recommendation_state IN ('DEFAULT_ENABLED','AVAILABLE_DISABLED','HIDDEN_NOT_APPLICABLE')
  ),
  CONSTRAINT chk_tenant_function_configuration_effective CHECK (
    effective_state IN ('DEFAULT_ENABLED','AVAILABLE_DISABLED','HIDDEN_NOT_APPLICABLE')
  )
) ENGINE=InnoDB;

INSERT INTO cbe_operating_archetypes (code,name,description,status) VALUES
  ('CON','Consultancy / advisory','Provides professional advice, design, surveying, cost, project or compliance services.','ACTIVE'),
  ('MC','Main contractor','Holds primary responsibility for construction delivery.','ACTIVE'),
  ('SUB','Specialist contractor / subcontractor','Delivers a specialist package or trade scope.','ACTIVE'),
  ('SUP','Supplier / distributor / hire','Supplies, distributes, manufactures or hires products, materials or equipment.','ACTIVE'),
  ('CLI','Client / developer / asset owner','Owns, develops, commissions or operates built assets.','ACTIVE');

INSERT INTO cbe_contractual_positions (code,name,effective_archetype_code,description,status) VALUES
  ('PRIME','Prime / full delivery','MC','Primary contractual responsibility for delivery.','ACTIVE'),
  ('PACKAGE','Specialist package','SUB','Contracted for a defined specialist package or scope.','ACTIVE'),
  ('ADVISORY','Professional appointment / advisory','CON','Appointed to provide professional consultancy or advisory services.','ACTIVE'),
  ('EMPLOYER','Client / employer side','CLI','Acts as client, employer, developer, owner or operator.','ACTIVE');

INSERT INTO cbe_base_function_rules (function_id,rationale) VALUES
  ('F09','Procurement and supplier management is a universal operating baseline for a CBE business.'),
  ('F14','Finance, accounting, treasury and tax is a universal enterprise baseline.'),
  ('F15','Human Capital core records and workforce administration are universal.'),
  ('F19','Legal and corporate secretariat capability is required for appointments, contracts and obligations.'),
  ('F23','Health, safety, environment and sustainability is a core CBE operating requirement.'),
  ('F25','Communications capability is retained for internal and external business communication.'),
  ('F26','Knowledge, document and records management is required for controlled work products and evidence.');

INSERT INTO cbe_size_capability_adders (size_band,band_rank,capability_type,function_id,sub_function_id,capability_name,rationale) VALUES
  ('T2',2,'SUB_FUNCTION',NULL,'F15.09','Time & attendance','Small-business workforce time capability.'),
  ('T2',2,'SUB_FUNCTION',NULL,'F15.10','Payroll','Small-business payroll capability.'),
  ('T2',2,'SUB_FUNCTION',NULL,'F15.13','Performance management','Small-business performance management capability.'),
  ('T3',3,'FUNCTION','F02',NULL,'Corporate Governance','Medium organisations gain explicit governance depth.'),
  ('T3',3,'FUNCTION','F20',NULL,'Risk, Compliance, Internal Control & Audit','Medium organisations gain explicit risk and assurance depth.'),
  ('T3',3,'SUB_FUNCTION',NULL,'F15.05','Recruitment','Medium organisations gain structured recruitment.'),
  ('T3',3,'SUB_FUNCTION',NULL,'F15.14','Learning & development','Medium organisations gain structured learning and development.'),
  ('T4',4,'FUNCTION','F01',NULL,'Strategy & Enterprise Planning','Large organisations gain explicit enterprise strategy and planning.'),
  ('T4',4,'FUNCTION','F17',NULL,'Data, Analytics & AI','Large organisations gain explicit data and analytics capability.'),
  ('T4',4,'FUNCTION','F18',NULL,'Cybersecurity & Information Security','Large organisations gain explicit cybersecurity governance.'),
  ('T4',4,'FUNCTION','F24',NULL,'Business Continuity, Crisis & Physical Security','Large organisations gain explicit continuity and crisis management.'),
  ('T4',4,'FUNCTION','F27',NULL,'Portfolio, Programme & Project Management','Large organisations gain portfolio and programme governance.');

INSERT INTO cbe_archetype_function_rules (archetype_code,function_id,recommendation_state,rationale) VALUES
  ('CON','F07','DEFAULT_ENABLED','Consultancy / advisory baseline core-business Function.'),
  ('CON','F27','DEFAULT_ENABLED','Consultancy / advisory baseline core-business Function.'),
  ('CON','D01','DEFAULT_ENABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D02','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D03','DEFAULT_ENABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D04','DEFAULT_ENABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D05','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D06','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D07','HIDDEN_NOT_APPLICABLE','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D08','HIDDEN_NOT_APPLICABLE','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D09','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D10','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D11','HIDDEN_NOT_APPLICABLE','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D12','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D13','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D14','HIDDEN_NOT_APPLICABLE','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D15','DEFAULT_ENABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('CON','D16','AVAILABLE_DISABLED','Consultancy / advisory canonical CBE Function recommendation.'),
  ('MC','F07','DEFAULT_ENABLED','Main contractor baseline core-business Function.'),
  ('MC','F10','DEFAULT_ENABLED','Main contractor baseline core-business Function.'),
  ('MC','F12','DEFAULT_ENABLED','Main contractor baseline core-business Function.'),
  ('MC','F13','DEFAULT_ENABLED','Main contractor baseline core-business Function.'),
  ('MC','F27','DEFAULT_ENABLED','Main contractor baseline core-business Function.'),
  ('MC','D01','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D02','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D03','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D04','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D05','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D06','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D07','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D08','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D09','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D10','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D11','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D12','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D13','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D14','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D15','DEFAULT_ENABLED','Main contractor canonical CBE Function recommendation.'),
  ('MC','D16','AVAILABLE_DISABLED','Main contractor canonical CBE Function recommendation.'),
  ('SUB','F07','DEFAULT_ENABLED','Specialist contractor / subcontractor baseline core-business Function.'),
  ('SUB','F12','DEFAULT_ENABLED','Specialist contractor / subcontractor baseline core-business Function.'),
  ('SUB','F13','DEFAULT_ENABLED','Specialist contractor / subcontractor baseline core-business Function.'),
  ('SUB','F27','DEFAULT_ENABLED','Specialist contractor / subcontractor baseline core-business Function.'),
  ('SUB','D01','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D02','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D03','HIDDEN_NOT_APPLICABLE','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D04','DEFAULT_ENABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D05','HIDDEN_NOT_APPLICABLE','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D06','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D07','DEFAULT_ENABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D08','DEFAULT_ENABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D09','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D10','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D11','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D12','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D13','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D14','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D15','DEFAULT_ENABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUB','D16','AVAILABLE_DISABLED','Specialist contractor / subcontractor canonical CBE Function recommendation.'),
  ('SUP','F07','DEFAULT_ENABLED','Supplier / distributor / hire baseline core-business Function.'),
  ('SUP','F10','DEFAULT_ENABLED','Supplier / distributor / hire baseline core-business Function.'),
  ('SUP','F11','DEFAULT_ENABLED','Supplier / distributor / hire baseline core-business Function.'),
  ('SUP','F13','DEFAULT_ENABLED','Supplier / distributor / hire baseline core-business Function.'),
  ('SUP','D01','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D02','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D03','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D04','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D05','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D06','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D07','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D08','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D09','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D10','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D11','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D12','AVAILABLE_DISABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D13','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D14','DEFAULT_ENABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D15','DEFAULT_ENABLED','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('SUP','D16','HIDDEN_NOT_APPLICABLE','Supplier / distributor / hire canonical CBE Function recommendation.'),
  ('CLI','F22','DEFAULT_ENABLED','Client / developer / asset owner baseline core-business Function.'),
  ('CLI','F27','DEFAULT_ENABLED','Client / developer / asset owner baseline core-business Function.'),
  ('CLI','D01','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D02','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D03','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D04','DEFAULT_ENABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D05','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D06','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D07','HIDDEN_NOT_APPLICABLE','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D08','HIDDEN_NOT_APPLICABLE','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D09','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D10','DEFAULT_ENABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D11','HIDDEN_NOT_APPLICABLE','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D12','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D13','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D14','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D15','DEFAULT_ENABLED','Client / developer / asset owner canonical CBE Function recommendation.'),
  ('CLI','D16','AVAILABLE_DISABLED','Client / developer / asset owner canonical CBE Function recommendation.');
