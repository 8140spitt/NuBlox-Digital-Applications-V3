# Canonical Native Tool Implementation Waves

**Status:** Governing dependency-ordered implementation sequence  
**Effective:** 21 September 2026  
**Scope:** 57 canonical native engines derived from the completed market benchmark

## Purpose

These waves convert the canonical capability architecture into executable NuBlox product depth.

They are **not an MVP reduction**. Every engine in the canonical registry remains in scope. The waves only establish dependency order so shared semantics are implemented once and later capability composes them safely.

The authoritative inputs are:

- `11-canonical-capability-and-native-tool-architecture.md`;
- `../decisions/ADR-0006-shared-control-plane-canonical-identities.md`;
- `../reference/windchill-translation-implementation-priority-register.csv`;
- `canonical-native-tool-engine-register.csv`;
- `canonical-l2-native-engine-map.csv`;
- `canonical-activity-capability-map.csv`;
- `canonical-native-tool-implementation-gap-register.csv`.

## Completion rule for every engine

An engine is not complete until all applicable layers are complete:

1. canonical domain objects and invariants;
2. persistence migration and repositories;
3. application services/commands/queries;
4. permissions, responsibility, competence and Authority gates;
5. lifecycle/workflow/Decision/Evidence;
6. complete Function/L2 workspace interaction;
7. My Work composition where work is assignable;
8. native authoring/calculation/transaction experience;
9. reporting/search/integration;
10. automated domain and integration tests;
11. representative end-to-end journey;
12. implementation-gap register updated truthfully.

A backend type or database table alone is not engine completion.

## Wave 0 — Activate the shared platform in the product UI

**Engines:** NTE-001 to NTE-009

Backend foundations exist for these shared engines. The current web application does not yet expose them as a usable operating system.

Deliver:

- authenticated tenant application shell;
- 29 Function workspace navigation;
- Function -> L2 -> work/register/tool navigation;
- canonical object workspace pattern;
- My Work;
- Organisation/Position/Person/Deployment experiences;
- permissions and controlled denial/request-access experience;
- lifecycle/Decision/Evidence panels;
- information/revision/representation panels;
- Change/Configuration/Baseline panels;
- Deliverable/review/issue/acceptance panels;
- audit/history;
- responsive information architecture and consistent interaction patterns.

**Gate:** a user can enter NuBlox and perform shared governed work without dropping to backend-only capability.

## Wave 0A — Close the accepted shared control plane

**Engine slices:** NTE-002, NTE-004, NTE-006, NTE-007, NTE-008, plus shared metadata from NTE-032 and records-governance controls from NTE-043.

The completed Windchill evidence study proved that the earlier backend foundations do not yet implement the full canonical control semantics now accepted by ADR-0006.

Deliver:

- Policy Scope / Policy Definition / inheritance and override provenance;
- Security Classification / Clearance / governed exception;
- Type / Attribute / Constraint / Enumeration definitions;
- Validation Rule Definition / Rule Set / Evaluation / Conflict / Relationship Constraint Policy / Mapping Policy;
- Configuration Resolution Definition / Run and exact resolved-result evidence;
- Exchange Package / Delivery / Received Delivery / Mapping / Authority Adoption;
- Integration Endpoint / Publication Transaction / Acknowledgement / Source Authority;
- Migration Plan / Mapping Version / Run / Conflict / Reconciliation / Cutover;
- Retention Policy / Rule / Hold / Disposition Schedule / Run / Item Result / Archive / Restore / Destruction Evidence — **USER-EXECUTABLE FOUNDATION IMPLEMENTED**.

These capabilities extend existing engines rather than creating duplicate platform engines.

**Gate:** shared policy, configuration selection, exchange, integration, migration and records-governance behaviour is canonical, auditable and reusable before domain engines implement their own variants.

## Wave 1 — Construction information, project and commercial spine

**Engines:** NTE-043, NTE-044, NTE-045, NTE-052, NTE-053, NTE-054, NTE-056

This creates the first complete operational spine for the Construction & Built Environment Industry Solution.

Deliver:

- knowledge/document/records/CDE;
- Portfolio/Programme/Project/WBS/resource core;
- CPM schedules, baselines, progress, project controls, 4D/EVM foundations;
- measurement, take-off, estimating, cost plan and BoQ;
- construction commercial/contract administration;
- site production, daily evidence and progress;
- commissioning, handover and asset-information requirements.

