# 01 — NuBlox Product Architecture

**Status:** Governing product architecture  
**Effective:** 20 September 2026

## Product definition

NuBlox is a configurable **Enterprise Operating Platform**.

NuBlox is the product and the operating environment. Construction & Built Environment is an Industry Solution. External ERP, PLM, CDE, BIM, EAM, PPM, ITSM, CRM and HCM products are benchmarks or migration/import/export sources and targets only; they are not runtime dependencies and do not perform work on behalf of NuBlox.

NuBlox must support three inseparable enterprise concerns:

1. **How the organisation operates** — governance, functions, processes, people, authority, finance, risk, data and corporate services.
2. **How the organisation delivers value** — programmes, projects, contracts, products, services, work packages, sites, systems, assets and operational delivery.
3. **What the organisation produces** — controlled business objects, technical information, transactions, physical outcomes, Deliverable Items, Decisions, evidence and records.

## Product layers

~~~text
NuBlox Enterprise Operating Platform
|
+-- Enterprise Kernel
|   +-- canonical object graph
|   +-- identity, organisation and authority
|   +-- workflow, lifecycle, change and baselines
|   +-- information, records and representations
|   +-- Decisions, events, evidence and audit
|
+-- Functional Domains
|   +-- 29 governed enterprise functions
|   +-- native domain tools and workspaces
|   +-- shared cross-domain processes
|
+-- Native Work-Delivery Runtime
|   +-- deployments and assignments
|   +-- work and Deliverable Items
|   +-- review, Decision and approval
|   +-- issue, acceptance, verification and rework
|   +-- evidence and controlled records
|
+-- Industry Solutions
    +-- Construction & Built Environment
        +-- 16 delivery domains
        +-- 84 Job Profiles
        +-- projects, contracts, packages, sites, systems and assets
~~~

## Enterprise Kernel

The Enterprise Kernel owns the shared identities, relationships and control mechanisms used by every function and Industry Solution.

The kernel prevents each function from reinventing Person, Organisation, Project, Workflow, Decision, Change, Baseline, Deliverable, Audit or other enterprise concepts.

See [02 — Enterprise Platform Kernel](02-enterprise-platform-kernel.md).

## Functional Domains

The 29 enterprise functions are complete governed capability definitions.

Each function contains purpose, scope, ownership, policy, process, native tools, controlled objects, Deliverable types, lifecycle/workflow/change rules, Job Profile participation, competence, authority, assurance, evidence, KPIs, audit and deployment rules.

The 29 functions are stable user-facing workspaces, but they are not 29 independent applications or data models.

See [03 — Functional Domain Framework](03-functional-domain-framework.md).

## Native Work-Delivery Runtime

The work runtime converts governed capability into actual executable work.

~~~text
Function / Domain
-> Process / Activity
-> Functional Deployment
-> Job Profile / Position / Person
-> Assignment
-> Work
-> Deliverable / Transaction / Decision
-> Review / Approval
-> Issue / Execute / Transact
-> Acceptance / Verification
-> Evidence
-> Controlled history
~~~

See [04 — Native Work-Delivery Runtime](04-native-work-delivery-runtime.md).

## Industry Solutions

An Industry Solution configures the generic NuBlox platform for a sector.

It can define sector terminology, Job Profiles, delivery domains, object subtypes, relationships, lifecycle/workflow templates, Deliverable types, competence schemes, regulatory requirements, native capability composition, workspace composition and reporting.

An Industry Solution must reuse the Enterprise Kernel rather than fork it.

The first Industry Solution is **NuBlox Construction & Built Environment**.

See [05 — Construction & Built Environment](05-construction-built-environment.md).

## Shared enterprise object graph

Core concepts include:

- Tenant;
- Party, Person and Organisation;
- Organisation Unit, Position and Job Profile;
- Responsibility, Role, Permission, Authority and Delegation;
- Customer and Supplier relationships;
- Contract and Agreement;
- Portfolio, Programme, Project and Work Package;
- Site, Facility, Space, System and Asset;
- Product and Item;
- Requirement;
- Deliverable Requirement and Deliverable Item;
- Information Container, Document, Record and Representation;
- Workflow, Work Item and Assignment;
- Decision;
- Change;
- Baseline, Configuration and Effectivity;
- Event, Evidence and Audit.

The same authoritative object may be used by several functions without being copied into function-specific masters.

## Operating chain

The governing operating chain is:

~~~text
Govern
-> Define
-> Deploy
-> Execute
-> Produce
-> Control
-> Review / Decide
-> Issue / Transact
-> Accept / Verify
-> Evidence
-> Assure
-> Improve
~~~

## ERP composition layer

The product architecture is made executable by the [Enterprise ERP Composition & Execution Contract](14-enterprise-erp-composition-and-execution-contract.md).

That layer binds the 29 Functions, 353 L2 Sub-functions, 1,510 Activities, Native Tool Engines, CBE Domains and Job Profiles into one ERP execution model and defines the end-to-end process spine across functional boundaries.

Its machine-readable baselines are:

- [1,510-Activity ERP Execution Contract](canonical-activity-erp-execution-contract.csv);
- [84-Job CBE ERP Execution Requirement Register](cbe-job-erp-execution-requirement-register.csv); and
- [End-to-End ERP Process Spine](enterprise-end-to-end-erp-process-spine.csv).

These artefacts are derived/validated with `pnpm architecture:generate` and `pnpm architecture:check`.

## Architectural objective

A user should experience NuBlox as one enterprise system whose behaviour is shaped by their organisation, Position, Job Profile, Functional Deployment, authority, operating context and work obligations—not as a menu of unrelated modules.

## Unified native experience

A NuBlox user must be able to perform the work for a supported Function or Job Profile without leaving NuBlox to use another enterprise application.

This means NuBlox owns the operative capability, user experience, business rules, object state, workflow, lifecycle, Decisions, evidence and records needed to complete the work.

External products may be studied for capability design and may exchange data at the boundary for migration, import or export. They must not be required to create, edit, approve, transact, control or complete NuBlox work.

## Product acceptance test

NuBlox capability is complete only when the platform can:

- govern the capability;
- deploy competent and authorised people/organisations into context;
- enable the work through native NuBlox tools and workspaces without requiring another application;
- control the resulting objects and Deliverable Items;
- make and preserve authorised Decisions;
- manage lifecycle, configuration and change where required;
- preserve evidence and authoritative history;
- carry business truth across functional boundaries without re-keying or duplication.
