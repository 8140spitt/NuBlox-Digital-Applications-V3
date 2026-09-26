CREATE TABLE platform_tool_definitions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  code VARCHAR(96) NOT NULL,
  name VARCHAR(160) NOT NULL,
  tool_class VARCHAR(2) NOT NULL,
  owner_function_id VARCHAR(16) NULL,
  purpose TEXT NOT NULL,
  required_permission_key VARCHAR(160) NULL,
  required_authority_scope VARCHAR(160) NULL,
  config_schema_ref VARCHAR(255) NULL,
  consumes_object_types JSON NOT NULL,
  produces_object_types JSON NOT NULL,
  produces_deliverable_types JSON NOT NULL,
  evidence_requirements JSON NOT NULL,
  version VARCHAR(32) NOT NULL,
  lifecycle_status VARCHAR(16) NOT NULL,
  implementation_state VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT ux_platform_tool_definitions_code UNIQUE (code),
  CONSTRAINT fk_platform_tool_definitions_owner_function
    FOREIGN KEY (owner_function_id) REFERENCES function_definitions(id),
  CONSTRAINT chk_platform_tool_definitions_class
    CHECK (tool_class IN ('K0','K1','K2','K3','K4','K5')),
  CONSTRAINT chk_platform_tool_definitions_lifecycle
    CHECK (lifecycle_status IN ('REGISTERED','RETIRED')),
  CONSTRAINT chk_platform_tool_definitions_implementation
    CHECK (implementation_state IN ('PLANNED','PARTIAL','IMPLEMENTED'))
);

CREATE INDEX idx_platform_tool_definitions_owner
  ON platform_tool_definitions(owner_function_id, tool_class, lifecycle_status);

