CREATE TABLE integration_endpoints (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  endpoint_type VARCHAR(24) NOT NULL,
  direction VARCHAR(24) NOT NULL,
  transport_protocol VARCHAR(24) NOT NULL,
  system_name VARCHAR(160) NOT NULL,
  endpoint_reference VARCHAR(1024) NOT NULL,
  recipient_party_id VARCHAR(64) NULL,
  acknowledgement_required BOOLEAN NOT NULL DEFAULT TRUE,
  business_result_required BOOLEAN NOT NULL DEFAULT TRUE,
  capabilities JSON NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_integration_endpoints_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_integration_endpoints_code (tenant_id, code),
  KEY ix_integration_endpoints_system (tenant_id, system_name, status),
  CONSTRAINT fk_integration_endpoints_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_integration_endpoints_recipient
    FOREIGN KEY (tenant_id, recipient_party_id) REFERENCES parties(tenant_id, id),
  CONSTRAINT chk_integration_endpoints_type CHECK (
    endpoint_type IN ('ERP','MES','API','WEBHOOK','FILE','MESSAGE_BUS','CUSTOM')
  ),
  CONSTRAINT chk_integration_endpoints_direction CHECK (
    direction IN ('OUTBOUND','INBOUND','BIDIRECTIONAL')
  ),
  CONSTRAINT chk_integration_endpoints_transport CHECK (
    transport_protocol IN ('HTTP','HTTPS','SFTP','AMQP','KAFKA','FILE','CUSTOM')
  ),
  CONSTRAINT chk_integration_endpoints_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE source_authority_rules (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  code VARCHAR(120) NOT NULL,
  name VARCHAR(255) NOT NULL,
  subject_object_type VARCHAR(160) NOT NULL,
  attribute_path VARCHAR(500) NULL,
  authority_owner VARCHAR(24) NOT NULL,
  endpoint_id VARCHAR(64) NULL,
  authority_reference VARCHAR(500) NULL,
  priority INT UNSIGNED NOT NULL DEFAULT 0,
  effective_from DATETIME(6) NOT NULL,
  effective_to DATETIME(6) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_source_authority_rules_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_source_authority_rules_code (tenant_id, code),
  KEY ix_source_authority_rules_subject
    (tenant_id, subject_object_type, attribute_path, priority, status),
  CONSTRAINT fk_source_authority_rules_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_source_authority_rules_endpoint
    FOREIGN KEY (tenant_id, endpoint_id) REFERENCES integration_endpoints(tenant_id, id),
  CONSTRAINT chk_source_authority_rules_owner CHECK (
    authority_owner IN ('NUBLOX','ENDPOINT','EXTERNAL')
  ),
  CONSTRAINT chk_source_authority_rules_reference CHECK (
    (authority_owner = 'NUBLOX' AND endpoint_id IS NULL AND authority_reference IS NULL)
    OR (authority_owner = 'ENDPOINT' AND endpoint_id IS NOT NULL AND authority_reference IS NULL)
    OR (authority_owner = 'EXTERNAL' AND endpoint_id IS NULL AND authority_reference IS NOT NULL)
  ),
  CONSTRAINT chk_source_authority_rules_period CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  ),
  CONSTRAINT chk_source_authority_rules_status CHECK (
    status IN ('ACTIVE','INACTIVE')
  )
) ENGINE=InnoDB;

