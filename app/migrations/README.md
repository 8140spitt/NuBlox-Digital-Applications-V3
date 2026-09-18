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

Production/development migrations use `DATABASE_URL` (or `MYSQL_URL`). Integration tests use `NUBLOX_TEST_DATABASE_URL`.

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

The next implementation wave must add `0003_...`; it must not append DDL to runtime TypeScript.
