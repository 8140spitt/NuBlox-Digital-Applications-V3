# NuBlox V3 Product Charter

## Mission

NuBlox V3 will be the operational system of record and system of work for construction and built-environment organisations, joining commercial, operational, technical, financial, people, supply-chain, governance and asset information into coherent end-to-end workflows.

## Design premise

The application is not a collection of modules or pages. It is a connected operating model.

Every user-facing capability must be derived through the same traceability chain:

`business function -> sub-function -> capability -> workflow -> business object -> control -> permission -> experience -> evidence`

If an implementation cannot be traced through that chain, it is not ready to build.

## Product outcomes

NuBlox V3 must allow an organisation to:

- establish organisational, project, programme and asset context once and reuse it throughout the platform;
- execute the agreed 29 business functions and their sub-functions without disconnected data silos;
- move information through controlled lifecycle states rather than duplicate it between functional areas;
- assign responsibility, accountability, approval and delegated authority explicitly;
- maintain a reliable commercial and operational record of decisions and transactions;
- expose the right information at the right level: enterprise, business unit, programme, project, package, asset and task;
- support role-specific work without creating role-specific copies of the underlying truth;
- provide auditable evidence of who did what, when, why and under what authority;
- integrate external systems without surrendering ownership of the NuBlox canonical model;
- support analytics and automation from governed operational data rather than reconstructed reporting extracts.

## Product boundaries

V3 will deliberately avoid:

- screen-first feature development;
- duplicate representations of the same core business object;
- navigation that mirrors an arbitrary code/module structure rather than user work;
- hidden permission logic implemented independently in individual screens;
- irreversible coupling of a business capability to one external vendor or integration;
- uncontrolled free-form status values where governed lifecycle states are required;
- dashboards that compensate for broken transactional workflows;
- configuration that allows the canonical meaning of core data to fragment by tenant.

## Definition of a native capability

A capability is native when NuBlox owns and governs its business semantics, data lifecycle, permissions, audit behaviour and user experience. A native capability may use external services, but the external service does not define NuBlox's operating model.

## Quality gates

A capability cannot enter implementation until the following are defined:

1. Business function and sub-function coverage.
2. Actors and accountable roles.
3. Trigger, inputs, lifecycle and completion criteria.
4. Canonical business objects and ownership.
5. State transitions and business rules.
6. Permission and delegated-authority requirements.
7. Approval, control and audit requirements.
8. Upstream and downstream workflow dependencies.
9. Primary user journey and exception journeys.
10. Acceptance criteria and observable evidence.

## Programme sequence

### Phase 0 — Operating model

Validate the 29 business functions, sub-functions, capability taxonomy, enterprise roles and end-to-end value streams.

### Phase 1 — Platform foundations

Define canonical domain model, tenancy, identity, permissions, workflow, audit, document/evidence and design-system foundations.

### Phase 2 — Vertical slices

Implement complete business journeys end-to-end, including data, permission, workflow, UI and audit behaviour, rather than building horizontal screen inventories.

### Phase 3 — Enterprise scale

Add integrations, automation, analytics, configurable policy, performance hardening and advanced operating-model capabilities without compromising the canonical model.

## Success test

NuBlox V3 succeeds when a sophisticated business can explain how each of its 29 functions operates in NuBlox, follow the information as it crosses functional boundaries, identify who is accountable at every control point, and retrieve the evidence behind a material business decision without reconstructing the story from disconnected systems.
