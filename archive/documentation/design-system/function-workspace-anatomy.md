# Canonical Function Workspace Anatomy

**Status:** Governing V3 UX and application-shell contract  
**Scope:** all 29 enterprise-function workspaces in the tenant application

## Governing rule

Each of the 29 enterprise functions is a first-class workspace within the tenant application.

A workspace is not an isolated application or independent data silo. It is the function-specific operating surface through which users perform that function's work using shared canonical business objects, platform services, workflows, controls and evidence.

The canonical relationship is:

```text
Tenant application
  -> enterprise function workspace (F01-F29)
     -> L2 sub-functions / work areas
        -> workflows, queues, records, decisions and reporting
           -> shared platform services
              -> canonical data, integrations and analytics
```

## Tenant application shell

The shell is common to every workspace and must remain visually stable as users move between functions.

### Global navigation

The primary shell contains:

- **Home** — tenant-level landing and operating summary;
- **My work** — cross-functional work requiring the current user's attention;
- **Functions** — access to the 29 enterprise-function workspaces;
- **Reports** — authorised cross-functional and function-specific reporting;
- **Administration** — authorised configuration, governance and platform administration;
- **User / tenant identity** — current user, tenant and relevant account controls.

### Function navigation rail

The tenant navigation rail provides:

- Home;
- My work;
- Notifications;
- the 29 function workspaces F01-F29;
- authorised administration destinations.

Function numbering and canonical names come only from the governed function register. Mock-ups and prototypes must never redefine the canonical taxonomy.

## Function workspace header

Every workspace begins with the same identity pattern:

1. **Function identifier** — e.g. `F01`.
2. **Function name** — e.g. `Strategy & Enterprise Planning`.
3. **Purpose statement** — concise description of the business outcome owned by the function.
4. **Workspace icon** — consistent visual identifier from the NuBlox icon system.
5. **Primary object summary** — the canonical business-object types most relevant to the workspace.
6. **Current context** — tenant and any active organisation, programme, project, asset or other governed scope.

The header establishes orientation. It must not become a dashboard of unrelated metrics.

## Sub-function operating map

Directly beneath the workspace identity, the workspace exposes its validated L2 sub-functions or work areas.

Each sub-function has:

- stable identifier, such as `F01.01`;
- concise business-oriented name;
- icon from the shared design system;
- clear relationship to adjacent sub-functions where sequencing matters;
- access to the work surfaces required to perform that sub-function.

A sub-function may expose task surfaces such as:

- overview;
- create / edit;
- work queue;
- reviews;
- approvals;
- active records;
- published or approved records;
- history;
- analysis;
- reports.

The exact actions vary by function. The interaction grammar does not.

## Business process / user journey

Each function workspace must make its principal end-to-end business process understandable.

The process layer shows the meaningful stages by which work moves from trigger to governed outcome. For example:

```text
Develop -> Submit -> Review -> Decision -> Publish -> Monitor
```

This is not a decorative process diagram. Each stage must resolve to executable work, relevant permissions, lifecycle transitions and evidence.

Where a process crosses another function workspace, NuBlox must preserve the user's business context and canonical record identity across the hand-off.

## Shared platform services

The 29 workspaces use one shared platform-services layer. These services underpin the workspaces and must not be reimplemented independently inside functions.

The baseline shared services are:

- **Object registry** — canonical object identities, types and relationships;
- **Lifecycle** — states, transition rules and business invariants;
- **Workflow** — reviews, approvals, tasks, assignments and hand-offs;
- **Permissions** — tenant, organisation, resource, role and authority controls;
- **Version control** — revisions, baselines, published versions and supersession where the object requires versioning;
- **Audit & evidence** — attributable decisions, changes, approvals, history and supporting evidence.

Additional platform services may be introduced only when they are genuinely cross-functional and have a single canonical responsibility.

## Integration, data and intelligence

The workspace consumes governed data through shared integration and intelligence capabilities rather than direct ad-hoc connections.

The baseline categories are:

- **Internal data sources** — canonical NuBlox records from other function workspaces and underlying domains;
- **External data sources** — authorised market, economic, regulatory, customer, supplier or specialist data;
- **Analytics & reporting** — governed dashboards, measures, trends, forecasts and drill-through;
- **APIs & ecosystem** — supported integration contracts with third-party systems.

External terminology or schemas must not replace canonical NuBlox semantics.

## Runtime presentation rule

The workspace anatomy defines the information architecture; it does **not** require every layer to be permanently expanded on one production screen.

NuBlox must preserve the conceptual structure while using progressive disclosure:

- the user's immediate work and exceptions receive visual priority;
- sub-functions remain easy to understand and navigate;
- process context is available when it helps explain state or next action;
- platform plumbing is surfaced when relevant to administration, audit or explanation rather than competing with operational work;
- data/integration details are exposed according to role and task.

This protects the product from the heavy, all-information-at-once screens that V3 is intended to avoid.

## Cross-workspace consistency contract

All 29 workspaces must use the same conventions for:

- workspace header and orientation;
- sub-function presentation;
- status and lifecycle language;
- work queues;
- record lists and detail views;
- forms and validation;
- reviews and approvals;
- comments and collaboration;
- documents and evidence;
- version history;
- audit history;
- reporting and drill-through;
- loading, empty, blocked, denied and error states.

Function-specific business terminology is expected. Function-specific interaction conventions are not.

## Definition of a complete function workspace

A function workspace is not complete because its landing page exists. Completion requires:

1. validated L2 sub-functions;
2. defined canonical business objects and ownership;
3. executable end-to-end workflows;
4. lifecycle/state rules;
5. role and permission rules;
6. approvals and control requirements;
7. evidence and audit behaviour;
8. cross-workspace hand-offs;
9. reporting and measurable outcomes;
10. consistent runtime UX using the shared design system;
11. automated acceptance proof.

The reference workspace pattern supplied during the V3 design discussion is treated as the visual/structural inspiration for this contract. Its draft sidebar labels or numbering are not authoritative; the governed 29-function register remains the sole source of workspace identity.