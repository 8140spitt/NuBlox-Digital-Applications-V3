CREATE TABLE site_work_packages (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  project_object_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  manager_person_id VARCHAR(64) NOT NULL,
  planned_start DATETIME(6) NULL,
  planned_end DATETIME(6) NULL,
  status VARCHAR(24) NOT NULL,
  work_package_created_at DATETIME(6) NOT NULL,
  completed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_site_work_packages_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_site_work_packages_object (tenant_id,canonical_object_id),
  UNIQUE KEY uq_site_work_packages_code (tenant_id,project_object_id,code),
  KEY ix_site_work_packages_manager_status (tenant_id,manager_person_id,status),
  CONSTRAINT fk_site_work_package_object FOREIGN KEY (tenant_id,canonical_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_site_work_package_project FOREIGN KEY (tenant_id,project_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_site_work_package_manager FOREIGN KEY (tenant_id,manager_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_site_work_package_status CHECK (status IN ('PLANNED','ACTIVE','ON_HOLD','COMPLETE','CANCELLED')),
  CONSTRAINT chk_site_work_package_window CHECK (planned_end IS NULL OR planned_start IS NULL OR planned_end>=planned_start),
  CONSTRAINT chk_site_work_package_completion CHECK (
    (status IN ('PLANNED','ACTIVE','ON_HOLD','CANCELLED') AND completed_at IS NULL)
    OR (status='COMPLETE' AND completed_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE site_daily_logs (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  work_package_id VARCHAR(64) NOT NULL,
  log_date DATE NOT NULL,
  summary TEXT NOT NULL,
  conditions TEXT NULL,
  labour_count INT NULL,
  plant_summary TEXT NULL,
  materials_summary TEXT NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  log_created_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_site_daily_logs_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_site_daily_logs_day (tenant_id,work_package_id,log_date),
  CONSTRAINT fk_site_daily_log_package FOREIGN KEY (tenant_id,work_package_id) REFERENCES site_work_packages(tenant_id,id),
  CONSTRAINT fk_site_daily_log_creator FOREIGN KEY (tenant_id,created_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_site_daily_log_labour CHECK (labour_count IS NULL OR labour_count>=0)
) ENGINE=InnoDB;

CREATE TABLE site_progress_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  work_package_id VARCHAR(64) NOT NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  percent_complete DECIMAL(7,3) NOT NULL,
  quantity_completed DECIMAL(18,4) NULL,
  unit VARCHAR(64) NULL,
  note TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_site_progress_tenant_id_id (tenant_id,id),
  KEY ix_site_progress_package_time (tenant_id,work_package_id,occurred_at),
  CONSTRAINT fk_site_progress_package FOREIGN KEY (tenant_id,work_package_id) REFERENCES site_work_packages(tenant_id,id),
  CONSTRAINT fk_site_progress_recorder FOREIGN KEY (tenant_id,recorded_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_site_progress_percent CHECK (percent_complete>=0 AND percent_complete<=100),
  CONSTRAINT chk_site_progress_quantity CHECK (quantity_completed IS NULL OR quantity_completed>=0)
) ENGINE=InnoDB;

CREATE TABLE site_field_evidence (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  work_package_id VARCHAR(64) NOT NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  evidence_type VARCHAR(24) NOT NULL,
  evidence_reference VARCHAR(1000) NOT NULL,
  description TEXT NULL,
  occurred_at DATETIME(6) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_site_field_evidence_tenant_id_id (tenant_id,id),
  KEY ix_site_field_evidence_package_time (tenant_id,work_package_id,occurred_at),
  CONSTRAINT fk_site_field_evidence_package FOREIGN KEY (tenant_id,work_package_id) REFERENCES site_work_packages(tenant_id,id),
  CONSTRAINT fk_site_field_evidence_recorder FOREIGN KEY (tenant_id,recorded_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_site_field_evidence_type CHECK (evidence_type IN ('PHOTO','DOCUMENT','CHECKLIST','MEASUREMENT','DELIVERY','OTHER'))
) ENGINE=InnoDB;

CREATE TABLE site_issues (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  work_package_id VARCHAR(64) NOT NULL,
  issue_type VARCHAR(24) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  raised_by_person_id VARCHAR(64) NOT NULL,
  assigned_to_person_id VARCHAR(64) NULL,
  due_at DATETIME(6) NULL,
  raised_at DATETIME(6) NOT NULL,
  resolved_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_site_issues_tenant_id_id (tenant_id,id),
  KEY ix_site_issues_assignee_status (tenant_id,assigned_to_person_id,status,due_at),
  CONSTRAINT fk_site_issue_package FOREIGN KEY (tenant_id,work_package_id) REFERENCES site_work_packages(tenant_id,id),
  CONSTRAINT fk_site_issue_raiser FOREIGN KEY (tenant_id,raised_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_site_issue_assignee FOREIGN KEY (tenant_id,assigned_to_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_site_issue_type CHECK (issue_type IN ('RFI','PUNCH','DEFECT','BLOCKER','QUALITY','SAFETY','DESIGN','OTHER')),
  CONSTRAINT chk_site_issue_priority CHECK (priority IN ('LOW','NORMAL','HIGH','CRITICAL')),
  CONSTRAINT chk_site_issue_status CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
  CONSTRAINT chk_site_issue_resolution CHECK (
    (status IN ('OPEN','IN_PROGRESS') AND resolved_at IS NULL)
    OR (status IN ('RESOLVED','CLOSED') AND resolved_at IS NOT NULL)
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('domain.site_production.read','Read site production','View construction work packages, daily logs, progress, field evidence and site issues.'),
 ('domain.site_production.manage','Manage site production','Create and control construction work packages.'),
 ('domain.site_production.execute','Execute site production','Record daily site activity, progress and field evidence.'),
 ('domain.site_production.issue_manage','Manage site issues','Raise, assign and resolve RFIs, punch items, defects and other site issues.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-079','ROLE-PLATFORM-ADMINISTRATOR','domain.site_production.read'),
 ('ARP-PLATFORM-ADMIN-080','ROLE-PLATFORM-ADMINISTRATOR','domain.site_production.manage'),
 ('ARP-PLATFORM-ADMIN-081','ROLE-PLATFORM-ADMINISTRATOR','domain.site_production.execute'),
 ('ARP-PLATFORM-ADMIN-082','ROLE-PLATFORM-ADMINISTRATOR','domain.site_production.issue_manage');
