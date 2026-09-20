# NuBlox V3 Architecture Principles

These principles govern product, domain, application, data and integration design. Technology choices may evolve; these constraints remain.

## 1. Business architecture drives software architecture

Boundaries are derived from business responsibility, lifecycle ownership and invariants. A route, page, database table or third-party product is never a sufficient reason to create a domain boundary.

## 2. The 29 enterprise functions define the tenant workspace layer

Each canonical enterprise function is a stable first-class workspace within the tenant application. The workspace layer is the primary user-facing functional information architecture.

The 29 workspaces do not imply 29 independent applications, databases or bounded contexts. They compose shared canonical data, workflows and underlying capabilities while preserving a clear functional home for every sub-function.

## 3. One concept, one canonical meaning

Core concepts such as organisation, project, contract, package, supplier, person, asset, document, cost item, commitment, change, risk, approval and task must have one canonical semantic definition. Different workspaces may expose different views, but they must not redefine the underlying concept independently.

## 4. Model lifecycles, not CRUD screens

Important records have explicit states, transition rules, actors and evidence. The platform should model business progression rather than expose unrestricted create/read/update/delete behaviour.

## 5. Workflow crosses workspace boundaries

Function workspaces are user-facing accountability and navigation contexts, not data silos. The architecture must support information moving through procurement, delivery, commercial, finance, quality, safety, asset and governance workflows without duplication.

A cross-functional workflow may be surfaced in multiple workspaces, but each business object and lifecycle transition must retain one authoritative source of truth.

## 6. Every sub-function has one primary workspace home

Every canonical L2 sub-function must map to exactly one primary function workspace. Supporting capabilities, related records and downstream actions may appear elsewhere when the end-to-end process requires them.

## 7. Ownership is explicit

Every material business object has a clear owning architectural domain or service boundary. Other capabilities and workspaces reference or consume it through defined contracts. Shared ownership without rules is prohibited.

## 8. Security is contextual

Authorisation must consider identity, tenant, organisational scope, resource scope, role, permission, delegated authority and relevant record state. User-interface hiding is not an authorisation mechanism.

Workspace visibility and workspace permissions are related but distinct: a user may be able to enter a workspace while having only a subset of allowed actions and records within it.

## 9. Tenant isolation is structural

Tenant context must be enforced consistently at data-access and service boundaries. Cross-tenant access requires explicit platform-level design and cannot emerge accidentally through queries or identifiers.

## 10. Audit is part of the transaction

Material changes, approvals, delegations, overrides and lifecycle transitions must generate durable evidence as part of the business operation, not as an optional logging side effect.

## 11. Documents are evidence, not the data model

Documents may capture contractual or regulatory evidence, but structured business state should remain structured. The system must not require users to infer operational truth from files when the information can be modelled directly.

## 12. Integrations adapt to NuBlox

External systems connect through anti-corruption/adaptor boundaries. Vendor-specific terminology and data shapes must not leak into the canonical domain model unless they represent genuine business semantics.

## 13. Prefer a cohesive system over premature distribution

V3 should begin with strong modular boundaries and simple deployment topology. Distributed services are introduced only when independently justified by scale, availability, security or operational ownership requirements.

## 14. Events describe completed business facts

Domain and integration events use past-tense business language and represent facts that have occurred. Events are not a substitute for transactional invariants or permission checks.

## 15. Read models may differ; truth does not

Dashboards, workspace summaries, work queues, reporting views and search indexes may denormalise canonical data for performance and usability. They remain projections and cannot become competing systems of record.

## 16. Configuration has governed limits

Tenants may configure policies, thresholds, terminology, workflows and presentation where variability is a genuine requirement. Configuration must not permit fragmentation of canonical identity, ownership, workspace identity or core business semantics.

## 17. UX is function-workspace led and task oriented within each workspace

Primary tenant navigation is organised around the 29 canonical function workspaces. Within each workspace, navigation and screens are organised around the sub-functions, work queues, business objects, decisions and end-to-end journeys users need to perform.

The workspace gives users a stable functional home; the interaction model inside it follows the work. Cross-functional workflows must not force users to re-key data or experience unrelated application silos.

## 18. Progressive disclosure is mandatory

The common path must remain visually and cognitively lightweight. Advanced fields, controls, evidence and exceptions are disclosed when relevant to the actor, state and task.

## 19. Automation must remain explainable

Automated decisions and recommendations must expose the inputs, rules, authority and resulting action needed for audit and human oversight.

## 20. Observability is a product requirement

Failures in business workflows, integrations, scheduled processing and security enforcement must be observable and diagnosable without relying on end-user reports.

## 21. Backward compatibility is deliberate

Schema, event and integration changes must have an explicit compatibility strategy once external consumers or persisted production data exist. Silent semantic changes are prohibited.

## 22. Traceability is testable

For every implemented sub-function, NuBlox must be able to identify its primary function workspace, underlying capability/domain ownership, permission rules, lifecycle, primary user journey, cross-workspace relationships and automated tests. Architectural documentation is therefore part of the deliverable, not optional commentary.
