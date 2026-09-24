ALTER TABLE supplier_relationships
  ADD COLUMN canonical_object_id VARCHAR(64) NULL AFTER tenant_id,
  ADD UNIQUE KEY uq_supplier_relationships_canonical_object (tenant_id, canonical_object_id),
  ADD CONSTRAINT fk_supplier_relationships_canonical_object
    FOREIGN KEY (tenant_id, canonical_object_id) REFERENCES canonical_objects(tenant_id, id);

UPDATE supplier_relationships sr
JOIN canonical_objects co
  ON co.tenant_id = sr.tenant_id
 AND co.object_type = 'SUPPLIER_RELATIONSHIP'
 AND co.stable_key = CONCAT('SUPPLIER_RELATIONSHIP:', sr.code)
SET sr.canonical_object_id = co.id
WHERE sr.canonical_object_id IS NULL;

ALTER TABLE supplier_relationships
  MODIFY canonical_object_id VARCHAR(64) NOT NULL;
