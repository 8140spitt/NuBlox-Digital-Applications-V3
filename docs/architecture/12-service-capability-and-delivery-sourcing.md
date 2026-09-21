# Service Capability and Delivery Sourcing Architecture

## Purpose

This document governs CBE service capability demand and sourcing. It does **not** define the
primary distinction between the 29 Core Business Functions and CBE professional disciplines.

Both Core Business Functions and CBE disciplines support employee role deployments for
**Functional Governance** and **Functional Delivery**, as defined by
`13-functional-governance-and-functional-delivery.md`.

The sourcing model in this document applies when a delivery context creates professional capability
demand that must be supplied internally, externally or through a hybrid arrangement.

## Core model

```text
TENANT
├── EMPLOYEE DEPLOYMENTS
│   ├── Core Business Functions
│   │   ├── Functional Governance
│   │   └── Functional Delivery
│   └── CBE Disciplines
│       ├── Functional Governance
│       └── Functional Delivery
│
└── DELIVERY CAPABILITY DEMAND
    └── Project / Contract / Appointment / other delivery context
        └── Required CBE Job Profile / profession
            ├── Internal Fulfilment
            ├── External Fulfilment
            └── Hybrid Fulfilment
```

## Service != profession

A Service is what the tenant provides to a client, user, asset owner or delivery organisation.

Examples:

- Architectural Design;
- Structural Engineering Design;
- Quantity Surveying;
- Building Surveying;
- Project Management;
- Acoustic Consultancy;
- Fire Engineering;
- Facilities Management.

A Job Profile is a professional capability used to deliver that Service.

For example:

```text
Architectural Design
├── Architect                  CORE
├── Architectural Technologist SUPPORTING
├── BIM / Information role     SUPPORTING
└── Assurance role             ASSURANCE
```

The existing 84 CBE Job Profiles therefore form the professional capability catalogue, not a list
of tenant Services.

## Tenant professional capability

A tenant may possess any subset of the 84 CBE professions internally, including all of them.

Internal capability is explicit through `TenantIndustryCapability`. A Job Profile appearing in the
platform catalogue does not imply that a tenant possesses that capability.

An internal capability records whether delivery is expected to be:

- **INTERNAL** — supplied from the tenant workforce; or
- **HYBRID** — the tenant has internal capability but may supplement it externally.

A profession that is not present in the tenant's internal capability portfolio may still be required
by a Project and fulfilled externally.

## Delivery demand

A Project or other supported delivery context raises `DeliveryCapabilityRequirement` records.

A Requirement states:

- delivery context;
- Service Offering;
- required CBE Job Profile / profession;
- required headcount;
- sourcing strategy;
- effective period;
- description of the capability requirement;
- fulfilment state.

Demand is defined before the provider is selected.

This prevents project planning from incorrectly expressing requirements as named vendors.

## Sourcing strategy

A capability requirement may be:

- **INTERNAL**;
- **EXTERNAL**;
- **HYBRID**;
- **UNDECIDED**.

The sourcing strategy constrains fulfilment but does not replace provider selection.

## Internal fulfilment

Internal fulfilment uses a real Person or Position.

NuBlox must prove:

1. the tenant has declared the required CBE profession as an internal capability;
2. the selected Person currently occupies a Position using the matching platform Job Profile, or
   the selected Position itself uses that Job Profile;
3. the Person/Position belongs to the tenant;
4. allocation does not over-fulfil the Requirement.

The fulfilment may record resource-capacity allocation separately from the percentage of Project
demand being fulfilled.

## External fulfilment

External fulfilment initially uses an Organisation from the tenant Party/Organisation registry.

The Organisation remains external supply. It is not converted into a tenant Organisation Unit and
its personnel are not treated as employees.

Future procurement and supplier-management integration may govern:

- approved supplier status;
- prequalification;
- capability evidence;
- insurance;
- professional indemnity;
- accreditations;
- framework agreements;
- rates and commercial terms;
- bids / quotations;
- appointments and contracts;
- supplier performance.

Project capability demand is therefore the upstream business requirement that can trigger supplier
sourcing and procurement.

## Hybrid fulfilment

A single Requirement may combine internal and external supply.

Example:

```text
Architect capability requirement — Project A
├── Internal Project Architect  60%
└── External Design Partner     40%
                               ─────
                               100% FULFILLED
```

This model supports multidisciplinary businesses that maintain significant internal capability while
supplementing capacity or specialist disciplines through the supply chain.

## Requirement fulfilment status

Active fulfilment share drives Requirement state:

- 0% = **OPEN**;
- >0% and <100% = **PARTIALLY_FULFILLED**;
- 100% = **FULFILLED**.

Active fulfilment may never exceed 100%.

## Relationship to Functional Deployment

`FunctionalDeployment` and delivery capability fulfilment are deliberately different concepts.

### Employee role deployments

A Core Business Function deployment or CBE Discipline Deployment assigns an employed Person,
Position or organisational responsibility to a governed role with an explicit purpose:
`FUNCTIONAL_GOVERNANCE` or `FUNCTIONAL_DELIVERY`.

It answers:

> Which role is this employee or Position performing, in which capability and context, and for what
> governance or delivery purpose?

### Delivery Capability Fulfilment

Delivery Capability Fulfilment satisfies Project or other delivery-context demand from internal
capacity, an external Organisation, or both.

It answers:

> How is this professional capability requirement being supplied?

Internal fulfilment may be associated with an employee who also has a CBE Discipline Deployment.
External fulfilment remains a supply-chain relationship and is not converted into tenant employment.

## Relationship to Deliverables

Capability fulfilment establishes who can perform the service delivery.

Deliverable Requirements and Deliverable Items establish what work product must be produced,
reviewed, approved, issued and accepted.

The intended chain is:

```text
Service
→ Project capability demand
→ Capability fulfilment
→ Responsibility / Work
→ Deliverable Requirement
→ Deliverable Item
→ Governed Information / structured output
→ Review / Decision / Issue / Acceptance
```

## Current implementation

The first implementation slice provides:

- tenant CBE Service Offerings;
- Service-to-CBE-profession mapping;
- tenant internal CBE capability portfolio;
- lightweight Project Construction Context creation for delivery planning;
- Project capability requirements;
- Internal, External and Hybrid fulfilment;
- exact profession matching for internal Person/Position supply;
- external Organisation supply;
- requirement fulfilment percentages and status;
- permission-gated CBE Disciplines workspace;
- audit/outbox evidence for material creation and fulfilment state changes.

The lightweight Project context establishes a governed delivery context only. It does not replace
the future Portfolio / Programme / Project native engine.

## Future integration

Subsequent implementation should connect this model to:

- supplier qualification and approved-vendor governance;
- sourcing events, RFQs and tenders;
- appointments, contracts and purchase orders;
- rates, budgets and commitments;
- resource availability and forward capacity;
- competence gates and professional qualifications;
- Project/WBS/resource planning;
- Deliverable planning;
- My Work;
- project commercial control;
- supplier and individual performance.

## Invariants

1. Core Business Function != Industry Service.
2. Industry Service != Job Profile.
3. Job Profile != Person.
4. Project capability demand != named provider.
5. Internal capability must be explicitly declared by the tenant.
6. Internal fulfilment must match the required CBE Job Profile.
7. External fulfilment is an Organisation relationship, not employment.
8. Requirement fulfilment cannot exceed 100%.
9. Employee role deployment != Project capability fulfilment.
10. Capability fulfilment != Deliverable; it supplies the capability that performs work producing
    Deliverables.
