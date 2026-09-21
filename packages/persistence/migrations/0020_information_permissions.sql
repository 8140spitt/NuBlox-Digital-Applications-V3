INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.information.read', 'Read governed information', 'View Information Containers, revisions, iterations, Representations and issue history in the tenant.'),
  ('platform.information.manage', 'Manage governed information', 'Create and control Information Containers, revisions, iterations, Representations, releases and issues subject to Authority.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-015', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.information.read'),
  ('ARP-PLATFORM-ADMIN-016', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.information.manage');
