# Canonical Aggregate-Boundary Freeze

**Status:** frozen  
**Date:** 18 September 2026  
**Architecture gate:** Gate 4

The machine-readable authority is:

`app/src/lib/data/canonical-aggregate-boundary-register.ts`

The freeze converts NuBlox's governed semantic model into explicit **logical consistency/write boundaries** before physical database, API or service design.

It does **not** mandate one database table, one API, one microservice or one UI screen per aggregate.

## Freeze result

- **29/29** canonical business-object families covered;
- **100** explicit logical aggregate boundaries;
- **100/100** boundaries frozen;
- **79/79** benchmark-driven refinement constructs assigned to one frozen owning aggregate;
- no duplicated aggregate root IDs;
- no governed owned member appears under two aggregates;
- no read projection is simultaneously treated as a root or owned write model;
- one-aggregate command transactions are the default rule.

## Core transaction rule

A command may atomically change **one aggregate boundary**.

Cross-aggregate outcomes are coordinated through:

- domain/business events;
- outbox messages;
- workflow/process managers;
- explicit follow-up commands;
- effective relationships;
- immutable Decision/Approval evidence where authority is required.

A screen may edit several concepts during one user journey, but that does not turn them into one aggregate.

## Shared-root rules

Several identities are deliberately reused across many workspaces and are never recreated locally:

- Tenant;
- Party / Person / Organisation / Legal Entity;
- Organisation Unit;
- Project;
- Site / Property / Space / Network;
- Contract;
- Information Container;
- Item;
- System / Asset;
- Worker Relationship / Position;
- Ledger and financial reference identities;
- Enterprise Risk / Control;
- shared Decision / Evidence / Reference Data.

A workspace's ability to act on one of these objects does not make the workspace its owner.

## Key frozen boundaries

### Identity and authority

```text
Tenant
Party ── Person / Organisation / Legal Entity
Organisation Unit
Delegated Authority
Master Data Stewardship Case
```

Master-data merge decisions preserve redirect/provenance. Role, responsibility, permission and delegated authority remain separate.

### Project and project controls

```text
Project
WBS Element
Schedule
  ├─ Activity
  ├─ Milestone
  ├─ Baseline
  ├─ Calendar
  └─ Calculation Run
       └─ read-only Schedule Analysis Snapshot

Project Controls Calculation
  ├─ progress-measurement method
  ├─ quantitative risk simulation
  └─ read-only performance / risk snapshots
```

WBS, Cost Code, Asset hierarchy and Contract Value Schedule are not one universal hierarchy.

### Controlled information and engineering

```text
Information Container
  ├─ Revision / Iteration
  └─ Representation

Information Requirement / Deliverable / Delivery Plan
Requirement Set
  └─ Product Requirement
Engineering System Model
  └─ Engineering Model Element
Design Change
```

Files, folders, CDE paths, IFC entities and BCF topics never replace canonical information or engineering identity.

### Contract and procurement

```text
Contract
  ├─ Party Roles
  ├─ Clauses / Obligations / Key Dates
  └─ Contract Value Schedule / Lines

Commercial Change
  └─ Change Quotation

Commercial Share Assessment
  ├─ Target Cost Baseline
  └─ Share Mechanism

Sourcing Event
  ├─ Request / Response
  ├─ Evaluation
  └─ Award

Purchase Order
  └─ Call-off
```

Contract, Change, Claim, Notice, valuation/payment and dispute remain separate legal/commercial records.

### Item, configuration, inventory and logistics

```text
Item
Product Configuration Model
  ├─ Characteristics
  ├─ Rules
  ├─ Effectivity
  └─ structure occurrences
       └─ read-only Configuration Baseline

Product Configuration

Warehouse
Inventory Movement
  └─ read-only Stock Position

Shipment
  ├─ Handling Units
  ├─ Warehouse Wave
  ├─ Yard/Dock Appointment
  ├─ Freight Tender
  └─ Freight Settlement

Demand Plan
  ├─ Supply Plan
  └─ Planning Exception
```

Item/BOM/configuration, inventory stock, shipment and installed Asset identity remain distinct.

### Built environment, assets and operations

```text
Asset
System
Network
  ├─ Terminal
  ├─ Connectivity
  ├─ Linear Location
  ├─ Trace Configuration
  └─ Trace Run
       └─ read-only Trace Result

Asset Investment Plan
  └─ Intervention Option
       └─ read-only Investment Appraisal

Digital Twin Federation Context
  └─ Data Bindings
       └─ read-only Twin State Snapshot
```

The digital twin is a federation over canonical Asset/System truth, never a second asset register.

### Maintenance and service

```text
Maintenance Plan
  └─ Task Template

Work Order

Service Case
  └─ Service Appointment

Reliability Strategy
  ├─ Failure Mode
  ├─ Criticality Assessment
  └─ read-only Asset Health Position

Workplace Reservation
```

Work Order is operational work, not workflow work or a Project Schedule Activity.

### HCM

```text
Worker Relationship
Position
Training Course / Session
Payroll Run / Result
Succession Plan / Talent context
Business Trip / Travel Request / Booking Evidence
```

Person identity, employment/engagement, position, role/permission and talent context remain separate.

### Finance

```text
Ledger
  └─ Ledger Entry

Supplier Invoice
Customer Invoice

Treasury Deal
  ├─ Hedge Relationship
  ├─ Cash Pool
  └─ read-only exposure / market / cash positions

Lease Accounting Record
  └─ Lease Valuation
       └─ read-only Lease Accounting Schedule

Construction WIP Calculation Run
  └─ Financial Recognition Policy
       └─ read-only WIP Position
```

Billing, WIP/revenue recognition, project CVR and ledger posting remain separate authority layers.

### Risk, assurance and legal

```text
Enterprise Risk
Internal Control
Audit Engagement
Legal Matter
Processing Activity
Corporate Office Appointment
Continuity Plan
Crisis
```

Specialist risk types reuse Enterprise Risk. Corporate statutory office is not generic Role Assignment.

### Technology, data and workflow

```text
Technology Service
Data Product / Dataset
Cybersecurity Incident
AI Use Case / AI Model
Data Migration Project
Workflow Instance / Work Item
Decision
Evidence Item
Retention Disposition Decision
```

Workflow may coordinate domain commands but may not own another aggregate's domain state.

## Read-model / projection rule

The following are examples of **read-only projections or published snapshots**, not command targets:

- Stock Position;
- Pipeline / Forecast snapshots;
- Schedule Analysis Snapshot;
- Project Controls Performance Snapshot;
- Project Risk Analysis Snapshot;
- Asset Health Position;
- Asset Investment Appraisal;
- Digital Twin State Snapshot;
- Service History;
- Treasury Exposure / Cash Position;
- Lease Accounting Schedule;
- Construction WIP Position;
- Corporate Entity Register Snapshot.

A projection may be rebuilt. If published for evidence, its source versions and calculation basis are pinned.

## Physical implementation consequence

The freeze authorises the next design activity: mapping every L2/L3 business activity to:

- canonical object/aggregate;
- command or query;
- create/read/change authority;
- required Decision/Approval;
- source and resulting business events;
- evidence/retention requirements;
- cross-aggregate handoff.

It does **not yet authorise broad physical schema/API implementation**. That approval follows completion of the L2/L3 object/action mapping.

## Change control

After this freeze, changing an aggregate boundary is an architecture change.

Any proposal to:

- move a child between aggregates;
- make a projection writable;
- merge two aggregate roots;
- split one root;
- introduce cross-aggregate atomic write requirements;
- create a workspace-local duplicate master;

must update the boundary register, tests and architecture rationale before implementation.
