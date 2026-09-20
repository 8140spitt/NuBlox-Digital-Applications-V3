# 11 — Product State & Roadmap

## Purpose

This chapter separates the target product definition from delivered software.

## Product definition state

The product is now defined around:

- the enterprise itself;
- 29 business functional areas;
- the end-to-end construction/built-environment delivery lifecycle;
- managed deliverables and business output;
- people, jobs and responsibilities;
- shared business objects and data;
- process, workflow, authority and evidence;
- a common enterprise user experience;
- administration, configuration and integration;
- shared platform architecture.

## Current runtime foundations

The repository currently contains material capability around tenant context, authentication, membership and permissions, delegated-authority foundations, Party/Person/Organisation foundations, organisation structure, shared work/work items, authorised decisions, governed evidence, audit/business events/outbox, classifications, lifecycle configuration, authority configuration, reference data/history, permission access requests, work contexts, drafts/edit leases, personal navigation state and object resolution/search.

## Newly implemented functional-deployment runtime

The application now persists and exposes the first reusable Governance / Delivery / Deployment runtime:

- governed enterprise Functional Definitions and controlled versions/baselines;
- 29 enterprise-function seed definitions;
- 16 Construction & Built Environment delivery-domain seed definitions;
- 84 sector Job Profiles;
- Worker Relationships;
- Positions and Position Assignments;
- competence definitions, requirements and Person competence evidence;
- Job-to-Function relationships;
- Functional Change records;
- Deployment Requirements;
- Functional Deployments and Deployment Assignments;
- project/contract/package/site/asset/organisation/enterprise responsibility scope;
- Position / Person / Organisation allocation;
- authority-reference linkage;
- platform audit and business-event evidence.

## Newly implemented managed-deliverable runtime

The application now contains the first reusable Managed Deliverable runtime:

- Deliverable Requirement identity separate from the actual Deliverable Item;
- requirement source and delivery context;
- linkage to Functional Definition, Functional Deployment and required Job Profile;
- responsible deployment assignment, Position, Person and originating Organisation;
- Native / Assisted / Connected / Ingested authoring modes;
- controlled output type, discipline, classification and planned dates;
- optional controlled Information Container creation for drawings/models/documents and other controlled information;
- shared authoring Workflow and Work Item creation;
- automatic My Work routing where the responsible Person is an active tenant member;
- canonical Deliverable Item object routing;
- participant responsibility;
- exact-version review and approval gates backed by immutable authorised Decision evidence;
- controlled rework Work Items when review/approval returns or rejects an output;
- issue/transmittal blocked until required authoring, review, approval and controlled-information gates are satisfied;
- recipient acceptance/no-objection/rejection evidence with acceptance closure or governed rework;
- issue/transmittal and recipient response persistence;
- full platform audit/business-event evidence.

This is still an early delivery-runtime slice. Collaborative review comments/markups, connected-authoring adapters, bulk deliverable schedules, supersession depth and broader job-specific authoring experiences remain implementation work.

## Current application surface

Application routes/workspaces exist for Home, Operate, Deliver, Enterprise Data, Functions, My Work, Search, canonical object routing and administration/master/reference/security areas.

The strongest implemented functional breadth remains in early F01-F06 enterprise slices.

## What must not be claimed yet

The product definition does not mean all of it is implemented.

It is not yet safe to claim:

- all 29 functions are fully executable;
- every job can perform its full duties;
- a complete deliverable-management runtime exists;
- every drawing/model/specification/calculation can be managed end-to-end;
- complete lead-to-asset delivery is implemented;
- all canonical business objects have runtime persistence;
- all specialist integrations exist;
- all field/mobile/offline/viewer capabilities are implemented.

## Immediate priority 1 — functional governance and deployment runtime

Implement reusable support for:

- Functional Definition and controlled baseline;
- enterprise-function and sector-delivery-domain relationships;
- Job-to-Function relationships (PRIMARY / DELIVERY / GOVERNANCE / ASSURANCE / SUPPORT);
- competence requirements and evidence;
- Deployment Requirement;
- Functional Deployment;
- organisation / Position / Person assignment;
- project / contract / package / site / asset responsibility scope;
- effective dates, capacity and workload;
- permission and delegated-authority validation;
- deployment verification, change/substitution and demobilisation;
- status accounting, evidence and audit.

This is the runtime bridge between the 29 enterprise functions and the 84 identified Construction & Built Environment jobs.

## Immediate priority 2 — managed deliverable runtime

Implement reusable support for deliverable requirements, deliverable items, responsibility, dates, lifecycle/status, revision/version, representations, review/comments, approval, issue/transmittal, acceptance, supersession and history/evidence.

## Immediate priority 3 — enterprise interaction foundation

Complete the stable shell, My Work, functional-area workspaces, Deliver, Deliverables, object workspaces, high-volume grids/import and controlled denied/conflict/error states.

## Immediate priority 4 — construction delivery verticals

Build coherent journeys across opportunity/tender, contract/project, design deliverables, procurement, site execution, commercial/cost/change, quality/HSE, commissioning/handover and asset/service.

## Immediate priority 5 — representative job acceptance

Prove realistic jobs end-to-end, including Architect, Quantity Surveyor, Estimator, Planner, Design Manager, Buyer, Project Manager, Site Manager, Safety Inspector, Project Accountant, Asset Manager and Maintenance Planner/Technician.

## Acceptance standard

A feature is not complete because its table or screen exists.

It is complete when the relevant business person can use it to perform real work, create/manage the required output, obtain necessary decisions, complete the handoff and reconstruct the evidence.
