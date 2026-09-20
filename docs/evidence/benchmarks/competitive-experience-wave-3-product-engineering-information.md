# Competitive Experience Benchmark — Product / Engineering / Information Lifecycle UX Wave 3

**Status:** detailed first pass complete; benchmark rows remain **in progress** until full menu inventories are closed  
**Date:** 19 September 2026  
**Products:** PTC Windchill 13.1.2; Siemens Teamcenter / Active Workspace; Dassault Systèmes 3DEXPERIENCE / ENOVIA; Bentley ProjectWise / iTwin

## Purpose

Wave 3 tests whether the emerging NuBlox enterprise shell can handle deep product, engineering and controlled-information work without collapsing back into function-local pages.

The focus is:

- product/item identity;
- object information pages;
- product structures / BOM;
- classification;
- configuration / effectivity;
- revision and maturity;
- engineering change;
- working context / working copy;
- controlled information;
- digital thread / twin;
- search;
- high-volume structure editing;
- administration and extensibility.

The major conclusion is:

> **The same NuBlox shell remains viable, but Product & Item, Information, Engineering Structures and Change require first-class platform primitives rather than ordinary forms.**

---

# PTC Windchill 13.1.2

Official evidence:

- Help Center:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/WHCCategories.html
- Product Context:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/contexts/ContextsProductsAbout.html
- Part Structure:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/prodstructure/PMStructureTabAbout.html
- Product Family:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/prodfamily/ProdFamilyOview.html
- Search Results:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/search/LclSrchResults.html
- Search Preferences:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/search/LclSrchUserPrefSet.html
- Site Utilities:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/siteadmin/SiteAdminUtilAbout.html
- Change Management domain:  
  https://support.ptc.com/help/windchill/r13.1.2.0/en/Windchill_Help_Center/reqmgmt/RMChangeMgmtDM.html

## Product Context

Windchill Product Context brings together:

- product-related business objects;
- storage;
- access rules;
- templates;
- teams/roles;
- default lifecycles;
- default workflows;
- default preferences.

### NuBlox conclusion

NuBlox **Context** must be able to collect:

```text
Project
Product / Item family
Contract
Asset
Property / Site
Programme
```

plus relevant defaults/configuration without changing canonical identity.

A context is:

> a governed operating scope over objects, people, rules and views.

It is not a duplicate master.

## Part information / structure interaction

Windchill Part Structure combines:

```text
Object identity
Actions toolbar
Current configuration/filter
Structure tree
Selected-node details
Classification
Uses
Occurrences
Visualization
Documents
Parameters
Constraints
Configurable relationships
```

Actions include:

- revise;
- insert;
- delete;
- edit relationship attributes;
- check out / check in / undo checkout;
- copy/paste;
- create/add related objects;
- filtered/configured structure viewing.

### NuBlox conclusion

**Product Structure Browser** becomes a platform-grade requirement.

It must support:

- tree/structure navigation;
- selected-node details;
- parent/child relationship attributes;
- occurrence-level data;
- classification;
- product characteristics;
- related information;
- visualization;
- version/configuration context;
- add/reuse/replace/remove;
- bulk authoring;
- comparison.

An ordinary table or nested form is insufficient.

## Product families / variants

Windchill explicitly models:

```text
Product Family
  -> Product Model Grouping
     -> Product Model
        -> Variant Specification
```

and makes family members searchable and context-governed.

### NuBlox conclusion

Our existing configurable-product semantics need a usable runtime covering:

```text
Item
Product Family
Configuration Model
Characteristics
Rules
Variant / Resolved Configuration
Effectivity
```

without turning every configured instance into an ungoverned item duplicate.

## Search

Windchill search supports:

- global search;
- advanced search;
- type filtering;
- object-specific results;
- facets;
- classification;
- related-object search;
- result-table bulk actions;
- version filtering;
- saved/user preferences.

### NuBlox conclusion

Enterprise Search must include:

```text
type
classification
context
status/maturity
version
relationship
attribute facets
```

and must be equally useful for product, project, commercial and enterprise records.

## Change

Windchill exposes distinct change objects including:

- Problem Report;
- Change Request;
- Change Notice;
- Change Task;
- Review;
- Variance.

