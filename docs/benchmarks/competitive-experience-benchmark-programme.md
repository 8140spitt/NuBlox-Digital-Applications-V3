# NuBlox Competitive Experience Benchmark Programme

**Status:** first comparative pass complete — detailed menu inventory refinement continues  
**Established:** 19 September 2026  
**Scope:** menu-by-menu, workspace-by-workspace and object-by-object review of leading enterprise, construction, PLM, EAM and built-environment platforms

## Why this programme exists

The existing NuBlox market benchmark programme challenged **business capability and canonical semantics**. It proved that the V3 object/aggregate model had been exposed to a broad external challenge before aggregate freeze.

That work is not enough to govern the **application experience**.

The current NuBlox runtime can still be function-page-centric even when the canonical data model underneath it is correct. A second benchmark stream is therefore required to study how mature platforms let users:

- enter the application;
- understand business/enterprise context;
- find work;
- navigate functions and processes;
- find and open records;
- work with objects, structures and relationships;
- enter high-volume data;
- manage product/master/reference/configuration data;
- perform workflow, lifecycle, change and approval actions;
- search, filter, save views and resume work;
- cross from operational work into finance, people, supply chain and asset contexts;
- administer the platform without confusing business administration with technical administration.

The objective is **not vendor imitation**.

The governing question is:

> What interaction, navigation, object, process or data-management pattern has a mature product proven useful, and what is the cleanest NuBlox-native way to provide the business outcome?

## Relationship to the architecture benchmark

This programme is deliberately separate from the canonical architecture challenge.

The existing benchmark register answers:

> **What business outcomes and semantic concepts must NuBlox support?**

This programme answers:

> **How should a user discover, understand, enter, manipulate and traverse that enterprise information end-to-end?**

A vendor menu, page, module or screen never becomes a NuBlox aggregate boundary merely because the vendor exposes it.

## Benchmark universe

The review is broader than Windchill and deliberately includes competing interaction philosophies.

### Enterprise ERP / operating platforms

- SAP Cloud ERP / S/4HANA / Fiori ecosystem
- Oracle Fusion Cloud Applications
- Microsoft Dynamics 365
- IFS Cloud
- Infor CloudSuite / Infor OS
- Workday
- ServiceNow
- Oracle NetSuite
- Unit4 ERP

### Construction / capital-project platforms

- Oracle Construction and Engineering — Primavera, Unifier, Aconex, Textura
- Procore
- Autodesk Construction Cloud / Forma
- Trimble Construction One / Viewpoint / ProjectSight
- Sage Construction / Intacct Construction
- Causeway
- Thinkproject / CEMAR
- Asite
- Hexagon EcoSys

### Product / engineering / information lifecycle

- PTC Windchill
- Siemens Teamcenter
- Dassault Systèmes 3DEXPERIENCE / ENOVIA
- Bentley ProjectWise / iTwin

### Asset / property / field

- IBM Maximo Application Suite
- HxGN EAM
- Planon
- Esri ArcGIS / Field Maps / GeoBIM

### Specialist enterprise challengers

- Salesforce
- Deltek Vantagepoint
- Diligent One

The universe is extensible. A product is added when it exposes a materially distinct enterprise interaction or information-management pattern.

## Review unit

Every product is reviewed **menu item by menu item**, not merely by marketing module.

For each top-level menu, workspace, work area, object home, record page or administration branch we record:

1. vendor/product/version or current cloud release;
2. menu path and parent;
3. purpose;
4. primary persona(s);
5. primary object(s);
6. list/tree/grid/graph/form/workspace interaction;
7. create/read/change actions;
8. status/lifecycle/change semantics;
9. relationship navigation;
10. search/filter/view/save behaviour;
11. bulk entry / spreadsheet / import behaviour;
12. context model;
13. work/task/approval integration;
14. authority/permissions behaviour;
15. evidence/audit/history behaviour;
16. integrations/extensions;
17. what is strong;
18. what is weak or product-specific;
19. NuBlox treatment;
20. affected Operate / Deliver / Enterprise Data stream;
21. affected canonical objects/aggregates;
22. required NuBlox UX/platform primitive.

