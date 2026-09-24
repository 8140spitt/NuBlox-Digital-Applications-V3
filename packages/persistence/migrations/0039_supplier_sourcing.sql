CREATE TABLE supplier_relationships (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  supplier_organisation_id VARCHAR(64) NOT NULL,
  relationship_type VARCHAR(32) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  relationship_created_at DATETIME(6) NOT NULL,
  released_decision_id VARCHAR(64) NULL,
  released_at DATETIME(6) NULL,
  cancelled_decision_id VARCHAR(64) NULL,
  cancelled_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_supplier_relationships_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_supplier_relationships_code (tenant_id, code),
  CONSTRAINT fk_supplier_relationships_org FOREIGN KEY (tenant_id, supplier_organisation_id) REFERENCES organisations(tenant_id, id),
  CONSTRAINT fk_supplier_relationships_creator FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_supplier_relationships_release_decision FOREIGN KEY (tenant_id, released_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_supplier_relationships_cancel_decision FOREIGN KEY (tenant_id, cancelled_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT chk_supplier_relationships_type CHECK (
    relationship_type IN ('MANUFACTURER','VENDOR','SERVICE_PROVIDER','SUBCONTRACTOR','OTHER')
  ),
  CONSTRAINT chk_supplier_relationships_status CHECK (
    status IN ('IN_WORK','RELEASED','CANCELLED')
  ),
  CONSTRAINT chk_supplier_relationships_state CHECK (
    (status='IN_WORK' AND released_decision_id IS NULL AND released_at IS NULL AND cancelled_decision_id IS NULL AND cancelled_at IS NULL)
    OR (status='RELEASED' AND released_decision_id IS NOT NULL AND released_at IS NOT NULL AND cancelled_decision_id IS NULL AND cancelled_at IS NULL)
    OR (status='CANCELLED' AND cancelled_decision_id IS NOT NULL AND cancelled_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE sourcing_contexts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  scope_type VARCHAR(120) NOT NULL,
  scope_object_id VARCHAR(64) NULL,
  criteria JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  context_created_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_sourcing_contexts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_sourcing_contexts_code (tenant_id, code),
  CONSTRAINT fk_sourcing_contexts_scope FOREIGN KEY (tenant_id, scope_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_sourcing_contexts_creator FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_sourcing_contexts_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE source_approvals (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  sourcing_context_id VARCHAR(64) NOT NULL,
  supplier_relationship_id VARCHAR(64) NOT NULL,
  internal_item_object_id VARCHAR(64) NOT NULL,
  supplier_item_object_id VARCHAR(64) NOT NULL,
  source_status VARCHAR(24) NOT NULL,
  rationale TEXT NOT NULL,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  approval_decision_id VARCHAR(64) NOT NULL,
  approved_by_person_id VARCHAR(64) NOT NULL,
  approved_at DATETIME(6) NOT NULL,
  superseded_by_source_approval_id VARCHAR(64) NULL,
  current_guard TINYINT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_source_approvals_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_source_approvals_current_tuple (
    tenant_id, sourcing_context_id, supplier_relationship_id,
    internal_item_object_id, supplier_item_object_id, current_guard
  ),
  KEY ix_source_approvals_internal_item (tenant_id, internal_item_object_id, effective_from),
  KEY ix_source_approvals_supplier_item (tenant_id, supplier_item_object_id, effective_from),
  CONSTRAINT fk_source_approvals_context FOREIGN KEY (tenant_id, sourcing_context_id) REFERENCES sourcing_contexts(tenant_id, id),
  CONSTRAINT fk_source_approvals_supplier_relationship FOREIGN KEY (tenant_id, supplier_relationship_id) REFERENCES supplier_relationships(tenant_id, id),
  CONSTRAINT fk_source_approvals_internal_item FOREIGN KEY (tenant_id, internal_item_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_source_approvals_supplier_item FOREIGN KEY (tenant_id, supplier_item_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_source_approvals_decision FOREIGN KEY (tenant_id, approval_decision_id) REFERENCES decisions(tenant_id, id),
  CONSTRAINT fk_source_approvals_approver FOREIGN KEY (tenant_id, approved_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT fk_source_approvals_superseded_by FOREIGN KEY (tenant_id, superseded_by_source_approval_id) REFERENCES source_approvals(tenant_id, id),
  CONSTRAINT chk_source_approvals_status CHECK (source_status IN ('PREFERRED','APPROVED','DO_NOT_USE')),
  CONSTRAINT chk_source_approvals_effectivity CHECK (effective_to IS NULL OR effective_to > effective_from),
  CONSTRAINT chk_source_approvals_distinct_items CHECK (internal_item_object_id <> supplier_item_object_id),
  CONSTRAINT chk_source_approvals_current CHECK (
    (superseded_by_source_approval_id IS NULL AND current_guard=1)
    OR (superseded_by_source_approval_id IS NOT NULL AND current_guard IS NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE sourcing_rules (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  sourcing_context_id VARCHAR(64) NULL,
  supplier_relationship_id VARCHAR(64) NULL,
  item_object_type VARCHAR(160) NULL,
  criteria JSON NOT NULL,
  assigned_status VARCHAR(24) NOT NULL,
  priority INT UNSIGNED NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  rule_created_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_sourcing_rules_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_sourcing_rules_code (tenant_id, code),
  CONSTRAINT fk_sourcing_rules_context FOREIGN KEY (tenant_id, sourcing_context_id) REFERENCES sourcing_contexts(tenant_id, id),
  CONSTRAINT fk_sourcing_rules_supplier_relationship FOREIGN KEY (tenant_id, supplier_relationship_id) REFERENCES supplier_relationships(tenant_id, id),
  CONSTRAINT fk_sourcing_rules_creator FOREIGN KEY (tenant_id, created_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_sourcing_rules_assigned_status CHECK (assigned_status IN ('PREFERRED','APPROVED','DO_NOT_USE')),
  CONSTRAINT chk_sourcing_rules_priority CHECK (priority > 0),
  CONSTRAINT chk_sourcing_rules_status CHECK (status IN ('ACTIVE','DISABLED'))
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('domain.supplier_sourcing.read', 'Read supplier sourcing', 'View supplier relationships, sourcing contexts, contextual source approvals and sourcing rules.'),
  ('domain.supplier_sourcing.manage', 'Manage supplier sourcing', 'Create supplier relationships and sourcing contexts and maintain their lifecycle.'),
  ('domain.supplier_sourcing.approve', 'Approve contextual sources', 'Record Decision-backed supplier-item source approval, preference or restriction by sourcing context and effectivity.'),
  ('domain.supplier_sourcing.rule_manage', 'Manage sourcing rules', 'Create and maintain sourcing rules that assign contextual source status.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-065', 'ROLE-PLATFORM-ADMINISTRATOR', 'domain.supplier_sourcing.read'),
  ('ARP-PLATFORM-ADMIN-066', 'ROLE-PLATFORM-ADMINISTRATOR', 'domain.supplier_sourcing.manage'),
  ('ARP-PLATFORM-ADMIN-067', 'ROLE-PLATFORM-ADMINISTRATOR', 'domain.supplier_sourcing.approve'),
  ('ARP-PLATFORM-ADMIN-068', 'ROLE-PLATFORM-ADMINISTRATOR', 'domain.supplier_sourcing.rule_manage');
