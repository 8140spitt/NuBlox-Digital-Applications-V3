CREATE TABLE exchange_packages (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL,
  source_context_object_id VARCHAR(64) NULL,
  source_system VARCHAR(160) NOT NULL,
  package_version INT NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  frozen_at DATETIME(6) NULL,
  package_checksum VARCHAR(255) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_exchange_packages_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_exchange_packages_code_version (tenant_id, code, package_version),
  CONSTRAINT fk_exchange_packages_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_exchange_packages_context FOREIGN KEY (tenant_id, source_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_exchange_packages_creator FOREIGN KEY (tenant_id, created_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_exchange_packages_version CHECK (package_version > 0),
  CONSTRAINT chk_exchange_packages_status CHECK (status IN ('DRAFT','FROZEN','CANCELLED')),
  CONSTRAINT chk_exchange_packages_state CHECK (
    (status = 'DRAFT' AND frozen_at IS NULL AND package_checksum IS NULL)
    OR (status = 'FROZEN' AND frozen_at IS NOT NULL AND package_checksum IS NOT NULL)
    OR status = 'CANCELLED'
  )
) ENGINE=InnoDB;

CREATE TABLE exchange_package_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  exchange_package_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(120) NULL,
  representation_id VARCHAR(64) NULL,
  external_identity_id VARCHAR(64) NULL,
  item_role VARCHAR(120) NOT NULL,
  item_checksum VARCHAR(255) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_exchange_package_items_tenant_id_id (tenant_id, id),
  KEY ix_exchange_package_items_package (tenant_id, exchange_package_id, subject_object_id),
  CONSTRAINT fk_exchange_package_items_package FOREIGN KEY (tenant_id, exchange_package_id)
    REFERENCES exchange_packages(tenant_id, id),
  CONSTRAINT fk_exchange_package_items_subject FOREIGN KEY (tenant_id, subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_exchange_package_items_representation FOREIGN KEY (tenant_id, representation_id)
    REFERENCES representations(tenant_id, id),
  CONSTRAINT fk_exchange_package_items_external_identity FOREIGN KEY (tenant_id, external_identity_id)
    REFERENCES external_identities(tenant_id, id),
  CONSTRAINT chk_exchange_package_items_exact CHECK (
    subject_version IS NOT NULL OR representation_id IS NOT NULL
    OR external_identity_id IS NOT NULL OR item_checksum IS NOT NULL
  )
) ENGINE=InnoDB;

CREATE TABLE exchange_deliveries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  exchange_package_id VARCHAR(64) NOT NULL,
  transmittal_id VARCHAR(64) NULL,
  delivery_reference VARCHAR(160) NOT NULL,
  delivery_sequence INT NOT NULL,
  prior_delivery_id VARCHAR(64) NULL,
  dispatched_by_person_id VARCHAR(64) NOT NULL,
  dispatched_at DATETIME(6) NOT NULL,
  transport_reference VARCHAR(255) NULL,
  delivery_checksum VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_exchange_deliveries_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_exchange_deliveries_reference (tenant_id, delivery_reference),
  UNIQUE KEY uq_exchange_deliveries_sequence (tenant_id, exchange_package_id, delivery_sequence),
  CONSTRAINT fk_exchange_deliveries_package FOREIGN KEY (tenant_id, exchange_package_id)
    REFERENCES exchange_packages(tenant_id, id),
  CONSTRAINT fk_exchange_deliveries_transmittal FOREIGN KEY (tenant_id, transmittal_id)
    REFERENCES transmittals(tenant_id, id),
  CONSTRAINT fk_exchange_deliveries_prior FOREIGN KEY (tenant_id, prior_delivery_id)
    REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT fk_exchange_deliveries_dispatcher FOREIGN KEY (tenant_id, dispatched_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_exchange_deliveries_sequence CHECK (delivery_sequence > 0),
  CONSTRAINT chk_exchange_deliveries_status CHECK (status IN ('DISPATCHED','FAILED','CANCELLED'))
) ENGINE=InnoDB;

CREATE TABLE exchange_recipients (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  exchange_delivery_id VARCHAR(64) NOT NULL,
  recipient_party_id VARCHAR(64) NOT NULL,
  transmittal_recipient_id VARCHAR(64) NULL,
  target_system VARCHAR(160) NULL,
  target_context_object_id VARCHAR(64) NULL,
  target_reference VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_exchange_recipients_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_exchange_recipients_delivery_party (tenant_id, exchange_delivery_id, recipient_party_id),
  CONSTRAINT fk_exchange_recipients_delivery FOREIGN KEY (tenant_id, exchange_delivery_id)
    REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT fk_exchange_recipients_party FOREIGN KEY (tenant_id, recipient_party_id)
    REFERENCES parties(tenant_id, id),
  CONSTRAINT fk_exchange_recipients_transmittal FOREIGN KEY (tenant_id, transmittal_recipient_id)
    REFERENCES transmittal_recipients(tenant_id, id),
  CONSTRAINT fk_exchange_recipients_target_context FOREIGN KEY (tenant_id, target_context_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_exchange_recipients_target CHECK (
    target_system IS NOT NULL OR target_context_object_id IS NOT NULL OR target_reference IS NOT NULL
  ),
  CONSTRAINT chk_exchange_recipients_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE exchange_delta_items (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  exchange_delivery_id VARCHAR(64) NOT NULL,
  exchange_package_item_id VARCHAR(64) NOT NULL,
  delta_type VARCHAR(16) NOT NULL,
  prior_delivery_id VARCHAR(64) NULL,
  prior_subject_version VARCHAR(120) NULL,
  prior_location_reference VARCHAR(255) NULL,
  current_location_reference VARCHAR(255) NULL,
  details TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_exchange_delta_items_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_exchange_delta_items_delivery_item (tenant_id, exchange_delivery_id, exchange_package_item_id),
  CONSTRAINT fk_exchange_delta_items_delivery FOREIGN KEY (tenant_id, exchange_delivery_id)
    REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT fk_exchange_delta_items_package_item FOREIGN KEY (tenant_id, exchange_package_item_id)
    REFERENCES exchange_package_items(tenant_id, id),
  CONSTRAINT fk_exchange_delta_items_prior FOREIGN KEY (tenant_id, prior_delivery_id)
    REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT chk_exchange_delta_items_type CHECK (
    delta_type IN ('NEW','CHANGED','MOVED','DELETED','ABSENT')
  ),
  CONSTRAINT chk_exchange_delta_items_prior CHECK (
    (delta_type = 'NEW' AND prior_delivery_id IS NULL)
    OR (delta_type <> 'NEW' AND prior_delivery_id IS NOT NULL)
  ),
  CONSTRAINT chk_exchange_delta_items_move CHECK (
    delta_type <> 'MOVED'
    OR (prior_location_reference IS NOT NULL AND current_location_reference IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE received_deliveries (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  exchange_delivery_id VARCHAR(64) NOT NULL,
  exchange_recipient_id VARCHAR(64) NOT NULL,
  received_by_person_id VARCHAR(64) NOT NULL,
  received_at DATETIME(6) NOT NULL,
  received_package_checksum VARCHAR(255) NULL,
  status VARCHAR(16) NOT NULL,
  validated_at DATETIME(6) NULL,
  mapped_at DATETIME(6) NULL,
  imported_at DATETIME(6) NULL,
  rejected_at DATETIME(6) NULL,
  rejection_reason TEXT NULL,
  import_reference VARCHAR(255) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_received_deliveries_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_received_deliveries_recipient (tenant_id, exchange_recipient_id),
  CONSTRAINT fk_received_deliveries_delivery FOREIGN KEY (tenant_id, exchange_delivery_id)
    REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT fk_received_deliveries_recipient FOREIGN KEY (tenant_id, exchange_recipient_id)
    REFERENCES exchange_recipients(tenant_id, id),
  CONSTRAINT fk_received_deliveries_receiver FOREIGN KEY (tenant_id, received_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_received_deliveries_status CHECK (
    status IN ('RECEIVED','VALIDATED','MAPPED','IMPORTED','REJECTED')
  ),
  CONSTRAINT chk_received_deliveries_state CHECK (
    (status = 'RECEIVED' AND validated_at IS NULL AND mapped_at IS NULL AND imported_at IS NULL AND rejected_at IS NULL)
    OR (status = 'VALIDATED' AND validated_at IS NOT NULL AND mapped_at IS NULL AND imported_at IS NULL AND rejected_at IS NULL)
    OR (status = 'MAPPED' AND validated_at IS NOT NULL AND mapped_at IS NOT NULL AND imported_at IS NULL AND rejected_at IS NULL)
    OR (status = 'IMPORTED' AND validated_at IS NOT NULL AND mapped_at IS NOT NULL AND imported_at IS NOT NULL AND rejected_at IS NULL AND import_reference IS NOT NULL)
    OR (status = 'REJECTED' AND rejected_at IS NOT NULL AND rejection_reason IS NOT NULL AND imported_at IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE exchange_mappings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  received_delivery_id VARCHAR(64) NOT NULL,
  mapping_type VARCHAR(24) NOT NULL,
  source_value VARCHAR(500) NOT NULL,
  target_value VARCHAR(500) NOT NULL,
  target_object_id VARCHAR(64) NULL,
  notes TEXT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_exchange_mappings_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_exchange_mappings_value (tenant_id, received_delivery_id, mapping_type, source_value),
  CONSTRAINT fk_exchange_mappings_received FOREIGN KEY (tenant_id, received_delivery_id)
    REFERENCES received_deliveries(tenant_id, id),
  CONSTRAINT fk_exchange_mappings_target_object FOREIGN KEY (tenant_id, target_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT chk_exchange_mappings_type CHECK (
    mapping_type IN ('CONTEXT','ORGANISATION','VIEW','LIFECYCLE','FOLDER','SECURITY_LABEL','CLASSIFICATION','TYPE','VERSION','CUSTOM')
  ),
  CONSTRAINT chk_exchange_mappings_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE authority_adoptions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  received_delivery_id VARCHAR(64) NOT NULL,
  source_subject_object_id VARCHAR(64) NOT NULL,
  source_subject_version VARCHAR(120) NULL,
  target_canonical_object_id VARCHAR(64) NOT NULL,
  target_subject_version VARCHAR(120) NULL,
  source_authority VARCHAR(255) NOT NULL,
  target_authority VARCHAR(255) NOT NULL,
  decision_id VARCHAR(64) NOT NULL,
  adopted_by_person_id VARCHAR(64) NOT NULL,
  adopted_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_authority_adoptions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_authority_adoptions_received_target (tenant_id, received_delivery_id, target_canonical_object_id, target_subject_version),
  CONSTRAINT fk_authority_adoptions_received FOREIGN KEY (tenant_id, received_delivery_id)
    REFERENCES received_deliveries(tenant_id, id),
  CONSTRAINT fk_authority_adoptions_source FOREIGN KEY (tenant_id, source_subject_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_authority_adoptions_target FOREIGN KEY (tenant_id, target_canonical_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_authority_adoptions_decision FOREIGN KEY (tenant_id, decision_id)
    REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_authority_adoptions_adopter FOREIGN KEY (tenant_id, adopted_by_person_id)
    REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_authority_adoptions_authority CHECK (source_authority <> target_authority)
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.exchange.read', 'Read exchange control', 'View governed exchange packages, deliveries, received deliveries, mappings, deltas and authority adoption evidence.'),
  ('platform.exchange.manage', 'Manage outbound exchange', 'Create and freeze exchange packages, dispatch deliveries and manage recipients and delta evidence.'),
  ('platform.exchange.receive', 'Process received exchange', 'Record, validate, map, import or reject received deliveries.'),
  ('platform.exchange.authority_adopt', 'Adopt received authority', 'Explicitly adopt target master authority from an imported received delivery with approved decision evidence.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-036', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.exchange.read'),
  ('ARP-PLATFORM-ADMIN-037', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.exchange.manage'),
  ('ARP-PLATFORM-ADMIN-038', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.exchange.receive'),
  ('ARP-PLATFORM-ADMIN-039', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.exchange.authority_adopt');