## Common interaction taxonomy

All reviews are normalized to the following NuBlox-neutral taxonomy.

| ID | Interaction capability | Question |
| --- | --- | --- |
| X01 | Home / landing | What does the user see first? |
| X02 | Role / persona | How does the UI adapt to the user's job? |
| X03 | Enterprise context | How does the user know company/project/product/site/asset context? |
| X04 | Process / workspace | How is an activity or process surfaced? |
| X05 | Function / module | How are broad business capabilities grouped? |
| X06 | Collection / list | How are objects found and triaged? |
| X07 | Object workspace | How is one record/object presented? |
| X08 | Structure / relationships | How are parent/child, graph and cross-object relationships navigated? |
| X09 | Search | Can the user search enterprise-wide and within context? |
| X10 | Saved views / favourites / recent | Can users build persistent working views? |
| X11 | My Work / inbox | How are tasks, exceptions and approvals consolidated? |
| X12 | Create / edit | What is the standard record-entry grammar? |
| X13 | High-volume entry | How are grids, copy/paste, multi-edit and mass actions handled? |
| X14 | Import / export | How are spreadsheet/file/API imports staged and governed? |
| X15 | Master / product / reference data | How is enterprise data maintained outside transactions? |
| X16 | Version / revision / effectivity | How is change through time represented? |
| X17 | Lifecycle / state | How do state and permitted actions interact? |
| X18 | Workflow / approval / decision | How is coordinated work separated from domain truth? |
| X19 | Change management | How is proposed change assessed, authorised and implemented? |
| X20 | Documents / content / representations | How is information related to business identity? |
| X21 | Collaboration / communications | How are discussions, correspondence and external participants handled? |
| X22 | Analytics / reporting | How are operational views separated from formal reports/analytics? |
| X23 | Permissions / security | How are access, role and context communicated? |
| X24 | Business configuration | How are lifecycles, numbering, terms, rules and templates maintained? |
| X25 | Technical administration | How are users, queues, integrations, health and platform configuration handled? |
| X26 | Mobile / field | How is the interaction model adapted to field work? |
| X27 | Integration / extension | How are external apps, APIs and extensions represented? |
| X28 | Audit / history | Can the user understand who changed what, when and why? |
| X29 | Error / denied / conflict | What happens when access, validation or concurrency prevents action? |

## Three NuBlox enterprise streams

Every finding is mapped to one or more of:

### Operate the Business

Persistent enterprise machinery:

- strategy;
- governance;
- organisation;
- people;
- finance;
- risk/compliance/legal;
- QHSE assurance;
- technology/data/cyber;
- performance;
- transformation.

### Deliver the Business

Value-delivery chain:

- market/client need;
- lead/opportunity;
- bid/estimate/tender;
- contract;
- mobilisation;
- programme/project;
- design/information;
- procurement;
- site/construction;
- commercial;
- commissioning;
- handover;
- asset/service.

### Enterprise Data

Shared data foundation:

- Party / customer / supplier;
- product / item / material / service;
- resource / plant / equipment;
- asset / system;
- organisation structure;
- finance structures;
- classifications;
- reference data;
- business configuration.

Enterprise Data is not treated as technical administration.

## Required review outputs

Each benchmark must eventually produce:

- a **menu inventory**;
- an **interaction-pattern review**;
- a **data-entry/data-management review**;
- an **object-workspace review**;
- an **Operate / Deliver / Enterprise Data mapping**;
- a list of **NuBlox requirements**;
- a list of **patterns explicitly rejected**;
- cited official product documentation.

Cross-vendor findings are then promoted into the NuBlox Experience System only when they are justified by business need and fit the canonical architecture.

## Review waves

### UX Wave 1 — enterprise navigation and work

SAP, Oracle Fusion, Microsoft Dynamics 365, IFS, Infor, Workday, ServiceNow.

Focus:

- global navigation;
- role/persona;
- workspaces;
- enterprise search;
- work/inbox;
- records and lists;
- master data;
- business configuration;
- administration.

