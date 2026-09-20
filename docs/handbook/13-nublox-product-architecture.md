# 13 — NuBlox Product Architecture

**Status:** Governing product architecture  
**Effective:** 20 September 2026

## Product definition

NuBlox is an **Enterprise Operating Platform**.

NuBlox is the product. Industry solutions, external products and reference architectures sit beneath or beside the NuBlox product architecture; they do not define it.

The governing product hierarchy is:

~~~text
NuBlox Enterprise Operating Platform
|
+-- Enterprise Kernel
|   +-- Canonical object graph
|   +-- Identity, organisation and authority
|   +-- Workflow, lifecycle, change and baselines
|   +-- Documents, records and information
|   +-- Decisions, evidence, events and audit
|
+-- Functional Domains
|   +-- 29 governed enterprise functions
|   +-- Native domain tools
|   +-- Shared cross-domain processes
|
+-- Native Work-Delivery Runtime
|   +-- Deployments
|   +-- Assignments
|   +-- Work
|   +-- Deliverables
|   +-- Reviews, decisions and approvals
|   +-- Issue, acceptance and evidence
|
+-- Industry Solutions
    +-- NuBlox Construction & Built Environment
        +-- 16 delivery domains
        +-- 84 job profiles
        +-- Projects, contracts, packages, sites and assets
~~~

## Architectural reset

Earlier product wording treated "NuBlox Construction & The Built Environment" as though it were the NuBlox product itself.

That interpretation is superseded.

**NuBlox** is the enterprise platform.

**NuBlox Construction & Built Environment** is the first industry solution configured on that platform.

The platform must therefore be capable of supporting additional industry solutions without rebuilding identity, organisation, authority, workflow, lifecycle, change, information, decisions, evidence or the canonical object model.

## Product responsibilities

NuBlox must allow an enterprise to:

1. define itself;
2. govern its capabilities;
3. deploy those capabilities into real operating contexts;
4. perform operational and delivery work;
5. produce controlled business outputs;
6. transact across shared enterprise objects;
7. make and evidence authorised decisions;
8. control lifecycle, configuration and change;
9. assure performance, compliance and outcomes;
10. preserve authoritative history.

The core operating chain is:

~~~text
Govern
-> Define
-> Deploy
-> Execute
-> Produce
-> Review
-> Decide
-> Issue / transact
-> Accept / verify
-> Evidence
-> Assure
-> Improve
~~~

## Shared enterprise object model

NuBlox functions and industry solutions operate on a shared enterprise object graph.

Core canonical concepts include:

- Tenant;
- Party;
- Person;
- Organisation;
- Legal Entity;
- Organisation Unit;
- Position;
- Job Profile;
- Role and Responsibility;
- Authority and Delegation;
- Customer Relationship;
- Supplier Relationship;
- Contract;
- Project;
- Programme;
- Work Package;
- Site;
- Property;
- Location / Space;
- Product / Item;
- System;
- Asset;
- Requirement;
- Deliverable Requirement;
- Deliverable Item;
- Information Container;
- Document / Record;
- Workflow;
- Work Item;
- Assignment;
- Decision;
- Change;
- Baseline;
- Configuration Item;
- Evidence;
- Business Event.

The same authoritative object must be usable across functions and industry contexts without creating a separate copy for each workspace.

## Functional domains are complete governed capabilities

Each NuBlox function/domain must be a complete governed capability containing:

- purpose, scope and accountable owner;
- policies, standards and procedures;
- processes, activities and tasks;
- native tools and workspaces;
- controlled object and deliverable types;
- lifecycle, workflow and change control;
- participating Job Profiles and competence requirements;
- decision rights and delegated authority;
- assurance, evidence, KPIs and audit;
- deployment rules for organisations, projects, contracts, sites, assets and services.

A function is therefore more than navigation and more than an organisational department.

## One product, not 29 applications

The 29 enterprise functions are stable first-class user workspaces, but they are not 29 independent applications.

They share:

- one enterprise kernel;
- one identity and authority model;
- one canonical object graph;
- one workflow/work runtime;
- one lifecycle/change/baseline framework;
- one evidence and audit framework;
- one search and object-resolution model;
- one integration architecture.

This preserves recognisable functional ownership without reintroducing application silos.

## Native Work-Delivery Runtime

The Native Work-Delivery Runtime converts governed capability into executable work.

The generic runtime chain is:

~~~text
Function / Domain
-> Process / Activity
-> Deployment
-> Job Profile / Position / Person
-> Assignment
-> Work
-> Deliverable / Transaction / Decision
-> Review / Approval
-> Issue / Acceptance
-> Evidence
-> Controlled Record
~~~

The runtime is shared across functional domains and industry solutions.

It must understand not only who can see an object, but:

- what work is required;
- why it is required;
- which process and business context created it;
- which capability is responsible;
- who is responsible, accountable, reviewing or approving;
- what competence is required;
- what authority is required;
- what output must be produced;
- which exact version/revision was reviewed or approved;
- what downstream objects depend on it;
- what evidence proves completion.

## Industry solutions

An Industry Solution configures the generic NuBlox platform for a sector.

An Industry Solution may define or extend:

- terminology;
- taxonomies;
- Job Profiles;
- delivery domains;
- object subtypes;
- relationship types;
- lifecycle templates;
- workflow templates;
- deliverable types;
- regulatory obligations;
- competence schemes;
- project/delivery structures;
- reports and KPIs;
- integration adapters;
- industry-specific workspace composition.

Industry configuration must not duplicate the shared kernel.

## Construction & Built Environment

NuBlox Construction & Built Environment is the first Industry Solution.

It brings together:

- 29 enterprise functions;
- 16 Construction & Built Environment delivery domains;
- 84 governed Job Profiles;
- full project/contract/site/asset delivery context;
- controlled technical and business deliverables;
- built-environment lifecycle continuity from opportunity through operation.

See [17 — Construction & Built Environment Industry Solution](17-construction-built-environment-industry-solution.md).

## Reference architectures

External products and architectures are references, benchmarks, integration targets and migration sources.

They are not the NuBlox architectural centre.

PTC Windchill is particularly valuable as a reference for:

- stable identity;
- master/revision/iteration concepts;
- typed relationships;
- lifecycle;
- workflow;
- change control;
- configuration control;
- baselines;
- effectivity;
- controlled information;
- representations;
- context;
- access control;
- publication;
- audit/history.

Those concepts are redesigned into NuBlox's broader enterprise model.

See [18 — Reference Architecture, Benchmark & Migration Mapping](18-reference-architecture-benchmark-and-migration-mapping.md).

## Product test

The governing product test is:

> Can NuBlox govern the capability, deploy the right organisation/person into the right context, enable the required work using native tools, control the resulting business objects and deliverables, make authorised decisions, preserve configuration/change history, and provide complete evidence of what happened?

If not, the capability is not complete.
