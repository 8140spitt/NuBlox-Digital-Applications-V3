# NuBlox V3 Database Migrations

NuBlox V3 uses **MySQL 8.0+** and forward-only, checksum-protected SQL migrations.

## Commands

From `app/`:

```bash
pnpm db:migrate
pnpm db:status
pnpm db:seed:platform
pnpm db:migrate:test
pnpm db:status:test
```

Production/development migrations use `DATABASE_URL` (or `MYSQL_URL`). Integration tests use `NUBLOX_TEST_DATABASE_URL`; isolated migration tests may use `NUBLOX_TEST_ADMIN_DATABASE_URL` for schema creation/drop while application service tests continue to use the restricted test user.

## Ledger

The migration runner maintains two infrastructure ledgers:

- `schema_migrations` records the migration filename, SHA-256 checksum and successful application timestamp;
- `schema_migration_attempts` records APPLYING / FAILED / APPLIED execution state so partially committed MySQL DDL cannot be retried blindly.

`db:status` reports:

- **APPLIED** — repository checksum matches the applied migration;
- **PENDING** — migration exists in the repository but is not applied;
- **DRIFT** — an applied migration was edited after application;
- **UNKNOWN** — the database records a migration missing from the repository;
- **DIRTY** — an APPLYING or FAILED attempt exists and operator repair is required before another migration run.

Pending, dirty, drift or unknown migrations make `db:status` exit non-zero.

## Rules

1. **Never edit an applied migration.** Add a new numbered migration.
2. Migrations are ordered lexically: `0001_...`, `0002_...`, and so on.
3. Schema change and required data backfill belong in an explicit forward migration.
4. Destructive changes require a staged expand/backfill/contract sequence.
5. Runtime code must not create or alter business tables.
6. Runtime startup verifies that the required migration is present; it does not silently mutate production schema.
7. Each integration-test run first migrates the dedicated test database.
8. MySQL DDL may commit independently. The runner records APPLYING before executing SQL and preserves FAILED/APPLYING state on incomplete execution. A dirty database must be inspected and repaired explicitly before migrations resume; automatic retries are prohibited.
9. Tenant-owned transactional tables carry explicit tenant scope or reach tenant scope through a canonical root with enforced foreign keys.
10. Every physical table must implement an accepted canonical aggregate/object/evidence pattern; database convenience does not redefine the canonical model.

## Migration sequence

- `0001_platform_foundation.sql` — Tenant, Party/Organisation, identity, membership, roles/permissions, platform audit, business events and transactional outbox.
- `0002_strategy_and_architecture_review.sql` — Strategy Framework runtime plus the canonical architecture-review ledger.
- `0003_party_specialisations.sql` — canonical Person and Legal Entity specialisations of Party.
- `0004_outbox_delivery_controls.sql` — claim/retry/lock/failure/dead-letter controls for transactional outbox delivery.
- `0005_tenant_version.sql` — monotonic aggregate versioning for AGG-01-TENANT authority/configuration changes.
- `0006_authentication.sql` — Better Auth users, sessions, accounts and verification persistence, kept separate from NuBlox business authority.
- `0007_foundation_relationship_structure_authority.sql` — Party Relationships, Organisation Units/effective hierarchy and Delegated Authority aggregates.
- `0008_shared_work_runtime.sql` — AGG-27-WORKFLOW runtime for workflow instances, Work Items, assignments, acknowledgements, escalation and governed work-change evidence.
- `0009_authorised_decision_runtime.sql` — immutable AGG-27-DECISION records with exact subject/version and authority evidence.
- `0010_governed_evidence_runtime.sql` — AGG-28-EVIDENCE items with integrity hashes, source references, provenance and independent verification.
- `0011_classification_runtime.sql` — AGG-29-CLASSIFICATION systems, immutable releases and governed release-scoped codes.
- `0012_lifecycle_configuration_runtime.sql` — AGG-29-LIFECYCLE-CONFIG stable definitions with immutable published versions, states and transition rules.

Future schema changes start at `0013_...`; historical migrations remain immutable.

## Validation and test contract

`pnpm db:validate` verifies contiguous ordering and rejects business-table DDL in runtime server modules. `pnpm test:migrations` creates an isolated temporary MySQL database from `NUBLOX_TEST_DATABASE_URL` credentials, migrates it from zero, reapplies the migration set to prove repeat safety, verifies the migration ledger/checksums, runs the platform/Strategy services against that migrated schema, and drops the temporary database. The configured test database name must contain a standalone `test` segment; production databases are refused.

`pnpm db:seed:platform` idempotently synchronises required platform reference definitions such as the permission catalog after schema migration. It is production-safe and creates no tenant, user or development fixture.

Development bootstrap records are application/test fixtures, not migration content. Migrations establish schema and required structural constraints only; `pnpm db:seed:dev -- <tenant>` remains explicitly development-only.

## Migration 0009 — authorised decision runtime

`0009_authorised_decision_runtime.sql` introduces the immutable `AGG-27-DECISION` runtime. Decisions bind an attributable outcome to an exact subject/version, retain permission/delegated-authority evidence at decision time, and support append-only corrective supersession without editing earlier decisions.

## Migration 0010 — governed evidence runtime

`0010_governed_evidence_runtime.sql` introduces `AGG-28-EVIDENCE`: stable Evidence Items with exact subject/version binding, integrity hashes, immutable source/provenance references, attributable capture and independent verification. Evidence supports domain truth without becoming a duplicate business master.

## Migration 0011 — classification runtime

`0011_classification_runtime.sql` introduces `AGG-29-CLASSIFICATION`: stable Classification Systems, draft-to-published immutable Releases, release-scoped Codes and hierarchical parent-code relationships. Bulk code loading is a governed aggregate command so large taxonomies such as Uniclass can be loaded efficiently without creating a parallel business-master architecture.

## Migration 0012 — lifecycle configuration runtime

`0012_lifecycle_configuration_runtime.sql` introduces `AGG-29-LIFECYCLE-CONFIG`: stable Lifecycle Definition identities, versioned draft/published configurations, state definitions and transition-rule value rows. Published versions are immutable and runtime domain state remains owned by the relevant domain aggregate.
