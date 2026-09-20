# NuBlox Enterprise Interaction Architecture

**Status:** governing product/runtime architecture  
**Established:** 19 September 2026  
**Applies to:** tenant shell, Home/My Work, Operate/Deliver, Enterprise Data, F01-F29, canonical object runtime, project/contract/asset contexts and all new operational UI  
**Supersedes:** the assumption that F01-F29 are the sole primary navigation model  
**Preserves:** frozen canonical aggregate ownership, one-aggregate command rules and the object-centric runtime decision

## Executive decision

NuBlox is an **end-to-end enterprise operating system for construction and the built environment**.

The application must therefore model how an enterprise:

1. **operates itself**;
2. **delivers outcomes**;
3. **defines and governs the enterprise data** consumed by both.

The 29 enterprise functions remain the governed capability architecture, but they are **not the only user-facing navigation axis**.

Canonical business objects remain the persistent unit of record/work, but object-centricity alone is also insufficient. Users need role, process and operating context.

Role/persona support is now governed through the [Job-to-Work-Product Architecture](../product/job-to-work-product-architecture.md): the product must enable people to perform the work expected from their Position/Job Profile and produce the corresponding work products without creating role-specific data silos.

The governing interaction hierarchy is now:

```text
Tenant / Enterprise
        |
Person / Position / Job Profile
        |
Job Workbench + My Work
        |
Enterprise Context
        |
Operate / Deliver / Enterprise Data
        |
Process / Function / Context Workspace
        |
Collection / Grid / Structure / Map / Viewer
        |
Canonical Object
        |
Action / Decision / Change / Evidence
        |
History / Business Events / Audit
```

This hierarchy is informed by the cross-suite experience benchmark across 29 enterprise, construction, PLM, EAM and specialist platforms. Vendor menus do not become NuBlox architecture; convergent user needs become reusable NuBlox primitives.

---

# 1. The three enterprise streams

## 1.1 Operate the Business

Operate represents the persistent machinery required to govern and sustain the enterprise.

Representative areas:

```text
Strategy / objectives
Governance / authority
Enterprise / legal structure
Organisation / people
Finance / treasury / tax
Risk / compliance / legal
QHSE assurance
Technology / data / cyber
Knowledge / records
Performance
Transformation / improvement
```

Operate answers questions such as:

- what are we trying to achieve?
- how is the enterprise structured?
- who is accountable?
- who has authority?
- what resources/competencies exist?
- what is the enterprise financial position?
- what risks/controls apply?
- how is performance changing?

Operate is not "back office". It contains first-class business work and canonical objects.

## 1.2 Deliver the Business

Deliver represents the chain by which market/client need becomes delivered and operated built-environment outcomes.

Representative chain:

```text
Need / market
 -> Lead
 -> Opportunity
 -> Pursuit / Bid
 -> Estimate
 -> Tender / Proposal
 -> Contract
 -> Mobilisation
 -> Programme / Project
 -> Design / Information
 -> Procurement
 -> Construction / Delivery
 -> Commercial / Change
 -> Testing / Commissioning
 -> Handover
 -> Asset / Service
```

Deliver answers:

- what are we trying to win?
- what have we committed to deliver?
- for whom and under which contract?
- what is the programme?
- what is designed/procured/built?
- what has changed?
- what is the cost/value/forecast?
- what do we owe / what are we owed?
- what is being handed over?

## 1.3 Enterprise Data

Enterprise Data is the shared operational data foundation underneath Operate and Deliver.

It is explicitly **not Technical Administration**.

Primary families include:

```text
Party / Person / Organisation
Customer / Supplier / Subcontractor / Partner
Product / Item / Material / Service
Resource / Labour / Plant / Equipment
Asset / System
Organisation structures
Finance structures
Classifications
Reference Data
Rates / terms / calendars where governed as shared business data
```

Users maintaining supplier, product, item, rate, resource, asset or classification data are performing enterprise business work.

---

# 2. Enterprise context

