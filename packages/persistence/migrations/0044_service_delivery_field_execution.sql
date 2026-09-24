CREATE TABLE service_orders (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  scope_object_id VARCHAR(64) NOT NULL,
  order_number VARCHAR(120) NOT NULL,
  title VARCHAR(255) NOT NULL,
  service_type VARCHAR(32) NOT NULL,
  priority VARCHAR(16) NOT NULL,
  status VARCHAR(24) NOT NULL,
  description TEXT NULL,
  service_location VARCHAR(500) NULL,
  requested_start DATETIME(6) NULL,
  requested_end DATETIME(6) NULL,
  sla_due_at DATETIME(6) NULL,
  created_by_person_id VARCHAR(64) NOT NULL,
  order_created_at DATETIME(6) NOT NULL,
  completed_by_person_id VARCHAR(64) NULL,
  completed_at DATETIME(6) NULL,
  accepted_by_person_id VARCHAR(64) NULL,
  accepted_at DATETIME(6) NULL,
  acceptance_note TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_service_orders_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_service_orders_number (tenant_id,order_number),
  CONSTRAINT fk_service_orders_scope FOREIGN KEY (tenant_id,scope_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_service_orders_creator FOREIGN KEY (tenant_id,created_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_service_orders_completer FOREIGN KEY (tenant_id,completed_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT fk_service_orders_accepter FOREIGN KEY (tenant_id,accepted_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_service_orders_type CHECK (service_type IN ('FIELD_SERVICE','INSTALLATION','MAINTENANCE','REPAIR','INSPECTION','PROFESSIONAL_SERVICE','OTHER')),
  CONSTRAINT chk_service_orders_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  CONSTRAINT chk_service_orders_status CHECK (status IN ('DRAFT','SCHEDULED','DISPATCHED','IN_PROGRESS','COMPLETED','ACCEPTED','CANCELLED')),
  CONSTRAINT chk_service_orders_requested_window CHECK (requested_end IS NULL OR requested_start IS NULL OR requested_end>=requested_start),
  CONSTRAINT chk_service_orders_completion CHECK (
    (status IN ('DRAFT','SCHEDULED','DISPATCHED','IN_PROGRESS','CANCELLED') AND completed_at IS NULL AND accepted_at IS NULL)
    OR (status='COMPLETED' AND completed_at IS NOT NULL AND accepted_at IS NULL)
    OR (status='ACCEPTED' AND completed_at IS NOT NULL AND accepted_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE service_assignments (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  service_order_id VARCHAR(64) NOT NULL,
  assignee_person_id VARCHAR(64) NOT NULL,
  scheduled_start DATETIME(6) NOT NULL,
  scheduled_end DATETIME(6) NOT NULL,
  status VARCHAR(24) NOT NULL,
  dispatch_notes TEXT NULL,
  dispatched_at DATETIME(6) NULL,
  acknowledged_at DATETIME(6) NULL,
  en_route_at DATETIME(6) NULL,
  on_site_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_service_assignments_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_service_assignment_window (tenant_id,service_order_id,assignee_person_id,scheduled_start),
  CONSTRAINT fk_service_assignment_order FOREIGN KEY (tenant_id,service_order_id) REFERENCES service_orders(tenant_id,id),
  CONSTRAINT fk_service_assignment_person FOREIGN KEY (tenant_id,assignee_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_service_assignment_status CHECK (status IN ('PLANNED','DISPATCHED','ACKNOWLEDGED','EN_ROUTE','ON_SITE','COMPLETED','CANCELLED')),
  CONSTRAINT chk_service_assignment_window CHECK (scheduled_end>=scheduled_start)
) ENGINE=InnoDB;

CREATE TABLE service_execution_records (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  service_order_id VARCHAR(64) NOT NULL,
  assignment_id VARCHAR(64) NULL,
  recorded_by_person_id VARCHAR(64) NOT NULL,
  record_type VARCHAR(24) NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  duration_minutes DECIMAL(12,3) NULL,
  notes TEXT NULL,
  evidence JSON NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_service_execution_tenant_id_id (tenant_id,id),
  KEY ix_service_execution_order_time (tenant_id,service_order_id,occurred_at),
  CONSTRAINT fk_service_execution_order FOREIGN KEY (tenant_id,service_order_id) REFERENCES service_orders(tenant_id,id),
  CONSTRAINT fk_service_execution_assignment FOREIGN KEY (tenant_id,assignment_id) REFERENCES service_assignments(tenant_id,id),
  CONSTRAINT fk_service_execution_recorder FOREIGN KEY (tenant_id,recorded_by_person_id) REFERENCES persons(tenant_id,id),
  CONSTRAINT chk_service_execution_type CHECK (record_type IN ('TRAVEL','ARRIVAL','WORK','INSPECTION','TEST','NOTE','COMPLETION')),
  CONSTRAINT chk_service_execution_duration CHECK (duration_minutes IS NULL OR duration_minutes>=0)
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('domain.service_delivery.read','Read service delivery','View service orders, assignments, field execution evidence and completion state.'),
 ('domain.service_delivery.manage','Manage service orders','Create and maintain service orders and schedules.'),
 ('domain.service_delivery.dispatch','Dispatch service work','Assign personnel and dispatch scheduled service work.'),
 ('domain.service_delivery.execute','Execute service work','Start field work and capture execution records and evidence.'),
 ('domain.service_delivery.accept','Accept service completion','Validate completed service work and record formal acceptance.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-074','ROLE-PLATFORM-ADMINISTRATOR','domain.service_delivery.read'),
 ('ARP-PLATFORM-ADMIN-075','ROLE-PLATFORM-ADMINISTRATOR','domain.service_delivery.manage'),
 ('ARP-PLATFORM-ADMIN-076','ROLE-PLATFORM-ADMINISTRATOR','domain.service_delivery.dispatch'),
 ('ARP-PLATFORM-ADMIN-077','ROLE-PLATFORM-ADMINISTRATOR','domain.service_delivery.execute'),
 ('ARP-PLATFORM-ADMIN-078','ROLE-PLATFORM-ADMINISTRATOR','domain.service_delivery.accept');
