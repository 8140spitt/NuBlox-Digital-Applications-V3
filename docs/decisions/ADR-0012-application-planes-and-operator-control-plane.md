# ADR-0012 — NuBlox application planes and Operator Control Plane

**Status:** Accepted  
**Date:** 26 September 2026

## Context

NuBlox is a multi-tenant enterprise platform, not a single Tenant application. The platform must distinguish service-provider administration from customer Tenant administration and must preserve the established canonical Tenant routes:

- `nublox.com/{tenantSlug}/app` — authenticated Tenant application;
- `nublox.com/{tenantSlug}/public` — Tenant public/external surface.

A routing review identified a useful separation between public, onboarding, tenant application and operator control surfaces. NuBlox extends that pattern because Tenant public content is itself a distinct trust boundary from both the NuBlox public site and the authenticated Tenant application.

The existing `ROLE-PLATFORM-ADMINISTRATOR` is tenant-scoped through `AccessRoleAssignment.tenantId`; despite its historical name, it is therefore a top-level **Tenant administrator role**, not NuBlox service-provider authority.

The `tenants` table is also the foreign-key root for a substantial part of the ERP persistence graph. Physical deletion of a Tenant cannot be treated as an ordinary row delete without violating retention, audit and referential-integrity requirements.

## Decision

NuBlox has five application planes.

### 1. NuBlox Public Plane

Production root: `nublox.com`

Examples:

- `/`
- `/login`
- `/register`
- `/legal/*`
- `/docs/*`
- `/industries/*`

No Tenant authority is implied by entering this plane.

### 2. Account and Onboarding Plane

Production root: `nublox.com/onboarding/*`

This plane supports identity and Tenant creation before a working Tenant context exists. Account identity is not the same thing as Tenant Person/Employee identity.

### 3. Tenant Public Plane

Canonical root: `nublox.com/{tenantSlug}/public/*`

This plane is Tenant-resolved but does not grant authenticated Tenant application access. It supports externally consumable Tenant services such as careers, advertised vacancies and candidate journeys.

### 4. Tenant Application Plane

Canonical root: `nublox.com/{tenantSlug}/app/*`

This is the authenticated enterprise workspace. Tenant slug resolution precedes authentication, membership, Position/Function context, permission, authority and data-scope enforcement.

NuBlox retains the 29-Function enterprise architecture. Conventional software modules such as `/hr`, `/crm` or `/finance` do not replace Function as the canonical organisational/work boundary.

### 5. NuBlox Operator Control Plane

Development root: `/platform/*`  
Production target: `admin.nublox.com`

This plane is owned by the NuBlox service provider and is never authorised through Tenant roles. It has separate operator credentials, sessions, lifecycle commands and audit evidence.

Initial capabilities:

- Tenant search and inventory;
- Tenant lifecycle/status visibility;
- member and active-session visibility;
- suspend Tenant;
- reactivate Tenant;
- request Tenant deletion;
- finalise logical deletion after explicit confirmation;
- platform operator audit trail.

Future capabilities include platform configuration, provisioning, migration, template/version administration, platform metrics, support tooling, billing, feature flags and governed physical purge.

## Tenant lifecycle

The platform lifecycle is:

`ACTIVE -> SUSPENDED -> ACTIVE`

or

`ACTIVE|SUSPENDED -> DELETION_REQUESTED -> DELETED`

`DELETION_REQUESTED` immediately removes the Tenant from service by making the canonical Tenant record inactive and revoking active Tenant sessions.

`DELETED` means **deleted from service**, not physically purged from persistence. A later physical-purge process must independently satisfy retention, legal-hold and evidence requirements before destructive removal can occur.

A deleted Tenant cannot be reactivated through the ordinary operator lifecycle command. Restoration requires a separate governed restore process.

## Security boundary

Operator sessions use a separate cookie and persistence store from Tenant application sessions. Tenant membership, Tenant roles and Tenant permissions cannot grant Operator Control Plane access.

Operator roles are:

- `SUPER_ADMIN` — full lifecycle administration including deletion;
- `OPERATOR` — operational lifecycle administration excluding final deletion;
- `READ_ONLY` — platform visibility without lifecycle mutation.

Operator authentication is rate limited. Lifecycle mutations record platform audit entries. Suspension/deletion revokes active Tenant sessions.

## Routing

NuBlox does **not** adopt tenant subdomains as the canonical Tenant application route. The accepted route remains slug-first path routing:

- `nublox.com/baesystems/app`
- `nublox.com/baesystems/public`

Custom domains may later resolve to the same internal Tenant identity, but they must not create a second Tenant authority model.

## Consequences

- NuBlox service-provider authority is explicit rather than disguised as a Tenant administrator.
- Tenant administration can evolve without exposing provider controls.
- Tenant suspension and deletion become auditable lifecycle operations.
- Physical purge is deliberately separated from logical service deletion.
- Account/onboarding, Tenant-public, Tenant-application and platform-operator surfaces can each evolve with their own middleware and security controls.
