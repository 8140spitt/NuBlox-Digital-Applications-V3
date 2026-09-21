INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.function.read', 'Read governed Functions', 'View governed Function, L2 and Activity definitions and workspace scope.'),
  ('platform.work.read', 'Read My Work', 'View work, deliverable, review, approval, acceptance and competence obligations assigned to the current principal.'),
  ('platform.organisation.read', 'Read Organisation structure', 'View tenant Organisation, Organisation Unit, Position and occupancy structures.'),
  ('platform.organisation.manage', 'Manage Organisation structure', 'Create and maintain tenant Organisation, Organisation Unit and Position structures.'),
  ('platform.people.read', 'Read people', 'View tenant Person and Position occupancy information.'),
  ('platform.people.manage', 'Manage people', 'Create and maintain tenant Person and Position occupancy information.'),
  ('platform.access.manage', 'Manage access', 'Create and maintain access roles, permission grants and scoped role assignments.'),
  ('platform.deployment.read', 'Read Functional Deployments', 'View Functional Deployment, responsibility, competence and capacity assignments.'),
  ('platform.deployment.manage', 'Manage Functional Deployments', 'Create and maintain Functional Deployment, responsibility, competence and capacity assignments.'),
  ('platform.audit.read', 'Read audit and evidence', 'View attributable platform audit history and evidence subject to scope.'),
  ('platform.configuration.read', 'Read configuration control', 'View lifecycle, information revision, change, baseline and configuration control state.'),
  ('platform.configuration.manage', 'Manage configuration control', 'Operate lifecycle, information revision, change, baseline and configuration control subject to Authority.');

INSERT INTO access_roles
  (id, catalogue_scope, tenant_id, code, name, description, status)
VALUES
  ('ROLE-PLATFORM-ADMINISTRATOR', 'PLATFORM', NULL, 'PLATFORM-ADMINISTRATOR',
   'Platform Administrator',
   'Tenant-scoped administrative role for the NuBlox platform control plane. Assignment of this role does not itself grant business Decision Authority.',
   'ACTIVE');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-001', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.function.read'),
  ('ARP-PLATFORM-ADMIN-002', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.work.read'),
  ('ARP-PLATFORM-ADMIN-003', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.organisation.read'),
  ('ARP-PLATFORM-ADMIN-004', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.organisation.manage'),
  ('ARP-PLATFORM-ADMIN-005', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.people.read'),
  ('ARP-PLATFORM-ADMIN-006', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.people.manage'),
  ('ARP-PLATFORM-ADMIN-007', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.access.manage'),
  ('ARP-PLATFORM-ADMIN-008', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.deployment.read'),
  ('ARP-PLATFORM-ADMIN-009', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.deployment.manage'),
  ('ARP-PLATFORM-ADMIN-010', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.audit.read'),
  ('ARP-PLATFORM-ADMIN-011', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration.read'),
  ('ARP-PLATFORM-ADMIN-012', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.configuration.manage');