CREATE TABLE function_tool_compositions (
  function_id VARCHAR(16) NOT NULL,
  tool_id VARCHAR(64) NOT NULL,
  workspace_view VARCHAR(16) NOT NULL,
  workspace_zone VARCHAR(32) NOT NULL,
  operating_side VARCHAR(32) NOT NULL,
  display_order INT UNSIGNED NOT NULL,
  is_default_open BOOLEAN NOT NULL DEFAULT FALSE,
  tenant_configurable BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (function_id, tool_id, workspace_view, workspace_zone, operating_side),
  CONSTRAINT fk_function_tool_compositions_function
    FOREIGN KEY (function_id) REFERENCES function_definitions(id),
  CONSTRAINT fk_function_tool_compositions_tool
    FOREIGN KEY (tool_id) REFERENCES platform_tool_definitions(id),
  CONSTRAINT chk_function_tool_compositions_view
    CHECK (workspace_view IN ('OVERVIEW','GOVERNANCE','DELIVERY','PERFORMANCE','RECORDS')),
  CONSTRAINT chk_function_tool_compositions_zone
    CHECK (workspace_zone IN (
      'COMMAND_BAR','QUEUE_PANEL','WORK_SURFACE','OBJECT_INSPECTOR',
      'EVIDENCE_PANEL','DECISION_PANEL','KPI_RAIL'
    )),
  CONSTRAINT chk_function_tool_compositions_side
    CHECK (operating_side IN ('BOTH','FUNCTIONAL_GOVERNANCE','FUNCTIONAL_DELIVERY')),
  CONSTRAINT chk_function_tool_compositions_status
    CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE INDEX idx_function_tool_compositions_workspace
  ON function_tool_compositions(function_id, workspace_view, operating_side, display_order);

INSERT INTO platform_tool_definitions
  (id, code, name, tool_class, owner_function_id, purpose,
   required_permission_key, required_authority_scope, config_schema_ref,
   consumes_object_types, produces_object_types, produces_deliverable_types,
   evidence_requirements, version, lifecycle_status, implementation_state)
VALUES
('TOOL-K0-IDENTITY','K0.IDENTITY','Identity','K0',NULL,'Resolve authenticated human and service identities.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('Identity'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','IMPLEMENTED'),
('TOOL-K0-PARTY','K0.PARTY','Party','K0',NULL,'Provide canonical Tenant, Employee, Client and Vendor/Supplier party identity.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('Party'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','IMPLEMENTED'),
('TOOL-K0-POSITION','K0.POSITION','Position','K0',NULL,'Resolve organisational Position, occupancy and reporting context.',NULL,NULL,NULL,JSON_ARRAY('Person','JobProfile'),JSON_ARRAY('Position'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','IMPLEMENTED'),
('TOOL-K0-AUTHORITY','K0.AUTHORITY','Authority','K0',NULL,'Resolve Decision Authority independently of permission and responsibility.',NULL,NULL,NULL,JSON_ARRAY('Position','AuthorityAssignment'),JSON_ARRAY('AuthorityResolution'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K0-PERMISSION','K0.PERMISSION','Permission','K0',NULL,'Resolve access permission and governed scope.',NULL,NULL,NULL,JSON_ARRAY('Person','Position','AccessRole'),JSON_ARRAY('PermissionResolution'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','IMPLEMENTED'),
('TOOL-K0-WORKFLOW','K0.WORKFLOW','Workflow Engine','K0',NULL,'Control lifecycle transitions, work routing and stateful execution.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY('WorkflowInstance'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K0-EVIDENCE','K0.EVIDENCE','Evidence Store','K0',NULL,'Capture attributable evidence for work, Decision, review and acceptance.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY('Evidence'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K0-AUDIT','K0.AUDIT','Audit Log','K0',NULL,'Record attributable platform and business actions.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('AuditEntry'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','IMPLEMENTED'),
('TOOL-K0-RULES','K0.RULES','Rules Engine','K0',NULL,'Evaluate governed business rules and machine-actionable controls.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('RuleEvaluation'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K0-CALCULATION','K0.CALCULATION','Calculation Engine','K0',NULL,'Execute governed calculations without embedding formula logic in presentation layers.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('CalculationResult'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K0-NUMBERING','K0.NUMBERING','Numbering','K0',NULL,'Issue governed identifiers and sequences.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('SequenceValue'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K0-SEARCH','K0.SEARCH','Search Index','K0',NULL,'Provide governed cross-object discovery.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K0-NOTIFICATION','K0.NOTIFICATION','Notification','K0',NULL,'Deliver attributable work and lifecycle notifications.',NULL,NULL,NULL,JSON_ARRAY('WorkflowInstance'),JSON_ARRAY('Notification'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-WORK-QUEUE','K1.WORK_QUEUE','Work Queue','K1',NULL,'Present work awaiting the user in the current Function and Position scope.',NULL,NULL,NULL,JSON_ARRAY('WorkItem'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-APPROVAL-WORKBENCH','K1.APPROVAL_WORKBENCH','Approval Workbench','K1',NULL,'Present governed reviews and Decisions subject to Permission and Authority.',NULL,NULL,NULL,JSON_ARRAY('Decision','Review'),JSON_ARRAY('Decision'),JSON_ARRAY(),JSON_ARRAY('decision_attribution'),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-EVIDENCE-CAPTURE','K1.EVIDENCE_CAPTURE','Evidence Capture','K1',NULL,'Capture required evidence against the exact governed object and version.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY('Evidence'),JSON_ARRAY(),JSON_ARRAY('actor','timestamp','object_version'),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-DOCUMENT-AUTHORING','K1.DOCUMENT_AUTHORING','Document Authoring','K1',NULL,'Create and revise governed information using controlled metadata and lifecycle.',NULL,NULL,NULL,JSON_ARRAY('InformationContainer'),JSON_ARRAY('InformationItem'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-REGISTER-BUILDER','K1.REGISTER_BUILDER','Register Builder','K1',NULL,'Render object-backed registers and governed list views.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-REPORT-BUILDER','K1.REPORT_BUILDER','Report Builder','K1',NULL,'Create governed reports from canonical enterprise data.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY('Report'),JSON_ARRAY('Report'),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K1-DASHBOARD-BUILDER','K1.DASHBOARD_BUILDER','Dashboard Builder','K1',NULL,'Compose KPI and KRI views from governed measures.',NULL,NULL,NULL,JSON_ARRAY('Measure'),JSON_ARRAY('Dashboard'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K1-SAVED-VIEWS','K1.SAVED_VIEWS','Saved Views','K1',NULL,'Persist user and team filters without creating parallel business data.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY('SavedView'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K1-BULK-ACTIONS','K1.BULK_ACTIONS','Bulk Actions','K1',NULL,'Execute authorised repeat actions across a controlled object set.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-K1-IMPORT-EXPORT','K1.IMPORT_EXPORT','Import / Export','K1',NULL,'Move governed data through validated import and export contracts.',NULL,NULL,NULL,JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY('validation_result'),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-AUDIT-TRAIL','K1.AUDIT_TRAIL','Audit Trail Viewer','K1',NULL,'Expose attributable history and evidence for governed objects.',NULL,NULL,NULL,JSON_ARRAY('AuditEntry'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL'),
('TOOL-K1-OBJECT-INSPECTOR','K1.OBJECT_INSPECTOR','Object Inspector','K1',NULL,'Show canonical object identity, state, metadata and relationships.',NULL,NULL,NULL,JSON_ARRAY('CanonicalObject'),JSON_ARRAY(),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PARTIAL');

INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-OBJECT-INSPECTOR','OVERVIEW','OBJECT_INSPECTOR','BOTH',10,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-REGISTER-BUILDER','OVERVIEW','WORK_SURFACE','BOTH',20,TRUE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-APPROVAL-WORKBENCH','GOVERNANCE','DECISION_PANEL','FUNCTIONAL_GOVERNANCE',10,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-EVIDENCE-CAPTURE','GOVERNANCE','EVIDENCE_PANEL','FUNCTIONAL_GOVERNANCE',20,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-WORK-QUEUE','DELIVERY','QUEUE_PANEL','FUNCTIONAL_DELIVERY',10,TRUE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-REGISTER-BUILDER','DELIVERY','WORK_SURFACE','FUNCTIONAL_DELIVERY',20,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-OBJECT-INSPECTOR','DELIVERY','OBJECT_INSPECTOR','FUNCTIONAL_DELIVERY',30,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-DASHBOARD-BUILDER','PERFORMANCE','KPI_RAIL','BOTH',10,TRUE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-REPORT-BUILDER','PERFORMANCE','WORK_SURFACE','BOTH',20,FALSE,TRUE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';
INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
SELECT id,'TOOL-K1-AUDIT-TRAIL','RECORDS','EVIDENCE_PANEL','BOTH',10,TRUE,FALSE,'ACTIVE'
  FROM function_definitions WHERE status='ACTIVE';

INSERT INTO platform_tool_definitions
  (id, code, name, tool_class, owner_function_id, purpose,
   required_permission_key, required_authority_scope, config_schema_ref,
   consumes_object_types, produces_object_types, produces_deliverable_types,
   evidence_requirements, version, lifecycle_status, implementation_state)
VALUES
('TOOL-F02-BOARD-COMMITTEE-REGISTER','F02.BOARD_COMMITTEE_REGISTER','Board & Committee Register','K3','F02','Maintain governed Board and Committee constitution, membership and status.','function.f02.read',NULL,NULL,JSON_ARRAY('Board','Committee','Position'),JSON_ARRAY('Board','Committee'),JSON_ARRAY(),JSON_ARRAY('constitution_record'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-MEETING-MANAGER','F02.MEETING_MANAGER','Meeting Manager','K3','F02','Plan, notice, conduct and close governed Board and Committee meetings.','function.f02.work',NULL,NULL,JSON_ARRAY('Board','Committee','AgendaItem'),JSON_ARRAY('Meeting','AgendaItem'),JSON_ARRAY('DELIV-MINUTES'),JSON_ARRAY('attendance','quorum'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-PAPER-SUBMISSION','F02.PAPER_SUBMISSION','Paper Submission','K3','F02','Submit, classify and prepare governance papers for controlled review and circulation.','function.f02.work',NULL,NULL,JSON_ARRAY('Meeting','AgendaItem'),JSON_ARRAY('Paper'),JSON_ARRAY(),JSON_ARRAY('author_approval','classification'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-BOARD-PACK-BUILDER','F02.BOARD_PACK_BUILDER','Board Pack Builder','K3','F02','Compose an approved meeting pack from controlled papers and agenda context.','function.f02.work',NULL,NULL,JSON_ARRAY('Meeting','AgendaItem','Paper'),JSON_ARRAY('BoardPack'),JSON_ARRAY('DELIV-BOARD-PACK'),JSON_ARRAY('paper_approved_by_author','paper_classified'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-RESOLUTION-REGISTER','F02.RESOLUTION_REGISTER','Resolution Register','K3','F02','Record resolutions and their attributable Decision context.','function.f02.work','governance.board.resolve',NULL,JSON_ARRAY('Meeting','AgendaItem','Decision'),JSON_ARRAY('Resolution'),JSON_ARRAY(),JSON_ARRAY('quorum','vote_record'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-DECISION-PUBLISHER','F02.DECISION_PUBLISHER','Decision Record Publisher','K3','F02','Publish authorised governance Decisions with exact source and evidence context.','function.f02.work','governance.board.resolve',NULL,JSON_ARRAY('Decision','Resolution'),JSON_ARRAY('DecisionRecord'),JSON_ARRAY(),JSON_ARRAY('authority_resolution','decision_attribution'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-DELEGATION-MATRIX','F02.DELEGATION_MATRIX','Delegation of Authority Matrix','K3','F02','Define, publish and review governed delegated authority.','function.f02.work','governance.delegation.approve',NULL,JSON_ARRAY('Position','AuthorityDefinition'),JSON_ARRAY('Delegation'),JSON_ARRAY(),JSON_ARRAY('board_resolution'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-CONFLICT-REGISTER','F02.CONFLICT_REGISTER','Conflict of Interest Register','K3','F02','Declare, assess and manage governance conflicts and recusal.','function.f02.work',NULL,NULL,JSON_ARRAY('Person','Position','AgendaItem'),JSON_ARRAY('ConflictDeclaration'),JSON_ARRAY(),JSON_ARRAY('declaration','materiality_assessment','recusal_decision'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-DIRECTOR-TRACKER','F02.DIRECTOR_TRACKER','Director Appointment & Independence Tracker','K3','F02','Maintain director appointment, tenure, independence and governance evidence.','function.f02.work',NULL,NULL,JSON_ARRAY('Person','Position','Board'),JSON_ARRAY('DirectorAppointment'),JSON_ARRAY(),JSON_ARRAY('appointment_evidence','independence_assessment'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-GOVERNANCE-CALENDAR','F02.GOVERNANCE_CALENDAR','Governance Calendar','K3','F02','Plan statutory, Board, Committee and recurring governance obligations.','function.f02.read',NULL,NULL,JSON_ARRAY('Board','Committee','Obligation'),JSON_ARRAY('GovernanceCalendarEntry'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-BOARD-EVALUATION','F02.BOARD_EVALUATION','Board Evaluation','K3','F02','Run and evidence Board and Committee effectiveness evaluation.','function.f02.work',NULL,NULL,JSON_ARRAY('Board','Committee'),JSON_ARRAY('BoardEvaluation'),JSON_ARRAY('DELIV-GOV-STATEMENT'),JSON_ARRAY('evaluation_completion'),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-ACTION-TRACKER','F02.ACTION_TRACKER','Governance Action Tracker','K3','F02','Assign and track actions arising from meetings, Decisions and assurance.','function.f02.work',NULL,NULL,JSON_ARRAY('Meeting','Decision','Resolution'),JSON_ARRAY('Action'),JSON_ARRAY(),JSON_ARRAY(),'1.0.0','REGISTERED','PLANNED'),
('TOOL-F02-STATUTORY-FILING','F02.STATUTORY_FILING','Statutory Filing Register','K3','F02','Control governance filing obligations, submissions and receipts.','function.f02.work','governance.filing.approve',NULL,JSON_ARRAY('Organisation','Obligation'),JSON_ARRAY('StatutoryFiling'),JSON_ARRAY(),JSON_ARRAY('filing_receipt'),'1.0.0','REGISTERED','PLANNED');

INSERT INTO function_tool_compositions
  (function_id, tool_id, workspace_view, workspace_zone, operating_side, display_order, is_default_open, tenant_configurable, status)
VALUES
('F02','TOOL-F02-BOARD-COMMITTEE-REGISTER','OVERVIEW','WORK_SURFACE','BOTH',30,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-GOVERNANCE-CALENDAR','OVERVIEW','WORK_SURFACE','BOTH',40,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-MEETING-MANAGER','GOVERNANCE','COMMAND_BAR','FUNCTIONAL_GOVERNANCE',30,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-PAPER-SUBMISSION','GOVERNANCE','COMMAND_BAR','FUNCTIONAL_GOVERNANCE',40,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-RESOLUTION-REGISTER','GOVERNANCE','COMMAND_BAR','FUNCTIONAL_GOVERNANCE',50,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-DELEGATION-MATRIX','GOVERNANCE','WORK_SURFACE','FUNCTIONAL_GOVERNANCE',60,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-CONFLICT-REGISTER','GOVERNANCE','WORK_SURFACE','FUNCTIONAL_GOVERNANCE',70,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-DIRECTOR-TRACKER','GOVERNANCE','WORK_SURFACE','FUNCTIONAL_GOVERNANCE',80,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-MEETING-MANAGER','DELIVERY','WORK_SURFACE','FUNCTIONAL_DELIVERY',40,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-BOARD-PACK-BUILDER','DELIVERY','WORK_SURFACE','FUNCTIONAL_DELIVERY',50,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-ACTION-TRACKER','DELIVERY','QUEUE_PANEL','FUNCTIONAL_DELIVERY',60,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-DECISION-PUBLISHER','DELIVERY','DECISION_PANEL','FUNCTIONAL_DELIVERY',70,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-BOARD-EVALUATION','PERFORMANCE','WORK_SURFACE','BOTH',30,FALSE,TRUE,'ACTIVE'),
('F02','TOOL-F02-RESOLUTION-REGISTER','RECORDS','WORK_SURFACE','BOTH',30,FALSE,FALSE,'ACTIVE'),
('F02','TOOL-F02-STATUTORY-FILING','RECORDS','WORK_SURFACE','BOTH',40,FALSE,TRUE,'ACTIVE');
