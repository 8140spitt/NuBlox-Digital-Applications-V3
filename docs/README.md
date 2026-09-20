# NuBlox Construction & The Built Environment — Documentation

This directory contains the **live documentation for the product**.

If you are trying to understand NuBlox, start here and stay here.

## Read in this order

1. [Product Handbook](handbook/README.md) — what NuBlox is and how the business operates in it.
2. [Functional Areas F01–F29](handbook/functional-areas/README.md) — the complete business-function model.
3. [Deliver the Business](handbook/04-deliver-the-business.md) — how the functions work together to win and deliver construction/built-environment work.
4. [User Guide](user-guide/README.md) — how a person uses NuBlox.
5. [Administrator Guide](admin-guide/README.md) — how NuBlox is administered.
6. [Product State & Roadmap](handbook/08-product-state-and-roadmap.md) — target product versus what is implemented today.
7. [System Architecture](handbook/07-system-architecture.md) — the current architectural model.
8. [Architecture Decisions](decisions/) — active ADRs only.

## What belongs in `docs/`

Only documentation that is actively used to understand, operate, administer or build the current product.

```text
docs/
├── README.md
├── handbook/
├── user-guide/
├── admin-guide/
└── decisions/
```

## Historical and supporting material

Discovery registers, old architecture papers, detailed semantic studies, benchmark waves, reconciliation material and superseded design references have been moved to:

`archive/documentation/`

They remain in Git for provenance but are **not part of the normal documentation path**.

## Rule from now on

Do not add a new top-level folder to `docs/` without a clear ongoing audience and ownership.

If a document exists only to explain how we reached a historic decision, it belongs in `archive/`, not in the live product documentation.
