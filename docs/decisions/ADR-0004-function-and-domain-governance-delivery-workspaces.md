# ADR-0004 — Functions and CBE Domains Use Governance and Delivery Workspaces

**Status:** Accepted  
**Date:** 22 September 2026  
**Supersedes:** the draft "Generic Core 29 + CBE Bolt-On" proposal previously stored at repository root under `docs/`.

## Context

NuBlox must support two different but connected realities:

1. how a tenant operates through the 29 governed enterprise Functions; and
2. how a Construction & Built Environment tenant performs professional work through the 16 CBE Domains and 84 governed Job Profiles.

Both kinds of capability must be governed and both kinds must be delivered. They share the Enterprise Kernel, Native Work-Delivery Runtime, governed business objects and work products, but neither is merely a UI wrapper around the other.

The product-boundary test for CBE remains: **can a person perform the job they are employed and deployed to do, while NuBlox governs the required outputs, decisions and evidence?**

## Decision

Functions and CBE Domains are peer user-facing capability contexts.

~~~text
Tenant
|
+-- Enterprise Functions (F01-F29)
|   +-- Governance
|   +-- Delivery
|
+-- CBE Professional Domains (D01-D16)
    +-- Governance
    +-- Delivery
    +-- 84 governed Job Profiles
~~~

Every Function and every CBE Domain exposes the same five workspace views:

1. **Overview** — identity, scope, sub-capabilities/Job Profiles and composed native capability.
2. **Governance** — mandate, standards, methods, competence, authority, controls, assurance and deployment.
3. **Delivery** — current work, activities, roles, contexts, Services, requirements, tasks and outputs.
4. **Performance** — capability, work, control, output and improvement measures.
5. **Records** — governed Information, Deliverables, Change/Configuration, Decisions and Evidence.

Governance and Delivery are not separate products or databases. Governance defines the conditions under which Delivery is performed.

~~~text
Governance
-> policy / standard / method
-> process / template / required output
-> competence / responsibility / authority
-> review / assurance / evidence rule
                |
                v
Delivery
-> assignment / task
-> business object / work product
-> review / Decision
-> issue / acceptance
-> evidence / outcome
~~~

## CBE structure

The 16 CBE Domains classify professional capability. The 84 Job Profiles identify governed professional work within those Domains.

CBE-specific reusable engines, tools and capabilities may be composed across Domains, but they are **not** a mandatory intermediate "bolt-on module" hierarchy in the user-facing architecture.

The system may package or license capability commercially, but commercial packaging must not become the canonical professional domain model.

## Shared platform

Functions and Domains reuse shared services for:

- Party, Person, Organisation, Position and employment context;
- Access, Responsibility and Authority;
- Deployment and competence;
- Work, workflow and lifecycle;
- Information and representations;
- Deliverables and acceptance;
- Change, Configuration, Baseline and Effectivity;
- Decisions, assurance, Evidence and audit;
- Project, Contract, Package, Site, Asset and Service context;
- integration and business events.

Cross-functional and cross-domain processes preserve one end-to-end business context.

## UI consequences

- `/app/functions` is the directory for F01-F29.
- `/app/functions/[code]` exposes Overview / Governance / Delivery / Performance / Records.
- `/app/domains` is the directory for D01-D16.
- `/app/domains/[code]` exposes the same five views.
- CBE capability configuration, service setup, professional deployment, demand and sourcing remain administrative operations and are not the primary CBE professional workspace.
- My Work remains the cross-Function/cross-Domain attention surface.

## Invariants

1. Function != CBE Domain != Job Profile != Position != Person.
2. Every Function can be governed and delivered.
3. Every CBE Domain can be governed and delivered.
4. A Job Profile describes professional capability; deployment carries Governance or Delivery purpose.
5. Work products are first-class governed objects, not attachments added after the work.
6. Governance rules must be enforceable by Delivery where the rule is machine-actionable.
7. Functions and Domains share canonical platform services rather than creating isolated application silos.
8. Reusable specialist engines may cross Function/Domain boundaries without becoming a new top-level taxonomy.
