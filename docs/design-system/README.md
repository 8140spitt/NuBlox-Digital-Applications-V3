# NuBlox V3 Design System

The V3 design system governs information hierarchy, navigation, interaction patterns, components, states, accessibility and responsive behaviour across the product.

## Governing product model

NuBlox is one end-to-end enterprise operating environment.

The user-facing hierarchy is:

~~~text
Tenant / Enterprise
  -> Person / Position / Job Profile
     -> Job Workbench / My Work
        -> Enterprise Context
        -> Operate / Deliver / Enterprise Data
           -> process / function / context workspace
              -> collection / grid / structure / map / viewer
                 -> canonical business object
                    -> action / decision / change / evidence
~~~

The **29 enterprise functions remain the governed business-capability architecture and complete function directory**, but they are not the sole everyday navigation axis.

Canonical business objects can appear across several functions, processes and contexts without changing identity or ownership.

## Primary user questions

The runtime should always help the user answer:

- **What job am I here to perform?**
- **What work product am I producing or progressing?**
- **What am I responsible for?**
- **Where am I operating?**
- **What business outcome/process am I working on?**
- **What object am I working on?**
- **What can I do next?**
- **What evidence/history explains the current state?**

## Enterprise streams

### Operate the Business

Persistent enterprise machinery: strategy, governance, organisation, people, finance, risk/compliance/legal, QHSE assurance, technology/data/cyber, performance and transformation.

### Deliver the Business

Value delivery from lead/opportunity through bid, contract, project, design, procurement, construction, commercial/change, commissioning, handover, asset and service.

### Enterprise Data

Shared operational data including Party/Organisation, Customer/Supplier, Product/Item, Resource/Plant, Asset/System, enterprise structures, classifications and reference data.

Enterprise Data is distinct from Business Configuration and Technical Administration.

## Context model

Relevant enterprise context may include:

- legal entity;
- organisation unit;
- portfolio/programme;
- project;
- contract;
- site/property;
- space/location;
- system/network;
- asset.

Context is a typed perspective/filter/authority dimension. It does not create duplicate master records.

## UX principles

1. **One enterprise system.** Operate, Deliver, Enterprise Data and F01-F29 share one interaction language.
2. **Functions are perspectives.** F01-F29 remain first-class capability destinations but do not own shared canonical identities.
3. **Canonical objects persist.** The same object opens consistently regardless of whether it was reached from My Work, search, a function, a process or a context.
4. **Context persists where valid.** Relevant enterprise/project/contract/asset context survives navigation.
5. **Workspace is not truth.** A workspace aggregates attention, views and actions over canonical records.
6. **Work drives the experience.** Users enter through responsibilities, contexts, processes, collections and objects rather than technical modules.
7. **One interaction language.** Equivalent lists, grids, forms, statuses, approvals, evidence and history behave consistently.
8. **Progressive disclosure.** Common tasks stay light; advanced controls appear when relevant.
9. **High-volume work gets high-volume tools.** Use grids, structures and imports rather than repeated single-record forms.
10. **Lifecycle is visible.** Users can understand current state, next actions, blockers and history.
11. **Assignment is not authority.** Work assignment, permission, responsibility and delegated authority remain separate.
12. **Exceptions are designed.** Empty, loading, denied, blocked, conflict, validation, overdue, rejected and superseded states are part of the component contract.
13. **Evidence remains discoverable.** Audit, decisions, approvals, documents and related records remain reachable without overwhelming the task.
14. **Accessible by default.** Keyboard, focus, semantic structure, contrast, touch and assistive technology are first-class.
15. **No workspace reinvents UI.** Function-specific terminology/data are expected; independent interaction conventions are not.

## Shared interaction primitives

The target Experience System includes:

- Stable Global Shell
- Enterprise Context Bar / Selector
- Home
- My Work
- Job Workbench
- Work-Product Authoring Surface
- Workspace / Cockpit
- Collection View
- Split Work Mode
- Enterprise Grid
- Structure Browser
- Object Workspace
- Product / Item Workspace
- Work Order Workspace
- Enterprise Change Workspace
- Viewer Workspace
- Map / Spatial Workspace
- Context / Utility Panel
- Import Workbench
- Saved Views
- Recent / Favourites
- Enterprise Search
- Task Bar working contexts
- Object History / Evidence / Relationship panels
- Business Configuration workspace
- Technical Administration workspace

A new page should compose these patterns before introducing local UI.

## Standard function-workspace role

Each F01-F29 function workspace remains available and may expose:

1. **Function identity** — function name, purpose and current context.
2. **Operational overview** — priorities, exceptions and key outcomes.
3. **Sub-function navigation** — validated L2 work areas.
4. **Work queues** — relevant responsibilities.
5. **Collections** — relevant canonical business objects/projections.
6. **Decisions and approvals** — governed pending/completed actions.
7. **Performance** — function-specific measures and drill-through.
8. **Evidence/history** — where relevant.

This is an information-architecture contract, not a requirement to render all eight areas on one page.

## Required foundations before broad feature UI

Before broad F07+ expansion, implement the Enterprise Interaction E0/E1 foundations:

- stable shell IA;
- Enterprise Context Contract;
- canonical object registry/routes;
- Object Workspace;
- Collection View;
- Saved Views / Recent / Favourites;
- Enterprise Search;
- global/contextual My Work;
- Task Bar canonical contexts;
- Enterprise Grid;
- Structure Browser;
- Import Workbench;
- standard denied/not-found/conflict states.

## Governing documents

- [enterprise-interaction-architecture.md](enterprise-interaction-architecture.md) — primary product/runtime hierarchy, context model, shared primitives and E0-E6 implementation programme;
- [experience-system.md](experience-system.md) — interaction contract and runtime acceptance gate;
- [object-centric-application-review.md](object-centric-application-review.md) — quantified runtime review and canonical-object migration rationale;
- [function-workspace-anatomy.md](function-workspace-anatomy.md) — F01-F29 workspace anatomy.

A workspace may extend the design system only when the required interaction cannot be expressed through an existing shared primitive. Local one-off UI conventions are not acceptable substitutes for a reusable pattern.
