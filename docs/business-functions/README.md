# Business Function Architecture

This directory is the canonical source for NuBlox V3's operating-model coverage.

## Purpose

The V3 business-function model must answer five questions without ambiguity:

1. What does the business need to do?
2. Which native NuBlox capability enables it?
3. Which workflow carries the work from trigger to outcome?
4. Which canonical business objects are created, changed or consumed?
5. Which roles, controls and evidence govern the work?

## Canonical hierarchy

NuBlox uses the following traceability hierarchy:

`Business Function -> Sub-function -> Capability -> Workflow -> Activity -> Business Object / Control / Evidence`

Business functions describe stable organisational responsibilities. Capabilities describe what NuBlox enables. Workflows describe how work actually progresses. These concepts must not be collapsed into a single list.

## Required register fields

The master coverage register will contain, at minimum:

| Field | Purpose |
| --- | --- |
| `function_id` | Stable identifier for one of the 29 business functions |
| `function_name` | Canonical function name |
| `subfunction_id` | Stable sub-function identifier |
| `subfunction_name` | Canonical sub-function name |
| `capability_id` | Native NuBlox capability identifier |
| `capability_name` | User/business-oriented capability name |
| `capability_description` | Clear statement of the outcome enabled |
| `owning_domain` | Domain responsible for the capability's core invariants |
| `primary_workflow` | Main workflow implementing the capability |
| `upstream_dependencies` | Required preceding capabilities/workflows |
| `downstream_dependencies` | Consumers and resulting workflows |
| `canonical_objects` | Core business objects touched by the capability |
| `primary_roles` | Roles expected to perform or own the work |
| `controls` | Approvals, thresholds, segregation or policy constraints |
| `evidence` | Required audit/documentary evidence |
| `experience_surface` | Primary task/workspace where the capability is exposed |
| `implementation_state` | planned / designed / implemented / verified |
| `benchmark_reference` | External benchmark coverage where relevant |
| `acceptance_reference` | Test/specification proving coverage |

## Mapping rules

- All 29 functions must be represented; no function may disappear because several functions share one software capability.
- One native capability may support multiple functions, but each relationship must be recorded explicitly.
- A function may require several capabilities and workflows; one screen is never assumed to equal one function.
- Capability identifiers remain stable even if navigation or component implementation changes.
- Cross-functional workflows must identify one owning domain for each material business object and lifecycle transition.
- External benchmark mappings describe coverage and equivalence; they do not dictate NuBlox's internal architecture.
- Job roles map to responsibilities and permissions after the capability model is validated; job titles do not define software modules.

## Definition of complete coverage

A sub-function is considered covered only when NuBlox has a traceable capability, workflow, canonical data ownership, role/permission model, control/evidence model and usable experience for the relevant business outcome.

A checkbox against a module name is not sufficient evidence of coverage.

## V3 workflow

The existing NuBlox V1/V2 capability registers, benchmark documents and job architecture may be used as reference inputs, but V3 will revalidate their business meaning before adopting them. Legacy software structure is not authoritative for V3 architecture.
