# Canonical Data Model

This directory governs the NuBlox V3 canonical information model.

## Governing artefacts

- `canonical-business-object-discovery.md` — discovery method, modelling rules and the 29 business-object families.
- `canonical-business-object-register.csv` — generated machine-readable candidate-object register.
- `canonical-business-object-duplicates.csv` — exact duplicate-name review queue used to normalize cross-domain concepts.
- `canonical-business-object-summary.md` — generated counts and review sequence.
- `canonical-business-object-normalization-review.md` — first semantic recommendations for duplicate/alias normalization.
- `foundation-canonicalization-baseline.md` — reviewed first-pass decisions for the foundation identity spine.
- `foundation-object-semantics.md` — governed identity, scope, lifecycle, versioning and relationship semantics for the foundation objects.
- `authority-participation-model.md` — governed authentication, membership, role, responsibility and delegated-authority semantics.
- `delivery-context-semantics.md` — governed Portfolio, Programme, Project, stage, WBS, work-package, schedule, baseline, progress and resource-planning semantics.
- `built-environment-spatial-physical-semantics.md` — governed Estate, Network, Site, land/property, facility/building/infrastructure, spatial, system, asset and component semantics.
- `commercial-procurement-semantics.md` — governed Contract, party-role, obligation, commercial/procurement package, change, sourcing, award, purchase-order and receipt semantics.
- `item-product-manufacturing-semantics.md` — governed Item, specification, variant, catalogue, pricing, BOM, manufacturing definition/process, Lot/Batch/Serial and as-manufactured semantics.
- `core-business-object-map.md` — conceptual identity and relationship backbone for stakeholder review.
- `../../scripts/generate-business-object-register.mjs` — reproducible source used to generate the register and summary.
- `../product/stakeholder-design-review-2026-09-17.md` — stakeholder review pack for the object-model baseline.

The generated register is a **discovery baseline**, not yet a physical-schema specification. Candidate objects become canonical only after semantic review, deduplication, relationship modelling, lifecycle/version review and cross-workspace/process coverage validation.

## Principles

- Business meaning is defined before physical schema design.
- Every material business object has one authoritative owner.
- The 29 enterprise functions are tenant workspaces that act on shared objects; they do not own duplicate copies of business truth.
- Shared identifiers do not imply shared write ownership.
- Authentication is not authorization; role is not identity; responsibility is not permission; permission is not delegated authority.
- Role is not identity; state is not an object; workflow work is not domain truth.
- Stable identity is separated from revision/version/iteration, representation/content, lifecycle state and effectivity where applicable.
- Lifecycle state is explicit where business rules depend on it.
- Historical and audit evidence is preserved rather than overwritten when accountability requires it.
- Tenant, organisation, project/programme, contract, property/site, asset and other relevant scopes are explicit.
- WBS/scope, schedule/time, commercial packages, procurement packages, physical assets and controlled information are related structures, not one universal hierarchy.
- Project delivery structure is distinct from permanent built-environment structure; Projects deliver/change Sites, Buildings, Infrastructure, Systems and Assets without owning their whole-life identity.
- Building and linear-infrastructure spatial patterns coexist; NuBlox does not force every sector into one spatial hierarchy.
- Appointment, Subcontract and Framework Agreement are governed Contract types rather than duplicate agreement-master systems.
- Requisition, sourcing, evaluation, Award, commitment and receipt remain separate traceable records; no single mutable procurement record replaces the end-to-end evidence chain.
- Product, material and service are governed Item classifications/behaviours, not separate master-data silos.
- Item definition, Lot/Batch, Serial Identity and installed Asset identity are distinct semantic layers with traceable relationships.
- BOM/product structure is distinct from Project WBS and from permanent Asset/System configuration.
- Manufacturer and supplier identities reuse canonical Party/Organisation records through governed relationships.
- Reference data and classifications are governed separately from transactional records.
- Documents may support evidence but do not replace structured business state.
- Read models, analytics and search indexes are projections of canonical truth.
- Integration payloads adapt to the canonical model rather than redefining it.

## Canonicalization sequence

1. Tenant, party, person, organisation and enterprise identity.
2. Organisation structure, membership, roles and delegated authority.
3. Portfolio, programme, project/job and delivery context.
4. Estate/network, site, land/property, facility/building/infrastructure and spatial context.
5. Contract/appointment/package identity and commercial relationships.
6. Product/material/service and manufactured-product identity.
7. Information-container and controlled-information identity.
8. Physical asset/system/component/maintainable-item identity.
9. Finance/accounting identity and immutable recognition semantics.
10. Shared work, decision, evidence, audit, retention and reference/configuration primitives.
11. Domain transactions, cases, plans and execution records introduced only against the validated identity model.

## Development hold

Broad horizontal application expansion is on hold until the initial object register and core identity/relationship model have been reviewed.

The current F01.01 slice remains a learning prototype. It must not establish platform-wide object, lifecycle, workflow, permissions or versioning patterns by accident.

No physical table, route, screen or API is considered canonical merely because it was implemented first.
