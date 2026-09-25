CREATE TABLE party_type_assignments (
  tenant_id VARCHAR(64) NOT NULL,
  party_id VARCHAR(64) NOT NULL,
  party_type VARCHAR(32) NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (tenant_id, party_id, party_type),
  KEY ix_party_type_assignments_type (tenant_id, party_type, status),
  CONSTRAINT fk_party_type_assignments_party
    FOREIGN KEY (tenant_id, party_id) REFERENCES parties(tenant_id, id),
  CONSTRAINT chk_party_type_assignments_type CHECK (
    party_type IN ('TENANT', 'EMPLOYEE', 'CLIENT', 'VENDOR_SUPPLIER')
  ),
  CONSTRAINT chk_party_type_assignments_status CHECK (
    status IN ('ACTIVE', 'INACTIVE')
  )
) ENGINE=InnoDB;

INSERT IGNORE INTO party_type_assignments
  (tenant_id, party_id, party_type, status)
SELECT p.tenant_id, p.party_id, 'EMPLOYEE', 'ACTIVE'
  FROM persons p
 WHERE p.status = 'ACTIVE';

INSERT IGNORE INTO party_type_assignments
  (tenant_id, party_id, party_type, status)
SELECT DISTINCT o.tenant_id, o.party_id, 'TENANT', 'ACTIVE'
  FROM organisations o
  JOIN organisation_units ou
    ON ou.tenant_id = o.tenant_id
   AND ou.organisation_id = o.id
 WHERE o.status = 'ACTIVE'
   AND ou.status = 'ACTIVE';

INSERT IGNORE INTO party_type_assignments
  (tenant_id, party_id, party_type, status)
SELECT DISTINCT o.tenant_id, o.party_id, 'CLIENT', 'ACTIVE'
  FROM sales_accounts sa
  JOIN organisations o
    ON o.tenant_id = sa.tenant_id
   AND o.id = sa.organisation_id
 WHERE sa.status = 'ACTIVE'
   AND o.status = 'ACTIVE';

INSERT IGNORE INTO party_type_assignments
  (tenant_id, party_id, party_type, status)
SELECT DISTINCT o.tenant_id, o.party_id, 'VENDOR_SUPPLIER', 'ACTIVE'
  FROM supplier_relationships sr
  JOIN organisations o
    ON o.tenant_id = sr.tenant_id
   AND o.id = sr.supplier_organisation_id
 WHERE sr.status <> 'CANCELLED'
   AND o.status = 'ACTIVE';
