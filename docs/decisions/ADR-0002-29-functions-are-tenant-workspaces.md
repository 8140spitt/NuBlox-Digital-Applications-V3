# ADR-0002 — The 29 Enterprise Functions Are Tenant Workspaces

**Status:** Accepted  
**Date:** 14 September 2026

## Context

NuBlox V3 uses a canonical set of 29 enterprise functions. Earlier architectural wording treated these functions primarily as an operating taxonomy and implied that user navigation might instead be organised around generic objects, journeys or underlying capability domains.

That interpretation is incorrect for V3.

NuBlox is intended to provide a sophisticated enterprise with a recognisable functional operating model inside each tenant application. Users must be able to enter a stable workspace for Strategy, Governance, Finance, HR, Procurement, Projects, Quality and every other canonical function, while still benefiting from one integrated platform underneath.

## Decision

Each of the 29 enterprise functions is a **stable first-class workspace within the tenant application**.

The 29 function IDs (`F01` through `F29`) are therefore also the canonical workspace identities.

A function workspace:

- is a primary tenant navigation destination;
- is the primary home for that function's L2 sub-functions;
- presents relevant work queues, workflows, business objects, decisions, controls, evidence and performance information;
- uses the common NuBlox design system and workspace anatomy;
- may surface canonical records owned by underlying capabilities/domains;
- may participate in workflows that span several function workspaces.

## What this does not mean

The decision does **not** create 29 independent software products, data models, databases or bounded contexts.

Workspace boundaries are user-facing functional boundaries. Architectural ownership beneath them remains based on canonical business objects, lifecycle invariants and cohesive capability/domain responsibilities.

Therefore:

`Function Workspace != Data Silo != Database Schema != Service Boundary`

A canonical record may be visible and actionable in multiple workspaces while retaining one authoritative source of truth.

## Information architecture

The governing experience hierarchy is:

`Tenant -> Function Workspace -> Sub-function -> Workflow / Queue / Record / Decision`

Every canonical L2 sub-function must have exactly one primary function-workspace home. Cross-functional workflow participation is modelled explicitly rather than achieved through duplicated records or duplicated implementations.

## Consequences

1. The tenant application shell must expose the 29 function workspaces as the primary functional navigation model.
2. All 29 workspaces must share one design grammar and common interaction patterns.
3. Each workspace requires an explicit sub-function map before feature implementation.
4. Underlying capabilities/domains remain implementation and ownership constructs; they do not replace the 29 user-facing workspaces.
5. End-to-end processes may cross workspace boundaries, but context and data continuity must be preserved.
6. Permissions can affect workspace visibility, records, actions and decisions without changing the canonical workspace model.
7. Workspace completeness is assessed against sub-function coverage and executable business outcomes, not merely the presence of a landing page.

## Superseded interpretation

Any V3 wording stating or implying that enterprise functions are not navigation sections, are merely accountability lenses, or should not define the tenant workspace layer is superseded by this ADR.
