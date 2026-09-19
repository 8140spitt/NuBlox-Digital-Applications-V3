# NuBlox Experience System

**Status:** governing interaction contract  
**Applies to:** tenant application, F01-F29 workspaces and all new F07+ runtime UI

## Product model

NuBlox is presented as one enterprise operating environment, not as 29 disconnected applications and not as a collection of database screens.

The user-facing hierarchy is:

```text
Tenant
  -> My Work / active context
     -> business function workspace
        -> business object
           -> action / decision / evidence
```

The 29 enterprise functions remain the canonical business-capability navigation model. Canonical business objects may be surfaced across several functions without changing identity or ownership.

## Persistent interaction layers

### 1. Global layer

The global shell is stable everywhere and provides:

- NuBlox and tenant identity;
- global jump/search navigation;
- My Work;
- function directory;
- user/account controls.

Global navigation must not expose implementation architecture as normal operational navigation.

### 2. Function layer

The navigation rail provides:

- Home;
- My Work;
- function directory;
- F01-F29 business-function workspaces;
- authorised administration destinations.

All 29 functions remain reachable, but administration and architecture detail use progressive disclosure rather than competing with daily work.

### 3. Business-object layer

Once a user opens a business object, the object becomes the primary working context.

A canonical object workspace uses:

- object type;
- reference / identifier;
- business title;
- concise lifecycle status;
- contextual metadata;
- stable object tabs;
- permitted contextual actions;
- related evidence and history.

Users should not be forced to reopen the same object independently in several functions merely because different capabilities participate in its lifecycle.

The reusable runtime primitive is `ObjectHeader.svelte`.

### 4. Active-work layer

**My Work** and the **Task Bar** are different concepts.

- My Work answers: **what am I responsible for?**
- Task Bar answers: **what am I working on now?**

My Work contains assignments, reviews, decisions and exceptions. The Task Bar contains open working contexts, pinned objects and recoverable dirty forms.

## Page types

Every runtime page should resolve to one of these patterns before introducing local UI.

### Operational home

Purpose:

- show work requiring attention;
- resume active contexts;
- provide clear entry into business functions.

Do not put architecture coverage statistics, aggregate counts or implementation-state diagnostics on the normal user home page.

### Function workspace

Purpose:

- orient the user within one of F01-F29;
- show the function's L2 work areas;
- surface relevant queues, records, exceptions and performance;
- preserve context during cross-functional hand-offs.

### Record list

Purpose:

- find, filter and compare business records;
- expose lifecycle status and the most relevant operational columns;
- make the primary next action obvious.

Tables should be information-dense without becoming spreadsheet replicas. Secondary metadata belongs in drill-through, drawers or configurable columns.

### Object workspace

Purpose:

- make one business object the stable centre of work;
- preserve its identity while users move through commercial, programme, finance, document, approval and audit concerns;
- keep actions contextual to the object and current authority.

### Form

Purpose:

- capture a governed business change with the minimum cognitive load necessary.

Forms use progressive disclosure:

1. essential identity and business fields;
2. normal operational detail;
3. advanced, statutory or integration information when relevant.

Long flat forms are prohibited when the fields can be meaningfully grouped.

### Work queue

Purpose:

- make responsibility and urgency clear;
- distinguish urgent, overdue, blocked and escalated work;
- expose the most likely next action without hiding evidence or authority.

## Interaction rules

1. **Business language first.** Internal aggregate IDs, migration identifiers and architecture terminology do not appear in normal operational presentation unless the user is performing architecture or administration work.
2. **One primary action.** A page or object may expose several permitted actions, but visual hierarchy must make the most likely next step obvious.
3. **Progressive disclosure.** Advanced controls, audit detail and low-frequency metadata stay available without dominating the main task.
4. **Context survives navigation.** Cross-functional hand-offs retain tenant, object identity and relevant programme/project/asset context.
5. **Status is semantic.** The same lifecycle state uses the same wording and visual treatment everywhere.
6. **Permissions explain rather than fail.** Missing authority produces a controlled denied state, a way back, and a governed request-access path where applicable.
7. **Drafts are recoverable.** Dirty governed forms open or update a Task Bar context and participate in the shared draft/edit-lease contract.
8. **Evidence is reachable.** Audit, approvals, documents, decisions and history remain available without being permanently expanded.
9. **No dead controls.** Search, create, notification or action affordances are not displayed until they perform a real supported action.
10. **No workspace-local design systems.** New interaction patterns must be reusable or explicitly justified.

## Visual hierarchy

NuBlox uses restrained enterprise presentation:

- compact persistent shell;
- neutral working surfaces;
- strong typography hierarchy rather than decorative card volume;
- cards only where grouping materially improves comprehension;
- dense lists and tables for operational work;
- restrained use of status colour;
- consistent whitespace and alignment;
- visible keyboard focus and accessible semantics.

Large promotional hero panels are inappropriate inside routine operational pages.

## F07+ adoption gate

Before an F07+ screen is accepted, it must answer:

- What business object or responsibility is the user working with?
- Where is the user within the tenant/function/object hierarchy?
- What is the current status?
- What is the primary permitted next action?
- What contextual information is essential now?
- What information can be progressively disclosed?
- How does the work enter My Work?
- How does dirty or pinned work enter the Task Bar?
- How are permissions, validation, conflict and error states presented?
- Which shared component/pattern implements the interaction?

A screen that cannot answer these questions is not ready for implementation.

## Current runtime foundation

The application shell now provides a global command palette, simplified navigation hierarchy and progressively disclosed administration. Home prioritises My Work and active working contexts. Workspace headers use a restrained identity pattern. My Work is presented as an operational cockpit. Dirty forms automatically establish a Task Bar work context. A canonical object header is available for the F07+ object-workspace implementation wave.

This foundation should be evolved through reusable patterns rather than per-function redesign.
