# NuBlox V3 Design System

The V3 design system governs information hierarchy, navigation, interaction patterns, components, states, accessibility and responsive behaviour across the product.

## Governing navigation model

The tenant application has **29 canonical enterprise-function workspaces**. These workspaces form the primary functional navigation layer.

Each workspace has a consistent anatomy but presents the work relevant to its function: sub-functions, queues, records, decisions, controls, evidence and reporting. Shared canonical records may appear in several workspaces without being duplicated.

The user should always be able to understand:

- which tenant they are operating in;
- which of the 29 function workspaces they are in;
- which sub-function, workflow, record or decision they are handling;
- what actions are available to them;
- how the current work connects to upstream and downstream workspaces.

## UX principles

1. **Function workspaces are primary.** The 29 functions are stable first-class tenant navigation destinations.
2. **Work drives the experience inside the workspace.** Within a function workspace, users navigate by sub-function, queue, workflow, business object and decision rather than arbitrary technical modules.
3. **Context persists.** Tenant, function workspace, organisation, programme, project, site, asset or other active context remains clear as users move through connected workflows.
4. **One interaction language.** Equivalent actions, statuses, approvals, filters, tables, forms and evidence patterns behave consistently across all 29 workspaces.
5. **Progressive disclosure.** Common tasks remain light; advanced controls appear only when relevant.
6. **Lifecycle is visible.** Users can see current state, available next actions, blockers, responsibility and history.
7. **Cross-workspace continuity.** A workflow should not feel like a sequence of unrelated applications when several functions participate. Handoffs preserve context and canonical data.
8. **Actionable density.** Enterprise users need information-rich screens, but every element must support a decision or task.
9. **Accessible by default.** Keyboard use, focus state, semantic structure, contrast, touch targets and assistive technology are first-class requirements.
10. **Exceptions are designed.** Empty, loading, error, permission-denied, blocked, overdue, rejected and superseded states are part of the component contract.
11. **Evidence remains discoverable.** Audit history, approvals, documents, comments and related records are accessible without overwhelming the primary task.
12. **No workspace reinvents UI.** Function-specific terminology and data are expected; independent interaction conventions are not.

## Standard function-workspace anatomy

Every function workspace will be built from the same architectural grammar:

1. **Workspace identity** — function name, purpose and current context.
2. **Workspace overview** — concise operational picture, priorities, exceptions and key outcomes.
3. **Sub-function navigation** — the validated L2 capabilities/work areas belonging to the function.
4. **Work queues** — work requiring the current user's attention.
5. **Operational records** — relevant canonical business objects and their projections.
6. **Decisions and approvals** — governed actions awaiting or recording authority.
7. **Performance** — function-specific measures, trends, exceptions and drill-through.
8. **Evidence and history** — documents, audit events, comments and related records where required.

This is an information-architecture contract, not a requirement that every workspace render all eight areas on one page.

The detailed governing contract is [`function-workspace-anatomy.md`](function-workspace-anatomy.md).

## Required foundations before feature UI

- tenant application shell;
- 29-function workspace navigation model;
- standard function-workspace anatomy;
- tenant/workspace/context selector and breadcrumb model;
- cross-workspace handoff model;
- page anatomy and information hierarchy;
- work queue and notification model;
- canonical status and lifecycle presentation;
- forms and validation patterns;
- data-table/list patterns;
- detail/workspace patterns;
- approval and decision patterns;
- timeline/audit/evidence patterns;
- responsive layout rules;
- accessibility baseline;
- design tokens and component contracts.

A function workspace may extend the design system only when the required interaction cannot be expressed through an existing pattern. Local one-off UI conventions are not acceptable substitutes for a reusable pattern.
