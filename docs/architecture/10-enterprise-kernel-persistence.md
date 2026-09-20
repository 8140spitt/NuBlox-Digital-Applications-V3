# 10 — Enterprise Kernel Persistence

**Status:** Implemented foundation  
**Effective:** 20 September 2026

## Purpose

This slice persists the Phase 1 Enterprise Kernel without changing its domain semantics.

The TypeScript kernel remains the source of truth for business concepts and invariants. The persistence layer reinforces those invariants through relational constraints, tenant-scoped keys, effective dating and attributable audit evidence.

## Technology

The initial kernel persistence implementation uses MySQL 8.4 with `mysql2`.

This is a storage implementation choice, not a domain boundary. No functional domain owns the database schema.

## Migration discipline

Migrations live in `packages/persistence/migrations`.

The migration runner:

- applies files in deterministic numeric order;
- records a SHA-256 checksum;
- records APPLYING / APPLIED / FAILED state;
- refuses to continue when a previous migration is dirty;
- refuses an applied migration whose repository checksum changed.

Production startup must not silently mutate schema. Database migration remains an explicit deployment operation.

## Tenant isolation

Tenant-owned tables carry `tenant_id`.

Composite foreign keys are used where a relationship must prove that both records belong to the same tenant, including:

- Person -> Party;
- Organisation -> Party;
- Organisation Unit -> Organisation / parent Unit;
- Position -> Organisation Unit;
- Position Occupancy -> Position / Person;
- Authority Grant -> Authority Definition;
- Delegation -> Authority Grant / Persons;
- Canonical Relationship -> both Canonical Objects.

The repository API also requires an explicit tenant context and rejects entities from another tenant before writing.

## Effective dating

The following relationships are effective-dated from the first persistence slice:

- Position Occupancy;
- Authority Grant;
- Delegation;
- Canonical Relationship.

Database checks prevent `effective_to` preceding `effective_from`.

Future temporal conflict rules—such as whether a Position permits one or multiple simultaneous occupants—belong to governed business policy and are not silently assumed by the base kernel.

## Audit attribution

Every persisted kernel command writes an append-only `kernel_audit_entries` row in the same database transaction as the authoritative insert.

Audit evidence records:

- tenant;
- entity type;
- entity identity;
- action;
- actor Person where known;
- correlation ID where supplied;
- occurrence time;
- command payload.

Audit evidence is separate from current object state.

## Optimistic versioning

Mutable master tables contain `row_version` from the first migration.

Update commands will use compare-and-swap semantics in the next command slice rather than silently overwriting concurrent changes.

## Repository boundary

`MySqlKernelRepository` persists kernel objects only after loading required referenced objects and reapplying the domain factories/invariants.

Persistence therefore does not bypass rules such as:

- Person must specialise a PERSON Party;
- Organisation must specialise an ORGANISATION Party;
- Position and Job Profile are separate;
- Authority is explicit and scoped;
- canonical relationships cannot cross tenants.

## CI proof

GitHub CI runs MySQL 8.4, applies the real migration and executes integration tests that create the identity spine, authority grant and canonical relationship, then verify attributable audit rows and tenant-boundary rejection.

## Next slice

The next kernel persistence slice should add:

- read/query repositories;
- row-versioned update commands;
- controlled deactivation/end-dating;
- authoritative business events and transactional outbox;
- canonical type/relationship definitions as governed reference data;
- authentication identity linkage without conflating authentication with Person.