## 2.1 Context answers "where does this work belong?"

NuBlox must support typed operating context including:

```text
Tenant
Legal Entity
Organisation Unit
Portfolio
Programme
Project
Contract
Site / Property
Space / Location
System / Network
Asset
```

Not every object uses every dimension.

A context is not a universal parent and must not create duplicate master data.

## 2.2 Context contract

The runtime must expose a common **Enterprise Context Contract** that can carry, where relevant:

- tenant identity;
- legal entity;
- organisation unit;
- programme/portfolio;
- project;
- contract;
- site/property;
- location/space;
- system/network;
- asset;
- originating process/function;
- current canonical object.

The contract must pass identity/context only. Domain truth remains in owning services.

## 2.3 Context persistence

Context should survive navigation where semantically valid.

Example:

```text
Project P-1048
 -> Commercial
 -> Programme
 -> Procurement
 -> Finance
 -> Information
```

The selected project remains visible/active.

If a view cannot legitimately operate in that context, the UI must make the context transition explicit.

## 2.4 Context selector / context bar

A persistent context surface must answer:

> Where am I operating?

It should display only material context dimensions rather than every possible dimension.

Example:

```text
NuBlox Group > Construction Ltd > Project P-1048 > Contract C-1042
```

Users must not accidentally perform high-impact work under the wrong legal entity/project/contract.

---

# 3. Final top-level information architecture

The tenant shell should converge toward:

```text
Home
My Work

Operate
Deliver
Enterprise Data

Contexts
  Projects
  Programmes
  Contracts
  Sites / Properties
  Assets

Enterprise Search
Recent
Favourites

Business Functions
  F01-F29

Business Configuration
Administration
```

This is an information-architecture contract, not a demand that every destination appear permanently expanded in the sidebar.

Responsive and persona-aware navigation may group or progressively disclose items.

## 3.1 Role of F01-F29

The 29 functions remain:

- canonical capability architecture;
- responsibility/accountability mapping;
- full enterprise function directory;
- function workspace destinations;
- organisational/reporting lenses;
- architecture/coverage authority.

They are no longer the sole everyday way to traverse the product.

## 3.2 Role/persona curation

Role/persona may influence:

- Home content;
- default navigation;
- visible workspaces;
- default saved views;
- favourite/recent emphasis;
- common actions.

Role/persona must not:

- become object identity;
- substitute for permission;
- substitute for delegated authority;
- create separate copies of enterprise truth.

---

# 4. Home and My Work

## 4.1 Home

Home answers:

> What matters to me now, and where should I go?

Home may contain:

- urgent attention;
- summary of My Work;
- active/recent contexts;
- favourite objects/workspaces;
- relevant process/workspace entry points;
- concise operational insight;
- announcements where enterprise-relevant.

Home must not be:

- architecture metrics;
- a complete F01-F29 directory;
- a wall of generic cards;
- a duplicate object database.

## 4.2 My Work

My Work answers:

> What am I responsible for?

My Work must evolve to support:

- default views;
- saved views;
- urgent;
- overdue;
- delegated;
- blocked/escalated;
- context grouping;
- object/process grouping;
- completed/recent history;
- governed batch actions where each subject independently passes authority/invariants.

Work Items resolve to canonical subjects.

Assignment remains separate from permission, responsibility and delegated authority.

---

# 5. Canonical object runtime

## 5.1 Stable identity

Canonical object route:

```text
/{tenant}/app/objects/{objectType}/{objectId}
```

The object ID is immutable route identity.

Business reference is display identity and search input, not canonical route identity.

Originating function/process/context may be retained separately.

## 5.2 Runtime Object Registry

Each runtime object type must define:

- stable runtime key;
- canonical model ID;
- owning aggregate ID;
- display names;
- reference/title/status projection;
- read permission;
- href builder;
- resolver;
- supported workspace sections;
- relationship providers;
- version/revision semantics;
- supported work/decision/evidence participation.

