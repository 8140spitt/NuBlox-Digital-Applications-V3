# 14 — Enterprise ERP Composition & Execution Contract

**Status:** Governing ERP composition architecture  
**Effective:** 24 September 2026

## Purpose

NuBlox is intended to be an end-to-end enterprise-grade ERP and operating environment in which people can carry out the work they are employed, engaged, positioned and deployed to perform.

The 29 Core Business Functions, 353 L2 Sub-functions, 1,510 Activities, 58 Native Tool Engines, 16 Construction & Built Environment Delivery Domains and 84 CBE Job Profiles therefore must not be implemented as separate catalogues or disconnected modules.

This architecture defines the composition layer that turns those catalogues into one executable ERP.

The governing question is:

> Can a real Person, through a valid Position / Job Profile and contextual Deployment, perform the required work from initiation through authoritative business object or work product, review / Decision, transaction / issue / physical execution, acceptance / verification and Evidence without leaving NuBlox?

If not, the capability is not complete.

## ERP definition

NuBlox ERP is the composition of:

1. **Enterprise Kernel** — shared authoritative identities, contexts and controls;
2. **Native Tool Engines** — reusable transaction, planning, professional-authoring, field and assurance capabilities;
3. **Native Work-Delivery Runtime** — deployment, responsibility, assignment, Work, Deliverable, Decision, Evidence and controlled history;
4. **Functional Operating Model** — 29 governed Functions with Functional Governance and Functional Delivery;
5. **Industry Solutions** — sector-specific capability composition, beginning with CBE;
6. **User Experience Composition** — role/job/context-specific access to the work, tools, objects, queues and Decisions required by the signed-in Person;
7. **End-to-End Process Spine** — cross-functional business processes that carry one authoritative object graph across functional boundaries.

No layer may create a competing master identity, workflow framework, approval mechanism or audit model where the Enterprise Kernel already owns the concept.

## Governing composition chain

~~~text
Tenant
-> Organisation / Organisation Unit
-> Person
-> Position
-> Job Profile
-> Employment / Position Occupancy
-> Function or CBE Delivery Domain
-> Functional Deployment
   -> FUNCTIONAL_GOVERNANCE
   or
   -> FUNCTIONAL_DELIVERY
-> Responsibility / scope / competence / Permission / Authority
-> L2 Sub-function / Activity / Process
-> Native Tool Engine capability
-> Authoritative business object / transaction / work product
-> Work / Assignment
-> review / Decision / approval
-> issue / transact / execute
-> acceptance / verification
-> Evidence / Record / Audit
-> KPI / performance / improvement
~~~

The chain is compositional. A Person, Position, Job Profile, Deployment, Permission, Authority and Work Item remain distinct objects.

## Three machine-readable ERP baselines

### 1. Activity ERP execution contract

[canonical-activity-erp-execution-contract.csv](canonical-activity-erp-execution-contract.csv) joins all 1,510 enterprise Activities to:

- work pattern;
- Native Tool Engine identity;
- engine class;
- current engine implementation state;
- canonical object families owned or operated by those engines;
- shared platform/control engines;
- the runtime Deployment-purpose rule.

This is the first complete machine-readable bridge from Function Activity to executable engine and authoritative object family.

It does **not** claim that each Activity is fully implemented. It identifies the canonical execution surface that implementation must satisfy.

### 2. CBE Job ERP execution requirement register

[cbe-job-erp-execution-requirement-register.csv](cbe-job-erp-execution-requirement-register.csv) records all 84 CBE Job Profiles as ERP execution requirements.

For each Job Profile it preserves:

- primary CBE Delivery Domain;
- candidate participating Core Business Functions;
- lifecycle stages;
- specialist professional capabilities;
- primary structured records/work products;
- current market work pattern;
- the native NuBlox requirement;
- Person / Position / Job Profile / Deployment rule;
- explicit remaining gaps for Native Engine and canonical-object composition.

A CBE Job Profile is not accepted as supported until a Person with that Job Profile can perform its required work end to end in NuBlox.

### 3. End-to-end ERP process spine

[enterprise-end-to-end-erp-process-spine.csv](enterprise-end-to-end-erp-process-spine.csv) defines the cross-functional processes that make NuBlox one ERP rather than a collection of modules.

The initial governing spine includes:

