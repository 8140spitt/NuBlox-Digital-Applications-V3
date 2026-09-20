# Competitive Experience Benchmark — Asset / Property / Service UX Wave 4

**Status:** detailed first pass complete; benchmark rows remain **in progress** until full menu inventories are closed  
**Date:** 19 September 2026  
**Products:** IBM Maximo Application Suite / Maximo Manage; HxGN EAM; Planon IWMS; Esri ArcGIS Field Maps / GeoBIM

## Purpose

Wave 4 tests whether the emerging NuBlox enterprise interaction model can carry a built asset from capital handover into whole-life operation without splitting the user's experience into disconnected project, asset, property, maintenance and field applications.

The focus is:

- asset identity and hierarchy;
- location / site / property context;
- maintenance planning;
- work orders;
- inspections / defects;
- dispatch / assignments;
- field/mobile operation;
- inventory / spares;
- contracts / budgets / costs;
- spatial / GIS context;
- BIM / digital-twin federation;
- high-volume operational data;
- role-based landing pages;
- administration / configuration.

The major conclusion is:

> **Asset, Location/Property and Work Order must be first-class operating contexts, while spatial maps, BIM models and mobile task views remain perspectives over the same canonical enterprise truth.**

---

# IBM Maximo Application Suite / Maximo Manage

Official evidence:

- Maximo Application Suite getting started / Suite Navigator:  
  https://www.ibm.com/docs/SSRHPA_cd/pdf/master-map.pdf
- Maximo Manage overview:  
  https://www.ibm.com/downloads/documents/us-en/10a99803ac2fd88d
- Maximo Mobile overview:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=overview-maximo-mobile
- Maximo Mobile technicians:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=started-getting-maximo-mobile-technicians
- Locations:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=locations-
- Work Centers overview:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=centers-work-overview
- Assignment status:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=overview-using-assignment-status-values
- Data import:  
  https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=data-import

## Global navigation / role model

Maximo Application Suite provides a **Suite Navigator** that exposes the applications a user is authorised to access. Current MAS documentation distinguishes suite navigation from the Start Center / role-specific application experience.

Maximo Manage then provides role-oriented experiences such as:

```text
Manage Assets
Business Analysis
Inspections
Manage Inspection Forms
Manage Inventory
Service Requests
Work Execution
Work Supervision
```

The platform also continues to support configurable Start Centers, KPIs, inbox entries and charts.

### NuBlox conclusion

NuBlox should **not** expose a suite/product switcher, but it should retain the useful concept of role-specific operational entry points.

The equivalent NuBlox pattern is:

```text
Home / My Work
  -> role-relevant contexts
  -> role-relevant queues
  -> role-relevant object collections
  -> role-relevant operational insights
```

without making the user choose between separate NuBlox products.

## Asset / location model

Maximo makes a strong distinction between:

```text
Asset
Location
System
Site
Organisation
```

Locations can belong to logical systems/hierarchies and can contain assets. Asset history follows movement and performance by location.

Maximo Mobile exposes asset details such as:

- asset number/description;
- asset hierarchy;
- classifications;
- location;
- maps;
- related records;
- serial number;
- service address;
- specifications;
- vendor information;
- meters.

### NuBlox conclusion

The UX must preserve the distinction:

```text
Asset
≠ Location
≠ Property
≠ Space
≠ System
```

while allowing users to traverse them fluidly.

NuBlox should support:

- Asset workspace;
- Location / Property workspace;
- System workspace;
- hierarchy / network browser;
- related work;
- documents / information;
- maintenance history;
- performance / condition;
- cost history.

## Work order lifecycle

Maximo's operating model makes Work Order a central execution object connected to:

- asset/location;
- job plan;
- labour/crew;
- materials;
- tools;
- services;
- assignments;
- status;
- inspections;
- failure reporting;
- actual costs.

Current Maximo Manage also tracks granular assignment/dispatch status separately from the work-order status.

### NuBlox conclusion

This strongly validates:

```text
Work Order state
≠ Assignment state
≠ Technician travel/dispatch state
```

and reinforces the NuBlox rule that assignment never implies permission/authority.

A Work Order workspace should expose:

