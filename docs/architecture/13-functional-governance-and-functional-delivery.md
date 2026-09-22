# Functional Governance and Functional Delivery

## Purpose

NuBlox enables people employed by a tenant to perform work through governed deployments.

Every deployed role has one explicit purpose:

- **FUNCTIONAL_GOVERNANCE** — work that governs, defines, controls, assures, resources or improves a Function or professional domain.
- **FUNCTIONAL_DELIVERY** — work that performs the capability for which the Function or professional domain exists.

This rule applies consistently to both the 29 Core Business Functions and Construction & Built Environment professional disciplines.

## The deployment carries the purpose

Functional Governance and Functional Delivery are not permanent classifications of a Person, Position or Job Profile.

Employment describes who the person is in the organisation. A deployment describes the role the person or Position is performing in a particular capability and context.

```text
Person
→ Employment / Position
→ Job Profile
→ Capability
→ Deployed Role
   ├── FUNCTIONAL_GOVERNANCE
   └── FUNCTIONAL_DELIVERY
→ Responsibility
→ Context
→ Work
```

The same employee may hold multiple concurrent deployments with different purposes.

Example:

```text
Person: Jane Smith
Employment Position: Senior Architect

Deployment A
  Capability: Architecture
  Role: Architecture Standards Lead
  Purpose: FUNCTIONAL_GOVERNANCE
  Context: Organisation-wide
  Capacity: 15%

Deployment B
  Capability: Architecture
  Role: Project Architect
  Purpose: FUNCTIONAL_DELIVERY
  Context: Project A
  Capacity: 60%
```

## Core Business Functions

Each of the 29 Core Business Functions can contain deployments for either purpose.

For Finance:

- Functional Governance may include accounting policy, financial controls, authority design, assurance, competence and Function improvement.
- Functional Delivery may include journals, invoicing, payments, reconciliation, forecasting, close and reporting.

For Procurement:

- Functional Governance may include procurement policy, sourcing standards, delegations, supplier governance and assurance.
- Functional Delivery may include sourcing events, RFQs, bid evaluation, purchase orders, supplier onboarding and contract execution.

The same pattern applies across F01–F29.

## CBE professional disciplines

The same two-purpose model applies to CBE professional capability.

For Architecture:

- Functional Governance may include design standards, BIM methods, technical procedures, templates, professional competence, technical assurance and lessons learned.
- Functional Delivery may include briefing, design, modelling, drawings, schedules, specifications, coordination, reviews and site work.

For Quantity Surveying:

- Functional Governance may include measurement rules, cost-management procedures, commercial standards, assurance methods and professional competence.
- Functional Delivery may include estimating, cost planning, measurement, valuations, change control, forecasts and final accounts.

The 84 CBE Job Profiles identify professional capability. They do not determine deployment purpose.

## Functional Deployment

A Core Business Function deployment binds:

- Function / optional L2 sub-function;
- deployment purpose;
- Organisation / optional Organisation Unit;
- operating or delivery context;
- assigned Person, Position or Organisation Unit;
- responsibility;
- optional Job Profile;
- responsibility scope;
- capacity;
- effectivity.

Functional Deployment remains separate from employment, Permission and business Authority.

### HCM Position Management

F15 Human Resources / Human Capital is the administration owner for workforce Position Management.

The HCM Position Management experience orchestrates the relationship between:

1. **Person** — the employed individual;
2. **Position** — the organisational seat;
3. **Position occupancy** — the effective employment assignment of the Person to the Position;
4. **Job Profile** — the reusable expectation/capability associated with the Position;
5. **Deployment** — the governed assignment of that Person/Position into a Function or CBE Domain;
6. **Deployment purpose** — Governance or Delivery;
7. **Responsibility, context, capacity and effectivity** — how that deployment operates.

This is a user-experience ownership decision, not a collapse of canonical entities. Person, Position, Occupancy, Job Profile and Deployment remain distinct records.

## CBE Discipline Deployment

A CBE Discipline Deployment binds:

- CBE Industry Job Profile;
- deployment purpose;
- employed Person or Position;
- Organisation / Organisation Unit derived from employment;
- deployed role title;
- responsibility;
- context;
- scope;
- capacity;
- effectivity.

An internal CBE Discipline Deployment is valid only when:

1. the tenant has declared that profession as an internal capability;
2. the Person currently occupies a Position matching the required CBE Job Profile, or the selected Position itself matches it;
3. the deployment has a valid Governance or Delivery purpose;
4. the context is valid for the deployment.

## External providers

External supplier or consultant fulfilment is not an employee discipline deployment.

A Project may require a profession that the tenant cannot or does not fully supply internally. That demand may be fulfilled by an external Organisation through the supply chain.

```text
Project capability demand
├── Internal supply
│   └── Employee / Position deployment
└── External supply
    └── Supplier / consultant Organisation
```

An external provider can later expose named external personnel and project roles through controlled collaboration, but those people must not be represented as tenant employees.

## Relationship to Services and Projects

Services, Projects, Contracts, Appointments, Work Packages, Sites and Assets provide contexts in which Functional Delivery may occur.

They do not define the underlying professional capability and they do not replace Functional Governance.

A CBE discipline can therefore exist and be governed tenant-wide even when no Project is active, while its employees can simultaneously be deployed into Project delivery roles.

## Relationship to work and Deliverables

Deployment establishes who is carrying which role and why.

Work execution then follows:

```text
Capability
→ Deployment
→ Responsibility
→ Activity / Task / Work Item
→ Work Product / Deliverable
→ Review / Decision / Evidence
→ Issue / Acceptance / Outcome
```

Functional Governance work can also produce governed Deliverables, such as policies, standards, methods, templates, assurance reports and competence records.

Functional Delivery work produces the operational or professional outputs for which the capability exists.

## Invariants

1. Person != Position != Job Profile != Deployment.
2. Deployment purpose belongs to the deployed role.
3. Every governed deployment is either FUNCTIONAL_GOVERNANCE or FUNCTIONAL_DELIVERY.
4. The same employee may hold concurrent Governance and Delivery deployments.
5. The same rule applies to all 29 Core Business Functions and CBE disciplines.
6. Employment does not grant Permission, Responsibility or Authority.
7. Deployment does not itself grant business Authority.
8. A CBE internal deployment must match the employee's active professional Job Profile.
9. External supplier fulfilment is separate from internal employee deployment.
10. Projects and Services are delivery contexts, not definitions of the underlying Function or discipline.


## User-facing workspace model

The Governance/Delivery distinction is visible in the tenant application for both enterprise Functions and CBE professional Domains.

Each capability context exposes:

- **Overview** — scope and capability composition;
- **Governance** — how the Function or Domain is defined, controlled, assured and improved;
- **Delivery** — the work people perform and the operational/professional outputs they produce;
- **Performance** — measures of capability, work, control, outputs and improvement;
- **Records** — governed Information, Deliverables, Change/Configuration, Decisions and Evidence.

The same rule applies to `F01-F29` and `D01-D16`.

Governance is not merely descriptive configuration. Where a governance rule is machine-actionable, Delivery must enforce it. Examples include required templates, classifications, lifecycle states, competence, segregation of duties, review steps, approval Authority and Evidence requirements.

The CBE Domain workspace is the professional user's primary capability context. HCM Position Management is the workforce administration surface that deploys People/Positions into that Domain as Governance or Delivery. Service configuration, capability demand and sourcing are adjacent administrative mechanisms beneath the Domain context; they do not replace it.