- strategy-to-portfolio;
- idea-to-release;
- lead-to-contract;
- order-to-cash;
- source-to-pay;
- demand-to-fulfilment;
- recruit-to-deploy;
- record-to-report;
- project-to-handover;
- design-to-approved-information;
- service-request-to-acceptance;
- asset-acquire-to-retire;
- incident-to-corrective-action;
- change-to-implemented-baseline;
- contract-to-final-account;
- IT-request-to-resolution;
- policy-to-assurance.

Each process declares participating Functions, engines, authoritative object families, control engines, critical handoff rule and ERP acceptance rule.

## Function composition contract

The 29 Functions remain stable governed capability contexts.

A Function is **not** an independent application.

Each Function composes:

~~~text
Function
-> L2 Sub-functions
-> Activities
-> Native Engines
-> canonical objects / transactions / work products
-> participating Job Profiles
-> Functional Deployments
-> Work / queues / Decisions
-> records / Evidence
-> performance
~~~

Every Function has two execution purposes.

### Functional Governance

How the capability is defined, controlled, assured and improved.

This can include:

- mandate and ownership;
- policy;
- standards;
- process architecture;
- methods and templates;
- controlled classifications;
- competence requirements;
- Authority rules;
- Segregation of Duties;
- assurance;
- KPIs/KRIs;
- retention and Records;
- governed improvement.

### Functional Delivery

The work the capability performs for the enterprise.

This can include:

- transactions;
- planning;
- calculation and analysis;
- professional authoring;
- field work;
- inspection/test;
- review;
- Decision;
- commercial/financial commitment;
- physical execution;
- work products / Deliverables;
- handoff to another Function.

Governance and Delivery are runtime Deployment purposes, not permanent classifications of a Person or Job Profile.

## Job and Position execution contract

NuBlox must primarily present work in terms meaningful to the Person doing it.

A user must not need to understand internal Native Engine IDs or navigate several functional modules merely because their job crosses Functions.

The role/job experience is resolved from:

~~~text
signed-in Person
-> active Organisation relationship
-> active Position Occupancy
-> Position
-> Job Profile
-> active Function/CBE Deployments
-> Deployment purpose
-> responsibility scope
-> competence
-> Permission
-> Authority
-> operating context
-> assigned and actionable Work
~~~

The resulting user experience composes:

- My Work;
- My projects/contracts/sites/assets/services;
- My tools;
- My transactions;
- My work products / Deliverables;
- My reviews and Decisions;
- My exceptions;
- My records/evidence;
- My performance where applicable.

The same underlying engine may appear in multiple job experiences without duplicating its authoritative data.

## CBE Industry Solution contract

CBE configures the common ERP for professional and physical built-environment work.

It provides:

- 16 Delivery Domains;
- 84 Job Profiles;
- sector-specific object types and relationships;
- professional work-product requirements;
- project, contract, package, site, system and Asset context;
- technical and field workflows;
- CBE-specific competence / Authority / assurance rules;
- native engine composition.

A CBE Job Profile may participate in multiple Core Business Functions.

Example: an Electrician may require Service Delivery, Inventory, Quality, HSE, Asset/Maintenance, Information and Finance capabilities. The Electrician experience composes those capabilities around the job and assigned context; it does not create an Electrician-specific duplicate inventory, quality or finance system.

## Authoritative object continuity

End-to-end ERP requires identity continuity.

Examples:

- one Party / Organisation identity across Customer, Supplier, Contract, Finance and Service contexts;
- one Project identity across Commercial, Planning, Design, Procurement, Delivery, Quality, Finance and Handover;
- one Asset identity across procurement/creation, commissioning, Finance, operation, maintenance and retirement;
- one Product / Item identity across definition, sourcing, stock, manufacturing, quality and fulfilment;
- one Contract / obligation identity across Legal, Procurement/Sales, Project, Commercial and Finance;
- one Person identity across HCM, Position, Deployment, Work, Decision and Audit.

Function-specific copies of these masters are prohibited.

A cross-functional process handoff changes responsibility or state around the authoritative object; it does not create a new disconnected version of the business truth.

## Work-product and transaction continuity

NuBlox must distinguish the thing being worked on from the Work Item that coordinates the work.

~~~text
Work / Assignment
-> operates on or produces
   -> authoritative structured business object
   -> transaction
   -> Deliverable Item
   -> Information revision / Representation
   -> Decision
   -> inspection/test result
   -> physical outcome
   -> Evidence
~~~

