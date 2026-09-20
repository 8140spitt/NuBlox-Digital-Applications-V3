# 02 — Functional Governance, Delivery & Deployment

## Purpose

NuBlox must do more than list enterprise functions and construction jobs.

For every area of enterprise capability, NuBlox must define:

1. **Functional Governance** — how the capability is controlled;
2. **Functional Delivery** — how the capability performs work and produces outcomes;
3. **Functional Deployment** — how that capability is assigned into the real organisation, project, contract, site, asset or service.

This is the bridge between the 29 enterprise functional areas and the 84 identified Construction & Built Environment jobs.

## Two complementary structures

NuBlox uses two business structures.

### Enterprise Functional Areas — F01-F29

These define everything required to operate a sophisticated enterprise: strategy, governance, finance, people, procurement, quality, HSE, technology, legal, risk, assets, project management and the other enterprise responsibilities.

### Construction & Built Environment Delivery Domains

The 84 sector jobs group naturally into 16 delivery domains such as Architecture & Design, Engineering & Technical Design, Commercial/Contracts/Cost, Building Trades, Building Services Trades, Site Delivery, Surveying, Utilities and Asset Operations.

See the [84 Construction Jobs](construction-jobs/README.md).

The structures intersect. A job is not forced into one enterprise function.

An Architect works in the Architecture & Design delivery domain while interacting with F27 Project Management, F13 Quality, F23 HSE, F26 Information Management and other enterprise functions.

A Quantity Surveyor works in Commercial/Contracts/Cost while interacting with F07 Commercial, F14 Finance, F19 Legal, F27 Project Management and F09 Procurement.

## Functional Governance

Functional Governance answers:

> **How must this capability be controlled so that the organisation can rely on the work it produces?**

Each governed function/domain should define:

- purpose and scope;
- Functional Owner;
- included/contributing Job Profiles;
- policies, standards and contractual/regulatory requirements;
- process architecture;
- controlled business-object and deliverable types;
- naming, numbering and classification rules;
- approved templates and methods;
- lifecycle/status models;
- baseline/configuration rules where applicable;
- change-control rules;
- impact-assessment requirements;
- decision and approval authorities;
- delegated-authority thresholds;
- segregation-of-duties controls;
- competence and qualification requirements;
- required evidence;
- KPIs/KRIs and control measures;
- assurance, verification and audit requirements;
- discrepancy/non-conformance management;
- retention and record requirements.

### Controlled functional change

A governed functional definition must itself be controlled.

The reusable pattern is:

```text
Identify controlled capability
 -> establish approved baseline
 -> propose change
 -> assess multidisciplinary impact
 -> obtain authorised decision
 -> implement / embody change
 -> update status and affected records
 -> verify implementation
 -> resolve discrepancies
 -> establish new approved baseline
```

This pattern is intentionally reusable across design standards, commercial procedures, HSE methods, asset maintenance regimes, procurement rules, finance controls and other enterprise capabilities.

## Functional Delivery

Functional Delivery answers:

> **What does this capability actually do, and what does it produce?**

For each function/domain, NuBlox defines:

- services/outcomes provided by the function;
- business processes;
- process stages;
- activities and tasks;
- participating Job Profiles;
- responsibilities and handoffs;
- business objects operated on;
- required Deliverable Items and Managed Outputs;
- transactions;
- calculations/models;
- reviews and approvals;
- decisions;
- inspections/tests;
- exceptions and corrective actions;
- reports and KPIs;
- downstream consequences.

The delivery chain is therefore:

```text
Function / Delivery Domain
 -> Job
 -> Responsibility
 -> Process
 -> Activity
 -> Task
 -> Managed Output / Transaction / Decision
 -> Review / Approval
 -> Handoff
 -> Outcome
```

A job is included because the function genuinely needs that job to perform one or more responsibilities—not because the title appears in a static directory.

## Functional Deployment

Functional Deployment answers:

> **Who is actually performing this capability, where, for what business context, with what competence, capacity and authority?**

A deployment binds the governed capability to runtime enterprise context.

```text
Governed Function / Delivery Domain
 -> required Job Profile / capability
 -> Organisation Unit / delivery organisation
 -> Position
 -> Person
 -> Project / Contract / Package / Site / Asset
 -> responsibility scope
 -> competence / qualification
 -> permission and authority
 -> resource / tooling
 -> effective dates
 -> capacity / workload
 -> assignments
 -> required deliverables / tasks
```

Deployment must support internal employees and external organisations such as designers, consultants, contractors, subcontractors, suppliers and operators.

## Deployment is not employment

A Job Profile defines a reusable job.

A Position is an organisational seat.

A Person occupies a Position.

A **Functional Deployment** states where that capability is being applied.

Examples:

- an Architect deployed as Lead Architect for Project Alpha, RIBA stages 3-5, responsible for architectural deliverables;
- a Quantity Surveyor deployed to Contract ABC and work packages 01-12 with defined commercial authority;
- an Electrician deployed to Site Alpha, Building B, Levels 2-4 with required competence and current work orders;
- a Building Control Officer deployed to an application/inspection jurisdiction;
- a Facilities Manager deployed to a property/asset portfolio.

## Job-to-function relationship

NuBlox should allow a Job Profile to participate in multiple functions/domains using an explicit relationship such as:

- **PRIMARY** — core professional/trade home;
- **DELIVERY** — performs delivery work for the function;
- **GOVERNANCE** — establishes or maintains functional rules/standards;
- **ASSURANCE** — reviews, verifies, audits or accepts work;
- **SUPPORT** — provides specialist supporting capability.

This avoids false one-job/one-function ownership.

## Governed deployment lifecycle

Functional Deployment itself requires lifecycle control:

```text
Capability need
 -> define deployment requirement
 -> select organisation / Position / Person
 -> validate competence and availability
 -> validate permissions / authority
 -> approve deployment
 -> activate
 -> assign work and deliverables
 -> monitor performance / workload / compliance
 -> change / substitute / delegate
 -> demobilise
 -> preserve deployment and evidence history
```

## Competence

The CMii source material reinforces an important principle: attendance or job title does not prove competence.

NuBlox should distinguish, where the tenant requires it:

- Awareness;
- Knowledge;
- Practitioner under supervision;
- Competent / independently authorised.

Competence evidence can include training, qualification, assessment, supervised workplace evidence, expiry/revalidation and assessor sign-off.

## Runtime objects implied by this model

The eventual platform needs reusable concepts such as:

- Functional Definition;
- Functional Baseline;
- Functional Change;
- Delivery Domain;
- Job Profile;
- Job-to-Function Relationship;
- Competence Requirement;
- Competence Evidence;
- Deployment Requirement;
- Functional Deployment;
- Deployment Assignment;
- Responsibility Scope;
- Deliverable Requirement;
- Deliverable Item;
- Authority Assignment;
- Verification / Assurance Record.

These must reuse the existing Party, Position, authority, workflow, evidence, lifecycle and audit foundations rather than recreate them.

## Product acceptance test

For every enterprise function and every sector delivery domain, NuBlox must be able to answer:

- What is this capability responsible for?
- Which of the 84 construction jobs participate?
- How is the capability governed?
- What processes and outputs does it deliver?
- What competence and authority are required?
- Where has the capability been deployed?
- Which organisations, Positions and people currently perform it?
- What work and deliverables are assigned?
- Is the deployment competent, authorised and adequately resourced?
- What is the current performance/status?
- What changed, who authorised it and what evidence proves implementation?
