INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.competence.read', 'Read competence governance', 'View competence requirements and competence evidence in the tenant.'),
  ('platform.competence.manage', 'Manage competence governance', 'Create competence requirements and record competence evidence subject to tenant governance.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-013', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.competence.read'),
  ('ARP-PLATFORM-ADMIN-014', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.competence.manage');
