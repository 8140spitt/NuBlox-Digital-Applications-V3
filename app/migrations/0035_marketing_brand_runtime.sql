-- NuBlox V3 MySQL
-- 0035: F06 Marketing & Brand runtime.
-- Activates canonical Market Segment, Communications Plan, Communications Campaign and Lead boundaries.
-- Also activates the Consent / Preference event-evidence slice of AGG-22-PRIVACY required by marketing execution.

CREATE TABLE market_segments (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  segment_ref VARCHAR(191) NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_market_segment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_market_segment_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_market_segment_ref (tenant_id, segment_ref),
  INDEX idx_market_segment_status (tenant_id, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE market_segment_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  segment_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  criteria_json JSON NOT NULL,
  geography_json JSON NOT NULL,
  sector_json JSON NOT NULL,
  profile_json JSON NOT NULL,
  value_assessment_json JSON NOT NULL,
  effective_from VARCHAR(32) NOT NULL,
  effective_to VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  activated_at VARCHAR(32) NULL,
  CONSTRAINT fk_market_segment_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_market_segment_version_root FOREIGN KEY (segment_id) REFERENCES market_segments(id),
  CONSTRAINT fk_market_segment_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_market_segment_version (segment_id, version_no),
  INDEX idx_market_segment_version_effective
    (tenant_id, segment_id, lifecycle_status, effective_from, effective_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE market_segment_memberships (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  segment_version_id VARCHAR(36) NOT NULL,
  subject_type VARCHAR(64) NOT NULL,
  subject_id VARCHAR(191) NOT NULL,
  membership_status VARCHAR(32) NOT NULL,
  score DECIMAL(9,4) NULL,
  basis_json JSON NOT NULL,
  evaluated_at VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_market_segment_membership_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_market_segment_membership_version
    FOREIGN KEY (segment_version_id) REFERENCES market_segment_versions(id),
  UNIQUE KEY uq_market_segment_membership
    (segment_version_id, subject_type, subject_id),
  INDEX idx_market_segment_membership_subject
    (tenant_id, subject_type, subject_id, membership_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_plans (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  plan_ref VARCHAR(191) NOT NULL,
  plan_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  strategy_subject_type VARCHAR(64) NULL,
  strategy_subject_id VARCHAR(191) NULL,
  strategy_subject_version VARCHAR(64) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  approval_decision_id VARCHAR(36) NULL,
  approved_at VARCHAR(32) NULL,
  activated_at VARCHAR(32) NULL,
  closed_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_comms_plan_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_plan_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_comms_plan_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_comms_plan_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_comms_plan_ref (tenant_id, plan_ref),
  INDEX idx_comms_plan_status (tenant_id, plan_type, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_plan_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  scope_context TEXT NOT NULL,
  objectives_json JSON NOT NULL,
  audiences_json JSON NOT NULL,
  key_messages_json JSON NOT NULL,
  channels_json JSON NOT NULL,
  activities_json JSON NOT NULL,
  schedule_json JSON NOT NULL,
  measures_json JSON NOT NULL,
  positioning_json JSON NOT NULL,
  brand_definition_json JSON NOT NULL,
  guideline_summary TEXT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_comms_plan_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_plan_version_root FOREIGN KEY (plan_id) REFERENCES communications_plans(id),
  CONSTRAINT fk_comms_plan_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_comms_plan_version (plan_id, version_no),
  INDEX idx_comms_plan_version_status (tenant_id, plan_id, lifecycle_status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_plan_information (
  plan_version_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  information_revision_id VARCHAR(36) NOT NULL,
  link_role VARCHAR(64) NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (plan_version_id, information_revision_id, link_role),
  CONSTRAINT fk_comms_plan_info_version FOREIGN KEY (plan_version_id) REFERENCES communications_plan_versions(id),
  CONSTRAINT fk_comms_plan_info_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_plan_info_revision FOREIGN KEY (information_revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_comms_plan_info_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_comms_plan_info_revision (tenant_id, information_revision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_campaigns (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  campaign_ref VARCHAR(191) NOT NULL,
  campaign_type VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  communications_plan_id VARCHAR(36) NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  current_version_no INT UNSIGNED NOT NULL DEFAULT 1,
  approval_decision_id VARCHAR(36) NULL,
  approved_at VARCHAR(32) NULL,
  activated_at VARCHAR(32) NULL,
  paused_at VARCHAR(32) NULL,
  completed_at VARCHAR(32) NULL,
  closed_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_comms_campaign_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_campaign_plan FOREIGN KEY (communications_plan_id) REFERENCES communications_plans(id),
  CONSTRAINT fk_comms_campaign_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_comms_campaign_decision FOREIGN KEY (approval_decision_id) REFERENCES work_decisions(id),
  CONSTRAINT fk_comms_campaign_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_comms_campaign_ref (tenant_id, campaign_ref),
  INDEX idx_comms_campaign_status (tenant_id, campaign_type, status, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_campaign_versions (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  campaign_id VARCHAR(36) NOT NULL,
  version_no INT UNSIGNED NOT NULL,
  lifecycle_status VARCHAR(32) NOT NULL,
  objectives_json JSON NOT NULL,
  audience_strategy_json JSON NOT NULL,
  key_messages_json JSON NOT NULL,
  channels_json JSON NOT NULL,
  schedule_json JSON NOT NULL,
  budget_context_json JSON NOT NULL,
  measurement_plan_json JSON NOT NULL,
  automation_json JSON NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_comms_campaign_version_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_campaign_version_root FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_comms_campaign_version_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_comms_campaign_version (campaign_id, version_no),
  INDEX idx_comms_campaign_version_status (tenant_id, campaign_id, lifecycle_status, version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_campaign_segments (
  campaign_version_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  segment_id VARCHAR(36) NOT NULL,
  segment_version_no INT UNSIGNED NOT NULL,
  inclusion_type VARCHAR(32) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (campaign_version_id, segment_id, segment_version_no, inclusion_type),
  CONSTRAINT fk_comms_campaign_segment_version
    FOREIGN KEY (campaign_version_id) REFERENCES communications_campaign_versions(id),
  CONSTRAINT fk_comms_campaign_segment_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_campaign_segment_root FOREIGN KEY (segment_id) REFERENCES market_segments(id),
  INDEX idx_comms_campaign_segment (tenant_id, segment_id, segment_version_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_campaign_information (
  campaign_version_id VARCHAR(36) NOT NULL,
  tenant_id VARCHAR(36) NOT NULL,
  information_revision_id VARCHAR(36) NOT NULL,
  link_role VARCHAR(64) NOT NULL,
  channel VARCHAR(64) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  PRIMARY KEY (campaign_version_id, information_revision_id, link_role),
  CONSTRAINT fk_comms_campaign_info_version
    FOREIGN KEY (campaign_version_id) REFERENCES communications_campaign_versions(id),
  CONSTRAINT fk_comms_campaign_info_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_campaign_info_revision
    FOREIGN KEY (information_revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_comms_campaign_info_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  INDEX idx_comms_campaign_info_revision (tenant_id, information_revision_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communication_items (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  campaign_id VARCHAR(36) NOT NULL,
  campaign_version_id VARCHAR(36) NOT NULL,
  item_ref VARCHAR(191) NOT NULL,
  item_type VARCHAR(64) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  information_revision_id VARCHAR(36) NOT NULL,
  audience_scope_json JSON NOT NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  scheduled_at VARCHAR(32) NULL,
  status VARCHAR(32) NOT NULL,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  published_at VARCHAR(32) NULL,
  completed_at VARCHAR(32) NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_communication_item_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_communication_item_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_communication_item_campaign_version
    FOREIGN KEY (campaign_version_id) REFERENCES communications_campaign_versions(id),
  CONSTRAINT fk_communication_item_revision FOREIGN KEY (information_revision_id) REFERENCES information_revisions(id),
  CONSTRAINT fk_communication_item_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_communication_item_ref (tenant_id, item_ref),
  INDEX idx_communication_item_status (tenant_id, campaign_id, status, scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE leads (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lead_ref VARCHAR(191) NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  source_campaign_id VARCHAR(36) NULL,
  source_communication_item_id VARCHAR(36) NULL,
  source_reference VARCHAR(500) NULL,
  resolved_party_id VARCHAR(36) NULL,
  resolved_party_relationship_id VARCHAR(36) NULL,
  prospect_name VARCHAR(500) NOT NULL,
  organisation_name VARCHAR(500) NULL,
  email VARCHAR(500) NULL,
  phone VARCHAR(191) NULL,
  geography VARCHAR(255) NULL,
  sector VARCHAR(255) NULL,
  need_summary TEXT NOT NULL,
  estimated_value_low DECIMAL(30,10) NULL,
  estimated_value_high DECIMAL(30,10) NULL,
  currency_id VARCHAR(36) NULL,
  owner_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  score DECIMAL(9,4) NOT NULL DEFAULT 0,
  aggregate_version BIGINT UNSIGNED NOT NULL DEFAULT 1,
  qualified_at VARCHAR(32) NULL,
  disqualified_at VARCHAR(32) NULL,
  transferred_at VARCHAR(32) NULL,
  closed_at VARCHAR(32) NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_lead_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lead_campaign FOREIGN KEY (source_campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_lead_comm_item FOREIGN KEY (source_communication_item_id) REFERENCES communication_items(id),
  CONSTRAINT fk_lead_party FOREIGN KEY (resolved_party_id) REFERENCES parties(id),
  CONSTRAINT fk_lead_relationship FOREIGN KEY (resolved_party_relationship_id) REFERENCES party_relationships(id),
  CONSTRAINT fk_lead_currency FOREIGN KEY (currency_id) REFERENCES reference_currencies(id),
  CONSTRAINT fk_lead_owner FOREIGN KEY (owner_party_id) REFERENCES parties(id),
  CONSTRAINT fk_lead_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_lead_ref (tenant_id, lead_ref),
  INDEX idx_lead_status (tenant_id, status, score, updated_at),
  INDEX idx_lead_party (tenant_id, resolved_party_id, status),
  INDEX idx_lead_campaign (tenant_id, source_campaign_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lead_score_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NOT NULL,
  score_delta DECIMAL(9,4) NOT NULL,
  score_after DECIMAL(9,4) NOT NULL,
  reason_code VARCHAR(64) NOT NULL,
  reason TEXT NOT NULL,
  evidence_reference VARCHAR(500) NULL,
  occurred_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_lead_score_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lead_score_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_lead_score_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  INDEX idx_lead_score_history (tenant_id, lead_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lead_nurture_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NOT NULL,
  campaign_id VARCHAR(36) NULL,
  interaction_type VARCHAR(64) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  summary TEXT NOT NULL,
  evidence_reference VARCHAR(500) NULL,
  occurred_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_lead_nurture_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lead_nurture_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_lead_nurture_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_lead_nurture_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  INDEX idx_lead_nurture_history (tenant_id, lead_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lead_sales_handoffs (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  lead_id VARCHAR(36) NOT NULL,
  lead_version BIGINT UNSIGNED NOT NULL,
  handoff_ref VARCHAR(191) NOT NULL,
  qualification_summary TEXT NOT NULL,
  requested_by_party_id VARCHAR(36) NOT NULL,
  status VARCHAR(32) NOT NULL,
  opportunity_id VARCHAR(36) NULL,
  requested_at VARCHAR(32) NOT NULL,
  accepted_at VARCHAR(32) NULL,
  rejected_at VARCHAR(32) NULL,
  rejection_reason TEXT NULL,
  CONSTRAINT fk_lead_handoff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_lead_handoff_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_lead_handoff_requester FOREIGN KEY (requested_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_lead_handoff_ref (tenant_id, handoff_ref),
  INDEX idx_lead_handoff_status (tenant_id, status, requested_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE privacy_consent_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  subject_type VARCHAR(32) NOT NULL,
  party_id VARCHAR(36) NULL,
  lead_id VARCHAR(36) NULL,
  purpose_key VARCHAR(191) NOT NULL,
  controller_party_id VARCHAR(36) NULL,
  wording_reference VARCHAR(500) NOT NULL,
  wording_version VARCHAR(64) NOT NULL,
  action VARCHAR(32) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  proof_reference VARCHAR(500) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_privacy_consent_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_privacy_consent_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_privacy_consent_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_privacy_consent_controller FOREIGN KEY (controller_party_id) REFERENCES parties(id),
  CONSTRAINT fk_privacy_consent_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  CONSTRAINT ck_privacy_consent_subject CHECK (
    (party_id IS NOT NULL AND lead_id IS NULL AND subject_type = 'PARTY')
    OR (party_id IS NULL AND lead_id IS NOT NULL AND subject_type = 'LEAD')
  ),
  INDEX idx_privacy_consent_current_party
    (tenant_id, party_id, purpose_key, occurred_at),
  INDEX idx_privacy_consent_current_lead
    (tenant_id, lead_id, purpose_key, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE privacy_preference_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  subject_type VARCHAR(32) NOT NULL,
  party_id VARCHAR(36) NULL,
  lead_id VARCHAR(36) NULL,
  preference_type VARCHAR(64) NOT NULL,
  preference_value VARCHAR(191) NOT NULL,
  scope_key VARCHAR(191) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  source_reference VARCHAR(500) NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_privacy_preference_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_privacy_preference_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_privacy_preference_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT fk_privacy_preference_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  CONSTRAINT ck_privacy_preference_subject CHECK (
    (party_id IS NOT NULL AND lead_id IS NULL AND subject_type = 'PARTY')
    OR (party_id IS NULL AND lead_id IS NOT NULL AND subject_type = 'LEAD')
  ),
  INDEX idx_privacy_preference_party
    (tenant_id, party_id, preference_type, scope_key, occurred_at),
  INDEX idx_privacy_preference_lead
    (tenant_id, lead_id, preference_type, scope_key, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communication_delivery_events (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  communication_item_id VARCHAR(36) NOT NULL,
  recipient_type VARCHAR(32) NOT NULL,
  recipient_party_id VARCHAR(36) NULL,
  recipient_lead_id VARCHAR(36) NULL,
  delivery_action VARCHAR(64) NOT NULL,
  external_reference VARCHAR(500) NULL,
  metadata_json JSON NOT NULL,
  occurred_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_comm_delivery_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comm_delivery_item FOREIGN KEY (communication_item_id) REFERENCES communication_items(id),
  CONSTRAINT fk_comm_delivery_party FOREIGN KEY (recipient_party_id) REFERENCES parties(id),
  CONSTRAINT fk_comm_delivery_lead FOREIGN KEY (recipient_lead_id) REFERENCES leads(id),
  CONSTRAINT fk_comm_delivery_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  CONSTRAINT ck_comm_delivery_recipient CHECK (
    (recipient_party_id IS NOT NULL AND recipient_lead_id IS NULL AND recipient_type = 'PARTY')
    OR (recipient_party_id IS NULL AND recipient_lead_id IS NOT NULL AND recipient_type = 'LEAD')
  ),
  INDEX idx_comm_delivery_item (tenant_id, communication_item_id, occurred_at),
  INDEX idx_comm_delivery_party (tenant_id, recipient_party_id, occurred_at),
  INDEX idx_comm_delivery_lead (tenant_id, recipient_lead_id, occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_campaign_measurements (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  campaign_id VARCHAR(36) NOT NULL,
  metric_key VARCHAR(191) NOT NULL,
  metric_value DECIMAL(30,10) NOT NULL,
  unit_key VARCHAR(64) NOT NULL,
  period_start VARCHAR(32) NULL,
  period_end VARCHAR(32) NULL,
  source_reference VARCHAR(500) NOT NULL,
  observed_at VARCHAR(32) NOT NULL,
  recorded_by_party_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_comms_measurement_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_measurement_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_comms_measurement_actor FOREIGN KEY (recorded_by_party_id) REFERENCES parties(id),
  INDEX idx_comms_measurement_campaign (tenant_id, campaign_id, metric_key, observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE marketing_analytics_snapshots (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  snapshot_ref VARCHAR(191) NOT NULL,
  title VARCHAR(500) NOT NULL,
  as_of_at VARCHAR(32) NOT NULL,
  period_start VARCHAR(32) NULL,
  period_end VARCHAR(32) NULL,
  segment_id VARCHAR(36) NULL,
  segment_version_no INT UNSIGNED NULL,
  campaign_id VARCHAR(36) NULL,
  source_query_version VARCHAR(191) NOT NULL,
  source_set_json JSON NOT NULL,
  metrics_json JSON NOT NULL,
  created_by_party_id VARCHAR(36) NOT NULL,
  created_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_marketing_snapshot_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_marketing_snapshot_segment FOREIGN KEY (segment_id) REFERENCES market_segments(id),
  CONSTRAINT fk_marketing_snapshot_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_marketing_snapshot_creator FOREIGN KEY (created_by_party_id) REFERENCES parties(id),
  UNIQUE KEY uq_marketing_snapshot_ref (tenant_id, snapshot_ref),
  INDEX idx_marketing_snapshot_asof (tenant_id, as_of_at, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_event_profiles (
  campaign_id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  venue TEXT NULL,
  event_start_at VARCHAR(32) NOT NULL,
  event_end_at VARCHAR(32) NOT NULL,
  supplier_references_json JSON NOT NULL,
  registration_policy_json JSON NOT NULL,
  delivery_notes TEXT NULL,
  outcome_summary TEXT NULL,
  event_status VARCHAR(32) NOT NULL,
  updated_at VARCHAR(32) NOT NULL,
  CONSTRAINT fk_comms_event_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_comms_event_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  INDEX idx_comms_event_schedule (tenant_id, event_status, event_start_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE communications_event_registrations (
  id VARCHAR(36) PRIMARY KEY,
  tenant_id VARCHAR(36) NOT NULL,
  campaign_id VARCHAR(36) NOT NULL,
  party_id VARCHAR(36) NULL,
  lead_id VARCHAR(36) NULL,
  registration_status VARCHAR(32) NOT NULL,
  registration_reference VARCHAR(191) NOT NULL,
  registered_at VARCHAR(32) NOT NULL,
  attended_at VARCHAR(32) NULL,
  source_reference VARCHAR(500) NULL,
  CONSTRAINT fk_comms_event_registration_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_comms_event_registration_campaign FOREIGN KEY (campaign_id) REFERENCES communications_campaigns(id),
  CONSTRAINT fk_comms_event_registration_party FOREIGN KEY (party_id) REFERENCES parties(id),
  CONSTRAINT fk_comms_event_registration_lead FOREIGN KEY (lead_id) REFERENCES leads(id),
  CONSTRAINT ck_comms_event_registration_subject CHECK (
    (party_id IS NOT NULL AND lead_id IS NULL)
    OR (party_id IS NULL AND lead_id IS NOT NULL)
  ),
  UNIQUE KEY uq_comms_event_registration_ref (tenant_id, registration_reference),
  INDEX idx_comms_event_registration_campaign
    (tenant_id, campaign_id, registration_status, registered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
