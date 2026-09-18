-- NuBlox V3 MySQL
-- 0007: shared foundation authority, relationship and organisation-structure aggregates
-- Implements AGG-01-PARTY-RELATIONSHIP, AGG-01-ORG-STRUCTURE and AGG-01-AUTHORITY.

CREATE TABLE IF NOT EXISTS party_relationships (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  from_party_id VARCHAR(36) NOT NULL,
  to_party_id VARCHAR(36) NOT NULL,
  relationship_type VARCHAR(64) NOT NULL,
  context_type VARCHAR(64) NOT NULL,
  context_id VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_party_relationship_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_party_relationship_from FOREIGN KEY (from_party_id) REFERENCES parties(id),
  CONSTRAINT fk_party_relationship_to FOREIGN KEY (to_party_id) REFERENCES parties(id),
  INDEX idx_party_relationship_from (tenant_id, from_party_id, relationship_type, status),
  INDEX idx_party_relationship_to (tenant_id, to_party_id, relationship_type, status),
  INDEX idx_party_relationship_effective (tenant_id, context_type, context_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS organisation_units (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  unit_code VARCHAR(191) NOT NULL,
  name VARCHAR(255) NOT NULL,
  unit_type VARCHAR(64) NOT NULL,
  accountable_legal_entity_party_id VARCHAR(36) NULL,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_org_unit_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_org_unit_legal_entity FOREIGN KEY (accountable_legal_entity_party_id) REFERENCES legal_entities(party_id),
  UNIQUE KEY uq_org_unit_code (tenant_id, unit_code),
  INDEX idx_org_unit_status (tenant_id, status, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS organisation_unit_hierarchy (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  child_unit_id VARCHAR(36) NOT NULL,
  parent_unit_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_org_hierarchy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_org_hierarchy_child FOREIGN KEY (child_unit_id) REFERENCES organisation_units(id),
  CONSTRAINT fk_org_hierarchy_parent FOREIGN KEY (parent_unit_id) REFERENCES organisation_units(id),
  INDEX idx_org_hierarchy_child (tenant_id, child_unit_id, status, valid_from, valid_to),
  INDEX idx_org_hierarchy_parent (tenant_id, parent_unit_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS delegated_authorities (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  grantor_party_id VARCHAR(36) NOT NULL,
  delegate_party_id VARCHAR(36) NOT NULL,
  authority_type VARCHAR(191) NOT NULL,
  basis VARCHAR(500) NOT NULL,
  scope_type VARCHAR(64) NOT NULL,
  scope_id VARCHAR(64) NOT NULL,
  currency_code CHAR(3) NULL,
  value_limit DECIMAL(19,4) NULL,
  allow_subdelegation BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(32) NOT NULL,
  version INT NOT NULL DEFAULT 1,
  valid_from VARCHAR(32) NOT NULL,
  valid_to VARCHAR(32) NULL,
  approved_at VARCHAR(32) NULL,
  revoked_at VARCHAR(32) NULL,
  revocation_reason VARCHAR(500) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_delegated_authority_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_delegated_authority_grantor FOREIGN KEY (grantor_party_id) REFERENCES parties(id),
  CONSTRAINT fk_delegated_authority_delegate FOREIGN KEY (delegate_party_id) REFERENCES parties(id),
  INDEX idx_delegated_authority_delegate (tenant_id, delegate_party_id, authority_type, status),
  INDEX idx_delegated_authority_effective (tenant_id, scope_type, scope_id, status, valid_from, valid_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
