# ADR-0005 — Context-first organisation and Team model

**Status:** Accepted, partially superseded by ADR-0006  
**Date:** 2026-09-22

## Decision

NuBlox uses **Context** as the primary structural boundary for organisation, governance, participation, work and information.

Within an organisational Context, the canonical enterprise Functions and professional CBE Domains operate as **Teams**:

- F01–F29 are **Core Function Teams**.
- D01–D16 are **Professional Domain Teams**.
- Every Team has a **Governance** side and a **Delivery** side.
- Positions and People provide the actual organisational capability of a Team.
- Work and Work Products are performed and controlled within the applicable Context.

The primary user model is:

```text
Context
└── Team
    ├── Governance
    └── Delivery
        ├── Positions / People
        ├── Work
        ├── Work Products
        ├── Decisions
        └── Evidence
```

## Context hierarchy

NuBlox distinguishes the platform from tenant-owned operating contexts.

```text
NuBlox Platform
└── Tenant Site
    └── Organisation Context
        └── Child Organisation Context
            ├── Product Context
            ├── Library Context
            ├── Programme Context
            ├── Project Context
            ├── Contract Context
            ├── Asset Context
            └── other governed work contexts
```

Organisation Contexts are recursive. A business may therefore represent structures such as:

```text
BAE Systems
└── Maritime & Land
    └── Naval Ships
```

without introducing separate canonical entity types for division, business unit, sub-organisation or sub-sub-organisation.

## Team semantics

A Function or Domain definition is canonical capability metadata. A Team is the manifestation of that capability in a specific Context.

For example:

```text
F09 Procurement & Supplier Management
├── BAE Systems / F09 Team
├── Maritime & Land / F09 Team
└── Naval Ships / F09 Team
```

The canonical Function definition continues to own the standard capability model, including L2 sub-functions, activities and native capability composition. The Context-specific Team owns the locally effective people, positions, governance, work, performance and records.

## Direct context membership

Team membership is scoped to the Context in which it is established.

- Tenant Site membership does not automatically aggregate all child Organisation membership.
- Organisation membership does not automatically aggregate child Organisation Unit membership.
- Child organisational Context membership is evaluated at that child Context.
- Inheritance and shared-team behaviour must be explicit and attributable rather than inferred from descendant aggregation.

This allows NuBlox to implement inherited configuration and shared participation deliberately while preserving clear accountability.

## HCM relationship

HCM Position Management owns Position and occupancy administration.

A Position is associated with:

- an organisational Context;
- a Core Function Team or Professional Domain Team;
- Governance or Delivery operating responsibility;
- a Job Profile where applicable;
- reporting structure, capacity and effectivity.

A Person occupies a Position. Team workspaces consume this state; they do not create a competing workforce administration model.

## Navigation

The primary application navigation is:

```text
Home
My Work
Contexts
Teams
Information
Deliverables
Change & Configuration
HCM & Positions
Competence
Control
Access
```

Legacy Function and Domain directory routes are compatibility surfaces only and resolve to the canonical Teams experience.

The F01 Strategy workbench remains a native delivery engine and is launched from the F01 Team Delivery view rather than acting as a competing top-level Function workspace.

## Consequences

### Positive

- Users first establish **where** they are operating, then **which Team** owns the capability.
- The 29 Functions and 16 CBE Domains no longer compete with Teams as separate concepts.
- Recursive enterprise structures can be represented without hard-coding organisation depth.
- Governance and Delivery remain visible as two sides of one Team.
- Position Management, work, work products and evidence gain a consistent Context boundary.
- Product, Project, Programme, Library and other work contexts can later reuse the same context administration and participation principles.

### Constraints

- Context inheritance must be explicit, traceable and override-aware.
- Context paths/slugs are navigation projections, not canonical database identity.
- Existing deployment persistence may remain temporarily as implementation machinery, but it must not define the primary user model.
- Existing native work engines must be composed into Team Delivery views rather than duplicated.