```text
Overview
Asset / Location
Scope / Job Plan
Tasks / Activities
Assignments
Materials / Parts
Plant / Tools
Inspections
Safety / permits
Time / actuals
Costs
Documents / evidence
Failure / defect
History
```

according to work type.

## Mobile / field operation

Maximo Mobile role-based applications support:

- Technician;
- Inspections;
- Service Requests;
- Inventory Counting;
- assets;
- approvals;

with connected/offline operation.

Technicians can complete work orders and inspections in the field, capture asset information and work through assignment status.

### NuBlox conclusion

Field UX must be **task/object focused**, not a compressed desktop ERP.

The same canonical object should appear through a field-appropriate composition:

```text
Today's Work
 -> Work Order
    -> location
    -> asset
    -> steps/checklist
    -> safety
    -> readings
    -> parts/time
    -> photos/evidence
    -> completion
```

Offline synchronization is a later platform concern, but canonical identity and conflict semantics must be designed now.

## Import / integration

Maximo supports application imports, external-system imports, files, interface tables and REST APIs. IBM explicitly cautions against using synchronous application import for large datasets.

### NuBlox conclusion

The Import Workbench needs clear operating modes:

```text
small interactive import
large asynchronous import job
integration feed
migration load
field synchronization
```

with validation, job status, errors and provenance.

## Rejected Maximo patterns

Do not adopt:

- suite-level product switching as normal NuBlox navigation;
- separate UI identities for mobile vs desktop records;
- asset/location conflation;
- assignment status as domain truth for the Work Order;
- technical Maximo configuration concepts as NuBlox business semantics.

---

# HxGN EAM

Official evidence:

- Digital Work menu options / Start Center:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Digital-Work/12.2/1280387
- Start Center inbox personalization:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Requestor-User/12.2/1271034
- Start Center charts:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/12.1.0.2/1273211
- Work Orders:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/1260287
- Equipment work orders:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/12.0/1260657
- Events/work orders from equipment:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/12.1/1260846
- Batch work-order generation:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/12.0/1260381
- GIS work-order/equipment mapping:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/12.1.1/1256873
- Administration menu:  
  https://docs.hexagonali.com/r/en-US/HxGN-EAM-Help/1258373

## Start Center / menu model

HxGN EAM Digital Work exposes:

```text
Start Center
Search / Jump to Screen
Favorites
Menus
Role switching
Settings
```

The Start Center can contain:

- inbox entries;
- KPIs;
- charts;
- role-specific records.

### NuBlox conclusion

This reinforces:

```text
Home / My Work
Search
Favourites
Role/persona defaults
```

but NuBlox should not make the user jump between dozens of named screens.

## Equipment object model

HxGN EAM explicitly distinguishes:

```text
Assets
Positions
Systems
Locations
```

and lets users create or search work orders from the equipment structure.

Equipment events link directly back to Work Order records.

Linear equipment can also use from/to points.

### NuBlox conclusion

The current canonical model must surface:

- physical asset;
- installed position;
- system;
- location;
- linear/network context;

as separate but navigable business concepts.

For infrastructure, the object workspace must be able to carry:

```text
network / route
linear reference
chainage / measure
from-to segment
spatial geometry
related work/events
```

without turning GIS geometry into object identity.

## Work Orders / quick entry / batch work

HxGN EAM supports:

- full Work Order Record View;
- quick entry for work-order activities;
- multi-equipment work orders;
- batch generation of preventive work orders;
- preview before batch processing.

### NuBlox conclusion

Maintenance work requires multiple entry modes:

```text
full deliberate work-order creation
quick field/operations capture
batch generation from maintenance plans
bulk assignment / scheduling
```

The platform must choose the interaction based on the work, not force one form everywhere.

## GIS integration

HxGN EAM can search equipment/work orders on a GIS map, highlight selected records and create work orders from mapped equipment.

### NuBlox conclusion

The future **Map / Spatial Workspace** should synchronize:

```text
map selection
<-> canonical object selection
<-> work orders / inspections / incidents
```

The map is a navigation and analysis surface; the canonical object remains authoritative.

## Administration

HxGN EAM's Administration menu is broad and includes:

