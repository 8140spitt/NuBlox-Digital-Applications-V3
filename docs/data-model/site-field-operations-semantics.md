# Site, Field & Construction Operations Semantics

## Purpose

BOF-12 governs construction-site execution and field evidence while reusing canonical Project, Site, delivery, people, asset, inventory, QHSE, information and evidence identities.

## Core field execution model

```text
Project / Site / Delivery Stage / WBS / Work Package
        ↓
Work Area
        ↓
Site Establishment / Mobilisation / Access
        ↓
Daily Diary / Labour / Plant / Material / Delivery / Progress
        ↓
Temporary Works / Permit / Isolation / Instructions / Constraints
        ↓
Completion / Handover Readiness
```

Field operations record what happened, where, against what scope, under what authority and with what evidence. They do not create alternative Project, Site, Asset, Worker, Schedule, Inventory or QHSE masters.

## Shared context

- Site reuses the canonical built-environment Site.
- Phase reuses Delivery Stage Assignment.
- Zone reuses canonical Zone.
- Work Area is a temporary operational overlay across spatial and delivery scope; it is not permanent spatial hierarchy or WBS.

## Site establishment and mobilisation

Site Establishment Record is evidence that defined temporary facilities and controls were established or changed.

Mobilisation Record captures actual mobilisation of workforce, plant, temporary facilities or capability into field scope.

These records never create duplicate Site, Asset or Worker identities.

## Access and daily site evidence

Site Access Record converges on Physical Access Event.

Physical access is separate from HCM Attendance and Time Entry and from the credential that authorised entry.

Daily Site Diary is a governed daily evidence envelope. It references authoritative underlying records for labour, plant, deliveries, progress, constraints and incidents rather than replacing those records.

## Progress, labour, plant and material

Field Progress Record reuses Progress Record.

Field Labour Record is operational evidence of labour presence/effort and remains distinct from HCM Attendance, Time Entry, Timesheet and payroll truth.

Plant Usage Record references canonical Plant/Asset identity.

Material Usage reuses Inventory Movement.

Delivery Record reuses logistics Delivery evidence; Goods Receipt remains separate where procurement/financial receipt semantics apply.

## Temporary works

```text
Temporary Works Control Item
        ↓
Temporary Works Design
        ↓
Temporary Works Check
        ↓
approved/use controls
```

Temporary Works Control Item is the governed temporary-works register/control identity. It is not canonical Product/Material Item and is not permanent Asset identity by default.

Temporary Works Design reuses Information Container.

Temporary Works Check reuses Design Review against the exact design revision and check category.

## Permits and isolation

Permit to Work and Isolation reuse the BOF-13 QHSE identities.

Field operations never maintain separate permit or isolation truth.

## Instructions and constraints

Field Work Instruction directs execution of exact field work under an identified authority/basis.

It does not itself amend a Contract. Where an instruction has time/cost/contract consequences, the commercial change/instruction process is explicitly linked.

Project-controls Constraint and Field Constraint converge on **Delivery Constraint**.

Development Constraint remains distinct because it concerns land/development feasibility and consent rather than delivery execution.

## Forms and evidence

Field Form reuses Information Container.

Photographic Evidence and Geospatial Evidence reuse generic Evidence Item semantics while retaining capture time, location, integrity and provenance metadata.

## Actions, completion and readiness

Site Action reuses Decision Action.

Field Completion Record is evidence that exact work scope met defined completion criteria. It is not Project closure, Contract completion, regulatory completion or Handover Acceptance.

Handover Readiness Record reuses governed readiness evidence and remains distinct from Handover Acceptance.

## Non-negotiable rules

1. Site, Stage and Zone identities are shared and never recreated for field operations.
2. Work Area is temporary execution context, not permanent spatial or WBS structure.
3. Daily Diary is an evidence envelope, not a replacement source system.
4. Field Progress uses Progress Record.
5. Field Labour remains separate from HCM/payroll truth.
6. Plant Usage references canonical Asset/Plant.
7. Material Usage uses Inventory Movement.
8. Delivery Record uses Delivery evidence.
9. Temporary Works Control Item is not canonical Item or permanent Asset by default.
10. Temporary Works Design/Check reuse Information Container/Design Review.
11. Permit and Isolation reuse QHSE controls.
12. Field Work Instruction does not by itself amend Contract truth.
13. Project and field constraints converge on Delivery Constraint.
14. Field Form uses Information Container.
15. Photos/geospatial captures use Evidence Item.
16. Site Action uses Decision Action.
17. Field Completion and Handover Readiness remain evidence, not automatic lifecycle closure.