-- NuBlox V3 MySQL
-- 0005: Tenant aggregate optimistic/event versioning
-- Gives AGG-01-TENANT a monotonic version for authority/configuration changes.

ALTER TABLE tenants
  ADD COLUMN version INT NOT NULL DEFAULT 1 AFTER status;
