# NuBlox UI/UX Architecture

## Purpose

NuBlox is an enterprise operating system, not a collection of feature pages. Its user interface must
make the operating model, assigned work and governed business objects understandable without
exposing implementation architecture as the primary user experience.

This document is normative for the tenant application.

## Information architecture

The application has six stable user-facing layers:

1. **Home** — attention and launch point.
2. **My Work** — work assigned to the signed-in person through responsibility, review, approval,
   acceptance, competence or workflow.
3. **Functions** — the 29 enterprise Functions and their governed sub-functions/activities.
4. **CBE Domains** — the 16 professional Domains and 84 governed CBE Job Profiles.
5. **Work products** — shared execution surfaces such as Information, Deliverables and
   Change & Configuration.
6. **Governance administration** — Organisation, functional/CBE capability deployment, Competence,
   Control and Access administration.

The permanent navigation rail contains only these high-level destinations. The 29 Functions must
not be repeated as a permanent navigation tree. Deeper hierarchy belongs inside the Functions
directory and Function context.

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

A Function page is a working context, not an architecture report.

Every Function page exposes five real views of the same capability context:

- **Overview** — Function identity, L2 scope, activities and composed native capability;
- **Governance** — mandate, policies, standards, competence, Authority, controls, assurance and deployment;
- **Delivery** — operational work, activities, tasks, outputs, handoffs and outcomes;
- **Performance** — work, control, output and improvement measures;
- **Records** — governed Information, Deliverables, Change/Configuration, Decisions and Evidence.

The same five-view interaction grammar applies to every CBE Domain. A Domain Overview is organised
around professional scope and Job Profiles; Governance controls how the professional capability
operates; Delivery is where professional work and outputs are performed.

It must not expose implementation-wave language, internal development status, benchmark language,
or other programme-management metadata to ordinary users.

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
3. No permanent 29-Function or 16-Domain tree in global navigation.
4. No workspace-specific design system.
5. No uncontrolled 500 for permission denial.
6. No management-form wall before the user's working content.
7. No generic mutation that bypasses lifecycle, permission or Authority.
8. No work-product action without exact governed object/version context where the domain requires it.
9. My Work remains the cross-Function and cross-Domain attention surface.
10. New native engines adopt this interaction grammar rather than inventing another page pattern.
