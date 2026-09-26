# ADR-0014 — Complete NuBlox Operator Control Plane estate

**Status:** Accepted  
**Date:** 26 September 2026

## Context

ADR-0012 established a provider/operator security plane separate from Tenant administration. The first executable slice implemented operator authentication and Tenant lifecycle controls, but the provider needs to operate the complete NuBlox service rather than only suspend/reactivate/delete Tenants.

## Decision

The production operator boundary is `admin.nublox.com`. Local development uses `/platform` on the web application while preserving a separate operator cookie/session and provider authority model.

The canonical operator information architecture is:

```text
admin.nublox.com
/
├── tenants
│   └── {tenantId}
│       ├── overview
│       ├── configuration
│       ├── people
│       ├── subscriptions
│       ├── usage
│       ├── health
│       ├── security
│       ├── sessions
│       ├── audit
│       ├── migrations
│       ├── provisioning
│       ├── suspend
│       └── deletion
├── users
├── templates
├── industries
├── metadata
├── feature-flags
├── provisioning
├── migrations
├── integrations
├── jobs
├── security
├── audit
├── metrics
└── platform-configuration
```

The provider route uses immutable Tenant ID because it is an internal administration boundary. Normal customer routes remain slug-based: `/{tenantSlug}/app` and `/{tenantSlug}/public`.

## Authority boundary

Provider authority is never inferred from Tenant RBAC. The existing Tenant-scoped Platform Administrator role remains a Tenant application role; it does not grant access to the NuBlox Operator Control Plane.

Provider roles remain:

- `SUPER_ADMIN` — all provider controls including final Tenant deletion and global configuration;
- `OPERATOR` — non-destructive operational administration;
- `READ_ONLY` — provider visibility without mutation authority.

## Authoritative data sources

The operator console must read existing authoritative NuBlox records rather than create shadow administration copies where canonical data already exists.

Examples:

- users/memberships/sessions -> application identity tables;
- Tenant configuration/templates/provisioning -> metadata-driven provisioning tables;
- industries -> Industry Solution catalogue and Tenant assignments;
- metadata -> governed metadata/Thing definitions;
- security -> authentication policy, MFA, passkey, OIDC and authentication-event records;
- audit -> platform operator audit plus Tenant kernel audit evidence;
- migrations -> `kernel_schema_migrations` for global schema state;
- Tenant migration/configuration history -> applied configuration-template history;
- metrics/usage -> live canonical counts plus governed usage snapshots.

Provider-owned operational concepts that did not previously have an authoritative record are persisted separately:

- subscriptions;
- feature flags and Tenant overrides;
- integration registrations and health;
- provider background jobs;
- platform configuration;
- usage snapshots.

## Tenant lifecycle

Tenant deletion remains governed logical deletion:

```text
ACTIVE
→ SUSPENDED
→ DELETION_REQUESTED
→ DELETED
```

`DELETED` means removed from service, routes disabled and sessions revoked. It does not mean physical database purge. Physical purge requires a separate retention/legal-hold-aware process.

## Migration semantics

Two migration concepts are deliberately distinguished:

1. **Platform schema migrations** — global SQL migration state held in `kernel_schema_migrations`.
2. **Tenant configuration evolution** — applied configuration-template/provisioning history for a specific Tenant.

The per-Tenant Migrations view may show both for operational traceability but must not imply that SQL schema migrations are independently applied per Tenant.

## UX invariant

The operator console follows the NuBlox no-fake-navigation rule. A visible control-plane section must resolve to a working route and live read model. Planned future mutations may be read-only until implemented, but the UI must not present non-existent actions as executable.

## Consequences

1. `/platform` is the local operator dashboard, not merely the Tenant lifecycle list.
2. `/platform/tenants` is the provider Tenant directory.
3. `/platform/tenants/{tenantId}/{section}` provides Tenant drill-down across the complete estate.
4. Global operator sections are available at `/platform/{section}`.
5. Platform configuration must never store raw secret material; `SECRET_REFERENCE` values are references to an external secret-management boundary.
6. Provider actions write attributable platform audit evidence.
