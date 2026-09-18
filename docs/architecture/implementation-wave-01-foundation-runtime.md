# Implementation Wave 1 — Foundation Runtime

**Status:** in implementation  
**Architecture authority:** closed canonical convergence baseline  
**Implementation authority:** controlled aggregate-aligned waves

## Objective

Turn the V3 canonical architecture into reusable runtime infrastructure before expanding horizontally across the 29 workspaces.

Wave 1 implements the platform behaviour that all later domain slices must reuse:

- tenant isolation;
- authenticated-principal abstraction separated from business authority;
- effective tenant membership;
- role/permission evaluation with deny-by-default command checks;
- canonical Party / Organisation identity;
- optimistic aggregate versioning for mutable master data;
- append-only audit evidence;
- canonical business events;
- transactional outbox messages;
- shared command context across workspace slices.

## First runtime boundaries

### AGG-01-TENANT

Runtime tenant identity is persisted in `tenants`. Business commands resolve one active tenant context before accessing tenant data.

### AGG-01-PARTY

The first implemented master-data slice is Organisation as a specialisation of Party:

`Party → Organisation`

Customer, supplier, subcontractor, consultant, partner and regulator remain contextual relationships/roles. They must not create another Organisation master.

The Organisation implementation provides:

- immutable Party ID;
- proposed / active / inactive lifecycle;
- optimistic version number;
- duplicate registration-number protection within a tenant;
- tenant isolation;
- command permission enforcement;
- append-only audit and business-event evidence;
- outbox publication record.

### Authority runtime

The first authority runtime implements the semantic chain:

`User Identity → Party → Tenant Membership → Role Assignment → Role Definition → Permission Definition`

Authentication itself is deliberately not implemented by this wave. The application currently uses an explicit **development-only identity bootstrap**. That bootstrap is disabled when `NODE_ENV=production`.

This means V3 now has reusable authorization semantics without pretending that a production identity provider has already been integrated.

## Evidence contract

Every material implemented command writes:

1. authoritative aggregate state;
2. `platform_audit_events` with tenant, actor, correlation and authority snapshot;
3. `business_events` describing the committed business occurrence;
4. `outbox_messages` for reliable downstream publication.

The writes occur in the same MySQL transaction as the aggregate change.

An audit event is evidence, not domain truth. A business event describes committed truth, but does not become a second mutable master. An outbox row is integration-delivery state, not business lifecycle state.

## Existing F01.01 migration

F01.01 Strategy Framework now uses the same platform command context, permissions, audit evidence, business-event and outbox infrastructure.

The previous hard-coded actor and slice-specific audit writer are no longer the governing runtime pattern.

## Database and migrations

MySQL 8.0+ is the V3 runtime database. The application uses the `mysql2` promise client and pooled prepared statements. Runtime TypeScript does **not** create or alter business tables.

Physical schema is managed by ordered forward migrations under `app/migrations/` with a `schema_migrations` ledger and SHA-256 drift detection. Runtime startup verifies that the required migration is present and instructs the operator to run `pnpm db:migrate` when it is not.

The logical aggregate boundaries do **not** imply one MySQL table or one service per aggregate. Physical persistence may evolve without changing:

- canonical identity;
- aggregate ownership;
- command authority;
- event meaning;
- evidence semantics;
- workspace ownership.

## Next implementation steps

1. production authentication-provider adapter and session boundary;
2. effective scoped Role Assignment and Delegated Authority administration;
3. Party Relationship runtime for customer/supplier/subcontractor/consultant roles;
4. Organisation Unit and enterprise hierarchy;
5. canonical Project identity and project-context membership;
6. shared workflow/work-item/decision runtime;
7. controlled-information and evidence-store runtime;
8. end-to-end market-to-contract and procure-to-pay slices.

No later workspace should implement its own tenant, identity, permission, audit or outbox mechanism.
