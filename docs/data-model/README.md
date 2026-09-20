# Canonical Data Model — Reference Index

> Start with [Enterprise Data, Objects & Information](../handbook/05-enterprise-data-and-information.md).
>
> This directory is a **deep technical/semantic reference**, not the primary NuBlox product description.

## Governing rules

1. One business concept has one canonical meaning.
2. Function workspaces are perspectives over shared objects, not data silos.
3. Stable identity is distinct from revision/version, lifecycle, effectivity and representation.
4. Workflow coordinates work but does not replace domain truth.
5. Documents/evidence do not replace structured business state.
6. Role, responsibility, permission and delegated authority are separate concepts.
7. Historical evidence is retained where accountability requires it.
8. Read models, search and analytics are projections, not competing masters.
9. Integrations adapt external schemas to NuBlox canonical semantics.
10. Physical schema/API implementation may evolve without changing governed business meaning.

## Foundation and cross-cutting semantics

- `core-business-object-map.md`
- `foundation-object-semantics.md`
- `authority-participation-model.md`
- `shared-work-evidence-semantics.md`
- `reference-configuration-semantics.md`
- `controlled-information-semantics.md`

## Business-domain semantics

### Customer, commercial and delivery

- `crm-business-development-semantics.md`
- `estimating-tendering-semantics.md`
- `commercial-procurement-semantics.md`
- `delivery-context-semantics.md`
- `site-field-operations-semantics.md`

### Product, supply, asset and built environment

- `item-product-manufacturing-semantics.md`
- `inventory-logistics-semantics.md`
- `built-environment-spatial-physical-semantics.md`
- `asset-operations-semantics.md`
- `land-development-investment-semantics.md`

### Enterprise control

- `finance-accounting-semantics.md`
- `people-hcm-semantics.md`
- `qhse-assurance-semantics.md`
- `building-safety-regulatory-semantics.md`
- `sustainability-carbon-semantics.md`
- `risk-compliance-audit-semantics.md`
- `legal-privacy-semantics.md`

### Information, technology and transformation

- `knowledge-records-communications-semantics.md`
- `technology-data-cyber-ai-semantics.md`
- `continuity-crisis-security-semantics.md`
- `strategy-governance-performance-semantics.md`
- `transformation-process-improvement-semantics.md`

## Discovery / convergence evidence

The following are retained as architecture evidence:

- `canonical-business-object-register.csv`
- `canonical-business-object-duplicates.csv`
- `canonical-business-object-discovery.md`
- `canonical-business-object-normalization-review.md`
- `canonical-model-convergence-audit.md`
- `canonical-aggregate-boundary-freeze.md`
- `benchmark-driven-canonical-refinements.md`
- `activity-object-action-map.csv`

These files explain how the canonical model was derived. They are not a substitute for the Handbook or for executable implementation.

## Implementation authority

No table, route, page or API becomes canonical merely because it was implemented first.

For current implementation state, see [Product State & Roadmap](../handbook/08-product-state-and-roadmap.md).
