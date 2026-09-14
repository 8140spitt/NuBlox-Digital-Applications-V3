# NuBlox V3 Architecture Principles

These principles govern product, domain, application, data and integration design. Technology choices may evolve; these constraints remain.

## 1. Business architecture drives software architecture

Boundaries are derived from business responsibility, lifecycle ownership and invariants. A route, page, database table or third-party product is never a sufficient reason to create a domain boundary.

## 2. One concept, one canonical meaning

Core concepts such as organisation, project, contract, package, supplier, person, asset, document, cost item, commitment, change, risk, approval and task must have one canonical semantic definition. Different workflows may expose different views, but they must not redefine the underlying concept independently.

## 3. Model lifecycles, not CRUD screens

Important records have explicit states, transition rules, actors and evidence. The platform should model business progression rather than expose unrestricted create/read/update/delete behaviour.

## 4. Workflow crosses functional boundaries

Business functions are accountability lenses, not data silos. The architecture must support information moving through procurement, delivery, commercial, finance, quality, safety, asset and governance workflows without duplication.

## 5. Ownership is explicit

Every material business object has a clear owning domain. Other domains reference or consume it through defined contracts. Shared ownership without rules is prohibited.

## 6. Security is contextual

Authorisation must consider identity, tenant, organisational scope, resource scope, role, permission, delegated authority and relevant record state. User-interface hiding is not an authorisation mechanism.

## 7. Tenant isolation is structural

Tenant context must be enforced consistently at data-access and service boundaries. Cross-tenant access requires explicit platform-level design and cannot emerge accidentally through queries or identifiers.

## 8. Audit is part of the transaction

Material changes, approvals, delegations, overrides and lifecycle transitions must generate durable evidence as part of the business operation, not as an optional logging side effect.

## 9. Documents are evidence, not the data model

Documents may capture contractual or regulatory evidence, but structured business state should remain structured. The system must not require users to infer operational truth from files when the information can be modelled directly.

## 10. Integrations adapt to NuBlox

External systems connect through anti-corruption/adaptor boundaries. Vendor-specific terminology and data shapes must not leak into the canonical domain model unless they represent genuine business semantics.

## 11. Prefer a cohesive system over premature distribution

V3 should begin with strong modular boundaries and simple deployment topology. Distributed services are introduced only when independently justified by scale, availability, security or operational ownership requirements.

## 12. Events describe completed business facts

Domain and integration events use past-tense business language and represent facts that have occurred. Events are not a substitute for transactional invariants or permission checks.

## 13. Read models may differ; truth does not

Dashboards, work queues, reporting views and search indexes may denormalise canonical data for performance and usability. They remain projections and cannot become competing systems of record.

## 14. Configuration has governed limits

Tenants may configure policies, thresholds, terminology, workflows and presentation where variability is a genuine requirement. Configuration must not permit fragmentation of canonical identity, ownership or core business semantics.

## 15. UX follows work, not modules

Navigation and screens are organised around user context, decisions, work queues and end-to-end journeys. Functional taxonomy remains traceable but should not force users to jump between heavy module screens to complete one business task.

## 16. Progressive disclosure is mandatory

The common path must remain visually and cognitively lightweight. Advanced fields, controls, evidence and exceptions are disclosed when relevant to the actor, state and task.

## 17. Automation must remain explainable

Automated decisions and recommendations must expose the inputs, rules, authority and resulting action needed for audit and human oversight.

## 18. Observability is a product requirement

Failures in business workflows, integrations, scheduled processing and security enforcement must be observable and diagnosable without relying on end-user reports.

## 19. Backward compatibility is deliberate

Schema, event and integration changes must have an explicit compatibility strategy once external consumers or persisted production data exist. Silent semantic changes are prohibited.

## 20. Traceability is testable

For every implemented capability, NuBlox must be able to identify its business-function mapping, domain ownership, permission rules, lifecycle, primary user journey and automated tests. Architectural documentation is therefore part of the deliverable, not optional commentary.