### NuBlox conclusion

NuBlox must provide an **Enterprise Change Framework** with typed domain change objects rather than one generic workflow.

The architecture should preserve:

```text
problem / issue
 -> requested change
 -> impact
 -> authorised change
 -> implementation work
 -> verification
 -> effective result
```

while specialist domain objects retain ownership.

## Administration

Windchill Site Utilities explicitly distinguishes:

- System Administration;
- Business Administration;
- Auditing Administration.

Business administration includes:

- business rules;
- classification;
- numbering;
- workflow templates;
- preference management;
- lifecycle-related utilities.

System administration includes infrastructure, queues, fileservers and technical services.

### NuBlox conclusion

This validates the emerging split:

```text
Enterprise Data
Business Configuration
Technical Administration
Audit / Governance
```

---

# Siemens Teamcenter / Active Workspace

Official evidence:

- Active Workspace strategy:  
  https://blogs.sw.siemens.com/teamcenter/teamcenter-active-workspace-strategy/
- structure navigation:  
  https://blogs.sw.siemens.com/teamcenter/navigate-active-workspace/
- structure authoring:  
  https://blogs.sw.siemens.com/teamcenter/product-structures-teamcenter/
- structure management:  
  https://blogs.sw.siemens.com/teamcenter/teamcenter-structure-management/
- current change-management overview:  
  https://blogs.sw.siemens.com/teamcenter/product-change-management-plm/
- Teamcenter Change Management fact sheet:  
  https://blogs.sw.siemens.com/wp-content/uploads/sites/14/2023/11/Siemens-SW-Teamcenter-Change-Management-Fact-Sheet.pdf

## Active Workspace philosophy

Siemens positions Active Workspace as the strategic browser-based Teamcenter experience and as an interface intended for broad enterprise participation beyond traditional PLM users.

Common interaction concepts include:

- search;
- product structures;
- configuration context;
- object views;
- change;
- workflow;
- visual collaboration;
- use inside engineering authoring tools.

### NuBlox conclusion

The application must support both:

```text
full NuBlox browser experience
+
embedded / contextual enterprise services in specialist tools
```

Longer term this matters for Revit, Tekla, Civil 3D, Primavera, Excel and field applications.

## Structure discovery / navigation

Active Workspace can:

- search for structures;
- open an assembly directly into structure view;
- restore last-used structure view/configuration;
- open saved configurations/sessions;
- filter structures for specific tasks;
- retain product configuration context.

### NuBlox conclusion

A complex object should remember relevant **working view state** without changing canonical object state.

Examples:

- saved BOM view;
- asset hierarchy filter;
- WBS view;
- information register view;
- project commercial view.

These belong to Saved Views / working contexts.

## Structure authoring

Teamcenter provides particularly strong high-volume interaction patterns:

- Excel structure import;
- interactive property-column mapping;
- preview before import;
- structure duplication;
- clone/reuse/remove choices;
- keyword search;
- favourites;
- classification search;
- split-view comparison/reuse;
- drag/drop between structures;
- inline structure authoring;
- add/remove/replace;
- insert/remove hierarchy levels;
- bulk edit.

### NuBlox conclusion

This materially raises the target for **Enterprise Grid + Structure Browser + Import Workbench**.

Product data, WBS, asset hierarchies, document structures and other large structured data need:

```text
import
mapping
preview
reuse
split view
inline edit
bulk edit
classification lookup
drag/drop where semantically safe
```

## Multi-domain structures

Teamcenter Structure Management supports multiple distinct structure types including:

- systems/requirements/logical/physical;
- EBOM;
- formula BOM;
- configuration families/features;
- prototype/cost BOM;
- MBOM;
- Bill of Equipment;
- Bill of Process;
- plant-specific manufacturing structures;
- Service BOM;
- service parts/tools.

### NuBlox conclusion

Do **not** create one universal hierarchy.

The NuBlox Experience System must support many governed structures and explicit relationships/mappings between them:

```text
Product structure
Engineering system structure
Project WBS
Cost structure
Asset hierarchy
Organisation hierarchy
Information structure
Schedule hierarchy
```

## Product change