Existing construction-commercial kernel/persistence work becomes part of these engines rather than a standalone technical slice.

**Gate:** a real project can be established, planned, costed, controlled, issued, progressed, commercially administered and handed over through governed NuBlox objects.

## Wave 2 — Native design, engineering and digital asset authoring

**Engines:** NTE-049, NTE-050, NTE-051, NTE-055, NTE-057

Deliver:

- 2D/3D CAD/BIM/model authoring;
- parametric/computational design;
- discipline engineering calculation and simulation;
- survey/GIS/reality capture;
- fabrication/off-site production definition and traceability;
- digital twin and operational asset-information continuity.

These engines must comply with the native-execution invariants. External CAD/BIM/analysis systems may be import/export or migration boundaries, not required runtime dependencies.

**Gate:** representative design and engineering Job Profiles can create, revise, coordinate, review and issue their primary professional work products natively.

## Wave 3 — Procurement, supply, production, field, quality and HSE operations

**Engines:** NTE-020, NTE-021, NTE-022, NTE-023, NTE-024, NTE-025, NTE-039, NTE-040

Deliver:

- supplier/sourcing/procurement — contextual Supplier Relationship / Sourcing Context / Source Approval / Sourcing Rule foundation is user-executable; qualification, RFx, evaluation, negotiation, requisition and Purchase Order remain;
- demand/supply/MRP planning;
- inventory/warehouse/logistics;
- manufacturing/production execution — Process Plan / Operation / Sequence / Resource / Control Characteristic foundation user-executable; Production Order/WIP/execution depth remains;
- service delivery/field operations — Service Order / Assignment / Dispatch / Execution Record / Completion / Acceptance foundation user-executable; route optimisation, mobile/offline execution, SLA automation and billing handoff depth remains;
- service planning/dispatch/field execution;
- quality/inspection/test/CAPA;
- asset/property/facilities/maintenance;
- HSE/permit/environment/ESG.

**Gate:** requirements can flow through sourcing, material/production/service execution, inspection, safe delivery, asset creation and maintenance without disconnected external operational systems.

## Wave 4 — Finance, workforce, legal, risk and privacy

**Engines:** NTE-026, NTE-027, NTE-028, NTE-036, NTE-037, NTE-038

Deliver:

- accounting/ledger/financial close;
- treasury/cash/tax;
- HCM/payroll/talent;
- legal matter/contract/entity;
- enterprise risk/compliance/control/audit;
- privacy/information governance.

**Gate:** commercial and operational work can create authoritative financial, workforce, contractual, compliance and privacy consequences inside NuBlox.

## Wave 5 — Product, market, sales and customer operating chain

**Engines:** NTE-015, NTE-016, NTE-017, NTE-018, NTE-019

Deliver:

- product/service/innovation lifecycle;
- marketing/campaign/brand;
- CRM/account/opportunity — **POSITION-SCOPED USER-EXECUTABLE FOUNDATION IMPLEMENTED**: canonical Sales Account and Opportunity identities, Organisation-backed customer ownership, HCM F07 Functional Delivery Position authority, recursive manager scope, pipeline/weighted forecast, stage/forecast control, optimistic Opportunity updates, audit/outbox evidence, migration 0051, MySQL journey proof and the F07 `/app/function` workspace are implemented; contacts, sales activities, lead conversion, account/relationship plans, territory/quota management and broader forecasting remain to build;
- pricing/CPQ/bid/sales order;
- customer service/case/success.

**Gate:** NuBlox supports an end-to-end market-to-cash/customer-service chain using shared product, customer, commercial and delivery truth.

## Wave 6 — Strategy, governance, performance, transformation and process

**Engines:** NTE-011, NTE-012, NTE-013, NTE-014, NTE-046, NTE-047, NTE-048

Deliver:

- strategy/scenario/enterprise planning;
- meeting/collaboration plus board/committee governance;
- EPM/KPI/benefits;
- M&A/corporate development;
- transformation/change/adoption;
- process architecture/BPMN/DMN/orchestration;
- process mining/continuous improvement.

**Gate:** the enterprise can govern, plan, transform, measure and improve itself using the same authoritative execution evidence generated by the operating engines.

## Wave 7 — Digital platform, data, AI, security, resilience and communications

