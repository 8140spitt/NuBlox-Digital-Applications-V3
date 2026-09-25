CREATE TABLE tenant_party_bindings (
  tenant_id VARCHAR(64) NOT NULL PRIMARY KEY,
  party_id VARCHAR(64) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_tenant_party_bindings_party (party_id),
  UNIQUE KEY uq_tenant_party_bindings_organisation (organisation_id),
  CONSTRAINT fk_tenant_party_bindings_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_tenant_party_bindings_party
    FOREIGN KEY (tenant_id, party_id) REFERENCES parties(tenant_id, id),
  CONSTRAINT fk_tenant_party_bindings_organisation
    FOREIGN KEY (tenant_id, organisation_id) REFERENCES organisations(tenant_id, id)
) ENGINE=InnoDB;

INSERT IGNORE INTO tenant_party_bindings (tenant_id, party_id, organisation_id)
SELECT ranked.tenant_id, ranked.party_id, ranked.organisation_id
  FROM (
    SELECT
      o.tenant_id,
      o.party_id,
      o.id AS organisation_id,
      ROW_NUMBER() OVER (
        PARTITION BY o.tenant_id
        ORDER BY COUNT(ou.id) DESC, o.created_at ASC, o.id ASC
      ) AS rn
    FROM organisations o
    LEFT JOIN organisation_units ou
      ON ou.tenant_id = o.tenant_id
     AND ou.organisation_id = o.id
     AND ou.status = 'ACTIVE'
    WHERE o.status = 'ACTIVE'
    GROUP BY o.tenant_id, o.party_id, o.id, o.created_at
  ) ranked
 WHERE ranked.rn = 1;

INSERT IGNORE INTO party_type_assignments
  (tenant_id, party_id, party_type, status)
SELECT tenant_id, party_id, 'TENANT', 'ACTIVE'
  FROM tenant_party_bindings;
