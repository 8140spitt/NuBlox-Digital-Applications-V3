# NuBlox Digital Applications V3

NuBlox V3 is a greenfield construction and built-environment operating system. V3 is being designed from the operating model outward: tenant workspace -> business function -> sub-function -> workflow -> canonical data -> permissions -> application experience.

## Product objective

NuBlox must enable a sophisticated built-environment business to execute, control and evidence its complete operating model through one coherent tenant application.

The tenant application is organised around **29 canonical enterprise-function workspaces**. Each function is a stable user-facing workspace within the tenant application. Its sub-functions, workflows, work queues, records, decisions, controls and evidence are presented within that functional context while sharing one canonical platform and data model underneath.

The 29 workspaces are not 29 independent applications or data silos. Cross-functional workflows and shared business objects must remain continuous across workspace boundaries.

## V3 non-negotiables

1. **29 functions = 29 tenant workspaces.** Each canonical enterprise function has a stable workspace in the tenant application.
2. **Architecture before screens.** A workspace is defined by the business work it enables, not by an arbitrary collection of pages.
3. **One canonical domain model.** Core business concepts are defined once and reused across all workspaces.
4. **Workflow continuity.** Data flows through end-to-end business processes without re-keying or disconnected functional silos.
5. **Explicit functional coverage.** Every sub-function must have a clear home in one of the 29 workspaces and traceable supporting capabilities and workflows.
6. **Secure by design.** Tenant isolation, least privilege, effective permissions and auditable actions are architectural concerns, not later enhancements.
7. **Evidence by default.** Material business decisions, approvals, changes and transactions must be traceable.
8. **One design system.** All 29 workspaces use the same navigation grammar, information hierarchy, interaction patterns, components and states.
9. **Progressive complexity.** Everyday workspace views remain focused while advanced controls remain available when the workflow requires them.
10. **No duplicate concepts.** Parallel implementations of the same business object, workflow or permission are not permitted across workspaces.
11. **Main is canonical.** Completed work ends on `main`; short-lived branches are removed after integration and no completed work is left in residual pull requests.

## Repository structure

```text
NuBlox-Digital-Applications-V3/
├── app/                     # Tenant application and 29 function workspaces
├── docs/
│   ├── architecture/        # System, workspace and domain architecture
│   ├── business-functions/  # 29 workspace/function definitions and sub-function mappings
│   ├── data-model/          # Canonical information model shared across workspaces
│   ├── decisions/           # Architecture decision records (ADRs)
│   ├── design-system/       # UX, UI and interaction-system specifications
│   └── product/             # Product principles, scope and roadmap
├── scripts/                 # Repository and engineering automation
└── .github/                 # GitHub workflow configuration
```

## Delivery sequence

V3 development follows this order:

1. Product charter and architectural principles.
2. Define the 29 tenant workspaces and their complete sub-function coverage.
3. Define each workspace's workflows, work queues, canonical records, controls and cross-workspace hand-offs.
4. Define end-to-end business journeys and value streams across workspaces.
5. Define the canonical domain and data model beneath the workspace layer.
6. Define organisation, tenancy, identity, role and permission architecture.
7. Build the tenant application shell, 29-workspace navigation model and design system.
8. Implement workspace slices end-to-end, beginning with validated business workflows rather than disconnected screens.
9. Add integration, analytics, automation and optimisation.

A function workspace is not considered complete until its sub-function coverage, workflows, data ownership, permissions, audit behaviour, cross-workspace relationships, user experience and automated acceptance evidence are defined and tested.