**Engines:** NTE-010, NTE-029, NTE-030, NTE-031, NTE-032, NTE-033, NTE-034, NTE-035, NTE-041, NTE-042

Deliver:

- enterprise search/knowledge retrieval;
- IT service/configuration management;
- DevOps/platform/endpoint operations;
- data integration/engineering/lakehouse;
- MDM/catalogue/governance;
- BI/semantic analytics/reporting;
- AI/ML/agents/model governance;
- cybersecurity operations/exposure;
- continuity/crisis/physical security;
- communications/media/public affairs/investor relations.

**Gate:** the platform can operate and assure its own digital/data/security estate while providing enterprise-wide search, analytics, AI, resilience and communications.

## Wave execution unit

Within each wave the implementation unit is:

~~~text
Canonical Engine
-> mapped Functions
-> mapped L2 Sub-functions
-> mapped canonical Activity Capabilities
-> canonical objects / aggregates
-> commands / calculations / authoring operations
-> persistence migration
-> workspace / My Work UX
-> lifecycle / Authority / Evidence
-> tests
-> end-to-end journey
~~~

Implementation must not start from screen mock-ups and work backwards into arbitrary local data models.

## Progress accounting

Progress is reported against all three levels:

- **Engine coverage:** 57 canonical native engines;
- **L2 coverage:** 353 governed L2 Sub-functions;
- **Activity coverage:** 1,510 canonical Activity Capabilities.

A wave is closed only when its mapped activities are executable and tested, not when the engine shell exists.

## Current baseline

As of 24 September 2026:

- 58 canonical engines defined;
- 353 / 353 L2 Sub-functions mapped to native engines;
- 1,510 / 1,510 Activities assigned canonical capability IDs;
- 5 shared engines retain aligned backend foundations but still require full product UI exposure;
- 4 shared engines (NTE-002, NTE-006, NTE-007, NTE-008) are now correctly classified as partial because ADR-0006 adds evidence-backed canonical control semantics not yet implemented;
- 4 domain engines have partial implementation and require completion;
- 41 engines remain `TO_BUILD`; NTE-017, NTE-020, NTE-023, NTE-024, NTE-043 and NTE-054 have advanced to `PARTIAL` because position-scoped Sales CRM, contextual supplier sourcing, manufacturing process definition, service delivery/field execution, records-retention and construction site-production slices are now user-executable, while broader CRM/contact/activity planning, procurement, production execution, field-service optimisation, knowledge/CDE, labour/plant/material site transactions, permits and quality handoffs remain incomplete;
- Wave 0 is **ACTIVE**: the tenant application shell, authenticated tenant/Person session boundary, 29 Function navigation, live My Work, Organisation/Person/Position administration, governed access request/review/administration, HCM Position/Deployment administration and competence administration are implemented;
- the shared Lifecycle/Decision/Evidence control workspace is now exposed as a tenant-scoped read surface with separately permissioned audit history;
- Information/Revision/Representation is now user-executable for governed container, revision, iteration, Representation, release and issue control with dedicated permissions and Authority-backed release Decisions; managed binary/content storage and broader CDE composition remain incomplete;
- Records retention/disposition is now user-executable through versioned Retention Policy/Rule, Hold, Schedule, Run/Item Result, Archive Record, Restore Run and Destruction Evidence with Decision-backed irreversible actions; automated candidate evaluation, schedulers and physical archive/delete/restore adapters remain hardening work;
- Contextual supplier sourcing is now user-executable through canonical Supplier Relationship, Sourcing Context, Decision-backed effective-dated Source Approval and governed Sourcing Rule; broader supplier qualification, sourcing-event/RFx, requisition and Purchase Order execution remains Wave 3 work;
- Change/Configuration/Baseline is now exposed through a tenant-scoped read projection and lifecycle-aware command surface covering Change assessment, affected objects, impact, Decision application, implementation, verification, discrepancy, closure, Configuration Items, Baselines and Effectivity; commitment Decisions are permission-gated and require an effective Authority Grant;
- control mutation workflows, Deliverable/Issue/Acceptance, deeper Change/Control composition and remaining audit/history composition are still incomplete.

Wave 0 remains open until the shared platform can be operated end-to-end through the product UI. Wave 0A is also active as a dependency gate introduced by ADR-0006; Wave 1 domain implementation must consume these shared controls rather than create local substitutes.