The registry is a resolution/presentation contract, never a duplicate business-data store.

## 5.3 Object Workspace grammar

Shared section vocabulary:

```text
Overview
Details
Relationships
Work
Decisions
Information / Evidence
Versions / Revisions
History
Domain-specific perspectives
```

Not every object renders every section.

Object Header is the shared identity surface.

---

# 6. Workspace model

A **Workspace** is a perspective over work and objects.

It may aggregate:

- attention;
- counters;
- filtered collections;
- exceptions;
- insights;
- process navigation;
- common actions.

It does not own domain truth.

Primary workspace types:

- Operate workspace;
- Deliver workspace;
- function workspace;
- Project workspace;
- Contract workspace;
- Asset/Property workspace;
- process workspace;
- specialist workbench.

## 6.1 Project Workspace

Representative perspectives:

```text
Overview
My Project Work
Commercial
Programme
Procurement
Finance
Information
Design
Site
QHSE
Resources
Risk
Handover
History
```

These are projections/entry points over canonical objects.

## 6.2 Contract Workspace

Representative perspectives:

```text
Overview
Parties / obligations
Correspondence
Notices
Early Warnings / Risk
Instructions
Changes
Quotations
Programme submissions
Applications / Valuations / Payments
Decisions
Information / Evidence
History
```

Contract regime/configuration may shape available views and actions.

## 6.3 Asset / Property Workspace

Representative perspectives:

```text
Overview
Hierarchy / systems
Location / spatial
Condition
Maintenance
Work
Inspections
Materials / spares
Costs
Documents / information
History
```

---

# 7. Collection View

Collection View is the reusable grammar for finding, comparing and triaging canonical records.

It must support, as applicable:

- governed default views;
- personal Saved Views;
- team/shared views;
- columns;
- filter;
- sort;
- grouping;
- search-in-view;
- bulk selection/action;
- row actions;
- lifecycle/status;
- context filter;
- direct canonical object links;
- export;
- display modes.

Supported display modes may include:

```text
Table
Split
Board/Kanban where semantically valid
Tile where visual browsing is genuinely useful
```

The default for operational enterprise data is dense table/list, not cards.

---

# 8. Split Work Mode

For high-throughput roles:

```text
Collection View | Object Workspace
```

The selected object retains its canonical identity/route.

Suitable examples:

- leads/opportunities;
- supplier onboarding;
- invoices;
- service cases;
- work orders;
- inspections/exceptions;
- permission/admin queues.

Split mode is a composition, not a second object implementation.

---

# 9. Enterprise Grid

A world-class construction ERP requires spreadsheet-grade structured interaction.

Minimum common capability:

- keyboard navigation;
- cell/range selection;
- copy/paste;
- multi-row create;
- inline edit;
- bulk edit;
- fill/down patterns;
- row/cell validation;
- unsaved state;
- explicit save where appropriate;
- sort/filter/group;
- freeze/resize/reorder columns;
- saved views;
- totals/calculated positions;
- export;
- link to Import Workbench.

Target use cases include:

- BOQ;
- estimate lines;
- rates;
- WBS/CBS;
- cost codes;
- budget/forecast;
- schedule data;
- products/items;
- asset registers;
- resource plans;
- payment/value schedules.

Do not implement these as hundreds of repeated modal forms.

---

# 10. Import Workbench

Import is a governed business operation.

Canonical pattern:

```text
Source
 -> Upload / Connect
 -> Staging
 -> Mapping
 -> Validation
 -> Preview
 -> Exceptions
 -> Authority / commit
 -> Canonical commands
 -> Provenance / evidence
```

Operating modes:

- interactive small import;
- asynchronous large import;
- migration run;
- integration feed;
- external catalogue;
- field/offline synchronization.

Import never writes around aggregate invariants.

---

# 11. Saved Views, Recent and Favourites

## 11.1 Saved View

Saved View should capture, where applicable:

- owner;
- target collection;
- filters/query;
- context scope;
- columns;
- sort;
- grouping;
- display mode;
- density;
- sharing/audience;
- default/pinned state.

Shared views require governed permissions.

## 11.2 Recent

Recent tracks recently opened:

- canonical objects;
- contexts;
- workspaces;

not arbitrary implementation URLs.

## 11.3 Favourites

Users may pin:

- objects;
- contexts;
- collections/views;
- workspaces.

Favourite is personal preference, not business classification.

---

# 12. Enterprise Search

The current command palette remains a navigation accelerator.

Enterprise Search is a separate business capability, even if both later share one input.

Search result classes include:

```text
Objects
People / Parties
Projects / Contracts / Assets
Tasks / Work
Reports / analytical artefacts
Functions / destinations
Help / knowledge
```

Search must support:

- authorization before protected details are disclosed;
- type;
- context;
- classification;
- status;
- lifecycle/maturity;
- attributes/facets;
- relationship filters where valuable;
- canonical deep links.

Search may support safe homogeneous-result actions where the owning command model permits them.

---

# 13. Structure Browser

NuBlox must support multiple structures, not one universal tree.

Structure types include:

- product/BOM;
- engineering system;
- WBS;
- cost/CBS;
- schedule breakdown;
- organisation;
- asset assembly;
- functional systems;
- property/space;
- network/linear;
- information;
- package.

Shared interaction capabilities:

- hierarchy;
- node selection;
- relationship/occurrence attributes;
- node details;
- filtering;
- configuration/effectivity;
- inline editing;
- add/reuse/replace/remove;
- split comparison;
- saved views;
- bulk editing;
- import;
- synchronization with viewer/map where relevant.

Mappings between structures must be explicit.

---

# 14. Product & Item Workspace

Product/Item is first-class Enterprise Data.

Depending on object type it may expose:

- identity/reference/description;
- classification;
- characteristics;
- UoM;
- manufacturer;
- supplier references;
- approved sources;
- structures/BOM;
- configuration model;
- variants;
- substitutions;
- revision/lifecycle;
- effectivity;
- technical documents/models;
- costs/rates/prices;
- environmental data;
- warranty;
- installation/service data;
- history.

NuBlox must distinguish:

```text
Identity
Revision/version
Lifecycle state
Configuration/effectivity
Working/saved view
```

They are not one generic version concept.

---

# 15. Enterprise Change Workspace

Change is a cross-object operating context.

Common grammar:

```text
Driver / issue
Affected objects
Impact graph
Proposed changes
Cost / programme / risk impacts
Assessments
Decisions / authority
Implementation work
Realised changes
Verification
Evidence
History
```

Typed domain changes remain distinct.

Examples:

- engineering change;
- contract change;
- project/scope change;
- product change;
- asset change;
- organisation/policy change.

Workflow coordinates change; owning aggregates execute domain commands.

---

# 16. Viewer Workspace

Viewer Workspace synchronizes a visual representation with structured business data.

Potential representations:

- drawing;
- PDF;
- BIM/model;
- 3D product;
- image;
- reality capture;
- digital twin scene.

Shared behavior:

```text
viewer selection
 <-> canonical object / structure node
 <-> issue / change / work
 <-> related information
```

A representation is not the canonical physical/business object.

---

# 17. Map / Spatial Workspace

Spatial interaction is first-class for built-environment ERP.

Capabilities may include:

- map/scene;
- spatial search/filter;
- object synchronization;
- property/site/location context;
- linear/network reference;
- field-work overlays;
- work orders;
- inspections/incidents;
- geometry editing where governed;
- offline package preparation;
- linked BIM/model context.

Geometry/location representation must not become a second Asset master.

---

# 18. Work Order / Field model

Work Order is a canonical business object and should expose, where relevant:

```text
Overview
Asset / Location
Scope / Job Plan
Tasks
Assignments
Materials / Parts
Plant / Tools
Safety / Permits
Inspections
Readings
Time / actuals
Costs
Failure / Defect
Evidence
History
```

