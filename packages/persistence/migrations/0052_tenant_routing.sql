ALTER TABLE tenants
  ADD COLUMN slug VARCHAR(80) NULL AFTER id;

UPDATE tenants
   SET slug = CONCAT('tenant-', LOWER(SUBSTRING(SHA2(id, 256), 1, 16)))
 WHERE slug IS NULL OR slug = '';

ALTER TABLE tenants
  MODIFY COLUMN slug VARCHAR(80) NOT NULL,
  ADD UNIQUE KEY uq_tenants_slug (slug),
  ADD CONSTRAINT chk_tenants_slug_format CHECK (
    slug REGEXP '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'
  );
