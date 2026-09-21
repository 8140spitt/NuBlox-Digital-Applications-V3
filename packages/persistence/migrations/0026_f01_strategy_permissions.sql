INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('function.f01.read', 'Read F01 Strategy & Enterprise Planning', 'View F01 strategy objectives, initiatives, roadmaps, scenarios, plans, outcomes and analysis.'),
  ('function.f01.work', 'Perform F01 Strategy & Enterprise Planning work', 'Create and maintain native F01 Strategy & Enterprise Planning work products.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-021', 'ROLE-PLATFORM-ADMINISTRATOR', 'function.f01.read'),
  ('ARP-PLATFORM-ADMIN-022', 'ROLE-PLATFORM-ADMINISTRATOR', 'function.f01.work');
