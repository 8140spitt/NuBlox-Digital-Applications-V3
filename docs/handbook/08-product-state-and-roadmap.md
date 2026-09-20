# 08 — Product State & Roadmap

**Purpose:** separate target product design from current delivered runtime.

## Product-design state

The target product architecture is now broad enough to guide implementation.

The governed design baseline includes:

- 29 enterprise functions/workspaces;
- 353 L2 sub-functions;
- 1,510 mapped source activities;
- reconciled employment/job architecture;
- 462 candidate employment jobs with candidate Work-Product treatment;
- 2,415 candidate/explicit Work Products;
- canonical business-object/aggregate architecture;
- shared authority, workflow, evidence and interaction principles;
- external enterprise/construction/PLM/EAM benchmark evidence.

These are **design/coverage assets**, not proof that every capability is implemented.

## Current runtime footprint

The repository currently contains a material foundation and early enterprise runtime, including:

### Platform

- tenant persistence/context;
- authentication;
- tenant membership and permissions;
- delegated-authority foundations;
- Party / Person / Organisation foundations;
- organisation structure;
- shared work runtime;
- authorised decision runtime;
- governed evidence;
- business events and transactional outbox;
- classifications;
- lifecycle configuration;
- authority configuration;
- reference data/history;
- permission access requests;
- work contexts;
- work drafts/edit leases;
- personal navigation state;
- object resolver/search foundations.

### Enterprise application shell

Runtime entry points exist for:

- tenant Home;
- Operate;
- Deliver;
- Enterprise Data;
- Function directory;
- My Work;
- Search;
- canonical object routing;
- master/reference/security administration.

### Function runtime currently represented in application routes

The strongest implemented functional breadth is currently F01-F06:

- F01 Strategy & Enterprise Planning;
- F02 Corporate Governance;
- F03 Enterprise Performance;
- F04 Corporate Development;
- F05 Product, Service & Innovation;
- F06 Marketing & Brand.

This includes multiple persisted functional slices and corresponding server runtimes.

## What is not yet safe to claim

The existence of the 29-function model and 462-job Work-Product catalogue does **not** mean that:

- all 29 function workspaces are fully executable;
- every Work Product has a finished authoring experience;
- all 462 jobs have validated Job Workbenches;
- every canonical object has physical persistence/API/runtime;
- complete construction delivery from lead to asset operations is implemented;
- all integrations/mobile/offline/viewer/map capabilities are implemented.

## Implementation direction

The programme should now optimise for **visible end-to-end software**, not further horizontal documentation expansion.

### Priority 1 — shared enterprise interaction/runtime

Finish and harden:

- stable application shell;
- enterprise context;
- My Work;
- Job Workbench;
- canonical object workspace;
- Enterprise Grid;
- Structure Browser;
- controlled information;
- decision/approval;
- case/assessment;
- inspection/test;
- change;
- calculation/model;
- evidence/history/relationships;
- denied/conflict/error states.

### Priority 2 — prove the delivery chain

Build coherent vertical business journeys:

```text
Lead
 -> Opportunity
 -> Estimate / Proposal
 -> Contract
 -> Project
 -> Procurement
 -> Field / Construction execution
 -> Commercial / Cost / Change
 -> Commissioning / Handover
 -> Asset / Maintenance / Service
```

Each slice must include:

- canonical data;
- commands/lifecycle;
- authority;
- workflow;
- audit/evidence;
- UI;
- integration boundary;
- automated acceptance.

### Priority 3 — job-level acceptance

Use representative jobs to prove the platform:

- Project Manager;
- Quantity Surveyor;
- Estimator;
- Design Manager;
- Procurement Manager / Buyer;
- Site Manager;
- Safety Inspector;
- Project Accountant;
- Asset Manager;
- Maintenance Planner / Technician.

The acceptance question is always:

> Can this Position-holder complete realistic end-to-end work in NuBlox without leaving broken handoffs or duplicated business truth?

## Documentation rule from this point

A new analysis document should only be created when it records a genuinely new decision or evidence set.

Normal implementation should update:

- the Product Handbook if product meaning changes;
- an ADR if an architectural decision changes;
- user/admin documentation when behaviour changes;
- tests and API specifications as executable documentation.

The discovery-wave pattern is closed as the default way of progressing the product.