Completion of a task alone is not sufficient evidence that the business outcome occurred.

Downstream consequences must be driven by the authoritative result.

Examples:

- accepted order creates fulfilment demand;
- approved design releases controlled information for procurement/construction;
- goods receipt changes inventory and supports invoice matching;
- passed inspection releases dependent work;
- accepted service completion supports billing;
- commissioned system/asset creates operational asset state;
- approved Change produces an implemented and verified configuration/baseline;
- approved valuation/payment certificate produces financial consequence.

## ERP process rule

A Native Tool Engine is reusable; an end-to-end ERP process composes several engines.

Therefore implementation must be tested at two levels:

### Engine acceptance

Can NuBlox natively perform the complete governed operation owned by the engine?

### Process acceptance

Can authoritative business truth pass from trigger to terminal outcome across all participating Functions without:

- re-keying;
- duplicate masters;
- uncontrolled spreadsheets/files as the system of record;
- ambiguous "latest" version use;
- lost responsibility;
- lost Decision/Authority evidence;
- broken financial/commercial reconciliation;
- external runtime dependency?

Both are required.

## ERP execution contract

For a material supported Activity or Job capability the executable contract ultimately consists of:

1. **Who** — participating Job Profile / Position / Person;
2. **Why** — Function / Domain / Process / obligation;
3. **Purpose** — Functional Governance or Functional Delivery;
4. **Where** — tenant and operating context;
5. **Responsibility** — accountable/responsible/reviewer/approver/etc.;
6. **Competence** — required capability / qualification / validity;
7. **Access** — Permission and data scope;
8. **Authority** — delegated Decision/commitment limits where required;
9. **Action** — Activity / command / professional operation;
10. **Tool** — Native Tool Engine capability;
11. **Subject** — exact authoritative business object and version/state where relevant;
12. **Output** — transaction, object, Deliverable, Decision or physical result;
13. **Control** — validation, lifecycle, workflow, change/configuration and segregation rules;
14. **Handoff** — downstream object/event/obligation;
15. **Evidence** — attributable record proving what occurred;
16. **Performance** — applicable KPI/KRI/SLA/cost/time/quality outcome.

The current Activity execution register closes the Activity -> Engine -> canonical object-family portion. Job-to-engine composition and precise Activity output/authority/evidence contracts remain explicit next-stage mapping work.

## Development rule from this point

NuBlox development is no longer authorised merely because an engine is next numerically.

Work is selected by closing executable ERP contracts and process gaps.

The implementation sequence is:

1. maintain shared Enterprise Kernel/control integrity;
2. close Activity -> Engine -> object-family mapping;
3. close Job Profile -> Activity/Engine -> structured output mapping;
4. define exact canonical objects and commands for each required operation;
5. implement missing Native Engines;
6. compose engines into Function Governance/Delivery workspaces;
7. compose engines into Job/Profile experiences;
8. connect cross-functional process handoffs;
9. test object/financial/configuration reconciliation across the end-to-end process;
10. accept the Function/Job capability only after native end-to-end execution succeeds.

## Minimum end-to-end acceptance scenarios

The product must progressively demonstrate complete scenarios such as:

- recruit a Person, occupy a Position, prove competence, deploy them and deliver actionable My Work;
- create Customer demand, quote/bid, contract, fulfil, accept, invoice, account and receive payment;
- create procurement demand, source, place Purchase Order, receive, match invoice, account and pay;
- establish a Project, baseline it, author/release design information, procure, perform site work, inspect/test, value/pay, commission and hand over Assets/information;
- raise a service request, schedule/dispatch work, capture field evidence, complete, accept and bill;
- identify an Asset need, acquire/create it, commission, operate, maintain and retire it;
- raise a controlled Change, assess impact, decide, implement, verify and establish the updated Baseline;
- identify a defect/non-conformance/incident, investigate, correct, verify effectiveness and close with Evidence.

These scenarios are integration acceptance tests for the ERP, not demonstrations of isolated screens.

## Completion definition

NuBlox is an enterprise-grade ERP only when the supported operating model is executable through one canonical enterprise object graph.

A Function, engine or CBE Job Profile is not complete because pages, tables or CRUD operations exist.

It is complete only when competent and authorised people can perform the required work in context, produce authoritative business truth and work products, carry that truth across functional boundaries, make attributable Decisions, preserve Evidence, and reach the required business outcome entirely within NuBlox.
