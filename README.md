# NuBlox Digital Applications V3

NuBlox V3 is a greenfield construction and built-environment operating system. V3 is being designed from the operating model outward: business capability -> workflow -> domain model -> permissions -> application experience.

## Product objective

NuBlox must enable a sophisticated built-environment business to execute, control and evidence its complete operating model through one coherent digital platform. The product architecture will provide explicit coverage of the agreed 29 business functions and their sub-functions, with traceability from each business capability to workflows, records, controls, permissions and user experiences.

## V3 non-negotiables

1. **Architecture before screens.** No feature exists only because a screen was designed for it.
2. **One canonical domain model.** Core business concepts are defined once and reused everywhere.
3. **Workflow continuity.** Data flows through end-to-end business processes without re-keying or disconnected feature silos.
4. **Explicit capability coverage.** Every native capability maps back to one or more of the 29 business functions and their sub-functions.
5. **Secure by design.** Tenant isolation, least privilege, effective permissions and auditable actions are architectural concerns, not later enhancements.
6. **Evidence by default.** Material business decisions, approvals, changes and transactions must be traceable.
7. **One design system.** Navigation, information hierarchy, interaction patterns, components and states are consistent across the product.
8. **Progressive complexity.** Everyday screens remain focused while advanced controls remain available when the workflow requires them.
9. **No duplicate concepts.** Parallel implementations of the same business object, workflow or permission are not permitted.
10. **Main is canonical.** Completed work ends on `main`; short-lived branches are removed after integration and no completed work is left in residual pull requests.

## Repository structure

```text
NuBlox-Digital-Applications-V3/
├── app/                     # Product application
├── docs/
│   ├── architecture/        # System and domain architecture
│   ├── business-functions/  # 29-function operating model and mappings
│   ├── data-model/          # Canonical information model
│   ├── decisions/           # Architecture decision records (ADRs)
│   ├── design-system/       # UX, UI and interaction-system specifications
│   └── product/             # Product principles, scope and roadmap
├── scripts/                 # Repository and engineering automation
└── .github/                 # GitHub workflow configuration
```

## Delivery sequence

V3 development follows this order:

1. Product charter and architectural principles.
2. Complete 29-function capability map and sub-function decomposition.
3. End-to-end business journeys and value streams.
4. Canonical domain and data model.
5. Organisation, tenancy, identity, role and permission architecture.
6. Application shell, navigation and design system.
7. Vertical business slices implemented end-to-end.
8. Integration, analytics, automation and optimisation.

A feature is not considered complete until its workflow, data ownership, permissions, audit behaviour, user experience and capability traceability are all defined and tested.