Current Teamcenter change-management positioning includes:

- impact analysis;
- rules-based workflow;
- BOM tracking / red-line changes;
- concurrent changes;
- merging;
- affected parts/assemblies;
- manufacturing/resource/project impacts;
- auditable traceability;
- right-sized change processes.

### NuBlox conclusion

Change should expose **impact graph + proposed state + realised state**, not merely an approval form.

A future NuBlox Change Workspace should show:

```text
Driver
Affected objects
Relationships / downstream impact
Proposed changes
Impact assessments
Cost / programme / risk
Approvals / decisions
Implementation
Realised changes
Evidence
```

---

# Dassault Systèmes 3DEXPERIENCE / ENOVIA

Official evidence:

- Compass:  
  https://help-3dexperience.aesvietnam.com/English/EXP3DBasicsUserMap/exp3dbasics-c-Compass.htm
- Apps:  
  https://help-3dexperience.aesvietnam.com/English/EXP3DBasicsUserMap/exp3dbasics-c-Apps.htm
- Roles:  
  https://help-3dexperience.aesvietnam.com/English/EXP3DBasicsUserMap/exp3dbasics-c-Roles.htm
- Platform Management:  
  https://help-3dexperience.aesvietnam.com/English/EXP3DBasicsAdminMap/exp3dbasicsadmin-c-ov.htm
- current Change Manager getting started:  
  https://3dswym.3dexperience.3ds.com/wiki/enovia-user-community/change-manager-chg-oc-getting-started_IRZOFFVsSbeG-udUTtSxrA
- current 3D Product Architect getting started:  
  https://3dswym.3dexperience.3ds.com/wiki/enovia-user-community/3d-product-architect-pau-oc-getting-started_1sVX9UraRpyUCpUes7b2qA
- recent Change Manager UX:  
  https://3dswym.3dexperience.3ds.com/wiki/3dexperience-platform-user-s-community/enovia-change-manager_bJeleenZS0eBd0x2zdM2Mg

## Role / app / dashboard model

3DEXPERIENCE centres global discovery around the **Compass**:

```text
Platform
 -> Role
    -> Apps
       -> Dashboard / native / web experience
```

Users can:

- see assigned roles/apps;
- request roles;
- favourite apps;
- launch dashboard/native/web apps;
- work across dashboard tabs/widgets;
- switch platform where applicable.

### NuBlox conclusion

Role-aware packaging is useful, but NuBlox should expose less product/app packaging.

Use persona/role to curate:

- Operate;
- Deliver;
- Enterprise Data;
- My Work;
- favourite contexts;
- common actions.

Do not make users understand internal capability packaging.

## Product Structure Editor

Current 3D Product Architect material identifies Product Structure Editor for creating, deriving and manipulating product structures without requiring CAD, alongside 3D Compose and collaboration-package capabilities.

### NuBlox conclusion

Product data must be operable independently from design-authoring tools.

An estimator, buyer, product manager, engineer or asset manager should be able to work with Item/Product structures without needing CAD software.

## Change Manager

Current 3DEXPERIENCE Change Manager is based on:

- Change Requests;
- Change Orders;
- Change Actions;
- cross-domain evaluation;
- assignments;
- approval status;
- search inside tabs/widgets;
- customized table views;
- impact analysis;
- digital approvals;
- proposed vs realised changes.

### NuBlox conclusion

This strongly reinforces an **object-centric Change Workspace** with table/relationship/impact views rather than a linear workflow wizard.

## Dashboards / widgets

3DEXPERIENCE allows apps to appear as dashboard widgets/tabs and uses role-oriented dashboards.

### NuBlox caution

Do not reproduce a widget-first product shell.

Use composable widgets/cards only for:

- attention;
- insights;
- lightweight control;

while durable work remains in canonical object/structure/grid surfaces.

## Platform Management

Platform management separates member/role/app/platform administration from normal product work.

### NuBlox conclusion

Technical administration should remain distinct from Product & Item enterprise data and Product/Engineering business configuration.

---

# Bentley ProjectWise / iTwin

Official evidence:

- ProjectWise Web/Drive help index:  
  https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0020595