CREATE TABLE publication_transactions (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  endpoint_id VARCHAR(64) NOT NULL,
  transaction_reference VARCHAR(160) NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  operation VARCHAR(24) NOT NULL,
  exchange_delivery_id VARCHAR(64) NULL,
  integration_job_id VARCHAR(64) NULL,
  resubmission_of_transaction_id VARCHAR(64) NULL,
  requested_by_person_id VARCHAR(64) NOT NULL,
  requested_at DATETIME(6) NOT NULL,
  status VARCHAR(32) NOT NULL,
  started_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_publication_transactions_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_publication_transactions_reference (tenant_id, transaction_reference),
  UNIQUE KEY uq_publication_transactions_idempotency (tenant_id, endpoint_id, idempotency_key),
  KEY ix_publication_transactions_endpoint_status (tenant_id, endpoint_id, status, requested_at),
  CONSTRAINT fk_publication_transactions_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_publication_transactions_endpoint
    FOREIGN KEY (tenant_id, endpoint_id) REFERENCES integration_endpoints(tenant_id, id),
  CONSTRAINT fk_publication_transactions_exchange_delivery
    FOREIGN KEY (tenant_id, exchange_delivery_id) REFERENCES exchange_deliveries(tenant_id, id),
  CONSTRAINT fk_publication_transactions_integration_job
    FOREIGN KEY (tenant_id, integration_job_id) REFERENCES integration_jobs(tenant_id, id),
  CONSTRAINT fk_publication_transactions_resubmission
    FOREIGN KEY (tenant_id, resubmission_of_transaction_id) REFERENCES publication_transactions(tenant_id, id),
  CONSTRAINT fk_publication_transactions_requester
    FOREIGN KEY (tenant_id, requested_by_person_id) REFERENCES persons(tenant_id, id),
  CONSTRAINT chk_publication_transactions_operation CHECK (
    operation IN ('CREATE','UPDATE','UPSERT','DELETE','PUBLISH','SYNC')
  ),
  CONSTRAINT chk_publication_transactions_status CHECK (
    status IN ('QUEUED','IN_PROGRESS','AWAITING_RESULTS','SUCCEEDED','PARTIALLY_SUCCEEDED','FAILED','CANCELLED')
  ),
  CONSTRAINT chk_publication_transactions_state CHECK (
    (status = 'QUEUED' AND started_at IS NULL AND completed_at IS NULL)
    OR (status IN ('IN_PROGRESS','AWAITING_RESULTS') AND started_at IS NOT NULL AND completed_at IS NULL)
    OR (status IN ('SUCCEEDED','PARTIALLY_SUCCEEDED','FAILED','CANCELLED') AND completed_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE publication_activities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  publication_transaction_id VARCHAR(64) NOT NULL,
  subject_object_id VARCHAR(64) NOT NULL,
  subject_version VARCHAR(160) NULL,
  action VARCHAR(24) NOT NULL,
  sequence INT UNSIGNED NOT NULL,
  data_envelope_id VARCHAR(64) NULL,
  external_identity_id VARCHAR(64) NULL,
  source_authority_rule_id VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  active_guard_key VARCHAR(512) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_publication_activities_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_publication_activities_sequence (tenant_id, publication_transaction_id, sequence),
  UNIQUE KEY uq_publication_activities_active_guard (tenant_id, active_guard_key),
  KEY ix_publication_activities_subject (tenant_id, subject_object_id, status),
  CONSTRAINT fk_publication_activities_transaction
    FOREIGN KEY (tenant_id, publication_transaction_id) REFERENCES publication_transactions(tenant_id, id),
  CONSTRAINT fk_publication_activities_subject
    FOREIGN KEY (tenant_id, subject_object_id) REFERENCES canonical_objects(tenant_id, id),
  CONSTRAINT fk_publication_activities_envelope
    FOREIGN KEY (tenant_id, data_envelope_id) REFERENCES canonical_data_envelopes(tenant_id, id),
  CONSTRAINT fk_publication_activities_external_identity
    FOREIGN KEY (tenant_id, external_identity_id) REFERENCES external_identities(tenant_id, id),
  CONSTRAINT fk_publication_activities_authority
    FOREIGN KEY (tenant_id, source_authority_rule_id) REFERENCES source_authority_rules(tenant_id, id),
  CONSTRAINT chk_publication_activities_action CHECK (
    action IN ('CREATE','UPDATE','UPSERT','DELETE','PUBLISH','SYNC')
  ),
  CONSTRAINT chk_publication_activities_sequence CHECK (sequence > 0),
  CONSTRAINT chk_publication_activities_status CHECK (
    status IN ('PENDING','SENDING','AWAITING_ACKNOWLEDGEMENT','ACKNOWLEDGED','TRANSPORT_FAILED','APPLIED','WARNING','BUSINESS_REJECTED','BUSINESS_FAILED','SKIPPED')
  ),
  CONSTRAINT chk_publication_activities_guard CHECK (
    (status IN ('APPLIED','WARNING','BUSINESS_REJECTED','BUSINESS_FAILED','SKIPPED') AND active_guard_key IS NULL)
    OR (status NOT IN ('APPLIED','WARNING','BUSINESS_REJECTED','BUSINESS_FAILED','SKIPPED') AND active_guard_key IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE publication_attempts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  publication_activity_id VARCHAR(64) NOT NULL,
  attempt_number INT UNSIGNED NOT NULL,
  data_envelope_id VARCHAR(64) NOT NULL,
  outbox_message_id VARCHAR(64) NULL,
  started_at DATETIME(6) NOT NULL,
  status VARCHAR(24) NOT NULL,
  sent_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  transport_reference VARCHAR(1024) NULL,
  error_message TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_publication_attempts_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_publication_attempts_number (tenant_id, publication_activity_id, attempt_number),
  CONSTRAINT fk_publication_attempts_activity
    FOREIGN KEY (tenant_id, publication_activity_id) REFERENCES publication_activities(tenant_id, id),
  CONSTRAINT fk_publication_attempts_envelope
    FOREIGN KEY (tenant_id, data_envelope_id) REFERENCES canonical_data_envelopes(tenant_id, id),
  CONSTRAINT fk_publication_attempts_outbox
    FOREIGN KEY (tenant_id, outbox_message_id) REFERENCES outbox_messages(tenant_id, id),
  CONSTRAINT chk_publication_attempts_number CHECK (attempt_number > 0),
  CONSTRAINT chk_publication_attempts_status CHECK (
    status IN ('STARTED','SENT','DELIVERED','FAILED','TIMED_OUT')
  ),
  CONSTRAINT chk_publication_attempts_state CHECK (
    (status = 'STARTED' AND sent_at IS NULL AND completed_at IS NULL)
    OR (status = 'SENT' AND sent_at IS NOT NULL AND completed_at IS NULL)
    OR (status = 'DELIVERED' AND sent_at IS NOT NULL AND completed_at IS NOT NULL)
    OR (status IN ('FAILED','TIMED_OUT') AND completed_at IS NOT NULL)
  )
) ENGINE=InnoDB;

CREATE TABLE publication_acknowledgements (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  publication_attempt_id VARCHAR(64) NOT NULL,
  acknowledgement_type VARCHAR(24) NOT NULL,
  outcome VARCHAR(40) NOT NULL,
  received_at DATETIME(6) NOT NULL,
  external_transaction_id VARCHAR(320) NULL,
  message TEXT NULL,
  diagnostic_reference VARCHAR(1024) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_publication_acknowledgements_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_publication_acknowledgements_attempt (tenant_id, publication_attempt_id),
  CONSTRAINT fk_publication_acknowledgements_attempt
    FOREIGN KEY (tenant_id, publication_attempt_id) REFERENCES publication_attempts(tenant_id, id),
  CONSTRAINT chk_publication_acknowledgements_type CHECK (
    acknowledgement_type IN ('TRANSPORT','RECEIPT')
  ),
  CONSTRAINT chk_publication_acknowledgements_outcome CHECK (
    outcome IN ('ACKNOWLEDGED','NEGATIVE_ACKNOWLEDGEMENT')
  )
) ENGINE=InnoDB;

CREATE TABLE publication_results (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  publication_activity_id VARCHAR(64) NOT NULL,
  acknowledgement_id VARCHAR(64) NULL,
  outcome VARCHAR(24) NOT NULL,
  completed_at DATETIME(6) NOT NULL,
  external_object_id VARCHAR(512) NULL,
  external_version VARCHAR(160) NULL,
  result_reference VARCHAR(1024) NULL,
  message TEXT NULL,
  root_cause TEXT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  UNIQUE KEY uq_publication_results_tenant_id_id (tenant_id, id),
  UNIQUE KEY uq_publication_results_activity (tenant_id, publication_activity_id),
  CONSTRAINT fk_publication_results_activity
    FOREIGN KEY (tenant_id, publication_activity_id) REFERENCES publication_activities(tenant_id, id),
  CONSTRAINT fk_publication_results_acknowledgement
    FOREIGN KEY (tenant_id, acknowledgement_id) REFERENCES publication_acknowledgements(tenant_id, id),
  CONSTRAINT chk_publication_results_outcome CHECK (
    outcome IN ('APPLIED','NO_CHANGE','WARNING','REJECTED','FAILED')
  ),
  CONSTRAINT chk_publication_results_diagnostic CHECK (
    outcome NOT IN ('REJECTED','FAILED') OR message IS NOT NULL OR root_cause IS NOT NULL
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key, name, description) VALUES
  ('platform.integration.read', 'Read integration control', 'View integration endpoints, governed publication transactions, attempts, acknowledgements, results and source-authority rules.'),
  ('platform.integration.manage', 'Manage integration endpoints', 'Create and administer governed external integration endpoints.'),
  ('platform.publication.execute', 'Execute publication', 'Create, populate, start and transport governed outbound publication transactions.'),
  ('platform.publication.result_record', 'Record publication results', 'Record downstream acknowledgements and business results against exact publication attempts and activities.'),
  ('platform.source_authority.manage', 'Manage source authority', 'Define object- and attribute-family system-of-record authority without inferring ownership from integration success.');

INSERT INTO access_role_permissions (id, access_role_id, permission_key) VALUES
  ('ARP-PLATFORM-ADMIN-040', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.integration.read'),
  ('ARP-PLATFORM-ADMIN-041', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.integration.manage'),
  ('ARP-PLATFORM-ADMIN-042', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.publication.execute'),
  ('ARP-PLATFORM-ADMIN-043', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.publication.result_record'),
  ('ARP-PLATFORM-ADMIN-044', 'ROLE-PLATFORM-ADMINISTRATOR', 'platform.source_authority.manage');
