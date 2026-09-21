INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.industry_delivery.read', 'Read industry delivery planning', 'View tenant services, CBE capability portfolio, delivery capability demand and fulfilment.'),
  ('platform.industry_delivery.manage', 'Manage industry delivery planning', 'Define tenant services and CBE capabilities, raise delivery capability requirements, and fulfil them from internal or external supply.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-019', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.industry_delivery.read'),
  ('ARP-PLATFORM-ADMIN-020', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.industry_delivery.manage');
