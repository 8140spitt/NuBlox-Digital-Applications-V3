# Business Function & Workspace Architecture

This directory is the canonical source for NuBlox V3's 29 tenant workspaces and their operating-model coverage.

## Governing rule

**Each of the 29 enterprise functions is a canonical workspace within the tenant application.**

A workspace is the primary functional home in which users perform that function's work. It contains the relevant sub-functions, workflows, work queues, records, decisions, controls, evidence and reporting views.

A workspace is **not** an independent application, database, bounded context or data silo. Shared business objects remain canonical, and cross-functional workflows may move through or surface information from several workspaces.

## Workspace specifications

- [`F01 — Strategy & Enterprise Planning`](f01-strategy-enterprise-planning.md) — detailed workspace specification covering its eight L2 work areas, business objects, lifecycle, queues, roles, permissions, controls, evidence and acceptance criteria.
- [`L2/L3 Canonical Object & Action Map`](l2-l3-canonical-object-action-map.md) — governed architecture map for **all 29 workspaces, 353 L2 sub-functions and 1,510 source activities**, including primary aggregate/object ownership and cross-aggregate handoffs.

Detailed per-workspace workflow/UI specifications are implementation deliverables built on top of this completed architecture map; the map does not imply those surfaces already exist.

## Purpose

The V3 function/workspace model must answer six questions without ambiguity:

1. What does this enterprise function need to achieve?
2. Which sub-functions and activities belong in its tenant workspace?
3. Which workflow carries each item of work from trigger to outcome?
4. Which canonical business objects are created, changed or consumed?
5. Which underlying NuBlox capability/domain owns the relevant rules and invariants?
6. Which roles, permissions, controls and evidence govern the work?

## Canonical hierarchy

NuBlox uses the following traceability hierarchy:

`Tenant -> Function Workspace -> Sub-function -> Workflow -> Activity -> Capability / Business Object / Control / Evidence`

The **workspace layer is user-facing**. The capability/domain layer is the underlying architectural ownership model. These two layers are intentionally related but are not the same thing.

A function workspace may compose capabilities owned by several underlying domains. Conversely, one underlying capability may support several function workspaces.

## Required register fields

The master coverage register will contain, at minimum:

| Field | Purpose |
| --- | --- |
| `function_id` | Stable identifier for one of the 29 enterprise functions/workspaces |
| `function_name` | Canonical function and workspace name |
| `workspace_id` | Stable tenant-workspace identifier |
| `workspace_purpose` | User-facing purpose of the functional workspace |
| `subfunction_id` | Stable sub-function identifier |
| `subfunction_name` | Canonical sub-function name |
| `capability_id` | Supporting native NuBlox capability identifier |
| `capability_name` | Business-oriented capability name |
| `owning_domain` | Architectural domain responsible for core invariants |
| `primary_workflow` | Main workflow implementing the sub-function |
| `upstream_dependencies` | Required preceding capabilities/workflows/workspaces |
| `downstream_dependencies` | Consumers and resulting workflows/workspaces |
| `canonical_objects` | Core business objects touched by the workflow |
| `primary_roles` | Roles expected to perform or own the work |
| `permissions` | Required actions and scopes |
| `controls` | Approvals, thresholds, segregation or policy constraints |
| `evidence` | Required audit/documentary evidence |
| `workspace_surface` | Primary view, queue or tool within the function workspace |
| `cross_workspace_surfaces` | Other workspaces in which the same canonical record/workflow may be surfaced |
| `implementation_state` | planned / designed / implemented / verified |
| `benchmark_reference` | External benchmark coverage where relevant |
| `acceptance_reference` | Test/specification proving coverage |

## Workspace rules

- All 29 functions must exist as stable first-class workspaces within every applicable tenant application.
- The function workspace is the primary information-architecture and navigation boundary for functional work.
- Every one of the 353 L2 sub-functions must have one explicit primary function/workspace home.
- A workspace may contain many views, queues, records and workflows; **one screen does not equal one function**.
- Cross-functional workflows must preserve continuity when they move between workspaces.
- Canonical objects are never duplicated merely because two workspaces need to see or act on them.
- A capability may support multiple workspaces, but each relationship must be explicit.
- Workspace IDs and function IDs remain stable even when component implementation or underlying domain boundaries evolve.
- External benchmark mappings describe coverage and equivalence; they do not dictate NuBlox's internal architecture.
- Job roles determine responsibility and access within workspaces; job titles do not define workspace boundaries.

## Relationship to Job-to-Work-Product coverage

Function/workspace coverage proves that the enterprise capability has a governed home. It does **not** by itself prove that a person can perform a job.

V3 therefore evaluates the same work through the separate [Job-to-Work-Product Architecture](../product/job-to-work-product-architecture.md):

```text
Function -> Sub-function -> Activity
                       |
                       v
Functional Role -> Job Profile -> Position -> Person
                       |
                       v
                  Work Product
                       |
                       v
       Authoring experience / canonical object
```

A function may be architecturally complete while one or more Job Profiles still lack the practical work-product authoring capability required to do their jobs. Product completion requires both views to converge.

Career and Job Profile mappings do not create workspace ownership, canonical object identity, permissions or delegated authority.

## Definition of complete workspace coverage

At the **architecture** level, all 353 L2 sub-functions and 1,510 source activities now have a primary workspace home plus canonical aggregate/object/action mapping. At the **runtime implementation** level, a sub-function is considered delivered only when its workspace provides a usable route into the work and NuBlox has traceable workflow behaviour, roles/permissions, controls/evidence and acceptance proof for the relevant business outcome.

A workspace consisting only of a menu entry or dashboard is not coverage.

## V3 workflow

The existing NuBlox V1/V2 taxonomy, capability registers, benchmark documents and job architecture may be used as reference inputs, but V3 will revalidate their business meaning before adopting them. Legacy software structure is not authoritative for V3 architecture.