### UX Wave 2 — construction delivery

Oracle Construction and Engineering, Procore, Autodesk, Trimble, Sage, Causeway, Thinkproject, Asite, EcoSys.

Focus:

- company/project context;
- project selector;
- project home;
- documents/drawings/models;
- RFI/submittal/correspondence;
- programme;
- commercial/cost;
- procurement;
- quality/safety;
- field/mobile;
- handover.

### UX Wave 3 — product and information lifecycle

Windchill, Teamcenter, 3DEXPERIENCE, ProjectWise/iTwin.

Focus:

- product/item/part identity;
- object information pages;
- structures/BOM;
- product data entry;
- classification;
- configuration/effectivity;
- versions/revisions;
- change;
- work-in-progress;
- controlled information;
- engineering search.

### UX Wave 4 — asset, property and service

Maximo, HxGN EAM, Planon, Esri.

Focus:

- asset/location hierarchy;
- maintenance;
- work order;
- inventory/MRO;
- inspections;
- spatial/geographic navigation;
- property/space;
- field mobility.

### UX Wave 5 — specialist interaction patterns

Salesforce, Deltek, Diligent, NetSuite, Unit4.

Focus:

- object-centric CRM;
- split list/workspace;
- professional-services/project accounting;
- governance/board work;
- mid-market ERP usability;
- saved views, dashboards and personalization.

## Immediate NuBlox design consequences

The review is already strong enough to establish several provisional rules while the detailed inventory continues:

1. The 29 NuBlox functions remain governed capabilities, but cannot be the sole primary navigation model.
2. A stable enterprise context selector is required.
3. Canonical objects require stable object URLs and a common object-workspace grammar.
4. Search must evolve from navigation search into enterprise object search.
5. My Work must resolve tasks/approvals/exceptions to canonical subjects.
6. Enterprise Data must become a first-class workspace family, distinct from technical administration.
7. High-volume data entry must be a platform capability, not repeated hand-built forms.
8. Import/export requires governed staging, validation and provenance.
9. Saved views, favourites and recent objects must be first-class productivity features.
10. Business configuration and technical administration must be separated.
11. Context-aware lists, split views, trees and structures need reusable platform primitives.
12. New F07+ runtime screens must be challenged against this programme before they establish another local UX pattern.

## First comparative pass checkpoint — 19 September 2026

The cross-suite experience challenge now has linked first-pass evidence for **29/29 registered suites/platforms** across all five waves:

- Wave 1 — enterprise navigation/work: SAP, Oracle Fusion, Microsoft Dynamics 365, IFS, Infor, Workday, ServiceNow;
- Wave 2 — construction delivery: Oracle C&E/Aconex, Procore, Autodesk, Trimble, Sage, Causeway, Thinkproject, Asite, EcoSys;
- Wave 3 — product/engineering/information: Windchill, Teamcenter, 3DEXPERIENCE/ENOVIA, ProjectWise/iTwin;
- Wave 4 — asset/property/service: Maximo, HxGN EAM, Planon, Esri;
- Wave 5 — specialist enterprise: Salesforce, Deltek Vantagepoint, Diligent One, NetSuite, Unit4.

This is **first-pass coverage**, not menu-inventory closure. Every register row remains `in-progress` until the materially relevant menu/work-area inventory and evidence refinement is complete.

The converged findings are now governed through:

`docs/design-system/enterprise-interaction-architecture.md`

That architecture establishes the runtime product model and E0-E6 implementation programme. Further vendor review should refine requirements and identify exceptions rather than repeatedly redefining the top-level interaction model.

## Completion gate

The experience benchmark is not complete merely because a vendor name is in a matrix.

For every benchmark suite:

- the top-level menu/navigation model must be inventoried;
- materially relevant submenus/work areas must be reviewed;
- object/list/workspace patterns must be captured;
- high-volume entry/import patterns must be captured;
- data/configuration/admin distinctions must be captured;
- strengths and weaknesses must be documented;
- each accepted NuBlox requirement must map to an Experience System/platform primitive;
- no vendor menu structure may be copied as NuBlox architecture without independent justification.

