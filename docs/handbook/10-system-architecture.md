# 10 — System Architecture

## Architecture objective

The software architecture must support one integrated enterprise system while preserving clear business ownership, transactional integrity, tenant isolation and auditability.

## Application architecture

NuBlox V3 is a SvelteKit application with server-side business runtimes and a MySQL persistence layer.

The architecture favours a cohesive modular enterprise application over unnecessary distributed-service complexity.

## Tenant model

Every business action is resolved within an explicit tenant context.

Tenant isolation is enforced in business/data access, not only in the user interface.

## Authentication and authority

Authentication is separate from business authority.

Authenticated user -> business identity / Party -> tenant membership -> role assignment / permission -> scope -> delegated or approval authority -> business command.

## Domain ownership

Functional areas are user/business boundaries. They are not automatically database or aggregate boundaries.

Canonical business objects have explicit ownership and invariants so multiple workspaces can operate on shared truth.

## Persistence

MySQL 8+ is the runtime database.

Schema changes are managed through ordered forward migrations under app/migrations.

The runtime does not create or mutate production business tables opportunistically.

## Commands

Material writes occur through explicit business/domain commands.

Commands validate tenant, current object state/version, business invariants, permission, scope, authority and required evidence.

## Concurrency

Mutable authoritative records use optimistic versioning where required.

Working drafts and edit leases can improve user experience but do not replace authoritative lost-update controls.

## Evidence, events and outbox

Material changes can create authoritative state, audit evidence, business events and transactional outbox messages within the business transaction.

These have separate meanings.

## Workflow runtime

Workflow/work items coordinate responsibility around domain objects. Workflow state does not replace the domain object's own lifecycle state.

## Object resolution and search

Canonical object routes and search allow the same underlying record to be opened from different functions, processes and contexts.

Search results must be security-trimmed.

## Integration

Adapters isolate external/vendor-specific schemas from NuBlox canonical semantics.

## Files and representations

Binary file/model content may use suitable object/file storage while metadata, identity, revision, issue and business state remain governed by NuBlox.

## Non-functional requirements

The platform must support tenant isolation, security, traceability, high-volume enterprise use, accessibility, responsive/mobile work, reliable migrations, operational observability, recoverable integration, concurrency safety, retention/legal hold, enterprise reporting and long-lived project/asset history.