Preserve:

```text
Maintenance Strategy / Plan
 -> Due work / schedule
 -> Work Order
 -> Assignment
 -> Dispatch / travel
 -> Execution
 -> Inspection / Result
 -> Failure / follow-up
```

These are linked but distinct semantics.

Field/mobile is a different composition over the same objects, not another data model.

---

# 19. Context / Utility Panel

A reusable secondary panel may expose relevant supporting information without overwhelming the primary workspace.

Potential contributions:

- related work;
- assignments;
- help;
- relationships;
- collaboration/correspondence;
- provenance;
- notifications;
- recent activity.

The panel must not become a hidden alternative action model.

---

# 20. Task Bar

Task Bar answers:

> What am I actively working on now?

It stores/resumes:

- canonical object contexts;
- recoverable drafts;
- optionally context workspace state;
- relevant origin/function perspective.

The same canonical object should not create duplicate Task Bar contexts merely because it was reached from another function.

Task Bar is distinct from My Work.

---

# 21. Business Configuration vs Administration

## 21.1 Enterprise Data

Operational master/reference data.

## 21.2 Business Configuration

Governs how business processes behave, including:

- lifecycles;
- numbering;
- workflows;
- approval rules;
- delegated-authority frameworks;
- terms;
- calendars;
- templates;
- classifications where configuration-owned;
- contract regimes;
- project/context templates;
- default views.

Configuration changes should be scoped, attributable and auditable.

## 21.3 Technical Administration

Includes:

- users/security administration;
- integrations;
- queues/jobs;
- environment/system health;
- migration operations;
- platform settings;
- technical diagnostics.

Technical Administration should not dominate ordinary enterprise navigation.

---

# 22. Error, denied and conflict states

A world-class runtime designs failure states explicitly.

Required distinctions include:

- not found;
- not visible in tenant/context;
- readable object but action not permitted;
- authority insufficient;
- validation failure;
- stale/conflicting update;
- edit lease conflict;
- import row/batch exceptions;
- integration failure;
- offline/sync conflict.

Permission failure must never become a generic 500.

Where allowed, denied state should provide:

- concise explanation;
- safe object/context reference;
- back/home;
- request-access route;
- required permission/authority language.

---

# 23. Responsive / mobile / field

Responsive design does not mean shrinking desktop content.

The platform must preserve:

- canonical identity;
- authority;
- lifecycle;
- work/evidence;
- audit;

while choosing a device-appropriate composition.

Field patterns prioritize:

- today's work;
- location;
- asset;
- checklist/steps;
- readings;
- evidence capture;
- time/material;
- completion.

Offline architecture must later support canonical IDs, sync and conflict resolution without assuming permanent connectivity.

---

# 24. Visual / information hierarchy

NuBlox uses:

- compact stable shell;
- visible context;
- high information density where work demands it;
- tables/grids/structures for operational data;
- cards only when grouping/attention benefits from them;
- strong typography;
- restrained status colour;
- progressive disclosure;
- accessible keyboard/focus/touch semantics.

Large hero marketing panels are prohibited inside routine operational work.

---

# 25. Relationship to F01-F29

Each F01-F29 workspace becomes a governed perspective that may contribute:

- collections;
- queues;
- process views;
- function-specific object projections;
- actions;
- analytics.

A function does not create a second canonical identity.

A user can work:

```text
from a function
from a process
from My Work
from search
from a context
from a relationship
```

and still arrive at the same canonical object.

---

# 26. Implementation programme

The previous Object-Centric O0-O4 programme remains valid in purpose but is now subsumed into the broader Enterprise Interaction programme.

## E0 — interaction platform foundation

Implement before broad F07+ runtime expansion:

- stable shell IA;
- Enterprise Context Contract;
- context bar/selector;
- runtime Object Registry;
- canonical object routes;
- Object Workspace shell;
- Collection View;
- Saved Views / Recent / Favourites;
- global/contextual My Work integration;
- Task Bar canonical contexts;
- controlled denied/not-found/conflict states;
- baseline acceptance tests.