- ProjectWise Explorer help index:  
  https://bentleysystems.service-now.com/community?id=kb_article_view&sysparm_article=KB0020585
- ProjectWise product overview:  
  https://www.bentley.com/products/projectwise
- ProjectWise Design Review:  
  https://www.bentley.com/wp-content/uploads/pds-projectwise-design-review-ltr-en-hr.pdf
- ProjectWise / iTwin product data:  
  https://www.bentley.com/wp-content/uploads/pds-projectwise-itwin-ltr-en-lr.pdf
- iTwin Platform overview:  
  https://developer.bentley.com/itwinplatform/
- iTwin Review APIs:  
  https://developer.bentley.com/api-groups/project-delivery/
- Digital Twin Management:  
  https://developer.bentley.com/api-groups/data-management/

## ProjectWise work areas / information management

ProjectWise help exposes:

```text
Projects / Work Areas
Folders
Documents
Versions
Renditions
Document Sets
Search
Saved Searches
Workflows
States
Views / property columns
Integrated applications
Spatial tools
Dependencies
Excel export/import
Administration
```

### NuBlox conclusion

The Information Management experience requires distinct primitives for:

- Information Register;
- Work Area / Project Context;
- document/info-tree view;
- saved search;
- revision/version timeline;
- workflow/state;
- rendition/representation;
- sets/packages;
- dependencies;
- Excel data movement.

This cannot be implemented as a generic file browser.

## Work Areas

Bentley describes Work Areas as project identifiers that help locate/manage project content, improve team coordination and hold predefined metadata.

### NuBlox conclusion

This reinforces Project Context plus context metadata, but NuBlox must retain the stronger distinction:

```text
Project identity
≠ information work area/folder structure
```

## Digital design delivery

Current ProjectWise positioning extends beyond file-based WIP toward:

- digital design delivery;
- portfolio intelligence;
- data governance;
- engineering WIP;
- federated multi-discipline data;
- digital twins;
- component libraries;
- automated digital deliverables.

### NuBlox conclusion

Controlled Information should evolve from “documents” toward:

```text
Information Container
Representation
Engineering data
Model
Component library
Issue / design review
Digital deliverable
Federated twin context
```

without making the digital twin another Asset master.

## iTwin

iTwin provides:

- federation across Bentley and third-party engineering sources;
- model/digital-twin versions;
- changed-element comparison;
- issues;
- field data;
- visualization;
- spatial alignment;
- audit trails;
- digital-twin management;
- saved views/scenes;
- sensors/reality data.

### NuBlox conclusion

The NuBlox Asset/Digital Twin model should support a **federation workspace** over canonical:

- Asset;
- System;
- Site/Property;
- Information;
- IoT/sensor evidence;
- inspections;
- work orders;
- engineering changes;

rather than duplicating physical truth inside the twin.

---

# Cross-suite conclusions from Product / Engineering Wave 3

## Pattern V — product/item data is operational enterprise data

All four suites treat product/engineering information as a major operational domain, not back-office administration.

### NuBlox decision

**Products & Items** must become a first-class Enterprise Data area.

It should expose:

```text
Item identity
Description
Classification
Characteristics
UoM
Manufacturer/supplier references
Structures
Configurations
Variants
Technical information
Documents/models
Lifecycle
Revision
Substitutes
Approved sources
Environmental data
Service data
History
```

according to object type/permissions.

## Pattern W — structures require their own UX grammar

Windchill and Teamcenter are decisive here.

### NuBlox decision

Add a **Structure Browser** primitive supporting:

- hierarchy;
- occurrence/relationship data;
- node details;
- filtering/configuration;
- visualization;
- inline edits;
- comparison;
- saved views;
- bulk authoring;
- import;
- reusable component lookup.

## Pattern X — configuration context is not the same as object version

PLM products distinguish:

- revision;
- lifecycle/maturity;
- configuration/effectivity;
- view/filter;
- occurrence;
- variant.

### NuBlox decision

The runtime must never collapse these into one generic “version” field.

Object Workspace needs separate handling for:

```text
Identity
Revision/version
Lifecycle state
Configuration/effectivity
Working view
```

where applicable.

## Pattern Y — change is a cross-object operating context

