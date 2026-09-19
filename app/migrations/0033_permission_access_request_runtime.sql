-- NuBlox V3 MySQL
-- 0033: governed permission access requests
-- Permission requests remain requests for authority; fulfilment continues to be owned by tenant RBAC.

CREATE TABLE permission_access_requests (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  requester_party_id VARCHAR(36) NOT NULL,
  requester_user_identity_id VARCHAR(36) NOT NULL,
  permission_key VARCHAR(191) NOT NULL,
  requested_path VARCHAR(512) NOT NULL,
  workflow_instance_id VARCHAR(36) NOT NULL,
  work_item_id VARCHAR(36) NOT NULL,
  requested_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_permission_access_request_tenant
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_permission_access_request_party
    FOREIGN KEY (requester_party_id) REFERENCES parties(id),
  CONSTRAINT fk_permission_access_request_identity
    FOREIGN KEY (requester_user_identity_id) REFERENCES user_identities(id),
  CONSTRAINT fk_permission_access_request_workflow
    FOREIGN KEY (workflow_instance_id) REFERENCES workflow_instances(id),
  CONSTRAINT fk_permission_access_request_work_item
    FOREIGN KEY (work_item_id) REFERENCES work_items(id),
  UNIQUE KEY uq_permission_access_request_work_item (work_item_id),
  INDEX idx_permission_access_request_requester
    (tenant_id, requester_party_id, permission_key, requested_at),
  INDEX idx_permission_access_request_workflow
    (tenant_id, workflow_instance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
