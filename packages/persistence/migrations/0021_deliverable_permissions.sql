INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.deliverable.read', 'Read governed deliverables', 'View Deliverable Requirements, Items, responsibilities, reviews, approvals, issues, recipient responses, rework and acceptance state in the tenant.'),
  ('platform.deliverable.manage', 'Manage governed deliverables', 'Create and control Deliverable Requirements and Items through responsibility, review, approval, issue, response, rework, acceptance and closure subject to Authority.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-017', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.deliverable.read'),
  ('ARP-PLATFORM-ADMIN-018', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.deliverable.manage');
