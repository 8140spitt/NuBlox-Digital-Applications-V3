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

## Implementation status interpretation

Phase labels below describe the architecture/kernel delivery sequence. An `IMPLEMENTED` phase means the required backend/domain/persistence foundation exists at the phase level; it does **not** by itself mean that every capability is exposed as a complete end-user workspace.

User-executable truth is governed by:

- [Canonical Native Tool Implementation Gap Register](../architecture/canonical-native-tool-implementation-gap-register.csv); and
- [Canonical Native Tool Implementation Waves](canonical-native-tool-implementation-waves.md).

Wave 0 product-UI activation is active. The tenant shell, secure application session boundary, 29 Function navigation, live My Work, Organisation/Person/Position administration, governed access request/review/administration, HCM Position/Deployment administration, competence administration, a permission-gated Lifecycle/Decision/Evidence read workspace, and a governed Information/Revision/Representation workspace are implemented. Information release is bound to the exact canonical object/revision and requires an effective Authority-backed Decision. Managed content storage, control mutation workflows and Deliverable/Issue/Acceptance are still required before the shared platform is end-to-end user-operable. Change/Configuration/Baseline now has a governed tenant workspace with lifecycle-aware commands from Change assessment through implementation/verification/closure, plus Configuration Item, Baseline and Effectivity control; Change approval and Baseline establishment require effective Authority-backed Decisions. The completed PTC evidence pass has since exposed additional shared-control gaps accepted by ADR-0006, so the relevant shared engines are now correctly treated as partial until P1.8 is implemented.

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

### P1.6 Change Runtime — IMPLEMENTED

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

### P1.7 Platform Events & Portability — IMPLEMENTED

Implement:

- transactional outbox;
- durable integration/export jobs;
- idempotency keys;
- canonical import/export envelope;
- external source/provenance identity;
- migration reconciliation;
- search/index projection contracts.

### P1.8 Shared Control Plane Expansion — CURRENT

ADR-0006 reopens a controlled part of Phase 1 because the completed Windchill evidence study proved additional cross-platform canonical controls are required.

Implement in dependency order:

- Policy Scope / Policy Definition / Policy Assignment — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: kernel identities/invariants, deterministic inherited-policy resolution, migration 0027, tenant-bound persistence, audit/outbox, permission-gated command/read services, MySQL integration test and `/app/policy` administration workspace; integration into security/access policy evaluation continues;
- Security Classification / Clearance / Security Access Exception — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: kernel identities/factories, migration 0028, tenant-bound persistence, permission-gated command/read services, integration tests, registry entries and `/app/security-classification` administration workspace; enforcement is being propagated through all governed information/exchange paths;
- Type / Attribute / Constraint / Enumeration definitions — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: canonical kernel identities/invariants, same-family type inheritance, migration 0031, tenant-bound persistence with audit/outbox, read/manage permissions, effective inherited-attribute resolution, kernel/MySQL integration tests and `/app/metadata` administration workspace; downstream object-creation/template/creation-policy/domain adoption continues;
- Validation Rule Definition / Rule Set / Relationship Constraint Policy / Mapping Policy — **USER-EXECUTABLE EXECUTION FOUNDATION IMPLEMENTED**: kernel identities/invariants, migration 0029 canonical evaluation/conflict schema, migration 0030 execution/disposition permissions, deterministic handler registry, persisted Evaluation Runs/Results, material Conflict creation, resolve/waive/cancel disposition with audit/outbox, permission-gated manual execution, `/app/validation-policy` evaluation/conflict evidence and disposition UX, plus enforced gates on Information Release and Change Close; generic Lifecycle and remaining domain-command adoption continues;
- Configuration Resolution Definition / Criterion / Run / Result — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: canonical kernel identities/invariants, migration 0032, separate read/manage/execute permissions, tenant-bound audit/outbox persistence, ordered deterministic Baseline/Explicit Version/Effectivity/Latest Established Baseline selection, exact per-item result evidence with retained conflict/unresolved outcomes, kernel/MySQL integration tests and `/app/configuration-resolution` administration/execution workspace; downstream structure/domain command adoption continues;
- Exchange Package / Delivery / Received Delivery / Mapping / Authority Adoption — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: immutable governed package snapshots and exact items, full/incremental delivery and delta evidence, recipient-specific receipt/validation/mapping/import/rejection, explicit separation from Transmittal acceptance, Decision-backed authority adoption, migration 0033, separate read/manage/receive/adopt permissions, audit/outbox, kernel/MySQL integration tests and `/app/exchange` two-sided sender/recipient workspace; automated endpoint/publication orchestration continues under the integration slice;
- Integration Endpoint / Publication Transaction / Acknowledgement / Source Authority — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: governed outbound/bidirectional endpoints, exact checksum-backed outbound envelopes, explicit source-authority rules, idempotent Publication Transactions, ordered object Activities, endpoint×subject active-publication guard, retryable transport Attempts, separately correlated Acknowledgements and downstream Business Results, business resubmission lineage, audit/outbox evidence, migration 0034, kernel/MySQL tests and `/app/integration` administration/execution workspace; production transport adapters, callback automation, credential/signature hardening and endpoint-specific mapping orchestration continue as integration hardening;
- Migration Plan / Mapping Version / Run / Item Result / Conflict / Cutover — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**: governed scope-backed Plans, authority-backed approval, immutable checksum-backed Mapping Versions, dry-run/rehearsal/production Runs, exact IMPORT envelope and External Identity provenance, deterministic source-identity keys, per-item outcomes and hashes, explicit blocking/warning Conflicts, Decision-backed Dispositions, checkpointed Reconciliation Runs, production concurrency/race controls, VERIFIED reconciliation gate, Decision-backed Cutover and explicit NuBlox Source Authority Rule establishment, migration 0035, kernel/MySQL tests and `/app/migration` workspace; high-volume/resumable connector workers and source-specific migration packs continue as hardening;
- Retention Policy / Hold / Disposition / Archive / Restore / Destruction Evidence.

This work extends NTE-002, NTE-006, NTE-007, NTE-008 and shared portions of NTE-032/NTE-043. It must not introduce parallel domain-specific policy, exchange, migration or retention frameworks.

## Phase 2 — Functional Framework & Deployment — IMPLEMENTED

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

## Phase 3 — Native Work-Delivery Runtime — IMPLEMENTED

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

## Phase 4 — Construction & Built Environment — CURRENT

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
