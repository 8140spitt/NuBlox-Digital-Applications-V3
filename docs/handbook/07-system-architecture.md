# 07 — System Architecture

## Architecture style

NuBlox V3 is designed as a cohesive enterprise application with strong modular/domain boundaries.

The architecture favours a controlled modular system over premature distributed services.

## Business architecture

```text
29 Function Workspaces
  -> 353 L2 Sub-functions
     -> 1,510 source Activities
        -> canonical aggregate/object ownership
           -> commands / lifecycle
              -> workflow / authority
                 -> evidence / events
                    -> user experience
```

The function/workspace layer is user-facing. Aggregate/domain ownership is the software control boundary. They are intentionally not the same layer.

## Tenant architecture

Tenant isolation is structural.

Every business command operates in one resolved tenant context. Tenant scope must be enforced at data/service boundaries, not only in UI navigation.

## Authentication and business authority

Authentication uses Better Auth with persisted users/accounts/sessions.

Business authority is resolved separately through NuBlox tenant/business relationships.

```text
Authentication
  -> User Identity
  -> Party
  -> Tenant Membership
  -> Role Assignment
  -> Permission
  -> Scope / Authority checks
```

## Persistence

Runtime persistence uses MySQL 8+.

Schema changes are delivered through ordered forward migrations in `app/migrations/`.

The runtime does not create/alter the business schema on application startup.

Migration history is governed through a schema-migration ledger and drift detection.

## Transactions and evidence

A material command should preserve atomic consistency between:

- authoritative aggregate mutation;
- audit evidence;
- business event;
- transactional outbox state.

The outbox supports reliable downstream integration without turning integration delivery into domain truth.

## Shared platform runtimes

The V3 platform includes or targets reusable runtimes for:

- tenant context;
- authentication;
- membership and permissions;
- delegated authority;
- shared workflow/work items;
- authorised decisions;
- governed evidence;
- lifecycle configuration;
- classifications/reference data;
- information containers;
- object registry/resolution;
- object search;
- work contexts/drafts/edit leases;
- access requests;
- audit/business events/outbox.

## Web application

The application is SvelteKit-based.

The tenant application route is organised around:

- Home;
- Operate;
- Deliver;
- Enterprise Data;
- Functions;
- Work;
- Search;
- canonical object routes;
- Administration.

Canonical objects should have stable object routes rather than only existing inside function-specific query-parameter pages.

## Server correctness

SvelteKit server actions/native POST behaviour remain the correctness baseline.

Client-side JavaScript enhances interactions but must not become the only source of validation or permission enforcement.

## Canonical commands

Writes occur through owning aggregate/domain commands.

Cross-aggregate workflow coordination may span several commands, but one transaction cannot quietly mutate unrelated aggregate truths simply because one screen displays them together.

## Events

Events use business meaning and past-tense facts.

Events do not bypass invariants or authorisation.

## Integration

External systems connect through adapters/anti-corruption boundaries.

Vendor-specific schemas and module boundaries must not redefine NuBlox canonical semantics.

## Read models

Workspace lists, dashboards, search and analytics may use projections optimised for reading.

Read models are disposable/rebuildable representations; authoritative mutation remains with canonical objects.

## Non-functional expectations

Enterprise-grade NuBlox requires:

- security and tenant isolation;
- auditable authority;
- data integrity;
- optimistic concurrency;
- operational observability;
- migration safety;
- recoverable integration;
- accessibility;
- responsive/field behaviour;
- performance appropriate to high-volume enterprise work;
- controlled configuration and backward compatibility.
