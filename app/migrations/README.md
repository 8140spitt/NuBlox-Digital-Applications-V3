# NuBlox V3 Database Migrations

NuBlox V3 uses **MySQL 8.0+** and forward-only, checksum-protected SQL migrations.

## Commands

From `app/`:

```bash
pnpm db:migrate
pnpm db:status
pnpm db:migrate:test
pnpm db:status:test
```

Production/development migrations use `DATABASE_URL` (or `MYSQL_URL`). Integration tests use `NUBLOX_TEST_DATABASE_URL`; isolated migration tests may use `NUBLOX_TEST_ADMIN_DATABASE_URL` for schema creation/drop while application service tests continue to use the restricted test user.

## Ledger

The migration runner creates `schema_migrations` with:

- migration filename;
- SHA-256 checksum;
- application timestamp.

`db:status` reports:

- **APPLIED** — repository checksum matches the applied migration;
- **PENDING** — migration exists in the repository but is not applied;
- **DRIFT** — an applied migration was edited after application;
- **UNKNOWN** — the database records a migration missing from the repository.

Pending, drift or unknown migrations make `db:status` exit non-zero.

## Rules

1. **Never edit an applied migration.** Add a new numbered migration.
2. Migrations are ordered lexically: `0001_...`, `0002_...`, and so on.
3. Schema change and required data backfill belong in an explicit forward migration.
4. Destructive changes require a staged expand/backfill/contract sequence.
5. Runtime code must not create or alter business tables.
6. Runtime startup verifies that the required migration is present; it does not silently mutate production schema.
7. Each integration-test run first migrates the dedicated test database.
8. MySQL DDL may commit independently; migrations must therefore be written so a failed migration can be diagnosed and safely completed with a new forward migration. Initial migrations use idempotent `CREATE ... IF NOT EXISTS` statements.
9. Tenant-owned transactional tables carry explicit tenant scope or reach tenant scope through a canonical root with enforced foreign keys.
10. Every physical table must implement an accepted canonical aggregate/object/evidence pattern; database convenience does not redefine the canonical model.

## Migration sequence

- `0001_platform_foundation.sql` — Tenant, Party/Organisation, identity, membership, roles/permissions, platform audit, business events and transactional outbox.
- `0002_strategy_and_architecture_review.sql` — Strategy Framework runtime plus the canonical architecture-review ledger.
- `0003_party_specialisations.sql` — canonical Person and Legal Entity specialisations of Party.
- `0004_outbox_delivery_controls.sql` — claim/retry/lock/failure/dead-letter controls for transactional outbox delivery.
- `0005_tenant_version.sql` — monotonic aggregate versioning for AGG-01-TENANT authority/configuration changes.

Future schema changes start at `0006_...`; historical migrations remain immutable.

## Validation and test contract

`pnpm db:validate` verifies contiguous ordering and rejects business-table DDL in runtime server modules. `pnpm test:migrations` creates an isolated temporary MySQL database from `NUBLOX_TEST_DATABASE_URL` credentials, migrates it from zero, reapplies the migration set to prove repeat safety, verifies the migration ledger/checksums, runs the platform/Strategy services against that migrated schema, and drops the temporary database. The configured test database name must contain a standalone `test` segment; production databases are refused.

Development bootstrap records are application/test fixtures, not migration content. Migrations establish schema and required structural constraints only.
