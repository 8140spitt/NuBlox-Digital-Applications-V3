import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = process.env.NUBLOX_DB_PATH ?? resolve(process.cwd(), 'data', 'nublox-v3.db');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS strategy_frameworks (
    id TEXT PRIMARY KEY,
    tenant_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT '',
    vision TEXT NOT NULL DEFAULT '',
    mission TEXT NOT NULL DEFAULT '',
    direction TEXT NOT NULL DEFAULT '',
    review_cadence TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL,
    current_version INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    submitted_at TEXT,
    approved_at TEXT,
    published_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_strategy_frameworks_tenant
    ON strategy_frameworks (tenant_slug, updated_at DESC);

  CREATE TABLE IF NOT EXISTS strategy_framework_versions (
    id TEXT PRIMARY KEY,
    framework_id TEXT NOT NULL,
    version_no INTEGER NOT NULL,
    snapshot_json TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    decision_note TEXT,
    FOREIGN KEY (framework_id) REFERENCES strategy_frameworks(id) ON DELETE CASCADE,
    UNIQUE (framework_id, version_no)
  );

  CREATE INDEX IF NOT EXISTS idx_strategy_versions_framework
    ON strategy_framework_versions (framework_id, version_no DESC);

  CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    tenant_slug TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT,
    actor TEXT NOT NULL,
    note TEXT,
    occurred_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_object
    ON audit_events (tenant_slug, object_type, object_id, occurred_at DESC);

  CREATE TABLE IF NOT EXISTS business_object_reviews (
    candidate_key TEXT PRIMARY KEY,
    decision TEXT NOT NULL,
    proposed_canonical_name TEXT,
    target_candidate_key TEXT,
    notes TEXT,
    reviewed_by TEXT NOT NULL,
    reviewed_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_business_object_reviews_decision
    ON business_object_reviews (decision, updated_at DESC);

  CREATE TABLE IF NOT EXISTS business_object_review_events (
    id TEXT PRIMARY KEY,
    candidate_key TEXT NOT NULL,
    decision TEXT NOT NULL,
    proposed_canonical_name TEXT,
    target_candidate_key TEXT,
    notes TEXT,
    actor TEXT NOT NULL,
    context_tenant_slug TEXT NOT NULL,
    occurred_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_business_object_review_events_candidate
    ON business_object_review_events (candidate_key, occurred_at DESC);

  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS parties (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    party_type TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
  );

  CREATE INDEX IF NOT EXISTS idx_parties_tenant
    ON parties (tenant_id, party_type, display_name);

  CREATE TABLE IF NOT EXISTS organisations (
    party_id TEXT PRIMARY KEY,
    legal_name TEXT NOT NULL,
    trading_name TEXT,
    registration_number TEXT,
    tax_identifier TEXT,
    country_code TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_organisations_registration
    ON organisations (registration_number);

  CREATE TABLE IF NOT EXISTS user_identities (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    party_id TEXT,
    provider TEXT NOT NULL,
    provider_subject TEXT NOT NULL,
    display_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (party_id) REFERENCES parties(id),
    UNIQUE (tenant_id, provider, provider_subject)
  );

  CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    party_id TEXT NOT NULL,
    context_type TEXT NOT NULL,
    context_id TEXT NOT NULL,
    membership_type TEXT NOT NULL,
    status TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_to TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (party_id) REFERENCES parties(id)
  );

  CREATE INDEX IF NOT EXISTS idx_memberships_effective
    ON memberships (tenant_id, party_id, context_type, context_id, status, valid_from, valid_to);

  CREATE TABLE IF NOT EXISTS permission_definitions (
    permission_key TEXT PRIMARY KEY,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS role_definitions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    role_key TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    UNIQUE (tenant_id, role_key)
  );

  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL,
    permission_key TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_key),
    FOREIGN KEY (role_id) REFERENCES role_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_key) REFERENCES permission_definitions(permission_key)
  );

  CREATE TABLE IF NOT EXISTS role_assignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    party_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    scope_type TEXT NOT NULL,
    scope_id TEXT NOT NULL,
    status TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_to TEXT,
    assignment_source TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (party_id) REFERENCES parties(id),
    FOREIGN KEY (role_id) REFERENCES role_definitions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_role_assignments_effective
    ON role_assignments (tenant_id, party_id, scope_type, scope_id, status, valid_from, valid_to);

  CREATE TABLE IF NOT EXISTS platform_audit_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    tenant_slug TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    object_type TEXT NOT NULL,
    object_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_state TEXT,
    to_state TEXT,
    actor_identity_id TEXT NOT NULL,
    actor_party_id TEXT NOT NULL,
    actor_display_name TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    authority_snapshot_json TEXT NOT NULL,
    note TEXT,
    occurred_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (actor_identity_id) REFERENCES user_identities(id),
    FOREIGN KEY (actor_party_id) REFERENCES parties(id)
  );

  CREATE INDEX IF NOT EXISTS idx_platform_audit_object
    ON platform_audit_events (tenant_id, object_type, object_id, occurred_at DESC);

  CREATE TABLE IF NOT EXISTS business_events (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    aggregate_id TEXT NOT NULL,
    aggregate_type TEXT NOT NULL,
    aggregate_object_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    aggregate_version INTEGER NOT NULL,
    actor_identity_id TEXT NOT NULL,
    correlation_id TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    occurred_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (actor_identity_id) REFERENCES user_identities(id)
  );

  CREATE INDEX IF NOT EXISTS idx_business_events_aggregate
    ON business_events (tenant_id, aggregate_id, aggregate_object_id, aggregate_version, occurred_at);

  CREATE TABLE IF NOT EXISTS outbox_messages (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    business_event_id TEXT NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at TEXT NOT NULL,
    published_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (business_event_id) REFERENCES business_events(id)
  );

  CREATE INDEX IF NOT EXISTS idx_outbox_pending
    ON outbox_messages (status, available_at, created_at);


export function dbTransaction<T>(work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
