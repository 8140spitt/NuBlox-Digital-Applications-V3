# NuBlox Experience System

**Status:** governing interaction contract  
**Applies to:** tenant application, Operate/Deliver/Enterprise Data, F01-F29 workspaces and all new runtime UI  
**Primary architecture:** `enterprise-interaction-architecture.md`

## Product model

NuBlox is presented as one enterprise operating environment, not as 29 disconnected applications and not as a collection of database screens.

The user-facing hierarchy is:

```text
Tenant / Enterprise
  -> Person / Position / Job Profile
     -> Job Workbench / My Work
        -> Enterprise Context
        -> Operate / Deliver / Enterprise Data
           -> process / function / context workspace
              -> collection / grid / structure / map / viewer
                 -> canonical business object
                    -> action / decision / change / evidence
```

The 29 enterprise functions remain the canonical **business-capability architecture and complete function directory**. They are no longer the sole primary navigation model.

Canonical business objects may be surfaced from several functions, processes and contexts without changing identity or ownership.

## Persistent interaction layers

### 1. Global layer

The global shell is stable everywhere and provides:

- NuBlox and tenant identity;
- Home;
- My Work;
- Operate;
- Deliver;
- Enterprise Data;
- enterprise search / jump navigation;
- recent / favourites;
- progressively disclosed Business Functions F01-F29;
- user/account controls;
- authorised Business Configuration / Administration.

Global navigation must not expose implementation architecture as normal operational navigation.

### 2. Enterprise-context layer

The active enterprise context answers:

> **Where am I operating?**

Relevant dimensions may include:

- legal entity;
- organisation unit;
- portfolio/programme;
- project;
- contract;
- site/property;
- space/location;
- system/network;
- asset.

Not every page uses every dimension.

Context is a perspective/filter/authority dimension. It never creates duplicate master data.

### 3. Job-workbench layer

A Job Workbench answers:

> **What do I need to do my job?**

It composes the Position / Job Profile work-product catalogue with My Work, current context, actual permissions/authority, role-relevant collections, create actions, exceptions, templates and performance information.

Job Workbench is a perspective. It never grants permission and never duplicates canonical objects.

See [Job-to-Work-Product Architecture](../evidence/product-analysis/job-to-work-product-architecture.md).

### 4. Workspace / perspective layer

A workspace answers:

> **What business work am I trying to perform here?**

Workspace types include:

- Operate / Deliver;
- F01-F29 function;
- process;
- Project;
- Contract;
- Asset / Property;
- specialist workbench.

A workspace may aggregate:

- priorities / exceptions;
- collections;
- queues;
- process links;
- common actions;
- concise analytics.

A workspace does not own durable domain truth merely because it displays it.

### 5. Business-object layer

Once a user opens a canonical business object, the object becomes the stable unit of record/work.

A canonical object workspace uses:

- object type;
- reference / identifier;
- business title;
- concise lifecycle status;
- contextual metadata;
- stable object sections;
- permitted contextual actions;
- relationships;
- related work;
- decisions / approvals;
- evidence / controlled information;
- history;
- versions/revisions where applicable.

Users should not reopen the same object independently in several functions merely because different capabilities participate in its lifecycle.

The reusable runtime primitive is `ObjectHeader.svelte`.

### 6. Active-work layer

**My Work** and the **Task Bar** are different concepts.

- My Work answers: **what am I responsible for?**
- Task Bar answers: **what am I working on now?**

My Work contains assignments, reviews, decisions and exceptions. The Task Bar contains open working contexts, pinned objects and recoverable dirty forms.

## Enterprise streams

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

- lead/opportunity;
- pursuit/bid;
- estimate/tender;
- contract;
- project/programme;
- design/information;
- procurement;
- construction/site;
- commercial/change;
- commissioning/handover;
- asset/service.

### Enterprise Data

Shared operational data:

- parties / organisations / people;
- customers / suppliers;
- products / items / materials / services;
- resources / plant;
- assets / systems;
- organisation and finance structures;
- classification / reference data.

Enterprise Data is not Technical Administration.

## Page / surface types

Every runtime surface should resolve to one of these patterns before introducing local UI.

### Operational home

Purpose:

- show work requiring attention;
- resume active/recent contexts;
- provide role-relevant entry into Operate / Deliver / Enterprise Data;
- surface favourites and concise insight.

Do not put architecture coverage statistics, aggregate counts or implementation diagnostics on the normal user home page.

### Workspace / cockpit

Purpose:

- orient the user within a business stream, process, function or context;
- show relevant queues, collections, exceptions and performance;
- launch common actions;
- preserve context during cross-functional hand-offs.

### Collection View

Purpose:

- find, filter, compare and triage canonical records;
- expose lifecycle/status and relevant operational columns;
- support governed saved views;
- link directly to canonical object URLs.

The default operational representation is information-dense list/table, not generic cards.

### Enterprise Grid

Purpose:

- support high-volume structured entry/editing;
- provide keyboard/range/copy-paste/bulk interaction;
- preserve validation, authority and aggregate-command rules.

