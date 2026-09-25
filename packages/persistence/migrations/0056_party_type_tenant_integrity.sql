DELETE pta
  FROM party_type_assignments pta
 WHERE pta.party_type = 'TENANT'
   AND pta.status = 'ACTIVE'
   AND NOT EXISTS (
     SELECT 1
       FROM tenant_party_bindings b
      WHERE b.tenant_id = pta.tenant_id
        AND b.party_id = pta.party_id
   );

ALTER TABLE party_type_assignments
  ADD COLUMN active_tenant_type_guard VARCHAR(64)
    GENERATED ALWAYS AS (
      CASE
        WHEN party_type = 'TENANT' AND status = 'ACTIVE' THEN tenant_id
        ELSE NULL
      END
    ) STORED,
  ADD UNIQUE KEY uq_party_type_assignments_one_active_tenant
    (active_tenant_type_guard);
