CREATE TABLE deliverable_authoring_bindings (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  deliverable_item_id VARCHAR(64) NOT NULL,
  mode VARCHAR(32) NOT NULL,
  provider_key VARCHAR(160) NOT NULL,
  authoritative_object_id VARCHAR(64) NULL,
  external_identity_id VARCHAR(64) NULL,
  connected_reference VARCHAR(1024) NULL,
  created_at DATETIME(6) NOT NULL,
  status VARCHAR(16) NOT NULL,
  recorded_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_deliverable_authoring_bindings_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_deliverable_authoring_bindings_item (tenant_id, deliverable_item_id),
  KEY ix_deliverable_authoring_bindings_provider
    (tenant_id, mode, provider_key, status),
  CONSTRAINT fk_deliverable_authoring_bindings_item
    FOREIGN KEY (tenant_id, deliverable_item_id)
    REFERENCES deliverable_items(tenant_id, id),
  CONSTRAINT fk_deliverable_authoring_bindings_object
    FOREIGN KEY (tenant_id, authoritative_object_id)
    REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_deliverable_authoring_bindings_external
    FOREIGN KEY (tenant_id, external_identity_id)
    REFERENCES external_identities(tenant_id, id),
  CONSTRAINT chk_deliverable_authoring_bindings_mode CHECK (
    mode IN ('NATIVE', 'CONNECTED', 'EXTERNAL_AUTHORITATIVE')
  ),
  CONSTRAINT chk_deliverable_authoring_bindings_mode_fields CHECK (
    (mode = 'NATIVE'
      AND authoritative_object_id IS NOT NULL
      AND external_identity_id IS NULL
      AND connected_reference IS NULL)
    OR
    (mode = 'CONNECTED' AND connected_reference IS NOT NULL)
    OR
    (mode = 'EXTERNAL_AUTHORITATIVE' AND external_identity_id IS NOT NULL)
  ),
  CONSTRAINT chk_deliverable_authoring_bindings_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;
