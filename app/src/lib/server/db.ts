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
`);