- organizations;
- classes;
- cost codes;
- custom fields;
- screen configuration;
- reports;
- start-center setup;
- security;
- users/groups;
- enterprise search;
- import configuration;
- mobile setup;
- work setup.

### NuBlox conclusion

This is useful evidence for what **not** to combine into one Administration bucket.

NuBlox should continue separating:

```text
Enterprise Data
Business Configuration
Experience Configuration
Security Administration
Technical Administration
```

while keeping the number of top-level destinations manageable.

---

# Planon IWMS

Official evidence:

- Planon WebHelp index:  
  https://webhelp.planoncloud.com/en/
- Fundamentals:  
  https://webhelp.planoncloud.com/en/Fundamentals/Fundamentals_2.pdf
- Navigation Panel:  
  https://webhelp.planoncloud.com/en/Navigation%20Panel/c_About_navigation_panel.html
- Order fields:  
  https://webhelp.planoncloud.com/en/Work%20assignments/r_Order_data.html

## Platform / menu breadth

Current Planon WebHelp exposes core TSIs covering areas including:

```text
Properties
Assets
Spaces
Orders
Contracts
Projects
Budgets
Invoices
Documents
Health & Safety
Assessments & Observations
BIM
CAD
Capital Projects
Reservations / workplace
Knowledge
Supporting data
```

The Navigation Panel can be configured per user group and can logically group TSIs, external content and URLs.

### NuBlox conclusion

Property/facilities users need a coherent **Operate** experience where Property / Space / Asset / Order / Contract are equally natural entry points.

NuBlox should not require facilities users to think in construction-project terminology after handover.

## Selection / elements / data / action pattern

Planon's fundamentals expose a recurring desktop pattern around:

```text
Selection levels / tabs
Elements panel
Data panel
Action panel
```

Its Orders example shows:

- record list on the left;
- selected order detail on the right;
- tabs for general information, actions/notes, SLA/costs, communications, audit and questionnaire.

### NuBlox conclusion

This supports a reusable **split Collection + Object Workspace** for high-throughput roles.

It is especially appropriate for:

- service requests;
- work orders;
- assets;
- spaces;
- leases/contracts;
- inspections;
- reservations.

## Rich order context

Planon Order data can directly reference:

- asset;
- property;
- property zone;
- rentable unit;
- reservation unit;
- contract;
- budget;
- requestor;
- trade;
- communication logs.

### NuBlox conclusion

Operational work orders/requests sit at the intersection of multiple contexts.

The UI context contract needs to handle multiple related dimensions without inventing one universal parent.

## Property / time awareness

Planon exposes concepts such as:

- lifecycle-aware fields;
- property-time awareness;
- user-time awareness.

### NuBlox conclusion

Built-environment ERP must treat **validity through time** seriously.

For selected master/configuration data we need explicit:

```text
effective from
effective to
historical state
future planned state
```

where the domain requires it, rather than overwriting current values.

## Configurable attributes

Planon supports attribute sets/definitions and attachment of attributes to assets/building elements.

### NuBlox conclusion

NuBlox needs:

```text
canonical required fields
+
governed typed extensible attributes
```

not arbitrary JSON and not schema forks for every tenant.

## Rejected Planon patterns

Do not adopt:

- TSI terminology;
- property/facilities structures as universal enterprise navigation;
- configurable attributes that bypass canonical invariants;
- one generic Order model if domain semantics require distinct Work Order / Service Request / Project Task identities.

---

# Esri ArcGIS Field Maps / GeoBIM

Official evidence:

- Field Maps overview (2026):  
  https://www.esri.com/arcgis-blog/products/field-maps/field-mobility/get-to-know-arcgis-field-maps
- Field Maps tasks:  
  https://doc.arcgis.com/en/field-maps/12.1/prepare-maps/prepare-tasks.htm
- Field Maps forms/offline:  
  https://www.esri.com/arcgis-blog/products/field-maps/field-mobility/configure-maps-for-the-field
- GeoBIM overview:  
  https://doc.arcgis.com/en/geobim/latest/get-started/an-introduction-to-arcgis-geobim.htm
- GeoBIM project workflow:  
  https://doc.arcgis.com/en/geobim/latest/create/geobim-projects.htm
