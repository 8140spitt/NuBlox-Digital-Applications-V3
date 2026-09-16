# Canonical Data Model

This directory governs the NuBlox V3 canonical information model.

## Governing artefacts

- `canonical-business-object-discovery.md` — discovery method, modelling rules and the 29 business-object families.
- `canonical-business-object-register.csv` — generated machine-readable candidate-object register.
- `canonical-business-object-duplicates.csv` — exact duplicate-name review queue used to normalize cross-domain concepts.
- `canonical-business-object-summary.md` — generated counts and review sequence.
- `../../scripts/generate-business-object-register.mjs` — reproducible source used to generate the register and summary.
- `../product/stakeholder-design-review-2026-09-17.md` — stakeholder review pack for the object-model baseline.

The generated register is a **discovery baseline**, not yet a physical-schema specification. Candidate objects become canonical only after semantic review, deduplication, relationship modelling, lifecycle/version review and cross-workspace/process coverage validation.

## Principles

- Business meaning is defined before physical schema design.
- Every material business object has one authoritative owner.
- The 29 enterprise functions are tenant workspaces that act on shared objects; they do not own duplicate copies of business truth.
- Shared identifiers do not imply shared write ownership.
- Role is not identity; state is not an object; workflow work is not domain truth.
- Stable identity is separated from revision/version/iteration, representation/content, lifecycle state and effectivity where applicable.
- Lifecycle state is explicit where business rules depend on it.
- Historical and audit evidence is preserved rather than overwritten when accountability requires it.
- Tenant, organisation, project/programme, contract, property/site, asset and other relevant scopes are explicit.
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
