# Delivery Context Semantics

**Status:** governed logical-model baseline  
**Date:** 16 September 2026  
**Scope:** portfolio, programme, project, stage, WBS, work-package, schedule, baseline, progress and resource-planning context

## Purpose

This document governs how NuBlox represents delivery context without collapsing governance, scope, schedule, commercial, physical and information structures into one hierarchy.

The machine-readable authority is `app/src/lib/data/delivery-context-model.ts`.

## Core rule

A Project is one stable canonical identity. The following are separate structures that reference that Project:

```text
Governance context   Portfolio → Programme → Project
Stage context        Project → Delivery Stage Assignment → configured stage definition
Scope context        Project → WBS Element → Work Package
Time context         Schedule → Activity / Milestone + Dependency
Baseline context     Schedule → immutable Schedule Baseline
Progress context     Progress Record → Activity / Work Package
```

These structures are intentionally connected through governed relationships. They are not interchangeable.

## Canonical delivery constructs

| Model ID | Construct | Semantic purpose |
| --- | --- | --- |
| DEL-PORTFOLIO | Portfolio | investment/outcome governance context |
| DEL-PROGRAMME | Programme | coordinated governance of related Projects/change |
| CBO-PROJECT | Project | stable foundation delivery identity |
| DEL-STAGE-ASSIGNMENT | Delivery Stage Assignment | effective phase/stage classification against Project |
| DEL-WBS-ELEMENT | WBS Element | controlled scope-decomposition node |
| DEL-WORK-PACKAGE | Work Package | governed unit of delivery scope/work |
| DEL-SCHEDULE | Schedule | time-planning network identity |
| DEL-SCHEDULE-ACTIVITY | Schedule Activity | time-based unit of planned work |
| DEL-MILESTONE | Milestone | significant zero-duration schedule point |
| DEL-SCHEDULE-BASELINE | Schedule Baseline | immutable approved schedule snapshot |
| DEL-PROGRESS-RECORD | Progress Record | dated progress observation/evidence |
| DEL-RESOURCE-REQUIREMENT | Resource Requirement | planned resource/capacity need |

## Canonicalization decisions

- `Portfolio` and `Programme` are validated as governed identities.
- `Job` is merged into `Project` in the project-controls context.
- `Phase` and `Stage` use one canonical **Delivery Stage Assignment** pattern; configured stage definitions preserve phase/stage terminology and hierarchy.
- the construction-operations occurrence of `Phase` reuses the same stage-assignment pattern.
- `WBS Element` and `Work Package` are validated separately.
- project-controls `Task` is merged into `Activity`, which is renamed **Schedule Activity** for this context.
- workflow `Work Item`, review tasks and approval tasks remain separate shared-work objects.
- `Schedule`, `Milestone` and `Schedule Baseline` remain distinct governed records.
- `Dependency`, `Resource Allocation` and stage assignment are governed relationships.
- `Progress Record` is event/evidence; current progress is a derived view over retained observations.
- `Project Participant` reuses the shared Membership/participation model rather than becoming another party/person master.

## Structural boundaries

### Governance hierarchy

`Portfolio → Programme → Project`

This governs investment, outcomes, benefits and oversight. It is **not** the WBS, schedule, cost breakdown or physical asset hierarchy.

Programme membership does not redefine Project identity. Projects can move between governance contexts while retaining the same canonical Project ID.

### Stage model

Project phase/stage is represented through an effective-dated assignment to a configured stage definition.

This allows RIBA, client-specific, infrastructure, development or tenant-specific stage systems without hard-coding them into Project lifecycle states.

`Phase/Stage != Project lifecycle != workflow approval`

### Scope hierarchy

`Project → WBS Element → Work Package`

The WBS decomposes controlled project scope. Work Packages provide governable units of delivery scope, assignment, planning and evidence.

A Work Package is not automatically a Procurement Package, Commercial Package, Subcontract or Contract. Those objects can map to one or more Work Packages.

### Time network

`Schedule → Schedule Activity / Milestone + Dependency`

The Schedule is the time model. Activities/milestones can map to WBS Elements and Work Packages, but the schedule network must not replace the scope hierarchy.

`WBS != Schedule`

### Baseline

An approved Schedule Baseline is an immutable snapshot. Rebaseline creates a new baseline. Historical approved baselines are retained for variance, entitlement, audit and forensic analysis.

`Current/forecast schedule != approved baseline`

### Progress

Progress is captured as dated, attributable evidence against Activity or Work Package. Corrections are explicit. The current percentage/status is a projection from retained evidence rather than a destructively overwritten field.

### Resource planning

Resource Requirement expresses planned need. Resource Allocation expresses effective fulfilment/assignment. Resource identities remain authoritative in People, Plant/Equipment, Material or other relevant domains.

## Cross-structure rules

1. Project identity survives phase/stage changes, schedule revisions, rebaselines, organisational changes, contract changes and handover.
2. Portfolio/Programme membership is effective-dated and does not duplicate Project truth.
3. Phase/Stage is classification context, not Project lifecycle.
4. WBS is scope; Schedule is time.
5. Work Package is delivery scope; Procurement Package and Commercial Package remain separate.
6. Schedule Activity is not a workflow Work Item or Approval Request.
7. Milestone is not automatically a Contract Key Date, Gate Review or approval task; it may reference them.
8. Site/System/Asset identity is independent of Project/WBS/Schedule and survives handover.
9. Information Container identity is independent of folder/project structure and relates to delivery objects through governed references.
10. Responsibility, participation and authority use the shared Authority & Participation model.

## Construction example

A single Project may simultaneously have:

- one Portfolio membership;
- one Programme membership;
- a current RIBA Stage 4 assignment;
- a WBS containing `Substructure`, `Frame`, `Envelope`, `MEP`;
- Work Packages for `Concrete frame`, `Curtain wall`, `Mechanical installation`;
- a master Schedule containing thousands of Schedule Activities;
- an approved Schedule Baseline 03;
- multiple Contracts/Procurement Packages mapped to the relevant Work Packages;
- Sites, Systems and Assets that remain canonical beyond project completion;
- Information Containers describing the same scope/physical objects.

Those are coordinated views over one delivery context, not one giant tree.

## Physical implementation boundary

This logical model does **not** imply:

- a single universal project hierarchy table;
- WBS nodes doubling as schedule activities;
- schedule activities doubling as workflow tasks;
- Work Packages doubling as procurement/contract packages;
- stage labels being hard-coded lifecycle enums;
- percentage-complete being the authoritative historical record;
- Project closure deleting or recreating Site/System/Asset identities.

Persistence, commands, events and read models must implement these semantics without redefining them.