- GeoBIM apps:  
  https://doc.arcgis.com/en/geobim/latest/create/create-apps-for-your-project.htm
- GeoBIM issue creation:  
  https://doc.arcgis.com/en/geobim/12.0/engage/create-an-issue.htm
- July 2026 GeoBIM release notes:  
  https://doc.arcgis.com/en/geobim/latest/get-started/release-notes-for-arcgis-geobim.htm

## Field Maps model

Current Field Maps combines:

```text
Map
Data collection
Forms
Tasks
Inspections
Location awareness
Geofences
Offline work
Indoor work
```

Field Maps Designer configures maps/forms/tasks for deployment to mobile workers.

Tasks can represent inspection, repair or data-collection work and appear as an actionable to-do list in the mobile app.

### NuBlox conclusion

Spatial/field work needs a purpose-built **Map Workspace** and **Field Work experience**, but should reuse canonical NuBlox Work Items / Work Orders where NuBlox is authoritative.

A map feature must not silently become a second asset/work-order master.

## Smart forms

Field Maps smart forms support:

- grouped fields;
- input types;
- conditional visibility;
- configured field experience;
- deployment to mobile.

### NuBlox conclusion

The Object Form system should support conditional/progressive data capture driven by:

- object type;
- work type;
- status;
- context;
- permissions;
- previous answers;

without making every form an arbitrary tenant-scripted application.

## Offline / field-first operation

Field Maps supports offline maps and workflows.

### NuBlox conclusion

A later NuBlox offline architecture will need:

```text
offline package
canonical IDs
local changes
sync
conflict detection
authority revalidation
evidence preservation
```

The present architecture should avoid assumptions that require permanent connectivity for object identity or work completion.

## GeoBIM project model

GeoBIM exposes a Projects page and Project Manager with:

```text
Accounts
Tools
Links
Apps
Maps
```

and integrates:

- GIS;
- BIM/project documents;
- issues;
- schedules;
- maps/scenes;
- Field Maps.

Current GeoBIM can show map/table/details/viewer side by side.

### NuBlox conclusion

This strongly supports the **Viewer / Spatial Workspace**:

```text
Map / 3D scene
+ Table / register
+ Object details
+ Related information
+ Issues / work
```

with synchronized selection.

## GeoBIM federation

GeoBIM explicitly links Autodesk project documents/issues into geospatial project context and can synchronize or create issues across the integration.

### NuBlox conclusion

NuBlox should support external authoritative sources through explicit federation/integration identities.

Example:

```text
NuBlox canonical Asset
  -> GIS feature link
  -> BIM element link
  -> external CDE document link
  -> IoT/sensor source link
```

rather than importing every external representation as a duplicate master record.

## Current 2026 processing/history pattern

The July 2026 GeoBIM release adds pre-sync analysis and improved processing-history/error information.

### NuBlox conclusion

Integration/import jobs need user-visible:

- preflight analysis;
- job parameters;
- status;
- history;
- error report;
- rerun/retry;
- source/target provenance.

---

# Cross-suite conclusions from Asset / Property / Service Wave 4

## Pattern AD — Asset and Location/Property are both first-class contexts

Maximo, HxGN EAM and Planon all make physical/operational context central.

### NuBlox decision

Add first-class:

```text
Asset Context
Property / Site Context
Location / Space Context
System / Network Context
```

where relevant.

These contexts complement Project and Contract; they do not replace them.

## Pattern AE — Work Order is a major object workspace

Across Maximo, HxGN EAM and Planon, Work Orders/Orders connect asset/location, people, cost, material, inspection and evidence.

### NuBlox decision

The Work Order object needs a canonical workspace rather than being implemented as a form buried under an Asset or Maintenance function.

## Pattern AF — field/mobile UX is a composition, not another data model

Maximo Mobile and Field Maps both adapt the interaction to field execution.

### NuBlox decision

Desktop, tablet and mobile must share:

- object identity;
- authority;
- lifecycle;
- evidence;
- history;

while allowing very different presentation and interaction.

## Pattern AG — map and spatial context is a first-class interaction surface

HxGN EAM + GIS, Field Maps and GeoBIM show that location cannot be a decorative map widget in infrastructure/facilities operations.

### NuBlox decision

