# ADR-0005 — Context and Team Operating Model

- Status: Superseded by ADR-0006 for capability identity and primary navigation; Context hierarchy retained
- Date: 2026-09-22
- Supersedes: navigation and UX assumptions that expose Functions, CBE Domains and workforce deployment as separate peer concepts

> **Current authority (25 September 2026):** this duplicate ADR-0005 is historical. Its recursive Context hierarchy remains useful, but ADR-0006 supersedes the Team-type split and Teams-first UX. Function is the universal capability concept, and HCM Position-to-Function assignment determines the user's Governance or Delivery working world.

## Decision

NuBlox shall use **Context** as the primary administrative and working boundary, and **Team** as the primary organisational capability operating within that Context.

A Team is one of two canonical capability types:

1. **Core Function Team** — one of F01–F29.
2. **Professional Domain Team** — one of D01–D16 for the Construction & Built Environment industry solution.

Every Team has two operating sides:

- **Governance** — how the Team is mandated, controlled, assured and improved.
- **Delivery** — the work the Team performs and the work products it produces.

Positions and People provide the actual organisational capability of a Team. HCM Position Management remains authoritative for organisation structure, Position definition and Person-to-Position occupancy.

## Context hierarchy

The target hierarchy is recursive:

```text
Platform
└── Tenant Site
    └── Organisation
        └── Sub-organisation
            └── Sub-organisation ...
```

Working contexts such as Product, Library, Programme, Project, Contract, Asset, Facility, Site and Service sit beneath an appropriate organisational context but are not organisational units.

The current implementation projects the existing tenant, Organisation and Organisation Unit records into the Context UX while canonical recursive Context persistence is developed.

## Team identity versus Team instance

The canonical Function or Domain definition is not duplicated per Context.

```text
Canonical Function Definition F09
    ├── BAE Systems / F09 Team
    ├── Maritime & Land / F09 Team
    └── Naval Ships / F09 Team
```

Each context-specific Team resolves:

- effective governance;
- Positions and People;
- local responsibility and authority;
- current work;
- work products and evidence;
- performance;
- inherited and locally specialised controls.

## User experience

The primary navigation is:

```text
Home
My Work
Contexts
Teams
```

The previous top-level **Functions** and **CBE Domains** navigation is removed. Existing routes remain available during convergence but are treated as compatibility/workbench routes rather than the primary mental model.

A Team workspace exposes:

```text
Overview
Governance
Delivery
People
Performance
Records
```

## HCM relationship

The ordinary user model is not "deploy a person into a Function".

Instead:

```text
Context
→ Team
→ Governance | Delivery
→ Position
→ Occupant
→ Work
```

Existing functional and industry deployment records remain valid persistence evidence during migration, but the user-facing language is **Team membership / Team assignment**.

## Inheritance

Context inheritance will be applied to controlled configuration such as:

- policies;
- standards;
- methods;
- templates;
- lifecycle/workflow;
- object rules;
- preferences;
- roles and authority;
- Team defaults.

Child contexts consume inherited configuration and may specialise it when policy permits. Effective state must retain source, inheritance and override provenance.

## Consequences

- Functions are no longer a peer navigation concept to Teams; they are canonical Team types.
- CBE Domains are professional Team types.
- HCM owns Position and occupancy administration.
- Projects and other delivery contexts consume organisational Teams rather than recreate enterprise capability.
- NuBlox can support enterprise, division, business unit and deeper recursive structures without cloning the 29 Function definitions.
