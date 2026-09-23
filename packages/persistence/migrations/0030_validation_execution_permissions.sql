INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.validation.execute', 'Execute validation', 'Run governed validation rule sets against canonical subjects and retain evaluation evidence.'),
  ('platform.validation.conflict.disposition', 'Disposition validation conflicts', 'Resolve, waive or cancel governed validation conflicts with attributable evidence.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-029', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.validation.execute'),
  ('ARP-PLATFORM-ADMIN-030', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.validation.conflict.disposition');