## E1 — dense enterprise work primitives

Implement:

- Enterprise Grid;
- Split Work Mode;
- Structure Browser foundation;
- Import Workbench;
- reusable Context / Utility Panel;
- standard history/evidence/relationship panels.

## E2 — prove on current high-value objects

Migrate:

1. Party / Organisation;
2. Lead;
3. Business Case;
4. Strategy Framework / Strategic Objective;
5. Information Container.

Then prove:

- Project Context skeleton;
- Contract Context skeleton;
- Product/Item workspace skeleton.

## E3 — migrate existing F01-F06 runtime

Convert current function-local selected-record pages into:

- workspaces/collections; or
- canonical object workspaces/actions.

No canonical object remains addressable only by a query-parameter selection inside a function page.

## E4 — Deliver build-out

Build F07 onward around:

```text
Lead
 -> Opportunity
 -> Pursuit
 -> Estimate
 -> Proposal
 -> Contract
 -> Project
 -> Procurement / Commercial / Programme / Finance / Information
 -> Handover
```

with:

- Project Context;
- Contract Context;
- Enterprise Grid;
- Change Workspace;
- Viewer where needed.

## E5 — asset/operation continuity

Implement:

- Asset/Property/Site context;
- Work Order workspace;
- Map/Spatial workspace;
- field/mobile compositions;
- handover-to-maintenance continuity.

## E6 — product/configuration depth

Implement:

- Product/Item workspace;
- advanced Structure Browser;
- product configuration/effectivity;
- engineering change;
- viewer synchronization;
- supplier/manufacturer sourcing relationships.

---

# 27. Acceptance gate for all new runtime work

Before a new page/workspace is accepted, answer:

1. Which Job Profiles / Functional Roles create, review or consume the work?
2. What Work Product is the user actually trying to produce or progress?
3. Is that Work Product NATIVE, ASSISTED, CONNECTED or INGESTED?
4. Which enterprise stream is this — Operate, Deliver or Enterprise Data?
5. What enterprise context applies?
6. Is this a workspace, collection, object, structure, grid, viewer, map, form or work queue?
7. Which canonical object owns the truth?
8. Does the object have one stable canonical URL?
9. Which aggregate owns each command?
10. What is the primary next action?
11. How are permissions and delegated authority evaluated?
12. How does work appear in My Work?
13. How does the Job Workbench surface it for the relevant Position?
14. How does active/draft work appear in Task Bar?
15. Can a Saved View be relevant?
16. Does the journey require high-volume entry/import?
17. Are relationships/evidence/history reachable?
18. What downstream handoff consumes the resulting Work Product?
19. How are denied/not-found/conflict states handled?
20. What happens on tablet/mobile/field?
21. Which shared Experience System primitive implements the interaction?

A page that cannot answer these questions is not ready for implementation.

---

# 28. Prohibited patterns

Do not introduce:

- new canonical records that only exist inside `?record=` function URLs;
- duplicate Party/Project/Contract/Asset/Item/Information masters;
- function-specific copies of a shared object;
- dashboard-card-only enterprise experiences;
- long flat forms for high-volume structured data;
- one universal hierarchy for unrelated structures;
- one generic "version" field for revision/effectivity/state;
- workflow assignment as permission/authority;
- project context as ownership of every project-related record;
- map/model/document representation as canonical physical identity;
- generic 500 responses for permission/authority denial;
- workspace-local design systems.

---

# 29. Governing principle

Every feature should be challenged in this order:

> **How does the enterprise operate or deliver value?**

then:

> **What context is the user operating in?**

then:

> **What canonical object carries the truth?**

then:

> **Which function/process is responsible for the activity?**

then:

> **Which owning aggregate command changes state, and what evidence proves the outcome?**

This is the interaction model for NuBlox as an end-to-end enterprise ERP / operating system, rather than a collection of 29 departmental applications.
