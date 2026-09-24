# NuBlox UI/UX Architecture

## Purpose

NuBlox is an enterprise operating system, not a collection of feature pages. Its user interface must
make the operating model, assigned work and governed business objects understandable without
exposing implementation architecture as the primary user experience.

This document is normative for the tenant application.

## Information architecture

The application has six stable user-facing layers:

1. **Home** — attention and launch point.
2. **My Function** — the signed-in Person's primary working world, resolved from their occupied Position and active Function assignment.
3. **My Work** — cross-Function work assigned through responsibility, review, approval, acceptance or workflow.
4. **My Team** — shown when the Position has subordinate Positions; rolls authorised work and performance down the reporting hierarchy.
5. **Shared work surfaces** — governed objects and cross-Function execution such as Information, Deliverables, Change & Configuration, Projects, Contracts, Assets and other enterprise contexts.
6. **Administration** — HCM Position Management, Function governance, Competence, Control, Access and platform administration for authorised users.

The permanent navigation must not force ordinary users to browse all 29 Core Business Functions or all 16 CBE Functions. Their primary world is resolved by HCM. Function directories may exist for authorised discovery, governance or administration, but they are not the ordinary employee's starting mental model.

## Page anatomy

A normal workspace follows this order:

1. **Context header** — concise title, purpose and only essential status/context.
2. **Attention/state summary** — small set of meaningful metrics when they help the current job.
3. **Primary content** — the register, object list, work queue or governed object state.
4. **Contextual actions** — actions placed with the state/object they affect.
5. **Secondary management actions** — grouped behind an Actions surface where appropriate.
6. **History/evidence** — accessible from the governed object without dominating routine work.

Do not place a large bank of creation/administration forms before the primary working content.

## Navigation rules

- Primary navigation must be brief, stable and scannable.
- A navigation label must represent a user goal or durable product area.
- Do not expose every taxonomy node in global navigation.
- Do not create tabs, buttons or links that have no working destination or action.
- Tabs are used only when they switch real views of the same context.
- Current context is shown in the application header; architecture slogans are not repeated there.

## Function workspace rules

A Function page is the user's working world, not an architecture report.

Human Capital resolves:

```text
Person
→ Employment
→ occupied Position
→ Function
→ Functional Governance | Functional Delivery
→ reporting hierarchy / management scope
```

The workspace composes the operational tools, business objects, work products, queues, Decisions, performance and records required by that Function and Position scope. A Sales Delivery Position therefore sees Sales Delivery work; a CBE Architecture Delivery Position sees Architecture work. Managers see their own authorised scope plus subordinate Position scope.

Where useful, the workspace may expose **Overview**, **Governance**, **Delivery**, **Performance** and **Records** views, but these views are secondary to the actual work. CBE D01–D16 use the same Function interaction model because they are CBE-classified Functions under ADR-0006.

Cross-Function interaction appears when the current work, object or end-to-end process requires it; it must not turn the user's workspace into an unrestricted catalogue of unrelated Functions.

Ordinary users must not see implementation-wave language, Native Engine IDs, internal development status or benchmark terminology.

## HCM Position Management rules

HCM Position Management is authoritative for the workforce chain that determines the user's primary NuBlox experience.

It must make this distinction visible:

- Person occupancy answers **who holds the Position**;
- Position/Job Profile answers **what organisational/professional capability the seat represents**;
- Position-to-Function assignment answers **which Function is the Position operating in**;
- assignment purpose answers **Functional Governance or Functional Delivery**;
- reporting lines answer **whose work rolls up to which manager Position**;
- contextual responsibility answers **which Project, Contract, Site, Asset, Service or other scope the work concerns**;
- Permission and Authority remain separate controls over access and commitment.

A separate contextual assignment may be used when the same Position performs work in a specific Project/Contract/etc., but it is not required merely to establish the user's primary Function world.

## Governed object workspace rules

Information, Change, Configuration, Deliverable and other governed-object workspaces use the same
interaction grammar:

- display authoritative state first;
- show status close to object identity;
- bind actions to valid lifecycle states;
- use controlled selections instead of raw identifiers where data is available;
- preserve exact object/version context for review, Decision, issue and acceptance;
- require Authority where the domain commitment requires it;
- expose audit/evidence as traceability, not as decorative metadata.

Create/edit forms are secondary to the register unless the user explicitly enters create/edit mode.

## Action hierarchy

At most one primary action should visually dominate a page or object context.

Actions are classified as:

- **Primary** — the most common next action in the current state.
- **Secondary** — valid but less frequent contextual actions.
- **Management** — setup/administration commands grouped under an Actions surface.
- **Destructive/exception** — visually distinct and never mixed indiscriminately with routine work.

Disabled actions must have an obvious reason from visible state. Prefer hiding actions that are
meaningless in the current state.

## Visual system

The tenant application uses one token vocabulary rooted in the application shell.

Required semantic tokens:

- page surface;
- panel surface;
- strong text;
- muted text;
- subtle border;
- primary/nav colour;
- accent colour;
- success/warning/error states.

Do not introduce a parallel token vocabulary for an individual workspace.

Spacing must communicate grouping before borders do. Cards and pills are used only when the shape
conveys a meaningful object/status grouping; avoid gratuitous rounded containers.

## Density

NuBlox is an enterprise application and may display dense operational data, but density must remain
scannable:

- concise headers;
- compact tables/register rows;
- predictable column alignment;
- progressive disclosure for history and secondary detail;
- whitespace between conceptual groups;
- no wall of equally weighted controls.

## Responsive behaviour

On narrower screens:

- primary navigation becomes a drawer;
- multi-column workspaces collapse to a single reading order;
- contextual actions remain reachable;
- tables/registers must preserve identity and status before secondary metadata;
- no essential action may depend on hover.

## Accessibility

- semantic headings must reflect the visible hierarchy;
- interactive elements must be keyboard operable;
- focus and selected states must be visible;
- controls require labels;
- colour is not the sole carrier of status;
- controlled-denial screens must provide a route Home and, where supported, Request Access.

## Non-negotiable UX invariants

1. No fake navigation.
2. No developer/programme metadata in ordinary user workspaces.
3. No permanent all-Functions tree in ordinary-user global navigation; the user's primary Function comes from HCM.
4. No workspace-specific design system.
5. No uncontrolled 500 for permission denial.
6. No management-form wall before the user's working content.
7. No generic mutation that bypasses lifecycle, permission or Authority.
8. No work-product action without exact governed object/version context where the domain requires it.
9. My Work remains the cross-Function attention surface; My Function remains the primary operating world.
10. New native engines adopt this interaction grammar rather than inventing another page pattern.
