# ADR-0013 — Function Tool Registry and workspace composition

**Status:** Accepted  
**Date:** 26 September 2026

## Context

NuBlox already has one canonical Function concept under ADR-0006. The 29 Core Business Functions and the 16 Construction & Built Environment Functions are stable organisational capability definitions, not separate applications. The tenant UI already treats My Function as the worker's primary operating world resolved from Employment, occupied Position and Position-to-Function assignment.

What remained implicit was how a Function becomes executable without creating a bespoke application and private data model for every Function.

## Decision

NuBlox introduces a governed **Tool Registry** and **Function-to-Tool Composition** model.

A Function is not a tool and a tool is not a Function. A Function composes governed tools over canonical objects, workflow, Authority, Evidence and audit.

The canonical tool classes are:

- **K0 — Kernel primitives:** non-user-facing capabilities used across the platform, including Identity, Party, Position, Permission, Authority, Workflow, Evidence, Audit, Rules, Calculation, Numbering, Search and Notification.
- **K1 — Shared kernel tools:** reusable user-facing tools available across Functions, including Work Queue, Approval Workbench, Evidence Capture, Document Authoring, Register Builder, Report Builder, Dashboard Builder, Saved Views, Bulk Actions, Import/Export, Audit Trail Viewer and Object Inspector.
- **K2 — Cross-domain tools:** reusable tools shared by a bounded group of Functions.
- **K3 — Function-specific native tools:** tools owned by a canonical Function.
- **K4 — Industry-solution native tools:** tools supplied by an Industry Solution and reusable by its Functions.
- **K5 — Connected specialist authoring tools:** external specialist tools whose professional output is governed by NuBlox even when NuBlox is not the authoring environment.

K5 does not remove NuBlox responsibility for the governed output, review, Decision, issue, acceptance, configuration, Evidence or audit trail.

## Workspace composition

The existing user-facing workspace views remain authoritative:

1. Overview
2. Governance
3. Delivery
4. Performance
5. Records

Tool composition does not replace those views. It populates zones inside them:

- Command Bar
- Queue Panel
- Work Surface
- Object Inspector
- Evidence Panel
- Decision Panel
- KPI Rail

Each composition binds:

```text
Function
+ Tool
+ Workspace View
+ Workspace Zone
+ Operating Side
+ Display Order
+ Default-open rule
+ Tenant-configurable rule
```

Operating side is one of `BOTH`, `FUNCTIONAL_GOVERNANCE` or `FUNCTIONAL_DELIVERY`.

## Native tool contract

Every registered tool declares, where applicable:

- canonical owner Function;
- required Permission key;
- required Authority scope;
- consumed object types;
- produced object types;
- produced Deliverable types;
- Evidence requirements;
- configuration schema reference;
- version;
- lifecycle status;
- implementation state.

A NuBlox native tool must ultimately satisfy these invariants:

1. **Object-backed** — reads and writes canonical or governed object types rather than a private shadow master.
2. **Evidence-producing** — Deliverable-producing work declares and records required Evidence.
3. **Authority-aware** — actions constituting Decisions resolve through Authority rather than Permission alone.
4. **Workflow-bound** — controlled state changes use governed lifecycle/workflow.
5. **Audit-logged** — attributable actions preserve actor, Position, Function, context and time.
6. **Composable** — the tool can participate in a Function workspace through metadata composition.
7. **Versioned** — tool definitions and compositions are version-aware.
8. **Governed-changeable** — changes to tool configuration remain subject to governed change.

## Canonical taxonomy is unchanged

This decision does **not** renumber or replace Functions.

- F01 remains `Strategy & Enterprise Planning`.
- F02 remains `Corporate Governance`.
- F01–F29 remain the Core Business Function taxonomy.
- D01–D16 remain the existing CBE-classified Function taxonomy.

The proposed governance acceptance pattern is therefore implemented against **F02**, not by redefining F01.

Likewise existing CBE Function identifiers remain authoritative. Commercial / quantity-surveying capability remains aligned to the existing CBE taxonomy rather than being moved to a newly proposed D-code.

## Initial composition

Migration `0072_function_tool_registry.sql` establishes the registry and composes the shared K1 interaction grammar across every currently active Function.

F02 Corporate Governance is the first Function-specific reference composition. It registers, among others:

- Board & Committee Register;
- Meeting Manager;
- Paper Submission;
- Board Pack Builder;
- Resolution Register;
- Decision Record Publisher;
- Delegation of Authority Matrix;
- Conflict of Interest Register;
- Director Appointment & Independence Tracker;
- Governance Calendar;
- Board Evaluation;
- Governance Action Tracker;
- Statutory Filing Register.

These records describe the canonical tool contract and workspace location. An implementation state of `PLANNED` must never be presented to ordinary users as an available operational action.

## Consequences

1. The universal Function read model includes Function Tool Composition.
2. Every Function receives the same shared interaction grammar without becoming an independent application.
3. Function-specific tools may be added incrementally without changing the Function taxonomy.
4. CBE specialist tooling can be registered as K4 or K5 while preserving the same object, Decision, Evidence and audit rules.
5. UI surfaces must filter tools by real availability and user context; registered/planned metadata is not fake navigation.
6. Market-tool research can map directly to K2/K3/K4/K5 tool requirements rather than creating new top-level product modules.
7. Cross-functional processes continue to preserve one shared business context while each Function contributes governed work through its composed tools.
