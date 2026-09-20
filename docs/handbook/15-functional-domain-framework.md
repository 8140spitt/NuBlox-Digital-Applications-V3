# 15 — Functional Domain Framework

**Status:** Governing functional architecture  
**Effective:** 20 September 2026

## Purpose

NuBlox uses 29 governed enterprise functions as the stable functional operating model of the tenant experience.

Those functions are not disconnected applications.

They are governed capability domains operating on the shared Enterprise Kernel and using the shared Native Work-Delivery Runtime.

## Function model

Each function/domain must define a complete governed capability.

The minimum governing structure is:

~~~text
Function
-> Purpose
-> Scope / boundaries
-> Accountable owner
-> Policies / standards / procedures
-> Processes
-> Activities
-> Tasks
-> Native tools
-> Controlled object types
-> Deliverable / output types
-> Lifecycle / workflow
-> Change / baseline rules
-> Job-profile participation
-> Competence requirements
-> Decision rights / authority
-> Assurance / evidence / audit
-> KPIs / KRIs
-> Deployment rules
~~~

A function is incomplete if it has a landing page but cannot support the work, decisions, objects and outputs needed to operate the function.

## 29 functions as workspaces

The accepted V3 experience decision remains:

- F01-F29 are first-class tenant workspaces;
- each function has one stable workspace identity;
- each L2 sub-function has one primary function-workspace home;
- cross-functional processes pass authoritative shared objects between workspaces;
- records are not duplicated merely because several functions use them.

The function workspace is the user-facing functional home.

The Enterprise Kernel and canonical domain services remain the shared implementation foundation beneath it.

## Functional Governance

Functional Governance answers:

> How is this capability controlled so the enterprise can rely on its work and outputs?

A function may define:

- Functional Owner;
- governance body;
- policy;
- standards;
- procedures and methods;
- process architecture;
- controlled types and classifications;
- naming/numbering rules;
- templates;
- competence standards;
- authority thresholds;
- segregation of duties;
- assurance requirements;
- control evidence;
- KPIs/KRIs;
- retention;
- change-control route.

Governance itself is controlled and versioned.

## Functional Delivery

Functional Delivery answers:

> What does this capability do and what business outcomes does it produce?

A function may provide:

- services;
- processes;
- transactions;
- analysis/calculation;
- planning;
- specialist authoring;
- inspections/tests;
- work coordination;
- reviews;
- Decisions;
- approvals;
- exceptions/corrective actions;
- reports;
- Managed Outputs / Deliverable Items;
- handoffs to other functions.

The generic chain is:

~~~text
Function
-> Process
-> Activity
-> Task / Assignment
-> Business Object / Deliverable / Transaction / Decision
-> Review / Approval
-> Handoff
-> Outcome
~~~

## Functional Deployment

Functional Deployment answers:

> Which real organisation, Position and Person is applying this capability in which context, for what scope, with what competence and authority?

A deployment binds governed capability to runtime context.

~~~text
Function / Delivery Domain
-> Job Profile / required capability
-> Organisation / Organisation Unit
-> Position
-> Person
-> Project / Contract / Package / Site / Asset / Service
-> Responsibility scope
-> Competence
-> Authority
-> Effective dates
-> Capacity / availability
-> Work / Deliverable assignments
~~~

Deployment is not employment.

Employment/engagement describes the relationship between a Person and an Organisation.

Deployment describes where and how the capability is being applied.

## Job-profile participation

A Job Profile can participate in multiple functions.

The relationship should express the nature of participation, for example:

- PRIMARY;
- DELIVERY;
- GOVERNANCE;
- ASSURANCE;
- SUPPORT.

A Job Profile is not forced into one function merely to simplify navigation.

## Native tools

Each function may compose:

- shared kernel tools;
- cross-domain tools;
- function-specific tools;
- industry-solution tools;
- integration-backed specialist tools.

A native tool should execute against authoritative NuBlox objects and commands.

The presence of an external specialist authoring application does not remove NuBlox's responsibility for governing the required output, responsibility, review, issue, acceptance and evidence.

## Cross-domain processes

Real enterprise processes cross functional boundaries.

Examples include:

- lead-to-contract;
- recruit-to-deploy;
- procure-to-pay;
- design-to-approved-information;
- change-to-implemented-configuration;
- valuation-to-payment;
- incident-to-corrective-action;
- asset-defect-to-maintenance-completion.

The process owns continuity of context.

Functions contribute capability.

Canonical objects remain shared.

## Function acceptance test

For every F01-F29 function NuBlox must be able to answer:

- What is the function for?
- What is in and out of scope?
- Who owns it?
- Which policies and standards govern it?
- Which processes and tasks does it perform?
- Which native tools support the work?
- Which authoritative objects does it use?
- Which outputs/deliverables does it produce?
- Which Job Profiles participate?
- What competence is required?
- What authority is required?
- How is the function deployed?
- Which Decisions and approvals control it?
- What evidence is required?
- How is performance measured?
- How is the function changed and assured?

If those answers cannot be represented and executed in NuBlox, the function is not complete.
