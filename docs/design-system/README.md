# NuBlox V3 Design System

The V3 design system governs information hierarchy, navigation, interaction patterns, components, states, accessibility and responsive behaviour across the product.

## UX principles

1. **Work before modules.** Users should navigate to the work, object or decision they need to handle rather than traverse an internal software taxonomy.
2. **Context persists.** Organisation, programme, project, site, asset or other active context should remain clear as users move through connected workflows.
3. **One interaction language.** Equivalent actions, statuses, approvals, filters, tables, forms and evidence patterns behave consistently everywhere.
4. **Progressive disclosure.** Common tasks remain light; advanced controls appear only when relevant.
5. **Lifecycle is visible.** Users can see current state, available next actions, blockers, responsibility and history.
6. **Cross-functional continuity.** A workflow should not feel like a sequence of unrelated pages simply because several native domains participate.
7. **Actionable density.** Enterprise users need information-rich screens, but every element must support a decision or task.
8. **Accessible by default.** Keyboard use, focus state, semantic structure, contrast, touch targets and assistive technology are first-class requirements.
9. **Exceptions are designed.** Empty, loading, error, permission-denied, blocked, overdue, rejected and superseded states are part of the component contract.
10. **Evidence remains discoverable.** Audit history, approvals, documents, comments and related records are accessible without overwhelming the primary task.

## Required foundations before feature UI

- application shell and global navigation model;
- context selector/breadcrumb model;
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

A feature may extend the design system only when the required interaction cannot be expressed through an existing pattern. Local one-off UI conventions are not acceptable substitutes for a reusable pattern.