Use for estimates, BOQs, schedules, rates, assets, products, budgets and similar datasets.

### Structure Browser

Purpose:

- navigate/edit governed hierarchies/structures;
- support node/relationship attributes, configuration and comparison.

Do not create one universal tree for unrelated structures.

### Object Workspace

Purpose:

- make one canonical business object the stable centre of work;
- preserve identity while users move through related commercial, programme, finance, information, approval and audit concerns;
- keep actions contextual to object and current authority.

### Split Work Mode

Purpose:

- combine a Collection View and Object Workspace for high-throughput processing without creating a second object implementation.

### Viewer / Spatial Workspace

Purpose:

- synchronise models/drawings/maps/scenes with canonical business objects, structures and work.

Visual/spatial representations do not become canonical physical/business identity.

### Form

Purpose:

- capture a governed business change with the minimum cognitive load necessary.

Forms use progressive disclosure:

1. essential identity and business fields;
2. normal operational detail;
3. advanced, statutory or integration information when relevant.

Long flat forms are prohibited when fields can be meaningfully grouped.

### Import Workbench

Purpose:

- map, validate, preview and govern high-volume inbound data before canonical commit.

Import does not write around domain invariants.

### Work queue

Purpose:

- make responsibility and urgency clear;
- distinguish urgent, overdue, delegated, blocked and escalated work;
- expose likely next actions without hiding evidence or authority.

## Interaction rules

1. **Business language first.** Internal aggregate IDs, migration identifiers and architecture terminology do not appear in normal operational presentation unless the user is performing architecture or administration work.
2. **Context is explicit.** The user can understand the relevant enterprise/legal/project/contract/asset context before acting.
3. **One canonical identity.** Shared objects do not acquire function-local UI identities.
4. **Workspace is perspective, not truth.** Workspaces aggregate and launch work; owning aggregates remain authoritative.
5. **One primary action.** A page/object may expose several permitted actions, but hierarchy must make the most likely next step obvious.
6. **Progressive disclosure.** Advanced controls, audit detail and low-frequency metadata stay available without dominating the primary task.
7. **Context survives navigation.** Cross-functional hand-offs retain tenant, object identity and relevant context when semantically valid.
8. **Status is semantic.** Equivalent lifecycle states use consistent wording/presentation.
9. **Permissions explain rather than fail.** Missing authority produces a controlled denied state, a safe way back, and governed request-access path where applicable.
10. **Assignment is not authority.** Work assignment, read/write permission, responsibility and delegated authority remain separate.
11. **Drafts are recoverable.** Dirty governed forms open/update a Task Bar context and participate in the shared draft/edit-lease contract.
12. **Evidence is reachable.** Audit, approvals, documents, decisions and history remain available without permanent expansion.
13. **No dead controls.** Search/create/notification/action affordances are not displayed until real supported behaviour exists.
14. **High-volume work gets high-volume tools.** Do not force repeated single-record forms where grid/import interaction is required.
15. **No workspace-local design systems.** New patterns must be reusable or explicitly justified.

## Visual hierarchy

NuBlox uses restrained enterprise presentation:

- compact persistent shell;
- visible context;
- neutral working surfaces;
- strong typography hierarchy rather than decorative card volume;
- cards only where grouping materially improves comprehension;
- dense lists/grids/structures for operational work;
- restrained use of status colour;
- consistent whitespace and alignment;
- visible keyboard focus and accessible semantics.

Large promotional hero panels are inappropriate inside routine operational pages.

## Runtime adoption gate

Before a new runtime screen/workspace is accepted, it must answer:

- Which Job Profile / Functional Role performs or consumes this work?
- What Work Product is the user producing, reviewing or issuing?
- Is that Work Product NATIVE, ASSISTED, CONNECTED or INGESTED?
- Which stream is this: Operate, Deliver or Enterprise Data?
- What enterprise context applies?
- What surface type is this?
- What canonical object(s) carry truth?
- Which aggregate owns each command?
- Where is the user in the tenant/context/workspace/object hierarchy?
- What is the current status?
- What is the primary permitted next action?
- What contextual information is essential now?
- What can be progressively disclosed?
- How does work enter My Work?
- How does dirty/pinned work enter Task Bar?
- Is a Saved View relevant?
- Does the journey require Enterprise Grid, Structure Browser or Import Workbench?
- How are permissions, validation, conflict and error states presented?
- What happens on tablet/mobile/field?
- Which shared Experience System primitive implements the interaction?

A screen that cannot answer these questions is not ready for implementation.

## Current runtime foundation

The application currently provides:

- global command palette;
- simplified shell;
- Home / My Work;
- function directory;
- Task Bar work contexts;
- draft/edit-lease foundation;
- canonical `ObjectHeader.svelte`;
- strong canonical aggregate/domain semantics.

The current runtime is still materially function-page-centric.

The next implementation programme is defined by `enterprise-interaction-architecture.md` E0-E6. The earlier object-centric O0-O4 programme remains valid in principle but is subsumed by that broader interaction foundation.
