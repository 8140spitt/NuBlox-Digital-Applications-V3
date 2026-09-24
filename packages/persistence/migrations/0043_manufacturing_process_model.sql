CREATE TABLE manufacturing_process_plans (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  version INT UNSIGNED NOT NULL,
  status VARCHAR(24) NOT NULL,
  description TEXT NULL,
  plant_reference VARCHAR(255) NULL,
  checksum VARCHAR(255) NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  plan_created_at DATETIME(6) NOT NULL,
  frozen_by_person_id VARCHAR(64) NULL,
  frozen_at DATETIME(6) NULL,
  release_decision_id VARCHAR(64) NULL,
  released_at DATETIME(6) NULL,
  active_guard_key VARCHAR(120) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_mfg_plans_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_plans_code_version (tenant_id,code,version),
  UNIQUE KEY uq_mfg_plans_active (tenant_id,active_guard_key),
  CONSTRAINT fk_mfg_plans_scope FOREIGN KEY (tenant_id,scope_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_mfg_plans_creator FOREIGN KEY (tenant_id,created_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_mfg_plans_freezer FOREIGN KEY (tenant_id,frozen_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_mfg_plans_decision FOREIGN KEY (tenant_id,release_decision_id) REFERENCES decisions(tenant_id,id),
  CONSTRAINT chk_mfg_plans_status CHECK (status IN ('DRAFT','FROZEN','RELEASED','SUPERSEDED','RETIRED')),
  CONSTRAINT chk_mfg_plans_state CHECK (
    (status='DRAFT' AND checksum IS NULL AND frozen_at IS NULL AND release_decision_id IS NULL AND released_at IS NULL AND active_guard_key IS NULL)
    OR (status='FROZEN' AND checksum IS NOT NULL AND frozen_at IS NOT NULL AND release_decision_id IS NULL AND released_at IS NULL AND active_guard_key IS NULL)
    OR (status='RELEASED' AND checksum IS NOT NULL AND frozen_at IS NOT NULL AND release_decision_id IS NOT NULL AND released_at IS NOT NULL AND active_guard_key=code)
    OR (status IN ('SUPERSEDED','RETIRED') AND checksum IS NOT NULL AND frozen_at IS NOT NULL AND release_decision_id IS NOT NULL AND released_at IS NOT NULL AND active_guard_key IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE manufacturing_operations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  process_plan_id VARCHAR(64) NOT NULL,
  operation_number VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  operation_type VARCHAR(24) NOT NULL,
  description TEXT NULL,
  setup_minutes DECIMAL(12,3) NOT NULL,
  run_minutes DECIMAL(12,3) NOT NULL,
  yield_percent DECIMAL(7,4) NOT NULL,
  work_instructions JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_mfg_operations_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_operations_plan_number (tenant_id,process_plan_id,operation_number),
  CONSTRAINT fk_mfg_operations_plan FOREIGN KEY (tenant_id,process_plan_id) REFERENCES manufacturing_process_plans(tenant_id,id),
  CONSTRAINT chk_mfg_operations_type CHECK (operation_type IN ('PROCESS','INSPECTION','MOVE','WAIT','PACK','OTHER')),
  CONSTRAINT chk_mfg_operations_time CHECK (setup_minutes>=0 AND run_minutes>=0),
  CONSTRAINT chk_mfg_operations_yield CHECK (yield_percent>0 AND yield_percent<=100)
) ENGINE=InnoDB;

CREATE TABLE manufacturing_sequence_links (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  process_plan_id VARCHAR(64) NOT NULL,
  predecessor_operation_id VARCHAR(64) NOT NULL,
  successor_operation_id VARCHAR(64) NOT NULL,
  sequence_type VARCHAR(24) NOT NULL,
  lag_minutes DECIMAL(12,3) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_mfg_sequence_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_sequence_pair (tenant_id,process_plan_id,predecessor_operation_id,successor_operation_id),
  CONSTRAINT fk_mfg_sequence_plan FOREIGN KEY (tenant_id,process_plan_id) REFERENCES manufacturing_process_plans(tenant_id,id),
  CONSTRAINT fk_mfg_sequence_pred FOREIGN KEY (tenant_id,predecessor_operation_id) REFERENCES manufacturing_operations(tenant_id,id),
  CONSTRAINT fk_mfg_sequence_succ FOREIGN KEY (tenant_id,successor_operation_id) REFERENCES manufacturing_operations(tenant_id,id),
  CONSTRAINT chk_mfg_sequence_type CHECK (sequence_type IN ('FINISH_START','START_START','FINISH_FINISH','START_FINISH')),
  CONSTRAINT chk_mfg_sequence_distinct CHECK (predecessor_operation_id<>successor_operation_id)
) ENGINE=InnoDB;

CREATE TABLE manufacturing_resources (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  resource_type VARCHAR(32) NOT NULL,
  description TEXT NULL,
  capacity_unit VARCHAR(80) NULL,
  capacity_per_day DECIMAL(14,4) NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_mfg_resources_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_resources_code (tenant_id,code),
  CONSTRAINT chk_mfg_resources_type CHECK (resource_type IN ('WORK_CENTER','LABOUR','SKILL','TOOLING','EQUIPMENT','PROCESSING_MATERIAL')),
  CONSTRAINT chk_mfg_resources_status CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT chk_mfg_resources_capacity CHECK (capacity_per_day IS NULL OR capacity_per_day>=0),
  CONSTRAINT chk_mfg_resources_effectivity CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from)
) ENGINE=InnoDB;

CREATE TABLE manufacturing_resource_allocations (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  operation_id VARCHAR(64) NOT NULL,
  resource_id VARCHAR(64) NOT NULL,
  quantity DECIMAL(14,4) NOT NULL,
  usage_unit VARCHAR(80) NOT NULL,
  required BOOLEAN NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_mfg_alloc_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_alloc_operation_resource (tenant_id,operation_id,resource_id),
  CONSTRAINT fk_mfg_alloc_operation FOREIGN KEY (tenant_id,operation_id) REFERENCES manufacturing_operations(tenant_id,id),
  CONSTRAINT fk_mfg_alloc_resource FOREIGN KEY (tenant_id,resource_id) REFERENCES manufacturing_resources(tenant_id,id),
  CONSTRAINT chk_mfg_alloc_quantity CHECK (quantity>0)
) ENGINE=InnoDB;

CREATE TABLE manufacturing_control_characteristics (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  operation_id VARCHAR(64) NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  characteristic_type VARCHAR(32) NOT NULL,
  severity VARCHAR(24) NOT NULL,
  unit VARCHAR(80) NULL,
  nominal_value DECIMAL(20,8) NULL,
  lower_limit DECIMAL(20,8) NULL,
  upper_limit DECIMAL(20,8) NULL,
  specification TEXT NULL,
  sampling_plan JSON NULL,
  effective_from DATETIME(6) NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_mfg_cc_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_mfg_cc_scope_code (tenant_id,scope_object_id,code),
  CONSTRAINT fk_mfg_cc_scope FOREIGN KEY (tenant_id,scope_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_mfg_cc_operation FOREIGN KEY (tenant_id,operation_id) REFERENCES manufacturing_operations(tenant_id,id),
  CONSTRAINT chk_mfg_cc_type CHECK (characteristic_type IN ('DIMENSION','ATTRIBUTE','MATERIAL','PROCESS_PARAMETER','VISUAL','FUNCTIONAL','OTHER')),
  CONSTRAINT chk_mfg_cc_severity CHECK (severity IN ('CRITICAL','MAJOR','MINOR','INFORMATIONAL')),
  CONSTRAINT chk_mfg_cc_limits CHECK (lower_limit IS NULL OR upper_limit IS NULL OR lower_limit<=upper_limit),
  CONSTRAINT chk_mfg_cc_status CHECK (status IN ('ACTIVE','INACTIVE')),
  CONSTRAINT chk_mfg_cc_effectivity CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to>=effective_from)
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('domain.manufacturing.read','Read manufacturing','View manufacturing process plans, operations, sequences, resources, allocations and control characteristics.'),
 ('domain.manufacturing.manage','Manage manufacturing process plans','Create and maintain draft manufacturing process plans, operations and sequences.'),
 ('domain.manufacturing.release','Release manufacturing process plans','Freeze exact manufacturing process definitions and release them with Decision authority.'),
 ('domain.manufacturing.resource_manage','Manage manufacturing resources','Create and maintain work centers, skills, tooling, equipment, labour and processing-material resources and allocations.'),
 ('domain.manufacturing.control_characteristic_manage','Manage control characteristics','Create and maintain effective-dated manufacturing control characteristics.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-069','ROLE-PLATFORM-ADMINISTRATOR','domain.manufacturing.read'),
 ('ARP-PLATFORM-ADMIN-070','ROLE-PLATFORM-ADMINISTRATOR','domain.manufacturing.manage'),
 ('ARP-PLATFORM-ADMIN-071','ROLE-PLATFORM-ADMINISTRATOR','domain.manufacturing.release'),
 ('ARP-PLATFORM-ADMIN-072','ROLE-PLATFORM-ADMINISTRATOR','domain.manufacturing.resource_manage'),
 ('ARP-PLATFORM-ADMIN-073','ROLE-PLATFORM-ADMINISTRATOR','domain.manufacturing.control_characteristic_manage');
