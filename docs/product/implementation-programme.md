# NuBlox Implementation Programme

**Status:** Governing delivery sequence  
**Effective:** 20 September 2026

This programme turns the frozen NuBlox architecture into implementation order. It is not an MVP plan. The purpose is to build the complete platform in dependency order so later functional and industry capability sits on stable shared foundations.

## Delivery rule

Every implementation slice must:

1. map to the governing architecture;
2. preserve all Architecture Invariants;
3. add or extend canonical kernel semantics rather than create local duplicates;
4. include persistence migrations where authoritative state is introduced;
5. enforce tenant boundaries server-side;
6. preserve immutable Decision/Evidence history where required;
7. include automated tests for material invariants;
8. update the Product Roadmap truthfully;
9. leave `main` buildable with no residual branch or pull request.

## Phase 1 — Enterprise Kernel

### P1.1 Identity, Organisation & Authority — IMPLEMENTED

Current foundation:

- Tenant;
- Party;
- Person;
- Organisation;
- Organisation Unit;
- Job Profile;
- Position;
- Position Occupancy;
- Authority Definition;
- Authority Grant;
- Delegation;
- canonical object identity;
- canonical relationships;
- tenant-bound persistence;
- kernel audit evidence;
- migration runner and schema status;
- unit and MySQL integration tests.

### P1.2 Control Spine — IMPLEMENTED

Implement:

- Lifecycle Definition;
- Lifecycle State Definition;
- Lifecycle Transition Definition;
- current canonical-object Lifecycle state;
- immutable Lifecycle state history;
- immutable Decision;
- exact subject-version Decision linkage;
- Business Event;
- Evidence Record;
- optimistic transition control;
- audit attribution.

This slice establishes the control semantics required by Workflow, Deliverables, Change and Configuration.

### P1.3 Access, Scope & Permission Runtime — IMPLEMENTED

Implement:

- Permission Definition;
- Access Role Definition;
- Access Role to Permission relationship;
- scoped Access Role Assignment;
- Person / Position / Organisation Unit principals;
- effective dates;
- tenant/data/resource scope;
- permission evaluation;
- controlled ALLOW / DENY result with reason;
- access-request hook without turning denial into a server failure;
- audit evidence for permission-changing commands.

This remains separate from Responsibility and Authority. A user may have permission to perform an action yet still lack the delegated Authority required to approve or commit it.

### P1.4 Workflow & Work Runtime — IMPLEMENTED

Implement:

- Workflow Definition/version;
- Workflow Instance;
- Work Item;
- Assignment;
- responsibility roles;
- queues;
- due dates;
- escalation;
- completion evidence;
- My Work projection;
- controlled permission-denied/business-blocked outcomes.

### P1.5 Information & Configuration Kernel — IMPLEMENTED

Implement:

- Information Container;
- Revision;
- Iteration/working state where required;
- Representation;
- issue/release;
- supersession;
- Configuration Item;
- Baseline;
- Effectivity;
- configuration status accounting.

### P1.6 Change Runtime — CURRENT

Implement:

- Change Request / Proposal;
- affected-object set;
- impact assessment;
- authorised Decision;
- implementation actions;
- verification;
- discrepancy;
- closure;
- resulting Baseline/configuration update.

### P1.7 Platform Events & Portability

Implement:

- transactional outbox;
- durable integration/export jobs;
- idempotency keys;
- canonical import/export envelope;
- external source/provenance identity;
- migration reconciliation;
- search/index projection contracts.

## Phase 2 — Functional Framework & Deployment

Implement:

- all 29 Function definitions;
- L2 sub-functions;
- process/activity/task definitions;
- Function governance versions;
- Function-to-Job Profile relationships;
- competence requirements/evidence;
- Functional Deployment;
- Deployment Assignment;
- Responsibility Scope;
- capacity/availability;
- deployment gates;
- authority/competence evaluation.

## Phase 3 — Native Work-Delivery Runtime

Implement:

- Deliverable Requirement;
- Deliverable Item;
- participants/responsibilities;
- native authoring framework;
- review;
- Decision/approval;
- issue/transmittal;
- recipient response;
- Acceptance;
- governed rework;
- downstream consequence hooks;
- complete My Work composition.

## Phase 4 — Construction & Built Environment

Implement:

- 16 Delivery Domains;
- 84 Job Profiles;
- sector classifications;
- Project/Contract/Package/Site/System/Asset semantics;
- Construction-specific work-product types;
- design and technical authoring;
- commercial/cost work;
- planning;
- procurement;
- production/fabrication;
- field/site execution;
- quality/HSE;
- commissioning/handover;
- operations/maintenance;
- representative end-to-end job journeys.

## Phase 5 — Functional Depth Across F01-F29

For every Function:

- governance;
- native tools;
- transactions;
- analysis;
- Decisions;
- specialist Work;
- managed outputs;
- exceptions;
- KPIs;
- assurance;
- cross-functional handoffs;
- complete user experience.

Completion is assessed against executable business outcomes, not screen count.

## Phase 6 — Migration & Product Portability

Implement governed source mappings for benchmark/incumbent platforms while keeping NuBlox runtime-independent:

- source identity;
- revision/version semantics;
- Lifecycle;
- relationships;
- content/Representations;
- Change;
- Baseline/Configuration/Effectivity;
- provenance;
- validation/reconciliation;
- controlled cutover;
- open export.

## Definition of complete

NuBlox is complete when the supported enterprise can:

- govern all required capability;
- operate all 29 Functions;
- deploy people/organisations into real contexts;
- allow each supported Job Profile to perform its work natively;
- create/control all required business objects and work products;
- preserve exact-version review/Decision/approval/issue/Acceptance;
- control Change and Configuration;
- maintain commercial/financial/project/Asset continuity;
- reconstruct authoritative history and Evidence;
- migrate in/out without making another product a runtime dependency.
