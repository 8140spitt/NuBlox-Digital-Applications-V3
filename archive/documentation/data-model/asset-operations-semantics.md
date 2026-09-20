# Asset Operations, Commissioning, Maintenance & Service Semantics

Status: governed V3 semantic baseline

## Purpose

This model defines how NuBlox carries a built-environment technical identity from delivery through commissioning, handover, operation, maintenance, service, warranty, aftercare and eventual replacement without creating a second FM/EAM asset register.

The governing rule is:

> Handover changes stewardship, accountability and operational state; it does not create a new System, Asset or Component identity.

## Whole-life continuity

```text
Project / Delivery
      ↓
Commissioning Plan
      ↓
Commissioning Activity
      ↓
Test / Inspection / Balancing / Readiness Evidence
      ↓
Handover Package
      ↓
Handover Acceptance
      ↓
Operations
      ↓
Maintenance Plan → Work Order
      ↓
Inspection / Failure / Defect / Warranty / Condition
      ↓
Service History projection
```

The technical object remains the same governed `System`, `Asset` or `Component` throughout this chain.

## Commissioning

A Commissioning Plan governs the scope, sequence, prerequisites, witness requirements and acceptance criteria for commissioning Systems and Assets.

A Commissioning Activity is executable work under that plan. It is not the same identity as a Project Schedule Activity or workflow task, although explicit relationships can connect them.

Execution evidence includes test results, inspection results, balancing records, readiness records, retests and commissioning certificates. Evidence is immutable once accepted. A failed result is not overwritten by a later successful retest.

`Commissioning System` is normalised to the canonical `System` identity. `Commissioning Defect` uses the shared cross-domain `Defect` pattern.

## Handover and closeout

A Handover Package is a governed package that references the exact:

- Systems and Assets being transferred;
- controlled information revisions;
- commissioning evidence;
- training and briefing evidence;
- outstanding Defects/actions;
- acceptance scope and recipient.

It is not an uncontrolled document folder.

Handover Acceptance is an attributable decision/evidence record. Conditional acceptance does not silently close outstanding obligations. Project closure remains separate from Asset operational lifecycle.

Operations and Maintenance information uses the canonical Information Container / Information Deliverable model rather than an FM-specific document repository.

## Maintenance planning and execution

NuBlox separates four layers:

```text
Maintenance Strategy
      ↓
Maintenance Plan
      ↓
Maintenance Task Template
      ↓
Work Order
```

The Strategy establishes policy and tactics. The Plan applies them to Systems/Assets. The Task Template defines reusable controlled work. The Work Order authorises and records actual execution.

Maintenance Schedule and Lifecycle Replacement Plan are controlled planning components of the maintenance-planning architecture; they are not replacements for Asset identity or the Project delivery Schedule.

Work Order is operational work and must never be confused with a workflow approval task or a Project Schedule Activity.

## Service management

The service chain is deliberately separated:

```text
Service Request
      ↓
Service Case
      ↓
Service Appointment / Dispatch / Field Visit
      ↓
Work Order
      ↓
Service Acceptance
```

A Service Request is intake. A Service Case coordinates resolution. An Appointment manages a field commitment. A Work Order records authorised execution. Service Acceptance records attributable customer/recipient acceptance.

Facilities Request is a typed Service Request. Service Contract reuses canonical Contract identity. Service Entitlement is distinguished from commercial/claim entitlement. Service Level Agreement records service targets and coverage linked to the relevant Contract/entitlement context.

## Reliability, condition and defects

`Failure` is an immutable event: loss or degradation of intended function.

`Defect` is a managed case/nonconforming condition with its own lifecycle. The same Defect pattern is shared across quality, commissioning, maintenance and aftercare.

Condition is not stored as one mutable Asset field. Inspections, Condition Assessments, measurements and observations remain retained evidence from which current condition can be derived.

Service History is a projection over the canonical evidence and execution records. It is rebuildable and is not an independently editable source of truth.

## Warranty and aftercare

Warranty is a governed coverage/obligation record linked to Item/Asset, provider and effective conditions.

Warranty Claim is a separate case against that coverage.

Defects Liability Period and Aftercare Period are effective post-completion obligation/coverage relationships. They can remain active after Project closeout and do not create new Contract or Asset identities.

## Parts, inventory and utilities

Parts Consumption posts through canonical Inventory Movement. The maintenance domain does not maintain a separate parts-consumption truth store.

Meters are typed Assets. Meter readings and Utility Consumption are time-series evidence. Utility Account is a commercial/service account linked to provider Party, spatial context and metering context.

## Property occupancy and tenure

Occupancy, Lease and Licence are effective Party-to-Property/Facility/Space relationships. They do not duplicate Party, Property or Space identities.

## Non-negotiable boundaries

- Handover is not an identity boundary.
- Commissioning System is not a second System master.
- Work Order is not workflow work and not a Project Schedule Activity.
- Failure is not Defect.
- Defect is not a mutable Asset status field.
- Maintenance Plan is not a duplicate Asset master.
- Service Request is not Service Case and not Work Order.
- Warranty is not Warranty Claim.
- Service History is a projection, not independently mutable truth.
- Parts Consumption uses Inventory Movement.
- O&M information uses controlled Information Containers.
- FM/operations must not create a parallel Asset register.