Windchill, Teamcenter and 3DEXPERIENCE all make change a durable object/process with affected objects, impact, implementation and evidence.

### NuBlox decision

Create an **Enterprise Change Workspace** pattern rather than implementing change separately inside every function.

Domain-specific change objects remain distinct where required, but all can participate in a common interaction grammar.

## Pattern Z — information representations are not product/asset identity

Windchill and ProjectWise strongly reinforce:

```text
Part / Item / Asset / Project
≠
Document / CAD / model / file
```

### NuBlox decision

Keep the existing canonical separation and make it obvious in UX.

## Pattern AA — high-volume product authoring needs import + preview + bulk edit

Teamcenter's Excel structure import and preview, Windchill structure operations and ProjectWise Excel tooling reinforce this.

### NuBlox decision

The Import Workbench must be a platform service supporting:

```text
source
 -> map
 -> validate
 -> preview
 -> exceptions
 -> governed commit
 -> provenance
```

for Product, Project, Asset, Commercial and Finance datasets.

## Pattern AB — integrated specialist-tool participation matters

Teamcenter integrates Active Workspace into design tools; ProjectWise integrates with engineering apps; iTwin federates multiple authoring sources.

### NuBlox decision

NuBlox should ultimately expose context/object services to specialist authoring environments rather than requiring all engineering activity to happen in the browser.

## Pattern AC — visualization belongs beside structured data

Windchill part structure + visualization, 3DEXPERIENCE 3D product work and iTwin all pair object/structure semantics with visual models.

### NuBlox decision

The Experience System needs a **Viewer Workspace** that can synchronize selection with:

- structure;
- object;
- issue;
- asset;
- information;
- spatial/location data.

The viewer must never become the canonical data model.

---

# Updated Enterprise Interaction Foundation

Across Enterprise Waves 1A/1B, Construction Wave 2 and Product/Engineering Wave 3, the required foundation is now:

1. stable global shell;
2. role/persona-aware Home;
3. My Work;
4. Operate;
5. Deliver;
6. Enterprise Data;
7. Context model;
8. Project / Programme / Contract / Site / Asset contexts;
9. runtime Object Registry;
10. canonical object routes;
11. Enterprise Search;
12. Recent / Favourites;
13. Saved Views;
14. Collection View;
15. Enterprise Grid;
16. Structure Browser;
17. Object Workspace;
18. Workspace/Cockpit composition;
19. Context/Utility Panel;
20. Viewer Workspace;
21. Import Workbench;
22. Product/Item workspace;
23. Enterprise Change Workspace;
24. global + contextual Work views;
25. Task Bar working contexts;
26. Business Configuration;
27. Technical Administration;
28. consistent denied/not-found/conflict handling.

## Important architectural guardrail

The benchmark does **not** alter the frozen aggregate rule:

> One screen may traverse, compare and coordinate many aggregates. One command still changes one owning aggregate boundary unless an explicitly governed architecture change says otherwise.

The experience may be integrated without making the transaction model monolithic.

---

# Updated top-level IA hypothesis

```text
NuBlox
│
├── Home
├── My Work
│
├── Operate
├── Deliver
├── Enterprise Data
│   ├── Organisations / Parties
│   ├── Customers / Suppliers
│   ├── Products & Items
│   ├── Resources / Plant
│   ├── Assets / Systems
│   ├── Finance Structures
│   ├── Classifications
│   └── Reference Data
│
├── Contexts
│   ├── Projects
│   ├── Programmes
│   ├── Contracts
│   ├── Sites / Properties
│   └── Assets
│
├── Search
├── Recent / Favourites
│
├── Business Functions
│   └── F01–F29
│
├── Business Configuration
└── Administration
```

This remains provisional until the asset/property/service and specialist waves are complete.

## Next benchmark wave

The next review should challenge asset, property and service operations across:

- IBM Maximo Application Suite;
- HxGN EAM;
- Planon;
- Esri ArcGIS / Field Maps / GeoBIM.

The central question is:

> Can the same NuBlox context/object model support Asset, Location, Property, Maintenance, Work Order, Inspection, Spatial and Field operations from capital handover through whole-life operation?