Add **Map / Spatial Workspace** to the Experience System.

It should support:

- map/scene selection;
- object synchronization;
- spatial search/filter;
- linear/network context;
- task/work overlays;
- inspections/incidents;
- field capture;
- offline preparation;
- related model/document context.

## Pattern AH — one asset may participate in several hierarchies

Maximo supports location systems; HxGN distinguishes assets/positions/systems/locations; Planon has property/space/asset structures; Esri adds spatial/network relationships.

### NuBlox decision

Avoid one universal "asset tree".

Support explicit structures such as:

```text
Physical assembly hierarchy
Functional system hierarchy
Location containment
Network/linear topology
Maintenance route
Property/space hierarchy
```

and mappings among them.

## Pattern AI — field work creates high-value evidence

Inspections, readings, calibration, photos, defects, completion information and actual usage are not incidental attachments.

### NuBlox decision

Field evidence must be first-class and attributable:

```text
who
when
where
device / source where relevant
subject/version
measurement
photo/file
inspection result
signature/attestation where required
```

## Pattern AJ — maintenance planning and execution must remain distinct

PM plans generate Work Orders; Work Orders execute work; assignments dispatch people; inspections capture results.

### NuBlox decision

Keep:

```text
Maintenance Strategy / Plan
 -> Maintenance Schedule / Due Work
 -> Work Order
 -> Assignment
 -> Execution
 -> Inspection / Result
 -> Failure / defect / follow-up
 -> cost/history
```

as linked but separate semantics.

## Pattern AK — enterprise context changes after capital handover

The dominant context during delivery may be Project/Contract/Site. During operation it becomes Property/Location/System/Asset/Service.

### NuBlox decision

The shell should not hard-code Project as the universal container.

The Context selector must support the user's operating mode and lifecycle stage.

---

# Updated context model

After Waves 1–4, NuBlox should treat context as a typed platform concept:

```text
Enterprise Context
│
├── Legal Entity
├── Organisation Unit
├── Portfolio / Programme
├── Project
├── Contract
├── Site / Property
├── Space / Location
├── System / Network
└── Asset
```

A user's current work may involve several of these simultaneously.

The shell should display only the dimensions materially relevant to the current journey.

---

# Updated platform primitives

The benchmark now supports the following foundation:

1. Stable Global Shell
2. Role/persona-aware Home
3. My Work
4. Operate
5. Deliver
6. Enterprise Data
7. Enterprise Context Contract
8. Context Selector / Context Bar
9. Project / Contract / Asset / Property / Site workspaces
10. Runtime Object Registry
11. Canonical object routes
12. Enterprise Search
13. Recent / Favourites
14. Saved Views
15. Collection View
16. Enterprise Grid
17. Structure Browser
18. Object Workspace
19. Workspace / Cockpit composition
20. Context / Utility Panel
21. Viewer Workspace
22. Map / Spatial Workspace
23. Import Workbench
24. Product / Item Workspace
25. Work Order Workspace
26. Enterprise Change Workspace
27. Global + contextual My Work
28. Task Bar working contexts
29. Field / Mobile composition
30. Business Configuration
31. Technical Administration
32. consistent denied / not-found / conflict states.

---

# Updated lifecycle model for the built environment

The experience now has to support continuity across:

```text
Need
 -> Opportunity
 -> Bid / Estimate
 -> Contract
 -> Project / Design / Procurement / Construction
 -> Commissioning
 -> Handover
 -> Property / Site / System / Asset
 -> Maintenance / Service
 -> Renewal / Change
 -> Decommission / Disposal
```

The context changes.

The canonical enterprise identity and evidence chain must not break.

---

# Next benchmark wave

The final specialist experience wave should review:

- Salesforce;
- Deltek Vantagepoint;
- Diligent One;
- Oracle NetSuite;
- Unit4.

The focus is:

- CRM/account object interaction;
- list/split/console patterns;
- professional-services project accounting;
- governance / board / risk work;
- role-centre ERP;
- people/project-centric enterprise work;
- personalization;
- saved views;
- executive / management oversight.

After that wave, the experience benchmark should be consolidated into a **NuBlox Enterprise Interaction Architecture** and an implementation sequence before major runtime refactoring begins.
