CREATE TABLE sales_accounts (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  organisation_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  owner_position_id VARCHAR(64) NOT NULL,
  segment VARCHAR(120) NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_sales_accounts_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_sales_accounts_tenant_object (tenant_id,canonical_object_id),
  UNIQUE KEY uq_sales_accounts_tenant_org (tenant_id,organisation_id),
  UNIQUE KEY uq_sales_accounts_tenant_code (tenant_id,code),
  KEY ix_sales_accounts_owner (tenant_id,owner_position_id,status),
  CONSTRAINT fk_sales_accounts_object
    FOREIGN KEY (tenant_id,canonical_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_sales_accounts_organisation
    FOREIGN KEY (tenant_id,organisation_id) REFERENCES organisations(tenant_id,id),
  CONSTRAINT fk_sales_accounts_owner
    FOREIGN KEY (tenant_id,owner_position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT chk_sales_accounts_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

CREATE TABLE sales_opportunities (
  id VARCHAR(64) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL,
  canonical_object_id VARCHAR(64) NOT NULL,
  sales_account_id VARCHAR(64) NOT NULL,
  code VARCHAR(80) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  owner_position_id VARCHAR(64) NOT NULL,
  stage VARCHAR(24) NOT NULL,
  probability_percent DECIMAL(5,2) NOT NULL,
  estimated_value DECIMAL(18,2) NOT NULL,
  currency CHAR(3) NOT NULL,
  expected_close_date DATE NULL,
  forecast_category VARCHAR(24) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_person_id VARCHAR(64) NULL,
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  updated_by_person_id VARCHAR(64) NULL,
  row_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  UNIQUE KEY uq_sales_opportunities_tenant_id_id (tenant_id,id),
  UNIQUE KEY uq_sales_opportunities_tenant_object (tenant_id,canonical_object_id),
  UNIQUE KEY uq_sales_opportunities_tenant_code (tenant_id,code),
  KEY ix_sales_opportunities_owner (tenant_id,owner_position_id,status),
  KEY ix_sales_opportunities_stage (tenant_id,stage,status),
  KEY ix_sales_opportunities_close (tenant_id,expected_close_date,status),
  KEY ix_sales_opportunities_account (tenant_id,sales_account_id,status),
  CONSTRAINT fk_sales_opportunities_object
    FOREIGN KEY (tenant_id,canonical_object_id) REFERENCES canonical_objects(tenant_id,id),
  CONSTRAINT fk_sales_opportunities_account
    FOREIGN KEY (tenant_id,sales_account_id) REFERENCES sales_accounts(tenant_id,id),
  CONSTRAINT fk_sales_opportunities_owner
    FOREIGN KEY (tenant_id,owner_position_id) REFERENCES positions(tenant_id,id),
  CONSTRAINT chk_sales_opportunities_stage CHECK (
    stage IN ('QUALIFICATION','DISCOVERY','SOLUTION','PROPOSAL','NEGOTIATION','COMMIT','WON','LOST')
  ),
  CONSTRAINT chk_sales_opportunities_probability CHECK (
    probability_percent>=0 AND probability_percent<=100
  ),
  CONSTRAINT chk_sales_opportunities_value CHECK (estimated_value>=0),
  CONSTRAINT chk_sales_opportunities_forecast CHECK (
    forecast_category IN ('PIPELINE','BEST_CASE','COMMIT','CLOSED')
  ),
  CONSTRAINT chk_sales_opportunities_status CHECK (
    status IN ('OPEN','WON','LOST','CANCELLED')
  )
) ENGINE=InnoDB;

INSERT INTO permission_definitions (permission_key,name,description) VALUES
 ('function.f07.read','Read F07 Sales & Commercial Management','View Sales Accounts, Opportunities, pipeline and forecast within the Position-authorised Sales scope.'),
 ('function.f07.work','Perform F07 Sales & Commercial Management work','Create and maintain native Sales Accounts and Opportunities within the Position-authorised Sales scope.');

INSERT INTO access_role_permissions (id,access_role_id,permission_key) VALUES
 ('ARP-PLATFORM-ADMIN-088','ROLE-PLATFORM-ADMINISTRATOR','function.f07.read'),
 ('ARP-PLATFORM-ADMIN-089','ROLE-PLATFORM-ADMINISTRATOR','function.f07.work');
