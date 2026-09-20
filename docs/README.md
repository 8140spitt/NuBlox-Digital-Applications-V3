# NuBlox Construction & The Built Environment — Documentation

This is the front door to the NuBlox documentation.

NuBlox is a **single enterprise-grade software platform for organisations operating in construction and the built environment**. It is intended to let a business operate and deliver its work from one governed environment, while allowing each person to perform the job they are employed to do.

## Read these first

1. [Product Handbook](handbook/README.md) — what NuBlox is and how the complete product works.
2. [Functional Areas F01–F29](handbook/functional-areas/README.md) — the primary business-function model of NuBlox.
3. [User Guide](user-guide/README.md) — how people work in NuBlox.
4. [Administrator Guide](admin-guide/README.md) — tenant, business-configuration, security and operational administration.
5. [Product State](handbook/08-product-state-and-roadmap.md) — what is implemented today versus target product behaviour.
6. [System Architecture](handbook/07-system-architecture.md) — how the software is structured.
7. [Glossary](handbook/09-glossary.md) — canonical language.

## Documentation model

The repository separates documentation by purpose.

### A. Authoritative product documentation

`docs/handbook/`

The handbook describes the product itself: users, work, operating model, delivery model, data, controls, interaction model, administration, integrations and architecture.

When two documents conflict about intended product behaviour, the handbook is the first place to resolve the conflict.

### B. Detailed architecture reference

- `docs/architecture/`
- `docs/data-model/`
- `docs/design-system/`
- `docs/decisions/`
- `docs/business-functions/`

These provide deeper technical and semantic detail behind the handbook.

### C. Product-analysis and traceability evidence

- `docs/evidence/product-analysis/`
- `docs/evidence/benchmarks/`

These folders contain discovery registers, reconciliation waves, market benchmarking, work-product analysis and other evidence that helped establish the product model.

They are **supporting evidence, not the primary description of NuBlox**.

### D. Executable truth

The application source, migrations and automated tests are the implementation truth.

Documentation must never claim a capability is implemented merely because its target design is documented.

## Documentation rule

NuBlox documentation follows four principles:

1. **Describe the product once.** Cross-link rather than repeat.
2. **Separate target product from current implementation state.**
3. **Write for an identified audience.**
4. **Keep evidence, but do not make discovery artefacts the product manual.**

Historical analysis remains available for traceability, but new development should update the handbook when the product meaning changes rather than create another parallel architecture document.
